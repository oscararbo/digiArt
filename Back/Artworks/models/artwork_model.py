# region IMPORTS
from django.db import models
from django.conf import settings
import uuid
# endregion

# region ARTWORK MODEL
class Artwork(models.Model):
    """Artwork uploaded by a user."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, blank=False, null=False, db_column='titulo')
    description = models.TextField(blank=True, null=True, default="", db_column='descripcion')
    
    # Author relationship
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='artworks',
        blank=False,
        null=False,
        db_column='autor_id'
    )
    
    # Genres (max 3)
    genres = models.ManyToManyField('Genre', related_name='artworks', blank=True)
    
    # Image
    image = models.ImageField(
        upload_to='artworks/',
        blank=False,
        null=False,
        help_text="Imagen de la obra (máximo 10MB)",
        db_column='imagen'
    )
    
    # Metrics
    view_count = models.IntegerField(default=0, db_column='vistas')
    like_count = models.IntegerField(default=0, db_column='likes')
    
    created_at = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    updated_at = models.DateTimeField(auto_now=True, db_column='fecha_actualizacion')
    
    # region META AND METHODS
    class Meta:
        db_table = 'artworks'
        ordering = ['-created_at']
        verbose_name = 'Artwork'
        verbose_name_plural = 'Artworks'
        
    def __str__(self):
        return f"{self.title} - {self.author.username}"
    
    def get_genres_count(self):
        return self.genres.count()
    # endregion
# endregion
