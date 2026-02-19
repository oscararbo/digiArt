import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenRefreshService } from './token-refresh.service';

@Injectable({
    providedIn: 'root'
})
export class LogoutService {
    private tokenRefreshService = inject(TokenRefreshService);
    private router = inject(Router);

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

        // Navigate to login page
        this.router.navigate(['/auth/login']);
    }
}
