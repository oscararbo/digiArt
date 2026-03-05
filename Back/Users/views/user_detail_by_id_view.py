# region IMPORTS
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Users.models import CustomUser
from Users.serializers import UserProfileSerializer
# endregion

# region USER DETAIL BY ID VIEW
class UserDetailByIdView(APIView):
    """Get a user profile by user ID."""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
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
# endregion
