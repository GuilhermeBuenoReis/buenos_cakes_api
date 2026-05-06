import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import type { Optional } from '../../../../core/types/optional';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

export enum OrderFulfillmentMethod {
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

interface OrderProps {
  userId: UniqueEntityID;
  status: OrderStatus;
  fulfillmentMethod: OrderFulfillmentMethod;
  deliveryAddressId?: UniqueEntityID | null;
  pickupScheduledAt?: Date | null;
  customerNote?: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class Order extends Entity<OrderProps> {
  get userId() {
    return this.props.userId;
  }

  get status() {
    return this.props.status;
  }

  get fulfillmentMethod() {
    return this.props.fulfillmentMethod;
  }

  get deliveryAddressId() {
    return this.props.deliveryAddressId;
  }

  get pickupScheduledAt() {
    return this.props.pickupScheduledAt;
  }

  get customerNote() {
    return this.props.customerNote;
  }

  get subtotal() {
    return this.props.subtotal;
  }

  get deliveryFee() {
    return this.props.deliveryFee;
  }

  get total() {
    return this.props.total;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set userId(userId: UniqueEntityID) {
    this.props.userId = userId;
    this.touch();
  }

  set status(status: OrderStatus) {
    this.props.status = status;
    this.touch();
  }

  set fulfillmentMethod(fulfillmentMethod: OrderFulfillmentMethod) {
    this.props.fulfillmentMethod = fulfillmentMethod;
    this.touch();
  }

  set deliveryAddressId(deliveryAddressId: UniqueEntityID | null | undefined) {
    this.props.deliveryAddressId = deliveryAddressId ?? null;
    this.touch();
  }

  set pickupScheduledAt(pickupScheduledAt: Date | null | undefined) {
    this.props.pickupScheduledAt = pickupScheduledAt ?? null;
    this.touch();
  }

  set customerNote(customerNote: string | null | undefined) {
    this.props.customerNote = customerNote ?? null;
    this.touch();
  }

  set subtotal(subtotal: number) {
    this.props.subtotal = subtotal;
    this.touch();
  }

  set deliveryFee(deliveryFee: number) {
    this.props.deliveryFee = deliveryFee;
    this.touch();
  }

  set total(total: number) {
    this.props.total = total;
    this.touch();
  }

  static create(
    props: Optional<
      OrderProps,
      | 'createdAt'
      | 'updatedAt'
      | 'status'
      | 'deliveryAddressId'
      | 'pickupScheduledAt'
      | 'customerNote'
      | 'deliveryFee'
    >,
    id?: UniqueEntityID
  ) {
    const order = new Order(
      {
        ...props,
        status: props.status ?? OrderStatus.PENDING,
        deliveryAddressId: props.deliveryAddressId ?? null,
        pickupScheduledAt: props.pickupScheduledAt ?? null,
        customerNote: props.customerNote ?? null,
        deliveryFee: props.deliveryFee ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id
    );

    return order;
  }
}
