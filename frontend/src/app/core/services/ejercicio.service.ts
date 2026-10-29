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

@Injectable({ providedIn: 'root' })
export class EjercicioService {
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

  createEjercicio(payload: CreateEjercicioRequest): Observable<CreateEjercicioResponse> {
    return this.http
      .post<CreateEjercicioResponse>(`${this.apiBaseUrl}/plan-entrenamiento/ejercicios`, payload)
      .pipe(timeout(10000));
  }

  createGrupoMuscular(payload: CreateGrupoMuscularRequest): Observable<CreateGrupoMuscularResponse> {
    return this.http
      .post<CreateGrupoMuscularResponse>(`${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares`, payload)
      .pipe(timeout(10000));
  }

  updateGrupoMuscular(
    grupoId: number,
    payload: UpdateGrupoMuscularRequest,
  ): Observable<UpdateGrupoMuscularResponse> {
    return this.http
      .patch<UpdateGrupoMuscularResponse>(`${this.apiBaseUrl}/plan-entrenamiento/grupos-musculares/${grupoId}`, payload)
      .pipe(timeout(10000));
  }

  updateEjercicio(ejercicioId: number, payload: UpdateEjercicioRequest): Observable<UpdateEjercicioResponse> {
    return this.http
      .patch<UpdateEjercicioResponse>(`${this.apiBaseUrl}/plan-entrenamiento/ejercicios/${ejercicioId}`, payload)
      .pipe(timeout(10000));
  }

  deleteEjercicio(ejercicioId: number): Observable<DeleteEjercicioResponse> {
    return this.http
      .delete<DeleteEjercicioResponse>(`${this.apiBaseUrl}/plan-entrenamiento/ejercicios/${ejercicioId}`)
      .pipe(timeout(10000));
  }

  uploadEjercicioImagen(ejercicioId: number, file: File): Observable<UploadEjercicioImagenResponse> {
    const formData = new FormData();
    formData.append('imagen', file);

    return this.http
      .post<UploadEjercicioImagenResponse>(
        `${this.apiBaseUrl}/plan-entrenamiento/ejercicios/${ejercicioId}/imagen`,
        formData,
      )
      .pipe(timeout(20000));
  }
}

