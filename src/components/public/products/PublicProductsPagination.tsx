import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  PUBLIC_PRODUCTS_PAGINATION_CONFIG,
} from "@/config/public-products";

import type {
  PublicProductsPaginationProps,
} from "@/lib/public/products/public-products-types";

import styles from "./public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGINATION — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductsPagination.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la pagination serveur du catalogue public.
 *
 * ============================================================================
 *
 * DONNÉES
 *
 * Toutes les informations arrivent déjà calculées depuis :
 *
 * src/lib/public/products/public-products-query.ts
 *
 * Le composant reçoit notamment :
 *
 * - currentPage ;
 * - totalPages ;
 * - totalItems ;
 * - hasPreviousPage ;
 * - hasNextPage ;
 * - previousHref ;
 * - nextHref ;
 * - pages[].
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne recalcule pas les filtres ;
 * - ne reconstruit pas les query params ;
 * - ne lit pas window.location ;
 * - ne lit pas PostgreSQL ;
 * - ne connaît pas Prisma ;
 * - ne gère pas le Panier ;
 * - ne modifie pas le stock ;
 * - ne contient aucune donnée fictive.
 *
 * ============================================================================
 *
 * Chaque href est déjà construit côté serveur en conservant :
 *
 * - catégorie ;
 * - prix minimum ;
 * - prix maximum ;
 * - promotion ;
 * - tri.
 *
 * ============================================================================
 *
 * SERVER COMPONENT
 *
 * Aucun "use client" n'est nécessaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   HELPERS
   ========================================================================== */

