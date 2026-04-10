import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { ProductSlugAlreadyExistsError } from '../errors/product-slug-already-exists-error';
import type { CategoriesRepository } from '../repositories/categories-repository';
import type { ProductsRepository } from '../repositories/products-repository';

export interface UpdateProductServiceRequest {
  productId: string;
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  basePrice?: number;
  coverImageUrl?: string | null;
  isActive?: boolean;
}

export type UpdateProductServiceResponse = Either<
  | ProductNotFoundError
  | CategoryNotFoundError
  | ProductSlugAlreadyExistsError
  | UnexpectedError,
  {
    product: Product;
  }
>;

export class UpdateProductService {
  constructor(
    private productsRepository: ProductsRepository,
    private categoriesRepository: CategoriesRepository
  ) {}

  async execute({
    productId,
    categoryId,
    name,
    slug,
    description,
    basePrice,
    coverImageUrl,
    isActive,
  }: UpdateProductServiceRequest): Promise<UpdateProductServiceResponse> {
    try {
      const product = await this.productsRepository.findById(productId);

      if (!product) {
        return error(new ProductNotFoundError(productId));
      }

      const isCategoryBeingChanged =
        categoryId && categoryId !== product.categoryId.toString();

      if (isCategoryBeingChanged) {
        const category = await this.categoriesRepository.findById(categoryId);

        if (!category) {
          return error(new CategoryNotFoundError(categoryId));
        }
      }

      const isSlugBeingChanged = slug && slug !== product.slug;

      if (isSlugBeingChanged) {
        const productWithSameSlug =
          await this.productsRepository.findBySlug(slug);

        const slugAlreadyInUseByAnotherProduct =
          productWithSameSlug && !productWithSameSlug.id.equals(product.id);

        if (slugAlreadyInUseByAnotherProduct) {
          return error(new ProductSlugAlreadyExistsError(slug));
        }
      }

      const fieldsToUpdate = {
        categoryId,
        name,
        slug,
        description,
        basePrice,
        coverImageUrl,
        isActive,
      };

      if (fieldsToUpdate.categoryId !== undefined) {
        product.categoryId = new UniqueEntityID(fieldsToUpdate.categoryId);
      }
      if (fieldsToUpdate.name !== undefined) product.name = fieldsToUpdate.name;
      if (fieldsToUpdate.slug !== undefined) product.slug = fieldsToUpdate.slug;
      if (fieldsToUpdate.description !== undefined) {
        product.description = fieldsToUpdate.description;
      }
      if (fieldsToUpdate.basePrice !== undefined) {
        product.basePrice = fieldsToUpdate.basePrice;
      }
      if (fieldsToUpdate.coverImageUrl !== undefined) {
        product.coverImageUrl = fieldsToUpdate.coverImageUrl;
      }
      if (fieldsToUpdate.isActive !== undefined) {
        product.isActive = fieldsToUpdate.isActive;
      }

      await this.productsRepository.save(product);

      return success({
        product,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
