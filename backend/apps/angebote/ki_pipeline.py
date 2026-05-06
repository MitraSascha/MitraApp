"""
KI-Pipeline: Notiz -> Angebot (Mehrstufig mit Hybrid Search)

Stufe 1: Strukturierte Extraktion -- LLM liest Notiz -> JSON mit Hersteller, Produkttyp, Masse
Stufe 2: Hybrid Search -- pgvector Cosine + Volltext via Reciprocal Rank Fusion (RRF)
Stufe 3: LLM-Reranking -- Claude bewertet Top-Kandidaten pro Position -> Top-3
Stufe 4: Angebotsgenerierung -- Claude erstellt Positionen nur aus verifizierten Artikeln
"""
import json
import logging
import re
import uuid
import httpx
import psycopg2
import psycopg2.extras
from django.conf import settings
from apps.ki.claude_service import claude_cli
from apps.ki.pii_filter import zensiere_pii

logger = logging.getLogger('angebote.ki_pipeline')

# RRF-Konstante (Standard: 60)
RRF_K = 60


def _db_connect():
    """Erstellt eine Verbindung zur Artikelstamm-DB."""
    db = settings.DATABASES['artikelstamm']
    return psycopg2.connect(
        host=db['HOST'], port=int(db['PORT']),
        dbname=db['NAME'], user=db['USER'], password=db['PASSWORD'],
        connect_timeout=10,
    )


def _row_to_dict(row: dict) -> dict:
    return {
        'artnr': row['artikelnummer'],
        'bezeichnung': ' '.join(filter(None, [row['kurztext1'], row['kurztext2']])).strip(),
        'hersteller': row.get('hersteller', '') or '',
        'hersteller_artnr': row.get('hersteller_artnr', '') or '',
        'einheit': row.get('mengeneinheit') or 'Stk',
        'preis_vk': float(row['preis_eur']) if row.get('preis_eur') is not None else 0.0,
        'warengruppe': row.get('warengruppe') or '',
        'langtext': (row.get('langtext') or '')[:200],
    }


# =====================================================================
# OLLAMA EMBEDDING
# =====================================================================

def _get_embedding(text: str) -> list[float] | None:
    """Holt ein Embedding vom Ollama-Server (nomic-embed-text, 768 Dimensionen)."""
    ollama_url = getattr(settings, 'OLLAMA_URL', 'http://10.0.0.2:11434')
    model = getattr(settings, 'OLLAMA_EMBED_MODEL', 'nomic-embed-text:latest')

    try:
        with httpx.Client(timeout=15.0) as client:
            resp = client.post(
                f"{ollama_url}/api/embed",
                json={'model': model, 'input': text},
            )
            if resp.status_code != 200:
                logger.error('[Embedding] Ollama HTTP %d: %s', resp.status_code, resp.text[:200])
                return None
            data = resp.json()
            embeddings = data.get('embeddings', [])
            if embeddings:
                return embeddings[0]
            return None
    except Exception as e:
        logger.error('[Embedding] Ollama-Fehler: %s', e)
        return None


# =====================================================================
# STUFE 1: Strukturierte Extraktion
# =====================================================================

