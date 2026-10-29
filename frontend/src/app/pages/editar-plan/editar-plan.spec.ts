import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { EditarPlan } from './editar-plan';

describe('EditarPlan', () => {
  let component: EditarPlan;
  let fixture: ComponentFixture<EditarPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPlan],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarPlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
