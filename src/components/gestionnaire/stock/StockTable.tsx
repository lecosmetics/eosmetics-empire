import Image from "next/image";
import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import {
  getManagerStockStatusLabel,
  type ManagerStockFilters,
  type ManagerStockItem,
  type ManagerStockPagination,
  type ManagerStockStatus,
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
 * src/components/gestionnaire/stock/StockTable.tsx
 *
 * RÔLE :
 *
 * Afficher les stocks réels de la boutique connectée.
 *
 * VERSION PC :
 *
 * - tableau complet ;
 * - pagination serveur.
 *
 * VERSION MOBILE :
 *
 * - cartes adaptées ;
 * - mêmes vraies données ;
 * - même pagination.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne recalcule pas les quantités ;
 * - ne recalcule pas les statuts ;
 * - ne contient aucun produit fictif ;
 * - ne contient aucun montant fictif ;
 * - ne modifie aucun stock.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

const STOCK_ROUTE =
  routes.gestionnaire.stock;


const PRODUCTS_ROUTE =
  routes.gestionnaire.products;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface StockTableProps {
  readonly items:
    readonly ManagerStockItem[];

  readonly filters:
    ManagerStockFilters;

  readonly pagination:
    ManagerStockPagination;
}


/* ==========================================================================
   ROUTE DÉTAIL PRODUIT
   ========================================================================== */

function buildProductDetailHref(
  productId:
    string,
): string {
  return `${PRODUCTS_ROUTE}/${encodeURIComponent(
    productId,
  )}`;
}


/* ==========================================================================
   ROUTE PAGINATION
   ========================================================================== */

function buildStockPageHref(
  page:
    number,

  filters:
    ManagerStockFilters,
): string {
  const searchParams =
    new URLSearchParams();


  const search =
    filters.q.trim();


  const category =
    filters.category.trim();


  if (
    search
  ) {
    searchParams.set(
      "q",
      search,
    );
  }


  if (
    category
  ) {
    searchParams.set(
      "category",
      category,
    );
  }


  if (
    filters.status !==
    "all"
  ) {
    searchParams.set(
      "status",
      filters.status,
    );
  }


  if (
    page >
    1
  ) {
    searchParams.set(
      "page",
      String(
        page,
      ),
    );
  }


  const query =
    searchParams.toString();


  return query
    ? `${STOCK_ROUTE}?${query}`
    : STOCK_ROUTE;
}


/* ==========================================================================
   FORMAT ENTIER
   ========================================================================== */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function formatInteger(
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


  return INTEGER_FORMATTER.format(
    Math.max(
      0,
      Math.trunc(
        value,
      ),
    ),
  );
}


/* ==========================================================================
   FORMAT MONTANT
   ========================================================================== */

/**
 * Les montants arrivent sous forme de chaînes décimales depuis stock-query.ts.
 *
 * Exemple :
 *
 * "125000.00"
 *
 * On évite volontairement de convertir ces valeurs avec Number()
 * afin de ne pas perdre inutilement la précision des Decimal Prisma.
 */

function formatDecimalAmount(
  value:
    string,
): string | null {
  const normalized =
    value.trim();


  const match =
    /^(-?)(\d+)(?:\.(\d+))?$/.exec(
      normalized,
    );


  if (
    !match
  ) {
    return null;
  }


  const sign =
    match[1] ?? "";


  const integerPart =
    (
      match[2] ??
      "0"
    ).replace(
      /^0+(?=\d)/,
      "",
    );


  const decimalPart =
    (
      match[3] ??
      ""
    ).replace(
      /0+$/,
      "",
    );


  const groupedInteger =
    integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "\u202F",
    );


  if (
    !decimalPart
  ) {
    return `${sign}${groupedInteger}`;
  }


  return `${sign}${groupedInteger},${decimalPart}`;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function formatMoney(
  amount:
    string,

  currency:
    string,
): string {
  const formattedAmount =
    formatDecimalAmount(
      amount,
    );


  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();


  if (
    !formattedAmount
  ) {
    return "—";
  }


  if (
    !normalizedCurrency
  ) {
    return formattedAmount;
  }


  return `${formattedAmount} ${normalizedCurrency}`;
}


/* ==========================================================================
   DATE
   ========================================================================== */

/**
 * updatedAt est fourni sous forme ISO par stock-query.ts.
 *
 * Pour garder un rendu déterministe entre serveur et client, on formate
 * explicitement la valeur ISO en UTC.
 *
 * Si l'application définit plus tard un fuseau horaire métier global,
 * il suffira de centraliser ce formatage dans l'utilitaire prévu à cet effet.
 */

const STOCK_DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  );


