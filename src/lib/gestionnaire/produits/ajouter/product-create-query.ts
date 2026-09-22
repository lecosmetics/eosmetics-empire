import "server-only";

import {
  ProductOrigin,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  PRODUCT_CREATE_DEFAULT_BRAND,
  type ProductCreateCategoryId,
  type ProductCreateCategoryOption,
  type ProductCreateCurrency,
  type ProductCreatePageData,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — REQUÊTES CRÉATION PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/ajouter/product-create-query.ts
 *
 * RESPONSABILITÉS :
 *
 * - charger les données nécessaires à la page Ajouter un produit ;
 * - charger uniquement les catégories actives ;
 * - récupérer la vraie devise de la boutique ;
 * - vérifier qu'une catégorie existe toujours et reste active ;
 * - vérifier l'unicité d'un slug produit ;
 * - vérifier l'unicité d'un SKU ;
 * - fournir quelques lectures nécessaires à la création ;
 * - toujours limiter les requêtes au strict nécessaire.
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - est exclusivement serveur ;
 * - n'effectue aucune création ;
 * - n'effectue aucune modification ;
 * - ne génère aucun QR ;
 * - ne génère aucun slug ;
 * - ne génère aucun SKU ;
 * - ne reçoit jamais un storeId depuis FormData ;
 * - ne fait jamais confiance au navigateur pour déterminer la boutique.
 *
 * Le storeId transmis aux fonctions de ce fichier doit obligatoirement
 * provenir d'une session Gestionnaire déjà validée côté serveur.
 *
 * Les écritures restent dans :
 *
 * product-create-actions.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   QUERY CONTEXT
   ========================================================================== */

/**
 * Contexte minimal des requêtes appartenant à une boutique.
 *
 * IMPORTANT :
 *
 * storeId doit provenir exclusivement du serveur.
 *
 * Exemple :
 *
 * const session = await requireGestionnaireSession();
 *
 * puis le serveur retrouve le Manager / Store correspondant.
 *
 * Le navigateur ne transmet jamais cette valeur pour décider
 * de la boutique propriétaire du produit.
 */

export interface ProductCreateQueryContext {
  storeId:
    string;
}


/* ==========================================================================
   STORE DATA
   ========================================================================== */

export interface ProductCreateStoreQueryResult {
  id:
    string;

  name:
    string;

  currency:
    ProductCreateCurrency;
}


/* ==========================================================================
   CATEGORY VALIDATION
   ========================================================================== */

export interface ProductCreateCategoryValidationResult {
  exists:
    boolean;

  category:
    ProductCreateCategoryOption |
    null;
}


/* ==========================================================================
   UNIQUE LOOKUP
   ========================================================================== */

export interface ProductCreateUniqueLookupResult {
  exists:
    boolean;

  productId:
    string |
    null;
}


/* ==========================================================================
   STORE PRODUCT LOOKUP
   ========================================================================== */

export interface ProductCreateStoreProductLookupResult {
  exists:
    boolean;

  storeProductId:
    string |
    null;

  productId:
    string |
    null;
}


/* ==========================================================================
   PRISMA SELECTIONS
   ========================================================================== */

const PRODUCT_CREATE_CATEGORY_SELECT = {
  id:
    true,

  name:
    true,

  slug:
    true,
} as const;


/* ==========================================================================
   NORMALIZATION — ID
   ========================================================================== */

function normalizeRequiredId(
  value:
    string,

  errorCode:
    string,
): string {
  const normalized =
    value.trim();


  if (
    !normalized
  ) {
    throw new Error(
      errorCode,
    );
  }


  return normalized;
}


/* ==========================================================================
   NORMALIZATION — OPTIONAL ID
   ========================================================================== */

function normalizeOptionalId(
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


  return normalized ||
    null;
}


/* ==========================================================================
   NORMALIZATION — SLUG
   ========================================================================== */

function normalizeSlug(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}


/* ==========================================================================
   NORMALIZATION — SKU
   ========================================================================== */

function normalizeSku(
  value:
    string,
): string {
  return value
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   NORMALIZATION — QR TOKEN
   ========================================================================== */

function normalizeQrToken(
  value:
    string,
): string {
  return value.trim();
}


/* ==========================================================================
   NORMALIZATION — CURRENCY
   ========================================================================== */

/**
 * Les devises sont stockées sous forme de code ISO-like :
 *
 * XAF
 * XOF
 * EUR
 * USD
 *
 * On ne convertit jamais automatiquement une devise invalide en XAF.
 *
 * Une mauvaise configuration boutique doit être corrigée au lieu
 * d'enregistrer silencieusement des prix dans la mauvaise devise.
 */

function normalizeStoreCurrency(
  value:
    string,
): ProductCreateCurrency {
  const normalized =
    value
      .trim()
      .toUpperCase();


  if (
    !/^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    throw new Error(
      "GESTIONNAIRE_STORE_CURRENCY_INVALID",
    );
  }


  return normalized;
}


/* ==========================================================================
   MAPPING — CATEGORY
   ========================================================================== */

function mapProductCategory(
  category:
    Readonly<{
      id:
        string;

      name:
        string;

      slug:
        string;
    }>,
): ProductCreateCategoryOption {
  return {
    id:
      category.id,

    name:
      category.name,

    slug:
      category.slug,
  };
}


/* ==========================================================================
   QUERY — ACTIVE STORE
   ========================================================================== */

/**
 * Charge uniquement les informations nécessaires de la boutique.
 *
 * La boutique doit toujours être ACTIVE.
 */

export async function queryProductCreateStore(
  context:
    ProductCreateQueryContext,
): Promise<ProductCreateStoreQueryResult> {
  const storeId =
    normalizeRequiredId(
      context.storeId,
      "GESTIONNAIRE_STORE_ID_REQUIRED",
    );


  const store =
    await db.store.findFirst({
      where: {
        id:
          storeId,

        status:
          StoreStatus.ACTIVE,
      },

      select: {
        id:
          true,

        name:
          true,

        currency:
          true,
      },
    });


  if (
    !store
  ) {
    throw new Error(
      "GESTIONNAIRE_STORE_NOT_ACTIVE",
    );
  }


  return {
    id:
      store.id,

    name:
      store.name,

    currency:
      normalizeStoreCurrency(
        store.currency,
      ),
  };
}


/* ==========================================================================
   QUERY — ACTIVE CATEGORIES
   ========================================================================== */

/**
 * Retourne uniquement les vraies catégories actives présentes en base.
 *
 * Aucun fallback fictif n'est injecté.
 *
 * Si PostgreSQL ne contient aucune catégorie :
 *
 * []
 *
 * sera retourné et l'interface affichera un état vide propre.
 */

export async function queryProductCreateCategories():
  Promise<readonly ProductCreateCategoryOption[]> {
  const categories =
    await db.productCategory.findMany({
      where: {
        isActive:
          true,
      },

      select:
        PRODUCT_CREATE_CATEGORY_SELECT,

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


  return categories.map(
    mapProductCategory,
  );
}


/* ==========================================================================
   QUERY — ONE ACTIVE CATEGORY
   ========================================================================== */

/**
 * Revérifie côté serveur qu'une catégorie sélectionnée :
 *
 * - existe ;
 * - est toujours active.
 *
 * Cette vérification doit être refaite au moment de la création,
 * même si la catégorie figurait dans le select au chargement de la page.
 */

export async function queryActiveProductCategory(
  categoryId:
    ProductCreateCategoryId |
    string |
    null |
    undefined,
): Promise<ProductCreateCategoryOption | null> {
  const normalizedCategoryId =
    normalizeOptionalId(
      categoryId,
    );


  if (
    !normalizedCategoryId
  ) {
    return null;
  }


  const category =
    await db.productCategory.findFirst({
      where: {
        id:
          normalizedCategoryId,

        isActive:
          true,
      },

      select:
        PRODUCT_CREATE_CATEGORY_SELECT,
    });


  if (
    !category
  ) {
    return null;
  }


  return mapProductCategory(
    category,
  );
}


/* ==========================================================================
   ACTIVE CATEGORY EXISTS
   ========================================================================== */

export async function activeProductCategoryExists(
  categoryId:
    ProductCreateCategoryId |
    string |
    null |
    undefined,
): Promise<boolean> {
  const category =
    await queryActiveProductCategory(
      categoryId,
    );


  return category !==
    null;
}


/* ==========================================================================
   VALIDATE CATEGORY
   ========================================================================== */

export async function validateProductCreateCategory(
  categoryId:
    ProductCreateCategoryId |
    string |
    null |
    undefined,
): Promise<ProductCreateCategoryValidationResult> {
  const category =
    await queryActiveProductCategory(
      categoryId,
    );


  return {
    exists:
      category !==
      null,

    category,
  };
}


/* ==========================================================================
   QUERY — PRODUCT SLUG
   ========================================================================== */

/**
 * Utilisée pendant la génération d'un slug unique.
 *
 * Le slug n'est pas fourni directement par le formulaire.
 */

export async function queryProductBySlug(
  slug:
    string,
): Promise<ProductCreateUniqueLookupResult> {
  const normalizedSlug =
    normalizeSlug(
      slug,
    );


  if (
    !normalizedSlug
  ) {
    return {
      exists:
        false,

      productId:
        null,
    };
  }


  const product =
    await db.product.findUnique({
      where: {
        slug:
          normalizedSlug,
      },

      select: {
        id:
          true,
      },
    });


  return {
    exists:
      product !==
      null,

    productId:
      product?.id ??
      null,
  };
}


/* ==========================================================================
   PRODUCT SLUG EXISTS
   ========================================================================== */

export async function productSlugExists(
  slug:
    string,
): Promise<boolean> {
  const result =
    await queryProductBySlug(
      slug,
    );


  return result.exists;
}


/* ==========================================================================
   QUERY — SKU
   ========================================================================== */

/**
 * Utilisée lors de la génération du SKU serveur.
 */

export async function queryProductBySku(
  sku:
    string,
): Promise<ProductCreateUniqueLookupResult> {
  const normalizedSku =
    normalizeSku(
      sku,
    );


  if (
    !normalizedSku
  ) {
    return {
      exists:
        false,

      productId:
        null,
    };
  }


  const product =
    await db.product.findUnique({
      where: {
        sku:
          normalizedSku,
      },

      select: {
        id:
          true,
      },
    });


  return {
    exists:
      product !==
      null,

    productId:
      product?.id ??
      null,
  };
}


/* ==========================================================================
   PRODUCT SKU EXISTS
   ========================================================================== */

export async function productSkuExists(
  sku:
    string,
): Promise<boolean> {
  const result =
    await queryProductBySku(
      sku,
    );


  return result.exists;
}


/* ==========================================================================
   QUERY — QR TOKEN
   ========================================================================== */

/**
 * Vérifie qu'un qrToken n'est pas déjà utilisé.
 *
 * Le token lui-même sera généré par :
 *
 * product-qr.ts
 *
 * Cette fonction ne génère rien.
 */

export async function productQrTokenExists(
  qrToken:
    string,
): Promise<boolean> {
  const normalizedQrToken =
    normalizeQrToken(
      qrToken,
    );


  if (
    !normalizedQrToken
  ) {
    return false;
  }


  const existing =
    await db.storeProduct.findUnique({
      where: {
        qrToken:
          normalizedQrToken,
      },

      select: {
        id:
          true,
      },
    });


  return existing !==
    null;
}


/* ==========================================================================
   QUERY — STORE PRODUCT BY PRODUCT
   ========================================================================== */

/**
 * Vérifie si une boutique possède déjà une association avec un Product.
 *
 * Utile pour respecter :
 *
 * @@unique([storeId, productId])
 *
 * et éviter qu'une même paire boutique/produit soit créée deux fois.
 */

export async function queryStoreProductForProduct(
  context:
    ProductCreateQueryContext,

  productId:
    string,
): Promise<ProductCreateStoreProductLookupResult> {
  const storeId =
    normalizeRequiredId(
      context.storeId,
      "GESTIONNAIRE_STORE_ID_REQUIRED",
    );


  const normalizedProductId =
    normalizeOptionalId(
      productId,
    );


  if (
    !normalizedProductId
  ) {
    return {
      exists:
        false,

      storeProductId:
        null,

      productId:
        null,
    };
  }


  const storeProduct =
    await db.storeProduct.findUnique({
      where: {
        storeId_productId: {
          storeId,

          productId:
            normalizedProductId,
        },
      },

      select: {
        id:
          true,

        productId:
          true,
      },
    });


  return {
    exists:
      storeProduct !==
      null,

    storeProductId:
      storeProduct?.id ??
      null,

    productId:
      storeProduct
        ?.productId ??
      null,
  };
}


/* ==========================================================================
   QUERY — STORE CREATED PRODUCT
   ========================================================================== */

/**
 * Vérifie qu'un produit STORE appartient bien à la boutique donnée.
 *
 * Cela pourra être utile après création ou pour certains contrôles
 * internes.
 */

export async function queryStoreCreatedProduct(
  context:
    ProductCreateQueryContext,

  productId:
    string,
): Promise<
  | Readonly<{
      id:
        string;

      name:
        string;

      slug:
        string;

      sku:
        string;
    }>
  | null
> {
  const storeId =
    normalizeRequiredId(
      context.storeId,
      "GESTIONNAIRE_STORE_ID_REQUIRED",
    );


  const normalizedProductId =
    normalizeOptionalId(
      productId,
    );


  if (
    !normalizedProductId
  ) {
    return null;
  }


  return db.product.findFirst({
    where: {
      id:
        normalizedProductId,

      origin:
        ProductOrigin.STORE,

      createdByStoreId:
        storeId,
    },

    select: {
      id:
        true,

      name:
        true,

      slug:
        true,

      sku:
        true,
    },
  });
}


/* ==========================================================================
   PAGE DATA
   ========================================================================== */

/**
 * Charge toutes les données nécessaires à :
 *
 * /gestionnaire/produits/ajouter
 *
 * On reste volontairement minimal.
 *
 * Chargé :
 *
 * - boutique actuelle ;
 * - devise actuelle ;
 * - catégories actives ;
 * - marque officielle.
 *
 * Non chargé :
 *
 * - autres boutiques ;
 * - autres gestionnaires ;
 * - commandes ;
 * - clients ;
 * - produits existants ;
 * - QR existants ;
 * - mouvements de stock ;
 * - paiements ;
 * - promotions.
 *
 * UNITÉS :
 *
 * Aucune nomenclature officielle d'unités n'a encore été définie dans
 * la base ou dans une configuration métier validée.
 *
 * On retourne donc [].
 *
 * On n'invente volontairement PAS :
 *
 * - flacon ;
 * - tube ;
 * - pot ;
 * - pièce.
 *
 * Lorsque la liste officielle sera définie, elle pourra être branchée
 * ici sans modifier le formulaire principal.
 */

export async function getProductCreatePageData(
  context:
    ProductCreateQueryContext,
): Promise<ProductCreatePageData> {
  const storeId =
    normalizeRequiredId(
      context.storeId,
      "GESTIONNAIRE_STORE_ID_REQUIRED",
    );


  const [
    store,
    categories,
  ] =
    await Promise.all([
      queryProductCreateStore({
        storeId,
      }),

      queryProductCreateCategories(),
    ]);


  return {
    store: {
      name:
        store.name,

      currency:
        store.currency,
    },

    categories,

    units:
      [],

    brand:
      PRODUCT_CREATE_DEFAULT_BRAND,
  };
}