import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ActiveClientUserItem, UsersApiService } from '../../core/services/users-api.service';

type UserPlanRow = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  membershipFrequency: string;
};

@Component({
  
  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './asignar-plan.html',
  styleUrl: './asignar-plan.css',
})
export class AsignarPlan implements OnInit {
  private readonly usersApiService = inject(UsersApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  filterTerm = '';
  isLoading = false;
  statusMessage = '';

  users: UserPlanRow[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  onFilterInput(value: string): void {
    this.filterTerm = value;
  }

  get filteredUsers(): UserPlanRow[] {
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

  private loadUsers(): void {
    this.isLoading = true;
    this.statusMessage = '';
    console.log('[AsignarPlan] Cargando usuarios...');
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
          console.log('[AsignarPlan] Respuesta usuarios:', users);
          this.users = users.map((user) => this.mapActiveClientToPlanRow(user));
          console.log('[AsignarPlan] Usuarios mapeados para tabla:', this.users);
          if (this.users.length === 0) {
            this.statusMessage = 'No hay usuarios para asignar plan.';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('[AsignarPlan] Error al cargar usuarios:', error);
          this.statusMessage = 'No se pudieron cargar los usuarios.';
          this.cdr.detectChanges();
        },
      });
  }

  private mapActiveClientToPlanRow(user: ActiveClientUserItem): UserPlanRow {
    return {
      id: user.id,
      firstName: user.nombre,
      lastName: user.apellido,
      dni: user.dni,
      membershipFrequency: user.frecuenciaDias !== null ? String(user.frecuenciaDias) : '',
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

