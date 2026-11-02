import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';

type TabType = '1rm' | 'peso-sugerido' | 'evaluaciones';

interface RepsTarget {
  reps: number;
  percentage: number;
  weight: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PageBgComponent, PageHeaderCompactComponent],
  templateUrl: './herramientas-inteligentes.html',
  styleUrl: './herramientas-inteligentes.css',
})
export class HerramientasInteligentes {
  activeTab = signal<TabType>('1rm');

  // --- Herramienta 1: Calculadora 1RM (Fórmula de Epley) ---
  peso1RM = signal<number>(80);
  reps1RM = signal<number>(6);
  ejercicio1RM = signal<string>('Press de banca');

  // Cálculo de 1RM con fórmula de Epley: 1RM = peso * (1 + reps/30)
  // Redondeado hacia abajo a múltiplos de 2.5 kg según AGENTS.md
  calculated1RM = computed(() => {
    const p = this.peso1RM();
    const r = this.reps1RM();
    if (!p || p <= 0 || !r || r <= 0) return 0;
    if (r === 1) return p;
    const exact = p * (1 + r / 30);
    return Math.floor(exact / 2.5) * 2.5;
  });

  // Desglose de pesos sugeridos para repeticiones objetivo
  repsBreakdown = computed<RepsTarget[]>(() => {
    const rm = this.calculated1RM();
    if (rm === 0) return [];
    const targets = [
      { reps: 1, percentage: 100 },
      { reps: 3, percentage: 93 },
      { reps: 5, percentage: 87 },
      { reps: 8, percentage: 80 },
      { reps: 10, percentage: 75 },
      { reps: 12, percentage: 70 },
    ];
    return targets.map((t) => ({
      reps: t.reps,
      percentage: t.percentage,
      weight: Math.floor((rm * (t.percentage / 100)) / 2.5) * 2.5,
    }));
  });

  // --- Herramienta 2: Peso sugerido para nuevo ejercicio ---
  grupoMuscular = signal<string>('PECHO');
  ejercicioBase = signal<string>('Press banca plano (Barra)');
  pesoBase = signal<number>(75);
  repsBase = signal<number>(8);
  ejercicioNuevo = signal<string>('Press inclinado (Mancuernas)');

  // Factor de transferencia biomecánica (estimación conservadora de adaptación)
  sugerenciaNuevoEjercicio = computed(() => {
    const p = this.pesoBase();
    const r = this.repsBase();
    if (!p || p <= 0 || !r || r <= 0) return null;
    const base1RM = p * (1 + r / 30);

    // Ajuste conservador: 65% - 75% del 1RM base para mancuernas o ejercicio nuevo
    const minSugerido = Math.floor((base1RM * 0.65) / 2.5) * 2.5;
    const maxSugerido = Math.floor((base1RM * 0.75) / 2.5) * 2.5;
    const porManoMin = Math.floor((minSugerido / 2) / 2) * 2;
    const porManoMax = Math.floor((maxSugerido / 2) / 2) * 2;

    return {
      rangoBarra: `${minSugerido} - ${maxSugerido} kg`,
      rangoMancuernas: `${porManoMin} - ${porManoMax} kg por mancuerna`,
      repsRecomendadas: '8 a 10 reps',
      enfoque: 'Semana de adaptación neuromuscular (RPE 7-8)',
    };
  });

  // --- Herramienta 3: Evaluaciones mensuales y evolución ---
  mesSeleccionado = signal<number>(3);

  evaluaciones = [
    { mes: 1, fecha: 'Mes 1 (Inicio)', pesoCorporal: 78.5, masaMagra: 61.2, cintura: 86, fuerza1RM: 70 },
    { mes: 2, fecha: 'Mes 2', pesoCorporal: 77.2, masaMagra: 62.0, cintura: 84, fuerza1RM: 80 },
    { mes: 3, fecha: 'Mes 3 (Actual)', pesoCorporal: 76.8, masaMagra: 63.4, cintura: 82, fuerza1RM: 92.5 },
  ];

  evaluacionActual = computed(() => {
    return this.evaluaciones.find((e) => e.mes === this.mesSeleccionado()) ?? this.evaluaciones[2];
  });

  cambioTotal = computed(() => {
    const inicial = this.evaluaciones[0];
    const actual = this.evaluacionActual();
    return {
      deltaPeso: (actual.pesoCorporal - inicial.pesoCorporal).toFixed(1),
      deltaMasa: (actual.masaMagra - inicial.masaMagra).toFixed(1),
      deltaCintura: (actual.cintura - inicial.cintura).toFixed(1),
      deltaFuerza: (actual.fuerza1RM - inicial.fuerza1RM).toFixed(1),
    };
  });

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
  }
}
