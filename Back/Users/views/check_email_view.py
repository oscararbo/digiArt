from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Users.models import CustomUser


class CheckEmailView(APIView):
    """
    GET: Verificar si un email está disponible
    Parámetros query:
    - email: correo a verificar (obligatorio)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email', '').strip()
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        existe = CustomUser.objects.filter(email=email).exists()
        
        return Response({
            'disponible': not existe,
            'email': email
        }, status=status.HTTP_200_OK)
