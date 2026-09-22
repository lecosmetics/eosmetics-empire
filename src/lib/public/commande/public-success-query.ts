import "server-only";

import {
  db,
} from "@/prisma/db";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — SUCCESS QUERY
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-success-query.ts
 *
 * Route concernée :
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * - relire une vraie commande publique depuis PostgreSQL ;
 * - relire ses vraies lignes OrderItem ;
 * - relire ses vrais paiements ;
 * - relire son dernier état de livraison ;
 * - relire son Receipt lorsqu'il existe ;
 * - déterminer l'état réel à afficher sur la page succès ;
 * - retourner uniquement des données propres pour l'interface publique.
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * L'accès à :
 *
 * /commande/succes
 *
 * ne constitue JAMAIS une preuve :
 *
 * - qu'une commande existe ;
 * - qu'une commande est confirmée ;
 * - qu'un paiement est réussi ;
 * - qu'un reçu existe ;
 * - qu'un colis a été expédié.
 *
 * Toutes ces informations sont relues dans PostgreSQL.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - lire localStorage ;
 * - lire sessionStorage ;
 * - croire un total reçu du navigateur ;
 * - croire un statut reçu dans l'URL ;
 * - modifier Order ;
 * - modifier Payment ;
 * - modifier Shipment ;
 * - modifier Receipt ;
 * - générer un PDF ;
 * - envoyer un e-mail ;
 * - envoyer WhatsApp ;
 * - inventer une route ;
 * - inventer un statut.
 *
 * Il s'agit exclusivement d'une QUERY serveur en lecture seule.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. LIMITES
   ========================================================================== */

const PUBLIC_SUCCESS_MAX_ORDER_ID_LENGTH =
  191;


/* ==========================================================================
   2. TYPES — STATUT COMMANDE
   ========================================================================== */

export type PublicSuccessOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";


/* ==========================================================================
   3. TYPES — STATUT PAIEMENT
   ========================================================================== */

export type PublicSuccessPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";


export type PublicSuccessPaymentMethod =
  | "CASH"
  | "MOBILE_MONEY"
  | "CARD"
  | "BANK_TRANSFER"
  | "OTHER";


export type PublicSuccessPaymentState =
  | "TO_PAY"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";


/* ==========================================================================
   4. TYPES — LIVRAISON
   ========================================================================== */

export type PublicSuccessShipmentStatus =
  | "PENDING"
  | "PREPARING"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"
  | "CANCELLED";


/* ==========================================================================
   5. TYPES — REÇU
   ========================================================================== */

export type PublicSuccessReceiptStatus =
  | "ISSUED"
  | "CANCELLED";


/* ==========================================================================
   6. ÉTAT GLOBAL PAGE SUCCESS
   ========================================================================== */

/**
 * SUCCESS :
 *
 * La commande est réellement confirmée côté serveur
 * OU un paiement PAID existe réellement.
 *
 * PENDING :
 *
 * La commande existe mais sa confirmation finale
 * n'est pas encore établie.
 *
 * FAILED :
 *
 * La dernière tentative de paiement est en échec
 * et aucune confirmation réelle n'existe.
 *
 * CANCELLED :
 *
 * Order.status = CANCELLED.
 *
 * REFUNDED :
 *
 * Order.status = REFUNDED.
 */
export type PublicSuccessPageState =
  | "SUCCESS"
  | "PENDING"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";


/* ==========================================================================
   7. MONEY
   ========================================================================== */

export interface PublicSuccessMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


/* ==========================================================================
   8. ITEM
   ========================================================================== */

export interface PublicSuccessItem {
  readonly id:
    string;

  readonly storeProductId:
    string | null;

  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly quantity:
    number;

  readonly unitPrice:
    PublicSuccessMoney;

  readonly total:
    PublicSuccessMoney;
}


/* ==========================================================================
   9. CUSTOMER
   ========================================================================== */

export interface PublicSuccessCustomer {
  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly displayName:
    string;

  /**
   * L'adresse complète n'est volontairement pas nécessaire
   * à l'écran public de confirmation.
   */
  readonly maskedEmail:
    string | null;

  readonly hasEmail:
    boolean;
}


/* ==========================================================================
   10. DELIVERY
   ========================================================================== */

