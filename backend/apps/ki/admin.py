from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'HERO CRM Profil'
    fields = ('rolle', 'hero_partner_id')

class MitraUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)

    def get_inlines(self, request, obj=None):
        # Beim Anlegen (obj=None) kein Inline — Signal erstellt das Profil automatisch.
        # Beim Bearbeiten vorhandener User: Inline anzeigen.
        if obj is None:
            return []
        return super().get_inlines(request, obj)

admin.site.unregister(User)
admin.site.register(User, MitraUserAdmin)