def _stufe1_strukturierte_extraktion(notiz_zensiert: str, db_beispiele: str) -> list[dict]:
    """
    LLM extrahiert strukturierte Positionen aus der Notiz.
    Jede Position bekommt: produkttyp, hersteller, serie_modell, dimensionen, material, menge.
    """
    beispiel_block = ''
    if db_beispiele:
        beispiel_block = f"""

SO SEHEN ECHTE ARTIKEL IN DER DATENBANK AUS (Artikelnummer | Bezeichnung | Hersteller):
{db_beispiele}

Passe deine Suchbegriffe an diese Bezeichnungen an! Suche mit Woertern die in den Bezeichnungen vorkommen."""

    prompt = f"""Du bist ein SHK-Experte (Sanitaer, Heizung, Klima).
Analysiere diese Aufmass-Notiz und extrahiere ALLE benoetigten Materialien als strukturiertes JSON.

WICHTIG -- Strukturierte Felder:
- "produkttyp": Das Kernprodukt in 1-2 Woertern wie es im Katalog steht (z.B. "Duschwanne", "Unterputz-Armatur", "Eckventil", "WC-Element")
- "hersteller": Exakter Herstellername falls genannt (z.B. "Kaldewei", "Grohe", "Geberit"), sonst null
- "serie_modell": Serie/Modell falls genannt (z.B. "Superplan", "Eurosmart", "Steelseries"), sonst null
- "dimensionen": Masse/Groessen (z.B. "120x90", "DN 22", "1/2 Zoll"), sonst null
- "material_oberflaeche": Material/Farbe/Oberflaeche (z.B. "Kupfer", "alpinweiss", "gebürstet"), sonst null
- "such_text": NATUERLICHSPRACHLICHE Beschreibung fuer Vektorsuche (z.B. "Kaldewei Duschwanne Superplan 120x90 alpinweiss")
- "suchbegriff": KURZER Suchbegriff fuer Volltext-DB (1-3 Woerter, KEINE Masse/Farben)
- "menge": Anzahl (Zahl)
- "einheit": "Stk", "m", "Set" etc.

REGELN:
- Erkenne Hersteller auch bei Tippfehlern: "Daldewei"->"Kaldewei", "Groeh"->"Grohe"
- Erkenne Abkuerzungen: "V&B"->"Villeroy & Boch", "Gebe"->"Geberit"
- Der "suchbegriff" soll NUR den Produkttyp enthalten, KEINE Masse oder Farben
- "such_text" soll ALLES enthalten: Hersteller, Typ, Serie, Masse, Oberflaeche — wie eine natuerliche Suche
{beispiel_block}

Format (NUR JSON-Array):
[{{
  "produkttyp": "Duschwanne",
  "hersteller": "Kaldewei",
  "serie_modell": "Superplan",
  "dimensionen": "120x90x2.5",
  "material_oberflaeche": "alpinweiss",
  "such_text": "Kaldewei Duschwanne Stahl Superplan 120x90x2.5cm alpinweiss",
  "suchbegriff": "Kaldewei Duschwanne Superplan",
  "menge": 1,
  "einheit": "Stk"
}}]

Notiz:
{notiz_zensiert}

Antworte NUR mit dem JSON-Array."""

    antwort = claude_cli(prompt)
    logger.info('[Stufe 1] Claude-Antwort: %s', antwort[:500])
    positionen = _parse_json_array(antwort)
    logger.info('[Stufe 1] %d Positionen extrahiert: %s',
                len(positionen),
                [f"{p.get('hersteller', '?')}/{p.get('produkttyp')}" for p in positionen])
    return positionen


# =====================================================================
# STUFE 2: Hybrid Search (pgvector + Volltext + RRF)
# =====================================================================

_SQL_VEKTOR_SUCHE = """
    SELECT
        a.artikelnummer,
        a.kurztext1,
        a.kurztext2,
        a.mengeneinheit,
        a.preis_eur,
        a.warengruppe,
        COALESCE(ah.hersteller, '')              AS hersteller,
        COALESCE(ah.hersteller_artikelnummer, '') AS hersteller_artnr,
        COALESCE(al.langtext, '')                AS langtext,
        1 - (a.embedding <=> %(embedding)s::vector) AS similarity
    FROM artikel a
    LEFT JOIN artikel_hersteller ah ON ah.artikelnummer = a.artikelnummer
    LEFT JOIN artikel_langtext al   ON al.artikelnummer = a.artikelnummer
    WHERE a.aktiv = true
      AND a.embedding IS NOT NULL
      {hersteller_filter}
    ORDER BY a.embedding <=> %(embedding)s::vector
    LIMIT %(limit)s
"""

_SQL_VOLLTEXT_SUCHE = """
    SELECT
        a.artikelnummer,
        a.kurztext1,
        a.kurztext2,
        a.mengeneinheit,
        a.preis_eur,
        a.warengruppe,
        COALESCE(ah.hersteller, '')              AS hersteller,
        COALESCE(ah.hersteller_artikelnummer, '') AS hersteller_artnr,
        COALESCE(al.langtext, '')                AS langtext,
        ts_rank(
            to_tsvector('german', coalesce(a.kurztext1,'') || ' ' || coalesce(a.kurztext2,'')),
            plainto_tsquery('german', %(query)s)
        ) AS rank_score
    FROM artikel a
    LEFT JOIN artikel_hersteller ah ON ah.artikelnummer = a.artikelnummer
    LEFT JOIN artikel_langtext al   ON al.artikelnummer = a.artikelnummer
    WHERE a.aktiv = true
      AND to_tsvector('german',
          coalesce(a.kurztext1,'') || ' ' ||
          coalesce(a.kurztext2,'') || ' ' ||
          coalesce(a.artikelnummer,'')
      ) @@ plainto_tsquery('german', %(query)s)
      {hersteller_filter}
    ORDER BY rank_score DESC
    LIMIT %(limit)s
"""

_SQL_ARTNR_EXACT = """
    SELECT
        a.artikelnummer,
        a.kurztext1,
        a.kurztext2,
        a.mengeneinheit,
        a.preis_eur,
        a.warengruppe,
        COALESCE(ah.hersteller, '')              AS hersteller,
        COALESCE(ah.hersteller_artikelnummer, '') AS hersteller_artnr,
        COALESCE(al.langtext, '')                AS langtext
    FROM artikel a
    LEFT JOIN artikel_hersteller ah ON ah.artikelnummer = a.artikelnummer
    LEFT JOIN artikel_langtext al   ON al.artikelnummer = a.artikelnummer
    WHERE a.aktiv = true
      AND (a.artikelnummer ILIKE %(artnr)s OR ah.hersteller_artikelnummer ILIKE %(artnr)s)
    LIMIT 5
"""


