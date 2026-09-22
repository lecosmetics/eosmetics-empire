import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  ImageOff,
  MapPin,
  Package,
  Truck,
  UserRound,
} from "lucide-react";

import {
  getManagerOrderStatusLabel,
  getManagerPaymentMethodLabel,
  getManagerPaymentStatusLabel,
  getManagerShipmentStatusLabel,
  type ManagerOrderDetail,
  type ManagerOrderDetailPayment,
  type ManagerOrderDetailShipment,
  type ManagerOrderStatus,
  type ManagerPaymentStatus,
  type ManagerShipmentStatus,
} from "@/lib/gestionnaire/orders/order-types";

import styles from "@/app/gestionnaire/(espace-prive)/commandes/commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/orders/OrderDetailView.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes/[orderId]
 *
 * RÔLE :
 *
 * Afficher le détail réel d'une commande autorisée :
 *
 * - référence ;
 * - statut ;
 * - cliente ;
 * - adresse de livraison ;
 * - articles ;
 * - montants ;
 * - paiements ;
 * - livraisons ;
 * - notes ;
 * - dates principales.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne modifie aucun statut ;
 * - ne crée aucun paiement ;
 * - ne crée aucune livraison ;
 * - n'invente aucune donnée manquante ;
 * - affiche uniquement les données préparées par order-query.ts.
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

export interface OrderDetailViewProps {
  readonly order:
    ManagerOrderDetail;
}


/* ==========================================================================
   FORMAT DECIMAL
   ========================================================================== */

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
   FORMAT MONEY
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
 * Aucun fuseau métier officiel n'est actuellement fourni à ce composant.
 *
 * On garde donc un rendu UTC déterministe au lieu d'inventer un fuseau.
 */

const DATE_FORMATTER =
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


const TIME_FORMATTER =
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


  return `${DATE_FORMATTER.format(
    date,
  )} à ${TIME_FORMATTER.format(
    date,
  )}`;
}


/* ==========================================================================
   SOURCE COMMANDE
   ========================================================================== */

function getOrderSourceLabel(
  source:
    ManagerOrderDetail["source"],
): string {
  switch (
    source
  ) {
    case "WEBSITE":
      return "Site web";

    case "MANAGER":
      return "Gestionnaire";

    case "STORE":
      return "Boutique";

    case "OTHER":
      return "Autre";
  }
}


/* ==========================================================================
   STATUT COMMANDE — CLASSE
   ========================================================================== */

function getOrderStatusClassName(
  status:
    ManagerOrderStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return `${styles.ordersBadge} ${styles.ordersBadgePending}`;

    case "CONFIRMED":
      return `${styles.ordersBadge} ${styles.ordersBadgeConfirmed}`;

    case "PROCESSING":
      return `${styles.ordersBadge} ${styles.ordersBadgeProcessing}`;

    case "READY":
      return `${styles.ordersBadge} ${styles.ordersBadgeReady}`;

    case "SHIPPED":
      return `${styles.ordersBadge} ${styles.ordersBadgeShipped}`;

    case "DELIVERED":
      return `${styles.ordersBadge} ${styles.ordersBadgeDelivered}`;

    case "CANCELLED":
      return `${styles.ordersBadge} ${styles.ordersBadgeCancelled}`;

    case "REFUNDED":
      return `${styles.ordersBadge} ${styles.ordersBadgeRefunded}`;
  }
}


/* ==========================================================================
   STATUT PAIEMENT — CLASSE
   ========================================================================== */

function getPaymentStatusClassName(
  status:
    ManagerPaymentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentPending}`;

    case "PROCESSING":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentProcessing}`;

    case "PAID":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentPaid}`;

    case "FAILED":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentFailed}`;

    case "CANCELLED":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentCancelled}`;

    case "REFUNDED":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentRefunded}`;

    case "PARTIALLY_REFUNDED":
      return `${styles.ordersPaymentBadge} ${styles.ordersPaymentPartiallyRefunded}`;
  }
}


