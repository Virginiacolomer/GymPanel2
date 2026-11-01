import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CrearEjercicios } from './crear-ejercicios';
import {
  PlanEntrenamientoApiService,
  CatalogoGrupoMuscularResumen,
} from '../../core/services/plan-entrenamiento-api.service';

describe('CrearEjercicios', () => {
  let component: CrearEjercicios;
  let fixture: ComponentFixture<CrearEjercicios>;
  let apiServiceMock: Partial<PlanEntrenamientoApiService>;

  const mockGrupos = [
    { id: 1, nombre: 'PECHO', ejercicios: [] },
    { id: 2, nombre: 'ESPALDA', ejercicios: [] },
  ];

  beforeEach(async () => {
    apiServiceMock = {
      getCatalogoGruposMuscularesResumen: () => of(mockGrupos),
      getCatalogoGruposMusculares: () => of(mockGrupos),
      getEjerciciosByGrupoMuscularId: () => of([]),
      getGrupoMuscularById: () => of({ id: 1, nombre: 'PECHO', ejercicios: [] }),
      createGrupoMuscular: (req) => of({ id: 99, nombre: req.nombre, message: 'Creado' }),
      updateGrupoMuscular: (id, req) => of({ id, nombre: req.nombre, message: 'Actualizado' }),
      createEjercicio: (req) =>
        of({ id: 88, nombre: req.nombre, grupoMuscularId: req.grupoMuscularId, message: 'Creado' }),
      updateEjercicio: (id, req) =>
        of({ id, nombre: req.nombre ?? '', grupoMuscularId: 1, message: 'Actualizado' }),
      deleteEjercicio: (id) => of({ id, message: 'Eliminado' }),
      uploadEjercicioImagen: (id) =>
        of({ id, imagenUrl: 'https://example.com/img.jpg', message: 'Ok' }),
    };

    await TestBed.configureTestingModule({
      imports: [CrearEjercicios],
      providers: [
        provideRouter([]),
        { provide: PlanEntrenamientoApiService, useValue: apiServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearEjercicios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial grupos musculares', () => {
    expect(component).toBeTruthy();
    expect(component.gruposMusculares.length).toBe(2);
    expect(component.selectedGrupoId).toBe(1);
    expect(component.selectedGrupoNombre).toBe('PECHO');
  });

  it('should update selectedGrupoId on grupo change', () => {
    component.onGrupoChange(2);
    expect(component.selectedGrupoId).toBe(2);
    expect(component.selectedGrupoNombre).toBe('ESPALDA');
  });

  it('should create grupo muscular through service', () => {
    component.createGrupoMuscular('PIERNAS');
    expect(component.grupoFeedbackType).toBe('success');
    expect(component.grupoFeedbackMessage).toContain('PIERNAS');
  });

  it('should prevent creating duplicate grupo muscular', () => {
    component.createGrupoMuscular('PECHO');
    expect(component.grupoFeedbackType).toBe('error');
    expect(component.grupoFeedbackMessage).toContain('ya existe');
  });

  it('should open and close grupo modal', () => {
    expect(component.isGrupoModalOpen).toBe(false);

    component.openCreateGrupoModal();
    expect(component.isGrupoModalOpen).toBe(true);
    expect(component.isEditingGrupoModal).toBe(false);

    component.openEditGrupoModal(mockGrupos[0]);
    expect(component.isGrupoModalOpen).toBe(true);
    expect(component.isEditingGrupoModal).toBe(true);
    expect(component.editingGrupoNombre).toBe('PECHO');

    component.closeGrupoModal();
    expect(component.isGrupoModalOpen).toBe(false);
  });

  it('should open and close ejercicio modal', () => {
    expect(component.isEjercicioModalOpen).toBe(false);

    component.openCreateEjercicioModal();
    expect(component.isEjercicioModalOpen).toBe(true);
    expect(component.isEditingEjercicioModal).toBe(false);

    component.openEditEjercicioModal({ id: 10, nombre: 'Press banca', imagenUrl: null });
    expect(component.isEjercicioModalOpen).toBe(true);
    expect(component.isEditingEjercicioModal).toBe(true);
    expect(component.editingEjercicioNombre).toBe('Press banca');

    component.closeEjercicioModal();
    expect(component.isEjercicioModalOpen).toBe(false);
  });
});
