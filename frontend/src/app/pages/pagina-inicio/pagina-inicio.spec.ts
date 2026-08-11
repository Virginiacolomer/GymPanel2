import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaInicio } from './pagina-inicio';

describe('PaginaInicio', () => {
  let component: PaginaInicio;
  let fixture: ComponentFixture<PaginaInicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaInicio],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaInicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
