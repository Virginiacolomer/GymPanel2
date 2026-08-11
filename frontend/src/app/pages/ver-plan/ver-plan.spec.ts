import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanPersona } from './plan-persona';

describe('PlanPersona', () => {
  let component: PlanPersona;
  let fixture: ComponentFixture<PlanPersona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanPersona],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanPersona);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