def _normalisiere_hersteller(hersteller_input: str) -> str | None:
    """Normalisiert Herstellernamen fuer DB-Suche (DB speichert uppercase ohne Leerzeichen)."""
    if not hersteller_input:
        return None
    mappings = {
        'villeroy & boch': 'VILLEROYBOCH', 'villeroy': 'VILLEROYBOCH',
        'v&b': 'VILLEROYBOCH',
        'grohe': 'GROHE', 'hansgrohe': 'HANSGROHE',
        'kaldewei': 'KALDEWEI', 'geberit': 'GEBERIT',
        'viega': 'VIEGA', 'vigour': 'VIGOUR',
        'duravit': 'DURAVIT', 'ideal standard': 'IDEALSTANDARD',
        'kermi': 'KERMI', 'buderus': 'BUDERUS',
        'viessmann': 'VIESSMANN', 'vaillant': 'VAILLANT',
        'wolf': 'WOLF', 'junkers': 'JUNKERS',
        'stiebel eltron': 'STIEBELELTRON', 'stiebel': 'STIEBELELTRON',
        'oventrop': 'OVENTROP', 'danfoss': 'DANFOSS',
        'wilo': 'WILO', 'grundfos': 'GRUNDFOS',
        'zehnder': 'ZEHNDER', 'arbonia': 'ARBONIA',
        'dallmer': 'DALLMER', 'tece': 'TECE',
        'hsk': 'HSK', 'keuco': 'KEUCO', 'emco': 'EMCO',
        'bette': 'BETTE', 'laufen': 'LAUFEN',
        'roca': 'ROCA', 'kludi': 'KLUDI',
        'hansa': 'HANSA', 'schell': 'SCHELL',
        'kemper': 'KEMPER', 'dornbracht': 'DORNBRACHT',
        'uponor': 'UPONOR', 'rehau': 'REHAU',
        'purmo': 'PURMO', 'cosmo': 'COSMO',
        'sanswiss': 'SANSWISS', 'schulte': 'SCHULTE',
        'burgbad': 'BURGBAD', 'pelipal': 'PELIPAL',
        'hewi': 'HEWI', 'franke': 'FRANKE', 'blanco': 'BLANCO',
        'siemens': 'SIEMENS', 'bosch': 'BOSCH',
        'miele': 'MIELE', 'neff': 'NEFF',
    }
    key = hersteller_input.lower().strip()
    if key in mappings:
        return mappings[key]
    return re.sub(r'[^A-Z0-9]', '', hersteller_input.upper())


def _reciprocal_rank_fusion(ranglisten: list[list[dict]], k: int = RRF_K) -> list[dict]:
    """
    Reciprocal Rank Fusion (RRF) kombiniert mehrere Ranglisten.
    Score = sum( 1 / (k + rank_i) ) fuer jeden Artikel ueber alle Listen.
    """
    scores: dict[str, float] = {}
    artikel_map: dict[str, dict] = {}

    for rangliste in ranglisten:
        for rank, artikel in enumerate(rangliste):
            artnr = artikel['artikelnummer']
            scores[artnr] = scores.get(artnr, 0.0) + 1.0 / (k + rank + 1)
            if artnr not in artikel_map:
                artikel_map[artnr] = artikel

    # Nach RRF-Score sortieren
    sortiert = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    ergebnis = []
    for artnr, score in sortiert:
        row = artikel_map[artnr]
        row['rrf_score'] = score
        ergebnis.append(row)
    return ergebnis


