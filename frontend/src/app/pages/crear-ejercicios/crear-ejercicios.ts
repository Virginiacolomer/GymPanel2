import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, map, timeout } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import {
  CatalogoEjercicio,
  CatalogoGrupoMuscularResumen,
  PlanEntrenamientoApiService,
  CreateGrupoMuscularResponse,
  CreateEjercicioResponse,
  UpdateGrupoMuscularResponse,
  UpdateEjercicioResponse,
  DeleteEjercicioResponse,
  UploadEjercicioImagenResponse,
} from '../../core/services/plan-entrenamiento-api.service';
import { GruposMuscularesPanelComponent } from './components/grupos-musculares-panel/grupos-musculares-panel';
import { EjerciciosListComponent } from './components/ejercicios-list/ejercicios-list';
import { EjercicioFormComponent } from './components/ejercicio-form/ejercicio-form';

const MAX_IMAGEN_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-crear-ejercicios',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderCompactComponent,
    PageBgComponent,
    GruposMuscularesPanelComponent,
    EjerciciosListComponent,
    EjercicioFormComponent,
  ],
  templateUrl: './crear-ejercicios.html',
  styleUrl: './crear-ejercicios.css',
})
export class CrearEjercicios implements OnInit {
  @ViewChild('imagenFileInput') imagenFileInputRef!: ElementRef<HTMLInputElement>;

