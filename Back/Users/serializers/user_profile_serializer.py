from rest_framework import serializers
from Users.models import CustomUser


class UserProfileSerializer(serializers.ModelSerializer):
    imagen_perfil = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username', 'nombre', 'apellidos',
            'descripcion', 'imagen_perfil', 'fecha_creacion'
        )
        read_only_fields = ('id', 'email', 'fecha_creacion')
    
    def get_imagen_perfil(self, obj):
        if obj.imagen_perfil:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen_perfil.url)
            return f'http://127.0.0.1:8000{obj.imagen_perfil.url}'
        return None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'nombre', 'apellidos', 'descripcion', 'imagen_perfil')
    
    def validate_username(self, value):
        # Verificar que el username no esté en uso por otro usuario
        user = self.instance
        if CustomUser.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value
