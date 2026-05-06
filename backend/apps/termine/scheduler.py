import threading
import time
import logging

logger = logging.getLogger(__name__)
_scheduler_started = False
_scheduler_lock = threading.Lock()

# Prüfintervall: 30 Sekunden — Erinnerungen werden max. 30s zu spät gesendet
_CHECK_INTERVAL = 30


def _reminder_loop():
    time.sleep(15)  # Warte auf Django-Start
    logger.info("Reminder-Loop aktiv — prüfe alle %ds", _CHECK_INTERVAL)
    while True:
        try:
            from .push_service import send_termin_reminders
            count = send_termin_reminders()
            if count > 0:
                logger.info("Push-Reminder: %d Benachrichtigungen gesendet", count)
        except Exception:
            logger.exception("Reminder-Loop Fehler")
        time.sleep(_CHECK_INTERVAL)


def start_reminder_scheduler():
    global _scheduler_started
    with _scheduler_lock:
        if _scheduler_started:
            return
        _scheduler_started = True
    t = threading.Thread(target=_reminder_loop, daemon=True, name="reminder-scheduler")
    t.start()
    logger.info("Termin-Reminder Scheduler gestartet (Intervall: %ds)", _CHECK_INTERVAL)
