# region ARTWORK VIEWS
from .artwork_view import (
    GenreSearchView, 
    ArtworkCreateView, 
    ArtworkListView, 
    ArtworkDetailView,
    ArtworkIncrementViewView,
    FeaturedArtworksView,
    RecentArtworksView,
    ArtworksByGenreView
)
# endregion

# region LIKE VIEWS
from .like_view import (
    ToggleLikeView
)
# endregion

# region EXPORTS
__all__ = [
    'GenreSearchView',
    'ArtworkCreateView',
    'ArtworkListView',
    'ArtworkDetailView',
    'ArtworkIncrementViewView',
    'FeaturedArtworksView',
    'RecentArtworksView',
    'ArtworksByGenreView',
    'ToggleLikeView'
]
# endregion
