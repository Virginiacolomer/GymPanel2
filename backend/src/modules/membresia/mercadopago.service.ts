import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly client: MercadoPagoConfig | null;
  private readonly currency: string;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    this.currency = this.configService.get<string>('MERCADOPAGO_CURRENCY') || 'ARS';

    this.client = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

    if (!this.client) {
      this.logger.warn('MERCADOPAGO_ACCESS_TOKEN no configurada. El pago con Mercado Pago fallara.');
    }
  }

  async createPreference(params: {
    title: string;
    unitPrice: number;
    externalReference: string;
    successUrl: string;
    failureUrl: string;
    pendingUrl: string;
    notificationUrl?: string;
  }) {
    if (!this.client) {
      throw new InternalServerErrorException('El pago con Mercado Pago no esta configurado en el servidor.');
    }

    const preference = new Preference(this.client);

    return preference.create({
      body: {
        items: [
          {
            id: params.externalReference,
            title: params.title,
            quantity: 1,
            unit_price: params.unitPrice,
            currency_id: this.currency,
          },
        ],
        external_reference: params.externalReference,
        back_urls: {
          success: params.successUrl,
          failure: params.failureUrl,
          pending: params.pendingUrl,
        },
        auto_return: 'approved',
        notification_url: params.notificationUrl,
      },
    });
  }

  async getPayment(paymentId: string) {
    if (!this.client) {
      throw new InternalServerErrorException('El pago con Mercado Pago no esta configurado en el servidor.');
    }

    const payment = new Payment(this.client);
    return payment.get({ id: paymentId });
  }
}
