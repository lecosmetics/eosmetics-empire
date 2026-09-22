import "server-only";

import {
  Prisma,
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  publicRouteBuilders,
} from "@/config/routes";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PRODUIT PUBLIC
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/produits/public-product.ts
 *
 * RESPONSABILITÉS :
 *
 * - charger un produit depuis son qrToken public stable ;
 * - ne retourner que les produits réellement publics ;
 * - ne jamais exposer un brouillon ;
 * - ne jamais exposer un produit masqué ;
 * - ne jamais exposer un produit archivé ;
 * - ne jamais exposer un produit d'une boutique suspendue ;
 * - retourner les images publiques ;
 * - retourner le prix actuel ;
 * - retourner le prix barré lorsqu'il est cohérent ;
 * - retourner la disponibilité réelle ;
 * - retourner le nom public de la boutique ;
 * - préparer les informations affichées après scan du QR ;
 * - préparer le futur parcours d'achat.
 *
 * ROUTE PUBLIQUE :
 *
 * /p/[qrToken]
 *
 * IMPORTANT :
 *
 * Le qrToken :
 *
 * - ne contient pas le prix ;
 * - ne contient pas le stock ;
 * - ne contient pas managerId ;
 * - ne contient pas storeId ;
 * - ne contient pas de session ;
 * - ne contient pas de secret.
 *
 * Il représente uniquement une identité publique stable permettant
 * de retrouver le bon StoreProduct.
 *
 * Le QR physique encode uniquement l'URL stable.
 *
 * Exemple :
 *
 * https://domaine.com/p/nFg_bv5rzf_kwtaQ8ks
 *
 * Après scan, la fiche publique récupère les informations actuelles :
 *
 * - nom du produit ;
 * - prix ;
 * - éventuel ancien prix ;
 * - devise ;
 * - boutique ;
 * - image ;
 * - disponibilité.
 *
 * Le QR n'a donc jamais besoin d'être régénéré après une modification
 * du prix, du stock, des images ou du nom du produit.
 *
 * ============================================================================
 */


/* ==========================================================================
   QR TOKEN
   ========================================================================== */

/**
 * Les QR déjà générés dans l'application peuvent utiliser des tokens
 * de 19 caractères.
 *
 * On accepte donc à partir de 16 caractères afin de conserver la
 * compatibilité avec les QR existants sans modifier leur valeur.
 *
 * Le qrToken reste :
 *
 * - unique en base ;
 * - non sensible ;
 * - non séquentiel ;
 * - généré côté serveur.
 */

const PUBLIC_PRODUCT_QR_TOKEN_MIN_LENGTH =
  16;


const PUBLIC_PRODUCT_QR_TOKEN_MAX_LENGTH =
  128;


const PUBLIC_PRODUCT_QR_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]+$/;


/* ==========================================================================
   LIMITES
   ========================================================================== */

const PUBLIC_PRODUCT_MAX_IMAGE_URL_LENGTH =
  2_048;


const PUBLIC_PRODUCT_MAX_TEXT_LENGTH =
  20_000;


/* ==========================================================================
   STATUT DE DISPONIBILITÉ PUBLIC
   ========================================================================== */

export type PublicProductAvailabilityStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";


/* ==========================================================================
   IMAGE
   ========================================================================== */

export interface PublicProductImage {
  url:
    string;

  altText:
    string;

  position:
    number;

  isPrimary:
    boolean;
}


/* ==========================================================================
   CATÉGORIE
   ========================================================================== */

export interface PublicProductCategory {
  name:
    string;

  slug:
    string;
}


/* ==========================================================================
   BOUTIQUE
   ========================================================================== */

/**
 * Données publiques uniquement.
 *
 * On ne retourne volontairement PAS :
 *
 * - email interne ;
 * - téléphone interne ;
 * - adresse complète ;
 * - identifiant privé ;
 * - Gestionnaires.
 */

export interface PublicProductStore {
  name:
    string;

  slug:
    string;

  city:
    string;

  country:
    string;
}


/* ==========================================================================
   PRIX
   ========================================================================== */

export interface PublicProductPricing {
  /**
   * Prix actuel sous forme décimale sérialisable.
   *
   * Exemple :
   *
   * "12500.00"
   */
  amount:
    string;

