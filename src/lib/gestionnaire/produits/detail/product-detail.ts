import "server-only";

import {
  ProductOrigin,
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
  type Prisma,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  gestionnaireRouteBuilders,
  publicRouteBuilders,
} from "@/config/routes";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  isValidProductQrToken,
} from "@/lib/gestionnaire/produits/qr/product-qr";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — DÉTAIL D'UN PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/detail/product-detail.ts
 *
 * RÔLE :
 *
 * Service serveur central de lecture pour :
 *
 * /gestionnaire/produits/[productId]
 *
 * RESPONSABILITÉS :
 *
 * - vérifier la session Gestionnaire ;
 * - déterminer storeId exclusivement côté serveur ;
 * - valider productId ;
 * - vérifier l'association StoreProduct de la boutique ;
 * - protéger les produits STORE entre boutiques ;
 * - charger le produit ;
 * - charger sa catégorie ;
 * - charger ses images ;
 * - charger son prix ;
 * - charger son stock ;
 * - charger son QR stable ;
 * - calculer la promotion ;
 * - calculer la disponibilité ;
 * - calculer la visibilité publique ;
 * - calculer les permissions d'interface ;
 * - construire les routes utiles ;
 * - ne jamais transmettre Prisma.Decimal à l'interface.
 *
 * SÉCURITÉ :
 *
 * Le navigateur ne choisit jamais :
 *
 * - storeId ;
 * - managerId ;
 * - la boutique du produit ;
 * - les permissions.
 *
 * Un productId appartenant éventuellement à une autre boutique retourne
 * exactement le même résultat qu'un produit inexistant : null.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const PRODUCT_DETAIL_ID_MAX_LENGTH =
  191;


const PRODUCT_DETAIL_QR_TOKEN_MAX_LENGTH =
  128;


const PRODUCT_DETAIL_TEXT_LIMIT =
  20_000;


const PRODUCT_DETAIL_IMAGE_URL_MAX_LENGTH =
  2_048;


/* ==========================================================================
   TYPES — IDENTIFIANTS
   ========================================================================== */

export type ProductDetailProductId =
  string;


export type ProductDetailStoreProductId =
  string;


export type ProductDetailStoreId =
  string;


export type ProductDetailCategoryId =
  string;


export type ProductDetailImageId =
  string;


/* ==========================================================================
   TYPES — STATUTS
   ========================================================================== */

export type ProductDetailOrigin =
  "CATALOG" |
  "STORE";


export type ProductDetailProductStatus =
  "DRAFT" |
  "ACTIVE" |
  "ARCHIVED";


export type ProductDetailStoreProductStatus =
  "ACTIVE" |
  "OUT_OF_STOCK" |
  "HIDDEN" |
  "ARCHIVED";


export type ProductDetailPublicationStatus =
  "PUBLISHED" |
  "DRAFT" |
  "INACTIVE" |
  "ARCHIVED";


export type ProductDetailAvailabilityStatus =
  "IN_STOCK" |
  "LOW_STOCK" |
  "OUT_OF_STOCK" |
  "HIDDEN" |
  "ARCHIVED";


/* ==========================================================================
   CATÉGORIE
   ========================================================================== */

export interface ProductDetailCategory {
  id:
    ProductDetailCategoryId;

  name:
    string;

  slug:
    string;
}


/* ==========================================================================
   IMAGE
   ========================================================================== */

export interface ProductDetailImage {
  id:
    ProductDetailImageId;

  url:
    string;

  altText:
    string |
    null;

  position:
    number;

  isPrimary:
    boolean;
}


/* ==========================================================================
   BOUTIQUE
   ========================================================================== */

export interface ProductDetailStore {
  id:
    ProductDetailStoreId;

  name:
    string;

  slug:
    string;

  city:
    string;

  country:
    string;

  status:
    "ACTIVE" |
    "SUSPENDED" |
    "DISABLED";
}


/* ==========================================================================
   PRIX
   ========================================================================== */

export interface ProductDetailPricing {
  /**
   * Valeurs numériques sérialisables.
   *
   * Aucun Prisma.Decimal ne quitte cette couche serveur.
   */
  price:
    number;

  compareAtPrice:
    number |
    null;

  currency:
    string;

  hasPromotion:
    boolean;

  savingsAmount:
    number |
    null;

