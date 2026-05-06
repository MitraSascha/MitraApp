---
type: project
updated: 2026-04-28
---

## Abhängigkeiten & Zugangsdaten-Status

### Externe Dienste

| Dienst | Status | Wo benötigt | Hinweis |
|---|---|---|---|
| Claude CLI Token | ✅ Aktiv | Django Docker (KI-Features) | OAuth-Token in `C:\Users\sasch\.claude` — Volume-Mount `C:/Users/sasch/.claude:/root/.claude:ro` (read-only) |
| RAGflow API-Key | ✅ In .env | Phase 2 Chat + Phase 3 Angebote | `ragflow-YyZDllNGQ0NDFhMzExZjFhNDExNGU4ZT` |
| RAGflow URL | ✅ Bestätigt | Phase 2 + 3 | `https://ragflow.eigene-tools.pro` |
| HERO CRM API Token | ✅ In .env | Termin-Sync | `Bearer ac_KKhAIaTtzEoPIiylp4fwZUB89hpLW92I` |
| ANTHROPIC_API_KEY | ⚠️ Leer | .env — als Fallback | Aktuell nicht nötig (Claude CLI läuft via OAuth), aber in requirements.txt + Dockerfile vorbereitet |
| Strato Server SSH | ➖ Entfällt | — | Deploy macht User manuell |

### Lokale Dienste

| Dienst | Status | Verbindung |
|---|---|---|
| PostgreSQL (mitra) | ✅ Läuft | Docker, Port 5432, DB: `mitra`, User: `mitra`, PW: `mitra2024` |
| PostgreSQL Artikelstamm | ✅ Strato-Server | `85.215.195.50:5433`, DB: `artikelstamm`, User: `artikelstamm`, PW: `artikelstamm2024` |
| Ollama + Qwen2.5 | ✅ Vorhanden | Lokal, via WireGuard erreichbar |
| nomic-embed-text | ✅ Vorhanden | Über Ollama |
| RAGflow Instanz | ✅ Vorhanden | Auf Strato |

### Docker-Container (Pironi-Stack)

| Container | Status | Hinweis |
|---|---|---|
| `pironi-django-1` | ✅ Läuft | Uvicorn, Port 8101 |
| `pironi-postgres-1` | ✅ Läuft | Port 5432 |
| `pironi-nginx-1` | ✅ Läuft | Reverse Proxy |
| `pironi-frontend-1` | ✅ Läuft | Angular PWA |

### Manuell installiert (nicht im Image)

> **Wichtig:** Der Docker Build schlägt aktuell wegen apt-get Netzwerkfehler fehl.
> Folgendes wurde manuell in den laufenden Container `pironi-django-1` installiert:

| Package | Wie installiert | In requirements.txt? | In Dockerfile? |
|---|---|---|---|
| `anthropic==0.40.*` | `pip install` direkt | ✅ Ja | — |
| `nodejs 20.x` | `apt-get` direkt | — | ✅ Ja |
| `claude` CLI | `npm install -g @anthropic-ai/claude-code` | — | ✅ Ja |

→ Beim nächsten erfolgreichen `docker compose build` werden alle Packages automatisch installiert.

### Test-Zugangsdaten

| Benutzer | Passwort | Hinweis |
|---|---|---|
| Alle Test-User | `mitra2024` | Temporär für Entwicklung |

### Dateien (manuell zu beschaffen)

| Datei | Status | Wer beschafft |
|---|---|---|
| Datanorm v5 (Artikeldaten) | ❓ Ausstehend | Manuell vom Großhändler (Reisser o.ä.) |
| Preislisten (Datanorm) | ❓ Ausstehend | Manuell vom Großhändler |

### Assets

| Asset | Pfad | Zielort |
|---|---|---|
| `Visitenkarte.glb` | `W:\Dev\Privat\Pironi\Visitenkarte.glb` | `mitra-app/src/assets/models/Visitenkarte.glb` |

---

## environment-Variablen (.env — aktueller Stand)

```
SECRET_KEY=7bC5QGdMa8-tNm_0kwdst3l1n3OJU1U8Ovx_sQyEdhoJXO1HhYjAylMvvunTKMCOx8E
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,django
DB_NAME=mitra
DB_USER=mitra
DB_PASSWORD=mitra2024
DB_HOST=postgres
DB_PORT=5432
ARTIKELSTAMM_DB_NAME=artikelstamm
ARTIKELSTAMM_DB_USER=artikelstamm
ARTIKELSTAMM_DB_PASSWORD=artikelstamm2024
ARTIKELSTAMM_DB_HOST=85.215.195.50
ARTIKELSTAMM_DB_PORT=5433
ANTHROPIC_API_KEY=          ← leer, aktuell nicht nötig
RAGFLOW_URL=https://ragflow.eigene-tools.pro
RAGFLOW_API_KEY=ragflow-YyZDllNGQ0NDFhMzExZjFhNDExNGU4ZT
RAGFLOW_CHAT_ID=45b9a5f640cc11f1b60c4e8e2f94e07a
HERO_API_TOKEN=Bearer ac_KKhAIaTtzEoPIiylp4fwZUB89hpLW92I
VAPID_PRIVATE_KEY=cN8rRZNKJiZ---AIfkBdUveqOqT9UnoUxug_VOlz9tU
VAPID_PUBLIC_KEY=BIYg7yieiGd0c5s_QXZodyJYTkF_E6EE0BBtuUvD1i1E6e2iX3vfdty5fdeK05dOKK1k5sIgzGr72oum9R7D3zM
VAPID_SUBJECT=mailto:dev@mitra-app.local
```
