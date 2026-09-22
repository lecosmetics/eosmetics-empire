import "server-only";

import {
  Buffer,
} from "node:buffer";

import * as React from "react";

import {
  Resend,
} from "resend";

import OrderConfirmationEmail, {
  buildOrderConfirmationText,
} from "@/emails/order-confirmation";

import type {
  OrderConfirmationEmailProps,
} from "@/emails/order-confirmation";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import {
  db,
} from "@/prisma/db";

import {
  generateAndStorePublicOrderReceipt,
} from "@/lib/public/commande/public-order-receipt";

import type {
  StoredPublicOrderReceipt,
} from "@/lib/public/commande/public-order-receipt";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — E-MAIL DE CONFIRMATION
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-order-email.ts
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - relire la vraie commande depuis PostgreSQL ;
 * - vérifier l'adresse e-mail enregistrée sur la commande ;
 * - éviter les doubles envois involontaires ;
 * - générer et stocker le vrai reçu PDF ;
 * - construire le vrai e-mail de confirmation ;
 * - joindre le reçu PDF ;
 * - envoyer avec Resend ;
 * - journaliser l'envoi dans EmailLog ;
 * - mettre à jour Receipt.emailedAt après succès ;
 * - retourner un résultat structuré.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier ne fait jamais confiance au navigateur pour :
 *
 * - les produits ;
 * - les prix ;
 * - la devise ;
 * - le total ;
 * - les frais de livraison ;
 * - le paiement ;
 * - le numéro de reçu ;
 * - l'adresse e-mail finale utilisée pour l'envoi.
 *
 * Les données importantes sont relues côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONSTANTES
   ========================================================================== */

const PUBLIC_ORDER_EMAIL_PROVIDER =
  "resend" as const;


const PUBLIC_ORDER_EMAIL_REFERENCE_TYPE =
  "ORDER" as const;


const PUBLIC_ORDER_EMAIL_TYPE =
  "ORDER_CONFIRMATION" as const;


const PUBLIC_ORDER_EMAIL_PENDING_TTL_MS =
  10 * 60 * 1000;


const PUBLIC_ORDER_EMAIL_MAX_FAILURE_REASON_LENGTH =
  500;


const PUBLIC_ORDER_EMAIL_MAX_SUBJECT_LENGTH =
  190;


const PUBLIC_ORDER_EMAIL_MAX_HEADER_VALUE_LENGTH =
  500;


const PUBLIC_ORDER_EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/* ==========================================================================
   2. TAGS RESEND
   ========================================================================== */

const PUBLIC_ORDER_EMAIL_MODULE_TAG = {
  name:
    "module",

  value:
    "public-orders",
} as const;


const PUBLIC_ORDER_EMAIL_EVENT_TAG = {
  name:
    "event",

  value:
    "order-confirmation",
} as const;


/* ==========================================================================
   3. TYPES
   ========================================================================== */

export interface SendPublicOrderConfirmationEmailOptions {
  /**
   * Permet un renvoi volontaire.
   *
   * false :
   * on protège contre les doubles envois.
   *
   * true :
   * un nouvel envoi est volontairement autorisé.
   */
  readonly forceResend?:
    boolean;
}


export type PublicOrderEmailErrorCode =
  | "INVALID_ORDER_ID"
  | "ORDER_NOT_FOUND"
  | "RECEIPT_NOT_FOUND"
  | "RECIPIENT_MISSING"
  | "RECIPIENT_INVALID"
  | "EMAIL_ALREADY_PROCESSING"
  | "RECEIPT_GENERATION_FAILED"
  | "EMAIL_LOG_CREATE_FAILED"
  | "EMAIL_SEND_FAILED"
  | "SERVER_ERROR";


export type SendPublicOrderConfirmationEmailResult =
  | Readonly<{
      success:
        true;

      orderId:
        string;

      orderNumber:
        string;

      emailLogId:
        string | null;

      providerMessageId:
        string | null;

      receiptId:
        string;

      receiptFileName:
        string | null;

      sentAt:
        Date;

      alreadySent:
        boolean;

      trackingComplete:
        boolean;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicOrderEmailErrorCode;

      message:
        string;
    }>;


