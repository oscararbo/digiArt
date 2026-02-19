import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginPopupService } from '../../services/login-popup.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-pop-up',
  imports: [CommonModule],
  templateUrl: './login-pop-up.html',
  styleUrl: './login-pop-up.scss',
  standalone: true,
})
export class LoginPopUp {
  private loginPopup = inject(LoginPopupService);
  private router = inject(Router);

  get isOpen() {
    return this.loginPopup.isOpen();
  }

  close() {
    this.loginPopup.close();
  }

  goToLogin() {
    this.loginPopup.close();
    this.router.navigate(['']);
  }
}
