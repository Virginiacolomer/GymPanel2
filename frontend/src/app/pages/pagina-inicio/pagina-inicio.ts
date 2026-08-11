import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { environment } from '../../../environments/environment';

// Componente de la pantalla principal (home/landing).
@Component({
  // Nombre de etiqueta si este componente se usara como <app-pagina-inicio>.
  selector: 'app-pagina-inicio',
  // Permite usar el componente directamente en rutas sin declararlo en un NgModule.
  standalone: true,
  // Dependencias usadas en el template.
  imports: [PageHeaderComponent, PageBgComponent],
  // Template HTML asociado al componente.
  templateUrl: './pagina-inicio.html',
  // Hoja de estilos especifica del componente.
  styleUrl: './pagina-inicio.css',
})
export class PaginaInicio {
  // Datos de contacto del gimnasio, configurables por instancia en los archivos de environment.
  readonly gymContact = environment.gymContact;
}
