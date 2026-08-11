import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Gimnasio {
  id: number;
  nombre: string;
  slug: string;
}

@Injectable({ providedIn: 'root' })
export class GimnasioApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  // Lista publica de gimnasios activos, usada para el selector en login/registro.
  findAllActive(): Observable<Gimnasio[]> {
    return this.http.get<Gimnasio[]>(`${this.apiBaseUrl}/gimnasios`);
  }
}
