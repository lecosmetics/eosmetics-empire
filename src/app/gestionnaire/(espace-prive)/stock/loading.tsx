import styles from "./stock.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/stock/loading.tsx
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que :
 *
 * - la session Gestionnaire est vérifiée ;
 * - les KPI sont chargés ;
 * - les catégories sont chargées ;
 * - les stocks réels sont récupérés ;
 * - la pagination est calculée.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - n'effectue aucune requête ;
 * - ne contient aucune donnée fictive ;
 * - n'affiche aucun faux chiffre ;
 * - n'affiche aucun faux produit ;
 * - ne contient aucun spinner bloquant ;
 * - ne recrée ni Sidebar ni Header global ;
 * - utilise toute la largeur disponible ;
 * - respecte PC et mobile.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const KPI_SKELETON_COUNT =
  4;


const TABLE_SKELETON_ROW_COUNT =
  7;


/* ==========================================================================
   KPI SKELETONS
   ========================================================================== */

function StockKpiSkeletons() {
  return (
    <div
      className={
        styles.stockLoadingKpis
      }
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            KPI_SKELETON_COUNT,
        },
        (
          _value,
          index,
        ) => (
          <div
            key={
              `stock-loading-kpi-${index}`
            }
            className={
              styles.stockLoadingKpi
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   TABLE SKELETONS
   ========================================================================== */

function StockTableSkeletons() {
  return (
    <div
      className={
        styles.stockLoadingTable
      }
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            TABLE_SKELETON_ROW_COUNT,
        },
        (
          _value,
          index,
        ) => (
          <div
            key={
              `stock-loading-row-${index}`
            }
            className={
              styles.stockLoadingRow
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StockLoading() {
  return (
    <div
      className={
        styles.stockPage
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={
          styles.stockLoading
        }
      >
        {/* =================================================================
            TEXTE ACCESSIBLE
            ================================================================= */}

        <span
          className={
            styles.stockVisuallyHidden
          }
        >
          Chargement des stocks…
        </span>


        {/* =================================================================
            HEADER
            ================================================================= */}

        <div
          className={
            styles.stockLoadingHeader
          }
          aria-hidden="true"
        />


        {/* =================================================================
            KPI
            ================================================================= */}

        <StockKpiSkeletons />


        {/* =================================================================
            FILTRES
            ================================================================= */}

        <div
          className={
            styles.stockLoadingFilters
          }
          aria-hidden="true"
        />


        {/* =================================================================
            TABLEAU / LISTE
            ================================================================= */}

        <StockTableSkeletons />
      </div>
    </div>
  );
}