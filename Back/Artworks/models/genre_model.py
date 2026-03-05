# region IMPORTS
from django.db import models
# endregion

# region GENRE MODEL
class Genre(models.Model):
    """Genre available for artworks."""
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, blank=False, null=False, db_column='nombre')
    description = models.TextField(blank=True, null=True, default="", db_column='descripcion')
    
    created_at = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    
    # region META AND METHODS
    class Meta:
        db_table = 'genres'
        ordering = ['name']
        verbose_name = 'Genre'
        verbose_name_plural = 'Genres'
    
    def __str__(self):
        return self.name
    # endregion
# endregion
