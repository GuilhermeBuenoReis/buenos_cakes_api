import type { TokenGenerator } from '../../core/utils/cryptography/token-generator';

export class FakeTokenGenerator implements TokenGenerator {
  async generate(payload: { sub: string }): Promise<string> {
    return `token-${payload.sub}`;
  }
}
