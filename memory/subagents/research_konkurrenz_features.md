---
type: subagent-memory
agent: research
modul: konkurrenzanalyse-features-mitraapp
created: 2026-05-04
status: completed
---

## Was wurde getan

Umfassende Marktanalyse von 6 etablierten Konkurrenz-Apps und 20+ Speziallösungen.

## Ergebnisse / Outputs

### 1. KONKURRENZ-ANALYSE

**Top 6 Apps: openHandwerk, Craftnote, PlanRadar, Fieldwire, Craftboxx, Baubuddy**

Kerninsight: Keine kombiniert KI + Aufmaß + PWA-Offline.

### 2. FEATURE-CLUSTER

#### A. AUFMASS (P1 - KRITISCH)
- Sketch-basiert + Foto + Maße
- Claude Vision Auto-Extraktion
- Offline, Auto-Sync
- Timeline: 4-6 Wochen
- Gap: 100% Konkurrenz hat es

#### B. BAUSTELLENBERICHTE (P1 - KRITISCH)
- Tagesbericht-Template
- Mängel-Erfassung
- Unterschrift-Integration
- Timeline: 6-8 Wochen

#### C. FOTODOKUMENTATION (P2 - HOCH)
- Vorher-Nachher
- Auto-Annotation
- Claude Vision Tags
- Timeline: 8-10 Wochen

#### D. STÜCKLISTEN-GENERATOR (P3 - MITTEL, DIFFERENZIERUNG!)
- AI aus Aufmaß + Notiz
- Regel-Engine
- Timeline: 12-16 Wochen
- UNIQUE: Niemand bietet das

#### E. WEITERE FEATURES
- Zeiterfassung: P3 (Sprint 6-7)
- Unterschrift: P2 (Sprint 5)
- QR-Payment: P4 (Backlog)

### 3. TECHNISCHE ERKENNTNISSE

#### A. PWA OFFLINE-SYNC
- Service Worker + Background Sync API
- Queue Offline-Aktionen
- Auto-Upload mit Retry
- Angular 18+ Improvements

#### B. HERO CRM INTEGRATION
- Termin-Sync (bestehend)
- Auftrags-Daten lesen
- Bautagebücher zurück sync
- OAuth REST-API

#### C. CLAUDE VISION
- Aufmaß-Formular-Scan
- Materialrechnung-Scan
- Keine Präzisions-Messungen

## Wichtige Entscheidungen

1. Aufmaß ist P1 - größtes Gap
2. KI ist Differenzierungsfaktor
3. Offline-PWA ist Tech-Vorteil
4. 6-Monats-Roadmap definiert

## Übergabe für Architect & Code Specialist

### Architect:
- Aufmaß v1 Feature-Spec
- PWA Background-Sync Design
- Hero API Integration
- Data-Model Design

### Code Specialist:
- Aufmaß-Modul implementieren
- Service Worker Background-Sync
- Foto-Deduplizierung
- Claude Vision Integration

## Zusammenfassung für Manager KI

### Top 3 Erkenntnisse:

1. Aufmaß ist kritisches Gap (alle Konkurrenten haben es)
2. KI ist Differenzierungsfaktor (intelligente Stücklisten, Struktur, Analyse)
3. Offline-PWA ist Marktführer-Position

### 6-Monats-Roadmap:
- M1-2: Aufmaß MVP
- M2-3: Bautagebuch + Unterschrift
- M3-4: Fotodokumentation
- M4-5: Zeiterfassung + Checklisten
- M5-6: KI-Stücklisten + Launch

**Research abgeschlossen: 2026-05-04**
