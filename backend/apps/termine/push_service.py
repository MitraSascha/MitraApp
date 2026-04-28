"""
Push-Benachrichtigungen für Termin-Erinnerungen via pywebpush.
"""
import json
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


def send_push_notification(subscription, title: str, body: str, data: dict = None) -> bool:
    """Sendet eine Push-Notification an eine PushSubscription. Gibt True bei Erfolg zurück."""
    try:
        from pywebpush import webpush, WebPushException
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                }
            },
            data=json.dumps({
                "title": title,
                "body": body,
                "data": data or {},
                "icon": "/assets/icons/icon-192x192.png",
                "badge": "/assets/icons/icon-72x72.png",
                "vibrate": [200, 100, 200],
                "tag": f"termin-{(data or {}).get('termin_id', '')}",
                "requireInteraction": True,
            }),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
        )
        return True
    except Exception as e:
        logger.warning(f"Push fehlgeschlagen für {subscription.endpoint[:60]}: {e}")
        return False


def send_termin_reminders() -> int:
    """
    Prüft alle Termine mit fälliger Erinnerung und sendet Push-Notifications.
    Markiert gesendete Erinnerungen mit push_gesendet=True.
    Gibt Anzahl gesendeter Notifications zurück.
    """
    from .models import Termin
    from apps.push.models import PushSubscription

    jetzt = timezone.now()
    gesendet = 0

    termine = Termin.objects.filter(
        push_gesendet=False,
        erinnerung_minuten__gt=0,
        beginn__gte=jetzt,
    ).select_related('erstellt_von')

    for termin in termine:
        erinnerung_zeit = termin.beginn - timedelta(minutes=termin.erinnerung_minuten)
        if jetzt < erinnerung_zeit:
            continue

        user = termin.erstellt_von
        if not user:
            continue

        if not getattr(termin, 'erinnerung_ton', True):
            termin.push_gesendet = True
            termin.save(update_fields=['push_gesendet'])
            continue

        subscriptions = PushSubscription.objects.filter(user=user, aktiv=True)
        if not subscriptions.exists():
            continue

        beginn_str = termin.beginn.strftime('%d.%m.%Y um %H:%M Uhr')
        erfolgreich = False
        for sub in subscriptions:
            ok = send_push_notification(
                sub,
                title=f"Termin: {termin.titel}",
                body=f"Beginnt {beginn_str}",
                data={'termin_id': str(termin.id)},
            )
            if ok:
                erfolgreich = True
                gesendet += 1

        if erfolgreich:
            termin.push_gesendet = True
            termin.save(update_fields=['push_gesendet'])

    return gesendet
