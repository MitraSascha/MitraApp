from rest_framework import serializers
from .models import Termin


class TerminSerializer(serializers.ModelSerializer):
    sync_status = serializers.SerializerMethodField()

    class Meta:
        model = Termin
        fields = [
            'id', 'hero_crm_id', 'titel', 'beschreibung', 'typ', 'status',
            'beginn', 'ende', 'ganztaegig', 'adresse', 'kontakt_id',
            'monteure', 'push_gesendet', 'erinnerung_minuten', 'erinnerung_ton', 'notiz_id',
            'erstellt_am', 'geaendert_am', 'erstellt_von', 'version', 'sync_status',
        ]
        read_only_fields = ['erstellt_am', 'geaendert_am', 'erstellt_von', 'push_gesendet']

    def get_sync_status(self, obj):
        return 'synced'

    def create(self, validated_data):
        validated_data['erstellt_von'] = self.context['request'].user
        return super().create(validated_data)
