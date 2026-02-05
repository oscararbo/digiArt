from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from Users.models import CustomUser


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=100, required=True)
    password = serializers.CharField(required=True, allow_blank=False, allow_null=False, min_length=6)

    def validate_password(self, password):
        if not any(n.isdigit() for n in password):
            raise serializers.ValidationError("La contraseña debe contener al menos un número")
        return password

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError("Email y contraseña son requeridos")

        # Verificar formato del email
        if "@" not in email:
            raise serializers.ValidationError("Email o contraseña incorrecta")

        # Buscar el usuario
        user = CustomUser.objects.filter(email=email).first()

        if not user:
            raise serializers.ValidationError("El usuario no existe")

        if not user.check_password(password):
            raise serializers.ValidationError("Email o contraseña incorrecta")

        if not user.is_active:
            raise serializers.ValidationError("La cuenta está inactiva")

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        attrs['user'] = user
        attrs['access'] = str(refresh.access_token)
        attrs['refresh'] = str(refresh)

        return attrs