/**
 * Résultat interne de la petite requête de métadonnées.
 *
 * receipt est volontairement NON nullable ici.
 *
 * La fonction loadPublicOrderEmailMetadata() refuse de retourner
 * tant qu'un Receipt valide n'existe pas.
 */
interface PublicOrderEmailMetadata {
  readonly id:
    string;

  readonly storeId:
    string;

  readonly orderNumber:
    string;

  readonly customerEmail:
    string | null;

  readonly receipt: {
    readonly id:
      string;

    readonly emailedAt:
      Date | null;
  };
}


/* ==========================================================================
   4. ERREUR INTERNE
   ========================================================================== */

class PublicOrderEmailError extends Error {
  readonly code:
    PublicOrderEmailErrorCode;

  readonly originalCause:
    unknown;


  constructor(
    code:
      PublicOrderEmailErrorCode,

    message:
      string,

    originalCause?:
      unknown,
  ) {
    super(
      message,
    );

    this.name =
      "PublicOrderEmailError";

    this.code =
      code;

    this.originalCause =
      originalCause;
  }
}


/* ==========================================================================
   5. RESEND
   ========================================================================== */

let publicOrderResendClient:
  Resend | null =
  null;


function getRequiredEnvironmentVariable(
  name:
    string,
): string {
  const value =
    process.env[
      name
    ]?.trim();


  if (
    !value
  ) {
    throw new PublicOrderEmailError(
      "EMAIL_SEND_FAILED",
      `Configuration e-mail manquante : ${name}.`,
    );
  }


  return value;
}


function getPublicOrderResendClient():
  Resend {
  if (
    publicOrderResendClient
  ) {
    return publicOrderResendClient;
  }


  publicOrderResendClient =
    new Resend(
      getRequiredEnvironmentVariable(
        "RESEND_API_KEY",
      ),
    );


  return publicOrderResendClient;
}


function getPublicOrderFromEmail():
  string {
  return getRequiredEnvironmentVariable(
    "RESEND_FROM_EMAIL",
  );
}


function getPublicOrderReplyToEmail():
  string | undefined {
  const value =
    process.env
      .RESEND_REPLY_TO_EMAIL
      ?.trim();


  return value ||
    undefined;
}


/* ==========================================================================
   6. NORMALISATION
   ========================================================================== */

function normalizeOrderId(
  value:
    string,
): string {
  return value.trim();
}


function normalizeEmail(
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
    value
      .trim()
      .toLowerCase();


  return normalized ||
    null;
}


function normalizeSingleLine(
  value:
    string,
): string {
  return value
    .replace(
      /[\r\n\t]+/gu,
      " ",
    )
    .replace(
      /\s+/gu,
      " ",
    )
    .trim();
}


function normalizeOrderNumber(
  value:
    string,
): string {
  return normalizeSingleLine(
    value,
  );
}


function normalizeHeaderValue(
  value:
    string,
): string {
  return normalizeSingleLine(
    value,
  ).slice(
    0,
    PUBLIC_ORDER_EMAIL_MAX_HEADER_VALUE_LENGTH,
  );
}


/* ==========================================================================
   7. VALIDATION DESTINATAIRE
   ========================================================================== */

function assertValidRecipient(
  email:
    string | null,
): string {
  if (
    !email
  ) {
    throw new PublicOrderEmailError(
      "RECIPIENT_MISSING",
      "La commande ne contient aucune adresse e-mail cliente.",
    );
  }


  if (
    email.length >
      254 ||
    !PUBLIC_ORDER_EMAIL_PATTERN.test(
      email,
    )
  ) {
    throw new PublicOrderEmailError(
      "RECIPIENT_INVALID",
      "L’adresse e-mail associée à la commande est invalide.",
    );
  }


  return email;
}


/* ==========================================================================
   8. SUJET
   ========================================================================== */

function buildPublicOrderEmailSubject(
  orderNumber:
    string,
): string {
  const normalizedOrderNumber =
    normalizeOrderNumber(
      orderNumber,
    );


  return (
    `Confirmation de votre commande ${normalizedOrderNumber} — ${PUBLIC_SITE.brand.name}`
  ).slice(
    0,
    PUBLIC_ORDER_EMAIL_MAX_SUBJECT_LENGTH,
  );
}


