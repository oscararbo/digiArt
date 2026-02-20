# Generated migration for adding profile fields to CustomUser

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0003_alter_customuser_username'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='descripcion',
            field=models.TextField(blank=True, default='', null=True, verbose_name='Descripción del autor'),
        ),
        migrations.AddField(
            model_name='customuser',
            name='imagen_perfil',
            field=models.ImageField(blank=True, null=True, upload_to='profile_images/', verbose_name='Imagen de perfil'),
        ),
    ]
