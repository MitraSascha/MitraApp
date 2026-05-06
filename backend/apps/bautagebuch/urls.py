from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TagesberichtViewSet

router = DefaultRouter()
router.register(r'', TagesberichtViewSet, basename='tagesbericht')

urlpatterns = [
    path('', include(router.urls)),
]
