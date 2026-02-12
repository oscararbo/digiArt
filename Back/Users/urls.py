from django.urls import path
from Users.views import LoginView, RegisterView, CheckUsernameView

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/check-username/', CheckUsernameView.as_view(), name='check-username'),
]
