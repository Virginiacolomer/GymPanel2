import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialDePagos } from './historial-de-pagos';

describe('HistorialDePagos', () => {
  let component: HistorialDePagos;
  let fixture: ComponentFixture<HistorialDePagos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialDePagos],
    }).compileComponents();

    fixture = TestBed.createComponent(HistorialDePagos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
