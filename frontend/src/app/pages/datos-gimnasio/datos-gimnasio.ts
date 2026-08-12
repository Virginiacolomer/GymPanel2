import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { GimnasioApiService } from '../../core/services/gimnasio-api.service';

@Component({
  standalone: true,
  imports: [FormsModule, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './datos-gimnasio.html',
  styleUrl: './datos-gimnasio.css',
})
export class DatosGimnasio implements OnInit {
  private readonly gimnasioApiService = inject(GimnasioApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  nombreGimnasio = '';
  instagram = '';
  telefono = '';
  direccion = '';

  isLoading = false;
  isSaving = false;
  statusMessage = '';
  statusType: 'success' | 'error' | 'info' = 'info';

  ngOnInit(): void {
    this.isLoading = true;
    this.gimnasioApiService
      .getMiGimnasio()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (contacto) => {
          this.nombreGimnasio = contacto.nombre;
          this.instagram = contacto.instagram ?? '';
          this.telefono = contacto.telefono ?? '';
          this.direccion = contacto.direccion ?? '';
          this.cdr.markForCheck();
        },
        error: () => {
          this.statusMessage = 'No se pudieron cargar los datos del gimnasio.';
          this.statusType = 'error';
          this.cdr.markForCheck();
        },
      });
  }

  guardar(): void {
    this.isSaving = true;
    this.statusMessage = '';
    this.cdr.markForCheck();

    this.gimnasioApiService
      .updateMiGimnasio({
        instagram: this.instagram.trim(),
        telefono: this.telefono.trim(),
        direccion: this.direccion.trim(),
      })
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: (contacto) => {
          this.instagram = contacto.instagram ?? '';
          this.telefono = contacto.telefono ?? '';
          this.direccion = contacto.direccion ?? '';
          this.statusMessage = 'Datos del gimnasio actualizados correctamente.';
          this.statusType = 'success';
          this.cdr.markForCheck();
        },
        error: () => {
          this.statusMessage = 'No se pudieron guardar los cambios. Intenta de nuevo.';
          this.statusType = 'error';
          this.cdr.markForCheck();
        },
      });
  }
}
