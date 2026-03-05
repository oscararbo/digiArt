# region IMPORTS
from django.urls import path
from Artworks.views import (
    GenreSearchView,
    ArtworkCreateView,
    ArtworkListView,
    ArtworkDetailView,
    ArtworkIncrementViewView,
    FeaturedArtworksView,
    RecentArtworksView,
    ArtworksByGenreView,
    ToggleLikeView
)
from Artworks.views.comment_view import ArtworkCommentsView, ArtworkCommentDetailView
# endregion

# region URL PATTERNS
urlpatterns = [
    # Genres
    path('genres/', GenreSearchView.as_view(), name='genre-search'),
    
    # Artworks
    path('artworks/create/', ArtworkCreateView.as_view(), name='artwork-create'),
    path('artworks/', ArtworkListView.as_view(), name='artwork-list'),
    path('artworks/<uuid:artwork_id>/', ArtworkDetailView.as_view(), name='artwork-detail'),
    path('artworks/<uuid:artwork_id>/view/', ArtworkIncrementViewView.as_view(), name='artwork-increment-view'),
    
    # Featured & recent
    path('artworks/featured/', FeaturedArtworksView.as_view(), name='featured-artworks'),
    path('artworks/recent/', RecentArtworksView.as_view(), name='recent-artworks'),
    path('artworks/genre/<int:genre_id>/', ArtworksByGenreView.as_view(), name='artworks-by-genre'),
    
    # Likes
    path('artworks/<uuid:artwork_id>/like/', ToggleLikeView.as_view(), name='toggle-like'),
    
    # Comments
    path('artworks/<uuid:artwork_id>/comments/', ArtworkCommentsView.as_view(), name='artwork-comments'),
    path('artworks/<uuid:artwork_id>/comments/<uuid:comment_id>/', ArtworkCommentDetailView.as_view(), name='artwork-comment-detail'),
]
# endregion
