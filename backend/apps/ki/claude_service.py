"""
Claude KI-Service für MitraApp.
Alle Aufrufe laufen durch den PII-Filter.

Auth-Reihenfolge für Claude CLI:
1. ~/.claude/credentials (via Volume-Mount vom Host: ~/.claude:/root/.claude:ro)
   → Eingeloggt mit `claude login` auf dem Host — kein API-Key nötig
2. ANTHROPIC_API_KEY in .env (als Fallback für Server-Deploy)
"""
import json
import os
import subprocess
from django.conf import settings
from .pii_filter import zensiere_pii


def claude_cli(prompt: str) -> str:
    """
    Ruft Claude CLI auf. PII MUSS vor Aufruf zensiert sein.
    Auth via ~/.claude (Volume-Mount) oder ANTHROPIC_API_KEY.
    """
    # Vollständiges Prozess-Environment übernehmen (damit ~/.claude Auth funktioniert)
    env = os.environ.copy()

    # ANTHROPIC_API_KEY nur setzen wenn vorhanden (überschreibt ~/.claude nicht)
    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
    if api_key:
        env['ANTHROPIC_API_KEY'] = api_key

    result = subprocess.run(
        ['claude', '-p', prompt, '--output-format', 'text'],
        capture_output=True,
        text=True,
        timeout=60,
        env=env,
    )
    if result.returncode != 0:
        raise RuntimeError(f'Claude CLI Fehler: {result.stderr}')
    return result.stdout.strip()


def strukturiere_notiz(transkript: str, kategorie: str) -> dict:
    """
    Strukturiert eine SHK-Aufmaß-Notiz via Claude.
    PII wird vor dem Aufruf automatisch gefiltert.
    """
    transkript_zensiert = zensiere_pii(transkript)

    prompt = f"""Du bist ein SHK-Experte (Sanitär, Heizung, Klima).
Strukturiere diese Aufmaß-Notiz für Kategorie '{kategorie}' als JSON.

Format:
{{
  "ki_text": "Zusammenfassung der Notiz",
  "items": [
    {{"id": "uuid", "typ": "produkt|aufgabe|termin|notiz", "text": "...", "hersteller": "optional", "menge": null, "einheit": null, "faellig_am": null, "erledigt": false}}
  ]
}}

Notiz:
{transkript_zensiert}

Antworte NUR mit dem JSON-Objekt, kein anderer Text."""

    antwort = claude_cli(prompt)

    # JSON aus Antwort extrahieren
    try:
        # Manchmal gibt Claude Code-Blöcke zurück
        if '```' in antwort:
            start = antwort.index('{')
            end = antwort.rindex('}') + 1
            antwort = antwort[start:end]
        return json.loads(antwort)
    except (json.JSONDecodeError, ValueError):
        return {
            'ki_text': antwort,
            'items': [],
        }


def lese_visitenkarte(foto_path: str) -> dict:
    """
    Liest eine Visitenkarte via Claude Vision API.
    PII bleibt lokal — Foto wird als Base64 an Claude gesendet.
    """
    import base64

    with open(foto_path, 'rb') as f:
        foto_b64 = base64.b64encode(f.read()).decode()

    prompt = f"""Du bist ein Assistent, der Visitenkarten ausliest.
Extrahiere alle Informationen aus dieser Visitenkarte als JSON.

Format:
{{
  "firma": "Firmenname oder null",
  "ansprechpartner": "Vor- und Nachname oder null",
  "position": "Jobtitel oder null",
  "mobil": "Mobilnummer oder null",
  "telefon": "Telefonnummer oder null",
  "email": "E-Mail-Adresse oder null",
  "website": "Website-URL oder null",
  "adresse": {{
    "strasse": "Straße und Hausnummer oder null",
    "plz": "PLZ oder null",
    "ort": "Ort oder null",
    "land": "Land oder null"
  }},
  "konfidenz": 0.0 bis 1.0 (wie sicher bist du bei der Extraktion)
}}

Visitenkarte (Base64-Bild):
data:image/jpeg;base64,{foto_b64}

Antworte NUR mit dem JSON-Objekt."""

    antwort = claude_cli(prompt)

    try:
        if '```' in antwort:
            start = antwort.index('{')
            end = antwort.rindex('}') + 1
            antwort = antwort[start:end]
        data = json.loads(antwort)
        # Null-Werte entfernen
        return {k: v for k, v in data.items() if v is not None}
    except (json.JSONDecodeError, ValueError):
        return {'konfidenz': 0}


def transkribiere_audio(audio_path: str) -> str:
    """
    Transkribiert Audio via faster-whisper.
    Läuft vollständig lokal — keine externen KI-Aufrufe.
    """
    try:
        from faster_whisper import WhisperModel
        model = WhisperModel('small', device='auto', compute_type='int8')
        segments, _ = model.transcribe(audio_path, language='de')
        return ' '.join(seg.text.strip() for seg in segments)
    except ImportError:
        raise RuntimeError('faster-whisper nicht installiert. Bitte requirements.txt installieren.')