  private readonly planEntrenamientoApiService = inject(PlanEntrenamientoApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ejerciciosPorGrupoCache = new Map<number, CatalogoEjercicio[]>();
  private readonly requestTimeoutMs = 2500;

  private statusTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private createEjercicioUnlockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private createGrupoUnlockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private updateEjercicioUnlockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private updateGrupoUnlockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private deleteEjercicioUnlockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private recentlyUploadedTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private imagenUploadTargetEjercicioId: number | null = null;

  gruposMusculares: CatalogoGrupoMuscularResumen[] = [];
  selectedGrupoId: number | null = null;
  selectedEjercicios: CatalogoEjercicio[] = [];

  isLoadingGrupos = false;
  isLoadingGrupoDetalle = false;
  hasLoadedGrupoDetalle = false;
  isCreatingGrupo = false;
  isCreatingEjercicio = false;
  isUpdatingGrupo = false;
  isUpdatingEjercicio = false;
  isDeletingEjercicio = false;
  pendingEditEjercicioId: number | null = null;
  pendingDeleteEjercicioId: number | null = null;
  loadingError = false;

  isUploadingImagenEjercicioId: number | null = null;
  recentlyUploadedImagenEjercicioId: number | null = null;

  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';
  grupoFeedbackMessage = '';
  grupoFeedbackType: 'success' | 'error' | 'info' = 'info';
  ejercicioFeedbackMessage = '';
  ejercicioFeedbackType: 'success' | 'error' | 'info' = 'info';

  get selectedGrupoNombre(): string {
    if (!this.selectedGrupoId) {
      return '';
    }
    const found = this.gruposMusculares.find((g) => g.id === this.selectedGrupoId);
    return found?.nombre ?? '';
  }

  ngOnInit(): void {
    this.loadGruposMusculares();
  }

  private clearEjercicioActionFlags(): void {
    this.isUpdatingEjercicio = false;
    this.isDeletingEjercicio = false;
    this.pendingEditEjercicioId = null;
    this.pendingDeleteEjercicioId = null;

    if (this.updateEjercicioUnlockTimeoutId) {
      clearTimeout(this.updateEjercicioUnlockTimeoutId);
      this.updateEjercicioUnlockTimeoutId = null;
    }

    if (this.deleteEjercicioUnlockTimeoutId) {
      clearTimeout(this.deleteEjercicioUnlockTimeoutId);
      this.deleteEjercicioUnlockTimeoutId = null;
    }
  }

  loadGruposMusculares(): void {
    this.isLoadingGrupos = true;
    this.loadingError = false;
    this.planEntrenamientoApiService
      .getCatalogoGruposMuscularesResumen()
      .pipe(
        timeout(this.requestTimeoutMs),
        catchError((errorResumen) => {
          console.warn('Fallo o timeout en grupos resumen. Se usa fallback:', errorResumen);
          return this.planEntrenamientoApiService.getCatalogoGruposMusculares().pipe(
            timeout(this.requestTimeoutMs),
            map((gruposCompletos) =>
              gruposCompletos.map((grupo) => ({
                id: grupo.id,
                nombre: grupo.nombre,
              })),
            ),
          );
        }),
        finalize(() => (this.isLoadingGrupos = false)),
      )
      .subscribe({
        next: (grupos) => {
          this.clearEjercicioActionFlags();
          this.gruposMusculares = grupos;
          this.loadingError = false;
          if (grupos.length > 0) {
            if (
              !this.selectedGrupoId ||
              !grupos.some((grupo) => grupo.id === this.selectedGrupoId)
            ) {
              this.selectedGrupoId = grupos[0].id;
            }
            this.loadSelectedGrupoDetalle();
          } else {
            this.selectedGrupoId = null;
            this.selectedEjercicios = [];
          }
        },
        error: (err) => {
          this.clearEjercicioActionFlags();
          this.loadingError = true;
          if (this.gruposMusculares.length === 0) {
            this.setStatus('Error al cargar los grupos musculares. Intenta de nuevo.', 'error');
          }
          console.error('Error al cargar grupos:', err);
        },
      });
  }

  onGrupoChange(grupoId: number | null): void {
    this.selectedGrupoId = grupoId;
    this.loadSelectedGrupoDetalle();
  }

  private loadSelectedGrupoDetalle(options?: { silent?: boolean }): void {
    if (!this.selectedGrupoId) {
      this.selectedEjercicios = [];
      this.hasLoadedGrupoDetalle = false;
      return;
    }

    const requestedGroupId = this.selectedGrupoId;
    const cached = this.ejerciciosPorGrupoCache.get(requestedGroupId);
    const hasCachedData = Array.isArray(cached);

    if (cached) {
      this.selectedEjercicios = cached;
      this.hasLoadedGrupoDetalle = true;
    } else {
      this.selectedEjercicios = [];
      this.hasLoadedGrupoDetalle = false;
    }

    this.isLoadingGrupoDetalle = options?.silent ? false : !hasCachedData;
    this.planEntrenamientoApiService
      .getEjerciciosByGrupoMuscularId(requestedGroupId)
      .pipe(
        timeout(this.requestTimeoutMs),
        catchError((errorEjercicios) => {
          console.warn(
            'Fallo o timeout en ejercicios por grupo. Se usa fallback:',
            errorEjercicios,
          );
          return this.planEntrenamientoApiService.getGrupoMuscularById(requestedGroupId).pipe(
            timeout(this.requestTimeoutMs),
            map((grupo) => grupo.ejercicios ?? []),
          );
        }),
        finalize(() => {
          if (!hasCachedData && !options?.silent) {
            this.isLoadingGrupoDetalle = false;
          }
        }),
      )
      .subscribe({
        next: (ejercicios) => {
          this.ejerciciosPorGrupoCache.set(requestedGroupId, ejercicios);
          if (this.selectedGrupoId !== requestedGroupId) {
            return;
          }
          this.selectedEjercicios = ejercicios;
          this.hasLoadedGrupoDetalle = true;
          this.isLoadingGrupoDetalle = false;
        },
        error: (err) => {
          if (this.selectedGrupoId !== requestedGroupId) {
            return;
          }
          const cachedForGroup = this.ejerciciosPorGrupoCache.get(requestedGroupId) ?? [];
          if (cachedForGroup.length > 0) {
            this.selectedEjercicios = cachedForGroup;
            this.hasLoadedGrupoDetalle = true;
            return;
          }
          this.selectedEjercicios = [];
          this.hasLoadedGrupoDetalle = false;
          this.isLoadingGrupoDetalle = false;
          this.setStatus('No se pudo cargar el detalle del grupo muscular seleccionado.', 'error');
          console.error('Error al cargar detalle de grupo:', err);
        },
      });
  }

  createGrupoMuscular(nombreRaw: string): void {
    const nombre = nombreRaw.trim();
    this.statusMessage = '';
    this.grupoFeedbackMessage = '';

    if (!nombre) {
      this.grupoFeedbackMessage = 'El nombre del grupo muscular es obligatorio';
      this.grupoFeedbackType = 'error';
      return;
    }

    const normalizedNombre = this.normalizeName(nombre);
    const existsGroup = this.gruposMusculares.some(
      (grupo) => this.normalizeName(grupo.nombre) === normalizedNombre,
    );

    if (existsGroup) {
      this.grupoFeedbackMessage = 'El grupo muscular ya existe y no se puede volver a crear.';
      this.grupoFeedbackType = 'error';
      return;
    }

    this.isCreatingGrupo = true;
    const optimisticId = -Date.now();
    const optimisticGroup: CatalogoGrupoMuscularResumen = {
      id: optimisticId,
      nombre: normalizedNombre,
    };

    this.gruposMusculares = [...this.gruposMusculares, optimisticGroup].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
    this.selectedGrupoId = optimisticId;
    this.selectedEjercicios = [];
    this.hasLoadedGrupoDetalle = true;
    this.ejerciciosPorGrupoCache.set(optimisticId, []);

    if (this.createGrupoUnlockTimeoutId) {
      clearTimeout(this.createGrupoUnlockTimeoutId);
    }

    this.createGrupoUnlockTimeoutId = setTimeout(() => {
      this.isCreatingGrupo = false;
      this.grupoFeedbackMessage = 'La solicitud esta tardando demasiado. Actualizando lista...';
      this.grupoFeedbackType = 'info';
      this.loadGruposMusculares();
    }, this.requestTimeoutMs);

    this.planEntrenamientoApiService
      .createGrupoMuscular({ nombre })
      .pipe(
        timeout(10000),
        finalize(() => {
          this.isCreatingGrupo = false;
          if (this.createGrupoUnlockTimeoutId) {
            clearTimeout(this.createGrupoUnlockTimeoutId);
            this.createGrupoUnlockTimeoutId = null;
          }
        }),
      )
      .subscribe({
        next: (response: CreateGrupoMuscularResponse) => {
          this.isCreatingGrupo = false;
          this.grupoFeedbackMessage = `Grupo muscular "${response.nombre}" creado correctamente`;
          this.grupoFeedbackType = 'success';

          const groupsWithoutOptimistic = this.gruposMusculares.filter(
            (g) => g.id !== optimisticId,
          );
          const existsRealGroup = groupsWithoutOptimistic.some((g) => g.id === response.id);

          this.gruposMusculares = existsRealGroup
            ? groupsWithoutOptimistic
            : [...groupsWithoutOptimistic, { id: response.id, nombre: response.nombre }].sort(
                (a, b) => a.nombre.localeCompare(b.nombre),
              );

          this.selectedGrupoId = response.id;
          this.selectedEjercicios = [];
          this.hasLoadedGrupoDetalle = true;
          this.ejerciciosPorGrupoCache.delete(optimisticId);
          this.ejerciciosPorGrupoCache.set(response.id, []);

          this.loadGruposMusculares();
        },
        error: (err) => {
          this.isCreatingGrupo = false;
          this.gruposMusculares = this.gruposMusculares.filter((g) => g.id !== optimisticId);
          this.ejerciciosPorGrupoCache.delete(optimisticId);

          if (this.selectedGrupoId === optimisticId) {
            this.selectedGrupoId =
              this.gruposMusculares.length > 0 ? this.gruposMusculares[0].id : null;
            this.loadSelectedGrupoDetalle();
          }

          this.grupoFeedbackMessage = this.getErrorMessage(err, 'Error al crear el grupo muscular');
          this.grupoFeedbackType = 'error';
          console.error(err);
        },
      });
  }

  updateGrupoMuscular(nombreRaw: string): void {
    const grupoId = Number(this.selectedGrupoId);
    const nombre = nombreRaw.trim();
    this.grupoFeedbackMessage = '';

    if (!Number.isInteger(grupoId) || grupoId <= 0) {
      this.grupoFeedbackMessage = 'Debes seleccionar un grupo muscular valido';
      this.grupoFeedbackType = 'error';
      return;
    }

    if (!nombre) {
      this.grupoFeedbackMessage = 'El nombre del grupo muscular es obligatorio';
      this.grupoFeedbackType = 'error';
      return;
    }

    const normalizedNombre = this.normalizeName(nombre);
    const duplicate = this.gruposMusculares.some(
      (grupo) => grupo.id !== grupoId && this.normalizeName(grupo.nombre) === normalizedNombre,
    );

    if (duplicate) {
      this.grupoFeedbackMessage =
        'El grupo muscular ya existe y no se puede guardar con ese nombre.';
      this.grupoFeedbackType = 'error';
      return;
    }

    const originalGroups = [...this.gruposMusculares];
    this.isUpdatingGrupo = true;

    if (this.updateGrupoUnlockTimeoutId) {
      clearTimeout(this.updateGrupoUnlockTimeoutId);
    }

    this.updateGrupoUnlockTimeoutId = setTimeout(() => {
      this.isUpdatingGrupo = false;
      this.grupoFeedbackMessage = 'La actualizacion esta tardando demasiado. Refrescando datos...';
      this.grupoFeedbackType = 'info';
      this.loadGruposMusculares();
    }, this.requestTimeoutMs);

    this.gruposMusculares = this.gruposMusculares
      .map((g) => (g.id === grupoId ? { ...g, nombre: normalizedNombre } : g))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    this.planEntrenamientoApiService
      .updateGrupoMuscular(grupoId, { nombre: normalizedNombre })
      .pipe(
        finalize(() => {
          this.isUpdatingGrupo = false;
          if (this.updateGrupoUnlockTimeoutId) {
            clearTimeout(this.updateGrupoUnlockTimeoutId);
            this.updateGrupoUnlockTimeoutId = null;
          }
        }),
      )
      .subscribe({
        next: (response: UpdateGrupoMuscularResponse) => {
          this.isUpdatingGrupo = false;
          this.gruposMusculares = this.gruposMusculares
            .map((g) => (g.id === response.id ? { ...g, nombre: response.nombre } : g))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
          this.grupoFeedbackMessage = `Grupo muscular "${response.nombre}" actualizado correctamente`;
          this.grupoFeedbackType = 'success';
          this.loadGruposMusculares();
        },
        error: (err) => {
          this.isUpdatingGrupo = false;
          this.gruposMusculares = originalGroups;
          this.grupoFeedbackMessage = this.getErrorMessage(
            err,
            'Error al actualizar el grupo muscular',
          );
          this.grupoFeedbackType = 'error';
        },
      });
  }

  createEjercicio(nombreRaw: string): void {
    const nombre = nombreRaw.trim();
    this.statusMessage = '';
    this.ejercicioFeedbackMessage = '';

    if (!nombre) {
      this.ejercicioFeedbackMessage = 'El nombre del ejercicio es obligatorio';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    if (!this.selectedGrupoId) {
      this.ejercicioFeedbackMessage = 'Debes seleccionar un grupo muscular';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    const grupoMuscularId = Number(this.selectedGrupoId);
    if (!Number.isInteger(grupoMuscularId) || grupoMuscularId <= 0) {
      this.ejercicioFeedbackMessage = 'Debes seleccionar un grupo muscular valido';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    const normalizedNombre = this.normalizeName(nombre);
    const existsInSelectedGroup = this.selectedEjercicios.some(
      (ejercicio) => this.normalizeName(ejercicio.nombre) === normalizedNombre,
    );

    if (existsInSelectedGroup) {
      this.ejercicioFeedbackMessage = 'El ejercicio ya existe y no se puede volver a crear.';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    const tempId = -Date.now() - Math.random();
    const newEjercicio = { id: tempId, nombre: normalizedNombre };
    const currentGroupId = this.selectedGrupoId;
    const currentList = this.ejerciciosPorGrupoCache.get(currentGroupId) ?? this.selectedEjercicios;
    const updatedList = [...currentList, newEjercicio].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );

    this.ejerciciosPorGrupoCache.set(grupoMuscularId, updatedList);
    this.selectedEjercicios = updatedList;
    this.hasLoadedGrupoDetalle = true;
    this.ejercicioFeedbackMessage = '';

    if (this.createEjercicioUnlockTimeoutId) {
      clearTimeout(this.createEjercicioUnlockTimeoutId);
    }

    this.createEjercicioUnlockTimeoutId = setTimeout(() => {
      this.isCreatingEjercicio = false;
      this.ejercicioFeedbackMessage = 'La solicitud esta tardando demasiado. Actualizando lista...';
      this.ejercicioFeedbackType = 'info';
      this.loadGruposMusculares();
    }, this.requestTimeoutMs);

    this.planEntrenamientoApiService
      .createEjercicio({ nombre: normalizedNombre, grupoMuscularId })
      .pipe(
        timeout(10000),
        finalize(() => {
          this.isCreatingEjercicio = false;
          if (this.createEjercicioUnlockTimeoutId) {
            clearTimeout(this.createEjercicioUnlockTimeoutId);
            this.createEjercicioUnlockTimeoutId = null;
          }
        }),
      )
      .subscribe({
        next: (response: CreateEjercicioResponse) => {
          this.ejercicioFeedbackMessage = `✓ "${response.nombre}" creado correctamente`;
          this.ejercicioFeedbackType = 'success';

          if (currentGroupId) {
            const list =
              this.ejerciciosPorGrupoCache.get(currentGroupId) ?? this.selectedEjercicios;
            const synced = list
              .map((ej) => (ej.id === tempId ? { id: response.id, nombre: response.nombre } : ej))
              .sort((a, b) => a.nombre.localeCompare(b.nombre));

            this.ejerciciosPorGrupoCache.set(currentGroupId, synced);
            this.selectedEjercicios = synced;
          }

          this.loadGruposMusculares();
        },
        error: (err) => {
          if (currentGroupId) {
            const list =
              this.ejerciciosPorGrupoCache.get(currentGroupId) ?? this.selectedEjercicios;
            const filtered = list.filter((ej) => ej.id !== tempId);
            this.ejerciciosPorGrupoCache.set(currentGroupId, filtered);
            this.selectedEjercicios = filtered;
          }

          this.ejercicioFeedbackMessage = this.getErrorMessage(err, 'Error al crear el ejercicio');
          this.ejercicioFeedbackType = 'error';
          console.error(err);
        },
      });
  }

  saveEditEjercicio(event: { id: number; nombre: string }): void {
    const ejercicioId = event.id;
    const grupoId = Number(this.selectedGrupoId);
    const nombre = event.nombre.trim();

    if (!Number.isInteger(ejercicioId) || ejercicioId <= 0) {
      this.ejercicioFeedbackMessage = 'Debes seleccionar un ejercicio valido para editar';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    if (!Number.isInteger(grupoId) || grupoId <= 0) {
      this.ejercicioFeedbackMessage = 'Debes seleccionar un grupo muscular valido';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    const normalizedNombre = this.normalizeName(nombre);
    const duplicate = this.selectedEjercicios.some(
      (ej) => ej.id !== ejercicioId && this.normalizeName(ej.nombre) === normalizedNombre,
    );

    if (duplicate) {
      this.ejercicioFeedbackMessage =
        'El ejercicio ya existe y no se puede guardar con ese nombre.';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    const previousList = [...this.selectedEjercicios];
    const updatedList = this.selectedEjercicios
      .map((ej) => (ej.id === ejercicioId ? { ...ej, nombre: normalizedNombre } : ej))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    this.isUpdatingEjercicio = true;
    this.pendingEditEjercicioId = ejercicioId;

    if (this.updateEjercicioUnlockTimeoutId) {
      clearTimeout(this.updateEjercicioUnlockTimeoutId);
    }

    this.updateEjercicioUnlockTimeoutId = setTimeout(() => {
      this.clearEjercicioActionFlags();
      this.ejercicioFeedbackMessage =
        'La actualizacion esta tardando demasiado. Refrescando ejercicios...';
      this.ejercicioFeedbackType = 'info';
      this.loadGruposMusculares();
    }, this.requestTimeoutMs);

    this.selectedEjercicios = updatedList;
    this.ejerciciosPorGrupoCache.set(grupoId, updatedList);

    this.planEntrenamientoApiService
      .updateEjercicio(ejercicioId, { nombre: normalizedNombre })
      .pipe(
        finalize(() => {
          this.isUpdatingEjercicio = false;
          if (this.updateEjercicioUnlockTimeoutId) {
            clearTimeout(this.updateEjercicioUnlockTimeoutId);
            this.updateEjercicioUnlockTimeoutId = null;
          }
        }),
      )
      .subscribe({
        next: (response: UpdateEjercicioResponse) => {
          this.clearEjercicioActionFlags();
          const syncedList = this.selectedEjercicios
            .map((ej) => (ej.id === response.id ? { ...ej, nombre: response.nombre } : ej))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

          this.selectedEjercicios = syncedList;
          this.ejerciciosPorGrupoCache.set(grupoId, syncedList);
          this.ejercicioFeedbackMessage = `Ejercicio "${response.nombre}" actualizado correctamente`;
          this.ejercicioFeedbackType = 'success';
          this.loadGruposMusculares();
        },
        error: (err) => {
          this.clearEjercicioActionFlags();
          this.selectedEjercicios = previousList;
          this.ejerciciosPorGrupoCache.set(grupoId, previousList);
          this.ejercicioFeedbackMessage = this.getErrorMessage(
            err,
            'Error al actualizar el ejercicio',
          );
          this.ejercicioFeedbackType = 'error';
        },
      });
  }

  removeEjercicio(ejercicio: CatalogoEjercicio): void {
    const grupoId = Number(this.selectedGrupoId);
    if (!Number.isInteger(grupoId) || grupoId <= 0) {
      this.ejercicioFeedbackMessage = 'Debes seleccionar un grupo muscular valido';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    this.isDeletingEjercicio = true;
    this.pendingDeleteEjercicioId = ejercicio.id;

    if (this.deleteEjercicioUnlockTimeoutId) {
      clearTimeout(this.deleteEjercicioUnlockTimeoutId);
    }

    this.deleteEjercicioUnlockTimeoutId = setTimeout(() => {
      this.clearEjercicioActionFlags();
      this.ejercicioFeedbackMessage =
        'La eliminacion esta tardando demasiado. Refrescando ejercicios...';
      this.ejercicioFeedbackType = 'info';
      this.loadGruposMusculares();
    }, this.requestTimeoutMs);

    const previousList = [...this.selectedEjercicios];
    const filteredList = previousList.filter((item) => item.id !== ejercicio.id);

    this.selectedEjercicios = filteredList;
    this.ejerciciosPorGrupoCache.set(grupoId, filteredList);

    this.planEntrenamientoApiService
      .deleteEjercicio(ejercicio.id)
      .pipe(
        finalize(() => {
          this.isDeletingEjercicio = false;
          if (this.deleteEjercicioUnlockTimeoutId) {
            clearTimeout(this.deleteEjercicioUnlockTimeoutId);
            this.deleteEjercicioUnlockTimeoutId = null;
          }
        }),
      )
      .subscribe({
        next: (response: DeleteEjercicioResponse) => {
          this.clearEjercicioActionFlags();
          this.ejercicioFeedbackMessage = response.message;
          this.ejercicioFeedbackType = 'success';
          this.loadGruposMusculares();
        },
        error: (err) => {
          this.clearEjercicioActionFlags();
          this.selectedEjercicios = previousList;
          this.ejerciciosPorGrupoCache.set(grupoId, previousList);
          this.ejercicioFeedbackMessage = this.getErrorMessage(
            err,
            'Error al eliminar el ejercicio',
          );
          this.ejercicioFeedbackType = 'error';
        },
      });
  }

  triggerImageUpload(ejercicio: CatalogoEjercicio): void {
    if (this.isUploadingImagenEjercicioId) {
      return;
    }

    if (this.recentlyUploadedTimeoutId) {
      clearTimeout(this.recentlyUploadedTimeoutId);
      this.recentlyUploadedTimeoutId = null;
    }
    this.recentlyUploadedImagenEjercicioId = null;

    this.imagenUploadTargetEjercicioId = ejercicio.id;
    this.imagenFileInputRef.nativeElement.value = '';
    this.imagenFileInputRef.nativeElement.click();
  }

  onImagenFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    const ejercicioId = this.imagenUploadTargetEjercicioId;
    this.imagenUploadTargetEjercicioId = null;

    if (!file || !ejercicioId) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.ejercicioFeedbackMessage = 'El archivo seleccionado debe ser una imagen.';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    if (file.size > MAX_IMAGEN_SIZE_BYTES) {
      this.ejercicioFeedbackMessage = 'La imagen no puede superar los 5 MB.';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    this.isUploadingImagenEjercicioId = ejercicioId;
    this.ejercicioFeedbackMessage = '';

    this.planEntrenamientoApiService
      .uploadEjercicioImagen(ejercicioId, file)
      .pipe(
        timeout(20000),
        finalize(() => {
          this.isUploadingImagenEjercicioId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (response: UploadEjercicioImagenResponse) => {
          this.applyEjercicioImagenUrl(ejercicioId, response.imagenUrl);
          this.ejercicioFeedbackMessage = 'Imagen actualizada correctamente.';
          this.ejercicioFeedbackType = 'success';

          if (this.recentlyUploadedTimeoutId) {
            clearTimeout(this.recentlyUploadedTimeoutId);
          }

          this.recentlyUploadedImagenEjercicioId = ejercicioId;
          this.recentlyUploadedTimeoutId = setTimeout(() => {
            this.recentlyUploadedImagenEjercicioId = null;
            this.recentlyUploadedTimeoutId = null;
            this.cdr.detectChanges();
          }, 2200);
        },
        error: (err) => {
          this.ejercicioFeedbackMessage = this.getErrorMessage(
            err,
            'Error al subir la imagen del ejercicio',
          );
          this.ejercicioFeedbackType = 'error';
          console.error(err);
        },
      });
  }

  private applyEjercicioImagenUrl(ejercicioId: number, imagenUrl: string): void {
    this.selectedEjercicios = this.selectedEjercicios.map((ej) =>
      ej.id === ejercicioId ? { ...ej, imagenUrl } : ej,
    );

    if (this.selectedGrupoId) {
      const currentList = this.ejerciciosPorGrupoCache.get(this.selectedGrupoId);
      if (currentList) {
        const updatedList = currentList.map((ej) =>
          ej.id === ejercicioId ? { ...ej, imagenUrl } : ej,
        );
        this.ejerciciosPorGrupoCache.set(this.selectedGrupoId, updatedList);
      }
    }
  }

  private normalizeName(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toUpperCase();
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    const err = error as {
      status?: number;
      name?: string;
      message?: string;
      error?: {
        message?: string | string[];
      };
    };

    if (err?.name === 'TimeoutError' || err?.status === 0) {
      return 'La solicitud tardó demasiado. El servidor podría estar lento. Intenta nuevamente.';
    }

    if (err?.status === 409) {
      return 'Ya existe un registro con ese nombre.';
    }

    const message = err?.error?.message;
    if (Array.isArray(message)) {
      return message.join(' | ');
    }

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }

    if (typeof err?.message === 'string' && err.message.length > 0) {
      return err.message;
    }

    return fallback;
  }

  private setStatus(message: string, type: 'success' | 'error' | 'info'): void {
    if (this.statusTimeoutId) {
      clearTimeout(this.statusTimeoutId);
      this.statusTimeoutId = null;
    }

    this.statusMessage = message;
    this.statusType = type;

    if (type === 'success') {
      this.statusTimeoutId = setTimeout(() => {
        this.statusMessage = '';
        this.statusTimeoutId = null;
      }, 3000);
    }
  }
}
