from django.urls import path
from Artworks.views import (
    GenreSearchView,
    ArtworkCreateView,
    ArtworkListView,
    ArtworkDetailView,
    ArtworkDeleteView,
    FeaturedArtworksView,
    RecentArtworksView,
    ArtworksByGenreView,
    ToggleLikeView,
    CheckLikeView,
    GetArtworkLikesView
)

urlpatterns = [
    # Géneros
    path('genres/', GenreSearchView.as_view(), name='genre-search'),
    
    # Artworks
    path('artworks/create/', ArtworkCreateView.as_view(), name='artwork-create'),
    path('artworks/', ArtworkListView.as_view(), name='artwork-list'),
    path('artworks/<uuid:artwork_id>/', ArtworkDetailView.as_view(), name='artwork-detail'),
    path('artworks/<uuid:artwork_id>/delete/', ArtworkDeleteView.as_view(), name='artwork-delete'),
    
    # Featured & Recent
    path('artworks/featured/', FeaturedArtworksView.as_view(), name='featured-artworks'),
    path('artworks/recent/', RecentArtworksView.as_view(), name='recent-artworks'),
    path('artworks/genre/<int:genre_id>/', ArtworksByGenreView.as_view(), name='artworks-by-genre'),
    
    # Likes
    path('artworks/<uuid:artwork_id>/like/', ToggleLikeView.as_view(), name='toggle-like'),
    path('artworks/<uuid:artwork_id>/check-like/', CheckLikeView.as_view(), name='check-like'),
    path('artworks/<uuid:artwork_id>/likes/', GetArtworkLikesView.as_view(), name='get-likes'),
]
