from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Users.models import CustomUser
from Users.serializers import UserProfileSerializer


class UserDetailView(APIView):
    """Get a user profile by username."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            user = CustomUser.objects.get(username=username)
            serializer = UserProfileSerializer(user, context={'request': request})
            return Response({
                'success': True,
                'user': serializer.data
            }, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
