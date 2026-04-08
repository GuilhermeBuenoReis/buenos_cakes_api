import type { Optional } from '../../../../core/types/optional';
import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';

interface ProductProps {
  categoryId: UniqueEntityID;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  coverImageUrl?: string | null;
  ratingAvg: number;
  reviewsCount: number;
  popularityScore: number;
  isActive: boolean;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class Product extends Entity<ProductProps> {
  get categoryId() {
    return this.props.categoryId;
  }

  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get basePrice() {
    return this.props.basePrice;
  }

  get coverImageUrl() {
    return this.props.coverImageUrl;
  }

  get ratingAvg() {
    return this.props.ratingAvg;
  }

  get reviewsCount() {
    return this.props.reviewsCount;
  }

  get popularityScore() {
    return this.props.popularityScore;
  }

  get isActive() {
    return this.props.isActive;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  set categoryId(categoryId: UniqueEntityID) {
    this.props.categoryId = categoryId;
    this.touch();
  }

  set name(name: string) {
    this.props.name = name;
    this.touch();
  }

  set slug(slug: string) {
    this.props.slug = slug;
    this.touch();
  }

  set description(description: string | null | undefined) {
    this.props.description = description ?? null;
    this.touch();
  }

  set basePrice(basePrice: number) {
    this.props.basePrice = basePrice;
    this.touch();
  }

  set coverImageUrl(coverImageUrl: string | null | undefined) {
    this.props.coverImageUrl = coverImageUrl ?? null;
    this.touch();
  }

  set ratingAvg(ratingAvg: number) {
    this.props.ratingAvg = ratingAvg;
    this.touch();
  }

  set reviewsCount(reviewsCount: number) {
    this.props.reviewsCount = reviewsCount;
    this.touch();
  }

  set popularityScore(popularityScore: number) {
    this.props.popularityScore = popularityScore;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  static create(
    props: Optional<
      ProductProps,
      | 'createdAt'
      | 'description'
      | 'coverImageUrl'
      | 'ratingAvg'
      | 'reviewsCount'
      | 'popularityScore'
      | 'isActive'
    >,
    id?: UniqueEntityID
  ) {
    const product = new Product(
      {
        ...props,
        description: props.description ?? null,
        coverImageUrl: props.coverImageUrl ?? null,
        ratingAvg: props.ratingAvg ?? 0,
        reviewsCount: props.reviewsCount ?? 0,
        popularityScore: props.popularityScore ?? 0,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return product;
  }
}
