import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { timeout } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ZoomableImageComponent } from '../../shared/zoomable-image/zoomable-image';
import {
  CatalogoEjercicio,
  CatalogoGrupoMuscular,
  CreatePlanEntrenamientoRequest,
  PlanEntrenamientoApiService,
} from '../../core/services/plan-entrenamiento-api.service';

type ExerciseRow = {
  muscleGroupId: number | null;
  ejercicioId: number | null;
  repeticiones: string;
};

type DayConfig = {
  label: string;
  expanded: boolean;
  descripcion: string;
  rows: ExerciseRow[];
};

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent, FormsModule, ZoomableImageComponent],
  templateUrl: './crear-plan.html',
  styleUrl: './crear-plan.css',
})
export class CrearPlan implements OnInit, OnDestroy {
  private readonly planEntrenamientoApiService = inject(PlanEntrenamientoApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private statusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  planTitle = '';
  frequencyDays = 1;
  description = '';
  savingStatus = '';
  savingStatusType: 'success' | 'error' | 'info' = 'info';
  isSaving = false;
  isLoadingCatalog = false;

  configuredDays: DayConfig[] = [this.createEmptyDay(1)];
  muscleGroups: CatalogoGrupoMuscular[] = [];

  ngOnInit(): void {
    this.loadCatalogo();
  }

  ngOnDestroy(): void {
    if (this.statusTimeoutId) {
      clearTimeout(this.statusTimeoutId);
      this.statusTimeoutId = null;
    }

  }

  get canConfigureDays(): boolean {
    return this.planTitle.trim().length > 0 && this.frequencyDays > 0;
  }

  onFrequencyInput(value: number): void {
    const normalized = Number.isFinite(value) ? Math.trunc(value) : 1;
    this.frequencyDays = Math.min(7, Math.max(1, normalized));
    this.syncConfiguredDays();
  }

  toggleDay(index: number): void {
    this.configuredDays = this.configuredDays.map((day, i) => ({
      ...day,
      expanded: i === index ? !day.expanded : day.expanded,
    }));
  }

  addRow(dayIndex: number): void {
    this.configuredDays[dayIndex]?.rows.push(this.createEmptyRow());
  }

  removeRow(dayIndex: number, rowIndex: number): void {
    const day = this.configuredDays[dayIndex];
    if (!day || day.rows.length <= 1) {
      return;
    }
    day.rows.splice(rowIndex, 1);
  }

  onMuscleGroupChange(dayIndex: number, rowIndex: number): void {
    const row = this.configuredDays[dayIndex]?.rows[rowIndex];
    if (row) {
      row.ejercicioId = null;
    }
  }

  onExerciseChange(dayIndex: number, rowIndex: number): void {
    // Clear on change
  }

  getExercisesForGroup(groupId: number | null): CatalogoEjercicio[] {
    if (!groupId) {
      return [];
    }
    return this.muscleGroups.find((g) => g.id === groupId)?.ejercicios ?? [];
  }

  getSelectedExerciseImage(row: ExerciseRow): string | null {
    if (!row.ejercicioId) {
      return null;
    }
    const ejercicio = this.getExercisesForGroup(row.muscleGroupId).find((e) => e.id === row.ejercicioId);
    return ejercicio?.imagenUrl ?? null;
  }

  savePlan(): void {
    if (this.isSaving) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      return;
    }

    // Optimistic update: resetear y mostrar éxito inmediatamente
    this.isSaving = false;
    this.resetForm();
    this.showStatus(
      `✓ Plan "${payload.nombre}" guardado correctamente`,
      'success',
      4000,
    );
    this.cdr.detectChanges();

    // Enviar al servidor en background sin bloquear UI
    this.planEntrenamientoApiService
      .createPlan(payload)
      .pipe(timeout(35000))
      .subscribe({
        next: () => {
          // Plan guardado exitosamente en servidor - nada más que hacer
        },
        error: (error: unknown) => {
          const backendMessage =
            typeof error === 'object' && error !== null && 'error' in error
              ? (error as { error?: { message?: string | string[] } }).error?.message
              : null;

          const message = Array.isArray(backendMessage)
            ? backendMessage[0]
            : backendMessage ?? 'Hubo un error al guardar el plan en el servidor.';

          this.showStatus(message, 'error', 8000);
          this.cdr.detectChanges();
        },
      });
  }

