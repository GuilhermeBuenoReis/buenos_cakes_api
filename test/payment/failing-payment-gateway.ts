import type {
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  PaymentGateway,
} from '../../src/domain/orders/application/gateways/payment-gateway';

export class FailingPaymentGateway implements PaymentGateway {
  public providerName = 'abacate_pay';

  async createCheckoutSession(
    _request: CreateCheckoutSessionRequest
  ): Promise<CreateCheckoutSessionResponse> {
    throw new Error('Unexpected payment gateway error.');
  }
}
