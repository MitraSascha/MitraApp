"""
KI-Pipeline: Notiz → Angebot

1. Notiz laden
2. Claude: Positionen extrahieren (Suchbegriffe)
3. Artikelstamm-Suche für jeden Begriff
4. Claude: Angebotspositionen mit Artikelvorschlägen zusammenstellen
"""
import json
import psycopg2
import psycopg2.extras
from django.conf import settings
from apps.ki.claude_service import claude_cli
from apps.ki.pii_filter import zensiere_pii


def artikelstamm_suche_einfach(suchbegriff: str, limit: int = 3) -> list[dict]:
    """Direkte Artikelstamm-Suche via psycopg2."""
    try:
        db = settings.DATABASES['artikelstamm']
        conn = psycopg2.connect(
            host=db['HOST'], port=int(db['PORT']),
            dbname=db['NAME'], user=db['USER'], password=db['PASSWORD'],
        )
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                """
                SELECT artnr, bezeichnung, hersteller, einheit,
                       preis_ek, preis_vk
                FROM artikel
                WHERE to_tsvector('german', coalesce(bezeichnung,'') || ' ' || coalesce(artnr,''))
                      @@ plainto_tsquery('german', %s)
                ORDER BY ts_rank(to_tsvector('german', bezeichnung), plainto_tsquery('german', %s)) DESC
                LIMIT %s
                """,
                [suchbegriff, suchbegriff, limit]
            )
            results = [dict(r) for r in cur.fetchall()]
        conn.close()
        return results
    except Exception:
        return []


def angebot_erstelle_aus_notiz(notiz_text: str, notiz_id: str) -> list[dict]:
    """
    Zweistufige KI-Pipeline:
    1. Suchbegriffe aus Notiz extrahieren
    2. Artikel suchen + Positionen erstellen
    """
    import uuid

    notiz_zensiert = zensiere_pii(notiz_text)

    # Schritt 1: Suchbegriffe extrahieren
    prompt_1 = f"""Du bist ein SHK-Experte (Sanitär, Heizung, Klima).
Extrahiere alle benötigten Materialien und Leistungen aus dieser Aufmaß-Notiz als JSON-Liste.

Format:
[{{"suchbegriff": "Kaldewei Duschwanne", "menge": 1, "einheit": "Stk", "foerdermittel": null}}]

foerdermittel: Falls BEG/KfW-Förderung relevant, trage "BEG EM" oder "KfW 261" ein, sonst null.

Notiz:
{notiz_zensiert}

Antworte NUR mit dem JSON-Array."""

    try:
        antwort_1 = claude_cli(prompt_1)
        if '```' in antwort_1:
            start = antwort_1.index('[')
            end = antwort_1.rindex(']') + 1
            antwort_1 = antwort_1[start:end]
        suchbegriffe = json.loads(antwort_1)
    except Exception:
        return []

    # Schritt 2: Artikel suchen
    positionen_mit_artikeln = []
    for pos in suchbegriffe:
        artikel = artikelstamm_suche_einfach(pos.get('suchbegriff', ''))
        positionen_mit_artikeln.append({
            **pos,
            'artikel_vorschlaege': artikel,
        })

    if not positionen_mit_artikeln:
        return []

    # Schritt 3: Angebotspositionen generieren
    prompt_2 = f"""Erstelle Angebotspositionen aus diesen Materialien und Artikelvorschlägen als JSON-Liste.
Falls ein passender Artikel vorhanden ist, nutze dessen Daten. Sonst erstelle eine manuelle Position.

Format:
[{{
  "artnr": "optional",
  "bezeichnung": "...",
  "beschreibung": "optional",
  "menge": 1.0,
  "einheit": "Stk",
  "einzelpreis": 0.0,
  "rabatt_prozent": 0,
  "ist_manuell": false,
  "foerdermittel_hinweis": "optional"
}}]

Einzelpreis: Nutze preis_vk aus Artikelvorschlägen, oder schätze marktüblichen Preis.

Daten:
{json.dumps(positionen_mit_artikeln, ensure_ascii=False)}

Antworte NUR mit dem JSON-Array."""

    try:
        antwort_2 = claude_cli(prompt_2)
        if '```' in antwort_2:
            start = antwort_2.index('[')
            end = antwort_2.rindex(']') + 1
            antwort_2 = antwort_2[start:end]
        positionen_raw = json.loads(antwort_2)
    except Exception:
        return []

    # Positionen normalisieren + Summen berechnen
    positionen = []
    for i, p in enumerate(positionen_raw, start=1):
        menge = float(p.get('menge', 1))
        einzelpreis = float(p.get('einzelpreis', 0))
        rabatt = float(p.get('rabatt_prozent', 0))
        gesamtpreis = round(menge * einzelpreis * (1 - rabatt / 100), 2)
        positionen.append({
            'id': str(uuid.uuid4()),
            'pos_nr': i,
            'artnr': p.get('artnr') or None,
            'bezeichnung': p.get('bezeichnung', ''),
            'beschreibung': p.get('beschreibung') or None,
            'menge': menge,
            'einheit': p.get('einheit', 'Stk'),
            'einzelpreis': einzelpreis,
            'rabatt_prozent': rabatt,
            'gesamtpreis': gesamtpreis,
            'ist_manuell': bool(p.get('ist_manuell', False)),
            'foerdermittel_hinweis': p.get('foerdermittel_hinweis') or None,
        })

    return positionen
