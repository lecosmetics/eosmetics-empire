import Link from "next/link";

import {
  RotateCcw,
  SearchX,
  ShoppingCart,
} from "lucide-react";

import type {
  ManagerOrdersFilters,
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
 * src/components/gestionnaire/orders/OrdersEmptyState.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Afficher un état vide propre lorsque :
 *
 * 1. aucune commande n'existe dans l'espace courant ;
 *
 * ou
 *
 * 2. aucune commande ne correspond aux filtres appliqués.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - n'invente aucune commande ;
 * - ne crée aucune commande ;
 * - ne modifie aucune commande ;
 * - ne crée aucune route supplémentaire ;
 * - ne crée aucune fonctionnalité non demandée.
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

export interface OrdersEmptyStateProps {
  readonly filters:
    ManagerOrdersFilters;
}


/* ==========================================================================
   FILTRES ACTIFS
   ========================================================================== */

/**
 * La pagination n'est volontairement pas considérée comme un filtre.
 *
 * order-query.ts ramène déjà la page demandée dans les limites réelles
 * lorsque cela est nécessaire.
 */

function hasActiveOrdersFilters(
  filters:
    ManagerOrdersFilters,
): boolean {
  return (
    filters.dateFrom.trim().length >
      0 ||
    filters.dateTo.trim().length >
      0 ||
    filters.q.trim().length >
      0 ||
    filters.tab !==
      "all" ||
    filters.status !==
      "all" ||
    filters.paymentMethod !==
      "all" ||
    filters.city.trim().length >
      0
  );
}


/* ==========================================================================
   AUCUNE COMMANDE
   ========================================================================== */

function NoOrdersAvailable() {
  return (
    <section
      className={
        styles.ordersEmptyState
      }
      aria-labelledby="orders-empty-title"
      aria-describedby="orders-empty-description"
    >
      {/* =================================================================
          ICÔNE
          ================================================================= */}

      <div
        className={
          styles.ordersEmptyIcon
        }
        aria-hidden="true"
      >
        <ShoppingCart
          size={30}
          strokeWidth={1.7}
        />
      </div>


      {/* =================================================================
          CONTENU
          ================================================================= */}

      <div
        className={
          styles.ordersEmptyContent
        }
      >
        <h2
          id="orders-empty-title"
          className={
            styles.ordersEmptyTitle
          }
        >
          Aucune commande pour le moment.
        </h2>


        <p
          id="orders-empty-description"
          className={
            styles.ordersEmptyDescription
          }
        >
          Vous retrouverez ici toutes les commandes reçues dans votre espace.
        </p>
      </div>
    </section>
  );
}


/* ==========================================================================
   AUCUN RÉSULTAT APRÈS FILTRE
   ========================================================================== */

function NoFilteredOrdersResult() {
  return (
    <section
      className={
        styles.ordersEmptyState
      }
      aria-labelledby="orders-no-result-title"
      aria-describedby="orders-no-result-description"
    >
      {/* =================================================================
          ICÔNE
          ================================================================= */}

      <div
        className={
          styles.ordersEmptyIcon
        }
        aria-hidden="true"
      >
        <SearchX
          size={30}
          strokeWidth={1.7}
        />
      </div>


      {/* =================================================================
          CONTENU
          ================================================================= */}

      <div
        className={
          styles.ordersEmptyContent
        }
      >
        <h2
          id="orders-no-result-title"
          className={
            styles.ordersEmptyTitle
          }
        >
          Aucune commande ne correspond à votre recherche.
        </h2>


        <p
          id="orders-no-result-description"
          className={
            styles.ordersEmptyDescription
          }
        >
          Modifiez votre recherche ou réinitialisez les filtres pour afficher les commandes disponibles.
        </p>


        {/* ===============================================================
            RÉINITIALISER
            =============================================================== */}

        <div
          className={
            styles.ordersEmptyActions
          }
        >
          <Link
            href={
              ORDERS_ROUTE
            }
            className={
              styles.ordersEmptyResetButton
            }
          >
            <RotateCcw
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              Réinitialiser les filtres
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function OrdersEmptyState({
  filters,
}: OrdersEmptyStateProps) {
  const hasFilters =
    hasActiveOrdersFilters(
      filters,
    );


  /*
   * Des filtres sont actifs mais aucune ligne n'a été trouvée.
   */

  if (
    hasFilters
  ) {
    return (
      <NoFilteredOrdersResult />
    );
  }


  /*
   * Aucun filtre n'est actif et aucune ligne n'existe.
   *
   * On affiche donc l'état réellement vide de l'espace Commandes.
   */

  return (
    <NoOrdersAvailable />
  );
}