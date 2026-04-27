---
type: subagent-memory
agent: research
modul: hero-crm-integration
created: 2026-04-27
status: completed
---

## Was wurde getan
Recherche der HERO Software GmbH CRM API für Terminabruf (Monteur-Synchronisation).
Quellen: offizielle Dokumentation hero-software.de/api-doku, GraphQL-Guide, Lead-API-Guide, Make.com Modulübersicht.

---

## Ergebnisse / Outputs

### API-Typ
HERO Software bietet **keine klassische REST API** für Datenabruf. Stattdessen:
- **Lead API** (REST, nur für eingehende Leads/Projekte anlegen)
- **GraphQL API** (vollständiger Zugriff auf alle Objekte — empfohlen für Terminabruf)

---

### Base-URL
```
https://login.hero-software.de/api/external/v7/graphql
```
(GraphQL-Endpoint — POST-Request mit JSON-Body)

Lead-API (nur schreibend):
```
POST https://login.hero-software.de/api/v1/Projects/create
```

---

### Authentifizierung
**Format: Bearer Token im HTTP-Header**

```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Accept: application/json
```

- API-Key muss bei HERO Support beantragt werden
- Der vorhandene `HERO_API_TOKEN` im Projekt entspricht diesem Bearer-Token
- Kein OAuth, kein Session-Cookie — reiner statischer API-Key als Bearer Token

---

### GraphQL — Bekannte Query-Typen (offiziell dokumentiert)

| Query | Beschreibung |
|---|---|
| `contacts` | Kundenkontakte abrufen |
| `project_matches` | Projekte/Aufträge abrufen |
| `customer_documents` | Dokumente abrufen |
| `calendar_events` | **Termine/Appointments abrufen** |
| `supply_product_versions` | Artikelstamm |

Mutationen: `create_contact`, `create_project_match`, `add_logbook_entry`

---

### Bekannte GraphQL-Feldstruktur (aus Dokumentationsbeispielen)

**contacts:**
```graphql
query {
  contacts {
    id
    nr
    first_name
    last_name
    company_name
    email
    phone_home
    address {
      street
      city
      zipcode
    }
  }
}
```

**project_matches:**
```graphql
query {
  project_matches {
    id
    project_nr
    measure { short, name }
    customer { id, first_name, last_name, email }
    contact { id, first_name, last_name, email }
    address { street, city, zipcode }
    current_project_match_status { status_code, name }
  }
}
```

---

### calendar_events — Was bekannt ist
- Query-Name: `calendar_events` (offiziell als verfügbar gelistet)
- **Genaue Feldstruktur ist NICHT öffentlich dokumentiert**
- Make.com-Modul "Watch Appointments" zeigt: HERO hat ein Appointment-Objekt mit mindestens Datum, Trigger bei Create/Modify
- Filter nach Mitarbeiter/Partner-ID: **nicht öffentlich dokumentiert**

---

### Pagination
- Bekannte Parameter (aus contacts-Beispielen): `offset` (Integer), `orderBy`
- Kein `limit`-Parameter explizit dokumentiert, aber `offset` lässt klassische Offset-Pagination vermuten
- Cursor-basierte Pagination: **nicht gefunden**

---

### partner_id / Monteur-ID
- HERO kennt intern Mitarbeiter-Rollen (Manager, Technician etc.)
- Eine `hero_partner_id` (numerisch) ist im MitraApp-Kontext bekannt
- **Ob `calendar_events` nach assigned employee/partner filterbar ist: unbekannt** — dies muss durch direkten Schema-Introspection-Request ermittelt werden

---

### Make.com Modul-Übersicht (indirekter Beleg für verfügbare Operationen)
Trigger: Watch Appointments, Watch Contacts, Watch Documents, Watch Images, Watch Projects
Actions: Create/Update Contact, Create/Update/Get Project, Upload Document/Image, Create Logbook Entry, Get internal Project-ID

---

## Wichtige Entscheidungen

