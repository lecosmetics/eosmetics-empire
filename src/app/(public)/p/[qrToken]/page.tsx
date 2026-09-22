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
 * PAGE PUBLIQUE — FICHE PRODUIT PREMIUM PAR QR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/p/[qrToken]/page.tsx
 *
 * Route :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Charger et afficher UNE offre publique StoreProduct précise à partir de
 * son qrToken stable.
 *
 * ============================================================================
 *
 * ARCHITECTURE :
 *
 * QR produit / carte produit
 *
 *        ↓
 *
 * /p/[qrToken]
 *
 *        ↓
 *
 * validation du qrToken
 *
 *        ↓
 *
 * getPublicProductDetailByQrToken()
 *
 *        ↓
 *
 * StoreProduct
 *      ↓
 * Product
 *      ↓
 * Store
 *
 *        ↓
 *
 * PublicProductDetail
 *
 * ============================================================================
 *
 * FICHE PREMIUM :
 *
 * PublicProductDetail est responsable de l'interface complète :
 *
 * - galerie ;
 * - miniatures ;
 * - marque ;
 * - nom ;
 * - référence ;
 * - catégorie ;
 * - prix ;
 * - ancienne valeur réelle ;
 * - réduction réelle ;
 * - disponibilité ;
 * - stock ;
 * - quantité ;
 * - vrai ajout au Panier ;
 * - Voir mon panier ;
 * - Continuer mes achats ;
 * - point de vente ;
 * - informations produit ;
 * - conseils d'utilisation ;
 * - ingrédients ;
 * - contenance ;
 * - livraison Afrique ;
 * - livraison internationale ;
 * - WhatsApp ;
 * - CTA catalogue.
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Header
 * Fiche produit
 * Footer
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Header mobile
 * Fiche produit
 *
 * PAS DE FOOTER.
 *
 * Navigation mobile fixe existante :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette page :
 *
 * - reste un Server Component ;
 * - n'importe pas Prisma ;
 * - n'importe pas db ;
 * - ne lit pas PostgreSQL directement ;
 * - ne lit pas localStorage ;
 * - ne gère pas directement le Panier ;
 * - ne réserve pas de stock ;
 * - ne crée pas de commande ;
 * - ne crée pas de paiement ;
 * - ne fait pas confiance au navigateur ;
 * - ne construit pas manuellement /p/[qrToken] ;
 * - ne crée pas de faux produit ;
 * - ne crée pas de faux prix ;
 * - ne crée pas de faux stock ;
 * - ne crée pas de fausse image ;
 * - ne crée pas de fausse boutique ;
 * - ne crée pas de fausse catégorie ;
 * - ne recrée pas le Header ;
 * - ne recrée pas le Footer ;
 * - ne recrée pas la navigation mobile.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. RENDU DYNAMIQUE
   ========================================================================== */

/**
 * Le prix, le stock, la disponibilité et le statut StoreProduct peuvent
 * évoluer.
 *
 * ============================================================================
 *
 * La fiche ne doit donc pas devenir une page statique durable avec :
 *
 * - ancien prix ;
 * - ancien stock ;
 * - ancien statut ;
 * - ancienne disponibilité.
 *
 * ============================================================================
 */
export const dynamic =
  "force-dynamic";


/* ==========================================================================
   2. CHARGEMENT MÉMOÏSÉ PAR REQUÊTE
   ========================================================================== */

/**
 * generateMetadata() et la page ont besoin du même produit.
 *
 * React cache() permet de partager la même fonction de chargement dans le
 * cycle de rendu serveur lorsque les deux appels utilisent le même qrToken.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce cache n'est pas une stratégie de mise en cache commerciale longue durée.
 *
 * La route reste :
 *
 * dynamic = "force-dynamic"
 *
 * ============================================================================
 */
const getCachedPublicProductDetailByQrToken =
  cache(
    async (
      qrToken:
        string,
    ): Promise<
      PublicProductDetailData |
      null
    > => {
      return getPublicProductDetailByQrToken(
        qrToken,
      );
    },
  );


/* ==========================================================================
   3. NORMALISATION DES PARAMÈTRES
   ========================================================================== */

/**
 * Une seule règle de validation du qrToken est utilisée :
 *
 * normalizePublicProductDetailQrToken()
 *
 * ============================================================================
 *
 * On ne recopie donc pas ici :
 *
 * - longueur minimale ;
 * - longueur maximale ;
 * - regex ;
 * - caractères autorisés.
 *
 * Ces règles restent centralisées dans :
 *
 * public-product-detail-query.ts
 *
 * ============================================================================
 */
