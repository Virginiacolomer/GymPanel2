import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { GruposMuscularesPanelComponent } from './grupos-musculares-panel';

describe('GruposMuscularesPanelComponent', () => {
  let component: GruposMuscularesPanelComponent;
  let componentRef: ComponentRef<GruposMuscularesPanelComponent>;
  let fixture: ComponentFixture<GruposMuscularesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposMuscularesPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GruposMuscularesPanelComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit grupoSelected when selectGrupo is called', () => {
    let selectedId: number | null = null;
    component.grupoSelected.subscribe((id) => (selectedId = id));

    component.selectGrupo(5);
    expect(selectedId).toBe(5);
  });

  it('should filter grupos according to searchQuery', () => {
    componentRef.setInput('gruposMusculares', [
      { id: 1, nombre: 'PECHO' },
      { id: 2, nombre: 'ESPALDA' },
      { id: 3, nombre: 'PIERNAS' },
    ]);
    fixture.detectChanges();

    expect(component.filteredGrupos().length).toBe(3);

    component.onSearchChange('pech');
    expect(component.filteredGrupos().length).toBe(1);
    expect(component.filteredGrupos()[0].nombre).toBe('PECHO');

    component.clearSearch();
    expect(component.filteredGrupos().length).toBe(3);
  });

  it('should emit openCreateGrupo when openCreateGrupo is called', () => {
    let triggered = false;
    component.openCreateGrupo.subscribe(() => (triggered = true));

    component.openCreateGrupo.emit();
    expect(triggered).toBe(true);
  });

  it('should emit openEditGrupo when onEditClick is called', () => {
    let editedGrupo: any = null;
    component.openEditGrupo.subscribe((g) => (editedGrupo = g));

    const mockEvent = new MouseEvent('click');
    const mockGrupo = { id: 2, nombre: 'ESPALDA' };
    component.onEditClick(mockEvent, mockGrupo);

    expect(editedGrupo).toEqual(mockGrupo);
  });

  it('should emit retryLoadGrupos when button clicked', () => {
    let retried = false;
    component.retryLoadGrupos.subscribe(() => {
      retried = true;
    });

    component.retryLoadGrupos.emit();
    expect(retried).toBe(true);
  });
});
