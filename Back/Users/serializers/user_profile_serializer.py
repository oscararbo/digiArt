# region IMPORTS
from rest_framework import serializers
from Users.models import CustomUser
# endregion

# region USER PROFILE SERIALIZER
class UserProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name',
            'description', 'profile_image', 'created_at'
        )
        read_only_fields = ('id', 'email', 'created_at')
    
    def get_profile_image(self, obj):
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return f'http://127.0.0.1:8000{obj.profile_image.url}'
        return None
# endregion

# region USER PROFILE UPDATE SERIALIZER
class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('username', 'first_name', 'last_name', 'description', 'profile_image')
    
    def validate_username(self, value):
        user = self.instance
        if CustomUser.objects.filter(username=value).exclude(id=user.id).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value
# endregion
