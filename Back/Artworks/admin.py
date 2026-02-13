from django.contrib import admin
from Artworks.models import Genre, Artwork, Like


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'fecha_creacion')
    search_fields = ('nombre',)
    ordering = ('nombre',)


@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'autor', 'vistas', 'likes', 'fecha_creacion')
    list_filter = ('fecha_creacion', 'generos')
    search_fields = ('titulo', 'autor__username')
    filter_horizontal = ('generos',)
    readonly_fields = ('id', 'vistas', 'likes', 'fecha_creacion', 'fecha_actualizacion')
    
    fieldsets = (
        ('Información de la Obra', {
            'fields': ('id', 'titulo', 'descripcion', 'imagen')
        }),
        ('Autor y Géneros', {
            'fields': ('autor', 'generos')
        }),
        ('Metadatos', {
            'fields': ('vistas', 'likes', 'fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'artwork', 'fecha_creacion')
    list_filter = ('fecha_creacion',)
    search_fields = ('usuario__username', 'artwork__titulo')
    readonly_fields = ('fecha_creacion',)
