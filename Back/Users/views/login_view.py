from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Users.serializers import LoginSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data.get('user')
            access_token = serializer.validated_data.get('access')
            refresh_token = serializer.validated_data.get('refresh')

            return Response({
                'success': True,
                'message': 'Inicio de sesión exitoso',
                'access': access_token,
                'refresh': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'nombre': user.nombre,
                    'apellidos': user.apellidos,
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
