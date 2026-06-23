# Buenos Cakes API

API backend para a Buenos Cakes, uma aplicacao de pedidos de bolos e produtos personalizados. O projeto cobre cadastro e autenticacao de usuarios, enderecos, catalogo de categorias/produtos/tamanhos/recheios, criacao e acompanhamento de pedidos, itens de pedido e integracao de pagamento via AbacatePay.

## Sumario

* [Visao geral](#visao-geral)
* [Stack](#stack)
* [Funcionalidades](#funcionalidades)
* [Arquitetura](#arquitetura)
* [Estrutura de pastas](#estrutura-de-pastas)
* [Requisitos](#requisitos)
* [Configuracao do ambiente](#configuracao-do-ambiente)
* [Como executar](#como-executar)
* [Scripts disponiveis](#scripts-disponiveis)
* [Banco de dados](#banco-de-dados)
* [Autenticacao](#autenticacao)
* [Documentacao da API](#documentacao-da-api)
* [Endpoints](#endpoints)
* [Modelo de dados](#modelo-de-dados)
* [Fluxo de pagamento](#fluxo-de-pagamento)
* [Rodando pagamentos localmente com AbacatePay](#rodando-pagamentos-localmente-com-abacatepay)
* [Testes e CI](#testes-e-ci)
* [Padroes de codigo](#padroes-de-codigo)
* [Troubleshooting](#troubleshooting)

## Visao geral

O repositorio implementa uma API HTTP com Fastify e TypeScript, seguindo uma separacao clara entre dominio, aplicacao e infraestrutura. As regras de negocio ficam em `src/domain`, enquanto adaptadores externos como HTTP, banco de dados, criptografia e gateway de pagamento ficam em `src/infra`.

Pontos importantes da analise:

* Projeto Node.js/TypeScript com `pnpm`.
* API HTTP com Fastify 5 e validacao por Zod.
* Banco PostgreSQL modelado com Drizzle ORM.
* Migracoes versionadas em `drizzle/`.
* Autenticacao JWT com `jose`, suportando token via `Authorization: Bearer` ou cookie `accessToken`.
* Hash de senhas com `bcrypt`.
* Pagamentos externos via AbacatePay.
* Documentacao interativa via Scalar em `/scalar`.
* Testes unitarios com Vitest, cobrindo servicos de dominio e utilitarios.
* CI no GitHub Actions executando `pnpm test`.

## Stack

| Area                  | Tecnologia                      |
| --------------------- | ------------------------------- |
| Runtime               | Node.js                         |
| Linguagem             | TypeScript                      |
| Gerenciador           | pnpm                            |
| HTTP                  | Fastify                         |
| Validacao e schemas   | Zod + fastify-type-provider-zod |
| Documentacao OpenAPI  | @fastify/swagger + Scalar       |
| Banco de dados        | PostgreSQL                      |
| ORM e migracoes       | Drizzle ORM + drizzle-kit       |
| Autenticacao          | JWT com jose                    |
| Cookies               | @fastify/cookie                 |
| CORS                  | @fastify/cors                   |
| Criptografia de senha | bcrypt                          |
| Pagamentos            | AbacatePay                      |
| Testes                | Vitest                          |
| Lint/format           | Biome                           |
| CI                    | GitHub Actions                  |

## Funcionalidades

### Usuarios e autenticacao

* Criacao de usuarios.
* Login com email e senha.
* Emissao de token JWT com validade de 7 dias.
* Retorno do token no corpo da resposta e tambem em cookie HTTP-only.
* Busca, atualizacao e remocao de usuarios.
* Papeis de usuario: `customer` e `admin`.

### Enderecos

* Cadastro de enderecos por usuario.
* Listagem de enderecos de um usuario.
* Busca, atualizacao e remocao de endereco.
* Definicao de endereco padrao.
* Regra auxiliar para manter apenas um endereco padrao por usuario.

### Catalogo

* Categorias com slug, descricao, imagem e status ativo/inativo.
* Produtos vinculados a categorias.
* Busca de produto por ID e slug.
* Listagens por categoria, popularidade, avaliacao e status ativo.
* Tamanhos de produto com codigo, rotulo, acrescimo de preco, ordenacao e opcao padrao.
* Recheios de produto com rotulo, acrescimo de preco, ordenacao e opcao padrao.
* Regras auxiliares para manter tamanho/recheio padrao por produto.

### Pedidos

* Criacao de pedidos para retirada ou entrega.
* Validacao de endereco obrigatorio para entrega.
* Validacao de data de agendamento obrigatoria para retirada.
* Itens de pedido com produto, tamanho, recheio, quantidade, preco unitario e total.
* Listagem geral de pedidos.
* Listagem de pedidos por usuario.
* Listagem de itens por pedido.
* Atualizacao de status do pedido.
* Remocao de pedido e itens.

### Pagamentos

* Criacao de registro de pagamento.
* Criacao de sessao de checkout externa.
* Integracao com AbacatePay.
* Webhook para atualizacao de status.
* Estados suportados: `pending`, `processing`, `paid`, `failed`, `canceled`, `refunded`.
* Metadados de provedor, sessao, referencia, cliente e metodo de pagamento.

## Arquitetura

O codigo segue uma abordagem proxima de Clean Architecture/DDD:

```text
HTTP/Infra -> Application Services -> Domain Entities -> Repository Contracts
          -> Infra Repositories -> PostgreSQL/Drizzle
          -> Payment Gateway -> AbacatePay
```

### Camadas principais

| Camada        | Caminho                  | Responsabilidade                                                                       |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| Core          | `src/core`               | Entidades base, IDs, Either, erros genericos e tipos compartilhados.                   |
| Domain        | `src/domain`             | Regras de negocio, entidades, contratos de repositorio, servicos e erros por contexto. |
| Infra HTTP    | `src/infra/http`         | Servidor Fastify, rotas, middlewares, env e utilitarios HTTP.                          |
| Infra DB      | `src/infra/db`           | Conexao, schemas Drizzle e implementacoes reais dos repositorios.                      |
| Infra Crypto  | `src/infra/cryptography` | Implementacoes de hash e token.                                                        |
| Infra Payment | `src/infra/payment`      | Adaptador do gateway AbacatePay.                                                       |
| Presenters    | `src/infra/presenters`   | Serializacao das entidades para resposta HTTP.                                         |
| Test          | `test`                   | Repositorios em memoria, fakes, factories e dubles para testes.                        |

### Padrao de retorno dos servicos

Os servicos de aplicacao retornam um tipo `Either`, definido em `src/core/either.ts`, para separar sucesso e erro sem depender de excecoes como fluxo principal.

Exemplo conceitual:

```ts
const result = await service.execute(input)

if (result.isError()) {
  return reply.status(400).send({ message: result.value.message })
}

return reply.status(200).send(result.value)
```

## Estrutura de pastas

```text
.
+-- .github/workflows/ci.yml
+-- drizzle/
|   +-- 0000_*.sql ... 0005_*.sql
|   +-- meta/
+-- src/
|   +-- @types/
|   |   +-- fastify.d.ts
|   +-- core/
|   |   +-- either.ts
|   |   +-- entities/
|   |   +-- errors/
|   |   +-- repositories/
|   |   +-- types/
|   +-- domain/
|   |   +-- cryptography/
|   |   +-- orders/
|   |   +-- products/
|   |   +-- users/
|   +-- infra/
|       +-- cryptography/
|       +-- db/
|       |   +-- repositories/
|       |   +-- schema/
|       +-- http/
|       |   +-- env/
|       |   +-- middlewares/
|       |   +-- routes/
|       |   +-- utils/
|       +-- payment/
|       +-- presenters/
+-- test/
|   +-- cryptography/
|   +-- factories/
|   +-- payment/
|   +-- repositories/
+-- biome.json
+-- docker-compose.yml
+-- drizzle.config.ts
+-- package.json
+-- pnpm-lock.yaml
+-- swagger.json
+-- tsconfig.json
```

## Requisitos

* Node.js compativel com o projeto. O `tsconfig.json` indica perfil Node 24; o CI usa Node 20.
* pnpm 10.31.0 ou superior.
* Docker e Docker Compose, caso use o PostgreSQL local do `docker-compose.yml`.
* PostgreSQL disponivel localmente ou por URL externa.
* Chave da AbacatePay para criar checkouts reais.
* ngrok, localtunnel, Cloudflare Tunnel ou ferramenta equivalente para testar webhooks em ambiente local.

## Configuracao do ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3333
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/buenos_cakes
CLIENT_ORIGIN=http://localhost:3000

JWT_SECRET=altere-este-segredo-em-producao

ABACATE_PAY_API_KEY=
ABACATE_PAY_WEBHOOK_PUBLIC_KEY=
ABACATE_PAY_BASE_URL=https://api.abacatepay.com/v2
ABACATE_PAY_RETURN_URL=http://localhost:3000/checkout
ABACATE_PAY_COMPLETION_URL=http://localhost:3000/checkout/success

NODE_ENV=development
```

### Variaveis de ambiente

| Variavel                         | Obrigatoria           | Padrao                              | Descricao                                     |
| -------------------------------- | --------------------- | ----------------------------------- | --------------------------------------------- |
| `PORT`                           | Nao                   | `3333`                              | Porta HTTP da API.                            |
| `DATABASE_URL`                   | Sim                   | -                                   | URL de conexao PostgreSQL usada pelo Drizzle. |
| `CLIENT_ORIGIN`                  | Nao                   | `http://localhost:3000`             | Origem liberada no CORS.                      |
| `JWT_SECRET`                     | Em producao           | segredo de desenvolvimento          | Segredo usado para assinar e validar JWT.     |
| `ABACATE_PAY_API_KEY`            | Para pagamentos reais | -                                   | Token Bearer da AbacatePay.                   |
| `ABACATE_PAY_WEBHOOK_PUBLIC_KEY` | Nao                   | chave default no codigo             | Chave publica usada no fluxo de webhook.      |
| `ABACATE_PAY_BASE_URL`           | Nao                   | `https://api.abacatepay.com/v2`     | URL base da API AbacatePay.                   |
| `ABACATE_PAY_RETURN_URL`         | Nao                   | `${CLIENT_ORIGIN}/checkout`         | URL de retorno/cancelamento do checkout.      |
| `ABACATE_PAY_COMPLETION_URL`     | Nao                   | `${CLIENT_ORIGIN}/checkout/success` | URL chamada apos checkout concluido.          |
| `NODE_ENV`                       | Nao                   | `development`                       | Aceita `development`, `production` ou `test`. |

Observacao: em `production`, `JWT_SECRET` e obrigatorio pela validacao de ambiente.

## Como executar

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Subir PostgreSQL local

```bash
docker compose up -d
```

O `docker-compose.yml` cria um PostgreSQL com:

* Banco: `buenos_cakes`
* Usuario: `postgres`
* Senha: `postgres`
* Porta: `5432`

### 3. Rodar migracoes

```bash
pnpm migrate
```

### 4. Executar em desenvolvimento

```bash
pnpm dev
```

Servidor:

```text
http://localhost:3333
```

Documentacao interativa:

```text
http://localhost:3333/scalar
```

Health check:

```text
GET http://localhost:3333/health
```

## Scripts disponiveis

| Script     | Comando                                              | Descricao                                    |
| ---------- | ---------------------------------------------------- | -------------------------------------------- |
| `dev`      | `tsx watch --env-file=.env src/infra/http/server.ts` | Inicia o servidor em modo watch.             |
| `build`    | `tsup src`                                           | Gera build em `dist`.                        |
| `start`    | `dotenv -e ./.env -- node dist/infra/http/server.ts` | Executa a versao compilada.                  |
| `seed`     | `tsx --env-file=.env src/infra/db/seed.ts`           | Executa seed, se o arquivo estiver presente. |
| `test`     | `vitest run`                                         | Executa a suite de testes.                   |
| `generate` | `drizzle-kit generate`                               | Gera novas migracoes a partir dos schemas.   |
| `migrate`  | `drizzle-kit migrate`                                | Aplica migracoes no banco configurado.       |

Nota: o script `seed` aponta para `src/infra/db/seed.ts`, mas esse arquivo nao esta presente na arvore atual do repositorio. Caso precise de seed, crie o arquivo antes de executar o comando.

## Banco de dados

O projeto usa Drizzle ORM com PostgreSQL. Os schemas ficam em `src/infra/db/schema` e as migracoes em `drizzle/`.

### Tabelas principais

| Tabela             | Finalidade                                  |
| ------------------ | ------------------------------------------- |
| `users`            | Usuarios da aplicacao, credenciais e papel. |
| `addresses`        | Enderecos de entrega por usuario.           |
| `categories`       | Categorias do catalogo.                     |
| `products`         | Produtos vendidos pela Buenos Cakes.        |
| `product_sizes`    | Tamanhos/opcoes de tamanho por produto.     |
| `product_fillings` | Recheios/opcoes por produto.                |
| `orders`           | Pedidos dos usuarios.                       |
| `order_items`      | Itens associados a um pedido.               |
| `payments`         | Pagamentos vinculados a pedidos.            |

### Relacionamentos principais

* `addresses.user_id -> users.id`
* `products.category_id -> categories.id`
* `product_sizes.product_id -> products.id`
* `product_fillings.product_id -> products.id`
* `orders.user_id -> users.id`
* `orders.delivery_address_id -> addresses.id`
* `order_items.order_id -> orders.id`
* `order_items.product_id -> products.id`
* `order_items.product_size_id -> product_sizes.id`
* `order_items.product_filling_id -> product_fillings.id`
* `payments.order_id -> orders.id`

### Migracoes

Para gerar uma migracao:

```bash
pnpm generate
```

Para aplicar migracoes:

```bash
pnpm migrate
```

## Autenticacao

A rota de login e:

```text
POST /api/users/login
```

Ela recebe:

```json
{
  "email": "cliente@email.com",
  "password": "senha"
}
```

E retorna:

```json
{
  "user": {
    "id": "user_id",
    "name": "Cliente",
    "email": "cliente@email.com",
    "cpf": null,
    "phone": null,
    "role": "customer",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": null
  },
  "accessToken": "jwt"
}
```

O token pode ser enviado de duas formas:

```http
Authorization: Bearer <token>
```

Ou pelo cookie:

```text
accessToken=<token>
```

Quase todas as rotas de negocio usam `userAuthMiddleware`. As excecoes relevantes sao `POST /api/users/create`, `POST /api/users/login`, `POST /api/payments/webhook` e `GET /health`.

## Documentacao da API

Em desenvolvimento, o servidor:

* Registra OpenAPI via `@fastify/swagger`.
* Exibe a documentacao em `GET /scalar`.
* Gera o arquivo `swagger.json` na raiz quando `NODE_ENV=development`.

Depois de iniciar o servidor, acesse:

```text
http://localhost:3333/scalar
```

## Endpoints

### Sistema

| Metodo | Rota      | Auth | Descricao                     |
| ------ | --------- | ---- | ----------------------------- |
| GET    | `/health` | Nao  | Verifica se a API esta no ar. |

### Usuarios

| Metodo | Rota                        | Auth | Descricao                     |
| ------ | --------------------------- | ---- | ----------------------------- |
| POST   | `/api/users/create`         | Nao  | Cria usuario.                 |
| POST   | `/api/users/login`          | Nao  | Autentica usuario e gera JWT. |
| GET    | `/api/users/:userId`        | Sim  | Busca usuario por ID.         |
| PATCH  | `/api/users/:userId`        | Sim  | Atualiza usuario.             |
| POST   | `/api/users/delete/:userId` | Sim  | Remove usuario.               |

### Enderecos

| Metodo | Rota                                | Auth | Descricao                      |
| ------ | ----------------------------------- | ---- | ------------------------------ |
| POST   | `/api/addresses/create`             | Sim  | Cria endereco.                 |
| GET    | `/api/addresses/:addressId`         | Sim  | Busca endereco por ID.         |
| GET    | `/api/users/:userId/addresses`      | Sim  | Lista enderecos de um usuario. |
| PATCH  | `/api/addresses/:addressId`         | Sim  | Atualiza endereco.             |
| POST   | `/api/addresses/:addressId/default` | Sim  | Define endereco como padrao.   |
| POST   | `/api/addresses/delete/:addressId`  | Sim  | Remove endereco.               |

### Categorias

| Metodo | Rota                                 | Auth | Descricao                 |
| ------ | ------------------------------------ | ---- | ------------------------- |
| POST   | `/api/categories/create`             | Sim  | Cria categoria.           |
| GET    | `/api/categories`                    | Sim  | Lista categorias.         |
| GET    | `/api/categories/active`             | Sim  | Lista categorias ativas.  |
| GET    | `/api/categories/:categoryId`        | Sim  | Busca categoria por ID.   |
| GET    | `/api/categories/slug/:slug`         | Sim  | Busca categoria por slug. |
| PATCH  | `/api/categories/:categoryId`        | Sim  | Atualiza categoria.       |
| POST   | `/api/categories/delete/:categoryId` | Sim  | Remove categoria.         |

### Produtos

| Metodo | Rota                                          | Auth | Descricao                            |
| ------ | --------------------------------------------- | ---- | ------------------------------------ |
| POST   | `/api/products/create`                        | Sim  | Cria produto.                        |
| GET    | `/api/products`                               | Sim  | Lista produtos.                      |
| GET    | `/api/products/active`                        | Sim  | Lista produtos ativos.               |
| GET    | `/api/products/popularity`                    | Sim  | Lista produtos por popularidade.     |
| GET    | `/api/products/rating`                        | Sim  | Lista produtos por avaliacao.        |
| GET    | `/api/categories/:categoryId/products`        | Sim  | Lista produtos por categoria.        |
| GET    | `/api/categories/:categoryId/products/active` | Sim  | Lista produtos ativos por categoria. |
| GET    | `/api/products/:productId`                    | Sim  | Busca produto por ID.                |
| GET    | `/api/products/slug/:slug`                    | Sim  | Busca produto por slug.              |
| PATCH  | `/api/products/:productId`                    | Sim  | Atualiza produto.                    |
| POST   | `/api/products/delete/:productId`             | Sim  | Remove produto.                      |

### Tamanhos de produto

| Metodo | Rota                                       | Auth | Descricao                          |
| ------ | ------------------------------------------ | ---- | ---------------------------------- |
| POST   | `/api/product-sizes/create`                | Sim  | Cria tamanho de produto.           |
| GET    | `/api/products/:productId/sizes`           | Sim  | Lista tamanhos por produto.        |
| GET    | `/api/products/:productId/sizes/active`    | Sim  | Lista tamanhos ativos por produto. |
| GET    | `/api/product-sizes/:productSizeId`        | Sim  | Busca tamanho por ID.              |
| PATCH  | `/api/product-sizes/:productSizeId`        | Sim  | Atualiza tamanho.                  |
| POST   | `/api/product-sizes/delete/:productSizeId` | Sim  | Remove tamanho.                    |

### Recheios de produto

| Metodo | Rota                                             | Auth | Descricao                          |
| ------ | ------------------------------------------------ | ---- | ---------------------------------- |
| POST   | `/api/product-fillings/create`                   | Sim  | Cria recheio de produto.           |
| GET    | `/api/products/:productId/fillings`              | Sim  | Lista recheios por produto.        |
| GET    | `/api/products/:productId/fillings/active`       | Sim  | Lista recheios ativos por produto. |
| GET    | `/api/product-fillings/:productFillingId`        | Sim  | Busca recheio por ID.              |
| PATCH  | `/api/product-fillings/:productFillingId`        | Sim  | Atualiza recheio.                  |
| POST   | `/api/product-fillings/delete/:productFillingId` | Sim  | Remove recheio.                    |

### Pedidos

| Metodo | Rota                          | Auth | Descricao                    |
| ------ | ----------------------------- | ---- | ---------------------------- |
| POST   | `/api/orders/create`          | Sim  | Cria pedido.                 |
| GET    | `/api/orders`                 | Sim  | Lista pedidos.               |
| GET    | `/api/users/:userId/orders`   | Sim  | Lista pedidos de um usuario. |
| GET    | `/api/orders/:orderId`        | Sim  | Busca pedido por ID.         |
| PATCH  | `/api/orders/:orderId/status` | Sim  | Atualiza status do pedido.   |
| POST   | `/api/orders/delete/:orderId` | Sim  | Remove pedido.               |

### Itens de pedido

| Metodo | Rota                                   | Auth | Descricao                 |
| ------ | -------------------------------------- | ---- | ------------------------- |
| POST   | `/api/order-items/create`              | Sim  | Cria item de pedido.      |
| GET    | `/api/orders/:orderId/items`           | Sim  | Lista itens de um pedido. |
| GET    | `/api/order-items/:orderItemId`        | Sim  | Busca item por ID.        |
| PATCH  | `/api/order-items/:orderItemId`        | Sim  | Atualiza item.            |
| POST   | `/api/order-items/delete/:orderItemId` | Sim  | Remove item.              |

### Pagamentos

| Metodo | Rota                     | Auth | Descricao                               |
| ------ | ------------------------ | ---- | --------------------------------------- |
| POST   | `/api/payments/checkout` | Sim  | Cria sessao de checkout para um pedido. |
| POST   | `/api/payments/webhook`  | Nao  | Recebe eventos do gateway de pagamento. |

## Modelo de dados

### Usuarios

Campos principais:

* `id`
* `name`
* `email`
* `password_hash`
* `cpf`
* `phone`
* `role`
* `created_at`
* `updated_at`

### Enderecos

Campos principais:

* `id`
* `user_id`
* `label`
* `recipient_name`
* `street`
* `house_number`
* `complement`
* `city`
* `state`
* `zip_code`
* `reference`
* `is_default`
* `created_at`
* `updated_at`

### Categorias

Campos principais:

* `id`
* `name`
* `slug`
* `description`
* `image_url`
* `is_active`
* `created_at`
* `updated_at`

### Produtos

Campos principais:

* `id`
* `category_id`
* `name`
* `slug`
* `description`
* `base_price`
* `cover_image_url`
* `rating_avg`
* `reviews_count`
* `popularity_score`
* `is_active`
* `created_at`
* `updated_at`

### Tamanhos

Campos principais:

* `id`
* `product_id`
* `code`
* `label`
* `servings_label`
* `price_delta`
* `is_default`
* `sort_order`
* `is_active`
* `created_at`
* `updated_at`

### Recheios

Campos principais:

* `id`
* `product_id`
* `label`
* `price_delta`
* `is_default`
* `sort_order`
* `is_active`
* `created_at`
* `updated_at`

### Pedidos

Campos principais:

* `id`
* `user_id`
* `status`
* `fulfillment_method`
* `delivery_address_id`
* `pickup_scheduled_at`
* `customer_note`
* `subtotal`
* `delivery_fee`
* `total`
* `created_at`
* `updated_at`

Enums:

* `order_status`: `pending`, `confirmed`, `preparing`, `ready`, `completed`, `canceled`
* `order_fulfillment_method`: `pickup`, `delivery`

### Itens de pedido

Campos principais:

* `id`
* `order_id`
* `product_id`
* `product_size_id`
* `product_filling_id`
* `quantity`
* `unit_price`
* `total`
* `note`
* `created_at`
* `updated_at`

### Pagamentos

Campos principais:

* `id`
* `order_id`
* `method`
* `provider`
* `status`
* `amount`
* `currency`
* `provider_name`
* `provider_reference_id`
* `provider_session_id`
* `provider_customer_id`
* `provider_payment_method_id`
* `provider_client_secret`
* `provider_status`
* `pix_qr_code`
* `pix_qr_code_url`
* `expires_at`
* `failure_reason`
* `paid_at`
* `canceled_at`
* `refunded_at`
* `created_at`
* `updated_at`

Enums:

* `payment_method`: `pix`, `credit_card`, `debit_card`, `cash`
* `payment_provider`: `external`, `manual`
* `payment_status`: `pending`, `processing`, `paid`, `failed`, `canceled`, `refunded`

## Fluxo de pagamento

O fluxo principal de checkout segue estes passos:

1. Um usuario autenticado cria ou possui um pedido.
2. A API cria um pagamento vinculado ao pedido.
3. A rota `POST /api/payments/checkout` aciona o gateway configurado.
4. O adaptador `AbacatePayPaymentGateway` cria um produto temporario na AbacatePay.
5. O adaptador cria uma sessao de checkout com metodos `PIX` e `CARD`.
6. A API retorna a URL de checkout para o cliente.
7. A AbacatePay envia eventos para `POST /api/payments/webhook`.
8. O servico `HandlePaymentGatewayWebhookService` localiza o pagamento por ID, sessao ou referencia do provedor.
9. O status local e atualizado para `processing`, `paid`, `failed`, `canceled` ou `refunded`.

## Rodando pagamentos localmente com AbacatePay

Para testar o fluxo de pagamento da AbacatePay em ambiente local, nao basta deixar a API rodando em `localhost`.

A AbacatePay precisa conseguir chamar a rota de webhook da aplicacao, mas URLs locais como:

```text
http://localhost:3333/api/payments/webhook
```

nao sao acessiveis diretamente pela internet.

Por isso, durante o desenvolvimento local, e necessario expor a API usando uma ferramenta de tunel publico, como:

* ngrok
* localtunnel
* Cloudflare Tunnel
* outra ferramenta equivalente

A opcao mais comum e usar o `ngrok`.

### 1. Iniciar a API local

```bash
pnpm dev
```

A API ficara disponivel localmente em:

```text
http://localhost:3333
```

### 2. Expor a API com ngrok

Em outro terminal, execute:

```bash
ngrok http 3333
```

O ngrok ira gerar uma URL publica HTTPS parecida com:

```text
https://exemplo-aleatorio.ngrok-free.app
```

Essa URL publica sera usada para que a AbacatePay consiga enviar eventos para a API local.

### 3. Configurar o webhook na AbacatePay

No painel da AbacatePay ou via API, configure o endpoint do webhook usando a URL publica gerada pelo ngrok:

```text
https://exemplo-aleatorio.ngrok-free.app/api/payments/webhook
```

Essa URL aponta para a rota local:

```text
POST /api/payments/webhook
```

Com isso, quando um pagamento for atualizado na AbacatePay, o evento sera enviado para o ngrok, e o ngrok encaminhara a requisicao para sua API local.

### 4. Ajustar URLs de retorno do checkout

Durante o desenvolvimento, as URLs de retorno do checkout podem continuar apontando para o frontend local:

```env
ABACATE_PAY_RETURN_URL=http://localhost:3000/checkout
ABACATE_PAY_COMPLETION_URL=http://localhost:3000/checkout/success
```

Essas URLs sao usadas para redirecionar o usuario apos o checkout.

Ja o webhook precisa usar uma URL publica HTTPS, pois ele e chamado diretamente pela AbacatePay.

### 5. Atenção ao reiniciar o ngrok

Na versao gratuita do ngrok, a URL publica pode mudar sempre que o tunel for reiniciado.

Quando isso acontecer, atualize o endpoint do webhook na AbacatePay para a nova URL gerada.

Exemplo:

```text
https://nova-url-do-ngrok.ngrok-free.app/api/payments/webhook
```

Se usar uma URL fixa/reservada no ngrok ou outra ferramenta com dominio estavel, esse ajuste manual deixa de ser necessario.

### Checklist para testar pagamento local

Antes de testar o checkout em localhost, confirme:

* A API esta rodando com `pnpm dev`.
* O banco PostgreSQL esta ativo.
* As migracoes foram aplicadas.
* `ABACATE_PAY_API_KEY` esta configurada no `.env`.
* O ngrok esta apontando para a porta `3333`.
* O webhook cadastrado na AbacatePay usa a URL HTTPS gerada pelo ngrok.
* A rota final do webhook esta como `/api/payments/webhook`.
* O pedido e o pagamento existem antes de criar a sessao de checkout.

Fluxo esperado:

```text
Cliente cria pedido
-> API cria pagamento
-> API cria checkout na AbacatePay
-> Cliente paga no checkout
-> AbacatePay chama o webhook publico
-> ngrok encaminha para localhost
-> API atualiza o status do pagamento
```

### Alternativa com CLI da AbacatePay

Caso esteja usando a CLI da AbacatePay, tambem e possivel ouvir eventos em tempo real e encaminha-los para a API local usando o fluxo de webhooks da propria ferramenta.

Nesse caso, o encaminhamento deve apontar para:

```text
http://localhost:3333/api/payments/webhook
```

Use essa alternativa apenas se ela estiver configurada no seu ambiente. Para o fluxo mais simples e universal em desenvolvimento, o ngrok costuma ser suficiente.

## Testes e CI

O projeto usa Vitest. Existem testes unitarios para:

* `Either` e value objects.
* Servicos de usuarios.
* Servicos de enderecos.
* Servicos de categorias, produtos, tamanhos e recheios.
* Servicos de pedidos, itens e pagamentos.
* Fluxos de webhook e checkout.

Tambem existem helpers em `test/`:

* Repositorios em memoria.
* Repositorios que simulam falhas.
* Gateways de pagamento fake/failing.
* Geradores fake de hash e token.
* Factories para entidades de dominio.

Para executar:

```bash
pnpm test
```

O CI esta em `.github/workflows/ci.yml` e executa:

```bash
pnpm install --frozen-lockfile
pnpm test
```

## Padroes de codigo

### Convencoes observadas

* Imports por alias `@/*` apontando para `src/*`.
* Servicos de aplicacao com metodo `execute`.
* Repositorios definidos como contratos em `src/domain/**/application/repositories`.
* Implementacoes Drizzle em `src/infra/db/repositories`.
* Presenters para transformar entidades em payload HTTP.
* Erros de negocio dedicados por contexto.
* Entidades de dominio independentes do banco.
* Testes lado a lado dos servicos em `src/domain/**/services/*.spec.ts`.

### Boas praticas ao adicionar funcionalidades

1. Criar/ajustar entidade de dominio quando houver nova regra de negocio.
2. Criar contrato de repositorio na camada de aplicacao.
3. Implementar repositorio real em `src/infra/db/repositories`.
4. Criar service com retorno `Either`.
5. Criar rota HTTP usando Zod para body, params, query e responses.
6. Criar presenter se a resposta expuser entidade.
7. Criar testes com repositorios em memoria e factories.
8. Atualizar schema Drizzle e gerar migracao quando houver mudanca de banco.

## Troubleshooting

### `DATABASE_URL` nao definida

Garanta que o `.env` existe e contem:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/buenos_cakes
```

### Erro de autenticacao em rotas protegidas

Envie o token retornado pelo login:

```http
Authorization: Bearer <accessToken>
```

Ou mantenha o cookie `accessToken` recebido no login.

### Pagamento falhando com AbacatePay

Verifique:

* `ABACATE_PAY_API_KEY`
* `ABACATE_PAY_BASE_URL`
* URLs de retorno e conclusao
* Se o pedido e o pagamento existem antes de criar checkout
* Se estiver testando localmente, confirme se o webhook da AbacatePay esta usando uma URL publica HTTPS, como a URL gerada pelo ngrok, e nao `localhost`.
* Se o ngrok foi reiniciado, confirme se a URL publica atual e a mesma cadastrada no webhook da AbacatePay.
* Se a rota configurada no webhook termina exatamente com `/api/payments/webhook`.

### CI falhando por lockfile

O workflow usa:

```bash
pnpm install --frozen-lockfile
```

Se dependencias mudarem, atualize e commite o `pnpm-lock.yaml`.

### `pnpm build` falhando por `tsup`

O script de build usa `tsup src`, mas `tsup` nao aparece nas dependencias atuais do `package.json`. Instale-o como dependencia de desenvolvimento ou ajuste o script de build antes de usar esse comando em CI/CD.

### `pnpm seed` falhando

O script existe em `package.json`, mas o arquivo `src/infra/db/seed.ts` nao foi encontrado na arvore atual. Crie esse arquivo ou remova/ajuste o script.

## Observacoes de manutencao

* As rotas de delecao usam `POST /delete/:id`, nao `DELETE`. Mantenha esse padrao se quiser consistencia com a API atual, ou planeje uma migracao de contrato se quiser REST mais convencional.
* `swagger.json` esta vazio no repositorio, mas o servidor gera a especificacao em desenvolvimento.
* O cookie `accessToken` e configurado com `secure: env.NODE_ENV === 'development'`. Em navegadores, cookies `secure` exigem HTTPS; revise esse comportamento se o login local via cookie nao persistir.
* O projeto tem boa cobertura de servicos, mas rotas HTTP e integracoes reais com banco/gateway podem se beneficiar de testes de integracao.
