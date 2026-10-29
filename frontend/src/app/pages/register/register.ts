import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    passwordConfirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  loading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa todos los campos obligatorios correctamente.';
      return;
    }

    const { email, nombre, apellido, dni, password, passwordConfirm } = this.form.getRawValue();

    if (password !== passwordConfirm) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;

    this.authService
      .register({
        email: email.trim().toLowerCase(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Registro exitoso. Ahora podes iniciar sesion.';
          this.form.reset();

          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 900);
        },
        error: (error) => {
          this.loading = false;
          const msg = error?.error?.message ?? error?.message;
          if (Array.isArray(msg)) {
            this.errorMessage = msg.join(' ');
          } else if (typeof msg === 'string') {
            this.errorMessage = msg;
          } else if (error?.status === 409) {
            this.errorMessage = 'El correo electronico ya esta registrado.';
          } else {
            this.errorMessage = 'No se pudo registrar el usuario. Intenta nuevamente.';
          }
        },
      });
  }
}
