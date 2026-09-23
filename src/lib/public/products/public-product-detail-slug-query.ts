

import {
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  getPublicProductDetailByQrToken,
} from "@/lib/public/products/public-product-detail-query";

import type {
  PublicProductDetailQueryResult,
} from "@/lib/public/products/public-product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * RÉSOLUTION PUBLIQUE — PRODUIT PAR SLUG + BOUTIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/products/public-product-detail-slug-query.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Résoudre une URL publique lisible :
 *
 * /produits/[productSlug]/[storeSlug]
 *
 * vers le StoreProduct public réel correspondant.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce module ne duplique PAS le mapping complet de la fiche produit.
 *
 * Il :
 *
 * 1. valide les deux slugs ;
 * 2. retrouve uniquement le qrToken du StoreProduct correspondant ;
 * 3. délègue le chargement complet à getPublicProductDetailByQrToken().
 *
 * Ainsi :
 *
 * - une seule logique continue de construire le prix ;
 * - une seule logique continue de construire le stock ;
 * - une seule logique continue de filtrer les images ;
 * - une seule logique continue de construire le Panier ;
 * - aucune donnée commerciale n'est dupliquée.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. LIMITES SLUG
   ========================================================================== */

const PUBLIC_PRODUCT_ROUTE_SLUG_MIN_LENGTH =
  1;


const PUBLIC_PRODUCT_ROUTE_SLUG_MAX_LENGTH =
  180;


/**
 * Compatible avec les slugs habituels déjà stockés dans Product.slug
 * et Store.slug :
 *
 * lettres ASCII minuscules / majuscules
 * chiffres
 * tiret
 * underscore
 *
 * Aucun slash ni caractère de contrôle.
 */
const PUBLIC_PRODUCT_ROUTE_SLUG_PATTERN =
  /^[A-Za-z0-9_-]+$/;


/* ==========================================================================
   2. STATUTS PUBLICS
   ========================================================================== */

const PUBLIC_STORE_PRODUCT_VISIBLE_STATUSES =
  [
    StoreProductStatus.ACTIVE,
    StoreProductStatus.OUT_OF_STOCK,
  ] as const;


/* ==========================================================================
   3. NORMALISATION
   ========================================================================== */

export function normalizePublicProductRouteSlug(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value
      .normalize(
        "NFKC",
      )
      .trim();


  if (
    normalized.length <
      PUBLIC_PRODUCT_ROUTE_SLUG_MIN_LENGTH ||
    normalized.length >
      PUBLIC_PRODUCT_ROUTE_SLUG_MAX_LENGTH
  ) {
    return null;
  }


  if (
    !PUBLIC_PRODUCT_ROUTE_SLUG_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   4. INPUT
   ========================================================================== */

export interface PublicProductDetailBySlugAndStoreInput {
  readonly productSlug:
    string;

  readonly storeSlug:
    string;
}


/* ==========================================================================
   5. RÉSOLUTION QR TOKEN
   ========================================================================== */

async function findPublicStoreProductQrTokenBySlugs({
  productSlug,
  storeSlug,
}: {
  readonly productSlug:
    string;

  readonly storeSlug:
    string;
}): Promise<string | null> {
  const row =
    await db.storeProduct.findFirst({
      where: {
        status: {
          in: [
            ...PUBLIC_STORE_PRODUCT_VISIBLE_STATUSES,
          ],
        },

        price: {
          gt:
            0,
        },

        currency: {
          not:
            "",
        },

        product: {
          slug:
            productSlug,

          status:
            ProductStatus.ACTIVE,
        },

        store: {
          slug:
            storeSlug,

          status:
            StoreStatus.ACTIVE,
        },
      },

      select: {
        qrToken:
          true,
      },
    });


  return row?.qrToken ??
    null;
}


/* ==========================================================================
   6. API PUBLIQUE
   ========================================================================== */

export async function getPublicProductDetailBySlugAndStore(
  input:
    PublicProductDetailBySlugAndStoreInput,
): Promise<PublicProductDetailQueryResult> {
  const productSlug =
    normalizePublicProductRouteSlug(
      input.productSlug,
    );


  const storeSlug =
    normalizePublicProductRouteSlug(
      input.storeSlug,
    );


  if (
    !productSlug ||
    !storeSlug
  ) {
    return null;
  }


  const qrToken =
    await findPublicStoreProductQrTokenBySlugs({
      productSlug,

      storeSlug,
    });


  if (
    !qrToken
  ) {
    return null;
  }


  /**
   * Source unique du mapping complet de la fiche.
   *
   * Cette fonction revérifie elle-même :
   *
   * - qrToken ;
   * - Product ACTIVE ;
   * - Store ACTIVE ;
   * - StoreProduct ACTIVE / OUT_OF_STOCK ;
   * - prix > 0 ;
   * - devise ;
   * - cohérence des relations ;
   * - données indispensables.
   */
  return getPublicProductDetailByQrToken(
    qrToken,
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 */