  discountPercentage:
    number |
    null;
}


/* ==========================================================================
   STOCK
   ========================================================================== */

export interface ProductDetailInventory {
  stockQuantity:
    number;

  lowStockThreshold:
    number;

  status:
    ProductDetailStoreProductStatus;

  isAvailable:
    boolean;

  isLowStock:
    boolean;

  availabilityStatus:
    ProductDetailAvailabilityStatus;
}


/* ==========================================================================
   QR
   ========================================================================== */

export interface ProductDetailQr {
  token:
    string;

  isReady:
    boolean;

  /**
   * Route publique stable.
   *
   * Exemple :
   *
   * /p/abc123...
   *
   * Cette route peut exister techniquement même lorsqu'un brouillon
   * n'est pas encore consultable publiquement.
   */
  publicProductRoute:
    string;

  /**
   * Alias conservé pour compatibilité avec certains composants existants.
   *
   * Il contient ici la route publique relative.
   */
  publicUrl:
    string;

  /**
   * Route privée Gestionnaire servant à récupérer le QR réel.
   */
  qrRoute:
    string;

  /**
   * Vrai uniquement lorsque le produit peut réellement être résolu
   * par la page publique.
   */
  isPubliclyAvailable:
    boolean;
}


/* ==========================================================================
   ROUTES
   ========================================================================== */

export interface ProductDetailRoutes {
  detail:
    string;

  edit:
    string;

  qr:
    string;

  publicProduct:
    string;
}


/* ==========================================================================
   INFORMATIONS COMPLÉMENTAIRES
   ========================================================================== */

export interface ProductDetailAdditionalInformation {
  ingredients:
    string |
    null;

  weightContent:
    string |
    null;

  usageInstructions:
    string |
    null;

  unit:
    string |
    null;
}


/* ==========================================================================
   PRODUIT
   ========================================================================== */

export interface ProductDetail {
  id:
    ProductDetailProductId;

  storeProductId:
    ProductDetailStoreProductId;

  name:
    string;

  slug:
    string;

  sku:
    string;

  description:
    string |
    null;

  brand:
    string;

  origin:
    ProductDetailOrigin;

  status:
    ProductDetailProductStatus;

  publicationStatus:
    ProductDetailPublicationStatus;

  category:
    ProductDetailCategory |
    null;

  images:
    readonly ProductDetailImage[];

  primaryImage:
    ProductDetailImage |
    null;

  pricing:
    ProductDetailPricing;

  inventory:
    ProductDetailInventory;

  additionalInformation:
    ProductDetailAdditionalInformation;

  /**
   * Accès direct conservé également pour simplifier les futurs composants.
   */
  ingredients:
    string |
    null;

  weightContent:
    string |
    null;

  usageInstructions:
    string |
    null;

  unit:
    string |
    null;

  qr:
    ProductDetailQr;

  store:
    ProductDetailStore;

  routes:
    ProductDetailRoutes;

  createdAt:
    Date;

  updatedAt:
    Date;
}


/* ==========================================================================
   PERMISSIONS
   ========================================================================== */

export interface ProductDetailPermissions {
  canView:
    boolean;

  /**
   * Modification de la fiche globale Product.
   *
   * On ne permet ici l'édition complète que pour un produit STORE
   * réellement créé par cette boutique.
   */
  canEdit:
    boolean;

  /**
   * La suppression physique reste volontairement plus restrictive.
   *
   * La Server Action de suppression devra refaire cette vérification.
   */
  canDelete:
    boolean;

  canViewQr:
    boolean;

  canPrintQr:
    boolean;

  canOpenPublicProduct:
    boolean;
}


/* ==========================================================================
   PAGE DATA
   ========================================================================== */

export interface ProductDetailPageData {
  product:
    ProductDetail;

  permissions:
    ProductDetailPermissions;
}


/* ==========================================================================
   CONTEXTE INTERNE
   ========================================================================== */

interface ProductDetailAccessContext {
  storeId:
    string;

  managerId:
    string;
}


/* ==========================================================================
   VALIDATION — PRODUCT ID
   ========================================================================== */

