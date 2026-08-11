import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CatalogoEjercicio {
  id: number;
  nombre: string;
  imagenUrl?: string | null;
}

export interface CatalogoGrupoMuscular {
  id: number;
  nombre: string;
  ejercicios: CatalogoEjercicio[];
}

export interface CatalogoGrupoMuscularResumen {
  id: number;
  nombre: string;
}

export interface CreatePlanEntrenamientoRequest {
  nombre: string;
  descripcion?: string;
  cantidadDias: number;
  ejercicios: Array<number[] | null>;
  repeticiones: Array<string[] | null>;
  descripcionesDias?: Array<string | null>;
}

export interface CreateEjercicioRequest {
  nombre: string;
  grupoMuscularId: number;
}

export interface CreateGrupoMuscularRequest {
  nombre: string;
}

export interface UpdateGrupoMuscularRequest {
  nombre: string;
}

export interface UpdateEjercicioRequest {
  nombre?: string;
  grupoMuscularId?: number;
}

export interface CreateGrupoMuscularResponse {
  id: number;
  nombre: string;
  message: string;
}

export interface CreateEjercicioResponse {
  id: number;
  nombre: string;
  grupoMuscularId: number;
  message: string;
}

export interface UpdateGrupoMuscularResponse {
  id: number;
  nombre: string;
  message: string;
}

export interface UpdateEjercicioResponse {
  id: number;
  nombre: string;
  grupoMuscularId: number;
  message: string;
}

export interface DeleteEjercicioResponse {
  id: number;
  message: string;
}

export interface UploadEjercicioImagenResponse {
  id: number;
  imagenUrl: string;
  message: string;
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
export class PlanEntrenamientoApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = environment.apiBaseUrl.replace(/\/+$/, '');

  getCatalogoGruposMusculares(): Observable<CatalogoGrupoMuscular[]> {
    return this.http.get<CatalogoGrupoMuscular[]>(
      `${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares?_t=${Date.now()}`,
    );
  }

  getCatalogoGruposMuscularesResumen(): Observable<CatalogoGrupoMuscularResumen[]> {
    return this.http.get<CatalogoGrupoMuscularResumen[]>(
      `${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares-resumen?_t=${Date.now()}`,
    );
  }

  getGrupoMuscularById(grupoId: number): Observable<CatalogoGrupoMuscular> {
    return this.http.get<CatalogoGrupoMuscular>(
      `${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares/${grupoId}?_t=${Date.now()}`,
    );
  }

  getEjerciciosByGrupoMuscularId(grupoId: number): Observable<CatalogoEjercicio[]> {
    return this.http.get<CatalogoEjercicio[]>(
      `${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares/${grupoId}/ejercicios?_t=${Date.now()}`,
    );
  }

  createPlan(payload: CreatePlanEntrenamientoRequest): Observable<unknown> {
    return this.http.post(`${this.apiBaseUrl}/plan-entrenamiento`, payload).pipe(timeout(35000));
  }

  createEjercicio(payload: CreateEjercicioRequest): Observable<CreateEjercicioResponse> {
    return this.http.post<CreateEjercicioResponse>(`${this.apiBaseUrl}/plan-entrenamiento/ejercicios`, payload).pipe(timeout(10000));
  }

  createGrupoMuscular(payload: CreateGrupoMuscularRequest): Observable<CreateGrupoMuscularResponse> {
    return this.http.post<CreateGrupoMuscularResponse>(
      `${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares`,
      payload,
    ).pipe(timeout(10000));
  }

  updateGrupoMuscular(
    grupoId: number,
    payload: UpdateGrupoMuscularRequest,
  ): Observable<UpdateGrupoMuscularResponse> {
    return this.http.patch<UpdateGrupoMuscularResponse>(
      `${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares/${grupoId}`,
      payload,
    ).pipe(timeout(10000));
  }

  updateEjercicio(ejercicioId: number, payload: UpdateEjercicioRequest): Observable<UpdateEjercicioResponse> {
    return this.http.patch<UpdateEjercicioResponse>(
      `${this.apiBaseUrl}/plan-entrenamiento/ejercicios/${ejercicioId}`,
      payload,
    ).pipe(timeout(10000));
  }

  deleteEjercicio(ejercicioId: number): Observable<DeleteEjercicioResponse> {
    return this.http.delete<DeleteEjercicioResponse>(
      `${this.apiBaseUrl}/plan-entrenamiento/ejercicios/${ejercicioId}`,
    ).pipe(timeout(10000));
  }

  uploadEjercicioImagen(ejercicioId: number, file: File): Observable<UploadEjercicioImagenResponse> {
    const formData = new FormData();
    formData.append('imagen', file);

    return this.http.post<UploadEjercicioImagenResponse>(
      `${this.apiBaseUrl}/plan-entrenamiento/ejercicios/${ejercicioId}/imagen`,
      formData,
    ).pipe(timeout(20000));
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
    return this.http.patch<{ message: string }>(
      `${this.apiBaseUrl}/plan-entrenamiento/usuario/${userId}/asignar/${planId}`,
      {},
    ).pipe(timeout(10000));
  }

  updatePlanForUser(
    userId: number,
    payload: CreatePlanEntrenamientoRequest,
  ): Observable<UserEditedPlanResponse> {
    return this.http.patch<UserEditedPlanResponse>(
      `${this.apiBaseUrl}/plan-entrenamiento/usuario/${userId}/editar`,
      payload,
    ).pipe(timeout(15000));
  }
}
