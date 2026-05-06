"""
Angebote — ViewSet + KI-Pipeline + PDF-Export
"""
import uuid
from datetime import date, timedelta
from django.db import transaction
from django.db.models import Max
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
        # Automatische Angebotsnummer vergeben falls client-generiert
        angebotsnummer = serializer.validated_data.get('angebotsnummer', '')
        if not angebotsnummer or angebotsnummer.startswith('ANG-1'):
            # Client-generierte Timestamp-Nummer durch sequentielle ersetzen
            from django.db.models import Max
            last = Angebot.objects.aggregate(max_nr=Max('angebotsnummer'))['max_nr']
            if last and last.startswith('ANG-'):
                try:
                    next_nr = int(last[4:]) + 1
                except ValueError:
                    next_nr = Angebot.objects.count() + 1
            else:
                next_nr = 1
            serializer.validated_data['angebotsnummer'] = f'ANG-{next_nr:04d}'

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
        materialliste_text = request.data.get('materialliste_text', '')
        kunde_data = request.data.get('kunde', {})

        # Quelle 1: Materialliste-Text (direkt vom Frontend)
        if materialliste_text and materialliste_text.strip():
            notiz_text = f'MATERIALLISTE:\n{materialliste_text}'
            titel_suffix = 'Materialliste'
        elif notiz_id:
            # Quelle 2: Notiz
            try:
                notiz = Notiz.objects.get(id=notiz_id, erstellt_von=request.user)
            except Notiz.DoesNotExist:
                return Response({'error': 'Notiz nicht gefunden'}, status=status.HTTP_404_NOT_FOUND)

            text_parts = []
            if notiz.raw_transcript:
                text_parts.append(f'ORIGINAL-AUFNAHME:\n{notiz.raw_transcript}')
            if notiz.titel:
                text_parts.append(f'Titel: {notiz.titel}')
            if notiz.freitext:
                text_parts.append(notiz.freitext)
            if notiz.ki_text:
                text_parts.append(notiz.ki_text)
            if notiz.summary:
                text_parts.append(f'Zusammenfassung: {notiz.summary}')
            if notiz.ki_items:
                text_parts.append('STRUKTURIERTE POSITIONEN:')
                for item in notiz.ki_items:
                    line = item.get('text', '')
                    if item.get('hersteller'):
                        line = f"[{item['hersteller']}] {line}"
                    if line.strip():
                        text_parts.append(f'- {line}')
            notiz_text = '\n'.join(text_parts)
            titel_suffix = notiz.titel or 'Aufmaß'
        else:
            return Response({'error': 'notiz_id oder materialliste_text fehlt'}, status=status.HTTP_400_BAD_REQUEST)

        if not notiz_text.strip():
            return Response({'error': 'Kein Text zum Verarbeiten'}, status=status.HTTP_400_BAD_REQUEST)

        # KI-Pipeline ausführen
        positionen = angebot_erstelle_aus_notiz(notiz_text, str(notiz_id))

        # Angebot erstellen (atomar, um Duplikat-Nummern zu vermeiden)
        with transaction.atomic():
            last = Angebot.objects.select_for_update().aggregate(
                max_nr=Max('angebotsnummer')
            )['max_nr']
            if last and last.startswith('ANG-'):
                try:
                    next_nr = int(last[4:]) + 1
                except ValueError:
                    next_nr = Angebot.objects.count() + 1
            else:
                next_nr = 1

            angebot = Angebot(
                id=uuid.uuid4(),
                user=request.user,
                angebotsnummer=f'ANG-{next_nr:04d}',
                titel=f'Angebot aus {titel_suffix}',
                kunde=kunde_data,
                positionen=positionen,
                notiz_id=notiz_id or None,
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
