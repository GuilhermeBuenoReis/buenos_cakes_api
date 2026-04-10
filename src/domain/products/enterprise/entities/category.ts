import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';
import type { Optional } from '../../../../core/types/optional';

interface CategoryProps {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class Category extends Entity<CategoryProps> {
  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get imageUrl() {
    return this.props.imageUrl;
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

  set imageUrl(imageUrl: string | null | undefined) {
    this.props.imageUrl = imageUrl ?? null;
    this.touch();
  }

  set isActive(isActive: boolean) {
    this.props.isActive = isActive;
    this.touch();
  }

  static create(
    props: Optional<
      CategoryProps,
      'createdAt' | 'isActive' | 'description' | 'imageUrl'
    >,
    id?: UniqueEntityID
  ) {
    const category = new Category(
      {
        ...props,
        description: props.description ?? null,
        imageUrl: props.imageUrl ?? null,
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return category;
  }
}
