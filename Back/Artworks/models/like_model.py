# region IMPORTS
from django.db import models
from django.conf import settings
# endregion

# region LIKE MODEL
class Like(models.Model):
    """Like relation for artworks."""
    
    artwork = models.ForeignKey(
        'Artwork',
        on_delete=models.CASCADE,
        related_name='user_likes',
        blank=False,
        null=False
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='likes',
        blank=False,
        null=False,
        db_column='usuario_id'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    
    # region META AND METHODS
    class Meta:
        db_table = 'likes'
        unique_together = ('artwork', 'user',)
        ordering = ['-created_at']
        verbose_name = 'Like'
        verbose_name_plural = 'Likes'
        
    def __str__(self):
        return f"{self.user.username} liked {self.artwork.title}"
    # endregion
# endregion
