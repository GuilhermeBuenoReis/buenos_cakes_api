export class ProductFillingLabelAlreadyExistsError extends Error {
  constructor(label: string) {
    super(`Product filling with label "${label}" already exists for this product.`);
  }
}
