from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    ROLLE_CHOICES = [
        ('monteur', 'Monteur'),
        ('buero', 'Büro'),
        ('admin', 'Administrator'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    rolle = models.CharField(max_length=20, choices=ROLLE_CHOICES, default='monteur')
    hero_partner_id = models.CharField(max_length=100, blank=True, default='',
                                        verbose_name='HERO Partner-ID',
                                        help_text='Individuelle Partner-ID für HERO CRM Termin-Sync')

    class Meta:
        app_label = 'ki'
        verbose_name = 'Benutzerprofil'
        verbose_name_plural = 'Benutzerprofile'

    def __str__(self):
        return f'{self.user.username} ({self.get_rolle_display()})'

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)
