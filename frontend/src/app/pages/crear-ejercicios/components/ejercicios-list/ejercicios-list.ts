import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ZoomableImageComponent } from '../../../../shared/zoomable-image/zoomable-image';
import { CatalogoEjercicio } from '../../../../core/services/plan-entrenamiento-api.service';

@Component({
  selector: 'app-ejercicios-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZoomableImageComponent],
  templateUrl: './ejercicios-list.html',
  styleUrl: './ejercicios-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EjerciciosListComponent {
  // Inputs
  readonly ejercicios = input<CatalogoEjercicio[]>([]);
  readonly selectedGrupoId = input<number | null>(null);
  readonly isLoadingGrupoDetalle = input<boolean>(false);
  readonly hasLoadedGrupoDetalle = input<boolean>(false);
  readonly isUpdatingEjercicio = input<boolean>(false);
  readonly isDeletingEjercicio = input<boolean>(false);
  readonly pendingEditEjercicioId = input<number | null>(null);
  readonly pendingDeleteEjercicioId = input<number | null>(null);
  readonly isUploadingImagenEjercicioId = input<number | null>(null);
  readonly recentlyUploadedImagenEjercicioId = input<number | null>(null);

  // Outputs
  readonly uploadImage = output<CatalogoEjercicio>();
  readonly saveEdit = output<{ id: number; nombre: string }>();
  readonly deleteEjercicio = output<CatalogoEjercicio>();

  editingEjercicioId: number | null = null;

  readonly editEjercicioForm = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  constructor() {
    effect(() => {
      if (this.isUpdatingEjercicio()) {
        this.editEjercicioForm.controls.nombre.disable({ emitEvent: false });
      } else {
        this.editEjercicioForm.controls.nombre.enable({ emitEvent: false });
      }
    });
  }

  startEdit(ejercicio: CatalogoEjercicio): void {
    this.editingEjercicioId = ejercicio.id;
    this.editEjercicioForm.setValue({ nombre: ejercicio.nombre });
  }

  cancelEdit(): void {
    this.editingEjercicioId = null;
    this.editEjercicioForm.reset({ nombre: '' });
  }

  submitEdit(id: number): void {
    if (this.editEjercicioForm.invalid || this.isUpdatingEjercicio()) {
      return;
    }
    const nombre = this.editEjercicioForm.getRawValue().nombre.trim();
    if (nombre) {
      this.saveEdit.emit({ id, nombre });
      this.cancelEdit();
    }
  }

  trackByEjercicioId(_index: number, ejercicio: CatalogoEjercicio): number {
    return ejercicio.id;
  }
}
