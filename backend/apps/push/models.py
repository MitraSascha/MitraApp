from django.db import models
from django.contrib.auth.models import User


class PushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField(max_length=800, unique=True)
    p256dh = models.CharField(max_length=500)
    auth = models.CharField(max_length=200)
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktiv = models.BooleanField(default=True)

    class Meta:
        app_label = 'push'

    def __str__(self):
        return f'{self.user.username} - {self.endpoint[:50]}'
