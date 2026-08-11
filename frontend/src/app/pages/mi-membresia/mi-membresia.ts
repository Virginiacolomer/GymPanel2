import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { MembresiaApiService, Membresia, UserMembresiaResponse } from '../../core/services/membresia-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

@Component({
  selector: 'app-mi-membresia',
  standalone: true,
  imports: [CommonModule, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './mi-membresia.html',
  styleUrl: './mi-membresia.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiMembresia implements OnInit {
  private readonly membresiaService = inject(MembresiaApiService);
  private readonly authStateService = inject(AuthStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  currentMemberships: UserMembresiaResponse[] = [];
  availableMemberships: Membresia[] = [];
  isLoading = true;
  hasError = false;
  isSelecting = false;

  ngOnInit(): void {
    this.loadUserMemberships();
    this.loadAvailableMemberships();
  }

  private loadUserMemberships(): void {
    this.membresiaService.getMyMemberships().subscribe({
      next: (memberships) => {
        this.currentMemberships = memberships;
        this.isLoading = false;
        this.hasError = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[MiMembresia] Error loading membership:', err);
        this.currentMemberships = [];
        this.isLoading = false;
        this.hasError = true;
        this.cdr.markForCheck();
      }
    });
  }

  private loadAvailableMemberships(): void {
    this.membresiaService.getAllMemberships(this.authStateService.getCurrentUser()?.gimnasioId).subscribe({
      next: (memberships) => {
        this.availableMemberships = memberships;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[MiMembresia] Error loading memberships:', err);
        this.availableMemberships = [];
        this.cdr.markForCheck();
      }
    });
  }

  selectMembership(membresiaId: number): void {
    this.isSelecting = true;
    this.cdr.markForCheck();
    this.membresiaService.assignMembership(membresiaId).subscribe({
      next: () => {
        this.loadUserMemberships();
        this.isSelecting = false;
        this.hasError = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[MiMembresia] Error assigning membership:', err);
        this.isSelecting = false;
        this.hasError = true;
        this.cdr.markForCheck();
      }
    });
  }

  getMembershipName(membership: UserMembresiaResponse): string {
    if (membership?.membresia?.nombre) {
      return membership.membresia.nombre;
    }
    return this.getMembershipType(membership.membresiaId);
  }

  getMembershipDays(membership: UserMembresiaResponse): string {
    return this.formatFrequency(membership?.membresia?.dias);
  }

  formatFrequency(dias: number | null | undefined): string {
    if (!dias || !Number.isFinite(dias)) {
      return 'Sin frecuencia';
    }

    return dias === 1 ? '1 vez por semana' : `${dias} veces por semana`;
  }

  getMembershipCost(membership: UserMembresiaResponse): number {
    return membership?.membresia?.costo ?? 0;
  }

  getMembershipStatusLabel(membership: UserMembresiaResponse): string {
    const estado = membership?.estado?.nombre;
    if (!estado) {
      return 'Sin estado';
    }
    return String(estado).replace(/_/g, ' ').toLowerCase().replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase());
  }

  isMembershipUpToDate(membership: UserMembresiaResponse): boolean {
    const estado = String(membership?.estado?.nombre ?? '').toUpperCase();
    return estado === 'AL_DIA';
  }

  formatAmount(amount: number): string {
    return `$${amount.toLocaleString('es-AR')}`;
  }

  getCurrentMonthLastDay(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  getMembershipType(membresiaId: number): string {
    const membership = this.availableMemberships.find(m => m.id === membresiaId);
    return membership ? membership.nombre : '';
  }
}