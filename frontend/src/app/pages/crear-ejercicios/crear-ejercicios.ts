import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { catchError, finalize, map, timeout } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { ZoomableImageComponent } from '../../shared/zoomable-image/zoomable-image';
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

const MAX_IMAGEN_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent, FormsModule, CommonModule, ZoomableImageComponent],
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

  gruposMusculares: CatalogoGrupoMuscularResumen[] = [];
  nuevoGrupoNombre = '';
  selectedGrupoId: number | null = null;
  selectedEjercicios: CatalogoEjercicio[] = [];
  ejercicioNombre = '';
  editarGrupoNombre = '';
  editingEjercicioId: number | null = null;
  editingEjercicioNombre = '';

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
  private imagenUploadTargetEjercicioId: number | null = null;
  private recentlyUploadedTimeoutId: ReturnType<typeof setTimeout> | null = null;

  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';
  grupoFeedbackMessage = '';
  grupoFeedbackType: 'success' | 'error' | 'info' = 'info';
  ejercicioFeedbackMessage = '';
  ejercicioFeedbackType: 'success' | 'error' | 'info' = 'info';

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

  public loadGruposMusculares(): void {
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
      )
      .pipe(finalize(() => (this.isLoadingGrupos = false)))
      .subscribe({
        next: (grupos) => {
          this.clearEjercicioActionFlags();
          this.gruposMusculares = grupos;
          this.loadingError = false;
          if (grupos.length > 0) {
            if (!this.selectedGrupoId || !grupos.some((grupo) => grupo.id === this.selectedGrupoId)) {
              this.selectedGrupoId = grupos[0].id;
            }
            this.syncEditarGrupoNombre();
            this.loadSelectedGrupoDetalle();
          } else {
            this.selectedGrupoId = null;
            this.editarGrupoNombre = '';
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

  onGrupoChange(grupoId: number | string | null): void {
    const parsedId = typeof grupoId === 'string' ? Number(grupoId) : grupoId;
    this.selectedGrupoId = Number.isInteger(parsedId) ? parsedId : null;
    this.syncEditarGrupoNombre();
    this.cancelEditEjercicio();
    this.loadSelectedGrupoDetalle();
  }

  private syncEditarGrupoNombre(): void {
    if (!this.selectedGrupoId) {
      this.editarGrupoNombre = '';
      return;
    }

    const selectedGroup = this.gruposMusculares.find((grupo) => grupo.id === this.selectedGrupoId);
    this.editarGrupoNombre = selectedGroup?.nombre ?? '';
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

    // If we already have cached data, refresh in background without blocking UI.
    this.isLoadingGrupoDetalle = options?.silent ? false : !hasCachedData;
    this.planEntrenamientoApiService
      .getEjerciciosByGrupoMuscularId(requestedGroupId)
      .pipe(
        timeout(this.requestTimeoutMs),
        catchError((errorEjercicios) => {
          console.warn('Fallo o timeout en ejercicios por grupo. Se usa fallback:', errorEjercicios);

          return this.planEntrenamientoApiService
            .getGrupoMuscularById(requestedGroupId)
            .pipe(
              timeout(this.requestTimeoutMs),
              map((grupo) => grupo.ejercicios ?? []),
            );
        }),
      )
      .pipe(
        finalize(() => {
          if (!hasCachedData && !options?.silent) {
            this.isLoadingGrupoDetalle = false;
          }
        }),
      )
      .subscribe({
        next: (ejercicios) => {
          this.ejerciciosPorGrupoCache.set(requestedGroupId, ejercicios);

          // Ignore stale responses when user changed group before request finished.
          if (this.selectedGrupoId !== requestedGroupId) {
            return;
          }

          this.selectedEjercicios = ejercicios;
          this.hasLoadedGrupoDetalle = true;
          this.isLoadingGrupoDetalle = false;
          this.cancelEditEjercicio();
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

  createGrupoMuscular(): void {
    const nombre = this.nuevoGrupoNombre.trim();
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
      this.nuevoGrupoNombre = '';
      return;
    }

    this.isCreatingGrupo = true;
    this.grupoFeedbackMessage = 'Creando grupo muscular...';
    this.grupoFeedbackType = 'info';

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

    // Once the optimistic group is visible in the list, hide the creating banner.
    this.grupoFeedbackMessage = '';

    if (this.createGrupoUnlockTimeoutId) {
      clearTimeout(this.createGrupoUnlockTimeoutId);
    }

    // Safety unlock to avoid frozen UI if request hangs.
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
          this.nuevoGrupoNombre = '';

          const groupsWithoutOptimistic = this.gruposMusculares.filter((grupo) => grupo.id !== optimisticId);
          const existsRealGroup = groupsWithoutOptimistic.some((grupo) => grupo.id === response.id);

          this.gruposMusculares = existsRealGroup
            ? groupsWithoutOptimistic
            : [...groupsWithoutOptimistic, { id: response.id, nombre: response.nombre }].sort((a, b) =>
                a.nombre.localeCompare(b.nombre),
              );

          this.selectedGrupoId = response.id;
          this.editarGrupoNombre = response.nombre;
          this.selectedEjercicios = [];
          this.hasLoadedGrupoDetalle = true;
          this.ejerciciosPorGrupoCache.delete(optimisticId);
          this.ejerciciosPorGrupoCache.set(response.id, []);

          // Sync with backend in background in case server applied additional normalization.
          this.loadGruposMusculares();
        },
        error: (err) => {
          this.isCreatingGrupo = false;
          this.gruposMusculares = this.gruposMusculares.filter((grupo) => grupo.id !== optimisticId);
          this.ejerciciosPorGrupoCache.delete(optimisticId);

          if (this.selectedGrupoId === optimisticId) {
            this.selectedGrupoId = this.gruposMusculares.length > 0 ? this.gruposMusculares[0].id : null;
            this.loadSelectedGrupoDetalle();
          }

          const message = this.getErrorMessage(err, 'Error al crear el grupo muscular');
          this.grupoFeedbackMessage = message;
          this.grupoFeedbackType = 'error';

          this.nuevoGrupoNombre = '';
          console.error(err);
        },
      });
  }

  updateGrupoMuscular(): void {
    const grupoId = Number(this.selectedGrupoId);
    const nombre = this.editarGrupoNombre.trim();
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
      this.grupoFeedbackMessage = 'El grupo muscular ya existe y no se puede guardar con ese nombre.';
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
      .map((grupo) => (grupo.id === grupoId ? { ...grupo, nombre: normalizedNombre } : grupo))
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
            .map((grupo) => (grupo.id === response.id ? { ...grupo, nombre: response.nombre } : grupo))
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
          this.editarGrupoNombre = response.nombre;
          this.grupoFeedbackMessage = `Grupo muscular "${response.nombre}" actualizado correctamente`;
          this.grupoFeedbackType = 'success';
          this.loadGruposMusculares();
        },
        error: (err) => {
          this.isUpdatingGrupo = false;
          this.gruposMusculares = originalGroups;
          this.syncEditarGrupoNombre();
          this.grupoFeedbackMessage = this.getErrorMessage(err, 'Error al actualizar el grupo muscular');
          this.grupoFeedbackType = 'error';
        },
      });
  }

  startEditEjercicio(ejercicio: CatalogoEjercicio): void {
    this.editingEjercicioId = ejercicio.id;
    this.editingEjercicioNombre = ejercicio.nombre;
    this.ejercicioFeedbackMessage = '';
  }

  cancelEditEjercicio(): void {
    this.editingEjercicioId = null;
    this.editingEjercicioNombre = '';
  }

  saveEditEjercicio(): void {
    const ejercicioId = Number(this.editingEjercicioId);
    const grupoId = Number(this.selectedGrupoId);
    const nombre = this.editingEjercicioNombre.trim();

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

    if (!nombre) {
      this.ejercicioFeedbackMessage = 'El nombre del ejercicio es obligatorio';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    const normalizedNombre = this.normalizeName(nombre);
    const duplicate = this.selectedEjercicios.some(
      (ejercicio) =>
        ejercicio.id !== ejercicioId && this.normalizeName(ejercicio.nombre) === normalizedNombre,
    );

    if (duplicate) {
      this.ejercicioFeedbackMessage = 'El ejercicio ya existe y no se puede guardar con ese nombre.';
      this.ejercicioFeedbackType = 'error';
      return;
    }

    // Cierra de inmediato la vista de edicion para mostrar solo el resultado final.
    this.cancelEditEjercicio();

    const previousList = [...this.selectedEjercicios];
    const updatedList = this.selectedEjercicios
      .map((ejercicio) =>
        ejercicio.id === ejercicioId ? { ...ejercicio, nombre: normalizedNombre } : ejercicio,
      )
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    this.isUpdatingEjercicio = true;
    this.pendingEditEjercicioId = ejercicioId;

    if (this.updateEjercicioUnlockTimeoutId) {
      clearTimeout(this.updateEjercicioUnlockTimeoutId);
    }

    this.updateEjercicioUnlockTimeoutId = setTimeout(() => {
      this.clearEjercicioActionFlags();
      this.ejercicioFeedbackMessage = 'La actualizacion esta tardando demasiado. Refrescando ejercicios...';
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
            .map((ejercicio) =>
              ejercicio.id === response.id ? { ...ejercicio, nombre: response.nombre } : ejercicio,
            )
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
          this.ejercicioFeedbackMessage = this.getErrorMessage(err, 'Error al actualizar el ejercicio');
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
      this.ejercicioFeedbackMessage = 'La eliminacion esta tardando demasiado. Refrescando ejercicios...';
      this.ejercicioFeedbackType = 'info';
      this.loadGruposMusculares();
    }, this.requestTimeoutMs);

    const previousList = [...this.selectedEjercicios];
    const filteredList = previousList.filter((item) => item.id !== ejercicio.id);

    this.selectedEjercicios = filteredList;
    this.ejerciciosPorGrupoCache.set(grupoId, filteredList);
    this.cancelEditEjercicio();

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
          this.ejercicioFeedbackMessage = this.getErrorMessage(err, 'Error al eliminar el ejercicio');
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
          this.ejercicioFeedbackMessage = this.getErrorMessage(err, 'Error al subir la imagen del ejercicio');
          this.ejercicioFeedbackType = 'error';
          console.error(err);
        },
      });
  }

  private applyEjercicioImagenUrl(ejercicioId: number, imagenUrl: string): void {
    this.selectedEjercicios = this.selectedEjercicios.map((ejercicio) =>
      ejercicio.id === ejercicioId ? { ...ejercicio, imagenUrl } : ejercicio,
    );

    if (this.selectedGrupoId) {
      const currentList = this.ejerciciosPorGrupoCache.get(this.selectedGrupoId);
      if (currentList) {
        const updatedList = currentList.map((ejercicio) =>
          ejercicio.id === ejercicioId ? { ...ejercicio, imagenUrl } : ejercicio,
        );
        this.ejerciciosPorGrupoCache.set(this.selectedGrupoId, updatedList);
      }
    }

  }

  createEjercicio(): void {
    const nombre = this.ejercicioNombre.trim();
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
      this.ejercicioNombre = '';
      return;
    }

    // Optimistic update: mostrar inmediatamente en la lista
    const tempId = -Date.now() - Math.random();
    const newEjercicio = { id: tempId, nombre: normalizedNombre };
    const currentGroupId = this.selectedGrupoId;
    const currentList = this.ejerciciosPorGrupoCache.get(currentGroupId) ?? this.selectedEjercicios;
    const updatedList = [...currentList, newEjercicio].sort((a, b) => 
      a.nombre.localeCompare(b.nombre)
    );

    this.ejerciciosPorGrupoCache.set(grupoMuscularId, updatedList);
    this.selectedEjercicios = updatedList;
    this.hasLoadedGrupoDetalle = true;

    // Limpiar campo e input inmediatamente
    this.ejercicioNombre = '';
    this.ejercicioFeedbackMessage = '';

    // Safety unlock to avoid frozen UI if request hangs.
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

          // Reemplazar ID temporal con ID real del servidor
          if (currentGroupId) {
            const currentList = this.ejerciciosPorGrupoCache.get(currentGroupId) ?? this.selectedEjercicios;
            const updatedList = currentList
              .map((ejercicio) => 
                ejercicio.id === tempId 
                  ? { id: response.id, nombre: response.nombre }
                  : ejercicio
              )
              .sort((a, b) => a.nombre.localeCompare(b.nombre));

            this.ejerciciosPorGrupoCache.set(currentGroupId, updatedList);
            this.selectedEjercicios = updatedList;
          }


          // Sync with backend in background
          this.loadGruposMusculares();
        },
        error: (err) => {
          // Revertir optimistic update: remover el ejercicio temporal
          if (currentGroupId) {
            const currentList = this.ejerciciosPorGrupoCache.get(currentGroupId) ?? this.selectedEjercicios;
            const filteredList = currentList.filter((ejercicio) => ejercicio.id !== tempId);
            
            this.ejerciciosPorGrupoCache.set(currentGroupId, filteredList);
            this.selectedEjercicios = filteredList;
          }

          const message = this.getErrorMessage(err, 'Error al crear el ejercicio');
          this.ejercicioFeedbackMessage = message;
          this.ejercicioFeedbackType = 'error';

          console.error(err);
        },
      });
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

    // Handle timeout errors
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

    // Handle generic error message from the error object
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

    // Auto-clear success messages after 3 seconds
    if (type === 'success') {
      this.statusTimeoutId = setTimeout(() => {
        this.statusMessage = '';
        this.statusTimeoutId = null;
      }, 3000);
    }
  }

  trackByGrupoId(index: number, grupo: CatalogoGrupoMuscularResumen): number {
    return grupo.id;
  }
}
