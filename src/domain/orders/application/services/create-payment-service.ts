import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import {
  Payment,
  type PaymentMethod,
  type PaymentProvider,
  type PaymentStatus,
} from '../../enterprise/entities/payment';
import { OrderNotFoundError } from '../errors/order-not-found-error';
import type { OrdersRepository } from '../repositories/orders-repository';
import type { PaymentsRepository } from '../repositories/payments-repository';

export interface CreatePaymentServiceRequest {
  orderId: string;
  method: PaymentMethod;
  provider?: PaymentProvider;
  status?: PaymentStatus;
  amount: number;
  currency?: string;
  providerName?: string | null;
  providerReferenceId?: string | null;
  providerSessionId?: string | null;
  providerCustomerId?: string | null;
  providerPaymentMethodId?: string | null;
  providerClientSecret?: string | null;
  providerStatus?: string | null;
  pixQrCode?: string | null;
  pixQrCodeUrl?: string | null;
  expiresAt?: Date | null;
}

export type CreatePaymentServiceResponse = Either<
  OrderNotFoundError | UnexpectedError,
  {
    payment: Payment;
  }
>;

export class CreatePaymentService {
  constructor(
    private paymentsRepository: PaymentsRepository,
    private ordersRepository: OrdersRepository
  ) {}

  async execute({
    orderId,
    method,
    provider,
    status,
    amount,
    currency,
    providerName,
    providerReferenceId,
    providerSessionId,
    providerCustomerId,
    providerPaymentMethodId,
    providerClientSecret,
    providerStatus,
    pixQrCode,
    pixQrCodeUrl,
    expiresAt,
  }: CreatePaymentServiceRequest): Promise<CreatePaymentServiceResponse> {
    try {
      const order = await this.ordersRepository.findById(orderId);

      if (!order) {
        return error(new OrderNotFoundError(orderId));
      }

      const payment = Payment.create({
        orderId: new UniqueEntityID(orderId),
        method,
        provider,
        status,
        amount,
        currency,
        providerName,
        providerReferenceId,
        providerSessionId,
        providerCustomerId,
        providerPaymentMethodId,
        providerClientSecret,
        providerStatus,
        pixQrCode,
        pixQrCodeUrl,
        expiresAt,
      });

      await this.paymentsRepository.create(payment);

      return success({
        payment,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
