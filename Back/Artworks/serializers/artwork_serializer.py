from rest_framework import serializers
from Artworks.models import Artwork, Genre


class ArtworkSerializer(serializers.ModelSerializer):
    generos = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False
    )
    autor_username = serializers.CharField(source='autor.username', read_only=True)
    generos_nombres = serializers.SerializerMethodField()
    
    class Meta:
        model = Artwork
        fields = (
            'id', 'titulo', 'descripcion', 'imagen', 
            'generos', 'generos_nombres', 'autor_username',
            'vistas', 'likes', 'fecha_creacion'
        )
        read_only_fields = ('id', 'vistas', 'likes', 'fecha_creacion', 'autor_username')
    
    def get_generos_nombres(self, obj):
        return [g.nombre for g in obj.generos.all()]
    
    def validate_generos(self, generos):
        if len(generos) > 3:
            raise serializers.ValidationError("Máximo 3 géneros permitidos")
        return generos
    
    def validate_imagen(self, imagen):
        # Validar que sea una imagen (extensión)
        extensiones_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        ext = imagen.name.split('.')[-1].lower()
        
        if ext not in extensiones_permitidas:
            raise serializers.ValidationError(
                f"Extensión no permitida. Extensiones válidas: {', '.join(extensiones_permitidas)}"
            )
        
        # Validar tamaño máximo (10MB)
        if imagen.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("El archivo no puede exceder 10MB")
        
        return imagen
    
    def validate_titulo(self, titulo):
        if len(titulo) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres")
        if len(titulo) > 200:
            raise serializers.ValidationError("El título no puede exceder 200 caracteres")
        return titulo


class ArtworkCreateSerializer(serializers.ModelSerializer):
    generos = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        many=True,
        required=False
    )
    
    class Meta:
        model = Artwork
        fields = ('titulo', 'descripcion', 'imagen', 'generos')
    
    def validate_generos(self, generos):
        if len(generos) > 3:
            raise serializers.ValidationError("Máximo 3 géneros permitidos")
        return generos
    
    def validate_imagen(self, imagen):
        extensiones_permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
        ext = imagen.name.split('.')[-1].lower()
        
        if ext not in extensiones_permitidas:
            raise serializers.ValidationError(
                f"Extensión no permitida. Extensiones válidas: {', '.join(extensiones_permitidas)}"
            )
        
        if imagen.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("El archivo no puede exceder 10MB")
        
        return imagen
    
    def validate_titulo(self, titulo):
        if len(titulo) < 3:
            raise serializers.ValidationError("El título debe tener al menos 3 caracteres")
        if len(titulo) > 200:
            raise serializers.ValidationError("El título no puede exceder 200 caracteres")
        return titulo
