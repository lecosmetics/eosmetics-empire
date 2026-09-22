"use client";

import {
  useEffect,
  useRef,
  useTransition,
} from "react";

import Link from "next/link";

import {
  CalendarDays,
  RotateCcw,
  Search,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  MANAGER_ORDER_STATUSES,
  MANAGER_PAYMENT_METHODS,
  getManagerOrderStatusLabel,
  getManagerPaymentMethodLabel,
  type ManagerOrdersFilterOptions,
  type ManagerOrdersFilters,
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
 * src/components/gestionnaire/orders/OrdersFilters.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Afficher et gérer les filtres de la liste des commandes :
 *
 * - période ;
 * - recherche ;
 * - statut commande ;
 * - mode de paiement ;
 * - ville ;
 * - réinitialisation.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - n'invente aucun statut ;
 * - n'invente aucun mode de paiement ;
 * - n'invente aucune ville ;
 * - utilise uniquement les données reçues du serveur ;
 * - remet toujours la pagination à la page 1.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE OFFICIELLE
   ========================================================================== */

const ORDERS_ROUTE =
  "/gestionnaire/commandes";


/* ==========================================================================
   RECHERCHE
   ========================================================================== */

const SEARCH_DEBOUNCE_MS =
  350;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface OrdersFiltersProps {
  readonly filters:
    ManagerOrdersFilters;

  readonly filterOptions:
    ManagerOrdersFilterOptions;
}


/* ==========================================================================
   LECTURE FORM DATA
   ========================================================================== */

function readFormString(
  formData:
    FormData,

  fieldName:
    string,
): string {
  const value =
    formData.get(
      fieldName,
    );


  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function OrdersFilters({
  filters,
  filterOptions,
}: OrdersFiltersProps) {
  const router =
    useRouter();


  const formRef =
    useRef<HTMLFormElement>(
      null,
    );


  const searchTimerRef =
    useRef<
      ReturnType<typeof setTimeout> |
      null
    >(
      null,
    );


  const [
    isPending,
    startTransition,
  ] =
    useTransition();


  /* =========================================================================
     NETTOYAGE TIMER
     ========================================================================= */

  useEffect(
    () => {
      return () => {
        if (
          searchTimerRef.current
        ) {
          clearTimeout(
            searchTimerRef.current,
          );
        }
      };
    },
    [],
  );


  /* =========================================================================
     CONSTRUCTION DE L'URL
     ========================================================================= */

  function buildFiltersHref(
    clearTab:
      boolean,
  ): string {
    const form =
      formRef.current;


    if (
      !form
    ) {
      return ORDERS_ROUTE;
    }


    const formData =
      new FormData(
        form,
      );


    const dateFrom =
      readFormString(
        formData,
        "dateFrom",
      );


    const dateTo =
      readFormString(
        formData,
        "dateTo",
      );


    const search =
      readFormString(
        formData,
        "q",
      );


    const status =
      readFormString(
        formData,
        "status",
      );


    const paymentMethod =
      readFormString(
        formData,
        "paymentMethod",
      );


    const city =
      readFormString(
        formData,
        "city",
      );


    const params =
      new URLSearchParams();


    /* ----------------------------------------------------------------------
       PÉRIODE
       ---------------------------------------------------------------------- */

    if (
      dateFrom
    ) {
      params.set(
        "dateFrom",
        dateFrom,
      );
    }


    if (
      dateTo
    ) {
      params.set(
        "dateTo",
        dateTo,
      );
    }


    /* ----------------------------------------------------------------------
       RECHERCHE
       ---------------------------------------------------------------------- */

    if (
      search
    ) {
      params.set(
        "q",
        search,
      );
    }


    /* ----------------------------------------------------------------------
       STATUT
       ---------------------------------------------------------------------- */

    if (
      status &&
      status !==
        "all"
    ) {
      params.set(
        "status",
        status,
      );
    }


    /* ----------------------------------------------------------------------
       PAIEMENT
       ---------------------------------------------------------------------- */

    if (
      paymentMethod &&
      paymentMethod !==
        "all"
    ) {
      params.set(
        "paymentMethod",
        paymentMethod,
      );
    }


    /* ----------------------------------------------------------------------
       VILLE
       ---------------------------------------------------------------------- */

    if (
      city
    ) {
      params.set(
        "city",
        city,
      );
    }


    /* ----------------------------------------------------------------------
       ONGLET
       ----------------------------------------------------------------------
       Un changement classique de filtre conserve l'onglet actif.

       En revanche, lorsqu'un statut précis est choisi, l'onglet est retiré
       afin d'éviter des filtres contradictoires.

       Exemple à éviter :

       tab=delivered
       +
       status=PENDING
       ---------------------------------------------------------------------- */

    if (
      !clearTab &&
      filters.tab !==
        "all"
    ) {
      params.set(
        "tab",
        filters.tab,
      );
    }


    /*
     * Aucun paramètre "page" n'est ajouté.
     *
     * Toute modification d'un filtre revient donc naturellement
     * à la première page.
     */


    const query =
      params.toString();


    return query
      ? `${ORDERS_ROUTE}?${query}`
      : ORDERS_ROUTE;
  }


  /* =========================================================================
     NAVIGATION
     ========================================================================= */

  function applyFilters(
    clearTab:
      boolean = false,
  ): void {
    const href =
      buildFiltersHref(
        clearTab,
      );


    startTransition(
      () => {
        router.replace(
          href,
          {
            scroll:
              false,
          },
        );
      },
    );
  }


  /* =========================================================================
     RECHERCHE AVEC DEBOUNCE
     ========================================================================= */

  function handleSearchChange(): void {
    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current,
      );
    }


    searchTimerRef.current =
      setTimeout(
        () => {
          searchTimerRef.current =
            null;


          applyFilters(
            false,
          );
        },
        SEARCH_DEBOUNCE_MS,
      );
  }


  /* =========================================================================
     CHANGEMENT DE FILTRE CLASSIQUE
     ========================================================================= */

  function handleFilterChange(): void {
    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current,
      );

      searchTimerRef.current =
        null;
    }


    applyFilters(
      false,
    );
  }


  /* =========================================================================
     CHANGEMENT DE STATUT
     ========================================================================= */

  function handleStatusChange(): void {
    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current,
      );

      searchTimerRef.current =
        null;
    }


    /*
     * Le filtre précis de statut remplace l'onglet de statut actif.
     */

    applyFilters(
      true,
    );
  }


  /* =========================================================================
     SUBMIT CLAVIER
     ========================================================================= */

  function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();


    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current,
      );

      searchTimerRef.current =
        null;
    }


    applyFilters(
      false,
    );
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <form
      ref={
        formRef
      }
      className={
        styles.ordersFilters
      }
      onSubmit={
        handleSubmit
      }
      role="search"
      aria-label="Filtrer les commandes"
      aria-busy={
        isPending
      }
    >
      {/* ===================================================================
          PÉRIODE
          =================================================================== */}

      <div
        className={
          styles.ordersDateRange
        }
      >
        <CalendarDays
          size={18}
          strokeWidth={1.8}
          className={
            styles.ordersDateIcon
          }
          aria-hidden="true"
        />


        <label
          htmlFor="orders-date-from"
          className={
            styles.ordersVisuallyHidden
          }
        >
          Date de début
        </label>


        <input
          key={`date-from-${filters.dateFrom}`}
          id="orders-date-from"
          type="date"
          name="dateFrom"
          defaultValue={
            filters.dateFrom
          }
          className={
            styles.ordersDateInput
          }
          onChange={
            handleFilterChange
          }
        />


        <span
          className={
            styles.ordersDateSeparator
          }
          aria-hidden="true"
        >
          –
        </span>


        <label
          htmlFor="orders-date-to"
          className={
            styles.ordersVisuallyHidden
          }
        >
          Date de fin
        </label>


        <input
          key={`date-to-${filters.dateTo}`}
          id="orders-date-to"
          type="date"
          name="dateTo"
          defaultValue={
            filters.dateTo
          }
          className={
            styles.ordersDateInput
          }
          onChange={
            handleFilterChange
          }
        />
      </div>


      {/* ===================================================================
          RECHERCHE
          =================================================================== */}

      <div
        className={
          styles.ordersSearchField
        }
      >
        <Search
          size={18}
          strokeWidth={1.8}
          className={
            styles.ordersSearchIcon
          }
          aria-hidden="true"
        />


        <label
          htmlFor="orders-search"
          className={
            styles.ordersVisuallyHidden
          }
        >
          Rechercher une commande ou une cliente
        </label>


        <input
          key={`search-${filters.q}`}
          id="orders-search"
          type="search"
          name="q"
          defaultValue={
            filters.q
          }
          placeholder="Rechercher une commande, un client..."
          autoComplete="off"
          spellCheck={false}
          className={
            styles.ordersSearchInput
          }
          onChange={
            handleSearchChange
          }
        />
      </div>


      {/* ===================================================================
          STATUT COMMANDE
          =================================================================== */}

      <div
        className={
          styles.ordersFilterField
        }
      >
        <label
          htmlFor="orders-status"
          className={
            styles.ordersVisuallyHidden
          }
        >
          Filtrer par statut
        </label>


        <select
          key={`status-${filters.status}`}
          id="orders-status"
          name="status"
          defaultValue={
            filters.status
          }
          className={
            styles.ordersFilterSelect
          }
          onChange={
            handleStatusChange
          }
        >
          <option value="all">
            Tous les statuts
          </option>


          {MANAGER_ORDER_STATUSES.map(
            (
              status,
            ) => (
              <option
                key={
                  status
                }
                value={
                  status
                }
              >
                {getManagerOrderStatusLabel(
                  status,
                )}
              </option>
            ),
          )}
        </select>
      </div>


      {/* ===================================================================
          MODE DE PAIEMENT
          =================================================================== */}

      <div
        className={
          styles.ordersFilterField
        }
      >
        <label
          htmlFor="orders-payment-method"
          className={
            styles.ordersVisuallyHidden
          }
        >
          Filtrer par mode de paiement
        </label>


        <select
          key={`payment-${filters.paymentMethod}`}
          id="orders-payment-method"
          name="paymentMethod"
          defaultValue={
            filters.paymentMethod
          }
          className={
            styles.ordersFilterSelect
          }
          onChange={
            handleFilterChange
          }
        >
          <option value="all">
            Tous les modes de paiement
          </option>


          {MANAGER_PAYMENT_METHODS.map(
            (
              method,
            ) => (
              <option
                key={
                  method
                }
                value={
                  method
                }
              >
                {getManagerPaymentMethodLabel(
                  method,
                )}
              </option>
            ),
          )}
        </select>
      </div>


      {/* ===================================================================
          VILLE
          =================================================================== */}

      <div
        className={
          styles.ordersFilterField
        }
      >
        <label
          htmlFor="orders-city"
          className={
            styles.ordersVisuallyHidden
          }
        >
          Filtrer par ville
        </label>


        <select
          key={`city-${filters.city}`}
          id="orders-city"
          name="city"
          defaultValue={
            filters.city
          }
          className={
            styles.ordersFilterSelect
          }
          onChange={
            handleFilterChange
          }
        >
          <option value="">
            Toutes les villes
          </option>


          {filterOptions.cities.map(
            (
              city,
            ) => (
              <option
                key={
                  city
                }
                value={
                  city
                }
              >
                {city}
              </option>
            ),
          )}
        </select>
      </div>


      {/* ===================================================================
          RÉINITIALISER
          =================================================================== */}

      <Link
        href={
          ORDERS_ROUTE
        }
        className={
          styles.ordersFiltersReset
        }
        aria-label="Réinitialiser tous les filtres"
      >
        <RotateCcw
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span>
          Réinitialiser
        </span>
      </Link>


      {/* ===================================================================
          SUBMIT ACCESSIBLE
          ===================================================================
          La maquette ne demande pas un bouton "Appliquer".

          Le formulaire se met à jour automatiquement.

          Ce bouton invisible permet néanmoins de valider la recherche
          avec Entrée au clavier.
          =================================================================== */}

      <button
        type="submit"
        className={
          styles.ordersVisuallyHidden
        }
        tabIndex={-1}
        aria-hidden="true"
      >
        Appliquer les filtres
      </button>
    </form>
  );
}