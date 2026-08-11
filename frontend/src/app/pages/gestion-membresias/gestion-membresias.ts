import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { Membresia, MembresiaApiService } from '../../core/services/membresia-api.service';
import { AuthStateService } from '../../core/services/auth-state.service';

interface MembershipOption {
  id: number | null;
  name: string;
  draftName: string;
  description: string;
  draftDescription: string;
  amount: number;
  draftAmount: string;
  frequency: number;
  draftFrequency: number;
  isEditing: boolean;
  isNew: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent, FormsModule],
  templateUrl: './gestion-membresias.html',
  styleUrl: './gestion-membresias.css',
})
export class GestionMembresias implements OnInit {
  private readonly membresiaApiService = inject(MembresiaApiService);
  private readonly authStateService = inject(AuthStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  memberships: MembershipOption[] = [];
  isLoading = false;
  statusMessage = '';

  ngOnInit(): void {
    this.loadMemberships();
  }

  startEditing(id: number): void {
    const membership = this.memberships.find((item) => item.id === id);
    if (!membership) {
      return;
    }

    membership.isEditing = true;
    membership.draftName = membership.name;
    membership.draftDescription = membership.description;
    membership.draftAmount = String(membership.amount);
    membership.draftFrequency = membership.frequency;

    this.resizeDescriptionTextareas();
  }

  saveMembership(id: number | null): void {
    const membership = this.memberships.find((item) => item.id === id);
    if (!membership) {
      return;
    }

    const normalizedName = membership.draftName.trim();
    const normalizedDescription = membership.draftDescription.trim();
    const parsedAmount = this.parseAmount(membership.draftAmount);
    const parsedFrequency = this.parseFrequency(membership.draftFrequency);

    if (!normalizedName) {
      window.alert('Debes ingresar un nombre para la membresia.');
      return;
    }

    if (parsedAmount === null) {
      window.alert('Debes ingresar un costo valido para la membresia.');
      return;
    }

    if (parsedFrequency === null) {
      window.alert('Debes ingresar una frecuencia valida para la membresia (un numero entero mayor a 0).');
      return;
    }

    const payload = {
      nombre: normalizedName,
      descripcion: normalizedDescription || undefined,
      costo: parsedAmount,
      dias: parsedFrequency,
    };

    membership.isSaving = true;
    this.cdr.detectChanges();

    const request$ = membership.isNew
      ? this.membresiaApiService.createMembership(payload)
      : this.membresiaApiService.updateMembership(id!, payload);

    request$
      .pipe(
        finalize(() => {
          membership.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.statusMessage = membership.isNew
            ? 'Membresia creada correctamente.'
            : 'Membresia actualizada correctamente.';
          this.loadMemberships();
        },
        error: (error) => {
          window.alert(this.getErrorMessage(error, 'No se pudo guardar la membresia.'));
        },
      });
  }

  addNewMembership(): void {
    if (this.memberships.some((membership) => membership.isNew && membership.isEditing)) {
      return;
    }

    const newMembership: MembershipOption = {
      id: null,
      name: '',
      draftName: '',
      description: '',
      draftDescription: '',
      amount: 0,
      draftAmount: '0',
      frequency: 1,
      draftFrequency: 1,
      isEditing: true,
      isNew: true,
      isSaving: false,
      isDeleting: false,
    };

    this.memberships = [newMembership, ...this.memberships];
    this.resizeDescriptionTextareas();
  }

  autoResizeDescription(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement | null;
    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  cancelEditing(id: number | null): void {
    const membership = this.memberships.find((item) => item.id === id);
    if (!membership) {
      if (id === null) {
        this.memberships = this.memberships.filter((item) => item.id !== null);
      }
      return;
    }

    if (membership.isNew) {
      this.memberships = this.memberships.filter((item) => item !== membership);
      return;
    }

    membership.isEditing = false;
    membership.draftName = membership.name;
    membership.draftDescription = membership.description;
    membership.draftAmount = String(membership.amount);
    membership.draftFrequency = membership.frequency;
  }

  deleteMembership(id: number): void {
    const membership = this.memberships.find((item) => item.id === id);
    if (!membership || membership.isDeleting) {
      return;
    }

    const confirmed = window.confirm(`¿Seguro que deseas eliminar la membresia ${membership.name}?`);
    if (!confirmed) {
      return;
    }

    membership.isDeleting = true;
    this.cdr.detectChanges();

    this.membresiaApiService
      .deleteMembership(id)
      .pipe(
        finalize(() => {
          membership.isDeleting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.statusMessage = 'Membresia eliminada correctamente.';
          this.loadMemberships();
        },
        error: (error) => {
          window.alert(this.getErrorMessage(error, 'No se pudo eliminar la membresia.'));
        },
      });
  }

  formatAmount(amount: number): string {
    return `$${amount.toLocaleString('es-AR')}`;
  }

  trackMembership(_: number, membership: MembershipOption): number | string {
    return membership.id ?? `new-${membership.draftName}-${membership.draftDescription}-${membership.draftAmount}`;
  }

  private loadMemberships(): void {
    this.isLoading = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.membresiaApiService
      .getAllMemberships(this.authStateService.getCurrentUser()?.gimnasioId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (memberships) => {
          this.memberships = memberships.map((membership) => this.mapMembership(membership));
          if (this.memberships.length === 0) {
            this.statusMessage = 'No hay membresias cargadas.';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.statusMessage = this.getErrorMessage(error, 'No se pudieron cargar las membresias.');
          this.memberships = [];
          this.cdr.detectChanges();
        },
      });
  }

  private resizeDescriptionTextareas(): void {
    queueMicrotask(() => {
      document.querySelectorAll<HTMLTextAreaElement>('.description-input').forEach((textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      });
    });
  }

  private mapMembership(membership: Membresia): MembershipOption {
    return {
      id: membership.id,
      name: membership.nombre,
      draftName: membership.nombre,
      description: membership.descripcion?.trim() || '',
      draftDescription: membership.descripcion?.trim() || '',
      amount: membership.costo,
      draftAmount: String(membership.costo),
      frequency: membership.dias,
      draftFrequency: membership.dias,
      isEditing: false,
      isNew: false,
      isSaving: false,
      isDeleting: false,
    };
  }

  private parseAmount(input: string): number | null {
    const cleanInput = input.replace(/[^0-9]/g, '');
    if (!cleanInput) {
      return null;
    }

    const numericValue = Number(cleanInput);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return null;
    }

    return Math.round(numericValue);
  }

  private parseFrequency(input: number): number | null {
    if (input === null || input === undefined || !Number.isFinite(input) || input <= 0) {
      return null;
    }

    return Math.round(input);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;
      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage[0];
      }

      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }
    }

    return fallback;
  }
}
