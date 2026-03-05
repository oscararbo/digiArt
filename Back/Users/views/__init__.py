# region AUTH VIEWS
from .login_view import LoginView
from .register_view import RegisterView
from .check_username_view import CheckUsernameView
from .check_email_view import CheckEmailView
# endregion

# region USER PROFILE VIEWS
from .user_detail_view import UserDetailView
from .user_detail_by_id_view import UserDetailByIdView
from .user_update_view import UserUpdateView
from .user_liked_artworks_view import UserLikedArtworksView
from .user_artworks_view import UserArtworksView
# endregion

# region EXPORTS
__all__ = ['LoginView', 'RegisterView', 'CheckUsernameView', 'CheckEmailView', 
           'UserDetailView', 'UserDetailByIdView', 'UserUpdateView', 'UserLikedArtworksView', 'UserArtworksView']
# endregion
