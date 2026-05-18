declare module 'fastify/jwt' {
  interface FastifyRequest {
    user?: {
      id: string;
    };
  }
}