/* ==========================================================================
   STATUT LIVRAISON — CLASSE
   ========================================================================== */

function getShipmentStatusClassName(
  status:
    ManagerShipmentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryPending}`;

    case "PREPARING":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryPreparing}`;

    case "SHIPPED":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryShipped}`;

    case "IN_TRANSIT":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryTransit}`;

    case "DELIVERED":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryDelivered}`;

    case "FAILED":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryFailed}`;

    case "RETURNED":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryReturned}`;

    case "CANCELLED":
      return `${styles.ordersDeliveryBadge} ${styles.ordersDeliveryCancelled}`;
  }
}


/* ==========================================================================
   VALEUR SIMPLE
   ========================================================================== */

function DetailValue({
  label,
  value,
}: {
  readonly label:
    string;

  readonly value:
    string | null | undefined;
}) {
  const normalized =
    typeof value ===
      "string"
      ? value.trim()
      : "";


  return (
    <div
      className={
        styles.orderDetailField
      }
    >
      <dt
        className={
          styles.orderDetailFieldLabel
        }
      >
        {label}
      </dt>

      <dd
        className={
          normalized
            ? styles.orderDetailFieldValue
            : styles.orderDetailFieldEmpty
        }
      >
        {normalized ||
          "—"}
      </dd>
    </div>
  );
}


/* ==========================================================================
   HEADER DÉTAIL
   ========================================================================== */

function OrderDetailHeader({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <header
      className={
        styles.orderDetailHeader
      }
    >
      <Link
        href={
          ORDERS_ROUTE
        }
        className={
          styles.orderDetailBackLink
        }
      >
        <ArrowLeft
          size={17}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span>
          Retour aux commandes
        </span>
      </Link>


      <div
        className={
          styles.orderDetailHeaderRow
        }
      >
        <div
          className={
            styles.orderDetailHeaderContent
          }
        >
          <span
            className={
              styles.orderDetailEyebrow
            }
          >
            Commande
          </span>


          <h1
            className={
              styles.orderDetailTitle
            }
          >
            {order.orderNumber}
          </h1>


          <p
            className={
              styles.orderDetailSubtitle
            }
          >
            Créée le{" "}
            {formatDateTime(
              order.createdAt,
            )}
          </p>
        </div>


        <span
          className={
            getOrderStatusClassName(
              order.status,
            )
          }
        >
          {getManagerOrderStatusLabel(
            order.status,
          )}
        </span>
      </div>
    </header>
  );
}


/* ==========================================================================
   RÉSUMÉ COMMANDE
   ========================================================================== */

function OrderSummaryCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-summary-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <CalendarDays
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-summary-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Informations commande
        </h2>
      </div>


      <dl
        className={
          styles.orderDetailFieldsGrid
        }
      >
        <DetailValue
          label="Référence"
          value={
            order.orderNumber
          }
        />

        <DetailValue
          label="Source"
          value={
            getOrderSourceLabel(
              order.source,
            )
          }
        />

        <DetailValue
          label="Créée le"
          value={
            formatDateTime(
              order.createdAt,
            )
          }
        />

        <DetailValue
          label="Confirmée le"
          value={
            formatDateTime(
              order.confirmedAt,
            )
          }
        />

        <DetailValue
          label="Livrée le"
          value={
            formatDateTime(
              order.deliveredAt,
            )
          }
        />

        <DetailValue
          label="Annulée le"
          value={
            formatDateTime(
              order.cancelledAt,
            )
          }
        />
      </dl>
    </section>
  );
}


/* ==========================================================================
   CLIENTE
   ========================================================================== */

function OrderCustomerCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  const customerName =
    [
      order.customer.firstName,
      order.customer.lastName,
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


  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-customer-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <UserRound
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-customer-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Cliente
        </h2>
      </div>


      <dl
        className={
          styles.orderDetailFieldsGrid
        }
      >
        <DetailValue
          label="Nom"
          value={
            customerName
          }
        />

        <DetailValue
          label="Téléphone"
          value={
            order.customer.phone
          }
        />

        <DetailValue
          label="E-mail"
          value={
            order.customer.email
          }
        />
      </dl>
    </section>
  );
}


/* ==========================================================================
   ADRESSE LIVRAISON
   ========================================================================== */

function OrderShippingAddressCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-address-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <MapPin
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-address-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Adresse de livraison
        </h2>
      </div>


      <dl
        className={
          styles.orderDetailFieldsGrid
        }
      >
        <DetailValue
          label="Destinataire"
          value={
            order.shippingAddress
              .recipientName
          }
        />

        <DetailValue
          label="Téléphone"
          value={
            order.shippingAddress
              .phone
          }
        />

        <DetailValue
          label="Pays"
          value={
            order.shippingAddress
              .country
          }
        />

        <DetailValue
          label="Ville"
          value={
            order.shippingAddress
              .city
          }
        />

        <DetailValue
          label="Adresse"
          value={
            order.shippingAddress
              .address
          }
        />

        <DetailValue
          label="Code postal"
          value={
            order.shippingAddress
              .postalCode
          }
        />
      </dl>
    </section>
  );
}


/* ==========================================================================
   ARTICLES
   ========================================================================== */

function OrderItemsCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-items-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <Package
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-items-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Produits commandés
        </h2>
      </div>


      {order.items.length >
      0 ? (
        <div
          className={
            styles.orderDetailItems
          }
        >
          {order.items.map(
            (
              item,
            ) => (
              <article
                key={
                  item.id
                }
                className={
                  styles.orderDetailItem
                }
              >
                <div
                  className={
                    styles.orderDetailItemImage
                  }
                >
                  {item.image ? (
                    <Image
                      src={
                        item.image.url
                      }
                      alt={
                        item.image.altText?.trim() ||
                        item.productName
                      }
                      fill
                      sizes="64px"
                      className={
                        styles.orderDetailItemImageMedia
                      }
                    />
                  ) : (
                    <span
                      className={
                        styles.orderDetailItemImagePlaceholder
                      }
                      aria-hidden="true"
                    >
                      <ImageOff
                        size={22}
                        strokeWidth={1.7}
                      />
                    </span>
                  )}
                </div>


                <div
                  className={
                    styles.orderDetailItemContent
                  }
                >
                  <strong
                    className={
                      styles.orderDetailItemName
                    }
                  >
                    {item.productName}
                  </strong>


                  {item.sku ? (
                    <span
                      className={
                        styles.orderDetailItemSku
                      }
                    >
                      {item.sku}
                    </span>
                  ) : null}
                </div>


                <div
                  className={
                    styles.orderDetailItemQuantity
                  }
                >
                  <span>
                    Quantité
                  </span>

                  <strong>
                    {item.quantity}
                  </strong>
                </div>


                <div
                  className={
                    styles.orderDetailItemPrice
                  }
                >
                  <span>
                    Prix unitaire
                  </span>

                  <strong>
                    {formatMoney(
                      item.unitPrice.amount,
                      item.unitPrice.currency,
                    )}
                  </strong>
                </div>


                <div
                  className={
                    styles.orderDetailItemTotal
                  }
                >
                  <span>
                    Total
                  </span>

                  <strong>
                    {formatMoney(
                      item.totalPrice.amount,
                      item.totalPrice.currency,
                    )}
                  </strong>
                </div>
              </article>
            ),
          )}
        </div>
      ) : (
        <p
          className={
            styles.orderDetailEmptyText
          }
        >
          Aucun article enregistré pour cette commande.
        </p>
      )}
    </section>
  );
}


/* ==========================================================================
   MONTANTS
   ========================================================================== */

function OrderAmountsCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-amounts-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <CreditCard
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-amounts-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Montants
        </h2>
      </div>


      <dl
        className={
          styles.orderDetailAmounts
        }
      >
        <div
          className={
            styles.orderDetailAmountRow
          }
        >
          <dt>
            Sous-total
          </dt>

          <dd>
            {formatMoney(
              order.amounts.subtotal.amount,
              order.amounts.subtotal.currency,
            )}
          </dd>
        </div>


        <div
          className={
            styles.orderDetailAmountRow
          }
        >
          <dt>
            Réduction
          </dt>

          <dd>
            {formatMoney(
              order.amounts.discount.amount,
              order.amounts.discount.currency,
            )}
          </dd>
        </div>


        <div
          className={
            styles.orderDetailAmountRow
          }
        >
          <dt>
            Livraison
          </dt>

          <dd>
            {formatMoney(
              order.amounts.shipping.amount,
              order.amounts.shipping.currency,
            )}
          </dd>
        </div>


        <div
          className={
            styles.orderDetailAmountRow
          }
        >
          <dt>
            Taxes
          </dt>

          <dd>
            {formatMoney(
              order.amounts.tax.amount,
              order.amounts.tax.currency,
            )}
          </dd>
        </div>


        <div
          className={[
            styles.orderDetailAmountRow,
            styles.orderDetailAmountTotal,
          ].join(
            " ",
          )}
        >
          <dt>
            Total
          </dt>

          <dd>
            {formatMoney(
              order.amounts.total.amount,
              order.amounts.total.currency,
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}


/* ==========================================================================
   PAIEMENT
   ========================================================================== */

function PaymentRecord({
  payment,
}: {
  readonly payment:
    ManagerOrderDetailPayment;
}) {
  return (
    <article
      className={
        styles.orderDetailRecord
      }
    >
      <div
        className={
          styles.orderDetailRecordHeader
        }
      >
        <div>
          <strong
            className={
              styles.orderDetailRecordReference
            }
          >
            {payment.paymentReference}
          </strong>

          <span
            className={
              styles.orderDetailRecordMeta
            }
          >
            {getManagerPaymentMethodLabel(
              payment.method,
            )}
          </span>
        </div>


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
      </div>


      <dl
        className={
          styles.orderDetailRecordGrid
        }
      >
        <DetailValue
          label="Montant"
          value={
            formatMoney(
              payment.amount.amount,
              payment.amount.currency,
            )
          }
        />

        <DetailValue
          label="Prestataire"
          value={
            payment.provider
          }
        />

        <DetailValue
          label="Référence prestataire"
          value={
            payment.providerReference
          }
        />

        <DetailValue
          label="Créé le"
          value={
            formatDateTime(
              payment.createdAt,
            )
          }
        />

        <DetailValue
          label="Payé le"
          value={
            formatDateTime(
              payment.paidAt,
            )
          }
        />

        <DetailValue
          label="Remboursé le"
          value={
            formatDateTime(
              payment.refundedAt,
            )
          }
        />
      </dl>
    </article>
  );
}


function OrderPaymentsCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-payments-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <CreditCard
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-payments-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Paiements
        </h2>
      </div>


      {order.payments.length >
      0 ? (
        <div
          className={
            styles.orderDetailRecords
          }
        >
          {order.payments.map(
            (
              payment,
            ) => (
              <PaymentRecord
                key={
                  payment.id
                }
                payment={
                  payment
                }
              />
            ),
          )}
        </div>
      ) : (
        <p
          className={
            styles.orderDetailEmptyText
          }
        >
          Aucun paiement enregistré.
        </p>
      )}
    </section>
  );
}


/* ==========================================================================
   LIVRAISON
   ========================================================================== */

function ShipmentRecord({
  shipment,
}: {
  readonly shipment:
    ManagerOrderDetailShipment;
}) {
  return (
    <article
      className={
        styles.orderDetailRecord
      }
    >
      <div
        className={
          styles.orderDetailRecordHeader
        }
      >
        <div>
          <strong
            className={
              styles.orderDetailRecordReference
            }
          >
            {shipment.shipmentNumber}
          </strong>

          {shipment.carrier ? (
            <span
              className={
                styles.orderDetailRecordMeta
              }
            >
              {shipment.carrier}
            </span>
          ) : null}
        </div>


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
      </div>


      <dl
        className={
          styles.orderDetailRecordGrid
        }
      >
        <DetailValue
          label="Destinataire"
          value={
            shipment.recipientName
          }
        />

        <DetailValue
          label="Téléphone"
          value={
            shipment.phone
          }
        />

        <DetailValue
          label="Pays"
          value={
            shipment.country
          }
        />

        <DetailValue
          label="Ville"
          value={
            shipment.city
          }
        />

        <DetailValue
          label="Adresse"
          value={
            shipment.address
          }
        />

        <DetailValue
          label="Numéro de suivi"
          value={
            shipment.trackingNumber
          }
        />

        <DetailValue
          label="Coût de livraison"
          value={
            formatMoney(
              shipment.shippingCost.amount,
              shipment.shippingCost.currency,
            )
          }
        />

        <DetailValue
          label="Expédiée le"
          value={
            formatDateTime(
              shipment.shippedAt,
            )
          }
        />

        <DetailValue
          label="Livrée le"
          value={
            formatDateTime(
              shipment.deliveredAt,
            )
          }
        />
      </dl>
    </article>
  );
}


function OrderShipmentsCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-shipments-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <Truck
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-shipments-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Livraison
        </h2>
      </div>


      {order.shipments.length >
      0 ? (
        <div
          className={
            styles.orderDetailRecords
          }
        >
          {order.shipments.map(
            (
              shipment,
            ) => (
              <ShipmentRecord
                key={
                  shipment.id
                }
                shipment={
                  shipment
                }
              />
            ),
          )}
        </div>
      ) : (
        <p
          className={
            styles.orderDetailEmptyText
          }
        >
          Aucune livraison enregistrée.
        </p>
      )}
    </section>
  );
}


/* ==========================================================================
   NOTES
   ========================================================================== */

function OrderNotesCard({
  order,
}: {
  readonly order:
    ManagerOrderDetail;
}) {
  if (
    !order.notes
  ) {
    return null;
  }


  return (
    <section
      className={
        styles.orderDetailCard
      }
      aria-labelledby="order-notes-title"
    >
      <div
        className={
          styles.orderDetailCardHeader
        }
      >
        <div
          className={
            styles.orderDetailCardIcon
          }
          aria-hidden="true"
        >
          <FileText
            size={20}
            strokeWidth={1.8}
          />
        </div>


        <h2
          id="order-notes-title"
          className={
            styles.orderDetailCardTitle
          }
        >
          Notes
        </h2>
      </div>


      <p
        className={
          styles.orderDetailNotes
        }
      >
        {order.notes}
      </p>
    </section>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function OrderDetailView({
  order,
}: OrderDetailViewProps) {
  return (
    <div
      className={
        styles.orderDetailView
      }
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <OrderDetailHeader
        order={
          order
        }
      />


      {/* ===================================================================
          PREMIÈRE LIGNE
          =================================================================== */}

      <div
        className={
          styles.orderDetailTopGrid
        }
      >
        <OrderSummaryCard
          order={
            order
          }
        />

        <OrderCustomerCard
          order={
            order
          }
        />

        <OrderShippingAddressCard
          order={
            order
          }
        />
      </div>


      {/* ===================================================================
          ARTICLES
          =================================================================== */}

      <OrderItemsCard
        order={
          order
        }
      />


      {/* ===================================================================
          FINANCE + PAIEMENTS
          =================================================================== */}

      <div
        className={
          styles.orderDetailTwoColumns
        }
      >
        <OrderAmountsCard
          order={
            order
          }
        />

        <OrderPaymentsCard
          order={
            order
          }
        />
      </div>


      {/* ===================================================================
          LIVRAISONS
          =================================================================== */}

      <OrderShipmentsCard
        order={
          order
        }
      />


      {/* ===================================================================
          NOTES
          =================================================================== */}

      <OrderNotesCard
        order={
          order
        }
      />
    </div>
  );
}