import styles from "./categories.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/categories/loading.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher un état de chargement simple et professionnel pendant que :
 *
 * - la session Gestionnaire est vérifiée ;
 * - les catégories sont chargées ;
 * - les KPI sont calculés ;
 * - les nombres de produits de la boutique sont calculés.
 *
 * IMPORTANT :
 *
 * Ce fichier ne doit pas :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - afficher de fausses données ;
 * - afficher de faux nombres ;
 * - afficher de faux noms de catégories ;
 * - recréer le GestionnaireShell ;
 * - recréer la sidebar ;
 * - recréer le header global ;
 * - utiliser un gros spinner ;
 * - ajouter de bouton inutile.
 *
 * Le skeleton reprend simplement la structure générale de la page :
 *
 * 1. en-tête ;
 * 2. trois KPI ;
 * 3. grande carte de liste ;
 * 4. plusieurs lignes de chargement.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

/**
 * Quelques lignes suffisent pour représenter visuellement le tableau.
 *
 * Il ne s'agit pas de fausses catégories.
 *
 * Ces éléments sont uniquement des blocs de skeleton.
 */

const SKELETON_ROWS =
  [
    "category-loading-row-1",
    "category-loading-row-2",
    "category-loading-row-3",
    "category-loading-row-4",
    "category-loading-row-5",
    "category-loading-row-6",
  ] as const;


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function CategoriesLoading() {
  return (
    <div
      className={
        styles.categoriesPage
      }
      aria-busy="true"
      aria-label="Chargement des catégories"
    >
      <main
        className={
          styles.categoriesMain
        }
      >
        <div
          className={
            styles.categoriesLoading
          }
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* ===============================================================
              HEADER PAGE
              =============================================================== */}

          <div
            className={
              styles.categoriesLoadingHeader
            }
            aria-hidden="true"
          />


          {/* ===============================================================
              KPI
              =============================================================== */}

          <div
            className={
              styles.categoriesLoadingKpis
            }
            aria-hidden="true"
          >
            <div
              className={
                styles.categoriesLoadingKpi
              }
            />

            <div
              className={
                styles.categoriesLoadingKpi
              }
            />

            <div
              className={
                styles.categoriesLoadingKpi
              }
            />
          </div>


          {/* ===============================================================
              LISTE / TABLEAU
              =============================================================== */}

          <div
            className={
              styles.categoriesLoadingList
            }
            aria-hidden="true"
          >
            {SKELETON_ROWS.map(
              (
                row,
              ) => (
                <div
                  key={
                    row
                  }
                  className={
                    styles.categoriesLoadingRow
                  }
                />
              ),
            )}
          </div>


          <span
            className={
              styles.categoriesTableCaption
            }
          >
            Chargement des catégories…
          </span>
        </div>
      </main>
    </div>
  );
}