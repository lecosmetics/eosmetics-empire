"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  Filter,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  PUBLIC_PRODUCTS_FILTERS_CONFIG,
  PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG,
  PUBLIC_PRODUCTS_QUERY_PARAMETERS,
  PUBLIC_PRODUCTS_ROUTE,
  PUBLIC_PRODUCTS_SORT_CONFIG,
} from "@/config/public-products";

import type {
  PublicProductsActiveFilters,
  PublicProductsCategoryFilterCollection,
  PublicProductsFiltersProps,
  PublicProductsPriceBounds,
} from "@/lib/public/products/public-products-types";

import styles from "./public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * FILTRES — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductsFilters.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher les filtres réels du catalogue public :
 *
 * - catégories ;
 * - prix ;
 * - promotions.
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Sidebar de filtres.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Bouton "Filtres"
 *      ↓
 * Drawer
 *      ↓
 * Formulaire
 *      ↓
 * navigation GET vers /produits
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Les filtres utilisent exclusivement les données préparées côté serveur
 * dans :
 *
 * src/lib/public/products/public-products-query.ts
 *
 * ============================================================================
 *
 * CATÉGORIES :
 *
 * ProductCategory réelles.
 *
 * ============================================================================
 *
 * PRIX :
 *
 * StoreProduct.price réel.
 *
 * Le filtre prix n'est affiché que lorsqu'une devise unique permet
 * réellement une comparaison cohérente.
 *
 * ============================================================================
 *
 * PROMOTIONS :
 *
 * compareAtPrice > price
 *
 * ============================================================================
 *
 * CE COMPOSANT NE DOIT PAS :
 *
 * - importer Prisma ;
 * - interroger PostgreSQL ;
 * - inventer une catégorie ;
 * - inventer un prix ;
 * - inventer une promotion ;
 * - modifier le Panier ;
 * - modifier le stock ;
 * - créer une commande ;
 * - calculer lui-même les résultats ;
 * - créer une deuxième architecture de routes.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

interface PublicProductsFiltersFormProps {
  readonly idPrefix:
    string;

  readonly categories:
    PublicProductsCategoryFilterCollection;

  readonly priceBounds:
    PublicProductsPriceBounds;

  readonly activeFilters:
    PublicProductsActiveFilters;

  readonly onSubmit?:
    () => void;

  readonly onReset?:
    () => void;

  readonly mobile?:
    boolean;
}


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
   NOMBRE DE FILTRES ACTIFS
   ========================================================================== */

function getActiveFiltersCount(
  activeFilters:
    PublicProductsActiveFilters,
): number {
  let count =
    0;


  if (
    activeFilters.categorySlug
  ) {
    count +=
      1;
  }


  if (
    activeFilters.minimumPrice
  ) {
    count +=
      1;
  }


  if (
    activeFilters.maximumPrice
  ) {
    count +=
      1;
  }


  if (
    activeFilters.promotionOnly
  ) {
    count +=
      1;
  }


  return count;
}


/* ==========================================================================
   FORMATAGE SIMPLE D'UN MONTANT
   ========================================================================== */

/**
 * Ce helper est uniquement visuel.
 *
 * Il ne convertit aucune devise.
 * Il ne modifie aucune donnée commerciale.
 */
function formatBoundAmount(
  amount:
    string |
    null,
): string {
  if (
    !amount
  ) {
    return "";
  }


  const numericValue =
    Number(
      amount,
    );


  if (
    !Number.isFinite(
      numericValue,
    )
  ) {
    return amount;
  }


  return new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        2,
    },
  ).format(
    numericValue,
  );
}


/* ==========================================================================
   DISPONIBILITÉ DU FILTRE PRIX
   ========================================================================== */

function canRenderPriceFilter(
  priceBounds:
    PublicProductsPriceBounds,
): boolean {
  return Boolean(
    priceBounds.minimum &&
    priceBounds.maximum &&
    priceBounds.currency,
  );
}


/* ==========================================================================
   CLÉ DU FORMULAIRE
   --------------------------------------------------------------------------
   Les inputs sont volontairement non contrôlés.
   Cette clé permet de les réinitialiser proprement lorsque le serveur
   retourne de nouveaux filtres actifs après navigation.
   ========================================================================== */