export function isValidProductDetailId(
  value:
    unknown,
): value is ProductDetailProductId {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      PRODUCT_DETAIL_ID_MAX_LENGTH
  ) {
    return false;
  }


  /**
   * Les IDs Prisma actuels sont des chaînes.
   *
   * On interdit volontairement :
   *
   * - slash ;
   * - espaces ;
   * - caractères de contrôle ;
   *
   * avant même d'interroger PostgreSQL.
   */
  return /^[A-Za-z0-9_-]+$/.test(
    normalized,
  );
}


/* ==========================================================================
   NORMALISATION — ID
   ========================================================================== */

function normalizeProductDetailId(
  value:
    unknown,
): string | null {
  if (
    !isValidProductDetailId(
      value,
    )
  ) {
    return null;
  }


  return value.trim();
}


/* ==========================================================================
   NORMALISATION — TEXTE
   ========================================================================== */

function normalizeText(
  value:
    unknown,
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
      PRODUCT_DETAIL_TEXT_LIMIT,
    );
}


/* ==========================================================================
   NORMALISATION — TEXTE FACULTATIF
   ========================================================================== */

function normalizeOptionalText(
  value:
    unknown,
): string | null {
  const normalized =
    normalizeText(
      value,
    );


  return normalized ||
    null;
}


/* ==========================================================================
   NORMALISATION — DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    unknown,
): string {
  const normalized =
    normalizeText(
      value,
    )
      .toUpperCase();


  /**
   * On ne remplace volontairement pas une mauvaise devise par XAF.
   *
   * Le prix doit toujours refléter la devise réellement enregistrée.
   */
  if (
    /^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    return normalized;
  }


  return normalized ||
    "—";
}


/* ==========================================================================
   NORMALISATION — IMAGE URL
   ========================================================================== */

function normalizeImageUrl(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      PRODUCT_DETAIL_IMAGE_URL_MAX_LENGTH
  ) {
    return null;
  }


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
   DECIMAL → NUMBER
   ========================================================================== */

function decimalToSafeNumber(
  value:
    Prisma.Decimal,
): number {
  const amount =
    value.toNumber();


  if (
    !Number.isFinite(
      amount,
    ) ||
    amount <
      0 ||
    amount >
      Number.MAX_SAFE_INTEGER
  ) {
    throw new Error(
      "PRODUCT_DETAIL_INVALID_PRICE",
    );
  }


  return amount;
}


/* ==========================================================================
   PRICING
   ========================================================================== */

export function buildProductDetailPricing(
  params:
    Readonly<{
      price:
        Prisma.Decimal;

      compareAtPrice:
        Prisma.Decimal |
        null;

      currency:
        string;
    }>,
): ProductDetailPricing {
  const price =
    decimalToSafeNumber(
      params.price,
    );


  const compareAtPrice =
    params.compareAtPrice
      ? decimalToSafeNumber(
          params.compareAtPrice,
        )
      : null;


  const hasPromotion =
    compareAtPrice !==
      null &&
    compareAtPrice >
      price;


  if (
    !hasPromotion ||
    compareAtPrice ===
      null
  ) {
    return {
      price,

      compareAtPrice:
        null,

      currency:
        normalizeCurrency(
          params.currency,
        ),

      hasPromotion:
        false,

      savingsAmount:
        null,

      discountPercentage:
        null,
    };
  }


  const savingsAmount =
    compareAtPrice -
    price;


  const discountPercentage =
    compareAtPrice >
      0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              (
                savingsAmount /
                compareAtPrice
              ) *
              100,
            ),
          ),
        )
      : null;


  return {
    price,

    compareAtPrice,

    currency:
      normalizeCurrency(
        params.currency,
      ),

    hasPromotion:
      true,

    savingsAmount,

    discountPercentage,
  };
}


/* ==========================================================================
   INVENTORY
   ========================================================================== */

