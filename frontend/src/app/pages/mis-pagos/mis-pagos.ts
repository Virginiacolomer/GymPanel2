import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageHeaderCompactComponent } from '../../shared/page-header-compact/page-header-compact';
import { PageBgComponent } from '../../shared/page-bg/page-bg';
import { CurrentMonthPaymentResponse, MembresiaApiService } from '../../core/services/membresia-api.service';

type PaymentStatus = 'upToDate' | 'pending';

type PaymentStatusConfig = {
  label: string;
};

type CurrentMonthPaymentItem = {
  id: number;
  monthLabel: string;
  membershipName: string;
  createdAtLabel: string;
  amountLabel: string;
};

@Component({
  selector: 'app-mis-pagos',
  standalone: true,
  imports: [RouterLink, PageHeaderCompactComponent, PageBgComponent],
  templateUrl: './mis-pagos.html',
  styleUrl: './mis-pagos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisPagos implements OnInit {
  currentStatus: PaymentStatus = 'pending';
  currentMonthPayments: CurrentMonthPaymentItem[] = [];
  paymentsLoadError = '';
  readonly currentMonthLabel = this.formatMonthLabel(new Date().getMonth() + 1);
  private readonly membresiaService = inject(MembresiaApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isRedirectingToCheckout = false;
  checkoutErrorMessage = '';
  redirectStatusMessage = '';
  redirectStatusType: 'success' | 'error' | 'info' = 'info';

  private readonly statusConfig: Record<PaymentStatus, PaymentStatusConfig> = {
    upToDate: {
      label: 'Cuota al dia',
    },
    pending: {
      label: 'Pendiente de pago',
    },
  };

  get status(): PaymentStatusConfig {
    return this.statusConfig[this.currentStatus];
  }

  get statusDetail(): string {
    if (this.currentStatus === 'upToDate') {
      const paymentCount = this.currentMonthPayments.length;
      return paymentCount > 1
        ? `Se registraron ${paymentCount} pagos para ${this.currentMonthLabel}.`
        : `Se registro un pago para ${this.currentMonthLabel}.`;
    }

    return 'Regularice su situacion con el entrenador (membresias no abonadas)';
  }

  get nextPaymentLabel(): string {
    if (this.currentStatus === 'pending') {
      return `Antes del 10 de ${this.currentMonthLabel}`;
    }

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return `1 ${this.formatMonthLabel(nextMonth.getMonth() + 1)}`;
  }

  ngOnInit(): void {
    this.handleCheckoutRedirect();

    this.membresiaService.getMyPaymentStatus().subscribe({
      next: (response) => {
        this.currentStatus = response.isPaymentUpToDate === true ? 'upToDate' : 'pending';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading payment status:', err);
        this.currentStatus = 'pending';
        this.cdr.markForCheck();
      }
    });

    this.membresiaService.getMyCurrentMonthPayments().subscribe({
      next: (payments) => {
        this.paymentsLoadError = '';
        this.currentMonthPayments = payments.map((payment) => this.mapPayment(payment));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading current month payments:', err);
        this.paymentsLoadError = 'No se pudieron cargar los pagos del mes actual.';
        this.currentMonthPayments = [];
        this.cdr.markForCheck();
      }
    });
  }

  iniciarPago(): void {
    if (this.isRedirectingToCheckout) {
      return;
    }

    this.isRedirectingToCheckout = true;
    this.checkoutErrorMessage = '';
    this.cdr.markForCheck();

    this.membresiaService.crearCheckout().subscribe({
      next: (response) => {
        window.location.href = response.initPoint;
      },
      error: (err) => {
        console.error('Error al crear el pago con Mercado Pago:', err);
        this.isRedirectingToCheckout = false;
        this.checkoutErrorMessage =
          err?.error?.message || 'No se pudo iniciar el pago con Mercado Pago. Intenta de nuevo.';
        this.cdr.markForCheck();
      },
    });
  }

  private handleCheckoutRedirect(): void {
    const pagoParam = this.route.snapshot.queryParamMap.get('pago');
    if (!pagoParam) {
      return;
    }

    if (pagoParam === 'exito') {
      this.redirectStatusMessage = 'Pago recibido. Puede tardar unos segundos en reflejarse como al dia.';
      this.redirectStatusType = 'success';
    } else if (pagoParam === 'pendiente') {
      this.redirectStatusMessage = 'Tu pago quedo pendiente de confirmacion en Mercado Pago.';
      this.redirectStatusType = 'info';
    } else if (pagoParam === 'fallo') {
      this.redirectStatusMessage = 'El pago no se pudo completar. Intenta de nuevo.';
      this.redirectStatusType = 'error';
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private mapPayment(payment: CurrentMonthPaymentResponse): CurrentMonthPaymentItem {
    return {
      id: payment.id,
      monthLabel: this.formatMonthLabel(payment.mes),
      membershipName: payment.membresiaNombre,
      createdAtLabel: this.formatCreatedAt(payment.createdAt),
      amountLabel: this.formatCurrency(payment.costo),
    };
  }

  private formatMonthLabel(monthNumber: number): string {
    return new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(new Date(2026, monthNumber - 1, 1));
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

  private formatCreatedAt(createdAt: string): string {
    const parsedDate = new Date(createdAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsedDate);
  }
}

