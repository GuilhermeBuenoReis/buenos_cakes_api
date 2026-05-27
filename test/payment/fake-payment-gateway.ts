import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  PaymentGateway,
} from '../../src/domain/orders/application/gateways/payment-gateway';

export class FakePaymentGateway implements PaymentGateway {
  public providerName = 'abacate_pay';
  public requests: CreateCheckoutSessionRequest[] = [];

  async createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    this.requests.push(request);

    return {
      providerName: this.providerName,
      providerSessionId: 'abacate-pay-checkout-1',
      providerReferenceId: 'abacate-pay-checkout-1',
      providerCustomerId: 'customer-1',
      providerPaymentMethodId: 'visa',
      providerClientSecret: 'client-secret-1',
      providerStatus: 'PENDING',
      checkoutUrl:
        'https://app.abacatepay.com/pay/abacate-pay-checkout-1',
      expiresAt: new Date('2026-01-01T10:30:00.000Z'),
    };
  }
}