export function buildProductDetailInventory(
  params:
    Readonly<{
      stockQuantity:
        number;

      lowStockThreshold:
        number;

      status:
        StoreProductStatus;
    }>,
): ProductDetailInventory {
  const stockQuantity =
    Math.max(
      0,
      Math.trunc(
        params.stockQuantity,
      ),
    );


  const lowStockThreshold =
    Math.max(
      0,
      Math.trunc(
        params.lowStockThreshold,
      ),
    );


  const isAvailable =
    params.status ===
      StoreProductStatus.ACTIVE &&
    stockQuantity >
      0;


  const isLowStock =
    isAvailable &&
    lowStockThreshold >
      0 &&
    stockQuantity <=
      lowStockThreshold;


  let availabilityStatus:
    ProductDetailAvailabilityStatus;


  switch (
    params.status
  ) {
    case StoreProductStatus.ARCHIVED:
      availabilityStatus =
        "ARCHIVED";
      break;


    case StoreProductStatus.HIDDEN:
      availabilityStatus =
        "HIDDEN";
      break;


    case StoreProductStatus.OUT_OF_STOCK:
      availabilityStatus =
        "OUT_OF_STOCK";
      break;


    case StoreProductStatus.ACTIVE:
    default:
      if (
        stockQuantity <=
        0
      ) {
        availabilityStatus =
          "OUT_OF_STOCK";
      } else if (
        isLowStock
      ) {
        availabilityStatus =
          "LOW_STOCK";
      } else {
        availabilityStatus =
          "IN_STOCK";
      }

      break;
  }


  return {
    stockQuantity,

    lowStockThreshold,

    status:
      params.status,

    isAvailable,

    isLowStock,

    availabilityStatus,
  };
}


/* ==========================================================================
   PUBLICATION STATUS
   ========================================================================== */

export function getProductDetailPublicationStatus(
  params:
    Readonly<{
      productStatus:
        ProductStatus;

      storeProductStatus:
        StoreProductStatus;
    }>,
): ProductDetailPublicationStatus {
  if (
    params.productStatus ===
      ProductStatus.ARCHIVED ||
    params.storeProductStatus ===
      StoreProductStatus.ARCHIVED
  ) {
    return "ARCHIVED";
  }


  if (
    params.productStatus ===
      ProductStatus.DRAFT
  ) {
    return "DRAFT";
  }


  if (
    params.productStatus ===
      ProductStatus.ACTIVE &&
    (
      params.storeProductStatus ===
        StoreProductStatus.ACTIVE ||
      params.storeProductStatus ===
        StoreProductStatus.OUT_OF_STOCK
    )
  ) {
    return "PUBLISHED";
  }


  return "INACTIVE";
}


/* ==========================================================================
   PUBLIC AVAILABILITY
   ========================================================================== */

export function isProductDetailPubliclyAvailable(
  params:
    Readonly<{
      storeStatus:
        StoreStatus;

      productStatus:
        ProductStatus;

      storeProductStatus:
        StoreProductStatus;
    }>,
): boolean {
  return (
    params.storeStatus ===
      StoreStatus.ACTIVE &&
    params.productStatus ===
      ProductStatus.ACTIVE &&
    (
      params.storeProductStatus ===
        StoreProductStatus.ACTIVE ||
      params.storeProductStatus ===
        StoreProductStatus.OUT_OF_STOCK
    )
  );
}


/* ==========================================================================
   IMAGES
   ========================================================================== */

function buildProductDetailImages(
  params:
    Readonly<{
      productName:
        string;

      images:
        readonly Readonly<{
          id:
            string;

          url:
            string;

          altText:
            string |
            null;

          position:
            number;

          isPrimary:
            boolean;
        }>[];
    }>,
): ProductDetailImage[] {
  const result:
    ProductDetailImage[] =
      [];


  for (
    const image
    of params.images
  ) {
    const url =
      normalizeImageUrl(
        image.url,
      );


    if (
      !url
    ) {
      continue;
    }


    result.push({
      id:
        image.id,

      url,

      altText:
        normalizeOptionalText(
          image.altText,
        ) ??
        params.productName,

      position:
        Math.max(
          0,
          Math.trunc(
            image.position,
          ),
        ),

      isPrimary:
        image.isPrimary,
    });
  }


  result.sort(
    (
      first,
      second,
    ) => {
      if (
        first.isPrimary !==
        second.isPrimary
      ) {
        return first.isPrimary
          ? -1
          : 1;
      }


      return (
        first.position -
        second.position
      );
    },
  );


  /**
   * Protection contre une ancienne donnée incohérente avec plusieurs
   * isPrimary=true.
   *
   * La couche UI ne reçoit toujours qu'une seule image principale.
   */
  let primaryAlreadyAssigned =
    false;


  return result.map(
    (
      image,
      index,
    ) => {
      const isPrimary =
        !primaryAlreadyAssigned &&
        (
          image.isPrimary ||
          index ===
            0
        );


      if (
        isPrimary
      ) {
        primaryAlreadyAssigned =
          true;
      }


      return {
        ...image,

        position:
          index,

        isPrimary,
      };
    },
  );
}


