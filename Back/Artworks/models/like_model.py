from django.db import models
from django.conf import settings


class Like(models.Model):
    """Modelo para rastrear los likes en las obras de arte"""
    
    artwork = models.ForeignKey(
        'Artwork',
        on_delete=models.CASCADE,
        related_name='user_likes',
        blank=False,
        null=False
    )
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes',
        blank=False,
        null=False
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'likes'
        unique_together = ('artwork', 'usuario',)
        ordering = ['-fecha_creacion']
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'
        
    def __str__(self):
        return f"{self.usuario.username} liked {self.artwork.titulo}"
