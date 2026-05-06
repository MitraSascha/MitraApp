from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Tagesbericht, TagesberichtFoto
from .serializers import TagesberichtSerializer, TagesberichtFotoSerializer


ERLAUBTE_BILD_TYPEN = {'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'}
MAX_FOTO_MB = 15


class TagesberichtViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TagesberichtSerializer

    def get_queryset(self):
        qs = Tagesbericht.objects.filter(erstellt_von=self.request.user)
        projekt = self.request.query_params.get('projekt')
        if projekt:
            qs = qs.filter(projekt_name__icontains=projekt)
        von = self.request.query_params.get('von')
        bis = self.request.query_params.get('bis')
        if von:
            qs = qs.filter(datum__gte=von)
        if bis:
            qs = qs.filter(datum__lte=bis)
        return qs

    @action(detail=True, methods=['post'], url_path='foto',
            parser_classes=[MultiPartParser, FormParser])
    def foto_upload(self, request, pk=None):
        bericht = self.get_object()
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
        foto = TagesberichtFoto(tagesbericht=bericht)
        foto.bild = datei
        foto.beschreibung = request.data.get('beschreibung', '')
        foto.typ = request.data.get('typ', 'allgemein')
        foto.save()
        return Response(
            TagesberichtFotoSerializer(foto, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='ki-arbeiten')
    def ki_arbeiten(self, request, pk=None):
        """POST /api/bautagebuch/{id}/ki-arbeiten/ — KI analysiert Arbeitsschritte"""
        from .ki_service import ki_arbeiten_analyse
        text = request.data.get('text', '')
        if not text.strip():
            return Response({'error': 'Text fehlt'}, status=status.HTTP_400_BAD_REQUEST)
        items = ki_arbeiten_analyse(text)
        return Response({'items': items})

    @action(detail=True, methods=['post'], url_path='ki-maengel')
    def ki_maengel(self, request, pk=None):
        """POST /api/bautagebuch/{id}/ki-maengel/ — KI analysiert Mängel mit Gewerk"""
        from .ki_service import ki_maengel_analyse
        text = request.data.get('text', '')
        if not text.strip():
            return Response({'error': 'Text fehlt'}, status=status.HTTP_400_BAD_REQUEST)
        items = ki_maengel_analyse(text)
        return Response({'items': items})

    @action(detail=True, methods=['post'], url_path='ki-materialliste')
    def ki_materialliste(self, request, pk=None):
        """POST /api/bautagebuch/{id}/ki-materialliste/ — KI erstellt Materialpositionen"""
        from .ki_service import ki_materialliste_analyse
        text = request.data.get('text', '')
        if not text.strip():
            return Response({'error': 'Text fehlt'}, status=status.HTTP_400_BAD_REQUEST)
        items = ki_materialliste_analyse(text)
        return Response({'items': items})
