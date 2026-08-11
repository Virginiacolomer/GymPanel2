import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { forkJoin, finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ZoomableImageComponent } from '../../shared/zoomable-image/zoomable-image';
import { AuthStateService } from '../../core/services/auth-state.service';
import {
  CatalogoGrupoMuscular,
  PlanEntrenamientoApiService,
  PlanEntrenamientoResponse,
  UserPlanResponse,
} from '../../core/services/plan-entrenamiento-api.service';

type ExerciseRow = {
  exercise: string;
  workload: string;
  imagenUrl?: string | null;
};

type TrainingDay = {
  label: string;
  expanded: boolean;
  description?: string;
  exercises: ExerciseRow[];
};

type CurrentPlanUser = {
  nombre: string;
  apellido: string;
};

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent, ZoomableImageComponent],
  templateUrl: './mi-plan.html',
  styleUrl: './mi-plan.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiPlan implements OnInit {
  private readonly authStateService = inject(AuthStateService);
  private readonly planApiService = inject(PlanEntrenamientoApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly exerciseNameById = new Map<number, string>();
  private readonly exerciseImageById = new Map<number, string | null>();

  days: TrainingDay[] = [];
  isLoading = false;
  hasPlan = false;
  errorMessage = '';
  planName = '';
  planDescription = '';
  currentUser: CurrentPlanUser | null = null;
  authenticatedUserId: number | null = null;

  ngOnInit(): void {
    this.loadUserPlan();
  }

  private loadUserPlan(): void {
    const currentUser = this.authStateService.getCurrentUser();

    if (!currentUser) {
      this.hasPlan = false;
      this.errorMessage = 'Usuario no autenticado.';
      this.currentUser = null;
      this.authenticatedUserId = null;
      this.cdr.markForCheck();
      return;
    }

    this.currentUser = {
      nombre: currentUser.nombre,
      apellido: currentUser.apellido,
    };

    this.hasPlan = false;
    this.days = [];
    this.planName = '';
    this.planDescription = '';
    this.errorMessage = '';
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      catalogo: this.planApiService.getCatalogoGruposMusculares(),
      planData: this.planApiService.getMyPlan(),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: ({ catalogo, planData }: { catalogo: CatalogoGrupoMuscular[]; planData: UserPlanResponse }) => {
          this.buildExerciseNameMap(catalogo);
          this.authenticatedUserId = planData.userId ?? null;

          console.log('[mi-plan] planData.plan (raw):', planData.plan);

          if (!planData.plan) {
            this.hasPlan = false;
            this.days = [];
            this.planName = '';
            this.planDescription = '';

            if (planData.planEntrenamientoId) {
              this.errorMessage = 'Tienes un plan asignado, pero no se pudo cargar su contenido.';
            }

            this.cdr.markForCheck();
            return;
          }

          this.planName = planData.plan.nombre;
          this.planDescription = planData.plan.descripcion?.trim() ?? '';
          this.days = this.mapPlanToDays(planData.plan);
          console.log('[mi-plan] days mapeados:', this.days.map((day) => ({ label: day.label, description: day.description })));
          this.hasPlan = true;
          this.errorMessage = '';
          this.cdr.markForCheck();
        },
        error: () => {
          this.hasPlan = false;
          this.days = [];
          this.planName = '';
          this.planDescription = '';
          this.errorMessage = 'No se pudo cargar tu plan en este momento.';
          this.cdr.markForCheck();
        },
      });
  }

  private mapPlanToDays(plan: PlanEntrenamientoResponse): TrainingDay[] {
    const dayDescriptions = this.extractDayDescriptions(plan);

    return Array.from({ length: plan.cantidadDias }, (_, dayIndex) => {
      const ejerciciosDia = plan.ejercicios[dayIndex];
      const repeticionesDia = plan.repeticiones[dayIndex];
      const descripcionDia = dayDescriptions[dayIndex] ?? '';

      if (!Array.isArray(ejerciciosDia) || ejerciciosDia.length === 0) {
        return {
          label: `Dia ${dayIndex + 1}`,
          expanded: false,
          description: descripcionDia || undefined,
          exercises: [],
        };
      }

      return {
        label: `Dia ${dayIndex + 1}`,
        expanded: false,
        description: descripcionDia || undefined,
        exercises: ejerciciosDia.map((id, exerciseIndex) => ({
          exercise: this.resolveExerciseName(id),
          workload: Array.isArray(repeticionesDia) ? (repeticionesDia[exerciseIndex] ?? '') : '',
          imagenUrl: this.resolveExerciseImage(id),
        })),
      };
    });
  }

  private extractDayDescriptions(plan: PlanEntrenamientoResponse): string[] {
    const raw = plan as unknown as Record<string, unknown>;
    const candidate =
      raw['descripciones_dias'] ??
      raw['descripcionesDias'] ??
      raw['descripcionesdias'] ??
      null;

    console.log('[mi-plan] candidate descripciones:', candidate);

    let parsed: unknown = candidate;

    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = [];
      }
    }

    if (Array.isArray(parsed)) {
      console.log('[mi-plan] parsed descripciones (array):', parsed);
      return parsed.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((_, index) => true);
    }

    if (parsed && typeof parsed === 'object') {
      console.log('[mi-plan] parsed descripciones (object):', parsed);
      const values = Object.entries(parsed)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, value]) => (typeof value === 'string' ? value.trim() : ''));
      return values;
    }

    console.log('[mi-plan] parsed descripciones vacio.');

    return [];
  }

  private buildExerciseNameMap(grupos: CatalogoGrupoMuscular[]): void {
    this.exerciseNameById.clear();
    this.exerciseImageById.clear();
    for (const grupo of grupos) {
      for (const ejercicio of grupo.ejercicios) {
        this.exerciseNameById.set(ejercicio.id, ejercicio.nombre);
        this.exerciseImageById.set(ejercicio.id, ejercicio.imagenUrl ?? null);
      }
    }
  }

  private resolveExerciseName(id: number): string {
    return this.exerciseNameById.get(id) ?? `Ejercicio ${id}`;
  }

  private resolveExerciseImage(id: number): string | null {
    return this.exerciseImageById.get(id) ?? null;
  }

  toggleDay(index: number): void {
    this.days = this.days.map((day, dayIndex) => ({
      ...day,
      expanded: dayIndex === index ? !day.expanded : day.expanded,
    }));
  }

  async downloadPdf(): Promise<void> {
    if (!this.hasPlan) {
      return;
    }

    const { jsPDF } = await import('jspdf');
    const document = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = document.internal.pageSize.getWidth();
    const pageHeight = document.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = 60;

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY + requiredHeight <= pageHeight - margin) {
        return;
      }

      document.addPage();
      cursorY = 24;
    };

    const addParagraph = (text: string, fontSize = 11, extraGap = 4) => {
      const lines = document.splitTextToSize(text, contentWidth);
      document.setFontSize(fontSize);
      document.text(lines, margin, cursorY);
      cursorY += lines.length * (fontSize * 0.45) + extraGap;
    };

    document.setFillColor(16, 19, 20);
    document.rect(0, 0, pageWidth, 46, 'F');

    const logoDataUrl = await this.loadLogoDataUrl();

    if (logoDataUrl) {
      try {
        document.addImage(logoDataUrl, 'PNG', margin, 10, 28, 28);
      } catch {
        // Si el logo falla, el PDF se genera igual solo con tipografia.
      }
    }

    document.setTextColor(57, 133, 244);
    document.setFont('helvetica', 'bold');
    document.setFontSize(24);
    document.text('GymPanel', logoDataUrl ? 50 : margin, 22);

    document.setTextColor(237, 241, 243);
    document.setFont('helvetica', 'normal');
    document.setFontSize(11);
    document.text('Plan personalizado de entrenamiento', logoDataUrl ? 50 : margin, 30);

    document.setDrawColor(57, 133, 244);
    document.setLineWidth(0.8);
    document.line(margin, 46, pageWidth - margin, 46);

    document.setTextColor(16, 19, 20);
    document.setFont('helvetica', 'normal');
    addParagraph(`Plan: ${this.planName}`, 13, 2);

    if (this.currentUser) {
      addParagraph(`Alumno: ${this.currentUser.nombre} ${this.currentUser.apellido}`, 11, 2);
    }

    if (this.planDescription) {
      addParagraph(`Descripcion: ${this.planDescription}`, 11, 6);
    } else {
      cursorY += 2;
    }

    if (this.days.length === 0) {
      addParagraph('Este plan aun no tiene ejercicios cargados.', 11, 0);
    }

    for (const day of this.days) {
      ensureSpace(18);
      document.setFont('helvetica', 'bold');
      document.setFontSize(14);
      const dayHeading = day.description ? `${day.label} - ${day.description}` : day.label;
      const dayHeadingLines = document.splitTextToSize(dayHeading, contentWidth);
      document.text(dayHeadingLines, margin, cursorY);
      cursorY += dayHeadingLines.length * 5;
      cursorY += 2;

      document.setFont('helvetica', 'normal');
      document.setFontSize(11);

      if (day.exercises.length === 0) {
        addParagraph('Sin ejercicios cargados.', 11, 3);
        continue;
      }

      for (const [index, exercise] of day.exercises.entries()) {
        const line = `${index + 1}. ${exercise.exercise} - ${exercise.workload}`;
        const lines = document.splitTextToSize(line, contentWidth);
        ensureSpace(lines.length * 6 + 2);
        document.text(lines, margin + 2, cursorY);
        cursorY += lines.length * 5 + 2;
      }

      cursorY += 4;
    }

    const safePlanName =
      this.planName.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') ||
      'plan-entrenamiento';

    document.save(`${safePlanName}.pdf`);
  }

  private async loadLogoDataUrl(): Promise<string | null> {
    try {
      const response = await fetch('/images/gympanel-mark.svg');

      if (!response.ok) {
        return null;
      }

      const svgText = await response.text();
      const objectUrl = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));

      try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('No se pudo leer el logo.'));
          img.src = objectUrl;
        });

        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return null;
        }
        ctx.drawImage(image, 0, 0, size, size);
        return canvas.toDataURL('image/png');
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return null;
    }
  }
}