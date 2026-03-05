# region IMPORTS
from rest_framework import serializers
from Artworks.models import Artwork, Genre, Comment
from datetime import timedelta
from django.utils import timezone
# endregion

# region COMMENT SERIALIZER
class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments on artworks."""
    username = serializers.CharField(source='author.username', read_only=True)
    profileImage = serializers.SerializerMethodField()
    relativeTime = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ('id', 'username', 'profileImage', 'content', 'created_at', 'relativeTime')
        read_only_fields = ('id', 'created_at', 'username', 'profileImage', 'relativeTime')
    
    def get_profileImage(self, obj):
        if obj.author.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author.profile_image.url)
            return f'http://127.0.0.1:8000{obj.author.profile_image.url}'
        return None
    
    def get_relativeTime(self, obj):
        """Calculate relative time (e.g., '2 hours ago', '1 day ago')"""
        now = timezone.now()
        delta = now - obj.created_at
        
        if delta < timedelta(minutes=1):
            return 'Ahora mismo'
        elif delta < timedelta(hours=1):
            minutes = delta.seconds // 60
            return f'Hace {minutes} minuto{"s" if minutes != 1 else ""}'
        elif delta < timedelta(days=1):
            hours = delta.seconds // 3600
            return f'Hace {hours} hora{"s" if hours != 1 else ""}'
        elif delta < timedelta(days=7):
            days = delta.days
            return f'Hace {days} día{"s" if days != 1 else ""}'
        elif delta < timedelta(days=30):
            weeks = delta.days // 7
            return f'Hace {weeks} semana{"s" if weeks != 1 else ""}'
        else:
            months = delta.days // 30
            return f'Hace {months} mes{"es" if months != 1 else ""}'
# endregion

# region ARTWORK VALIDATION MIXIN
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
# endregion

# region ARTWORK SERIALIZER
class ArtworkSerializer(ArtworkValidationMixin, serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True, use_url=False)
    genres = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False
    )
    authorUsername = serializers.CharField(source='author.username', read_only=True)
    authorId = serializers.CharField(source='author.id', read_only=True)
    authorProfileImage = serializers.SerializerMethodField()
    genreNames = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()
    isLiked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    viewCount = serializers.IntegerField(source='view_count', read_only=True)
    likeCount = serializers.IntegerField(source='like_count', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Artwork
        fields = (
            'id', 'title', 'description', 'image', 'imageUrl',
            'genres', 'genreNames', 'authorUsername', 'authorId', 'authorProfileImage',
            'viewCount', 'likeCount', 'createdAt', 'isLiked', 'comments'
        )
        read_only_fields = ('id', 'viewCount', 'likeCount', 'createdAt', 'authorUsername', 'authorId', 'imageUrl', 'isLiked', 'comments')
    
    def get_authorProfileImage(self, obj):
        if obj.author.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.author.profile_image.url)
            return f'http://127.0.0.1:8000{obj.author.profile_image.url}'
        return None
    
    def get_genreNames(self, obj):
        return [g.name for g in obj.genres.all()]
    
    def get_imageUrl(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return f'http://127.0.0.1:8000{obj.image.url}'
        return None
    
    def get_isLiked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from Artworks.models import Like
            return Like.objects.filter(artwork=obj, user=request.user).exists()
        return False
    
    def get_comments(self, obj):
        comments = obj.comments.all()
        serializer = CommentSerializer(comments, many=True, context=self.context)
        return serializer.data
# endregion

# region ARTWORK CREATE SERIALIZER
class ArtworkCreateSerializer(ArtworkValidationMixin, serializers.ModelSerializer):
    genres = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Artwork
        fields = ('title', 'description', 'image', 'genres')
# endregion
