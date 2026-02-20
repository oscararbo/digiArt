from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Users.models import CustomUser
from Artworks.models import Like
from Artworks.serializers import ArtworkSerializer


class UserLikedArtworksView(APIView):
    """Obtener obras favoritas (likes) de un usuario"""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            # Verificar que el usuario existe
            user = CustomUser.objects.get(id=user_id)
            
            # Obtener todos los likes del usuario
            likes = Like.objects.filter(usuario=user).select_related('artwork')
            
            # Extraer las obras de los likes
            artworks = [like.artwork for like in likes]
            
            # Serializar las obras
            serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'artworks': serializer.data,
                'count': len(artworks)
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
