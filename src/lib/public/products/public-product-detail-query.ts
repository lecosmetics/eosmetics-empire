import "server-only";

import {
  Prisma,
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  generalAppRoutes,
  publicRouteBuilders,
} from "@/config/routes";

import type {
  PublicProductDetailAddToPanierButtonData,
  PublicProductDetailBreadcrumb,
  PublicProductDetailCategory,
  PublicProductDetailContentVisibility,
  PublicProductDetailData,
  PublicProductDetailImage,
  PublicProductDetailInventory,
  PublicProductDetailPanierData,
  PublicProductDetailPricing,
  PublicProductDetailPurchaseState,
  PublicProductDetailQueryInput,
  PublicProductDetailQueryResult,
  PublicProductDetailSeoData,
  PublicProductDetailStore,
  PublicProductDetailSummary,
} from "@/lib/public/products/public-product-detail-types";

import type {
  PublicStoreProductStatus,
} from "@/lib/public/products/public-product-types";

import {
  db,
} from "@/prisma/db";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * REQUÊTE SERVEUR — FICHE PRODUIT PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/products/public-product-detail-query.ts
 *
 * Route :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Charger UNE offre publique StoreProduct depuis son qrToken stable et
 * préparer les données réelles nécessaires à la fiche produit premium.
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER :
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * ============================================================================
 *
 * UNE FICHE =
 *
 * UNE OFFRE StoreProduct PRÉCISE.
 *
 * ============================================================================
 *
 * IDENTITÉ PUBLIQUE :
 *
 * StoreProduct.qrToken
 *
 *        ↓
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * VISIBILITÉ :
 *
 * Product.status = ACTIVE
 *
 * +
 *
 * Store.status = ACTIVE
 *
 * +
 *
 * StoreProduct.status IN (
 *   ACTIVE,
 *   OUT_OF_STOCK
 * )
 *
 * +
 *
 * StoreProduct.price > 0
 *
 * +
 *
 * devise non vide
 *
 * ============================================================================
 *
 * RUPTURE DE STOCK :
 *
 * Une offre OUT_OF_STOCK reste consultable.
 *
 * Cela permet :
 *
 * - aux QR déjà imprimés de rester utilisables ;
 * - aux anciens liens de rester stables ;
 * - d'afficher proprement une rupture ;
 * - de ne pas transformer une rupture en erreur 404.
 *
 * ============================================================================
 *
 * HIDDEN / ARCHIVED :
 *
 * jamais exposés publiquement.
 *
 * ============================================================================
 *
 * FICHE PREMIUM :
 *
 * Cette query fournit les vraies données nécessaires pour afficher :
 *
 * - identité produit ;
 * - marque ;
 * - SKU ;
 * - catégorie ;
 * - galerie ;
 * - description ;
 * - conseils d'utilisation ;
 * - ingrédients ;
 * - contenance ;
 * - unité ;
 * - prix ;
 * - ancien prix réel ;
 * - économie réelle ;
 * - réduction réelle ;
 * - disponibilité ;
 * - stock ;
 * - point de vente ;
 * - Panier.
 *
 * ============================================================================
 *
 * LIVRAISON / CONTACT :
 *
 * Les règles éditoriales :
 *
 * - livraison Afrique ;
 * - livraison internationale ;
 * - WhatsApp ;
 * - Contact ;
 * - Points de vente ;
 *
 * ne proviennent PAS de PostgreSQL Product/StoreProduct.
 *
 * Elles seront assemblées depuis la configuration publique au niveau
 * présentation de la fiche.
 *
 * ============================================================================
 *
 * FOOTER MOBILE :
 *
 * Cette query ne rend aucun composant.
 *
 * La règle :
 *
 * Desktop → Footer visible
 * Mobile  → Footer masqué
 *
 * sera appliquée dans la couche UI/CSS de /p/[qrToken].
 *
 * ============================================================================
 *
 * PANIER :
 *
 * Le navigateur reçoit uniquement comme identité commerciale :
 *
 * storeProductId
 * quantity
 *
 * ============================================================================
 *
 * Le navigateur n'est jamais source de vérité pour :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - statut ;
 * - boutique ;
 * - disponibilité.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - inventer un produit ;
 * - inventer une image ;
 * - inventer un prix ;
 * - inventer un stock ;
 * - inventer une boutique ;
 * - inventer une catégorie ;
 * - inventer une réduction ;
 * - inventer un délai de livraison ;
 * - inventer un tarif de livraison ;
 * - modifier PostgreSQL ;
 * - réserver du stock ;
 * - créer une commande ;
 * - créer un paiement ;
 * - lire une session Gestionnaire ;
 * - exposer Prisma.Decimal à React ;
 * - construire manuellement /p/[qrToken] ;
 * - construire manuellement /categories/[slug].
 *
 * ============================================================================
 */


