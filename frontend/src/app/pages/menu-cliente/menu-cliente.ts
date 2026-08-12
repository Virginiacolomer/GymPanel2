import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { GimnasioApiService, GimnasioContacto } from '../../core/services/gimnasio-api.service';

@Component({

  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './menu-cliente.html',
  styleUrl: './menu-cliente.css',
})
export class MenuCliente implements OnInit {
  private readonly gimnasioApiService = inject(GimnasioApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  gimnasioContacto: GimnasioContacto | null = null;

  ngOnInit(): void {
    this.gimnasioApiService.getMiGimnasio().subscribe({
      next: (contacto) => {
        this.gimnasioContacto = contacto;
        this.cdr.markForCheck();
      },
      error: () => {
        this.gimnasioContacto = null;
        this.cdr.markForCheck();
      },
    });
  }
}

