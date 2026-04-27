from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Notiz, NotizFoto
from .serializers import NotizSerializer, NotizFotoSerializer


class NotizViewSet(viewsets.ModelViewSet):
    serializer_class = NotizSerializer

    def get_queryset(self):
        return Notiz.objects.filter(erstellt_von=self.request.user)

    @action(detail=True, methods=['post'], url_path='foto',
            parser_classes=[MultiPartParser, FormParser])
    def foto_upload(self, request, pk=None):
        notiz = self.get_object()
        foto = NotizFoto(notiz=notiz)
        foto.bild = request.FILES.get('file')
        foto.beschreibung = request.data.get('beschreibung', '')
        foto.save()
        return Response(NotizFotoSerializer(foto, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)
