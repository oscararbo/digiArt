from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Artworks.models import Artwork, Like


class ToggleLikeView(APIView):
    """POST: Toggle like on an artwork (auth required)."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            # Check if user already liked
            like = Like.objects.filter(artwork=artwork, user=request.user).first()
            
            if like:
                like.delete()
                action = 'unliked'
            else:
                Like.objects.create(artwork=artwork, user=request.user)
                action = 'liked'
            
            # Update like count
            artwork.like_count = artwork.user_likes.count()
            artwork.save(update_fields=['like_count'])
            
            return Response({
                'success': True,
                'action': action,
                'likes': artwork.like_count,
                'message': f'Obra {"marcada como favorita" if action == "liked" else "eliminada de favoritos"}'
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class CheckLikeView(APIView):
    """GET: Check if current user liked an artwork (auth required)."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            liked = Like.objects.filter(artwork=artwork, user=request.user).exists()
            
            return Response({
                'success': True,
                'liked': liked,
                'likes': artwork.like_count
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class GetArtworkLikesView(APIView):
    """GET: Return like count for an artwork."""
    permission_classes = [AllowAny]
    
    def get(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            return Response({
                'success': True,
                'artwork_id': artwork_id,
                'likes': artwork.like_count
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