/* ==========================================================================
   1. QR TOKEN — LIMITES
   ========================================================================== */

/**
 * Limites défensives déjà utilisées pour l'identité QR publique.
 */
const PUBLIC_PRODUCT_QR_TOKEN_MIN_LENGTH =
  20;


const PUBLIC_PRODUCT_QR_TOKEN_MAX_LENGTH =
  128;


const PUBLIC_PRODUCT_QR_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]+$/;


/* ==========================================================================
   2. LIMITES DÉFENSIVES
   ========================================================================== */

const PUBLIC_PRODUCT_DETAIL_MAX_IMAGE_URL_LENGTH =
  2_048;


const PUBLIC_PRODUCT_DETAIL_MAX_TEXT_LENGTH =
  20_000;


/**
 * On ne force pas arbitrairement la devise à trois lettres ici.
 *
 * La base reste source de vérité.
 *
 * Cela permet notamment de ne pas rejeter artificiellement une valeur
 * commerciale configurée différemment dans le futur.
 */
const PUBLIC_PRODUCT_DETAIL_MAX_CURRENCY_LENGTH =
  16;


/* ==========================================================================
   3. STATUTS PUBLICS
   ========================================================================== */

const PUBLIC_PRODUCT_STATUS =
  ProductStatus.ACTIVE;


const PUBLIC_STORE_STATUS =
  StoreStatus.ACTIVE;


const PUBLIC_STORE_PRODUCT_VISIBLE_STATUSES =
  [
    StoreProductStatus.ACTIVE,
    StoreProductStatus.OUT_OF_STOCK,
  ] as const;


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


  return value
    .trim()
    .slice(
      0,
      PUBLIC_PRODUCT_DETAIL_MAX_TEXT_LENGTH,
    );
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
   5. QR TOKEN — VALIDATION
   ========================================================================== */

