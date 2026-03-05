# region IMPORTS
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q

from Artworks.models import Genre
from Artworks.serializers import GenreSerializer
# endregion

# region GENRE VIEWS
class GenreSearchView(APIView):
    """GET: Return genres, optionally filtered by search term."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        search = request.query_params.get('search', '').strip()
        
        genres = Genre.objects.all()
        
        if search:
            genres = genres.filter(name__icontains=search)
        
        genres = genres[:50]
        serializer = GenreSerializer(genres, many=True)
        
        return Response({
            'success': True,
            'count': len(serializer.data),
            'genres': serializer.data
        }, status=status.HTTP_200_OK)
# endregion

# region ARTWORK CRUD
class ArtworkCreateView(APIView):
    """POST: Create a new artwork (auth required)."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from Artworks.serializers import ArtworkCreateSerializer
        from Artworks.models import Artwork
        
        serializer = ArtworkCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Create artwork for current user
                artwork = serializer.save(author=request.user)
                
                # Attach genres if provided
                if 'genres' in request.data:
                    genres = request.data.get('genres', [])
                    if isinstance(genres, str):
                        genres = [genres]
                    artwork.genres.set(genres)
                
                from Artworks.serializers import ArtworkSerializer
                result = ArtworkSerializer(artwork, context={'request': request})
                
                return Response({
                    'success': True,
                    'message': '¡Obra subida exitosamente!',
                    'artwork': result.data
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response({
                    'success': False,
                    'error': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)


class ArtworkListView(APIView):
    """GET: Return all artworks or filter by username."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        from Users.models import CustomUser
        
        username = request.query_params.get('user', '').strip()
        
        artworks = Artwork.objects.all()
        
        if username:
            try:
                user = CustomUser.objects.get(username=username)
                artworks = artworks.filter(author=user)
            except CustomUser.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Usuario no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'count': artworks.count(),
            'artworks': serializer.data
        }, status=status.HTTP_200_OK)


class ArtworkDetailView(APIView):
    """GET: Return a single artwork by id."""
    permission_classes = [AllowAny]
    
    def get(self, request, artwork_id):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            # Increment view count
            artwork.view_count += 1
            artwork.save(update_fields=['view_count'])
            
            serializer = ArtworkSerializer(artwork, context={'request': request})
            
            return Response({
                'success': True,
                'artwork': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class ArtworkIncrementViewView(APIView):
    """POST: Increment view count for an artwork."""
    permission_classes = [AllowAny]
    
    def post(self, request, artwork_id):
        from Artworks.models import Artwork
        
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            artwork.view_count += 1
            artwork.save(update_fields=['view_count'])
            
            return Response({
                'success': True,
                'views': artwork.view_count
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
# endregion

# region SPECIAL LISTING VIEWS
class FeaturedArtworksView(APIView):
    """GET: Return featured artworks (most likes in last 7 days)."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from Artworks.models import Artwork, Like
        from Artworks.serializers import ArtworkSerializer
        
        limit = int(request.query_params.get('limit', 10))
        
        last_week = timezone.now() - timedelta(days=7)
        
        artworks = Artwork.objects.annotate(
            likes_week=Count('user_likes', filter=Q(user_likes__created_at__gte=last_week))
        ).order_by('-likes_week', '-created_at')[:limit]
        
        serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'count': len(serializer.data),
            'artworks': serializer.data
        }, status=status.HTTP_200_OK)


class RecentArtworksView(APIView):
    """GET: Return most recent artworks."""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        
        limit = int(request.query_params.get('limit', 10))
        
        artworks = Artwork.objects.all().order_by('-created_at')[:limit]
        
        serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'count': len(serializer.data),
            'artworks': serializer.data
        }, status=status.HTTP_200_OK)


class ArtworksByGenreView(APIView):
    """GET: Return artworks by genre id."""
    permission_classes = [AllowAny]
    
    def get(self, request, genre_id):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        
        limit = int(request.query_params.get('limit', 10))
        
        try:
            genre = Genre.objects.get(id=genre_id)
            artworks = Artwork.objects.filter(genres=genre).order_by('-created_at')[:limit]
            
            serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'genre': genre.name,
                'count': len(serializer.data),
                'artworks': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Genre.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Género no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
# endregion

