---
type: project
updated: 2026-04-28
phase: 4
---

## Status

Phasen 1–4.1 vollständig implementiert und in Produktion getestet. Mehrere kritische Bugs wurden
am 2026-04-28 durch Live-Testing gefunden und behoben (HERO Sync, Timezone, Claude CLI).

## Abgeschlossen

- App-Idee, Planung, Ablaufplan, CLAUDE.md, Memory-System ✅
- Phase 0.1: Angular Projekt + PWA + Design-Tokens ✅
- Phase 0.2: Technologie-Recherche ✅
- Phase 0.3: Gesamtarchitektur ✅
- **Phase 1: MVP** — Notizen, Termine, Dashboard, Auth, Sync, Push ✅
- **Phase 2.1: Visitenkarten** — Liste, Detail, Foto-Upload, 3D-Viewer, KI-Auslese ✅
- **Phase 2.2: RAGflow Chat** — SSE-Streaming, ChatBubble, Django-Proxy ✅
- **Phase 2.3: Artikelstamm** — Angular ArtikelService + Django FTS-Endpoint ✅
- **Phase 3.1–3.5: Angebote** — Store, KI-Pipeline, Editor, PDF-Export, Backend ✅
- **Phase 4.1: HERO CRM Integration** — GraphQL Sync, UserProfile, Frontend-Trigger ✅
- **Bugfix 2026-04-28: HERO GraphQL Query** — echte Feldnamen per Introspection ermittelt und korrigiert ✅
- **Bugfix 2026-04-28: HERO Timezone** — HERO gibt Berliner Lokalzeit als +00:00 zurück → wird beim Einlesen korrekt als Europe/Berlin lokalisiert ✅
- **Bugfix 2026-04-28: Frontend Timezone** — `toISOString().slice(0,10)` durch lokale Datumsformatierung ersetzt (Store + Komponente) ✅
- **Bugfix 2026-04-28: Claude CLI im Docker** — Node.js + Claude CLI installiert, read-only ~/.claude Mount → Credentials werden nach /tmp/claude_home kopiert ✅
- **Bugfix 2026-04-28: lese_visitenkarte** — nutzt jetzt Claude CLI mit @-Dateireferenz statt Base64-in-Text-Prompt ✅

## Neue Backend-Endpoints

```
POST /api/ki/lese-visitenkarte/          ← Visitenkarte per Vision (Claude CLI)
GET  /api/kontakte/                       ← Kontakte CRUD
POST /api/kontakte/
PUT  /api/kontakte/{id}/
DELETE /api/kontakte/{id}/
POST /api/wissen/chat/                    ← RAGflow SSE-Chat-Proxy
POST /api/termine/hero-sync/             ← HERO CRM GraphQL Termin-Sync
POST /api/termine/check-reminders/       ← Push Notification Trigger
GET  /api/artikel/suche/?q=...           ← Artikelstamm FTS
GET  /api/artikel/{artnr}/
GET  /api/angebote/                       ← Angebote CRUD
POST /api/angebote/erstellen-aus-notiz/  ← KI-Pipeline
GET  /api/angebote/{id}/pdf/             ← WeasyPrint PDF
```

## Offen

### Phase 4 — Erweiterungen (nicht implementiert)
- Angebot → Rechnung (nach Auftragserteilung)
- Plantafel für Kollegen (Gantt-ähnlich)
- Routen-Integration (Google Maps Deeplink in Termin-Detail)
- Lieferanten-Preisvergleich

### Tests (noch nicht implementiert)
- Unit Tests: Stores, Services
- E2E Tests: Foto-Upload, Chat, Angebots-Pipeline

## Blocker

- `hero_crm_id` im Termin-Model hat kein `unique=True` — bei Duplikaten gibt `update_or_create` Exception. Migration nötig für Produktion.
- HERO Partner-IDs: Admin muss für jeden Monteur im Django Admin hinterlegt werden
- Datanorm v5: manuell beim Großhändler beschaffen
- faster-whisper GPU/CPU auf Strato klären
- Docker `build` schlägt aktuell fehl (apt-get Netzwerkfehler) — Claude CLI + anthropic SDK sind manuell im laufenden Container installiert. Beim nächsten erfolgreichen Build sind beide in requirements.txt + Dockerfile bereits vorbereitet.
