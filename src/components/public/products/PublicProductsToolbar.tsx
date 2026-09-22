"use client";

import type {
  ChangeEvent,
} from "react";

import {
  ArrowUpDown,
} from "lucide-react";

import {
  PUBLIC_PRODUCTS_CATALOG_CONFIG,
  PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG,
  PUBLIC_PRODUCTS_QUERY_PARAMETERS,
  PUBLIC_PRODUCTS_ROUTE,
  PUBLIC_PRODUCTS_SORT_CONFIG,
  PUBLIC_PRODUCTS_TOOLBAR_CONFIG,
} from "@/config/public-products";

import type {
  PublicProductsToolbarProps,
} from "@/lib/public/products/public-products-types";

import styles from "./public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TOOLBAR — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductsToolbar.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la barre d'outils du catalogue :
 *
 * - nombre réel de résultats ;
 * - tri réel des offres ;
 * - conservation des filtres actifs ;
 * - retour à la première page lors d'un changement de tri.
 *
 * ============================================================================
 *
 * DONNÉES
 *
 * totalProductCount :
 *
 * provient de PostgreSQL via :
 *
 * public-products-query.ts
 *
 * activeFilters :
 *
 * provient des paramètres URL déjà normalisés côté serveur.
 *
 * ============================================================================
 *
 * TRI DISPONIBLE
 *
 * - Plus récents ;
 * - Prix croissant ;
 * - Prix décroissant ;
 * - Nom A à Z.
 *
 * Aucun :
 *
 * - populaire ;
 * - tendance ;
 * - meilleur vendeur ;
 * - recommandé ;
 *
 * n'est inventé.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le filtre mobile est déjà géré par :
 *
 * PublicProductsFilters.tsx
 *
 * Ce fichier ne doit donc pas créer un deuxième bouton Filtres.
 *
 * ============================================================================
 *
 * CE COMPOSANT NE DOIT PAS :
 *
 * - importer Prisma ;
 * - lire PostgreSQL ;
 * - modifier le Panier ;
 * - modifier le stock ;
 * - calculer le nombre de produits ;
 * - inventer un résultat ;
 * - inventer un tri ;
 * - conserver le paramètre page lors d'un changement de tri.
 *
 * ============================================================================
 */


/* ==========================================================================
   HELPERS
   ========================================================================== */

