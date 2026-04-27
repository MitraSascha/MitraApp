---
type: project
updated: 2026-04-26
---

## Abhängigkeiten & Zugangsdaten-Status

### Externe Dienste

| Dienst | Status | Wo benötigt | Hinweis |
|---|---|---|---|
| Claude CLI Token | ✅ Bestätigt | Django Docker (Phase 1) | OAuth-Token in `C:\Users\sasch\.claude\.credentials.json` — Docker Volume-Mount `~/.claude:/root/.claude:ro` |
| RAGflow API-Key | ✅ Bestätigt | Phase 2 Chat + Phase 3 Angebote | Schlüssel bekannt — in `.env` eintragen |
| RAGflow URL | ✅ Bestätigt | Phase 2 + 3 | `https://ragflow.eigene-tools.pro` |
| HERO CRM API Token | ⏳ Ausstehend | Phase 1 Termin-Sync | User trägt Token selbst in `.env` ein |
| Strato Server SSH | ➖ Entfällt | — | Deploy macht User manuell |

### Lokale Dienste (bereits vorhanden)

| Dienst | Status | Verbindung |
|---|---|---|
| PostgreSQL Artikelstamm | ✅ Vorhanden | `localhost:5433`, DB: `artikelstamm`, User: `artikelstamm` |
| Ollama + Qwen2.5 | ✅ Vorhanden | Lokal, via WireGuard erreichbar |
| nomic-embed-text | ✅ Vorhanden | Über Ollama |
| RAGflow Instanz | ✅ Vorhanden | Auf Strato, URL noch einzutragen |

### Dateien (manuell zu beschaffen)

| Datei | Status | Wer beschafft |
|---|---|---|
| Datanorm v5 (Artikeldaten) | ❓ Ausstehend | Manuell vom Großhändler (Reisser o.ä.) |
| Preislisten (Datanorm) | ❓ Ausstehend | Manuell vom Großhändler |

### Assets (vorhanden)

| Asset | Pfad | Zielort |
|---|---|---|
| `Visitenkarte.glb` | `w:\Dev\Privat\Pironi\Visitenkarte.glb` | `mitra-app/src/assets/models/Visitenkarte.glb` |

---

## environments-Variablen (Platzhalter — vor Deploy ausfüllen)

```
RAGFLOW_URL=https://ragflow.eigene-tools.pro
RAGFLOW_API_KEY=ragflow-YyZDllNGQ0NDFhMzExZjFhNDExNGU4ZT
HERO_API_TOKEN=<user trägt ein>
DB_ARTIKELSTAMM_HOST=localhost
DB_ARTIKELSTAMM_PORT=5433
DB_ARTIKELSTAMM_NAME=artikelstamm
DB_ARTIKELSTAMM_USER=artikelstamm
DB_ARTIKELSTAMM_PASSWORD=artikelstamm2024
```
*(Claude CLI läuft über Volume-Mount von `~/.claude` — kein separater API-Key im Env nötig)*
