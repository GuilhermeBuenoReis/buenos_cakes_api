import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { ProductSlugAlreadyExistsError } from '../errors/product-slug-already-exists-error';
import { CreateProductService } from './create-product-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingProductsRepository: FailingProductsRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: CreateProductService;

describe('CreateProductService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingProductsRepository = new FailingProductsRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new CreateProductService(
      inMemoryProductsRepository,
      inMemoryCategoriesRepository
    );
  });

  it('should create a product', async () => {
    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    const result = await sut.execute({
      categoryId: category.id.toString(),
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
      description: 'Rich chocolate cake.',
      basePrice: 89.9,
      coverImageUrl: 'https://example.com/chocolate-cake.png',
    });

    expect(result.isSuccess()).toBe(true);
    expect(inMemoryProductsRepository.items).toHaveLength(1);

    if (result.isSuccess()) {
      expect(result.value.product.name).toBe('Chocolate Cake');
      expect(result.value.product.slug).toBe('chocolate-cake');
      expect(result.value.product.basePrice).toBe(89.9);
      expect(result.value.product.categoryId.toString()).toBe(
        category.id.toString()
      );
      expect(result.value.product.isActive).toBe(true);
    }
  });

  it('should not create a product when category does not exist', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-category-id',
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
      basePrice: 89.9,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategoryNotFoundError);
    }
  });

  it('should not create a product with the same slug twice', async () => {
    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    await sut.execute({
      categoryId: category.id.toString(),
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
      basePrice: 89.9,
    });

    const result = await sut.execute({
      categoryId: category.id.toString(),
      name: 'Party Cake',
      slug: 'chocolate-cake',
      basePrice: 99.9,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSlugAlreadyExistsError);
    }
  });

  it('should return an unexpected error when products repository fails', async () => {
    sut = new CreateProductService(
      failingProductsRepository,
      inMemoryCategoriesRepository
    );

    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    const result = await sut.execute({
      categoryId: category.id.toString(),
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
      basePrice: 89.9,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });

  it('should return an unexpected error when categories repository fails', async () => {
    sut = new CreateProductService(
      inMemoryProductsRepository,
      failingCategoriesRepository
    );

    const result = await sut.execute({
      categoryId: 'category-1',
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
      basePrice: 89.9,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(UnexpectedError);
      expect(result.value.message).toBe(
        'Something went wrong. Please try again later.'
      );
    }
  });
});