function joinClassNames(
  ...classNames:
    Array<
      string |
      null |
      undefined |
      false
    >
): string {
  return classNames
    .filter(
      (
        className,
      ): className is string =>
        typeof className ===
          "string" &&
        className.length >
          0,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   LABEL DU NOMBRE DE RÉSULTATS
   ========================================================================== */

function buildResultCountLabel(
  totalProductCount:
    number,
): string {
  const normalizedCount =
    Number.isFinite(
      totalProductCount,
    )
      ? Math.max(
          0,
          Math.trunc(
            totalProductCount,
          ),
        )
      : 0;


  if (
    normalizedCount ===
    0
  ) {
    return PUBLIC_PRODUCTS_CATALOG_CONFIG
      .resultCountLabels
      .zero;
  }


  if (
    normalizedCount ===
    1
  ) {
    return PUBLIC_PRODUCTS_CATALOG_CONFIG
      .resultCountLabels
      .singular;
  }


  return `${normalizedCount.toLocaleString(
    "fr-FR",
  )} ${
    PUBLIC_PRODUCTS_CATALOG_CONFIG
      .resultCountLabels
      .pluralSuffix
  }`;
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicProductsToolbar({
  totalProductCount,
  activeFilters,
}: PublicProductsToolbarProps) {
  const resultCountLabel =
    buildResultCountLabel(
      totalProductCount,
    );


  function handleSortChange(
    event:
      ChangeEvent<
        HTMLSelectElement
      >,
  ): void {
    const form =
      event.currentTarget
        .form;


    if (
      !form
    ) {
      return;
    }


    /**
     * requestSubmit() respecte le comportement natif du formulaire
     * et déclenche une navigation GET vers /produits.
     */
    form.requestSubmit();
  }


  return (
    <div
      className={
        styles.productsToolbar
      }
      data-public-products-toolbar="true"
    >
      {/* ==================================================================
          NOMBRE DE RÉSULTATS
          ================================================================== */}

      {PUBLIC_PRODUCTS_TOOLBAR_CONFIG
        .showResultCount ? (
        <div
          className={
            styles.productsToolbarResults
          }
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            className={
              styles.productsToolbarResultsCount
            }
          >
            {
              resultCountLabel
            }
          </span>
        </div>
      ) : null}


      {/* ==================================================================
          TRI
          ================================================================== */}

      {PUBLIC_PRODUCTS_TOOLBAR_CONFIG
        .showSort ? (
        <form
          action={
            PUBLIC_PRODUCTS_ROUTE
          }
          method="get"
          className={
            styles.productsToolbarSortForm
          }
        >
          {/* ================================================================
              CONSERVATION DE LA CATÉGORIE
              ================================================================ */}

          {activeFilters.categorySlug ? (
            <input
              type="hidden"
              name={
                PUBLIC_PRODUCTS_QUERY_PARAMETERS
                  .category
              }
              value={
                activeFilters.categorySlug
              }
            />
          ) : null}


          {/* ================================================================
              CONSERVATION DU PRIX MINIMUM
              ================================================================ */}

          {activeFilters.minimumPrice ? (
            <input
              type="hidden"
              name={
                PUBLIC_PRODUCTS_QUERY_PARAMETERS
                  .minPrice
              }
              value={
                activeFilters.minimumPrice
              }
            />
          ) : null}


          {/* ================================================================
              CONSERVATION DU PRIX MAXIMUM
              ================================================================ */}

          {activeFilters.maximumPrice ? (
            <input
              type="hidden"
              name={
                PUBLIC_PRODUCTS_QUERY_PARAMETERS
                  .maxPrice
              }
              value={
                activeFilters.maximumPrice
              }
            />
          ) : null}


          {/* ================================================================
              CONSERVATION DE LA PROMOTION
              ================================================================ */}

          {activeFilters.promotionOnly ? (
            <input
              type="hidden"
              name={
                PUBLIC_PRODUCTS_QUERY_PARAMETERS
                  .promotion
              }
              value={
                PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG
                  .activeValue
              }
            />
          ) : null}


          {/* ================================================================
              IMPORTANT :
              
              Le paramètre page n'est volontairement PAS conservé.
              
              Lorsqu'on change le tri :
              
              page 5
                 ↓
              nouveau tri
                 ↓
              page 1
              
              Cela évite une pagination incohérente.
              ================================================================ */}


          {/* ================================================================
              LABEL DESKTOP
              ================================================================ */}

          <label
            htmlFor="public-products-sort"
            className={
              styles.productsToolbarSortLabel
            }
          >
            {
              PUBLIC_PRODUCTS_SORT_CONFIG
                .label
            }
          </label>


          {/* ================================================================
              SELECT
              ================================================================ */}

          <div
            className={
              styles.productsToolbarSortControl
            }
          >
            <ArrowUpDown
              className={
                styles.productsToolbarSortIcon
              }
              size={
                16
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />


            <select
              id="public-products-sort"
              name={
                PUBLIC_PRODUCTS_QUERY_PARAMETERS
                  .sort
              }
              value={
                activeFilters.sort
              }
              onChange={
                handleSortChange
              }
              className={
                joinClassNames(
                  styles.productsToolbarSortSelect,
                  PUBLIC_PRODUCTS_TOOLBAR_CONFIG
                    .mobileSortButton
                    .visible &&
                    styles.productsToolbarSortSelectMobile,
                )
              }
              aria-label={
                PUBLIC_PRODUCTS_SORT_CONFIG
                  .label
              }
            >
              {PUBLIC_PRODUCTS_SORT_CONFIG
                .options
                .map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.id
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
            </select>
          </div>
        </form>
      ) : null}
    </div>
  );
}