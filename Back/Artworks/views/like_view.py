from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Artworks.models import Artwork, Like


class ToggleLikeView(APIView):
    """
    POST: Dar/Quitar like a una obra
    Requiere autenticación
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            # Verificar si el usuario ya dio like
            like = Like.objects.filter(artwork=artwork, usuario=request.user).first()
            
            if like:
                # Si existe, eliminar el like
                like.delete()
                action = 'unliked'
            else:
                # Si no existe, crear el like
                Like.objects.create(artwork=artwork, usuario=request.user)
                action = 'liked'
            
            # Actualizar el contador de likes en la obra
            artwork.likes = artwork.user_likes.count()
            artwork.save(update_fields=['likes'])
            
            return Response({
                'success': True,
                'action': action,
                'likes': artwork.likes,
                'message': f'Obra {"marcada como favorita" if action == "liked" else "removida de favoritos"}'
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class CheckLikeView(APIView):
    """
    GET: Verificar si el usuario actual le ha dado like a una obra
    Requiere autenticación
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            # Verificar si existe un like
            liked = Like.objects.filter(artwork=artwork, usuario=request.user).exists()
            
            return Response({
                'success': True,
                'liked': liked,
                'likes': artwork.likes
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class GetArtworkLikesView(APIView):
    """
    GET: Obtener cantidad de likes de una obra
    """
    permission_classes = [AllowAny]
    
    def get(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            return Response({
                'success': True,
                'artwork_id': artwork_id,
                'likes': artwork.likes
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
