import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogoEjercicio } from '../../../../core/services/plan-entrenamiento-api.service';
import { getGrupoMuscularMeta, GrupoMuscularMeta } from '../../models/grupo-muscular-meta';

export interface EquipamientoInfo {
  nombre: string;
  tipo: string;
  icono: string;
}

export function detectarEquipamiento(nombreEjercicio: string): EquipamientoInfo | null {
  const n = (nombreEjercicio || '').toLowerCase();
  if (n.includes('mancuerna')) {
    return { nombre: 'Mancuernas', tipo: 'Peso libre', icono: 'fi fi-rs-gym' };
  }
  if (n.includes('barra')) {
    return { nombre: 'Barra olímpica / estándar', tipo: 'Peso libre', icono: 'fi fi-rs-gym' };
  }
  if (n.includes('kettlebell')) {
    return { nombre: 'Kettlebell / Pesa rusa', tipo: 'Peso libre', icono: 'fi fi-rs-gym' };
  }
  if (n.includes('disco')) {
    return { nombre: 'Disco de peso', tipo: 'Peso libre', icono: 'fi fi-rs-gym' };
  }
  if (n.includes('polea') || n.includes('cable')) {
    return { nombre: 'Polea / Cable ajustable', tipo: 'Máquina / Cable', icono: 'fi fi-rr-settings' };
  }
  if (
    n.includes('prensa') ||
    n.includes('smith') ||
    n.includes('camilla') ||
    n.includes('dorsalera') ||
    n.includes('maquina') ||
    n.includes('máquina')
  ) {
    return { nombre: 'Máquina guiada', tipo: 'Máquina de gimnasio', icono: 'fi fi-rr-settings' };
  }
  if (n.includes('banco')) {
    return { nombre: 'Banco de entrenamiento', tipo: 'Soporte', icono: 'fi fi-rr-layer-group' };
  }
  if (
    n.includes('colchoneta') ||
    n.includes('suelo') ||
    n.includes('flexiones') ||
    n.includes('dominadas') ||
    n.includes('fondos') ||
    n.includes('plancha')
  ) {
    return { nombre: 'Peso corporal', tipo: 'Calistenia / Autocarga', icono: 'fi fi-rr-user' };
  }
  return null;
}

@Component({
  selector: 'app-ejercicio-detalle-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ejercicio-detalle-modal.html',
  styleUrl: './ejercicio-detalle-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EjercicioDetalleModalComponent {
  // Inputs
  readonly isOpen = input<boolean>(false);
  readonly ejercicio = input<CatalogoEjercicio | null>(null);
  readonly grupoNombre = input<string>('');

  // Outputs
  readonly close = output<void>();
  readonly edit = output<CatalogoEjercicio>();

  // Metadatos derivados
  readonly grupoMeta = computed<GrupoMuscularMeta>(() => {
    return getGrupoMuscularMeta(this.grupoNombre());
  });

  readonly equipamiento = computed<EquipamientoInfo | null>(() => {
    const ej = this.ejercicio();
    if (!ej) return null;
    if (ej.equipamiento) {
      const detected = detectarEquipamiento(ej.equipamiento) || detectarEquipamiento(ej.nombre);
      return {
        nombre: ej.equipamiento,
        tipo: detected?.tipo || 'Equipamiento',
        icono: detected?.icono || 'fi fi-rs-gym',
      };
    }
    return detectarEquipamiento(ej.nombre);
  });

  readonly formattedGrupoNombre = computed<string>(() => {
    const g = this.grupoNombre();
    if (!g) return '';
    const lower = g.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onEditClick(): void {
    const ej = this.ejercicio();
    if (ej) {
      this.edit.emit(ej);
    }
  }
}
