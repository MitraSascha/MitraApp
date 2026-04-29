import threading
import time
import logging

logger = logging.getLogger(__name__)
_scheduler_started = False

def _reminder_loop():
    time.sleep(30)  # Warte auf Django-Start
    while True:
        try:
            from .push_service import send_termin_reminders
            count = send_termin_reminders()
            if count > 0:
                logger.info(f"Push-Reminder: {count} Benachrichtigungen gesendet")
        except Exception as e:
            logger.error(f"Reminder-Loop Fehler: {e}")
        time.sleep(60)

def start_reminder_scheduler():
    global _scheduler_started
    if _scheduler_started:
        return
    _scheduler_started = True
    t = threading.Thread(target=_reminder_loop, daemon=True, name="reminder-scheduler")
    t.start()
    logger.info("Termin-Reminder Scheduler gestartet")
