# region IMPORTS
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Users.models import CustomUser
from Artworks.models import Artwork
from Artworks.serializers import ArtworkSerializer
# endregion

# region USER ARTWORKS VIEW
class UserArtworksView(APIView):
    """Get artworks uploaded by a user."""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
            
            artworks = Artwork.objects.filter(author=user).order_by('-created_at')
            
            serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'artworks': serializer.data,
                'count': artworks.count()
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
