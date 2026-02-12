import { Component, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { emailValidator, passwordValidator } from '../../../core/validators/auth.validators';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  standalone: true,
})
export class Register {
  registerForm: FormGroup;
  cargando: boolean = false;
  mostrarErrores: boolean = false;
  usernameDisponible: boolean | null = null;
  verificandoUsername: boolean = false;
  cambiarForm = output<boolean>();
  fnToggleLoginHeader = output();

  constructor(private formBuilder: FormBuilder) {
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, emailValidator()]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
      passwordRepeat: ['', [Validators.required, Validators.minLength(6), passwordValidator()]],
    });
  }

  async verificarUsername() {
    const username = this.registerForm.get('username')?.value?.trim();
    
    if (!username || username.length < 3) {
      this.usernameDisponible = null;
      return;
    }

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
    }
  }

  async registrarme() {
    this.mostrarErrores = true;

    if (this.registerForm.invalid) {
      return;
    }

    if (this.usernameDisponible === false) {
      alert('El nombre de usuario no está disponible');
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

      console.log('Registro exitoso:', data);
      alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
      // Cambiar a formulario de login
      this.cambiarForm.emit(true);
    } catch (error) {
      console.error('Error en la solicitud:', error);
      alert('Error de conexión. Verifica que el servidor esté corriendo en http://127.0.0.1:8000');
    } finally {
      this.cargando = false;
    }
  }
}
