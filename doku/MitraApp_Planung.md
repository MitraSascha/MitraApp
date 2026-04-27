# MitraApp — Planungsdokument
**Interne SHK-Plattform für Mitra Sanitär GmbH**
Stand: April 2026 | Vertraulich

---

## 1. Marktanalyse & Wettbewerb

### Vergleichbare Produkte

| Produkt | Stärken | Schwächen | Relevanz für uns |
|---|---|---|---|
| **HERO Software** | Datanorm/IDS-Connect, Angebote per Drag & Drop, App für iOS/Android | Teuer, kein KI-Assistenz, kein RAG | Hoch — Direkt vergleichbar |
| **mfr®** | KI-gestützte Einsatzplanung, 800+ Kunden, Wartungsverträge | Ab 5 Techniker ausgelegt, monatl. Kosten | Mittel |
| **Handyman** | 45.000 Techniker in Europa, Offline-Fähigkeit | Keine KI, kein Dokumenten-Chat | Mittel |
| **Craftboxx** | SHK/Elektro-Fokus, Offline-First | Kein RAG, kein Angebots-KI | Mittel |
| **blue:solution** | Kostenlos für kleine Betriebe, IDS-Schnittstelle | Veraltet, keine KI | Gering |

### Was uns differenziert

Kein einziges Tool auf dem Markt kombiniert:
- **Diktiergerät → KI-Strukturierung** beim Aufmaß
- **RAG-basierte Angebotserstellung** aus Beispielangeboten
- **Visitenkarten-Scanner** mit KI-Auslese
- **Lokales KI-Modell** (DSGVO-konform, kein Cloud-Zwang)
- **Wissensdatenbank-Chat** (Betriebsanleitungen, Fehlercodes, internes Firmenwissen)

---

## 2. Feature-Übersicht mit Prioritäten

### Ranking-System
- 🔴 **Hoch** — Kernfunktion, ohne diese macht die App keinen Sinn
- 🟡 **Mittel** — Wichtig, aber nachrüstbar
- 🟢 **Gering** — Nice-to-have, Phase 2+

---

### Modul 1: Aufmaß & Notizen

| Feature | Priorität | Aufwand | Notizen |
|---|---|---|---|
| Diktiergerät → Transkription (Claude CLI) | 🔴 Hoch | Mittel | Kern des Moduls |
| KI-Strukturierung der Notiz (Produkte, Aufgaben, Termine) | 🔴 Hoch | Mittel | Claude API |
| Status-Toggle (offen / in Bearbeitung / erledigt) | 🔴 Hoch | Gering | Standard-Feature |
| Kategorien: Von wem, Thema | 🔴 Hoch | Gering | — |
| Freitext-Tab + KI-Text-Tab | 🟡 Mittel | Gering | — |
| Hersteller-Pillen (Sanitär: Grohe, Kaldewei; Heizung: Viessmann...) | 🟡 Mittel | Gering | Festcodierte Listen |
| Produkt-Label / Aufgabe / Termin / Notiz Dropdown | 🟡 Mittel | Gering | — |
| Termine aus Notizen → Dashboard | 🔴 Hoch | Mittel | Verknüpfung nötig |
| Offline-Fähigkeit (kein Netz beim Kunden) | 🔴 Hoch | Hoch | **K.O.-Kriterium!** |
| Foto-Anhang zur Notiz | 🟡 Mittel | Mittel | — |

**Wichtiger Hinweis aus Marktanalyse:**
Offline-First ist in der SHK-Branche nicht verhandelbar. Heizungskeller, Betonschächte, Altbauten — oft kein Netz. Notizen müssen lokal gespeichert und später synchronisiert werden.

---

### Modul 2: Visitenkarten

| Feature | Priorität | Aufwand | Notizen |
|---|---|---|---|
| Foto-Upload → KI-Auslese (Claude Vision) | 🔴 Hoch | Mittel | Killer-Feature |
| Formular (Firma, AP, Position, Mobil, Tel, Web, Mail, Adresse) | 🔴 Hoch | Gering | — |
| 3D-Visitenkarten-Visualisierung | 🟢 Gering | Hoch | Schön, aber nicht essenziell |
| Branche, Zusammenarbeit, Bewertung (5 Sterne) | 🟡 Mittel | Gering | — |
| Zuverlässigkeit (gering/mittel/hoch) | 🟡 Mittel | Gering | — |
| Notizfeld zum Kontakt | 🟡 Mittel | Gering | — |
| Letzte Interaktion / Datum | 🟡 Mittel | Gering | — |
| Export → CRM (HERO API) | 🟡 Mittel | Mittel | — |
| Suche & Filter nach Branche/Bewertung | 🟡 Mittel | Gering | — |
| Gesprächsnotizen zum Kontakt | 🟡 Mittel | Gering | Sehr nützlich |

