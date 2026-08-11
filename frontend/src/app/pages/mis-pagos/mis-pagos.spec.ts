import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisPagos } from './mis-pagos';

describe('MisPagos', () => {
  let component: MisPagos;
  let fixture: ComponentFixture<MisPagos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisPagos],
    }).compileComponents();

    fixture = TestBed.createComponent(MisPagos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
