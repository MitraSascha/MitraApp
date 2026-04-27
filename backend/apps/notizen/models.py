import uuid
from django.db import models
from django.contrib.auth.models import User


class Notiz(models.Model):
    NOTIZ_STATUS = [
        ('offen', 'Offen'),
        ('in_bearbeitung', 'In Bearbeitung'),
        ('erledigt', 'Erledigt'),
    ]
    NOTIZ_TYP = [
        ('aufmass', 'Aufmaß'),
        ('begehung', 'Begehung'),
        ('wartung', 'Wartung'),
        ('notdienst', 'Notdienst'),
        ('allgemein', 'Allgemein'),
    ]
    VONWEM_CHOICES = [
        ('kunde', 'Kunde'),
        ('lieferant', 'Lieferant'),
        ('intern', 'Intern'),
        ('aufmass', 'Aufmaß'),
    ]
    TOPIC_CHOICES = [
        ('sanitaer', 'Sanitär'),
        ('heizung', 'Heizung'),
        ('notdienst', 'Notdienst'),
        ('allgemein', 'Allgemein'),
    ]

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titel         = models.CharField(max_length=255, blank=True)
    freitext      = models.TextField(blank=True)
    ki_text       = models.TextField(blank=True, null=True)
    ki_items      = models.JSONField(default=list, blank=True)
    status        = models.CharField(max_length=20, choices=NOTIZ_STATUS, default='offen')
    typ           = models.CharField(max_length=20, choices=NOTIZ_TYP, default='allgemein')
    # Neue Felder für die Notizen-UI
    vonwem        = models.CharField(max_length=20, choices=VONWEM_CHOICES, default='kunde')
    topic         = models.CharField(max_length=20, choices=TOPIC_CHOICES, default='allgemein')
    summary       = models.TextField(blank=True, null=True)
    raw_transcript = models.TextField(blank=True, null=True)
    # Legacy
    hersteller_pills = models.JSONField(default=list, blank=True)
    kategorien    = models.JSONField(default=list, blank=True)
    audio_url     = models.CharField(max_length=500, blank=True, null=True)
    erstellt_von  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    erstellt_am   = models.DateTimeField(auto_now_add=True)
    geaendert_am  = models.DateTimeField(auto_now=True)
    version       = models.IntegerField(default=1)

    class Meta:
        app_label = 'notizen'
        ordering = ['-erstellt_am']

    def __str__(self):
        return self.titel or str(self.id)


class NotizFoto(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notiz       = models.ForeignKey(Notiz, on_delete=models.CASCADE, related_name='fotos')
    bild        = models.ImageField(upload_to='notizen/fotos/')
    thumbnail   = models.ImageField(upload_to='notizen/thumbs/', blank=True)
    beschreibung = models.CharField(max_length=255, blank=True)
    aufgenommen_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'notizen'
