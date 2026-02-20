import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LoginPopupService } from '../../shared/services/login-popup.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private router = inject(Router);
  private loginPopupService = inject(LoginPopupService);

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.loginPopupService.open();
      return false;
    }
    
    return true;
  }

  /**
   * Check if user is authenticated. If not, open login popup.
   * Use this method in components for protecting specific actions (like, upload, etc.)
   * @returns true if authenticated, false otherwise
   */
  checkAuthentication(): boolean {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      this.loginPopupService.open();
      return false;
    }
    
    return true;
  }
}

export const authGuard: CanActivateFn = (route, state) => {
  return inject(AuthGuard).canActivate();
};
