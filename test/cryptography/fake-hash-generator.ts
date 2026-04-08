import type { HashComparer } from '../../src/domain/cryptography/application/cryptography/hash-comparer';
import type { HashGenerator } from '../../src/domain/cryptography/application/cryptography/hash-generator';

export class FakeHasher implements HashGenerator, HashComparer {
  async hash(plain: string): Promise<string> {
    return plain.concat('_hashed');
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return plain.concat('_hashed') === hash;
  }
}
