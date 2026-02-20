from django.urls import path
from Users.views import (
    LoginView, RegisterView, CheckUsernameView, CheckEmailView,
    UserDetailView, UserUpdateView, UserLikedArtworksView, UserArtworksView
)

urlpatterns = [
    # Auth endpoints
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('auth/check-email/', CheckEmailView.as_view(), name='check-email'),
    
    # User profile endpoints
    path('users/<str:username>/', UserDetailView.as_view(), name='user-detail'),
    path('users/me/update/', UserUpdateView.as_view(), name='user-update'),
    path('users/<int:user_id>/liked-artworks/', UserLikedArtworksView.as_view(), name='user-liked-artworks'),
    path('users/<int:user_id>/artworks/', UserArtworksView.as_view(), name='user-artworks'),
]
