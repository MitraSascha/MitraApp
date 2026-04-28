from rest_framework import serializers
from .models import Kontakt


class KontaktSerializer(serializers.ModelSerializer):
    sync_status = serializers.CharField(default='synced', read_only=True)
    # URLField im Model würde URLs ohne Schema (z.B. www.viega.de) ablehnen.
    # Claude extrahiert oft URLs ohne https://, daher kein URL-Validator hier.
    website = serializers.CharField(max_length=500, allow_blank=True, required=False, default='')
    # Client darf UUID vorgeben (Offline-First: lokale ID muss = Server-ID sein).
    # required=False damit der Server bei fehlendem id-Feld selbst eine generiert.
    id = serializers.UUIDField(required=False)

    class Meta:
        model = Kontakt
        fields = [
            'id', 'firma', 'ansprechpartner', 'position',
            'mobil', 'telefon', 'email', 'website', 'branche',
            'adresse', 'bewertung', 'zuverlaessigkeit',
            'ist_lieferant', 'zahlungsziel_tage',
            'tags', 'notiz', 'kennen_uns_ueber', 'foto_url',
            'zuletzt_kontaktiert', 'hero_crm_id',
            'gespraechsnotizen', 'sync_status', 'version',
            'erstellt_am', 'geaendert_am',
        ]
        read_only_fields = ['erstellt_am', 'geaendert_am', 'sync_status']
