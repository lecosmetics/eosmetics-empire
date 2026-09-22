import {
  ArrowRight,
  Eye,
  MoreHorizontal,
  ShoppingBag,
} from "lucide-react";

import Link from "next/link";

import {
  gestionnaireRouteBuilders,
  routes,
} from "@/config/routes";

import type {
  DashboardRecentOrder,
} from "@/server/gestionnaire/dashboard/dashboard";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD — DERNIÈRES COMMANDES
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/
   DashboardRecentOrders.tsx

   RESPONSABILITÉS :

   - afficher les dernières commandes de la boutique connectée ;
   - afficher uniquement les données déjà sécurisées côté serveur ;
   - afficher une vraie table professionnelle sur desktop ;
   - prévoir une présentation adaptée au mobile ;
   - afficher référence, client, quantité, montant, statut et date ;
   - proposer uniquement les actions réellement disponibles ;
   - gérer proprement l'absence de commandes.

   IMPORTANT :

   Ce composant :
   - ne fait aucune requête Prisma ;
   - ne reçoit aucun storeId ;
   - ne reçoit aucun managerId ;
   - ne filtre aucune donnée sensible côté client ;
   - ne contient aucune fausse commande ;
   - ne contient aucun faux montant.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type DashboardRecentOrdersProps =
  Readonly<{
    orders:
      readonly DashboardRecentOrder[];
  }>;


/* ============================================================
   STATUS
   ============================================================ */

type OrderStatusDisplay =
  Readonly<{
    label:
      string;

    tone:
      | "pending"
      | "progress"
      | "success"
      | "cancelled"
      | "refunded";
  }>;


/* ============================================================
   NUMBER FORMATTERS
   ============================================================ */

const AMOUNT_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    },
  );


const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


/* ============================================================
   FORMAT MONEY
   ------------------------------------------------------------
   On conserve toujours le code devise visible.

   Exemple :

   42 500 XAF
   180 EUR
   95 USD

   On ne suppose jamais que toutes les boutiques utilisent
   la même devise.
   ============================================================ */

function formatMoney(
  amount:
    number,

  currency:
    string,
): string {
  return `${AMOUNT_FORMATTER.format(
    amount,
  )} ${currency}`;
}


/* ============================================================
   FORMAT ITEM COUNT
   ------------------------------------------------------------
   Le service Dashboard utilise la somme réelle des quantités
   OrderItem.quantity.

   Exemple :

   Crème x3
   Lotion x2

   => 5 articles
   ============================================================ */

function formatItemCount(
  count:
    number,
): string {
  const safeCount =
    Math.max(
      0,
      count,
    );


  return `${INTEGER_FORMATTER.format(
    safeCount,
  )} article${
    safeCount >
    1
      ? "s"
      : ""
  }`;
}


/* ============================================================
   FORMAT DATE
   ------------------------------------------------------------
   Le schéma actuel ne possède pas encore de timezone propre
   par boutique.

   On reste donc cohérent avec le service Dashboard qui travaille
   actuellement avec des dates UTC.

   Aucun fuseau local arbitraire n'est inventé.
   ============================================================ */

function formatOrderDate(
  value:
    string,
): Readonly<{
  date:
    string;

  time:
    string;

  full:
    string;
}> {
  const parsed =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return {
      date:
        "Date indisponible",

      time:
        "",

      full:
        "Date indisponible",
    };
  }


  const date =
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
    ).format(
      parsed,
    );


  const time =
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
    ).format(
      parsed,
    );


  const full =
    new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,

        timeZone:
          "UTC",
      },
    ).format(
      parsed,
    );


  return {
    date,
    time,
    full,
  };
}


/* ============================================================
   STATUS DISPLAY
   ------------------------------------------------------------
   Correspond exactement aux statuts Order réellement présents
   dans le schéma Prisma actuel.
   ============================================================ */

