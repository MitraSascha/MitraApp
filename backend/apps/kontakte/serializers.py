from rest_framework import serializers
from .models import Kontakt


class KontaktSerializer(serializers.ModelSerializer):
    sync_status = serializers.CharField(default='synced', read_only=True)

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
        read_only_fields = ['id', 'erstellt_am', 'geaendert_am', 'sync_status']
