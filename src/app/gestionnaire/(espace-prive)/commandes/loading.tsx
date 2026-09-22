import styles from "./commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/commandes/loading.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Afficher un état de chargement visuel pendant que la page serveur récupère :
 *
 * - les KPI ;
 * - les compteurs des onglets ;
 * - les filtres ;
 * - les commandes ;
 * - la pagination.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête ;
 * - ne lit aucune session ;
 * - ne contient aucune donnée fictive ;
 * - n'affiche aucun faux montant ;
 * - n'affiche aucun faux nombre de commandes ;
 * - n'affiche aucun faux client ;
 * - ne recrée pas le shell Gestionnaire ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas de <main> imbriqué ;
 * - prend toute la largeur disponible.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

/**
 * 5 cartes KPI réelles dans la page finale :
 *
 * - Total commandes
 * - Chiffre d'affaires
 * - En cours de traitement
 * - Livrées
 * - Annulées
 */

const KPI_SKELETON_COUNT =
  5;


/**
 * Quelques lignes neutres uniquement pour représenter la structure du tableau.
 *
 * Ce ne sont pas de fausses commandes :
 * aucun texte ni aucune valeur métier n'est affiché.
 */

const TABLE_SKELETON_ROW_COUNT =
  8;


/* ==========================================================================
   KPI SKELETON
   ========================================================================== */

function OrdersKpiSkeleton() {
  return (
    <div
      className={
        styles.ordersLoadingKpis
      }
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            KPI_SKELETON_COUNT,
        },
        (
          _item,
          index,
        ) => (
          <div
            key={
              index
            }
            className={
              styles.ordersLoadingKpi
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   TABLE SKELETON
   ========================================================================== */

function OrdersTableSkeleton() {
  return (
    <div
      className={
        styles.ordersLoadingTable
      }
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            TABLE_SKELETON_ROW_COUNT,
        },
        (
          _item,
          index,
        ) => (
          <div
            key={
              index
            }
            className={
              styles.ordersLoadingRow
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

export default function ManagerOrdersLoading() {
  return (
    <div
      className={
        styles.ordersPage
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={
          styles.ordersLoading
        }
      >
        {/* ===============================================================
            TEXTE ACCESSIBLE
            =============================================================== */}

        <span
          className={
            styles.ordersVisuallyHidden
          }
        >
          Chargement des commandes…
        </span>


        {/* ===============================================================
            HEADER PAGE
            =============================================================== */}

        <div
          className={
            styles.ordersLoadingHeader
          }
          aria-hidden="true"
        />


        {/* ===============================================================
            KPI
            =============================================================== */}

        <OrdersKpiSkeleton />


        {/* ===============================================================
            ONGLETS
            =============================================================== */}

        <div
          className={
            styles.ordersLoadingTabs
          }
          aria-hidden="true"
        />


        {/* ===============================================================
            FILTRES
            =============================================================== */}

        <div
          className={
            styles.ordersLoadingFilters
          }
          aria-hidden="true"
        />


        {/* ===============================================================
            TABLEAU
            =============================================================== */}

        <OrdersTableSkeleton />
      </div>
    </div>
  );
}