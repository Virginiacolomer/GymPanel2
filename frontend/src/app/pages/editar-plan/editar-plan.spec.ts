import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPlan } from './editar-plan';

describe('EditarPlan', () => {
  let component: EditarPlan;
  let fixture: ComponentFixture<EditarPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPlan],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarPlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
