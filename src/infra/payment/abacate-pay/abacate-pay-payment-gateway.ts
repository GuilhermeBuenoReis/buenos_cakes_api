import { PaymentGatewayError } from '@/domain/orders/application/errors/payment-gateway-error';
import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  PaymentGateway,
  PaymentGatewayWebhookEvent,
} from '@/domain/orders/application/gateways/payment-gateway';
import {
  PaymentMethod,
  PaymentStatus,
} from '@/domain/orders/enterprise/entities/payment';

type AbacatePayResponse<T> = {
  data?: T | null;
  error?: string | { message?: string } | null;
  success?: boolean | { message?: string } | null;
};

type AbacatePayProductResponse = {
  id?: string | null;
};

type AbacatePayCheckoutResponse = {
  id?: string | null;
  externalId?: string | null;
  url?: string | null;
  status?: string | null;
  customerId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type AbacatePayCheckoutWebhookPayload = {
  event?: string | null;
  data?: {
    checkout?: {
      id?: string | null;
      externalId?: string | null;
      status?: string | null;
      methods?: string[] | null;
      customerId?: string | null;
      createdAt?: string | null;
      updatedAt?: string | null;
    } | null;
    payerInformation?: {
      method?: string | null;
      CARD?: {
        brand?: string | null;
      } | null;
    } | null;
    reason?: string | null;
  } | null;
};

export interface AbacatePayPaymentGatewayConfig {
  apiKey?: string;
  baseUrl: string;
  returnUrl: string;
  completionUrl: string;
}

export class AbacatePayPaymentGateway implements PaymentGateway {
  public providerName = 'abacate_pay';

  private config: Omit<Required<AbacatePayPaymentGatewayConfig>, 'apiKey'> & {
    apiKey?: string;
  };

  constructor(config: AbacatePayPaymentGatewayConfig) {
    this.config = {
      ...config,
      apiKey: config.apiKey?.trim(),
      baseUrl: this.trimTrailingSlash(config.baseUrl),
    };
  }

  async createCheckoutSession({
    orderId,
    paymentId,
    amount,
    currency,
    successUrl,
    cancelUrl,
    customerEmail,
  }: CreateCheckoutSessionRequest): Promise<CreateCheckoutSessionResponse> {
    const product = await this.createProduct({
      orderId,
      paymentId,
      amount,
      currency,
    });

    if (!product.id) {
      throw new PaymentGatewayError('AbacatePay product did not return an ID.');
    }

    const checkout = await this.request<AbacatePayCheckoutResponse>(
      '/checkouts/create',
      {
        method: 'POST',
        body: {
          items: [
            {
              id: product.id,
              quantity: 1,
            },
          ],
          methods: ['PIX', 'CARD'],
          externalId: paymentId,
          returnUrl: cancelUrl ?? this.config.returnUrl,
          completionUrl: successUrl ?? this.config.completionUrl,
          metadata: {
            orderId,
            paymentId,
            ...(customerEmail ? { customerEmail } : {}),
          },
        },
      }
    );

    if (!checkout.id) {
      throw new PaymentGatewayError(
        'AbacatePay checkout did not return an ID.'
      );
    }

    if (!checkout.url) {
      throw new PaymentGatewayError(
        'AbacatePay checkout did not return a checkout URL.'
      );
    }

    return {
      providerName: this.providerName,
      providerSessionId: checkout.id,
      checkoutUrl: checkout.url,
      providerCustomerId: checkout.customerId,
      providerStatus: checkout.status ?? 'PENDING',
    };
  }

  async parseWebhookEvent(
    payload: unknown
  ): Promise<PaymentGatewayWebhookEvent | null> {
    if (!this.isCheckoutWebhookPayload(payload)) {
      return null;
    }

    const eventName = this.toString(payload.event);
    const checkout = payload.data?.checkout;

    if (!eventName?.startsWith('checkout.') || !checkout?.id) {
      return null;
    }

    const status = this.toPaymentStatus(eventName, checkout.status);

    if (!status) {
      return null;
    }

    return {
      providerName: this.providerName,
      paymentId: this.toString(checkout.externalId),
      method: this.toPaymentMethod(
        payload.data?.payerInformation?.method ?? checkout.methods?.[0]
      ),
      providerSessionId: this.toString(checkout.id),
      providerReferenceId: this.toString(checkout.id),
      providerCustomerId: this.toString(checkout.customerId),
      providerPaymentMethodId: this.toProviderPaymentMethodId(payload),
      status,
      providerStatus: this.toString(checkout.status) ?? eventName,
      failureReason:
        status === PaymentStatus.FAILED
          ? (this.toString(payload.data?.reason) ?? eventName)
          : undefined,
      occurredAt: this.toDate(checkout.updatedAt ?? checkout.createdAt),
    };
  }

  private async createProduct({
    orderId,
    paymentId,
    amount,
    currency,
  }: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
  }) {
    return this.request<AbacatePayProductResponse>('/products/create', {
      method: 'POST',
      body: {
        externalId: paymentId,
        name: `Pedido ${orderId}`,
        description: `Pedido ${orderId}`,
        price: this.toCents(amount),
        currency: currency.toUpperCase(),
      },
    });
  }

  private async request<T>(
    path: string,
    options: {
      method: 'GET' | 'POST';
      body?: unknown;
    }
  ): Promise<T> {
    let response: Response;

    if (!this.config.apiKey) {
      throw new PaymentGatewayError(
        'ABACATE_PAY_API_KEY is required to use AbacatePay payments.'
      );
    }

    try {
      response = await fetch(`${this.config.baseUrl}${path}`, {
        method: options.method,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      throw new PaymentGatewayError('AbacatePay request failed.');
    }

    const responseBody = (await response
      .json()
      .catch(() => null)) as AbacatePayResponse<T> | null;

    if (!response.ok || responseBody?.success === false) {
      throw new PaymentGatewayError(this.toErrorMessage(responseBody));
    }

    if (!responseBody?.data) {
      throw new PaymentGatewayError('AbacatePay response did not return data.');
    }

    return responseBody.data;
  }

  private isCheckoutWebhookPayload(
    payload: unknown
  ): payload is AbacatePayCheckoutWebhookPayload {
    return typeof payload === 'object' && payload !== null;
  }

  private toPaymentStatus(eventName: string, status?: string | null) {
    if (eventName === 'checkout.completed') {
      return PaymentStatus.PAID;
    }

    if (eventName === 'checkout.refunded') {
      return PaymentStatus.REFUNDED;
    }

    if (eventName === 'checkout.disputed' || eventName === 'checkout.lost') {
      return PaymentStatus.FAILED;
    }

    const normalizedStatus = status?.toUpperCase();

    if (normalizedStatus === 'PAID') {
      return PaymentStatus.PAID;
    }

    if (normalizedStatus === 'PENDING') {
      return PaymentStatus.PROCESSING;
    }

    if (normalizedStatus === 'REFUNDED') {
      return PaymentStatus.REFUNDED;
    }

    if (
      normalizedStatus === 'CANCELED' ||
      normalizedStatus === 'CANCELLED' ||
      normalizedStatus === 'EXPIRED'
    ) {
      return PaymentStatus.CANCELED;
    }

    if (normalizedStatus === 'FAILED') {
      return PaymentStatus.FAILED;
    }

    return null;
  }

  private toPaymentMethod(method?: string | null) {
    const normalizedMethod = method?.toUpperCase();

    if (normalizedMethod === 'PIX') {
      return PaymentMethod.PIX;
    }

    if (normalizedMethod === 'CARD' || normalizedMethod === 'CREDIT_CARD') {
      return PaymentMethod.CREDIT_CARD;
    }

    if (normalizedMethod === 'DEBIT_CARD') {
      return PaymentMethod.DEBIT_CARD;
    }

    return undefined;
  }

  private toProviderPaymentMethodId(payload: AbacatePayCheckoutWebhookPayload) {
    const payerInformation = payload.data?.payerInformation;
    const method = this.toString(payerInformation?.method);

    if (!method) {
      return undefined;
    }

    if (method.toUpperCase() === 'CARD') {
      return this.toString(payerInformation?.CARD?.brand) ?? method;
    }

    return method;
  }

  private toCents(amount: number) {
    return Math.round(amount * 100);
  }

  private toDate(date?: string | null) {
    if (!date) {
      return undefined;
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return undefined;
    }

    return parsedDate;
  }

  private toString(value: unknown) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return null;
  }

  private toErrorMessage(responseBody: AbacatePayResponse<unknown> | null) {
    if (typeof responseBody?.error === 'string') {
      return responseBody.error;
    }

    if (responseBody?.error?.message) {
      return responseBody.error.message;
    }

    return 'AbacatePay request failed.';
  }

  private trimTrailingSlash(url: string) {
    return url.replace(/\/+$/, '');
  }
}
