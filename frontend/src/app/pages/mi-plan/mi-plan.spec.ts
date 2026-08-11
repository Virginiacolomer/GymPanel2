import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiPlan } from './mi-plan';

describe('MiPlan', () => {
  let component: MiPlan;
  let fixture: ComponentFixture<MiPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiPlan],
    }).compileComponents();

    fixture = TestBed.createComponent(MiPlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
