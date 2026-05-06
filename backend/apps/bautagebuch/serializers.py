from rest_framework import serializers
from .models import Tagesbericht, TagesberichtFoto


class TagesberichtFotoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = TagesberichtFoto
        fields = ['id', 'url', 'beschreibung', 'typ', 'aufgenommen_am']

    def get_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.bild.url) if obj.bild and request else ''


class TagesberichtSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    fotos = TagesberichtFotoSerializer(many=True, read_only=True)
    sync_status = serializers.SerializerMethodField()
    erstellt_von = serializers.SerializerMethodField()

    class Meta:
        model = Tagesbericht
        fields = [
            'id', 'datum', 'projekt_name', 'projekt_adresse',
            'wetter', 'temperatur', 'mitarbeiter',
            'arbeiten_beschreibung', 'arbeiten_items',
            'maengel', 'checkliste', 'materialliste',
            'unterschrift_auftraggeber', 'unterschrift_auftragnehmer',
            'bemerkungen', 'fotos',
            'erstellt_am', 'geaendert_am', 'erstellt_von', 'version', 'sync_status',
        ]
        read_only_fields = ['erstellt_am', 'geaendert_am', 'erstellt_von']

    def get_sync_status(self, obj):
        return 'synced'

    def get_erstellt_von(self, obj):
        return obj.erstellt_von_id

    def create(self, validated_data):
        validated_data['erstellt_von'] = self.context['request'].user
        return super().create(validated_data)
