import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  PackageOpen,
  ShoppingBag,
} from "lucide-react";

import {
  getManagerStatisticsOrderStatusLabel,
  type ManagerStatisticsLatestOrder,
  type ManagerStatisticsMoney,
  type ManagerStatisticsTopProduct,
} from "@/lib/gestionnaire/statistiques/statistics-types";

import styles from "@/app/gestionnaire/(espace-prive)/statistiques/statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — TABLEAUX
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/statistiques/StatisticsTables.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher les produits réellement les plus vendus ;
 * - afficher les dernières commandes réelles ;
 * - utiliser les routes existantes de l'espace Gestionnaire ;
 * - afficher proprement les montants ;
 * - afficher les statuts réels des commandes ;
 * - afficher les images réelles lorsqu'elles existent ;
 * - gérer proprement l'absence d'image ;
 * - gérer les produits sans catégorie ;
 * - conserver les devises séparées ;
 * - proposer une présentation desktop et mobile.
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - récupérer le storeId ;
 * - récupérer le managerId ;
 * - calculer les statistiques métier ;
 * - inventer un produit ;
 * - inventer une commande ;
 * - inventer une catégorie ;
 * - inventer une image ;
 * - inventer un montant ;
 * - additionner plusieurs devises ;
 * - modifier les données reçues.
 *
 *
 * Les données reçues sont déjà :
 *
 * - authentifiées ;
 * - scoppées à la boutique ;
 * - filtrées ;
 * - agrégées ;
 * - sérialisées ;
 *
 * par statistics-query.ts.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES EXISTANTES
   ========================================================================== */

const PRODUCTS_ROUTE =
  "/gestionnaire/produits";


const ORDERS_ROUTE =
  "/gestionnaire/commandes";


function getProductDetailRoute(
  productId:
    string,
): string {
  return `${PRODUCTS_ROUTE}/${encodeURIComponent(productId)}`;
}


function getOrderDetailRoute(
  orderId:
    string,
): string {
  return `${ORDERS_ROUTE}/${encodeURIComponent(orderId)}`;
}


