import styles from "./clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/clients/loading.tsx
 *
 * Route :
 *
 * /gestionnaire/clients
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que :
 *
 * - l'accès Gestionnaire est vérifié ;
 * - les KPI sont calculés ;
 * - les villes réelles sont récupérées ;
 * - les filtres sont appliqués ;
 * - les clients sont récupérés ;
 * - la pagination est calculée.
 *
 * IMPORTANT :
 *
 * - aucun spinner géant ;
 * - aucune fausse donnée ;
 * - aucun faux nom ;
 * - aucun faux montant ;
 * - aucune fausse commande ;
 * - aucun nouveau shell ;
 * - aucune nouvelle sidebar ;
 * - aucun nouveau header global ;
 * - aucun <main> imbriqué ;
 * - pleine largeur dans le Main Gestionnaire existant.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONFIGURATION SKELETON
   ========================================================================== */

const KPI_SKELETON_COUNT =
  4;


const FILTER_SKELETON_COUNT =
  5;


/**
 * La page utilise une pagination de 10 clients.
 *
 * Le skeleton reprend donc 10 lignes pour éviter un changement brutal
 * de hauteur lorsque les données arrivent.
 */

const TABLE_SKELETON_ROWS =
  10;


/* ==========================================================================
   UTILITAIRE
   ========================================================================== */

function createSkeletonItems(
  count:
    number,
): readonly number[] {
  return Array.from(
    {
      length:
        count,
    },
    (
      _value,
      index,
    ) =>
      index,
  );
}


/* ==========================================================================
   PAGE LOADING
   ========================================================================== */

export default function ClientsLoading() {
  return (
    <div
      className={
        styles.clientsPage
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={
          styles.clientsContent
        }
      >
        {/* ================================================================
            TEXTE ACCESSIBLE
            ================================================================ */}

        <span
          className={
            styles.clientsVisuallyHidden
          }
        >
          Chargement des clients.
        </span>


        {/* ================================================================
            HEADER
            ================================================================ */}

        <section
          aria-hidden="true"
        >
          <div
            className={
              styles.clientsLoadingHeader
            }
          />
        </section>


        {/* ================================================================
            KPI
            ================================================================ */}

        <section
          className={
            styles.clientsLoadingKpiGrid
          }
          aria-hidden="true"
        >
          {createSkeletonItems(
            KPI_SKELETON_COUNT,
          ).map(
            (
              item,
            ) => (
              <div
                key={
                  `client-kpi-skeleton-${item}`
                }
                className={
                  styles.clientsLoadingKpi
                }
              />
            ),
          )}
        </section>


        {/* ================================================================
            FILTRES
            ================================================================ */}

        <section
          className={
            styles.clientsLoadingFilters
          }
          aria-hidden="true"
        >
          {createSkeletonItems(
            FILTER_SKELETON_COUNT,
          ).map(
            (
              item,
            ) => (
              <div
                key={
                  `client-filter-skeleton-${item}`
                }
                className={
                  styles.clientsLoadingFilter
                }
              />
            ),
          )}
        </section>


        {/* ================================================================
            TABLEAU
            ================================================================ */}

        <section
          className={
            styles.clientsLoadingTable
          }
          aria-hidden="true"
        >
          {createSkeletonItems(
            TABLE_SKELETON_ROWS,
          ).map(
            (
              item,
            ) => (
              <div
                key={
                  `client-row-skeleton-${item}`
                }
                className={
                  styles.clientsLoadingRow
                }
              />
            ),
          )}
        </section>
      </div>
    </div>
  );
}