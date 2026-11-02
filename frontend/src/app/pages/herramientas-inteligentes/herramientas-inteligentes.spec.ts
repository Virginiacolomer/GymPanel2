import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HerramientasInteligentes } from './herramientas-inteligentes';

describe('HerramientasInteligentes', () => {
  let component: HerramientasInteligentes;
  let fixture: ComponentFixture<HerramientasInteligentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HerramientasInteligentes],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HerramientasInteligentes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate 1RM correctly using Epley formula with 2.5 kg rounding', () => {
    // 80 kg a 6 reps: 1RM = 80 * (1 + 6/30) = 80 * 1.2 = 96 kg -> redondeo a 2.5: 95 kg
    component.peso1RM.set(80);
    component.reps1RM.set(6);
    expect(component.calculated1RM()).toBe(95);
  });

  it('should return 1RM equal to weight if reps is 1', () => {
    component.peso1RM.set(100);
    component.reps1RM.set(1);
    expect(component.calculated1RM()).toBe(100);
  });
});

