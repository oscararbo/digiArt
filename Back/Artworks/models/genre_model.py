from django.db import models


class Genre(models.Model):
    """Modelo de géneros disponibles para las obras"""
    
    id = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100, unique=True, blank=False, null=False)
    descripcion = models.TextField(blank=True, null=True, default="")
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'genres'
        ordering = ['nombre']
        verbose_name = 'Género'
        verbose_name_plural = 'Géneros'
    
    def __str__(self):
        return self.nombre
