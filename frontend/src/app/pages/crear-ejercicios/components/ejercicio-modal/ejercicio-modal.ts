import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CatalogoEjercicio,
  CatalogoGrupoMuscularResumen,
} from '../../../../core/services/plan-entrenamiento-api.service';

export interface SaveEjercicioEvent {
  id?: number;
  nombre: string;
  grupoMuscularId: number;
  imagenFile: File | null;
  removeImage?: boolean;
  descripcion: string;
  equipamiento: string;
  tecnica: string;
}

export const EQUIPAMIENTO_OPCIONES = [
  'Detectar automáticamente según el nombre',
  'Peso corporal (Calistenia / Autocarga)',
  'Mancuernas (Peso libre)',
  'Barra olímpica / estándar',
  'Máquina guiada',
  'Polea / Cable ajustable',
  'Kettlebell / Pesa rusa',
  'Disco de peso',
  'Banco de entrenamiento',
  'Otro / Libre',
] as const;

const MAX_IMAGEN_SIZE_BYTES = 5 * 1024 * 1024;

@Component({
  selector: 'app-ejercicio-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ejercicio-modal.html',
  styleUrl: './ejercicio-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EjercicioModalComponent {
  @ViewChild('fileInputRef') fileInputRef?: ElementRef<HTMLInputElement>;

  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly isEditing = input<boolean>(false);
  readonly initialNombre = input<string>('');
  readonly initialData = input<Partial<CatalogoEjercicio> | null>(null);
  readonly selectedGrupoNombre = input<string>('');
  readonly selectedGrupoId = input<number | null>(null);
  readonly gruposMusculares = input<CatalogoGrupoMuscularResumen[]>([]);
  readonly isSubmitting = input<boolean>(false);
  readonly feedbackMessage = input<string>('');
  readonly feedbackType = input<'success' | 'error' | 'info'>('info');

  // Outputs
  readonly save = output<SaveEjercicioEvent>();
  readonly close = output<void>();

  // State local
  readonly selectedImageFile = signal<File | null>(null);
  readonly isImageRemoved = signal<boolean>(false);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly fileError = signal<string>('');

  readonly equipamientoOpciones = EQUIPAMIENTO_OPCIONES;

  readonly form = new FormGroup({
    nombre: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
    }),
    grupoMuscularId: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    equipamiento: new FormControl<string>(''),
    descripcion: new FormControl<string>(''),
    tecnica: new FormControl<string>(''),
  });

  readonly activeGrupoNombre = computed<string>(() => {
    const gid = this.form.controls.grupoMuscularId.value;
    if (gid) {
      const match = this.gruposMusculares().find((g) => g.id === gid);
      if (match) return match.nombre;
    }
    return this.selectedGrupoNombre();
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const data = this.initialData();
        const fallbackNombre = this.initialNombre();
        const fallbackGrupoId = this.selectedGrupoId();

        const nombreVal = data?.nombre ?? fallbackNombre ?? '';
        const grupoIdVal = data?.grupoMuscularId ?? fallbackGrupoId ?? null;
        const equipVal = data?.equipamiento ?? '';
        const descVal = data?.descripcion ?? '';
        const tecVal = data?.tecnica ?? '';

        this.form.reset({
          nombre: nombreVal,
          grupoMuscularId: grupoIdVal,
          equipamiento: equipVal,
          descripcion: descVal,
          tecnica: tecVal,
        });

        this.selectedImageFile.set(null);
        this.fileError.set('');
        this.imagePreviewUrl.set(data?.imagenUrl ?? null);
      }
    });

    effect(() => {
      if (this.isSubmitting()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0] ?? null;
    this.fileError.set('');

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.fileError.set('El archivo seleccionado debe ser una imagen válida (JPG, PNG, WebP).');
      return;
    }

    if (file.size > MAX_IMAGEN_SIZE_BYTES) {
      this.fileError.set('La imagen supera el límite permitido de 5 MB.');
      return;
    }

    this.selectedImageFile.set(file);
    this.isImageRemoved.set(false);

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile(): void {
    this.selectedImageFile.set(null);
    this.fileError.set('');
    this.imagePreviewUrl.set(null);
    this.isImageRemoved.set(true);
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  triggerFileInput(): void {
    this.fileInputRef?.nativeElement.click();
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const nombre = raw.nombre.trim();
    const grupoId = Number(raw.grupoMuscularId);

    if (!nombre || !grupoId) {
      return;
    }

    // Normalizar equipamiento si eligió 'Detectar automáticamente'
    let equip = (raw.equipamiento || '').trim();
    if (equip.toLowerCase().startsWith('detectar')) {
      equip = '';
    }

    this.save.emit({
      id: this.initialData()?.id,
      nombre,
      grupoMuscularId: grupoId,
      imagenFile: this.selectedImageFile(),
      removeImage: this.isImageRemoved(),
      descripcion: (raw.descripcion || '').trim(),
      equipamiento: equip,
      tecnica: (raw.tecnica || '').trim(),
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}
