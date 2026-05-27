import type {
  PaymentMethod,
  PaymentStatus,
} from '../../enterprise/entities/payment';

export interface CreateCheckoutSessionRequest {
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string | null;
}

export interface CreateCheckoutSessionResponse {
  providerName: string;
  providerSessionId: string;
  checkoutUrl: string;
  providerReferenceId?: string | null;
  providerCustomerId?: string | null;
  providerPaymentMethodId?: string | null;
  providerClientSecret?: string | null;
  providerStatus?: string | null;
  expiresAt?: Date | null;
}

export interface PaymentGatewayWebhookEvent {
  providerName: string;
  paymentId?: string | null;
  method?: PaymentMethod;
  status: Exclude<PaymentStatus, PaymentStatus.PENDING>;
  providerSessionId?: string | null;
  providerReferenceId?: string | null;
  providerCustomerId?: string | null;
  providerPaymentMethodId?: string | null;
  providerStatus?: string | null;
  failureReason?: string | null;
  occurredAt?: Date;
}

export interface PaymentGateway {
  providerName: string;
  createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse>;
}
