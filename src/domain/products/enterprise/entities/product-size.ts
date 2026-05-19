import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import type { Optional } from '../../../../core/types/optional';

interface ProductSizeProps {
  productId: UniqueEntityID;
  code: string;
  label: string;
  servingsLabel?: string | null;
  priceDelta: number;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class ProductSize extends Entity<ProductSizeProps> {
  get productId() {
    return this.props.productId;
  }

  get code() {
    return this.props.code;
  }

  get label() {
    return this.props.label;
  }

  get servingsLabel() {
    return this.props.servingsLabel;
  }

  get priceDelta() {
    return this.props.priceDelta;
  }

  get isDefault() {
    return this.props.isDefault;
  }

  get sortOrder() {
    return this.props.sortOrder;
  }

  get isActive() {
    return this.props.isActive;
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

  set productId(productId: UniqueEntityID) {
    this.props.productId = productId;
    this.touch();
  }

  set code(code: string) {
    this.props.code = code;
    this.touch();
  }

  set label(label: string) {
    this.props.label = label;
    this.touch();
  }

  set servingsLabel(servingsLabel: string | null | undefined) {
    this.props.servingsLabel = servingsLabel ?? null;
    this.touch();
  }

  set priceDelta(priceDelta: number) {
    this.props.priceDelta = priceDelta;
    this.touch();
  }

  set isDefault(isDefault: boolean) {
    this.props.isDefault = isDefault;
    this.touch();
  }

  set sortOrder(sortOrder: number) {
    this.props.sortOrder = sortOrder;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  static create(
    props: Optional<
      ProductSizeProps,
      | 'createdAt'
      | 'updatedAt'
      | 'servingsLabel'
      | 'isDefault'
      | 'sortOrder'
      | 'isActive'
    >,
    id?: UniqueEntityID
  ) {
    const productSize = new ProductSize(
      {
        ...props,
        servingsLabel: props.servingsLabel ?? null,
        isDefault: props.isDefault ?? false,
        sortOrder: props.sortOrder ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id
    );

    return productSize;
  }
}
