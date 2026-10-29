import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MenuAdmin } from './menu-admin';

describe('MenuAdmin', () => {
  let component: MenuAdmin;
  let fixture: ComponentFixture<MenuAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuAdmin],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