/* ==========================================================================
   FORMATTERS
   ========================================================================== */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const DATE_TIME_FORMATTER =
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
   INTEGER
   ========================================================================== */

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
    value,
  );
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function formatMoney(
  money:
    ManagerStatisticsMoney,
): string {
  const numericAmount =
    Number(
      money.amount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${money.amount} ${money.currency}`;
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          money.currency,

        currencyDisplay:
          "code",

        minimumFractionDigits:
          Number.isInteger(
            numericAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return [
      numericAmount.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            2,
        },
      ),

      money.currency,
    ].join(
      " ",
    );
  }
}


/* ==========================================================================
   DATE / HEURE
   ========================================================================== */

function formatDateTime(
  isoDate:
    string,
): string {
  const date =
    new Date(
      isoDate,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }


  return DATE_TIME_FORMATTER.format(
    date,
  );
}


/* ==========================================================================
   ORDER STATUS CLASS
   ========================================================================== */

function getOrderStatusClassName(
  status:
    ManagerStatisticsLatestOrder["status"],
): string {
  switch (
    status
  ) {
    case "PENDING":
      return styles.statisticsOrderStatusPending;


    case "CONFIRMED":
      return styles.statisticsOrderStatusConfirmed;


    case "PROCESSING":
      return styles.statisticsOrderStatusProcessing;


    case "READY":
      return styles.statisticsOrderStatusReady;


    case "SHIPPED":
      return styles.statisticsOrderStatusShipped;


    case "DELIVERED":
      return styles.statisticsOrderStatusDelivered;


    case "CANCELLED":
      return styles.statisticsOrderStatusCancelled;


    case "REFUNDED":
      return styles.statisticsOrderStatusRefunded;


    default:
      return styles.statisticsOrderStatusNeutral;
  }
}


/* ==========================================================================
   INLINE EMPTY STATE
   ========================================================================== */

function StatisticsTableEmpty({
  type,
}: {
  readonly type:
    "products" |
    "orders";
}) {
  const isProducts =
    type ===
    "products";


  return (
    <div
      className={styles.statisticsTableEmpty}
      role="status"
    >
      <div
        className={styles.statisticsTableEmptyIcon}
        aria-hidden="true"
      >
        {isProducts ? (
          <PackageOpen
            size={25}
            strokeWidth={1.7}
          />
        ) : (
          <ShoppingBag
            size={25}
            strokeWidth={1.7}
          />
        )}
      </div>


      <div className={styles.statisticsTableEmptyCopy}>
        <strong>
          {isProducts
            ? "Aucun produit vendu sur cette période."
            : "Aucune commande sur cette période."}
        </strong>


        <span>
          {isProducts
            ? "Les produits apparaîtront ici dès qu’une vente sera enregistrée."
            : "Les dernières commandes apparaîtront ici dès qu’elles seront enregistrées."}
        </span>
      </div>
    </div>
  );
}


/* ==========================================================================
   PRODUCT IMAGE
   ========================================================================== */

function StatisticsProductImage({
  product,
}: {
  readonly product:
    ManagerStatisticsTopProduct;
}) {
  const imageUrl =
    product.image
      ?.url
      ?.trim() ??
    "";


  if (
    !imageUrl
  ) {
    return (
      <span
        className={styles.statisticsProductImageFallback}
        aria-hidden="true"
      >
        <PackageOpen
          size={18}
          strokeWidth={1.7}
        />
      </span>
    );
  }


  const altText =
    product.image
      ?.altText
      ?.trim() ||
    product.productName;


  return (
    <span className={styles.statisticsProductImage}>
      <Image
        src={imageUrl}
        alt={altText}
        width={42}
        height={42}
        sizes="42px"
      />
    </span>
  );
}


/* ==========================================================================
   PRODUCT REVENUE
   ========================================================================== */

function StatisticsProductRevenue({
  revenue,
}: {
  readonly revenue:
    ManagerStatisticsTopProduct["revenue"];
}) {
  if (
    revenue.length ===
    0
  ) {
    return (
      <span className={styles.statisticsTableMuted}>
        —
      </span>
    );
  }


  /**
   * Les devises sont toujours affichées séparément.
   *
   * Exemple :
   *
   * 150 000 XOF
   * 45 EUR
   *
   * Elles ne sont jamais additionnées entre elles.
   */

  return (
    <div className={styles.statisticsProductRevenueList}>
      {revenue.map(
        (
          money,
        ) => (
          <span
            key={money.currency}
            className={styles.statisticsProductRevenueValue}
          >
            {formatMoney(
              money,
            )}
          </span>
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   TOP PRODUCTS — PROPS
   ========================================================================== */

interface TopProductsCardProps {
  readonly products:
    readonly ManagerStatisticsTopProduct[];
}


/* ==========================================================================
   TOP PRODUCTS CARD
   ========================================================================== */

export function TopProductsCard({
  products,
}: TopProductsCardProps) {
  return (
    <section
      className={styles.statisticsTableCard}
      aria-labelledby="statistics-top-products-title"
    >
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <div className={styles.statisticsTableCardHeader}>
        <h2
          id="statistics-top-products-title"
          className={styles.statisticsTableCardTitle}
        >
          Produits les plus vendus
        </h2>


        <Link
          href={PRODUCTS_ROUTE}
          className={styles.statisticsTableCardLink}
        >
          <span>
            Voir tous
          </span>


          <ArrowRight
            size={14}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </Link>
      </div>


      {/* ==================================================================
          EMPTY
          ================================================================== */}

      {products.length ===
      0 ? (
        <StatisticsTableEmpty
          type="products"
        />
      ) : (
        <>
          {/* ==============================================================
              DESKTOP TABLE
              ============================================================== */}

          <div className={styles.statisticsTableDesktop}>
            <div className={styles.statisticsTableScroll}>
              <table className={styles.statisticsTable}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className={styles.statisticsTableRankColumn}
                    >
                      #
                    </th>


                    <th scope="col">
                      Produit
                    </th>


                    <th scope="col">
                      Catégorie
                    </th>


                    <th
                      scope="col"
                      className={styles.statisticsTableNumericColumn}
                    >
                      Quantité
                    </th>


                    <th
                      scope="col"
                      className={styles.statisticsTableNumericColumn}
                    >
                      Chiffre d’affaires
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {products.map(
                    (
                      product,
                      index,
                    ) => (
                      <tr key={product.storeProductId}>
                        {/* ==================================================
                            RANK
                            ================================================== */}

                        <td className={styles.statisticsTableRankCell}>
                          {index +
                            1}
                        </td>


                        {/* ==================================================
                            PRODUCT
                            ================================================== */}

                        <td>
                          <div className={styles.statisticsProductCell}>
                            <StatisticsProductImage
                              product={product}
                            />


                            <div className={styles.statisticsProductIdentity}>
                              <Link
                                href={
                                  getProductDetailRoute(
                                    product.productId,
                                  )
                                }
                                className={styles.statisticsProductName}
                              >
                                {product.productName}
                              </Link>


                              {product.sku ? (
                                <span className={styles.statisticsProductSku}>
                                  {product.sku}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>


                        {/* ==================================================
                            CATEGORY
                            ================================================== */}

                        <td>
                          {product.categoryName ? (
                            <span className={styles.statisticsCategoryBadge}>
                              {product.categoryName}
                            </span>
                          ) : (
                            <span className={styles.statisticsTableMuted}>
                              Non renseignée
                            </span>
                          )}
                        </td>


                        {/* ==================================================
                            QUANTITY
                            ================================================== */}

                        <td className={styles.statisticsTableNumericCell}>
                          <strong>
                            {formatInteger(
                              product.quantitySold,
                            )}
                          </strong>
                        </td>


                        {/* ==================================================
                            REVENUE
                            ================================================== */}

                        <td className={styles.statisticsTableNumericCell}>
                          <StatisticsProductRevenue
                            revenue={product.revenue}
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* ==============================================================
              MOBILE CARDS
              ============================================================== */}

          <div className={styles.statisticsTableMobile}>
            {products.map(
              (
                product,
                index,
              ) => (
                <article
                  key={product.storeProductId}
                  className={styles.statisticsProductMobileCard}
                >
                  <div className={styles.statisticsProductMobileHeader}>
                    <span className={styles.statisticsProductMobileRank}>
                      #{index +
                        1}
                    </span>


                    <StatisticsProductImage
                      product={product}
                    />


                    <div className={styles.statisticsProductIdentity}>
                      <Link
                        href={
                          getProductDetailRoute(
                            product.productId,
                          )
                        }
                        className={styles.statisticsProductName}
                      >
                        {product.productName}
                      </Link>


                      {product.categoryName ? (
                        <span className={styles.statisticsProductMobileCategory}>
                          {product.categoryName}
                        </span>
                      ) : (
                        <span className={styles.statisticsProductMobileCategory}>
                          Catégorie non renseignée
                        </span>
                      )}
                    </div>
                  </div>


                  <dl className={styles.statisticsProductMobileDetails}>
                    <div>
                      <dt>
                        Quantité vendue
                      </dt>

                      <dd>
                        {formatInteger(
                          product.quantitySold,
                        )}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Chiffre d’affaires
                      </dt>

                      <dd>
                        <StatisticsProductRevenue
                          revenue={product.revenue}
                        />
                      </dd>
                    </div>
                  </dl>


                  <Link
                    href={
                      getProductDetailRoute(
                        product.productId,
                      )
                    }
                    className={styles.statisticsMobileDetailLink}
                  >
                    <span>
                      Voir le produit
                    </span>


                    <ArrowRight
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </Link>
                </article>
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}


/* ==========================================================================
   LATEST ORDERS — PROPS
   ========================================================================== */

interface LatestOrdersCardProps {
  readonly orders:
    readonly ManagerStatisticsLatestOrder[];
}


/* ==========================================================================
   LATEST ORDERS CARD
   ========================================================================== */

export function LatestOrdersCard({
  orders,
}: LatestOrdersCardProps) {
  return (
    <section
      className={styles.statisticsTableCard}
      aria-labelledby="statistics-latest-orders-title"
    >
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <div className={styles.statisticsTableCardHeader}>
        <h2
          id="statistics-latest-orders-title"
          className={styles.statisticsTableCardTitle}
        >
          Dernières commandes
        </h2>


        <Link
          href={ORDERS_ROUTE}
          className={styles.statisticsTableCardLink}
        >
          <span>
            Voir toutes
          </span>


          <ArrowRight
            size={14}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        </Link>
      </div>


      {/* ==================================================================
          EMPTY
          ================================================================== */}

      {orders.length ===
      0 ? (
        <StatisticsTableEmpty
          type="orders"
        />
      ) : (
        <>
          {/* ==============================================================
              DESKTOP TABLE
              ============================================================== */}

          <div className={styles.statisticsTableDesktop}>
            <div className={styles.statisticsTableScroll}>
              <table className={styles.statisticsTable}>
                <thead>
                  <tr>
                    <th scope="col">
                      Commande
                    </th>


                    <th scope="col">
                      Cliente
                    </th>


                    <th
                      scope="col"
                      className={styles.statisticsTableNumericColumn}
                    >
                      Montant
                    </th>


                    <th scope="col">
                      Statut
                    </th>


                    <th scope="col">
                      Date
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {orders.map(
                    (
                      order,
                    ) => (
                      <tr key={order.id}>
                        {/* ==================================================
                            ORDER
                            ================================================== */}

                        <td>
                          <Link
                            href={
                              getOrderDetailRoute(
                                order.id,
                              )
                            }
                            className={styles.statisticsOrderReference}
                          >
                            {order.orderNumber}
                          </Link>
                        </td>


                        {/* ==================================================
                            CUSTOMER
                            ================================================== */}

                        <td>
                          <span className={styles.statisticsOrderCustomer}>
                            {order.customerName}
                          </span>
                        </td>


                        {/* ==================================================
                            AMOUNT
                            ================================================== */}

                        <td className={styles.statisticsTableNumericCell}>
                          <strong>
                            {formatMoney(
                              order.amount,
                            )}
                          </strong>
                        </td>


                        {/* ==================================================
                            STATUS
                            ================================================== */}

                        <td>
                          <span
                            className={[
                              styles.statisticsOrderStatus,
                              getOrderStatusClassName(
                                order.status,
                              ),
                            ].join(" ")}
                          >
                            {getManagerStatisticsOrderStatusLabel(
                              order.status,
                            )}
                          </span>
                        </td>


                        {/* ==================================================
                            DATE
                            ================================================== */}

                        <td>
                          <time
                            dateTime={order.createdAt}
                            className={styles.statisticsOrderDate}
                          >
                            {formatDateTime(
                              order.createdAt,
                            )}
                          </time>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>


          {/* ==============================================================
              MOBILE CARDS
              ============================================================== */}

          <div className={styles.statisticsTableMobile}>
            {orders.map(
              (
                order,
              ) => (
                <article
                  key={order.id}
                  className={styles.statisticsOrderMobileCard}
                >
                  <div className={styles.statisticsOrderMobileHeader}>
                    <div className={styles.statisticsOrderMobileReference}>
                      <span>
                        Commande
                      </span>


                      <Link
                        href={
                          getOrderDetailRoute(
                            order.id,
                          )
                        }
                        className={styles.statisticsOrderReference}
                      >
                        {order.orderNumber}
                      </Link>
                    </div>


                    <span
                      className={[
                        styles.statisticsOrderStatus,
                        getOrderStatusClassName(
                          order.status,
                        ),
                      ].join(" ")}
                    >
                      {getManagerStatisticsOrderStatusLabel(
                        order.status,
                      )}
                    </span>
                  </div>


                  <dl className={styles.statisticsOrderMobileDetails}>
                    <div>
                      <dt>
                        Cliente
                      </dt>

                      <dd>
                        {order.customerName}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Montant
                      </dt>

                      <dd>
                        {formatMoney(
                          order.amount,
                        )}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Date
                      </dt>

                      <dd>
                        <time dateTime={order.createdAt}>
                          {formatDateTime(
                            order.createdAt,
                          )}
                        </time>
                      </dd>
                    </div>
                  </dl>


                  <Link
                    href={
                      getOrderDetailRoute(
                        order.id,
                      )
                    }
                    className={styles.statisticsMobileDetailLink}
                  >
                    <span>
                      Voir la commande
                    </span>


                    <ArrowRight
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </Link>
                </article>
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}