  /**
   * Ancien prix / prix de référence.
   *
   * Null lorsqu'il n'existe pas de vraie réduction.
   */
  compareAtAmount:
    string |
    null;

  currency:
    string;

  hasDiscount:
    boolean;

  savingsAmount:
    string |
    null;

  discountPercentage:
    number |
    null;
}


/* ==========================================================================
   STOCK
   ========================================================================== */

export interface PublicProductInventory {
  /**
   * Quantité actuellement disponible.
   *
   * Cette information reste indicative côté interface.
   *
   * Toute création de commande devra impérativement revérifier
   * le stock côté serveur.
   */
  availableQuantity:
    number;

  isAvailable:
    boolean;

  isLowStock:
    boolean;

  availabilityStatus:
    PublicProductAvailabilityStatus;
}


/* ==========================================================================
   PRODUIT PUBLIC
   ========================================================================== */

export interface PublicProduct {
  /**
   * Token public stable.
   *
   * C'est la seule identité utilisée dans l'URL QR publique.
   */
  qrToken:
    string;

  /**
   * Route publique canonique :
   *
   * /p/[qrToken]
   */
  publicPath:
    string;

  name:
    string;

  brand:
    string;

  description:
    string |
    null;

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

  category:
    PublicProductCategory |
    null;

  images:
    readonly PublicProductImage[];

  primaryImage:
    PublicProductImage |
    null;

  pricing:
    PublicProductPricing;

  inventory:
    PublicProductInventory;

  store:
    PublicProductStore;

  createdAt:
    Date;

  updatedAt:
    Date;
}


/* ==========================================================================
   RÉSUMÉ PUBLIC APRÈS SCAN QR
   --------------------------------------------------------------------------
   Cette structure contient précisément les informations nécessaires
   à l'entrée de la fiche publique après scan :

   - produit ;
   - prix ;
   - boutique ;
   - disponibilité ;
   - image ;
   - route publique.

   Aucune donnée privée Gestionnaire n'est incluse.
   ========================================================================== */

export interface PublicProductScanSummary {
  qrToken:
    string;

  publicPath:
    string;

  productName:
    string;

  storeName:
    string;

  priceAmount:
    string;

  compareAtAmount:
    string |
    null;

  currency:
    string;

  hasDiscount:
    boolean;

  isAvailable:
    boolean;

  availabilityStatus:
    PublicProductAvailabilityStatus;

  primaryImageUrl:
    string |
    null;
}


/* ==========================================================================
   SEO DATA
   ========================================================================== */

export interface PublicProductSeoData {
  title:
    string;

  description:
    string;

  canonicalPath:
    string;

  image:
    string |
    null;
}


/* ==========================================================================
   NORMALISATION — STRING
   ========================================================================== */

function normalizeString(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/* ==========================================================================
   NORMALISATION — TEXTE FACULTATIF
   ========================================================================== */

function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
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
    !normalized
  ) {
    return null;
  }


  return normalized.slice(
    0,
    PUBLIC_PRODUCT_MAX_TEXT_LENGTH,
  );
}


/* ==========================================================================
   QR TOKEN — VALIDATION
   ========================================================================== */

export function isValidPublicProductQrToken(
  value:
    unknown,
): value is string {
  const normalized =
    normalizeString(
      value,
    );


  return (
    normalized.length >=
      PUBLIC_PRODUCT_QR_TOKEN_MIN_LENGTH &&
    normalized.length <=
      PUBLIC_PRODUCT_QR_TOKEN_MAX_LENGTH &&
    PUBLIC_PRODUCT_QR_TOKEN_PATTERN.test(
      normalized,
    )
  );
}


/* ==========================================================================
   QR TOKEN — NORMALISATION
   ========================================================================== */