/* ==========================================================================
   9. IDEMPOTENCE RESEND
   ========================================================================== */

function buildPublicOrderEmailIdempotencyKey(
  params:
    Readonly<{
      orderId:
        string;

      emailLogId:
        string;

      forceResend:
        boolean;
    }>,
): string {
  const safeOrderId =
    params.orderId
      .replace(
        /[^A-Za-z0-9._:-]+/gu,
        "-",
      )
      .slice(
        0,
        120,
      );


  if (
    params.forceResend
  ) {
    const safeEmailLogId =
      params.emailLogId
        .replace(
          /[^A-Za-z0-9._:-]+/gu,
          "-",
        )
        .slice(
          0,
          80,
        );


    return (
      `order-confirmation:${safeOrderId}:resend:${safeEmailLogId}`
    ).slice(
      0,
      256,
    );
  }


  /**
   * Stable pour une confirmation normale.
   *
   * Même si deux appels concurrents réussissent à créer chacun
   * leur EmailLog PENDING, Resend recevra la même clé.
   */
  return (
    `order-confirmation:${safeOrderId}`
  ).slice(
    0,
    256,
  );
}


/* ==========================================================================
   10. FAILURE REASON
   ========================================================================== */

function getSafeFailureReason(
  error:
    unknown,
): string {
  if (
    error instanceof
      PublicOrderEmailError
  ) {
    if (
      error.originalCause instanceof
        Error
    ) {
      const causeMessage =
        normalizeSingleLine(
          error.originalCause.message,
        );


      if (
        causeMessage
      ) {
        return causeMessage.slice(
          0,
          PUBLIC_ORDER_EMAIL_MAX_FAILURE_REASON_LENGTH,
        );
      }
    }


    return error.message.slice(
      0,
      PUBLIC_ORDER_EMAIL_MAX_FAILURE_REASON_LENGTH,
    );
  }


  if (
    error instanceof
      Error
  ) {
    const message =
      normalizeSingleLine(
        error.message,
      );


    if (
      message
    ) {
      return message.slice(
        0,
        PUBLIC_ORDER_EMAIL_MAX_FAILURE_REASON_LENGTH,
      );
    }
  }


  return "Échec interne pendant l’envoi de l’e-mail.";
}


/* ==========================================================================
   11. CHARGEMENT MÉTADONNÉES
   ========================================================================== */

async function loadPublicOrderEmailMetadata(
  orderId:
    string,
): Promise<PublicOrderEmailMetadata> {
  const order =
    await db.order.findUnique({
      where: {
        id:
          orderId,
      },

      select: {
        id:
          true,

        storeId:
          true,

        orderNumber:
          true,

        customerEmail:
          true,

        receipt: {
          select: {
            id:
              true,

            emailedAt:
              true,
          },
        },
      },
    });


  if (
    !order
  ) {
    throw new PublicOrderEmailError(
      "ORDER_NOT_FOUND",
      "La commande est introuvable.",
    );
  }


  /**
   * On extrait la relation dans une constante.
   *
   * Cela garantit aussi au typage TypeScript que la valeur
   * retournée ensuite n'est plus nullable.
   */
  const receipt =
    order.receipt;


  if (
    !receipt
  ) {
    throw new PublicOrderEmailError(
      "RECEIPT_NOT_FOUND",
      "Le reçu associé à cette commande est introuvable.",
    );
  }


  return {
    id:
      order.id,

    storeId:
      order.storeId,

    orderNumber:
      order.orderNumber,

    customerEmail:
      order.customerEmail,

    receipt: {
      id:
        receipt.id,

      emailedAt:
        receipt.emailedAt,
    },
  };
}


/* ==========================================================================
   12. ENVOI DÉJÀ RÉUSSI
   ========================================================================== */

