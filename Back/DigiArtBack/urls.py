# region IMPORTS
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
# endregion

# region ADMIN CUSTOMIZATION
admin.site.site_header = "DigiArt - Administración"
admin.site.site_title = "DigiArt Admin"
admin.site.index_title = "Panel de Administración"
# endregion

# region URL PATTERNS
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('Users.urls')),
    path('api/', include('Artworks.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
# endregion

# region STATIC AND MEDIA FILES
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
# endregion
