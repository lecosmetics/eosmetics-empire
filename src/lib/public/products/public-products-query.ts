import "server-only";

import {
  Prisma,
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  PUBLIC_PRODUCTS_AVAILABILITY_CONFIG,
  PUBLIC_PRODUCTS_PAGINATION_CONFIG,
  PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG,
  PUBLIC_PRODUCTS_QUERY_PARAMETERS,
  PUBLIC_PRODUCTS_ROUTE,
  PUBLIC_PRODUCTS_SORT_CONFIG,
} from "@/config/public-products";

import {
  publicRouteBuilders,
} from "@/config/routes";

import type {
  PublicProductsActiveFilters,
  PublicProductsCategoryFilterCollection,
  PublicProductsCategoryFilterOption,
  PublicProductsPageData,
  PublicProductsPaginationLink,
  PublicProductsPaginationView,
  PublicProductsPriceBounds,
  PublicProductsQueryInput,
  PublicProductsRawSearchParams,
  PublicProductsSortValue,
} from "@/lib/public/products/public-products-types";

import type {
  PublicProductCardData,
} from "@/lib/public/products/public-product-types";

import {
  db,
} from "@/prisma/db";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * REQUÊTES SERVEUR — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/products/public-products-query.ts
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Préparer toutes les données réelles nécessaires à la page publique :
 *
 * /produits
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * ============================================================================
 *
 * UNE CARTE PUBLIQUE REPRÉSENTE :
 *
 * UNE offre StoreProduct.
 *
 * Le même Product vendu par plusieurs boutiques doit donc produire
 * plusieurs cartes distinctes.
 *
 * ============================================================================
 *
 * DONNÉES COMMERCIALES
 *
 * Product :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - sku ;
 * - images ;
 * - catégorie.
 *
 * StoreProduct :
 *
 * - id ;
 * - price ;
 * - compareAtPrice ;
 * - currency ;
 * - stockQuantity ;
 * - lowStockThreshold ;
 * - status ;
 * - qrToken ;
 * - createdAt ;
 * - updatedAt.
 *
 * Store :
 *
 * - id ;
 * - name ;
 * - city ;
 * - country ;
 * - status.
 *
 * ============================================================================
 *
 * VISIBILITÉ ACTUELLE DU CATALOGUE
 *
 * Product.status = ACTIVE
 *
 * +
 *
 * StoreProduct.status = ACTIVE
 *
 * +
 *
 * StoreProduct.stockQuantity > 0
 *
 * +
 *
 * StoreProduct.price > 0
 *
 * +
 *
 * Store.status = ACTIVE
 *
 * +
 *
 * vraie ProductImage
 *
 * ============================================================================
 *
 * FILTRES
 *
 * - catégorie réelle ;
 * - prix minimum ;
 * - prix maximum ;
 * - promotion réelle ;
 * - tri ;
 * - pagination.
 *
 * ============================================================================
 *
 * PROMOTION
 *
 * Une offre est réellement promotionnelle uniquement si :
 *
 * compareAtPrice !== null
 *
 * ET
 *
 * compareAtPrice > price
 *
 * ============================================================================
 *
 * MULTI-DEVISE
 *
 * IMPORTANT :
 *
 * Une comparaison globale de :
 *
 * 10 000 XAF
 *
 * avec :
 *
 * 25 EUR
 *
 * n'aurait aucun sens sans conversion monétaire.
 *
 * Le filtre par prix et les tris par prix ne sont donc utilisés que lorsque
 * l'ensemble courant des offres filtrables possède une seule devise réelle.
 *
 * Aucune conversion de devise fictive n'est effectuée ici.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - créer de produit fictif ;
 * - créer de prix fictif ;
 * - créer de stock fictif ;
 * - créer de devise fictive ;
 * - créer de boutique fictive ;
 * - créer de catégorie fictive ;
 * - fusionner plusieurs StoreProduct du même Product ;
 * - faire confiance au prix venant du navigateur ;
 * - modifier le stock ;
 * - gérer une commande ;
 * - gérer la session Gestionnaire ;
 * - construire manuellement /p/[qrToken] ;
 * - exposer Prisma.Decimal aux composants ;
 * - exposer des objets Prisma complets aux composants.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONSTANTES
   ========================================================================== */

const PUBLIC_PRODUCT_STATUS =
  ProductStatus.ACTIVE;


const PUBLIC_STORE_PRODUCT_STATUS =
  StoreProductStatus.ACTIVE;


const PUBLIC_STORE_STATUS =
  StoreStatus.ACTIVE;


const PUBLIC_PRODUCTS_PAGE_SIZE =
  PUBLIC_PRODUCTS_PAGINATION_CONFIG
    .pageSize;


const PUBLIC_PRODUCTS_FIRST_PAGE =
  PUBLIC_PRODUCTS_PAGINATION_CONFIG
    .firstPage;


const PUBLIC_PRODUCTS_MAX_VISIBLE_PAGE_BUTTONS =
  PUBLIC_PRODUCTS_PAGINATION_CONFIG
    .maximumVisiblePageButtons;


/**
 * Limite défensive d'un slug reçu depuis l'URL.
 */
const PUBLIC_PRODUCTS_MAX_SLUG_LENGTH =
  191;


