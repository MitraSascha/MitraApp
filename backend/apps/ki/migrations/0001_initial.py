from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rolle', models.CharField(choices=[('monteur', 'Monteur'), ('buero', 'Büro'), ('admin', 'Administrator')], default='monteur', max_length=20)),
                ('hero_partner_id', models.CharField(blank=True, default='', help_text='Individuelle Partner-ID für HERO CRM Termin-Sync', max_length=100, verbose_name='HERO Partner-ID')),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={'verbose_name': 'Benutzerprofil', 'verbose_name_plural': 'Benutzerprofile'},
        ),
    ]
