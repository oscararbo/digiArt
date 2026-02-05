import { Component, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { emailValidator, passwordValidator } from '../../../core/validators/auth.validators';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  standalone: true,
})
export class Login {
  formLogin: FormGroup;
  cargando: boolean = false;
  mostrarErrores: boolean = false;
  fnToggleLoginHeader = output();

  constructor(private formBuilder: FormBuilder) {
    this.formLogin = this.formBuilder.group({
      email: ['', [Validators.required, emailValidator()]],
      password: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
    });
  }

  async iniciarSesion() {
    this.mostrarErrores = true;

    if (this.formLogin.invalid) {
      return;
    }

    this.cargando = true;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.formLogin.value.email,
          password: this.formLogin.value.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Errores del servidor:', data);
        alert('Error: ' + (data.errors?.email?.[0] || data.errors?.password?.[0] || data.error || 'Error desconocido'));
        return;
      }

      console.log('Login exitoso:', data);
      
      // Guardar tokens en localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      alert('¡Inicio de sesión exitoso!');
      // TODO: Redirigir a home
      // this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
    } finally {
      this.cargando = false;
    }
  }
}
