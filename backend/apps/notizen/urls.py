from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotizViewSet

router = DefaultRouter()
router.register(r'', NotizViewSet, basename='notiz')

urlpatterns = [
    path('', include(router.urls)),
]