function getOrderStatusDisplay(
  status:
    DashboardRecentOrder["status"],
): OrderStatusDisplay {
  switch (status) {
    case "PENDING":
      return {
        label:
          "En attente",

        tone:
          "pending",
      };


    case "CONFIRMED":
      return {
        label:
          "Confirmée",

        tone:
          "progress",
      };


    case "PROCESSING":
      return {
        label:
          "En préparation",

        tone:
          "progress",
      };


    case "READY":
      return {
        label:
          "Prête",

        tone:
          "progress",
      };


    case "SHIPPED":
      return {
        label:
          "Expédiée",

        tone:
          "progress",
      };


    case "DELIVERED":
      return {
        label:
          "Livrée",

        tone:
          "success",
      };


    case "CANCELLED":
      return {
        label:
          "Annulée",

        tone:
          "cancelled",
      };


    case "REFUNDED":
      return {
        label:
          "Remboursée",

        tone:
          "refunded",
      };


    default:
      return {
        label:
          "Inconnu",

        tone:
          "cancelled",
      };
  }
}


/* ============================================================
   STATUS BADGE
   ============================================================ */

function OrderStatusBadge({
  status,
}: Readonly<{
  status:
    DashboardRecentOrder["status"];
}>) {
  const display =
    getOrderStatusDisplay(
      status,
    );


  return (
    <span
      className={[
        "gestionnaire-dashboard-recent-orders__status",
        `gestionnaire-dashboard-recent-orders__status--${display.tone}`,
      ].join(
        " ",
      )}
    >
      <span
        className="gestionnaire-dashboard-recent-orders__status-dot"
        aria-hidden="true"
      />

      <span>
        {display.label}
      </span>
    </span>
  );
}


/* ============================================================
   ACTIONS
   ------------------------------------------------------------
   À ce stade, seule l'action dont la route est réellement
   définie est affichée :

   Voir la commande.

   On n'invente pas :
   - préparer ;
   - modifier ;
   - annuler ;
   - changer le statut ;

   tant que les permissions et routes correspondantes ne sont
   pas encore construites.
   ============================================================ */

function OrderActions({
  order,
}: Readonly<{
  order:
    DashboardRecentOrder;
}>) {
  const orderHref =
    gestionnaireRouteBuilders
      .orderDetails(
        order.id,
      );


  return (
    <details
      className="gestionnaire-dashboard-recent-orders__actions"
    >
      <summary
        className="gestionnaire-dashboard-recent-orders__actions-trigger"
        aria-label={`Actions pour la commande ${order.orderNumber}`}
        title="Actions"
      >
        <MoreHorizontal
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </summary>


      <div
        className="gestionnaire-dashboard-recent-orders__actions-menu"
      >
        <Link
          href={
            orderHref
          }
          className="gestionnaire-dashboard-recent-orders__actions-link"
        >
          <Eye
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            Voir la commande
          </span>
        </Link>
      </div>
    </details>
  );
}


/* ============================================================
   DESKTOP ROW
   ============================================================ */

