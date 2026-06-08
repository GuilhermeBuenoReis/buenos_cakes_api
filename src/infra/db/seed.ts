import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../http/env';
import {
  categories,
  productFillings,
  productSizes,
  products,
  schema,
} from './schema/index';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

const db = drizzle(pool, {
  schema,
});

interface SeedProductSize {
  code: string;
  label: string;
  servingsLabel?: string | null;
  fullPrice: number;
  isDefault?: boolean;
  sortOrder?: number;
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  coverImageUrl: string | null;
  isActive: boolean;
  sizes: SeedProductSize[];
  fillings?: string[];
}

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  isActive: boolean;
  products: SeedProduct[];
}

const roundCakeFillings = [
  'Brigadeiro preto',
  'Brigadeiro branco',
  'Amendoim',
  'Sonho de valsa',
  'Ouro branco',
  'Quatro leites',
  'Abacaxi',
  'Abacaxi com coco',
  'Morango',
  'Maracujá',
  'Mousse de chocolate',
  'Nata com óreo',
  'Nata com morango',
  'Nozes',
  'Doce de leite com ameixas',
  'Doce de leite com nozes',
  'Ninho com Nutella',
  'Mousse de chocolate branco',
];

function wikimediaImage(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    fileName
  )}?width=1200`;
}

const seedImages = {
  categories: {
    cakes: wikimediaImage(
      'Side View of a Round Birthday Cake with Icing and Baked Elements.jpg'
    ),
    glazedSweets: wikimediaImage('Olhos de sogras.jpg'),
    traditionalSweets: wikimediaImage('Brigadeiros.jpg'),
    gourmetSweets: wikimediaImage(
      'Truffles with nuts and chocolate dusting on plate.jpg'
    ),
    specialSweets: wikimediaImage('Bombom de coco 20190209.jpg'),
  },
  products: {
    roundCakes: wikimediaImage(
      'Side View of a Round Birthday Cake with Icing and Baked Elements.jpg'
    ),
    olhoDeSogra: wikimediaImage('Olhos de sogras.jpg'),
    vidradoDeDamasco: wikimediaImage('Chocolate-coated dried apricots.jpg'),
    ourico: wikimediaImage('Doce Cocada.jpg'),
    balaBaiana: wikimediaImage('Bala de coco.jpg'),
    brigadeiroPreto: wikimediaImage('Brigadeiro brasileiro.jpg'),
    brigadeiroBranco: wikimediaImage(
      'Brigadeiro de chocolate branco 20190209.jpg'
    ),
    brigadeiroDeAmendoim: wikimediaImage('Toffee-Peanuts.jpg'),
    brigadeiroCasadinho: wikimediaImage('Brigadeiros decorados.jpg'),
    beijinho: wikimediaImage('Beijinho o Doce Mais Querido.jpg'),
    brigadeiroDeChurros: wikimediaImage('Churros and chocolate.jpg'),
    brigadeiroDeLimaoSiciliano: wikimediaImage('Lemon Meringue Tart.jpg'),
    brigadeiroPrestigio: wikimediaImage('Bombom de coco 20190209.jpg'),
    brigadeiroCharge: wikimediaImage('Hazelnuts in chocolate 7657657.jpg'),
    brigadeiroDeCocoQueimadoComDoceDeLeite: wikimediaImage('Doce Cocada.jpg'),
    brigadeiroBrule: wikimediaImage('Creme brulee.jpg'),
    brigadeiroDeCafe: wikimediaImage(
      'Homemade chocolate truffles (4503995283).jpg'
    ),
    brigadeiroDeMaracuja: wikimediaImage('Mousse de maracujá.jpg'),
    brigadeiroDeNinhoComNutella: wikimediaImage('White chocolate truffles.jpg'),
    brigadeiroDeNinhoComMiniOreo: wikimediaImage('Oreo-Two-Cookies.jpg'),
    brigadeiroTortinhaDeLimao: wikimediaImage('A Lemon Meringue Tart.jpg'),
    brigadeiroDeChocolateBranco: wikimediaImage(
      'Brigadeiro de chocolate branco 20190209.jpg'
    ),
    brigadeiroDeChocolateAoLeite: wikimediaImage(
      'Truffles with nuts and chocolate dusting in detail.jpg'
    ),
    surpresaDeUva: wikimediaImage('Green Grapes.jpg'),
    bombomDeMorango: wikimediaImage('Chocolate covered strawberries.jpg'),
    coquinhoDeChocolate: wikimediaImage('Bombom de coco 20190209.jpg'),
    brigadeiroFerreroRocher: wikimediaImage(
      'Hazelnuts in chocolate 7657657.jpg'
    ),
    damascoRecheado: wikimediaImage('Chocolate-coated dried apricots.jpg'),
    brigadeiroRedVelvet: wikimediaImage('Red velvet cupcake.jpg'),
    tortinhaDeLimao: wikimediaImage('A Lemon Meringue Tart.jpg'),
    miniBrownieDecorado: wikimediaImage('Chocolate Brownie Decorated.jpg'),
    brigadeiroDeAmarula: wikimediaImage(
      'Truffles with nuts and chocolate dusting on plate.jpg'
    ),
  },
};

function createPackageSizes({
  twentyFive,
  fifty,
  hundred,
}: {
  twentyFive: number;
  fifty: number;
  hundred: number;
}): SeedProductSize[] {
  return [
    {
      code: '25_UNIDADES',
      label: '25 unidades',
      fullPrice: twentyFive,
    },
    {
      code: '50_UNIDADES',
      label: '50 unidades',
      fullPrice: fifty,
    },
    {
      code: '100_UNIDADES',
      label: '100 unidades',
      fullPrice: hundred,
    },
  ];
}

const sweetPackageSizes100 = createPackageSizes({
  twentyFive: 35,
  fifty: 55,
  hundred: 100,
});

const sweetPackageSizes120 = createPackageSizes({
  twentyFive: 45,
  fifty: 65,
  hundred: 120,
});

const sweetPackageSizes125 = createPackageSizes({
  twentyFive: 39,
  fifty: 68,
  hundred: 125,
});

const sweetPackageSizes150 = createPackageSizes({
  twentyFive: 60,
  fifty: 80,
  hundred: 150,
});

const sweetPackageSizes160 = createPackageSizes({
  twentyFive: 48,
  fifty: 85,
  hundred: 160,
});

const sweetPackageSizes160MiniBrownie = createPackageSizes({
  twentyFive: 60,
  fifty: 100,
  hundred: 160,
});

const sweetPackageSizes165 = createPackageSizes({
  twentyFive: 53.5,
  fifty: 90,
  hundred: 165,
});

const sweetPackageSizes170 = createPackageSizes({
  twentyFive: 55,
  fifty: 90,
  hundred: 170,
});

const sweetPackageSizes185 = createPackageSizes({
  twentyFive: 60,
  fifty: 100,
  hundred: 185,
});

const sweetPackageSizes195 = createPackageSizes({
  twentyFive: 57,
  fifty: 103,
  hundred: 195,
});

const sweetPackageSizes260 = createPackageSizes({
  twentyFive: 80,
  fifty: 140,
  hundred: 260,
});

const sweetPackageSizes300 = createPackageSizes({
  twentyFive: 83,
  fifty: 155,
  hundred: 300,
});

const sweetPackageSizes320 = createPackageSizes({
  twentyFive: 110,
  fifty: 180,
  hundred: 320,
});

function buildProductSizes(productSlug: string, sizes: SeedProductSize[]) {
  return sizes.map((size) => ({
    ...size,
    code: `${productSlug.toUpperCase().replaceAll('-', '_')}_${size.code}`,
  }));
}

const productCatalog: SeedCategory[] = [
  {
    name: 'Bolos',
    slug: 'bolos',
    description: 'Bolos artesanais da Buenos Cakes.',
    imageUrl: seedImages.categories.cakes,
    isActive: true,
    products: [
      {
        name: 'Bolos redondos',
        slug: 'bolos-redondos',
        description:
          'Bolos redondos com tamanhos de PP a GG e recheios variados.',
        basePrice: 58,
        coverImageUrl: seedImages.products.roundCakes,
        isActive: true,
        sizes: [
          {
            code: 'BOLOS_REDONDOS_PP',
            label: 'PP - 12 x 10 cm',
            servingsLabel: '7 a 9 fatias - 900 g',
            fullPrice: 58,
          },
          {
            code: 'BOLOS_REDONDOS_P',
            label: 'P - 15 x 10 cm',
            servingsLabel: '12 a 15 fatias - 1,500 kg',
            fullPrice: 93,
          },
          {
            code: 'BOLOS_REDONDOS_M',
            label: 'M - 20 x 10 cm',
            servingsLabel: '20 a 25 fatias - 2,500 kg',
            fullPrice: 140,
          },
          {
            code: 'BOLOS_REDONDOS_G',
            label: 'G - 25 x 10 cm',
            servingsLabel: '30 a 35 fatias - 3,500 kg',
            fullPrice: 173,
          },
          {
            code: 'BOLOS_REDONDOS_GG',
            label: 'GG - 30 x 10 cm',
            servingsLabel: '40 a 45 fatias - 5,500 kg',
            fullPrice: 238,
          },
        ],
        fillings: roundCakeFillings,
      },
    ],
  },
  {
    name: 'Doces vidrados',
    slug: 'doces-vidrados',
    description: 'Doces vidrados banhados na calda de açúcar.',
    imageUrl: seedImages.categories.glazedSweets,
    isActive: true,
    products: [
      {
        name: 'Olho de sogra',
        slug: 'olho-de-sogra',
        description:
          'Brigadeiro de coco com ameixa em cima, banhado na calda de açúcar.',
        basePrice: 60,
        coverImageUrl: seedImages.products.olhoDeSogra,
        isActive: true,
        sizes: buildProductSizes('olho-de-sogra', sweetPackageSizes185),
      },
      {
        name: 'Vidrado de damasco',
        slug: 'vidrado-de-damasco',
        description: 'Brigadeiro de damasco banhado na calda de açúcar.',
        basePrice: 60,
        coverImageUrl: seedImages.products.vidradoDeDamasco,
        isActive: true,
        sizes: buildProductSizes('vidrado-de-damasco', sweetPackageSizes185),
      },
      {
        name: 'Ouriço',
        slug: 'ourico',
        description:
          'Docinho de coco, banhado na calda de açúcar e finalizado com coco queimado.',
        basePrice: 53.5,
        coverImageUrl: seedImages.products.ourico,
        isActive: true,
        sizes: buildProductSizes('ourico', sweetPackageSizes165),
      },
      {
        name: 'Bala baiana',
        slug: 'bala-baiana',
        description: 'Brigadeiro de coco banhado na calda de açúcar.',
        basePrice: 53.5,
        coverImageUrl: seedImages.products.balaBaiana,
        isActive: true,
        sizes: buildProductSizes('bala-baiana', sweetPackageSizes165),
      },
    ],
  },
  {
    name: 'Docinhos tradicionais',
    slug: 'docinhos-tradicionais',
    description: 'Docinhos tradicionais para festas.',
    imageUrl: seedImages.categories.traditionalSweets,
    isActive: true,
    products: [
      {
        name: 'Brigadeiro preto',
        slug: 'brigadeiro-preto',
        description: 'Docinho tradicional de brigadeiro preto.',
        basePrice: 35,
        coverImageUrl: seedImages.products.brigadeiroPreto,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-preto', sweetPackageSizes100),
      },
      {
        name: 'Brigadeiro branco',
        slug: 'brigadeiro-branco',
        description: 'Docinho tradicional de brigadeiro branco.',
        basePrice: 35,
        coverImageUrl: seedImages.products.brigadeiroBranco,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-branco', sweetPackageSizes100),
      },
      {
        name: 'Brigadeiro de amendoim',
        slug: 'brigadeiro-de-amendoim',
        description: 'Docinho tradicional de brigadeiro de amendoim.',
        basePrice: 35,
        coverImageUrl: seedImages.products.brigadeiroDeAmendoim,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-amendoim',
          sweetPackageSizes100
        ),
      },
      {
        name: 'Brigadeiro casadinho',
        slug: 'brigadeiro-casadinho',
        description: 'Docinho tradicional de brigadeiro casadinho.',
        basePrice: 35,
        coverImageUrl: seedImages.products.brigadeiroCasadinho,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-casadinho', sweetPackageSizes100),
      },
      {
        name: 'Beijinho',
        slug: 'beijinho',
        description: 'Docinho tradicional de coco.',
        basePrice: 35,
        coverImageUrl: seedImages.products.beijinho,
        isActive: true,
        sizes: buildProductSizes('beijinho', sweetPackageSizes100),
      },
    ],
  },
  {
    name: 'Docinhos gourmet',
    slug: 'docinhos-gourmet',
    description: 'Docinhos gourmet para festas.',
    imageUrl: seedImages.categories.gourmetSweets,
    isActive: true,
    products: [
      {
        name: 'Brigadeiro de churros',
        slug: 'brigadeiro-de-churros',
        description: 'Docinho gourmet de brigadeiro de churros.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroDeChurros,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-de-churros', sweetPackageSizes120),
      },
      {
        name: 'Brigadeiro de limão siciliano',
        slug: 'brigadeiro-de-limao-siciliano',
        description: 'Docinho gourmet de brigadeiro de limão siciliano.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroDeLimaoSiciliano,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-limao-siciliano',
          sweetPackageSizes120
        ),
      },
      {
        name: 'Brigadeiro Prestígio',
        slug: 'brigadeiro-prestigio',
        description: 'Docinho gourmet de brigadeiro Prestígio.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroPrestigio,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-prestigio', sweetPackageSizes120),
      },
      {
        name: 'Brigadeiro Charge',
        slug: 'brigadeiro-charge',
        description: 'Docinho gourmet de brigadeiro Charge.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroCharge,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-charge', sweetPackageSizes120),
      },
      {
        name: 'Brigadeiro de coco queimado com doce de leite',
        slug: 'brigadeiro-de-coco-queimado-com-doce-de-leite',
        description:
          'Docinho gourmet de brigadeiro de coco queimado com doce de leite.',
        basePrice: 45,
        coverImageUrl:
          seedImages.products.brigadeiroDeCocoQueimadoComDoceDeLeite,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-coco-queimado-com-doce-de-leite',
          sweetPackageSizes120
        ),
      },
      {
        name: 'Brigadeiro brulé',
        slug: 'brigadeiro-brule',
        description: 'Docinho gourmet de brigadeiro brulé.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroBrule,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-brule', sweetPackageSizes120),
      },
      {
        name: 'Brigadeiro de café',
        slug: 'brigadeiro-de-cafe',
        description: 'Docinho gourmet de brigadeiro de café.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroDeCafe,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-de-cafe', sweetPackageSizes120),
      },
      {
        name: 'Brigadeiro de maracujá',
        slug: 'brigadeiro-de-maracuja',
        description: 'Docinho gourmet de brigadeiro de maracujá.',
        basePrice: 45,
        coverImageUrl: seedImages.products.brigadeiroDeMaracuja,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-maracuja',
          sweetPackageSizes120
        ),
      },
    ],
  },
  {
    name: 'Docinhos especiais',
    slug: 'docinhos-especiais',
    description: 'Docinhos especiais para festas.',
    imageUrl: seedImages.categories.specialSweets,
    isActive: true,
    products: [
      {
        name: 'Brigadeiro de ninho com Nutella',
        slug: 'brigadeiro-de-ninho-com-nutella',
        description: 'Brigadeiro de ninho com Nutella.',
        basePrice: 39,
        coverImageUrl: seedImages.products.brigadeiroDeNinhoComNutella,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-ninho-com-nutella',
          sweetPackageSizes125
        ),
      },
      {
        name: 'Brigadeiro de ninho com mini Oreo',
        slug: 'brigadeiro-de-ninho-com-mini-oreo',
        description: 'Brigadeiro de ninho com mini Oreo.',
        basePrice: 39,
        coverImageUrl: seedImages.products.brigadeiroDeNinhoComMiniOreo,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-ninho-com-mini-oreo',
          sweetPackageSizes125
        ),
      },
      {
        name: 'Brigadeiro tortinha de limão',
        slug: 'brigadeiro-tortinha-de-limao',
        description: 'Brigadeiro tortinha de limão.',
        basePrice: 39,
        coverImageUrl: seedImages.products.brigadeiroTortinhaDeLimao,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-tortinha-de-limao',
          sweetPackageSizes125
        ),
      },
      {
        name: 'Brigadeiro de chocolate branco',
        slug: 'brigadeiro-de-chocolate-branco',
        description:
          'Massa de leite condensado, creme de leite, chocolate branco nobre e confeitado com granulé branco.',
        basePrice: 48,
        coverImageUrl: seedImages.products.brigadeiroDeChocolateBranco,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-chocolate-branco',
          sweetPackageSizes160
        ),
      },
      {
        name: 'Brigadeiro de chocolate ao leite',
        slug: 'brigadeiro-de-chocolate-ao-leite',
        description:
          'Massa de chocolate ao leite nobre e confeitado com granulé ao leite.',
        basePrice: 48,
        coverImageUrl: seedImages.products.brigadeiroDeChocolateAoLeite,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-de-chocolate-ao-leite',
          sweetPackageSizes160
        ),
      },
      {
        name: 'Surpresa de uva',
        slug: 'surpresa-de-uva',
        description:
          'Uva verde sem sementes envolta na massa de brigadeiro de ninho, podendo ser branca ou verde, confeitada com leite em pó e detalhes com chocolate branco ou carimbos.',
        basePrice: 55,
        coverImageUrl: seedImages.products.surpresaDeUva,
        isActive: true,
        sizes: buildProductSizes('surpresa-de-uva', sweetPackageSizes170),
      },
      {
        name: 'Bombom de morango',
        slug: 'bombom-de-morango',
        description:
          'Morango envolto em brigadeiro de ninho e banhado no chocolate meio amargo.',
        basePrice: 83,
        coverImageUrl: seedImages.products.bombomDeMorango,
        isActive: true,
        sizes: buildProductSizes('bombom-de-morango', sweetPackageSizes300),
      },
      {
        name: 'Coquinho de chocolate',
        slug: 'coquinho-de-chocolate',
        description:
          'Chocolate em formato de coco, recheado com brigadeiro de coco cremoso.',
        basePrice: 60,
        coverImageUrl: seedImages.products.coquinhoDeChocolate,
        isActive: true,
        sizes: buildProductSizes('coquinho-de-chocolate', sweetPackageSizes150),
      },
      {
        name: 'Brigadeiro Ferrero Rocher',
        slug: 'brigadeiro-ferrero-rocher',
        description:
          'Massa de chocolate nobre ao leite e Nutella, recheado com avelã torrada, confeitado com castanha de caju ou amendoim triturado e finalizado com Nutella em cima.',
        basePrice: 48,
        coverImageUrl: seedImages.products.brigadeiroFerreroRocher,
        isActive: true,
        sizes: buildProductSizes(
          'brigadeiro-ferrero-rocher',
          sweetPackageSizes160
        ),
      },
      {
        name: 'Damasco recheado',
        slug: 'damasco-recheado',
        description:
          'Damasco recheado com brigadeiro branco e metade banhado no chocolate.',
        basePrice: 57,
        coverImageUrl: seedImages.products.damascoRecheado,
        isActive: true,
        sizes: buildProductSizes('damasco-recheado', sweetPackageSizes195),
      },
      {
        name: 'Brigadeiro Red Velvet',
        slug: 'brigadeiro-red-velvet',
        description:
          'Massa de leite condensado, creme de leite, pasta de baunilha, chocolate ao leite nobre e corante vermelho. Boleado e passado no leite Ninho com pó aveludado vermelho, finalizado com cream cheese.',
        basePrice: 48,
        coverImageUrl: seedImages.products.brigadeiroRedVelvet,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-red-velvet', sweetPackageSizes160),
      },
      {
        name: 'Tortinha de limão',
        slug: 'tortinha-de-limao',
        description:
          'Massa amanteigada, mousse de limão e finalizada com merengue.',
        basePrice: 110,
        coverImageUrl: seedImages.products.tortinhaDeLimao,
        isActive: true,
        sizes: buildProductSizes('tortinha-de-limao', sweetPackageSizes320),
      },
      {
        name: 'Mini brownie decorado',
        slug: 'mini-brownie-decorado',
        description: 'Mini brownie decorado com brigadeiro ou doce de leite.',
        basePrice: 60,
        coverImageUrl: seedImages.products.miniBrownieDecorado,
        isActive: true,
        sizes: buildProductSizes(
          'mini-brownie-decorado',
          sweetPackageSizes160MiniBrownie
        ),
      },
      {
        name: 'Brigadeiro de amarula',
        slug: 'brigadeiro-de-amarula',
        description:
          'Brigadeiro de amarula, confeitado com granulé de chocolate nobre e acompanha uma ampola de amarula em cada docinho.',
        basePrice: 80,
        coverImageUrl: seedImages.products.brigadeiroDeAmarula,
        isActive: true,
        sizes: buildProductSizes('brigadeiro-de-amarula', sweetPackageSizes260),
      },
    ],
  },
];

async function upsertCategory(categoryData: SeedCategory) {
  const existingCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, categoryData.slug),
  });

  if (existingCategory) {
    const [category] = await db
      .update(categories)
      .set({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        imageUrl: categoryData.imageUrl,
        isActive: categoryData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, existingCategory.id))
      .returning();

    if (!category) {
      throw new Error(`Failed to update category "${categoryData.slug}".`);
    }

    return category;
  }

  const [category] = await db
    .insert(categories)
    .values({
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description,
      imageUrl: categoryData.imageUrl,
      isActive: categoryData.isActive,
    })
    .returning();

  if (!category) {
    throw new Error(`Failed to create category "${categoryData.slug}".`);
  }

  return category;
}

async function upsertProduct(categoryId: string, productData: SeedProduct) {
  const existingProduct = await db.query.products.findFirst({
    where: eq(products.slug, productData.slug),
  });

  if (existingProduct) {
    const [product] = await db
      .update(products)
      .set({
        categoryId,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        basePrice: productData.basePrice,
        coverImageUrl: productData.coverImageUrl,
        isActive: productData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existingProduct.id))
      .returning();

    if (!product) {
      throw new Error(`Failed to update product "${productData.slug}".`);
    }

    return product;
  }

  const [product] = await db
    .insert(products)
    .values({
      categoryId,
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      basePrice: productData.basePrice,
      coverImageUrl: productData.coverImageUrl,
      isActive: productData.isActive,
    })
    .returning();

  if (!product) {
    throw new Error(`Failed to create product "${productData.slug}".`);
  }

  return product;
}

async function upsertProductSizes(productData: SeedProduct, productId: string) {
  for (const [index, size] of productData.sizes.entries()) {
    const existingSize = await db.query.productSizes.findFirst({
      where: eq(productSizes.code, size.code),
    });
    const priceDelta = size.fullPrice - productData.basePrice;
    const isDefault = size.isDefault ?? index === 0;
    const sortOrder = size.sortOrder ?? index;

    if (existingSize && existingSize.productId !== productId) {
      throw new Error(
        `Product size code "${size.code}" already exists for another product.`
      );
    }

    if (existingSize) {
      await db
        .update(productSizes)
        .set({
          productId,
          code: size.code,
          label: size.label,
          servingsLabel: size.servingsLabel ?? null,
          priceDelta,
          isDefault,
          sortOrder,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(productSizes.id, existingSize.id));

      continue;
    }

    await db.insert(productSizes).values({
      productId,
      code: size.code,
      label: size.label,
      servingsLabel: size.servingsLabel ?? null,
      priceDelta,
      isDefault,
      sortOrder,
      isActive: true,
    });
  }
}

async function upsertProductFillings(
  productData: SeedProduct,
  productId: string
) {
  for (const [index, label] of (productData.fillings ?? []).entries()) {
    const existingFilling = await db.query.productFillings.findFirst({
      where: eq(productFillings.label, label),
    });

    if (existingFilling && existingFilling.productId !== productId) {
      throw new Error(
        `Product filling "${label}" already exists for another product.`
      );
    }

    if (existingFilling) {
      await db
        .update(productFillings)
        .set({
          productId,
          label,
          priceDelta: 0,
          isDefault: index === 0,
          sortOrder: index,
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(productFillings.id, existingFilling.id));

      continue;
    }

    await db.insert(productFillings).values({
      productId,
      label,
      priceDelta: 0,
      isDefault: index === 0,
      sortOrder: index,
      isActive: true,
    });
  }
}

async function seedProducts() {
  for (const categoryData of productCatalog) {
    const category = await upsertCategory(categoryData);

    for (const productData of categoryData.products) {
      const product = await upsertProduct(category.id, productData);

      await upsertProductSizes(productData, product.id);
      await upsertProductFillings(productData, product.id);
    }
  }
}

async function main() {
  try {
    await seedProducts();
    console.log('Products seed completed.');
  } catch (error) {
    console.error('Products seed failed.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
