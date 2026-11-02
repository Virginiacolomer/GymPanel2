import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-ejercicio-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ejercicio-form.html',
  styleUrl: './ejercicio-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EjercicioFormComponent {
  readonly selectedGrupoId = input<number | null>(null);
  readonly selectedGrupoNombre = input<string>('');
  readonly isCreatingEjercicio = input<boolean>(false);
  readonly feedbackMessage = input<string>('');
  readonly feedbackType = input<'success' | 'error' | 'info'>('info');

  readonly create = output<string>();

  readonly form = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  constructor() {
    effect(() => {
      if (this.isCreatingEjercicio()) {
        this.form.controls.nombre.disable({ emitEvent: false });
      } else {
        this.form.controls.nombre.enable({ emitEvent: false });
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isCreatingEjercicio()) {
      return;
    }
    const nombre = this.form.getRawValue().nombre.trim();
    if (nombre) {
      this.create.emit(nombre);
      this.form.reset({ nombre: '' });
    }
  }
}
