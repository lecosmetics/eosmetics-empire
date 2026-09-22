import Link from "next/link";

import {
  MANAGER_ORDERS_TABS,
  getManagerOrdersTabLabel,
  type ManagerOrdersFilters,
  type ManagerOrdersTab,
  type ManagerOrdersTabCounts,
} from "@/lib/gestionnaire/orders/order-types";

import styles from "@/app/gestionnaire/(espace-prive)/commandes/commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/orders/OrdersStatusTabs.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Afficher les onglets de statut de la liste des commandes :
 *
 * - Toutes ;
 * - En attente ;
 * - Confirmées ;
 * - À préparer ;
 * - Expédiées ;
 * - Livrées ;
 * - Annulées.
 *
 * Chaque onglet affiche son compteur réel.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne contient aucun compteur fictif ;
 * - ne calcule aucun statut métier ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - utilise uniquement les données préparées par order-query.ts ;
 * - remet la pagination à la première page lors d'un changement d'onglet.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE OFFICIELLE
   ========================================================================== */

const ORDERS_ROUTE =
  "/gestionnaire/commandes";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface OrdersStatusTabsProps {
  readonly activeTab:
    ManagerOrdersTab;

  readonly counts:
    ManagerOrdersTabCounts;

  readonly filters:
    ManagerOrdersFilters;
}


/* ==========================================================================
   FORMAT COMPTEURS
   ========================================================================== */

const COUNT_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function formatCount(
  value:
    number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "0";
  }


  return COUNT_FORMATTER.format(
    Math.max(
      0,
      Math.trunc(
        value,
      ),
    ),
  );
}


/* ==========================================================================
   COMPTEUR D'UN ONGLET
   ========================================================================== */

function getTabCount(
  tab:
    ManagerOrdersTab,

  counts:
    ManagerOrdersTabCounts,
): number {
  switch (
    tab
  ) {
    case "all":
      return counts.all;

    case "pending":
      return counts.pending;

    case "confirmed":
      return counts.confirmed;

    case "preparing":
      return counts.preparing;

    case "shipped":
      return counts.shipped;

    case "delivered":
      return counts.delivered;

    case "cancelled":
      return counts.cancelled;
  }
}


/* ==========================================================================
   URL D'UN ONGLET
   ========================================================================== */

/**
 * Lors d'un changement d'onglet :
 *
 * On conserve :
 *
 * - période ;
 * - recherche ;
 * - mode de paiement ;
 * - ville.
 *
 * On retire :
 *
 * - page ;
 * - status.
 *
 * Pourquoi retirer status ?
 *
 * Parce que l'onglet représente déjà un filtre de statut.
 *
 * Exemple :
 *
 * si le filtre précis était PENDING et que l'utilisateur clique sur
 * "Livrées", conserver PENDING produirait :
 *
 * PENDING + DELIVERED
 *
 * donc aucun résultat.
 *
 * Le clic sur un onglet doit réellement afficher le groupe demandé.
 */

function buildOrdersTabHref(
  tab:
    ManagerOrdersTab,

  filters:
    ManagerOrdersFilters,
): string {
  const params =
    new URLSearchParams();


  /* ------------------------------------------------------------------------
     PÉRIODE
     ------------------------------------------------------------------------ */

  if (
    filters.dateFrom
  ) {
    params.set(
      "dateFrom",
      filters.dateFrom,
    );
  }


  if (
    filters.dateTo
  ) {
    params.set(
      "dateTo",
      filters.dateTo,
    );
  }


  /* ------------------------------------------------------------------------
     RECHERCHE
     ------------------------------------------------------------------------ */

  const search =
    filters.q.trim();


  if (
    search
  ) {
    params.set(
      "q",
      search,
    );
  }


  /* ------------------------------------------------------------------------
     MODE DE PAIEMENT
     ------------------------------------------------------------------------ */

  if (
    filters.paymentMethod !==
    "all"
  ) {
    params.set(
      "paymentMethod",
      filters.paymentMethod,
    );
  }


  /* ------------------------------------------------------------------------
     VILLE
     ------------------------------------------------------------------------ */

  const city =
    filters.city.trim();


  if (
    city
  ) {
    params.set(
      "city",
      city,
    );
  }


  /* ------------------------------------------------------------------------
     ONGLET
     ------------------------------------------------------------------------ */

  if (
    tab !==
    "all"
  ) {
    params.set(
      "tab",
      tab,
    );
  }


  /*
   * Pas de :
   *
   * page
   *
   * Le changement d'onglet repart toujours à la première page.
   *
   * Pas de :
   *
   * status
   *
   * afin de ne pas créer une intersection contradictoire avec l'onglet.
   */


  const query =
    params.toString();


  return query
    ? `${ORDERS_ROUTE}?${query}`
    : ORDERS_ROUTE;
}


/* ==========================================================================
   ONGLET
   ========================================================================== */

interface OrdersStatusTabProps {
  readonly tab:
    ManagerOrdersTab;

  readonly count:
    number;

  readonly active:
    boolean;

  readonly href:
    string;
}


function OrdersStatusTab({
  tab,
  count,
  active,
  href,
}: OrdersStatusTabProps) {
  const label =
    getManagerOrdersTabLabel(
      tab,
    );


  return (
    <Link
      href={
        href
      }
      className={[
        styles.ordersStatusTab,
        active
          ? styles.ordersStatusTabActive
          : "",
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      aria-current={
        active
          ? "page"
          : undefined
      }
    >
      <span
        className={
          styles.ordersStatusTabLabel
        }
      >
        {label}
      </span>


      <span
        className={[
          styles.ordersStatusTabCount,
          active
            ? styles.ordersStatusTabCountActive
            : "",
        ]
          .filter(
            Boolean,
          )
          .join(
            " ",
          )}
        aria-label={`${formatCount(
          count,
        )} ${
          count >
          1
            ? "commandes"
            : "commande"
        }`}
      >
        {formatCount(
          count,
        )}
      </span>
    </Link>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function OrdersStatusTabs({
  activeTab,
  counts,
  filters,
}: OrdersStatusTabsProps) {
  return (
    <section
      className={
        styles.ordersStatusTabsSection
      }
      aria-label="Filtrer les commandes par statut"
    >
      <div
        className={
          styles.ordersStatusTabsScroll
        }
      >
        <nav
          className={
            styles.ordersStatusTabs
          }
          aria-label="Statuts des commandes"
        >
          {MANAGER_ORDERS_TABS.map(
            (
              tab,
            ) => {
              const active =
                tab ===
                activeTab;


              const count =
                getTabCount(
                  tab,
                  counts,
                );


              return (
                <OrdersStatusTab
                  key={
                    tab
                  }
                  tab={
                    tab
                  }
                  count={
                    count
                  }
                  active={
                    active
                  }
                  href={
                    buildOrdersTabHref(
                      tab,
                      filters,
                    )
                  }
                />
              );
            },
          )}
        </nav>
      </div>
    </section>
  );
}