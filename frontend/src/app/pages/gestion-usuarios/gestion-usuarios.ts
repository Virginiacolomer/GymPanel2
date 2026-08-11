import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ActiveClientUserItem, PaymentState, UserMembershipSummary, UsersApiService } from '../../core/services/users-api.service';
import { Membresia, MembresiaApiService } from '../../core/services/membresia-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

type ManagedUser = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  paymentState: PaymentState;
  membershipId: number | null;
  membership: string;
  memberships: UserMembershipSummary[];
  editMembershipOpen: boolean;
  pendingMembershipId: number | null;
};

@Component({
  
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent, FormsModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios implements OnInit {
  private readonly usersApiService = inject(UsersApiService);
  private readonly membresiaApiService = inject(MembresiaApiService);
  private readonly authStateService = inject(AuthStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  filterTerm = '';
  isLoading = false;
  statusMessage = '';

  users: ManagedUser[] = [];
  memberships: Membresia[] = [];

  ngOnInit(): void {
    this.loadMemberships();
    this.loadUsers();
  }

  onFilterInput(value: string): void {
    this.filterTerm = value;
  }

  get filteredUsers(): ManagedUser[] {
    const normalizedQuery = this.normalizeText(this.filterTerm);

    if (!normalizedQuery) {
      return this.users;
    }

    return this.users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`;
      return (
        this.normalizeText(user.firstName).includes(normalizedQuery) ||
        this.normalizeText(user.lastName).includes(normalizedQuery) ||
        this.normalizeText(fullName).includes(normalizedQuery) ||
        this.normalizeText(user.dni).includes(normalizedQuery)
      );
    });
  }

  getStatusLabel(status: PaymentState): string {
    if (status === 'alDia') {
      return 'Al dia';
    }

    return 'Cuota pendiente';
  }

  toggleMembershipEditor(userId: number, currentMembershipId: number | null): void {
    this.users = this.users.map((user) => {
      if (user.id !== userId) {
        return {
          ...user,
          editMembershipOpen: false,
        };
      }

      const isOpening = !user.editMembershipOpen;

      return {
        ...user,
        editMembershipOpen: isOpening,
        pendingMembershipId: isOpening ? currentMembershipId : user.pendingMembershipId,
      };
    });
    this.cdr.detectChanges();
  }

  getAlternativeMemberships(user: ManagedUser): Membresia[] {
    return this.memberships.filter((membership) => membership.id !== user.membershipId);
  }

  setPendingMembership(userId: number, membresiaId: number | null): void {
    this.users = this.users.map((user) =>
      user.id === userId
        ? {
            ...user,
            pendingMembershipId: membresiaId,
          }
        : user
    );
    this.cdr.detectChanges();
  }

  applyMembershipChange(userId: number): void {
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      return;
    }

    const selectedMembershipId = user.pendingMembershipId;

    if (selectedMembershipId === null) {
      window.alert('Debes seleccionar una membresia antes de guardar.');
      return;
    }

    if (!Number.isInteger(selectedMembershipId) || selectedMembershipId <= 0) {
      window.alert('Debes seleccionar una membresia antes de guardar.');
      return;
    }

    this.usersApiService.updateUserMembership(userId, selectedMembershipId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: (error) => {
        console.error('[GestionUsuarios] Error al actualizar membresia', { userId, pendingMembershipId: selectedMembershipId, error });
        window.alert('No se pudo actualizar la membresia del usuario.');
      },
    });
  }

  makeStatusUpToDate(userId: number): void {
    const user = this.users.find((item) => item.id === userId);
    if (!user?.membershipId) {
      window.alert('El usuario no tiene membresia asignada.');
      return;
    }

    this.usersApiService.markUserPaymentUpToDate(userId, user.membershipId).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: () => {
        window.alert('No se pudo actualizar el estado de pago del usuario.');
      },
    });
  }

  private loadMemberships(): void {
    this.membresiaApiService.getAllMemberships(this.authStateService.getCurrentUser()?.gimnasioId).subscribe({
      next: (memberships) => {
        this.memberships = memberships;
        this.cdr.detectChanges();
      },
      error: () => {
        this.memberships = [];
      },
    });
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.usersApiService
      .getClientesActivos()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (users) => {
          this.users = users.map((user) => this.mapActiveClientToManagedUser(user));
          if (this.users.length === 0) {
            this.statusMessage = 'No hay usuarios para mostrar.';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.statusMessage = 'No se pudieron cargar los usuarios.';
          this.cdr.detectChanges();
        },
      });
  }

  private mapActiveClientToManagedUser(user: ActiveClientUserItem): ManagedUser {
    // Cada usuario tiene una unica membresia activa a la vez.
    const memberships = user.membresias ?? [];
    const currentMembership = memberships[0];

    return {
      id: user.id,
      firstName: user.nombre,
      lastName: user.apellido,
      dni: user.dni,
      paymentState: currentMembership?.estadoPago ?? 'cuotaPendiente',
      membershipId: currentMembership?.membresiaId ?? null,
      membership: currentMembership?.nombre ?? 'Sin membresia',
      memberships,
      editMembershipOpen: false,
      pendingMembershipId: currentMembership?.membresiaId ?? null,
    };
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}

