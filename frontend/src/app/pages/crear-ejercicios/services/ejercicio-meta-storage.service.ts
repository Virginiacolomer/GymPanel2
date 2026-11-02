import { Injectable } from '@angular/core';
import { CatalogoEjercicio } from '../../../core/services/plan-entrenamiento-api.service';

export interface EjercicioExtraMeta {
  descripcion?: string;
  equipamiento?: string;
  tecnica?: string;
}

const STORAGE_KEY = 'gympanel_ejercicios_meta_v1';

@Injectable({
  providedIn: 'root',
})
export class EjercicioMetaStorageService {
  private cache: Record<number, EjercicioExtraMeta> | null = null;

  private loadCache(): Record<number, EjercicioExtraMeta> {
    if (this.cache !== null) {
      return this.cache;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.cache = JSON.parse(raw);
          return this.cache!;
        }
      }
    } catch {
      // Fallback si localStorage no está disponible
    }

    this.cache = {};
    return this.cache;
  }

  private persistCache(): void {
    if (!this.cache) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
      }
    } catch {
      // No arrojar error si falla el storage
    }
  }

  getMeta(id: number): EjercicioExtraMeta | null {
    const data = this.loadCache();
    return data[id] ?? null;
  }

  saveMeta(id: number, meta: EjercicioExtraMeta): void {
    if (!id || id <= 0) return;
    const data = this.loadCache();
    const existing = data[id] || {};
    data[id] = {
      ...existing,
      ...meta,
    };
    this.persistCache();
  }

  deleteMeta(id: number): void {
    const data = this.loadCache();
    if (data[id]) {
      delete data[id];
      this.persistCache();
    }
  }

  enrichEjercicio(ejercicio: CatalogoEjercicio, defaultGrupoId?: number): CatalogoEjercicio {
    const meta = this.getMeta(ejercicio.id);
    return {
      ...ejercicio,
      grupoMuscularId: ejercicio.grupoMuscularId ?? defaultGrupoId,
      descripcion: meta?.descripcion ?? ejercicio.descripcion,
      equipamiento: meta?.equipamiento ?? ejercicio.equipamiento,
      tecnica: meta?.tecnica ?? ejercicio.tecnica,
    };
  }

  enrichEjercicios(ejercicios: CatalogoEjercicio[], defaultGrupoId?: number): CatalogoEjercicio[] {
    return ejercicios.map((ej) => this.enrichEjercicio(ej, defaultGrupoId));
  }
}

