from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Notiz, NotizFoto
from .serializers import NotizSerializer, NotizFotoSerializer


ERLAUBTE_BILD_TYPEN = {'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'}
MAX_FOTO_MB = 15


class NotizViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotizSerializer

    def get_queryset(self):
        return Notiz.objects.filter(erstellt_von=self.request.user)

    @action(detail=True, methods=['post'], url_path='foto',
            parser_classes=[MultiPartParser, FormParser])
    def foto_upload(self, request, pk=None):
        notiz = self.get_object()
        datei = request.FILES.get('file')
        if not datei:
            return Response({'error': 'Keine Datei'}, status=status.HTTP_400_BAD_REQUEST)
        if datei.content_type not in ERLAUBTE_BILD_TYPEN:
            return Response(
                {'error': f'Dateityp nicht erlaubt: {datei.content_type}'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if datei.size > MAX_FOTO_MB * 1024 * 1024:
            return Response(
                {'error': f'Datei zu groß (max. {MAX_FOTO_MB} MB)'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        foto = NotizFoto(notiz=notiz)
        foto.bild = datei
        foto.beschreibung = request.data.get('beschreibung', '')
        foto.save()
        return Response(NotizFotoSerializer(foto, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)
