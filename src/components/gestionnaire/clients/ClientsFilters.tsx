"use client";

import {
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";

import Link from "next/link";

import {
  ArrowUpDown,
  MapPin,
  RotateCcw,
  Search,
  UserRoundCheck,
} from "lucide-react";

import {
  MANAGER_CLIENT_SORTS,
  MANAGER_CUSTOMER_STATUSES,
  getManagerClientsSortLabel,
  getManagerCustomerStatusLabel,
  type ManagerClientsFilterOptions,
  type ManagerClientsFilters,
} from "@/lib/gestionnaire/clients/client-types";

import styles from "@/app/gestionnaire/(espace-prive)/clients/clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — FILTRES CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/clients/ClientsFilters.tsx
 *
 * Route :
 *
 * /gestionnaire/clients
 *
 * RÔLE :
 *
 * Permettre au Gestionnaire de filtrer les vrais clients visibles dans
 * son périmètre avec uniquement :
 *
 * - recherche ;
 * - ville ;
 * - statut ;
 * - tri par dernière commande ;
 * - réinitialisation.
 *
 * IMPORTANT :
 *
 * - aucune donnée fictive ;
 * - aucune requête Prisma côté navigateur ;
 * - aucune liste de villes codée en dur ;
 * - aucun storeId dans l'URL ;
 * - aucun managerId dans l'URL ;
 * - aucun filtre CRM supplémentaire ;
 * - aucun statut inventé ;
 * - aucun traitement des données métier côté client.
 *
 * Les query params ne servent qu'à représenter l'état des filtres.
 *
 * La sécurité et le scoping sont exclusivement appliqués côté serveur
 * dans client-query.ts.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const CLIENTS_ROUTE =
  "/gestionnaire/clients";


/* ==========================================================================
   DEBOUNCE
   ========================================================================== */

const SEARCH_DEBOUNCE_MS =
  350;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ClientsFiltersProps {
  readonly filters:
    ManagerClientsFilters;

  readonly filterOptions:
    ManagerClientsFilterOptions;
}


/* ==========================================================================
   CONSTRUCTION URL
   ========================================================================== */

/**
 * Construit uniquement les query params utiles.
 *
 * Les valeurs par défaut sont volontairement omises afin de garder
 * des URL propres.
 *
 * page n'est jamais conservé lorsqu'un filtre change :
 *
 * toute nouvelle recherche repart automatiquement à la page 1.
 */

function buildClientsFiltersHref(
  form:
    HTMLFormElement,
): string {
  const formData =
    new FormData(
      form,
    );


  const params =
    new URLSearchParams();


  const q =
    String(
      formData.get(
        "q",
      ) ?? "",
    ).trim();


  const city =
    String(
      formData.get(
        "city",
      ) ?? "",
    ).trim();


  const status =
    String(
      formData.get(
        "status",
      ) ?? "",
    ).trim();


  const sort =
    String(
      formData.get(
        "sort",
      ) ?? "",
    ).trim();


  if (
    q
  ) {
    params.set(
      "q",
      q,
    );
  }


  if (
    city
  ) {
    params.set(
      "city",
      city,
    );
  }


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


  if (
    sort &&
    sort !==
      "last-order-desc"
  ) {
    params.set(
      "sort",
      sort,
    );
  }


  const queryString =
    params.toString();


  if (
    !queryString
  ) {
    return CLIENTS_ROUTE;
  }


  return `${CLIENTS_ROUTE}?${queryString}`;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ClientsFilters({
  filters,
  filterOptions,
}: ClientsFiltersProps) {
  const formRef =
    useRef<HTMLFormElement>(
      null,
    );


  const searchTimeoutRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null,
    );


  /* =========================================================================
     NETTOYAGE DU DEBOUNCE
     ========================================================================= */

  useEffect(
    () => {
      return () => {
        if (
          searchTimeoutRef.current
        ) {
          clearTimeout(
            searchTimeoutRef.current,
          );
        }
      };
    },
    [],
  );


  /* =========================================================================
     NAVIGATION
     ========================================================================= */

  function navigateWithCurrentFilters(
    form:
      HTMLFormElement,
  ): void {
    const href =
      buildClientsFiltersHref(
        form,
      );


    window.history.pushState(
      null,
      "",
      href,
    );


    window.dispatchEvent(
      new PopStateEvent(
        "popstate",
      ),
    );
  }


  /* =========================================================================
     SUBMIT
     ========================================================================= */

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();


    if (
      searchTimeoutRef.current
    ) {
      clearTimeout(
        searchTimeoutRef.current,
      );

      searchTimeoutRef.current =
        null;
    }


    navigateWithCurrentFilters(
      event.currentTarget,
    );
  }


  /* =========================================================================
     RECHERCHE DEBOUNCÉE
     ========================================================================= */

  function handleSearchChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const form =
      event.currentTarget.form;


    if (
      !form
    ) {
      return;
    }


    if (
      searchTimeoutRef.current
    ) {
      clearTimeout(
        searchTimeoutRef.current,
      );
    }


    searchTimeoutRef.current =
      setTimeout(
        () => {
          navigateWithCurrentFilters(
            form,
          );


          searchTimeoutRef.current =
            null;
        },
        SEARCH_DEBOUNCE_MS,
      );
  }


  /* =========================================================================
     SELECT
     ========================================================================= */

  function handleSelectChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const form =
      event.currentTarget.form;


    if (
      !form
    ) {
      return;
    }


    if (
      searchTimeoutRef.current
    ) {
      clearTimeout(
        searchTimeoutRef.current,
      );

      searchTimeoutRef.current =
        null;
    }


    navigateWithCurrentFilters(
      form,
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
        styles.clientsFilters
      }
      onSubmit={
        handleSubmit
      }
      role="search"
      aria-label="Filtres des clients"
    >
      {/* ===================================================================
          RECHERCHE
          =================================================================== */}

      <div
        className={
          styles.clientsSearchField
        }
      >
        <label
          htmlFor="manager-clients-search"
          className={
            styles.clientsVisuallyHidden
          }
        >
          Rechercher un client
        </label>


        <Search
          className={
            styles.clientsSearchIcon
          }
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <input
          key={
            filters.q
          }
          id="manager-clients-search"
          name="q"
          type="search"
          className={
            styles.clientsSearchInput
          }
          placeholder="Rechercher un client..."
          defaultValue={
            filters.q
          }
          autoComplete="off"
          maxLength={180}
          onChange={
            handleSearchChange
          }
        />
      </div>


      {/* ===================================================================
          VILLE
          =================================================================== */}

      <div
        className={
          styles.clientsFilterField
        }
      >
        <label
          htmlFor="manager-clients-city"
          className={
            styles.clientsVisuallyHidden
          }
        >
          Filtrer par ville
        </label>


        <MapPin
          className={
            styles.clientsFilterIcon
          }
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <select
          key={
            `city-${filters.city}`
          }
          id="manager-clients-city"
          name="city"
          className={
            styles.clientsFilterSelect
          }
          defaultValue={
            filters.city
          }
          onChange={
            handleSelectChange
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
          STATUT
          ===================================================================
          
          Nous utilisons uniquement les vrais statuts CustomerStatus :
          
          ACTIVE
          BLOCKED
          ARCHIVED
          
          Aucun faux INACTIVE n'est créé.
          =================================================================== */}

      <div
        className={
          styles.clientsFilterField
        }
      >
        <label
          htmlFor="manager-clients-status"
          className={
            styles.clientsVisuallyHidden
          }
        >
          Filtrer par statut
        </label>


        <UserRoundCheck
          className={
            styles.clientsFilterIcon
          }
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <select
          key={
            `status-${filters.status}`
          }
          id="manager-clients-status"
          name="status"
          className={
            styles.clientsFilterSelect
          }
          defaultValue={
            filters.status
          }
          onChange={
            handleSelectChange
          }
        >
          <option value="all">
            Tous les statuts
          </option>


          {MANAGER_CUSTOMER_STATUSES.map(
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
                {getManagerCustomerStatusLabel(
                  status,
                )}
              </option>
            ),
          )}
        </select>
      </div>


      {/* ===================================================================
          TRI / DATE
          ===================================================================
          
          Il n'existe pas de fausse "date d'inscription" commerciale.
          
          Le tri utilise la vraie date de dernière commande.
          =================================================================== */}

      <div
        className={
          styles.clientsFilterField
        }
      >
        <label
          htmlFor="manager-clients-sort"
          className={
            styles.clientsVisuallyHidden
          }
        >
          Trier les clients
        </label>


        <ArrowUpDown
          className={
            styles.clientsFilterIcon
          }
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <select
          key={
            `sort-${filters.sort}`
          }
          id="manager-clients-sort"
          name="sort"
          className={
            styles.clientsFilterSelect
          }
          defaultValue={
            filters.sort
          }
          onChange={
            handleSelectChange
          }
        >
          {MANAGER_CLIENT_SORTS.map(
            (
              sort,
            ) => (
              <option
                key={
                  sort
                }
                value={
                  sort
                }
              >
                {getManagerClientsSortLabel(
                  sort,
                )}
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
          CLIENTS_ROUTE
        }
        className={
          styles.clientsFiltersReset
        }
        aria-label="Réinitialiser tous les filtres"
      >
        <RotateCcw
          size={16}
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
          
          Le formulaire fonctionne également au clavier avec Entrée.
          Le bouton reste invisible visuellement.
          =================================================================== */}

      <button
        type="submit"
        className={
          styles.clientsVisuallyHidden
        }
        tabIndex={-1}
        aria-hidden="true"
      >
        Appliquer les filtres
      </button>
    </form>
  );
}