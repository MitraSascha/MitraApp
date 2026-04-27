import uuid
from django.db import models
from django.contrib.auth.models import User


class Termin(models.Model):
    STATUS_CHOICES = [
        ('geplant', 'Geplant'),
        ('bestaetigt', 'Bestätigt'),
        ('abgesagt', 'Abgesagt'),
        ('erledigt', 'Erledigt'),
    ]
    TYP_CHOICES = [
        ('aufmass', 'Aufmaß'),
        ('wartung', 'Wartung'),
        ('notdienst', 'Notdienst'),
        ('besprechung', 'Besprechung'),
        ('lieferung', 'Lieferung'),
        ('sonstiges', 'Sonstiges'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hero_crm_id = models.CharField(max_length=100, blank=True, null=True)
    titel = models.CharField(max_length=255)
    beschreibung = models.TextField(blank=True)
    typ = models.CharField(max_length=20, choices=TYP_CHOICES, default='sonstiges')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='geplant')
    beginn = models.DateTimeField()
    ende = models.DateTimeField()
    ganztaegig = models.BooleanField(default=False)
    adresse = models.JSONField(default=dict, blank=True)
    kontakt_id = models.UUIDField(null=True, blank=True)
    monteure = models.JSONField(default=list)  # Liste von User-IDs
    push_gesendet = models.BooleanField(default=False)
    erinnerung_minuten = models.IntegerField(default=30)
    notiz_id = models.UUIDField(null=True, blank=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    geaendert_am = models.DateTimeField(auto_now=True)
    erstellt_von = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    version = models.IntegerField(default=1)

    class Meta:
        app_label = 'termine'
        ordering = ['beginn']

    def __str__(self):
        return f'{self.titel} ({self.beginn})'
