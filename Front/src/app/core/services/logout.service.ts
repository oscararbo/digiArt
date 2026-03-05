import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenRefreshService } from './token-refresh.service';
import { UserService } from './user.service';

@Injectable({
    providedIn: 'root'
})
export class LogoutService {
    private tokenRefreshService = inject(TokenRefreshService);
    private router = inject(Router);
    private userService = inject(UserService);

    /**
     * Makes the logout process by stopping the token auto-refresh, clearing all authentication-related data from localStorage,
     * and navigating the user back to the login page. This ensures that the user's session is properly terminated and they are redirected to the appropriate screen.
     */
    logout() {
        // Stop auto-refreshing the token
        this.tokenRefreshService.stopAutoRefresh();

        // Clear session data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');

        // Clear in-memory user-related state so UI reacts immediately
        this.userService.userProfile.set(null);
        this.userService.userLikedArtworks.set([]);
        this.userService.userPersonalArtworks.set([]);

        // Navigate to auth layout (default page shows login form)
        this.router.navigate(['/']);
    }
}
