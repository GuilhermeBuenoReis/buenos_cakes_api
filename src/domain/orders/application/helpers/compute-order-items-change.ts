import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { ProductFillingNotFoundError } from '../../../products/application/errors/product-filling-not-found-error';
import { ProductNotAvailableError } from '../../../products/application/errors/product-not-available-error';
import { ProductNotFoundError } from '../../../products/application/errors/product-not-found-error';
import { ProductSizeNotFoundError } from '../../../products/application/errors/product-size-not-found-error';
import type { ProductSizesRepository } from '../../../products/application/repositories/product-sizes-repository';
import type { ProductFillingsRepository } from '../../../products/application/repositories/products-fillings-repository';
import type { ProductsRepository } from '../../../products/application/repositories/products-repository';
import type { Order } from '../../enterprise/entities/order';
import { OrderItem } from '../../enterprise/entities/order-item';
import { OrderItemNotFoundError } from '../errors/order-item-not-found-error';
import { OrderMustHaveItemsError } from '../errors/order-must-have-items-error';
import type { OrderItemsRepository } from '../repositories/order-items-repository';
import type { OrdersRepository } from '../repositories/orders-repository';
import {
  calculateOrderItemTotal,
  calculateOrderItemUnitPrice,
  recalculateOrderTotals,
} from './order-item-pricing';

export type OrderChangeAction = 'add' | 'edit' | 'remove';

export interface OrderChangeOperation {
  action: OrderChangeAction;
  orderItemId?: string | null;
  productId?: string | null;
  productSizeId?: string | null;
  productFillingId?: string | null;
  quantity?: number | null;
  note?: string | null;
}

export type ComputeOrderItemsChangeError =
  | OrderItemNotFoundError
  | ProductNotFoundError
  | ProductNotAvailableError
  | ProductSizeNotFoundError
  | ProductFillingNotFoundError
  | OrderMustHaveItemsError;

export interface ComputeOrderItemsChangeResult {
  action: OrderChangeAction;
  targetItem: OrderItem;
  resultingItems: OrderItem[];
  subtotal: number;
  total: number;
}

interface ComputeOrderItemsChangeParams {
  order: Order;
  currentItems: OrderItem[];
  operation: OrderChangeOperation;
  productsRepository: ProductsRepository;
  productSizesRepository: ProductSizesRepository;
  productFillingsRepository: ProductFillingsRepository;
}

export async function computeOrderItemsChange({
  order,
  currentItems,
  operation,
  productsRepository,
  productSizesRepository,
  productFillingsRepository,
}: ComputeOrderItemsChangeParams): Promise<
  Either<ComputeOrderItemsChangeError, ComputeOrderItemsChangeResult>
> {
  if (operation.action === 'remove') {
    const target = findOrderItem(currentItems, operation.orderItemId);

    if (!target) {
      return error(
        new OrderItemNotFoundError(operation.orderItemId ?? 'unknown')
      );
    }

    if (currentItems.length <= 1) {
      return error(new OrderMustHaveItemsError());
    }

    const resultingItems = currentItems.filter(
      (item) => !item.id.equals(target.id)
    );

    return success(buildResult(order, 'remove', target, resultingItems));
  }

  if (operation.action === 'edit') {
    const target = findOrderItem(currentItems, operation.orderItemId);

    if (!target) {
      return error(
        new OrderItemNotFoundError(operation.orderItemId ?? 'unknown')
      );
    }

    const resolvedProductId =
      operation.productId ?? target.productId.toString();
    const resolvedProductSizeId =
      operation.productSizeId !== undefined
        ? operation.productSizeId
        : (target.productSizeId?.toString() ?? null);
    const resolvedProductFillingId =
      operation.productFillingId !== undefined
        ? operation.productFillingId
        : (target.productFillingId?.toString() ?? null);
    const resolvedQuantity = operation.quantity ?? target.quantity;

    const resolved = await resolveProductPricing({
      productId: resolvedProductId,
      productSizeId: resolvedProductSizeId,
      productFillingId: resolvedProductFillingId,
      requireActive: operation.productId !== undefined,
      productsRepository,
      productSizesRepository,
      productFillingsRepository,
    });

    if (resolved.isError()) {
      return error(resolved.value);
    }

    const { unitPrice } = resolved.value;

    target.productId = new UniqueEntityID(resolvedProductId);
    target.productSizeId = resolvedProductSizeId
      ? new UniqueEntityID(resolvedProductSizeId)
      : null;
    target.productFillingId = resolvedProductFillingId
      ? new UniqueEntityID(resolvedProductFillingId)
      : null;
    target.quantity = resolvedQuantity;
    target.unitPrice = unitPrice;
    target.total = calculateOrderItemTotal(unitPrice, resolvedQuantity);
    if (operation.note !== undefined) {
      target.note = operation.note;
    }

    return success(buildResult(order, 'edit', target, currentItems));
  }

  if (!operation.productId) {
    return error(new ProductNotFoundError('unknown'));
  }

  const resolvedQuantity = operation.quantity ?? 1;

  const resolved = await resolveProductPricing({
    productId: operation.productId,
    productSizeId: operation.productSizeId ?? null,
    productFillingId: operation.productFillingId ?? null,
    requireActive: true,
    productsRepository,
    productSizesRepository,
    productFillingsRepository,
  });

  if (resolved.isError()) {
    return error(resolved.value);
  }

  const { unitPrice } = resolved.value;

  const targetItem = OrderItem.create({
    orderId: order.id,
    productId: new UniqueEntityID(operation.productId),
    productSizeId: operation.productSizeId
      ? new UniqueEntityID(operation.productSizeId)
      : null,
    productFillingId: operation.productFillingId
      ? new UniqueEntityID(operation.productFillingId)
      : null,
    quantity: resolvedQuantity,
    unitPrice,
    total: calculateOrderItemTotal(unitPrice, resolvedQuantity),
    note: operation.note ?? null,
  });

  return success(
    buildResult(order, 'add', targetItem, [...currentItems, targetItem])
  );
}

