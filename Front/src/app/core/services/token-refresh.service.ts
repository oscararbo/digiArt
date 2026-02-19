import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TokenRefreshService {
    private http = inject(HttpClient);
    private refreshSubscription: Subscription | null = null;
    private isRefreshing = false;

    /**
     * Login before starting auto-refreshing the token.
     * This should be called after a successful login to ensure that the token is automatically renewed before it expires, providing a seamless user experience without unexpected logouts.
     */
    startAutoRefresh() {
        // Renew the token every 50 minutes
        this.refreshSubscription = interval(50 * 60 * 1000)
            .pipe(
                switchMap(() => this.refreshToken()),
                tap((response: any) => {
                    if (response.access) {
                        localStorage.setItem('access_token', response.access);
                        console.log('Token renovado exitosamente');
                    }
                }),
                catchError((error) => {
                    console.error('Error renovando token:', error);
                    // If there's an error refreshing the token, clear session and redirect to login
                    this.clearSession();
                    window.location.href = '/auth/login';
                    return of(null);
                })
            )
            .subscribe();
    }

    /**
     * Stop auto-refreshing the token.
     * This should be called during the logout process to ensure that the application stops attempting to renew the token after the user has logged out, preventing unnecessary API calls and potential errors.
     */
    stopAutoRefresh() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
            this.refreshSubscription = null;
        }
    }

    /**
     * Renew the token by calling the backend API with the refresh token.
     * If the refresh token is invalid or expired, it will clear the session and redirect to login.
     * This method is used internally by the auto-refresh mechanism and can also be called manually by the interceptor when it detects a 401 error due to an expired access token.
     */
    refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            this.clearSession();
            return of(null);
        }

        return this.http.post<any>('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: refreshToken
        });
    }

    /**
     * Try to manually refresh the token.
     * This is used by the interceptor when it receives a 401 error due to an expired access token.
     * It ensures that only one refresh attempt is made at a time, preventing multiple simultaneous refresh requests.
     */
    async manualRefresh(): Promise<boolean> {
        if (this.isRefreshing) {
            // If a refresh is already in progress, wait for it to complete and check if the token was refreshed successfully
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (!this.isRefreshing) {
                        clearInterval(checkInterval);
                        resolve(!!localStorage.getItem('access_token'));
                    }
                }, 100);
            });
        }

        this.isRefreshing = true;

        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
            this.clearSession();
            this.isRefreshing = false;
            return false;
        }

        try {
            const response = await this.http.post<any>('http://127.0.0.1:8000/api/token/refresh/', {
                refresh: refreshToken
            }).toPromise();

            if (response && response.access) {
                localStorage.setItem('access_token', response.access);
                console.log('Token renovado manualmente');
                this.isRefreshing = false;
                return true;
            }

            this.isRefreshing = false;
            return false;
        } catch (error) {
            console.error('Error renovando token manualmente:', error);
            this.clearSession();
            this.isRefreshing = false;
            return false;
        }
    }

    /**
     * Clean session data from localStorage and stop auto-refreshing the token.
     * This is used during logout and when token refresh fails, ensuring that all authentication-related data is removed and the application stops trying to renew the token after the session has ended.
     */
    private clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.stopAutoRefresh();
    }

    /**
     * Verify if there is an active session by checking the presence of both access and refresh tokens in localStorage.
     */
    hasActiveSession(): boolean {
        return !!localStorage.getItem('access_token') && !!localStorage.getItem('refresh_token');
    }
}
