import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { AuthService, LoginResponse } from '../../core/services/auth.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  loading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email, password } = this.form.getRawValue();

    this.authService
      .login({ email: email.trim().toLowerCase(), password })
      .subscribe({
        next: (response: LoginResponse) => {
          this.loading = false;
          this.authStateService.setSession(response.user, response.accessToken);
          this.successMessage = '¡Login exitoso! Redirigiendo...';

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
          // El interceptor (auth.interceptor.ts) ya maneja 401/403 globalmente.
          // Aqui mostramos el mensaje que devuelve el backend directamente.
          this.errorMessage =
            err?.error?.message ?? err?.message ?? 'No se pudo iniciar sesion. Intenta nuevamente.';
        },
      });
  }
}