export async function persistOrderItemsChange(
  result: ComputeOrderItemsChangeResult,
  order: Order,
  ordersRepository: OrdersRepository,
  orderItemsRepository: OrderItemsRepository
): Promise<void> {
  if (result.action === 'add') {
    await orderItemsRepository.create(result.targetItem);
  }

  if (result.action === 'edit') {
    await orderItemsRepository.save(result.targetItem);
  }

  if (result.action === 'remove') {
    await orderItemsRepository.delete(result.targetItem);
  }

  order.subtotal = result.subtotal;
  order.total = result.total;

  await ordersRepository.save(order);
}

function buildResult(
  order: Order,
  action: OrderChangeAction,
  targetItem: OrderItem,
  resultingItems: OrderItem[]
): ComputeOrderItemsChangeResult {
  const { subtotal, total } = recalculateOrderTotals(
    resultingItems,
    order.deliveryFee
  );

  return {
    action,
    targetItem,
    resultingItems,
    subtotal,
    total,
  };
}

function findOrderItem(
  items: OrderItem[],
  orderItemId?: string | null
): OrderItem | undefined {
  if (!orderItemId) {
    return undefined;
  }

  return items.find((item) => item.id.toString() === orderItemId);
}

interface ResolveProductPricingParams {
  productId: string;
  productSizeId: string | null;
  productFillingId: string | null;
  requireActive: boolean;
  productsRepository: ProductsRepository;
  productSizesRepository: ProductSizesRepository;
  productFillingsRepository: ProductFillingsRepository;
}

async function resolveProductPricing({
  productId,
  productSizeId,
  productFillingId,
  requireActive,
  productsRepository,
  productSizesRepository,
  productFillingsRepository,
}: ResolveProductPricingParams): Promise<
  Either<
    | ProductNotFoundError
    | ProductNotAvailableError
    | ProductSizeNotFoundError
    | ProductFillingNotFoundError,
    { unitPrice: number }
  >
> {
  const product = await productsRepository.findById(productId);

  if (!product) {
    return error(new ProductNotFoundError(productId));
  }

  if (requireActive && !product.isActive) {
    return error(new ProductNotAvailableError(productId));
  }

  let productSize = null;
  if (productSizeId) {
    productSize = await productSizesRepository.findById(productSizeId);

    if (!productSize?.productId.equals(product.id)) {
      return error(new ProductSizeNotFoundError(productSizeId));
    }
  }

  let productFilling = null;
  if (productFillingId) {
    productFilling = await productFillingsRepository.findById(productFillingId);

    if (!productFilling?.productId.equals(product.id)) {
      return error(new ProductFillingNotFoundError(productFillingId));
    }
  }

  return success({
    unitPrice: calculateOrderItemUnitPrice(
      product,
      productSize,
      productFilling
    ),
  });
}