async function findExistingSuccessfulOrderEmail(
  params:
    Readonly<{
      orderId:
        string;

      recipient:
        string;
    }>,
) {
  return db.emailLog.findFirst({
    where: {
      type:
        PUBLIC_ORDER_EMAIL_TYPE,

      status:
        "SENT",

      recipient:
        params.recipient,

      referenceType:
        PUBLIC_ORDER_EMAIL_REFERENCE_TYPE,

      referenceId:
        params.orderId,
    },

    orderBy: {
      createdAt:
        "desc",
    },

    select: {
      id:
        true,

      providerMessageId:
        true,

      sentAt:
        true,
    },
  });
}


/* ==========================================================================
   13. ENVOI PENDING RÉCENT
   ========================================================================== */

async function findRecentPendingOrderEmail(
  params:
    Readonly<{
      orderId:
        string;

      recipient:
        string;
    }>,
) {
  const threshold =
    new Date(
      Date.now() -
        PUBLIC_ORDER_EMAIL_PENDING_TTL_MS,
    );


  return db.emailLog.findFirst({
    where: {
      type:
        PUBLIC_ORDER_EMAIL_TYPE,

      status:
        "PENDING",

      recipient:
        params.recipient,

      referenceType:
        PUBLIC_ORDER_EMAIL_REFERENCE_TYPE,

      referenceId:
        params.orderId,

      createdAt: {
        gte:
          threshold,
      },
    },

    orderBy: {
      createdAt:
        "desc",
    },

    select: {
      id:
        true,

      createdAt:
        true,
    },
  });
}


/* ==========================================================================
   14. CRÉER EMAILLOG PENDING
   ========================================================================== */

async function createPendingOrderEmailLog(
  params:
    Readonly<{
      storeId:
        string;

      orderId:
        string;

      recipient:
        string;

      subject:
        string;
    }>,
): Promise<string> {
  try {
    const emailLog =
      await db.emailLog.create({
        data: {
          storeId:
            params.storeId,

          type:
            PUBLIC_ORDER_EMAIL_TYPE,

          status:
            "PENDING",

          recipient:
            params.recipient,

          subject:
            params.subject,

          provider:
            PUBLIC_ORDER_EMAIL_PROVIDER,

          referenceType:
            PUBLIC_ORDER_EMAIL_REFERENCE_TYPE,

          referenceId:
            params.orderId,
        },

        select: {
          id:
            true,
        },
      });


    return emailLog.id;
  } catch (
    error
  ) {
    throw new PublicOrderEmailError(
      "EMAIL_LOG_CREATE_FAILED",
      "Impossible de préparer la journalisation de l’e-mail de commande.",
      error,
    );
  }
}


/* ==========================================================================
   15. EMAILLOG FAILED
   ========================================================================== */

async function markOrderEmailLogFailed(
  params:
    Readonly<{
      emailLogId:
        string;

      error:
        unknown;
    }>,
): Promise<void> {
  try {
    await db.emailLog.update({
      where: {
        id:
          params.emailLogId,
      },

      data: {
        status:
          "FAILED",

        failedAt:
          new Date(),

        failureReason:
          getSafeFailureReason(
            params.error,
          ),
      },
    });
  } catch (
    updateError
  ) {
    console.error(
      "[L&E Cosmetics Empire] Impossible de marquer EmailLog comme FAILED.",
      {
        emailLogId:
          params.emailLogId,

        errorName:
          updateError instanceof
            Error
            ? updateError.name
            : "UnknownError",
      },
    );
  }
}


/* ==========================================================================
   16. PROPS ORDER-CONFIRMATION
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * On utilise directement StoredPublicOrderReceipt.
 *
 * Il ne faut PAS essayer de récupérer ce type avec un type conditionnel
 * appliqué au ReturnType de generateAndStorePublicOrderReceipt().
 *
 * Cette fonction retourne une union success:true / success:false et
 * le type conditionnel précédent finissait par produire "never".
 */
