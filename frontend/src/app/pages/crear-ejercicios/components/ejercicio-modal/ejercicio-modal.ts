import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-ejercicio-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ejercicio-modal.html',
  styleUrl: './ejercicio-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EjercicioModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly isEditing = input<boolean>(false);
  readonly initialNombre = input<string>('');
  readonly selectedGrupoNombre = input<string>('');
  readonly isSubmitting = input<boolean>(false);
  readonly feedbackMessage = input<string>('');
  readonly feedbackType = input<'success' | 'error' | 'info'>('info');

  readonly save = output<string>();
  readonly close = output<void>();

  readonly form = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.form.setValue({ nombre: this.initialNombre() }, { emitEvent: false });
      }
    });

    effect(() => {
      if (this.isSubmitting()) {
        this.form.controls.nombre.disable({ emitEvent: false });
      } else {
        this.form.controls.nombre.enable({ emitEvent: false });
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }
    const nombre = this.form.getRawValue().nombre.trim();
    if (nombre) {
      this.save.emit(nombre);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
