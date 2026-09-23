import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { publicRouteBuilders } from "@/config/routes";

import {
  buildPublicProductDetailSeoData,
  getPublicProductDetailByQrToken,
  normalizePublicProductDetailQrToken,
} from "@/lib/public/products/public-product-detail-query";

import type {
  PublicProductDetailData,
  PublicProductDetailRoutePageProps,
} from "@/lib/public/products/public-product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ROUTE PUBLIQUE QR — RÉSOLUTION + REDIRECTION
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/p/[qrToken]/page.tsx
 *
 * Route technique stable :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Cette route reste la destination stable des QR produit déjà générés.
 *
 * Elle :
 *
 * 1. valide le qrToken ;
 * 2. retrouve le vrai StoreProduct public ;
 * 3. récupère Product.slug et Store.slug depuis les données réelles ;
 * 4. construit la route publique lisible officielle ;
 * 5. redirige vers :
 *
 *    /produits/[productSlug]/[storeSlug]
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - aucun QR existant n'est cassé ;
 * - aucun qrToken n'est modifié ;
 * - aucun prix n'est placé dans l'URL ;
 * - aucun stock n'est placé dans l'URL ;
 * - aucun StoreProductId n'est exposé dans l'URL lisible ;
 * - aucun accès Prisma direct depuis cette page ;
 * - aucune donnée fictive ;
 * - aucune logique Panier ;
 * - aucune mutation PostgreSQL ;
 * - aucune création de commande ;
 * - aucun paiement.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. RENDU DYNAMIQUE
   ========================================================================== */

export const dynamic =
  "force-dynamic";


/* ==========================================================================
   2. CHARGEMENT MÉMOÏSÉ PAR REQUÊTE
   ========================================================================== */

const getCachedPublicProductDetailByQrToken =
  cache(
    async (
      qrToken:
        string,
    ): Promise<PublicProductDetailData | null> => {
      return getPublicProductDetailByQrToken(
        qrToken,
      );
    },
  );


/* ==========================================================================
   3. NORMALISATION DU PARAMÈTRE
   ========================================================================== */

async function resolvePublicProductQrToken(
  props:
    PublicProductDetailRoutePageProps,
): Promise<string | null> {
  const params =
    await props.params;


  return normalizePublicProductDetailQrToken(
    params.qrToken,
  );
}


/* ==========================================================================
   4. URL PUBLIQUE LISIBLE
   ========================================================================== */

function buildReadablePublicProductPath(
  product:
    PublicProductDetailData,
): string {
  return publicRouteBuilders
    .productBySlugAndStore(
      product.product.slug,
      product.store.slug,
    );
}


/* ==========================================================================
   5. MÉTADONNÉES
   ========================================================================== */

export async function generateMetadata(
  props:
    PublicProductDetailRoutePageProps,
): Promise<Metadata> {
  const qrToken =
    await resolvePublicProductQrToken(
      props,
    );


  if (
    !qrToken
  ) {
    return {
      robots: {
        index:
          false,

        follow:
          false,
      },
    };
  }


  const product =
    await getCachedPublicProductDetailByQrToken(
      qrToken,
    );


  if (
    !product
  ) {
    return {
      robots: {
        index:
          false,

        follow:
          false,
      },
    };
  }


  const readablePath =
    buildReadablePublicProductPath(
      product,
    );


  const seo =
    buildPublicProductDetailSeoData(
      product,
    );


  return {
    title:
      seo.title,

    description:
      seo.description,

    robots: {
      index:
        false,

      follow:
        true,
    },

    alternates: {
      canonical:
        readablePath,
    },

    openGraph: {
      title:
        seo.title,

      description:
        seo.description,

      url:
        readablePath,

      images:
        seo.imageUrl
          ? [
              {
                url:
                  seo.imageUrl,

                alt:
                  seo.imageAlt ??
                  product.product.name,
              },
            ]
          : undefined,
    },

    twitter: {
      card:
        seo.imageUrl
          ? "summary_large_image"
          : "summary",

      title:
        seo.title,

      description:
        seo.description,

      images:
        seo.imageUrl
          ? [
              seo.imageUrl,
            ]
          : undefined,
    },
  };
}


/* ==========================================================================
   6. PAGE QR
   ========================================================================== */

export default async function PublicProductQrPage(
  props:
    PublicProductDetailRoutePageProps,
) {
  const qrToken =
    await resolvePublicProductQrToken(
      props,
    );


  if (
    !qrToken
  ) {
    notFound();
  }


  const product =
    await getCachedPublicProductDetailByQrToken(
      qrToken,
    );


  if (
    !product
  ) {
    notFound();
  }


  const readablePath =
    buildReadablePublicProductPath(
      product,
    );


  redirect(
    readablePath,
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * FLUX QR FINAL :
 *
 * QR imprimé / QR affiché
 *
 *        ↓
 *
 * /p/[qrToken]
 *
 *        ↓
 *
 * normalizePublicProductDetailQrToken()
 *
 *        ↓
 *
 * getPublicProductDetailByQrToken()
 *
 *        ↓
 *
 * StoreProduct public réel
 *
 *        ↓
 *
 * Product.slug + Store.slug
 *
 *        ↓
 *
 * publicRouteBuilders.productBySlugAndStore()
 *
 *        ↓
 *
 * /produits/[productSlug]/[storeSlug]
 *
 *        ↓
 *
 * fiche produit premium
 *
 * ============================================================================
 *
 * Le qrToken reste stable.
 *
 * L'URL visible devient lisible.
 *
 * ============================================================================
 */