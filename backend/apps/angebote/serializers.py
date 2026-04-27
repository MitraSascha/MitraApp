from rest_framework import serializers
from .models import Angebot


class AngebotSerializer(serializers.ModelSerializer):
    erstellt_von = serializers.SerializerMethodField()

    class Meta:
        model = Angebot
        fields = [
            'id', 'angebotsnummer', 'titel', 'status',
            'kunde', 'positionen', 'notiz_id',
            'nettobetrag', 'mwst_prozent', 'mwst_betrag', 'bruttobetrag',
            'zahlungsziel_tage', 'gueltigkeit_tage',
            'freitext_kopf', 'freitext_fuss',
            'ragflow_referenz_ids', 'pdf_url', 'version',
            'erstellt_am', 'geaendert_am', 'erstellt_von',
        ]
        read_only_fields = ['id', 'erstellt_am', 'geaendert_am', 'erstellt_von']

    def get_erstellt_von(self, obj):
        return obj.user_id
