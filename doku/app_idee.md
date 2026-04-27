Ich stelle mir eine App vor, die mehrere tools vereinigt.

1. Ich gehe zum Kunden Aufmaß erstellen für Badezimmerumbau, Heizungumbau. Ich muss jedenfalls ein Aufmaß machen. Jetzt nehme ich mein Handy, mach die App auf und erstelle via Diktat notizen. Claude (läuft über CLI abfrage) strukturiert mir diese in abschnitte. Beispiel: Transkript: Kaldewei Duschtasse 100x90x2,6 cm Glaswand fest 60cm unterputz armatur Grohe Waschtisch und Dusche waschtisch 48x38 Aufsatz mit Unterschrank. Claude macht daraus: 1. Kaldewei Duschtasse 100x90x2,6 cm, 2. Glaswand fest 60cm, 3. unterputz armatur Grohe Waschtisch und Dusche, 4. waschtisch 48x38 Aufsatz mit Unterschrank. Optimalerweise, ordnet claude auch gleich produktetiketten entsprechend zu.

Diese Notizen werden dann später für die Angebotserstellung verwendet.
Notizen sind dann so strukturiert:
von wem: Kunde, Lieferant, Persönlich, Aufmaß, Kollege
Thema: Notdienst, Sanitär, Heizung, Allgemein

Oben wird angezeigt: von wem, Kategorie und ein toggel der zwischen offen, in bearbeitung, erledigt wechselt. Darunter Titel, datum, uhrzeit.

darunter die möglichkeit Titel, von wem, Thema zu ändern.
Darunter 2 Tabs: Freitext, KI-Text.
Freitext: reine text eingabe
KI-Text: Diktiergerät. Transkripiert wird über Claude CLI (wird im docker container installiert).

Darunter Dann entsprechend die notiz. Besonderheit: Dropdown um auszuwählen ob es Produkt, Aufgabe, Notiz, Termin ist. 

Bin ich z.b in Sanitär, Produkt: dann soll unter notizen kleine pillen sein mit den gängigsten herstellern in bezug auf Sanitär. Bei Heizung entsprechend dann Heizung.

Sollten Termine oder Aufgaben angegeben sein, werden diese im Dashboard angezeigt.

2. Als weiteres Tool, will ich Visitenkarten darin speichern. 3D objekt wo die visitenkarte abgebildet wird, foto funktion um Bilder der visitenkarte hoch zu laden, die claude dann ausliest und entsprechend die Felder ausfüllt.

Formualr dafür
Firma:
Ansprechpartner:
Position:
Mobil:
Telefon:
Webseite:
E-Mail:
Adresse:

Zusatzfelder
Branche:
Zusammen gearbeitet: ja/nein
Bewertung: 5 Sterne 
Zuverlässigkeit: gering/mittel/hoch
wenn dir noch felder einfallen gerne mit rein nehmen!

3. Angebotsersteller aus erstellte Notizen, RAGflow (Beispielangebote), PostgreSQL Artikelstamm daten.
4. Wissenschat: Ein chat Interface, wo man RAGflow wissen abfragen kann sowie standard chat funktionen wie websuche etc (Claude CLI)

5. Termin tool. Ein tool um Termine erstellen zu können, aber auch um Termine aus unserem CRM system zu fatchen (API etc alles vorhanden und schon einige male gebaut). Besonderheit: Benachrichtigungen, Handy muss benachrichtigung zur erinnerung senden!!

6. Dashboard: Wichtigsten Termine, Aufgaben, Briefing usw.

Du siehst also auf was das hinaus läuft. Sieh dich bitte noch im Internet um und such nach vergleichbaren projekten. Welche tools und funktionen haben die, sollte ich welche übernehmen? Ranking system: Hoch, Mittel, Gering. Ausserdem Designpatterns: wie sollte die App aufgebaut/Strukturiert sein, welche farben, solche sachen alles