export interface PublicSuccessDelivery {
  readonly recipientName:
    string | null;

  readonly country:
    string | null;

  readonly city:
    string | null;

  readonly postalCode:
    string | null;
}


/* ==========================================================================
   11. PAYMENT
   ========================================================================== */

export interface PublicSuccessPayment {
  readonly state:
    PublicSuccessPaymentState;

  readonly stateLabel:
    string;

  readonly method:
    PublicSuccessPaymentMethod | null;

  readonly methodLabel:
    string;

  readonly status:
    PublicSuccessPaymentStatus | null;

  readonly reference:
    string | null;

  readonly provider:
    string | null;

  readonly amount:
    PublicSuccessMoney | null;

  readonly paidAt:
    Date | null;
}


/* ==========================================================================
   12. SHIPMENT
   ========================================================================== */

export interface PublicSuccessShipment {
  readonly id:
    string;

  readonly shipmentNumber:
    string;

  readonly status:
    PublicSuccessShipmentStatus;

  readonly statusLabel:
    string;

  readonly carrier:
    string | null;

  readonly trackingNumber:
    string | null;

  readonly trackingUrl:
    string | null;

  readonly shippedAt:
    Date | null;

  readonly deliveredAt:
    Date | null;
}


/* ==========================================================================
   13. RECEIPT
   ========================================================================== */

export interface PublicSuccessReceipt {
  readonly id:
    string;

  readonly receiptNumber:
    string;

  readonly status:
    PublicSuccessReceiptStatus;

  readonly amount:
    PublicSuccessMoney;

  readonly issuedAt:
    Date;

  readonly emailedAt:
    Date | null;

  /**
   * Le bucket est privé.
   *
   * On ne renvoie donc pas ici directement Receipt.pdfUrl
   * à l'interface publique.
   *
   * Une route serveur dédiée pourra plus tard contrôler
   * le téléchargement.
   */
  readonly pdfStored:
    boolean;
}


/* ==========================================================================
   14. DATA
   ========================================================================== */

export interface PublicSuccessData {
  readonly pageState:
    PublicSuccessPageState;

  readonly order: {
    readonly id:
      string;

    readonly orderNumber:
      string;

    readonly status:
      PublicSuccessOrderStatus;

    readonly statusLabel:
      string;

    readonly createdAt:
      Date;

    readonly confirmedAt:
      Date | null;

    readonly deliveredAt:
      Date | null;

    readonly productsSubtotal:
      PublicSuccessMoney;

    readonly discountAmount:
      PublicSuccessMoney;

    readonly shippingAmount:
      PublicSuccessMoney;

    readonly taxAmount:
      PublicSuccessMoney;

    readonly total:
      PublicSuccessMoney;

    readonly itemsCount:
      number;

    readonly linesCount:
      number;
  };

  readonly customer:
    PublicSuccessCustomer;

  readonly delivery:
    PublicSuccessDelivery;

  readonly items:
    readonly PublicSuccessItem[];

  readonly payment:
    PublicSuccessPayment;

  readonly shipment:
    PublicSuccessShipment | null;

  readonly receipt:
    PublicSuccessReceipt | null;
}


/* ==========================================================================
   15. QUERY RESULT
   ========================================================================== */

export type PublicSuccessQueryErrorCode =
  | "INVALID_ORDER_ID"
  | "ORDER_NOT_FOUND"
  | "INVALID_ORDER_DATA"
  | "SERVER_ERROR";


export type PublicSuccessQueryResult =
  | Readonly<{
      success:
        true;

      data:
        PublicSuccessData;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicSuccessQueryErrorCode;

      message:
        string;
    }>;


/* ==========================================================================
   16. TYPES INTERNES PAIEMENT
   ========================================================================== */

interface PublicSuccessRawPayment {
  readonly paymentReference:
    string;

  readonly method:
    string;

  readonly status:
    string;

  readonly provider:
    string | null;

  readonly providerReference:
    string | null;

  readonly currency:
    string;

  readonly amount: {
    toFixed(
      digits:
        number,
    ): string;
  };

  readonly paidAt:
    Date | null;

  readonly createdAt:
    Date;
}


