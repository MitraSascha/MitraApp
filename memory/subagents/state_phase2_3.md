---
type: subagent-memory
agent: state
modul: phase2-3-vollstaendig
created: 2026-04-27
status: completed
---

## Was wurde getan

Phase 2.1–3.4 vollständig implementiert.

## Ergebnisse / Outputs

### Phase 2.1 — Visitenkarten-Modul

- `features/visitenkarten/stores/visitenkarten.store.ts` — VisitenkartenStore
- `features/visitenkarten/services/visitenkarten.service.ts` — Offline-First CRUD + KI-Upload
- `features/visitenkarten/visitenkarte-viewer/` — @google/model-viewer Web Component (CUSTOM_ELEMENTS_SCHEMA)
- `features/visitenkarten/foto-upload/` — camera capture, FileReader preview, KI-Auslese
- `features/visitenkarten/visitenkarten-liste/` — Suche, Liste mit Tags
- `features/visitenkarten/visitenkarte-detail/` — Formular + 3D-Viewer Toggle + Foto-Upload
- `features/visitenkarten/visitenkarten.routes.ts` — Echte Routes (kein Stub mehr)
- `mitra-app/src/assets/models/Visitenkarte.glb` — GLB aus Projektroot kopiert
- Backend: `apps/kontakte/` — Kontakt-Modell, Serializer, ViewSet
- Backend: `apps/ki/views.py` — `lese_visitenkarte_view` (Vision per Claude CLI + Base64)
- Backend: `apps/ki/claude_service.py` — `lese_visitenkarte()` Funktion

### Phase 2.2 — RAGflow Chat (Wissensdatenbank)

- `features/wissen/stores/wissen.store.ts` — WissenStore: nachrichten, sessionId, isStreaming
- `features/wissen/services/wissen.service.ts` — sendeFrageStreaming() via SSE
- `features/wissen/chat-bubble/` — Streaming-Cursor-Animation, Quellen-Anzeige
- `features/wissen/chat/` — Chat-Interface mit Textarea (Enter=Senden, Shift+Enter=Newline)
- `features/wissen/wissen.routes.ts` — Echte Routes
- Backend: `apps/wissen/` — RAGflow SSE-Proxy (httpx.stream), StreamingHttpResponse

### Phase 2.3 — Artikelstamm

- `core/services/artikel.service.ts` — Suche Online+Offline (IndexedDB Cache), ladeArtikel
- Backend: `apps/artikel/` — PostgreSQL FTS-Suche (Port 5433, psycopg2 direkt), Suche + Detail

### Phase 3 — Angebotserstellung

- `features/angebote/stores/angebote.store.ts` — AngeboteStore: entwuerfe/gesendete/abgeschlossene computed
- `features/angebote/services/angebote.service.ts` — CRUD, erstelleAusNotiz(), PDF-Export, addPosition/updatePosition/removePosition
- `features/angebote/angebote-liste/` — Tab-Bar (Entwürfe/Gesendet/Abgeschlossen), Status-Badges
- `features/angebote/angebot-editor/` — KI-Panel (aus Notiz generieren), Positionsliste inline editable, Summen
- `features/angebote/angebote.routes.ts` — Echte Routes
- Backend: `apps/angebote/models.py` — Angebot (positionen als JSONField)
- Backend: `apps/angebote/ki_pipeline.py` — 2-stufige Claude-Pipeline: Suchbegriffe → Artikelsuche → Positionen
- Backend: `apps/angebote/views.py` — AngebotViewSet + erstellen-aus-notiz Action + pdf Action
- Backend: `apps/angebote/templates/angebote/angebot_pdf.html` — WeasyPrint Mitra-Branding PDF
- Backend: `mitra/settings.py` — TEMPLATES hinzugefügt (APP_DIRS=True)

### Django Gesamtstruktur jetzt

```
backend/apps/
  notizen/    — NotizViewSet + KI-Strukturierung
  termine/    — TerminViewSet
  kontakte/   — KontaktViewSet
  angebote/   — AngebotViewSet + KI-Pipeline + PDF
  ki/         — lese_visitenkarte, strukturiere_notiz, transkribiere
  push/       — Web Push VAPID
  wissen/     — RAGflow SSE-Proxy
  artikel/    — Artikelstamm FTS (psycopg2 direkt, Port 5433)
```

## Wichtige Entscheidungen

- RAGflow: OpenAI-compatible API (chats_openai Endpoint mit stream=True)
- Artikelstamm: kein Django ORM — direktes psycopg2 auf Port 5433
- Angebots-PDF: WeasyPrint mit Django-Template (APP_DIRS=True in settings)
- KI-Visitenkarte: Base64-Encoding direkt im Prompt (Claude CLI Vision)
- SSE-Parser im Angular Service: Zeilen-basiertes Parsen mit Buffer

## Übergabe-Hinweise

- RAGFLOW_CHAT_ID muss in .env eingetragen werden
- Artikelstamm-DB muss mit Datanorm-Daten befüllt sein (manuell)
- Visitenkarte.glb ist in assets/models/ — muss bei ng build in dist landen (assets-Config in angular.json prüfen)

## Offene Punkte

- Phase 2.4 + 3.5: Tests (Unit, Integration, E2E) noch nicht implementiert
- Phase 4: Erweiterungen (Rechnung, Plantafel, Routen, Preisvergleich)
- CDK Drag & Drop für Positions-Reihenfolge (optionale Verbesserung)
