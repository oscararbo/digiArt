import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { TokenRefreshService } from '../services/token-refresh.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    private tokenRefreshService = inject(TokenRefreshService);

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Attach the access token to the Authorization header of outgoing requests, except for the token refresh endpoint to avoid infinite loops.
        const token = localStorage.getItem('access_token');
        if (token && !request.url.includes('/token/refresh/')) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${token}`
                }
            });
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // If we receive a 401 error and it's not from the token refresh endpoint, it likely means the access token has expired.
                // Attempt to refresh the token and retry the request.
                if (error.status === 401 && !request.url.includes('/token/refresh/')) {
                    return this.handle401Error(request, next);
                }

                return throwError(() => error);
            })
        );
    }

    /**
     * Handle 401 errors by attempting to refresh the token. If the refresh is successful, retry the original request with the new token. If the refresh fails, clear the session and redirect to login.
     * This method ensures that users experience seamless token renewal without unexpected logouts, while also handling cases where the refresh token is invalid or expired by properly clearing session data and redirecting to the login page.
     */
    private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return new Observable((observer) => {
            this.tokenRefreshService.manualRefresh().then((success: boolean) => {
                if (success) {
                    // Token refreshed successfully, retry the original request with the new token
                    const newToken = localStorage.getItem('access_token');
                    const clonedRequest = request.clone({
                        setHeaders: {
                            Authorization: `Bearer ${newToken}`
                        }
                    });

                    next.handle(clonedRequest).subscribe(
                        (event: HttpEvent<any>) => observer.next(event),
                        (error: HttpErrorResponse) => observer.error(error),
                        () => observer.complete()
                    );
                } else {
                    // Cant refresh token, clear session and redirect to login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    window.location.href = '/auth/login';
                    observer.error(new Error('Sesión expirada'));
                }
            });
        });
    }
}
