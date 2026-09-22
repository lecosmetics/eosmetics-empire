import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import PublicCategoryProductsPage from "@/components/public/categories/PublicCategoryProductsPage";

import {
  getPublicCategoryProductsData,
} from "@/lib/public/categories/public-category-products-query";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — PRODUITS D’UNE CATÉGORIE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/categories/[slug]/page.tsx
 *
 * Route :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * EXEMPLE
 *
 * ProductCategory.slug :
 *
 * soins-du-visage
 *
 * Route :
 *
 * /categories/soins-du-visage
 *
 * ============================================================================
 *
 * RÔLE
 *
 * - récupérer le vrai paramètre dynamique [slug] ;
 * - normaliser le slug reçu ;
 * - charger la vraie ProductCategory ;
 * - charger uniquement ses vraies offres StoreProduct publiques ;
 * - déclencher notFound() lorsque la catégorie n’existe pas ;
 * - afficher PublicCategoryProductsPage ;
 * - générer des métadonnées propres depuis la vraie catégorie.
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * ProductCategory
 *      ↓
 * Product
 *      ↓
 * StoreProduct
 *      ↓
 * Store
 *
 * ============================================================================
 *
 * IMPORTANT
 *
 * Cette page NE DOIT PAS :
 *
 * - effectuer directement de requête Prisma ;
 * - créer une catégorie fictive ;
 * - créer un produit fictif ;
 * - fabriquer un slug depuis le nom ;
 * - fabriquer une route produit ;
 * - recréer le Header ;
 * - recréer le Footer ;
 * - recréer la Bottom Navigation ;
 * - devenir un Client Component ;
 * - utiliser useState ;
 * - utiliser useEffect.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. COMPORTEMENT DE RENDU
   ========================================================================== */

/**
 * Les prix, stocks et disponibilités peuvent évoluer.
 *
 * Cette route doit donc lire les données commerciales actuelles au moment
 * de la requête au lieu de produire une page figée de manière permanente.
 */
export const dynamic =
  "force-dynamic";


/* ==========================================================================
   2. TYPES DE ROUTE
   ========================================================================== */

/**
 * Next.js récent fournit les paramètres de route de manière asynchrone.
 *
 * On utilise donc Promise<{ slug: string }> afin de rester compatible avec
 * l’App Router actuel du projet.
 */
interface PublicCategoryRoutePageProps {
  readonly params:
    Promise<{
      readonly slug:
        string;
    }>;
}


/* ==========================================================================
   3. NORMALISATION DU SLUG
   ========================================================================== */

/**
 * Cette fonction :
 *
 * - ne transforme pas le nom de la catégorie ;
 * - ne slugifie rien ;
 * - ne modifie pas la casse ;
 * - ne fabrique aucune valeur.
 *
 * Elle nettoie uniquement le paramètre reçu depuis la route.
 */
function normalizeRouteSlug(
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


/* ==========================================================================
   4. NORMALISATION DESCRIPTION
   ========================================================================== */

function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
): string |
  null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized.length >
    0
    ? normalized
    : null;
}


/* ==========================================================================
   5. MÉTADONNÉES
   ========================================================================== */

/**
 * Les métadonnées reposent uniquement sur les vraies données de la catégorie.
 *
 * Aucun nom, nombre de produits ou description SEO fictive n’est ajouté.
 */
export async function generateMetadata({
  params,
}: PublicCategoryRoutePageProps): Promise<Metadata> {
  const {
    slug:
      rawSlug,
  } =
    await params;


  const slug =
    normalizeRouteSlug(
      rawSlug,
    );


  if (
    !slug
  ) {
    return {
      title:
        "Catégorie",
    };
  }


  const data =
    await getPublicCategoryProductsData(
      slug,
    );


  if (
    !data
  ) {
    return {
      title:
        "Catégorie introuvable",
      robots: {
        index:
          false,

        follow:
          false,
      },
    };
  }


  const categoryName =
    data
      .category
      .name
      .trim();


  const categoryDescription =
    normalizeOptionalText(
      data
        .category
        .description,
    );


  return {
    title:
      categoryName,

    ...(categoryDescription
      ? {
          description:
            categoryDescription,
        }
      : {}),

    robots: {
      index:
        true,

      follow:
        true,
    },
  };
}