function buildOrderConfirmationEmailProps(
  receipt:
    StoredPublicOrderReceipt,
): OrderConfirmationEmailProps {
  return {
    orderNumber:
      receipt.data.orderNumber,

    orderDate:
      receipt.data.orderDate,

    customer: {
      firstName:
        receipt.data.customer.firstName,

      lastName:
        receipt.data.customer.lastName,

      email:
        receipt.data.customer.email,

      phone:
        receipt.data.customer.phone,
    },

    delivery: {
      recipientName:
        receipt.data.delivery.recipientName,

      phone:
        receipt.data.delivery.phone,

      country:
        receipt.data.delivery.country,

      city:
        receipt.data.delivery.city,

      address:
        receipt.data.delivery.address,

      postalCode:
        receipt.data.delivery.postalCode,
    },

    items:
      receipt.data.items.map(
        (
          item,
        ) => ({
          productName:
            item.productName,

          sku:
            item.sku,

          quantity:
            item.quantity,

          unitPrice: {
            amount:
              item.unitPrice.amount,

            currency:
              item.unitPrice.currency,
          },

          total: {
            amount:
              item.total.amount,

            currency:
              item.total.currency,
          },

          imageUrl:
            item.imageUrl,
        }),
      ),

    productsSubtotal: {
      amount:
        receipt.data.productsSubtotal.amount,

      currency:
        receipt.data.productsSubtotal.currency,
    },

    deliveryAmount: {
      amount:
        receipt.data.deliveryAmount.amount,

      currency:
        receipt.data.deliveryAmount.currency,
    },

    total: {
      amount:
        receipt.data.total.amount,

      currency:
        receipt.data.total.currency,
    },

    payment: {
      label:
        receipt.data.payment.label,

      state:
        receipt.data.payment.state,

      stateLabel:
        receipt.data.payment.stateLabel,

      reference:
        receipt.data.payment.reference,
    },

    receiptFileName:
      receipt.fileName,
  };
}


/* ==========================================================================
   17. CONSTRUCTION REACT E-MAIL
   ========================================================================== */

function createOrderConfirmationEmailElement(
  props:
    OrderConfirmationEmailProps,
): React.ReactElement {
  return React.createElement(
    OrderConfirmationEmail,
    props,
  );
}


/* ==========================================================================
   18. ENVOI RESEND
   ========================================================================== */

async function sendOrderEmailWithResend(
  params:
    Readonly<{
      recipient:
        string;

      subject:
        string;

      text:
        string;

      react:
        React.ReactElement;

      orderId:
        string;

      orderNumber:
        string;

      receiptFileName:
        string;

      receiptBytes:
        Uint8Array;

      receiptMimeType:
        string;

      idempotencyKey:
        string;
    }>,
): Promise<string> {
  const resend =
    getPublicOrderResendClient();


  const from =
    getPublicOrderFromEmail();


  const replyTo =
    getPublicOrderReplyToEmail();


  try {
    const response =
      await resend.emails.send(
        {
          from,

          to: [
            params.recipient,
          ],

          subject:
            params.subject,

          react:
            params.react,

          text:
            params.text,

          attachments: [
            {
              filename:
                params.receiptFileName,

              content:
                Buffer.from(
                  params.receiptBytes,
                ),

              contentType:
                params.receiptMimeType,
            },
          ],

          ...(replyTo
            ? {
                replyTo,
              }
            : {}),

          headers: {
            "X-LE-Order-Id":
              normalizeHeaderValue(
                params.orderId,
              ),

            "X-LE-Order-Number":
              normalizeHeaderValue(
                params.orderNumber,
              ),
          },

          tags: [
            PUBLIC_ORDER_EMAIL_MODULE_TAG,
            PUBLIC_ORDER_EMAIL_EVENT_TAG,
          ],
        },

        {
          idempotencyKey:
            params.idempotencyKey,
        },
      );


    if (
      response.error
    ) {
      throw new PublicOrderEmailError(
        "EMAIL_SEND_FAILED",
        "Le fournisseur e-mail a refusé l’envoi de la confirmation.",
        response.error,
      );
    }


    const providerMessageId =
      response.data
        ?.id
        ?.trim();


    if (
      !providerMessageId
    ) {
      throw new PublicOrderEmailError(
        "EMAIL_SEND_FAILED",
        "Le fournisseur e-mail n’a pas retourné d’identifiant de message.",
      );
    }


    return providerMessageId;
  } catch (
    error
  ) {
    if (
      error instanceof
        PublicOrderEmailError
    ) {
      throw error;
    }


    throw new PublicOrderEmailError(
      "EMAIL_SEND_FAILED",
      "Impossible d’envoyer l’e-mail de confirmation de commande.",
      error,
    );
  }
}