/**
 * Decimal(12, 2)
 *
 * Maximum théorique :
 *
 * 9 999 999 999.99
 */
const PUBLIC_PRODUCTS_MAX_PRICE_INTEGER_DIGITS =
  10;


/* ==========================================================================
   2. TYPES INTERNES
   ========================================================================== */

type PublicProductsRequestedFilters =
  Readonly<{
    categorySlug:
      string |
      null;

    minimumPrice:
      string |
      null;

    maximumPrice:
      string |
      null;

    promotionOnly:
      boolean;

    sort:
      PublicProductsSortValue;

    page:
      number;
  }>;


type PublicProductsInternalPriceContext =
  Readonly<{
    bounds:
      PublicProductsPriceBounds;

    canComparePrices:
      boolean;
  }>;


/* ==========================================================================
   3. NORMALISATION TEXTE
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


function normalizeCurrency(
  value:
    string |
    null |
    undefined,
): string {
  return normalizeRequiredText(
    value,
  ).toUpperCase();
}


/* ==========================================================================
   4. LECTURE D'UN SEARCH PARAM
   ========================================================================== */

function getSingleSearchParam(
  searchParams:
    PublicProductsRawSearchParams,

  parameter:
    string,
): string {
  const value =
    searchParams[
      parameter
    ];


  if (
    typeof value ===
    "string"
  ) {
    return value;
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    const firstValue =
      value[0];


    return typeof firstValue ===
      "string"
      ? firstValue
      : "";
  }


  return "";
}


/* ==========================================================================
   5. CATÉGORIE
   ========================================================================== */

