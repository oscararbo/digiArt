from django.urls import path
from Artworks.views import (
    GenreSearchView,
    ArtworkCreateView,
    ArtworkListView,
    ArtworkDetailView,
    ArtworkDeleteView
)

urlpatterns = [
    # Géneros
    path('genres/', GenreSearchView.as_view(), name='genre-search'),
    
    # Artworks
    path('artworks/create/', ArtworkCreateView.as_view(), name='artwork-create'),
    path('artworks/', ArtworkListView.as_view(), name='artwork-list'),
    path('artworks/<uuid:artwork_id>/', ArtworkDetailView.as_view(), name='artwork-detail'),
    path('artworks/<uuid:artwork_id>/delete/', ArtworkDeleteView.as_view(), name='artwork-delete'),
]
