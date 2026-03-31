import { SignJWT } from 'jose';
import type { TokenGenerator } from '../../core/utils/cryptography/token-generator';

interface JoseTokenGeneratorProps {
  secret: string;
  expiresIn?: string | number;
}

export class JoseTokenGenerator implements TokenGenerator {
  private secret: Uint8Array;
  private expiresIn: string | number;

  constructor({ secret, expiresIn = '1d' }: JoseTokenGeneratorProps) {
    this.secret = new TextEncoder().encode(secret);
    this.expiresIn = expiresIn;
  }

  async generate(payload: { sub: string }): Promise<string> {
    const accessToken = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.secret);

    return accessToken;
  }
}
