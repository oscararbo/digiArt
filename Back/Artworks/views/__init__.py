from .artwork_view import (
    GenreSearchView, 
    ArtworkCreateView, 
    ArtworkListView, 
    ArtworkDetailView,
    ArtworkDeleteView,
    FeaturedArtworksView,
    RecentArtworksView,
    ArtworksByGenreView
)
from .like_view import (
    ToggleLikeView,
    CheckLikeView,
    GetArtworkLikesView
)

__all__ = [
    'GenreSearchView',
    'ArtworkCreateView',
    'ArtworkListView',
    'ArtworkDetailView',
    'ArtworkDeleteView',
    'FeaturedArtworksView',
    'RecentArtworksView',
    'ArtworksByGenreView',
    'ToggleLikeView',
    'CheckLikeView',
    'GetArtworkLikesView'
]