  private syncConfiguredDays(): void {
    const count = Math.min(7, Math.max(1, this.frequencyDays));
    this.configuredDays = Array.from({ length: count }, (_, i) => {
      return this.configuredDays[i] ?? this.createEmptyDay(i + 1);
    });
  }

  private createEmptyDay(num: number): DayConfig {
    return { label: `Dia ${num}`, expanded: false, descripcion: '', rows: [this.createEmptyRow()] };
  }

  private createEmptyRow(): ExerciseRow {
    return { muscleGroupId: null, ejercicioId: null, repeticiones: '' };
  }

  private loadCatalogo(): void {
    this.isLoadingCatalog = true;
    this.planEntrenamientoApiService.getCatalogoGruposMusculares().subscribe({
      next: (groups) => {
        this.muscleGroups = groups;
      },
      error: () => {
        this.showStatus('No se pudo cargar el catalogo de ejercicios.', 'error');
      },
      complete: () => {
        this.isLoadingCatalog = false;
      },
    });
  }

  private buildPayload(): CreatePlanEntrenamientoRequest | null {
    const nombre = this.planTitle.trim();
    if (!nombre) {
      this.showStatus('Por favor completa el titulo del plan.', 'error');
      return null;
    }

    try {
      const ejercicios: Array<number[] | null> = Array.from({ length: 7 }, (_, i) => {
        if (i >= this.frequencyDays) {
          return null;
        }

        const day = this.configuredDays[i];
        if (!day || day.rows.length === 0) {
          throw new Error(`El Dia ${i + 1} no tiene ejercicios configurados.`);
        }

        return day.rows.map((row, rowIndex) => {
          if (!row.ejercicioId || row.ejercicioId <= 0) {
            throw new Error(`Debes seleccionar un ejercicio en Dia ${i + 1}, fila ${rowIndex + 1}.`);
          }
          return row.ejercicioId;
        });
      });

      const repeticiones: Array<string[] | null> = Array.from({ length: 7 }, (_, i) => {
        if (i >= this.frequencyDays) {
          return null;
        }

        const day = this.configuredDays[i];
        if (!day || day.rows.length === 0) {
          throw new Error(`El Dia ${i + 1} no tiene repeticiones configuradas.`);
        }

        return day.rows.map((row, rowIndex) => {
          const valor = row.repeticiones.trim();
          if (!valor) {
            throw new Error(`Debes indicar repeticiones en Dia ${i + 1}, fila ${rowIndex + 1}.`);
          }
          return valor;
        });
      });

      const descripcionesDias: Array<string | null> = Array.from({ length: 7 }, (_, i) => {
        if (i >= this.frequencyDays) {
          return null;
        }
        const desc = this.configuredDays[i]?.descripcion?.trim() ?? '';
        return desc || null;
      });

      return {
        nombre,
        descripcion: this.description.trim() || undefined,
        cantidadDias: this.frequencyDays,
        ejercicios,
        repeticiones,
        descripcionesDias,
      };
    } catch (error) {
      this.showStatus(
        error instanceof Error ? error.message : 'Hay datos invalidos en el formulario.',
        'error',
      );
      return null;
    }
  }

  private resetForm(): void {
    this.planTitle = '';
    this.description = '';
    this.frequencyDays = 1;
    this.configuredDays = [this.createEmptyDay(1)];
  }

  private showStatus(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    timeoutMs?: number,
  ): void {
    this.savingStatus = message;
    this.savingStatusType = type;

    if (this.statusTimeoutId) {
      clearTimeout(this.statusTimeoutId);
      this.statusTimeoutId = null;
    }

    if (!timeoutMs || timeoutMs <= 0) {
      return;
    }

    this.statusTimeoutId = setTimeout(() => {
      this.savingStatus = '';
      this.statusTimeoutId = null;
    }, timeoutMs);
  }
}