/* ==========================================================================
   PRIMARY IMAGE
   ========================================================================== */

export function getProductDetailPrimaryImage(
  images:
    readonly ProductDetailImage[],
): ProductDetailImage | null {
  return (
    images.find(
      (
        image,
      ) =>
        image.isPrimary,
    ) ??
    images[0] ??
    null
  );
}


/* ==========================================================================
   PERMISSIONS
   ========================================================================== */

function buildProductDetailPermissions(
  params:
    Readonly<{
      storeId:
        string;

      productOrigin:
        ProductOrigin;

      createdByStoreId:
        string |
        null;

      productStatus:
        ProductStatus;

      qrToken:
        string;

      orderItemsCount:
        number;

      publiclyAvailable:
        boolean;
    }>,
): ProductDetailPermissions {
  const ownsStoreProduct =
    params.productOrigin ===
      ProductOrigin.STORE &&
    params.createdByStoreId ===
      params.storeId;


  const isArchived =
    params.productStatus ===
    ProductStatus.ARCHIVED;


  const hasValidQr =
    params.qrToken.length <=
      PRODUCT_DETAIL_QR_TOKEN_MAX_LENGTH &&
    isValidProductQrToken(
      params.qrToken,
    );


  return {
    canView:
      true,

    /**
     * Le catalogue officiel ne doit pas être modifié depuis une boutique
     * comme s'il s'agissait d'un produit local.
     */
    canEdit:
      ownsStoreProduct &&
      !isArchived,

    /**
     * Une fiche ayant déjà servi dans des commandes ne doit pas être
     * considérée comme supprimable par l'interface.
     *
     * La mutation de suppression doit malgré tout refaire ce contrôle.
     */
    canDelete:
      ownsStoreProduct &&
      params.orderItemsCount ===
        0,

    canViewQr:
      hasValidQr,

    canPrintQr:
      hasValidQr,

    canOpenPublicProduct:
      hasValidQr &&
      params.publiclyAvailable,
  };
}


/* ==========================================================================
   ROUTES
   ========================================================================== */

function buildProductDetailRoutes(
  productId:
    string,

  qrToken:
    string,
): ProductDetailRoutes {
  return {
    detail:
      gestionnaireRouteBuilders
        .productDetails(
          productId,
        ),

    edit:
      gestionnaireRouteBuilders
        .productEdit(
          productId,
        ),

    qr:
      gestionnaireRouteBuilders
        .productQr(
          productId,
        ),

    publicProduct:
      publicRouteBuilders
        .productByQr(
          qrToken,
        ),
  };
}


/* ==========================================================================
   CONTEXTE PRIVÉ
   ========================================================================== */

async function requireProductDetailAccessContext():
  Promise<ProductDetailAccessContext> {
  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    normalizeProductDetailId(
      access.store.id,
    );


  const managerId =
    normalizeProductDetailId(
      access.manager.id,
    );


  if (
    !storeId ||
    !managerId
  ) {
    throw new Error(
      "GESTIONNAIRE_PRODUCT_DETAIL_ACCESS_INVALID",
    );
  }


  return {
    storeId,
    managerId,
  };
}


/* ==========================================================================
   QUERY
   ========================================================================== */

/**
 * Cette requête est volontairement basée sur :
 *
 * storeId + productId
 *
 * et non simplement :
 *
 * productId
 *
 * Ainsi un Gestionnaire ne peut pas récupérer un produit d'une autre
 * boutique en manipulant uniquement l'URL.
 */

async function queryProductDetail(
  params:
    Readonly<{
      storeId:
        string;

      productId:
        string;
    }>,
) {
  return db.storeProduct.findUnique({
    where: {
      storeId_productId: {
        storeId:
          params.storeId,

        productId:
          params.productId,
      },
    },

    select: {
      id:
        true,

      storeId:
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

      /**
       * Utilisé uniquement pour ne pas annoncer qu'une suppression est
       * possible lorsqu'un historique de commande existe déjà.
       */
      _count: {
        select: {
          orderItems:
            true,
        },
      },

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

          origin:
            true,

          createdByStoreId:
            true,

          categoryId:
            true,

          name:
            true,

          slug:
            true,

          sku:
            true,

          description:
            true,

          brand:
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
            ],
          },
        },
      },
    },
  });
}


