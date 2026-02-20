from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Users.models import CustomUser


class CheckEmailView(APIView):
    """GET: Check whether an email is available."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        email = request.query_params.get('email', '').strip()
        
        if not email:
            return Response({
                'success': False,
                'error': 'Email requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        exists = CustomUser.objects.filter(email=email).exists()
        
        return Response({
            'success': True,
            'available': not exists,
            'email': email
        }, status=status.HTTP_200_OK)
