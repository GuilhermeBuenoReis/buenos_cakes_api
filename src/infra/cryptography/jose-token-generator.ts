import { SignJWT } from 'jose';

import type { TokenGenerator } from '@/domain/cryptography/application/cryptography/token-generator';
import { env } from '@/infra/http/env';

export class JoseTokenGenerator implements TokenGenerator {
  async generate(payload: { sub: string }): Promise<string> {
    const secret = new TextEncoder().encode(env.JWT_SECRET);

    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);
  }
}
