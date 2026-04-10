import { type Either, error, success } from '../../../../core/either';
import { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { ProductSize } from '../../enterprise/entities/product-size';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { ProductSizeCodeAlreadyExistsError } from '../errors/product-size-code-already-exists-error';
import { ProductSizeDefaultHelper } from '../helpers/product-size-default-helper';
import type { ProductsRepository } from '../repositories/products-repository';
import type { ProductSizesRepository } from '../repositories/product-sizes-repository';

export interface CreateProductSizeServiceRequest {
  productId: string;
  code: string;
  label: string;
  servingsLabel?: string | null;
  priceDelta: number;
  isDefault?: boolean;
  sortOrder?: number;
  isActive?: boolean;
}

export type CreateProductSizeServiceResponse = Either<
  ProductNotFoundError | ProductSizeCodeAlreadyExistsError | UnexpectedError,
  {
    productSize: ProductSize;
  }
>;

export class CreateProductSizeService {
  private productSizeDefaultHelper: ProductSizeDefaultHelper;

  constructor(
    private productsRepository: ProductsRepository,
    private productSizesRepository: ProductSizesRepository
  ) {
    this.productSizeDefaultHelper = new ProductSizeDefaultHelper(
      productSizesRepository
    );
  }

  async execute({
    productId,
    code,
    label,
    servingsLabel,
    priceDelta,
    isDefault,
    sortOrder,
    isActive,
  }: CreateProductSizeServiceRequest): Promise<CreateProductSizeServiceResponse> {
    try {
      const product = await this.productsRepository.findById(productId);

      if (!product) {
        return error(new ProductNotFoundError(productId));
      }

      const existingProductSizeWithSameCode =
        await this.productSizesRepository.findByCodeAndProductId(code, productId);

      if (existingProductSizeWithSameCode) {
        return error(new ProductSizeCodeAlreadyExistsError(code));
      }

      const newProductSizeShouldBeDefault =
        await this.productSizeDefaultHelper.resolveCreateDefaultStatus(
          productId,
          isDefault
        );

      const productSize = ProductSize.create({
        productId: new UniqueEntityID(productId),
        code,
        label,
        servingsLabel,
        priceDelta,
        isDefault: newProductSizeShouldBeDefault,
        sortOrder,
        isActive,
      });

      await this.productSizesRepository.create(productSize);

      return success({
        productSize,
      });
    } catch {
      return error(new UnexpectedError());
    }
  }
}