def _stufe2_hybrid_search(positionen: list[dict], conn) -> list[dict]:
    """
    Hybrid Search: pgvector Cosine-Similarity + PostgreSQL Volltext.
    Ergebnisse werden per Reciprocal Rank Fusion (RRF) kombiniert.
    """
    ergebnisse = []

    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        for pos in positionen:
            such_text = pos.get('such_text', '')
            suchbegriff = pos.get('suchbegriff', pos.get('produkttyp', ''))
            hersteller = pos.get('hersteller')
            dimensionen = pos.get('dimensionen', '')

            hersteller_db = _normalisiere_hersteller(hersteller) if hersteller else None
            hf = "AND ah.hersteller = %(hersteller)s" if hersteller_db else ""
            params_base = {'limit': 30}
            if hersteller_db:
                params_base['hersteller'] = hersteller_db

            ranglisten = []

            # --- Kanal 1: Vektor-Suche (semantisch) ---
            embedding = _get_embedding(such_text or suchbegriff)
            if embedding:
                sql_vec = _SQL_VEKTOR_SUCHE.format(hersteller_filter=hf)
                try:
                    cur.execute(sql_vec, {**params_base, 'embedding': str(embedding)})
                    vektor_treffer = cur.fetchall()
                    if vektor_treffer:
                        ranglisten.append(vektor_treffer)
                        logger.info('[Stufe 2] Vektor "%s" -> %d Treffer (top sim: %.3f)',
                                    such_text[:40], len(vektor_treffer),
                                    float(vektor_treffer[0].get('similarity', 0)))
                except Exception as e:
                    logger.warning('[Stufe 2] Vektor-Suche Fehler: %s', e)

                # Vektor-Suche OHNE Hersteller-Filter (breiter)
                if hersteller_db:
                    sql_vec_breit = _SQL_VEKTOR_SUCHE.format(hersteller_filter='')
                    try:
                        cur.execute(sql_vec_breit, {'limit': 20, 'embedding': str(embedding)})
                        vektor_breit = cur.fetchall()
                        if vektor_breit:
                            ranglisten.append(vektor_breit)
                    except Exception as e:
                        logger.warning('[Stufe 2] Breite Vektor-Suche Fehler: %s', e)
            else:
                logger.warning('[Stufe 2] Kein Embedding erhalten -- nur Volltext')

            # --- Kanal 2: Volltext-Suche (exakt/keyword) ---
            suchvarianten = [suchbegriff]
            produkttyp = pos.get('produkttyp', '')
            if produkttyp and produkttyp != suchbegriff:
                suchvarianten.append(produkttyp)
            serie = pos.get('serie_modell', '')
            if serie and produkttyp:
                suchvarianten.insert(0, f"{produkttyp} {serie}")

            for variante in suchvarianten:
                sql_ft = _SQL_VOLLTEXT_SUCHE.format(hersteller_filter=hf)
                try:
                    cur.execute(sql_ft, {**params_base, 'query': variante})
                    ft_treffer = cur.fetchall()
                    if ft_treffer:
                        ranglisten.append(ft_treffer)
                        logger.info('[Stufe 2] Volltext "%s" -> %d Treffer',
                                    variante[:40], len(ft_treffer))
                except Exception as e:
                    logger.warning('[Stufe 2] Volltext-Suche "%s" Fehler: %s', variante, e)

            # Volltext OHNE Hersteller-Filter
            if hersteller_db and len(ranglisten) < 2:
                sql_ft_breit = _SQL_VOLLTEXT_SUCHE.format(hersteller_filter='')
                cur.execute(sql_ft_breit, {'limit': 20, 'query': suchbegriff})
                ft_breit = cur.fetchall()
                if ft_breit:
                    ranglisten.append(ft_breit)

            # Fallback-Varianten wenn wenig Treffer
            if not ranglisten:
                for variante in _vereinfache_suchbegriff(suchbegriff):
                    sql_fb = _SQL_VOLLTEXT_SUCHE.format(hersteller_filter='')
                    cur.execute(sql_fb, {'limit': 15, 'query': variante})
                    fb_treffer = cur.fetchall()
                    if fb_treffer:
                        ranglisten.append(fb_treffer)
                        break

            # --- RRF: Ranglisten kombinieren ---
            if ranglisten:
                fusioniert = _reciprocal_rank_fusion(ranglisten)
            else:
                fusioniert = []

            # Dimensionen-Boost (nachtraeglich)
            if dimensionen and fusioniert:
                dim_parts = re.findall(r'\d+', dimensionen)
                for k_art in fusioniert:
                    text = f"{k_art.get('kurztext1', '')} {k_art.get('kurztext2', '')}".lower()
                    matches = sum(1 for d in dim_parts if d in text)
                    dim_boost = matches / max(len(dim_parts), 1) * 0.02
                    k_art['rrf_score'] = k_art.get('rrf_score', 0) + dim_boost
                fusioniert.sort(key=lambda x: x.get('rrf_score', 0), reverse=True)

            # Top-20 behalten
            top = fusioniert[:20]
            treffer = [_row_to_dict(r) for r in top]

            # Similarity/RRF-Score mitspeichern
            for i, r in enumerate(top):
                treffer[i]['score'] = round(r.get('rrf_score', 0), 4)
                if 'similarity' in r:
                    treffer[i]['vec_similarity'] = round(float(r['similarity']), 4)

            logger.info('[Stufe 2] "%s" (Hersteller: %s) -> %d Kandidaten via %d Kanaele (RRF)',
                        suchbegriff, hersteller or '-', len(treffer), len(ranglisten))
            if treffer:
                _log_treffer(treffer[:5])

            ergebnisse.append({
                'produkttyp': pos.get('produkttyp', ''),
                'hersteller': hersteller,
                'serie_modell': serie,
                'dimensionen': dimensionen,
                'material_oberflaeche': pos.get('material_oberflaeche', ''),
                'suchbegriff': suchbegriff,
                'such_text': such_text,
                'menge': pos.get('menge', 1),
                'einheit': pos.get('einheit', 'Stk'),
                'kandidaten': treffer,
            })

    return ergebnisse


