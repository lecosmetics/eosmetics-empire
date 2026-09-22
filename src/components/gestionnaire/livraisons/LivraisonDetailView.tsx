import Link from "next/link";

import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@prisma/client";

import {
  ArrowLeft,
  Banknote,
  Box,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Truck,
  UserRound,
} from "lucide-react";

import {
  getManagerShipmentStatusLabel,
  type ManagerShipmentDetail,
  type ManagerShipmentMoney,
  type ManagerShipmentStatus,
} from "@/lib/gestionnaire/livraisons/shipment-types";

import LivraisonDetailActions from "./LivraisonDetailActions";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL LIVRAISON
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonDetailView.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher le détail réel d'un Shipment ;
 * - afficher la cliente liée à la commande ;
 * - afficher l'adresse réellement enregistrée dans Shipment ;
 * - afficher la commande associée ;
 * - afficher les OrderItem réels ;
 * - afficher les paiements réels ;
 * - afficher le transporteur et le tracking seulement s'ils existent ;
 * - afficher uniquement les dates réellement disponibles ;
 * - afficher les actions autorisées calculées côté serveur ;
 * - rester compatible avec le GestionnaireShell existant.
 *
 * IMPORTANT :
 *
 * CE COMPOSANT NE :
 *
 * - ne récupère aucune donnée lui-même ;
 * - ne modifie aucune livraison ;
 * - ne modifie aucune commande ;
 * - ne modifie aucun paiement ;
 * - n'invente aucune image produit ;
 * - n'invente aucun historique ;
 * - n'invente aucun transporteur ;
 * - n'invente aucun tracking ;
 * - n'invente aucune date de préparation ;
 * - n'invente aucun motif d'annulation.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES CONNUES
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


const COMMANDES_ROUTE =
  "/gestionnaire/commandes";


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonDetailViewProps {
  readonly delivery:
    ManagerShipmentDetail;
}


/* ==========================================================================
   DATE FORMATTERS
   ========================================================================== */

const dateFormatter =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "long",

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
        "long",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );


/* ==========================================================================
   TEXT FALLBACK
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
   DATE
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
   DATE TIME
   ========================================================================== */

function formatDateTime(
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


  return dateTimeFormatter.format(
    date,
  );
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function formatMoney(
  money:
    ManagerShipmentMoney,
): string {
  const amount =
    Number(
      money.amount,
    );


  const currency =
    money.currency.trim();


  if (
    !Number.isFinite(
      amount,
    )
  ) {
    return `${money.amount} ${currency}`.trim();
  }


  if (
    !currency
  ) {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    );
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency,

        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    );
  } catch {
    return `${new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    )} ${currency}`;
  }
}


/* ==========================================================================
   ARTICLE COUNT
   ========================================================================== */

function getTotalArticleCount(
  delivery:
    ManagerShipmentDetail,
): number {
  return delivery.items.reduce(
    (
      total,
      item,
    ) =>
      total +
      item.quantity,
    0,
  );
}


/* ==========================================================================
   SHIPMENT STATUS CLASS
   ========================================================================== */

function getShipmentStatusClassName(
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
   SHIPMENT STATUS BADGE
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
        getShipmentStatusClassName(
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
   ORDER STATUS LABEL
   ========================================================================== */

function getOrderStatusLabel(
  status:
    OrderStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "CONFIRMED":
      return "Confirmée";

    case "PROCESSING":
      return "En traitement";

    case "READY":
      return "Prête";

    case "SHIPPED":
      return "Expédiée";

    case "DELIVERED":
      return "Livrée";

    case "CANCELLED":
      return "Annulée";

    case "REFUNDED":
      return "Remboursée";
  }
}


/* ==========================================================================
   PAYMENT STATUS LABEL
   ========================================================================== */

function getPaymentStatusLabel(
  status:
    PaymentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "PROCESSING":
      return "En traitement";

    case "PAID":
      return "Payé";

    case "FAILED":
      return "Échoué";

    case "CANCELLED":
      return "Annulé";

    case "REFUNDED":
      return "Remboursé";

    case "PARTIALLY_REFUNDED":
      return "Partiellement remboursé";
  }
}


/* ==========================================================================
   PAYMENT STATUS CLASS
   ========================================================================== */

