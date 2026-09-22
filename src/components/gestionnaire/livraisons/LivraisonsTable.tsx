import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  Truck,
} from "lucide-react";

import {
  getManagerShipmentStatusLabel,
  type ManagerShipmentListItem,
  type ManagerShipmentStatus,
  type ManagerShipmentsFilters,
  type ManagerShipmentsPagination,
} from "@/lib/gestionnaire/livraisons/shipment-types";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — TABLE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonsTable.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher les vraies livraisons du Gestionnaire ;
 * - afficher la référence Shipment réelle ;
 * - afficher le client lié à la commande ;
 * - afficher la commande liée ;
 * - afficher un aperçu simple des produits ;
 * - afficher l'adresse réelle du Shipment ;
 * - afficher le transporteur uniquement lorsqu'il existe ;
 * - afficher le vrai ShipmentStatus ;
 * - afficher shippedAt / deliveredAt lorsqu'ils existent ;
 * - ouvrir /gestionnaire/livraisons/[deliveryId] ;
 * - gérer la pagination sans perdre les filtres ;
 * - fournir une présentation desktop ;
 * - fournir une présentation mobile ;
 * - ne jamais inventer de donnée.
 *
 * IMPORTANT :
 *
 * - pas de checkbox de masse ;
 * - pas de suppression ;
 * - pas de modification directe ;
 * - pas de confirmation depuis la liste ;
 * - pas d'annulation depuis la liste ;
 * - action unique : Voir.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonsTableProps {
  readonly shipments:
    readonly ManagerShipmentListItem[];

  readonly filters:
    ManagerShipmentsFilters;

  readonly pagination:
    ManagerShipmentsPagination;
}


/* ==========================================================================
   DATE FORMATTER
   ========================================================================== */

const dateFormatter =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    },
  );


const dateTimeFormatter =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );


/* ==========================================================================
   FORMAT DATE
   ========================================================================== */

function formatDate(
  value:
    string | null,
): string {
  if (
    !value
  ) {
    return "—";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }


  return dateFormatter.format(
    date,
  );
}


/* ==========================================================================
   FORMAT DATE TIME
   ========================================================================== */

function formatDateTime(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }


  return dateTimeFormatter.format(
    date,
  );
}


/* ==========================================================================
   NORMALIZE DISPLAY TEXT
   ========================================================================== */

function displayText(
  value:
    string | null | undefined,
): string {
  if (
    typeof value !==
      "string"
  ) {
    return "—";
  }


  const normalized =
    value.trim();


  return normalized ||
    "—";
}


/* ==========================================================================
   ARTICLE LABEL
   ========================================================================== */

function formatArticleCount(
  count:
    number,
): string {
  const safeCount =
    Number.isFinite(
      count,
    )
      ? Math.max(
          0,
          Math.trunc(
            count,
          ),
        )
      : 0;


  return `${safeCount} ${
    safeCount >
      1
      ? "articles"
      : "article"
  }`;
}


/* ==========================================================================
   PRODUCT PREVIEW
   ========================================================================== */

/**
 * OrderItem ne possède actuellement aucun snapshot d'image.
 *
 * On affiche donc uniquement :
 *
 * - le premier nom produit réel ;
 * - le nombre total réel d'articles.
 *
 * Aucun placeholder d'image produit fictif.
 */

function getProductsPreview(
  shipment:
    ManagerShipmentListItem,
): {
  readonly primary:
    string;

  readonly count:
    string;
} {
  const firstItem =
    shipment.items[0];


  return {
    primary:
      firstItem?.productName?.trim() ||
      "—",

    count:
      formatArticleCount(
        shipment.itemCount,
      ),
  };
}


/* ==========================================================================
   STATUS CLASS
   ========================================================================== */