# =====================================================================
# STUFE 3: LLM-Reranking
# =====================================================================

def _stufe3_reranking(positionen_mit_kandidaten: list[dict], notiz_zensiert: str) -> list[dict]:
    """
    Claude bewertet die Kandidaten pro Position und waehlt den besten Artikel.
    Reduziert 20 Kandidaten auf Top-1 (mit Alternativen).
    """
    zum_reranken = []
    ohne_kandidaten = []
    for pos in positionen_mit_kandidaten:
        if pos['kandidaten']:
            zum_reranken.append(pos)
        else:
            ohne_kandidaten.append(pos)

    if not zum_reranken:
        logger.warning('[Stufe 3] Keine Kandidaten zum Reranken')
        return positionen_mit_kandidaten

    rerank_daten = []
    for i, pos in enumerate(zum_reranken):
        kandidaten_kurz = []
        for j, k in enumerate(pos['kandidaten']):
            eintrag = {
                'idx': j,
                'artnr': k['artnr'],
                'bezeichnung': k['bezeichnung'],
                'hersteller': k['hersteller'],
                'preis': k['preis_vk'],
                'einheit': k['einheit'],
            }
            if k.get('score'):
                eintrag['score'] = k['score']
            kandidaten_kurz.append(eintrag)
        rerank_daten.append({
            'pos': i,
            'gesucht': {
                'produkttyp': pos['produkttyp'],
                'hersteller': pos['hersteller'],
                'serie_modell': pos['serie_modell'],
                'dimensionen': pos['dimensionen'],
                'material_oberflaeche': pos['material_oberflaeche'],
            },
            'kandidaten': kandidaten_kurz,
        })

    prompt = f"""Du bist ein SHK-Artikelexperte. Deine Aufgabe: Waehle fuer jede Position den BESTEN Artikel aus den Kandidaten.

ORIGINAL-NOTIZ DES HANDWERKERS:
{notiz_zensiert}

POSITIONEN MIT KANDIDATEN:
{json.dumps(rerank_daten, ensure_ascii=False, indent=2)}

REGELN:
1. Waehle den Artikel der am GENAUESTEN zur Beschreibung passt (Hersteller, Serie, Masse, Oberflaeche).
2. Wenn KEIN Kandidat gut passt (falsche Kategorie, falscher Hersteller, falsche Masse), setze "kein_passender": true.
3. Achte auf Masse im Bezeichnungstext: "120x90" muss zu den gesuchten Dimensionen passen.
4. Achte auf Serie/Modell: "Superplan" ist nicht "Cayonoplan", "Eurosmart" ist nicht "Essence".
5. Bevorzuge Artikel MIT Preis (preis > 0) gegenueber preislosen.
6. Der "score" zeigt die Such-Relevanz — hoeher ist besser, aber INHALT geht vor Score.

Format (NUR JSON-Array):
[{{
  "pos": 0,
  "bester_idx": 2,
  "begruendung": "Kaldewei Superplan 120x90, passt exakt zu Massen und Serie",
  "kein_passender": false
}}]

Antworte NUR mit dem JSON-Array."""

    try:
        antwort = claude_cli(prompt)
        logger.info('[Stufe 3] Reranking-Antwort: %s', antwort[:500])
        bewertungen = _parse_json_array(antwort)
    except Exception as e:
        logger.error('[Stufe 3] Reranking FEHLER: %s -- verwende Score-Fallback', e)
        bewertungen = []

    bewertung_map = {b['pos']: b for b in bewertungen}
    reranked = []

    for i, pos in enumerate(zum_reranken):
        bewertung = bewertung_map.get(i, {})
        if bewertung.get('kein_passender', False):
            logger.info('[Stufe 3] Position %d "%s": KEIN passender Kandidat -> manuell',
                        i, pos['produkttyp'])
            pos['bester_artikel'] = None
            pos['rerank_begruendung'] = bewertung.get('begruendung', 'Kein passender Kandidat')
        else:
            idx = bewertung.get('bester_idx', 0)
            if 0 <= idx < len(pos['kandidaten']):
                pos['bester_artikel'] = pos['kandidaten'][idx]
                pos['rerank_begruendung'] = bewertung.get('begruendung', '')
                logger.info('[Stufe 3] Position %d "%s": -> %s | %s (%s)',
                            i, pos['produkttyp'],
                            pos['bester_artikel']['artnr'],
                            pos['bester_artikel']['bezeichnung'][:50],
                            pos['rerank_begruendung'][:60])
            else:
                pos['bester_artikel'] = pos['kandidaten'][0] if pos['kandidaten'] else None
                logger.warning('[Stufe 3] Position %d: idx %d ungueltig, Fallback idx 0', i, idx)

        reranked.append(pos)

    for pos in ohne_kandidaten:
        pos['bester_artikel'] = None
        pos['rerank_begruendung'] = 'Keine Kandidaten in DB gefunden'
        reranked.append(pos)

    return reranked