/* ==========================================================================
   19. EMAILLOG SENT
   ========================================================================== */

async function markOrderEmailLogSent(
  params:
    Readonly<{
      emailLogId:
        string;

      providerMessageId:
        string;

      sentAt:
        Date;
    }>,
): Promise<boolean> {
  try {
    await db.emailLog.update({
      where: {
        id:
          params.emailLogId,
      },

      data: {
        status:
          "SENT",

        providerMessageId:
          params.providerMessageId,

        sentAt:
          params.sentAt,

        failedAt:
          null,

        failureReason:
          null,
      },
    });


    return true;
  } catch (
    error
  ) {
    console.error(
      "[L&E Cosmetics Empire] E-mail envoyé mais EmailLog n’a pas pu être marqué SENT.",
      {
        emailLogId:
          params.emailLogId,

        errorName:
          error instanceof
            Error
            ? error.name
            : "UnknownError",
      },
    );


    return false;
  }
}


/* ==========================================================================
   20. RECEIPT EMAILED AT
   ========================================================================== */

async function markReceiptAsEmailed(
  params:
    Readonly<{
      receiptId:
        string;

      emailedAt:
        Date;
    }>,
): Promise<boolean> {
  try {
    await db.receipt.update({
      where: {
        id:
          params.receiptId,
      },

      data: {
        emailedAt:
          params.emailedAt,
      },
    });


    return true;
  } catch (
    error
  ) {
    console.error(
      "[L&E Cosmetics Empire] E-mail envoyé mais Receipt.emailedAt n’a pas pu être mis à jour.",
      {
        receiptId:
          params.receiptId,

        errorName:
          error instanceof
            Error
            ? error.name
            : "UnknownError",
      },
    );


    return false;
  }
}


/* ==========================================================================
   21. ENVOI PRINCIPAL
   ========================================================================== */

/**
 * Envoie la confirmation d'une vraie commande publique.
 *
 * L'appelant fournit uniquement :
 *
 * - orderId ;
 * - éventuellement forceResend.
 *
 * Toutes les informations métier sont relues côté serveur.
 */
