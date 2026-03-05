# region IMPORTS
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from Users.models import CustomUser
# endregion

# region CHECK USERNAME VIEW
class CheckUsernameView(APIView):
    """GET: Check whether a username is available."""
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
                'available': False,
                'error': 'El nombre de usuario debe tener al menos 3 caracteres'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        is_available = not CustomUser.objects.filter(username=username).exists()
        
        return Response({
            'success': True,
            'username': username,
            'available': is_available
        }, status=status.HTTP_200_OK)
# endregion
