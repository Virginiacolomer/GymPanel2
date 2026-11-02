export interface CatalogoEjercicio {
  id: number;
  nombre: string;
  imagenUrl?: string | null;
  grupoMuscularId?: number;
  descripcion?: string;
  equipamiento?: string;
  tecnica?: string;
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

