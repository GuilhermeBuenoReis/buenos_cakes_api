export class CategorySlugAlreadyExistsError extends Error {
  constructor(slug: string) {
    super(`Category with slug "${slug}" already exists.`);
  }
}
