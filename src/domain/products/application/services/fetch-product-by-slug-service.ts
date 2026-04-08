import { type Either, error, success } from '../../../../core/either';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import type { Product } from '../../enterprise/entities/product';
import { ProductWithSlugNotFoundError } from '../errors/product-with-slug-not-found-error';
import type { ProductsRepository } from '../repositories/products-repository';

export interface FetchProductBySlugServiceRequest {
  slug: string;
}

export type FetchProductBySlugServiceResponse = Either<
  ProductWithSlugNotFoundError | UnexpectedError,
  {
    product: Product;
  }
>;

export class FetchProductBySlugService {
  constructor(private productsRepository: ProductsRepository) {}

  async execute({
    slug,
  }: FetchProductBySlugServiceRequest): Promise<FetchProductBySlugServiceResponse> {
    try {
      const product = await this.productsRepository.findBySlug(slug);

      if (!product) {
        return error(new ProductWithSlugNotFoundError(slug));
      }

      return success({
        product,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
