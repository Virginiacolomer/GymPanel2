import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CreatePlanEntrenamientoRequest {
  nombre: string;
  descripcion?: string;
  cantidadDias: number;
  ejercicios: Array<number[] | null>;
  repeticiones: Array<string[] | null>;
  descripcionesDias?: Array<string | null>;
}

export interface PlanEntrenamientoResponse {
  id: number;
  nombre: string;
  descripcion?: string | null;
  descripcionesDias?: Array<string | null>;
  descripciones_dias?: Array<string | null>;
  tipo?: 'predeterminado' | 'editado';
  cantidadDias: number;
  ejercicios: Array<number[] | null>;
  repeticiones: Array<string[] | null>;
  ejerciciosVisibles: number[][];
  repeticionesVisibles: string[][];
}

export interface UserPlanResponse {
  userId?: number;
  planEntrenamientoId?: number | null;
  plan: PlanEntrenamientoResponse | null;
}

export interface UserEditedPlanResponse {
  id: number;
  tipo: 'editado';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  createPlan(payload: CreatePlanEntrenamientoRequest): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/plan-entrenamiento`, payload).pipe(timeout(35000));
  }

  getMyPlan(): Observable<UserPlanResponse> {
    return this.http.get<UserPlanResponse>(`${this.apiBaseUrl}/plan-entrenamiento/mio`);
  }

  getPlanByUserId(userId: number | string): Observable<UserPlanResponse> {
    return this.http.get<UserPlanResponse>(`${this.apiBaseUrl}/plan-entrenamiento/usuario/${userId}`);
  }

  getAllPlans(): Observable<PlanEntrenamientoResponse[]> {
    return this.http.get<PlanEntrenamientoResponse[]>(`${this.apiBaseUrl}/plan-entrenamiento`);
  }

  assignPlanToUser(userId: number, planId: number): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(
        `${this.apiBaseUrl}/plan-entrenamiento/usuario/${userId}/asignar/${planId}`,
        {},
      )
      .pipe(timeout(10000));
  }

  updatePlanForUser(
    userId: number,
    payload: CreatePlanEntrenamientoRequest,
  ): Observable<UserEditedPlanResponse> {
    return this.http
      .patch<UserEditedPlanResponse>(
        `${this.apiBaseUrl}/plan-entrenamiento/usuario/${userId}/editar`,
        payload,
      )
      .pipe(timeout(15000));
  }
}

