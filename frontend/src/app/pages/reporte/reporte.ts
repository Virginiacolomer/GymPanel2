import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { MembresiaApiService } from '../../core/services/membresia-api.service';
import jsPDF from 'jspdf';

export interface GastoItem {
  titulo: string;
  valor: string;
}

@Component({
  standalone: true,
  imports: [FormsModule, DecimalPipe, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './reporte.html',
  styleUrl: './reporte.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Reporte {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly membresiaApiService = inject(MembresiaApiService);

  fechaDesde = '';
  fechaHasta = '';
  errorMsg = '';
  isGenerando = false;

  gastos: GastoItem[] = [{ titulo: '', valor: '' }];

  get totalGastos(): number {
    return this.gastos.reduce((sum, g) => sum + (parseFloat(g.valor) || 0), 0);
  }

  agregarGasto(): void {
    this.gastos = [...this.gastos, { titulo: '', valor: '' }];
    this.cdr.markForCheck();
  }

  eliminarGasto(index: number): void {
    this.gastos = this.gastos.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  trackByIndex(index: number): number {
    return index;
  }

  onValorKeydown(event: KeyboardEvent): void {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(event.key)) return;
    if (/^[0-9]$/.test(event.key)) return;
    if ((event.key === '.' || event.key === ',') ) return;
    event.preventDefault();
  }

  onValorInput(event: Event, gasto: GastoItem): void {
    const input = event.target as HTMLInputElement;
    // Reemplaza coma por punto y elimina todo lo que no sea dígito o punto.
    let clean = input.value.replace(',', '.').replace(/[^0-9.]/g, '');
    // Solo permite un punto decimal.
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
    gasto.valor = clean;
    input.value = clean;
    this.cdr.markForCheck();
  }

  get hoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  onGenerar(): void {
    this.errorMsg = '';

    if (!this.fechaDesde || !this.fechaHasta) {
      this.errorMsg = 'Debes seleccionar ambas fechas.';
      this.cdr.markForCheck();
      return;
    }

    if (this.fechaDesde > this.fechaHasta) {
      this.errorMsg = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      this.cdr.markForCheck();
      return;
    }

    this.isGenerando = true;
    this.cdr.markForCheck();

    forkJoin({
      pagos: this.membresiaApiService.getPaymentsByDateRange(this.fechaDesde, this.fechaHasta),
      metricasMesActual: this.membresiaApiService.getCurrentMonthReportMetrics(),
    }).subscribe({
      next: ({ pagos, metricasMesActual }) => {
        const totalIngresos = pagos.reduce((sum, p) => sum + (p.costo ?? 0), 0);
        const gastosValidos = this.gastos.filter((g) => g.titulo.trim());
        const totalGastos = this.totalGastos;
        const resultado = totalIngresos - totalGastos;
        const membershipsChosenInPeriod = this.buildMembershipsChosenInPeriod(pagos);

        this.generarPdf({
          desde: this.fechaDesde,
          hasta: this.fechaHasta,
          pagos,
          totalIngresos,
          gastosValidos,
          totalGastos,
          resultado,
          pendingPaymentUsersCurrentMonth: metricasMesActual.pendingPaymentUsersCurrentMonth,
          membershipsChosenInPeriod,
        });

        this.isGenerando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg = 'Error al obtener los datos del reporte. Intenta nuevamente.';
        this.isGenerando = false;
        this.cdr.markForCheck();
      },
    });
  }

  private formatMoney(value: number): string {
    return '$' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  private generarPdf(data: {
    desde: string;
    hasta: string;
    pagos: { membresiaId: number | null; userId: number | null; membresiaNombre: string; costo: number | null; createdAt: string }[];
    totalIngresos: number;
    gastosValidos: GastoItem[];
    totalGastos: number;
    resultado: number;
    pendingPaymentUsersCurrentMonth: number;
    membershipsChosenInPeriod: Array<{ membresiaId: number | null; membresiaNombre: string; cantidad: number }>;
  }): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    const col2 = pageW - margin;
    let y = 20;
    const lineH = 7;
    const sectionGap = 5;

    // Encabezado
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de GymPanel', margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periodo: ${this.formatDate(data.desde)} - ${this.formatDate(data.hasta)}`, margin, y);
    y += 4;
    doc.setDrawColor(180);
    doc.line(margin, y, col2, y);
    y += sectionGap + 2;

    // Ingresos por membresias
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Ingresos por membresias', margin, y);
    y += lineH;

    const pagosAgrupados = Array.from(
      data.pagos.reduce((acc, pago) => {
        const key = pago.membresiaNombre;
        const current = acc.get(key) ?? {
          membresiaNombre: pago.membresiaNombre,
          cantidad: 0,
          montoTotal: 0,
        };

        current.cantidad += 1;
        current.montoTotal += pago.costo ?? 0;
        acc.set(key, current);
        return acc;
      }, new Map<string, { membresiaNombre: string; cantidad: number; montoTotal: number }>()),
    ).map(([, value]) => value);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Membresia', margin, y);
    doc.text('Cant.', margin + 124, y);
    doc.text('Monto', col2, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 1;
    doc.setDrawColor(200);
    doc.line(margin, y, col2, y);
    y += 5;

    if (pagosAgrupados.length === 0) {
      doc.text('Sin pagos en el periodo seleccionado.', margin, y);
      y += lineH;
    } else {
      for (const pago of pagosAgrupados) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const label = pago.membresiaNombre;
        doc.text(label.substring(0, 52), margin, y);
        doc.text(String(pago.cantidad), margin + 130, y, { align: 'right' });
        doc.text(this.formatMoney(pago.montoTotal), col2, y, { align: 'right' });
        y += lineH - 1;
        if (y > 270) { doc.addPage(); y = 20; }
      }
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Total ingresos:', margin, y);
    doc.text(this.formatMoney(data.totalIngresos), col2, y, { align: 'right' });
    y += sectionGap + 2;
    doc.setDrawColor(180);
    doc.line(margin, y, col2, y);
    y += sectionGap + 2;

    // Gastos
    if (data.gastosValidos.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Gastos del periodo', margin, y);
      y += lineH;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Concepto', margin, y);
      doc.text('Monto', col2, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 1;
      doc.setDrawColor(200);
      doc.line(margin, y, col2, y);
      y += 5;

      for (const gasto of data.gastosValidos) {
        doc.text(gasto.titulo.substring(0, 60), margin, y);
        doc.text(this.formatMoney(parseFloat(gasto.valor) || 0), col2, y, { align: 'right' });
        y += lineH - 1;
        if (y > 270) { doc.addPage(); y = 20; }
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Total gastos:', margin, y);
      doc.text(this.formatMoney(data.totalGastos), col2, y, { align: 'right' });
      y += sectionGap + 2;
      doc.setDrawColor(180);
      doc.line(margin, y, col2, y);
      y += sectionGap + 2;
    }

    // Resultado neto
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultado neto', margin, y);
    doc.text(this.formatMoney(data.resultado), col2, y, { align: 'right' });
    y += sectionGap + 6;

    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    // Pendientes de pago del mes actual
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Pendientes de pago (mes actual)', margin, y);
    y += lineH;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Cantidad de personas: ${String(data.pendingPaymentUsersCurrentMonth)}`,
      margin,
      y,
    );
    y += sectionGap + 3;

    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    // Membresias elegidas en el mes actual
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Membresias elegidas en el periodo', margin, y);
    y += lineH;

    if (data.membershipsChosenInPeriod.length === 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('No hay membresias elegidas en el periodo seleccionado.', margin, y);
      y += lineH;
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Membresia', margin, y);
      doc.text('Cantidad', col2, y, { align: 'right' });
      y += 1;
      doc.setDrawColor(200);
      doc.line(margin, y, col2, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      for (const item of data.membershipsChosenInPeriod) {
        doc.text(item.membresiaNombre.substring(0, 50), margin, y);
        doc.text(String(item.cantidad), col2, y, { align: 'right' });
        y += lineH - 1;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      }

      const pieChartDataUrl = this.buildPieChartDataUrl(data.membershipsChosenInPeriod);
      if (pieChartDataUrl) {
        if (y > 165) {
          doc.addPage();
          y = 20;
        }

        y += 3;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Grafico de torta - Membresias en el periodo', margin, y);
        y += 3;
        doc.addImage(pieChartDataUrl, 'PNG', margin, y, 170, 95);
        y += 98;
      }
    }

    doc.save(`reporte_${data.desde}_${data.hasta}.pdf`);
  }

  private buildMembershipsChosenInPeriod(
    pagos: Array<{ membresiaId: number | null; userId: number | null; membresiaNombre: string }>,
  ): Array<{ membresiaId: number | null; membresiaNombre: string; cantidad: number }> {
    type Group = {
      membresiaId: number | null;
      membresiaNombre: string;
      users: Set<string>;
      withoutUserCount: number;
    };

    const grouped = new Map<string, Group>();

    for (const pago of pagos) {
      const key = `${pago.membresiaId ?? 'sin-id'}||${pago.membresiaNombre}`;
      const current = grouped.get(key) ?? {
        membresiaId: pago.membresiaId,
        membresiaNombre: pago.membresiaNombre,
        users: new Set<string>(),
        withoutUserCount: 0,
      };

      if (pago.userId != null) {
        current.users.add(String(pago.userId));
      } else {
        current.withoutUserCount += 1;
      }

      grouped.set(key, current);
    }

    return Array.from(grouped.values())
      .map((g) => ({
        membresiaId: g.membresiaId,
        membresiaNombre: g.membresiaNombre,
        cantidad: g.users.size + g.withoutUserCount,
      }))
      .sort((a, b) => b.cantidad - a.cantidad || a.membresiaNombre.localeCompare(b.membresiaNombre));
  }

  private buildPieChartDataUrl(
    items: Array<{ membresiaNombre: string; cantidad: number }>,
  ): string | null {
    if (typeof document === 'undefined' || items.length === 0) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    const colors = ['#3985f4', '#3ba1ff', '#ffd24a', '#ff7f50', '#c77dff', '#00c2a8', '#ff6384', '#7bdff2'];
    const total = items.reduce((sum, item) => sum + item.cantidad, 0);
    const cx = 220;
    const cy = 260;
    const radius = 150;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let startAngle = -Math.PI / 2;
    items.forEach((item, index) => {
      const angle = (item.cantidad / total) * Math.PI * 2;
      const color = colors[index % colors.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      startAngle += angle;
    });

    ctx.fillStyle = '#111111';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Membresias elegidas en el periodo', 430, 55);

    ctx.font = '18px Arial';
    items.forEach((item, index) => {
      const color = colors[index % colors.length];
      const y = 95 + index * 44;

      ctx.fillStyle = color;
      ctx.fillRect(430, y - 16, 22, 22);

      const percent = total > 0 ? ((item.cantidad / total) * 100).toFixed(1) : '0.0';
      ctx.fillStyle = '#111111';
      ctx.fillText(`${item.membresiaNombre} (${item.cantidad}) - ${percent}%`, 462, y);
    });

    return canvas.toDataURL('image/png');
  }
}
