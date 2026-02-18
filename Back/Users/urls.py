from django.urls import path
from Users.views import LoginView, RegisterView, CheckUsernameView, CheckEmailView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/check-username/', CheckUsernameView.as_view(), name='check-username'),
    path('auth/check-email/', CheckEmailView.as_view(), name='check-email'),
]
