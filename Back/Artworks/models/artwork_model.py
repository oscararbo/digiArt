from django.db import models
from django.conf import settings
import uuid


class Artwork(models.Model):
    """Modelo para las obras de arte subidas por los usuarios"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200, blank=False, null=False)
    descripcion = models.TextField(blank=True, null=True, default="")
    
    # Relación con el usuario (autor)
    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='artworks',
        blank=False,
        null=False
    )
    
    # Géneros (máximo 3)
    generos = models.ManyToManyField('Genre', related_name='artworks', blank=True)
    
    # Imagen
    imagen = models.ImageField(
        upload_to='artworks/',
        blank=False,
        null=False,
        help_text="Imagen de la obra (máximo 10MB)"
    )
    
    # Metadatos
    vistas = models.IntegerField(default=0)
    likes = models.IntegerField(default=0)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'artworks'
        ordering = ['-fecha_creacion']
        verbose_name = 'Obra'
        verbose_name_plural = 'Obras'
        
    def __str__(self):
        return f"{self.titulo} - {self.autor.username}"
    
    def get_generos_count(self):
        return self.generos.count()
