from django.contrib import admin
from Artworks.models import Genre, Artwork, Like


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'view_count', 'like_count', 'created_at')
    list_filter = ('created_at', 'genres')
    search_fields = ('title', 'author__username')
    filter_horizontal = ('genres',)
    readonly_fields = ('id', 'view_count', 'like_count', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Artwork Info', {
            'fields': ('id', 'title', 'description', 'image')
        }),
        ('Author and Genres', {
            'fields': ('author', 'genres')
        }),
        ('Metadata', {
            'fields': ('view_count', 'like_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'artwork', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'artwork__title')
    readonly_fields = ('created_at',)
