import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { VerPlan } from './ver-plan';

describe('VerPlan', () => {
  let component: VerPlan;
  let fixture: ComponentFixture<VerPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerPlan],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(VerPlan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
