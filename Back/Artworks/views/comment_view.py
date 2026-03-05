# region IMPORTS
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from Artworks.models import Artwork, Comment
from Artworks.serializers import CommentSerializer
# endregion

# region ARTWORK COMMENTS VIEW
class ArtworkCommentsView(APIView):
    """GET: Get all comments for an artwork. POST: Add a new comment."""
    
    def get(self, request, artwork_id):
        """Get all comments for an artwork"""
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            comments = Comment.objects.filter(artwork=artwork)
            serializer = CommentSerializer(comments, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'comments': serializer.data
            }, status=status.HTTP_200_OK)
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, artwork_id):
        """Add a new comment to an artwork"""
        if not request.user.is_authenticated:
            return Response({
                'success': False,
                'error': 'Autenticación requerida'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            # Get comment content from request
            content = request.data.get('content', '').strip()
            if not content:
                return Response({
                    'success': False,
                    'error': 'El comentario no puede estar vacío'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create comment
            comment = Comment.objects.create(
                artwork=artwork,
                author=request.user,
                content=content
            )
            
            serializer = CommentSerializer(comment, context={'request': request})
            
            return Response({
                'success': True,
                'comment': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
# endregion

# region COMMENT DETAIL VIEW
class ArtworkCommentDetailView(APIView):
    """DELETE: Delete a comment."""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, artwork_id, comment_id):
        """Delete a comment (author only)"""
        try:
            comment = Comment.objects.get(id=comment_id, artwork_id=artwork_id)
            
            # Ensure the requester is the author
            if comment.author != request.user:
                return Response({
                    'success': False,
                    'error': 'No tienes permiso para eliminar este comentario'
                }, status=status.HTTP_403_FORBIDDEN)
            
            comment.delete()
            
            return Response({
                'success': True,
                'message': 'Comentario eliminado correctamente'
            }, status=status.HTTP_204_NO_CONTENT)
        
        except Comment.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Comentario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
# endregion
