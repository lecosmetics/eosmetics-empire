import "server-only";

import type {
  Prisma,
} from "@prisma/client";

import {
  PUBLIC_CATEGORIES_DATA_CONFIG,
  PUBLIC_CATEGORY_PRODUCTS_PAGE_CONFIG,
} from "@/config/public-categories";

import {
  publicRouteBuilders,
} from "@/config/routes";

import {
  db,
} from "@/prisma/db";

import type {
  PublicCategoryDetail,
  PublicCategoryProduct,
  PublicCategoryProductCollection,
  PublicCategoryProductsPageData,
  PublicCategoryProductsQueryNullableResult,
} from "@/lib/public/categories/public-categories-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * REQUÊTE SERVEUR — PRODUITS D’UNE CATÉGORIE
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/categories/public-category-products-query.ts
 *
 * ============================================================================
 *
 * ROUTE CONSOMMATRICE :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * - recevoir le vrai slug ProductCategory ;
 * - vérifier que la catégorie existe ;
 * - vérifier qu’elle est active ;
 * - charger les vraies offres StoreProduct de cette catégorie ;
 * - conserver chaque StoreProduct comme une offre indépendante ;
 * - lire le vrai prix ;
 * - lire la vraie devise ;
 * - lire le vrai stock ;
 * - lire la vraie boutique ;
 * - lire la vraie ville ;
 * - lire le vrai pays ;
 * - sélectionner une vraie image produit ;
 * - construire la vraie route produit par qrToken ;
 * - retourner uniquement des données sérialisables par React.
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * ProductCategory
 *      ↓
 * Product
 *      ↓
 * StoreProduct
 *      ↓
 * Store
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Un Product vendu dans plusieurs Store produit plusieurs offres.
 *
 * Exemple :
 *
 * Product A
 *
 * ├── StoreProduct boutique 1
 * └── StoreProduct boutique 2
 *
 * La page catégorie conserve les deux offres.
 *
 * On ne fusionne JAMAIS par :
 *
 * - Product.id ;
 * - SKU ;
 * - slug ;
 * - nom.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - lire une session ;
 * - accepter un storeId depuis le navigateur ;
 * - inventer une catégorie ;
 * - inventer un produit ;
 * - inventer un prix ;
 * - inventer un stock ;
 * - inventer une boutique ;
 * - inventer une image ;
 * - construire une route produit manuellement ;
 * - modifier PostgreSQL ;
 * - modifier le stock.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const PRODUCT_VISIBILITY_CONFIG =
  PUBLIC_CATEGORIES_DATA_CONFIG
    .productCount;


const CATEGORY_PRODUCTS_CONFIG =
  PUBLIC_CATEGORY_PRODUCTS_PAGE_CONFIG;


/* ==========================================================================
   2. STATUTS PUBLICS
   ========================================================================== */

const PUBLIC_PRODUCT_STATUS =
  "ACTIVE" as const;


const PUBLIC_STORE_PRODUCT_STATUS =
  "ACTIVE" as const;


const PUBLIC_STORE_STATUS =
  "ACTIVE" as const;


/* ==========================================================================
   3. LIMITE
   ========================================================================== */

/**
 * Configuration actuelle :
 *
 * maxProducts = null
 *
 * donc toutes les offres éligibles de la catégorie sont chargées.
 */
const MAXIMUM_CATEGORY_PRODUCTS:
  number |
  null =
    CATEGORY_PRODUCTS_CONFIG
      .maxProducts;


/* ==========================================================================
   4. NORMALISATION TEXTE
   ========================================================================== */

function normalizeRequiredText(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
): string |
  null {
  const normalized =
    normalizeRequiredText(
      value,
    );


  return normalized.length >
    0
    ? normalized
    : null;
}


/* ==========================================================================
   5. NORMALISATION SLUG
   ========================================================================== */

/**
 * Le slug n’est jamais recréé depuis le nom.
 *
 * Il vient directement de :
 *
 * ProductCategory.slug
 *
 * ou du paramètre [slug] correspondant.
 */
function normalizeCategorySlug(
  value:
    string |
    null |
    undefined,
): string {
  return normalizeRequiredText(
    value,
  );
}


/* ==========================================================================
   6. SELECT — CATÉGORIE
   ========================================================================== */

const PUBLIC_CATEGORY_DETAIL_SELECT = {
  id:
    true,

  name:
    true,

  slug:
    true,

  description:
    true,

  imageUrl:
    true,

  imageAlt:
    true,

  isActive:
    true,
} satisfies Prisma.ProductCategorySelect;


