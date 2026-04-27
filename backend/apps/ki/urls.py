from django.urls import path
from .views import strukturiere_notiz_view, transkribiere_view, lese_visitenkarte_view

urlpatterns = [
    path('strukturiere-notiz/', strukturiere_notiz_view, name='strukturiere_notiz'),
    path('transkribiere/', transkribiere_view, name='transkribiere'),
    path('lese-visitenkarte/', lese_visitenkarte_view, name='lese_visitenkarte'),
]
