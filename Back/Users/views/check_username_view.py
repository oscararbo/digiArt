from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Users.models import CustomUser


class CheckUsernameView(APIView):
    """
    GET: Verificar si un username está disponible
    Parámetros query:
    - username: nombre a verificar (obligatorio)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        username = request.query_params.get('username', '').strip()
        
        if not username:
            return Response({
                'success': False,
                'error': 'Username requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(username) < 3:
            return Response({
                'success': False,
                'disponible': False,
                'error': 'El nombre de usuario debe tener al menos 3 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        disponible = not CustomUser.objects.filter(username=username).exists()
        
        return Response({
            'success': True,
            'username': username,
            'disponible': disponible
        }, status=status.HTTP_200_OK)