function getPaymentStatusClassName(
  status:
    PaymentStatus,
): string {
  switch (
    status
  ) {
    case "PAID":
      return styles.livraisonDetailPaymentPaid;

    case "PENDING":
    case "PROCESSING":
      return styles.livraisonDetailPaymentPending;

    case "FAILED":
    case "CANCELLED":
      return styles.livraisonDetailPaymentFailed;

    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return styles.livraisonDetailPaymentRefunded;
  }
}


/* ==========================================================================
   PAYMENT METHOD
   ========================================================================== */

function getPaymentMethodLabel(
  method:
    PaymentMethod,
): string {
  switch (
    method
  ) {
    case "CASH":
      return "Espèces";

    case "MOBILE_MONEY":
      return "Mobile Money";

    case "CARD":
      return "Carte";

    case "BANK_TRANSFER":
      return "Virement bancaire";

    case "OTHER":
      return "Autre";
  }
}


/* ==========================================================================
   SAFE TRACKING URL
   ========================================================================== */

/**
 * trackingUrl provient de la base.
 *
 * On ne l'utilise comme lien externe que s'il s'agit réellement
 * d'une URL HTTP ou HTTPS.
 */

function getSafeTrackingUrl(
  value:
    string | null,
): string | null {
  if (
    !value
  ) {
    return null;
  }


  try {
    const url =
      new URL(
        value,
      );


    if (
      url.protocol !==
        "https:" &&
      url.protocol !==
        "http:"
    ) {
      return null;
    }


    return url.toString();
  } catch {
    return null;
  }
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LivraisonDetailView({
  delivery,
}: LivraisonDetailViewProps) {
  const {
    shipment,
    customer,
    address,
    order,
    items,
    authorizedActions,
  } =
    delivery;


  const totalArticleCount =
    getTotalArticleCount(
      delivery,
    );


  const trackingUrl =
    getSafeTrackingUrl(
      shipment.trackingUrl,
    );


  const orderHref =
    `${COMMANDES_ROUTE}/${encodeURIComponent(
      order.id,
    )}`;


  return (
    <div className={styles.livraisonDetail}>
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <header className={styles.livraisonDetailHeader}>
        <nav
          className={styles.livraisonDetailBreadcrumb}
          aria-label="Fil d’Ariane"
        >
          <Link
            href={LIVRAISONS_ROUTE}
            className={styles.livraisonDetailBreadcrumbLink}
          >
            Livraisons
          </Link>


          <span
            className={styles.livraisonDetailBreadcrumbSeparator}
            aria-hidden="true"
          >
            /
          </span>


          <span
            className={styles.livraisonDetailBreadcrumbCurrent}
            aria-current="page"
          >
            {shipment.shipmentNumber}
          </span>
        </nav>


        <div className={styles.livraisonDetailHeaderMain}>
          <div className={styles.livraisonDetailHeaderCopy}>
            <Link
              href={LIVRAISONS_ROUTE}
              className={styles.livraisonDetailBackLink}
            >
              <ArrowLeft
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                Retour aux livraisons
              </span>
            </Link>


            <div className={styles.livraisonDetailTitleRow}>
              <h1 className={styles.livraisonDetailTitle}>
                Livraison{" "}
                {shipment.shipmentNumber}
              </h1>


              <ShipmentStatusBadge
                status={shipment.status}
              />
            </div>


            <p className={styles.livraisonDetailSubtitle}>
              Consultez les informations de cette livraison et gérez
              son état.
            </p>
          </div>
        </div>
      </header>


      {/* ==================================================================
          SUMMARY
          ================================================================== */}

      <section
        className={styles.livraisonDetailSummaryGrid}
        aria-label="Résumé de la livraison"
      >
        <article className={styles.livraisonDetailSummaryCard}>
          <span className={styles.livraisonDetailSummaryIcon}>
            <Truck
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>

          <div>
            <span className={styles.livraisonDetailSummaryLabel}>
              Statut
            </span>

            <strong className={styles.livraisonDetailSummaryValue}>
              {getManagerShipmentStatusLabel(
                shipment.status,
              )}
            </strong>
          </div>
        </article>


        <article className={styles.livraisonDetailSummaryCard}>
          <span className={styles.livraisonDetailSummaryIcon}>
            <ClipboardList
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>

          <div>
            <span className={styles.livraisonDetailSummaryLabel}>
              Commande
            </span>

            <strong className={styles.livraisonDetailSummaryValue}>
              {order.orderNumber}
            </strong>
          </div>
        </article>


        <article className={styles.livraisonDetailSummaryCard}>
          <span className={styles.livraisonDetailSummaryIcon}>
            <Package
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>

          <div>
            <span className={styles.livraisonDetailSummaryLabel}>
              Articles
            </span>

            <strong className={styles.livraisonDetailSummaryValue}>
              {totalArticleCount}
            </strong>
          </div>
        </article>


        <article className={styles.livraisonDetailSummaryCard}>
          <span className={styles.livraisonDetailSummaryIcon}>
            <CheckCircle2
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>

          <div>
            <span className={styles.livraisonDetailSummaryLabel}>
              Date de livraison
            </span>

            <strong className={styles.livraisonDetailSummaryValue}>
              {formatDate(
                shipment.deliveredAt,
              )}
            </strong>
          </div>
        </article>
      </section>


      {/* ==================================================================
          INFORMATION + CUSTOMER
          ================================================================== */}

      <div className={styles.livraisonDetailTwoColumns}>
        {/* ================================================================
            SHIPMENT INFORMATION
            ================================================================ */}

        <section
          className={styles.livraisonDetailCard}
          aria-labelledby="livraison-detail-information-title"
        >
          <div className={styles.livraisonDetailCardHeader}>
            <div>
              <span
                className={styles.livraisonDetailCardIcon}
                aria-hidden="true"
              >
                <Truck
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <h2
                id="livraison-detail-information-title"
                className={styles.livraisonDetailCardTitle}
              >
                Informations livraison
              </h2>
            </div>
          </div>


          <dl className={styles.livraisonDetailInfoList}>
            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Référence
              </dt>

              <dd>
                {shipment.shipmentNumber}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Statut
              </dt>

              <dd>
                <ShipmentStatusBadge
                  status={shipment.status}
                />
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Transporteur
              </dt>

              <dd>
                {displayText(
                  shipment.carrier,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Numéro de suivi
              </dt>

              <dd>
                {displayText(
                  shipment.trackingNumber,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Suivi
              </dt>

              <dd>
                {trackingUrl ? (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={styles.livraisonDetailExternalLink}
                  >
                    <span>
                      Ouvrir le suivi
                    </span>

                    <ExternalLink
                      size={14}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Frais de livraison
              </dt>

              <dd>
                {formatMoney(
                  shipment.shippingCost,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Date de création
              </dt>

              <dd>
                {formatDateTime(
                  shipment.createdAt,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Date d’expédition
              </dt>

              <dd>
                {formatDateTime(
                  shipment.shippedAt,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Date de livraison
              </dt>

              <dd>
                {formatDateTime(
                  shipment.deliveredAt,
                )}
              </dd>
            </div>
          </dl>
        </section>


        {/* ================================================================
            CUSTOMER
            ================================================================ */}

        <section
          className={styles.livraisonDetailCard}
          aria-labelledby="livraison-detail-customer-title"
        >
          <div className={styles.livraisonDetailCardHeader}>
            <div>
              <span
                className={styles.livraisonDetailCardIcon}
                aria-hidden="true"
              >
                <UserRound
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <h2
                id="livraison-detail-customer-title"
                className={styles.livraisonDetailCardTitle}
              >
                Cliente
              </h2>
            </div>
          </div>


          <div className={styles.livraisonDetailCustomer}>
            <div className={styles.livraisonDetailCustomerIdentity}>
              <span
                className={styles.livraisonDetailCustomerAvatar}
                aria-hidden="true"
              >
                {customer.firstName
                  .trim()
                  .charAt(
                    0,
                  )
                  .toUpperCase() ||
                  customer.fullName
                    .trim()
                    .charAt(
                      0,
                    )
                    .toUpperCase() ||
                  "C"}
              </span>


              <div>
                <strong className={styles.livraisonDetailCustomerName}>
                  {displayText(
                    customer.fullName,
                  )}
                </strong>

                <span className={styles.livraisonDetailCustomerCaption}>
                  Cliente de la commande
                </span>
              </div>
            </div>


            <dl className={styles.livraisonDetailInfoList}>
              <div className={styles.livraisonDetailInfoRow}>
                <dt>
                  Prénom
                </dt>

                <dd>
                  {displayText(
                    customer.firstName,
                  )}
                </dd>
              </div>


              <div className={styles.livraisonDetailInfoRow}>
                <dt>
                  Nom
                </dt>

                <dd>
                  {displayText(
                    customer.lastName,
                  )}
                </dd>
              </div>


              <div className={styles.livraisonDetailInfoRow}>
                <dt>
                  <span className={styles.livraisonDetailInfoLabelIcon}>
                    <Phone
                      size={14}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    Téléphone
                  </span>
                </dt>

                <dd>
                  {customer.phone ? (
                    <a
                      href={`tel:${customer.phone}`}
                      className={styles.livraisonDetailContactLink}
                    >
                      {customer.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>


              <div className={styles.livraisonDetailInfoRow}>
                <dt>
                  <span className={styles.livraisonDetailInfoLabelIcon}>
                    <Mail
                      size={14}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    E-mail
                  </span>
                </dt>

                <dd>
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className={styles.livraisonDetailContactLink}
                    >
                      {customer.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>


      {/* ==================================================================
          ADDRESS + ORDER
          ================================================================== */}

      <div className={styles.livraisonDetailTwoColumns}>
        {/* ================================================================
            ADDRESS
            ================================================================ */}

        <section
          className={styles.livraisonDetailCard}
          aria-labelledby="livraison-detail-address-title"
        >
          <div className={styles.livraisonDetailCardHeader}>
            <div>
              <span
                className={styles.livraisonDetailCardIcon}
                aria-hidden="true"
              >
                <MapPin
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <h2
                id="livraison-detail-address-title"
                className={styles.livraisonDetailCardTitle}
              >
                Adresse de livraison
              </h2>
            </div>
          </div>


          <dl className={styles.livraisonDetailInfoList}>
            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Destinataire
              </dt>

              <dd>
                {displayText(
                  address.recipientName,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Téléphone
              </dt>

              <dd>
                {displayText(
                  address.phone,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Adresse
              </dt>

              <dd>
                {displayText(
                  address.address,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Ville
              </dt>

              <dd>
                {displayText(
                  address.city,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Pays
              </dt>

              <dd>
                {displayText(
                  address.country,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Code postal
              </dt>

              <dd>
                {displayText(
                  address.postalCode,
                )}
              </dd>
            </div>
          </dl>
        </section>


        {/* ================================================================
            ORDER
            ================================================================ */}

        <section
          className={styles.livraisonDetailCard}
          aria-labelledby="livraison-detail-order-title"
        >
          <div className={styles.livraisonDetailCardHeader}>
            <div>
              <span
                className={styles.livraisonDetailCardIcon}
                aria-hidden="true"
              >
                <ReceiptText
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <h2
                id="livraison-detail-order-title"
                className={styles.livraisonDetailCardTitle}
              >
                Commande
              </h2>
            </div>


            <Link
              href={orderHref}
              className={styles.livraisonDetailOrderLink}
            >
              <span>
                Voir la commande
              </span>

              <ExternalLink
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </Link>
          </div>


          <dl className={styles.livraisonDetailInfoList}>
            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Référence
              </dt>

              <dd>
                {order.orderNumber}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Statut commande
              </dt>

              <dd>
                {getOrderStatusLabel(
                  order.status,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Montant
              </dt>

              <dd>
                <strong>
                  {formatMoney(
                    order.total,
                  )}
                </strong>
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Créée le
              </dt>

              <dd>
                {formatDateTime(
                  order.createdAt,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Confirmée le
              </dt>

              <dd>
                {formatDateTime(
                  order.confirmedAt,
                )}
              </dd>
            </div>


            <div className={styles.livraisonDetailInfoRow}>
              <dt>
                Livrée le
              </dt>

              <dd>
                {formatDateTime(
                  order.deliveredAt,
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>


      {/* ==================================================================
          PRODUCTS
          ================================================================== */}

      <section
        className={styles.livraisonDetailCard}
        aria-labelledby="livraison-detail-products-title"
      >
        <div className={styles.livraisonDetailCardHeader}>
          <div>
            <span
              className={styles.livraisonDetailCardIcon}
              aria-hidden="true"
            >
              <Box
                size={19}
                strokeWidth={1.8}
              />
            </span>

            <div>
              <h2
                id="livraison-detail-products-title"
                className={styles.livraisonDetailCardTitle}
              >
                Produits
              </h2>

              <span className={styles.livraisonDetailCardSubtitle}>
                {totalArticleCount}{" "}
                {totalArticleCount >
                1
                  ? "articles"
                  : "article"}
              </span>
            </div>
          </div>
        </div>


        <div className={styles.livraisonDetailProductsScroll}>
          <table className={styles.livraisonDetailProductsTable}>
            <thead>
              <tr>
                <th scope="col">
                  Produit
                </th>

                <th scope="col">
                  SKU
                </th>

                <th scope="col">
                  Quantité
                </th>

                <th scope="col">
                  Prix unitaire
                </th>

                <th scope="col">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map(
                (
                  item,
                ) => (
                  <tr key={item.id}>
                    <td>
                      <div className={styles.livraisonDetailProductIdentity}>
                        <span
                          className={styles.livraisonDetailProductIcon}
                          aria-hidden="true"
                        >
                          <Package
                            size={18}
                            strokeWidth={1.8}
                          />
                        </span>

                        <strong>
                          {displayText(
                            item.productName,
                          )}
                        </strong>
                      </div>
                    </td>

                    <td>
                      {displayText(
                        item.sku,
                      )}
                    </td>

                    <td>
                      {item.quantity}
                    </td>

                    <td>
                      {formatMoney(
                        item.unitPrice,
                      )}
                    </td>

                    <td>
                      <strong>
                        {formatMoney(
                          item.totalPrice,
                        )}
                      </strong>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>


      {/* ==================================================================
          PAYMENTS
          ================================================================== */}

      <section
        className={styles.livraisonDetailCard}
        aria-labelledby="livraison-detail-payments-title"
      >
        <div className={styles.livraisonDetailCardHeader}>
          <div>
            <span
              className={styles.livraisonDetailCardIcon}
              aria-hidden="true"
            >
              <CircleDollarSign
                size={19}
                strokeWidth={1.8}
              />
            </span>

            <div>
              <h2
                id="livraison-detail-payments-title"
                className={styles.livraisonDetailCardTitle}
              >
                Paiement
              </h2>

              <span className={styles.livraisonDetailCardSubtitle}>
                Informations liées à la commande
              </span>
            </div>
          </div>
        </div>


        {order.payments.length >
        0 ? (
          <div className={styles.livraisonDetailPaymentsList}>
            {order.payments.map(
              (
                payment,
              ) => (
                <article
                  key={payment.id}
                  className={styles.livraisonDetailPayment}
                >
                  <div className={styles.livraisonDetailPaymentMain}>
                    <span
                      className={styles.livraisonDetailPaymentIcon}
                      aria-hidden="true"
                    >
                      {payment.method ===
                      "CASH" ? (
                        <Banknote
                          size={18}
                          strokeWidth={1.8}
                        />
                      ) : (
                        <CreditCard
                          size={18}
                          strokeWidth={1.8}
                        />
                      )}
                    </span>


                    <div className={styles.livraisonDetailPaymentCopy}>
                      <strong>
                        {getPaymentMethodLabel(
                          payment.method,
                        )}
                      </strong>

                      <span>
                        {payment.paymentReference}
                      </span>
                    </div>
                  </div>


                  <div className={styles.livraisonDetailPaymentMeta}>
                    <strong>
                      {formatMoney(
                        payment.amount,
                      )}
                    </strong>

                    <span
                      className={[
                        styles.livraisonDetailPaymentStatus,
                        getPaymentStatusClassName(
                          payment.status,
                        ),
                      ].join(" ")}
                    >
                      {getPaymentStatusLabel(
                        payment.status,
                      )}
                    </span>
                  </div>


                  <dl className={styles.livraisonDetailPaymentDetails}>
                    <div>
                      <dt>
                        Fournisseur
                      </dt>

                      <dd>
                        {displayText(
                          payment.provider,
                        )}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Référence fournisseur
                      </dt>

                      <dd>
                        {displayText(
                          payment.providerReference,
                        )}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Payé le
                      </dt>

                      <dd>
                        {formatDateTime(
                          payment.paidAt,
                        )}
                      </dd>
                    </div>
                  </dl>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className={styles.livraisonDetailNoPayment}>
            <CircleDollarSign
              size={22}
              strokeWidth={1.7}
              aria-hidden="true"
            />

            <span>
              Aucun paiement enregistré pour cette commande.
            </span>
          </div>
        )}
      </section>


      {/* ==================================================================
          ACTIONS
          ================================================================== */}

      <LivraisonDetailActions
        shipmentId={shipment.id}
        shipmentNumber={shipment.shipmentNumber}
        currentStatus={shipment.status}
        authorizedActions={authorizedActions}
      />
    </div>
  );
}