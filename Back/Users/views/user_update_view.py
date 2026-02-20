from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from Users.serializers import UserProfileSerializer, UserProfileUpdateSerializer


class UserUpdateView(APIView):
    """Update the authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                # Retornar el perfil actualizado
                profile_serializer = UserProfileSerializer(user, context={'request': request})
                return Response({
                    'success': True,
                    'message': 'Perfil actualizado exitosamente',
                    'user': profile_serializer.data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