function getStatusClassName(
  status:
    ManagerShipmentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return styles.livraisonsStatusPending;

    case "PREPARING":
      return styles.livraisonsStatusPreparing;

    case "SHIPPED":
      return styles.livraisonsStatusShipped;

    case "IN_TRANSIT":
      return styles.livraisonsStatusInTransit;

    case "DELIVERED":
      return styles.livraisonsStatusDelivered;

    case "FAILED":
      return styles.livraisonsStatusFailed;

    case "RETURNED":
      return styles.livraisonsStatusReturned;

    case "CANCELLED":
      return styles.livraisonsStatusCancelled;
  }
}


/* ==========================================================================
   STATUS BADGE
   ========================================================================== */

function ShipmentStatusBadge({
  status,
}: {
  readonly status:
    ManagerShipmentStatus;
}) {
  return (
    <span
      className={[
        styles.livraisonsStatusBadge,
        getStatusClassName(
          status,
        ),
      ].join(" ")}
    >
      <span
        className={styles.livraisonsStatusDot}
        aria-hidden="true"
      />

      <span>
        {getManagerShipmentStatusLabel(
          status,
        )}
      </span>
    </span>
  );
}


/* ==========================================================================
   DETAIL HREF
   ========================================================================== */

function buildShipmentDetailHref(
  shipmentId:
    string,
): string {
  return `${LIVRAISONS_ROUTE}/${encodeURIComponent(
    shipmentId,
  )}`;
}


/* ==========================================================================
   PAGE HREF
   ========================================================================== */

