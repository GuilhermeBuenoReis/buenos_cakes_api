export class CategoryWithSlugNotFoundError extends Error {
  constructor(slug: string) {
    super(`Category with slug "${slug}" does not exist.`);
  }
}
