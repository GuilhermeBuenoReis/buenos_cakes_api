import type { Optional } from '../../../../core/types/optional';
import { Entity } from '../../../../core/entities/entity';
import type { UniqueEntityID } from '../../../../core/entities/unique-entity-id';

interface AddressProps {
  userId: UniqueEntityID;
  label: string;
  recipientName: string;
  street: string;
  houseNumber: string;
  complement?: string | null;
  city: string;
  state: string;
  zipCode: string;
  reference?: string | null;
  isDefault: boolean;

  createdAt: Date;
  updatedAt?: Date | null;
}

export class Address extends Entity<AddressProps> {
  get userId() {
    return this.props.userId;
  }

  get label() {
    return this.props.label;
  }

  get recipientName() {
    return this.props.recipientName;
  }

  get street() {
    return this.props.street;
  }

  get houseNumber() {
    return this.props.houseNumber;
  }

  get complement() {
    return this.props.complement;
  }

  get city() {
    return this.props.city;
  }

  get state() {
    return this.props.state;
  }

  get zipCode() {
    return this.props.zipCode;
  }

  get reference() {
    return this.props.reference;
  }

  get isDefault() {
    return this.props.isDefault;
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

  set userId(userId: UniqueEntityID) {
    this.props.userId = userId;
    this.touch();
  }

  set label(label: string) {
    this.props.label = label;
    this.touch();
  }

  set recipientName(recipientName: string) {
    this.props.recipientName = recipientName;
    this.touch();
  }

  set street(street: string) {
    this.props.street = street;
    this.touch();
  }

  set houseNumber(houseNumber: string) {
    this.props.houseNumber = houseNumber;
    this.touch();
  }

  set complement(complement: string | null | undefined) {
    this.props.complement = complement ?? null;
    this.touch();
  }

  set city(city: string) {
    this.props.city = city;
    this.touch();
  }

  set state(state: string) {
    this.props.state = state;
    this.touch();
  }

  set zipCode(zipCode: string) {
    this.props.zipCode = zipCode;
    this.touch();
  }

  set reference(reference: string | null | undefined) {
    this.props.reference = reference ?? null;
    this.touch();
  }

  set isDefault(isDefault: boolean) {
    this.props.isDefault = isDefault;
    this.touch();
  }

  static create(
    props: Optional<AddressProps, 'createdAt' | 'isDefault'>,
    id?: UniqueEntityID
  ) {
    const address = new Address(
      {
        ...props,
        complement: props.complement ?? null,
        reference: props.reference ?? null,
        isDefault: props.isDefault ?? false,
        createdAt: props.createdAt ?? new Date(),
      },
      id
    );

    return address;
  }
}
