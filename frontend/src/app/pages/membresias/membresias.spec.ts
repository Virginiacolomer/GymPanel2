import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Membresias } from './membresias';

describe('Membresias', () => {
  let component: Membresias;
  let fixture: ComponentFixture<Membresias>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Membresias],
    }).compileComponents();

    fixture = TestBed.createComponent(Membresias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
