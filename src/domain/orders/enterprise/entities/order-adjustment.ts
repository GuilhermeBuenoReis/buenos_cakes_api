import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import type { Optional } from '../../../../core/types/optional';

export enum OrderAdjustmentType {
  ADDITIONAL_PAYMENT = 'additional_payment',
  REFUND = 'refund',
}

export enum OrderAdjustmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELED = 'canceled',
}

export interface OrderChangeOperationSnapshot {
  action: 'add' | 'edit' | 'remove';
  orderItemId?: string | null;
  productId?: string | null;
  productSizeId?: string | null;
  productFillingId?: string | null;
  quantity?: number | null;
  note?: string | null;
}

interface OrderAdjustmentProps {
  orderId: UniqueEntityID;
  requestedByUserId: UniqueEntityID;
  type: OrderAdjustmentType;
  status: OrderAdjustmentStatus;
  previousTotal: number;
  newTotal: number;
  difference: number;
  paymentId?: UniqueEntityID | null;
  operation: OrderChangeOperationSnapshot;
  reason?: string | null;

  createdAt: Date;
  confirmedAt?: Date | null;
  updatedAt?: Date | null;
}

export class OrderAdjustment extends Entity<OrderAdjustmentProps> {
  get orderId() {
    return this.props.orderId;
  }

  get requestedByUserId() {
    return this.props.requestedByUserId;
  }

  get type() {
    return this.props.type;
  }

  get status() {
    return this.props.status;
  }

  get previousTotal() {
    return this.props.previousTotal;
  }

  get newTotal() {
    return this.props.newTotal;
  }

  get difference() {
    return this.props.difference;
  }

  get paymentId() {
    return this.props.paymentId;
  }

  get operation() {
    return this.props.operation;
  }

  get reason() {
    return this.props.reason;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get confirmedAt() {
    return this.props.confirmedAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set paymentId(paymentId: UniqueEntityID | null | undefined) {
    this.props.paymentId = paymentId ?? null;
    this.touch();
  }

  set reason(reason: string | null | undefined) {
    this.props.reason = reason ?? null;
    this.touch();
  }

  markAsConfirmed(confirmedAt = new Date()) {
    this.props.status = OrderAdjustmentStatus.CONFIRMED;
    this.props.confirmedAt = confirmedAt;
    this.touch();
  }

  markAsCanceled(reason?: string | null) {
    this.props.status = OrderAdjustmentStatus.CANCELED;
    this.props.reason = reason ?? this.props.reason ?? null;
    this.touch();
  }

  static create(
    props: Optional<
      OrderAdjustmentProps,
      | 'status'
      | 'paymentId'
      | 'reason'
      | 'createdAt'
      | 'confirmedAt'
      | 'updatedAt'
    >,
    id?: UniqueEntityID
  ) {
    const orderAdjustment = new OrderAdjustment(
      {
        ...props,
        status: props.status ?? OrderAdjustmentStatus.PENDING,
        paymentId: props.paymentId ?? null,
        reason: props.reason ?? null,
        createdAt: props.createdAt ?? new Date(),
        confirmedAt: props.confirmedAt ?? null,
        updatedAt: props.updatedAt ?? null,
      },
      id
    );

    return orderAdjustment;
  }
}
