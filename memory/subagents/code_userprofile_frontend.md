---
type: subagent-memory
agent: code
modul: userprofile-frontend / termine-hero-sync
created: 2026-04-27
status: completed
---

## Was wurde getan

Zwei Dateien im Angular-Frontend wurden gezielt angepasst:

1. `AppUser`-Interface um das optionale Feld `hero_partner_id` erweitert.
2. `TermineService` um die Methode `heroSync()` ergänzt und `ladeAlle()` so angepasst, dass HERO CRM Sync automatisch ausgelöst wird wenn der Nutzer eine `hero_partner_id` besitzt und online ist.

## Ergebnisse / Outputs

- **Geändert:** `W:\Dev\Privat\Pironi\mitra-app\src\app\core\models\user.model.ts`
  - `hero_partner_id?: string` nach `rolle` eingefügt (optionales Feld, kein Breaking Change)

- **Geändert:** `W:\Dev\Privat\Pironi\mitra-app\src\app\features\termine\services\termine.service.ts`
  - `ladeAlle()`: Nach lokalem DB-Load wird `heroSync()` aufgerufen, wenn `navigator.onLine && hero_partner_id` vorhanden
  - Neue Methode `heroSync()`: ruft `POST /api/termine/hero-sync/` auf, lädt danach Server-Daten neu (`GET /termine/`), schreibt in IndexedDB und Store; schlägt still fehl bei Fehler

## Wichtige Entscheidungen

- `AuthService` war bereits korrekt per `inject(AuthService)` eingebunden — kein zusätzlicher Import nötig
- `heroSync()` wird in `ladeAlle()` VOR dem regulären Server-Pull aufgerufen, damit die anschliessende `GET /termine/` bereits synchronisierte Daten enthält
- Fehlerbehandlung in `heroSync()` ist bewusst leer (kein Re-Throw), da HERO Sync ein optionales Feature ist

## Übergabe-Hinweise

- Das Backend muss den Endpoint `POST /api/termine/hero-sync/` implementieren, der anhand des authentifizierten Users dessen `hero_partner_id` liest und HERO CRM abfragt
- Der Endpoint sollte idempotent sein (mehrfaches Aufrufen ohne Nebenwirkungen)
- `hero_partner_id` wird vom Backend beim Login/Me-Endpoint im User-Objekt mitgeliefert — das Backend muss dieses Feld ebenfalls in der User-Serializer-Response ergänzen

## Offene Punkte

- Backend-Endpoint `POST /api/termine/hero-sync/` noch nicht implementiert
- Django `AppUser`-Model braucht ebenfalls das Feld `hero_partner_id` (CharField, blank=True)
- Testing-Agent muss Unit-Test für `heroSync()` schreiben (Erfolgs- und Fehlerfall)