/* ==========================================================================
   BUILDER
   ========================================================================== */

async function buildProductDetail(
  params:
    Readonly<{
      storeId:
        string;

      productId:
        string;
    }>,
): Promise<ProductDetailPageData | null> {
  const storeProduct =
    await queryProductDetail(
      params,
    );


  if (
    !storeProduct
  ) {
    return null;
  }


  /**
   * Protection multi-tenant supplémentaire.
   *
   * Une association StoreProduct devrait déjà être suffisante.
   *
   * Néanmoins, lorsqu'un produit est d'origine STORE, il ne doit pas être
   * exploité par une autre boutique comme un produit partagé.
   */
  if (
    storeProduct.product.origin ===
      ProductOrigin.STORE &&
    storeProduct.product
      .createdByStoreId !==
      params.storeId
  ) {
    return null;
  }


  const productName =
    normalizeText(
      storeProduct.product
        .name,
    );


  if (
    !productName
  ) {
    throw new Error(
      "PRODUCT_DETAIL_INVALID_NAME",
    );
  }


  const qrToken =
    normalizeText(
      storeProduct.qrToken,
    );


  if (
    !isValidProductQrToken(
      qrToken,
    )
  ) {
    throw new Error(
      "PRODUCT_DETAIL_INVALID_QR_TOKEN",
    );
  }


  const images =
    buildProductDetailImages({
      productName,

      images:
        storeProduct.product
          .images,
    });


  const primaryImage =
    getProductDetailPrimaryImage(
      images,
    );


  const pricing =
    buildProductDetailPricing({
      price:
        storeProduct.price,

      compareAtPrice:
        storeProduct
          .compareAtPrice,

      currency:
        storeProduct.currency,
    });


  const inventory =
    buildProductDetailInventory({
      stockQuantity:
        storeProduct
          .stockQuantity,

      lowStockThreshold:
        storeProduct
          .lowStockThreshold,

      status:
        storeProduct.status,
    });


  const publicationStatus =
    getProductDetailPublicationStatus({
      productStatus:
        storeProduct.product
          .status,

      storeProductStatus:
        storeProduct.status,
    });


  const publiclyAvailable =
    isProductDetailPubliclyAvailable({
      storeStatus:
        storeProduct.store
          .status,

      productStatus:
        storeProduct.product
          .status,

      storeProductStatus:
        storeProduct.status,
    });


  const routes =
    buildProductDetailRoutes(
      storeProduct.product.id,
      qrToken,
    );


  const permissions =
    buildProductDetailPermissions({
      storeId:
        params.storeId,

      productOrigin:
        storeProduct.product
          .origin,

      createdByStoreId:
        storeProduct.product
          .createdByStoreId,

      productStatus:
        storeProduct.product
          .status,

      qrToken,

      orderItemsCount:
        storeProduct._count
          .orderItems,

      publiclyAvailable,
    });


  const ingredients =
    normalizeOptionalText(
      storeProduct.product
        .ingredients,
    );


  const weightContent =
    normalizeOptionalText(
      storeProduct.product
        .weightContent,
    );


  const usageInstructions =
    normalizeOptionalText(
      storeProduct.product
        .usageInstructions,
    );


  const unit =
    normalizeOptionalText(
      storeProduct.product
        .unit,
    );


  const updatedAt =
    storeProduct.updatedAt >
    storeProduct.product.updatedAt
      ? storeProduct.updatedAt
      : storeProduct.product
          .updatedAt;


  const product:
    ProductDetail = {
      id:
        storeProduct.product
          .id,

      storeProductId:
        storeProduct.id,

      name:
        productName,

      slug:
        normalizeText(
          storeProduct.product
            .slug,
        ),

      sku:
        normalizeText(
          storeProduct.product
            .sku,
        ),

      description:
        normalizeOptionalText(
          storeProduct.product
            .description,
        ),

      brand:
        normalizeText(
          storeProduct.product
            .brand,
        ),

      origin:
        storeProduct.product
          .origin,

      status:
        storeProduct.product
          .status,

      publicationStatus,

      category:
        storeProduct.product
          .category
          ? {
              id:
                storeProduct.product
                  .category
                  .id,

              name:
                normalizeText(
                  storeProduct.product
                    .category
                    .name,
                ),

              slug:
                normalizeText(
                  storeProduct.product
                    .category
                    .slug,
                ),
            }
          : null,

      images,

      primaryImage,

      pricing,

      inventory,

      additionalInformation: {
        ingredients,

        weightContent,

        usageInstructions,

        unit,
      },

      ingredients,

      weightContent,

      usageInstructions,

      unit,

      qr: {
        token:
          qrToken,

        isReady:
          true,

        publicProductRoute:
          routes.publicProduct,

        /**
         * Compatibilité avec les anciens composants ProductDetailQr.
         */
        publicUrl:
          routes.publicProduct,

        qrRoute:
          routes.qr,

        isPubliclyAvailable:
          publiclyAvailable,
      },

      store: {
        id:
          storeProduct.store.id,

        name:
          normalizeText(
            storeProduct.store
              .name,
          ),

        slug:
          normalizeText(
            storeProduct.store
              .slug,
          ),

        city:
          normalizeText(
            storeProduct.store
              .city,
          ),

        country:
          normalizeText(
            storeProduct.store
              .country,
          ),

        status:
          storeProduct.store
            .status,
      },

      routes,

      createdAt:
        storeProduct.product
          .createdAt,

      updatedAt,
    };


  return {
    product,

    permissions,
  };
}