function normalizeCategorySlug(
  value:
    string,
): string |
  null {
  const normalized =
    normalizeRequiredText(
      value,
    );


  if (
    normalized.length ===
      0 ||
    normalized.length >
      PUBLIC_PRODUCTS_MAX_SLUG_LENGTH
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   6. PAGE
   ========================================================================== */

function normalizePageNumber(
  value:
    string,
): number {
  const normalized =
    normalizeRequiredText(
      value,
    );


  if (
    !/^\d+$/.test(
      normalized,
    )
  ) {
    return PUBLIC_PRODUCTS_FIRST_PAGE;
  }


  const parsed =
    Number.parseInt(
      normalized,
      10,
    );


  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed <
      PUBLIC_PRODUCTS_FIRST_PAGE
  ) {
    return PUBLIC_PRODUCTS_FIRST_PAGE;
  }


  return parsed;
}


/* ==========================================================================
   7. PRIX
   ========================================================================== */

function normalizeMoneyInput(
  value:
    string,
): string |
  null {
  const normalized =
    normalizeRequiredText(
      value,
    )
      .replace(
        ",",
        ".",
      );


  if (
    normalized.length ===
    0
  ) {
    return null;
  }


  const pattern =
    new RegExp(
      `^\\d{1,${PUBLIC_PRODUCTS_MAX_PRICE_INTEGER_DIGITS}}(?:\\.\\d{1,2})?$`,
    );


  if (
    !pattern.test(
      normalized,
    )
  ) {
    return null;
  }


  try {
    const decimal =
      new Prisma.Decimal(
        normalized,
      );


    if (
      decimal.isNegative()
    ) {
      return null;
    }


    return decimal.toFixed(
      2,
    );
  } catch {
    return null;
  }
}


function normalizePriceRange(
  minimumPrice:
    string |
    null,

  maximumPrice:
    string |
    null,
): Readonly<{
  minimumPrice:
    string |
    null;

  maximumPrice:
    string |
    null;
}> {
  if (
    !minimumPrice ||
    !maximumPrice
  ) {
    return {
      minimumPrice,

      maximumPrice,
    };
  }


  try {
    const minimum =
      new Prisma.Decimal(
        minimumPrice,
      );

    const maximum =
      new Prisma.Decimal(
        maximumPrice,
      );


    /**
     * Une plage inversée n'est pas corrigée silencieusement.
     *
     * On ignore la plage plutôt que d'inventer l'intention de l'utilisateur.
     */
    if (
      minimum.gt(
        maximum,
      )
    ) {
      return {
        minimumPrice:
          null,

        maximumPrice:
          null,
      };
    }


    return {
      minimumPrice,

      maximumPrice,
    };
  } catch {
    return {
      minimumPrice:
        null,

      maximumPrice:
        null,
    };
  }
}


/* ==========================================================================
   8. TRI
   ========================================================================== */

function isPublicProductsSortValue(
  value:
    string,
): value is PublicProductsSortValue {
  return PUBLIC_PRODUCTS_SORT_CONFIG
    .options
    .some(
      (
        option,
      ) =>
        option.value ===
        value,
    );
}


function normalizeSortValue(
  value:
    string,
): PublicProductsSortValue {
  const normalized =
    normalizeRequiredText(
      value,
    );


  if (
    isPublicProductsSortValue(
      normalized,
    )
  ) {
    return normalized;
  }


  return PUBLIC_PRODUCTS_SORT_CONFIG
    .defaultValue;
}


/* ==========================================================================
   9. PROMOTION
   ========================================================================== */

function normalizePromotionFilter(
  value:
    string,
): boolean {
  return (
    normalizeRequiredText(
      value,
    ) ===
    PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG
      .activeValue
  );
}


/* ==========================================================================
   10. NORMALISATION DES PARAMÈTRES URL
   ========================================================================== */

function normalizeRequestedFilters(
  searchParams:
    PublicProductsRawSearchParams,
): PublicProductsRequestedFilters {
  const rawCategory =
    getSingleSearchParam(
      searchParams,
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .category,
    );


  const rawMinimumPrice =
    getSingleSearchParam(
      searchParams,
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .minPrice,
    );


  const rawMaximumPrice =
    getSingleSearchParam(
      searchParams,
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .maxPrice,
    );


  const rawPromotion =
    getSingleSearchParam(
      searchParams,
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .promotion,
    );


  const rawSort =
    getSingleSearchParam(
      searchParams,
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .sort,
    );


  const rawPage =
    getSingleSearchParam(
      searchParams,
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .page,
    );


  const priceRange =
    normalizePriceRange(
      normalizeMoneyInput(
        rawMinimumPrice,
      ),

      normalizeMoneyInput(
        rawMaximumPrice,
      ),
    );


  return {
    categorySlug:
      normalizeCategorySlug(
        rawCategory,
      ),

    minimumPrice:
      priceRange
        .minimumPrice,

    maximumPrice:
      priceRange
        .maximumPrice,

    promotionOnly:
      normalizePromotionFilter(
        rawPromotion,
      ),

    sort:
      normalizeSortValue(
        rawSort,
      ),

    page:
      normalizePageNumber(
        rawPage,
      ),
  };
}


/* ==========================================================================
   11. WHERE — STORE
   ========================================================================== */

function buildPublicStoreWhere():
  Prisma.StoreWhereInput {
  const where:
    Prisma.StoreWhereInput =
      {};


  if (
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG
      .requireActiveStore
  ) {
    where.status =
      PUBLIC_STORE_STATUS;
  }


  /**
   * PublicProductCardData exige :
   *
   * - name ;
   * - city ;
   * - country.
   *
   * On élimine déjà les chaînes réellement vides.
   */
  where.name = {
    not:
      "",
  };


  where.city = {
    not:
      "",
  };


  where.country = {
    not:
      "",
  };


  return where;
}


/* ==========================================================================
   12. WHERE — PRODUCT
   ========================================================================== */

function buildPublicProductWhere(
  categorySlug:
    string |
    null,
): Prisma.ProductWhereInput {
  const where:
    Prisma.ProductWhereInput =
      {};


  if (
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG
      .requireActiveProduct
  ) {
    where.status =
      PUBLIC_PRODUCT_STATUS;
  }


  /**
   * Contrat obligatoire de PublicProductCardData.
   */
  where.name = {
    not:
      "",
  };


  where.slug = {
    not:
      "",
  };


  where.sku = {
    not:
      "",
  };


  if (
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG
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


  if (
    categorySlug
  ) {
    where.category = {
      isActive:
        true,

      slug:
        categorySlug,
    };
  }


  return where;
}


/* ==========================================================================
   13. WHERE — STORE PRODUCT DE BASE
   ========================================================================== */

function buildBaseStoreProductWhere(
  filters:
    Pick<
      PublicProductsRequestedFilters,
      | "categorySlug"
      | "promotionOnly"
    >,
): Prisma.StoreProductWhereInput {
  const where:
    Prisma.StoreProductWhereInput =
      {
        product:
          buildPublicProductWhere(
            filters.categorySlug,
          ),

        store:
          buildPublicStoreWhere(),
      };


  if (
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG
      .requireActiveStoreProduct
  ) {
    where.status =
      PUBLIC_STORE_PRODUCT_STATUS;
  }


  if (
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG
      .requirePositiveStock
  ) {
    where.stockQuantity = {
      gt:
        0,
    };
  }


  if (
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG
      .requirePositivePrice
  ) {
    where.price = {
      gt:
        0,
    };
  }


  /**
   * Une offre sans qrToken exploitable ne peut pas produire
   * de vraie route publique.
   */
  where.qrToken = {
    not:
      "",
  };


  /**
   * La carte produit exige une devise réelle.
   */
  where.currency = {
    not:
      "",
  };


  /* ------------------------------------------------------------------------
     PROMOTION RÉELLE
     ------------------------------------------------------------------------ */

  if (
    filters.promotionOnly
  ) {
    /**
     * Prisma 7 permet de comparer deux champs scalaires du même modèle.
     *
     * On demande donc réellement :
     *
     * compareAtPrice > price
     *
     * sans inventer de pourcentage promotionnel.
     */
    where.compareAtPrice = {
      not:
        null,

      gt:
        db
          .storeProduct
          .fields
          .price,
    };
  }


  return where;
}


/* ==========================================================================
   14. CONTEXTE DE DEVISE ET BORNES DE PRIX
   ========================================================================== */

async function getPublicProductsPriceContext(
  where:
    Prisma.StoreProductWhereInput,
): Promise<
  PublicProductsInternalPriceContext
> {
  const currencies =
    await db.storeProduct.findMany({
      where,

      select: {
        currency:
          true,
      },

      distinct: [
        "currency",
      ],

      orderBy: {
        currency:
          "asc",
      },

      /**
       * Deux devises suffisent pour savoir qu'aucune comparaison
       * monétaire globale sûre n'est possible.
       */
      take:
        2,
    });


  const normalizedCurrencies =
    Array.from(
      new Set(
        currencies
          .map(
            (
              row,
            ) =>
              normalizeCurrency(
                row.currency,
              ),
          )
          .filter(
            (
              currency,
            ) =>
              /^[A-Z]{3}$/.test(
                currency,
              ),
          ),
      ),
    );


  if (
    normalizedCurrencies.length !==
    1
  ) {
    return {
      bounds: {
        minimum:
          null,

        maximum:
          null,

        currency:
          null,
      },

      canComparePrices:
        false,
    };
  }


  const currency =
    normalizedCurrencies[0];


  if (
    !currency
  ) {
    return {
      bounds: {
        minimum:
          null,

        maximum:
          null,

        currency:
          null,
      },

      canComparePrices:
        false,
    };
  }


  const aggregate =
    await db.storeProduct.aggregate({
      where: {
        ...where,

        currency,
      },

      _min: {
        price:
          true,
      },

      _max: {
        price:
          true,
      },
    });


  const minimum =
    aggregate
      ._min
      .price;


  const maximum =
    aggregate
      ._max
      .price;


  if (
    !minimum ||
    !maximum
  ) {
    return {
      bounds: {
        minimum:
          null,

        maximum:
          null,

        currency,
      },

      canComparePrices:
        false,
    };
  }


  return {
    bounds: {
      minimum:
        minimum.toFixed(
          2,
        ),

      maximum:
        maximum.toFixed(
          2,
        ),

      currency,
    },

    canComparePrices:
      true,
  };
}


/* ==========================================================================
   15. FILTRES ACTIFS DÉFINITIFS
   ========================================================================== */

function finalizeActiveFilters(
  requested:
    PublicProductsRequestedFilters,

  priceContext:
    PublicProductsInternalPriceContext,
): PublicProductsActiveFilters {
  /**
   * Sans devise unique, une comparaison de prix serait incorrecte.
   *
   * On ignore donc proprement les paramètres min/max au lieu de comparer
   * des monnaies différentes.
   */
  const minimumPrice =
    priceContext
      .canComparePrices
      ? requested
          .minimumPrice
      : null;


  const maximumPrice =
    priceContext
      .canComparePrices
      ? requested
          .maximumPrice
      : null;


  /**
   * Même protection pour les tris par prix.
   */
  const requestedPriceSort =
    requested.sort ===
      "price-asc" ||
    requested.sort ===
      "price-desc";


  const sort =
    requestedPriceSort &&
    !priceContext
      .canComparePrices
      ? PUBLIC_PRODUCTS_SORT_CONFIG
          .defaultValue
      : requested.sort;


  return {
    categorySlug:
      requested.categorySlug,

    minimumPrice,

    maximumPrice,

    promotionOnly:
      requested.promotionOnly,

    sort,

    page:
      requested.page,
  };
}


/* ==========================================================================
   16. WHERE FINAL AVEC PRIX
   ========================================================================== */

function buildFinalStoreProductWhere(
  filters:
    PublicProductsActiveFilters,
): Prisma.StoreProductWhereInput {
  const where =
    buildBaseStoreProductWhere({
      categorySlug:
        filters.categorySlug,

      promotionOnly:
        filters.promotionOnly,
    });


  const priceFilter:
    Prisma.DecimalFilter = {
      gt:
        new Prisma.Decimal(
          0,
        ),
    };


  if (
    filters.minimumPrice
  ) {
    priceFilter.gte =
      new Prisma.Decimal(
        filters.minimumPrice,
      );


    /**
     * `gte` remplace effectivement le besoin du `gt: 0`
     * lorsque le minimum utilisateur est positif.
     *
     * On conserve néanmoins le filtre de base si minimum = 0.
     */
    if (
      new Prisma.Decimal(
        filters.minimumPrice,
      ).gt(
        0,
      )
    ) {
      delete priceFilter.gt;
    }
  }


  if (
    filters.maximumPrice
  ) {
    priceFilter.lte =
      new Prisma.Decimal(
        filters.maximumPrice,
      );
  }


  where.price =
    priceFilter;


  return where;
}


/* ==========================================================================
   17. ORDRE PRISMA
   ========================================================================== */

function buildStoreProductOrderBy(
  sort:
    PublicProductsSortValue,
): Prisma.StoreProductOrderByWithRelationInput[] {
  switch (
    sort
  ) {
    case "price-asc":
      return [
        {
          price:
            "asc",
        },

        {
          id:
            "asc",
        },
      ];


    case "price-desc":
      return [
        {
          price:
            "desc",
        },

        {
          id:
            "asc",
        },
      ];


    case "name-asc":
      return [
        {
          product: {
            name:
              "asc",
          },
        },

        {
          id:
            "asc",
        },
      ];


    case "recent":
    default:
      return [
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
  }
}


/* ==========================================================================
   18. SELECT — OFFRE PRODUIT
   ========================================================================== */

/**
 * Une seule ProductImage est nécessaire à la carte catalogue.
 *
 * Ordre :
 *
 * 1. isPrimary DESC ;
 * 2. position ASC ;
 * 3. createdAt ASC ;
 * 4. id ASC.
 */
const PUBLIC_PRODUCTS_STORE_PRODUCT_SELECT = {
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

        orderBy: [
          {
            isPrimary:
              "desc",
          },

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

        take:
          1,
      },
    },
  },
} satisfies Prisma.StoreProductSelect;


/* ==========================================================================
   19. TYPE EXACT PRISMA
   ========================================================================== */

type PublicProductsRawStoreProduct =
  Prisma.StoreProductGetPayload<{
    select:
      typeof PUBLIC_PRODUCTS_STORE_PRODUCT_SELECT;
  }>;


/* ==========================================================================
   20. IMAGE PRINCIPALE
   ========================================================================== */

function getPublicProductCardImage(
  row:
    PublicProductsRawStoreProduct,
): PublicProductCardData["image"] |
  null {
  const productName =
    normalizeRequiredText(
      row.product.name,
    );


  const image =
    row.product
      .images[0];


  if (
    !image ||
    !productName
  ) {
    return null;
  }


  const imageUrl =
    normalizeRequiredText(
      image.url,
    );


  if (
    !imageUrl
  ) {
    return null;
  }


  const imageAlt =
    normalizeRequiredText(
      image.altText,
    ) ||
    productName;


  return {
    url:
      imageUrl,

    altText:
      imageAlt,
  };
}


/* ==========================================================================
   21. DISPONIBILITÉ
   ========================================================================== */

function getPublicProductAvailability(
  row:
    PublicProductsRawStoreProduct,
): PublicProductCardData[
  "availability"
] {
  const stockQuantity =
    Math.max(
      0,
      Math.trunc(
        row.stockQuantity,
      ),
    );


  const lowStockThreshold =
    Math.max(
      0,
      Math.trunc(
        row.lowStockThreshold,
      ),
    );


  if (
    row.status !==
      StoreProductStatus.ACTIVE ||
    stockQuantity <=
      0
  ) {
    return "OUT_OF_STOCK";
  }


  if (
    lowStockThreshold >
      0 &&
    stockQuantity <=
      lowStockThreshold
  ) {
    return "LOW_STOCK";
  }


  return "IN_STOCK";
}


/* ==========================================================================
   22. PRIX BARRÉ
   ========================================================================== */

function serializeValidCompareAtPrice(
  row:
    PublicProductsRawStoreProduct,
): string |
  null {
  const compareAtPrice =
    row.compareAtPrice;


  if (
    compareAtPrice ===
    null
  ) {
    return null;
  }


  if (
    !compareAtPrice.gt(
      row.price,
    )
  ) {
    return null;
  }


  return compareAtPrice.toFixed(
    2,
  );
}


/* ==========================================================================
   23. MAPPING PRISMA → CARTE PUBLIQUE
   ========================================================================== */

function mapRawStoreProductToPublicProduct(
  row:
    PublicProductsRawStoreProduct,
): PublicProductCardData |
  null {
  const storeProductId =
    normalizeRequiredText(
      row.id,
    );


  const productId =
    normalizeRequiredText(
      row.productId,
    );


  const productName =
    normalizeRequiredText(
      row.product.name,
    );


  const productSlug =
    normalizeRequiredText(
      row.product.slug,
    );


  const productSku =
    normalizeRequiredText(
      row.product.sku,
    );


  const qrToken =
    normalizeRequiredText(
      row.qrToken,
    );


  const currency =
    normalizeCurrency(
      row.currency,
    );


  const storeId =
    normalizeRequiredText(
      row.store.id,
    );


  const storeName =
    normalizeRequiredText(
      row.store.name,
    );


  const storeCity =
    normalizeRequiredText(
      row.store.city,
    );


  const storeCountry =
    normalizeRequiredText(
      row.store.country,
    );


  if (
    !storeProductId ||
    !productId ||
    !productName ||
    !productSlug ||
    !productSku ||
    !qrToken ||
    !currency ||
    !storeId ||
    !storeName ||
    !storeCity ||
    !storeCountry
  ) {
    return null;
  }


  if (
    row.product.status !==
      ProductStatus.ACTIVE ||
    row.store.status !==
      StoreStatus.ACTIVE ||
    row.status !==
      StoreProductStatus.ACTIVE
  ) {
    return null;
  }


  if (
    row.stockQuantity <=
      0 ||
    !row.price.gt(
      0,
    )
  ) {
    return null;
  }


  const image =
    getPublicProductCardImage(
      row,
    );


  if (
    !image
  ) {
    return null;
  }


  const href =
    publicRouteBuilders
      .productByQr(
        qrToken,
      );


  if (
    !href
  ) {
    return null;
  }


  return {
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

    price:
      row.price.toFixed(
        2,
      ),

    compareAtPrice:
      serializeValidCompareAtPrice(
        row,
      ),

    currency,

    stockQuantity:
      Math.max(
        0,
        Math.trunc(
          row.stockQuantity,
        ),
      ),

    availability:
      getPublicProductAvailability(
        row,
      ),

    status:
      "ACTIVE",

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
   24. TYPE GUARD
   ========================================================================== */

function isPublicProductCardData(
  value:
    PublicProductCardData |
    null,
): value is PublicProductCardData {
  return value !==
    null;
}


/* ==========================================================================
   25. CATÉGORIES — SELECT
   ========================================================================== */

/**
 * On compte ici les OFFRES StoreProduct et non seulement les Product.
 *
 * Exemple :
 *
 * Product A
 *   ├── StoreProduct A1
 *   └── StoreProduct A2
 *
 * availableOfferCount = 2
 */
const PUBLIC_PRODUCTS_CATEGORY_FILTER_SELECT = {
  id:
    true,

  name:
    true,

  slug:
    true,

  products: {
    where: {
      status:
        PUBLIC_PRODUCT_STATUS,

      name: {
        not:
          "",
      },

      slug: {
        not:
          "",
      },

      sku: {
        not:
          "",
      },

      images: {
        some: {
          url: {
            not:
              "",
          },
        },
      },
    },

    select: {
      _count: {
        select: {
          storeProducts: {
            where: {
              status:
                PUBLIC_STORE_PRODUCT_STATUS,

              stockQuantity: {
                gt:
                  0,
              },

              price: {
                gt:
                  0,
              },

              qrToken: {
                not:
                  "",
              },

              currency: {
                not:
                  "",
              },

              store: {
                status:
                  PUBLIC_STORE_STATUS,

                name: {
                  not:
                    "",
                },

                city: {
                  not:
                    "",
                },

                country: {
                  not:
                    "",
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductCategorySelect;


/* ==========================================================================
   26. TYPE CATÉGORIE PRISMA
   ========================================================================== */

type PublicProductsRawCategory =
  Prisma.ProductCategoryGetPayload<{
    select:
      typeof PUBLIC_PRODUCTS_CATEGORY_FILTER_SELECT;
  }>;


/* ==========================================================================
   27. MAPPING CATÉGORIE
   ========================================================================== */

function mapRawCategoryToFilterOption(
  category:
    PublicProductsRawCategory,
): PublicProductsCategoryFilterOption |
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
    normalizeRequiredText(
      category.slug,
    );


  if (
    !id ||
    !name ||
    !slug
  ) {
    return null;
  }


  const availableOfferCount =
    category
      .products
      .reduce(
        (
          total,
          product,
        ) =>
          total +
          product
            ._count
            .storeProducts,

        0,
      );


  /**
   * Un filtre sans aucune offre commercialisable n'apporte rien
   * au catalogue.
   */
  if (
    availableOfferCount <=
    0
  ) {
    return null;
  }


  return {
    id,

    name,

    slug,

    availableOfferCount,
  };
}


/* ==========================================================================
   28. CHARGEMENT DES CATÉGORIES DE FILTRE
   ========================================================================== */

async function queryPublicProductCategories():
  Promise<
    PublicProductsCategoryFilterCollection
  > {
  const rows =
    await db.productCategory.findMany({
      where: {
        isActive:
          true,
      },

      select:
        PUBLIC_PRODUCTS_CATEGORY_FILTER_SELECT,

      orderBy: [
        {
          name:
            "asc",
        },

        {
          id:
            "asc",
        },
      ],
    });


  return rows
    .map(
      mapRawCategoryToFilterOption,
    )
    .filter(
      (
        category,
      ): category is PublicProductsCategoryFilterOption =>
        category !==
        null,
    );
}


/* ==========================================================================
   29. NOMBRE TOTAL D'OFFRES
   ========================================================================== */

async function queryPublicProductsCount(
  where:
    Prisma.StoreProductWhereInput,
): Promise<
  number
> {
  const count =
    await db.storeProduct.count({
      where,
    });


  if (
    !Number.isFinite(
      count,
    ) ||
    count <=
      0
  ) {
    return 0;
  }


  return Math.floor(
    count,
  );
}


/* ==========================================================================
   30. PAGE COURANTE
   ========================================================================== */

function resolveCurrentPage(
  requestedPage:
    number,

  totalItems:
    number,
): Readonly<{
  currentPage:
    number;

  totalPages:
    number;
}> {
  if (
    totalItems <=
    0
  ) {
    return {
      currentPage:
        PUBLIC_PRODUCTS_FIRST_PAGE,

      totalPages:
        0,
    };
  }


  const totalPages =
    Math.ceil(
      totalItems /
        PUBLIC_PRODUCTS_PAGE_SIZE,
    );


  const currentPage =
    Math.min(
      Math.max(
        requestedPage,
        PUBLIC_PRODUCTS_FIRST_PAGE,
      ),

      totalPages,
    );


  return {
    currentPage,

    totalPages,
  };
}


/* ==========================================================================
   31. URL DU CATALOGUE
   ========================================================================== */

function buildPublicProductsPageHref(
  filters:
    PublicProductsActiveFilters,

  page:
    number,
): string {
  const searchParams =
    new URLSearchParams();


  if (
    filters.categorySlug
  ) {
    searchParams.set(
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .category,

      filters.categorySlug,
    );
  }


  if (
    filters.minimumPrice
  ) {
    searchParams.set(
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .minPrice,

      filters.minimumPrice,
    );
  }


  if (
    filters.maximumPrice
  ) {
    searchParams.set(
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .maxPrice,

      filters.maximumPrice,
    );
  }


  if (
    filters.promotionOnly
  ) {
    searchParams.set(
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .promotion,

      PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG
        .activeValue,
    );
  }


  if (
    filters.sort !==
    PUBLIC_PRODUCTS_SORT_CONFIG
      .defaultValue
  ) {
    searchParams.set(
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .sort,

      filters.sort,
    );
  }


  if (
    page >
    PUBLIC_PRODUCTS_FIRST_PAGE
  ) {
    searchParams.set(
      PUBLIC_PRODUCTS_QUERY_PARAMETERS
        .page,

      String(
        page,
      ),
    );
  }


  const query =
    searchParams.toString();


  if (
    !query
  ) {
    return PUBLIC_PRODUCTS_ROUTE;
  }


  return `${PUBLIC_PRODUCTS_ROUTE}?${query}`;
}


/* ==========================================================================
   32. PAGES VISIBLES
   ========================================================================== */

function buildVisiblePaginationPages(
  filters:
    PublicProductsActiveFilters,

  currentPage:
    number,

  totalPages:
    number,
): readonly PublicProductsPaginationLink[] {
  if (
    totalPages <=
    0
  ) {
    return [];
  }


  const maxVisible =
    Math.max(
      1,
      PUBLIC_PRODUCTS_MAX_VISIBLE_PAGE_BUTTONS,
    );


  if (
    totalPages <=
    maxVisible
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },

      (
        _,
        index,
      ) => {
        const page =
          index +
          1;


        return {
          page,

          label:
            String(
              page,
            ),

          href:
            buildPublicProductsPageHref(
              filters,
              page,
            ),

          current:
            page ===
            currentPage,
        };
      },
    );
  }


  const half =
    Math.floor(
      maxVisible /
        2,
    );


  let start =
    currentPage -
    half;


  let end =
    start +
    maxVisible -
    1;


  if (
    start <
    1
  ) {
    start =
      1;

    end =
      maxVisible;
  }


  if (
    end >
    totalPages
  ) {
    end =
      totalPages;

    start =
      totalPages -
      maxVisible +
      1;
  }


  const pages:
    PublicProductsPaginationLink[] =
      [];


  for (
    let page =
      start;
    page <=
      end;
    page +=
      1
  ) {
    pages.push({
      page,

      label:
        String(
          page,
        ),

      href:
        buildPublicProductsPageHref(
          filters,
          page,
        ),

      current:
        page ===
        currentPage,
    });
  }


  return pages;
}


/* ==========================================================================
   33. PAGINATION
   ========================================================================== */

function buildPaginationView(
  filters:
    PublicProductsActiveFilters,

  currentPage:
    number,

  totalPages:
    number,

  totalItems:
    number,
): PublicProductsPaginationView {
  const hasPreviousPage =
    totalPages >
      0 &&
    currentPage >
      1;


  const hasNextPage =
    totalPages >
      0 &&
    currentPage <
      totalPages;


  const previousPage =
    hasPreviousPage
      ? currentPage -
        1
      : null;


  const nextPage =
    hasNextPage
      ? currentPage +
        1
      : null;


  return {
    data: {
      currentPage,

      pageSize:
        PUBLIC_PRODUCTS_PAGE_SIZE,

      totalItems,

      totalPages,

      hasPreviousPage,

      hasNextPage,

      previousPage,

      nextPage,
    },

    pages:
      buildVisiblePaginationPages(
        filters,
        currentPage,
        totalPages,
      ),

    previousHref:
      previousPage ===
        null
        ? null
        : buildPublicProductsPageHref(
            filters,
            previousPage,
          ),

    nextHref:
      nextPage ===
        null
        ? null
        : buildPublicProductsPageHref(
            filters,
            nextPage,
          ),
  };
}


/* ==========================================================================
   34. REQUÊTE OFFRES DE LA PAGE
   ========================================================================== */

async function queryPublicProductsPageRows(
  where:
    Prisma.StoreProductWhereInput,

  sort:
    PublicProductsSortValue,

  currentPage:
    number,

  totalItems:
    number,
): Promise<
  PublicProductsRawStoreProduct[]
> {
  if (
    totalItems <=
    0
  ) {
    return [];
  }


  const skip =
    (
      currentPage -
      1
    ) *
    PUBLIC_PRODUCTS_PAGE_SIZE;


  return db.storeProduct.findMany({
    where,

    select:
      PUBLIC_PRODUCTS_STORE_PRODUCT_SELECT,

    orderBy:
      buildStoreProductOrderBy(
        sort,
      ),

    skip,

    take:
      PUBLIC_PRODUCTS_PAGE_SIZE,
  });
}


/* ==========================================================================
   35. API — NORMALISATION PUBLIQUE
   ========================================================================== */

/**
 * Peut être réutilisé par la page ou par des tests.
 *
 * Cette fonction ne touche pas à PostgreSQL.
 */
export function normalizePublicProductsSearchParams(
  searchParams:
    PublicProductsRawSearchParams,
): PublicProductsRequestedFilters {
  return normalizeRequestedFilters(
    searchParams,
  );
}


/* ==========================================================================
   36. API PRINCIPALE — /produits
   ========================================================================== */

/**
 * Fonction principale consommée par :
 *
 * src/app/(public)/produits/page.tsx
 *
 * Exemple :
 *
 * const searchParams = await props.searchParams;
 *
 * const data = await getPublicProductsPageData({
 *   searchParams,
 * });
 */
export async function getPublicProductsPageData(
  input:
    PublicProductsQueryInput,
): Promise<
  PublicProductsPageData
> {
  /* ------------------------------------------------------------------------
     PARAMÈTRES URL
     ------------------------------------------------------------------------ */

  const requestedFilters =
    normalizeRequestedFilters(
      input.searchParams,
    );


  /* ------------------------------------------------------------------------
     WHERE SANS FILTRE PRIX
     ------------------------------------------------------------------------
     Nécessaire pour déterminer si les offres utilisent une seule devise.
     ------------------------------------------------------------------------ */

  const baseWhere =
    buildBaseStoreProductWhere({
      categorySlug:
        requestedFilters
          .categorySlug,

      promotionOnly:
        requestedFilters
          .promotionOnly,
    });


  /* ------------------------------------------------------------------------
     DONNÉES DE FILTRE INDÉPENDANTES
     ------------------------------------------------------------------------ */

  const [
    categories,
    priceContext,
  ] =
    await Promise.all([
      queryPublicProductCategories(),

      getPublicProductsPriceContext(
        baseWhere,
      ),
    ]);


  /* ------------------------------------------------------------------------
     FILTRES ACTIFS DÉFINITIFS
     ------------------------------------------------------------------------ */

  const preliminaryFilters =
    finalizeActiveFilters(
      requestedFilters,
      priceContext,
    );


  /* ------------------------------------------------------------------------
     WHERE FINAL
     ------------------------------------------------------------------------ */

  const finalWhere =
    buildFinalStoreProductWhere(
      preliminaryFilters,
    );


  /* ------------------------------------------------------------------------
     TOTAL
     ------------------------------------------------------------------------ */

  const totalProductCount =
    await queryPublicProductsCount(
      finalWhere,
    );


  /* ------------------------------------------------------------------------
     PAGE COURANTE
     ------------------------------------------------------------------------ */

  const {
    currentPage,
    totalPages,
  } =
    resolveCurrentPage(
      preliminaryFilters.page,
      totalProductCount,
    );


  /**
   * La page active retournée aux composants correspond toujours
   * à la page réellement utilisée par Prisma.
   *
   * Exemple :
   *
   * URL demande page 999
   *
   * mais le catalogue ne possède que 4 pages :
   *
   * currentPage = 4
   */
  const activeFilters:
    PublicProductsActiveFilters = {
      ...preliminaryFilters,

      page:
        currentPage,
    };


  /* ------------------------------------------------------------------------
     OFFRES
     ------------------------------------------------------------------------ */

  const rawProducts =
    await queryPublicProductsPageRows(
      finalWhere,
      activeFilters.sort,
      currentPage,
      totalProductCount,
    );


  const products =
    rawProducts
      .map(
        mapRawStoreProductToPublicProduct,
      )
      .filter(
        isPublicProductCardData,
      );


  /* ------------------------------------------------------------------------
     PAGINATION
     ------------------------------------------------------------------------ */

  const pagination =
    buildPaginationView(
      activeFilters,
      currentPage,
      totalPages,
      totalProductCount,
    );


  /* ------------------------------------------------------------------------
     RÉSULTAT FINAL
     ------------------------------------------------------------------------ */

  return {
    products,

    totalProductCount,

    categories,

    priceBounds:
      priceContext.bounds,

    activeFilters,

    pagination,
  };
}


/* ==========================================================================
   37. API SIMPLIFIÉE
   ========================================================================== */

/**
 * Variante pratique lorsque l'appelant possède déjà directement
 * les searchParams.
 */
export async function getPublicProducts(
  searchParams:
    PublicProductsRawSearchParams = {},
): Promise<
  PublicProductsPageData
> {
  return getPublicProductsPageData({
    searchParams,
  });
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES
 *
 * ============================================================================
 *
 * UNE CARTE =
 *
 * UNE offre StoreProduct.
 *
 * ============================================================================
 *
 * DONNÉES PUBLIQUES
 *
 * Product.status = ACTIVE
 *
 * Store.status = ACTIVE
 *
 * StoreProduct.status = ACTIVE
 *
 * stockQuantity > 0
 *
 * price > 0
 *
 * vraie ProductImage
 *
 * vrai qrToken
 *
 * vraie devise
 *
 * ============================================================================
 *
 * CATÉGORIES
 *
 * ProductCategory.isActive = true
 *
 * availableOfferCount =
 *
 * nombre réel de StoreProduct commercialisables dans la catégorie.
 *
 * ============================================================================
 *
 * PROMOTION
 *
 * compareAtPrice > price
 *
 * ============================================================================
 *
 * MULTI-DEVISE
 *
 * Aucun filtre ou tri monétaire global n'est appliqué lorsque plusieurs
 * devises sont présentes dans l'ensemble courant.
 *
 * Aucune conversion fictive.
 *
 * ============================================================================
 *
 * ROUTE DÉTAIL
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * PAGINATION
 *
 * 20 offres par page selon la configuration actuelle.
 *
 * Le nombre total provient réellement de PostgreSQL.
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - faux produit ;
 * - faux prix ;
 * - faux stock ;
 * - faux compteur ;
 * - fausse promotion ;
 * - fausse catégorie ;
 * - fausse boutique ;
 * - fausse devise ;
 * - fausse route produit ;
 * - déduplication par Product.id ;
 * - modification de stock ;
 * - logique de commande ;
 * - accès Gestionnaire.
 *
 * ============================================================================
 */