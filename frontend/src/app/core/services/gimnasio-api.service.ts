import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Gimnasio {
  id: number;
  nombre: string;
  slug: string;
}

export interface GimnasioContacto {
  nombre: string;
  instagram: string | null;
  telefono: string | null;
  direccion: string | null;
  plan: 'BASICO' | 'PRO' | 'FULL';
  funcionalidades: string[];
}

@Injectable({ providedIn: 'root' })
export class GimnasioApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  // Lista publica de gimnasios activos, usada para el selector en login/registro.
  findAllActive(): Observable<Gimnasio[]> {
    return this.http.get<Gimnasio[]>(`${this.apiBaseUrl}/gimnasios`);
  }

  // Datos de contacto del gimnasio del usuario logueado (segun el gimnasioId de su JWT).
  getMiGimnasio(): Observable<GimnasioContacto> {
    return this.http.get<GimnasioContacto>(`${this.apiBaseUrl}/gimnasios/mi-gimnasio`);
  }

  updateMiGimnasio(payload: {
    instagram?: string;
    telefono?: string;
    direccion?: string;
  }): Observable<GimnasioContacto> {
    return this.http.patch<GimnasioContacto>(`${this.apiBaseUrl}/gimnasios/mi-gimnasio`, payload);
  }
}
