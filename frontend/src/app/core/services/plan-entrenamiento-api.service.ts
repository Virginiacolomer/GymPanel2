import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  EjercicioService,
  CatalogoEjercicio,
  CatalogoGrupoMuscular,
  CatalogoGrupoMuscularResumen,
  CreateEjercicioRequest,
  CreateGrupoMuscularRequest,
  UpdateGrupoMuscularRequest,
  UpdateEjercicioRequest,
  CreateGrupoMuscularResponse,
  CreateEjercicioResponse,
  UpdateGrupoMuscularResponse,
  UpdateEjercicioResponse,
  DeleteEjercicioResponse,
  UploadEjercicioImagenResponse,
} from './ejercicio.service';
import {
  PlanService,
  CreatePlanEntrenamientoRequest,
  PlanEntrenamientoResponse,
  UserPlanResponse,
  UserEditedPlanResponse,
} from './plan.service';

export type {
  CatalogoEjercicio,
  CatalogoGrupoMuscular,
  CatalogoGrupoMuscularResumen,
  CreateEjercicioRequest,
  CreateGrupoMuscularRequest,
  UpdateGrupoMuscularRequest,
  UpdateEjercicioRequest,
  CreateGrupoMuscularResponse,
  CreateEjercicioResponse,
  UpdateGrupoMuscularResponse,
  UpdateEjercicioResponse,
  DeleteEjercicioResponse,
  UploadEjercicioImagenResponse,
  CreatePlanEntrenamientoRequest,
  PlanEntrenamientoResponse,
  UserPlanResponse,
  UserEditedPlanResponse,
};

/**
 * @deprecated Este servicio fue dividido en EjercicioService y PlanService.
 * Se mantiene temporalmente para compatibilidad hacia atrás con las pantallas de Ejercicios y Planes.
 */
@Injectable({ providedIn: 'root' })
export class PlanEntrenamientoApiService {
  private readonly ejercicioService = inject(EjercicioService);
  private readonly planService = inject(PlanService);

  // Delegaciones hacia EjercicioService
  getCatalogoGruposMusculares(): Observable<CatalogoGrupoMuscular[]> {
    return this.ejercicioService.getCatalogoGruposMusculares();
  }

  getCatalogoGruposMuscularesResumen(): Observable<CatalogoGrupoMuscularResumen[]> {
    return this.ejercicioService.getCatalogoGruposMuscularesResumen();
  }

  getGrupoMuscularById(grupoId: number): Observable<CatalogoGrupoMuscular> {
    return this.ejercicioService.getGrupoMuscularById(grupoId);
  }

  getEjerciciosByGrupoMuscularId(grupoId: number): Observable<CatalogoEjercicio[]> {
    return this.ejercicioService.getEjerciciosByGrupoMuscularId(grupoId);
  }

  createEjercicio(payload: CreateEjercicioRequest): Observable<CreateEjercicioResponse> {
    return this.ejercicioService.createEjercicio(payload);
  }

  createGrupoMuscular(payload: CreateGrupoMuscularRequest): Observable<CreateGrupoMuscularResponse> {
    return this.ejercicioService.createGrupoMuscular(payload);
  }

  updateGrupoMuscular(
    grupoId: number,
    payload: UpdateGrupoMuscularRequest,
  ): Observable<UpdateGrupoMuscularResponse> {
    return this.ejercicioService.updateGrupoMuscular(grupoId, payload);
  }

  updateEjercicio(ejercicioId: number, payload: UpdateEjercicioRequest): Observable<UpdateEjercicioResponse> {
    return this.ejercicioService.updateEjercicio(ejercicioId, payload);
  }

  deleteEjercicio(ejercicioId: number): Observable<DeleteEjercicioResponse> {
    return this.ejercicioService.deleteEjercicio(ejercicioId);
  }

  uploadEjercicioImagen(ejercicioId: number, file: File): Observable<UploadEjercicioImagenResponse> {
    return this.ejercicioService.uploadEjercicioImagen(ejercicioId, file);
  }

  // Delegaciones hacia PlanService
  createPlan(payload: CreatePlanEntrenamientoRequest): Observable<unknown> {
    return this.planService.createPlan(payload);
  }

  getMyPlan(): Observable<UserPlanResponse> {
    return this.planService.getMyPlan();
  }

  getPlanByUserId(userId: number | string): Observable<UserPlanResponse> {
    return this.planService.getPlanByUserId(userId);
  }

  getAllPlans(): Observable<PlanEntrenamientoResponse[]> {
    return this.planService.getAllPlans();
  }

  assignPlanToUser(userId: number, planId: number): Observable<{ message: string }> {
    return this.planService.assignPlanToUser(userId, planId);
  }

  updatePlanForUser(
    userId: number,
    payload: CreatePlanEntrenamientoRequest,
  ): Observable<UserEditedPlanResponse> {
    return this.planService.updatePlanForUser(userId, payload);
  }
}
