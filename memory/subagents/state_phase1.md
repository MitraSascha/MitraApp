---
type: subagent-memory
agent: state
modul: phase1-stores
created: 2026-04-27
status: completed
---

## Was wurde getan

Phase 1.1–1.7 vollständig implementiert (Manager-KI direkt, da angular-agents nur als Skills verfügbar).

## Ergebnisse / Outputs

### Modelle (core/models/)
- user.model.ts, notiz.model.ts, termin.model.ts, kontakt.model.ts
- angebot.model.ts, artikel.model.ts, chat.model.ts, sync.model.ts
- hersteller.constants.ts (HERSTELLER_SANITAER/HEIZUNG/KLIMA, AUDIO_FORMATS)

### Datenbank (core/db/)
- mitra-db.service.ts — Dexie.js v4, 8 Tabellen, Compound-Indexes

### Stores (Angular Signals)
- shared/ui/ui.store.ts — isOnline, activeTab, isGlobalLoading, toastMessage
- features/notizen/stores/notizen.store.ts — notizen, aktiveNotiz, offeneAufgaben computed
- features/termine/stores/termine.store.ts — termine, heutigeTermine, morgigTermine computed
- features/dashboard/stores/dashboard.store.ts — aggregiert NotizStore + TerminStore

### Core Services
- auth.service.ts — JWT Login/Logout/Refresh, Signal-basiert
- api.service.ts — HttpClient-Wrapper inkl. SSE-Streaming
- sync.service.ts — Offline-Queue, Online-Event, Background Sync, Foreground-Tick
- notification.service.ts — VAPID Web Push

### Interceptors & Guards
- jwt.interceptor.ts, refresh.interceptor.ts, offline.interceptor.ts
- auth.guard.ts

### Features (Phase 1)
- Auth: login.component (HTML + SCSS + TS), auth.routes.ts
- Notizen: notizen-liste, notiz-detail, notiz-editor, diktier-button, hersteller-pills
  - notizen.service.ts (Offline-First: IndexedDB → SyncQueue → Server)
- Termine: termine-liste, termin-detail (neu + bearbeiten)
  - termine.service.ts
- Dashboard: dashboard.component (Heute/Morgen Termine, offene Aufgaben, Quick-Actions)

### Stub-Routes (Phase 2/3 Platzhalter)
- angebote.routes.ts, visitenkarten.routes.ts, wissen.routes.ts

### App-Shell
- app.ts — Shell mit SyncService.init() + NotificationService.init()
- app.html — OfflineIndicator + RouterOutlet + BottomNav
- app.config.ts — HttpClient + Interceptors + Router + ngsw

### Shared Components
- bottom-nav.component (5 Tabs)
- offline-indicator.component

### Backend (backend/)
- Django 5.1 + DRF + SimpleJWT Setup
- models: Notiz, NotizFoto, Termin, PushSubscription
- views: NotizViewSet, TerminViewSet, LoginView, me_view
- ki/views: strukturiere_notiz_view, transkribiere_view
- ki/pii_filter.py — DSGVO-Pflicht PII-Filter
- ki/claude_service.py — Claude CLI + faster-whisper
- docker-compose.yml (postgres + django + nginx)
- Dockerfile mit Claude CLI Installation
- nginx.conf

## Wichtige Entscheidungen

- Dexie als npm-Paket installiert (war neu)
- uuid als npm-Paket installiert (für Frontend-UUIDs)
- environment.ts: apiBaseUrl → apiUrl umbenannt
- _tokens.scss: Alias-Variablen ergänzt für Komponenten-Kompatibilität
- Build erfolgreich: 0 Fehler nach 4 Fix-Iterationen

## Übergabe-Hinweise

- Backend ist konzipiert aber noch nicht deployed
- User muss .env aus .env.example erstellen und Secrets eintragen
- Django migrations noch nicht erstellt (erst nach PostgreSQL-Setup)
- faster-whisper Ressourcen (GPU/CPU Strato) noch zu klären
- HERO CRM API-Token fehlt noch (Phase 1.5 Sync)

## Offene Punkte für Phase 2

- Visitenkarten-Modul (Foto-Upload, 3D-Viewer, KI-Auslese)
- RAGflow-Chat (SSE Streaming, Session-Management)
- Artikelstamm-Service (Datanorm v5 Schema noch unbekannt)
- @google/model-viewer Integration
- Deploy auf Strato (User führt manuell durch)
