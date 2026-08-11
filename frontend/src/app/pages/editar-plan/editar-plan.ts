import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { PlanEntrenamientoApiService, PlanEntrenamientoResponse } from '../../core/services/plan-entrenamiento-api.service';

type EditableExerciseRow = {
  exercise: string;
  workload: string;
};

type EditableTrainingDay = {
  label: string;
  expanded: boolean;
  rows: EditableExerciseRow[];
};

@Component({
  
  standalone: true,
  imports: [FormsModule, RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './editar-plan.html',
  styleUrl: './editar-plan.css',
})
export class EditarPlan implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly planEntrenamientoApiService = inject(PlanEntrenamientoApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedUserName = 'Usuario';
  selectedUserId: number | null = null;
  planName = '';
  isLoading = false;
  statusMessage = '';

  days: EditableTrainingDay[] = [
    { label: 'Dia 1', expanded: false, rows: this.createEmptyRows() },
    { label: 'Dia 2', expanded: false, rows: this.createEmptyRows() },
    { label: 'Dia 3', expanded: false, rows: this.createEmptyRows() },
  ];

  constructor() {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const userName = params.get('usuario')?.trim();
      this.selectedUserName = userName && userName.length > 0 ? userName : 'Usuario';

      const userId = Number(params.get('userId'));
      this.selectedUserId = Number.isFinite(userId) && userId > 0 ? userId : null;
      this.loadUserPlan();
    });
  }

  toggleDay(index: number): void {
    this.days = this.days.map((day, dayIndex) => ({
      ...day,
      expanded: dayIndex === index ? !day.expanded : day.expanded,
    }));
  }

  private createEmptyRows(): EditableExerciseRow[] {
    return Array.from({ length: 5 }, () => ({ exercise: '', workload: '' }));
  }

  private loadUserPlan(): void {
    if (!this.selectedUserId) {
      this.statusMessage = 'No se pudo identificar al usuario para cargar el plan.';
      this.days = [];
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.planEntrenamientoApiService
      .getPlanByUserId(this.selectedUserId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          if (!response.plan) {
            this.days = [];
            this.planName = '';
            this.statusMessage = 'Este usuario no tiene un plan de entrenamiento asignado.';
            this.cdr.detectChanges();
            return;
          }

          this.planName = response.plan.nombre;
          this.days = this.mapPlanToEditableDays(response.plan);
          this.cdr.detectChanges();
        },
        error: () => {
          this.days = [];
          this.planName = '';
          this.statusMessage = 'No se pudo cargar el plan del usuario.';
          this.cdr.detectChanges();
        },
      });
  }

  private mapPlanToEditableDays(plan: PlanEntrenamientoResponse): EditableTrainingDay[] {
    return plan.ejerciciosVisibles.map((ejercicioIds, index) => ({
      label: `Dia ${index + 1}`,
      expanded: false,
      rows: ejercicioIds.map((id, exerciseIndex) => ({
        exercise: `Ejercicio ${id}`,
        workload: plan.repeticionesVisibles[index]?.[exerciseIndex] ?? '',
      })),
    }));
  }
}





