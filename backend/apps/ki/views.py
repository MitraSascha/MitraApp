import os
import tempfile
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .claude_service import strukturiere_notiz, transkribiere_audio, lese_visitenkarte


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user = request.user
    profile = getattr(user, 'profile', None)
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'vorname': user.first_name,
        'nachname': user.last_name,
        'rolle': profile.rolle if profile else 'monteur',
        'hero_partner_id': profile.hero_partner_id if profile else '',
        'created_at': user.date_joined.isoformat(),
    })


# ─── KI-Endpunkte ────────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def strukturiere_notiz_view(request):
    """
    POST /api/ki/strukturiere-notiz/
    {transkript: "...", kategorie: "sanitaer|heizung|klima|allgemein"}
    """
    transkript = request.data.get('transkript', '')
    kategorie = request.data.get('kategorie', 'allgemein')

    if not transkript:
        return Response({'error': 'transkript fehlt'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = strukturiere_notiz(transkript, kategorie)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def transkribiere_view(request):
    """
    POST /api/ki/transkribiere/ (multipart/form-data: file=<audiodatei>)
    """
    audio_file = request.FILES.get('file')
    if not audio_file:
        return Response({'error': 'Keine Audiodatei'}, status=status.HTTP_400_BAD_REQUEST)

    # Temporäre Datei für faster-whisper
    suffix = os.path.splitext(audio_file.name)[1] or '.webm'
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        for chunk in audio_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        text = transkribiere_audio(tmp_path)
        return Response({'text': text})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        os.unlink(tmp_path)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def lese_visitenkarte_view(request):
    """
    POST /api/ki/lese-visitenkarte/
    multipart/form-data: file=<vorderseite>, file_rueckseite=<rückseite optional>
    Liest Visitenkarte via Claude Vision. Beide Seiten werden gleichzeitig ausgewertet.
    """
    foto = request.FILES.get('file')
    if not foto:
        return Response({'error': 'Kein Foto'}, status=status.HTTP_400_BAD_REQUEST)

    suffix_v = os.path.splitext(foto.name)[1] or '.jpg'
    with tempfile.NamedTemporaryFile(suffix=suffix_v, delete=False) as tmp:
        for chunk in foto.chunks():
            tmp.write(chunk)
        tmp_vorderseite = tmp.name

    foto_rueckseite = request.FILES.get('file_rueckseite')
    tmp_rueckseite = None
    if foto_rueckseite:
        suffix_r = os.path.splitext(foto_rueckseite.name)[1] or '.jpg'
        with tempfile.NamedTemporaryFile(suffix=suffix_r, delete=False) as tmp:
            for chunk in foto_rueckseite.chunks():
                tmp.write(chunk)
            tmp_rueckseite = tmp.name

    try:
        result = lese_visitenkarte(tmp_vorderseite, tmp_rueckseite)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e), 'konfidenz': 0}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        os.unlink(tmp_vorderseite)
        if tmp_rueckseite:
            os.unlink(tmp_rueckseite)