**Empfohlene Zusatzfelder:**
- Erstellt am / Zuletzt kontaktiert
- Lieferant: ja/nein
- Zahlungsziel (für Lieferanten)
- Notizfeld "Kennen wir uns über..."
- Tags (frei vergebbar)

---

### Modul 3: Angebotserstellung

| Feature | Priorität | Aufwand | Notizen |
|---|---|---|---|
| Aufmaß-Notiz → Angebot umwandeln | 🔴 Hoch | Hoch | Kernwert |
| RAGFlow: Beispielangebote als Vorlage | 🔴 Hoch | Mittel | Semantische Suche |
| PostgreSQL Artikelstamm (Datanorm) | 🔴 Hoch | Hoch | Exakte Preise |
| Claude: Materialauswahl aus Kontext | 🔴 Hoch | Hoch | Function Calling |
| PDF-Export des Angebots | 🔴 Hoch | Mittel | — |
| Manuelle Nachbearbeitung vor Export | 🔴 Hoch | Mittel | Immer nötig |
| Angebot → Rechnung (nach Auftragserteilung) | 🟡 Mittel | Hoch | Phase 2 |
| Lieferanten-Preisvergleich | 🟢 Gering | Sehr hoch | Phase 3 |
| Fördermittel-Hinweis (BEG, KfW) automatisch | 🟡 Mittel | Gering | Nur Texterkennung |

---

### Modul 4: Wissensdatenbank-Chat

| Feature | Priorität | Aufwand | Notizen |
|---|---|---|---|
| Chat-Interface mit RAGFlow-Anbindung | 🔴 Hoch | Mittel | — |
| Betriebsanleitungen durchsuchbar | 🔴 Hoch | Gering | PDFs in RAGFlow |
| Fehlercode-Suche | 🔴 Hoch | Gering | Dito |
| Websuche-Integration (Claude CLI) | 🟡 Mittel | Mittel | Für aktuelle Infos |
| Quellen-Anzeige ("Gefunden in: Weishaupt WTC Seite 12") | 🟡 Mittel | Gering | RAGFlow liefert das |
| Chat-History speichern | 🟡 Mittel | Gering | — |
| Favoriten / Snippets speichern | 🟢 Gering | Mittel | — |

---

### Modul 5: Termine

| Feature | Priorität | Aufwand | Notizen |
|---|---|---|---|
| Termine erstellen/bearbeiten/löschen | 🔴 Hoch | Mittel | — |
| CRM-Sync (HERO API) | 🔴 Hoch | Mittel | Bereits Erfahrung |
| **Push-Benachrichtigungen** (Handy!) | 🔴 Hoch | Hoch | **Kritisch!** |
| Kalender-Ansicht (Tag/Woche/Monat) | 🟡 Mittel | Mittel | — |
| Termin-Typen (Notdienst, Aufmaß, Wartung...) | 🟡 Mittel | Gering | — |
| Erinnerungszeiten konfigurierbar | 🟡 Mittel | Gering | — |
| Kollegen-Termine sehen (Plantafel) | 🟢 Gering | Hoch | Phase 2 |
| Routen-Integration (Google Maps) | 🟢 Gering | Mittel | Phase 2 |

**Für Push-Benachrichtigungen:**
Entweder Progressive Web App (PWA) mit Web Push API, oder native App (React Native / Flutter). PWA ist einfacher zu starten.

---

### Modul 6: Dashboard

| Feature | Priorität | Aufwand | Notizen |
|---|---|---|---|
| Nächste Termine (heute/morgen) | 🔴 Hoch | Gering | — |
| Offene Aufgaben aus Notizen | 🔴 Hoch | Gering | — |
| KI-Tagesbriefing | 🟡 Mittel | Mittel | Claude generiert Zusammenfassung |
| Wetter (Open-Meteo API) | 🟡 Mittel | Gering | Für Außendienst relevant |
| Offene Angebote (Anzahl + Wert) | 🟡 Mittel | Gering | — |
| Notdienst-Schnellzugang | 🟡 Mittel | Gering | — |
| Letzte Aktivitäten | 🟢 Gering | Gering | — |

---

## 3. Technische Architektur

