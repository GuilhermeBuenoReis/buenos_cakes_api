export class ProductSizeCodeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`Product size with code "${code}" already exists for this product.`);
  }
}
