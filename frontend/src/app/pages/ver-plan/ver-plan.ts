import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ZoomableImageComponent } from '../../shared/zoomable-image/zoomable-image';
import {
  CatalogoGrupoMuscular,
  PlanEntrenamientoApiService,
  PlanEntrenamientoResponse,
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

type PredefinedPlan = {
  id: string;
  title: string;
  frequency: number;
  days: TrainingDay[];
};

@Component({
  
  standalone: true,
  imports: [FormsModule, PageHeaderCompactComponent, PageBgComponent, ZoomableImageComponent],
  templateUrl: './ver-plan.html',
  styleUrl: './ver-plan.css',
})
export class VerPlan implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly planEntrenamientoApiService = inject(PlanEntrenamientoApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedUserName = 'Usuario';
  selectedUserId: number | null = null;
  isEditing = false;
  isLoading = false;
  statusMessage = '';
  membershipFrequency = 1;
  availablePlans: PredefinedPlan[] = [];
  selectedPlanId = '';
  dbPlans: PlanEntrenamientoResponse[] = [];
  selectedDbPlanId: number | null = null;
  isAssigning = false;
  currentPlan: PlanEntrenamientoResponse | null = null;
  private readonly exerciseNameById = new Map<number, string>();
  private readonly exerciseImageById = new Map<number, string | null>();
  private readonly exerciseIdByNormalizedName = new Map<string, number>();

  days: TrainingDay[] = [
    {
      label: 'Dia 1',
      expanded: false,
      exercises: [
        { exercise: 'Sentadilla hack', workload: '3x15' },
        { exercise: 'Prensa inclinada', workload: '4x12' },
        { exercise: 'Camilla de cuadriceps', workload: '3x15' },
        { exercise: 'Peso muerto rumano', workload: '3x12' },
        { exercise: 'Gemelos de pie', workload: '4x20' },
      ],
    },
    {
      label: 'Dia 2',
      expanded: false,
      exercises: [
        { exercise: 'Press banca plano', workload: '4x10' },
        { exercise: 'Remo con barra', workload: '4x12' },
        { exercise: 'Press militar', workload: '3x12' },
        { exercise: 'Jalon al pecho', workload: '3x15' },
        { exercise: 'Curl de biceps', workload: '3x12' },
      ],
    },
    {
      label: 'Dia 3',
      expanded: false,
      exercises: [
        { exercise: 'Hip thrust', workload: '4x12' },
        { exercise: 'Zancadas caminando', workload: '3x14' },
        { exercise: 'Abductores', workload: '3x18' },
        { exercise: 'Fondos en paralelas', workload: '3x10' },
        { exercise: 'Plancha abdominal', workload: '4x30s' },
      ],
    },
  ];

  readonly predefinedPlans: PredefinedPlan[] = [
    {
      id: 'plan-2-fuerza',
      title: 'Plan fuerza 2 dias',
      frequency: 2,
      days: [
        {
          label: 'Dia 1',
          expanded: false,
          exercises: [
            { exercise: 'Sentadilla', workload: '4x8' },
            { exercise: 'Prensa', workload: '4x10' },
            { exercise: 'Gemelos', workload: '4x20' },
          ],
        },
        {
          label: 'Dia 2',
          expanded: false,
          exercises: [
            { exercise: 'Press banca', workload: '4x8' },
            { exercise: 'Remo', workload: '4x10' },
            { exercise: 'Curl biceps', workload: '3x12' },
          ],
        },
      ],
    },
    {
      id: 'plan-3-hipertrofia',
      title: 'Plan hipertrofia 3 dias',
      frequency: 3,
      days: [
        {
          label: 'Dia 1',
          expanded: false,
          exercises: [
            { exercise: 'Sentadilla hack', workload: '3x15' },
            { exercise: 'Camilla cuadriceps', workload: '3x15' },
            { exercise: 'Peso muerto rumano', workload: '3x12' },
          ],
        },
        {
          label: 'Dia 2',
          expanded: false,
          exercises: [
            { exercise: 'Press banca inclinado', workload: '4x10' },
            { exercise: 'Jalon al pecho', workload: '4x12' },
            { exercise: 'Elevaciones laterales', workload: '3x15' },
          ],
        },
        {
          label: 'Dia 3',
          expanded: false,
          exercises: [
            { exercise: 'Hip thrust', workload: '4x12' },
            { exercise: 'Abductores', workload: '3x18' },
            { exercise: 'Plancha abdominal', workload: '4x30s' },
          ],
        },
      ],
    },
    {
      id: 'plan-7-pase-libre',
      title: 'Plan pase libre 7 dias',
      frequency: 7,
      days: Array.from({ length: 7 }, (_, index) => ({
        label: `Dia ${index + 1}`,
        expanded: false,
        exercises: [
          { exercise: 'Circuito general', workload: '3 vueltas' },
          { exercise: 'Cardio', workload: '20 min' },
          { exercise: 'Core', workload: '3x20' },
        ],
      })),
    },
  ];

  private originalDays: TrainingDay[] = [];

  constructor() {
    this.saveOriginalDays();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const userName = params.get('usuario')?.trim();
      this.selectedUserName = userName && userName.length > 0 ? userName : 'Usuario';

      const userId = Number(params.get('userId'));
      this.selectedUserId = Number.isFinite(userId) && userId > 0 ? userId : null;

      const frecuencia = params.get('frecuencia');
      if (frecuencia) {
        this.membershipFrequency = parseInt(frecuencia, 10) || 1;
      }
      this.loadAvailablePlans();
      this.loadDbPlans();
      this.loadUserPlan();
    });
  }

  loadAvailablePlans(): void {
    this.availablePlans = this.predefinedPlans.filter((plan) => plan.frequency === this.membershipFrequency);
  }

  get exerciseOptions(): string[] {
    return Array.from(this.exerciseNameById.values()).sort((a, b) => a.localeCompare(b, 'es-AR'));
  }

  assignPredefinedPlan(): void {
    if (!this.selectedPlanId) {
      return;
    }

    const plan = this.availablePlans.find((item) => item.id === this.selectedPlanId);
    if (!plan) {
      return;
    }

    this.days = plan.days.map((planDay) => ({
      label: planDay.label,
      expanded: false,
      exercises: planDay.exercises.map((ex) => ({
        exercise: ex.exercise,
        workload: ex.workload,
      })),
    }));

    this.selectedPlanId = '';
    this.saveOriginalDays();
  }

  assignDbPlan(): void {
    if (!this.selectedUserId || !this.selectedDbPlanId) return;
    if (!window.confirm('Â¿Confirmar asignaciÃ³n de este plan al usuario?')) return;

    this.isAssigning = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.planEntrenamientoApiService
      .assignPlanToUser(this.selectedUserId, this.selectedDbPlanId)
      .pipe(finalize(() => { this.isAssigning = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: () => {
          this.statusMessage = 'Plan asignado correctamente.';
          this.selectedDbPlanId = null;
          this.loadUserPlan();
        },
        error: (err: HttpErrorResponse) => {
          const msg = err.error?.message;
          this.statusMessage = Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al asignar el plan.');
          this.cdr.detectChanges();
        },
      });
  }

  addExerciseRow(dayIndex: number): void {
    const day = this.days[dayIndex];
    if (!day) {
      return;
    }

    day.exercises = [...day.exercises, { exercise: '', workload: '' }];
  }

  validateExerciseSelection(dayIndex: number, rowIndex: number): void {
    const day = this.days[dayIndex];
    const row = day?.exercises[rowIndex];
    if (!row) {
      return;
    }

    const typedValue = row.exercise.trim();
    if (!typedValue) {
      return;
    }

    const matched = this.exerciseOptions.find(
      (name) => this.normalizeText(name) === this.normalizeText(typedValue),
    );

    row.exercise = matched ?? '';
  }

  removeExerciseRow(dayIndex: number, rowIndex: number): void {
    const day = this.days[dayIndex];
    if (!day) {
      return;
    }

    day.exercises = day.exercises.filter((_, index) => index !== rowIndex);
  }

  toggleDay(index: number): void {
    this.days = this.days.map((day, dayIndex) => ({
      ...day,
      expanded: dayIndex === index ? !day.expanded : day.expanded,
    }));
  }

  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
    this.restoreOriginalDays();
  }

  savePlan(): void {
    if (!this.selectedUserId) {
      this.statusMessage = 'No se pudo identificar al usuario para guardar cambios.';
      return;
    }

    if (!this.currentPlan) {
      this.statusMessage = 'No hay plan cargado para guardar cambios.';
      return;
    }

    try {
      const payload = this.buildUserEditedPlanPayload();

      this.isLoading = true;
      this.cdr.markForCheck();

      this.planEntrenamientoApiService
        .updatePlanForUser(this.selectedUserId, payload)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          }),
        )
        .subscribe({
          next: () => {
            this.isEditing = false;
            this.statusMessage = 'Plan del usuario actualizado y guardado como plan editado.';
            this.loadUserPlan();
          },
          error: (err: HttpErrorResponse) => {
            const msg = err.error?.message;
            this.statusMessage = Array.isArray(msg)
              ? msg.join(', ')
              : msg || 'No se pudo guardar el plan editado del usuario.';
            this.cdr.detectChanges();
          },
        });
    } catch (error) {
      this.statusMessage =
        error instanceof Error ? error.message : 'No se pudieron validar los cambios del plan.';
      this.cdr.detectChanges();
    }
  }

  private loadDbPlans(): void {
    this.planEntrenamientoApiService.getAllPlans().subscribe({
      next: (plans) => {
        this.dbPlans = plans.filter((plan) => (plan.tipo ?? 'predeterminado') === 'predeterminado');
        this.cdr.detectChanges();
      },
      error: () => {
        // Non-critical â€” dropdown simply stays empty
      },
    });
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

    forkJoin({
      catalogo: this.planEntrenamientoApiService.getCatalogoGruposMusculares(),
      planData: this.planEntrenamientoApiService.getPlanByUserId(this.selectedUserId),
    })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ catalogo, planData }: { catalogo: CatalogoGrupoMuscular[]; planData: { plan: PlanEntrenamientoResponse | null } }) => {
          this.buildExerciseNameMap(catalogo);
          const response = planData;

          console.log('[ver-plan] planData.plan (raw):', response.plan);

          if (!response.plan) {
            this.days = [];
            this.currentPlan = null;
            this.statusMessage = 'Este usuario no tiene un plan de entrenamiento asignado.';
            this.saveOriginalDays();
            this.cdr.detectChanges();
            return;
          }

          this.currentPlan = response.plan;
          this.days = this.mapPlanToDays(response.plan);
          console.log('[ver-plan] days mapeados:', this.days.map((day) => ({ label: day.label, description: day.description })));
          this.saveOriginalDays();
          this.cdr.detectChanges();
        },
        error: () => {
          this.days = [];
          this.currentPlan = null;
          this.statusMessage = 'No se pudo cargar el plan del usuario.';
          this.saveOriginalDays();
          this.cdr.detectChanges();
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

    console.log('[ver-plan] candidate descripciones:', candidate);

    let parsed: unknown = candidate;

    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        parsed = [];
      }
    }

    if (Array.isArray(parsed)) {
      console.log('[ver-plan] parsed descripciones (array):', parsed);
      return parsed.map((item) => (typeof item === 'string' ? item.trim() : '')).filter((_, index) => true);
    }

    if (parsed && typeof parsed === 'object') {
      console.log('[ver-plan] parsed descripciones (object):', parsed);
      const values = Object.entries(parsed)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, value]) => (typeof value === 'string' ? value.trim() : ''));
      return values;
    }

    console.log('[ver-plan] parsed descripciones vacio.');

    return [];
  }

  private buildExerciseNameMap(grupos: CatalogoGrupoMuscular[]): void {
    this.exerciseNameById.clear();
    this.exerciseImageById.clear();
    this.exerciseIdByNormalizedName.clear();
    for (const grupo of grupos) {
      for (const ejercicio of grupo.ejercicios) {
        this.exerciseNameById.set(ejercicio.id, ejercicio.nombre);
        this.exerciseImageById.set(ejercicio.id, ejercicio.imagenUrl ?? null);
        this.exerciseIdByNormalizedName.set(this.normalizeText(ejercicio.nombre), ejercicio.id);
      }
    }
  }

  private resolveExerciseName(id: number): string {
    return this.exerciseNameById.get(id) ?? `Ejercicio ${id}`;
  }

  private resolveExerciseImage(id: number): string | null {
    return this.exerciseImageById.get(id) ?? null;
  }

  private saveOriginalDays(): void {
    this.originalDays = JSON.parse(JSON.stringify(this.days));
  }

  private restoreOriginalDays(): void {
    this.days = JSON.parse(JSON.stringify(this.originalDays));
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private buildUserEditedPlanPayload() {
    if (!this.currentPlan) {
      throw new Error('No hay plan base para generar el plan editado.');
    }

    if (this.days.length === 0) {
      throw new Error('El plan debe tener al menos un dia cargado.');
    }

    const cantidadDias = this.days.length;
    const ejercicios: Array<number[] | null> = Array.from({ length: 7 }, (_, dayIndex) => {
      if (dayIndex >= cantidadDias) {
        return null;
      }

      const day = this.days[dayIndex];
      const rows = day?.exercises ?? [];
      if (rows.length === 0) {
        throw new Error(`El ${day?.label ?? `Dia ${dayIndex + 1}`} debe tener al menos un ejercicio.`);
      }

      return rows.map((row, rowIndex) => {
        const normalizedName = this.normalizeText(row.exercise);
        const exerciseId = this.exerciseIdByNormalizedName.get(normalizedName);
        if (!exerciseId) {
          throw new Error(
            `Ejercicio invalido en ${day.label}, fila ${rowIndex + 1}. Selecciona un ejercicio del catalogo.`,
          );
        }
        return exerciseId;
      });
    });

    const repeticiones: Array<string[] | null> = Array.from({ length: 7 }, (_, dayIndex) => {
      if (dayIndex >= cantidadDias) {
        return null;
      }

      const day = this.days[dayIndex];
      const rows = day?.exercises ?? [];
      if (rows.length === 0) {
        throw new Error(`El ${day?.label ?? `Dia ${dayIndex + 1}`} no tiene repeticiones cargadas.`);
      }

      return rows.map((row, rowIndex) => {
        const valor = row.workload.trim();
        if (!valor) {
          throw new Error(`La repeticion en ${day.label}, fila ${rowIndex + 1} es obligatoria.`);
        }
        return valor;
      });
    });

    return {
      nombre: this.currentPlan.nombre,
      descripcion: this.currentPlan.descripcion ?? undefined,
      cantidadDias,
      ejercicios,
      repeticiones,
      descripcionesDias: Array.from({ length: 7 }, (_, dayIndex) => {
        if (dayIndex >= cantidadDias) {
          return null;
        }

        const value = this.days[dayIndex]?.description?.trim() ?? '';
        return value || null;
      }),
    };
  }

  async downloadPdf(): Promise<void> {
    if (this.days.length === 0) {
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
    document.text('Plan de entrenamiento del alumno', logoDataUrl ? 50 : margin, 30);

    document.setDrawColor(57, 133, 244);
    document.setLineWidth(0.8);
    document.line(margin, 46, pageWidth - margin, 46);

    document.setTextColor(16, 19, 20);
    document.setFont('helvetica', 'normal');
    if (this.currentPlan?.nombre) {
      addParagraph(`Plan: ${this.currentPlan.nombre}`, 13, 2);
    }
    addParagraph(`Alumno: ${this.selectedUserName}`, 13, 6);

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

    const safeUserName = this.selectedUserName
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'usuario';

    document.save(`plan-${safeUserName}.pdf`);
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





