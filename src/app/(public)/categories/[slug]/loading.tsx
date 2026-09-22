import {
  PUBLIC_CATEGORIES_LOADING_CONFIG,
} from "@/config/public-categories";

import styles from "@/components/public/categories/public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CATÉGORIE PUBLIQUE — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/categories/[slug]/loading.tsx
 *
 * Route :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que Next.js attend :
 *
 * - la vraie ProductCategory ;
 * - les vrais Product ;
 * - les vrais StoreProduct disponibles ;
 * - les vrais prix ;
 * - les vrais stocks ;
 * - les vraies images ;
 * - les vraies boutiques.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier n'affiche aucune donnée métier fictive.
 *
 * Aucun :
 *
 * - faux nom de catégorie ;
 * - faux produit ;
 * - faux prix ;
 * - faux stock ;
 * - faux compteur ;
 * - faux nom de boutique ;
 * - faux visuel produit.
 *
 * ============================================================================
 *
 * Le responsive est entièrement contrôlé dans :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const LOADING_CONFIG =
  PUBLIC_CATEGORIES_LOADING_CONFIG;


/* ==========================================================================
   2. QUANTITÉ DE SKELETONS
   ========================================================================== */

/**
 * On rend suffisamment de blocs pour remplir correctement la première zone
 * visible sur desktop.
 *
 * Le CSS décide ensuite du nombre réel de colonnes :
 *
 * Desktop :
 * 5 colonnes
 *
 * Tablette :
 * 3 colonnes
 *
 * Mobile :
 * 2 colonnes
 *
 * Ces blocs ne représentent aucun produit réel ou fictif.
 */
const SKELETON_COUNT =
  Math.max(
    LOADING_CONFIG.desktopSkeletonCount,
    LOADING_CONFIG.mobileSkeletonCount,
  );


/* ==========================================================================
   3. IDENTIFIANTS TECHNIQUES DES SKELETONS
   ========================================================================== */

/**
 * Ces identifiants servent uniquement de `key` React.
 *
 * Ils ne sont jamais affichés à l'utilisateur.
 */
const PRODUCT_SKELETON_IDS =
  Array.from(
    {
      length:
        SKELETON_COUNT,
    },
    (
      _,
      index,
    ) =>
      `category-product-loading-${index + 1}`,
  );


/* ==========================================================================
   4. STYLE ACCESSIBLE
   ========================================================================== */

/**
 * Texte destiné uniquement aux lecteurs d'écran.
 *
 * On ne dépend volontairement pas d'une classe globale `sr-only`
 * qui pourrait ne pas exister dans le projet.
 */
const VISUALLY_HIDDEN_STYLE = {
  position:
    "absolute",

  width:
    "1px",

  height:
    "1px",

  padding:
    0,

  margin:
    "-1px",

  overflow:
    "hidden",

  clip:
    "rect(0, 0, 0, 0)",

  whiteSpace:
    "nowrap",

  border:
    0,
} as const;


/* ==========================================================================
   5. SKELETON PRODUIT
   ========================================================================== */

/**
 * Structure volontairement générique.
 *
 * Elle suggère uniquement :
 *
 * - une zone image ;
 * - une ligne principale ;
 * - une ligne secondaire.
 *
 * Aucun texte ou montant de démonstration.
 */
function CategoryProductLoadingCard() {
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
          LIGNE PRINCIPALE
          ================================================================= */}

      <div
        className={
          styles.categoriesLoadingLine
        }
      />


      {/* =================================================================
          LIGNE SECONDAIRE
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
   6. BREADCRUMB SKELETON
   ========================================================================== */

/**
 * Le vrai breadcrumb sera affiché par :
 *
 * PublicCategoryProductsPage.tsx
 *
 * Ici on garde seulement une petite zone neutre afin d'éviter
 * un changement brutal de mise en page.
 */
function CategoryProductsBreadcrumbLoading() {
  return (
    <div
      className={
        styles.categoriesHeroBreadcrumbContainer
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.categoriesLoadingLineShort
        }
        style={{
          width:
            "120px",

          margin:
            0,
        }}
      />
    </div>
  );
}


/* ==========================================================================
   7. HEADER SKELETON
   ========================================================================== */

function CategoryProductsHeaderLoading() {
  return (
    <div
      className={
        styles.categoryProductsHeader
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.categoryProductsHeading
        }
        style={{
          width:
            "100%",
        }}
      >
        {/* ===============================================================
            TITRE
            =============================================================== */}

        <div
          className={
            styles.categoriesLoadingLine
          }
          style={{
            width:
              "min(280px, 60%)",

            height:
              "22px",

            margin:
              0,
          }}
        />


        {/* ===============================================================
            DESCRIPTION
            =============================================================== */}

        <div
          className={
            styles.categoriesLoadingLineShort
          }
          style={{
            width:
              "min(430px, 78%)",

            margin:
              "9px 0 0",
          }}
        />
      </div>


      {/* =================================================================
          COMPTEUR
          ================================================================= */}

      <div
        className={
          styles.categoriesLoadingLineShort
        }
        style={{
          flex:
            "0 0 auto",

          width:
            "62px",

          margin:
            0,
        }}
      />
    </div>
  );
}


/* ==========================================================================
   8. GRILLE SKELETON
   ========================================================================== */

function CategoryProductsGridLoading() {
  return (
    <div
      className={
        styles.categoriesLoadingGrid
      }
      aria-hidden="true"
    >
      {PRODUCT_SKELETON_IDS.map(
        (
          skeletonId,
        ) => (
          <CategoryProductLoadingCard
            key={
              skeletonId
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   9. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoryProductsLoading() {
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

      <p
        style={
          VISUALLY_HIDDEN_STYLE
        }
      >
        Chargement des produits de la catégorie
      </p>


      {/* ==================================================================
          BREADCRUMB
          ================================================================== */}

      <CategoryProductsBreadcrumbLoading />


      {/* ==================================================================
          ENTÊTE DE CATÉGORIE
          ================================================================== */}

      <CategoryProductsHeaderLoading />


      {/* ==================================================================
          PRODUITS
          ================================================================== */}

      <CategoryProductsGridLoading />
    </div>
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
 * PENDANT LE CHARGEMENT :
 *
 * Header public :
 *
 * déjà fourni par :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * CONTENU :
 *
 * breadcrumb skeleton
 *      ↓
 * titre skeleton
 *      ↓
 * description skeleton
 *      ↓
 * compteur skeleton
 *      ↓
 * grille de produits skeleton
 *
 * ============================================================================
 *
 * FOOTER :
 *
 * Desktop :
 *
 * visible.
 *
 * Mobile :
 *
 * masqué grâce à :
 *
 * data-public-categories-page="true"
 *
 * ============================================================================
 *
 * BOTTOM NAVIGATION :
 *
 * reste fournie par :
 *
 * src/components/public/PublicMobileBottomNav.tsx
 *
 * Elle n'est jamais recréée ici.
 *
 * ============================================================================
 *
 * RESPONSIVE :
 *
 * Desktop :
 *
 * 5 cartes par ligne.
 *
 * Tablette :
 *
 * 3 cartes par ligne.
 *
 * Mobile :
 *
 * 2 cartes par ligne.
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - catégorie fictive ;
 * - donnée produit fictive ;
 * - faux prix ;
 * - faux stock ;
 * - faux compteur ;
 * - fausse route ;
 * - dépendance client React.
 *
 * ============================================================================
 */