export class ProductFillingNotFoundError extends Error {
  constructor(id: string) {
    super(`Product filling with id "${id}" does not exist.`);
  }
}
