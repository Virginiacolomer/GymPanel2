import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { GimnasioAdminItem, PlanGimnasio, SuperAdminApiService } from '../../core/services/superadmin-api.service';

@Component({
  standalone: true,
  imports: [FormsModule, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './superadmin-panel.html',
  styleUrl: './superadmin-panel.css',
})
export class SuperadminPanel implements OnInit {
  private readonly superAdminApiService = inject(SuperAdminApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  gimnasios: GimnasioAdminItem[] = [];
  isLoading = false;
  statusMessage = '';
  savingId: number | null = null;

  readonly planes: { value: PlanGimnasio; label: string }[] = [
    { value: 'BASICO', label: 'Basico' },
    { value: 'PRO', label: 'Pro' },
    { value: 'FULL', label: 'Full' },
  ];

  ngOnInit(): void {
    this.loadGimnasios();
  }

  changePlan(gimnasio: GimnasioAdminItem, plan: PlanGimnasio): void {
    if (plan === gimnasio.plan) {
      return;
    }

    this.savingId = gimnasio.id;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.superAdminApiService
      .updatePlan(gimnasio.id, plan)
      .pipe(
        finalize(() => {
          this.savingId = null;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: (updated) => {
          gimnasio.plan = updated.plan;
          this.statusMessage = `Plan de "${gimnasio.nombre}" actualizado a ${updated.plan}.`;
          this.cdr.detectChanges();
        },
        error: () => {
          this.statusMessage = `No se pudo actualizar el plan de "${gimnasio.nombre}".`;
          this.cdr.detectChanges();
        },
      });
  }

  private loadGimnasios(): void {
    this.isLoading = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.superAdminApiService
      .getGimnasios()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (gimnasios) => {
          this.gimnasios = gimnasios;
          if (this.gimnasios.length === 0) {
            this.statusMessage = 'No hay gimnasios cargados.';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.statusMessage = 'No se pudieron cargar los gimnasios.';
          this.gimnasios = [];
          this.cdr.detectChanges();
        },
      });
  }
}
