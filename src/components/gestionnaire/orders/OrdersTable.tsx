import Image from "next/image";
import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  ImageOff,
} from "lucide-react";

import {
  getManagerOrderStatusLabel,
  getManagerPaymentMethodLabel,
  getManagerPaymentStatusLabel,
  getManagerShipmentStatusLabel,
  type ManagerOrderListItem,
  type ManagerOrderStatus,
  type ManagerOrdersFilters,
  type ManagerOrdersPagination,
  type ManagerPaymentStatus,
  type ManagerShipmentStatus,
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
 * src/components/gestionnaire/orders/OrdersTable.tsx
 *
 * RÔLE :
 *
 * Afficher la liste réelle des commandes de la boutique autorisée.
 *
 * COLONNES :
 *
 * - Sélection
 * - #
 * - Commande
 * - Cliente
 * - Produits
 * - Montant
 * - Paiement
 * - Statut
 * - Livraison
 * - Date
 * - Actions
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne contient aucune fausse commande ;
 * - ne calcule aucun statut métier ;
 * - ne modifie aucune commande ;
 * - n'ajoute aucune action Modifier / Supprimer ;
 * - utilise uniquement les données préparées côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const ORDERS_ROUTE =
  "/gestionnaire/commandes";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface OrdersTableProps {
  readonly items:
    readonly ManagerOrderListItem[];

  readonly filters:
    ManagerOrdersFilters;

  readonly pagination:
    ManagerOrdersPagination;
}


/* ==========================================================================
   ROUTE DÉTAIL
   ========================================================================== */

function buildOrderDetailHref(
  orderId:
    string,
): string {
  return `${ORDERS_ROUTE}/${encodeURIComponent(
    orderId,
  )}`;
}


/* ==========================================================================
   PAGINATION — URL
   ========================================================================== */

function buildOrdersPageHref(
  page:
    number,

  filters:
    ManagerOrdersFilters,
): string {
  const params =
    new URLSearchParams();


  if (
    filters.dateFrom
  ) {
    params.set(
      "dateFrom",
      filters.dateFrom,
    );
  }


  if (
    filters.dateTo
  ) {
    params.set(
      "dateTo",
      filters.dateTo,
    );
  }


  const search =
    filters.q.trim();


  if (
    search
  ) {
    params.set(
      "q",
      search,
    );
  }


  if (
    filters.tab !==
    "all"
  ) {
    params.set(
      "tab",
      filters.tab,
    );
  }


  if (
    filters.status !==
    "all"
  ) {
    params.set(
      "status",
      filters.status,
    );
  }


  if (
    filters.paymentMethod !==
    "all"
  ) {
    params.set(
      "paymentMethod",
      filters.paymentMethod,
    );
  }


  const city =
    filters.city.trim();


  if (
    city
  ) {
    params.set(
      "city",
      city,
    );
  }


  if (
    page >
    1
  ) {
    params.set(
      "page",
      String(
        page,
      ),
    );
  }


  const query =
    params.toString();


  return query
    ? `${ORDERS_ROUTE}?${query}`
    : ORDERS_ROUTE;
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
   FORMAT DECIMAL
   ========================================================================== */

/**
 * Les montants viennent de Prisma Decimal sous forme de chaîne.
 *
 * On évite une conversion systématique avec Number() afin de ne pas
 * perdre inutilement de précision.
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


  const rawInteger =
    match[2] ?? "0";


  const rawDecimals =
    match[3] ?? "";


  const integerPart =
    rawInteger.replace(
      /^0+(?=\d)/,
      "",
    );


  const groupedInteger =
    integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "\u202F",
    );


  const decimals =
    rawDecimals.replace(
      /0+$/,
      "",
    );


  if (
    !decimals
  ) {
    return `${sign}${groupedInteger}`;
  }


  return `${sign}${groupedInteger},${decimals}`;
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
 * Le modèle Store actuel ne possède pas de timezone métier officielle.
 *
 * On utilise donc UTC de façon déterministe au lieu d'inventer un fuseau
 * horaire à partir de la ville de la boutique.
 */

const ORDER_DATE_FORMATTER =
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


const ORDER_TIME_FORMATTER =
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


interface FormattedOrderDate {
  readonly date:
    string;

  readonly time:
    string;
}


function formatOrderDate(
  value:
    string,
): FormattedOrderDate | null {
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
      ORDER_DATE_FORMATTER.format(
        date,
      ),

    time:
      ORDER_TIME_FORMATTER.format(
        date,
      ),
  };
}


/* ==========================================================================
   CLIENTE
   ========================================================================== */

function getCustomerName(
  item:
    ManagerOrderListItem,
): string {
  const name =
    [
      item.customer.firstName,
      item.customer.lastName,
    ]
      .map(
        (
          value,
        ) =>
          value.trim(),
      )
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  return name ||
    "—";
}


/* ==========================================================================
   ARTICLES
   ========================================================================== */

function getArticlesLabel(
  totalItems:
    number,
): string {
  const normalized =
    Number.isFinite(
      totalItems,
    )
      ? Math.max(
          0,
          Math.trunc(
            totalItems,
          ),
        )
      : 0;


  return `${formatInteger(
    normalized,
  )} ${
    normalized >
    1
      ? "articles"
      : "article"
  }`;
}


/* ==========================================================================
   IMAGE PRODUIT
   ========================================================================== */

interface OrderProductImageProps {
  readonly item:
    ManagerOrderListItem["productPreviews"][number];
}


function OrderProductImage({
  item,
}: OrderProductImageProps) {
  if (
    !item.image
  ) {
    return (
      <span
        className={
          styles.ordersProductImagePlaceholder
        }
        aria-hidden="true"
      >
        <ImageOff
          size={17}
          strokeWidth={1.7}
        />
      </span>
    );
  }


  return (
    <span
      className={
        styles.ordersProductImage
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
        sizes="38px"
        className={
          styles.ordersProductImageMedia
        }
      />
    </span>
  );
}


/* ==========================================================================
   APERÇU PRODUITS
   ========================================================================== */

function OrderProductsPreview({
  item,
}: {
  readonly item:
    ManagerOrderListItem;
}) {
  return (
    <div
      className={
        styles.ordersProductsCell
      }
    >
      {item.productPreviews.length >
      0 ? (
        <div
          className={
            styles.ordersProductImages
          }
          aria-label="Aperçu des produits"
        >
          {item.productPreviews.map(
            (
              product,
            ) => (
              <OrderProductImage
                key={
                  product.orderItemId
                }
                item={
                  product
                }
              />
            ),
          )}
        </div>
      ) : (
        <div
          className={
            styles.ordersProductImages
          }
          aria-hidden="true"
        >
          <span
            className={
              styles.ordersProductImagePlaceholder
            }
          >
            <ImageOff
              size={17}
              strokeWidth={1.7}
            />
          </span>
        </div>
      )}


      <span
        className={
          styles.ordersArticlesCount
        }
      >
        {getArticlesLabel(
          item.totalItems,
        )}
      </span>
    </div>
  );
}


/* ==========================================================================
   ORDER STATUS — CLASS
   ========================================================================== */

function getOrderStatusClassName(
  status:
    ManagerOrderStatus,
): string {
  const base =
    styles.ordersBadge;


  switch (
    status
  ) {
    case "PENDING":
      return `${base} ${styles.ordersBadgePending}`;

    case "CONFIRMED":
      return `${base} ${styles.ordersBadgeConfirmed}`;

    case "PROCESSING":
      return `${base} ${styles.ordersBadgeProcessing}`;

    case "READY":
      return `${base} ${styles.ordersBadgeReady}`;

    case "SHIPPED":
      return `${base} ${styles.ordersBadgeShipped}`;

    case "DELIVERED":
      return `${base} ${styles.ordersBadgeDelivered}`;

    case "CANCELLED":
      return `${base} ${styles.ordersBadgeCancelled}`;

    case "REFUNDED":
      return `${base} ${styles.ordersBadgeRefunded}`;
  }
}


/* ==========================================================================
   PAYMENT STATUS — CLASS
   ========================================================================== */

function getPaymentStatusClassName(
  status:
    ManagerPaymentStatus,
): string {
  const base =
    styles.ordersPaymentBadge;


  switch (
    status
  ) {
    case "PENDING":
      return `${base} ${styles.ordersPaymentPending}`;

    case "PROCESSING":
      return `${base} ${styles.ordersPaymentProcessing}`;

    case "PAID":
      return `${base} ${styles.ordersPaymentPaid}`;

    case "FAILED":
      return `${base} ${styles.ordersPaymentFailed}`;

    case "CANCELLED":
      return `${base} ${styles.ordersPaymentCancelled}`;

    case "REFUNDED":
      return `${base} ${styles.ordersPaymentRefunded}`;

    case "PARTIALLY_REFUNDED":
      return `${base} ${styles.ordersPaymentPartiallyRefunded}`;
  }
}


/* ==========================================================================
   SHIPMENT STATUS — CLASS
   ========================================================================== */

function getShipmentStatusClassName(
  status:
    ManagerShipmentStatus,
): string {
  const base =
    styles.ordersDeliveryBadge;


  switch (
    status
  ) {
    case "PENDING":
      return `${base} ${styles.ordersDeliveryPending}`;

    case "PREPARING":
      return `${base} ${styles.ordersDeliveryPreparing}`;

    case "SHIPPED":
      return `${base} ${styles.ordersDeliveryShipped}`;

    case "IN_TRANSIT":
      return `${base} ${styles.ordersDeliveryTransit}`;

    case "DELIVERED":
      return `${base} ${styles.ordersDeliveryDelivered}`;

    case "FAILED":
      return `${base} ${styles.ordersDeliveryFailed}`;

    case "RETURNED":
      return `${base} ${styles.ordersDeliveryReturned}`;

    case "CANCELLED":
      return `${base} ${styles.ordersDeliveryCancelled}`;
  }
}


/* ==========================================================================
   ORDER STATUS
   ========================================================================== */

function OrderStatusBadge({
  status,
}: {
  readonly status:
    ManagerOrderStatus;
}) {
  return (
    <span
      className={
        getOrderStatusClassName(
          status,
        )
      }
    >
      {getManagerOrderStatusLabel(
        status,
      )}
    </span>
  );
}


/* ==========================================================================
   PAIEMENT
   ========================================================================== */

function OrderPayment({
  item,
}: {
  readonly item:
    ManagerOrderListItem;
}) {
  const payment =
    item.payment;


  if (
    !payment
  ) {
    return (
      <span
        className={
          styles.ordersMutedValue
        }
      >
        —
      </span>
    );
  }


  return (
    <div
      className={
        styles.ordersPaymentCell
      }
    >
      <span
        className={
          getPaymentStatusClassName(
            payment.status,
          )
        }
      >
        {getManagerPaymentStatusLabel(
          payment.status,
        )}
      </span>


      <span
        className={
          styles.ordersPaymentMethod
        }
      >
        {getManagerPaymentMethodLabel(
          payment.method,
        )}
      </span>
    </div>
  );
}


/* ==========================================================================
   LIVRAISON
   ========================================================================== */

function OrderDelivery({
  item,
}: {
  readonly item:
    ManagerOrderListItem;
}) {
  const shipment =
    item.shipment;


  if (
    !shipment
  ) {
    return (
      <span
        className={[
          styles.ordersDeliveryBadge,
          styles.ordersDeliveryPending,
        ].join(
          " ",
        )}
      >
        Non expédiée
      </span>
    );
  }


  return (
    <span
      className={
        getShipmentStatusClassName(
          shipment.status,
        )
      }
    >
      {getManagerShipmentStatusLabel(
        shipment.status,
      )}
    </span>
  );
}


/* ==========================================================================
   DATE
   ========================================================================== */

function OrderCreatedAt({
  value,
}: {
  readonly value:
    string;
}) {
  const formatted =
    formatOrderDate(
      value,
    );


  if (
    !formatted
  ) {
    return (
      <span
        className={
          styles.ordersMutedValue
        }
      >
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
        styles.ordersDateCell
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
   PAGINATION — ENTRÉES
   ========================================================================== */

type OrdersPaginationEntry =
  | number
  | "start-ellipsis"
  | "end-ellipsis";


function buildPaginationEntries(
  page:
    number,

  totalPages:
    number,
): readonly OrdersPaginationEntry[] {
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


  const result:
    OrdersPaginationEntry[] =
      [
        1,
      ];


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
    result.push(
      "start-ellipsis",
    );
  }


  for (
    let current =
      start;
    current <=
    end;
    current +=
    1
  ) {
    result.push(
      current,
    );
  }


  if (
    end <
    totalPages -
      1
  ) {
    result.push(
      "end-ellipsis",
    );
  }


  result.push(
    totalPages,
  );


  return result;
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function OrdersPagination({
  filters,
  pagination,
}: {
  readonly filters:
    ManagerOrdersFilters;

  readonly pagination:
    ManagerOrdersPagination;
}) {
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
        styles.ordersPagination
      }
      aria-label="Pagination des commandes"
    >
      {/* -------------------------------------------------------------------
          PRÉCÉDENT
          ------------------------------------------------------------------- */}

      {pagination.hasPreviousPage ? (
        <Link
          href={
            buildOrdersPageHref(
              pagination.page -
                1,
              filters,
            )
          }
          className={
            styles.ordersPaginationArrow
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
            styles.ordersPaginationArrow,
            styles.ordersPaginationDisabled,
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
          styles.ordersPaginationPages
        }
      >
        {entries.map(
          (
            entry,
          ) => {
            if (
              entry ===
                "start-ellipsis" ||
              entry ===
                "end-ellipsis"
            ) {
              return (
                <span
                  key={
                    entry
                  }
                  className={
                    styles.ordersPaginationEllipsis
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
                    styles.ordersPaginationPage,
                    styles.ordersPaginationPageActive,
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
                  buildOrdersPageHref(
                    entry,
                    filters,
                  )
                }
                className={
                  styles.ordersPaginationPage
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
            buildOrdersPageHref(
              pagination.page +
                1,
              filters,
            )
          }
          className={
            styles.ordersPaginationArrow
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
            styles.ordersPaginationArrow,
            styles.ordersPaginationDisabled,
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
   TABLEAU
   ========================================================================== */

function OrdersDesktopTable({
  items,
  pagination,
}: {
  readonly items:
    readonly ManagerOrderListItem[];

  readonly pagination:
    ManagerOrdersPagination;
}) {
  return (
    <div
      className={
        styles.ordersTableScroll
      }
    >
      <table
        className={
          styles.ordersTable
        }
      >
        <caption
          className={
            styles.ordersVisuallyHidden
          }
        >
          Liste des commandes
        </caption>


        <thead>
          <tr>
            <th
              scope="col"
              className={
                styles.ordersSelectionColumn
              }
            >
              <span
                className={
                  styles.ordersVisuallyHidden
                }
              >
                Sélection
              </span>
            </th>

            <th scope="col">
              #
            </th>

            <th scope="col">
              Commande
            </th>

            <th scope="col">
              Cliente
            </th>

            <th scope="col">
              Produits
            </th>

            <th scope="col">
              Montant
            </th>

            <th scope="col">
              Paiement
            </th>

            <th scope="col">
              Statut
            </th>

            <th scope="col">
              Livraison
            </th>

            <th scope="col">
              Date
            </th>

            <th
              scope="col"
              className={
                styles.ordersActionsColumn
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


              const detailHref =
                buildOrderDetailHref(
                  item.id,
                );


              return (
                <tr
                  key={
                    item.id
                  }
                >
                  {/* =====================================================
                      SÉLECTION
                      ===================================================== */}

                  <td>
                    <input
                      type="checkbox"
                      className={
                        styles.ordersRowCheckbox
                      }
                      aria-label={`Sélectionner la commande ${item.orderNumber}`}
                    />
                  </td>


                  {/* =====================================================
                      #
                      ===================================================== */}

                  <td
                    className={
                      styles.ordersRowNumber
                    }
                  >
                    {formatInteger(
                      rowNumber,
                    )}
                  </td>


                  {/* =====================================================
                      COMMANDE
                      ===================================================== */}

                  <td>
                    <Link
                      href={
                        detailHref
                      }
                      className={
                        styles.ordersOrderNumber
                      }
                    >
                      {item.orderNumber}
                    </Link>
                  </td>


                  {/* =====================================================
                      CLIENTE
                      ===================================================== */}

                  <td>
                    <div
                      className={
                        styles.ordersCustomerCell
                      }
                    >
                      <strong
                        className={
                          styles.ordersCustomerName
                        }
                      >
                        {getCustomerName(
                          item,
                        )}
                      </strong>


                      {item.customer.phone ? (
                        <span
                          className={
                            styles.ordersCustomerSecondary
                          }
                        >
                          {item.customer.phone}
                        </span>
                      ) : null}
                    </div>
                  </td>


                  {/* =====================================================
                      PRODUITS
                      ===================================================== */}

                  <td>
                    <OrderProductsPreview
                      item={
                        item
                      }
                    />
                  </td>


                  {/* =====================================================
                      MONTANT
                      ===================================================== */}

                  <td>
                    <strong
                      className={
                        styles.ordersAmount
                      }
                    >
                      {formatMoney(
                        item.total.amount,
                        item.total.currency,
                      )}
                    </strong>
                  </td>


                  {/* =====================================================
                      PAIEMENT
                      ===================================================== */}

                  <td>
                    <OrderPayment
                      item={
                        item
                      }
                    />
                  </td>


                  {/* =====================================================
                      STATUT
                      ===================================================== */}

                  <td>
                    <OrderStatusBadge
                      status={
                        item.status
                      }
                    />
                  </td>


                  {/* =====================================================
                      LIVRAISON
                      ===================================================== */}

                  <td>
                    <OrderDelivery
                      item={
                        item
                      }
                    />
                  </td>


                  {/* =====================================================
                      DATE
                      ===================================================== */}

                  <td>
                    <OrderCreatedAt
                      value={
                        item.createdAt
                      }
                    />
                  </td>


                  {/* =====================================================
                      ACTION
                      ===================================================== */}

                  <td>
                    <Link
                      href={
                        detailHref
                      }
                      className={
                        styles.ordersViewButton
                      }
                      aria-label={`Voir la commande ${item.orderNumber}`}
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
  );
}


/* ==========================================================================
   FOOTER TABLEAU
   ========================================================================== */

function OrdersTableFooter({
  filters,
  pagination,
}: {
  readonly filters:
    ManagerOrdersFilters;

  readonly pagination:
    ManagerOrdersPagination;
}) {
  return (
    <div
      className={
        styles.ordersTableFooter
      }
    >
      <p
        className={
          styles.ordersPaginationSummary
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
          ? "commandes"
          : "commande"}
      </p>


      <OrdersPagination
        filters={
          filters
        }
        pagination={
          pagination
        }
      />
    </div>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function OrdersTable({
  items,
  filters,
  pagination,
}: OrdersTableProps) {
  /*
   * L'état vide est géré par OrdersEmptyState.tsx.
   */

  if (
    items.length ===
    0
  ) {
    return null;
  }


  return (
    <section
      className={
        styles.ordersTableSection
      }
      aria-label="Liste des commandes"
    >
      <OrdersDesktopTable
        items={
          items
        }
        pagination={
          pagination
        }
      />


      <OrdersTableFooter
        filters={
          filters
        }
        pagination={
          pagination
        }
      />
    </section>
  );
}