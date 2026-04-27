from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notizen', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notiz',
            name='vonwem',
            field=models.CharField(
                choices=[('kunde', 'Kunde'), ('lieferant', 'Lieferant'), ('intern', 'Intern'), ('aufmass', 'Aufmaß')],
                default='kunde',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='notiz',
            name='topic',
            field=models.CharField(
                choices=[('sanitaer', 'Sanitär'), ('heizung', 'Heizung'), ('notdienst', 'Notdienst'), ('allgemein', 'Allgemein')],
                default='allgemein',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='notiz',
            name='summary',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='notiz',
            name='raw_transcript',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='notiz',
            name='titel',
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
