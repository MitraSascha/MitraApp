# MitraApp — CLAUDE.md
**Verhaltensregeln für Manager-KI und alle Subagents**

---

## Rollen

### Manager-KI
- Koordiniert das gesamte Projekt
- Delegiert Aufgaben an spezialisierte Subagents
- Startet **maximal 3 Subagents gleichzeitig**
- Liest Berichte der Subagents und entscheidet über nächste Schritte
- Schreibt und pflegt ausschließlich die **Projekt-Memory**
- Erstellt und pflegt die Dokumentation in `docs/`

### Subagents
- Jeder Subagent kümmert sich **ausschließlich um seine zugewiesene Aufgabe**
- Kein Subagent greift in den Zuständigkeitsbereich eines anderen ein
- Jeder Subagent **erstellt nach Abschluss seiner Aufgabe eine eigene Memory-Datei**
- Subagents kommunizieren nicht direkt miteinander — nur über Manager-KI und Memory-Dateien

---

## Subagent-Übersicht & Zuständigkeiten

| Subagent | Zuständigkeit | Darf NICHT |
|---|---|---|
| `angular-agents:research-agent` | Webrecherche, Bibliotheken, Best Practices | Code schreiben, Architektur entscheiden |
| `angular-agents:angular-architect` | Architekturplanung, Interfaces, Modulstruktur | Code implementieren, Tests schreiben |
| `angular-agents:code-specialist` | HTML, SCSS, TypeScript implementieren | Architektur ändern, Tests schreiben |
| `angular-agents:state-manager` | Signals / NgRx State planen & implementieren | Komponenten bauen, Architektur entscheiden |
| `angular-agents:testing-agent` | Unit-, Integration-, E2E-Tests schreiben | Produktionscode ändern |
| `angular-agents:angular-debugger` | Fehleranalyse & Fixes | Features hinzufügen, Architektur ändern |

---

## Parallelisierungsregel

```
Max. 3 Subagents gleichzeitig aktiv.

Erlaubt (Beispiel):
  research-agent + angular-architect + state-manager  ✓

Nicht erlaubt:
  4 oder mehr Subagents parallel                      ✗
```

Sequenziell wenn Abhängigkeit besteht:
```
research-agent → (Bericht) → angular-architect → (Architektur-Bericht) → code-specialist
```

---

## Verzeichnisstruktur

```
w:\Dev\Privat\Pironi\
│
├── CLAUDE.md                          ← Diese Datei (Verhaltensregeln)
│
├── doku/                              ← Planungs- & Projektdokumentation
│   ├── ablaufplan_subagents.md        ← Entwicklungs-Ablaufplan
│   ├── app_idee.md                    ← Ursprüngliche App-Idee
│   ├── MitraApp_Planung.md            ← Ausgearbeitete Planung
│   ├── ragflow_docu.md                ← RAGflow API-Dokumentation
│   └── artikelstamm_docu.md          ← PostgreSQL Artikelstamm-Dokumentation
│
├── memory/                            ← Memory-System
│   ├── MEMORY.md                      ← Index aller Memory-Dateien (Manager-KI pflegt)
│   ├── project/                       ← Projekt-Memory (nur Manager-KI schreibt)
│   │   ├── project_status.md          ← Aktueller Projektstatus & offene Aufgaben
│   │   ├── project_decisions.md       ← Getroffene Architektur- & Tech-Entscheidungen
│   │   └── project_dependencies.md    ← Abhängigkeiten, Zugangsdaten-Status
│   └── subagents/                     ← Subagent-Memory (jeweiliger Subagent schreibt)
│       ├── research_<thema>.md        ← research-agent Memory
│       ├── architect_<modul>.md       ← angular-architect Memory
│       ├── code_<modul>.md            ← code-specialist Memory
│       ├── state_<modul>.md           ← state-manager Memory
│       ├── testing_<modul>.md         ← testing-agent Memory
│       └── debug_<issue>.md           ← angular-debugger Memory
│
├── docs/                              ← Technische Dokumentation (Manager-KI erstellt)
│   ├── api/                           ← Backend API-Dokumentation
│   ├── components/                    ← Angular Komponenten-Dokumentation
│   └── architecture/                  ← Architektur-Diagramme & Entscheidungen
│
└── mitra-app/                         ← Angular Projekt (wird in Phase 0.1 angelegt)
```

