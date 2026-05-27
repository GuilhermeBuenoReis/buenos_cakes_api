export class PaymentGatewayError extends Error {
  constructor(message = 'Payment provider request failed.') {
    super(message);
  }
}
