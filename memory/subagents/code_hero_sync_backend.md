---
type: subagent-memory
agent: code
modul: hero_sync_backend
created: 2026-04-27
status: completed
---

## Was wurde getan

Implementierung des HERO CRM Termin-Sync-Endpunkts für das Django REST Framework Backend.
Drei Dateien wurden erstellt bzw. aktualisiert.

## Ergebnisse / Outputs

### Neu erstellt
- `W:\Dev\Privat\Pironi\backend\apps\termine\hero_sync.py`
  - `fetch_hero_termine(hero_partner_id, tage_voraus=30)` — ruft calendar_events via HERO GraphQL ab (7 Tage rückwirkend, 30 Tage voraus)
  - `_map_hero_status(hero_status)` — mappt HERO-Status auf interne STATUS_CHOICES
  - `_map_hero_type(hero_type)` — mappt HERO-Typ auf interne TYP_CHOICES
  - `sync_hero_termine_fuer_user(user)` — Hauptfunktion, führt update_or_create via `hero_crm_id` durch, gibt (neu, aktualisiert) zurück

### Aktualisiert
- `W:\Dev\Privat\Pironi\backend\apps\termine\views.py`
  - Neue Imports: `api_view`, `permission_classes`, `IsAuthenticated`, `Response`, `drf_status`, `sync_hero_termine_fuer_user`
  - Neuer View: `hero_sync_view` — POST-Endpunkt, IsAuthenticated, Fehlerbehandlung mit 400 (ValueError) und 502 (alle anderen Exceptions)

- `W:\Dev\Privat\Pironi\backend\apps\termine\urls.py`
  - Import von `hero_sync_view` ergänzt
  - `path('hero-sync/', hero_sync_view, name='hero_sync')` VOR `router.urls` eingefügt (Reihenfolge kritisch)

## Wichtige Entscheidungen

- `hero-sync/` wird vor `router.urls` in urlpatterns platziert, damit der DefaultRouter (der `r''` registriert) nicht zuerst matched
- `httpx.post` (synchron) statt `httpx.AsyncClient` — passt zur synchronen Django-View-Architektur; wissen/views.py nutzt async, termine/views.py ist sync
- `update_or_create` mit `hero_crm_id` als Lookup-Key — setzt voraus, dass `hero_crm_id` im Termin-Model unique ist (es ist bereits als CharField vorhanden, aber kein unique=True Constraint — für Produktion ggf. Migration ergänzen)
- Status-Fallback ist `"geplant"`, Typ-Fallback ist `"sonstiges"` — entspricht den Model-Defaults

## Übergabe-Hinweise

- `HERO_API_TOKEN` muss als Umgebungsvariable gesetzt sein (settings.py liest via `os.getenv('HERO_API_TOKEN', '')`)
- `request.user.profile.hero_partner_id` muss im UserProfile-Model vorhanden sein — laut Aufgabe bereits implementiert (siehe `code_userprofile_backend.md`)
- Der Endpunkt ist erreichbar unter `POST /api/termine/hero-sync/` (setzt voraus, dass das termine-App unter `/api/termine/` eingebunden ist)
- Die GraphQL Query (`CALENDAR_EVENTS_QUERY`) deckt die wichtigsten Felder ab; falls das HERO-Schema abweicht, kann die Query in `hero_sync.py` angepasst werden ohne andere Dateien zu berühren
- Kein neues Migration erforderlich — `hero_crm_id` existiert bereits im Termin-Model

## Offene Punkte

- `hero_crm_id` sollte ein `unique=True`-Constraint bekommen (Migration nötig) — aktuell kein unique, `update_or_create` gibt bei Duplikaten eine Exception
- HERO GraphQL Schema-Introspection wurde nicht durchgeführt — die Query ist ein sinnvoller Fallback, muss gegen die echte API getestet werden
- Kein Retry-Mechanismus bei Netzwerkfehlern implementiert
- Kein Celery-Task für automatischen Hintergrund-Sync — aktuell nur on-demand via POST
