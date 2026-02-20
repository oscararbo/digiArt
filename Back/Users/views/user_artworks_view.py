from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Users.models import CustomUser
from Artworks.models import Artwork
from Artworks.serializers import ArtworkSerializer


class UserArtworksView(APIView):
    """Obtener obras personales (subidas) de un usuario"""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        try:
            # Verificar que el usuario existe
            user = CustomUser.objects.get(id=user_id)
            
            # Obtener todas las obras del usuario
            artworks = Artwork.objects.filter(autor=user).order_by('-fecha_creacion')
            
            # Serializar las obras
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
