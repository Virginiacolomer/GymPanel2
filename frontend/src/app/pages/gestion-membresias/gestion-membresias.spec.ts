import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionMembresias } from './gestion-membresias';

describe('GestionMembresias', () => {
  let component: GestionMembresias;
  let fixture: ComponentFixture<GestionMembresias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionMembresias],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionMembresias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
