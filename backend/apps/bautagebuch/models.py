import uuid
from django.db import models
from django.contrib.auth.models import User


class Tagesbericht(models.Model):
    WETTER_CHOICES = [
        ('sonnig', 'Sonnig'),
        ('bewoelkt', 'Bewölkt'),
        ('regen', 'Regen'),
        ('schnee', 'Schnee'),
        ('sturm', 'Sturm'),
        ('nebel', 'Nebel'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    datum = models.DateField()
    projekt_name = models.CharField(max_length=255)
    projekt_adresse = models.JSONField(default=dict, blank=True)

    # Wetter
    wetter = models.CharField(max_length=20, choices=WETTER_CHOICES, blank=True)
    temperatur = models.IntegerField(null=True, blank=True)

    # Mitarbeiter vor Ort: [{name, rolle, stunden}]
    mitarbeiter = models.JSONField(default=list)

    # Arbeiten
    arbeiten_beschreibung = models.TextField(blank=True)
    arbeiten_items = models.JSONField(default=list)  # [{id, beschreibung, status}]

    # Mängel
    maengel = models.JSONField(default=list)  # [{id, beschreibung, prioritaet, foto_ids, status}]

    # Checkliste (legacy)
    checkliste = models.JSONField(default=list)  # [{id, text, erledigt}]

    # Materialliste
    materialliste = models.JSONField(default=list)  # [{id, name, menge, einheit, erledigt}]

    # Unterschriften (Base64 PNG)
    unterschrift_auftraggeber = models.TextField(blank=True, null=True)
    unterschrift_auftragnehmer = models.TextField(blank=True, null=True)

    # Bemerkungen
    bemerkungen = models.TextField(blank=True)

    # Meta
    erstellt_von = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    geaendert_am = models.DateTimeField(auto_now=True)
    version = models.IntegerField(default=1)

    class Meta:
        app_label = 'bautagebuch'
        ordering = ['-datum', '-erstellt_am']

    def __str__(self):
        return f'{self.projekt_name} — {self.datum}'


class TagesberichtFoto(models.Model):
    FOTO_TYP_CHOICES = [
        ('arbeit', 'Arbeitsfortschritt'),
        ('mangel', 'Mangel'),
        ('vorher', 'Vorher'),
        ('nachher', 'Nachher'),
        ('allgemein', 'Allgemein'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tagesbericht = models.ForeignKey(Tagesbericht, on_delete=models.CASCADE, related_name='fotos')
    bild = models.ImageField(upload_to='bautagebuch/fotos/')
    thumbnail = models.ImageField(upload_to='bautagebuch/thumbs/', blank=True)
    beschreibung = models.CharField(max_length=255, blank=True)
    typ = models.CharField(max_length=20, choices=FOTO_TYP_CHOICES, default='allgemein')
    aufgenommen_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'bautagebuch'
