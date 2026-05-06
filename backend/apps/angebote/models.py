import uuid
from django.db import models
from django.contrib.auth.models import User


class Angebot(models.Model):
    STATUS_CHOICES = [
        ('entwurf', 'Entwurf'),
        ('gesendet', 'Gesendet'),
        ('angenommen', 'Angenommen'),
        ('abgelehnt', 'Abgelehnt'),
        ('abgelaufen', 'Abgelaufen'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='angebote')

    angebotsnummer = models.CharField(max_length=50, unique=True)
    titel = models.CharField(max_length=300)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='entwurf')

    # Kunde als JSON (kein eigenes Modell — Flexibilität)
    kunde = models.JSONField(default=dict)

    # Positionen als JSON-Array
    positionen = models.JSONField(default=list)

    notiz_id = models.UUIDField(null=True, blank=True, db_index=True)

    nettobetrag = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mwst_prozent = models.IntegerField(default=19)
    mwst_betrag = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bruttobetrag = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    zahlungsziel_tage = models.IntegerField(default=30)
    gueltigkeit_tage = models.IntegerField(default=30)

    freitext_kopf = models.TextField(blank=True)
    freitext_fuss = models.TextField(blank=True)

    ragflow_referenz_ids = models.JSONField(default=list)

    pdf_url = models.CharField(max_length=500, blank=True)
    version = models.IntegerField(default=1)

    erstellt_am = models.DateTimeField(auto_now_add=True)
    geaendert_am = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-erstellt_am']

    def __str__(self):
        return f'{self.angebotsnummer}: {self.titel}'

    def berechne_summen(self):
        from decimal import Decimal, ROUND_HALF_UP
        cent = Decimal('0.01')
        netto = sum(Decimal(str(p.get('gesamtpreis', 0))) for p in self.positionen)
        self.nettobetrag = netto.quantize(cent, rounding=ROUND_HALF_UP)
        self.mwst_betrag = (netto * self.mwst_prozent / 100).quantize(cent, rounding=ROUND_HALF_UP)
        self.bruttobetrag = (self.nettobetrag + self.mwst_betrag).quantize(cent, rounding=ROUND_HALF_UP)