/* ==========================================================================
   6. PAGE
   ========================================================================== */

export default async function PublicCategoryPage({
  params,
}: PublicCategoryRoutePageProps) {
  /* ------------------------------------------------------------------------
     PARAMÈTRE DYNAMIQUE
     ------------------------------------------------------------------------ */

  const {
    slug:
      rawSlug,
  } =
    await params;


  const slug =
    normalizeRouteSlug(
      rawSlug,
    );


  /* ------------------------------------------------------------------------
     SLUG INVALIDE
     ------------------------------------------------------------------------ */

  if (
    !slug
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     DONNÉES SERVEUR
     ------------------------------------------------------------------------ */

  const data =
    await getPublicCategoryProductsData(
      slug,
    );


  /* ------------------------------------------------------------------------
     CATÉGORIE INTROUVABLE / NON PUBLIQUE
     ------------------------------------------------------------------------ */

  if (
    !data
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     PROTECTION STRUCTURELLE
     ------------------------------------------------------------------------ */

  const categoryId =
    data
      .category
      .id
      .trim();


  const categoryName =
    data
      .category
      .name
      .trim();


  const categorySlug =
    data
      .category
      .slug
      .trim();


  if (
    !categoryId ||
    !categoryName ||
    !categorySlug
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     PROTECTION ROUTE / DONNÉE
     ------------------------------------------------------------------------ */

  /**
   * Le slug retourné par PostgreSQL doit correspondre au slug demandé.
   *
   * Cette vérification évite d’afficher silencieusement une autre catégorie
   * si la logique de requête évolue ultérieurement.
   */
  if (
    categorySlug !==
    slug
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <PublicCategoryProductsPage
      data={
        data
      }
    />
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ROUTE :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * EXEMPLE :
 *
 * /categories/soins-du-visage
 *
 * ============================================================================
 *
 * DONNÉES :
 *
 * getPublicCategoryProductsData(slug)
 *
 * ============================================================================
 *
 * SI LA CATÉGORIE EXISTE :
 *
 * ProductCategory réelle
 *      ↓
 * vrais Product
 *      ↓
 * vrais StoreProduct disponibles
 *      ↓
 * vraies cartes produits.
 *
 * ============================================================================
 *
 * SI LA CATÉGORIE EXISTE MAIS N’A AUCUN PRODUIT :
 *
 * La page reste valide.
 *
 * products = []
 *
 * productCount = 0
 *
 * PublicCategoryProductsPage affiche alors son état vide.
 *
 * ============================================================================
 *
 * SI LA CATÉGORIE N’EXISTE PAS :
 *
 * notFound()
 *
 * ============================================================================
 *
 * SI LA CATÉGORIE EST INACTIVE :
 *
 * La requête serveur retourne null.
 *
 * Puis :
 *
 * notFound()
 *
 * ============================================================================
 *
 * HEADER :
 *
 * fourni par :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * FOOTER :
 *
 * fourni par :
 *
 * src/app/(public)/layout.tsx
 *
 * Le composant PublicCategoryProductsPage porte déjà :
 *
 * data-public-categories-page="true"
 *
 * donc :
 *
 * Desktop :
 * Footer visible.
 *
 * Mobile :
 * Footer masqué.
 *
 * ============================================================================
 *
 * BOTTOM NAVIGATION :
 *
 * fournie globalement par :
 *
 * src/components/public/PublicMobileBottomNav.tsx
 *
 * Elle reste visible sur mobile.
 *
 * ============================================================================
 *
 * CARTES PRODUITS :
 *
 * src/components/public/products/PublicProductCard.tsx
 *
 * ============================================================================
 *
 * ROUTE PRODUIT :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * déjà résolue dans :
 *
 * src/lib/public/categories/public-category-products-query.ts
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma directe ;
 * - donnée de démonstration ;
 * - fausse catégorie ;
 * - faux produit ;
 * - faux prix ;
 * - faux stock ;
 * - route produit inventée ;
 * - duplication du shell public.
 *
 * ============================================================================
 */