import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize, timeout } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { AdminUserItem, UsersApiService } from '../../core/services/users-api.service';

@Component({
  standalone: true,
  imports: [CommonModule, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './alta-usuarios.html',
  styleUrl: './alta-usuarios.css',
})
export class AltaUsuarios implements OnInit {
  private readonly usersApiService = inject(UsersApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private loadingGuardTimer: ReturnType<typeof setTimeout> | null = null;

  pendingAccounts: AdminUserItem[] = [];
  isLoading = false;
  processingUserId: number | null = null;
  statusMessage = '';

  ngOnInit(): void {
    console.log('[AltaUsuarios] ngOnInit - cargando usuarios pendientes');
    this.loadPendingUsers();
  }

  reloadPendingUsers(): void {
    console.log('[AltaUsuarios] reloadPendingUsers - recargando usuarios pendientes');
    this.loadPendingUsers();
  }

  trackByAccountId(_index: number, account: AdminUserItem): number {
    return account.id;
  }

  get reloadButtonLabel(): string {
    if (this.isLoading) {
      return 'Recargando...';
    }

    return this.pendingAccounts.length === 0 ? 'Volver a recargar' : 'Recargar';
  }

  acceptAccount(accountId: number): void {
    this.updateUserStatus(accountId, 'activo');
  }

  deleteAccount(accountId: number): void {
    this.processingUserId = accountId;
    this.statusMessage = '';
    const previousAccounts = [...this.pendingAccounts];

    this.pendingAccounts = this.pendingAccounts.filter(
      (account) => Number(account.id) !== Number(accountId),
    );
    this.cdr.detectChanges();

    this.usersApiService
      .deleteUsuario(accountId)
      .pipe(finalize(() => (this.processingUserId = null)))
      .subscribe({
        next: () => {
          this.statusMessage = 'Usuario eliminado correctamente.';
          this.cdr.detectChanges();
        },
        error: () => {
          this.pendingAccounts = previousAccounts;
          this.statusMessage = 'No se pudo eliminar el usuario.';
          this.cdr.detectChanges();
        },
      });
  }

  private loadPendingUsers(silent = false): void {
    if (!silent) {
      this.isLoading = true;
      this.statusMessage = '';
      this.cdr.detectChanges();

      if (this.loadingGuardTimer) {
        clearTimeout(this.loadingGuardTimer);
      }

      this.loadingGuardTimer = setTimeout(() => {
        if (this.isLoading) {
          console.warn('[AltaUsuarios] Se forzo cierre de estado de carga por timeout de seguridad');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }, 8000);
    }

    this.usersApiService
      .getUsuariosPendientes()
      .pipe(
        timeout(5000),
        finalize(() => {
          if (this.loadingGuardTimer) {
            clearTimeout(this.loadingGuardTimer);
            this.loadingGuardTimer = null;
          }

          if (!silent) {
            this.isLoading = false;
          }
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (users) => {
          console.log('[AltaUsuarios] Respuesta users/pendientes:', users);
          this.pendingAccounts = users;
          console.log(
            `[AltaUsuarios] pendingAccounts actualizados: ${this.pendingAccounts.length}`,
            this.pendingAccounts.map((account) => ({ id: account.id, dni: account.dni, estado: account.estado })),
          );

          // Confirmamos cuantas filas quedaron renderizadas en el DOM.
          queueMicrotask(() => {
            const domRows = document.querySelectorAll('table tbody tr').length;
            console.log(`[AltaUsuarios] Filas renderizadas en tabla: ${domRows}`);
          });

          this.cdr.detectChanges();

          if (!silent && users.length === 0) {
            this.statusMessage = 'No hay usuarios pendientes por aprobar.';
          }
        },
        error: (error) => {
          console.error('[AltaUsuarios] Error cargando users/pendientes:', error);
          if (!silent) {
            this.statusMessage = 'No se pudieron cargar los usuarios pendientes. Verifica que el backend este levantado.';
          }
          this.cdr.detectChanges();
        },
      });
  }

  private updateUserStatus(accountId: number, status: 'activo' | 'inactivo'): void {
    this.processingUserId = accountId;
    this.statusMessage = '';
    const previousAccounts = [...this.pendingAccounts];

    if (status === 'activo') {
      this.pendingAccounts = this.pendingAccounts.filter(
        (account) => Number(account.id) !== Number(accountId),
      );
      this.cdr.detectChanges();
    }

    this.usersApiService
      .updateEstado(accountId, status)
      .pipe(finalize(() => (this.processingUserId = null)))
      .subscribe({
        next: () => {
          this.pendingAccounts = this.pendingAccounts.filter(
            (account) => Number(account.id) !== Number(accountId),
          );
          this.statusMessage =
            status === 'activo'
              ? 'Usuario aprobado y cambiado a estado activo.'
              : 'Usuario cambiado a estado inactivo.';
          this.cdr.detectChanges();
        },
        error: () => {
          if (status === 'activo') {
            this.pendingAccounts = previousAccounts;
          }
          this.statusMessage = 'No se pudo actualizar el estado del usuario.';
          this.cdr.detectChanges();
        },
      });
  }
}
