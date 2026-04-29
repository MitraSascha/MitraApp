---
type: subagent-memory
agent: code
modul: push_frontend
created: 2026-04-29
status: completed
---

## Was wurde getan

Push-Notification Frontend komplett auf Angular's `SwPush` Service umgestellt. Push-Banner Komponente erstellt und in Dashboard eingebunden. VAPID Public Key in `environment.prod.ts` gesetzt.

## Ergebnisse / Outputs

- `src/app/core/services/notification.service.ts` — Komplett neu implementiert mit `SwPush`
- `src/app/shared/components/push-banner/push-banner.component.ts` — Neue Standalone Component
- `src/app/shared/components/push-banner/push-banner.component.html` — Banner Template
- `src/app/shared/components/push-banner/push-banner.component.scss` — Styling im Design-System
- `src/app/features/dashboard/dashboard.component.ts` — `PushBannerComponent` importiert
- `src/app/features/dashboard/dashboard.component.html` — `<app-push-banner>` an erster Stelle eingefügt
- `src/environments/environment.prod.ts` — VAPID Public Key gesetzt

## Wichtige Entscheidungen

- `SwPush.requestSubscription()` statt roher `pushManager.subscribe()` API — ngsw-worker.js empfängt Push-Events nur bei SwPush-Subscriptions
- `swPush.subscription` Observable in `init()` abonniert, um `_isSubscribed` Signal reaktiv zu halten
- `swPush.messages` Observable in `init()` abonniert für Foreground-Notifications via `new Notification()`
- Nach erfolgreichem `subscribe()` wird `dismissed.set(true)` gesetzt — Banner verschwindet automatisch
- `sendSubscriptionToServer()` als separate Methode entfernt — direkt in `subscribe()` inline

## Übergabe-Hinweise

- `SwPush` ist durch `provideServiceWorker` in `app.config.ts` bereits verfügbar — kein zusätzliches Setup nötig
- VAPID Public Key ist jetzt hardcoded in `environment.prod.ts` (nicht mehr via Docker ENV)
- Foreground-Notification funktioniert nur wenn `Notification.permission === 'granted'`
- `unsubscribe()` ruft `swPush.unsubscribe()` auf — kein manuelles `pushManager.getSubscription()` mehr nötig

## Offene Punkte

- `environment.ts` (Dev) hat noch keinen VAPID Key — für lokales Testen ggf. nachtragen
- iOS PWA: `SwPush` funktioniert erst ab iOS 16.4+ — `checkIosInstallStatus()` bleibt für Feature-Detection erhalten
- Push-Banner wird nicht session-persistent dismissed (kein localStorage) — nach Seiten-Reload erscheint er erneut wenn Permission noch `default`