export function normalizePublicProductDetailQrToken(
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


  if (
    normalized.length <
      PUBLIC_PRODUCT_QR_TOKEN_MIN_LENGTH ||
    normalized.length >
      PUBLIC_PRODUCT_QR_TOKEN_MAX_LENGTH
  ) {
    return null;
  }


  if (
    !PUBLIC_PRODUCT_QR_TOKEN_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   6. DEVISE
   ========================================================================== */

/**
 * La devise enregistrée sur StoreProduct reste la source de vérité.
 *
 * ============================================================================
 *
 * On exige seulement :
 *
 * - une chaîne non vide ;
 * - une longueur défensive raisonnable.
 *
 * ============================================================================
 *
 * On ne remplace jamais une devise invalide par :
 *
 * XAF
 * XOF
 * EUR
 * USD
 *
 * ou une autre valeur inventée.
 *
 * ============================================================================
 */
function normalizeCurrency(
  value:
    string |
    null |
    undefined,
): string |
  null {
  const normalized =
    normalizeRequiredText(
      value,
    )
      .toUpperCase();


  if (
    !normalized ||
    normalized.length >
      PUBLIC_PRODUCT_DETAIL_MAX_CURRENCY_LENGTH
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   7. URL IMAGE
   ========================================================================== */

/**
 * Accepte :
 *
 * - https:// ;
 * - http:// ;
 * - asset public Next.js commençant par /.
 *
 * ============================================================================
 *
 * Aucun placeholder fictif n'est créé.
 *
 * ============================================================================
 */
function normalizePublicProductImageUrl(
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


  if (
    !normalized ||
    normalized.length >
      PUBLIC_PRODUCT_DETAIL_MAX_IMAGE_URL_LENGTH
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     ASSET PUBLIC LOCAL
     ------------------------------------------------------------------------ */

  if (
    normalized.startsWith(
      "/",
    ) &&
    !normalized.startsWith(
      "//",
    ) &&
    !normalized.includes(
      "\\",
    )
  ) {
    return normalized;
  }


  /* ------------------------------------------------------------------------
     URL DISTANTE
     ------------------------------------------------------------------------ */

  try {
    const url =
      new URL(
        normalized,
      );


    if (
      url.protocol !==
        "https:" &&
      url.protocol !==
        "http:"
    ) {
      return null;
    }


    /**
     * On refuse une URL contenant des credentials.
     */
    if (
      url.username ||
      url.password
    ) {
      return null;
    }


    return url.toString();
  } catch {
    return null;
  }
}


/* ==========================================================================
   8. SELECT PRISMA
   ========================================================================== */

/**
 * Sélection stricte.
 *
 * On ne charge que les données nécessaires à la fiche publique.
 */
const PUBLIC_PRODUCT_DETAIL_SELECT = {
  id:
    true,

  productId:
    true,

  storeId:
    true,

  qrToken:
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

      slug:
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

      brand:
        true,

      description:
        true,

      ingredients:
        true,

      weightContent:
        true,

      usageInstructions:
        true,

      unit:
        true,

      status:
        true,

      createdAt:
        true,

      updatedAt:
        true,

      category: {
        select: {
          id:
            true,

          name:
            true,

          slug:
            true,

          isActive:
            true,
        },
      },

      images: {
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

          createdAt:
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
      },
    },
  },
} satisfies Prisma.StoreProductSelect;


/* ==========================================================================
   9. TYPE EXACT PRISMA
   ========================================================================== */

type PublicProductDetailRawStoreProduct =
  Prisma.StoreProductGetPayload<{
    select:
      typeof PUBLIC_PRODUCT_DETAIL_SELECT;
  }>;


/* ==========================================================================
   10. STATUT STOREPRODUCT PUBLIC
   ========================================================================== */

function mapStoreProductStatus(
  status:
    StoreProductStatus,
): PublicStoreProductStatus |
  null {
  switch (
    status
  ) {
    case StoreProductStatus.ACTIVE:
      return "ACTIVE";


    case StoreProductStatus.OUT_OF_STOCK:
      return "OUT_OF_STOCK";


    default:
      return null;
  }
}


/* ==========================================================================
   11. PRIX
   ========================================================================== */

function buildPublicProductDetailPricing(
  row:
    PublicProductDetailRawStoreProduct,
): PublicProductDetailPricing |
  null {
  /* ------------------------------------------------------------------------
     PRIX PRINCIPAL
     ------------------------------------------------------------------------ */

  if (
    !row.price.gt(
      0,
    )
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     DEVISE
     ------------------------------------------------------------------------ */

  const currency =
    normalizeCurrency(
      row.currency,
    );


  if (
    !currency
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     SÉRIALISATION
     ------------------------------------------------------------------------ */

  const amount =
    row.price.toFixed(
      2,
    );


  const compareAtPrice =
    row.compareAtPrice;


  /* ------------------------------------------------------------------------
     PROMOTION RÉELLE
     ------------------------------------------------------------------------ */

  const hasDiscount =
    compareAtPrice !==
      null &&
    compareAtPrice.gt(
      row.price,
    );


  if (
    !hasDiscount ||
    !compareAtPrice
  ) {
    return {
      amount,

      compareAtAmount:
        null,

      currency,

      hasDiscount:
        false,

      savingsAmount:
        null,

      discountPercentage:
        null,
    };
  }


  /* ------------------------------------------------------------------------
     ÉCONOMIE
     ------------------------------------------------------------------------ */

  const savings =
    compareAtPrice.minus(
      row.price,
    );


  /* ------------------------------------------------------------------------
     POURCENTAGE
     ------------------------------------------------------------------------ */

  const discountPercentage =
    compareAtPrice.gt(
      0,
    )
      ? compareAtPrice
          .minus(
            row.price,
          )
          .div(
            compareAtPrice,
          )
          .mul(
            100,
          )
          .toDecimalPlaces(
            0,
          )
          .toNumber()
      : null;


  return {
    amount,

    compareAtAmount:
      compareAtPrice.toFixed(
        2,
      ),

    currency,

    hasDiscount:
      true,

    savingsAmount:
      savings.toFixed(
        2,
      ),

    discountPercentage:
      discountPercentage ===
        null
        ? null
        : Math.max(
            0,
            Math.min(
              100,
              discountPercentage,
            ),
          ),
  };
}


/* ==========================================================================
   12. INVENTAIRE
   ========================================================================== */

function buildPublicProductDetailInventory(
  row:
    PublicProductDetailRawStoreProduct,

  publicStatus:
    PublicStoreProductStatus,
): PublicProductDetailInventory {
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


  /* ------------------------------------------------------------------------
     DISPONIBLE
     ------------------------------------------------------------------------ */

  const isAvailable =
    publicStatus ===
      "ACTIVE" &&
    stockQuantity >
      0;


  /* ------------------------------------------------------------------------
     STOCK FAIBLE
     ------------------------------------------------------------------------ */

  const isLowStock =
    isAvailable &&
    lowStockThreshold >
      0 &&
    stockQuantity <=
      lowStockThreshold;


  /* ------------------------------------------------------------------------
     ÉTAT UI
     ------------------------------------------------------------------------ */

  let availability:
    PublicProductDetailInventory[
      "availability"
    ];


  if (
    !isAvailable
  ) {
    availability =
      "OUT_OF_STOCK";
  } else if (
    isLowStock
  ) {
    availability =
      "LOW_STOCK";
  } else {
    availability =
      "IN_STOCK";
  }


  return {
    status:
      publicStatus,

    stockQuantity,

    lowStockThreshold,

    availability,

    isAvailable,

    isLowStock,
  };
}


/* ==========================================================================
   13. IMAGES
   ========================================================================== */

function buildPublicProductDetailImages(
  row:
    PublicProductDetailRawStoreProduct,

  productName:
    string,
): PublicProductDetailImage[] {
  const images:
    PublicProductDetailImage[] =
      [];


  const knownUrls =
    new Set<
      string
    >();


  for (
    const image
    of row.product.images
  ) {
    const id =
      normalizeRequiredText(
        image.id,
      );


    const url =
      normalizePublicProductImageUrl(
        image.url,
      );


    if (
      !id ||
      !url
    ) {
      continue;
    }


    /**
     * Empêche la répétition accidentelle d'une même ressource.
     */
    if (
      knownUrls.has(
        url,
      )
    ) {
      continue;
    }


    knownUrls.add(
      url,
    );


    const altText =
      normalizeRequiredText(
        image.altText,
      ) ||
      productName;


    const position =
      Number.isFinite(
        image.position,
      )
        ? Math.trunc(
            image.position,
          )
        : 0;


    images.push({
      id,

      url,

      altText,

      position,

      isPrimary:
        image.isPrimary,
    });
  }


  return images;
}


/* ==========================================================================
   14. IMAGE PRINCIPALE
   ========================================================================== */

function getPublicProductDetailPrimaryImage(
  images:
    readonly PublicProductDetailImage[],
): PublicProductDetailImage |
  null {
  if (
    images.length ===
    0
  ) {
    return null;
  }


  const explicitPrimary =
    images.find(
      (
        image,
      ) =>
        image.isPrimary,
    );


  return (
    explicitPrimary ??
    images[0] ??
    null
  );
}


/* ==========================================================================
   15. CATÉGORIE
   ========================================================================== */

function buildPublicProductDetailCategory(
  row:
    PublicProductDetailRawStoreProduct,
): PublicProductDetailCategory |
  null {
  const category =
    row.product.category;


  if (
    !category ||
    !category.isActive
  ) {
    return null;
  }


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


  return {
    id,

    name,

    slug,

    href:
      publicRouteBuilders
        .categoryBySlug(
          slug,
        ),
  };
}


/* ==========================================================================
   16. BOUTIQUE
   ========================================================================== */

function buildPublicProductDetailStore(
  row:
    PublicProductDetailRawStoreProduct,
): PublicProductDetailStore |
  null {
  if (
    row.store.status !==
    StoreStatus.ACTIVE
  ) {
    return null;
  }


  const id =
    normalizeRequiredText(
      row.store.id,
    );


  const relationStoreId =
    normalizeRequiredText(
      row.storeId,
    );


  const name =
    normalizeRequiredText(
      row.store.name,
    );


  const slug =
    normalizeRequiredText(
      row.store.slug,
    );


  const city =
    normalizeRequiredText(
      row.store.city,
    );


  const country =
    normalizeRequiredText(
      row.store.country,
    );


  if (
    !id ||
    !relationStoreId ||
    id !==
      relationStoreId ||
    !name ||
    !slug ||
    !city ||
    !country
  ) {
    return null;
  }


  return {
    id,

    name,

    slug,

    city,

    country,
  };
}


/* ==========================================================================
   17. PANIER
   ========================================================================== */

function buildPublicProductDetailPanierData(
  storeProductId:
    string,

  inventory:
    PublicProductDetailInventory,
): PublicProductDetailPanierData {
  const canAddToPanier =
    inventory.status ===
      "ACTIVE" &&
    inventory.isAvailable &&
    inventory.stockQuantity >
      0;


  return {
    storeProductId,

    defaultQuantity:
      1,

    maximumQuantity:
      canAddToPanier
        ? inventory.stockQuantity
        : 0,

    canAddToPanier,
  };
}


/* ==========================================================================
   18. MAPPING PRINCIPAL
   ========================================================================== */

function mapRawStoreProductToPublicProductDetail(
  row:
    PublicProductDetailRawStoreProduct,
): PublicProductDetailData |
  null {
  /* ------------------------------------------------------------------------
     STATUT PRODUCT / STORE
     ------------------------------------------------------------------------ */

  if (
    row.product.status !==
      ProductStatus.ACTIVE ||
    row.store.status !==
      StoreStatus.ACTIVE
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     STATUT STOREPRODUCT
     ------------------------------------------------------------------------ */

  const publicStatus =
    mapStoreProductStatus(
      row.status,
    );


  if (
    !publicStatus
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IDENTIFIANTS OFFRE
     ------------------------------------------------------------------------ */

  const storeProductId =
    normalizeRequiredText(
      row.id,
    );


  const productId =
    normalizeRequiredText(
      row.productId,
    );


  const relatedProductId =
    normalizeRequiredText(
      row.product.id,
    );


  const qrToken =
    normalizePublicProductDetailQrToken(
      row.qrToken,
    );


  if (
    !storeProductId ||
    !productId ||
    !relatedProductId ||
    productId !==
      relatedProductId ||
    !qrToken
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IDENTITÉ PRODUCT
     ------------------------------------------------------------------------ */

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


  const productBrand =
    normalizeRequiredText(
      row.product.brand,
    );


  if (
    !productName ||
    !productSlug ||
    !productSku ||
    !productBrand
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  const pricing =
    buildPublicProductDetailPricing(
      row,
    );


  if (
    !pricing
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     BOUTIQUE
     ------------------------------------------------------------------------ */

  const store =
    buildPublicProductDetailStore(
      row,
    );


  if (
    !store
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IMAGES
     ------------------------------------------------------------------------ */

  const images =
    buildPublicProductDetailImages(
      row,
      productName,
    );


  const primaryImage =
    getPublicProductDetailPrimaryImage(
      images,
    );


  /* ------------------------------------------------------------------------
     CATÉGORIE
     ------------------------------------------------------------------------ */

  const category =
    buildPublicProductDetailCategory(
      row,
    );


  /* ------------------------------------------------------------------------
     INVENTAIRE
     ------------------------------------------------------------------------ */

  const inventory =
    buildPublicProductDetailInventory(
      row,
      publicStatus,
    );


  /* ------------------------------------------------------------------------
     ROUTE PUBLIQUE CANONIQUE
     ------------------------------------------------------------------------ */

  const publicPath =
    publicRouteBuilders
      .productByQr(
        qrToken,
      );


  if (
    !publicPath
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     PANIER
     ------------------------------------------------------------------------ */

  const panier =
    buildPublicProductDetailPanierData(
      storeProductId,
      inventory,
    );


  /* ------------------------------------------------------------------------
     DERNIÈRE MODIFICATION
     ------------------------------------------------------------------------ */

  const updatedAt =
    row.updatedAt >
    row.product.updatedAt
      ? row.updatedAt
      : row.product.updatedAt;


  /* ------------------------------------------------------------------------
     RÉSULTAT
     ------------------------------------------------------------------------ */

  return {
    offer: {
      id:
        storeProductId,

      storeProductId,

      productId,

      qrToken,

      publicPath,
    },

    product: {
      id:
        productId,

      name:
        productName,

      slug:
        productSlug,

      sku:
        productSku,

      brand:
        productBrand,
    },

    content: {
      description:
        normalizeOptionalText(
          row.product.description,
        ),

      ingredients:
        normalizeOptionalText(
          row.product.ingredients,
        ),

      weightContent:
        normalizeOptionalText(
          row.product.weightContent,
        ),

      usageInstructions:
        normalizeOptionalText(
          row.product.usageInstructions,
        ),

      unit:
        normalizeOptionalText(
          row.product.unit,
        ),
    },

    category,

    images,

    primaryImage,

    pricing,

    inventory,

    store,

    panier,

    /**
     * Date de création de l'identité Product.
     */
    createdAt:
      row.product
        .createdAt
        .toISOString(),

    /**
     * Dernière modification pertinente :
     *
     * Product
     *
     * ou
     *
     * StoreProduct.
     */
    updatedAt:
      updatedAt.toISOString(),
  };
}


/* ==========================================================================
   19. REQUÊTE PRISMA
   ========================================================================== */

async function queryPublicProductDetail(
  qrToken:
    string,
): Promise<
  PublicProductDetailRawStoreProduct |
  null
> {
  return db.storeProduct.findFirst({
    where: {
      /* --------------------------------------------------------------------
         QR TOKEN
         -------------------------------------------------------------------- */

      qrToken,


      /* --------------------------------------------------------------------
         STOREPRODUCT PUBLIC
         --------------------------------------------------------------------
         
         ACTIVE :
         
         offre achetable si stock > 0.
         
         OUT_OF_STOCK :
         
         fiche visible mais ajout Panier indisponible.
         
         HIDDEN / ARCHIVED :
         
         exclus.
         -------------------------------------------------------------------- */

      status: {
        in: [
          ...PUBLIC_STORE_PRODUCT_VISIBLE_STATUSES,
        ],
      },


      /* --------------------------------------------------------------------
         PRIX
         -------------------------------------------------------------------- */

      price: {
        gt:
          0,
      },


      /* --------------------------------------------------------------------
         DEVISE
         -------------------------------------------------------------------- */

      currency: {
        not:
          "",
      },


      /* --------------------------------------------------------------------
         STORE PUBLIC
         -------------------------------------------------------------------- */

      store: {
        status:
          PUBLIC_STORE_STATUS,
      },


      /* --------------------------------------------------------------------
         PRODUCT PUBLIC
         -------------------------------------------------------------------- */

      product: {
        status:
          PUBLIC_PRODUCT_STATUS,
      },
    },

    select:
      PUBLIC_PRODUCT_DETAIL_SELECT,
  });
}


/* ==========================================================================
   20. API PRINCIPALE
   ========================================================================== */

/**
 * Charge une fiche depuis un qrToken brut.
 *
 * ============================================================================
 *
 * Retourne null notamment si :
 *
 * - qrToken invalide ;
 * - offre inexistante ;
 * - StoreProduct privé ;
 * - Store inactif ;
 * - Product inactif ;
 * - prix invalide ;
 * - devise vide ;
 * - relation incohérente ;
 * - données structurelles indispensables invalides.
 *
 * ============================================================================
 */
export async function getPublicProductDetailByQrToken(
  qrToken:
    string,
): Promise<
  PublicProductDetailQueryResult
> {
  const normalizedQrToken =
    normalizePublicProductDetailQrToken(
      qrToken,
    );


  if (
    !normalizedQrToken
  ) {
    return null;
  }


  const row =
    await queryPublicProductDetail(
      normalizedQrToken,
    );


  if (
    !row
  ) {
    return null;
  }


  return mapRawStoreProductToPublicProductDetail(
    row,
  );
}


/* ==========================================================================
   21. API AVEC INPUT
   ========================================================================== */

export async function getPublicProductDetailData(
  input:
    PublicProductDetailQueryInput,
): Promise<
  PublicProductDetailQueryResult
> {
  return getPublicProductDetailByQrToken(
    input.qrToken,
  );
}


/* ==========================================================================
   22. SEO
   ========================================================================== */

/**
 * Prépare les données réelles nécessaires à generateMetadata().
 *
 * ============================================================================
 *
 * Si Product.description n'existe pas, le fallback repose uniquement sur :
 *
 * - nom réel ;
 * - marque réelle ;
 * - ville réelle ;
 * - pays réel.
 *
 * ============================================================================
 *
 * Aucun slogan produit ou bénéfice n'est inventé.
 *
 * ============================================================================
 */
export function buildPublicProductDetailSeoData(
  product:
    PublicProductDetailData,
): PublicProductDetailSeoData {
  const fallbackDescription =
    [
      product.product.name,
      product.product.brand,
      product.store.city,
      product.store.country,
    ]
      .map(
        normalizeRequiredText,
      )
      .filter(
        (
          value,
        ) =>
          value.length >
          0,
      )
      .join(
        " — ",
      );


  const description =
    normalizeOptionalText(
      product.content.description,
    ) ??
    fallbackDescription;


  return {
    title:
      product.product.name,

    description:
      description.slice(
        0,
        180,
      ),

    canonicalPath:
      product.offer.publicPath,

    imageUrl:
      product.primaryImage
        ?.url ??
      null,

    imageAlt:
      product.primaryImage
        ?.altText ??
      null,
  };
}


/* ==========================================================================
   23. BREADCRUMB
   ========================================================================== */

/**
 * Breadcrumb premium :
 *
 * Accueil
 *   >
 * Produits
 *   >
 * Catégorie éventuelle
 *   >
 * Produit
 *
 * ============================================================================
 *
 * Aucune URL dynamique n'est construite manuellement.
 *
 * ============================================================================
 */
export function buildPublicProductDetailBreadcrumb(
  product:
    PublicProductDetailData,
): PublicProductDetailBreadcrumb {
  const items:
    PublicProductDetailBreadcrumb[number][] =
      [
        {
          label:
            "Accueil",

          href:
            generalAppRoutes.home,

          current:
            false,
        },

        {
          label:
            "Produits",

          href:
            generalAppRoutes.products,

          current:
            false,
        },
      ];


  if (
    product.category
  ) {
    items.push({
      label:
        product.category.name,

      href:
        product.category.href,

      current:
        false,
    });
  }


  items.push({
    label:
      product.product.name,

    href:
      null,

    current:
      true,
  });


  return items;
}


/* ==========================================================================
   24. RÉSUMÉ PUBLIC
   ========================================================================== */

export function buildPublicProductDetailSummary(
  product:
    PublicProductDetailData,
): PublicProductDetailSummary {
  return {
    storeProductId:
      product.offer
        .storeProductId,

    qrToken:
      product.offer
        .qrToken,

    publicPath:
      product.offer
        .publicPath,

    productName:
      product.product
        .name,

    storeName:
      product.store
        .name,

    price:
      product.pricing
        .amount,

    compareAtPrice:
      product.pricing
        .compareAtAmount,

    currency:
      product.pricing
        .currency,

    availability:
      product.inventory
        .availability,

    isAvailable:
      product.inventory
        .isAvailable,

    primaryImageUrl:
      product.primaryImage
        ?.url ??
      null,
  };
}


/* ==========================================================================
   25. VISIBILITÉ DU CONTENU
   ========================================================================== */

/**
 * Permet à PublicProductDetail.tsx de ne rendre que les sections réellement
 * renseignées.
 *
 * ============================================================================
 *
 * Exemple :
 *
 * ingredients = null
 *
 * → aucune carte "Ingrédients" vide.
 *
 * ============================================================================
 */
export function getPublicProductDetailContentVisibility(
  product:
    PublicProductDetailData,
): PublicProductDetailContentVisibility {
  return {
    hasDescription:
      normalizeOptionalText(
        product.content.description,
      ) !==
      null,

    hasIngredients:
      normalizeOptionalText(
        product.content.ingredients,
      ) !==
      null,

    hasWeightContent:
      normalizeOptionalText(
        product.content.weightContent,
      ) !==
      null,

    hasUsageInstructions:
      normalizeOptionalText(
        product.content.usageInstructions,
      ) !==
      null,

    hasUnit:
      normalizeOptionalText(
        product.content.unit,
      ) !==
      null,

    hasCategory:
      product.category !==
      null,

    hasImages:
      product.images.length >
      0,

    hasDiscount:
      product.pricing
        .hasDiscount,
  };
}


/* ==========================================================================
   26. ÉTAT D'ACHAT DE LA FICHE
   ========================================================================== */

/**
 * Structure pratique pour la nouvelle zone commerciale premium.
 *
 * ============================================================================
 *
 * Il s'agit uniquement d'un snapshot UI.
 *
 * Une opération sensible doit toujours relire StoreProduct.
 *
 * ============================================================================
 */
export function getPublicProductDetailPurchaseState(
  product:
    PublicProductDetailData,
): PublicProductDetailPurchaseState {
  return {
    canAddToPanier:
      product.panier
        .canAddToPanier &&
      product.inventory
        .status ===
        "ACTIVE" &&
      product.inventory
        .isAvailable &&
      product.inventory
        .stockQuantity >
        0,

    availability:
      product.inventory
        .availability,

    stockQuantity:
      product.inventory
        .stockQuantity,

    maximumQuantity:
      product.panier
        .maximumQuantity,
  };
}


/* ==========================================================================
   27. BOUTON AJOUTER AU PANIER
   ========================================================================== */

/**
 * Prépare uniquement l'état du CTA.
 *
 * ============================================================================
 *
 * Aucun prix n'est envoyé comme autorité au navigateur.
 *
 * ============================================================================
 */
export function buildPublicProductDetailAddToPanierButtonData(
  product:
    PublicProductDetailData,
): PublicProductDetailAddToPanierButtonData {
  const canAdd =
    canAddPublicProductDetailToPanier(
      product,
    );


  if (
    !canAdd
  ) {
    return {
      state:
        product.inventory
          .availability ===
          "OUT_OF_STOCK"
          ? "OUT_OF_STOCK"
          : "UNAVAILABLE",

      payload: {
        storeProductId:
          product.offer
            .storeProductId,

        quantity:
          1,
      },

      maximumQuantity:
        0,
    };
  }


  return {
    state:
      "AVAILABLE",

    payload: {
      storeProductId:
        product.offer
          .storeProductId,

      quantity:
        product.panier
          .defaultQuantity,
    },

    maximumQuantity:
      product.panier
        .maximumQuantity,
  };
}


/* ==========================================================================
   28. VÉRIFICATION D'ACHAT POUR L'INTERFACE
   ========================================================================== */

/**
 * Indication UI uniquement.
 *
 * ============================================================================
 *
 * Une vraie opération :
 *
 * - Panier ;
 * - commande ;
 * - paiement ;
 * - réservation de stock
 *
 * devra recharger les données actuelles de StoreProduct.
 *
 * ============================================================================
 */
export function canAddPublicProductDetailToPanier(
  product:
    PublicProductDetailData,
): boolean {
  return (
    product.inventory
      .status ===
      "ACTIVE" &&
    product.inventory
      .isAvailable &&
    product.inventory
      .stockQuantity >
      0 &&
    product.panier
      .canAddToPanier &&
    product.panier
      .maximumQuantity >
      0
  );
}


/* ==========================================================================
   29. TYPE PRISMA INTERNE
   ========================================================================== */

/**
 * Export conservé pour ne pas casser un éventuel consommateur technique
 * existant.
 *
 * Il ne doit pas être utilisé par un composant React public.
 */
export type {
  PublicProductDetailRawStoreProduct,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ROUTE :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * STOREPRODUCT :
 *
 * ACTIVE
 *
 * ou
 *
 * OUT_OF_STOCK
 *
 * ============================================================================
 *
 * PRODUCT :
 *
 * ACTIVE obligatoire.
 *
 * ============================================================================
 *
 * STORE :
 *
 * ACTIVE obligatoire.
 *
 * ============================================================================
 *
 * PRIX :
 *
 * price > 0
 *
 * ============================================================================
 *
 * PROMOTION :
 *
 * compareAtPrice affiché uniquement lorsque :
 *
 * compareAtPrice > price
 *
 * ============================================================================
 *
 * DEVISE :
 *
 * vraie valeur StoreProduct.
 *
 * Aucun fallback de devise inventé.
 *
 * ============================================================================
 *
 * IMAGES :
 *
 * vraies ProductImage uniquement.
 *
 * Pas de placeholder.
 *
 * ============================================================================
 *
 * CATÉGORIE :
 *
 * uniquement si :
 *
 * category existe
 *
 * +
 *
 * category.isActive = true
 *
 * ============================================================================
 *
 * BREADCRUMB :
 *
 * Accueil
 * Produits
 * Catégorie éventuelle
 * Produit
 *
 * ============================================================================
 *
 * INFORMATIONS PREMIUM DISPONIBLES :
 *
 * - nom ;
 * - marque ;
 * - SKU ;
 * - catégorie ;
 * - galerie ;
 * - description ;
 * - ingrédients ;
 * - conseils d'utilisation ;
 * - contenance ;
 * - unité ;
 * - prix ;
 * - promotion réelle ;
 * - économie réelle ;
 * - disponibilité ;
 * - stock ;
 * - boutique ;
 * - ville ;
 * - pays ;
 * - Panier.
 *
 * ============================================================================
 *
 * LIVRAISON AFRIQUE + INTERNATIONALE :
 *
 * sera assemblée dans la couche de présentation publique.
 *
 * Aucun délai ou tarif ne sera inventé dans cette query.
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Footer conservé.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Footer supprimé de la fiche produit.
 *
 * Seule la navigation fixe existante reste en bas :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - produit fictif ;
 * - prix fictif ;
 * - stock fictif ;
 * - image fictive ;
 * - boutique fictive ;
 * - catégorie fictive ;
 * - promotion fictive ;
 * - délai de livraison fictif ;
 * - tarif de livraison fictif ;
 * - URL dynamique fabriquée manuellement ;
 * - modification PostgreSQL ;
 * - réservation de stock ;
 * - création de commande ;
 * - paiement ;
 * - accès Gestionnaire.
 *
 * ============================================================================
 */