function buildPageHref({
  filters,
  page,
}: {
  readonly filters:
    ManagerShipmentsFilters;

  readonly page:
    number;
}): string {
  const params =
    new URLSearchParams();


  if (
    filters.q
  ) {
    params.set(
      "q",
      filters.q,
    );
  }


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
    filters.city
  ) {
    params.set(
      "city",
      filters.city,
    );
  }


  if (
    filters.carrier
  ) {
    params.set(
      "carrier",
      filters.carrier,
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
    ? `${LIVRAISONS_ROUTE}?${query}`
    : LIVRAISONS_ROUTE;
}


/* ==========================================================================
   PAGINATION WINDOW
   ========================================================================== */

function createPaginationPages(
  currentPage:
    number,

  totalPages:
    number,
): readonly number[] {
  if (
    totalPages <=
      1
  ) {
    return [];
  }


  if (
    totalPages <=
      5
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


  const pages =
    new Set<number>();


  pages.add(
    1,
  );


  pages.add(
    totalPages,
  );


  pages.add(
    currentPage,
  );


  pages.add(
    currentPage -
      1,
  );


  pages.add(
    currentPage +
      1,
  );


  return Array
    .from(
      pages,
    )
    .filter(
      (
        page,
      ) =>
        page >=
          1 &&
        page <=
          totalPages,
    )
    .sort(
      (
        first,
        second,
      ) =>
        first -
        second,
    );
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function LivraisonsPagination({
  filters,
  pagination,
}: {
  readonly filters:
    ManagerShipmentsFilters;

  readonly pagination:
    ManagerShipmentsPagination;
}) {
  if (
    pagination.totalPages <=
      1
  ) {
    return null;
  }


  const pages =
    createPaginationPages(
      pagination.page,
      pagination.totalPages,
    );


  return (
    <nav
      className={styles.livraisonsPagination}
      aria-label="Pagination des livraisons"
    >
      {/* ==================================================================
          PREVIOUS
          ================================================================== */}

      {pagination.hasPreviousPage ? (
        <Link
          href={buildPageHref({
            filters,

            page:
              pagination.page -
              1,
          })}
          scroll={false}
          className={styles.livraisonsPaginationArrow}
          aria-label="Page précédente"
        >
          <ChevronLeft
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span
          className={[
            styles.livraisonsPaginationArrow,
            styles.livraisonsPaginationDisabled,
          ].join(" ")}
          aria-disabled="true"
        >
          <ChevronLeft
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </span>
      )}


      {/* ==================================================================
          PAGE NUMBERS
          ================================================================== */}

      <div className={styles.livraisonsPaginationPages}>
        {pages.map(
          (
            page,
            index,
          ) => {
            const previousPage =
              pages[
                index -
                1
              ];


            const needsSeparator =
              typeof previousPage ===
                "number" &&
              page -
                previousPage >
                1;


            return (
              <span
                key={page}
                className={styles.livraisonsPaginationPageGroup}
              >
                {needsSeparator ? (
                  <span
                    className={styles.livraisonsPaginationEllipsis}
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : null}


                {page ===
                pagination.page ? (
                  <span
                    className={[
                      styles.livraisonsPaginationPage,
                      styles.livraisonsPaginationPageActive,
                    ].join(" ")}
                    aria-current="page"
                  >
                    {page}
                  </span>
                ) : (
                  <Link
                    href={buildPageHref({
                      filters,

                      page,
                    })}
                    scroll={false}
                    className={styles.livraisonsPaginationPage}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </Link>
                )}
              </span>
            );
          },
        )}
      </div>


      {/* ==================================================================
          NEXT
          ================================================================== */}

      {pagination.hasNextPage ? (
        <Link
          href={buildPageHref({
            filters,

            page:
              pagination.page +
              1,
          })}
          scroll={false}
          className={styles.livraisonsPaginationArrow}
          aria-label="Page suivante"
        >
          <ChevronRight
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <span
          className={[
            styles.livraisonsPaginationArrow,
            styles.livraisonsPaginationDisabled,
          ].join(" ")}
          aria-disabled="true"
        >
          <ChevronRight
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </span>
      )}
    </nav>
  );
}


/* ==========================================================================
   DESKTOP ROW
   ========================================================================== */

function LivraisonsDesktopRow({
  shipment,
  rowNumber,
}: {
  readonly shipment:
    ManagerShipmentListItem;

  readonly rowNumber:
    number;
}) {
  const products =
    getProductsPreview(
      shipment,
    );


  const detailHref =
    buildShipmentDetailHref(
      shipment.id,
    );


  return (
    <tr className={styles.livraisonsTableRow}>
      {/* ==================================================================
          NUMBER
          ================================================================== */}

      <td
        className={[
          styles.livraisonsTableCell,
          styles.livraisonsTableCellNumber,
        ].join(" ")}
      >
        {rowNumber}
      </td>


      {/* ==================================================================
          REFERENCE
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsReferenceCell}>
          <strong className={styles.livraisonsReference}>
            {displayText(
              shipment.shipmentNumber,
            )}
          </strong>


          <span className={styles.livraisonsReferenceDate}>
            Créée le{" "}
            {formatDateTime(
              shipment.createdAt,
            )}
          </span>
        </div>
      </td>


      {/* ==================================================================
          CUSTOMER
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsCustomerCell}>
          <strong className={styles.livraisonsCustomerName}>
            {displayText(
              shipment.customerName,
            )}
          </strong>


          <span className={styles.livraisonsCustomerPhone}>
            {displayText(
              shipment.customerPhone,
            )}
          </span>
        </div>
      </td>


      {/* ==================================================================
          ORDER
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <span className={styles.livraisonsOrderReference}>
          {displayText(
            shipment.orderNumber,
          )}
        </span>
      </td>


      {/* ==================================================================
          PRODUCTS
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsProductsCell}>
          <span
            className={styles.livraisonsProductsIcon}
            aria-hidden="true"
          >
            <Package
              size={17}
              strokeWidth={1.8}
            />
          </span>


          <div className={styles.livraisonsProductsCopy}>
            <span className={styles.livraisonsProductName}>
              {products.primary}
            </span>


            <span className={styles.livraisonsProductCount}>
              {products.count}
            </span>
          </div>
        </div>
      </td>


      {/* ==================================================================
          ADDRESS
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsAddressCell}>
          <strong>
            {displayText(
              shipment.city,
            )}
          </strong>


          <span>
            {displayText(
              shipment.address,
            )}
          </span>
        </div>
      </td>


      {/* ==================================================================
          CARRIER
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        {shipment.carrier ? (
          <span className={styles.livraisonsCarrier}>
            <Truck
              size={15}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              {shipment.carrier}
            </span>
          </span>
        ) : (
          <span className={styles.livraisonsFallback}>
            —
          </span>
        )}
      </td>


      {/* ==================================================================
          STATUS
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <ShipmentStatusBadge
          status={shipment.status}
        />
      </td>


      {/* ==================================================================
          SHIPPED AT
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <span className={styles.livraisonsDateValue}>
          {formatDate(
            shipment.shippedAt,
          )}
        </span>
      </td>


      {/* ==================================================================
          DELIVERED AT
          ================================================================== */}

      <td className={styles.livraisonsTableCell}>
        <span className={styles.livraisonsDateValue}>
          {formatDate(
            shipment.deliveredAt,
          )}
        </span>
      </td>


      {/* ==================================================================
          ACTION
          ================================================================== */}

      <td
        className={[
          styles.livraisonsTableCell,
          styles.livraisonsTableCellActions,
        ].join(" ")}
      >
        <Link
          href={detailHref}
          className={styles.livraisonsViewButton}
          aria-label={`Voir la livraison ${shipment.shipmentNumber}`}
        >
          <Eye
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Voir
          </span>
        </Link>
      </td>
    </tr>
  );
}


/* ==========================================================================
   MOBILE CARD
   ========================================================================== */

function LivraisonsMobileCard({
  shipment,
}: {
  readonly shipment:
    ManagerShipmentListItem;
}) {
  const products =
    getProductsPreview(
      shipment,
    );


  const detailHref =
    buildShipmentDetailHref(
      shipment.id,
    );


  return (
    <article className={styles.livraisonsMobileCard}>
      {/* ==================================================================
          CARD HEADER
          ================================================================== */}

      <div className={styles.livraisonsMobileCardHeader}>
        <div className={styles.livraisonsMobileReference}>
          <span className={styles.livraisonsMobileReferenceLabel}>
            Livraison
          </span>


          <strong>
            {displayText(
              shipment.shipmentNumber,
            )}
          </strong>
        </div>


        <ShipmentStatusBadge
          status={shipment.status}
        />
      </div>


      {/* ==================================================================
          CUSTOMER / ORDER
          ================================================================== */}

      <div className={styles.livraisonsMobilePrimary}>
        <div className={styles.livraisonsMobileCustomer}>
          <strong>
            {displayText(
              shipment.customerName,
            )}
          </strong>


          <span>
            {displayText(
              shipment.customerPhone,
            )}
          </span>
        </div>


        <span className={styles.livraisonsMobileOrder}>
          Commande{" "}
          <strong>
            {displayText(
              shipment.orderNumber,
            )}
          </strong>
        </span>
      </div>


      {/* ==================================================================
          DETAILS
          ================================================================== */}

      <dl className={styles.livraisonsMobileDetails}>
        <div className={styles.livraisonsMobileDetailRow}>
          <dt>
            Produits
          </dt>

          <dd>
            <span>
              {products.primary}
            </span>

            <small>
              {products.count}
            </small>
          </dd>
        </div>


        <div className={styles.livraisonsMobileDetailRow}>
          <dt>
            Adresse
          </dt>

          <dd>
            <span>
              {displayText(
                shipment.city,
              )}
            </span>

            <small>
              {displayText(
                shipment.address,
              )}
            </small>
          </dd>
        </div>


        <div className={styles.livraisonsMobileDetailRow}>
          <dt>
            Transporteur
          </dt>

          <dd>
            {displayText(
              shipment.carrier,
            )}
          </dd>
        </div>


        <div className={styles.livraisonsMobileDetailRow}>
          <dt>
            Expédition
          </dt>

          <dd>
            {formatDate(
              shipment.shippedAt,
            )}
          </dd>
        </div>


        <div className={styles.livraisonsMobileDetailRow}>
          <dt>
            Livraison
          </dt>

          <dd>
            {formatDate(
              shipment.deliveredAt,
            )}
          </dd>
        </div>
      </dl>


      {/* ==================================================================
          ACTION
          ================================================================== */}

      <div className={styles.livraisonsMobileCardFooter}>
        <Link
          href={detailHref}
          className={styles.livraisonsMobileViewButton}
          aria-label={`Voir la livraison ${shipment.shipmentNumber}`}
        >
          <Eye
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Voir la livraison
          </span>

          <ChevronRight
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </Link>
      </div>
    </article>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LivraisonsTable({
  shipments,
  filters,
  pagination,
}: LivraisonsTableProps) {
  return (
    <section
      className={styles.livraisonsTableSection}
      aria-labelledby="livraisons-table-title"
    >
      {/* ==================================================================
          ACCESSIBLE TITLE
          ================================================================== */}

      <h2
        id="livraisons-table-title"
        className={styles.livraisonsVisuallyHidden}
      >
        Liste des livraisons
      </h2>


      {/* ==================================================================
          DESKTOP TABLE
          ================================================================== */}

      <div className={styles.livraisonsTableCard}>
        <div className={styles.livraisonsTableScroll}>
          <table className={styles.livraisonsTable}>
            <thead className={styles.livraisonsTableHead}>
              <tr>
                <th
                  scope="col"
                  className={[
                    styles.livraisonsTableHeaderCell,
                    styles.livraisonsTableHeaderNumber,
                  ].join(" ")}
                >
                  #
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Référence
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Client
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Commande
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Produits
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Adresse de livraison
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Transporteur
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Statut
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Date d’expédition
                </th>

                <th
                  scope="col"
                  className={styles.livraisonsTableHeaderCell}
                >
                  Date de livraison
                </th>

                <th
                  scope="col"
                  className={[
                    styles.livraisonsTableHeaderCell,
                    styles.livraisonsTableHeaderActions,
                  ].join(" ")}
                >
                  Actions
                </th>
              </tr>
            </thead>


            <tbody className={styles.livraisonsTableBody}>
              {shipments.map(
                (
                  shipment,
                  index,
                ) => (
                  <LivraisonsDesktopRow
                    key={shipment.id}
                    shipment={shipment}
                    rowNumber={
                      pagination.startItem +
                      index
                    }
                  />
                ),
              )}
            </tbody>
          </table>
        </div>


        {/* =================================================================
            TABLE FOOTER
            ================================================================= */}

        <div className={styles.livraisonsTableFooter}>
          <p className={styles.livraisonsTableCount}>
            {pagination.totalItems >
            0 ? (
              <>
                Affichage de{" "}
                <strong>
                  {pagination.startItem}
                </strong>{" "}
                à{" "}
                <strong>
                  {pagination.endItem}
                </strong>{" "}
                sur{" "}
                <strong>
                  {pagination.totalItems}
                </strong>{" "}
                livraison
                {pagination.totalItems >
                1
                  ? "s"
                  : ""}
              </>
            ) : (
              "Aucune livraison"
            )}
          </p>


          <LivraisonsPagination
            filters={filters}
            pagination={pagination}
          />
        </div>
      </div>


      {/* ==================================================================
          MOBILE CARDS
          ================================================================== */}

      <div className={styles.livraisonsMobileList}>
        {shipments.map(
          (
            shipment,
          ) => (
            <LivraisonsMobileCard
              key={shipment.id}
              shipment={shipment}
            />
          ),
        )}


        <div className={styles.livraisonsMobilePagination}>
          <LivraisonsPagination
            filters={filters}
            pagination={pagination}
          />
        </div>
      </div>
    </section>
  );
}