import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Horario {
  id: number;
  descripcion: string;
  horario: string;
}

@Injectable({ providedIn: 'root' })
export class HorarioApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  // Horarios del gimnasio del usuario logueado (segun el gimnasioId de su JWT).
  findMine(): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiBaseUrl}/horarios`);
  }

  create(payload: { descripcion: string; horario: string }): Observable<Horario> {
    return this.http.post<Horario>(`${this.apiBaseUrl}/horarios`, payload);
  }

  update(id: number, payload: { descripcion: string; horario: string }): Observable<Horario> {
    return this.http.patch<Horario>(`${this.apiBaseUrl}/horarios/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.apiBaseUrl}/horarios/${id}`);
  }
}