function buildFilterFormKey(
  prefix:
    string,

  activeFilters:
    PublicProductsActiveFilters,
): string {
  return [
    prefix,
    activeFilters.categorySlug ??
      "",
    activeFilters.minimumPrice ??
      "",
    activeFilters.maximumPrice ??
      "",
    activeFilters.promotionOnly
      ? "promo"
      : "",
    activeFilters.sort,
  ].join(
    ":",
  );
}


/* ==========================================================================
   FORMULAIRE COMMUN
   ========================================================================== */

function PublicProductsFiltersForm({
  idPrefix,
  categories,
  priceBounds,
  activeFilters,
  onSubmit,
  onReset,
  mobile = false,
}: PublicProductsFiltersFormProps) {
  const config =
    PUBLIC_PRODUCTS_FILTERS_CONFIG;


  const hasPriceFilter =
    canRenderPriceFilter(
      priceBounds,
    );


  const formKey =
    buildFilterFormKey(
      idPrefix,
      activeFilters,
    );


  const minimumPriceId =
    `${idPrefix}-minimum-price`;


  const maximumPriceId =
    `${idPrefix}-maximum-price`;


  const promotionId =
    `${idPrefix}-promotion`;


  return (
    <form
      key={
        formKey
      }
      action={
        PUBLIC_PRODUCTS_ROUTE
      }
      method="get"
      className={
        joinClassNames(
          styles.productsFiltersForm,
          mobile &&
            styles.productsFiltersFormMobile,
        )
      }
      onSubmit={
        onSubmit
      }
    >
      {/* ==================================================================
          CONSERVATION DU TRI
          ------------------------------------------------------------------
          L'application d'un filtre ne doit pas supprimer le tri choisi.
          La page revient volontairement à la première page car aucun
          paramètre "page" n'est retransmis.
          ================================================================== */}

      {activeFilters.sort !==
      PUBLIC_PRODUCTS_SORT_CONFIG
        .defaultValue ? (
        <input
          type="hidden"
          name={
            PUBLIC_PRODUCTS_QUERY_PARAMETERS
              .sort
          }
          value={
            activeFilters.sort
          }
        />
      ) : null}


      {/* ==================================================================
          CATÉGORIES
          ================================================================== */}

      {config.category.enabled ? (
        <fieldset
          className={
            styles.productsFilterSection
          }
        >
          <legend
            className={
              styles.productsFilterLegend
            }
          >
            {
              config
                .category
                .label
            }
          </legend>


          <div
            className={
              styles.productsFilterChoices
            }
          >
            {/* ============================================================
                TOUTES LES CATÉGORIES
                ============================================================ */}

            <label
              htmlFor={
                `${idPrefix}-category-all`
              }
              className={
                styles.productsFilterChoice
              }
            >
              <span
                className={
                  styles.productsFilterChoiceControl
                }
              >
                <input
                  id={
                    `${idPrefix}-category-all`
                  }
                  className={
                    styles.productsFilterRadio
                  }
                  type="radio"
                  name={
                    PUBLIC_PRODUCTS_QUERY_PARAMETERS
                      .category
                  }
                  value=""
                  defaultChecked={
                    activeFilters.categorySlug ===
                    null
                  }
                />

                <span
                  className={
                    styles.productsFilterRadioVisual
                  }
                  aria-hidden="true"
                />
              </span>


              <span
                className={
                  styles.productsFilterChoiceContent
                }
              >
                <span
                  className={
                    styles.productsFilterChoiceLabel
                  }
                >
                  Toutes les catégories
                </span>
              </span>
            </label>


            {/* ============================================================
                CATÉGORIES RÉELLES
                ============================================================ */}

            {categories.map(
              (
                category,
              ) => {
                const inputId =
                  `${idPrefix}-category-${category.id}`;


                return (
                  <label
                    key={
                      category.id
                    }
                    htmlFor={
                      inputId
                    }
                    className={
                      styles.productsFilterChoice
                    }
                  >
                    <span
                      className={
                        styles.productsFilterChoiceControl
                      }
                    >
                      <input
                        id={
                          inputId
                        }
                        className={
                          styles.productsFilterRadio
                        }
                        type="radio"
                        name={
                          PUBLIC_PRODUCTS_QUERY_PARAMETERS
                            .category
                        }
                        value={
                          category.slug
                        }
                        defaultChecked={
                          activeFilters.categorySlug ===
                          category.slug
                        }
                      />

                      <span
                        className={
                          styles.productsFilterRadioVisual
                        }
                        aria-hidden="true"
                      />
                    </span>


                    <span
                      className={
                        styles.productsFilterChoiceContent
                      }
                    >
                      <span
                        className={
                          styles.productsFilterChoiceLabel
                        }
                      >
                        {
                          category.name
                        }
                      </span>


                      <span
                        className={
                          styles.productsFilterChoiceCount
                        }
                        aria-label={
                          `${category.availableOfferCount} offre${
                            category.availableOfferCount >
                            1
                              ? "s"
                              : ""
                          } disponible${
                            category.availableOfferCount >
                            1
                              ? "s"
                              : ""
                          }`
                        }
                      >
                        {
                          category.availableOfferCount
                        }
                      </span>
                    </span>
                  </label>
                );
              },
            )}
          </div>
        </fieldset>
      ) : null}


      {/* ==================================================================
          PRIX
          ================================================================== */}

      {config.price.enabled &&
      hasPriceFilter ? (
        <fieldset
          className={
            styles.productsFilterSection
          }
        >
          <legend
            className={
              styles.productsFilterLegend
            }
          >
            {
              config
                .price
                .label
            }
          </legend>


          <div
            className={
              styles.productsPriceBounds
            }
          >
            <span>
              {
                formatBoundAmount(
                  priceBounds.minimum,
                )
              }
            </span>

            <span
              aria-hidden="true"
            >
              —
            </span>

            <span>
              {
                formatBoundAmount(
                  priceBounds.maximum,
                )
              }{" "}
              {
                priceBounds.currency
              }
            </span>
          </div>


          <div
            className={
              styles.productsPriceFields
            }
          >
            {/* ============================================================
                PRIX MINIMUM
                ============================================================ */}

            <div
              className={
                styles.productsPriceField
              }
            >
              <label
                htmlFor={
                  minimumPriceId
                }
                className={
                  styles.productsPriceLabel
                }
              >
                Minimum
              </label>


              <div
                className={
                  styles.productsPriceInputWrapper
                }
              >
                <input
                  id={
                    minimumPriceId
                  }
                  className={
                    styles.productsPriceInput
                  }
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={
                    16
                  }
                  name={
                    PUBLIC_PRODUCTS_QUERY_PARAMETERS
                      .minPrice
                  }
                  defaultValue={
                    activeFilters.minimumPrice ??
                    ""
                  }
                  placeholder={
                    priceBounds.minimum ??
                    undefined
                  }
                  aria-describedby={
                    `${minimumPriceId}-currency`
                  }
                />

                <span
                  id={
                    `${minimumPriceId}-currency`
                  }
                  className={
                    styles.productsPriceCurrency
                  }
                >
                  {
                    priceBounds.currency
                  }
                </span>
              </div>
            </div>


            {/* ============================================================
                PRIX MAXIMUM
                ============================================================ */}

            <div
              className={
                styles.productsPriceField
              }
            >
              <label
                htmlFor={
                  maximumPriceId
                }
                className={
                  styles.productsPriceLabel
                }
              >
                Maximum
              </label>


              <div
                className={
                  styles.productsPriceInputWrapper
                }
              >
                <input
                  id={
                    maximumPriceId
                  }
                  className={
                    styles.productsPriceInput
                  }
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  maxLength={
                    16
                  }
                  name={
                    PUBLIC_PRODUCTS_QUERY_PARAMETERS
                      .maxPrice
                  }
                  defaultValue={
                    activeFilters.maximumPrice ??
                    ""
                  }
                  placeholder={
                    priceBounds.maximum ??
                    undefined
                  }
                  aria-describedby={
                    `${maximumPriceId}-currency`
                  }
                />

                <span
                  id={
                    `${maximumPriceId}-currency`
                  }
                  className={
                    styles.productsPriceCurrency
                  }
                >
                  {
                    priceBounds.currency
                  }
                </span>
              </div>
            </div>
          </div>
        </fieldset>
      ) : null}


      {/* ==================================================================
          PROMOTIONS
          ================================================================== */}

      {config.promotion.enabled ? (
        <fieldset
          className={
            styles.productsFilterSection
          }
        >
          <legend
            className={
              styles.productsFilterLegend
            }
          >
            {
              config
                .promotion
                .label
            }
          </legend>


          <label
            htmlFor={
              promotionId
            }
            className={
              styles.productsPromotionChoice
            }
          >
            <span
              className={
                styles.productsFilterChoiceControl
              }
            >
              <input
                id={
                  promotionId
                }
                className={
                  styles.productsFilterCheckbox
                }
                type="checkbox"
                name={
                  PUBLIC_PRODUCTS_QUERY_PARAMETERS
                    .promotion
                }
                value={
                  PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG
                    .activeValue
                }
                defaultChecked={
                  activeFilters.promotionOnly
                }
              />

              <span
                className={
                  styles.productsFilterCheckboxVisual
                }
                aria-hidden="true"
              />
            </span>


            <span
              className={
                styles.productsPromotionLabel
              }
            >
              Produits en promotion
            </span>
          </label>
        </fieldset>
      ) : null}


      {/* ==================================================================
          ACTIONS
          ================================================================== */}

      <div
        className={
          styles.productsFiltersActions
        }
      >
        <button
          type="submit"
          className={
            styles.productsFiltersApplyButton
          }
        >
          <Filter
            size={
              17
            }
            strokeWidth={
              2
            }
            aria-hidden="true"
          />

          <span>
            Appliquer les filtres
          </span>
        </button>


        <Link
          href={
            PUBLIC_PRODUCTS_ROUTE
          }
          className={
            styles.productsFiltersResetButton
          }
          onClick={
            onReset
          }
        >
          <RotateCcw
            size={
              15
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
          />

          <span>
            {
              config.resetLabel
            }
          </span>
        </Link>
      </div>
    </form>
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicProductsFilters({
  categories,
  priceBounds,
  activeFilters,
}: PublicProductsFiltersProps) {
  const [
    mobileFiltersOpen,
    setMobileFiltersOpen,
  ] =
    useState(
      false,
    );


  const activeFiltersCount =
    getActiveFiltersCount(
      activeFilters,
    );


  function openMobileFilters(): void {
    setMobileFiltersOpen(
      true,
    );
  }


  function closeMobileFilters(): void {
    setMobileFiltersOpen(
      false,
    );
  }


  function handleMobileKeyDown(
    event:
      React.KeyboardEvent<
        HTMLDivElement
      >,
  ): void {
    if (
      event.key ===
      "Escape"
    ) {
      closeMobileFilters();
    }
  }


  return (
    <div
      className={
        styles.productsFiltersRoot
      }
      data-public-products-filters="true"
    >
      {/* ==================================================================
          MOBILE — BOUTON D'OUVERTURE
          ================================================================== */}

      <div
        className={
          styles.productsFiltersMobileTriggerWrapper
        }
      >
        <button
          type="button"
          className={
            styles.productsFiltersMobileTrigger
          }
          onClick={
            openMobileFilters
          }
          aria-haspopup="dialog"
          aria-expanded={
            mobileFiltersOpen
          }
          aria-controls="public-products-mobile-filters"
        >
          <SlidersHorizontal
            size={
              18
            }
            strokeWidth={
              2
            }
            aria-hidden="true"
          />

          <span>
            {
              PUBLIC_PRODUCTS_FILTERS_CONFIG
                .title
            }
          </span>


          {activeFiltersCount >
          0 ? (
            <span
              className={
                styles.productsFiltersActiveBadge
              }
              aria-label={
                `${activeFiltersCount} filtre${
                  activeFiltersCount >
                  1
                    ? "s"
                    : ""
                } actif${
                  activeFiltersCount >
                  1
                    ? "s"
                    : ""
                }`
              }
            >
              {
                activeFiltersCount
              }
            </span>
          ) : null}
        </button>
      </div>


      {/* ==================================================================
          DESKTOP — SIDEBAR
          ================================================================== */}

      <aside
        className={
          styles.productsFiltersDesktop
        }
        aria-label={
          PUBLIC_PRODUCTS_FILTERS_CONFIG
            .title
        }
      >
        <header
          className={
            styles.productsFiltersHeader
          }
        >
          <div
            className={
              styles.productsFiltersHeaderTitle
            }
          >
            <SlidersHorizontal
              size={
                19
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <h2
              className={
                styles.productsFiltersTitle
              }
            >
              {
                PUBLIC_PRODUCTS_FILTERS_CONFIG
                  .title
              }
            </h2>
          </div>


          {activeFiltersCount >
          0 ? (
            <span
              className={
                styles.productsFiltersHeaderCount
              }
            >
              {
                activeFiltersCount
              }
            </span>
          ) : null}
        </header>


        <PublicProductsFiltersForm
          idPrefix="desktop-products-filter"
          categories={
            categories
          }
          priceBounds={
            priceBounds
          }
          activeFilters={
            activeFilters
          }
        />
      </aside>


      {/* ==================================================================
          MOBILE — DRAWER
          ================================================================== */}

      {mobileFiltersOpen ? (
        <div
          id="public-products-mobile-filters"
          className={
            styles.productsFiltersMobileLayer
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-products-mobile-filters-title"
          onKeyDown={
            handleMobileKeyDown
          }
          tabIndex={
            -1
          }
        >
          {/* ================================================================
              BACKDROP
              ================================================================ */}

          <button
            type="button"
            className={
              styles.productsFiltersBackdrop
            }
            onClick={
              closeMobileFilters
            }
            aria-label="Fermer les filtres"
          />


          {/* ================================================================
              PANNEAU
              ================================================================ */}

          <div
            className={
              styles.productsFiltersDrawer
            }
          >
            <header
              className={
                styles.productsFiltersDrawerHeader
              }
            >
              <div
                className={
                  styles.productsFiltersDrawerHeading
                }
              >
                <span
                  className={
                    styles.productsFiltersDrawerIcon
                  }
                  aria-hidden="true"
                >
                  <SlidersHorizontal
                    size={
                      19
                    }
                    strokeWidth={
                      1.9
                    }
                  />
                </span>


                <div>
                  <h2
                    id="public-products-mobile-filters-title"
                    className={
                      styles.productsFiltersDrawerTitle
                    }
                  >
                    {
                      PUBLIC_PRODUCTS_FILTERS_CONFIG
                        .title
                    }
                  </h2>


                  {activeFiltersCount >
                  0 ? (
                    <p
                      className={
                        styles.productsFiltersDrawerSubtitle
                      }
                    >
                      {
                        activeFiltersCount
                      }{" "}
                      filtre
                      {
                        activeFiltersCount >
                        1
                          ? "s"
                          : ""
                      }{" "}
                      actif
                      {
                        activeFiltersCount >
                        1
                          ? "s"
                          : ""
                      }
                    </p>
                  ) : null}
                </div>
              </div>


              <button
                type="button"
                className={
                  styles.productsFiltersDrawerClose
                }
                onClick={
                  closeMobileFilters
                }
                aria-label="Fermer"
              >
                <X
                  size={
                    22
                  }
                  strokeWidth={
                    1.8
                  }
                  aria-hidden="true"
                />
              </button>
            </header>


            <div
              className={
                styles.productsFiltersDrawerBody
              }
            >
              <PublicProductsFiltersForm
                idPrefix="mobile-products-filter"
                categories={
                  categories
                }
                priceBounds={
                  priceBounds
                }
                activeFilters={
                  activeFilters
                }
                mobile
                onSubmit={
                  closeMobileFilters
                }
                onReset={
                  closeMobileFilters
                }
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}