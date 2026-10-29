import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MenuCliente } from './menu-cliente';

describe('MenuCliente', () => {
  let component: MenuCliente;
  let fixture: ComponentFixture<MenuCliente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuCliente],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuCliente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
