"""
Artikelstamm-Suche via PostgreSQL FTS auf dem Artikelstamm-DB (Port 5433).
"""
import psycopg2
import psycopg2.extras
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


def get_artikelstamm_connection():
    """Direkte psycopg2-Verbindung zur Artikelstamm-DB."""
    db = settings.DATABASES['artikelstamm']
    return psycopg2.connect(
        host=db['HOST'],
        port=int(db['PORT']),
        dbname=db['NAME'],
        user=db['USER'],
        password=db['PASSWORD'],
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def artikel_suche_view(request):
    """
    GET /api/artikel/suche/?q=...&kategorie=...&hersteller=...&limit=20

    Volltext-Suche im Artikelstamm via PostgreSQL FTS.
    """
    q = request.GET.get('q', '').strip()
    kategorie = request.GET.get('kategorie', '')
    hersteller = request.GET.get('hersteller', '')
    try:
        limit = min(int(request.GET.get('limit', 20)), 100)
    except ValueError:
        limit = 20

    if not q:
        return Response({'error': 'q fehlt'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        conn = get_artikelstamm_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Basis-FTS-Abfrage: to_tsvector über Bezeichnung + Artnr + Hersteller
            sql = """
                SELECT
                    id::text, artnr, hersteller_artnr, ean,
                    bezeichnung, beschreibung,
                    hersteller, lieferant, einheit,
                    preis_ek, preis_vk, warengruppe,
                    kategorie, verfuegbar, bild_url,
                    datanorm_version, importiert_am::text
                FROM artikel
                WHERE
                    to_tsvector('german', coalesce(bezeichnung,'') || ' ' || coalesce(artnr,'') || ' ' || coalesce(hersteller,''))
                    @@ plainto_tsquery('german', %s)
            """
            params = [q]

            if kategorie:
                sql += ' AND kategorie = %s'
                params.append(kategorie)

            if hersteller:
                sql += ' AND hersteller = %s'
                params.append(hersteller)

            sql += ' ORDER BY ts_rank(to_tsvector(\'german\', bezeichnung), plainto_tsquery(\'german\', %s)) DESC'
            params.append(q)

            sql += ' LIMIT %s'
            params.append(limit)

            cur.execute(sql, params)
            artikel = [dict(row) for row in cur.fetchall()]

            # Gesamtanzahl (ohne LIMIT)
            count_sql = """
                SELECT COUNT(*) FROM artikel
                WHERE to_tsvector('german', coalesce(bezeichnung,'') || ' ' || coalesce(artnr,'') || ' ' || coalesce(hersteller,''))
                @@ plainto_tsquery('german', %s)
            """
            count_params = [q]
            if kategorie:
                count_sql += ' AND kategorie = %s'
                count_params.append(kategorie)
            if hersteller:
                count_sql += ' AND hersteller = %s'
                count_params.append(hersteller)

            cur.execute(count_sql, count_params)
            total = cur.fetchone()['count']

        conn.close()
        return Response({'artikel': artikel, 'total': total, 'query': q})

    except psycopg2.Error as e:
        return Response(
            {'error': f'Datenbankfehler: {str(e)}', 'artikel': [], 'total': 0, 'query': q},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def artikel_detail_view(request, artnr: str):
    """
    GET /api/artikel/<artnr>/
    """
    try:
        conn = get_artikelstamm_connection()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT id::text, artnr, hersteller_artnr, ean,
                       bezeichnung, beschreibung, hersteller, lieferant,
                       einheit, preis_ek, preis_vk, warengruppe,
                       kategorie, verfuegbar, bild_url,
                       datanorm_version, importiert_am::text
                FROM artikel WHERE artnr = %s LIMIT 1
                """,
                [artnr]
            )
            row = cur.fetchone()
        conn.close()

        if not row:
            return Response({'error': 'Artikel nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)

        return Response(dict(row))

    except psycopg2.Error as e:
        return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
