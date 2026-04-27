"""
HERO CRM Termin-Sync via GraphQL API.
Docs: https://login.hero-software.de/api/external/v7/graphql
"""
import httpx
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth.models import User


HERO_GRAPHQL_URL = "https://login.hero-software.de/api/external/v7/graphql"

# GraphQL Query für Termine (calendar_events)
# Die genaue Feldstruktur wird per Schema-Introspection ermittelt.
# Fallback: breite Query die alle wichtigen Felder abdeckt.
CALENDAR_EVENTS_QUERY = """
query CalendarEvents($partnerId: ID, $from: String, $to: String) {
  calendar_events(partner_id: $partnerId, date_from: $from, date_to: $to) {
    id
    title
    description
    start_at
    end_at
    all_day
    status
    type
    address {
      street
      zip
      city
    }
    customer {
      name
      phone
      email
    }
    partner {
      id
      name
    }
  }
}
"""


def _hero_headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.HERO_API_TOKEN}",
        "Content-Type": "application/json",
    }


def fetch_hero_termine(hero_partner_id: str, tage_voraus: int = 30) -> list[dict]:
    """
    Ruft Termine für einen Monteur aus HERO CRM ab.
    Gibt eine Liste von rohen HERO-Objekten zurück.
    Wirft Exception bei API-Fehler.
    """
    if not settings.HERO_API_TOKEN:
        raise ValueError("HERO_API_TOKEN nicht konfiguriert")

    now = datetime.now()
    von = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    bis = (now + timedelta(days=tage_voraus)).strftime("%Y-%m-%d")

    payload = {
        "query": CALENDAR_EVENTS_QUERY,
        "variables": {
            "partnerId": hero_partner_id,
            "from": von,
            "to": bis,
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


def _map_hero_status(hero_status: str) -> str:
    """Mappt HERO-Status auf interne Termin-Status."""
    mapping = {
        "planned":    "geplant",
        "confirmed":  "bestaetigt",
        "cancelled":  "abgesagt",
        "done":       "erledigt",
        "completed":  "erledigt",
    }
    return mapping.get((hero_status or "").lower(), "geplant")


def _map_hero_type(hero_type: str) -> str:
    """Mappt HERO-Auftragstyp auf interne Termin-Typen."""
    mapping = {
        "measurement": "aufmass",
        "maintenance": "wartung",
        "emergency":   "notdienst",
        "meeting":     "besprechung",
        "delivery":    "lieferung",
    }
    return mapping.get((hero_type or "").lower(), "sonstiges")


def sync_hero_termine_fuer_user(user: User) -> tuple[int, int]:
    """
    Synchronisiert HERO-Termine für einen User.
    Erstellt neue Termine, aktualisiert geänderte.
    Gibt (neu_erstellt, aktualisiert) zurück.
    """
    from .models import Termin

    profile = getattr(user, "profile", None)
    if not profile or not profile.hero_partner_id:
        return 0, 0

    hero_termine = fetch_hero_termine(profile.hero_partner_id)

    neu = 0
    aktualisiert = 0

    for ht in hero_termine:
        hero_id = str(ht.get("id", ""))
        if not hero_id:
            continue

        adresse = {}
        if addr := ht.get("address"):
            adresse = {
                "strasse": addr.get("street", ""),
                "plz":     addr.get("zip", ""),
                "ort":     addr.get("city", ""),
            }

        defaults = {
            "titel":        ht.get("title") or "HERO Termin",
            "beschreibung": ht.get("description") or "",
            "typ":          _map_hero_type(ht.get("type", "")),
            "status":       _map_hero_status(ht.get("status", "")),
            "beginn":       ht.get("start_at"),
            "ende":         ht.get("end_at") or ht.get("start_at"),
            "ganztaegig":   bool(ht.get("all_day", False)),
            "adresse":      adresse,
            "monteure":     [user.id],
            "erstellt_von": user,
        }

        _, created = Termin.objects.update_or_create(
            hero_crm_id=hero_id,
            defaults=defaults,
        )
        if created:
            neu += 1
        else:
            aktualisiert += 1

    return neu, aktualisiert
