export class ProductWithSlugNotFoundError extends Error {
  constructor(slug: string) {
    super(`Product with slug "${slug}" does not exist.`);
  }
}
