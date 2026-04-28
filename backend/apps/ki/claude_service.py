"""
Claude KI-Service für MitraApp.
Alle Aufrufe laufen durch den PII-Filter.
Auth via ~/.claude (Volume-Mount vom Host: C:/Users/sasch/.claude:/root/.claude:ro)
"""
import json
import os
import subprocess
from django.conf import settings
from .pii_filter import zensiere_pii


_CLAUDE_HOME = '/tmp/claude_home'


def _ensure_claude_home() -> None:
    """
    ~/.claude ist read-only gemountet. Wir kopieren die Credentials einmalig
    in ein beschreibbares Verzeichnis, damit Claude CLI Session-Dateien ablegen kann.
    """
    import shutil
    target = os.path.join(_CLAUDE_HOME, '.claude')
    if not os.path.exists(target):
        os.makedirs(_CLAUDE_HOME, exist_ok=True)
        src = '/root/.claude'
        if os.path.exists(src):
            shutil.copytree(src, target)
        else:
            os.makedirs(target, exist_ok=True)


def claude_cli(prompt: str) -> str:
    """
    Ruft Claude CLI auf. PII MUSS vor Aufruf zensiert sein.
    Auth via ~/.claude Volume-Mount (wird in beschreibbares /tmp kopiert).
    """
    _ensure_claude_home()
    env = os.environ.copy()
    env['HOME'] = _CLAUDE_HOME

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


def lese_visitenkarte(foto_vorderseite: str, foto_rueckseite: str | None = None) -> dict:
    """
    Liest eine Visitenkarte via Claude Vision (Claude CLI mit @-Dateireferenz).
    Unterstützt Vorder- und Rückseite. PII bleibt lokal.
    """
    if foto_rueckseite:
        bilder_hinweis = (
            f'Vorderseite: @{foto_vorderseite}\n'
            f'Rückseite: @{foto_rueckseite}\n\n'
            f'Kombiniere die Informationen aus beiden Seiten.'
        )
    else:
        bilder_hinweis = f'Bild: @{foto_vorderseite}'

    prompt = (
        f'Du bist ein Assistent, der Visitenkarten ausliest. '
        f'Extrahiere alle Informationen aus {"diesen Bildern" if foto_rueckseite else "diesem Bild"} als JSON.\n\n'
        f'Format:\n'
        f'{{\n'
        f'  "firma": "Firmenname oder null",\n'
        f'  "ansprechpartner": "Vor- und Nachname oder null",\n'
        f'  "position": "Jobtitel oder null",\n'
        f'  "mobil": "Mobilnummer oder null",\n'
        f'  "telefon": "Telefonnummer oder null",\n'
        f'  "email": "E-Mail-Adresse oder null",\n'
        f'  "website": "Website-URL oder null",\n'
        f'  "adresse": {{\n'
        f'    "strasse": "Straße und Hausnummer oder null",\n'
        f'    "plz": "PLZ oder null",\n'
        f'    "ort": "Ort oder null",\n'
        f'    "land": "Land oder null"\n'
        f'  }},\n'
        f'  "konfidenz": 0.0 bis 1.0\n'
        f'}}\n\n'
        f'{bilder_hinweis}\n\n'
        f'Antworte NUR mit dem JSON-Objekt.'
    )

    antwort = claude_cli(prompt)

    try:
        if '```' in antwort:
            start = antwort.index('{')
            end = antwort.rindex('}') + 1
            antwort = antwort[start:end]
        data = json.loads(antwort)
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
