from django.core.management.base import BaseCommand
from apps.termine.push_service import send_termin_reminders


class Command(BaseCommand):
    help = 'Sendet Push-Benachrichtigungen für fällige Termin-Erinnerungen'

    def handle(self, *args, **options):
        gesendet = send_termin_reminders()
        self.stdout.write(f'{gesendet} Erinnerungen gesendet.')