# =====================================================================
# STUFE 4: Angebotsgenerierung
# =====================================================================

def _stufe4_angebot(reranked_positionen: list[dict], notiz_zensiert: str,
                    referenz_angebote: list[dict]) -> list[dict]:
    """
    Erstellt finale Angebotspositionen aus den verifizierten Artikeln.
    """
    finale_daten = []
    for pos in reranked_positionen:
        eintrag = {
            'produkttyp': pos['produkttyp'],
            'hersteller': pos.get('hersteller'),
            'serie_modell': pos.get('serie_modell'),
            'dimensionen': pos.get('dimensionen'),
            'material_oberflaeche': pos.get('material_oberflaeche'),
            'menge': pos.get('menge', 1),
            'einheit': pos.get('einheit', 'Stk'),
        }
        if pos.get('bester_artikel'):
            eintrag['artikel'] = pos['bester_artikel']
            eintrag['rerank_begruendung'] = pos.get('rerank_begruendung', '')
        else:
            eintrag['manuell'] = True
            eintrag['grund'] = pos.get('rerank_begruendung', 'Kein Artikel gefunden')
        finale_daten.append(eintrag)

    referenz_block = ''
    if referenz_angebote:
        referenz_block = f"""

REFERENZ-ANGEBOTE (orientiere dich an Struktur und Textbausteinen):
{json.dumps(referenz_angebote, ensure_ascii=False, indent=2)}
"""

    prompt = f"""Du erstellst Angebotspositionen fuer ein SHK-Angebot.
Jede Position hat entweder einen verifizierten Artikel aus dem Artikelstamm oder ist als manuell markiert.

ORIGINAL-NOTIZ DES HANDWERKERS:
{notiz_zensiert}
{referenz_block}
ZWINGENDE REGELN:
1. Bei Positionen MIT "artikel": Uebernimm 1:1 artnr, bezeichnung, hersteller, preis_vk als einzelpreis, einheit.
2. Der "einzelpreis" MUSS EXAKT der "preis_vk" des Artikels sein. KEIN eigener Preis!
3. Bei Positionen MIT "manuell": true -> setze "ist_manuell": true, "artnr": "", "einzelpreis": 0.
4. Erfinde NIEMALS Artikelnummern oder Preise.
5. Nutze "beschreibung" fuer Details aus der Notiz (Serie, Masse, Oberflaeche).

Format (NUR JSON-Array):
[{{
  "artnr": "EXAKT die artnr aus artikel oder leer bei manuell",
  "bezeichnung": "EXAKT die bezeichnung aus artikel oder Beschreibung bei manuell",
  "hersteller": "EXAKT der hersteller aus artikel oder aus Notiz bei manuell",
  "beschreibung": "Details: Serie, Masse, Oberflaeche aus der Original-Notiz",
  "menge": 1.0,
  "einheit": "EXAKT die einheit aus artikel",
  "einzelpreis": 0.00,
  "rabatt_prozent": 0,
  "ist_manuell": false,
  "foerdermittel_hinweis": "optional"
}}]

VERIFIZIERTE POSITIONEN:
{json.dumps(finale_daten, ensure_ascii=False, indent=2)}

Antworte NUR mit dem JSON-Array."""

    antwort = claude_cli(prompt)
    logger.info('[Stufe 4] Claude-Antwort: %s', antwort[:1000])
    return _parse_json_array(antwort)


# =====================================================================
# Hilfsfunktionen
# =====================================================================

def _vereinfache_suchbegriff(begriff: str) -> list[str]:
    """Erzeugt vereinfachte Suchvarianten."""
    varianten = []
    ohne_masze = re.sub(r'[\d]+[x\xd7][\d]+(?:[x\xd7][\d]+)?', '', begriff).strip()
    if ohne_masze and ohne_masze != begriff:
        varianten.append(ohne_masze)

    ignorieren = {'silber', 'gold', 'schwarz', 'weiss', 'matt', 'chrom',
                  'poliert', 'rund', 'eckig', 'lang', 'kurz'}
    woerter = [w for w in begriff.split()
               if len(w) > 3 and w.lower() not in ignorieren and not re.match(r'^\d+', w)]

    if len(woerter) >= 2:
        varianten.append(' '.join(woerter[:2]))
    if woerter:
        varianten.append(woerter[0])

    seen = {begriff.lower()}
    result = []
    for v in varianten:
        if v.lower() not in seen and v.strip():
            seen.add(v.lower())
            result.append(v)
    return result


def _log_treffer(ergebnisse: list[dict]) -> None:
    for e in ergebnisse[:3]:
        score_info = f" | score={e.get('score', '?')}"
        logger.info('    %s | %s | %s | EUR%.2f%s',
                     e['artnr'], e['bezeichnung'][:50], e['hersteller'], e['preis_vk'], score_info)


