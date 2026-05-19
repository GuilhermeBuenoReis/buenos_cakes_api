import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import scalar from '@scalar/fastify-api-reference';
import fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './env';
import { authenticateUserRoute } from './routes/authenticate-user-route';
import { createAddressRoute } from './routes/create-address-route';
import { createCategoryRoute } from './routes/create-category-route';
import { createProductFillingRoute } from './routes/create-product-filling-route';
import { createProductRoute } from './routes/create-product-route';
import { createProductSizeRoute } from './routes/create-product-size-route';
import { createUserRoute } from './routes/create-user-route';
import { deleteAddressRoute } from './routes/delete-address-route';
import { deleteCategoryRoute } from './routes/delete-category-route';
import { deleteProductFillingRoute } from './routes/delete-product-filling-route';
import { deleteProductRoute } from './routes/delete-product-route';
import { deleteProductSizeRoute } from './routes/delete-product-size-route';
import { deleteUserRoute } from './routes/delete-user-route';
import { fetchAddressByIdRoute } from './routes/fetch-address-by-id-route';
import { fetchCategoryByIdRoute } from './routes/fetch-category-by-id-route';
import { fetchCategoryBySlugRoute } from './routes/fetch-category-by-slug-route';
import { fetchProductByIdRoute } from './routes/fetch-product-by-id-route';
import { fetchProductBySlugRoute } from './routes/fetch-product-by-slug-route';
import { fetchProductFillingByIdRoute } from './routes/fetch-product-filling-by-id-route';
import { fetchProductSizeByIdRoute } from './routes/fetch-product-size-by-id-route';
import { fetchUserByIdRoute } from './routes/fetch-user-by-id-route';
import { healthRoute } from './routes/health';
import { listActiveCategoriesRoute } from './routes/list-active-categories-route';
import { listActiveProductFillingsByProductRoute } from './routes/list-active-product-fillings-by-product-route';
import { listActiveProductSizesByProductRoute } from './routes/list-active-product-sizes-by-product-route';
import { listActiveProductsByCategoryRoute } from './routes/list-active-products-by-category-route';
import { listActiveProductsRoute } from './routes/list-active-products-route';
import { listCategoriesRoute } from './routes/list-categories-route';
import { listProductFillingsByProductRoute } from './routes/list-product-fillings-by-product-route';
import { listProductSizesByProductRoute } from './routes/list-product-sizes-by-product-route';
import { listProductsByCategoryRoute } from './routes/list-products-by-category-route';
import { listProductsByPopularityRoute } from './routes/list-products-by-popularity-route';
import { listProductsByRatingRoute } from './routes/list-products-by-rating-route';
import { listProductsRoute } from './routes/list-products-route';
import { listUserAddressesRoute } from './routes/list-user-addresses-route';
import { setDefaultAddressRoute } from './routes/set-default-address-route';
import { updateAddressRoute } from './routes/update-address-route';
import { updateCategoryRoute } from './routes/update-category-route';
import { updateProductFillingRoute } from './routes/update-product-filling-route';
import { updateProductRoute } from './routes/update-product-route';
import { updateProductSizeRoute } from './routes/update-product-size-route';
import { updateUserRoute } from './routes/update-user-route';

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  openapi: {
    info: { title: 'Buenos_Cakes', version: '1.0.0' },
    servers: [{ url: `http://localhost:${env.PORT}` }],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifyCookie, {
  hook: 'onRequest',
});

app.register(fastifyCors, {
  origin: env.CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86_400,
});

app.register(scalar, {
  routePrefix: '/scalar',
  configuration: {
    theme: 'kepler',
  },
});

app.register(healthRoute);
app.register(createUserRoute);
app.register(authenticateUserRoute);
app.register(fetchUserByIdRoute);
app.register(updateUserRoute);
app.register(deleteUserRoute);
app.register(createAddressRoute);
app.register(fetchAddressByIdRoute);
app.register(listUserAddressesRoute);
app.register(updateAddressRoute);
app.register(deleteAddressRoute);
app.register(setDefaultAddressRoute);
app.register(createCategoryRoute);
app.register(listCategoriesRoute);
app.register(listActiveCategoriesRoute);
app.register(fetchCategoryBySlugRoute);
app.register(fetchCategoryByIdRoute);
app.register(updateCategoryRoute);
app.register(deleteCategoryRoute);
app.register(createProductRoute);
app.register(listProductsRoute);
app.register(listActiveProductsRoute);
app.register(listProductsByPopularityRoute);
app.register(listProductsByRatingRoute);
app.register(listProductsByCategoryRoute);
app.register(listActiveProductsByCategoryRoute);
app.register(createProductSizeRoute);
app.register(listProductSizesByProductRoute);
app.register(listActiveProductSizesByProductRoute);
app.register(fetchProductSizeByIdRoute);
app.register(updateProductSizeRoute);
app.register(deleteProductSizeRoute);
app.register(createProductFillingRoute);
app.register(listProductFillingsByProductRoute);
app.register(listActiveProductFillingsByProductRoute);
app.register(fetchProductFillingByIdRoute);
app.register(updateProductFillingRoute);
app.register(deleteProductFillingRoute);
app.register(fetchProductBySlugRoute);
app.register(fetchProductByIdRoute);
app.register(updateProductRoute);
app.register(deleteProductRoute);

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log(
    `Server is running on url http://localhost:${env.PORT} | Visit http://localhost:${env.PORT}/scalar to view the documentation.`
  );
});

if (env.NODE_ENV === 'development') {
  const specFile = resolve(__dirname, '../../../swagger.json');
  app.ready().then(async () => {
    const spec = JSON.stringify(app.swagger(), null, 2);
    await writeFile(specFile, spec);
    console.log('Swagger spec generated!');
    console.log(randomUUID());
  });
}
