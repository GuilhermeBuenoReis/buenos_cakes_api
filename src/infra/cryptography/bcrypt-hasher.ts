import { compare, hash } from 'bcrypt';
import type { HashComparer } from '@/core/utils/cryptography/hash-comparer';
import type { HashGenerator } from '@/core/utils/cryptography/hash-generator';

export class BcryptHasher implements HashGenerator, HashComparer {
  async hash(plain: string): Promise<string> {
    return hash(plain, 8);
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed);
  }
}
