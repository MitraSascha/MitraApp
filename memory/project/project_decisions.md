---
type: project
updated: 2026-04-28
---

## Architektur- & Technologieentscheidungen

### Frontend
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Framework | Angular 19+ PWA | Offline-Fähigkeit, Push Notifications, eine Codebase Web+Mobile |
| Komponenten-Stil | Standalone Components | Kein NgModule-Overhead, Angular 19+ Standard |
| State Management | Angular Signals | <30 User, kein komplexer Shared-State, kein NgRx nötig |
| Offline Storage | IndexedDB + Workbox | PWA-Standard, Background Sync |
| 3D Visitenkarte | `@google/model-viewer` | Web Component, kein Three.js Overhead, GLB-Support nativ |
| Styling | SCSS + CSS Custom Properties | Design-Token System für Farbpalette |
| Drag & Drop | `@angular/cdk/drag-drop` | Bereits in Angular CDK enthalten |

### Backend
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Framework | Django REST Framework | Bekannt, schnell entwickelbar |
| Auth | JWT (djangorestframework-simplejwt) | Standard, zustandslos |
| PDF-Export | WeasyPrint | Einfach, DSGVO-konform, Python-nativ |
| Push Notifications | pywebpush | Django-seitig, Web Push Standard |

### KI & Externe Services
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| KI-Aufruf | Claude CLI (`claude -p`) in Docker | OAuth-Token vom Host via Volume-Mount, kein API-Key nötig |
| Vision (Visitenkarten) | Claude CLI mit `@<dateipfad>` Syntax | Bild-Referenz im Prompt, CLI verarbeitet nativ |
| Wissensdatenbank | RAGflow (Strato-Server) | Bereits eingerichtet |
| Lokales Modell | Ollama + Qwen2.5 | Bereits eingerichtet, DSGVO-konform |

### Infrastruktur
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Hosting | Strato Server (Docker) | Bereits vorhanden |
| VPN | WireGuard (Strato ↔ lokaler PC) | Für Ollama-Zugriff |
| Datenbank Artikelstamm | PostgreSQL Port 5433 (separater Container) | Datanorm v5 Daten |

### Design
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Primary Color | Anthrazit `#1C2128` | Handwerk-Ästhetik, Dark Mode |
| Accent Color | Orange `#E8700A` | Energie, Werkzeugmarken-Ästhetik |
| Font Headlines | IBM Plex Sans | Technisch, klar lesbar auf kleinen Screens |
| Font Body | Inter | Bewährt für UI |
| Font Monospace | JetBrains Mono | Artikelnummern, Code |
| Navigation | Bottom Navigation (Mobile) + Sidebar (Tablet/Desktop) | Mobile-First |

---

## HERO CRM API — Erkenntnisse (2026-04-28)

### Echte GraphQL Feldnamen (per Introspection ermittelt)

```graphql
# calendar_events Query-Parameter:
calendar_events(
  partner_ids: [Int],   # Liste von Partner-IDs (NICHT partner_id: ID!)
  start: DateTime,      # ISO 8601 mit Timezone z.B. 2026-05-01T00:00:00+02:00
  end: DateTime,
  show_deleted: Boolean,
  ids: [Int],
  orderBy: String,
  first: Int,
  offset: Int
)

# CalendarEvent Felder:
id, title, description, start, end, all_day, is_done, deleted,
category { name }, partners [{ id, name }]
# NICHT vorhanden: start_at, end_at, status, type, address, customer, partner (singular)
```

### HERO Timezone-Bug
HERO gibt Berliner Lokalzeit mit `+00:00` zurück (fälschlicherweise als UTC markiert).
Fix in `hero_sync.py`: `_fix_hero_datetime()` — parst als naive datetime und lokalisiert als Europe/Berlin.

---

## Claude CLI im Docker — Setup (2026-04-28)

- `~/.claude` ist als read-only Volume gemountet: `C:/Users/sasch/.claude:/root/.claude:ro`
- Claude CLI kann keine Session/History-Dateien in read-only schreiben → ENOENT-Fehler
- **Fix:** `_ensure_claude_home()` in `claude_service.py` kopiert `.claude` einmalig nach `/tmp/claude_home/` (beschreibbar)
- Claude CLI wird mit `HOME=/tmp/claude_home` aufgerufen
- `@<dateipfad>` Syntax im Prompt für Bild-Referenzen (Vision)
- `anthropic` Python SDK ist in `requirements.txt` eingetragen (als Fallback / für zukünftige direkte Nutzung)

---

## Timezone-Handling Frontend (2026-04-28)

**Problem:** `new Date().toISOString().slice(0, 10)` gibt UTC-Datum zurück, nicht lokales Datum.
In CEST (UTC+2) ist Mitternacht lokal = 22:00 UTC Vortag → alle Tages-Keys waren um 1 Tag verschoben.

**Fix:** Lokale Datum-Hilfsfunktion `toLocalDateKey(d: Date)` im TerminStore:
```typescript
function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
```
Wird für alle Tages-Vergleiche im Store und der Liste-Komponente verwendet.
Außerdem: `filter(t => toLocalDateKey(new Date(t.beginn)) === key)` statt `t.beginn.startsWith(key)`.