async function resolvePublicProductQrToken(
  props:
    PublicProductDetailRoutePageProps,
): Promise<
  string |
  null
> {
  const resolvedParams =
    await props.params;


  return normalizePublicProductDetailQrToken(
    resolvedParams.qrToken,
  );
}


/* ==========================================================================
   4. MÉTADONNÉES SEO
   ========================================================================== */

/**
 * Les métadonnées reposent uniquement sur les vraies données produit.
 *
 * ============================================================================
 *
 * Sont notamment utilisés lorsqu'ils existent :
 *
 * - Product.name ;
 * - Product.description ;
 * - Product.brand ;
 * - Store.city ;
 * - Store.country ;
 * - route canonique /p/[qrToken].
 *
 * ============================================================================
 *
 * Aucun slogan commercial fictif n'est généré ici.
 *
 * ============================================================================
 */
export async function generateMetadata(
  props:
    PublicProductDetailRoutePageProps,
): Promise<
  Metadata
> {
  /* ------------------------------------------------------------------------
     QR TOKEN
     ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------
     PRODUIT
     ------------------------------------------------------------------------ */

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


  /* ------------------------------------------------------------------------
     SEO RÉEL
     ------------------------------------------------------------------------ */

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
  };
}


/* ==========================================================================
   5. PAGE
   ========================================================================== */

export default async function PublicProductPage(
  props:
    PublicProductDetailRoutePageProps,
) {
  /* =========================================================================
     QR TOKEN
     ========================================================================= */

  const qrToken =
    await resolvePublicProductQrToken(
      props,
    );


  /* =========================================================================
     TOKEN INVALIDE
     ========================================================================= */

  if (
    !qrToken
  ) {
    notFound();
  }


  /* =========================================================================
     CHARGEMENT SERVEUR
     ========================================================================= */

  const product =
    await getCachedPublicProductDetailByQrToken(
      qrToken,
    );


  /* =========================================================================
     OFFRE ABSENTE / NON PUBLIQUE
     ========================================================================= */

  if (
    !product
  ) {
    /**
     * On retourne volontairement une 404 générique.
     *
     * =========================================================================
     *
     * Cela évite de révéler si le qrToken correspond éventuellement à :
     *
     * - une offre HIDDEN ;
     * - une offre ARCHIVED ;
     * - une offre inexistante ;
     * - une boutique suspendue ;
     * - une boutique désactivée ;
     * - un Product non public ;
     * - une donnée structurellement invalide.
     *
     * =========================================================================
     */
    notFound();
  }


  /* =========================================================================
     RENDU PREMIUM
     ========================================================================= */

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
 * FLUX FINAL :
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
 * PostgreSQL / Prisma
 *
 *        ↓
 *
 * Product ACTIVE
 *
 * +
 *
 * Store ACTIVE
 *
 * +
 *
 * StoreProduct ACTIVE / OUT_OF_STOCK
 *
 * +
 *
 * prix réel
 *
 * +
 *
 * devise réelle
 *
 * +
 *
 * stock réel
 *
 * +
 *
 * images réelles
 *
 * +
 *
 * catégorie réelle éventuelle
 *
 * +
 *
 * point de vente réel
 *
 *        ↓
 *
 * PublicProductDetail
 *
 * ============================================================================
 *
 * PUBLICPRODUCTDETAIL :
 *
 * Galerie
 *
 *        ↓
 *
 * Marque
 * Nom
 * SKU
 * Catégorie
 *
 *        ↓
 *
 * Prix
 * Promotion réelle
 * Économie réelle
 *
 *        ↓
 *
 * Disponibilité
 * Stock
 *
 *        ↓
 *
 * Quantité
 *
 *        ↓
 *
 * PublicAddToPanierButton
 *
 *        ↓
 *
 * Voir mon panier
 * Continuer mes achats
 *
 *        ↓
 *
 * Point de vente
 *
 *        ↓
 *
 * Informations produit
 *
 *        ↓
 *
 * Livraison Afrique
 * Livraison internationale
 *
 *        ↓
 *
 * WhatsApp
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Header
 *
 * Fiche produit premium
 *
 * Footer
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Header mobile
 *
 * Fiche produit premium
 *
 * PAS DE FOOTER
 *
 * Navigation fixe :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * AUCUNE DONNÉE COMMERCIALE N'EST RECONSTRUITE DANS page.tsx.
 *
 * ============================================================================
 */