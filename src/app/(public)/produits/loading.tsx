import styles from "@/components/public/products/public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * LOADING — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/produits/loading.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que :
 *
 * src/app/(public)/produits/page.tsx
 *
 * charge les vraies données du catalogue depuis PostgreSQL.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - reste un Server Component ;
 * - ne contient aucune donnée produit fictive ;
 * - n'affiche aucun faux prix ;
 * - n'affiche aucun faux stock ;
 * - n'affiche aucune fausse catégorie ;
 * - n'appelle pas Prisma ;
 * - ne lit pas PostgreSQL ;
 * - ne recrée pas le Header ;
 * - ne recrée pas le Footer ;
 * - ne recrée pas la navigation mobile ;
 * - ne dépend pas du Panier.
 *
 * ============================================================================
 */


/* ==========================================================================
   SKELETONS PRODUITS
   ========================================================================== */

/**
 * Il s'agit uniquement d'identifiants de rendu React.
 *
 * Ce ne sont pas des produits ni des données métier.
 */
const PUBLIC_PRODUCTS_LOADING_CARDS =
  [
    "loading-product-01",
    "loading-product-02",
    "loading-product-03",
    "loading-product-04",
    "loading-product-05",
    "loading-product-06",
    "loading-product-07",
    "loading-product-08",
    "loading-product-09",
    "loading-product-10",
  ] as const;


/* ==========================================================================
   COMPOSANT
   ========================================================================== */

export default function PublicProductsLoading() {
  return (
    <div
      className={
        styles.productsLoadingPage
      }
      data-public-products-page="true"
      data-public-products-loading="true"
      aria-busy="true"
      aria-label="Chargement des produits"
    >
      {/* ==================================================================
          HERO
          ================================================================== */}

      <div
        className={
          styles.productsLoadingHero
        }
        aria-hidden="true"
      />


      {/* ==================================================================
          CATALOGUE
          ================================================================== */}

      <div
        className={
          styles.productsLoadingCatalog
        }
      >
        <div
          className={
            styles.productsLoadingLayout
          }
        >
          {/* ==============================================================
              SIDEBAR DESKTOP
              ============================================================== */}

          <aside
            className={
              styles.productsLoadingSidebar
            }
            aria-hidden="true"
          />


          {/* ==============================================================
              CONTENU PRINCIPAL
              ============================================================== */}

          <div
            className={
              styles.productsLoadingMain
            }
          >
            {/* ============================================================
                TOOLBAR
                ============================================================ */}

            <div
              className={
                styles.productsLoadingToolbar
              }
              aria-hidden="true"
            />


            {/* ============================================================
                GRILLE
                ============================================================ */}

            <div
              className={
                styles.productsLoadingGrid
              }
              aria-hidden="true"
            >
              {PUBLIC_PRODUCTS_LOADING_CARDS.map(
                (
                  loadingCardId,
                ) => (
                  <div
                    key={
                      loadingCardId
                    }
                    className={
                      styles.productsLoadingCard
                    }
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}