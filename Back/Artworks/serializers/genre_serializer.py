from rest_framework import serializers
from Artworks.models import Genre


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ('id', 'nombre', 'descripcion')
