import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoEjercicio } from '../../../../core/services/plan-entrenamiento-api.service';
import { getGrupoMuscularMeta, GrupoMuscularMeta } from '../../models/grupo-muscular-meta';

export type EjercicioCategoria = 'TODOS' | 'CON_PESO' | 'SIN_PESO' | 'EN_MAQUINA';
export type ViewMode = 'grid' | 'list';
export type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-ejercicios-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ejercicios-list.html',
  styleUrl: './ejercicios-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EjerciciosListComponent {
  // Inputs
  readonly ejercicios = input<CatalogoEjercicio[]>([]);
  readonly selectedGrupoId = input<number | null>(null);
  readonly selectedGrupoNombre = input<string>('');
  readonly isLoadingGrupoDetalle = input<boolean>(false);
  readonly hasLoadedGrupoDetalle = input<boolean>(false);
  readonly isUpdatingEjercicio = input<boolean>(false);
  readonly isDeletingEjercicio = input<boolean>(false);
  readonly pendingEditEjercicioId = input<number | null>(null);
  readonly pendingDeleteEjercicioId = input<number | null>(null);
  readonly isUploadingImagenEjercicioId = input<number | null>(null);
  readonly recentlyUploadedImagenEjercicioId = input<number | null>(null);

  // Outputs
  readonly openCreateEjercicio = output<void>();
  readonly openEditEjercicio = output<CatalogoEjercicio>();
  readonly uploadImage = output<CatalogoEjercicio>();
  readonly deleteEjercicio = output<CatalogoEjercicio>();
  readonly saveEdit = output<{ id: number; nombre: string }>();

  // Filter & Search & View State
  readonly searchQuery = signal<string>('');
  readonly selectedCategory = signal<EjercicioCategoria>('TODOS');
  readonly sortOrder = signal<SortOrder>('asc');
  readonly viewMode = signal<ViewMode>('grid');
  readonly openMenuEjercicioId = signal<number | null>(null);
  readonly favoriteIds = signal<Set<number>>(this.loadFavoritesFromStorage());

  // Modal de preview imagen
  readonly previewImageSrc = signal<string | null>(null);
  readonly previewImageAlt = signal<string>('');

  readonly categories: { id: EjercicioCategoria; label: string }[] = [
    { id: 'TODOS', label: 'Todos' },
    { id: 'CON_PESO', label: 'Con peso' },
    { id: 'SIN_PESO', label: 'Sin peso' },
    { id: 'EN_MAQUINA', label: 'En máquina' },
  ];

  // Metadatos anatómicos del grupo actual
  readonly currentGrupoMeta = computed<GrupoMuscularMeta>(() => {
    return getGrupoMuscularMeta(this.selectedGrupoNombre());
  });

  // Lista filtrada y ordenada
  readonly displayedEjercicios = computed(() => {
    let list = [...this.ejercicios()];
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const sort = this.sortOrder();

    // 1. Filtro de búsqueda
    if (query) {
      list = list.filter((ej) => ej.nombre.toLowerCase().includes(query));
    }

    // 2. Filtro de categoría
    if (cat === 'CON_PESO') {
      list = list.filter((ej) => this.isConPeso(ej.nombre));
    } else if (cat === 'SIN_PESO') {
      list = list.filter((ej) => this.isSinPeso(ej.nombre));
    } else if (cat === 'EN_MAQUINA') {
      list = list.filter((ej) => this.isEnMaquina(ej.nombre));
    }

    // 3. Orden
    list.sort((a, b) => {
      const cmp = a.nombre.localeCompare(b.nombre);
      return sort === 'asc' ? cmp : -cmp;
    });

    return list;
  });

  private isConPeso(nombre: string): boolean {
    const n = nombre.toLowerCase();
    return (
      n.includes('pesa') ||
      n.includes('mancuerna') ||
      n.includes('barra') ||
      n.includes('disco') ||
      n.includes('kettlebell') ||
      n.includes('peso') ||
      n.includes('lastre')
    );
  }

  private isEnMaquina(nombre: string): boolean {
    const n = nombre.toLowerCase();
    return (
      n.includes('polea') ||
      n.includes('maquina') ||
      n.includes('máquina') ||
      n.includes('prensa') ||
      n.includes('smith') ||
      n.includes('banco') ||
      n.includes('cable') ||
      n.includes('dorsalera') ||
      n.includes('camilla')
    );
  }

  private isSinPeso(nombre: string): boolean {
    return !this.isConPeso(nombre) && !this.isEnMaquina(nombre);
  }

  formatNombre(nombre: string): string {
    if (!nombre) return '';
    const lower = nombre.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }

  setCategory(cat: EjercicioCategoria): void {
    this.selectedCategory.set(cat);
  }

  toggleSort(): void {
    this.sortOrder.update((curr) => (curr === 'asc' ? 'desc' : 'asc'));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  onSearchChange(val: string): void {
    this.searchQuery.set(val);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  toggleMenu(ejercicioId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuEjercicioId.update((curr) => (curr === ejercicioId ? null : ejercicioId));
  }

  closeMenu(): void {
    this.openMenuEjercicioId.set(null);
  }

  toggleFavorite(ejercicioId: number, event: MouseEvent): void {
    event.stopPropagation();
    const updated = new Set(this.favoriteIds());
    if (updated.has(ejercicioId)) {
      updated.delete(ejercicioId);
    } else {
      updated.add(ejercicioId);
    }
    this.favoriteIds.set(updated);
    this.saveFavoritesToStorage(updated);
  }

  isFavorite(ejercicioId: number): boolean {
    return this.favoriteIds().has(ejercicioId);
  }

  openPreview(src: string, alt: string, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.previewImageSrc.set(src);
    this.previewImageAlt.set(alt);
  }

  closePreview(): void {
    this.previewImageSrc.set(null);
  }

  onEditAction(ejercicio: CatalogoEjercicio): void {
    this.closeMenu();
    this.openEditEjercicio.emit(ejercicio);
  }

  onUploadAction(ejercicio: CatalogoEjercicio): void {
    this.closeMenu();
    this.uploadImage.emit(ejercicio);
  }

  onDeleteAction(ejercicio: CatalogoEjercicio): void {
    this.closeMenu();
    this.deleteEjercicio.emit(ejercicio);
  }

  private loadFavoritesFromStorage(): Set<number> {
    try {
      const data = localStorage.getItem('gympanel_fav_ejercicios');
      if (data) {
        const arr = JSON.parse(data);
        if (Array.isArray(arr)) {
          return new Set<number>(arr);
        }
      }
    } catch {
      // Ignorar error de acceso a localStorage
    }
    return new Set<number>();
  }

  private saveFavoritesToStorage(favs: Set<number>): void {
    try {
      localStorage.setItem('gympanel_fav_ejercicios', JSON.stringify(Array.from(favs)));
    } catch {
      // Ignorar error de acceso a localStorage
    }
  }

  trackByEjercicioId(_index: number, ejercicio: CatalogoEjercicio): number {
    return ejercicio.id;
  }
}
