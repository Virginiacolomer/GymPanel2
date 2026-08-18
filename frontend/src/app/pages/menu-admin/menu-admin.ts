import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { GimnasioApiService } from '../../core/services/gimnasio-api.service';

@Component({

  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './menu-admin.html',
  styleUrl: './menu-admin.css',
})
export class MenuAdmin implements OnInit {
  private readonly gimnasioApiService = inject(GimnasioApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  // null mientras carga: por defecto no se pinta nada en gris hasta saber
  // realmente que funcionalidades tiene habilitadas el gimnasio.
  private funcionalidades: string[] | null = null;

  ngOnInit(): void {
    this.gimnasioApiService.getMiGimnasio().subscribe({
      next: (contacto) => {
        this.funcionalidades = contacto.funcionalidades;
        this.cdr.markForCheck();
      },
      error: () => {
        // Si falla la carga, no bloqueamos el menu: se comporta como si
        // todo estuviera habilitado (el backend igual lo va a validar).
        this.funcionalidades = null;
        this.cdr.markForCheck();
      },
    });
  }

  hasFeature(feature: string): boolean {
    return this.funcionalidades === null || this.funcionalidades.includes(feature);
  }
}
