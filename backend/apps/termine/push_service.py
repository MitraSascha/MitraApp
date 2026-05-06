"""
Push-Benachrichtigungen für Termin-Erinnerungen via pywebpush.

Payload-Format: Angular ngsw-worker.js erwartet { notification: { ... } }.
Dev push-sw.js unterstützt beide Formate.
"""
import json
import logging
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)

# Push-Endpunkt-Fehler die sofortige Subscription-Löschung auslösen
_DEAD_SUBSCRIPTION_CODES = {404, 410}


def send_push_notification(subscription, title: str, body: str, data: dict = None) -> bool:
    """
    Sendet eine Push-Notification an eine PushSubscription.
    Gibt True bei Erfolg zurück.
    Löscht tote Subscriptions (410 Gone / 404 Not Found) automatisch.
    """
    from pywebpush import webpush, WebPushException

    termin_id = (data or {}).get('termin_id', '')

    # Payload im Angular ngsw-kompatiblen Format (notification-Wrapper)
    # push-sw.js (Dev) unterstützt beide Formate
    payload = json.dumps({
        "notification": {
            "title": title,
            "body": body,
            "data": data or {},
            "icon": "/icons/icon-192x192.png",
            "badge": "/icons/icon-72x72.png",
            "vibrate": [200, 100, 200],
            "tag": f"termin-{termin_id}" if termin_id else "mitra-push",
            "requireInteraction": True,
            "silent": False,
        }
    })

    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                }
            },
            data=payload,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
            ttl=3600,       # 1 Stunde — zeitkritische Erinnerung
            headers={
                "Urgency": "high",
            },
        )
        logger.info(f"Push gesendet an {subscription.user.username} (Termin {termin_id})")
        return True

    except WebPushException as e:
        status_code = e.response.status_code if e.response is not None else None
        if status_code in _DEAD_SUBSCRIPTION_CODES:
            logger.info(
                f"Subscription gelöscht ({status_code}): {subscription.endpoint[:60]}"
            )
            subscription.delete()
        else:
            logger.warning(
                f"Push fehlgeschlagen ({status_code}) für "
                f"{subscription.endpoint[:60]}: {e}"
            )
        return False

    except Exception as e:
        logger.error(f"Push unerwarteter Fehler: {e}", exc_info=True)
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
            termin.push_gesendet = True
            termin.save(update_fields=['push_gesendet'])
            continue

        # erinnerung_ton=False → Push-Nachricht still senden (silent)
        if not termin.erinnerung_ton:
            termin.push_gesendet = True
            termin.save(update_fields=['push_gesendet'])
            continue

        subscriptions = PushSubscription.objects.filter(user=user, aktiv=True)
        if not subscriptions.exists():
            logger.warning(
                f"Keine aktive Push-Subscription für {user.username} "
                f"(Termin: {termin.titel})"
            )
            continue

        beginn_str = termin.beginn.strftime('%d.%m.%Y um %H:%M Uhr')
        erfolgreich = False
        for sub in subscriptions:
            ok = send_push_notification(
                sub,
                title=f"Termin: {termin.titel}",
                body=f"Beginnt {beginn_str}",
                data={
                    'termin_id': str(termin.id),
                    'url': f'/termine/{termin.id}',
                },
            )
            if ok:
                erfolgreich = True
                gesendet += 1

        if erfolgreich:
            termin.push_gesendet = True
            termin.save(update_fields=['push_gesendet'])

    return gesendet
