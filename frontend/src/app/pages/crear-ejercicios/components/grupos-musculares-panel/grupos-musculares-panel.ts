import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CatalogoGrupoMuscularResumen } from '../../../../core/services/plan-entrenamiento-api.service';

@Component({
  selector: 'app-grupos-musculares-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './grupos-musculares-panel.html',
  styleUrl: './grupos-musculares-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GruposMuscularesPanelComponent {
  // Inputs
  readonly gruposMusculares = input<CatalogoGrupoMuscularResumen[]>([]);
  readonly selectedGrupoId = input<number | null>(null);
  readonly selectedGrupoNombre = input<string>('');
  readonly isLoadingGrupos = input<boolean>(false);
  readonly isUpdatingGrupo = input<boolean>(false);
  readonly isCreatingGrupo = input<boolean>(false);
  readonly loadingError = input<boolean>(false);
  readonly feedbackMessage = input<string>('');
  readonly feedbackType = input<'success' | 'error' | 'info'>('info');

  // Outputs
  readonly grupoSelected = output<number | null>();
  readonly createGrupo = output<string>();
  readonly updateGrupo = output<string>();
  readonly retryLoadGrupos = output<void>();

  // Reactive Forms
  readonly createGrupoForm = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  readonly editGrupoForm = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  constructor() {
    // Sincroniza el formulario de edición cuando cambia el grupo seleccionado
    effect(() => {
      const nombre = this.selectedGrupoNombre();
      this.editGrupoForm.setValue({ nombre }, { emitEvent: false });
    });

    // Controla estado enabled/disabled según el estado de carga
    effect(() => {
      if (this.isUpdatingGrupo()) {
        this.editGrupoForm.controls.nombre.disable({ emitEvent: false });
      } else {
        this.editGrupoForm.controls.nombre.enable({ emitEvent: false });
      }
    });

    effect(() => {
      if (this.isCreatingGrupo()) {
        this.createGrupoForm.controls.nombre.disable({ emitEvent: false });
      } else {
        this.createGrupoForm.controls.nombre.enable({ emitEvent: false });
      }
    });
  }

  onSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    const parsedId = value ? Number(value) : null;
    this.grupoSelected.emit(Number.isInteger(parsedId) ? parsedId : null);
  }

  submitCreate(): void {
    if (this.createGrupoForm.invalid || this.isCreatingGrupo()) {
      return;
    }
    const nombre = this.createGrupoForm.getRawValue().nombre.trim();
    if (nombre) {
      this.createGrupo.emit(nombre);
      this.createGrupoForm.reset({ nombre: '' });
    }
  }

  submitUpdate(): void {
    if (this.editGrupoForm.invalid || this.isUpdatingGrupo()) {
      return;
    }
    const nombre = this.editGrupoForm.getRawValue().nombre.trim();
    if (nombre) {
      this.updateGrupo.emit(nombre);
    }
  }

  trackByGrupoId(_index: number, grupo: CatalogoGrupoMuscularResumen): number {
    return grupo.id;
  }
}
