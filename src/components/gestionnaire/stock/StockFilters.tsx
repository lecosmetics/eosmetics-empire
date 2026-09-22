"use client";

import {
  useEffect,
  useRef,
} from "react";

import Link from "next/link";

import {
  RotateCcw,
  Search,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import type {
  ManagerStockCategoryOption,
  ManagerStockFilters,
} from "@/lib/gestionnaire/stock/stock-types";

import styles from "@/app/gestionnaire/(espace-prive)/stock/stock.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/stock/StockFilters.tsx
 *
 * RÔLE :
 *
 * Gérer uniquement les filtres de :
 *
 * /gestionnaire/stock
 *
 * FILTRES :
 *
 * - recherche par nom / SKU ;
 * - catégorie ;
 * - statut de stock ;
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
 * - ne contient aucune catégorie fictive ;
 * - ne contient aucun produit fictif ;
 * - ne calcule aucun statut métier ;
 * - utilise les query params comme source de navigation ;
 * - remet automatiquement la pagination à la première page.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const STOCK_ROUTE =
  routes.gestionnaire.stock;


const SEARCH_DEBOUNCE_MS =
  350;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface StockFiltersProps {
  readonly filters:
    ManagerStockFilters;

  readonly categories:
    readonly ManagerStockCategoryOption[];
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StockFilters({
  filters,
  categories,
}: StockFiltersProps) {
  const formRef =
    useRef<HTMLFormElement>(
      null,
    );


  const searchInputRef =
    useRef<HTMLInputElement>(
      null,
    );


  const searchTimerRef =
    useRef<
      ReturnType<typeof setTimeout> |
      null
    >(
      null,
    );


  const initialSearchRef =
    useRef(
      filters.q,
    );


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
     SUBMIT DU FORMULAIRE
     ========================================================================= */

  function submitFilters(): void {
    formRef.current
      ?.requestSubmit();
  }


  /* =========================================================================
     RECHERCHE
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
          const currentValue =
            searchInputRef.current
              ?.value
              .trim() ??
            "";


          /**
           * On évite une navigation inutile si la valeur est strictement
           * identique à celle actuellement appliquée.
           */

          if (
            currentValue ===
            initialSearchRef.current
          ) {
            return;
          }


          submitFilters();
        },
        SEARCH_DEBOUNCE_MS,
      );
  }


  /* =========================================================================
     SELECT
     ========================================================================= */

  function handleSelectChange(): void {
    /**
     * Si une recherche attend encore son debounce, on l'annule.
     *
     * Le formulaire envoyé juste après contient de toute façon la valeur
     * actuellement présente dans le champ de recherche.
     */

    if (
      searchTimerRef.current
    ) {
      clearTimeout(
        searchTimerRef.current,
      );

      searchTimerRef.current =
        null;
    }


    submitFilters();
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <form
      ref={
        formRef
      }
      action={
        STOCK_ROUTE
      }
      method="get"
      className={
        styles.stockFilters
      }
      role="search"
      aria-label="Filtrer les stocks"
    >
      {/* ===================================================================
          RECHERCHE
          =================================================================== */}

      <div
        className={
          styles.stockSearchField
        }
      >
        <Search
          size={18}
          strokeWidth={1.8}
          className={
            styles.stockSearchIcon
          }
          aria-hidden="true"
        />


        <label
          htmlFor="stock-search"
          className={
            styles.stockVisuallyHidden
          }
        >
          Rechercher un produit ou une référence
        </label>


        <input
          ref={
            searchInputRef
          }
          id="stock-search"
          type="search"
          name="q"
          defaultValue={
            filters.q
          }
          placeholder="Rechercher un produit, une référence..."
          autoComplete="off"
          spellCheck={false}
          className={
            styles.stockSearchInput
          }
          onChange={
            handleSearchChange
          }
        />
      </div>


      {/* ===================================================================
          CATÉGORIE
          =================================================================== */}

      <div
        className={
          styles.stockFilterField
        }
      >
        <label
          htmlFor="stock-category"
          className={
            styles.stockVisuallyHidden
          }
        >
          Filtrer par catégorie
        </label>


        <select
          id="stock-category"
          name="category"
          defaultValue={
            filters.category
          }
          className={
            styles.stockFilterSelect
          }
          onChange={
            handleSelectChange
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
                  category.id
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


      {/* ===================================================================
          STATUT
          =================================================================== */}

      <div
        className={
          styles.stockFilterField
        }
      >
        <label
          htmlFor="stock-status"
          className={
            styles.stockVisuallyHidden
          }
        >
          Filtrer par statut de stock
        </label>


        <select
          id="stock-status"
          name="status"
          defaultValue={
            filters.status
          }
          className={
            styles.stockFilterSelect
          }
          onChange={
            handleSelectChange
          }
        >
          <option value="all">
            Tous les statuts
          </option>

          <option value="in_stock">
            En stock
          </option>

          <option value="low_stock">
            Stock faible
          </option>

          <option value="out_of_stock">
            Rupture
          </option>
        </select>
      </div>


      {/* ===================================================================
          RÉINITIALISER
          =================================================================== */}

      <Link
        href={
          STOCK_ROUTE
        }
        className={
          styles.stockFiltersReset
        }
        aria-label="Réinitialiser les filtres de stock"
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
          -------------------------------------------------------------------
          Le formulaire est principalement soumis automatiquement.
          Ce bouton reste disponible pour le clavier / navigateur sans
          ajouter un bouton visuel qui n'existe pas dans la maquette.
          =================================================================== */}

      <button
        type="submit"
        className={
          styles.stockVisuallyHidden
        }
        tabIndex={-1}
        aria-hidden="true"
      >
        Appliquer les filtres
      </button>
    </form>
  );
}