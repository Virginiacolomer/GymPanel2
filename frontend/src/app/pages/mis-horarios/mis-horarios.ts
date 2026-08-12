import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { Horario, HorarioApiService } from '../../core/services/horario-api.service';

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './mis-horarios.html',
  styleUrl: './mis-horarios.css',
})
export class MisHorarios implements OnInit {
  private readonly horarioApiService = inject(HorarioApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  horarios: Horario[] = [];
  isLoading = true;
  hasError = false;

  ngOnInit(): void {
    this.horarioApiService.findMine().subscribe({
      next: (horarios) => {
        this.horarios = horarios;
        this.isLoading = false;
        this.hasError = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.horarios = [];
        this.isLoading = false;
        this.hasError = true;
        this.cdr.markForCheck();
      },
    });
  }
}
