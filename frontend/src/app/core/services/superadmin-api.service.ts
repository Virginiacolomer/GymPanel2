import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PlanGimnasio = 'BASICO' | 'PRO' | 'FULL';

export interface SuperAdminLoginResponse {
  accessToken: string;
  superAdmin: { id: number; email: string };
}

export interface GimnasioAdminItem {
  id: number;
  nombre: string;
  slug: string;
  plan: PlanGimnasio;
  activo: boolean;
  instagram: string | null;
  telefono: string | null;
  direccion: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SuperAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  login(email: string, password: string): Observable<SuperAdminLoginResponse> {
    return this.http.post<SuperAdminLoginResponse>(`${this.apiBaseUrl}/superadmin/login`, { email, password });
  }

  getGimnasios(): Observable<GimnasioAdminItem[]> {
    return this.http.get<GimnasioAdminItem[]>(`${this.apiBaseUrl}/gimnasios/admin`);
  }

  updatePlan(gimnasioId: number, plan: PlanGimnasio): Observable<GimnasioAdminItem> {
    return this.http.patch<GimnasioAdminItem>(`${this.apiBaseUrl}/gimnasios/${gimnasioId}/plan`, { plan });
  }
}