export async function sendPublicOrderConfirmationEmail(
  rawOrderId:
    string,

  options:
    SendPublicOrderConfirmationEmailOptions =
    {},
): Promise<SendPublicOrderConfirmationEmailResult> {
  const orderId =
    normalizeOrderId(
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
    /* ======================================================================
       COMMANDE
       ====================================================================== */

    const order =
      await loadPublicOrderEmailMetadata(
        orderId,
      );


    const recipient =
      assertValidRecipient(
        normalizeEmail(
          order.customerEmail,
        ),
      );


    const forceResend =
      options.forceResend ===
      true;


    /* ======================================================================
       PROTECTION DOUBLE ENVOI
       ====================================================================== */

    if (
      !forceResend
    ) {
      const existingEmail =
        await findExistingSuccessfulOrderEmail({
          orderId:
            order.id,

          recipient,
        });


      if (
        existingEmail
      ) {
        return {
          success:
            true,

          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          emailLogId:
            existingEmail.id,

          providerMessageId:
            existingEmail.providerMessageId,

          receiptId:
            order.receipt.id,

          receiptFileName:
            null,

          sentAt:
            existingEmail.sentAt ??
            order.receipt.emailedAt ??
            new Date(),

          alreadySent:
            true,

          trackingComplete:
            true,
        };
      }


      /**
       * Receipt.emailedAt constitue une seconde trace persistante.
       */
      if (
        order.receipt.emailedAt
      ) {
        return {
          success:
            true,

          orderId:
            order.id,

          orderNumber:
            order.orderNumber,

          emailLogId:
            null,

          providerMessageId:
            null,

          receiptId:
            order.receipt.id,

          receiptFileName:
            null,

          sentAt:
            order.receipt.emailedAt,

          alreadySent:
            true,

          trackingComplete:
            true,
        };
      }


      /**
       * Évite les doubles clics / doubles requêtes rapprochées.
       */
      const recentPending =
        await findRecentPendingOrderEmail({
          orderId:
            order.id,

          recipient,
        });


      if (
        recentPending
      ) {
        return {
          success:
            false,

          code:
            "EMAIL_ALREADY_PROCESSING",

          message:
            "L’e-mail de confirmation de cette commande est déjà en cours d’envoi.",
        };
      }
    }


    /* ======================================================================
       GÉNÉRATION + STOCKAGE REÇU
       ====================================================================== */

    const receiptResult =
      await generateAndStorePublicOrderReceipt(
        order.id,
      );


    if (
      !receiptResult.success
    ) {
      console.error(
        "[L&E Cosmetics Empire] Échec préparation reçu avant e-mail.",
        {
          orderId:
            order.id,

          receiptErrorCode:
            receiptResult.code,
        },
      );


      return {
        success:
          false,

        code:
          "RECEIPT_GENERATION_FAILED",

        message:
          "Impossible de préparer le reçu de la commande.",
      };
    }


    /**
     * Après ce contrôle discriminant success === true,
     * TypeScript sait précisément qu'il s'agit de
     * StoredPublicOrderReceipt.
     */
    const receipt:
      StoredPublicOrderReceipt =
      receiptResult.data;


    /* ======================================================================
       TEMPLATE
       ====================================================================== */

    const templateProps =
      buildOrderConfirmationEmailProps(
        receipt,
      );


    const react =
      createOrderConfirmationEmailElement(
        templateProps,
      );


    const text =
      buildOrderConfirmationText(
        templateProps,
      );


    const subject =
      buildPublicOrderEmailSubject(
        receipt.data.orderNumber,
      );


    /* ======================================================================
       EMAILLOG PENDING
       ====================================================================== */

    const emailLogId =
      await createPendingOrderEmailLog({
        storeId:
          order.storeId,

        orderId:
          order.id,

        recipient,

        subject,
      });


    /* ======================================================================
       IDEMPOTENCE PROVIDER
       ====================================================================== */

    const idempotencyKey =
      buildPublicOrderEmailIdempotencyKey({
        orderId:
          order.id,

        emailLogId,

        forceResend,
      });


    /* ======================================================================
       ENVOI
       ====================================================================== */

    let providerMessageId:
      string;


    try {
      providerMessageId =
        await sendOrderEmailWithResend({
          recipient,

          subject,

          text,

          react,

          orderId:
            order.id,

          orderNumber:
            receipt.data.orderNumber,

          receiptFileName:
            receipt.fileName,

          receiptBytes:
            receipt.bytes,

          receiptMimeType:
            receipt.mimeType,

          idempotencyKey,
        });
    } catch (
      error
    ) {
      await markOrderEmailLogFailed({
        emailLogId,

        error,
      });


      throw error;
    }


    /* ======================================================================
       ENVOI ACCEPTÉ
       ====================================================================== */

    const sentAt =
      new Date();


    /**
     * IMPORTANT :
     *
     * L'e-mail a déjà été accepté par Resend.
     *
     * Une erreur de mise à jour locale après ce point ne doit donc
     * pas transformer artificiellement l'envoi en échec.
     */
    const [
      emailLogUpdated,
      receiptUpdated,
    ] =
      await Promise.all([
        markOrderEmailLogSent({
          emailLogId,

          providerMessageId,

          sentAt,
        }),

        markReceiptAsEmailed({
          receiptId:
            receipt.data.receiptId,

          emailedAt:
            sentAt,
        }),
      ]);


    return {
      success:
        true,

      orderId:
        order.id,

      orderNumber:
        receipt.data.orderNumber,

      emailLogId,

      providerMessageId,

      receiptId:
        receipt.data.receiptId,

      receiptFileName:
        receipt.fileName,

      sentAt,

      alreadySent:
        false,

      trackingComplete:
        emailLogUpdated &&
        receiptUpdated,
    };
  } catch (
    error
  ) {
    if (
      error instanceof
        PublicOrderEmailError
    ) {
      return {
        success:
          false,

        code:
          error.code,

        message:
          error.message,
      };
    }


    console.error(
      "[L&E Cosmetics Empire] Échec inattendu pendant l’envoi de la confirmation de commande.",
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
        "Impossible d’envoyer la confirmation de commande actuellement.",
    };
  }
}