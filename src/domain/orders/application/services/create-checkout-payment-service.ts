import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { Payment, PaymentProvider } from '../../enterprise/entities/payment';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import { PaymentGatewayError } from '../errors/payment-gateway-error';
import type { PaymentGateway } from '../gateways/payment-gateway';
import type { OrdersRepository } from '../repositories/orders-repository';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface CreateCheckoutPaymentServiceRequest {
  orderId: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string | null;
}

export type CreateCheckoutPaymentServiceResponse = Either<
  OrderNotFoundError | PaymentGatewayError | UnexpectedError,
  {
    payment: Payment;
    checkoutUrl: string;
  }
>;

export class CreateCheckoutPaymentService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private ordersRepository: OrdersRepository,
    private paymentGateway: PaymentGateway
  ) {}

  async execute({
    orderId,
    successUrl,
    cancelUrl,
    customerEmail,
  }: CreateCheckoutPaymentServiceRequest): Promise<CreateCheckoutPaymentServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        return error(new OrderNotFoundError(orderId));
      }

      const payment = Payment.create({
        orderId: order.id,
        provider: PaymentProvider.EXTERNAL,
        amount: order.total,
        currency: 'brl',
        providerName: this.paymentGateway.providerName,
      });

      const checkoutSession = await this.paymentGateway.createCheckoutSession({
        orderId: order.id.toString(),
        paymentId: payment.id.toString(),
        amount: payment.amount,
        currency: payment.currency,
        successUrl,
        cancelUrl,
        customerEmail,
      });

      payment.providerName = checkoutSession.providerName;
      payment.providerSessionId = checkoutSession.providerSessionId;
      payment.providerReferenceId = checkoutSession.providerReferenceId;
      payment.providerCustomerId = checkoutSession.providerCustomerId;
      payment.providerPaymentMethodId = checkoutSession.providerPaymentMethodId;
      payment.providerClientSecret = checkoutSession.providerClientSecret;
      payment.expiresAt = checkoutSession.expiresAt;
      payment.markAsProcessing(checkoutSession.providerStatus);

      await this.paymentsRepository.create(payment);

      return success({
        payment,
        checkoutUrl: checkoutSession.checkoutUrl,
      });
    } catch (err) {
      if (err instanceof PaymentGatewayError) {
        return error(err);
      }

      return error(new UnexpectedError());
    }
  }
}
