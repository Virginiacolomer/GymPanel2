import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import {
  EjercicioDetalleModalComponent,
  detectarEquipamiento,
} from './ejercicio-detalle-modal';
import { CatalogoEjercicio } from '../../../../core/services/plan-entrenamiento-api.service';

describe('EjercicioDetalleModalComponent', () => {
  let component: EjercicioDetalleModalComponent;
  let componentRef: ComponentRef<EjercicioDetalleModalComponent>;
  let fixture: ComponentFixture<EjercicioDetalleModalComponent>;

  const mockEjercicio: CatalogoEjercicio = {
    id: 15,
    nombre: 'Press de Banca con Mancuernas',
    imagenUrl: 'https://example.com/press-mancuernas.jpg',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EjercicioDetalleModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EjercicioDetalleModalComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;

    componentRef.setInput('isOpen', true);
    componentRef.setInput('ejercicio', mockEjercicio);
    componentRef.setInput('grupoNombre', 'PECHO');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect equipamiento correctly based on name', () => {
    expect(detectarEquipamiento('Press con Mancuerna')?.nombre).toBe('Mancuernas');
    expect(detectarEquipamiento('Sentadilla con Barra')?.nombre).toContain('Barra');
    expect(detectarEquipamiento('Jalon en Polea')?.nombre).toContain('Polea');
    expect(detectarEquipamiento('Flexiones en suelo')?.nombre).toBe('Peso corporal');
    expect(detectarEquipamiento('Movimiento desconocido')).toBeNull();
  });

  it('should format grupoNombre with capitalized initial', () => {
    expect(component.formattedGrupoNombre()).toBe('Pecho');
  });

  it('should emit close on backdrop click and on close button', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    const dummyTarget = document.createElement('div');
    const mockBackdropEvent = {
      target: dummyTarget,
      currentTarget: dummyTarget,
    } as unknown as MouseEvent;

    component.onBackdropClick(mockBackdropEvent);
    expect(closed).toBe(true);
  });

  it('should emit edit on edit click', () => {
    let editedEjercicio: CatalogoEjercicio | undefined;
    component.edit.subscribe((ej) => (editedEjercicio = ej));

    component.onEditClick();
    expect(editedEjercicio).toEqual(mockEjercicio);
  });
});
