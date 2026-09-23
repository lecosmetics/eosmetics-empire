import {
  cache,
} from "react";

import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import PublicProductDetail from "@/components/public/products/PublicProductDetail";

import {
  publicRouteBuilders,
} from "@/config/routes";

import {
  buildPublicProductDetailSeoData,
} from "@/lib/public/products/public-product-detail-query";

import {
  getPublicProductDetailBySlugAndStore,
  normalizePublicProductRouteSlug,
} from "@/lib/public/products/public-product-detail-slug-query";

import type {
  PublicProductDetailData,
} from "@/lib/public/products/public-product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — FICHE PRODUIT PAR SLUG + BOUTIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/produits/[productSlug]/[storeSlug]/page.tsx
 *
 * Route :
 *
 * /produits/[productSlug]/[storeSlug]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher UNE offre publique StoreProduct précise avec une URL lisible :
 *
 * /produits/nom-du-produit/nom-de-la-boutique
 *
 * ============================================================================
 *
 * IDENTITÉ MÉTIER :
 *
 * Product.slug
 *
 * +
 *
 * Store.slug
 *
 *        ↓
 *
 * StoreProduct réel
 *
 *        ↓
 *
 * prix réel
 * stock réel
 * devise réelle
 * boutique réelle
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - cette page reste un Server Component ;
 * - elle n'importe ni Prisma ni db ;
 * - elle ne fait confiance à aucun prix provenant du navigateur ;
 * - elle ne reconstruit aucune donnée commerciale ;
 * - elle ne remplace pas le qrToken stable ;
 * - les QR existants continuent d'utiliser /p/[qrToken] ;
 * - l'URL lisible devient l'URL canonique de navigation normale.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. RENDU DYNAMIQUE
   ========================================================================== */

export const dynamic =
  "force-dynamic";


/* ==========================================================================
   2. PROPS ROUTE
   ========================================================================== */

interface PublicProductBySlugAndStorePageProps {
  readonly params:
    Promise<{
      readonly productSlug:
        string;

      readonly storeSlug:
        string;
    }>;
}


/* ==========================================================================
   3. PARAMÈTRES NORMALISÉS
   ========================================================================== */

interface ResolvedPublicProductRouteParams {
  readonly productSlug:
    string;

  readonly storeSlug:
    string;
}


async function resolvePublicProductRouteParams(
  props:
    PublicProductBySlugAndStorePageProps,
): Promise<ResolvedPublicProductRouteParams | null> {
  const params =
    await props.params;


  const productSlug =
    normalizePublicProductRouteSlug(
      params.productSlug,
    );


  const storeSlug =
    normalizePublicProductRouteSlug(
      params.storeSlug,
    );


  if (
    !productSlug ||
    !storeSlug
  ) {
    return null;
  }


  return {
    productSlug,

    storeSlug,
  };
}


/* ==========================================================================
   4. CHARGEMENT MÉMOÏSÉ PAR REQUÊTE
   ========================================================================== */

const getCachedPublicProductDetailBySlugAndStore =
  cache(
    async (
      productSlug:
        string,

      storeSlug:
        string,
    ): Promise<PublicProductDetailData | null> => {
      return getPublicProductDetailBySlugAndStore({
        productSlug,

        storeSlug,
      });
    },
  );


/* ==========================================================================
   5. URL CANONIQUE LISIBLE
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
   6. PRODUIT AVEC PUBLICPATH CANONIQUE
   ========================================================================== */

/**
 * La query historique chargée depuis qrToken conserve encore /p/[qrToken]
 * comme publicPath.
 *
 * Sur cette nouvelle route lisible, on remplace uniquement le publicPath
 * sérialisé destiné à l'UI / SEO.
 *
 * Aucune donnée métier n'est modifiée :
 *
 * - storeProductId reste identique ;
 * - productId reste identique ;
 * - qrToken reste identique ;
 * - prix reste identique ;
 * - stock reste identique ;
 * - boutique reste identique.
 */

function withReadablePublicPath(
  product:
    PublicProductDetailData,
): PublicProductDetailData {
  const publicPath =
    buildReadablePublicProductPath(
      product,
    );


  return {
    ...product,

    offer: {
      ...product.offer,

      publicPath,
    },
  };
}


/* ==========================================================================
   7. MÉTADONNÉES
   ========================================================================== */

export async function generateMetadata(
  props:
    PublicProductBySlugAndStorePageProps,
): Promise<Metadata> {
  const params =
    await resolvePublicProductRouteParams(
      props,
    );


  if (
    !params
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


  const rawProduct =
    await getCachedPublicProductDetailBySlugAndStore(
      params.productSlug,
      params.storeSlug,
    );


  if (
    !rawProduct
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
    withReadablePublicPath(
      rawProduct,
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

    alternates: {
      canonical:
        seo.canonicalPath,
    },

    openGraph: {
      title:
        seo.title,

      description:
        seo.description,

      url:
        seo.canonicalPath,

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
   8. PAGE
   ========================================================================== */

export default async function PublicProductBySlugAndStorePage(
  props:
    PublicProductBySlugAndStorePageProps,
) {
  const params =
    await resolvePublicProductRouteParams(
      props,
    );


  if (
    !params
  ) {
    notFound();
  }


  const rawProduct =
    await getCachedPublicProductDetailBySlugAndStore(
      params.productSlug,
      params.storeSlug,
    );


  if (
    !rawProduct
  ) {
    notFound();
  }


  const product =
    withReadablePublicPath(
      rawProduct,
    );


  return (
    <PublicProductDetail
      product={
        product
      }
    />
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * URL PUBLIQUE :
 *
 * /produits/[productSlug]/[storeSlug]
 *
 * ============================================================================
 *
 * EXEMPLE :
 *
 * /produits/lotion-corporelle-eclat/le-cosmetics-cotonou
 *
 * ============================================================================
 *
 * SOURCE DE VÉRITÉ :
 *
 * PostgreSQL
 *
 *        ↓
 *
 * Product.slug
 *
 * +
 *
 * Store.slug
 *
 *        ↓
 *
 * StoreProduct réel
 *
 * ============================================================================
 *
 * QR :
 *
 * /p/[qrToken]
 *
 * reste conservé séparément comme identité technique stable.
 *
 * ============================================================================
 */