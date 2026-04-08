import type { TokenGenerator } from '../../src/domain/cryptography/application/cryptography/token-generator';

export class FakeTokenGenerator implements TokenGenerator {
  async generate(payload: { sub: string }): Promise<string> {
    return `token-${payload.sub}`;
  }
}
