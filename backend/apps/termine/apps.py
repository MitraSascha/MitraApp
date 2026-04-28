import threading
import time
import logging
from django.apps import AppConfig

logger = logging.getLogger(__name__)

_reminder_thread_started = False


class TermineConfig(AppConfig):
    name = 'apps.termine'
    default_auto_field = 'django.db.models.BigAutoField'

    def ready(self):
        global _reminder_thread_started
        if _reminder_thread_started:
            return
        _reminder_thread_started = True
        t = threading.Thread(target=_reminder_loop, daemon=True, name='termin-reminder')
        t.start()


def _reminder_loop():
    """Prüft alle 5 Minuten ob Termin-Erinnerungen versendet werden müssen."""
    time.sleep(30)  # Warten bis Django vollständig gestartet ist
    while True:
        try:
            from apps.termine.push_service import send_termin_reminders
            n = send_termin_reminders()
            if n > 0:
                logger.info(f'Termin-Reminder: {n} Erinnerungen gesendet.')
        except Exception as e:
            logger.warning(f'Termin-Reminder Fehler: {e}')
        time.sleep(300)  # 5 Minuten
