/**
 * Helper con metadatos anatómicos e íconos para cada grupo muscular.
 * Permite presentar una descripción anatómica e ícono representativo sin alterar la BD.
 */
export interface GrupoMuscularMeta {
  descripcion: string;
  icono: string; // Clase de Flaticon uicons
}

export const GRUPOS_MUSCULARES_META: Record<string, GrupoMuscularMeta> = {
  ABDOMINALES: {
    descripcion: 'Zona media y core',
    icono: 'fi fi-rr-gym',
  },
  ADUCTORES: {
    descripcion: 'Parte interna del muslo',
    icono: 'fi fi-rr-running',
  },
  ABDUCTORES: {
    descripcion: 'Cadera y parte externa',
    icono: 'fi fi-rr-running',
  },
  BICEPS: {
    descripcion: 'Brazos y flexores',
    icono: 'fi fi-rs-gym',
  },
  TRICEPS: {
    descripcion: 'Brazos y extensores',
    icono: 'fi fi-rs-gym',
  },
  CUADRICEPS: {
    descripcion: 'Muslo delantero',
    icono: 'fi fi-rr-flame',
  },
  ESPALDA: {
    descripcion: 'Zona dorsal y trapecios',
    icono: 'fi fi-rs-apps',
  },
  DORSALES: {
    descripcion: 'Zona dorsal superior',
    icono: 'fi fi-rs-apps',
  },
  FEMORALES: {
    descripcion: 'Parte posterior del muslo',
    icono: 'fi fi-rr-running',
  },
  ISQUIOTIBIALES: {
    descripcion: 'Parte posterior del muslo',
    icono: 'fi fi-rr-running',
  },
  GEMELOS: {
    descripcion: 'Pantorrillas y sóleo',
    icono: 'fi fi-rr-running',
  },
  GLUTEOS: {
    descripcion: 'Zona glútea y cadera',
    icono: 'fi fi-rr-flame',
  },
  HOMBROS: {
    descripcion: 'Deltoides y trapecios',
    icono: 'fi fi-rs-gym',
  },
  PECTORALES: {
    descripcion: 'Zona pectoral y pecho',
    icono: 'fi fi-rs-gym',
  },
  PECHO: {
    descripcion: 'Zona pectoral y pecho',
    icono: 'fi fi-rs-gym',
  },
};

export function getGrupoMuscularMeta(nombre: string): GrupoMuscularMeta {
  const normalized = nombre.trim().toUpperCase();
  for (const [key, meta] of Object.entries(GRUPOS_MUSCULARES_META)) {
    if (normalized.includes(key)) {
      return meta;
    }
  }
  return {
    descripcion: 'Músculos del grupo',
    icono: 'fi fi-rs-gym',
  };
}
