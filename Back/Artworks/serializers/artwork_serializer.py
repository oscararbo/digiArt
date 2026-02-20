from rest_framework import serializers
from Artworks.models import Artwork, Genre


class ArtworkValidationMixin:
    """Mixin con métodos de validación compartidos para serializadores de Artwork"""
    
    def validate_genres(self, genres):
        if len(genres) > 3:
            raise serializers.ValidationError("Máximo 3 géneros permitidos")
        return genres
    
    def validate_image(self, image):
        # Validar que sea una imagen (extensión)
        extensiones_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        ext = image.name.split('.')[-1].lower()
        
        if ext not in extensiones_permitidas:
            raise serializers.ValidationError(
                f"Extensión no permitida. Extensiones válidas: {', '.join(extensiones_permitidas)}"
            )
        
        # Validar tamaño máximo (10MB)
        if image.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("El archivo no puede exceder 10MB")
        
        return image
    
    def validate_title(self, title):
        if len(title) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres")
        if len(title) > 200:
            raise serializers.ValidationError("El título no puede exceder 200 caracteres")
        return title


class ArtworkSerializer(ArtworkValidationMixin, serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True, use_url=False)
    genres = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False
    )
    author_username = serializers.CharField(source='author.username', read_only=True)
    genre_names = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Artwork
        fields = (
            'id', 'title', 'description', 'image', 'image_url',
            'genres', 'genre_names', 'author_username',
            'view_count', 'like_count', 'created_at'
        )
        read_only_fields = ('id', 'view_count', 'like_count', 'created_at', 'author_username', 'image_url')
    
    def get_genre_names(self, obj):
        return [g.name for g in obj.genres.all()]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'http://127.0.0.1:8000{obj.image.url}'
        return None


class ArtworkCreateSerializer(ArtworkValidationMixin, serializers.ModelSerializer):
    genres = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Artwork
        fields = ('title', 'description', 'image', 'genres')
