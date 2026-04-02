import { expect, it } from 'vitest';
import { type Either, error, success } from './either';

function doSomeThing(shouldSuccess: boolean): Either<string, number> {
  if (shouldSuccess) {
    return success(10);
  } else {
    return error('error');
  }
}

it('success result', () => {
  const result = doSomeThing(true);

  expect(result.isSuccess()).toBe(true);
  expect(result.isError()).toBe(false);
});

it('error result', () => {
  const result = doSomeThing(false);

  expect(result.isError()).toBe(true);
  expect(result.isSuccess()).toBe(false);
});
