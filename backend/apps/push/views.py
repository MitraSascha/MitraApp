import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import PushSubscription

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe(request):
    """POST /api/push/subscribe/ — Push-Subscription registrieren"""
    data = request.data
    endpoint = data.get('endpoint')
    keys = data.get('keys', {})

    if not endpoint or not keys.get('p256dh') or not keys.get('auth'):
        return Response(
            {'error': 'endpoint, keys.p256dh und keys.auth sind erforderlich'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    sub, created = PushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            'user': request.user,
            'p256dh': keys['p256dh'],
            'auth': keys['auth'],
            'aktiv': True,
        }
    )

    logger.info(
        "Push-Subscription %s für %s (%s)",
        "erstellt" if created else "aktualisiert",
        request.user.username,
        endpoint[:60],
    )

    return Response(
        {'status': 'subscribed'},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsubscribe(request):
    """DELETE /api/push/unsubscribe/ — Subscription deaktivieren"""
    count = PushSubscription.objects.filter(user=request.user).update(aktiv=False)
    logger.info("Push-Subscriptions deaktiviert für %s (%d Stück)", request.user.username, count)
    return Response(status=status.HTTP_204_NO_CONTENT)
