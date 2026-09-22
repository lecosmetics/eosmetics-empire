"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  ArrowUpDown,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type {
  GestionnaireProductCategoryOption,
  GestionnaireProductsQuery,
  GestionnaireProductsSort,
  GestionnaireProductsStatusFilter,
} from "@/server/gestionnaire/products/product-list-service";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * FILTRES — LISTE DES PRODUITS GESTIONNAIRE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/list/ProductsFilters.tsx
 *
 * RESPONSABILITÉS :
 *
 * - rechercher un produit ;
 * - filtrer par statut ;
 * - filtrer par catégorie ;
 * - trier les produits ;
 * - conserver les filtres dans l'URL ;
 * - remettre automatiquement la pagination à la page 1
 *   lorsqu'un filtre change ;
 * - permettre de réinitialiser les filtres ;
 * - ne jamais charger les produits côté navigateur.
 *
 * IMPORTANT :
 *
 * Ce composant ne reçoit :
 *
 * - aucun storeId ;
 * - aucun managerId ;
 * - aucun produit ;
 * - aucune donnée privée de session.
 *
 * Il manipule uniquement les query params :
 *
 * q
 * status
 * category
 * sort
 * page
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

interface ProductsFiltersProps {
  categories:
    readonly GestionnaireProductCategoryOption[];

