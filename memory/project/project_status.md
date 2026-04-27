---
type: project
updated: 2026-04-27
phase: 4
---

## Status

Phasen 1–3 vollständig implementiert. Angular-Frontend und Django-Backend sind fertig.
Build läuft fehlerfrei (0 Fehler). Deploy (Phase 1.8) ist Aufgabe des Users.

## Abgeschlossen

- App-Idee, Planung, Ablaufplan, CLAUDE.md, Memory-System ✅
- Phase 0.1: Angular 21 Projekt + PWA + Design-Tokens + Fonts + Verzeichnisstruktur ✅
- Phase 0.2: Technologie-Recherche ✅
- Phase 0.3: Gesamtarchitektur ✅
- **Phase 1: MVP** — Notizen, Termine, Dashboard, Auth, Sync, Push ✅
- **Phase 2.1: Visitenkarten** — Liste, Detail, Foto-Upload, 3D-Viewer, KI-Auslese, Visitenkarte.glb ✅
- **Phase 2.2: RAGflow Chat** — WissenStore, SSE-Streaming, ChatBubble, Django-Proxy ✅
- **Phase 2.3: Artikelstamm** — Angular ArtikelService + Django FTS-Endpoint ✅
- **Phase 3.1: AngeboteStore + AngeboteService** — Signals, Offline-First, Summen-Berechnung ✅
- **Phase 3.2: KI-Pipeline** — 2-stufiger Claude CLI Dialog, Artikelstamm-Suche, Positionen generieren ✅
- **Phase 3.3: Angebots-Editor** — Positionen inline bearbeiten, KI-Generierung aus Notiz ✅
- **Phase 3.4: PDF-Export** — WeasyPrint + Django-Template (Mitra-Branding) ✅
- **Phase 3.5: Django Backend** — AngebotViewSet, KI-Endpoint, PDF-Action ✅
- **Django Backend vollständig** — Notizen, Termine, Kontakte, Angebote, KI, Push, Wissen, Artikel ✅
- Angular Build: 0 Fehler ✅
- **Phase 4.1: HERO CRM Integration** — UserProfile (hero_partner_id + rolle), Django Admin, HERO GraphQL Sync-Endpoint, Frontend-Sync-Trigger ✅
- **RAGflow Chat gefixt** — Caddy-Routing (/api/* → Port 9380), SSE-Parser (data: ohne Leerzeichen), Quellen-Anzeige ✅

## Neue Backend-Endpoints (Phase 2+3)

```
POST /api/ki/lese-visitenkarte/     ← Visitenkarte per Vision auslesen
GET  /api/kontakte/                  ← Kontakte (Visitenkarten-Modul)
POST /api/kontakte/
PUT  /api/kontakte/{id}/
DELETE /api/kontakte/{id}/
POST /api/wissen/chat/               ← RAGflow SSE-Chat-Proxy (mit Quellen)
POST /api/termine/hero-sync/         ← HERO CRM GraphQL Termin-Sync
GET  /api/artikel/suche/?q=...       ← Artikelstamm FTS
GET  /api/artikel/{artnr}/
GET  /api/angebote/                  ← Angebote CRUD
POST /api/angebote/erstellen-aus-notiz/  ← KI-Pipeline
GET  /api/angebote/{id}/pdf/         ← WeasyPrint PDF
```

## Deploy — User führt durch

```
1. Strato-Server: .env aus .env.example erstellen, Secrets eintragen
2. docker-compose up -d
3. python manage.py migrate
4. python manage.py createsuperuser
5. ng build --configuration=production
6. Dateien in nginx-Volume kopieren
```

## Offen

### Phase 4 — Erweiterungen (noch nicht implementiert)
- Angebot → Rechnung (nach Auftragserteilung)
- Plantafel für Kollegen (Gantt-ähnlich)
- Routen-Integration (Google Maps Deeplink in Termin-Detail)
- Lieferanten-Preisvergleich

### Tests (Phase 2.4 + 3.5 — noch nicht implementiert)
- Unit Tests: Stores, Services
- E2E Tests: Foto-Upload, Chat, Angebots-Pipeline

## Blocker

- HERO CRM GraphQL Felder: `calendar_events`-Schema unbekannt — muss gegen echten Endpoint geprüft werden (Schema-Introspection mit echtem Token). GraphQL-Query in `hero_sync.py` ggf. anpassen.
- HERO Partner-IDs: Admin muss für jeden Monteur im Django Admin (`/admin/`) hinterlegt werden
- Datanorm v5: manuell beim Großhändler beschaffen (für Artikelstamm)
- RAGflow API Key + URL + Chat-ID: User trägt in `.env` ein
- VAPID Keys generieren: `python -c "from pywebpush import Vapid; v=Vapid(); v.generate_keys(); print(v.private_key, v.public_key)"`
- faster-whisper GPU/CPU auf Strato klären (whisper 'small' als Fallback)
