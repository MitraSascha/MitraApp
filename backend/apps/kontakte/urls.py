from rest_framework.routers import DefaultRouter
from .views import KontaktViewSet

router = DefaultRouter()
router.register(r'', KontaktViewSet, basename='kontakt')

urlpatterns = router.urls
