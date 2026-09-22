

import {
  EmailStatus,
  EmailType,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  sendDeliveryCancelledEmail,
  sendDeliveryConfirmedEmail,
} from "@/server/email/delivery-emails";

import {
  isMetaWhatsAppError,
  sendDeliveryConfirmedWhatsApp,
} from "@/server/whatsapp/meta-whatsapp";

import type {
  ManagerShipmentMutationResult,
} from "./shipment-mutation";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — NOTIFICATIONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/livraisons/shipment-notifications.ts
 *
 * RESPONSABILITÉS :
 *
 * - orchestrer les notifications APRÈS une mutation Shipment réussie ;
 * - envoyer l'e-mail de confirmation de livraison ;
 * - envoyer WhatsApp après confirmation ;
 * - envoyer l'e-mail après annulation ;
 * - ne jamais envoyer deux fois après une mutation idempotente ;
 * - enregistrer les e-mails dans EmailLog ;
 * - gérer proprement les canaux absents ;
 * - gérer proprement une panne Resend ;
 * - gérer proprement une panne WhatsApp ;
 * - ne jamais rollback la mutation métier pour une panne de notification ;
 * - ne jamais exposer une erreur fournisseur au navigateur ;
 * - ne jamais logger l'adresse e-mail ou le téléphone en clair.
 *
 * IMPORTANT :
 *
 * Ce fichier est strictement serveur.
 *
 * Il ne doit jamais être importé directement depuis un Client Component.
 *
 * CONFIRMATION :
 *
 * Shipment -> DELIVERED
 *      ↓
 * commit DB
 *      ↓
 * e-mail + WhatsApp
 *
 *
 * ANNULATION :
 *
 * Shipment -> CANCELLED
 *      ↓
 * commit DB
 *      ↓
 * e-mail uniquement
 *
 *
 * UNE PANNE DE NOTIFICATION NE DOIT JAMAIS ANNULER UNE LIVRAISON
 * DÉJÀ CORRECTEMENT MODIFIÉE EN BASE.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const EMAIL_PROVIDER =
  "resend";


const EMAIL_REFERENCE_TYPE =
  "Shipment";


const EMAIL_CONFIRMED_SUBJECT =
  "Votre commande a été livrée";


const EMAIL_CANCELLED_SUBJECT =
  "Mise à jour concernant votre livraison";


const MAX_FAILURE_REASON_LENGTH =
  1_000;


/* ==========================================================================
   STATUT D'UNE TENTATIVE
   ========================================================================== */

export type ManagerShipmentNotificationAttemptStatus =
  | "SENT"
  | "SKIPPED"
  | "FAILED";


/* ==========================================================================
   RAISONS SÛRES
   ========================================================================== */

export type ManagerShipmentNotificationReason =
  | "SENT"
  | "MUTATION_ALREADY_APPLIED"
  | "EMAIL_MISSING"
  | "EMAIL_INVALID"
  | "PHONE_MISSING"
  | "EMAIL_SEND_FAILED"
  | "WHATSAPP_SEND_FAILED"
  | "NOT_REQUIRED";


/* ==========================================================================
   RÉSULTAT D'UN CANAL
   ========================================================================== */

export interface ManagerShipmentNotificationAttempt {
  readonly status:
    ManagerShipmentNotificationAttemptStatus;

  readonly reason:
    ManagerShipmentNotificationReason;
}


/* ==========================================================================
   RAPPORT COMPLET
   ========================================================================== */

export interface ManagerShipmentNotificationReport {
  readonly attempted:
    boolean;

  readonly shipmentId:
    string;

  readonly action:
    ManagerShipmentMutationResult["action"];

  readonly email:
    ManagerShipmentNotificationAttempt;

  readonly whatsapp:
    ManagerShipmentNotificationAttempt;
}


/* ==========================================================================
   RÉSULTAT PROVIDER E-MAIL
   ========================================================================== */

interface DeliveryEmailProviderResult {
  readonly providerMessageId:
    string | null;
}


/* ==========================================================================
   RÉSULTAT PROVIDER WHATSAPP
   ========================================================================== */

interface DeliveryWhatsAppProviderResult {
  readonly providerMessageId:
    string | null;
}


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeOptionalText(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value
      .normalize(
        "NFKC",
      )
      .replace(
        /[\u0000-\u001F\u007F]/g,
        "",
      )
      .trim();


  return normalized ||
    null;
}


/* ==========================================================================
   EMAIL — VALIDATION SIMPLE
   ========================================================================== */

