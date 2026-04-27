from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PushSubscription


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe(request):
    """POST /api/push/subscribe/ — Push-Subscription registrieren"""
    data = request.data
    endpoint = data.get('endpoint')
    keys = data.get('keys', {})

    if not endpoint or not keys:
        return Response({'error': 'endpoint und keys fehlen'}, status=status.HTTP_400_BAD_REQUEST)

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            'user': request.user,
            'p256dh': keys.get('p256dh', ''),
            'auth': keys.get('auth', ''),
            'aktiv': True,
        }
    )
    return Response({'status': 'subscribed'}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    """DELETE /api/push/unsubscribe/ — Subscription deaktivieren"""
    PushSubscription.objects.filter(user=request.user).update(aktiv=False)
    return Response(status=status.HTTP_204_NO_CONTENT)
