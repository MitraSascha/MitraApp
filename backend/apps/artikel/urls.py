from django.urls import path
from .views import artikel_suche_view, artikel_detail_view

urlpatterns = [
    path('suche/', artikel_suche_view, name='artikel_suche'),
    path('<str:artnr>/', artikel_detail_view, name='artikel_detail'),
]
