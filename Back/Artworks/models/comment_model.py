# region IMPORTS
from django.db import models
from django.conf import settings
import uuid
# endregion

# region COMMENT MODEL
class Comment(models.Model):
    """Comment on an artwork."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # The artwork being commented on
    artwork = models.ForeignKey(
        'Artwork',
        on_delete=models.CASCADE,
        related_name='comments',
        blank=False,
        null=False,
        db_column='obra_id'
    )
    
    # The user making the comment
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comments',
        blank=False,
        null=False,
        db_column='usuario_id'
    )
    
    # Comment content
    content = models.TextField(blank=False, null=False, db_column='contenido')
    
    created_at = models.DateTimeField(auto_now_add=True, db_column='fecha_creacion')
    updated_at = models.DateTimeField(auto_now=True, db_column='fecha_actualizacion')
    
    # region META AND METHODS
    class Meta:
        db_table = 'comments'
        ordering = ['-created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.artwork.title}"
    # endregion
# endregion
