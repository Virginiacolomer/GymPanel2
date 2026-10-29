import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { AuthApiService, LoginResponse } from '../../core/services/auth-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authApiService = inject(AuthApiService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  form = {
    email: '',
    password: '',
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
    if (error?.status === 404) {
      console.log('Status 404 detectado');
      return 'El correo electronico no esta registrado.';
    }

    if (error?.status === 401) {
      console.log('Status 401 detectado');
      return 'La contrasena es incorrecta.';
    }

    if (error?.status === 400) {
      console.log('Status 400 detectado');
      return 'Datos inválidos. Verifica el correo y contraseña.';
    }

    // Formato 5: Último recurso - stringificar el error completo
    console.warn('No se encontró mensaje extraíble, stringificando error:', error);
    const stringified = JSON.stringify(error);
    const result = stringified || 'No se pudo iniciar sesion. Intenta nuevamente.';
    console.log('Mensaje final que se mostrará:', result);
    return result;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // VALIDACIÓN
    if (!this.form.email.trim() || !this.form.password) {
      this.errorMessage = 'Completa el correo electronico y la contrasena.';
      return;
    }

    if (!this.isValidEmail(this.form.email.trim())) {
      this.errorMessage = 'Ingresa un correo electronico valido.';
      return;
    }

    this.loading = true;

    // LLAMAR AL SERVICIO DE LOGIN
    this.authApiService
      .login({
        email: this.form.email.trim().toLowerCase(),
        password: this.form.password,
      })
      .subscribe({
        next: (response: LoginResponse) => {
          this.loading = false;
          this.authStateService.setSession(response.user, response.accessToken);

          this.successMessage = '¡Login exitoso! Redirigiendo...';
          this.cdr.markForCheck();

          // REDIRIGIR SEGÚN ROLE DESPUÉS DE 500MS
          setTimeout(() => {
            if (response.user.role === 'ADMIN') {
              this.router.navigate(['/menu-admin']);
            } else {
              this.router.navigate(['/menu-cliente']);
            }
          }, 500);
        },
        error: (err) => {
          this.loading = false;
          console.error('Error del backend (login):', err);
          console.error('err.error:', err?.error);
          console.error('err.status:', err?.status);
          const msg = this.extractErrorMessage(err);
          console.log('Mensaje extraído:', msg);
          this.errorMessage = msg;
          console.log('errorMessage asignado:', this.errorMessage);
          console.log('errorMessage en el componente:', this.errorMessage);
          // Forzar actualización del DOM
          this.cdr.markForCheck();
        },
      });
  }
}