def hole_db_beispiele(kategorien: list[str] | None = None, pro_kategorie: int = 3) -> str:
    """Holt echte Beispiel-Artikel aus der DB als Referenz fuer Stufe 1."""
    if not kategorien:
        kategorien = ['Duschwanne', 'Armatur', 'WC', 'Siphon', 'Eckventil',
                      'Badewanne', 'Waschtisch', 'Thermostat', 'Ventil']
    try:
        conn = _db_connect()
        try:
            zeilen = []
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                for kat in kategorien:
                    cur.execute(
                        """
                        SELECT a.artikelnummer, a.kurztext1,
                               COALESCE(ah.hersteller, '') AS hersteller
                        FROM artikel a
                        LEFT JOIN artikel_hersteller ah ON ah.artikelnummer = a.artikelnummer
                        WHERE a.aktiv = true
                          AND to_tsvector('german', coalesce(a.kurztext1,''))
                              @@ plainto_tsquery('german', %s)
                        ORDER BY RANDOM()
                        LIMIT %s
                        """,
                        [kat, pro_kategorie]
                    )
                    for row in cur.fetchall():
                        zeilen.append(
                            f"  {row['artikelnummer']} | {row['kurztext1']} | {row['hersteller']}"
                        )
            return '\n'.join(zeilen) if zeilen else ''
        finally:
            conn.close()
    except Exception as e:
        logger.warning('[DB-Beispiele] Fehler: %s', e)
        return ''


def ragflow_beispielangebote(notiz_text: str, top_k: int = 3) -> list[dict]:
    """Sucht aehnliche Beispielangebote via RAGflow Chat-Completions API."""
    chat_id = getattr(settings, 'RAGFLOW_ANGEBOTE_CHAT_ID', '')
    api_key = getattr(settings, 'RAGFLOW_API_KEY', '')
    base_url = getattr(settings, 'RAGFLOW_URL', '')

    if not all([chat_id, api_key, base_url]):
        logger.info('[RAGflow] Uebersprungen -- nicht konfiguriert')
        return []

    url = f"{base_url}/api/v1/chats/{chat_id}/completions"
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }
    body = {
        'question': (
            f"Finde Beispielangebote die zu dieser Aufmass-Notiz passen. "
            f"Zeige die Positionsstruktur, Preise und Textbausteine:\n\n{notiz_text}"
        ),
        'stream': False,
    }

    try:
        logger.info('[RAGflow] Suche Beispielangebote...')
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(url, json=body, headers=headers)
            if resp.status_code != 200:
                logger.error('[RAGflow] HTTP %d: %s', resp.status_code, resp.text[:200])
                return []
            data = resp.json()

        result_data = data.get('data', {})
        if not isinstance(result_data, dict):
            logger.warning('[RAGflow] Unerwartetes Antwort-Format')
            return []

        referenzen = []
        answer = result_data.get('answer', '')
        if answer:
            referenzen.append({'typ': 'antwort', 'inhalt': answer[:2000]})

        chunks = (result_data.get('reference', {}) or {}).get('chunks', [])
        for chunk in chunks[:top_k]:
            referenzen.append({
                'typ': 'beispiel',
                'dokument': chunk.get('document_name', ''),
                'inhalt': chunk.get('content', '')[:1000],
                'score': round(float(chunk.get('similarity', 0)), 2),
            })

        logger.info('[RAGflow] %d Referenzen gefunden', len(referenzen))
        return referenzen
    except Exception as e:
        logger.error('[RAGflow] FEHLER: %s', e)
        return []


# =====================================================================
# HAUPTFUNKTION
# =====================================================================

