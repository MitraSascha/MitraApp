from rest_framework import serializers
from .models import Notiz, NotizFoto


class NotizFotoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = NotizFoto
        fields = ['id', 'url', 'thumbnail_url', 'beschreibung', 'aufgenommen_am']

    def get_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.bild.url) if obj.bild and request else ''

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        return request.build_absolute_uri(obj.thumbnail.url) if obj.thumbnail and request else ''


class NotizSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    fotos = NotizFotoSerializer(many=True, read_only=True)
    sync_status = serializers.SerializerMethodField()

    class Meta:
        model = Notiz
        fields = [
            'id', 'titel', 'freitext', 'ki_text', 'ki_items',
            'status', 'typ',
            'vonwem', 'topic', 'summary', 'raw_transcript',
            'hersteller_pills', 'kategorien',
            'audio_url', 'fotos', 'erstellt_am', 'geaendert_am',
            'erstellt_von', 'version', 'sync_status',
        ]
        read_only_fields = ['erstellt_am', 'geaendert_am', 'erstellt_von']

    def get_sync_status(self, obj):
        return 'synced'

    def create(self, validated_data):
        validated_data['erstellt_von'] = self.context['request'].user
        return super().create(validated_data)
