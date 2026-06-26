import type { Product } from '../../../products/enterprise/entities/product';
import type { ProductFillings } from '../../../products/enterprise/entities/product_fillings';
import type { ProductSize } from '../../../products/enterprise/entities/product-size';
import type { OrderItem } from '../../enterprise/entities/order-item';

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateOrderItemUnitPrice(
  product: Product,
  productSize?: ProductSize | null,
  productFilling?: ProductFillings | null
): number {
  const basePrice = product.basePrice;
  const sizeDelta = productSize?.priceDelta ?? 0;
  const fillingDelta = productFilling?.priceDelta ?? 0;

  return roundMoney(basePrice + sizeDelta + fillingDelta);
}

export function calculateOrderItemTotal(
  unitPrice: number,
  quantity: number
): number {
  return roundMoney(unitPrice * quantity);
}

export function recalculateOrderTotals(
  items: OrderItem[],
  deliveryFee: number
): { subtotal: number; total: number } {
  const subtotal = roundMoney(
    items.reduce((accumulator, item) => accumulator + item.total, 0)
  );

  return {
    subtotal,
    total: roundMoney(subtotal + deliveryFee),
  };
}
