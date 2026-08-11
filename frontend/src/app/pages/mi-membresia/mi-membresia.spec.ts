import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiMembresia } from './mi-membresia';

describe('MiMembresia', () => {
  let component: MiMembresia;
  let fixture: ComponentFixture<MiMembresia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiMembresia],
    }).compileComponents();

    fixture = TestBed.createComponent(MiMembresia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});