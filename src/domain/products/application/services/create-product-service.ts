import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { Product } from '../../enterprise/entities/product';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { ProductSlugAlreadyExistsError } from '../errors/product-slug-already-exists-error';
import type { CategoriesRepository } from '../repositories/categories-repository';
import type { ProductsRepository } from '../repositories/products-repository';

export interface CreateProductServiceRequest {
  categoryId: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  coverImageUrl?: string | null;
  isActive?: boolean;
}

export type CreateProductServiceResponse = Either<
  CategoryNotFoundError | ProductSlugAlreadyExistsError | UnexpectedError,
  {
    product: Product;
  }
>;

export class CreateProductService {
  constructor(
    private productsRepository: ProductsRepository,
    private categoriesRepository: CategoriesRepository
  ) {}

  async execute({
    categoryId,
    name,
    slug,
    description,
    basePrice,
    coverImageUrl,
    isActive,
  }: CreateProductServiceRequest): Promise<CreateProductServiceResponse> {
    try {
      const category = await this.categoriesRepository.findById(categoryId);

      if (!category) {
        return error(new CategoryNotFoundError(categoryId));
      }

      const existingProductWithSameSlug =
        await this.productsRepository.findBySlug(slug);

      if (existingProductWithSameSlug) {
        return error(new ProductSlugAlreadyExistsError(slug));
      }

      const product = Product.create({
        categoryId: new UniqueEntityID(categoryId),
        name,
        slug,
        description,
        basePrice,
        coverImageUrl,
        isActive,
      });

      await this.productsRepository.create(product);

      return success({
        product,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
