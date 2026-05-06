from django.urls import path
from .views import (
    artikel_suche_view, artikel_detail_view, hero_suche_view,
    ids_shop_url_view, ids_hook_view, ids_warenkorb_view,
)

urlpatterns = [
    path('suche/', artikel_suche_view, name='artikel_suche'),
    path('hero-suche/', hero_suche_view, name='hero_suche'),
    # IDS Connect (Großhändler Browser-Flow)
    path('ids-shop-url/', ids_shop_url_view, name='ids_shop_url'),
    path('ids-hook/<int:user_id>/', ids_hook_view, name='ids_hook'),
    path('ids-warenkorb/', ids_warenkorb_view, name='ids_warenkorb'),
    path('<str:artnr>/', artikel_detail_view, name='artikel_detail'),
]
