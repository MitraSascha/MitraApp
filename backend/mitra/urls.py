from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from apps.ki.views import me_view

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth
    path('api/auth/login/', include('apps.ki.auth_urls')),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/me/', me_view, name='user_me'),

    # Features
    path('api/notizen/', include('apps.notizen.urls')),
    path('api/termine/', include('apps.termine.urls')),
    path('api/kontakte/', include('apps.kontakte.urls')),
    path('api/angebote/', include('apps.angebote.urls')),
    path('api/ki/', include('apps.ki.urls')),
    path('api/push/', include('apps.push.urls')),
    path('api/wissen/', include('apps.wissen.urls')),
    path('api/artikel/', include('apps.artikel.urls')),
]
