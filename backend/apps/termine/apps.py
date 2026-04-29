from django.apps import AppConfig


class TermineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.termine'

    def ready(self):
        # Scheduler nur einmal starten (nicht im uvicorn-Reloader-Subprozess)
        import os
        if os.environ.get('UVICORN_STARTED') != '1':
            os.environ['UVICORN_STARTED'] = '1'
            from .scheduler import start_reminder_scheduler
            start_reminder_scheduler()
