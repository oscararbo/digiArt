from django.db import migrations


def rename_m2m_table(apps, schema_editor):
    existing_tables = schema_editor.connection.introspection.table_names()
    if 'artworks_generos' in existing_tables and 'artworks_genres' not in existing_tables:
        schema_editor.execute('ALTER TABLE artworks_generos RENAME TO artworks_genres')


def reverse_rename_m2m_table(apps, schema_editor):
    existing_tables = schema_editor.connection.introspection.table_names()
    if 'artworks_genres' in existing_tables and 'artworks_generos' not in existing_tables:
        schema_editor.execute('ALTER TABLE artworks_genres RENAME TO artworks_generos')


class Migration(migrations.Migration):

    dependencies = [
        ('Artworks', '0003_alter_artwork_options_alter_genre_options_and_more'),
    ]

    operations = [
        migrations.RunPython(rename_m2m_table, reverse_rename_m2m_table),
    ]
