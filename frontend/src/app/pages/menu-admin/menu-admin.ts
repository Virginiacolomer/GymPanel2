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

  // null mientras no sepamos con certeza que funcionalidades tiene el
  // gimnasio (cargando o si fallo la carga): por defecto TODO queda
  // bloqueado, nunca habilitado, para que no haya una ventana donde se
  // pueda entrar a una pantalla que en realidad no esta pagada.
  private funcionalidades: string[] | null = null;
  loadError = false;

  ngOnInit(): void {
    this.loadFuncionalidades();
  }

  loadFuncionalidades(): void {
    this.loadError = false;
    this.gimnasioApiService.getMiGimnasio().subscribe({
      next: (contacto) => {
        this.funcionalidades = contacto.funcionalidades;
        this.cdr.markForCheck();
      },
      error: () => {
        this.funcionalidades = null;
        this.loadError = true;
        this.cdr.markForCheck();
      },
    });
  }

  hasFeature(feature: string): boolean {
    return this.funcionalidades !== null && this.funcionalidades.includes(feature);
  }
}
