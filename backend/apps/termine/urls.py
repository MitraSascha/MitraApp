from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TerminViewSet, hero_sync_view

router = DefaultRouter()
router.register(r'', TerminViewSet, basename='termin')

urlpatterns = [
    path('hero-sync/', hero_sync_view, name='hero_sync'),
    path('', include(router.urls)),
]
