---
type: subagent-memory
agent: code
modul: hero_sync_backend
created: 2026-04-27
updated: 2026-04-28
status: completed
---

## Was wurde getan

Implementierung und Bugfixing des HERO CRM Termin-Sync-Endpunkts.
Initial implementiert 2026-04-27, mehrfach korrigiert 2026-04-28 nach Live-Tests.

## Ergebnisse / Outputs

### Dateien
- `backend/apps/termine/hero_sync.py` — HERO GraphQL Sync-Logik
- `backend/apps/termine/views.py` — `hero_sync_view` POST-Endpunkt
- `backend/apps/termine/urls.py` — Route `hero-sync/`

## Wichtige Erkenntnisse (nach Introspection 2026-04-28)

### Echte HERO GraphQL Feldnamen

```graphql
calendar_events(
  partner_ids: [Int],    # NICHT partner_id: ID
  start: DateTime,       # ISO 8601 mit Timezone +HH:MM
  end: DateTime,
  ...
) {
  id, title, description,
  start, end,            # NICHT start_at / end_at
  all_day, is_done, deleted,
  category { name },
  partners [{ id, name }]
  # KEIN: status, type, address, customer
}
```

### HERO Timezone-Bug
HERO gibt Berliner Lokalzeit fälschlicherweise mit `+00:00` zurück.
Fix: `_fix_hero_datetime()` — interpretiert `+00:00` als Europe/Berlin statt UTC.

```python
def _fix_hero_datetime(dt_str):
    naive_str = dt_str.replace('+00:00', '').replace('Z', '')
    naive = datetime.fromisoformat(naive_str)
    return naive.replace(tzinfo=ZoneInfo('Europe/Berlin')).isoformat()
```

### Status-Mapping
Kein `status`-Feld in HERO — Mapping über `is_done` (Boolean):
- `is_done=True` → `"erledigt"`
- `is_done=False` → `"geplant"`

### Typ-Mapping
Kein `type`-Feld — Mapping über `category.name` (Keyword-Matching auf deutschen/englischen Begriffen).

## Übergabe-Hinweise

- `HERO_API_TOKEN` in `.env` — Format: `Bearer <token>` (Header enthält bereits "Bearer ")
- `profile.hero_partner_id` muss für jeden User im Django Admin gesetzt werden
- DateTime-Parameter an HERO: `%Y-%m-%dT00:00:00%z` mit korrektem Berliner Offset (+02:00 CEST / +01:00 CET)
- `_fix_hero_datetime()` muss auf alle von HERO zurückgegebenen Datetime-Felder angewendet werden

## Offene Punkte

- `hero_crm_id` hat kein `unique=True` im Model — Migration für Produktion nötig
- Kein automatischer Hintergrund-Sync (Celery) — nur on-demand via POST
- Kein Retry bei HERO API-Netzwerkfehlern