function DesktopOrderRow({
  order,
}: Readonly<{
  order:
    DashboardRecentOrder;
}>) {
  const orderHref =
    gestionnaireRouteBuilders
      .orderDetails(
        order.id,
      );


  const date =
    formatOrderDate(
      order.createdAt,
    );


  return (
    <tr
      className="gestionnaire-dashboard-recent-orders__row"
    >
      {/* ======================================================
          ORDER NUMBER
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell gestionnaire-dashboard-recent-orders__cell--reference"
      >
        <Link
          href={
            orderHref
          }
          className="gestionnaire-dashboard-recent-orders__reference"
        >
          {order.orderNumber}
        </Link>
      </td>


      {/* ======================================================
          CUSTOMER
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell"
      >
        <span
          className="gestionnaire-dashboard-recent-orders__customer"
        >
          {order.customerName ||
            "Cliente non renseignée"}
        </span>
      </td>


      {/* ======================================================
          PRODUCTS
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell"
      >
        <span
          className="gestionnaire-dashboard-recent-orders__items"
        >
          {formatItemCount(
            order.itemCount,
          )}
        </span>
      </td>


      {/* ======================================================
          TOTAL
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell gestionnaire-dashboard-recent-orders__cell--amount"
      >
        <strong
          className="gestionnaire-dashboard-recent-orders__amount"
        >
          {formatMoney(
            order.total,
            order.currency,
          )}
        </strong>
      </td>


      {/* ======================================================
          STATUS
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell"
      >
        <OrderStatusBadge
          status={
            order.status
          }
        />
      </td>


      {/* ======================================================
          DATE
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell"
      >
        <time
          className="gestionnaire-dashboard-recent-orders__date"
          dateTime={
            order.createdAt
          }
          title={
            date.full
          }
        >
          <span
            className="gestionnaire-dashboard-recent-orders__date-main"
          >
            {date.date}
          </span>

          {date.time ? (
            <span
              className="gestionnaire-dashboard-recent-orders__date-time"
            >
              {date.time}
            </span>
          ) : null}
        </time>
      </td>


      {/* ======================================================
          ACTIONS
          ====================================================== */}

      <td
        className="gestionnaire-dashboard-recent-orders__cell gestionnaire-dashboard-recent-orders__cell--actions"
      >
        <OrderActions
          order={
            order
          }
        />
      </td>
    </tr>
  );
}


/* ============================================================
   MOBILE ORDER CARD
   ------------------------------------------------------------
   Le CSS final affichera cette représentation uniquement sur
   les petits écrans.

   On ne crée pas un deuxième service ni une deuxième logique.
   Les mêmes vraies données sont réutilisées.
   ============================================================ */