export function normalizePublicProductQrToken(
  value:
    unknown,
): string | null {
  const normalized =
    normalizeString(
      value,
    );


  if (
    !isValidPublicProductQrToken(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   IMAGE URL
   ========================================================================== */

function normalizePublicImageUrl(
  value:
    unknown,
): string | null {
  const normalized =
    normalizeString(
      value,
    );


  if (
    !normalized ||
    normalized.length >
      PUBLIC_PRODUCT_MAX_IMAGE_URL_LENGTH
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
   DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase();


  if (
    !/^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    /*
     * Une mauvaise configuration DB ne doit pas être transformée
     * silencieusement en une autre devise.
     *
     * On conserve volontairement la valeur normalisée afin de ne
     * jamais afficher une autre monnaie que celle réellement
     * enregistrée.
     */

    return normalized;
  }


  return normalized;
}


/* ==========================================================================
   DECIMAL
   ========================================================================== */

function decimalToMoneyString(
  value:
    Prisma.Decimal,
): string {
  return value.toFixed(
    2,
  );
}


/* ==========================================================================
   PRICING
   ========================================================================== */

export function buildPublicProductPricing(
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
): PublicProductPricing {
  const {
    price,
    compareAtPrice,
  } =
    params;


  const currency =
    normalizeCurrency(
      params.currency,
    );


  const validCompareAtPrice =
    compareAtPrice !==
      null &&
    compareAtPrice.gt(
      price,
    );


  if (
    !validCompareAtPrice ||
    !compareAtPrice
  ) {
    return {
      amount:
        decimalToMoneyString(
          price,
        ),

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


  const savings =
    compareAtPrice.minus(
      price,
    );


  const discountPercentage =
    compareAtPrice.gt(
      0,
    )
      ? compareAtPrice
          .minus(
            price,
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
    amount:
      decimalToMoneyString(
        price,
      ),

    compareAtAmount:
      decimalToMoneyString(
        compareAtPrice,
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
   INVENTORY
   ========================================================================== */

export function buildPublicProductInventory(
  params:
    Readonly<{
      stockQuantity:
        number;

      lowStockThreshold:
        number;

      storeProductStatus:
        StoreProductStatus;
    }>,
): PublicProductInventory {
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
    params.storeProductStatus ===
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
    PublicProductAvailabilityStatus;


  if (
    !isAvailable
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


  return {
    availableQuantity:
      stockQuantity,

    isAvailable,

    isLowStock,

    availabilityStatus,
  };
}


/* ==========================================================================
   IMAGES
   ========================================================================== */

function buildPublicProductImages(
  params:
    Readonly<{
      productName:
        string;

      images:
        readonly Readonly<{
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
): PublicProductImage[] {
  const validImages:
    PublicProductImage[] =
      [];


  for (
    const image
    of params.images
  ) {
    const url =
      normalizePublicImageUrl(
        image.url,
      );


    if (
      !url
    ) {
      continue;
    }


    validImages.push({
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


  /*
   * Protection supplémentaire :
   *
   * même si des données historiques contiennent plusieurs images
   * isPrimary=true, l'interface publique ne considère qu'une seule
   * image comme principale.
   */

  validImages.sort(
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


  let primaryAlreadyAssigned =
    false;


  return validImages.map(
    (
      image,
      index,
    ) => {
      const shouldBePrimary =
        !primaryAlreadyAssigned &&
        (
          image.isPrimary ||
          index ===
            0
        );


      if (
        shouldBePrimary
      ) {
        primaryAlreadyAssigned =
          true;
      }


      return {
        ...image,

        isPrimary:
          shouldBePrimary,
      };
    },
  );
}


/* ==========================================================================
   PRIMARY IMAGE
   ========================================================================== */

export function getPublicProductPrimaryImage(
  images:
    readonly PublicProductImage[],
): PublicProductImage | null {
  if (
    images.length ===
    0
  ) {
    return null;
  }


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
   PUBLIC PRODUCT QUERY
   ========================================================================== */

/**
 * RÈGLE PRINCIPALE DE VISIBILITÉ :
 *
 * Le produit n'est retourné que si :
 *
 * Store.status = ACTIVE
 *
 * ET
 *
 * Product.status = ACTIVE
 *
 * ET
 *
 * StoreProduct.status = ACTIVE
 * OU
 * StoreProduct.status = OUT_OF_STOCK
 *
 * Cela signifie notamment qu'un QR appartenant à :
 *
 * - un brouillon ;
 * - un produit HIDDEN ;
 * - un produit ARCHIVED ;
 * - une boutique suspendue ;
 *
 * retourne null.
 *
 * On ne révèle donc pas publiquement que le produit existe.
 */

export async function getPublicProductByQrToken(
  qrToken:
    string,
): Promise<PublicProduct | null> {
  const normalizedQrToken =
    normalizePublicProductQrToken(
      qrToken,
    );


  if (
    !normalizedQrToken
  ) {
    return null;
  }


  const storeProduct =
    await db.storeProduct.findFirst({
      where: {
        qrToken:
          normalizedQrToken,

        status: {
          in: [
            StoreProductStatus.ACTIVE,
            StoreProductStatus.OUT_OF_STOCK,
          ],
        },

        store: {
          status:
            StoreStatus.ACTIVE,
        },

        product: {
          status:
            ProductStatus.ACTIVE,
        },
      },

      select: {
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
            name:
              true,

            slug:
              true,

            city:
              true,

            country:
              true,
          },
        },

        product: {
          select: {
            name:
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

            createdAt:
              true,

            updatedAt:
              true,

            category: {
              select: {
                name:
                  true,

                slug:
                  true,
              },
            },

            images: {
              select: {
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


  if (
    !storeProduct
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     NOM PRODUIT
     ------------------------------------------------------------------------ */

  const productName =
    storeProduct
      .product
      .name
      .trim();


  if (
    !productName
  ) {
    /*
     * Fail closed.
     *
     * Un produit sans nom exploitable ne doit pas produire
     * une fiche publique cassée.
     */

    return null;
  }


  /* ------------------------------------------------------------------------
     NOM BOUTIQUE
     ------------------------------------------------------------------------
     La fiche issue du QR doit toujours pouvoir identifier clairement
     le point de vente qui commercialise le produit.
     ------------------------------------------------------------------------ */

  const storeName =
    storeProduct
      .store
      .name
      .trim();


  if (
    !storeName
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IMAGES
     ------------------------------------------------------------------------ */

  const images =
    buildPublicProductImages({
      productName,

      images:
        storeProduct
          .product
          .images,
    });


  const primaryImage =
    getPublicProductPrimaryImage(
      images,
    );


  /* ------------------------------------------------------------------------
     PRIX ACTUEL
     ------------------------------------------------------------------------ */

  const pricing =
    buildPublicProductPricing({
      price:
        storeProduct.price,

      compareAtPrice:
        storeProduct
          .compareAtPrice,

      currency:
        storeProduct
          .currency,
    });


  /* ------------------------------------------------------------------------
     DISPONIBILITÉ
     ------------------------------------------------------------------------ */

  const inventory =
    buildPublicProductInventory({
      stockQuantity:
        storeProduct
          .stockQuantity,

      lowStockThreshold:
        storeProduct
          .lowStockThreshold,

      storeProductStatus:
        storeProduct.status,
    });


  /* ------------------------------------------------------------------------
     ROUTE PUBLIQUE STABLE DU QR
     ------------------------------------------------------------------------ */

  const publicPath =
    publicRouteBuilders
      .productByQr(
        storeProduct.qrToken,
      );


  /* ------------------------------------------------------------------------
     PRODUIT PUBLIC FINAL
     ------------------------------------------------------------------------ */

  return {
    qrToken:
      storeProduct.qrToken,

    publicPath,

    name:
      productName,

    brand:
      storeProduct
        .product
        .brand
        .trim(),

    description:
      normalizeOptionalText(
        storeProduct
          .product
          .description,
      ),

    ingredients:
      normalizeOptionalText(
        storeProduct
          .product
          .ingredients,
      ),

    weightContent:
      normalizeOptionalText(
        storeProduct
          .product
          .weightContent,
      ),

    usageInstructions:
      normalizeOptionalText(
        storeProduct
          .product
          .usageInstructions,
      ),

    unit:
      normalizeOptionalText(
        storeProduct
          .product
          .unit,
      ),

    category:
      storeProduct
        .product
        .category
        ? {
            name:
              storeProduct
                .product
                .category
                .name
                .trim(),

            slug:
              storeProduct
                .product
                .category
                .slug
                .trim(),
          }
        : null,

    images,

    primaryImage,

    pricing,

    inventory,

    store: {
      name:
        storeName,

      slug:
        storeProduct
          .store
          .slug
          .trim(),

      city:
        storeProduct
          .store
          .city
          .trim(),

      country:
        storeProduct
          .store
          .country
          .trim(),
    },

    createdAt:
      storeProduct
        .product
        .createdAt,

    updatedAt:
      (
        storeProduct.updatedAt >
        storeProduct.product.updatedAt
      )
        ? storeProduct
            .updatedAt
        : storeProduct
            .product
            .updatedAt,
  };
}


/* ==========================================================================
   RÉSUMÉ APRÈS SCAN QR
   --------------------------------------------------------------------------
   Utilisable par la page publique pour afficher immédiatement :

   Produit :
   FESSE

   Prix :
   5 000 XAF / XOF selon la boutique

   Boutique :
   L&E Cosmetics

   puis proposer l'action Commander.
   ========================================================================== */

export function buildPublicProductScanSummary(
  product:
    PublicProduct,
): PublicProductScanSummary {
  return {
    qrToken:
      product.qrToken,

    publicPath:
      product.publicPath,

    productName:
      product.name,

    storeName:
      product.store.name,

    priceAmount:
      product.pricing.amount,

    compareAtAmount:
      product.pricing
        .compareAtAmount,

    currency:
      product.pricing.currency,

    hasDiscount:
      product.pricing
        .hasDiscount,

    isAvailable:
      product.inventory
        .isAvailable,

    availabilityStatus:
      product.inventory
        .availabilityStatus,

    primaryImageUrl:
      product.primaryImage
        ?.url ??
      null,
  };
}


/* ==========================================================================
   CHARGEMENT DIRECT DU RÉSUMÉ QR
   --------------------------------------------------------------------------
   Permet à une future page ou Route Handler de récupérer directement
   les données commerciales essentielles depuis le qrToken sans
   dupliquer les règles de visibilité.
   ========================================================================== */

export async function getPublicProductScanSummaryByQrToken(
  qrToken:
    string,
): Promise<PublicProductScanSummary | null> {
  const product =
    await getPublicProductByQrToken(
      qrToken,
    );


  if (
    !product
  ) {
    return null;
  }


  return buildPublicProductScanSummary(
    product,
  );
}


/* ==========================================================================
   SEO
   ========================================================================== */

/**
 * Permet à :
 *
 * app/p/[qrToken]/page.tsx
 *
 * de construire ses métadonnées sans réinventer les règles.
 */

export function buildPublicProductSeoData(
  product:
    PublicProduct,
): PublicProductSeoData {
  const fallbackDescription =
    [
      product.name,

      product.brand,

      product.store.name,

      product.store.city,

      product.store.country,
    ]
      .filter(
        Boolean,
      )
      .join(
        " — ",
      );


  const description =
    product.description ??
    fallbackDescription;


  return {
    title:
      `${product.name} — ${product.store.name}`,

    description:
      description.slice(
        0,
        180,
      ),

    canonicalPath:
      product.publicPath,

    image:
      product.primaryImage
        ?.url ??
      null,
  };
}


/* ==========================================================================
   ACHAT — HELPER
   ========================================================================== */

/**
 * Indication pratique pour l'interface publique.
 *
 * Exemple :
 *
 * if (canPurchasePublicProduct(product)) {
 *   afficher "Commander maintenant"
 * }
 *
 * ATTENTION :
 *
 * Ce helper n'autorise PAS définitivement une commande.
 *
 * Au moment de l'ajout panier / paiement, le backend devra revérifier :
 *
 * - qrToken toujours valide ;
 * - produit toujours public ;
 * - boutique toujours ACTIVE ;
 * - prix actuel ;
 * - devise ;
 * - stock ;
 * - quantité demandée.
 *
 * Le navigateur ne doit jamais être considéré comme source fiable
 * pour le prix ou la disponibilité.
 */

export function canPurchasePublicProduct(
  product:
    PublicProduct,
): boolean {
  return (
    product.inventory
      .isAvailable &&
    product.inventory
      .availableQuantity >
      0
  );
}