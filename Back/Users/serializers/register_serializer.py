from rest_framework import serializers
from Users.models import CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True, allow_blank=False, allow_null=False, max_length=100)
    username = serializers.CharField(required=True, allow_blank=False, allow_null=False, max_length=50)
    password = serializers.CharField(required=True, allow_blank=False, allow_null=False, min_length=6, write_only=True)
    password_repeat = serializers.CharField(required=True, allow_blank=False, allow_null=False, min_length=6, write_only=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'username', 'password', 'password_repeat')

    def validate_email(self, email):
        if "@" not in email:
            raise serializers.ValidationError("El email no es válido")
        
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        
        return email

    def validate_username(self, username):
        if len(username) < 3:
            raise serializers.ValidationError("El nombre de usuario debe tener al menos 3 caracteres")
        
        if not username.replace('_', '').replace('-', '').isalnum():
            raise serializers.ValidationError("El nombre de usuario solo puede contener letras, números, guiones y guiones bajos")
        
        if CustomUser.objects.filter(username=username).exists():
            raise serializers.ValidationError("Este nombre de usuario ya existe. Por favor elige otro")
        
        return username

    def validate_password(self, password):
        if not any(n.isdigit() for n in password):
            raise serializers.ValidationError("La contraseña debe contener al menos un número")
        return password

    def validate(self, attrs):
        password = attrs.get('password')
        password_repeat = attrs.get('password_repeat')

        if password != password_repeat:
            raise serializers.ValidationError("Las contraseñas no coinciden")

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_repeat')
        password = validated_data.pop('password')

        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        return user
