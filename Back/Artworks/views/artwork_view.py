from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import timedelta
from django.utils import timezone
from django.db.models import Count, Q
from django.db import models

from Artworks.models import Genre
from Artworks.serializers import GenreSerializer


class GenreSearchView(APIView):
    """
    GET: Obtener géneros, opcionalmente filtrados por búsqueda
    Parámetros query:
    - search: término de búsqueda (opcional)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        search = request.query_params.get('search', '').strip()
        
        generos = Genre.objects.all()
        
        if search:
            generos = generos.filter(nombre__icontains=search)
        
        generos = generos[:50]  # Máximo 50 resultados
        
        serializer = GenreSerializer(generos, many=True)
        
        return Response({
            'success': True,
            'count': len(serializer.data),
            'genres': serializer.data
        }, status=status.HTTP_200_OK)


class ArtworkCreateView(APIView):
    """
    POST: Crear una nueva obra
    Requiere autenticación
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        from Artworks.serializers import ArtworkCreateSerializer
        from Artworks.models import Artwork
        
        serializer = ArtworkCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                # Crear la obra asociándola al usuario actual
                artwork = serializer.save(autor=request.user)
                
                # Si hay géneros, asociarlos
                if 'generos' in request.data:
                    generos = request.data.get('generos', [])
                    if isinstance(generos, str):
                        generos = [generos]
                    artwork.generos.set(generos)
                
                from Artworks.serializers import ArtworkSerializer
                resultado = ArtworkSerializer(artwork, context={'request': request})
                
                return Response({
                    'success': True,
                    'message': '¡Obra subida exitosamente!',
                    'artwork': resultado.data
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
    """
    GET: Obtener todas las obras o filtrar por usuario
    Parámetros query:
    - user: username del usuario (opcional)
    """
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
                artworks = artworks.filter(autor=user)
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
    """
    GET: Obtener detalles de una obra específica
    """
    permission_classes = [AllowAny]
    
    def get(self, request, artwork_id):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            # Incrementar vistas
            artwork.vistas += 1
            artwork.save(update_fields=['vistas'])
            
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


class ArtworkDeleteView(APIView):
    """
    DELETE: Eliminar una obra (solo el autor)
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, artwork_id):
        from Artworks.models import Artwork
        
        try:
            artwork = Artwork.objects.get(id=artwork_id)
            
            # Verificar que es el autor
            if artwork.autor != request.user:
                return Response({
                    'success': False,
                    'error': 'No tienes permiso para eliminar esta obra'
                }, status=status.HTTP_403_FORBIDDEN)
            
            artwork.delete()
            
            return Response({
                'success': True,
                'message': 'Obra eliminada exitosamente'
            }, status=status.HTTP_200_OK)
            
        except Artwork.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Obra no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class FeaturedArtworksView(APIView):
    """
    GET: Obtener obras destacadas (más likes en los últimos 7 días)
    Parámetro query:
    - limit: cantidad de obras (default 10)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from Artworks.models import Artwork, Like
        from Artworks.serializers import ArtworkSerializer
        
        limit = int(request.query_params.get('limit', 10))
        
        # Últimos 7 días
        una_semana_atras = timezone.now() - timedelta(days=7)
        
        # Obtener obras con más likes en la última semana
        artworks = Artwork.objects.annotate(
            likes_semana=Count('user_likes', filter=Q(user_likes__fecha_creacion__gte=una_semana_atras))
        ).order_by('-likes_semana', '-fecha_creacion')[:limit]
        
        serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'count': len(serializer.data),
            'artworks': serializer.data
        }, status=status.HTTP_200_OK)


class RecentArtworksView(APIView):
    """
    GET: Obtener obras más recientes
    Parámetro query:
    - limit: cantidad de obras (default 10)
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        
        limit = int(request.query_params.get('limit', 10))
        
        artworks = Artwork.objects.all().order_by('-fecha_creacion')[:limit]
        
        serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'count': len(serializer.data),
            'artworks': serializer.data
        }, status=status.HTTP_200_OK)


class ArtworksByGenreView(APIView):
    """
    GET: Obtener obras por género
    Parámetro path:
    - genre_id: ID del género
    Parámetro query:
    - limit: cantidad de obras (default 10)
    """
    permission_classes = [AllowAny]
    
    def get(self, request, genre_id):
        from Artworks.models import Artwork
        from Artworks.serializers import ArtworkSerializer
        
        limit = int(request.query_params.get('limit', 10))
        
        try:
            genre = Genre.objects.get(id=genre_id)
            artworks = Artwork.objects.filter(generos=genre).order_by('-fecha_creacion')[:limit]
            
            serializer = ArtworkSerializer(artworks, many=True, context={'request': request})
            
            return Response({
                'success': True,
                'genre': genre.nombre,
                'count': len(serializer.data),
                'artworks': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Genre.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Género no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)

