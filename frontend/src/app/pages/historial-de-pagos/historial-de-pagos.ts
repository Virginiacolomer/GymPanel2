import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { CurrentMonthPaymentResponse, MembresiaApiService } from '../../core/services/membresia-api.service';

type PaymentHistoryRow = {
  id: number;
  date: string;
  month: string;
  membership: string;
  amount: string;
};

@Component({
  standalone: true,
  imports: [PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './historial-de-pagos.html',
  styleUrl: './historial-de-pagos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialDePagos implements OnInit {
  paymentHistory: PaymentHistoryRow[] = [];
  loadError = '';

  private readonly membresiaService = inject(MembresiaApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  get totalPaymentsLabel(): string {
    const total = this.paymentHistory.length;
    return total === 1 ? '1 pago registrado' : `${total} pagos registrados`;
  }

  get latestPaymentDateLabel(): string {
    if (this.paymentHistory.length === 0) {
      return 'Sin pagos';
    }

    return this.paymentHistory[0].date;
  }

  ngOnInit(): void {
    this.membresiaService.getMyPayments().subscribe({
      next: (payments) => {
        this.loadError = '';
        this.paymentHistory = payments.map((payment) => this.mapPayment(payment));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading payment history:', err);
        this.loadError = 'No se pudo cargar el historial de pagos.';
        this.paymentHistory = [];
        this.cdr.markForCheck();
      },
    });
  }

  private mapPayment(payment: CurrentMonthPaymentResponse): PaymentHistoryRow {
    return {
      id: payment.id,
      date: this.formatDate(payment.createdAt),
      month: this.formatMonthLabel(payment.mes),
      membership: payment.membresiaNombre,
      amount: this.formatCurrency(payment.costo),
    };
  }

  private formatMonthLabel(monthNumber: number): string {
    return new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date(2026, monthNumber - 1, 1));
  }

  private formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed);
  }

  private formatCurrency(amount: number | null): string {
    if (amount === null) {
      return 'Monto no disponible';
    }

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