function normalizePositiveInteger(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicProductsPagination({
  pagination,
}: PublicProductsPaginationProps) {
  const {
    data,
    pages,
    previousHref,
    nextHref,
  } =
    pagination;


  const currentPage =
    normalizePositiveInteger(
      data.currentPage,
    );


  const totalPages =
    normalizePositiveInteger(
      data.totalPages,
    );


  const totalItems =
    normalizePositiveInteger(
      data.totalItems,
    );


  /* =========================================================================
     AUCUN RÉSULTAT
     -------------------------------------------------------------------------
     L'état vide est déjà géré par PublicProductsGrid.
     ========================================================================= */

  if (
    totalItems ===
      0 ||
    totalPages ===
      0
  ) {
    return null;
  }


  /* =========================================================================
     UNE SEULE PAGE
     -------------------------------------------------------------------------
     Une pagination interactive n'apporte rien lorsqu'il n'existe qu'une page.
     ========================================================================= */

  if (
    totalPages <=
    1
  ) {
    return null;
  }


  const hasPreviousPage =
    data.hasPreviousPage &&
    currentPage >
      1 &&
    typeof previousHref ===
      "string" &&
    previousHref.trim().length >
      0;


  const hasNextPage =
    data.hasNextPage &&
    currentPage <
      totalPages &&
    typeof nextHref ===
      "string" &&
    nextHref.trim().length >
      0;


  return (
    <nav
      id={
        PUBLIC_PRODUCTS_PAGINATION_CONFIG
          .enabled
          ? "products-pagination"
          : undefined
      }
      className={
        styles.productsPagination
      }
      aria-label="Pagination des produits"
      data-public-products-pagination="true"
      data-current-page={
        currentPage
      }
      data-total-pages={
        totalPages
      }
    >
      <div
        className={
          styles.productsPaginationInner
        }
      >
        {/* ==================================================================
            PAGE PRÉCÉDENTE
            ================================================================== */}

        {PUBLIC_PRODUCTS_PAGINATION_CONFIG
          .showPrevious ? (
          hasPreviousPage ? (
            <Link
              href={
                previousHref
              }
              className={
                styles.productsPaginationDirection
              }
              rel="prev"
              aria-label={
                PUBLIC_PRODUCTS_PAGINATION_CONFIG
                  .labels
                  .previous
              }
            >
              <ChevronLeft
                size={
                  18
                }
                strokeWidth={
                  1.9
                }
                aria-hidden="true"
              />

              <span
                className={
                  styles.productsPaginationDirectionLabel
                }
              >
                Précédent
              </span>
            </Link>
          ) : (
            <span
              className={
                styles.productsPaginationDirectionDisabled
              }
              aria-disabled="true"
            >
              <ChevronLeft
                size={
                  18
                }
                strokeWidth={
                  1.9
                }
                aria-hidden="true"
              />

              <span
                className={
                  styles.productsPaginationDirectionLabel
                }
              >
                Précédent
              </span>
            </span>
          )
        ) : null}


        {/* ==================================================================
            NUMÉROS DE PAGE
            ================================================================== */}

        <ol
          className={
            styles.productsPaginationPages
          }
        >
          {pages.map(
            (
              page,
            ) => {
              const pageNumber =
                normalizePositiveInteger(
                  page.page,
                );


              /**
               * Protection défensive :
               *
               * une entrée de pagination invalide n'est pas rendue.
               */
              if (
                pageNumber <
                  1 ||
                pageNumber >
                  totalPages
              ) {
                return null;
              }


              if (
                page.current
              ) {
                return (
                  <li
                    key={
                      pageNumber
                    }
                    className={
                      styles.productsPaginationPageItem
                    }
                  >
                    <span
                      className={
                        styles.productsPaginationPageCurrent
                      }
                      aria-current="page"
                      aria-label={
                        `${PUBLIC_PRODUCTS_PAGINATION_CONFIG.labels.page} ${pageNumber}, page actuelle`
                      }
                    >
                      {
                        page.label
                      }
                    </span>
                  </li>
                );
              }


              if (
                !page.href ||
                page.href.trim().length ===
                  0
              ) {
                return null;
              }


              return (
                <li
                  key={
                    pageNumber
                  }
                  className={
                    styles.productsPaginationPageItem
                  }
                >
                  <Link
                    href={
                      page.href
                    }
                    className={
                      styles.productsPaginationPageLink
                    }
                    aria-label={
                      `${PUBLIC_PRODUCTS_PAGINATION_CONFIG.labels.page} ${pageNumber}`
                    }
                  >
                    {
                      page.label
                    }
                  </Link>
                </li>
              );
            },
          )}
        </ol>


        {/* ==================================================================
            PAGE SUIVANTE
            ================================================================== */}

        {PUBLIC_PRODUCTS_PAGINATION_CONFIG
          .showNext ? (
          hasNextPage ? (
            <Link
              href={
                nextHref
              }
              className={
                styles.productsPaginationDirection
              }
              rel="next"
              aria-label={
                PUBLIC_PRODUCTS_PAGINATION_CONFIG
                  .labels
                  .next
              }
            >
              <span
                className={
                  styles.productsPaginationDirectionLabel
                }
              >
                Suivant
              </span>

              <ChevronRight
                size={
                  18
                }
                strokeWidth={
                  1.9
                }
                aria-hidden="true"
              />
            </Link>
          ) : (
            <span
              className={
                styles.productsPaginationDirectionDisabled
              }
              aria-disabled="true"
            >
              <span
                className={
                  styles.productsPaginationDirectionLabel
                }
              >
                Suivant
              </span>

              <ChevronRight
                size={
                  18
                }
                strokeWidth={
                  1.9
                }
                aria-hidden="true"
              />
            </span>
          )
        ) : null}
      </div>


      {/* ==================================================================
          RÉSUMÉ ACCESSIBLE / MOBILE
          ================================================================== */}

      <p
        className={
          styles.productsPaginationSummary
        }
        aria-live="polite"
      >
        Page{" "}
        <strong>
          {
            currentPage
          }
        </strong>{" "}
        sur{" "}
        <strong>
          {
            totalPages
          }
        </strong>
      </p>
    </nav>
  );
}