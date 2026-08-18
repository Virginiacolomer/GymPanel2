import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { SuperAdminApiService } from '../../core/services/superadmin-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  standalone: true,
  imports: [FormsModule, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './superadmin-login.html',
  styleUrl: './superadmin-login.css',
})
export class SuperadminLogin {
  private readonly superAdminApiService = inject(SuperAdminApiService);
  private readonly authStateService = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Completa el correo electronico y la contrasena.';
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    this.superAdminApiService.login(this.email.trim().toLowerCase(), this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.authStateService.setSession(
          { id: String(response.superAdmin.id), email: response.superAdmin.email, role: 'SUPERADMIN' },
          response.accessToken,
        );
        this.router.navigate(['/superadmin/panel']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Correo electronico o contrasena incorrectos.';
        this.cdr.markForCheck();
      },
    });
  }
}
