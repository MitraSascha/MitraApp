---
type: project
updated: 2026-04-26
---

## Architektur- & Technologieentscheidungen

### Frontend
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Framework | Angular 19+ PWA | Offline-Fähigkeit, Push Notifications, eine Codebase Web+Mobile |
| Komponenten-Stil | Standalone Components | Kein NgModule-Overhead, Angular 19+ Standard |
| State Management | Angular Signals | <30 User, kein komplexer Shared-State, kein NgRx nötig |
| Offline Storage | IndexedDB + Workbox | PWA-Standard, Background Sync |
| 3D Visitenkarte | `@google/model-viewer` | Web Component, kein Three.js Overhead, GLB-Support nativ |
| Styling | SCSS + CSS Custom Properties | Design-Token System für Farbpalette |
| Drag & Drop | `@angular/cdk/drag-drop` | Bereits in Angular CDK enthalten |

### Backend
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Framework | Django REST Framework | Bekannt, schnell entwickelbar |
| Auth | JWT (djangorestframework-simplejwt) | Standard, zustandslos |
| PDF-Export | WeasyPrint | Einfach, DSGVO-konform, Python-nativ |
| Push Notifications | pywebpush | Django-seitig, Web Push Standard |

### KI & Externe Services
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| KI-Aufruf | Claude CLI (`claude -p`) in Docker | Token vom Host, kein API-Key im Code |
| Wissensdatenbank | RAGflow (Strato-Server) | Bereits eingerichtet |
| Lokales Modell | Ollama + Qwen2.5 | Bereits eingerichtet, DSGVO-konform |
| Embeddings | nomic-embed-text via Ollama | Bereits eingerichtet |

### Infrastruktur
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Hosting | Strato Server (Docker) | Bereits vorhanden |
| VPN | WireGuard (Strato ↔ lokaler PC) | Für Ollama-Zugriff |
| Datenbank Artikelstamm | PostgreSQL Port 5433 (separater Container) | Datanorm v5 Daten |

### Design
| Entscheidung | Gewählt | Begründung |
|---|---|---|
| Primary Color | Anthrazit `#1C2128` | Handwerk-Ästhetik, Dark Mode |
| Accent Color | Orange `#E8700A` | Energie, Werkzeugmarken-Ästhetik (DeWalt, Hilti) |
| Font Headlines | IBM Plex Sans | Technisch, klar lesbar auf kleinen Screens |
| Font Body | Inter | Bewährt für UI |
| Font Monospace | JetBrains Mono | Artikelnummern, Code |
| Navigation | Bottom Navigation (Mobile) + Sidebar (Tablet/Desktop) | Mobile-First |