function isUsableEmail(
  value:
    string | null,
): value is string {
  if (
    !value ||
    value.length >
      320
  ) {
    return false;
  }


  if (
    /[\r\n]/.test(
      value,
    )
  ) {
    return false;
  }


  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value,
  );
}


/* ==========================================================================
   PHONE — PRÉSENCE
   ========================================================================== */

function hasUsablePhoneCandidate(
  value:
    string | null,
): value is string {
  if (
    !value
  ) {
    return false;
  }


  const digits =
    value.replace(
      /\D/g,
      "",
    );


  return (
    digits.length >=
      8 &&
    digits.length <=
      15
  );
}


/* ==========================================================================
   FAILURE REASON
   ========================================================================== */

function createFailureReason(
  error:
    unknown,
): string {
  if (
    error instanceof
      Error
  ) {
    const normalized =
      error.message
        .normalize(
          "NFKC",
        )
        .replace(
          /[\r\n\t]+/g,
          " ",
        )
        .replace(
          /\s+/g,
          " ",
        )
        .trim();


    if (
      normalized
    ) {
      return normalized.slice(
        0,
        MAX_FAILURE_REASON_LENGTH,
      );
    }
  }


  return "Échec de l’envoi de la notification.";
}


/* ==========================================================================
   LOG SERVEUR SÛR
   ========================================================================== */

function logNotificationFailure({
  channel,
  shipmentId,
  orderId,
  error,
}: {
  readonly channel:
    "email" | "whatsapp";

  readonly shipmentId:
    string;

  readonly orderId:
    string;

  readonly error:
    unknown;
}): void {
  const metaError =
    channel ===
      "whatsapp" &&
    isMetaWhatsAppError(
      error,
    )
      ? error
      : null;


  console.error(
    `[Cosmetics Empire] Échec notification livraison (${channel}).`,
    {
      shipmentId,

      orderId,

      errorName:
        error instanceof
          Error
          ? error.name
          : "UnknownError",

      errorCode:
        metaError?.code ??
        null,

      statusCode:
        metaError?.statusCode ??
        null,

      providerCode:
        metaError?.providerCode ??
        null,

      retryable:
        metaError?.retryable ??
        null,
    },
  );
}


/* ==========================================================================
   STORE ID
   ========================================================================== */

async function getShipmentStoreId(
  shipmentId:
    string,
): Promise<string | null> {
  try {
    const shipment =
      await db.shipment.findUnique({
        where: {
          id:
            shipmentId,
        },

        select: {
          storeId:
            true,
        },
      });


    return shipment?.storeId ??
      null;
  } catch (
    error
  ) {
    console.error(
      "[Cosmetics Empire] Impossible de récupérer le storeId pour le journal e-mail.",
      {
        shipmentId,

        errorName:
          error instanceof
            Error
            ? error.name
            : "UnknownError",
      },
    );


    return null;
  }
}


/* ==========================================================================
   CRÉATION EMAIL LOG
   ========================================================================== */

