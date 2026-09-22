import {
  PUBLIC_CATEGORIES_LOADING_CONFIG,
} from "@/config/public-categories";

import styles from "@/components/public/categories/public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE CATÉGORIES — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/categories/loading.tsx
 *
 * Route concernée :
 *
 * /categories
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement neutre pendant que Next.js attend
 * les vraies données de :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - n'effectue aucune requête Prisma ;
 * - ne contient aucune catégorie fictive ;
 * - ne contient aucun faux nom ;
 * - ne contient aucun faux compteur ;
 * - ne contient aucun faux prix ;
 * - ne contient aucune fausse image ;
 * - ne contient aucune route dynamique ;
 * - ne dépend pas d'une session ;
 * - reste un Server Component ;
 * - n'utilise aucun hook React.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const LOADING_CONFIG =
  PUBLIC_CATEGORIES_LOADING_CONFIG;


/* ==========================================================================
   2. NOMBRE DE SKELETONS
   ========================================================================== */

/**
 * On utilise le nombre desktop comme quantité maximale rendue.
 *
 * Le responsive est ensuite entièrement géré par CSS.
 *
 * Ces blocs sont purement visuels :
 *
 * ils ne représentent aucune catégorie réelle ou fictive.
 */
const SKELETON_COUNT =
  Math.max(
    LOADING_CONFIG.desktopSkeletonCount,
    LOADING_CONFIG.mobileSkeletonCount,
  );


/* ==========================================================================
   3. IDENTIFIANTS DES SKELETONS
   ========================================================================== */

const SKELETON_IDS =
  Array.from(
    {
      length:
        SKELETON_COUNT,
    },
    (
      _,
      index,
    ) =>
      `category-skeleton-${index + 1}`,
  );


/* ==========================================================================
   4. SKELETON D'UNE CARTE
   ========================================================================== */

function CategoryLoadingCard() {
  return (
    <div
      className={
        styles.categoriesLoadingCard
      }
      aria-hidden="true"
    >
      {/* =================================================================
          IMAGE
          ================================================================= */}

      <div
        className={
          styles.categoriesLoadingCardImage
        }
      />


      {/* =================================================================
          NOM
          ================================================================= */}

      <div
        className={
          styles.categoriesLoadingLine
        }
      />


      {/* =================================================================
          COMPTEUR
          ================================================================= */}

      <div
        className={
          styles.categoriesLoadingLineShort
        }
      />
    </div>
  );
}


/* ==========================================================================
   5. GRILLE DE CHARGEMENT
   ========================================================================== */

function CategoriesLoadingGrid() {
  return (
    <div
      className={
        styles.categoriesLoadingGrid
      }
      aria-hidden="true"
    >
      {SKELETON_IDS.map(
        (
          id,
        ) => (
          <CategoryLoadingCard
            key={
              id
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   6. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoriesLoading() {
  return (
    <div
      className={
        styles.categoriesLoadingPage
      }
      data-public-categories-page="true"
      aria-busy="true"
      aria-live="polite"
    >
      {/* ==================================================================
          TEXTE ACCESSIBLE
          ================================================================== */}

      <span
        className="sr-only"
      >
        Chargement des catégories
      </span>


      {/* ==================================================================
          HERO SKELETON
          ================================================================== */}

      <div
        className={
          styles.categoriesLoadingHero
        }
        aria-hidden="true"
      />


      {/* ==================================================================
          TITRE DE SECTION SKELETON
          ================================================================== */}

      <div
        className={
          styles.categoriesLoadingHeader
        }
        aria-hidden="true"
      />


      {/* ==================================================================
          CARTES SKELETON
          ================================================================== */}

      <CategoriesLoadingGrid />
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * COMPORTEMENT
 *
 * Pendant le chargement :
 *
 * Header public :
 *
 * déjà géré par :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * CONTENU :
 *
 * Hero neutre
 *      ↓
 * titre neutre
 *      ↓
 * cartes skeleton neutres
 *
 * ============================================================================
 *
 * FOOTER MOBILE :
 *
 * Le marqueur :
 *
 * data-public-categories-page="true"
 *
 * est également présent pendant le chargement.
 *
 * Le comportement reste donc cohérent avec la vraie page :
 *
 * Desktop :
 *
 * Footer visible.
 *
 * Mobile :
 *
 * Footer masqué.
 *
 * Bottom Navigation publique :
 *
 * conservée.
 *
 * ============================================================================
 *
 * SKELETONS :
 *
 * Les blocs n'affichent aucune donnée métier.
 *
 * Ils ne représentent donc :
 *
 * - aucun ProductCategory ;
 * - aucun Product ;
 * - aucun StoreProduct ;
 * - aucune boutique.
 *
 * ============================================================================
 *
 * RESPONSIVE :
 *
 * La grille est contrôlée par :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * Desktop :
 *
 * 5 colonnes.
 *
 * Tablette :
 *
 * 3 colonnes.
 *
 * Mobile :
 *
 * 2 colonnes.
 *
 * ============================================================================
 */