---

## Memory-System

### Projekt-Memory (nur Manager-KI)

**Dateipfad:** `memory/project/`

Manager-KI schreibt Projekt-Memory nach:
- Abschluss einer Phase
- Wichtigen Architekturentscheidungen
- Änderungen am Ablaufplan
- Neu bekannten Abhängigkeiten oder Blockern

**Format Projekt-Memory-Datei:**
```markdown
---
type: project
updated: YYYY-MM-DD
phase: 0 | 1 | 2 | 3 | 4
---

## Status
[Kurze Beschreibung was gerade steht]

## Abgeschlossen
- [Was fertig ist]

## Offen
- [Was noch aussteht]

## Entscheidungen
- [Getroffene Entscheidungen mit Begründung]

## Blocker
- [Was blockiert ist und warum]
```

---

### Subagent-Memory (jeweiliger Subagent)

**Dateipfad:** `memory/subagents/<subagent>_<thema>.md`

Jeder Subagent erstellt **am Ende seiner Aufgabe** eine Memory-Datei.
Diese wird vom nächsten Subagent gelesen, bevor er mit seiner Arbeit beginnt.

**Format Subagent-Memory-Datei:**
```markdown
---
type: subagent-memory
agent: research | architect | code | state | testing | debug
modul: <modulname>
created: YYYY-MM-DD
status: completed | partial
---

## Was wurde getan
[Kurze Zusammenfassung der erledigten Aufgabe]

## Ergebnisse / Outputs
[Dateipfade, wichtige Erkenntnisse, erstellte Strukturen]

## Wichtige Entscheidungen
[Was wurde entschieden und warum]

## Übergabe-Hinweise
[Was der nächste Subagent wissen muss, bevor er anfängt]

## Offene Punkte
[Was nicht erledigt wurde / für später notwendig]
```

---

## Dokumentationsregeln

- Jedes implementierte Modul bekommt einen Eintrag in `docs/components/`
- Jeder Django-Endpoint wird in `docs/api/` dokumentiert
- Architekturentscheidungen werden in `docs/architecture/` festgehalten
- Manager-KI aktualisiert `memory/MEMORY.md` (Index) nach jeder neuen Memory-Datei

---

## DSGVO-Pflicht (für alle Subagents verbindlich)

Vor **jedem** Claude CLI-Aufruf mit Nutzerdaten gilt:

```
1. PII-Filter über den Text laufen lassen
2. Namen, Adressen, Telefon → Platzhalter ersetzen
3. Erst dann → Claude CLI
```

Speicherung auf Strato-Server, Home-Server, lokalem PC ist unbeschränkt erlaubt.
Personenbezogene Daten verlassen den Server **niemals unzensiert**.

---

## Technologie-Stack (Kurzreferenz)

| Bereich | Technologie |
|---|---|
| Frontend | Angular 19+ PWA (Standalone Components) |
| Backend | Django REST Framework |
| Datenbank | PostgreSQL (Auth/Notizen) + PostgreSQL Strato 85.215.195.50:5433 (Artikelstamm) |
| Wissensdatenbank | RAGflow (Strato-Server) |
| KI | Claude CLI (`claude -p`) in Docker, Token vom Host |
| Offline | IndexedDB + Workbox Service Worker |
| Push | Web Push API (pywebpush im Backend) |
| PDF | WeasyPrint |
| 3D Visitenkarte | `@google/model-viewer` + `Visitenkarte.glb` |
| Design | Anthrazit `#1C2128` + Orange `#E8700A`, IBM Plex Sans / Inter |

---

## Ablaufplan

Detaillierter Entwicklungs-Ablaufplan: `doku/ablaufplan_subagents.md`
