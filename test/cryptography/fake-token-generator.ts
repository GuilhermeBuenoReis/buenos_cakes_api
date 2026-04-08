import type { TokenGenerator } from '../../domain/cryptography/application/cryptography/token-generator';

export class FakeTokenGenerator implements TokenGenerator {
  async generate(payload: { sub: string }): Promise<string> {
    return `token-${payload.sub}`;
  }
}