def angebot_erstelle_aus_notiz(notiz_text: str, notiz_id: str) -> list[dict]:
    """
    Vierstufige KI-Pipeline mit Hybrid Search:
    1. Strukturierte Extraktion (Notiz -> JSON mit Hersteller, Typ, Masse, such_text)
    2. Hybrid Search (pgvector Cosine + Volltext -> RRF -> Top-20 pro Position)
    3. LLM-Reranking (Claude waehlt besten Kandidaten pro Position)
    4. Angebotsgenerierung (nur verifizierte Artikel)
    """
    logger.info('=' * 60)
    logger.info('[Pipeline] START -- Notiz-ID: %s', notiz_id)
    logger.info('[Pipeline] Notiz-Text: %s', notiz_text[:300])

    notiz_zensiert = zensiere_pii(notiz_text)

    # -- Schritt 0: Beispiel-Artikel aus DB holen
    db_beispiele = hole_db_beispiele()
    logger.info('[Pipeline] Schritt 0 -- %d DB-Beispiele geladen',
                db_beispiele.count('\n') + 1 if db_beispiele else 0)

    # -- STUFE 1: Strukturierte Extraktion
    logger.info('[Pipeline] === STUFE 1: Strukturierte Extraktion ===')
    try:
        positionen = _stufe1_strukturierte_extraktion(notiz_zensiert, db_beispiele)
    except Exception as e:
        logger.error('[Pipeline] Stufe 1 FEHLER: %s', e)
        return []

    if not positionen:
        logger.warning('[Pipeline] Keine Positionen extrahiert -- Abbruch')
        return []

    # -- STUFE 2: Hybrid Search (pgvector + Volltext + RRF)
    logger.info('[Pipeline] === STUFE 2: Hybrid Search (Vector + Volltext + RRF) ===')
    try:
        conn = _db_connect()
        try:
            positionen_mit_kandidaten = _stufe2_hybrid_search(positionen, conn)
        finally:
            conn.close()
    except Exception as e:
        logger.error('[Pipeline] Stufe 2 FEHLER: %s', e)
        return []

    treffer_gesamt = sum(len(p['kandidaten']) for p in positionen_mit_kandidaten)
    logger.info('[Pipeline] Stufe 2 -- %d Kandidaten fuer %d Positionen',
                treffer_gesamt, len(positionen_mit_kandidaten))

    # -- RAGflow Beispielangebote
    referenz_angebote = ragflow_beispielangebote(notiz_zensiert)

    # -- STUFE 3: LLM-Reranking
    logger.info('[Pipeline] === STUFE 3: LLM-Reranking ===')
    reranked = _stufe3_reranking(positionen_mit_kandidaten, notiz_zensiert)

    # -- STUFE 4: Angebotsgenerierung
    logger.info('[Pipeline] === STUFE 4: Angebotsgenerierung ===')
    try:
        positionen_raw = _stufe4_angebot(reranked, notiz_zensiert, referenz_angebote)
    except Exception as e:
        logger.error('[Pipeline] Stufe 4 FEHLER: %s', e)
        return []

    # -- Positionen normalisieren + Summen berechnen
    positionen_final = []
    for i, p in enumerate(positionen_raw, start=1):
        menge = float(p.get('menge', 1))
        einzelpreis = float(p.get('einzelpreis', 0))
        rabatt = float(p.get('rabatt_prozent', 0))
        gesamtpreis = round(menge * einzelpreis * (1 - rabatt / 100), 2)

        # Preiskalkulation: LP = einzelpreis, VK = LP (kein Aufschlag standardmäßig)
        lp = einzelpreis
        vk = lp
        vk_netto = round(menge * vk * (1 - rabatt / 100), 2)
        mwst = 19
        brutto_gesamt = round(vk_netto * (1 + mwst / 100), 2)

        pos = {
            'id': str(uuid.uuid4()),
            'pos_nr': i,
            'artnr': p.get('artnr') or None,
            'bezeichnung': p.get('bezeichnung', ''),
            'hersteller': p.get('hersteller') or None,
            'beschreibung': p.get('beschreibung') or None,
            'menge': menge,
            'einheit': p.get('einheit', 'Stk'),
            # Preiskalkulation
            'ek_einheit': 0,
            'lp_einheit': lp,
            'aufschlag_prozent': 0,
            'vk_einheit': vk,
            'einzelpreis': einzelpreis,
            'rabatt_prozent': rabatt,
            'rabatt_betrag': round(menge * vk * rabatt / 100, 2),
            'vk_netto': vk_netto,
            'mwst_prozent': mwst,
            'gesamtpreis': vk_netto,
            'brutto_gesamt': brutto_gesamt,
            'ist_manuell': bool(p.get('ist_manuell', False)),
            'foerdermittel_hinweis': p.get('foerdermittel_hinweis') or None,
            # Artikel-Details (Kopie für lokale Bearbeitung)
            'artikel_details': {
                'artikelname': p.get('bezeichnung', ''),
                'artikelnummer': p.get('artnr') or '',
                'hersteller': p.get('hersteller') or '',
                'beschreibung': p.get('beschreibung') or '',
            },
        }
        positionen_final.append(pos)
        status = 'MANUELL' if pos['ist_manuell'] else 'Artikelstamm'
        logger.info('[Pipeline] Position %d: %s | %s | EUR%.2f | %s',
                     i, pos['artnr'] or 'MANUELL', pos['bezeichnung'][:40],
                     einzelpreis, status)

    manuell = sum(1 for p in positionen_final if p['ist_manuell'])
    logger.info('[Pipeline] FERTIG -- %d Positionen (%d Artikelstamm, %d manuell)',
                 len(positionen_final), len(positionen_final) - manuell, manuell)
    logger.info('=' * 60)

    return positionen_final


def _parse_json_array(text: str) -> list:
    """Extrahiert das erste JSON-Array aus einem Text."""
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1 or end <= start:
        return []
    return json.loads(text[start:end + 1])
