import "server-only";

import type {
  Prisma,
} from "@prisma/client";

import {
  PUBLIC_HOME_CATEGORIES_CONFIG,
  PUBLIC_HOME_CATEGORY_SLOTS,
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG,
} from "@/config/public-home";

import {
  publicRouteBuilders,
} from "@/config/routes";

import {
  db,
} from "@/prisma/db";

import type {
  PublicHomeCategory,
  PublicHomeCategoryCollection,
  PublicHomeCategorySlot,
  PublicHomeCategorySlotId,
  PublicHomeData,
  PublicHomeFeaturedProduct,
  PublicHomeFeaturedProductCollection,
} from "@/lib/public/home/public-home-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * REQUÊTES SERVEUR — HOME PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/home/public-home-query.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Préparer les données réelles nécessaires à la Home publique :
 *
 * - catégories réelles ;
 * - images catégories réelles ;
 * - toutes les offres StoreProduct publiques valides ;
 * - produits réels ;
 * - images produits réelles ;
 * - prix réels ;
 * - stock réel ;
 * - devise réelle ;
 * - boutique réelle ;
 * - route publique réelle.
 *
 * ============================================================================
 *
 * ARCHITECTURE PRODUIT
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * Une carte publique représente UNE offre StoreProduct.
 *
 * Deux boutiques vendant le même Product restent donc deux offres
 * commerciales différentes.
 *
 * ============================================================================
 *
 * CORRECTION IMPORTANTE
 *
 * Les produits de la Home :
 *
 * - ne sont PLUS limités à 5 dans la requête ;
 * - ne dépendent PLUS des six catégories graphiques de la Home ;
 * - ne sont PLUS chargés catégorie par catégorie ;
 * - peuvent tous être retournés lorsqu’ils sont commercialement valides.
 *
 * Le nombre "5" appartient désormais uniquement à la mise en page desktop :
 *
 * 5 cartes par ligne.
 *
 * Il ne représente plus une limite de données.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier NE DOIT PAS :
 *
 * - créer de produit fictif ;
 * - créer de catégorie fictive ;
 * - inventer un prix ;
 * - inventer un stock ;
 * - inventer une boutique ;
 * - inventer une route ;
 * - inventer des ventes ;
 * - inventer un classement best-seller ;
 * - fusionner plusieurs StoreProduct du même Product ;
 * - transmettre Prisma Decimal aux composants ;
 * - limiter artificiellement la liste à 5 produits.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION PRODUITS
   ========================================================================== */

const PRODUCT_DATA_CONFIG =
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG.data;


/**
 * La valeur est volontairement élargie en number | null.
 *
 * Configuration actuelle :
 *
 * maxProducts = null
 *
 * donc aucune limite serveur.
 */
const MAXIMUM_PUBLIC_HOME_PRODUCTS:
  number |
  null =
    PRODUCT_DATA_CONFIG.maxProducts;


/* ==========================================================================
   2. STATUTS PUBLICS
   ========================================================================== */

const PUBLIC_PRODUCT_STATUS =
  "ACTIVE" as const;


const PUBLIC_STORE_STATUS =
  "ACTIVE" as const;


const PUBLIC_STORE_PRODUCT_STATUS =
  "ACTIVE" as const;


/* ==========================================================================
   3. SELECT PRISMA — CATÉGORIES
   ========================================================================== */

