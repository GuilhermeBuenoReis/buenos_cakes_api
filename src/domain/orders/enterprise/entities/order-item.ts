import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import type { Optional } from '../../../../core/types/optional';

interface OrderItemProps {
  orderId: UniqueEntityID;
  productId: UniqueEntityID;
  productSizeId?: UniqueEntityID | null;
  productFillingId?: UniqueEntityID | null;
  quantity: number;
  unitPrice: number;
  total: number;
  note?: string | null;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class OrderItem extends Entity<OrderItemProps> {
  get orderId() {
    return this.props.orderId;
  }

  get productId() {
    return this.props.productId;
  }

  get productSizeId() {
    return this.props.productSizeId;
  }

  get productFillingId() {
    return this.props.productFillingId;
  }

  get quantity() {
    return this.props.quantity;
  }

  get unitPrice() {
    return this.props.unitPrice;
  }

  get total() {
    return this.props.total;
  }

  get note() {
    return this.props.note;
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

  set orderId(orderId: UniqueEntityID) {
    this.props.orderId = orderId;
    this.touch();
  }

  set productId(productId: UniqueEntityID) {
    this.props.productId = productId;
    this.touch();
  }

  set productSizeId(productSizeId: UniqueEntityID | null | undefined) {
    this.props.productSizeId = productSizeId ?? null;
    this.touch();
  }

  set productFillingId(productFillingId: UniqueEntityID | null | undefined) {
    this.props.productFillingId = productFillingId ?? null;
    this.touch();
  }

  set quantity(quantity: number) {
    this.props.quantity = quantity;
    this.touch();
  }

  set unitPrice(unitPrice: number) {
    this.props.unitPrice = unitPrice;
    this.touch();
  }

  set total(total: number) {
    this.props.total = total;
    this.touch();
  }

  set note(note: string | null | undefined) {
    this.props.note = note ?? null;
    this.touch();
  }

  static create(
    props: Optional<
      OrderItemProps,
      | 'createdAt'
      | 'updatedAt'
      | 'productSizeId'
      | 'productFillingId'
      | 'note'
    >,
    id?: UniqueEntityID
  ) {
    const orderItem = new OrderItem(
      {
        ...props,
        productSizeId: props.productSizeId ?? null,
        productFillingId: props.productFillingId ?? null,
        note: props.note ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id
    );

    return orderItem;
  }
}
