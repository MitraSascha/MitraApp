from rest_framework.routers import DefaultRouter
from .views import AngebotViewSet

router = DefaultRouter()
router.register(r'', AngebotViewSet, basename='angebot')

urlpatterns = router.urls
