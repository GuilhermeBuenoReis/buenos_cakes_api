import { beforeEach, describe, expect, it } from 'vitest';
import { makeCategory } from '../../../../../test/factories/make-category';
import { makeProduct } from '../../../../../test/factories/make-product';
import { FailingCategoriesRepository } from '../../../../../test/repositories/failures/failing-categories-repository';
import { FailingProductsRepository } from '../../../../../test/repositories/failures/failing-products-repository';
import { InMemoryCategoriesRepository } from '../../../../../test/repositories/in-memory-categories-repository';
import { InMemoryProductsRepository } from '../../../../../test/repositories/in-memory-products-repository';
import { UnexpectedError } from '../../../../core/errors/unexpected-error';
import { CategoryNotFoundError } from '../errors/category-not-found-error';
import { ProductNotFoundError } from '../errors/product-not-found-error';
import { ProductSlugAlreadyExistsError } from '../errors/product-slug-already-exists-error';
import { UpdateProductService } from './update-product-service';

let inMemoryProductsRepository: InMemoryProductsRepository;
let inMemoryCategoriesRepository: InMemoryCategoriesRepository;
let failingProductsRepository: FailingProductsRepository;
let failingCategoriesRepository: FailingCategoriesRepository;
let sut: UpdateProductService;

describe('UpdateProductService', () => {
  beforeEach(() => {
    inMemoryProductsRepository = new InMemoryProductsRepository();
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository();
    failingProductsRepository = new FailingProductsRepository();
    failingCategoriesRepository = new FailingCategoriesRepository();
    sut = new UpdateProductService(
      inMemoryProductsRepository,
      inMemoryCategoriesRepository
    );
  });

  it('should update a product', async () => {
    const oldCategory = makeCategory();
    const newCategory = makeCategory();

    await inMemoryCategoriesRepository.create(oldCategory);
    await inMemoryCategoriesRepository.create(newCategory);

    const product = makeProduct({
      categoryId: oldCategory.id,
      name: 'Chocolate Cake',
      slug: 'chocolate-cake',
      description: 'Old description',
      basePrice: 89.9,
      coverImageUrl: 'https://example.com/old-image.png',
      isActive: true,
    });

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      productId: product.id.toString(),
      categoryId: newCategory.id.toString(),
      name: 'Vanilla Cake',
      slug: 'vanilla-cake',
      description: null,
      basePrice: 99.9,
      coverImageUrl: 'https://example.com/new-image.png',
      isActive: false,
    });

    expect(result.isSuccess()).toBe(true);

    if (result.isSuccess()) {
      expect(result.value.product.categoryId.toString()).toBe(
        newCategory.id.toString()
      );
      expect(result.value.product.name).toBe('Vanilla Cake');
      expect(result.value.product.slug).toBe('vanilla-cake');
      expect(result.value.product.description).toBeNull();
      expect(result.value.product.basePrice).toBe(99.9);
      expect(result.value.product.coverImageUrl).toBe(
        'https://example.com/new-image.png'
      );
      expect(result.value.product.isActive).toBe(false);
      expect(result.value.product.updatedAt).toBeInstanceOf(Date);
    }
  });

  it('should not update a product when it does not exist', async () => {
    const result = await sut.execute({
      productId: 'non-existing-product-id',
      name: 'Vanilla Cake',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductNotFoundError);
    }
  });

  it('should not update a product when category does not exist', async () => {
    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    const product = makeProduct({
      categoryId: category.id,
    });

    await inMemoryProductsRepository.create(product);

    const result = await sut.execute({
      productId: product.id.toString(),
      categoryId: 'non-existing-category-id',
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(CategoryNotFoundError);
    }
  });

  it('should not update a product with a slug that is already in use', async () => {
    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    const product = makeProduct({
      categoryId: category.id,
      slug: 'chocolate-cake',
    });

    const anotherProduct = makeProduct({
      categoryId: category.id,
      slug: 'vanilla-cake',
    });

    await inMemoryProductsRepository.create(product);
    await inMemoryProductsRepository.create(anotherProduct);

    const result = await sut.execute({
      productId: product.id.toString(),
      slug: anotherProduct.slug,
    });

    expect(result.isError()).toBe(true);

    if (result.isError()) {
      expect(result.value).toBeInstanceOf(ProductSlugAlreadyExistsError);
    }
  });

  it('should return an unexpected error when products repository fails', async () => {
    sut = new UpdateProductService(
      failingProductsRepository,
      inMemoryCategoriesRepository
    );

    const result = await sut.execute({
      productId: 'product-1',
      name: 'Vanilla Cake',
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
    const category = makeCategory();

    await inMemoryCategoriesRepository.create(category);

    const product = makeProduct({
      categoryId: category.id,
    });

    await inMemoryProductsRepository.create(product);

    sut = new UpdateProductService(
      inMemoryProductsRepository,
      failingCategoriesRepository
    );

    const result = await sut.execute({
      productId: product.id.toString(),
      categoryId: 'category-2',
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
