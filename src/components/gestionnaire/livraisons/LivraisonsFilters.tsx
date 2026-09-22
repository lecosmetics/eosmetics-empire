"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
  MapPin,
  RefreshCcw,
  Search,
  Truck,
} from "lucide-react";

import {
  DEFAULT_MANAGER_SHIPMENTS_FILTERS,
  MANAGER_SHIPMENT_STATUSES,
  getManagerShipmentStatusLabel,
  type ManagerShipmentStatusFilter,
  type ManagerShipmentsFilterOptions,
  type ManagerShipmentsFilters,
} from "@/lib/gestionnaire/livraisons/shipment-types";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — FILTRES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonsFilters.tsx
 *
 * RESPONSABILITÉS :
 *
 * - gérer les filtres de la liste des livraisons ;
 * - synchroniser les filtres avec l'URL ;
 * - relancer les requêtes serveur via la navigation Next.js ;
 * - appliquer un debounce uniquement sur la recherche texte ;
 * - remettre implicitement la pagination à la page 1 lorsque les filtres
 *   changent, car "page" n'est pas conservé dans buildLivraisonsHref() ;
 * - utiliser uniquement les villes et transporteurs réellement fournis
 *   par le serveur.
 *
 * IMPORTANT :
 *
 * - aucune donnée métier n'est filtrée uniquement côté navigateur ;
 * - aucun storeId n'est fourni par le navigateur ;
 * - aucune requête Prisma n'est exécutée ici ;
 * - aucun setState() n'est exécuté depuis un useEffect ;
 * - les filtres reçus du serveur restent la source de vérité après
 *   chaque navigation.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


/* ==========================================================================
   SEARCH DEBOUNCE
   ========================================================================== */

const SEARCH_DEBOUNCE_MS =
  350;


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonsFiltersProps {
  readonly filters:
    ManagerShipmentsFilters;

  readonly options:
    ManagerShipmentsFilterOptions;
}


/* ==========================================================================
   LOCAL STATE
   ========================================================================== */

interface LivraisonsFiltersState {
  readonly q:
    string;

  readonly dateFrom:
    string;

  readonly dateTo:
    string;

  readonly status:
    ManagerShipmentStatusFilter;

  readonly city:
    string;

  readonly carrier:
    string;
}


/* ==========================================================================
   CREATE LOCAL STATE
   ========================================================================== */

function createFiltersState(
  filters:
    ManagerShipmentsFilters,
): LivraisonsFiltersState {
  return {
    q:
      filters.q,

    dateFrom:
      filters.dateFrom,

    dateTo:
      filters.dateTo,

    status:
      filters.status,

    city:
      filters.city,

    carrier:
      filters.carrier,
  };
}


/* ==========================================================================
   COMPONENT KEY
   ========================================================================== */

/**
 * Le composant interne est remonté lorsque les filtres serveur changent.
 *
 * Cela permet de remettre proprement son état local à jour sans appeler
 * setState() dans un useEffect.
 *
 * Cette stratégie règle notamment la règle ESLint :
 *
 * react-hooks/set-state-in-effect
 */

function createFiltersComponentKey(
  filters:
    ManagerShipmentsFilters,
): string {
  return JSON.stringify([
    filters.q,
    filters.dateFrom,
    filters.dateTo,
    filters.status,
    filters.city,
    filters.carrier,
  ]);
}


/* ==========================================================================
   BUILD URL
   ========================================================================== */

