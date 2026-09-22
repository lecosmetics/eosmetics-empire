import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import PublicCategoriesGrid from "@/components/public/categories/PublicCategoriesGrid";
import PublicCategoriesHero from "@/components/public/categories/PublicCategoriesHero";
import PublicCategoriesPromo from "@/components/public/categories/PublicCategoriesPromo";

import {
  getPublicCategoriesPageData,
} from "@/lib/public/categories/public-categories-query";

import styles from "@/components/public/categories/public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — TOUTES LES CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/categories/page.tsx
 *
 * Route :
 *
 * /categories
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Assembler la page publique affichant toutes les vraies catégories
 * disponibles sur le site.
 *
 * ============================================================================
 *
 * ARCHITECTURE
 *
 * Public Layout existant
 *      ↓
 * PublicHeader
 *      ↓
 * PublicCategoriesHero
 *      ↓
 * PublicCategoriesGrid
 *      ↓
 * PublicCategoriesPromo
 *      ↓
 * PublicFooter
 *
 * Desktop :
 *
 * Footer visible.
 *
 * Mobile :
 *
 * Footer masqué uniquement sur cette page grâce à :
 *
 * data-public-categories-page="true"
 *
 * La Bottom Navigation globale du layout reste présente.
 *
 * ============================================================================
 *
 * DONNÉES
 *
 * Les catégories sont chargées depuis :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * puis :
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
 * IMPORTANT :
 *
 * Cette page NE DOIT PAS :
 *
 * - contenir de catégories en dur ;
 * - inventer de nombres de produits ;
 * - inventer de routes catégorie ;
 * - effectuer directement de requête Prisma ;
 * - dupliquer le Header ;
 * - dupliquer le Footer ;
 * - dupliquer la Bottom Navigation ;
 * - devenir un Client Component ;
 * - utiliser useEffect ;
 * - utiliser useState.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. ROUTE PUBLIQUE PRODUITS
   ========================================================================== */

/**
 * La route Produits provient de la configuration de navigation publique
 * existante.
 *
 * Elle est transmise au composant Promotion.
 *
 * Aucun "/produits" n'est écrit manuellement dans le composant.
 */
const PRODUCTS_HREF =
  PUBLIC_NAVIGATION_ROUTES.PRODUCTS;


/* ==========================================================================
   2. PAGE
   ========================================================================== */

export default async function PublicCategoriesPage() {
  /* ------------------------------------------------------------------------
     DONNÉES SERVEUR
     ------------------------------------------------------------------------ */

  const data =
    await getPublicCategoriesPageData();


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.categoriesPage
      }
      data-public-categories-page="true"
    >
      {/* ==================================================================
          HERO
          ================================================================== */}

      <PublicCategoriesHero />


      {/* ==================================================================
          TOUTES LES CATÉGORIES
          ================================================================== */}

      <PublicCategoriesGrid
        categories={
          data.categories
        }
      />


      {/* ==================================================================
          BANNIÈRE BASSE
          ================================================================== */}

      <PublicCategoriesPromo
        productsHref={
          PRODUCTS_HREF
        }
      />
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * PAGE :
 *
 * /categories
 *
 * ============================================================================
 *
 * DONNÉES :
 *
 * getPublicCategoriesPageData()
 *
 * retourne :
 *
 * {
 *   categories,
 *   categoryCount
 * }
 *
 * ============================================================================
 *
 * AFFICHAGE :
 *
 * PublicCategoriesHero
 *
 * +
 *
 * PublicCategoriesGrid
 *
 * +
 *
 * PublicCategoriesPromo
 *
 * ============================================================================
 *
 * HEADER :
 *
 * déjà fourni par :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * FOOTER :
 *
 * déjà fourni par :
 *
 * src/app/(public)/layout.tsx
 *
 * Desktop :
 *
 * visible.
 *
 * Mobile :
 *
 * masqué uniquement sur cette page grâce à :
 *
 * data-public-categories-page="true"
 *
 * et :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * ============================================================================
 *
 * BOTTOM NAVIGATION :
 *
 * déjà fournie par :
 *
 * src/components/public/PublicMobileBottomNav.tsx
 *
 * Elle n'est pas recréée ici.
 *
 * ============================================================================
 *
 * CATÉGORIES :
 *
 * aucune catégorie en dur.
 *
 * ============================================================================
 *
 * ROUTES DES CATÉGORIES :
 *
 * déjà préparées côté serveur dans :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * ROUTE PRODUITS :
 *
 * PUBLIC_NAVIGATION_ROUTES.PRODUCTS
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma directe ;
 * - donnée fictive ;
 * - route catégorie inventée ;
 * - logique cliente ;
 * - duplication du shell public.
 *
 * ============================================================================
 */