```
Mobile App (PWA / React Native)
         ↕
Django REST API Backend
    ├── Auth-Service (PostgreSQL)
    ├── Notizen-Service (PostgreSQL)
    ├── Kontakte-Service (PostgreSQL)
    ├── Angebots-Service
    │       ├── RAGFlow API (Beispielangebote)
    │       └── PostgreSQL (Datanorm Artikelstamm)
    ├── Termin-Service
    │       └── HERO CRM API
    └── KI-Service
            ├── Claude API (Strukturierung, Visitenkarte, Angebot)
            └── RAGFlow API (Wissensdatenbank-Chat)

Lokaler PC (Ollama)
    ├── Qwen3.5:9B (PII-Filter, lokale Anfragen)
    └── nomic-embed-text (Embeddings für RAGFlow)

Strato Server
    ├── RAGFlow (Wissensdatenbank)
    ├── Django Backend (Docker)
    └── WireGuard VPN → Lokaler PC
```

---

## 4. Design-System & UI-Konzept

### Designprinzipien

**Industrie-Utilitarian mit modernem Touch**
Die App wird von Handwerkern auf der Baustelle benutzt — mit dreckigen Händen, schlechtem Licht, Zeitdruck. Das Design muss darauf ausgelegt sein.

**Kernprinzipien:**
- Große Touch-Targets (min. 48x48px) — Bedienung mit Arbeitshandschuhen
- Hoher Kontrast — auch bei Sonnenlicht lesbar
- Wenige Klicks bis zur Kernfunktion — max. 2 Taps bis zum Diktieren
- Dark Mode als Standard — schont Akku, besser im Keller
- Offline-Indikator immer sichtbar

### Farbpalette

| Rolle | Farbe | Hex | Verwendung |
|---|---|---|---|
| Primary | Anthrazit | #1C2128 | Hintergründe, Navigation |
| Accent | Orange | #E8700A | CTAs, aktive States, Highlights |
| Success | Grün | #2EA043 | Erledigt, Bestätigung |
| Warning | Gelb | #D29922 | In Bearbeitung, Warnungen |
| Danger | Rot | #CF222E | Fehler, Notdienst |
| Surface | Dunkelgrau | #2D333B | Cards, Modals |
| Text Primary | Hellgrau | #CDD9E5 | Haupttext |
| Text Secondary | Mittelgrau | #768390 | Subtexte, Labels |

**Rationale:** Orange + Anthrazit = Handwerk, Energie, Zuverlässigkeit. Erinnert an Werkzeugmarken (DeWalt, Hilti) — vertraut für die Zielgruppe.

### Typografie

- **Headlines:** `IBM Plex Sans` (technisch, klar, gut lesbar auf kleinen Screens)
- **Body:** `Inter` (bewährt für UI)
- **Monospace (Artikelnummern etc.):** `JetBrains Mono`

### Navigationsstruktur

```
Bottom Navigation (Mobile):
[ 🏠 Dashboard ] [ 📝 Notizen ] [ 🔧 Angebote ] [ 📅 Termine ] [ 💬 Wissen ]

Sidebar (Tablet/Desktop):
+ Visitenkarten
+ Einstellungen
+ Wissensdatenbank verwalten
```

### Key UX-Patterns von Wettbewerbern übernehmen

| Pattern | Von | Warum |
|---|---|---|
| Digitale Plantafel (Gantt-ähnlich) | HERO, mfr | Übersicht für Terminplanung |
| Offline-Sync-Indikator | Craftboxx, Handyman | Kritisch für Handwerk |
| Checklisten am Auftrag | mobile function ENGINE4 | Dokumentation vor Ort |
| Drag & Drop Positionen im Angebot | HERO | Schnelle Angebotserstellung |
| Foto-Dokumentation am Auftrag | Alle | Standard, muss sein |
| Digitale Unterschrift | mfr, Handyman | Abnahmeprotokoll |

---

## 5. Entwicklungs-Roadmap

### Phase 1 — MVP (2-3 Monate)
**Ziel:** Täglich nutzbar für Aufmaß-Notizen und Terminsync

- [ ] Django Backend Setup + Auth
- [ ] Notizen-Modul (Diktieren → Strukturieren)
- [ ] Offline-First Storage (IndexedDB / Service Worker)
- [ ] Termin-Modul + HERO API Sync
- [ ] Push-Benachrichtigungen (PWA)
- [ ] Dashboard Grundversion
- [ ] Deploy auf Strato

### Phase 2 — Wissen & Kontakte (1-2 Monate)
- [ ] Visitenkarten-Modul + Claude Vision
- [ ] RAGFlow Integration (Wissensdatenbank-Chat)
- [ ] Betriebsanleitungen hochladen + indexieren
- [ ] Datanorm Import → PostgreSQL