async function createPendingEmailLog({
  storeId,
  type,
  recipient,
  subject,
  shipmentId,
}: {
  readonly storeId:
    string | null;

  readonly type:
    EmailType;

  readonly recipient:
    string;

  readonly subject:
    string;

  readonly shipmentId:
    string;
}): Promise<string | null> {
  try {
    const emailLog =
      await db.emailLog.create({
        data: {
          storeId,

          type,

          status:
            EmailStatus.PENDING,

          recipient,

          subject,

          provider:
            EMAIL_PROVIDER,

          referenceType:
            EMAIL_REFERENCE_TYPE,

          referenceId:
            shipmentId,
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
    console.error(
      "[Cosmetics Empire] Impossible de créer EmailLog pour une livraison.",
      {
        shipmentId,

        errorName:
          error instanceof
            Error
            ? error.name
            : "UnknownError",
      },
    );


    return null;
  }
}


/* ==========================================================================
   EMAIL LOG — SENT
   ========================================================================== */

async function markEmailLogAsSent({
  emailLogId,
  providerMessageId,
}: {
  readonly emailLogId:
    string | null;

  readonly providerMessageId:
    string | null;
}): Promise<void> {
  if (
    !emailLogId
  ) {
    return;
  }


  try {
    await db.emailLog.update({
      where: {
        id:
          emailLogId,
      },

      data: {
        status:
          EmailStatus.SENT,

        providerMessageId,

        sentAt:
          new Date(),

        failedAt:
          null,

        failureReason:
          null,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "[Cosmetics Empire] Impossible de marquer EmailLog comme envoyé.",
      {
        emailLogId,

        errorName:
          error instanceof
            Error
            ? error.name
            : "UnknownError",
      },
    );
  }
}


/* ==========================================================================
   EMAIL LOG — FAILED
   ========================================================================== */

async function markEmailLogAsFailed({
  emailLogId,
  error,
}: {
  readonly emailLogId:
    string | null;

  readonly error:
    unknown;
}): Promise<void> {
  if (
    !emailLogId
  ) {
    return;
  }


  try {
    await db.emailLog.update({
      where: {
        id:
          emailLogId,
      },

      data: {
        status:
          EmailStatus.FAILED,

        failedAt:
          new Date(),

        failureReason:
          createFailureReason(
            error,
          ),
      },
    });
  } catch (
    updateError
  ) {
    console.error(
      "[Cosmetics Empire] Impossible de marquer EmailLog comme échoué.",
      {
        emailLogId,

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
   SKIPPED
   ========================================================================== */

function createSkippedAttempt(
  reason:
    ManagerShipmentNotificationReason,
): ManagerShipmentNotificationAttempt {
  return {
    status:
      "SKIPPED",

    reason,
  };
}


/* ==========================================================================
   SENT
   ========================================================================== */

function createSentAttempt():
  ManagerShipmentNotificationAttempt {
  return {
    status:
      "SENT",

    reason:
      "SENT",
  };
}


/* ==========================================================================
   FAILED
   ========================================================================== */

function createFailedAttempt(
  reason:
    ManagerShipmentNotificationReason,
): ManagerShipmentNotificationAttempt {
  return {
    status:
      "FAILED",

    reason,
  };
}


/* ==========================================================================
   E-MAIL CONFIRMATION
   ========================================================================== */

async function sendConfirmedEmailSafely({
  mutation,
  storeId,
}: {
  readonly mutation:
    ManagerShipmentMutationResult;

  readonly storeId:
    string | null;
}): Promise<ManagerShipmentNotificationAttempt> {
  const recipient =
    normalizeOptionalText(
      mutation
        .notification
        .customerEmail,
    );


  if (
    !recipient
  ) {
    return createSkippedAttempt(
      "EMAIL_MISSING",
    );
  }


  if (
    !isUsableEmail(
      recipient,
    )
  ) {
    return createSkippedAttempt(
      "EMAIL_INVALID",
    );
  }


  const emailLogId =
    await createPendingEmailLog({
      storeId,

      type:
        EmailType.DELIVERY_CONFIRMATION,

      recipient,

      subject:
        EMAIL_CONFIRMED_SUBJECT,

      shipmentId:
        mutation.shipmentId,
    });


  try {
    const result:
      DeliveryEmailProviderResult =
        await sendDeliveryConfirmedEmail({
          to:
            recipient,

          customerFirstName:
            mutation
              .notification
              .customerFirstName,

          orderNumber:
            mutation
              .notification
              .orderNumber,

          shipmentNumber:
            mutation
              .notification
              .shipmentNumber,
        });


    await markEmailLogAsSent({
      emailLogId,

      providerMessageId:
        result.providerMessageId,
    });


    return createSentAttempt();
  } catch (
    error
  ) {
    await markEmailLogAsFailed({
      emailLogId,

      error,
    });


    logNotificationFailure({
      channel:
        "email",

      shipmentId:
        mutation.shipmentId,

      orderId:
        mutation.orderId,

      error,
    });


    return createFailedAttempt(
      "EMAIL_SEND_FAILED",
    );
  }
}


/* ==========================================================================
   E-MAIL ANNULATION
   ========================================================================== */

async function sendCancelledEmailSafely({
  mutation,
  storeId,
}: {
  readonly mutation:
    ManagerShipmentMutationResult;

  readonly storeId:
    string | null;
}): Promise<ManagerShipmentNotificationAttempt> {
  const recipient =
    normalizeOptionalText(
      mutation
        .notification
        .customerEmail,
    );


  if (
    !recipient
  ) {
    return createSkippedAttempt(
      "EMAIL_MISSING",
    );
  }


  if (
    !isUsableEmail(
      recipient,
    )
  ) {
    return createSkippedAttempt(
      "EMAIL_INVALID",
    );
  }


  const emailLogId =
    await createPendingEmailLog({
      storeId,

      type:
        EmailType.SHIPPING_UPDATE,

      recipient,

      subject:
        EMAIL_CANCELLED_SUBJECT,

      shipmentId:
        mutation.shipmentId,
    });


  try {
    const result:
      DeliveryEmailProviderResult =
        await sendDeliveryCancelledEmail({
          to:
            recipient,

          customerFirstName:
            mutation
              .notification
              .customerFirstName,

          orderNumber:
            mutation
              .notification
              .orderNumber,

          shipmentNumber:
            mutation
              .notification
              .shipmentNumber,
        });


    await markEmailLogAsSent({
      emailLogId,

      providerMessageId:
        result.providerMessageId,
    });


    return createSentAttempt();
  } catch (
    error
  ) {
    await markEmailLogAsFailed({
      emailLogId,

      error,
    });


    logNotificationFailure({
      channel:
        "email",

      shipmentId:
        mutation.shipmentId,

      orderId:
        mutation.orderId,

      error,
    });


    return createFailedAttempt(
      "EMAIL_SEND_FAILED",
    );
  }
}


/* ==========================================================================
   WHATSAPP CONFIRMATION
   ========================================================================== */

async function sendConfirmedWhatsAppSafely(
  mutation:
    ManagerShipmentMutationResult,
): Promise<ManagerShipmentNotificationAttempt> {
  const phone =
    normalizeOptionalText(
      mutation
        .notification
        .customerPhone,
    );


  if (
    !phone ||
    !hasUsablePhoneCandidate(
      phone,
    )
  ) {
    return createSkippedAttempt(
      "PHONE_MISSING",
    );
  }


  try {
    const result:
      DeliveryWhatsAppProviderResult =
        await sendDeliveryConfirmedWhatsApp({
          to:
            phone,

          customerFirstName:
            mutation
              .notification
              .customerFirstName,

          orderNumber:
            mutation
              .notification
              .orderNumber,

          shipmentNumber:
            mutation
              .notification
              .shipmentNumber,
        });


    void result.providerMessageId;


    return createSentAttempt();
  } catch (
    error
  ) {
    logNotificationFailure({
      channel:
        "whatsapp",

      shipmentId:
        mutation.shipmentId,

      orderId:
        mutation.orderId,

      error,
    });


    return createFailedAttempt(
      "WHATSAPP_SEND_FAILED",
    );
  }
}


/* ==========================================================================
   MUTATION DÉJÀ APPLIQUÉE
   ========================================================================== */

function createAlreadyAppliedReport(
  mutation:
    ManagerShipmentMutationResult,
): ManagerShipmentNotificationReport {
  return {
    attempted:
      false,

    shipmentId:
      mutation.shipmentId,

    action:
      mutation.action,

    email:
      createSkippedAttempt(
        "MUTATION_ALREADY_APPLIED",
      ),

    whatsapp:
      createSkippedAttempt(
        "MUTATION_ALREADY_APPLIED",
      ),
  };
}


/* ==========================================================================
   NOTIFICATIONS CONFIRMATION
   ========================================================================== */

async function notifyShipmentConfirmed(
  mutation:
    ManagerShipmentMutationResult,
): Promise<ManagerShipmentNotificationReport> {
  const storeId =
    await getShipmentStoreId(
      mutation.shipmentId,
    );


  const [
    email,
    whatsapp,
  ] =
    await Promise.all([
      sendConfirmedEmailSafely({
        mutation,

        storeId,
      }),

      sendConfirmedWhatsAppSafely(
        mutation,
      ),
    ]);


  return {
    attempted:
      true,

    shipmentId:
      mutation.shipmentId,

    action:
      mutation.action,

    email,

    whatsapp,
  };
}


/* ==========================================================================
   NOTIFICATIONS ANNULATION
   ========================================================================== */

async function notifyShipmentCancelled(
  mutation:
    ManagerShipmentMutationResult,
): Promise<ManagerShipmentNotificationReport> {
  const storeId =
    await getShipmentStoreId(
      mutation.shipmentId,
    );


  const email =
    await sendCancelledEmailSafely({
      mutation,

      storeId,
    });


  const whatsapp =
    createSkippedAttempt(
      "NOT_REQUIRED",
    );


  return {
    attempted:
      true,

    shipmentId:
      mutation.shipmentId,

    action:
      mutation.action,

    email,

    whatsapp,
  };
}


/* ==========================================================================
   ORCHESTRATEUR PUBLIC
   ========================================================================== */

export async function notifyManagerShipmentMutation(
  mutation:
    ManagerShipmentMutationResult,
): Promise<ManagerShipmentNotificationReport> {
  if (
    mutation.outcome ===
      "ALREADY_APPLIED" ||
    !mutation.changed
  ) {
    return createAlreadyAppliedReport(
      mutation,
    );
  }


  if (
    mutation.action ===
      "confirm"
  ) {
    return notifyShipmentConfirmed(
      mutation,
    );
  }


  return notifyShipmentCancelled(
    mutation,
  );
}