/* ==========================================================================
   7. TYPE PRISMA — CATÉGORIE
   ========================================================================== */

type PublicRawCategoryDetail =
  Prisma.ProductCategoryGetPayload<{
    select:
      typeof PUBLIC_CATEGORY_DETAIL_SELECT;
  }>;


/* ==========================================================================
   8. SELECT — STORE PRODUCT
   ========================================================================== */

/**
 * On sélectionne seulement les données nécessaires à PublicProductCardData.
 *
 * Les Decimal Prisma seront sérialisés avant de quitter ce fichier.
 */
const PUBLIC_CATEGORY_STORE_PRODUCT_SELECT = {
  id:
    true,

  productId:
    true,

  price:
    true,

  compareAtPrice:
    true,

  currency:
    true,

  stockQuantity:
    true,

  lowStockThreshold:
    true,

  status:
    true,

  qrToken:
    true,

  createdAt:
    true,

  updatedAt:
    true,

  store: {
    select: {
      id:
        true,

      name:
        true,

      city:
        true,

      country:
        true,

      status:
        true,
    },
  },

  product: {
    select: {
      id:
        true,

      categoryId:
        true,

      name:
        true,

      slug:
        true,

      sku:
        true,

      status:
        true,

      images: {
        where: {
          url: {
            not:
              "",
          },
        },

        orderBy: [
          {
            position:
              "asc",
          },

          {
            createdAt:
              "asc",
          },

          {
            id:
              "asc",
          },
        ],

        select: {
          id:
            true,

          url:
            true,

          altText:
            true,

          position:
            true,

          isPrimary:
            true,
        },
      },
    },
  },
} satisfies Prisma.StoreProductSelect;


/* ==========================================================================
   9. TYPE PRISMA — OFFRE
   ========================================================================== */

type PublicRawCategoryStoreProduct =
  Prisma.StoreProductGetPayload<{
    select:
      typeof PUBLIC_CATEGORY_STORE_PRODUCT_SELECT;
  }>;


/* ==========================================================================
   10. IMAGE CATÉGORIE
   ========================================================================== */

function mapCategoryImage(
  category:
    PublicRawCategoryDetail,
): PublicCategoryDetail["image"] {
  const imageUrl =
    normalizeRequiredText(
      category.imageUrl,
    );


  if (
    imageUrl.length ===
    0
  ) {
    return null;
  }


  const categoryName =
    normalizeRequiredText(
      category.name,
    );


  const altText =
    normalizeRequiredText(
      category.imageAlt,
    ) ||
    categoryName;


  return {
    url:
      imageUrl,

    altText,
  };
}


/* ==========================================================================
   11. MAPPING CATÉGORIE
   ========================================================================== */

function mapCategoryDetail(
  category:
    PublicRawCategoryDetail,
): PublicCategoryDetail |
  null {
  const id =
    normalizeRequiredText(
      category.id,
    );


  const name =
    normalizeRequiredText(
      category.name,
    );


  const slug =
    normalizeCategorySlug(
      category.slug,
    );


  if (
    !id ||
    !name ||
    !slug
  ) {
    return null;
  }


  return {
    id,

    name,

    slug,

    description:
      normalizeOptionalText(
        category.description,
      ),

    image:
      mapCategoryImage(
        category,
      ),
  };
}


/* ==========================================================================
   12. WHERE — CATÉGORIE
   ========================================================================== */

function buildCategoryWhere(
  slug:
    string,
): Prisma.ProductCategoryWhereInput {
  const where:
    Prisma.ProductCategoryWhereInput = {
      slug,
    };


  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .requireActiveCategory
  ) {
    where.isActive =
      true;
  }


  return where;
}


/* ==========================================================================
   13. CHARGEMENT CATÉGORIE
   ========================================================================== */

async function queryCategoryBySlug(
  slug:
    string,
): Promise<
  PublicRawCategoryDetail |
  null
> {
  return db.productCategory.findFirst({
    where:
      buildCategoryWhere(
        slug,
      ),

    select:
      PUBLIC_CATEGORY_DETAIL_SELECT,
  });
}


/* ==========================================================================
   14. WHERE — PRODUCT
   ========================================================================== */

