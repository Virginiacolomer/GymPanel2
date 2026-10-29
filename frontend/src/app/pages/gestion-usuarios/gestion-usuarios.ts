import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ActiveClientUserItem, UsersApiService } from '../../core/services/users-api.service';

type ManagedUser = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
};

@Component({
  
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios implements OnInit {
  private readonly usersApiService = inject(UsersApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  filterTerm = '';
  isLoading = false;
  statusMessage = '';

  users: ManagedUser[] = [];

  ngOnInit(): void {
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
    return {
      id: user.id,
      firstName: user.nombre,
      lastName: user.apellido,
      dni: user.dni,
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