function MobileOrderCard({
  order,
}: Readonly<{
  order:
    DashboardRecentOrder;
}>) {
  const orderHref =
    gestionnaireRouteBuilders
      .orderDetails(
        order.id,
      );


  const date =
    formatOrderDate(
      order.createdAt,
    );


  return (
    <article
      className="gestionnaire-dashboard-recent-orders__mobile-card"
    >
      {/* ======================================================
          MOBILE TOP
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-recent-orders__mobile-top"
      >
        <div
          className="gestionnaire-dashboard-recent-orders__mobile-order"
        >
          <span
            className="gestionnaire-dashboard-recent-orders__mobile-label"
          >
            Commande
          </span>

          <Link
            href={
              orderHref
            }
            className="gestionnaire-dashboard-recent-orders__reference"
          >
            {order.orderNumber}
          </Link>
        </div>

        <OrderActions
          order={
            order
          }
        />
      </div>


      {/* ======================================================
          CUSTOMER + STATUS
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-recent-orders__mobile-customer-row"
      >
        <strong
          className="gestionnaire-dashboard-recent-orders__mobile-customer"
        >
          {order.customerName ||
            "Cliente non renseignée"}
        </strong>

        <OrderStatusBadge
          status={
            order.status
          }
        />
      </div>


      {/* ======================================================
          MOBILE DETAILS
          ====================================================== */}

      <dl
        className="gestionnaire-dashboard-recent-orders__mobile-details"
      >
        <div
          className="gestionnaire-dashboard-recent-orders__mobile-detail"
        >
          <dt>
            Produits
          </dt>

          <dd>
            {formatItemCount(
              order.itemCount,
            )}
          </dd>
        </div>


        <div
          className="gestionnaire-dashboard-recent-orders__mobile-detail"
        >
          <dt>
            Montant
          </dt>

          <dd>
            {formatMoney(
              order.total,
              order.currency,
            )}
          </dd>
        </div>


        <div
          className="gestionnaire-dashboard-recent-orders__mobile-detail"
        >
          <dt>
            Date
          </dt>

          <dd>
            <time
              dateTime={
                order.createdAt
              }
              title={
                date.full
              }
            >
              {date.date}

              {date.time
                ? `, ${date.time}`
                : ""}
            </time>
          </dd>
        </div>
      </dl>


      {/* ======================================================
          MOBILE VIEW LINK
          ====================================================== */}

      <Link
        href={
          orderHref
        }
        className="gestionnaire-dashboard-recent-orders__mobile-view"
      >
        <span>
          Voir la commande
        </span>

        <ArrowRight
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}


/* ============================================================
   EMPTY STATE
   ============================================================ */

function RecentOrdersEmptyState() {
  return (
    <div
      className="gestionnaire-dashboard-recent-orders__empty"
      role="status"
    >
      <span
        className="gestionnaire-dashboard-recent-orders__empty-icon"
        aria-hidden="true"
      >
        <ShoppingBag
          size={29}
          strokeWidth={1.6}
        />
      </span>

      <strong
        className="gestionnaire-dashboard-recent-orders__empty-title"
      >
        Aucune commande pour le moment
      </strong>

      <p
        className="gestionnaire-dashboard-recent-orders__empty-text"
      >
        Les nouvelles commandes de cette période apparaîtront ici.
      </p>
    </div>
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardRecentOrders({
  orders,
}: DashboardRecentOrdersProps) {
  const hasOrders =
    orders.length >
    0;


  return (
    <section
      className="gestionnaire-dashboard-recent-orders"
      aria-labelledby="gestionnaire-dashboard-recent-orders-title"
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-recent-orders__header"
      >
        <div
          className="gestionnaire-dashboard-recent-orders__heading"
        >
          <h2
            id="gestionnaire-dashboard-recent-orders-title"
            className="gestionnaire-dashboard-recent-orders__title"
          >
            Dernières commandes
          </h2>

          <p
            className="gestionnaire-dashboard-recent-orders__subtitle"
          >
            Les commandes les plus récentes de la période sélectionnée.
          </p>
        </div>


        <Link
          href={
            routes
              .gestionnaire
              .orders
          }
          className="gestionnaire-dashboard-recent-orders__view-all"
        >
          <span>
            Voir toutes les commandes
          </span>

          <ArrowRight
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </Link>
      </div>


      {/* ======================================================
          CONTENT
          ====================================================== */}

      {hasOrders ? (
        <>
          {/* ==================================================
              DESKTOP TABLE
              ================================================== */}

          <div
            className="gestionnaire-dashboard-recent-orders__table-wrapper"
          >
            <table
              className="gestionnaire-dashboard-recent-orders__table"
            >
              <caption
                className="gestionnaire-dashboard-recent-orders__sr-only"
              >
                Dernières commandes de la boutique pour la période sélectionnée
              </caption>

              <thead>
                <tr>
                  <th
                    scope="col"
                  >
                    N° commande
                  </th>

                  <th
                    scope="col"
                  >
                    Client
                  </th>

                  <th
                    scope="col"
                  >
                    Produits
                  </th>

                  <th
                    scope="col"
                  >
                    Montant
                  </th>

                  <th
                    scope="col"
                  >
                    Statut
                  </th>

                  <th
                    scope="col"
                  >
                    Date
                  </th>

                  <th
                    scope="col"
                    className="gestionnaire-dashboard-recent-orders__actions-heading"
                  >
                    <span
                      className="gestionnaire-dashboard-recent-orders__sr-only"
                    >
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {orders.map(
                  (
                    order,
                  ) => (
                    <DesktopOrderRow
                      key={
                        order.id
                      }
                      order={
                        order
                      }
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>


          {/* ==================================================
              MOBILE LIST
              ================================================== */}

          <div
            className="gestionnaire-dashboard-recent-orders__mobile-list"
          >
            {orders.map(
              (
                order,
              ) => (
                <MobileOrderCard
                  key={
                    `mobile-${order.id}`
                  }
                  order={
                    order
                  }
                />
              ),
            )}
          </div>
        </>
      ) : (
        <RecentOrdersEmptyState />
      )}
    </section>
  );
}