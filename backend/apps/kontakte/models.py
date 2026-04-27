import uuid
from django.db import models
from django.contrib.auth.models import User


class Kontakt(models.Model):
    ZUVERLAESSIGKEIT_CHOICES = [
        ('gering', 'Gering'),
        ('mittel', 'Mittel'),
        ('hoch', 'Hoch'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='kontakte')

    firma = models.CharField(max_length=200)
    ansprechpartner = models.CharField(max_length=200, blank=True)
    position = models.CharField(max_length=200, blank=True)
    mobil = models.CharField(max_length=50, blank=True)
    telefon = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    branche = models.CharField(max_length=100, blank=True)

    adresse = models.JSONField(default=dict, blank=True)

    bewertung = models.IntegerField(null=True, blank=True)
    zuverlaessigkeit = models.CharField(
        max_length=10,
        choices=ZUVERLAESSIGKEIT_CHOICES,
        blank=True,
    )
    ist_lieferant = models.BooleanField(default=False)
    zahlungsziel_tage = models.IntegerField(null=True, blank=True)

    tags = models.JSONField(default=list, blank=True)
    notiz = models.TextField(blank=True)
    kennen_uns_ueber = models.CharField(max_length=200, blank=True)

    foto_url = models.CharField(max_length=500, blank=True)

    zuletzt_kontaktiert = models.DateTimeField(null=True, blank=True)
    hero_crm_id = models.CharField(max_length=100, blank=True)

    gespraechsnotizen = models.JSONField(default=list, blank=True)

    sync_status = models.CharField(max_length=20, default='synced')
    version = models.IntegerField(default=1)

    erstellt_am = models.DateTimeField(auto_now_add=True)
    geaendert_am = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['firma']

    def __str__(self):
        return f'{self.firma} ({self.ansprechpartner})'
