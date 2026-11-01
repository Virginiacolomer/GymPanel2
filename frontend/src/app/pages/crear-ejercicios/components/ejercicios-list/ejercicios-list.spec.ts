import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { EjerciciosListComponent } from './ejercicios-list';
import { CatalogoEjercicio } from '../../../../core/services/plan-entrenamiento-api.service';

describe('EjerciciosListComponent', () => {
  let component: EjerciciosListComponent;
  let componentRef: ComponentRef<EjerciciosListComponent>;
  let fixture: ComponentFixture<EjerciciosListComponent>;

  const mockEjercicios: CatalogoEjercicio[] = [
    { id: 1, nombre: 'Press de Banca con Barra', imagenUrl: 'https://example.com/press.jpg' },
    { id: 2, nombre: 'Aperturas en Polea', imagenUrl: null },
    { id: 3, nombre: 'Flexiones en Suelo', imagenUrl: null },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjerciciosListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EjerciciosListComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('ejercicios', mockEjercicios);
    componentRef.setInput('selectedGrupoId', 10);
    componentRef.setInput('selectedGrupoNombre', 'PECHO');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should filter ejercicios by search query', () => {
    expect(component.displayedEjercicios().length).toBe(3);

    component.onSearchChange('barra');
    expect(component.displayedEjercicios().length).toBe(1);
    expect(component.displayedEjercicios()[0].id).toBe(1);

    component.clearSearch();
    expect(component.displayedEjercicios().length).toBe(3);
  });

  it('should filter by category correctly', () => {
    component.setCategory('CON_PESO');
    expect(component.displayedEjercicios().some((e) => e.nombre.includes('Barra'))).toBe(true);

    component.setCategory('EN_MAQUINA');
    expect(component.displayedEjercicios().some((e) => e.nombre.includes('Polea'))).toBe(true);

    component.setCategory('SIN_PESO');
    expect(component.displayedEjercicios().some((e) => e.nombre.includes('Suelo'))).toBe(true);

    component.setCategory('TODOS');
    expect(component.displayedEjercicios().length).toBe(3);
  });

  it('should sort ascending and descending', () => {
    expect(component.sortOrder()).toBe('asc');
    component.toggleSort();
    expect(component.sortOrder()).toBe('desc');
  });

  it('should toggle view mode', () => {
    expect(component.viewMode()).toBe('grid');
    component.setViewMode('list');
    expect(component.viewMode()).toBe('list');
  });

  it('should toggle favorite status', () => {
    const mockEvent = new MouseEvent('click');
    expect(component.isFavorite(1)).toBe(false);

    component.toggleFavorite(1, mockEvent);
    expect(component.isFavorite(1)).toBe(true);

    component.toggleFavorite(1, mockEvent);
    expect(component.isFavorite(1)).toBe(false);
  });

  it('should emit openCreateEjercicio, openEditEjercicio, uploadImage and deleteEjercicio', () => {
    let createTriggered = false;
    let editTarget: CatalogoEjercicio | undefined;
    let uploadTarget: CatalogoEjercicio | undefined;
    let deleteTarget: CatalogoEjercicio | undefined;

    component.openCreateEjercicio.subscribe(() => (createTriggered = true));
    component.openEditEjercicio.subscribe((ej) => (editTarget = ej));
    component.uploadImage.subscribe((ej) => (uploadTarget = ej));
    component.deleteEjercicio.subscribe((ej) => (deleteTarget = ej));

    component.openCreateEjercicio.emit();
    component.onEditAction(mockEjercicios[0]);
    component.onUploadAction(mockEjercicios[1]);
    component.onDeleteAction(mockEjercicios[2]);

    expect(createTriggered).toBe(true);
    expect(editTarget).toBe(mockEjercicios[0]);
    expect(uploadTarget).toBe(mockEjercicios[1]);
    expect(deleteTarget).toBe(mockEjercicios[2]);
  });
});
