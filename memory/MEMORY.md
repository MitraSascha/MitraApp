# Memory-Index — MitraApp

Dieser Index wird ausschließlich von der **Manager-KI** gepflegt.
Alle Memory-Dateien sind unter `memory/` abgelegt.

---

## Projekt-Memory

| Datei | Inhalt | Zuletzt aktualisiert |
|---|---|---|
| [project_status.md](project/project_status.md) | Aktueller Projektstatus, offene Aufgaben | 2026-04-28 |
| [project_decisions.md](project/project_decisions.md) | Architektur- & Technologieentscheidungen + HERO API Erkenntnisse | 2026-04-28 |
| [project_dependencies.md](project/project_dependencies.md) | Abhängigkeiten, Zugangsdaten, manuell installierte Packages | 2026-04-28 |

---

## Subagent-Memory

| Datei | Agent | Modul | Status |
|---|---|---|---|
| [research_technologie_stack.md](subagents/research_technologie_stack.md) | research | Technologie-Stack | ✅ completed |
| [architect_gesamtarchitektur.md](subagents/architect_gesamtarchitektur.md) | architect | Gesamtarchitektur | ✅ completed |
| [state_phase1.md](subagents/state_phase1.md) | state/manager | Phase 1 komplett | ✅ completed |
| [state_phase2_3.md](subagents/state_phase2_3.md) | state/manager | Phase 2+3 komplett | ✅ completed |
| [code_hero_sync_backend.md](subagents/code_hero_sync_backend.md) | code | HERO CRM Sync (inkl. Bugfixes) | ✅ completed |
| [debug_2026-04-28.md](subagents/debug_2026-04-28.md) | debug | Bugfixes vom 2026-04-28 | ✅ completed |

---

## Lesehinweis für Subagents

Bevor ein Subagent mit seiner Aufgabe beginnt:
1. `MEMORY.md` lesen (dieser Index)
2. Relevante `project/`-Dateien lesen
3. Alle `subagents/`-Dateien lesen, die das eigene Modul betreffen
4. Erst dann mit der Arbeit beginnen