const PUBLIC_HOME_CATEGORY_SELECT = {
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
   4. SELECT PRISMA — OFFRES PRODUITS
   ========================================================================== */

/**
 * Sélection minimale nécessaire à la représentation publique d’une offre.
 *
 * IMPORTANT :
 *
 * `satisfies Prisma.StoreProductSelect`
 *
 * permet de conserver un typage Prisma strict sans transformer les tableaux
 * internes en tableaux readonly incompatibles.
 */
const PUBLIC_HOME_STORE_PRODUCT_SELECT = {
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


  /* ------------------------------------------------------------------------
     STORE
     ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------
     PRODUCT
     ------------------------------------------------------------------------ */

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

      categoryId:
        true,


      /* --------------------------------------------------------------------
         CATÉGORIE RÉELLE DU PRODUIT
         -------------------------------------------------------------------- */

      category: {
        select: {
          id:
            true,

          name:
            true,

          slug:
            true,
        },
      },


      /* --------------------------------------------------------------------
         IMAGES PRODUIT
         -------------------------------------------------------------------- */

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
   5. TYPE EXACT DE L’OFFRE PRISMA
   ========================================================================== */

type PublicHomeRawStoreProduct =
  Prisma.StoreProductGetPayload<{
    select:
      typeof PUBLIC_HOME_STORE_PRODUCT_SELECT;
  }>;


/* ==========================================================================
   6. NORMALISATION TEXTE
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
   7. NORMALISATION POUR CORRESPONDANCE CATÉGORIE
   ========================================================================== */

/**
 * Cette normalisation sert uniquement à faire correspondre les six
 * emplacements visuels de la Home à de vraies ProductCategory.
 *
 * Elle n’est PAS utilisée pour déterminer quels produits ont le droit
 * d’apparaître dans la section produits.
 */
function normalizeComparableText(
  value:
    string,
): string {
  return value
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /['’]/g,
      " ",
    )
    .replace(
      /&/g,
      " ",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}


function createComparableSlug(
  value:
    string,

  ampersandMode:
    "remove" |
    "and" =
      "remove",
): string {
  return value
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /['’]/g,
      " ",
    )
    .replace(
      /&/g,
      ampersandMode ===
        "and"
        ? " et "
        : " ",
    )
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );
}


/* ==========================================================================
   8. CANDIDATS D’UN SLOT CATÉGORIE
   ========================================================================== */

function getCategorySlotCandidates(
  slot:
    PublicHomeCategorySlot,
): {
  readonly normalizedNames:
    ReadonlySet<string>;

  readonly normalizedSlugs:
    ReadonlySet<string>;
} {
  const normalizedNames =
    new Set<string>();


  const normalizedSlugs =
    new Set<string>();


  const labels = [
    slot.desktopLabel,
    slot.mobileLabel,
  ];


  for (
    const label
    of labels
  ) {
    normalizedNames.add(
      normalizeComparableText(
        label,
      ),
    );


    normalizedSlugs.add(
      createComparableSlug(
        label,
        "remove",
      ),
    );


    normalizedSlugs.add(
      createComparableSlug(
        label,
        "and",
      ),
    );
  }


  return {
    normalizedNames,
    normalizedSlugs,
  };
}


/* ==========================================================================
   9. CORRESPONDANCE CATÉGORIE ↔ SLOT HOME
   ========================================================================== */

function categoryMatchesSlot(
  category: {
    readonly name:
      string;

    readonly slug:
      string;
  },

  slot:
    PublicHomeCategorySlot,
): boolean {
  const candidates =
    getCategorySlotCandidates(
      slot,
    );


  const normalizedCategoryName =
    normalizeComparableText(
      category.name,
    );


  const normalizedCategorySlug =
    normalizeRequiredText(
      category.slug,
    )
      .toLowerCase();


  return (
    candidates
      .normalizedNames
      .has(
        normalizedCategoryName,
      ) ||
    candidates
      .normalizedSlugs
      .has(
        normalizedCategorySlug,
      )
  );
}


/* ==========================================================================
   10. IMAGE CATÉGORIE
   ========================================================================== */

function getRenderableCategoryImage(
  category: {
    readonly name:
      string;

    readonly imageUrl:
      string |
      null;

    readonly imageAlt:
      string |
      null;
  },
): {
  readonly url:
    string;

  readonly altText:
    string;
} |
  null {
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


  const imageAlt =
    normalizeRequiredText(
      category.imageAlt,
    ) ||
    normalizeRequiredText(
      category.name,
    );


  if (
    imageAlt.length ===
    0
  ) {
    return null;
  }


  return {
    url:
      imageUrl,

    altText:
      imageAlt,
  };
}


/* ==========================================================================
   11. REQUÊTE CATÉGORIES PUBLIQUES
   ========================================================================== */

async function queryPublicCategories() {
  const where:
    Prisma.ProductCategoryWhereInput = {
      isActive:
        true,
    };


  if (
    PUBLIC_HOME_CATEGORIES_CONFIG
      .requireImage
  ) {
    where.imageUrl = {
      not:
        null,
    };
  }


  return db.productCategory.findMany({
    where,

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

    select:
      PUBLIC_HOME_CATEGORY_SELECT,
  });
}


/* ==========================================================================
   12. RÉSOLUTION DES SIX CATÉGORIES VISUELLES
   ========================================================================== */

/**
 * Cette fonction concerne UNIQUEMENT la section "Nos Catégories".
 *
 * Son résultat n’est plus utilisé pour filtrer la liste des produits.
 */
async function queryPublicHomeCategories():
  Promise<
    PublicHomeCategoryCollection
  > {
  const rawCategories =
    await queryPublicCategories();


  if (
    rawCategories.length ===
    0
  ) {
    return [];
  }


  const usedCategoryIds =
    new Set<string>();


  const resolvedCategories:
    PublicHomeCategory[] =
      [];


  for (
    const slot
    of PUBLIC_HOME_CATEGORY_SLOTS
  ) {
    const matchedCategory =
      rawCategories.find(
        (
          category,
        ) => {
          if (
            usedCategoryIds.has(
              category.id,
            )
          ) {
            return false;
          }


          return categoryMatchesSlot(
            category,
            slot,
          );
        },
      );


    if (
      !matchedCategory
    ) {
      continue;
    }


    const categoryId =
      normalizeRequiredText(
        matchedCategory.id,
      );


    const categoryName =
      normalizeRequiredText(
        matchedCategory.name,
      );


    const categorySlug =
      normalizeRequiredText(
        matchedCategory.slug,
      );


    if (
      !categoryId ||
      !categoryName ||
      !categorySlug
    ) {
      continue;
    }


    const image =
      getRenderableCategoryImage(
        matchedCategory,
      );


    if (
      !image
    ) {
      continue;
    }


    usedCategoryIds.add(
      categoryId,
    );


    resolvedCategories.push({
      slotId:
        slot.id,

      id:
        categoryId,

      name:
        categoryName,

      slug:
        categorySlug,

      description:
        normalizeOptionalText(
          matchedCategory.description,
        ),

      desktopLabel:
        slot.desktopLabel,

      mobileLabel:
        slot.mobileLabel,

      image,
    });


    if (
      resolvedCategories.length >=
      PUBLIC_HOME_CATEGORIES_CONFIG
        .limit
    ) {
      break;
    }
  }


  return resolvedCategories;
}


/* ==========================================================================
   13. DISPONIBILITÉ PRODUIT
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
   14. IMAGE PRINCIPALE PRODUIT
   ========================================================================== */

function getPrimaryProductImage(
  images:
    PublicHomeRawStoreProduct[
      "product"
    ][
      "images"
    ],

  productName:
    string,
): {
  readonly url:
    string;

  readonly altText:
    string;
} |
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
   * Sinon, la première vraie image triée par :
   *
   * position ASC
   * createdAt ASC
   *
   * est utilisée.
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


  const imageUrl =
    normalizeRequiredText(
      image.url,
    );


  if (
    imageUrl.length ===
    0
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
   15. PRIX BARRÉ
   ========================================================================== */

function serializeValidCompareAtPrice(
  price:
    PublicHomeRawStoreProduct[
      "price"
    ],

  compareAtPrice:
    PublicHomeRawStoreProduct[
      "compareAtPrice"
    ],
): string |
  null {
  if (
    compareAtPrice ===
    null
  ) {
    return null;
  }


  /**
   * Une promotion n’est réelle que si :
   *
   * compareAtPrice > price
   */
  if (
    !compareAtPrice.gt(
      price,
    )
  ) {
    return null;
  }


  return compareAtPrice.toFixed(
    2,
  );
}


/* ==========================================================================
   16. MAP CATÉGORIE → SLOT HOME
   ========================================================================== */

/**
 * Ce mapping sert uniquement à enrichir une offre avec son éventuel slot
 * Home.
 *
 * Une absence de slot n’empêche plus l’offre d’être affichée.
 */
function buildCategorySlotMap(
  categories:
    PublicHomeCategoryCollection,
):
  ReadonlyMap<
    string,
    PublicHomeCategorySlotId
  > {
  const map =
    new Map<
      string,
      PublicHomeCategorySlotId
    >();


  for (
    const category
    of categories
  ) {
    map.set(
      category.id,
      category.slotId,
    );
  }


  return map;
}


/* ==========================================================================
   17. WHERE GLOBAL DES OFFRES PUBLIQUES
   ========================================================================== */

/**
 * Construit les conditions applicables à TOUTES les offres de la Home.
 *
 * IMPORTANT :
 *
 * Aucune condition sur categoryId n’est ajoutée.
 *
 * Les catégories Home n’ont donc plus le pouvoir d’exclure un produit.
 */
function buildPublicStoreProductWhere():
  Prisma.StoreProductWhereInput {
  const where:
    Prisma.StoreProductWhereInput =
      {};


  /* ------------------------------------------------------------------------
     STORE PRODUCT ACTIF
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_DATA_CONFIG
      .requireActiveStoreProduct
  ) {
    where.status =
      PUBLIC_STORE_PRODUCT_STATUS;
  }


  /* ------------------------------------------------------------------------
     STOCK POSITIF
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_DATA_CONFIG
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
    PRODUCT_DATA_CONFIG
      .requirePositivePrice
  ) {
    where.price = {
      gt:
        0,
    };
  }


  /* ------------------------------------------------------------------------
     STORE
     ------------------------------------------------------------------------ */

  if (
    PRODUCT_DATA_CONFIG
      .requireActiveStore
  ) {
    where.store = {
      status:
        PUBLIC_STORE_STATUS,
    };
  }


  /* ------------------------------------------------------------------------
     PRODUCT
     ------------------------------------------------------------------------ */

  const productWhere:
    Prisma.ProductWhereInput =
      {};


  if (
    PRODUCT_DATA_CONFIG
      .requireActiveProduct
  ) {
    productWhere.status =
      PUBLIC_PRODUCT_STATUS;
  }


  if (
    PRODUCT_DATA_CONFIG
      .requireProductImage
  ) {
    productWhere.images = {
      some: {
        url: {
          not:
            "",
        },
      },
    };
  }


  where.product =
    productWhere;


  return where;
}


/* ==========================================================================
   18. ORDRE STABLE DES PRODUITS
   ========================================================================== */

/**
 * Nous ne prétendons pas ici connaître les meilleures ventes.
 *
 * Aucun classement commercial fictif n’est créé.
 *
 * L’ordre reste simplement stable et déterministe.
 */
const PUBLIC_HOME_PRODUCT_ORDER:
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
   19. REQUÊTE DE TOUTES LES OFFRES PUBLIQUES
   ========================================================================== */

/**
 * CORRECTION MAJEURE.
 *
 * Ancien comportement :
 *
 * take: 5
 *
 * + dépendance aux catégories Home.
 *
 * Nouveau comportement :
 *
 * toutes les offres valides sont récupérées lorsque maxProducts = null.
 */
async function queryAllPublicHomeOffers():
  Promise<
    PublicHomeRawStoreProduct[]
  > {
  const where =
    buildPublicStoreProductWhere();


  /**
   * Configuration actuelle :
   *
   * maxProducts = null
   *
   * Aucun `take` n’est donc envoyé à Prisma.
   */
  if (
    typeof MAXIMUM_PUBLIC_HOME_PRODUCTS ===
      "number" &&
    Number.isInteger(
      MAXIMUM_PUBLIC_HOME_PRODUCTS,
    ) &&
    MAXIMUM_PUBLIC_HOME_PRODUCTS >
      0
  ) {
    return db.storeProduct.findMany({
      where,

      orderBy:
        PUBLIC_HOME_PRODUCT_ORDER,

      take:
        MAXIMUM_PUBLIC_HOME_PRODUCTS,

      select:
        PUBLIC_HOME_STORE_PRODUCT_SELECT,
    });
  }


  return db.storeProduct.findMany({
    where,

    orderBy:
      PUBLIC_HOME_PRODUCT_ORDER,

    select:
      PUBLIC_HOME_STORE_PRODUCT_SELECT,
  });
}


/* ==========================================================================
   20. MAPPING STOREPRODUCT → PRODUIT HOME
   ========================================================================== */

function mapStoreProductToPublicHomeProduct(
  offer:
    PublicHomeRawStoreProduct,

  categorySlotMap:
    ReadonlyMap<
      string,
      PublicHomeCategorySlotId
    >,
):
  PublicHomeFeaturedProduct |
  null {
  /* ------------------------------------------------------------------------
     IDENTIFIANTS
     ------------------------------------------------------------------------ */

  const storeProductId =
    normalizeRequiredText(
      offer.id,
    );


  const productId =
    normalizeRequiredText(
      offer.productId,
    );


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


  const qrToken =
    normalizeRequiredText(
      offer.qrToken,
    );


  /* ------------------------------------------------------------------------
     DEVISE
     ------------------------------------------------------------------------ */

  const currency =
    normalizeRequiredText(
      offer.currency,
    )
      .toUpperCase();


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
     VALIDATION MINIMALE
     ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------
     IMAGE
     ------------------------------------------------------------------------ */

  const image =
    getPrimaryProductImage(
      offer.product.images,
      productName,
    );


  if (
    !image
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     ROUTE
     ------------------------------------------------------------------------ */

  const href =
    normalizeRequiredText(
      publicRouteBuilders
        .productByQr(
          qrToken,
        ),
    );


  if (
    href.length ===
    0
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  const price =
    offer.price.toFixed(
      2,
    );


  const compareAtPrice =
    serializeValidCompareAtPrice(
      offer.price,
      offer.compareAtPrice,
    );


  /* ------------------------------------------------------------------------
     DISPONIBILITÉ
     ------------------------------------------------------------------------ */

  const availability =
    getProductAvailability(
      offer.stockQuantity,
      offer.lowStockThreshold,
    );


  /**
   * La configuration actuelle exige stock > 0.
   *
   * Cette protection runtime empêche malgré tout une offre incohérente
   * de devenir achetable.
   */
  if (
    PRODUCT_DATA_CONFIG
      .requirePositiveStock &&
    availability ===
      "OUT_OF_STOCK"
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     CATÉGORIE RÉELLE DU PRODUIT
     ------------------------------------------------------------------------ */

  let category:
    PublicHomeFeaturedProduct[
      "category"
    ] =
      null;


  const rawCategory =
    offer.product.category;


  if (
    rawCategory
  ) {
    const categoryId =
      normalizeRequiredText(
        rawCategory.id,
      );


    const categoryName =
      normalizeRequiredText(
        rawCategory.name,
      );


    const categorySlug =
      normalizeRequiredText(
        rawCategory.slug,
      );


    if (
      categoryId &&
      categoryName &&
      categorySlug
    ) {
      /**
       * IMPORTANT :
       *
       * Le slot peut être null.
       *
       * Cela n’empêche PAS le produit d’être affiché.
       */
      const slotId =
        categorySlotMap.get(
          categoryId,
        ) ??
        null;


      category = {
        id:
          categoryId,

        name:
          categoryName,

        slug:
          categorySlug,

        slotId,
      };
    }
  }


  /* ------------------------------------------------------------------------
     CONTRAT FINAL
     ------------------------------------------------------------------------ */

  return {
    /**
     * Identifiant commercial de la carte :
     *
     * StoreProduct.id
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

    category,
  };
}


/* ==========================================================================
   21. DÉDUPLICATION DE SÉCURITÉ PAR STORE PRODUCT
   ========================================================================== */

/**
 * Normalement, une seule requête Prisma retourne déjà chaque ligne une fois.
 *
 * Cette protection évite néanmoins une éventuelle répétition accidentelle.
 *
 * IMPORTANT :
 *
 * Déduplication uniquement par :
 *
 * StoreProduct.id
 *
 * Jamais par :
 *
 * Product.id
 * SKU
 * slug
 * nom
 */
function getUniqueStoreProducts(
  offers:
    readonly PublicHomeRawStoreProduct[],
):
  PublicHomeRawStoreProduct[] {
  const seenStoreProductIds =
    new Set<string>();


  const result:
    PublicHomeRawStoreProduct[] =
      [];


  for (
    const offer
    of offers
  ) {
    const storeProductId =
      normalizeRequiredText(
        offer.id,
      );


    if (
      !storeProductId ||
      seenStoreProductIds.has(
        storeProductId,
      )
    ) {
      continue;
    }


    seenStoreProductIds.add(
      storeProductId,
    );


    result.push(
      offer,
    );
  }


  return result;
}


/* ==========================================================================
   22. PRODUITS HOME
   ========================================================================== */

function serializePublicHomeProducts(
  offers:
    readonly PublicHomeRawStoreProduct[],

  categories:
    PublicHomeCategoryCollection,
):
  PublicHomeFeaturedProductCollection {
  const categorySlotMap =
    buildCategorySlotMap(
      categories,
    );


  const uniqueOffers =
    getUniqueStoreProducts(
      offers,
    );


  return uniqueOffers
    .map(
      (
        offer,
      ) =>
        mapStoreProductToPublicHomeProduct(
          offer,
          categorySlotMap,
        ),
    )
    .filter(
      (
        product,
      ): product is PublicHomeFeaturedProduct =>
        product !==
        null,
    );
}


/* ==========================================================================
   23. API PRINCIPALE HOME
   ========================================================================== */

export async function getPublicHomeData():
  Promise<
    PublicHomeData
  > {
  /**
   * Les catégories et les offres commerciales sont maintenant indépendantes.
   *
   * Elles peuvent donc être chargées en parallèle.
   *
   * Les catégories servent uniquement :
   *
   * - à la section Nos Catégories ;
   * - à enrichir éventuellement un produit avec un slot Home.
   *
   * Elles ne filtrent jamais la liste des offres.
   */
  const [
    categories,
    rawOffers,
  ] =
    await Promise.all([
      queryPublicHomeCategories(),
      queryAllPublicHomeOffers(),
    ]);


  const featuredProducts =
    serializePublicHomeProducts(
      rawOffers,
      categories,
    );


  return {
    categories,

    featuredProducts,
  };
}


/* ==========================================================================
   24. EXPORT DU TYPE PRISMA RÉSOLU
   ========================================================================== */

export type {
  PublicHomeRawStoreProduct,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES CATÉGORIES
 *
 * - vraies ProductCategory ;
 * - isActive = true ;
 * - vraie image ;
 * - maximum six cartes pour la section catégories ;
 * - aucun fallback fictif.
 *
 * ============================================================================
 *
 * GARANTIES PRODUITS
 *
 * - toutes les offres publiques éligibles peuvent être lues ;
 * - aucun `take: 5` lorsque maxProducts = null ;
 * - aucune dépendance aux catégories Home ;
 * - Product ACTIVE ;
 * - Store ACTIVE ;
 * - StoreProduct ACTIVE ;
 * - stock > 0 ;
 * - prix > 0 ;
 * - vraie image ;
 * - vraie devise ;
 * - vraie boutique ;
 * - vraie ville ;
 * - vrai pays ;
 * - vraie route QR ;
 * - aucun produit fictif.
 *
 * ============================================================================
 *
 * ARCHITECTURE COMMERCIALE
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * Plusieurs StoreProduct appartenant au même Product restent plusieurs
 * offres indépendantes.
 *
 * ============================================================================
 *
 * AFFICHAGE ATTENDU PLUS TARD
 *
 * Desktop :
 *
 * [1][2][3][4][5]
 * [6][7][8][9][10]
 * [...]
 *
 * Mobile :
 *
 * [1][2]
 * [3][4]
 * [5][6]
 * [...]
 *
 * La requête n’impose plus la pagination visuelle.
 *
 * ============================================================================
 */