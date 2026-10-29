import { Component } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { AuthApiService } from '../../core/services/auth-api.service';

@Component({

  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  constructor(
    private readonly authApiService: AuthApiService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  form = {
    email: '',
    nombre: '',
    apellido: '',
    dni: '',
    password: '',
    passwordConfirm: '',
  };

  loading = false;
  errorMessage = '';
  successMessage = '';

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private extractErrorMessage(error: any): string {
    console.log('Extrayendo mensaje de error - error completo:', error);

    // Formato 1: error?.error?.message (típico NestJS)
    if (error?.error?.message) {
      const msg = error.error.message;
      console.log('Encontrado en error.error.message:', msg);
      if (Array.isArray(msg)) {
        return msg.join(' ');
      }
      if (typeof msg === 'string') {
        return msg;
      }
    }

    // Formato 2: error?.error (a veces el servidor devuelve el objeto completo)
    if (error?.error && typeof error.error === 'string') {
      console.log('Encontrado en error.error (string):', error.error);
      return error.error;
    }

    // Formato 3: error?.message directamente
    if (error?.message && typeof error.message === 'string') {
      console.log('Encontrado en error.message:', error.message);
      return error.message;
    }

    // Formato 4: Errores HTTP sin cuerpo personalizado
    if (error?.status === 409) {
      console.log('Status 409 detectado (conflicto)');
      return 'El correo electronico ya esta registrado.';
    }

    if (error?.status === 400) {
      console.log('Status 400 detectado');
      return 'Datos inválidos. Verifica los campos ingresados.';
    }

    // Formato 5: Último recurso - stringificar el error completo
    console.warn('No se encontró mensaje extraíble, stringificando error:', error);
    const stringified = JSON.stringify(error);
    const result = stringified || 'No se pudo registrar el usuario. Intenta nuevamente.';
    console.log('Mensaje final que se mostrará:', result);
    return result;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.form.email.trim() ||
      !this.form.nombre.trim() ||
      !this.form.apellido.trim() ||
      !this.form.dni.trim() ||
      !this.form.password ||
      !this.form.passwordConfirm
    ) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      return;
    }

    if (!this.isValidEmail(this.form.email.trim())) {
      this.errorMessage = 'Ingresa un correo electronico valido.';
      return;
    }

    if (this.form.password !== this.form.passwordConfirm) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authApiService
      .register({
        email: this.form.email.trim().toLowerCase(),
        nombre: this.form.nombre.trim(),
        apellido: this.form.apellido.trim(),
        dni: this.form.dni.trim(),
        password: this.form.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Registro exitoso. Ahora podes iniciar sesion.';
          this.form = {
            email: '',
            nombre: '',
            apellido: '',
            dni: '',
            password: '',
            passwordConfirm: '',
          };
          this.cdr.markForCheck();

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 900);
        },
        error: (error) => {
          this.loading = false;
          console.error('Error del backend:', error);
          console.error('error.error:', error?.error);
          console.error('error.status:', error?.status);
          this.errorMessage = this.extractErrorMessage(error);
          // Forzar actualización del DOM
          this.cdr.markForCheck();
        },
      });
  }
}