### Was ist klar:
1. **GraphQL ist der richtige Weg** — nicht REST
2. **Bearer Token Auth** ist korrekt — `HERO_API_TOKEN` wird als `Authorization: Bearer` Header gesendet
3. **Endpoint ist verifiziert:** `https://login.hero-software.de/api/external/v7/graphql`
4. **`calendar_events` Query existiert** — Termine sind abrufbar
5. Das vollständige Schema ist abrufbar via GraphQL Introspection am Endpoint selbst

### Was ist unklar:
1. **Exakte Felder von `calendar_events`** (Datum, Uhrzeit, Adresse, Kundenreferenz, Auftragstyp) — nicht öffentlich
2. **Filter nach Monteur/Partner** — ob `assigned_to`, `employee_id`, `partner_id` als Filterparameter existieren: unbekannt
3. **Pagination-Limit** — `offset` bekannt, `limit`/`first` unbekannt

---

## Übergabe-Hinweise (für code-specialist)

### Implementierungsstrategie:

**Schritt 1 — Schema-Introspection beim ersten App-Start (oder im Backend):**
```graphql
query IntrospectCalendarEvents {
  __type(name: "calendar_events") {
    fields {
      name
      type { name kind }
    }
  }
}
```
→ Liefert alle verfügbaren Felder und Filter

**Schritt 2 — Basis-Request-Struktur (Django Backend → HERO API):**
```python
import requests

HERO_ENDPOINT = "https://login.hero-software.de/api/external/v7/graphql"
HERO_TOKEN = settings.HERO_API_TOKEN

headers = {
    "Authorization": f"Bearer {HERO_TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

query = """
query GetCalendarEvents($offset: Int) {
  calendar_events(offset: $offset) {
    id
    # weitere Felder nach Introspection
  }
}
"""

response = requests.post(
    HERO_ENDPOINT,
    json={"query": query, "variables": {"offset": 0}},
    headers=headers,
)
data = response.json()
```

**Schritt 3 — Monteur-Filter:**
Falls `calendar_events` keinen direkten Filter nach `partner_id` unterstützt:
→ Fallback: alle Termine abrufen, clientseitig nach `hero_partner_id` des Monteurs filtern

**Schritt 4 — Polling-Strategie:**
HERO bietet keinen Webhook/Push für Termine (kein öffentlich dokumentierter Endpoint).
→ Polling im Django Backend empfohlen (z.B. alle 15 Minuten via Celery Beat oder Cron)

### Umgebungsvariablen die erwartet werden:
```
HERO_API_TOKEN=<bearer_token_vom_hero_support>
HERO_API_URL=https://login.hero-software.de/api/external/v7/graphql
```

---

## Offene Punkte

1. **Schema-Introspection muss live durchgeführt werden** — mit gültigem API-Token gegen den echten Endpoint, um `calendar_events`-Felder vollständig zu kennen. Dies kann der code-specialist oder Projekteigentümer mit dem vorhandenen `HERO_API_TOKEN` tun.

2. **Filter nach Monteur-ID** — muss durch Introspection oder direkten Test geklärt werden. Falls kein Server-Filter existiert: clientseitiger Filter ist der Fallback.

3. **Pagination-Limit-Parameter** — unklar ob `limit`, `first`, oder `per_page`. Nach Introspection klärbar.

4. **Webhook-Unterstützung** — nicht dokumentiert. HERO Make.com-Integration nutzt "Watch"-Trigger (Polling), kein echter Push. Django-Backend sollte daher Polling implementieren.

### Fallback-Strategie falls API nicht nutzbar:
Falls `HERO_API_TOKEN` nicht verfügbar oder `calendar_events` nicht die benötigten Felder liefert:
- **Option A:** iCal-Export aus HERO (falls vorhanden) per HTTP abrufen und parsen
- **Option B:** Manuelle Termineingabe in der MitraApp mit lokalem CRUD
- **Option C:** HERO-App läuft parallel, MitraApp dient nur als Zusatzanzeige ohne Sync
