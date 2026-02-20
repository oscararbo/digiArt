import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass, CommonModule, NgIf } from '@angular/common';
import { emailValidator, passwordValidator } from '../../../core/validators/auth.validators';
import { Router } from '@angular/router';
import { TokenRefreshService } from '../../../core/services/token-refresh.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgClass, CommonModule, NgIf],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  standalone: true,
})
export class Login implements OnInit {
  formLogin: FormGroup;
  cargando: boolean = false;
  mostrarErrores: boolean = false;
  errorMessage = signal<string | null>(null);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private tokenRefreshService = inject(TokenRefreshService);

  constructor() {
    this.formLogin = this.formBuilder.group({
      email: ['', [Validators.required, emailValidator()]],
      password: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * On component initialization, check if there are email and password values in the navigation state 
   * (e.g., coming from the registration page) and pre-fill the login form with those values for a smoother user experience.
   * @returns
   */
  ngOnInit() {
    const state = (history as any).state;
    if (state?.email && state?.password) {
      this.formLogin.patchValue({
        email: state.email,
        password: state.password
      });
    }
  }

  /**
   * Handle the login process by sending the form data to the backend API. 
   * It also performs client-side validation before making the API call.
   * @returns 
   */
  async iniciarSesion() {
    this.mostrarErrores = true;
    this.errorMessage.set(null);

    if (this.formLogin.invalid) {
      return;
    }

    this.cargando = true;

    try {
      const hashed = await this.hashPassword(this.formLogin.value.password);
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.formLogin.value.email,
          password: hashed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Errores del servidor:', data);
        // Extract error message from backend response
        let errorMsg = 'Credenciales inválidas';
        
        // Try non_field_errors first (general errors)
        if (data?.errors?.non_field_errors?.length > 0) {
          errorMsg = data.errors.non_field_errors[0];
        }
        // Then try email errors
        else if (data?.errors?.email?.length > 0) {
          errorMsg = data.errors.email[0];
        }
        // Then try password errors
        else if (data?.errors?.password?.length > 0) {
          errorMsg = data.errors.password[0];
        }
        // Finally try generic error field
        else if (data?.error) {
          errorMsg = data.error;
        }
        
        this.errorMessage.set(errorMsg);
        return;
      }

      console.log('Login exitoso:', data);
      
      // Save tokens and user info in localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Iniciar renovación automática del token
      this.tokenRefreshService.startAutoRefresh();
      
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error en la solicitud:', error);
      this.errorMessage.set('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
    } finally {
      this.cargando = false;
    }
  }
}
