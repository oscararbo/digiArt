# Generated migration for Artworks app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Genre',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100, unique=True)),
                ('descripcion', models.TextField(blank=True, default='', null=True)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Género',
                'verbose_name_plural': 'Géneros',
                'db_table': 'genres',
                'ordering': ['nombre'],
            },
        ),
        migrations.CreateModel(
            name='Artwork',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('titulo', models.CharField(max_length=200)),
                ('descripcion', models.TextField(blank=True, default='', null=True)),
                ('imagen', models.ImageField(help_text='Imagen de la obra (máximo 10MB)', upload_to='artworks/')),
                ('vistas', models.IntegerField(default=0)),
                ('likes', models.IntegerField(default=0)),
                ('fecha_creacion', models.DateTimeField(auto_now_add=True)),
                ('fecha_actualizacion', models.DateTimeField(auto_now=True)),
                ('autor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='artworks', to=settings.AUTH_USER_MODEL)),
                ('generos', models.ManyToManyField(blank=True, related_name='artworks', to='Artworks.genre')),
            ],
            options={
                'verbose_name': 'Obra',
                'verbose_name_plural': 'Obras',
                'db_table': 'artworks',
                'ordering': ['-fecha_creacion'],
            },
        ),
    ]
