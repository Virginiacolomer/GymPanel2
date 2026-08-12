import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { Horario, HorarioApiService } from '../../core/services/horario-api.service';

interface HorarioRow {
  id: number | null;
  descripcion: string;
  draftDescripcion: string;
  horario: string;
  draftHorario: string;
  isEditing: boolean;
  isNew: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent, FormsModule],
  templateUrl: './gestion-horarios.html',
  styleUrl: './gestion-horarios.css',
})
export class GestionHorarios implements OnInit {
  private readonly horarioApiService = inject(HorarioApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  horarios: HorarioRow[] = [];
  isLoading = false;
  statusMessage = '';

  ngOnInit(): void {
    this.loadHorarios();
  }

  startEditing(id: number): void {
    const row = this.horarios.find((item) => item.id === id);
    if (!row) {
      return;
    }

    row.isEditing = true;
    row.draftDescripcion = row.descripcion;
    row.draftHorario = row.horario;
  }

  addNewHorario(): void {
    if (this.horarios.some((row) => row.isNew && row.isEditing)) {
      return;
    }

    const newRow: HorarioRow = {
      id: null,
      descripcion: '',
      draftDescripcion: '',
      horario: '',
      draftHorario: '',
      isEditing: true,
      isNew: true,
      isSaving: false,
      isDeleting: false,
    };

    this.horarios = [...this.horarios, newRow];
  }

  saveHorario(id: number | null): void {
    const row = this.horarios.find((item) => item.id === id);
    if (!row) {
      return;
    }

    const descripcion = row.draftDescripcion.trim();
    const horario = row.draftHorario.trim();

    if (!descripcion) {
      window.alert('Debes ingresar una descripcion (ej: Lunes a viernes - Manana).');
      return;
    }

    if (!horario) {
      window.alert('Debes ingresar un horario (ej: 6:30 - 10:00).');
      return;
    }

    const payload = { descripcion, horario };

    row.isSaving = true;
    this.cdr.detectChanges();

    const request$ = row.isNew
      ? this.horarioApiService.create(payload)
      : this.horarioApiService.update(id!, payload);

    request$
      .pipe(
        finalize(() => {
          row.isSaving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.statusMessage = row.isNew ? 'Horario creado correctamente.' : 'Horario actualizado correctamente.';
          this.loadHorarios();
        },
        error: (error) => {
          window.alert(this.getErrorMessage(error, 'No se pudo guardar el horario.'));
        },
      });
  }

  cancelEditing(id: number | null): void {
    const row = this.horarios.find((item) => item.id === id);
    if (!row) {
      if (id === null) {
        this.horarios = this.horarios.filter((item) => item.id !== null);
      }
      return;
    }

    if (row.isNew) {
      this.horarios = this.horarios.filter((item) => item !== row);
      return;
    }

    row.isEditing = false;
    row.draftDescripcion = row.descripcion;
    row.draftHorario = row.horario;
  }

  deleteHorario(id: number): void {
    const row = this.horarios.find((item) => item.id === id);
    if (!row || row.isDeleting) {
      return;
    }

    const confirmed = window.confirm('¿Seguro que deseas eliminar este horario?');
    if (!confirmed) {
      return;
    }

    row.isDeleting = true;
    this.cdr.detectChanges();

    this.horarioApiService
      .delete(id)
      .pipe(
        finalize(() => {
          row.isDeleting = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.statusMessage = 'Horario eliminado correctamente.';
          this.loadHorarios();
        },
        error: (error) => {
          window.alert(this.getErrorMessage(error, 'No se pudo eliminar el horario.'));
        },
      });
  }

  trackHorario(_: number, row: HorarioRow): number | string {
    return row.id ?? `new-${row.draftDescripcion}-${row.draftHorario}`;
  }

  private loadHorarios(): void {
    this.isLoading = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.horarioApiService
      .findMine()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (horarios) => {
          this.horarios = horarios.map((horario) => this.mapHorario(horario));
          if (this.horarios.length === 0) {
            this.statusMessage = 'No hay horarios cargados.';
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.statusMessage = this.getErrorMessage(error, 'No se pudieron cargar los horarios.');
          this.horarios = [];
          this.cdr.detectChanges();
        },
      });
  }

  private mapHorario(horario: Horario): HorarioRow {
    return {
      id: horario.id,
      descripcion: horario.descripcion,
      draftDescripcion: horario.descripcion,
      horario: horario.horario,
      draftHorario: horario.horario,
      isEditing: false,
      isNew: false,
      isSaving: false,
      isDeleting: false,
    };
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
