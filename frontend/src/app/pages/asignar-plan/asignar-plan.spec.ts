import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsignarPlan } from './asignar-plan';

describe('AsignarPlan', () => {
  let component: AsignarPlan;
  let fixture: ComponentFixture<AsignarPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsignarPlan],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignarPlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
