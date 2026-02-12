from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

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
                resultado = ArtworkSerializer(artwork)
                
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
        
        serializer = ArtworkSerializer(artworks, many=True)
        
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
            
            serializer = ArtworkSerializer(artwork)
            
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