const STOCK_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        "UTC",
    },
  );


interface FormattedStockDate {
  readonly date:
    string;

  readonly time:
    string;
}


function formatStockDate(
  value:
    string,
): FormattedStockDate | null {
  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }


  return {
    date:
      STOCK_DATE_FORMATTER.format(
        date,
      ),

    time:
      STOCK_TIME_FORMATTER.format(
        date,
      ),
  };
}


/* ==========================================================================
   STATUS CLASS
   ========================================================================== */

function getStockStatusClassName(
  status:
    ManagerStockStatus,
): string {
  switch (
    status
  ) {
    case "IN_STOCK":
      return [
        styles.stockStatusBadge,
        styles.stockStatusInStock,
      ].join(
        " ",
      );

    case "LOW_STOCK":
      return [
        styles.stockStatusBadge,
        styles.stockStatusLow,
      ].join(
        " ",
      );

    case "OUT_OF_STOCK":
      return [
        styles.stockStatusBadge,
        styles.stockStatusOut,
      ].join(
        " ",
      );
  }
}


/* ==========================================================================
   IMAGE PRODUIT
   ========================================================================== */

interface StockProductImageProps {
  readonly item:
    ManagerStockItem;

  readonly priority?:
    boolean;
}


function StockProductImage({
  item,
  priority = false,
}: StockProductImageProps) {
  if (
    !item.image
  ) {
    return (
      <div
        className={
          styles.stockProductImagePlaceholder
        }
        aria-hidden="true"
      >
        <ImageOff
          size={20}
          strokeWidth={1.7}
        />
      </div>
    );
  }


  return (
    <div
      className={
        styles.stockProductImage
      }
    >
      <Image
        src={
          item.image.url
        }
        alt={
          item.image.altText?.trim() ||
          item.name
        }
        fill
        sizes="56px"
        priority={
          priority
        }
        className={
          styles.stockProductImageMedia
        }
      />
    </div>
  );
}


/* ==========================================================================
   STATUT
   ========================================================================== */

function StockStatusBadge({
  status,
}: {
  readonly status:
    ManagerStockStatus;
}) {
  return (
    <span
      className={
        getStockStatusClassName(
          status,
        )
      }
    >
      <span
        className={
          styles.stockStatusDot
        }
        aria-hidden="true"
      />

      {getManagerStockStatusLabel(
        status,
      )}
    </span>
  );
}


/* ==========================================================================
   DERNIÈRE MISE À JOUR
   ========================================================================== */

function StockUpdatedAt({
  value,
}: {
  readonly value:
    string;
}) {
  const formatted =
    formatStockDate(
      value,
    );


  if (
    !formatted
  ) {
    return (
      <span>
        —
      </span>
    );
  }


  return (
    <time
      dateTime={
        value
      }
      className={
        styles.stockUpdatedAt
      }
    >
      <span>
        {formatted.date}
      </span>

      <span>
        {formatted.time}
      </span>
    </time>
  );
}


/* ==========================================================================
   PAGINATION — TYPES
   ========================================================================== */

type StockPaginationEntry =
  | number
  | "ellipsis-start"
  | "ellipsis-end";


/* ==========================================================================
   PAGINATION — ENTRÉES
   ========================================================================== */

