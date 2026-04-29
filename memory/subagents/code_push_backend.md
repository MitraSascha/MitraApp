---
type: subagent-memory
agent: code
modul: push_backend
created: 2026-04-29
status: completed
---

## Was wurde getan

Push-Reminder Scheduler im Django Backend eingerichtet. Die bestehende `send_termin_reminders()`-Funktion wird jetzt automatisch alle 60 Sekunden aufgerufen, ohne Celery oder externe Abhängigkeiten.

## Ergebnisse / Outputs

- `W:\Dev\Privat\Pironi\backend\requirements.dev.txt` — `pywebpush==2.0.*` hinzugefügt
- `W:\Dev\Privat\Pironi\backend\apps\termine\scheduler.py` — Neu erstellt: enthält `_reminder_loop()` (60s Intervall, 30s Startup-Delay) und `start_reminder_scheduler()` mit globalem `_scheduler_started`-Guard
- `W:\Dev\Privat\Pironi\backend\apps\termine\apps.py` — Ersetzt: verwendet nun `UVICORN_STARTED`-Env-Guard statt globalem Flag; ruft `start_reminder_scheduler()` aus `scheduler.py` auf
- `W:\Dev\Privat\Pironi\backend\mitra\settings.py` — `'apps.termine'` ersetzt durch `'apps.termine.apps.TermineConfig'` in INSTALLED_APPS
- `W:\Dev\Privat\Pironi\backend\apps\termine\__init__.py` — Unverändert (enthielt bereits `default_app_config = 'apps.termine.apps.TermineConfig'`)

## Wichtige Entscheidungen

- **Kein Celery/Redis/django-apscheduler** — nur Python stdlib `threading` (leichtgewichtig, keine Infrastruktur-Abhängigkeiten)
- **Doppelstart-Schutz über `UVICORN_STARTED` Env-Variable** — verlässlicher als globale Python-Variable, da uvicorn `--reload` den Prozess neu startet
- **Scheduler-Logik ausgelagert in `scheduler.py`** — saubere Trennung, `apps.py` bleibt minimal
- **Intervall 60s** (statt 300s aus dem alten Code) — laut Aufgabenstellung, ermöglicht schnellere Erinnerungen

## Übergabe-Hinweise

- `pywebpush==2.0.*` muss noch per `pip install -r requirements.dev.txt` installiert werden (oder Docker-Image neu bauen)
- Die `send_termin_reminders()`-Funktion in `apps/termine/push_service.py` war bereits vorhanden und wird unverändert genutzt
- VAPID-Keys müssen in `.env` gesetzt sein (`VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`) damit Push tatsächlich versendet wird

## Offene Punkte

- Produktions-Deployment: Bei gunicorn mit mehreren Workers kann `UVICORN_STARTED` nicht prozessübergreifend wirken — dort wäre ein Celery Beat oder ein dedizierter Management-Command-Cronjob sinnvoller
- Vorhandener Management Command `send_termin_reminders.py` bleibt erhalten und kann weiterhin manuell genutzt werden
