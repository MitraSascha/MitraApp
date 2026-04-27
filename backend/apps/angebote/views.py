"""
Angebote — ViewSet + KI-Pipeline + PDF-Export
"""
import uuid
from datetime import date, timedelta
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.notizen.models import Notiz
from .models import Angebot
from .serializers import AngebotSerializer
from .ki_pipeline import angebot_erstelle_aus_notiz


class AngebotViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = AngebotSerializer

    def get_queryset(self):
        return Angebot.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        angebot = serializer.save(user=self.request.user)
        angebot.berechne_summen()
        angebot.save()

    def perform_update(self, serializer):
        angebot = serializer.save()
        angebot.berechne_summen()
        angebot.save()

    @action(detail=False, methods=['POST'], url_path='erstellen-aus-notiz')
    def erstellen_aus_notiz(self, request):
        """
        POST /api/angebote/erstellen-aus-notiz/
        {
          "notiz_id": "...",
          "kunde": {"firma": "...", "ansprechpartner": "..."}
        }
        """
        notiz_id = request.data.get('notiz_id')
        kunde_data = request.data.get('kunde', {})

        if not notiz_id:
            return Response({'error': 'notiz_id fehlt'}, status=status.HTTP_400_BAD_REQUEST)

        # Notiz laden
        try:
            notiz = Notiz.objects.get(id=notiz_id, user=request.user)
        except Notiz.DoesNotExist:
            return Response({'error': 'Notiz nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)

        notiz_text = notiz.freitext or (notiz.ki_text or '')
        if not notiz_text:
            return Response({'error': 'Notiz hat keinen Text'}, status=status.HTTP_400_BAD_REQUEST)

        # KI-Pipeline ausführen
        positionen = angebot_erstelle_aus_notiz(notiz_text, str(notiz_id))

        # Angebot erstellen
        angebot = Angebot(
            id=uuid.uuid4(),
            user=request.user,
            angebotsnummer=f'ANG-{Angebot.objects.count() + 1:04d}',
            titel=f'Angebot aus Notiz: {notiz.titel or "Aufmaß"}',
            kunde=kunde_data,
            positionen=positionen,
            notiz_id=notiz_id,
            mwst_prozent=19,
            zahlungsziel_tage=30,
            gueltigkeit_tage=30,
        )
        angebot.berechne_summen()
        angebot.save()

        serializer = self.get_serializer(angebot)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['GET'], url_path='pdf')
    def pdf(self, request, pk=None):
        """
        GET /api/angebote/{id}/pdf/
        → PDF via WeasyPrint
        """
        angebot = self.get_object()
        heute = date.today()
        gueltig_bis = heute + timedelta(days=angebot.gueltigkeit_tage)

        html = render_to_string('angebote/angebot_pdf.html', {
            'angebot': angebot,
            'datum': heute.strftime('%d.%m.%Y'),
            'gueltig_bis': gueltig_bis.strftime('%d.%m.%Y'),
        })

        try:
            from weasyprint import HTML
            pdf_bytes = HTML(string=html).write_pdf()
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{angebot.angebotsnummer}.pdf"'
            return response
        except ImportError:
            return Response(
                {'error': 'WeasyPrint nicht installiert'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
