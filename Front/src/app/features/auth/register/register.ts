import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { emailValidator, passwordValidator } from '../../../core/validators/auth.validators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
  standalone: true,
})
export class Register {
  registerForm: FormGroup;
  cargando: boolean = false;
  mostrarErrores: boolean = false;
  emailDisponible: boolean | null = null;
  verificandoEmail: boolean = false;
  usernameDisponible: boolean | null = null;
  verificandoUsername: boolean = false;

  private emailTimeout: any;
  private usernameTimeout: any;

  constructor(private formBuilder: FormBuilder, private router: Router) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, emailValidator()]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
      passwordRepeat: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
    });
  }

  /**
   * Verify if the email is available by making an API call to the backend. 
   * This function is called on input with a debounce of 1 second.
   * @returns 
   */
  verificarEmail() {
    const email = this.registerForm.get('email')?.value?.trim();

    if (!email || this.registerForm.get('email')?.hasError('required') || this.registerForm.get('email')?.hasError('invalidEmail')) {
      this.emailDisponible = null;
      return;
    }

    if (this.emailTimeout) {
      clearTimeout(this.emailTimeout);
    }

    this.emailTimeout = setTimeout(async () => {
      this.verificandoEmail = true;
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/auth/check-email/?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        this.emailDisponible = data.disponible;
      } catch (error) {
        console.error('Error verificando email:', error);
        this.emailDisponible = null;
      } finally {
        this.verificandoEmail = false;
        this.registerForm.get('email')?.markAsTouched();
      }
    }, 1000);
  }

  /**
   * Verify if the username is available by making an API call to the backend. 
   * This function is called on input with a debounce of 1 second.
   * @returns 
   */
  verificarUsername() {
    const username = this.registerForm.get('username')?.value?.trim();

    if (!username || username.length < 3) {
      this.usernameDisponible = null;
      return;
    }

    if (this.usernameTimeout) {
      clearTimeout(this.usernameTimeout);
    }

    this.usernameTimeout = setTimeout(async () => {
      this.verificandoUsername = true;
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/auth/check-username/?username=${encodeURIComponent(username)}`);
        const data = await response.json();
        this.usernameDisponible = data.disponible;
      } catch (error) {
        console.error('Error verificando username:', error);
        this.usernameDisponible = null;
      } finally {
        this.verificandoUsername = false;
        this.registerForm.get('username')?.markAsTouched();
      }
    }, 1000);
  }

  /**
   * Handle the registration process by sending the form data to the backend API. 
   * It also performs client-side validation before making the API call.
   * @returns 
   */
  async registrarme() {
    this.mostrarErrores = true;

    if (this.registerForm.invalid) {
      return;
    }

    if (this.emailDisponible === null) {
      alert('Por favor, espera a que se verifique el correo electrónico');
      return;
    }

    if (this.emailDisponible === false) {
      return;
    }

    if (this.usernameDisponible === null) {
      alert('Por favor, espera a que se verifique el nombre de usuario');
      return;
    }

    if (this.usernameDisponible === false) {
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.passwordRepeat) {
      alert('Las contraseñas no coinciden');
      return;
    }

    this.cargando = true;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.registerForm.value.email,
          username: this.registerForm.value.username,
          password: this.registerForm.value.password,
          password_repeat: this.registerForm.value.passwordRepeat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Errores del servidor:', data);
        const errors = data.errors || {};
        const errorMessage = 
          errors.email?.[0] || 
          errors.username?.[0] ||
          errors.password?.[0] || 
          errors.password_repeat?.[0] || 
          data.error || 
          'Error desconocido';
        alert('Error: ' + errorMessage);
        return;
      }

      // Login after successful registration
      await this.iniciarSesion(this.registerForm.value.email, this.registerForm.value.password);
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
    } finally {
      this.cargando = false;
    }
  }

  /**
   * Handle the login process by sending the form data to the backend API. 
   * It also performs client-side validation before making the API call.
   * @returns 
   */
  private async iniciarSesion(email: string, password: string) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Errores del servidor:', data);
        alert('Error: ' + (data.errors?.email?.[0] || data.errors?.password?.[0] || data.error || 'Error desconocido'));
        return;
      }

      console.log('Login exitoso:', data);

      // Save tokens and user info in localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate to home page after successful login
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error en la solicitud de inicio de sesión:', error);
      alert('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
    }
  }
}