  query:
    GestionnaireProductsQuery;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const SEARCH_PARAM_QUERY =
  "q";


const SEARCH_PARAM_STATUS =
  "status";


const SEARCH_PARAM_CATEGORY =
  "category";


const SEARCH_PARAM_SORT =
  "sort";


const SEARCH_PARAM_PAGE =
  "page";


const DEFAULT_STATUS:
  GestionnaireProductsStatusFilter =
    "all";


const DEFAULT_SORT:
  GestionnaireProductsSort =
    "newest";


/* ==========================================================================
   OPTIONS — STATUT
   ========================================================================== */

const STATUS_OPTIONS:
  readonly Readonly<{
    value:
      GestionnaireProductsStatusFilter;

    label:
      string;
  }>[] = [
    {
      value:
        "all",

      label:
        "Tous les statuts",
    },

    {
      value:
        "published",

      label:
        "Publié",
    },

    {
      value:
        "draft",

      label:
        "Brouillon",
    },

    {
      value:
        "inactive",

      label:
        "Inactif",
    },
  ];


/* ==========================================================================
   OPTIONS — TRI
   ========================================================================== */

const SORT_OPTIONS:
  readonly Readonly<{
    value:
      GestionnaireProductsSort;

    label:
      string;
  }>[] = [
    {
      value:
        "newest",

      label:
        "Plus récents en premier",
    },

    {
      value:
        "oldest",

      label:
        "Plus anciens en premier",
    },

    {
      value:
        "name-asc",

      label:
        "Nom A-Z",
    },

    {
      value:
        "name-desc",

      label:
        "Nom Z-A",
    },
  ];


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ProductsFilters({
  categories,
  query,
}: ProductsFiltersProps) {
  /* ------------------------------------------------------------------------
     ROUTER
     ------------------------------------------------------------------------ */

  const router =
    useRouter();


  const pathname =
    usePathname();


  const searchParams =
    useSearchParams();


  /* ------------------------------------------------------------------------
     TRANSITION
     ------------------------------------------------------------------------ */

  const [
    isPending,
    startTransition,
  ] =
    useTransition();


  /* ------------------------------------------------------------------------
     RECHERCHE LOCALE
     ------------------------------------------------------------------------
     Le texte de recherche est conservé localement jusqu'à :
     
     - validation du formulaire ;
     - clic sur le bouton rechercher.
     
     Cela évite une requête serveur à chaque caractère tapé.
     ------------------------------------------------------------------------ */

  const [
    searchValue,
    setSearchValue,
  ] =
    useState(
      query.q,
    );


  /* ------------------------------------------------------------------------
     NAVIGATION QUERY PARAMS
     ------------------------------------------------------------------------ */

  function navigateWithParams(
    updater:
      (
        params:
          URLSearchParams,
      ) => void,
  ): void {
    const nextParams =
      new URLSearchParams(
        searchParams.toString(),
      );


    updater(
      nextParams,
    );


    /*
     * Chaque modification de filtre renvoie volontairement
     * vers la première page.
     */

    nextParams.delete(
      SEARCH_PARAM_PAGE,
    );


    const serializedParams =
      nextParams.toString();


    const href =
      serializedParams
        ? `${pathname}?${serializedParams}`
        : pathname;


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


  /* ------------------------------------------------------------------------
     SEARCH
     ------------------------------------------------------------------------ */

  function handleSearchSubmit(
    event:
      React.FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();


    const normalizedSearch =
      searchValue.trim();


    navigateWithParams(
      (
        params,
      ) => {
        if (
          normalizedSearch
        ) {
          params.set(
            SEARCH_PARAM_QUERY,
            normalizedSearch,
          );
        } else {
          params.delete(
            SEARCH_PARAM_QUERY,
          );
        }
      },
    );
  }


  /* ------------------------------------------------------------------------
     CLEAR SEARCH
     ------------------------------------------------------------------------ */

  function handleClearSearch():
    void {
    setSearchValue(
      "",
    );


    navigateWithParams(
      (
        params,
      ) => {
        params.delete(
          SEARCH_PARAM_QUERY,
        );
      },
    );
  }


  /* ------------------------------------------------------------------------
     STATUS
     ------------------------------------------------------------------------ */

  function handleStatusChange(
    event:
      React.ChangeEvent<HTMLSelectElement>,
  ): void {
    const value =
      event.target
        .value as
          GestionnaireProductsStatusFilter;


    navigateWithParams(
      (
        params,
      ) => {
        if (
          value ===
          DEFAULT_STATUS
        ) {
          params.delete(
            SEARCH_PARAM_STATUS,
          );

          return;
        }


        params.set(
          SEARCH_PARAM_STATUS,
          value,
        );
      },
    );
  }


  /* ------------------------------------------------------------------------
     CATEGORY
     ------------------------------------------------------------------------ */

  function handleCategoryChange(
    event:
      React.ChangeEvent<HTMLSelectElement>,
  ): void {
    const value =
      event.target
        .value
        .trim();


    navigateWithParams(
      (
        params,
      ) => {
        if (
          !value
        ) {
          params.delete(
            SEARCH_PARAM_CATEGORY,
          );

          return;
        }


        params.set(
          SEARCH_PARAM_CATEGORY,
          value,
        );
      },
    );
  }


  /* ------------------------------------------------------------------------
     SORT
     ------------------------------------------------------------------------ */

  function handleSortChange(
    event:
      React.ChangeEvent<HTMLSelectElement>,
  ): void {
    const value =
      event.target
        .value as
          GestionnaireProductsSort;


    navigateWithParams(
      (
        params,
      ) => {
        if (
          value ===
          DEFAULT_SORT
        ) {
          params.delete(
            SEARCH_PARAM_SORT,
          );

          return;
        }


        params.set(
          SEARCH_PARAM_SORT,
          value,
        );
      },
    );
  }


  /* ------------------------------------------------------------------------
     RESET
     ------------------------------------------------------------------------ */

  function handleResetFilters():
    void {
    setSearchValue(
      "",
    );


    startTransition(
      () => {
        router.replace(
          pathname,
          {
            scroll:
              false,
          },
        );
      },
    );
  }


  /* ------------------------------------------------------------------------
     ACTIVE FILTERS
     ------------------------------------------------------------------------ */

  const hasActiveFilters =
    Boolean(
      query.q ||
      query.category ||
      query.status !==
        DEFAULT_STATUS ||
      query.sort !==
        DEFAULT_SORT,
    );


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className="productsFilters"
      aria-busy={
        isPending
      }
    >
      {/* ================================================================
          SEARCH
          ================================================================ */}

      <form
        className="productsFiltersSearch"
        onSubmit={
          handleSearchSubmit
        }
        role="search"
      >
        <label
          className="productsFiltersSearchLabel"
          htmlFor="products-search"
        >
          Rechercher un produit
        </label>


        <div className="productsFiltersSearchControl">
          <Search
            className="productsFiltersSearchIcon"
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />


          <input
            id="products-search"
            className="productsFiltersSearchInput"
            type="search"
            name="q"
            value={
              searchValue
            }
            onChange={
              (
                event,
              ) => {
                setSearchValue(
                  event.target.value,
                );
              }
            }
            placeholder="Rechercher un produit..."
            autoComplete="off"
            maxLength={120}
            disabled={
              isPending
            }
          />


          {searchValue ? (
            <button
              type="button"
              className="productsFiltersSearchClear"
              onClick={
                handleClearSearch
              }
              aria-label="Effacer la recherche"
              disabled={
                isPending
              }
            >
              <X
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </button>
          ) : null}


          <button
            type="submit"
            className="productsFiltersSearchSubmit"
            disabled={
              isPending
            }
            aria-label="Lancer la recherche"
          >
            <Search
              size={16}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Rechercher
            </span>
          </button>
        </div>
      </form>


      {/* ================================================================
          FILTERS
          ================================================================ */}

      <div className="productsFiltersControls">
        {/* --------------------------------------------------------------
            STATUS
            -------------------------------------------------------------- */}

        <div className="productsFiltersSelectWrapper">
          <label
            htmlFor="products-status-filter"
            className="productsFiltersSelectLabel"
          >
            Statut
          </label>


          <div className="productsFiltersSelectControl">
            <SlidersHorizontal
              className="productsFiltersSelectIcon"
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />


            <select
              id="products-status-filter"
              className="productsFiltersSelect"
              value={
                query.status
              }
              onChange={
                handleStatusChange
              }
              disabled={
                isPending
              }
            >
              {STATUS_OPTIONS.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>


        {/* --------------------------------------------------------------
            CATEGORY
            -------------------------------------------------------------- */}

        <div className="productsFiltersSelectWrapper">
          <label
            htmlFor="products-category-filter"
            className="productsFiltersSelectLabel"
          >
            Catégorie
          </label>


          <div className="productsFiltersSelectControl">
            <select
              id="products-category-filter"
              className="productsFiltersSelect"
              value={
                query.category ??
                ""
              }
              onChange={
                handleCategoryChange
              }
              disabled={
                isPending
              }
            >
              <option value="">
                Toutes les catégories
              </option>


              {categories.map(
                (
                  category,
                ) => (
                  <option
                    key={
                      category.slug
                    }
                    value={
                      category.slug
                    }
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>


        {/* --------------------------------------------------------------
            SORT
            -------------------------------------------------------------- */}

        <div className="productsFiltersSelectWrapper productsFiltersSortWrapper">
          <label
            htmlFor="products-sort-filter"
            className="productsFiltersSelectLabel"
          >
            Trier
          </label>


          <div className="productsFiltersSelectControl">
            <ArrowUpDown
              className="productsFiltersSelectIcon"
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />


            <select
              id="products-sort-filter"
              className="productsFiltersSelect"
              value={
                query.sort
              }
              onChange={
                handleSortChange
              }
              disabled={
                isPending
              }
            >
              {SORT_OPTIONS.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>


        {/* --------------------------------------------------------------
            RESET
            -------------------------------------------------------------- */}

        {hasActiveFilters ? (
          <button
            type="button"
            className="productsFiltersReset"
            onClick={
              handleResetFilters
            }
            disabled={
              isPending
            }
          >
            <X
              size={15}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Réinitialiser
            </span>
          </button>
        ) : null}
      </div>


      {/* ================================================================
          LOADING INDICATOR
          ---------------------------------------------------------------
          Très discret.
          Pas de spinner géant.
          ================================================================ */}

      <div
        className="productsFiltersProgress"
        aria-hidden={
          !isPending
        }
      >
        {isPending ? (
          <span>
            Mise à jour…
          </span>
        ) : null}
      </div>
    </div>
  );
}