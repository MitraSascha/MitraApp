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
        limit = min(int(request.GET.get('limit', 20)), 100)
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
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, [q, ilike, q, limit])
            rows = cur.fetchall()
            cur.execute(count_sql, [q, ilike])
            total = cur.fetchone()['count']
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
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, [artnr])
            row = cur.fetchone()
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
        limit = min(int(request.GET.get('limit', 20)), 100)
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
