"""
PII-Filter — Pflicht vor jedem Claude-API-Aufruf mit Nutzerdaten.
DSGVO-Regel: Personenbezogene Daten verlassen den Server NIEMALS unzensiert.
"""
import re

PII_PATTERNS = [
    (r'\b[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+\b', '[NAME]'),        # Vor- + Nachname
    (r'\b\d{5}\b', '[PLZ]'),                                              # Postleitzahl
    (r'\b[\w.\-+]+@[\w.-]+\.\w+\b', '[EMAIL]'),                          # E-Mail
    (r'\b(\+49|0)\d[\d\s\-/]{6,}\b', '[TELEFON]'),                      # Telefonnummer
    (r'\b\w+str(aße|\.)?\s*\d+\b', '[STRASSE]'),                        # Straßenadresse
    (r'\b\w+gasse\s*\d+\b', '[STRASSE]'),                               # Gasse
    (r'\b\w+weg\s*\d+\b', '[STRASSE]'),                                 # Weg
]


def zensiere_pii(text: str) -> str:
    """Entfernt PII aus Text. MUSS vor jedem Claude-Aufruf ausgeführt werden."""
    for pattern, replacement in PII_PATTERNS:
        text = re.sub(pattern, replacement, text)
    return text
