from django.urls import path
from .views import subscribe, unsubscribe

urlpatterns = [
    path('subscribe/', subscribe, name='push_subscribe'),
    path('unsubscribe/', unsubscribe, name='push_unsubscribe'),
]
