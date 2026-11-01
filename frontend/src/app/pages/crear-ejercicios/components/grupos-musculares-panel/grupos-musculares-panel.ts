import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoGrupoMuscularResumen } from '../../../../core/services/plan-entrenamiento-api.service';
import { getGrupoMuscularMeta, GrupoMuscularMeta } from '../../models/grupo-muscular-meta';

@Component({
  selector: 'app-grupos-musculares-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  readonly openCreateGrupo = output<void>();
  readonly openEditGrupo = output<CatalogoGrupoMuscularResumen>();
  readonly retryLoadGrupos = output<void>();

  // Legacy outputs for test/caller compatibility
  readonly createGrupo = output<string>();
  readonly updateGrupo = output<string>();

  // State
  readonly searchQuery = signal<string>('');

  // Filtered list
  readonly filteredGrupos = computed(() => {
    const list = this.gruposMusculares();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return list;
    }
    return list.filter((g) => g.nombre.toLowerCase().includes(query));
  });

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  selectGrupo(id: number): void {
    this.grupoSelected.emit(id);
  }

  getMeta(nombre: string): GrupoMuscularMeta {
    return getGrupoMuscularMeta(nombre);
  }

  formatNombre(nombre: string): string {
    if (!nombre) return '';
    const lower = nombre.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  onEditClick(event: MouseEvent, grupo: CatalogoGrupoMuscularResumen): void {
    event.stopPropagation();
    this.openEditGrupo.emit(grupo);
  }

  trackByGrupoId(_index: number, grupo: CatalogoGrupoMuscularResumen): number {
    return grupo.id;
  }
}