function buildPaginationEntries(
  page:
    number,

  totalPages:
    number,
): readonly StockPaginationEntry[] {
  if (
    totalPages <=
    1
  ) {
    return [];
  }


  if (
    totalPages <=
    7
  ) {
    return Array.from(
      {
        length:
          totalPages,
      },
      (
        _value,
        index,
      ) =>
        index +
        1,
    );
  }


  const entries:
    StockPaginationEntry[] =
      [];


  entries.push(
    1,
  );


  const start =
    Math.max(
      2,
      page -
        1,
    );


  const end =
    Math.min(
      totalPages -
        1,
      page +
        1,
    );


  if (
    start >
    2
  ) {
    entries.push(
      "ellipsis-start",
    );
  }


  for (
    let currentPage =
      start;
    currentPage <=
    end;
    currentPage +=
    1
  ) {
    entries.push(
      currentPage,
    );
  }


  if (
    end <
    totalPages -
      1
  ) {
    entries.push(
      "ellipsis-end",
    );
  }


  entries.push(
    totalPages,
  );


  return entries;
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

interface StockPaginationProps {
  readonly filters:
    ManagerStockFilters;

  readonly pagination:
    ManagerStockPagination;
}


function StockPagination({
  filters,
  pagination,
}: StockPaginationProps) {
  if (
    pagination.totalPages <=
    1
  ) {
    return null;
  }


  const entries =
    buildPaginationEntries(
      pagination.page,
      pagination.totalPages,
    );


  return (
    <nav
      className={
        styles.stockPagination
      }
      aria-label="Pagination des stocks"
    >
      {/* -------------------------------------------------------------------
          PRÉCÉDENT
          ------------------------------------------------------------------- */}

      {pagination.hasPreviousPage ? (
        <Link
          href={
            buildStockPageHref(
              pagination.page -
                1,
              filters,
            )
          }
          className={
            styles.stockPaginationArrow
          }
          aria-label="Page précédente"
        >
          <ChevronLeft
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span
          className={[
            styles.stockPaginationArrow,
            styles.stockPaginationDisabled,
          ].join(
            " ",
          )}
          aria-disabled="true"
        >
          <ChevronLeft
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </span>
      )}


      {/* -------------------------------------------------------------------
          PAGES
          ------------------------------------------------------------------- */}

      <div
        className={
          styles.stockPaginationPages
        }
      >
        {entries.map(
          (
            entry,
          ) => {
            if (
              entry ===
              "ellipsis-start" ||
              entry ===
              "ellipsis-end"
            ) {
              return (
                <span
                  key={
                    entry
                  }
                  className={
                    styles.stockPaginationEllipsis
                  }
                  aria-hidden="true"
                >
                  …
                </span>
              );
            }


            if (
              entry ===
              pagination.page
            ) {
              return (
                <span
                  key={
                    entry
                  }
                  className={[
                    styles.stockPaginationPage,
                    styles.stockPaginationPageActive,
                  ].join(
                    " ",
                  )}
                  aria-current="page"
                >
                  {entry}
                </span>
              );
            }


            return (
              <Link
                key={
                  entry
                }
                href={
                  buildStockPageHref(
                    entry,
                    filters,
                  )
                }
                className={
                  styles.stockPaginationPage
                }
                aria-label={`Aller à la page ${entry}`}
              >
                {entry}
              </Link>
            );
          },
        )}
      </div>


      {/* -------------------------------------------------------------------
          SUIVANT
          ------------------------------------------------------------------- */}

      {pagination.hasNextPage ? (
        <Link
          href={
            buildStockPageHref(
              pagination.page +
                1,
              filters,
            )
          }
          className={
            styles.stockPaginationArrow
          }
          aria-label="Page suivante"
        >
          <ChevronRight
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span
          className={[
            styles.stockPaginationArrow,
            styles.stockPaginationDisabled,
          ].join(
            " ",
          )}
          aria-disabled="true"
        >
          <ChevronRight
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </span>
      )}
    </nav>
  );
}


/* ==========================================================================
   TABLEAU DESKTOP
   ========================================================================== */

interface DesktopStockTableProps {
  readonly items:
    readonly ManagerStockItem[];

  readonly pagination:
    ManagerStockPagination;
}


function DesktopStockTable({
  items,
  pagination,
}: DesktopStockTableProps) {
  return (
    <div
      className={
        styles.stockDesktopTable
      }
    >
      <div
        className={
          styles.stockTableScroll
        }
      >
        <table
          className={
            styles.stockTable
          }
        >
          <caption
            className={
              styles.stockVisuallyHidden
            }
          >
            Liste des stocks produits de la boutique
          </caption>


          <thead>
            <tr>
              <th
                scope="col"
                className={
                  styles.stockTableSelectionColumn
                }
              >
                <span
                  className={
                    styles.stockVisuallyHidden
                  }
                >
                  Sélection
                </span>
              </th>

              <th scope="col">
                #
              </th>

              <th scope="col">
                Image
              </th>

              <th scope="col">
                Produit
              </th>

              <th scope="col">
                Catégorie
              </th>

              <th scope="col">
                SKU / Référence
              </th>

              <th scope="col">
                Stock actuel
              </th>

              <th scope="col">
                Seuil d’alerte
              </th>

              <th scope="col">
                Statut
              </th>

              <th scope="col">
                Valeur estimée
              </th>

              <th scope="col">
                Dernière mise à jour
              </th>

              <th
                scope="col"
                className={
                  styles.stockTableActionsColumn
                }
              >
                Actions
              </th>
            </tr>
          </thead>


          <tbody>
            {items.map(
              (
                item,
                index,
              ) => {
                const rowNumber =
                  pagination.startItem +
                  index;


                return (
                  <tr
                    key={
                      item.storeProductId
                    }
                  >
                    {/* =====================================================
                        SÉLECTION
                        ===================================================== */}

                    <td>
                      <input
                        type="checkbox"
                        className={
                          styles.stockRowCheckbox
                        }
                        aria-label={`Sélectionner ${item.name}`}
                      />
                    </td>


                    {/* =====================================================
                        #
                        ===================================================== */}

                    <td
                      className={
                        styles.stockRowNumber
                      }
                    >
                      {formatInteger(
                        rowNumber,
                      )}
                    </td>


                    {/* =====================================================
                        IMAGE
                        ===================================================== */}

                    <td>
                      <StockProductImage
                        item={
                          item
                        }
                        priority={
                          index <
                          3
                        }
                      />
                    </td>


                    {/* =====================================================
                        PRODUIT
                        ===================================================== */}

                    <td>
                      <div
                        className={
                          styles.stockProductIdentity
                        }
                      >
                        <strong
                          className={
                            styles.stockProductName
                          }
                        >
                          {item.name}
                        </strong>
                      </div>
                    </td>


                    {/* =====================================================
                        CATÉGORIE
                        ===================================================== */}

                    <td>
                      {item.category ? (
                        <span
                          className={
                            styles.stockCategoryBadge
                          }
                        >
                          {item.category.name}
                        </span>
                      ) : (
                        <span
                          className={
                            styles.stockMutedValue
                          }
                        >
                          —
                        </span>
                      )}
                    </td>


                    {/* =====================================================
                        SKU
                        ===================================================== */}

                    <td>
                      <span
                        className={
                          styles.stockSku
                        }
                      >
                        {item.sku}
                      </span>
                    </td>


                    {/* =====================================================
                        STOCK ACTUEL
                        ===================================================== */}

                    <td>
                      <strong
                        className={
                          item.stockStatus ===
                          "OUT_OF_STOCK"
                            ? styles.stockQuantityDanger
                            : item.stockStatus ===
                                "LOW_STOCK"
                              ? styles.stockQuantityWarning
                              : styles.stockQuantity
                        }
                      >
                        {formatInteger(
                          item.stockQuantity,
                        )}
                      </strong>
                    </td>


                    {/* =====================================================
                        SEUIL
                        ===================================================== */}

                    <td>
                      {formatInteger(
                        item.lowStockThreshold,
                      )}
                    </td>


                    {/* =====================================================
                        STATUT
                        ===================================================== */}

                    <td>
                      <StockStatusBadge
                        status={
                          item.stockStatus
                        }
                      />
                    </td>


                    {/* =====================================================
                        VALEUR
                        ===================================================== */}

                    <td>
                      <span
                        className={
                          styles.stockEstimatedValue
                        }
                      >
                        {formatMoney(
                          item.estimatedValue.amount,
                          item.estimatedValue.currency,
                        )}
                      </span>
                    </td>


                    {/* =====================================================
                        MISE À JOUR
                        ===================================================== */}

                    <td>
                      <StockUpdatedAt
                        value={
                          item.updatedAt
                        }
                      />
                    </td>


                    {/* =====================================================
                        ACTION
                        ===================================================== */}

                    <td>
                      <Link
                        href={
                          buildProductDetailHref(
                            item.productId,
                          )
                        }
                        className={
                          styles.stockViewButton
                        }
                        aria-label={`Voir le produit ${item.name}`}
                      >
                        <Eye
                          size={16}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />

                        <span>
                          Voir
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


/* ==========================================================================
   MOBILE
   ========================================================================== */

interface MobileStockListProps {
  readonly items:
    readonly ManagerStockItem[];

  readonly pagination:
    ManagerStockPagination;
}


function MobileStockList({
  items,
  pagination,
}: MobileStockListProps) {
  return (
    <div
      className={
        styles.stockMobileList
      }
    >
      {items.map(
        (
          item,
          index,
        ) => {
          const rowNumber =
            pagination.startItem +
            index;


          return (
            <article
              key={
                item.storeProductId
              }
              className={
                styles.stockMobileCard
              }
            >
              {/* ===========================================================
                  HAUT CARTE
                  =========================================================== */}

              <div
                className={
                  styles.stockMobileCardHeader
                }
              >
                <StockProductImage
                  item={
                    item
                  }
                  priority={
                    index <
                    2
                  }
                />


                <div
                  className={
                    styles.stockMobileProductContent
                  }
                >
                  <span
                    className={
                      styles.stockMobileIndex
                    }
                  >
                    Produit #{formatInteger(
                      rowNumber,
                    )}
                  </span>


                  <h3
                    className={
                      styles.stockMobileProductName
                    }
                  >
                    {item.name}
                  </h3>


                  <span
                    className={
                      styles.stockSku
                    }
                  >
                    {item.sku}
                  </span>
                </div>


                <StockStatusBadge
                  status={
                    item.stockStatus
                  }
                />
              </div>


              {/* ===========================================================
                  CATÉGORIE
                  =========================================================== */}

              {item.category ? (
                <div
                  className={
                    styles.stockMobileCategory
                  }
                >
                  <span>
                    Catégorie
                  </span>

                  <strong>
                    {item.category.name}
                  </strong>
                </div>
              ) : null}


              {/* ===========================================================
                  INFORMATIONS
                  =========================================================== */}

              <dl
                className={
                  styles.stockMobileDetails
                }
              >
                <div
                  className={
                    styles.stockMobileDetail
                  }
                >
                  <dt>
                    Stock actuel
                  </dt>

                  <dd>
                    {formatInteger(
                      item.stockQuantity,
                    )}
                  </dd>
                </div>


                <div
                  className={
                    styles.stockMobileDetail
                  }
                >
                  <dt>
                    Seuil d’alerte
                  </dt>

                  <dd>
                    {formatInteger(
                      item.lowStockThreshold,
                    )}
                  </dd>
                </div>


                <div
                  className={
                    styles.stockMobileDetail
                  }
                >
                  <dt>
                    Valeur estimée
                  </dt>

                  <dd>
                    {formatMoney(
                      item.estimatedValue.amount,
                      item.estimatedValue.currency,
                    )}
                  </dd>
                </div>


                <div
                  className={
                    styles.stockMobileDetail
                  }
                >
                  <dt>
                    Mise à jour
                  </dt>

                  <dd>
                    <StockUpdatedAt
                      value={
                        item.updatedAt
                      }
                    />
                  </dd>
                </div>
              </dl>


              {/* ===========================================================
                  ACTION
                  =========================================================== */}

              <Link
                href={
                  buildProductDetailHref(
                    item.productId,
                  )
                }
                className={
                  styles.stockMobileViewButton
                }
                aria-label={`Voir le produit ${item.name}`}
              >
                <Eye
                  size={17}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>
                  Voir
                </span>
              </Link>
            </article>
          );
        },
      )}
    </div>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function StockTable({
  items,
  filters,
  pagination,
}: StockTableProps) {
  if (
    items.length ===
    0
  ) {
    return null;
  }


  return (
    <section
      className={
        styles.stockListSection
      }
      aria-labelledby="stock-list-title"
    >
      {/* ===================================================================
          TITRE
          =================================================================== */}

      <div
        className={
          styles.stockListHeader
        }
      >
        <div>
          <h2
            id="stock-list-title"
            className={
              styles.stockListTitle
            }
          >
            Liste des stocks
          </h2>
        </div>
      </div>


      {/* ===================================================================
          DESKTOP
          =================================================================== */}

      <DesktopStockTable
        items={
          items
        }
        pagination={
          pagination
        }
      />


      {/* ===================================================================
          MOBILE
          =================================================================== */}

      <MobileStockList
        items={
          items
        }
        pagination={
          pagination
        }
      />


      {/* ===================================================================
          BAS DE TABLEAU
          =================================================================== */}

      <div
        className={
          styles.stockTableFooter
        }
      >
        <p
          className={
            styles.stockPaginationSummary
          }
        >
          Affichage de{" "}
          <strong>
            {formatInteger(
              pagination.startItem,
            )}
          </strong>{" "}
          à{" "}
          <strong>
            {formatInteger(
              pagination.endItem,
            )}
          </strong>{" "}
          sur{" "}
          <strong>
            {formatInteger(
              pagination.totalItems,
            )}
          </strong>{" "}
          {pagination.totalItems >
          1
            ? "produits"
            : "produit"}
        </p>


        <StockPagination
          filters={
            filters
          }
          pagination={
            pagination
          }
        />
      </div>
    </section>
  );
}