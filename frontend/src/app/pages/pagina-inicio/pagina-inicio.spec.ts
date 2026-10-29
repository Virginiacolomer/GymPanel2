import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PaginaInicio } from './pagina-inicio';

describe('PaginaInicio', () => {
  let component: PaginaInicio;
  let fixture: ComponentFixture<PaginaInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaInicio],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