function buildCategoryProductWhere(
  categoryId:
    string,
): Prisma.ProductWhereInput {
  const where:
    Prisma.ProductWhereInput = {
      categoryId,
    };


  /* ------------------------------------------------------------------------
     PRODUCT ACTIF
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireActiveProduct
  ) {
    where.status =
      PUBLIC_PRODUCT_STATUS;
  }


  /* ------------------------------------------------------------------------
     VRAIE IMAGE
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireProductImage
  ) {
    where.images = {
      some: {
        url: {
          not:
            "",
        },
      },
    };
  }


  return where;
}


/* ==========================================================================
   15. WHERE — STORE PRODUCT
   ========================================================================== */

/**
 * Les règles sont volontairement identiques au compteur public des
 * catégories afin d’éviter une catégorie qui annonce des produits
 * différents de ceux réellement accessibles.
 */
function buildCategoryStoreProductWhere(
  categoryId:
    string,
): Prisma.StoreProductWhereInput {
  const where:
    Prisma.StoreProductWhereInput = {
      product:
        buildCategoryProductWhere(
          categoryId,
        ),
    };


  /* ------------------------------------------------------------------------
     STORE PRODUCT ACTIF
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireActiveStoreProduct
  ) {
    where.status =
      PUBLIC_STORE_PRODUCT_STATUS;
  }


  /* ------------------------------------------------------------------------
     STOCK POSITIF
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requirePositiveStock
  ) {
    where.stockQuantity = {
      gt:
        0,
    };
  }


  /* ------------------------------------------------------------------------
     PRIX POSITIF
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requirePositivePrice
  ) {
    where.price = {
      gt:
        0,
    };
  }


  /* ------------------------------------------------------------------------
     BOUTIQUE ACTIVE
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireActiveStore
  ) {
    where.store = {
      status:
        PUBLIC_STORE_STATUS,
    };
  }


  return where;
}


/* ==========================================================================
   16. ORDRE DES OFFRES
   ========================================================================== */

/**
 * Aucun classement "populaire", "meilleure vente" ou sponsorisé
 * n’est inventé.
 *
 * Ordre technique stable :
 *
 * 1. dernière mise à jour ;
 * 2. date de création ;
 * 3. id.
 */
const PUBLIC_CATEGORY_PRODUCT_ORDER:
  Prisma.StoreProductOrderByWithRelationInput[] =
    [
      {
        updatedAt:
          "desc",
      },

      {
        createdAt:
          "desc",
      },

      {
        id:
          "desc",
      },
    ];


/* ==========================================================================
   17. CHARGEMENT DES OFFRES
   ========================================================================== */

async function queryCategoryOffers(
  categoryId:
    string,
): Promise<
  PublicRawCategoryStoreProduct[]
> {
  const where =
    buildCategoryStoreProductWhere(
      categoryId,
    );


  if (
    typeof MAXIMUM_CATEGORY_PRODUCTS ===
      "number" &&
    Number.isInteger(
      MAXIMUM_CATEGORY_PRODUCTS,
    ) &&
    MAXIMUM_CATEGORY_PRODUCTS >
      0
  ) {
    return db.storeProduct.findMany({
      where,

      orderBy:
        PUBLIC_CATEGORY_PRODUCT_ORDER,

      take:
        MAXIMUM_CATEGORY_PRODUCTS,

      select:
        PUBLIC_CATEGORY_STORE_PRODUCT_SELECT,
    });
  }


  return db.storeProduct.findMany({
    where,

    orderBy:
      PUBLIC_CATEGORY_PRODUCT_ORDER,

    select:
      PUBLIC_CATEGORY_STORE_PRODUCT_SELECT,
  });
}


/* ==========================================================================
   18. DISPONIBILITÉ
   ========================================================================== */

function getProductAvailability(
  stockQuantity:
    number,

  lowStockThreshold:
    number,
):
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK" {
  if (
    stockQuantity <=
    0
  ) {
    return "OUT_OF_STOCK";
  }


  if (
    stockQuantity <=
    lowStockThreshold
  ) {
    return "LOW_STOCK";
  }


  return "IN_STOCK";
}


/* ==========================================================================
   19. IMAGE PRINCIPALE
   ========================================================================== */

function getPrimaryProductImage(
  images:
    PublicRawCategoryStoreProduct[
      "product"
    ][
      "images"
    ],

  productName:
    string,
): PublicCategoryProduct["image"] |
  null {
  if (
    images.length ===
    0
  ) {
    return null;
  }


  /**
   * On privilégie explicitement isPrimary.
   *
   * Sinon on prend la première vraie image selon l’ordre Prisma.
   */
  const image =
    images.find(
      (
        currentImage,
      ) =>
        currentImage.isPrimary &&
        normalizeRequiredText(
          currentImage.url,
        ).length >
          0,
    ) ??
    images.find(
      (
        currentImage,
      ) =>
        normalizeRequiredText(
          currentImage.url,
        ).length >
        0,
    );


  if (
    !image
  ) {
    return null;
  }


  const url =
    normalizeRequiredText(
      image.url,
    );


  if (
    !url
  ) {
    return null;
  }


  const altText =
    normalizeRequiredText(
      image.altText,
    ) ||
    productName;


  return {
    url,

    altText,
  };
}


/* ==========================================================================
   20. PRIX BARRÉ
   ========================================================================== */

/**
 * compareAtPrice est exposé uniquement lorsqu’il représente réellement
 * un prix supérieur au prix courant.
 */
function serializeValidCompareAtPrice(
  offer:
    PublicRawCategoryStoreProduct,
): string |
  null {
  const compareAtPrice =
    offer.compareAtPrice;


  if (
    compareAtPrice ===
    null
  ) {
    return null;
  }


  if (
    !compareAtPrice.gt(
      offer.price,
    )
  ) {
    return null;
  }


  return compareAtPrice.toFixed(
    2,
  );
}


/* ==========================================================================
   21. MAPPING OFFRE → PUBLIC PRODUCT CARD
   ========================================================================== */

function mapOfferToPublicProduct(
  offer:
    PublicRawCategoryStoreProduct,

  categoryId:
    string,
): PublicCategoryProduct |
  null {
  /* ------------------------------------------------------------------------
     OFFRE
     ------------------------------------------------------------------------ */

  const storeProductId =
    normalizeRequiredText(
      offer.id,
    );


  const productId =
    normalizeRequiredText(
      offer.productId,
    );


  const qrToken =
    normalizeRequiredText(
      offer.qrToken,
    );


  /* ------------------------------------------------------------------------
     PRODUCT
     ------------------------------------------------------------------------ */

  const productName =
    normalizeRequiredText(
      offer.product.name,
    );


  const productSlug =
    normalizeRequiredText(
      offer.product.slug,
    );


  const productSku =
    normalizeRequiredText(
      offer.product.sku,
    );


  const productCategoryId =
    normalizeRequiredText(
      offer.product.categoryId,
    );


  /* ------------------------------------------------------------------------
     STORE
     ------------------------------------------------------------------------ */

  const storeId =
    normalizeRequiredText(
      offer.store.id,
    );


  const storeName =
    normalizeRequiredText(
      offer.store.name,
    );


  const storeCity =
    normalizeRequiredText(
      offer.store.city,
    );


  const storeCountry =
    normalizeRequiredText(
      offer.store.country,
    );


  /* ------------------------------------------------------------------------
     DEVISE
     ------------------------------------------------------------------------ */

  const currency =
    normalizeRequiredText(
      offer.currency,
    ).toUpperCase();


  /* ------------------------------------------------------------------------
     VALIDATION MINIMALE
     ------------------------------------------------------------------------ */

  if (
    !storeProductId ||
    !productId ||
    !qrToken ||
    !productName ||
    !productSlug ||
    !productSku ||
    !productCategoryId ||
    !currency ||
    !storeId ||
    !storeName ||
    !storeCity ||
    !storeCountry
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     PROTECTION CATÉGORIE
     ------------------------------------------------------------------------ */

  if (
    productCategoryId !==
    categoryId
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     STATUTS
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireActiveProduct &&
    offer.product.status !==
      PUBLIC_PRODUCT_STATUS
  ) {
    return null;
  }


  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireActiveStoreProduct &&
    offer.status !==
      PUBLIC_STORE_PRODUCT_STATUS
  ) {
    return null;
  }


  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireActiveStore &&
    offer.store.status !==
      PUBLIC_STORE_STATUS
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     STOCK
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requirePositiveStock &&
    offer.stockQuantity <=
      0
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_VISIBILITY_CONFIG
      .requirePositivePrice &&
    !offer.price.gt(
      0,
    )
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IMAGE
     ------------------------------------------------------------------------ */

  const image =
    getPrimaryProductImage(
      offer.product.images,
      productName,
    );


  if (
    PRODUCT_VISIBILITY_CONFIG
      .requireProductImage &&
    !image
  ) {
    return null;
  }


  /**
   * PublicProductCardData exige une image réelle.
   *
   * Aucun placeholder fictif.
   */
  if (
    !image
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     DISPONIBILITÉ
     ------------------------------------------------------------------------ */

  const availability =
    getProductAvailability(
      offer.stockQuantity,
      offer.lowStockThreshold,
    );


  /**
   * Cette route affiche les produits réellement disponibles.
   *
   * Une offre sans stock ne doit donc pas atteindre la grille.
   */
  if (
    availability ===
    "OUT_OF_STOCK"
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     ROUTE PRODUIT CANONIQUE
     ------------------------------------------------------------------------ */

  const href =
    normalizeRequiredText(
      publicRouteBuilders
        .productByQr(
          qrToken,
        ),
    );


  if (
    !href
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     PRIX SÉRIALISÉS
     ------------------------------------------------------------------------ */

  const price =
    offer.price.toFixed(
      2,
    );


  const compareAtPrice =
    serializeValidCompareAtPrice(
      offer,
    );


  /* ------------------------------------------------------------------------
     RÉSULTAT
     ------------------------------------------------------------------------ */

  return {
    /**
     * Une carte représente l’offre StoreProduct.
     */
    id:
      storeProductId,

    productId,

    storeProductId,

    name:
      productName,

    slug:
      productSlug,

    sku:
      productSku,

    image,

    price,

    compareAtPrice,

    currency,

    stockQuantity:
      offer.stockQuantity,

    availability,

    status:
      PUBLIC_STORE_PRODUCT_STATUS,

    href,

    store: {
      id:
        storeId,

      name:
        storeName,

      city:
        storeCity,

      country:
        storeCountry,
    },
  };
}


/* ==========================================================================
   22. TYPE GUARD
   ========================================================================== */

function isPublicCategoryProduct(
  product:
    PublicCategoryProduct |
    null,
): product is PublicCategoryProduct {
  return product !==
    null;
}


/* ==========================================================================
   23. DÉDUPLICATION DE SÉCURITÉ
   ========================================================================== */

/**
 * Prisma retourne normalement chaque StoreProduct une seule fois.
 *
 * Cette protection empêche cependant une duplication accidentelle ultérieure.
 *
 * IMPORTANT :
 *
 * la clé est StoreProduct.id.
 *
 * On ne déduplique jamais par Product.id.
 */
function deduplicateStoreProducts(
  products:
    readonly PublicCategoryProduct[],
): PublicCategoryProductCollection {
  const seen =
    new Set<string>();


  const result:
    PublicCategoryProduct[] =
      [];


  for (
    const product
    of products
  ) {
    const storeProductId =
      normalizeRequiredText(
        product.storeProductId,
      );


    if (
      !storeProductId ||
      seen.has(
        storeProductId,
      )
    ) {
      continue;
    }


    seen.add(
      storeProductId,
    );


    result.push(
      product,
    );
  }


  return result;
}


/* ==========================================================================
   24. MAPPING COLLECTION
   ========================================================================== */

function mapCategoryOffers(
  offers:
    readonly PublicRawCategoryStoreProduct[],

  categoryId:
    string,
): PublicCategoryProductCollection {
  const products =
    offers
      .map(
        (
          offer,
        ) =>
          mapOfferToPublicProduct(
            offer,
            categoryId,
          ),
      )
      .filter(
        isPublicCategoryProduct,
      );


  return deduplicateStoreProducts(
    products,
  );
}


/* ==========================================================================
   25. API PRINCIPALE
   ========================================================================== */

/**
 * Fonction destinée à :
 *
 * src/app/(public)/categories/[slug]/page.tsx
 *
 * ============================================================================
 *
 * Retourne null si :
 *
 * - le slug est vide ;
 * - la catégorie n’existe pas ;
 * - la catégorie est inactive ;
 * - la catégorie est structurellement invalide.
 *
 * ============================================================================
 *
 * Une catégorie valide sans produit disponible retourne :
 *
 * {
 *   category,
 *   products: [],
 *   productCount: 0
 * }
 *
 * La route reste donc valide.
 */
export async function getPublicCategoryProductsData(
  slug:
    string,
): Promise<
  PublicCategoryProductsQueryNullableResult
> {
  /* ------------------------------------------------------------------------
     SLUG
     ------------------------------------------------------------------------ */

  const normalizedSlug =
    normalizeCategorySlug(
      slug,
    );


  if (
    !normalizedSlug
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     CATÉGORIE
     ------------------------------------------------------------------------ */

  const rawCategory =
    await queryCategoryBySlug(
      normalizedSlug,
    );


  if (
    !rawCategory
  ) {
    return null;
  }


  const category =
    mapCategoryDetail(
      rawCategory,
    );


  if (
    !category
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     OFFRES
     ------------------------------------------------------------------------ */

  const rawOffers =
    await queryCategoryOffers(
      category.id,
    );


  const products =
    mapCategoryOffers(
      rawOffers,
      category.id,
    );


  /* ------------------------------------------------------------------------
     RÉSULTAT FINAL
     ------------------------------------------------------------------------ */

  const result:
    PublicCategoryProductsPageData = {
      category,

      products,

      /**
       * Ce nombre correspond aux offres StoreProduct réellement
       * rendables sur cette page.
       */
      productCount:
        products.length,
    };


  return result;
}


/* ==========================================================================
   26. API COLLECTION SEULE
   ========================================================================== */

/**
 * Helper serveur facultatif.
 *
 * Il permet à une autre couche serveur de récupérer uniquement les offres
 * d’une catégorie sans dupliquer les règles métier.
 */
export async function getPublicCategoryProducts(
  slug:
    string,
): Promise<
  PublicCategoryProductCollection
> {
  const data =
    await getPublicCategoryProductsData(
      slug,
    );


  return data
    ?.products ??
    [];
}


/* ==========================================================================
   27. API CATÉGORIE SEULE
   ========================================================================== */

/**
 * Helper serveur facultatif pour récupérer uniquement la catégorie publique.
 *
 * Aucun produit n’est fabriqué lorsque la catégorie n’existe pas.
 */
export async function getPublicCategoryDetail(
  slug:
    string,
): Promise<
  PublicCategoryDetail |
  null
> {
  const normalizedSlug =
    normalizeCategorySlug(
      slug,
    );


  if (
    !normalizedSlug
  ) {
    return null;
  }


  const rawCategory =
    await queryCategoryBySlug(
      normalizedSlug,
    );


  if (
    !rawCategory
  ) {
    return null;
  }


  return mapCategoryDetail(
    rawCategory,
  );
}


/* ==========================================================================
   28. EXPORTS TYPES PRISMA INTERNES
   ========================================================================== */

export type {
  PublicRawCategoryDetail,
  PublicRawCategoryStoreProduct,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ROUTE :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * CATÉGORIE :
 *
 * - vraie ProductCategory ;
 * - vrai slug ;
 * - catégorie active ;
 * - vraie description éventuelle ;
 * - vraie image éventuelle ;
 * - aucun fallback visuel fictif.
 *
 * ============================================================================
 *
 * PRODUITS :
 *
 * Chaque carte représente :
 *
 * StoreProduct
 *
 * et non simplement Product.
 *
 * ============================================================================
 *
 * CONDITIONS PUBLIQUES :
 *
 * Product.status = ACTIVE
 *
 * StoreProduct.status = ACTIVE
 *
 * StoreProduct.stockQuantity > 0
 *
 * StoreProduct.price > 0
 *
 * Store.status = ACTIVE
 *
 * vraie ProductImage
 *
 * ============================================================================
 *
 * ROUTE PRODUIT :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * PRIX :
 *
 * StoreProduct.price
 *
 * ============================================================================
 *
 * DEVISE :
 *
 * StoreProduct.currency
 *
 * ============================================================================
 *
 * STOCK :
 *
 * StoreProduct.stockQuantity
 *
 * ============================================================================
 *
 * BOUTIQUE :
 *
 * StoreProduct
 *      ↓
 * Store
 *
 * ============================================================================
 *
 * DÉDUPLICATION :
 *
 * uniquement StoreProduct.id.
 *
 * Jamais :
 *
 * Product.id
 * SKU
 * slug
 * nom.
 *
 * ============================================================================
 *
 * CATÉGORIE VIDE :
 *
 * Une catégorie réelle et active avec zéro produit disponible reste une
 * vraie page :
 *
 * products = []
 * productCount = 0
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - donnée fictive ;
 * - route produit inventée ;
 * - session ;
 * - modification DB ;
 * - logique React ;
 * - logique navigateur.
 *
 * ============================================================================
 */