function buildLivraisonsHref(
  state:
    LivraisonsFiltersState,
): string {
  const params =
    new URLSearchParams();


  const q =
    state.q.trim();


  const dateFrom =
    state.dateFrom.trim();


  const dateTo =
    state.dateTo.trim();


  const city =
    state.city.trim();


  const carrier =
    state.carrier.trim();


  if (
    q
  ) {
    params.set(
      "q",
      q,
    );
  }


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


  if (
    state.status !==
      "all"
  ) {
    params.set(
      "status",
      state.status,
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
    carrier
  ) {
    params.set(
      "carrier",
      carrier,
    );
  }


  /**
   * IMPORTANT :
   *
   * Le paramètre "page" n'est volontairement pas repris.
   *
   * Tout changement de filtre repart donc proprement sur la page 1.
   */

  const queryString =
    params.toString();


  return queryString
    ? `${LIVRAISONS_ROUTE}?${queryString}`
    : LIVRAISONS_ROUTE;
}


/* ==========================================================================
   ACTIVE FILTERS
   ========================================================================== */

function hasActiveFilters(
  state:
    LivraisonsFiltersState,
): boolean {
  return (
    state.q.trim() !==
      "" ||
    state.dateFrom !==
      "" ||
    state.dateTo !==
      "" ||
    state.status !==
      "all" ||
    state.city !==
      "" ||
    state.carrier !==
      ""
  );
}


/* ==========================================================================
   PUBLIC COMPONENT
   ========================================================================== */

/**
 * Le wrapper ne possède aucun state.
 *
 * Lorsque Next.js renvoie de nouveaux filtres après navigation,
 * la key change et le formulaire interne est remonté avec les valeurs
 * serveur réellement actives.
 */

export default function LivraisonsFilters({
  filters,
  options,
}: LivraisonsFiltersProps) {
  return (
    <LivraisonsFiltersForm
      key={
        createFiltersComponentKey(
          filters,
        )
      }
      filters={filters}
      options={options}
    />
  );
}


/* ==========================================================================
   INTERNAL FORM COMPONENT
   ========================================================================== */

function LivraisonsFiltersForm({
  filters,
  options,
}: LivraisonsFiltersProps) {
  const router =
    useRouter();


  /* =========================================================================
     STATE
     ========================================================================= */

  const [
    state,
    setState,
  ] =
    useState<LivraisonsFiltersState>(
      () =>
        createFiltersState(
          filters,
        ),
    );


  /* =========================================================================
     REFS
     ========================================================================= */

  /**
   * URL réellement demandée en dernier.
   *
   * Cela empêche :
   *
   * - les navigations identiques ;
   * - les navigations doublées après un changement immédiat de filtre ;
   * - le debounce de relancer une URL déjà demandée.
   */

  const lastNavigationHref =
    useRef(
      buildLivraisonsHref(
        createFiltersState(
          filters,
        ),
      ),
    );


  /**
   * Le debounce n'a rien à faire au montage initial.
   */

  const isFirstSearchEffect =
    useRef(
      true,
    );


  /* =========================================================================
     NAVIGATION
     ========================================================================= */

  const navigate =
    useCallback(
      (
        nextState:
          LivraisonsFiltersState,
      ): void => {
        const href =
          buildLivraisonsHref(
            nextState,
          );


        if (
          href ===
          lastNavigationHref.current
        ) {
          return;
        }


        lastNavigationHref.current =
          href;


        router.push(
          href,
          {
            scroll:
              false,
          },
        );
      },
      [
        router,
      ],
    );


  /* =========================================================================
     SEARCH DEBOUNCE
     ========================================================================= */

  useEffect(
    () => {
      /**
       * Pas de navigation au premier rendu.
       */
      if (
        isFirstSearchEffect.current
      ) {
        isFirstSearchEffect.current =
          false;

        return;
      }


      const timeoutId =
        window.setTimeout(
          () => {
            navigate(
              state,
            );
          },
          SEARCH_DEBOUNCE_MS,
        );


      return () => {
        window.clearTimeout(
          timeoutId,
        );
      };
    },
    [
      navigate,
      state,
    ],
  );


  /* =========================================================================
     SEARCH
     ========================================================================= */

  function handleSearchChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const q =
      event.currentTarget.value;


    setState(
      (
        current,
      ) => ({
        ...current,

        q,
      }),
    );
  }


  /* =========================================================================
     DATE FROM
     ========================================================================= */

  function handleDateFromChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const dateFrom =
      event.currentTarget.value;


    const nextState:
      LivraisonsFiltersState = {
      ...state,

      dateFrom,
    };


    /**
     * Aucun effet secondaire dans le callback de setState().
     *
     * On met d'abord l'interface à jour puis on demande la nouvelle
     * lecture serveur.
     */

    setState(
      nextState,
    );


    navigate(
      nextState,
    );
  }


  /* =========================================================================
     DATE TO
     ========================================================================= */

  function handleDateToChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const dateTo =
      event.currentTarget.value;


    const nextState:
      LivraisonsFiltersState = {
      ...state,

      dateTo,
    };


    setState(
      nextState,
    );


    navigate(
      nextState,
    );
  }


  /* =========================================================================
     STATUS
     ========================================================================= */

  function handleStatusChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const value =
      event.currentTarget.value;


    const isKnownStatus =
      MANAGER_SHIPMENT_STATUSES.includes(
        value as typeof MANAGER_SHIPMENT_STATUSES[number],
      );


    const status:
      ManagerShipmentStatusFilter =
        value ===
          "all" ||
        isKnownStatus
          ? (
              value as
                ManagerShipmentStatusFilter
            )
          : "all";


    const nextState:
      LivraisonsFiltersState = {
      ...state,

      status,
    };


    setState(
      nextState,
    );


    navigate(
      nextState,
    );
  }


  /* =========================================================================
     CITY
     ========================================================================= */

  function handleCityChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const city =
      event.currentTarget.value;


    const nextState:
      LivraisonsFiltersState = {
      ...state,

      city,
    };


    setState(
      nextState,
    );


    navigate(
      nextState,
    );
  }


  /* =========================================================================
     CARRIER
     ========================================================================= */

  function handleCarrierChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const carrier =
      event.currentTarget.value;


    const nextState:
      LivraisonsFiltersState = {
      ...state,

      carrier,
    };


    setState(
      nextState,
    );


    navigate(
      nextState,
    );
  }


  /* =========================================================================
     RESET
     ========================================================================= */

  function handleReset():
    void {
    const nextState:
      LivraisonsFiltersState = {
      q:
        DEFAULT_MANAGER_SHIPMENTS_FILTERS.q,

      dateFrom:
        DEFAULT_MANAGER_SHIPMENTS_FILTERS.dateFrom,

      dateTo:
        DEFAULT_MANAGER_SHIPMENTS_FILTERS.dateTo,

      status:
        DEFAULT_MANAGER_SHIPMENTS_FILTERS.status,

      city:
        DEFAULT_MANAGER_SHIPMENTS_FILTERS.city,

      carrier:
        DEFAULT_MANAGER_SHIPMENTS_FILTERS.carrier,
    };


    setState(
      nextState,
    );


    /**
     * On fixe immédiatement la dernière URL connue pour empêcher
     * le debounce de lancer une deuxième navigation identique.
     */

    lastNavigationHref.current =
      LIVRAISONS_ROUTE;


    router.push(
      LIVRAISONS_ROUTE,
      {
        scroll:
          false,
      },
    );
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className={styles.livraisonsFiltersSection}
      aria-labelledby="livraisons-filters-title"
    >
      {/* ==================================================================
          ACCESSIBLE TITLE
          ================================================================== */}

      <h2
        id="livraisons-filters-title"
        className={styles.livraisonsVisuallyHidden}
      >
        Filtres des livraisons
      </h2>


      {/* ==================================================================
          FILTER BAR
          ================================================================== */}

      <div className={styles.livraisonsFilters}>
        {/* ================================================================
            PERIOD
            ================================================================ */}

        <div className={styles.livraisonsPeriodFilter}>
          <span
            className={styles.livraisonsFilterLeadingIcon}
            aria-hidden="true"
          >
            <CalendarDays
              size={17}
              strokeWidth={1.8}
            />
          </span>


          <div className={styles.livraisonsPeriodFields}>
            <div className={styles.livraisonsDateField}>
              <label
                htmlFor="livraisons-date-from"
                className={styles.livraisonsVisuallyHidden}
              >
                Date de début
              </label>


              <input
                id="livraisons-date-from"
                type="date"
                value={state.dateFrom}
                max={
                  state.dateTo ||
                  undefined
                }
                onChange={handleDateFromChange}
                className={styles.livraisonsDateInput}
                aria-label="Date de début"
              />
            </div>


            <span
              className={styles.livraisonsPeriodSeparator}
              aria-hidden="true"
            >
              —
            </span>


            <div className={styles.livraisonsDateField}>
              <label
                htmlFor="livraisons-date-to"
                className={styles.livraisonsVisuallyHidden}
              >
                Date de fin
              </label>


              <input
                id="livraisons-date-to"
                type="date"
                value={state.dateTo}
                min={
                  state.dateFrom ||
                  undefined
                }
                onChange={handleDateToChange}
                className={styles.livraisonsDateInput}
                aria-label="Date de fin"
              />
            </div>
          </div>
        </div>


        {/* ================================================================
            SEARCH
            ================================================================ */}

        <div className={styles.livraisonsSearchField}>
          <Search
            className={styles.livraisonsSearchIcon}
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />


          <label
            htmlFor="livraisons-search"
            className={styles.livraisonsVisuallyHidden}
          >
            Rechercher une livraison
          </label>


          <input
            id="livraisons-search"
            type="search"
            inputMode="search"
            autoComplete="off"
            value={state.q}
            onChange={handleSearchChange}
            className={styles.livraisonsSearchInput}
            placeholder="Rechercher une livraison, commande, cliente..."
          />
        </div>


        {/* ================================================================
            STATUS
            ================================================================ */}

        <div className={styles.livraisonsSelectField}>
          <label
            htmlFor="livraisons-status"
            className={styles.livraisonsVisuallyHidden}
          >
            Statut de livraison
          </label>


          <select
            id="livraisons-status"
            value={state.status}
            onChange={handleStatusChange}
            className={styles.livraisonsSelect}
          >
            <option value="all">
              Tous les statuts
            </option>


            {MANAGER_SHIPMENT_STATUSES.map(
              (
                status,
              ) => (
                <option
                  key={status}
                  value={status}
                >
                  {getManagerShipmentStatusLabel(
                    status,
                  )}
                </option>
              ),
            )}
          </select>
        </div>


        {/* ================================================================
            CITY
            ================================================================ */}

        <div className={styles.livraisonsSelectField}>
          <MapPin
            className={styles.livraisonsSelectIcon}
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
          />


          <label
            htmlFor="livraisons-city"
            className={styles.livraisonsVisuallyHidden}
          >
            Ville
          </label>


          <select
            id="livraisons-city"
            value={state.city}
            onChange={handleCityChange}
            className={[
              styles.livraisonsSelect,
              styles.livraisonsSelectWithIcon,
            ].join(" ")}
          >
            <option value="">
              Toutes les villes
            </option>


            {options.cities.map(
              (
                city,
              ) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ),
            )}
          </select>
        </div>


        {/* ================================================================
            CARRIER
            ================================================================ */}

        <div className={styles.livraisonsSelectField}>
          <Truck
            className={styles.livraisonsSelectIcon}
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
          />


          <label
            htmlFor="livraisons-carrier"
            className={styles.livraisonsVisuallyHidden}
          >
            Transporteur
          </label>


          <select
            id="livraisons-carrier"
            value={state.carrier}
            onChange={handleCarrierChange}
            className={[
              styles.livraisonsSelect,
              styles.livraisonsSelectWithIcon,
            ].join(" ")}
          >
            <option value="">
              Tous les transporteurs
            </option>


            {options.carriers.map(
              (
                carrier,
              ) => (
                <option
                  key={carrier}
                  value={carrier}
                >
                  {carrier}
                </option>
              ),
            )}
          </select>
        </div>


        {/* ================================================================
            RESET
            ================================================================ */}

        <button
          type="button"
          onClick={handleReset}
          disabled={
            !hasActiveFilters(
              state,
            )
          }
          className={styles.livraisonsResetButton}
        >
          <RefreshCcw
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Réinitialiser
          </span>
        </button>
      </div>
    </section>
  );
}