### Phase 3 — Angebote (2-3 Monate)
- [ ] Angebots-Modul (RAG + Datanorm + Claude)
- [ ] PDF-Export
- [ ] Manuelle Nachbearbeitung
- [ ] Feedback-Loop: Angebot → neue Vorlage in RAGFlow

### Phase 4 — Erweiterungen
- [ ] Angebot → Rechnung
- [ ] Plantafel für Kollegen
- [ ] Routen-Integration
- [ ] Lieferanten-Preisvergleich

---

## 6. Technologieentscheidungen

| Bereich | Empfehlung | Begründung |
|---|---|---|
| Frontend | **Angular + PWA** | Offline-Fähigkeit, Push Notifications, eine Codebase für Web+Mobile |
| Backend | **Django REST Framework** | Bereits bekannt, schnell entwickelbar |
| Datenbank Auth/Notizen | **PostgreSQL** | Bereits vorhanden |
| Datenbank Artikelstamm | **PostgreSQL** (separate Instanz) | Klare Trennung |
| Wissensdatenbank | **RAGFlow** | Bereits eingerichtet |
| Lokales KI-Modell | **Ollama + Qwen2.5:3B** | Bereits eingerichtet | wird von RAGflow benutzt
| Cloud KI | **Claude CLI (Anthropic)** | Beste Qualität für Strukturierung | -p wird in docker installiert
| Push Notifications | **Web Push API** | PWA-nativ, kein nativer App Store nötig |
| Offline Storage | **IndexedDB + Workbox** | Standard für PWA |
| PDF-Generierung | **WeasyPrint (Python)** | Einfach, DSGVO-konform |

---

## 7. DSGVO-Überlegungen
Echte Kundendaten 

| Datentyp | Speicherort | Maßnahme |
|---|---|---|
| Kundendaten in Notizen | Lokal + Strato Server | PII-Filter vor Claude API |
| Visitenkarten-Fotos | Lokal, nach Auslese löschen | Foto nicht dauerhaft speichern |Foto´s werden für 3D Card verwendet
| Betriebsanleitungen | RAGFlow (Strato) | Keine Kundendaten |
| Angebotsdaten | Django Backend (Strato) | Verschlüsselung at rest |
| KI-Anfragen mit Kundendaten | Über Ollama lokal | Kein Cloud-Transfer |

---

## 8. Offene Fragen

1. **Native App oder PWA?** — PWA reicht für den Start, aber Push-Notifications auf iOS sind bis iOS 16.4 eingeschränkt. Wenn iOS-Support kritisch ist → React Native erwägen.
Antwort: PWA Angular 21+.
2. **Welche Lieferanten für Datanorm?** — Richtige Datanorm-Dateien müssen beschafft werden (Großhändler wie Reisser, SHK-Großhandel).
Antwort: Datanorm v5 (Artikel + Preisliste), Manuel beschafft
3. **HERO API Key vorhanden?** — Für Termin-Sync benötigt.
Antwort: Claude CLI nutzung, installiert in docker acc auth über token vom host pc
4. **Wer pflegt die Wissensdatenbank?** — Betriebsanleitungen müssen manuell hochgeladen werden.
Antwort: Manuel 
5. **Mehrere Nutzer oder nur du?** — Beeinflusst Auth-Konzept stark.
Antwort: Mehrere Benutzer ( Monteur, Büro. 15 - 30 Personen)

---

## Ragflow zugang


## PostgreSQL Artikelstamm (Großhändlerdaten)

● Die Verbindungsdaten:

  ┌───────────┬──────────────────┐
  │ Parameter │       Wert       │
  ├───────────┼──────────────────┤
  │ Host      │ localhost        │
  ├───────────┼──────────────────┤
  │ Port      │ 5433             │
  ├───────────┼──────────────────┤
  │ Datenbank │ artikelstamm     │
  ├───────────┼──────────────────┤
  │ User      │ artikelstamm     │
  ├───────────┼──────────────────┤
  │ Passwort  │ artikelstamm2024 │
  └───────────┴──────────────────┘

  Per Terminal (psql):
  docker exec -it artikelstamm_db psql -U artikelstamm -d artikelstamm

  Connection String (für Python/Tools):
  postgresql://artikelstamm:artikelstamm2024@localhost:5433/artikelstamm

  In Python (psycopg2):
  import psycopg2
  conn = psycopg2.connect(
      host="localhost",
      port=5433,
      dbname="artikelstamm",
      user="artikelstamm",
      password="artikelstamm2024"
  )
