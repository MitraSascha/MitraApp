"""
KI-Analyse für Bautagebuch: Arbeiten, Mängel, Materialliste.
Nutzt Claude CLI über apps.ki.claude_service.
"""
import json
import logging
import uuid
from apps.ki.claude_service import claude_cli
from apps.ki.pii_filter import zensiere_pii

logger = logging.getLogger(__name__)

GEWERKE = [
    'Sanitär', 'Heizung', 'Klima', 'Elektriker', 'Anlagenmechaniker',
    'Fliesenleger', 'Trockenbauer', 'Maler', 'Dachdecker', 'Zimmermann',
    'Maurer', 'Schlosser', 'Sonstige',
]


def ki_arbeiten_analyse(text: str) -> list[dict]:
    """
    Analysiert Freitext und extrahiert strukturierte Arbeitsschritte.
    Gibt eine Liste von {id, beschreibung, status} zurück.
    """
    if not text.strip():
        return []

    prompt = f"""Du bist ein Assistent für Handwerker im SHK-Bereich (Sanitär, Heizung, Klima).
Analysiere die folgende Arbeitsbeschreibung und extrahiere einzelne, konkrete Arbeitsschritte.

Arbeitsbeschreibung:
{zensiere_pii(text)}

Antworte NUR mit einem JSON-Array. Jedes Element hat:
- "beschreibung": Kurzer, klarer Arbeitsschritt (1 Satz)
- "status": Immer "offen"

Beispiel: [{{"beschreibung": "Wasserleitung im Bad absperren", "status": "offen"}}]

JSON-Array:"""

    try:
        result = claude_cli(prompt)
        items = _parse_json_array(result)
        for item in items:
            item['id'] = str(uuid.uuid4())
            item.setdefault('status', 'offen')
        return items
    except Exception as e:
        logger.error("KI Arbeiten-Analyse fehlgeschlagen: %s", e)
        return []


def ki_maengel_analyse(text: str) -> list[dict]:
    """
    Analysiert Mängelbeschreibung und erstellt strukturierte Mängel mit Gewerk.
    Gibt eine Liste von {id, beschreibung, prioritaet, gewerk, foto_ids, status} zurück.
    """
    if not text.strip():
        return []

    gewerke_str = ', '.join(GEWERKE)
    prompt = f"""Du bist ein Bauleiter-Assistent. Analysiere die folgende Mängelbeschreibung und erstelle strukturierte Mängeleinträge.

Mängelbeschreibung:
{zensiere_pii(text)}

Verfügbare Gewerke: {gewerke_str}

Antworte NUR mit einem JSON-Array. Jedes Element hat:
- "beschreibung": Klare Mängelbeschreibung (1-2 Sätze)
- "prioritaet": "niedrig", "mittel", "hoch" oder "kritisch"
- "gewerk": Das verantwortliche Gewerk aus der Liste oben
- "status": Immer "offen"

JSON-Array:"""

    try:
        result = claude_cli(prompt)
        items = _parse_json_array(result)
        for item in items:
            item['id'] = str(uuid.uuid4())
            item.setdefault('status', 'offen')
            item.setdefault('prioritaet', 'mittel')
            item.setdefault('foto_ids', [])
            # Gewerk validieren
            if item.get('gewerk') not in GEWERKE:
                item['gewerk'] = 'Sonstige'
        return items
    except Exception as e:
        logger.error("KI Mängel-Analyse fehlgeschlagen: %s", e)
        return []


def ki_materialliste_analyse(text: str) -> list[dict]:
    """
    Analysiert Materialbeschreibung und erstellt strukturierte Materialpositionen.
    Gibt eine Liste von {id, name, menge, einheit, erledigt} zurück.
    """
    if not text.strip():
        return []

    prompt = f"""Du bist ein Assistent für Handwerker im SHK-Bereich.
Analysiere den folgenden Text und erstelle eine Materialliste mit einzelnen Positionen.

Text:
{zensiere_pii(text)}

Antworte NUR mit einem JSON-Array. Jedes Element hat:
- "name": Materialbezeichnung (z.B. "Kupferrohr 15mm", "Flexschlauch 3/8 Zoll")
- "menge": Zahlenwert (z.B. 10, 2.5)
- "einheit": "Stk", "m", "Set", "Paar", "Rolle", "Pkg" etc.

JSON-Array:"""

    try:
        result = claude_cli(prompt)
        items = _parse_json_array(result)
        for item in items:
            item['id'] = str(uuid.uuid4())
            item.setdefault('menge', 1)
            item.setdefault('einheit', 'Stk')
            item['erledigt'] = False
        return items
    except Exception as e:
        logger.error("KI Materialliste-Analyse fehlgeschlagen: %s", e)
        return []


def _parse_json_array(text: str) -> list[dict]:
    """Extrahiert ein JSON-Array aus Claude-Antwort (kann Markdown-Wrapper haben)."""
    text = text.strip()
    # Markdown Code-Block entfernen
    if '```' in text:
        parts = text.split('```')
        for part in parts:
            part = part.strip()
            if part.startswith('json'):
                part = part[4:].strip()
            if part.startswith('['):
                text = part
                break

    # Erstes [ bis letztes ] finden
    start = text.find('[')
    end = text.rfind(']')
    if start == -1 or end == -1:
        return []

    return json.loads(text[start:end + 1])
