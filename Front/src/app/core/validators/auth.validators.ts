import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida que el email tenga el formato: texto@texto.texto
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const emailRegex = /^[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(control.value)) {
      return { invalidEmail: true };
    }

    return null;
  };
}

/**
 * Valida que la contraseÃ±a contenga:
 * - Al menos 1 mayÃºscula
 * - Al menos 1 minÃºscula
 * - Al menos 1 nÃºmero
 */
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const value = control.value;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    const isValid = hasUpperCase && hasLowerCase && hasNumber;

    if (!isValid) {
      return { invalidPassword: true };
    }

    return null;
  };
}