/* ==========================================================================
   API PRINCIPALE — PAGE PRIVÉE
   ========================================================================== */

/**
 * Charge la fiche depuis productId.
 *
 * storeId et managerId ne sont jamais acceptés comme arguments.
 *
 * Ils sont dérivés de la session Gestionnaire.
 *
 * Résultat :
 *
 * - ProductDetailPageData lorsque le produit appartient à la boutique ;
 * - null si productId est invalide ;
 * - null si le produit n'existe pas ;
 * - null si le produit n'appartient pas à la boutique.
 *
 * Les erreurs techniques DB réelles sont volontairement propagées afin que
 * error.tsx puisse les gérer.
 */

export async function getProductDetailPageData(
  productId:
    string,
): Promise<ProductDetailPageData | null> {
  const normalizedProductId =
    normalizeProductDetailId(
      productId,
    );


  if (
    !normalizedProductId
  ) {
    return null;
  }


  const access =
    await requireProductDetailAccessContext();


  return buildProductDetail({
    storeId:
      access.storeId,

    productId:
      normalizedProductId,
  });
}


/* ==========================================================================
   ALIAS EXPLICITE
   ========================================================================== */

/**
 * Nom alternatif plus explicite lorsqu'un autre service serveur souhaite
 * charger la fiche privée.
 */

export async function getGestionnaireProductDetail(
  productId:
    string,
): Promise<ProductDetailPageData | null> {
  return getProductDetailPageData(
    productId,
  );
}


/* ==========================================================================
   PRODUIT SEUL
   ========================================================================== */

export async function getGestionnaireProductDetailProduct(
  productId:
    string,
): Promise<ProductDetail | null> {
  const pageData =
    await getProductDetailPageData(
      productId,
    );


  return (
    pageData?.product ??
    null
  );
}


/* ==========================================================================
   EXISTENCE DANS LA BOUTIQUE
   ========================================================================== */

/**
 * Vérification privée légère.
 *
 * Cette fonction conserve exactement la même isolation multi-boutique.
 */

export async function gestionnaireProductExists(
  productId:
    string,
): Promise<boolean> {
  const normalizedProductId =
    normalizeProductDetailId(
      productId,
    );


  if (
    !normalizedProductId
  ) {
    return false;
  }


  const access =
    await requireProductDetailAccessContext();


  const result =
    await db.storeProduct.findUnique({
      where: {
        storeId_productId: {
          storeId:
            access.storeId,

          productId:
            normalizedProductId,
        },
      },

      select: {
        product: {
          select: {
            origin:
              true,

            createdByStoreId:
              true,
          },
        },
      },
    });


  if (
    !result
  ) {
    return false;
  }


  if (
    result.product.origin ===
      ProductOrigin.STORE &&
    result.product
      .createdByStoreId !==
      access.storeId
  ) {
    return false;
  }


  return true;
}