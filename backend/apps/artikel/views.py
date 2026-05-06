"""
Artikelstamm-Suche (PostgreSQL FTS, Port 5433) + Hero CRM GraphQL Proxy.
"""
import httpx
import psycopg2
import psycopg2.extras
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

HERO_GRAPHQL_URL = 'https://login.hero-software.de/api/external/v7/graphql'


def _artikelstamm_conn():
    db = settings.DATABASES['artikelstamm']
    return psycopg2.connect(
        host=db['HOST'], port=int(db['PORT']),
        dbname=db['NAME'], user=db['USER'], password=db['PASSWORD'],
        connect_timeout=10,
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def artikel_suche_view(request):
    """
    GET /api/artikel/suche/?q=...&limit=20
    Volltext-Suche im Artikelstamm (Datanorm-Schema).
    """
    q = request.GET.get('q', '').strip()
    try:
        limit = max(1, min(int(request.GET.get('limit', 20)), 100))
    except ValueError:
        limit = 20

    if not q:
        return Response({'error': 'q fehlt'}, status=status.HTTP_400_BAD_REQUEST)

    sql = """
        SELECT
            a.artikelnummer,
            a.kurztext1,
            a.kurztext2,
            a.mengeneinheit,
            a.preis_eur,
            a.warengruppe,
            COALESCE(ah.hersteller, '')          AS hersteller,
            COALESCE(ah.hersteller_artikelnummer, '') AS hersteller_artnr,
            COALESCE(ah.ean, '')                 AS ean,
            COALESCE(al.langtext, '')            AS langtext
        FROM artikel a
        LEFT JOIN artikel_hersteller ah ON ah.artikelnummer = a.artikelnummer
        LEFT JOIN artikel_langtext al   ON al.artikelnummer = a.artikelnummer
        WHERE a.aktiv = true
          AND (
              to_tsvector('german',
                  coalesce(a.kurztext1,'') || ' ' ||
                  coalesce(a.kurztext2,'') || ' ' ||
                  coalesce(a.artikelnummer,'')
              ) @@ plainto_tsquery('german', %s)
              OR a.artikelnummer ILIKE %s
          )
        ORDER BY
            ts_rank(
                to_tsvector('german', coalesce(a.kurztext1,'') || ' ' || coalesce(a.kurztext2,'')),
                plainto_tsquery('german', %s)
            ) DESC
        LIMIT %s
    """
    count_sql = """
        SELECT COUNT(*) FROM artikel a
        WHERE a.aktiv = true
          AND (
              to_tsvector('german',
                  coalesce(a.kurztext1,'') || ' ' ||
                  coalesce(a.kurztext2,'') || ' ' ||
                  coalesce(a.artikelnummer,'')
              ) @@ plainto_tsquery('german', %s)
              OR a.artikelnummer ILIKE %s
          )
    """
    ilike = f'%{q}%'
    try:
        conn = _artikelstamm_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, [q, ilike, q, limit])
                rows = cur.fetchall()
                cur.execute(count_sql, [q, ilike])
                total = cur.fetchone()['count']
        finally:
            conn.close()

        artikel = [
            {
                'id': row['artikelnummer'],
                'artnr': row['artikelnummer'],
                'bezeichnung': ' '.join(filter(None, [row['kurztext1'], row['kurztext2']])).strip(),
                'beschreibung': row['langtext'] or '',
                'hersteller': row['hersteller'],
                'einheit': row['mengeneinheit'] or 'Stk',
                'preis_vk': float(row['preis_eur']) if row['preis_eur'] is not None else 0.0,
                'kategorie': row['warengruppe'] or '',
                'typ': 'artikel',
                'quelle': 'artikelstamm',
            }
            for row in rows
        ]
        return Response({'artikel': artikel, 'total': total, 'query': q})

    except psycopg2.Error as e:
        return Response(
            {'error': f'Datenbankfehler: {str(e)}', 'artikel': [], 'total': 0, 'query': q},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def artikel_detail_view(request, artnr: str):
    """
    GET /api/artikel/<artnr>/
    """
    sql = """
        SELECT
            a.artikelnummer, a.kurztext1, a.kurztext2, a.mengeneinheit, a.preis_eur,
            a.warengruppe, a.aktiv,
            COALESCE(ah.hersteller, '') AS hersteller,
            COALESCE(al.langtext, '')   AS langtext
        FROM artikel a
        LEFT JOIN artikel_hersteller ah ON ah.artikelnummer = a.artikelnummer
        LEFT JOIN artikel_langtext al   ON al.artikelnummer = a.artikelnummer
        WHERE a.artikelnummer = %s LIMIT 1
    """
    try:
        conn = _artikelstamm_conn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, [artnr])
                row = cur.fetchone()
        finally:
            conn.close()

        if not row:
            return Response({'error': 'Artikel nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'id': row['artikelnummer'],
            'artnr': row['artikelnummer'],
            'bezeichnung': ' '.join(filter(None, [row['kurztext1'], row['kurztext2']])).strip(),
            'beschreibung': row['langtext'],
            'hersteller': row['hersteller'],
            'einheit': row['mengeneinheit'] or 'Stk',
            'preis_vk': float(row['preis_eur']) if row['preis_eur'] is not None else 0.0,
            'kategorie': row['warengruppe'],
        })
    except psycopg2.Error as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def hero_suche_view(request):
    """
    GET /api/artikel/hero-suche/?q=...&typ=alle|artikel|leistungen&limit=20
    Proxy für Hero CRM GraphQL — Artikel (supply_product_versions) + Leistungen (supply_services).
    """
    q = request.GET.get('q', '').strip()
    typ = request.GET.get('typ', 'alle')
    try:
        limit = max(1, min(int(request.GET.get('limit', 20)), 100))
    except ValueError:
        limit = 20

    if not q:
        return Response({'error': 'q fehlt'}, status=status.HTTP_400_BAD_REQUEST)

    token = settings.HERO_API_TOKEN
    if not token:
        return Response(
            {'error': 'Hero API Token nicht konfiguriert', 'artikel': [], 'total': 0, 'query': q},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    headers = {'Authorization': token, 'Content-Type': 'application/json'}
    ergebnisse = []

    with httpx.Client(timeout=10) as client:

        # ── Artikel (supply_product_versions) ───────────────────────────────
        if typ in ('alle', 'artikel'):
            gql = """
            query($search: String!, $limit: Int!) {
              supply_product_versions(search: $search, first: $limit) {
                nr
                internal_identifier
                base_price
                list_price
                vat_percent
                price_quantity
                base_data {
                  name
                  description
                  manufacturer
                  manufacturer_nr
                  unit_type
                  category
                  ean
                }
              }
            }
            """
            try:
                resp = client.post(
                    HERO_GRAPHQL_URL,
                    json={'query': gql, 'variables': {'search': q, 'limit': limit}},
                    headers=headers,
                )
                data = resp.json()
                nodes = (data.get('data') or {}).get('supply_product_versions') or []
                for node in nodes:
                    bd = node.get('base_data') or {}
                    ergebnisse.append({
                        'id': node.get('internal_identifier') or node.get('nr', ''),
                        'artnr': node.get('nr', ''),
                        'bezeichnung': bd.get('name', ''),
                        'beschreibung': bd.get('description', ''),
                        'hersteller': bd.get('manufacturer', ''),
                        'einheit': bd.get('unit_type', 'Stk'),
                        'preis_vk': node.get('list_price') or node.get('base_price') or 0,
                        'kategorie': bd.get('category', ''),
                        'typ': 'artikel',
                        'quelle': 'hero',
                    })
            except Exception:
                pass

        # ── Leistungen (supply_services) ────────────────────────────────────
        if typ in ('alle', 'leistungen'):
            gql = """
            query($search: String!, $limit: Int!) {
              supply_services(search: $search, first: $limit) {
                id
                nr
                internal_identifier
                name
                description
                unit_type
                net_price_per_unit
                vat_percent
                quantity
              }
            }
            """
            try:
                resp = client.post(
                    HERO_GRAPHQL_URL,
                    json={'query': gql, 'variables': {'search': q, 'limit': limit}},
                    headers=headers,
                )
                data = resp.json()
                nodes = (data.get('data') or {}).get('supply_services') or []
                for node in nodes:
                    ergebnisse.append({
                        'id': node.get('internal_identifier') or node.get('id') or node.get('nr', ''),
                        'artnr': node.get('nr', ''),
                        'bezeichnung': node.get('name', ''),
                        'beschreibung': node.get('description', ''),
                        'hersteller': '',
                        'einheit': node.get('unit_type', 'Std'),
                        'preis_vk': node.get('net_price_per_unit') or 0,
                        'kategorie': 'Leistung',
                        'typ': 'leistung',
                        'quelle': 'hero',
                    })
            except Exception:
                pass

    return Response({'artikel': ergebnisse, 'total': len(ergebnisse), 'query': q})


# ── IDS Connect (Großhändler — Browser-Redirect-Flow) ─────────────────────
#
# IDS Connect ist KEIN direkter API-Call, sondern ein Browser-Flow:
#  1. Frontend öffnet Großhändler-Shop in neuem Tab (mit Login-Daten)
#  2. User sucht & wählt Artikel im Shop
#  3. Shop sendet Warenkorb-XML per POST an unsere Hook-URL
#  4. Hook-URL parst XML, speichert Artikel temporär
#  5. Frontend pollt /ids-warenkorb/ und übernimmt die Artikel
#
import logging
import uuid as _uuid
from xml.etree import ElementTree as ET

_ids_logger = logging.getLogger('apps.artikel.ids')

# Temporärer In-Memory-Speicher für IDS-Warenkörbe (pro User)
# In Produktion reicht das — Warenkörbe werden nach Abruf gelöscht
_ids_warenkoerbe: dict[int, list[dict]] = {}


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ids_shop_url_view(request):
    """
    GET /api/artikel/ids-shop-url/?q=...
    Gibt die URL zurück, die im Browser geöffnet werden soll.
    Der Großhändler-Shop öffnet sich mit Auto-Login + optionalem Suchbegriff.
    """
    q = request.GET.get('q', '').strip()

    ids_url = settings.IDS_CONNECT_URL
    ids_kndnr = settings.IDS_CONNECT_KUNDENNUMMER
    ids_user = settings.IDS_CONNECT_USER
    ids_pw = settings.IDS_CONNECT_PASSWORD

    missing_config = []
    if not ids_url:
        missing_config.append('IDS_CONNECT_URL')
    if not ids_kndnr:
        missing_config.append('IDS_CONNECT_KUNDENNUMMER')
    if not ids_user:
        missing_config.append('IDS_CONNECT_USER')
    if not ids_pw:
        missing_config.append('IDS_CONNECT_PASSWORD')

    if missing_config:
        return Response(
            {'error': f"IDS Connect nicht konfiguriert ({', '.join(missing_config)} fehlt in .env)"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Hook-URL: Wohin der Großhändler den Warenkorb zurücksendet
    # Muss von außen erreichbar sein! (nicht localhost)
    host = request.META.get('HTTP_HOST', 'localhost')
    scheme = 'https' if request.is_secure() else 'http'
    hookurl = f'{scheme}://{host}/api/artikel/ids-hook/{request.user.id}/'

    # IDS Connect Form-Daten — diese werden als POST-Form im Browser gesendet
    params = {
        'kndnr': ids_kndnr,
        'name_kunde': ids_user,
        'pw_kunde': ids_pw,
        'Version': '2.0',
        'action': 'WKE',
        'hookurl': hookurl,
    }
    if q:
        params['searchterm'] = q

    return Response({
        'shop_url': ids_url,
        'params': params,
        'hookurl': hookurl,
    })


@api_view(['POST'])
def ids_hook_view(request, user_id: int):
    """
    POST /api/artikel/ids-hook/<user_id>/
    Callback-Endpoint: Der Großhändler-Shop sendet den Warenkorb hierhin.
    KEIN Auth nötig — wird vom Großhändler-Server aufgerufen.
    """
    content_type = request.content_type or ''
    body = request.body.decode('utf-8', errors='replace')

    _ids_logger.info("IDS Hook empfangen für User %s (%d bytes, %s)", user_id, len(body), content_type)

    # XML aus dem POST-Body oder aus Form-Feld "cart" extrahieren
    xml_data = request.POST.get('cart') or request.POST.get('CART') or body

    if not xml_data or not xml_data.strip():
        _ids_logger.warning("IDS Hook: Leerer Body empfangen")
        return Response({'status': 'empty'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        artikel = _parse_ids_warenkorb(xml_data)
        _ids_warenkoerbe[user_id] = artikel
        _ids_logger.info("IDS Hook: %d Artikel geparst für User %s", len(artikel), user_id)
        # HTML-Antwort für den Großhändler-Shop (wird im Browser-Tab angezeigt)
        html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
        <title>Artikel übernommen</title>
        <style>body{{font-family:sans-serif;display:flex;align-items:center;justify-content:center;
        min-height:100vh;margin:0;background:#0d1117;color:#fff;text-align:center}}
        .ok{{font-size:3rem;margin-bottom:16px}}</style></head>
        <body><div><div class="ok">✓</div>
        <h2>{len(artikel)} Artikel übernommen</h2>
        <p>Du kannst dieses Fenster schließen und zur MitraApp zurückkehren.</p>
        <script>setTimeout(()=>window.close(),3000)</script>
        </div></body></html>"""
        from django.http import HttpResponse
        return HttpResponse(html, content_type='text/html')

    except Exception as e:
        _ids_logger.error("IDS Hook Parse-Fehler: %s", e, exc_info=True)
        return Response({'status': 'error', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ids_warenkorb_view(request):
    """
    GET /api/artikel/ids-warenkorb/
    Frontend pollt diesen Endpoint — liefert die vom Großhändler
    empfangenen Artikel und löscht sie danach.
    """
    user_id = request.user.id
    artikel = _ids_warenkoerbe.pop(user_id, [])
    return Response({'artikel': artikel, 'total': len(artikel)})


def _parse_ids_warenkorb(xml_data: str) -> list[dict]:
    """
    Parst IDS Connect Warenkorb-XML (Version 2.0–2.5).
    Unterstützt verschiedene XML-Formate der Großhändler.
    """
    import re

    root = ET.fromstring(xml_data.strip())

    # Namespace erkennen (falls vorhanden)
    ns = ''
    m = re.match(r'\{(.+?)\}', root.tag)
    if m:
        ns = f'{{{m.group(1)}}}'

    artikel = []

    # Verschiedene XML-Strukturen der Großhändler durchsuchen
    # IDS 2.5: <Item>, <Position>, <Artikel>, <ITEM>
    item_tags = [f'{ns}Item', f'{ns}item', f'{ns}Position', f'{ns}position',
                 f'{ns}Artikel', f'{ns}artikel', f'{ns}ITEM',
                 'Item', 'item', 'Position', 'position', 'Artikel', 'ITEM']

    found_items = []
    for tag in item_tags:
        found_items.extend(root.iter(tag))

    for item in found_items:
        artnr = _find_text(item, [
            'ArticleNo', 'articleno', 'BuyerAID', 'ArtNr', 'artnr',
            'ARTIKELNUMMER', 'artikelnummer', 'GHArtikelNr', 'gh_artikelnr',
        ], ns)
        bezeichnung = _find_text(item, [
            'Description', 'description', 'ShortText', 'shorttext',
            'Bezeichnung', 'bezeichnung', 'KURZTEXT', 'kurztext',
            'Kurztext1', 'kurztext1',
        ], ns)
        einheit = _find_text(item, [
            'OrderUnit', 'orderunit', 'Unit', 'unit',
            'Mengeneinheit', 'mengeneinheit', 'ME',
        ], ns) or 'Stk'
        menge = _find_float(item, [
            'Quantity', 'quantity', 'Menge', 'menge', 'MENGE',
        ], ns, default=1.0)

        preis_ek = _find_float(item, [
            'NetPrice', 'netprice', 'Price', 'price',
            'EKPreis', 'ekpreis', 'Preis', 'preis', 'PREIS',
        ], ns)
        preis_lp = _find_float(item, [
            'ListPrice', 'listprice', 'Listenpreis', 'listenpreis', 'LP',
        ], ns, default=preis_ek)
        hersteller = _find_text(item, [
            'Manufacturer', 'manufacturer', 'Hersteller', 'hersteller',
        ], ns) or ''

        if not artnr and not bezeichnung:
            continue

        artikel.append({
            'id': artnr or str(_uuid.uuid4()),
            'artnr': artnr or '',
            'bezeichnung': bezeichnung or f'Artikel {artnr}',
            'beschreibung': _find_text(item, [
                'LongText', 'longtext', 'Langtext', 'langtext',
            ], ns) or '',
            'hersteller': hersteller,
            'einheit': einheit,
            'menge': menge,
            'preis_vk': preis_ek,
            'preis_lp': preis_lp,
            'kategorie': '',
            'typ': 'artikel',
            'quelle': 'grosshaendler',
        })

    return artikel


def _find_text(element, names: list[str], ns: str) -> str | None:
    """Sucht Text in Subelementen unter verschiedenen möglichen Tag-Namen."""
    for name in names:
        for tag in [f'{ns}{name}', name]:
            el = element.find(tag)
            if el is not None and el.text:
                return el.text.strip()
            # Auch in Attributen suchen
            val = element.get(name) or element.get(name.lower())
            if val:
                return val.strip()
    return None


def _find_float(element, names: list[str], ns: str, default: float = 0.0) -> float:
    """Sucht Float-Wert unter verschiedenen Tag-Namen."""
    text = _find_text(element, names, ns)
    if text:
        try:
            return float(text.replace(',', '.'))
        except ValueError:
            pass
    return default
