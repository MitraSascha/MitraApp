from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TerminViewSet, hero_sync_view, send_reminders_view

router = DefaultRouter()
router.register(r'', TerminViewSet, basename='termin')

urlpatterns = [
    path('hero-sync/', hero_sync_view, name='hero_sync'),
    path('check-reminders/', send_reminders_view, name='check_reminders'),
    path('', include(router.urls)),
]
