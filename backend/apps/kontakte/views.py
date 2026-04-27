from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Kontakt
from .serializers import KontaktSerializer


class KontaktViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = KontaktSerializer

    def get_queryset(self):
        return Kontakt.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
