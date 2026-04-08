export class ErrorResult<ErrorType, SuccessType> {
  readonly value: ErrorType;

  constructor(value: ErrorType) {
    this.value = value;
  }

  isSuccess(): this is SuccessResult<ErrorType, SuccessType> {
    return false;
  }

  isError(): this is ErrorResult<ErrorType, SuccessType> {
    return true;
  }
}

export class SuccessResult<ErrorType, SuccessType> {
  readonly value: SuccessType;

  constructor(value: SuccessType) {
    this.value = value;
  }

  isSuccess(): this is SuccessResult<ErrorType, SuccessType> {
    return true;
  }

  isError(): this is ErrorResult<ErrorType, SuccessType> {
    return false;
  }
}

export type Either<ErrorType, SuccessType> =
  | ErrorResult<ErrorType, SuccessType>
  | SuccessResult<ErrorType, SuccessType>;

export const error = <ErrorType, SuccessType>(
  value: ErrorType
): Either<ErrorType, SuccessType> => {
  return new ErrorResult(value);
};

export const success = <ErrorType, SuccessType>(
  value: SuccessType
): Either<ErrorType, SuccessType> => {
  return new SuccessResult(value);
};
