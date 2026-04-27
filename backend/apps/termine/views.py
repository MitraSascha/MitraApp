from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as drf_status
from .models import Termin
from .serializers import TerminSerializer
from .hero_sync import sync_hero_termine_fuer_user


class TerminViewSet(viewsets.ModelViewSet):
    serializer_class = TerminSerializer

    def get_queryset(self):
        qs = Termin.objects.filter(erstellt_von=self.request.user)
        # Optionale Datumsfilterung
        von = self.request.query_params.get('von')
        bis = self.request.query_params.get('bis')
        if von:
            qs = qs.filter(beginn__gte=von)
        if bis:
            qs = qs.filter(beginn__lte=bis)
        return qs


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def hero_sync_view(request):
    """
    POST /api/termine/hero-sync/
    Synchronisiert Termine aus HERO CRM für den eingeloggten Monteur.
    """
    try:
        neu, aktualisiert = sync_hero_termine_fuer_user(request.user)
        return Response({
            'neu': neu,
            'aktualisiert': aktualisiert,
            'message': f'{neu} neue, {aktualisiert} aktualisierte Termine synchronisiert.',
        })
    except ValueError as e:
        return Response({'error': str(e)}, status=drf_status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': f'HERO Sync fehlgeschlagen: {str(e)}'},
            status=drf_status.HTTP_502_BAD_GATEWAY,
        )
