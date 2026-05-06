"""
HERO CRM Termin-Sync via GraphQL API.
Docs: https://login.hero-software.de/api/external/v7/graphql
"""
import httpx
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from django.conf import settings
from django.contrib.auth.models import User

_BERLIN = ZoneInfo('Europe/Berlin')


def _fix_hero_datetime(dt_str: str | None) -> str | None:
    """
    HERO gibt Berliner Lokalzeit mit +00:00 zurück (fälschlicherweise als UTC markiert).
    Wir parsen als naive datetime und lokalisieren korrekt als Europe/Berlin.
    Gibt bei Parse-Fehler None zurück statt den rohen String, damit DateTimeField
    keinen ungültigen Wert bekommt.
    """
    if not dt_str:
        return None
    naive_str = dt_str.replace('+00:00', '').replace('Z', '')
    try:
        naive = datetime.fromisoformat(naive_str)
        return naive.replace(tzinfo=_BERLIN).isoformat()
    except ValueError:
        return None


HERO_GRAPHQL_URL = "https://login.hero-software.de/api/external/v7/graphql"

# GraphQL Query für Termine (calendar_events)
# Die genaue Feldstruktur wird per Schema-Introspection ermittelt.
# Fallback: breite Query die alle wichtigen Felder abdeckt.
CALENDAR_EVENTS_QUERY = """
query CalendarEvents($partnerIds: [Int], $start: DateTime, $end: DateTime) {
  calendar_events(partner_ids: $partnerIds, start: $start, end: $end) {
    id
    title
    description
    start
    end
    all_day
    is_done
    deleted
    category {
      name
    }
    partners {
      id
      name
    }
  }
}
"""


def _hero_headers() -> dict:
    return {
        "Authorization": settings.HERO_API_TOKEN,  # Enthält bereits "Bearer ..."
        "Content-Type": "application/json",
    }


def fetch_hero_termine(hero_partner_id: str, tage_voraus: int = 7) -> list[dict]:
    """
    Ruft Termine für einen Monteur aus HERO CRM ab.
    Gibt eine Liste von rohen HERO-Objekten zurück.
    Wirft Exception bei API-Fehler.
    """
    if not settings.HERO_API_TOKEN:
        raise ValueError("HERO_API_TOKEN nicht konfiguriert")

    tz = ZoneInfo(settings.TIME_ZONE)
    now = datetime.now(tz=tz)
    von_dt = (now - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
    bis_dt = (now + timedelta(days=tage_voraus)).replace(hour=23, minute=59, second=59, microsecond=0)
    von = von_dt.isoformat()
    bis = bis_dt.isoformat()

    payload = {
        "query": CALENDAR_EVENTS_QUERY,
        "variables": {
            "partnerIds": [int(hero_partner_id)],
            "start": von,
            "end": bis,
        },
    }

    response = httpx.post(
        HERO_GRAPHQL_URL,
        json=payload,
        headers=_hero_headers(),
        timeout=30.0,
    )
    response.raise_for_status()

    data = response.json()
    if "errors" in data:
        raise ValueError(f"HERO GraphQL Fehler: {data['errors']}")

    return data.get("data", {}).get("calendar_events") or []


def _map_hero_status(is_done: bool) -> str:
    """Mappt HERO is_done auf interne Termin-Status."""
    return "erledigt" if is_done else "geplant"


def _map_hero_type(category_name: str) -> str:
    """Mappt HERO-Kategoriename auf interne Termin-Typen."""
    name = (category_name or "").lower()
    if any(w in name for w in ("aufmaß", "aufmass", "measure", "messung")):
        return "aufmass"
    if any(w in name for w in ("wartung", "service", "maintenance")):
        return "wartung"
    if any(w in name for w in ("notdienst", "emergency", "notruf")):
        return "notdienst"
    if any(w in name for w in ("besprechung", "meeting", "termin")):
        return "besprechung"
    if any(w in name for w in ("lieferung", "delivery")):
        return "lieferung"
    return "sonstiges"


def sync_hero_termine_fuer_user(user: User, tage_voraus: int = 7) -> tuple[int, int]:
    """
    Synchronisiert HERO-Termine für einen User.
    Erstellt neue Termine, aktualisiert geänderte.
    Gibt (neu_erstellt, aktualisiert) zurück.
    """
    from .models import Termin

    profile = getattr(user, "profile", None)
    if not profile or not profile.hero_partner_id:
        return 0, 0

    hero_termine = fetch_hero_termine(profile.hero_partner_id, tage_voraus=tage_voraus)

    neu = 0
    aktualisiert = 0

    for ht in hero_termine:
        hero_id = str(ht.get("id", ""))
        if not hero_id:
            continue

        beginn_parsed = _fix_hero_datetime(ht.get("start"))
        if not beginn_parsed:
            continue  # Ohne gültiges Datum kann kein Termin angelegt werden

        category_name = (ht.get("category") or {}).get("name", "")

        defaults = {
            "titel":        ht.get("title") or "HERO Termin",
            "beschreibung": ht.get("description") or "",
            "typ":          _map_hero_type(category_name),
            "status":       _map_hero_status(bool(ht.get("is_done", False))),
            "beginn":       beginn_parsed,
            "ende":         _fix_hero_datetime(ht.get("end")) or beginn_parsed,
            "ganztaegig":   bool(ht.get("all_day", False)),
            "adresse":      {},
            "monteure":     [user.id],
            "erstellt_von": user,
        }

        # Prüfen ob sich beginn geändert hat → push_gesendet zurücksetzen
        existing = Termin.objects.filter(hero_crm_id=hero_id).first()
        if existing and str(existing.beginn.isoformat()) != beginn_parsed:
            defaults['push_gesendet'] = False

        _, created = Termin.objects.update_or_create(
            hero_crm_id=hero_id,
            defaults=defaults,
        )
        if created:
            neu += 1
        else:
            aktualisiert += 1

    return neu, aktualisiert