/* ==========================================================================
   17. NORMALISATION TEXTE
   ========================================================================== */

function normalizeNullableText(
  value:
    string |
    null |
    undefined,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized ||
    null;
}


function normalizeRequiredText(
  value:
    string,
): string | null {
  const normalized =
    value.trim();


  return normalized ||
    null;
}


/* ==========================================================================
   18. NORMALISATION ORDER ID
   ========================================================================== */

function normalizePublicSuccessOrderId(
  value:
    string,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      PUBLIC_SUCCESS_MAX_ORDER_ID_LENGTH
  ) {
    return null;
  }


  /**
   * Les identifiants actuels sont des CUID.
   *
   * On accepte également tiret et underscore afin de ne pas
   * enfermer inutilement l'architecture dans un seul format.
   */
  if (
    !/^[A-Za-z0-9_-]+$/u.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   19. CURRENCY
   ========================================================================== */

function normalizeCurrency(
  value:
    string,
): string | null {
  const currency =
    value
      .trim()
      .toUpperCase();


  if (
    !currency
  ) {
    return null;
  }


  return currency;
}


/* ==========================================================================
   20. MASK EMAIL
   ========================================================================== */

function maskEmail(
  value:
    string |
    null |
    undefined,
): string | null {
  const email =
    normalizeNullableText(
      value,
    );


  if (
    !email
  ) {
    return null;
  }


  const separatorIndex =
    email.lastIndexOf(
      "@",
    );


  if (
    separatorIndex <=
      0 ||
    separatorIndex ===
      email.length - 1
  ) {
    return null;
  }


  const local =
    email.slice(
      0,
      separatorIndex,
    );


  const domain =
    email.slice(
      separatorIndex + 1,
    );


  if (
    !domain
  ) {
    return null;
  }


  if (
    local.length ===
      1
  ) {
    return `${local[0]}***@${domain}`;
  }


  return `${local.slice(
    0,
    2,
  )}***@${domain}`;
}


/* ==========================================================================
   21. ORDER STATUS
   ========================================================================== */

function normalizeOrderStatus(
  value:
    string,
): PublicSuccessOrderStatus | null {
  switch (
    value
  ) {
    case "PENDING":
    case "CONFIRMED":
    case "PROCESSING":
    case "READY":
    case "SHIPPED":
    case "DELIVERED":
    case "CANCELLED":
    case "REFUNDED":
      return value;

    default:
      return null;
  }
}


function getOrderStatusLabel(
  status:
    PublicSuccessOrderStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "CONFIRMED":
      return "Confirmée";

    case "PROCESSING":
      return "En préparation";

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
   22. PAYMENT METHOD
   ========================================================================== */

function normalizePaymentMethod(
  value:
    string,
): PublicSuccessPaymentMethod | null {
  switch (
    value
  ) {
    case "CASH":
    case "MOBILE_MONEY":
    case "CARD":
    case "BANK_TRANSFER":
    case "OTHER":
      return value;

    default:
      return null;
  }
}


function getPaymentMethodLabel(
  method:
    PublicSuccessPaymentMethod | null,
): string {
  switch (
    method
  ) {
    case "CASH":
      return "Espèces";

    case "MOBILE_MONEY":
      return "Mobile Money";

    case "CARD":
      return "Carte bancaire";

    case "BANK_TRANSFER":
      return "Virement bancaire";

    case "OTHER":
      return "Paiement en ligne";

    default:
      return "Paiement";
  }
}


/* ==========================================================================
   23. PAYMENT STATUS
   ========================================================================== */

function normalizePaymentStatus(
  value:
    string,
): PublicSuccessPaymentStatus | null {
  switch (
    value
  ) {
    case "PENDING":
    case "PROCESSING":
    case "PAID":
    case "FAILED":
    case "CANCELLED":
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return value;

    default:
      return null;
  }
}


/* ==========================================================================
   24. SHIPMENT STATUS
   ========================================================================== */

function normalizeShipmentStatus(
  value:
    string,
): PublicSuccessShipmentStatus | null {
  switch (
    value
  ) {
    case "PENDING":
    case "PREPARING":
    case "SHIPPED":
    case "IN_TRANSIT":
    case "DELIVERED":
    case "FAILED":
    case "RETURNED":
    case "CANCELLED":
      return value;

    default:
      return null;
  }
}


function getShipmentStatusLabel(
  status:
    PublicSuccessShipmentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "PREPARING":
      return "En préparation";

    case "SHIPPED":
      return "Expédiée";

    case "IN_TRANSIT":
      return "En transit";

    case "DELIVERED":
      return "Livrée";

    case "FAILED":
      return "Échec de livraison";

    case "RETURNED":
      return "Retournée";

    case "CANCELLED":
      return "Annulée";
  }
}


/* ==========================================================================
   25. RECEIPT STATUS
   ========================================================================== */

function normalizeReceiptStatus(
  value:
    string,
): PublicSuccessReceiptStatus | null {
  switch (
    value
  ) {
    case "ISSUED":
    case "CANCELLED":
      return value;

    default:
      return null;
  }
}


/* ==========================================================================
   26. PAYMENT REFERENCE
   ========================================================================== */

function getPaymentReference(
  payment:
    PublicSuccessRawPayment,
): string | null {
  return (
    normalizeNullableText(
      payment.providerReference,
    ) ??
    normalizeNullableText(
      payment.paymentReference,
    )
  );
}


/* ==========================================================================
   27. RÉSOLUTION PAIEMENT
   ========================================================================== */

function resolvePublicSuccessPayment(
  payments:
    readonly PublicSuccessRawPayment[],

  orderCurrency:
    string,
): PublicSuccessPayment {
  /**
   * Aucun Payment :
   *
   * Le flux actuel considère ce cas comme un paiement
   * restant à effectuer, notamment pour le paiement
   * à la livraison.
   */
  if (
    payments.length ===
      0
  ) {
    return {
      state:
        "TO_PAY",

      stateLabel:
        "À payer",

      method:
        null,

      methodLabel:
        "Paiement à la livraison",

      status:
        null,

      reference:
        null,

      provider:
        null,

      amount:
        null,

      paidAt:
        null,
    };
  }


  /**
   * Un vrai PAID est prioritaire.
   */
  const paidPayment =
    payments.find(
      (
        payment,
      ) =>
        payment.status ===
        "PAID",
    );


  if (
    paidPayment
  ) {
    const method =
      normalizePaymentMethod(
        paidPayment.method,
      );


    const currency =
      normalizeCurrency(
        paidPayment.currency,
      ) ??
      orderCurrency;


    return {
      state:
        "PAID",

      stateLabel:
        "Payé",

      method,

      methodLabel:
        getPaymentMethodLabel(
          method,
        ),

      status:
        "PAID",

      reference:
        getPaymentReference(
          paidPayment,
        ),

      provider:
        normalizeNullableText(
          paidPayment.provider,
        ),

      amount: {
        amount:
          paidPayment.amount.toFixed(
            2,
          ),

        currency,
      },

      paidAt:
        paidPayment.paidAt,
    };
  }


  /**
   * Ensuite, transaction réellement en cours.
   */
  const pendingPayment =
    payments.find(
      (
        payment,
      ) =>
        payment.status ===
          "PROCESSING" ||
        payment.status ===
          "PENDING",
    );


  if (
    pendingPayment
  ) {
    const status =
      normalizePaymentStatus(
        pendingPayment.status,
      );


    const method =
      normalizePaymentMethod(
        pendingPayment.method,
      );


    const currency =
      normalizeCurrency(
        pendingPayment.currency,
      ) ??
      orderCurrency;


    return {
      state:
        "PENDING",

      stateLabel:
        "En attente",

      method,

      methodLabel:
        getPaymentMethodLabel(
          method,
        ),

      status,

      reference:
        getPaymentReference(
          pendingPayment,
        ),

      provider:
        normalizeNullableText(
          pendingPayment.provider,
        ),

      amount: {
        amount:
          pendingPayment.amount.toFixed(
            2,
          ),

        currency,
      },

      paidAt:
        null,
    };
  }


  /**
   * Remboursement.
   */
  const refundedPayment =
    payments.find(
      (
        payment,
      ) =>
        payment.status ===
          "REFUNDED" ||
        payment.status ===
          "PARTIALLY_REFUNDED",
    );


  if (
    refundedPayment
  ) {
    const status =
      normalizePaymentStatus(
        refundedPayment.status,
      );


    const method =
      normalizePaymentMethod(
        refundedPayment.method,
      );


    const currency =
      normalizeCurrency(
        refundedPayment.currency,
      ) ??
      orderCurrency;


    return {
      state:
        "REFUNDED",

      stateLabel:
        status ===
        "PARTIALLY_REFUNDED"
          ? "Partiellement remboursé"
          : "Remboursé",

      method,

      methodLabel:
        getPaymentMethodLabel(
          method,
        ),

      status,

      reference:
        getPaymentReference(
          refundedPayment,
        ),

      provider:
        normalizeNullableText(
          refundedPayment.provider,
        ),

      amount: {
        amount:
          refundedPayment.amount.toFixed(
            2,
          ),

        currency,
      },

      paidAt:
        refundedPayment.paidAt,
    };
  }


  /**
   * Toutes les autres situations restantes sont :
   *
   * FAILED
   * CANCELLED
   *
   * On utilise le paiement le plus récent.
   */
  const latestPayment =
    payments[0];


  if (
    !latestPayment
  ) {
    return {
      state:
        "TO_PAY",

      stateLabel:
        "À payer",

      method:
        null,

      methodLabel:
        "Paiement à la livraison",

      status:
        null,

      reference:
        null,

      provider:
        null,

      amount:
        null,

      paidAt:
        null,
    };
  }


  const status =
    normalizePaymentStatus(
      latestPayment.status,
    );


  const method =
    normalizePaymentMethod(
      latestPayment.method,
    );


  const currency =
    normalizeCurrency(
      latestPayment.currency,
    ) ??
    orderCurrency;


  return {
    state:
      "FAILED",

    stateLabel:
      status ===
      "CANCELLED"
        ? "Annulé"
        : "Échec",

    method,

    methodLabel:
      getPaymentMethodLabel(
        method,
      ),

    status,

    reference:
      getPaymentReference(
        latestPayment,
      ),

    provider:
      normalizeNullableText(
        latestPayment.provider,
      ),

    amount: {
      amount:
        latestPayment.amount.toFixed(
          2,
        ),

      currency,
    },

    paidAt:
      latestPayment.paidAt,
  };
}


/* ==========================================================================
   28. PAGE STATE
   ========================================================================== */

function resolvePublicSuccessPageState(
  orderStatus:
    PublicSuccessOrderStatus,

  payment:
    PublicSuccessPayment,
): PublicSuccessPageState {
  /**
   * Order reste la référence pour une annulation
   * ou un remboursement global.
   */
  if (
    orderStatus ===
    "CANCELLED"
  ) {
    return "CANCELLED";
  }


  if (
    orderStatus ===
    "REFUNDED"
  ) {
    return "REFUNDED";
  }


  /**
   * Un paiement réellement PAID permet également
   * de considérer la commande comme réussie,
   * même si une mise à jour Order est légèrement en retard.
   */
  if (
    payment.state ===
    "PAID"
  ) {
    return "SUCCESS";
  }


  /**
   * États Order signifiant que la commande a dépassé
   * l'étape initiale PENDING.
   *
   * Cela couvre également le paiement à la livraison :
   * la commande peut être confirmée alors que le montant
   * reste à payer.
   */
  if (
    orderStatus ===
      "CONFIRMED" ||
    orderStatus ===
      "PROCESSING" ||
    orderStatus ===
      "READY" ||
    orderStatus ===
      "SHIPPED" ||
    orderStatus ===
      "DELIVERED"
  ) {
    return "SUCCESS";
  }


  if (
    payment.state ===
    "FAILED"
  ) {
    return "FAILED";
  }


  if (
    payment.state ===
    "REFUNDED"
  ) {
    return "REFUNDED";
  }


  return "PENDING";
}


/* ==========================================================================
   29. QUERY PRINCIPALE
   ========================================================================== */

export async function getPublicSuccessData(
  rawOrderId:
    string,
): Promise<PublicSuccessQueryResult> {
  const orderId =
    normalizePublicSuccessOrderId(
      rawOrderId,
    );


  if (
    !orderId
  ) {
    return {
      success:
        false,

      code:
        "INVALID_ORDER_ID",

      message:
        "L’identifiant de commande est invalide.",
    };
  }


  try {
    /**
     * IMPORTANT :
     *
     * On utilise findFirst afin d'imposer également :
     *
     * source = WEBSITE
     *
     * Une commande créée depuis un espace privé Gestionnaire
     * ne doit pas devenir consultable automatiquement depuis
     * la page publique de succès.
     */
    const order =
      await db.order.findFirst({
        where: {
          id:
            orderId,

          source:
            "WEBSITE",
        },

        select: {
          id:
            true,

          orderNumber:
            true,

          status:
            true,

          customerFirstName:
            true,

          customerLastName:
            true,

          customerEmail:
            true,

          shippingRecipientName:
            true,

          shippingCountry:
            true,

          shippingCity:
            true,

          shippingPostalCode:
            true,

          currency:
            true,

          subtotal:
            true,

          discountAmount:
            true,

          shippingAmount:
            true,

          taxAmount:
            true,

          totalAmount:
            true,

          confirmedAt:
            true,

          deliveredAt:
            true,

          createdAt:
            true,

          items: {
            orderBy: {
              createdAt:
                "asc",
            },

            select: {
              id:
                true,

              storeProductId:
                true,

              productName:
                true,

              sku:
                true,

              quantity:
                true,

              unitPrice:
                true,

              totalPrice:
                true,
            },
          },

          payments: {
            orderBy: {
              createdAt:
                "desc",
            },

            select: {
              paymentReference:
                true,

              method:
                true,

              status:
                true,

              provider:
                true,

              providerReference:
                true,

              currency:
                true,

              amount:
                true,

              paidAt:
                true,

              createdAt:
                true,
            },
          },

          shipments: {
            orderBy: {
              createdAt:
                "desc",
            },

            take:
              1,

            select: {
              id:
                true,

              shipmentNumber:
                true,

              status:
                true,

              carrier:
                true,

              trackingNumber:
                true,

              trackingUrl:
                true,

              shippedAt:
                true,

              deliveredAt:
                true,
            },
          },

          receipt: {
            select: {
              id:
                true,

              receiptNumber:
                true,

              status:
                true,

              currency:
                true,

              amount:
                true,

              pdfUrl:
                true,

              issuedAt:
                true,

              emailedAt:
                true,
            },
          },
        },
      });


    /* ======================================================================
       ORDER NOT FOUND
       ====================================================================== */

    if (
      !order
    ) {
      return {
        success:
          false,

        code:
          "ORDER_NOT_FOUND",

        message:
          "La commande est introuvable.",
      };
    }


    /* ======================================================================
       VALIDATION DONNÉES PRINCIPALES
       ====================================================================== */

    const orderNumber =
      normalizeRequiredText(
        order.orderNumber,
      );


    const firstName =
      normalizeRequiredText(
        order.customerFirstName,
      );


    const lastName =
      normalizeRequiredText(
        order.customerLastName,
      );


    const currency =
      normalizeCurrency(
        order.currency,
      );


    const orderStatus =
      normalizeOrderStatus(
        String(
          order.status,
        ),
      );


    if (
      !orderNumber ||
      !firstName ||
      !lastName ||
      !currency ||
      !orderStatus
    ) {
      return {
        success:
          false,

        code:
          "INVALID_ORDER_DATA",

        message:
          "Les informations de la commande sont incomplètes.",
      };
    }


    if (
      order.items.length ===
      0
    ) {
      return {
        success:
          false,

        code:
          "INVALID_ORDER_DATA",

        message:
          "La commande ne contient aucun article.",
      };
    }


    /* ======================================================================
       ITEMS
       ====================================================================== */

    const items:
      PublicSuccessItem[] =
      [];


    let itemsCount =
      0;


    for (
      const item of
      order.items
    ) {
      const productName =
        normalizeRequiredText(
          item.productName,
        );


      if (
        !productName ||
        !Number.isInteger(
          item.quantity,
        ) ||
        item.quantity <=
          0
      ) {
        return {
          success:
            false,

          code:
            "INVALID_ORDER_DATA",

          message:
            "Une ligne de la commande est invalide.",
        };
      }


      itemsCount +=
        item.quantity;


      items.push({
        id:
          item.id,

        storeProductId:
          normalizeNullableText(
            item.storeProductId,
          ),

        productName,

        sku:
          normalizeNullableText(
            item.sku,
          ),

        quantity:
          item.quantity,

        unitPrice: {
          amount:
            item.unitPrice.toFixed(
              2,
            ),

          currency,
        },

        total: {
          amount:
            item.totalPrice.toFixed(
              2,
            ),

          currency,
        },
      });
    }


    /* ======================================================================
       PAYMENT
       ====================================================================== */

    const rawPayments:
      PublicSuccessRawPayment[] =
      order.payments.map(
        (
          payment,
        ) => ({
          paymentReference:
            payment.paymentReference,

          method:
            String(
              payment.method,
            ),

          status:
            String(
              payment.status,
            ),

          provider:
            payment.provider,

          providerReference:
            payment.providerReference,

          currency:
            payment.currency,

          amount:
            payment.amount,

          paidAt:
            payment.paidAt,

          createdAt:
            payment.createdAt,
        }),
      );


    const payment =
      resolvePublicSuccessPayment(
        rawPayments,
        currency,
      );


    /* ======================================================================
       PAGE STATE
       ====================================================================== */

    const pageState =
      resolvePublicSuccessPageState(
        orderStatus,
        payment,
      );


    /* ======================================================================
       SHIPMENT
       ====================================================================== */

    const latestShipment =
      order.shipments[
        0
      ] ??
      null;


    let shipment:
      PublicSuccessShipment | null =
      null;


    if (
      latestShipment
    ) {
      const shipmentStatus =
        normalizeShipmentStatus(
          String(
            latestShipment.status,
          ),
        );


      const shipmentNumber =
        normalizeRequiredText(
          latestShipment.shipmentNumber,
        );


      if (
        shipmentStatus &&
        shipmentNumber
      ) {
        shipment = {
          id:
            latestShipment.id,

          shipmentNumber,

          status:
            shipmentStatus,

          statusLabel:
            getShipmentStatusLabel(
              shipmentStatus,
            ),

          carrier:
            normalizeNullableText(
              latestShipment.carrier,
            ),

          trackingNumber:
            normalizeNullableText(
              latestShipment.trackingNumber,
            ),

          trackingUrl:
            normalizeNullableText(
              latestShipment.trackingUrl,
            ),

          shippedAt:
            latestShipment.shippedAt,

          deliveredAt:
            latestShipment.deliveredAt,
        };
      }
    }


    /* ======================================================================
       RECEIPT
       ====================================================================== */

    let receipt:
      PublicSuccessReceipt | null =
      null;


    if (
      order.receipt
    ) {
      const receiptStatus =
        normalizeReceiptStatus(
          String(
            order.receipt.status,
          ),
        );


      const receiptNumber =
        normalizeRequiredText(
          order.receipt.receiptNumber,
        );


      const receiptCurrency =
        normalizeCurrency(
          order.receipt.currency,
        );


      if (
        receiptStatus &&
        receiptNumber &&
        receiptCurrency
      ) {
        receipt = {
          id:
            order.receipt.id,

          receiptNumber,

          status:
            receiptStatus,

          amount: {
            amount:
              order.receipt.amount.toFixed(
                2,
              ),

            currency:
              receiptCurrency,
          },

          issuedAt:
            order.receipt.issuedAt,

          emailedAt:
            order.receipt.emailedAt,

          pdfStored:
            Boolean(
              normalizeNullableText(
                order.receipt.pdfUrl,
              ),
            ),
        };
      }
    }


    /* ======================================================================
       CUSTOMER
       ====================================================================== */

    const displayName =
      `${firstName} ${lastName}`
        .trim();


    const maskedEmail =
      maskEmail(
        order.customerEmail,
      );


    /* ======================================================================
       RETURN
       ====================================================================== */

    return {
      success:
        true,

      data: {
        pageState,

        order: {
          id:
            order.id,

          orderNumber,

          status:
            orderStatus,

          statusLabel:
            getOrderStatusLabel(
              orderStatus,
            ),

          createdAt:
            order.createdAt,

          confirmedAt:
            order.confirmedAt,

          deliveredAt:
            order.deliveredAt,

          productsSubtotal: {
            amount:
              order.subtotal.toFixed(
                2,
              ),

            currency,
          },

          discountAmount: {
            amount:
              order.discountAmount.toFixed(
                2,
              ),

            currency,
          },

          shippingAmount: {
            amount:
              order.shippingAmount.toFixed(
                2,
              ),

            currency,
          },

          taxAmount: {
            amount:
              order.taxAmount.toFixed(
                2,
              ),

            currency,
          },

          total: {
            amount:
              order.totalAmount.toFixed(
                2,
              ),

            currency,
          },

          itemsCount,

          linesCount:
            items.length,
        },

        customer: {
          firstName,

          lastName,

          displayName,

          maskedEmail,

          hasEmail:
            Boolean(
              normalizeNullableText(
                order.customerEmail,
              ),
            ),
        },

        delivery: {
          recipientName:
            normalizeNullableText(
              order.shippingRecipientName,
            ),

          country:
            normalizeNullableText(
              order.shippingCountry,
            ),

          city:
            normalizeNullableText(
              order.shippingCity,
            ),

          postalCode:
            normalizeNullableText(
              order.shippingPostalCode,
            ),
        },

        items,

        payment,

        shipment,

        receipt,
      },
    };
  } catch (
    error
  ) {
    console.error(
      "[L&E Cosmetics Empire] Échec lecture page succès publique.",
      {
        orderId,

        errorName:
          error instanceof
            Error
            ? error.name
            : "UnknownError",
      },
    );


    return {
      success:
        false,

      code:
        "SERVER_ERROR",

      message:
        "Impossible de charger les informations de la commande actuellement.",
    };
  }
}


/* ==========================================================================
   30. ALIAS EXPLICITE
   ========================================================================== */

/**
 * Alias pratique pour une Server Page.
 *
 * Permet :
 *
 * const result = await loadPublicSuccessData(orderId);
 *
 * Les deux fonctions utilisent exactement la même logique.
 */
export async function loadPublicSuccessData(
  orderId:
    string,
): Promise<PublicSuccessQueryResult> {
  return getPublicSuccessData(
    orderId,
  );
}


/* ==========================================================================
   31. TYPE GUARDS
   ========================================================================== */

export function isPublicSuccessConfirmed(
  data:
    PublicSuccessData,
): boolean {
  return data.pageState ===
    "SUCCESS";
}


export function isPublicSuccessPending(
  data:
    PublicSuccessData,
): boolean {
  return data.pageState ===
    "PENDING";
}


export function isPublicSuccessUnavailable(
  data:
    PublicSuccessData,
): boolean {
  return (
    data.pageState ===
      "FAILED" ||
    data.pageState ===
      "CANCELLED" ||
    data.pageState ===
      "REFUNDED"
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * SOURCE DE VÉRITÉ :
 *
 * PostgreSQL
 *
 * ============================================================================
 *
 * ORDER
 *
 * - orderNumber
 * - status
 * - customer snapshot
 * - delivery snapshot
 * - subtotal
 * - discountAmount
 * - shippingAmount
 * - taxAmount
 * - totalAmount
 * - confirmedAt
 * - deliveredAt
 *
 * ============================================================================
 *
 * ORDER ITEM
 *
 * - productName
 * - sku
 * - quantity
 * - unitPrice
 * - totalPrice
 *
 * ============================================================================
 *
 * PAYMENT
 *
 * - method
 * - status
 * - provider
 * - providerReference
 * - paymentReference
 * - amount
 * - currency
 * - paidAt
 *
 * ============================================================================
 *
 * SHIPMENT
 *
 * - shipmentNumber
 * - status
 * - carrier
 * - trackingNumber
 * - trackingUrl
 * - shippedAt
 * - deliveredAt
 *
 * ============================================================================
 *
 * RECEIPT
 *
 * - receiptNumber
 * - status
 * - amount
 * - currency
 * - pdfUrl
 * - issuedAt
 * - emailedAt
 *
 * ============================================================================
 *
 * AUCUNE DONNÉE FINANCIÈRE DU NAVIGATEUR N'EST UTILISÉE.
 *
 * ============================================================================
 */