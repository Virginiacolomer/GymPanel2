import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Componente raiz de Angular: envuelve toda la aplicacion.
@Component({
  // Tag principal del root component.
  selector: 'app-root',
  // Standalone para no depender de NgModule tradicional.
  standalone: true,
  // RouterOutlet permite renderizar el componente de la ruta activa.
  imports: [RouterOutlet],
  // Template minimo que contiene <router-outlet>.
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}

// Alias para compatibilidad con codigo que espera AppComponent.
export { App as AppComponent };