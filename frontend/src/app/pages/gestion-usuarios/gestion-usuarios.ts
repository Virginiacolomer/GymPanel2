import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ActiveClientUserItem, UsuarioService } from '../../features/usuarios/services/usuario.service';

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly cdr = inject(ChangeDetectorRef);

  filterTerm = '';
  isLoading = false;
  statusMessage = '';

  users: ActiveClientUserItem[] = [];

  ngOnInit(): void {
    this.loadUsers();
  }

  onFilterInput(value: string): void {
    this.filterTerm = value;
  }

  get filteredUsers(): ActiveClientUserItem[] {
    const normalizedQuery = this.normalizeText(this.filterTerm);

    if (!normalizedQuery) {
      return this.users;
    }

    return this.users.filter((user) => {
      const fullName = `${user.nombre} ${user.apellido}`;
      return (
        this.normalizeText(user.nombre).includes(normalizedQuery) ||
        this.normalizeText(user.apellido).includes(normalizedQuery) ||
        this.normalizeText(fullName).includes(normalizedQuery) ||
        this.normalizeText(user.dni).includes(normalizedQuery)
      );
    });
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.usuarioService
      .getClientesActivos()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (users) => {
          this.users = users;
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

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
