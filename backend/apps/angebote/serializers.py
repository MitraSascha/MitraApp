from rest_framework import serializers
from .models import Angebot


class AngebotSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    erstellt_von = serializers.SerializerMethodField()
    sync_status = serializers.SerializerMethodField()

    class Meta:
        model = Angebot
        fields = [
            'id', 'angebotsnummer', 'titel', 'status',
            'kunde', 'positionen', 'notiz_id',
            'nettobetrag', 'mwst_prozent', 'mwst_betrag', 'bruttobetrag',
            'zahlungsziel_tage', 'gueltigkeit_tage',
            'freitext_kopf', 'freitext_fuss',
            'ragflow_referenz_ids', 'pdf_url', 'version',
            'erstellt_am', 'geaendert_am', 'erstellt_von', 'sync_status',
        ]
        read_only_fields = ['erstellt_am', 'geaendert_am', 'erstellt_von']

    def get_erstellt_von(self, obj):
        return obj.user_id

    def get_sync_status(self, obj):
        return 'synced'
