import "server-only";

import {
  sendTransactionalEmail,
} from "@/server/email/resend";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * E-MAILS TRANSACTIONNELS — LIVRAISONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/server/email/delivery-emails.ts
 *
 * RESPONSABILITÉS :
 *
 * - construire l'e-mail de livraison confirmée ;
 * - construire l'e-mail de livraison annulée ;
 * - produire une version texte ;
 * - produire une version HTML ;
 * - valider les données indispensables avant envoi ;
 * - échapper toutes les données injectées dans le HTML ;
 * - utiliser le provider Resend central du projet ;
 * - retourner l'identifiant fournisseur lorsque Resend le fournit.
 *
 * IMPORTANT :
 *
 * CE FICHIER :
 *
 * - reste exclusivement serveur ;
 * - ne crée PAS une nouvelle instance Resend ;
 * - ne lit PAS directement RESEND_API_KEY ;
 * - ne contient PAS de secret ;
 * - ne journalise PAS l'adresse e-mail du client ;
 * - ne journalise PAS le contenu du message ;
 * - n'accède PAS à Prisma ;
 * - ne modifie PAS Shipment ;
 * - ne modifie PAS Order ;
 * - n'envoie PAS WhatsApp ;
 * - n'invente PAS de motif d'annulation ;
 * - n'invente PAS de tracking ;
 * - n'invente PAS de date de livraison.
 *
 * L'envoi réel reste centralisé dans :
 *
 * src/server/email/resend.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   MARQUE
   ========================================================================== */

const BRAND_NAME =
  "Cosmetics Empire";


/* ==========================================================================
   SUJETS
   ========================================================================== */

const DELIVERY_CONFIRMED_SUBJECT =
  "Votre commande a été livrée";


const DELIVERY_CANCELLED_SUBJECT =
  "Mise à jour concernant votre livraison";


/* ==========================================================================
   LIMITES
   ========================================================================== */

const MAX_EMAIL_LENGTH =
  320;


const MAX_CUSTOMER_FIRST_NAME_LENGTH =
  120;


const MAX_REFERENCE_LENGTH =
  191;


/* ==========================================================================
   TAGS RESEND
   ========================================================================== */

const DELIVERY_EMAIL_MODULE_TAG = {
  name:
    "module",

  value:
    "deliveries",
} as const;


const DELIVERY_CONFIRMED_TAG = {
  name:
    "event",

  value:
    "delivery-confirmed",
} as const;


const DELIVERY_CANCELLED_TAG = {
  name:
    "event",

  value:
    "delivery-cancelled",
} as const;


/* ==========================================================================
   INPUT COMMUN
   ========================================================================== */

interface DeliveryEmailBaseInput {
  readonly to:
    string;

  readonly customerFirstName:
    string;

  readonly orderNumber:
    string;

  readonly shipmentNumber:
    string;
}


/* ==========================================================================
   INPUTS PUBLICS
   ========================================================================== */

export type SendDeliveryConfirmedEmailInput =
  DeliveryEmailBaseInput;


export type SendDeliveryCancelledEmailInput =
  DeliveryEmailBaseInput;


/* ==========================================================================
   RÉSULTAT PUBLIC
   ========================================================================== */

export interface DeliveryEmailResult {
  /**
   * Identifiant du message retourné par Resend.
   *
   * Peut rester null uniquement si le provider central décide qu'aucun
   * identifiant exploitable n'est disponible.
   */
  readonly providerMessageId:
    string | null;
}


/* ==========================================================================
   DONNÉES NORMALISÉES
   ========================================================================== */

interface NormalizedDeliveryEmailData {
  readonly to:
    string;

  readonly customerFirstName:
    string;

  readonly orderNumber:
    string;

  readonly shipmentNumber:
    string;
}


/* ==========================================================================
   ERREUR
   ========================================================================== */

export type DeliveryEmailErrorCode =
  | "INVALID_RECIPIENT"
  | "INVALID_ORDER_REFERENCE"
  | "INVALID_SHIPMENT_REFERENCE"
  | "EMAIL_SEND_FAILED";


export class DeliveryEmailError extends Error {
  public readonly code:
    DeliveryEmailErrorCode;


  public constructor(
    code:
      DeliveryEmailErrorCode,

    message:
      string,

    options?: {
      readonly cause?:
        unknown;
    },
  ) {
    super(
      message,
      {
        cause:
          options?.cause,
      },
    );


    this.name =
      "DeliveryEmailError";


    this.code =
      code;


    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}


/* ==========================================================================
   NORMALISATION TEXTE SIMPLE
   ========================================================================== */

function normalizeSingleLineText(
  value:
    string,

  maxLength:
    number,
): string {
  return value
    .normalize(
      "NFKC",
    )
    .replace(
      /[\r\n\t]+/g,
      " ",
    )
    .replace(
      /[\u0000-\u001F\u007F]/g,
      "",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .slice(
      0,
      maxLength,
    );
}


/* ==========================================================================
   VALIDATION E-MAIL
   ========================================================================== */

function normalizeRecipientEmail(
  value:
    string,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
      MAX_EMAIL_LENGTH,
    );


  if (
    !normalized ||
    normalized.length >
      MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalized,
    )
  ) {
    throw new DeliveryEmailError(
      "INVALID_RECIPIENT",
      "L’adresse e-mail du destinataire est invalide.",
    );
  }


  return normalized;
}


/* ==========================================================================
   PRÉNOM
   ========================================================================== */

/**
 * Le prénom n'est pas indispensable pour envoyer le message.
 *
 * S'il est absent :
 *
 * Bonjour,
 *
 * au lieu d'inventer un nom.
 */

function normalizeCustomerFirstName(
  value:
    string,
): string {
  return normalizeSingleLineText(
    value,
    MAX_CUSTOMER_FIRST_NAME_LENGTH,
  );
}


/* ==========================================================================
   RÉFÉRENCE COMMANDE
   ========================================================================== */

function normalizeOrderNumber(
  value:
    string,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
      MAX_REFERENCE_LENGTH,
    );


  if (
    !normalized
  ) {
    throw new DeliveryEmailError(
      "INVALID_ORDER_REFERENCE",
      "La référence de commande est invalide.",
    );
  }


  return normalized;
}


/* ==========================================================================
   RÉFÉRENCE LIVRAISON
   ========================================================================== */

function normalizeShipmentNumber(
  value:
    string,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
      MAX_REFERENCE_LENGTH,
    );


  if (
    !normalized
  ) {
    throw new DeliveryEmailError(
      "INVALID_SHIPMENT_REFERENCE",
      "La référence de livraison est invalide.",
    );
  }


  return normalized;
}


/* ==========================================================================
   NORMALISATION GLOBALE
   ========================================================================== */

function normalizeDeliveryEmailInput(
  input:
    DeliveryEmailBaseInput,
): NormalizedDeliveryEmailData {
  return {
    to:
      normalizeRecipientEmail(
        input.to,
      ),

    customerFirstName:
      normalizeCustomerFirstName(
        input.customerFirstName,
      ),

    orderNumber:
      normalizeOrderNumber(
        input.orderNumber,
      ),

    shipmentNumber:
      normalizeShipmentNumber(
        input.shipmentNumber,
      ),
  };
}


/* ==========================================================================
   ESCAPE HTML
   ========================================================================== */

/**
 * Toutes les données dynamiques passent obligatoirement ici avant leur
 * insertion dans le HTML.
 */

function escapeHtml(
  value:
    string,
): string {
  return value
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}


/* ==========================================================================
   SALUTATION TEXTE
   ========================================================================== */

function createTextGreeting(
  customerFirstName:
    string,
): string {
  if (
    customerFirstName
  ) {
    return `Bonjour ${customerFirstName},`;
  }


  return "Bonjour,";
}


/* ==========================================================================
   SALUTATION HTML
   ========================================================================== */

function createHtmlGreeting(
  customerFirstName:
    string,
): string {
  if (
    customerFirstName
  ) {
    return `Bonjour ${escapeHtml(
      customerFirstName,
    )},`;
  }


  return "Bonjour,";
}


/* ==========================================================================
   E-MAIL CONFIRMATION — TEXTE
   ========================================================================== */

function createDeliveryConfirmedTextEmail(
  data:
    NormalizedDeliveryEmailData,
): string {
  return [
    createTextGreeting(
      data.customerFirstName,
    ),

    "",

    `Votre commande ${data.orderNumber} a été marquée comme livrée.`,

    "",

    `Référence de livraison : ${data.shipmentNumber}`,

    "",

    "Merci d’avoir choisi Cosmetics Empire.",

    "",

    BRAND_NAME,
  ].join(
    "\n",
  );
}


/* ==========================================================================
   E-MAIL ANNULATION — TEXTE
   ========================================================================== */

function createDeliveryCancelledTextEmail(
  data:
    NormalizedDeliveryEmailData,
): string {
  return [
    createTextGreeting(
      data.customerFirstName,
    ),

    "",

    `La livraison associée à votre commande ${data.orderNumber} a été annulée.`,

    "",

    `Référence de livraison : ${data.shipmentNumber}`,

    "",

    "Pour toute information complémentaire, vous pouvez contacter Cosmetics Empire.",

    "",

    BRAND_NAME,
  ].join(
    "\n",
  );
}


/* ==========================================================================
   TEMPLATE HTML GÉNÉRIQUE
   ========================================================================== */

interface CreateDeliveryHtmlEmailInput {
  readonly title:
    string;

  readonly greeting:
    string;

  readonly message:
    string;

  readonly orderNumber:
    string;

  readonly shipmentNumber:
    string;

  readonly footerMessage:
    string;

  readonly statusLabel:
    string;

  readonly statusTone:
    "success" | "cancelled";
}


function createDeliveryHtmlEmail({
  title,
  greeting,
  message,
  orderNumber,
  shipmentNumber,
  footerMessage,
  statusLabel,
  statusTone,
}: CreateDeliveryHtmlEmailInput): string {
  const safeTitle =
    escapeHtml(
      title,
    );


  const safeGreeting =
    greeting;


  const safeMessage =
    escapeHtml(
      message,
    );


  const safeOrderNumber =
    escapeHtml(
      orderNumber,
    );


  const safeShipmentNumber =
    escapeHtml(
      shipmentNumber,
    );


  const safeFooterMessage =
    escapeHtml(
      footerMessage,
    );


  const safeStatusLabel =
    escapeHtml(
      statusLabel,
    );


  const statusBackground =
    statusTone ===
      "success"
      ? "#ecfdf3"
      : "#fff1f2";


  const statusBorder =
    statusTone ===
      "success"
      ? "#abefc6"
      : "#fecdd3";


  const statusText =
    statusTone ===
      "success"
      ? "#067647"
      : "#be123c";


  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />

    <meta
      name="color-scheme"
      content="light"
    />

    <meta
      name="supported-color-schemes"
      content="light"
    />

    <title>${safeTitle}</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #f6f6f8;
      color: #18181b;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width: 100%;
        margin: 0;
        padding: 0;
        background: #f6f6f8;
      "
    >
      <tr>
        <td
          align="center"
          style="
            padding: 32px 16px;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width: 100%;
              max-width: 600px;
              background: #ffffff;
              border: 1px solid #e7e7eb;
              border-radius: 18px;
              overflow: hidden;
            "
          >
            <!-- =========================================================
                 HEADER
                 ========================================================= -->

            <tr>
              <td
                style="
                  padding: 26px 30px 22px;
                  border-bottom: 1px solid #efeff2;
                "
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td>
                      <div
                        style="
                          margin: 0 0 4px;
                          color: #18181b;
                          font-size: 20px;
                          font-weight: 700;
                          line-height: 1.3;
                        "
                      >
                        Cosmetics Empire
                      </div>

                      <div
                        style="
                          color: #777780;
                          font-size: 13px;
                          line-height: 1.5;
                        "
                      >
                        Information concernant votre livraison
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>


            <!-- =========================================================
                 CONTENT
                 ========================================================= -->

            <tr>
              <td
                style="
                  padding: 30px;
                "
              >
                <div
                  style="
                    margin: 0 0 18px;
                    color: #18181b;
                    font-size: 16px;
                    line-height: 1.65;
                  "
                >
                  ${safeGreeting}
                </div>


                <h1
                  style="
                    margin: 0 0 14px;
                    color: #18181b;
                    font-size: 24px;
                    font-weight: 700;
                    line-height: 1.3;
                  "
                >
                  ${safeTitle}
                </h1>


                <div
                  style="
                    display: inline-block;
                    margin: 0 0 24px;
                    padding: 7px 12px;
                    background: ${statusBackground};
                    border: 1px solid ${statusBorder};
                    border-radius: 999px;
                    color: ${statusText};
                    font-size: 13px;
                    font-weight: 700;
                    line-height: 1.3;
                  "
                >
                  ${safeStatusLabel}
                </div>


                <p
                  style="
                    margin: 0 0 24px;
                    color: #52525b;
                    font-size: 15px;
                    line-height: 1.7;
                  "
                >
                  ${safeMessage}
                </p>


                <!-- =====================================================
                     REFERENCES
                     ===================================================== -->

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width: 100%;
                    margin: 0 0 24px;
                    background: #fafafa;
                    border: 1px solid #ededf0;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 17px 18px 10px;
                      "
                    >
                      <div
                        style="
                          margin-bottom: 4px;
                          color: #92929a;
                          font-size: 12px;
                          font-weight: 600;
                          text-transform: uppercase;
                          letter-spacing: 0.04em;
                        "
                      >
                        Commande
                      </div>

                      <div
                        style="
                          color: #18181b;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 1.5;
                          word-break: break-word;
                        "
                      >
                        ${safeOrderNumber}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding: 10px 18px 17px;
                      "
                    >
                      <div
                        style="
                          margin-bottom: 4px;
                          color: #92929a;
                          font-size: 12px;
                          font-weight: 600;
                          text-transform: uppercase;
                          letter-spacing: 0.04em;
                        "
                      >
                        Livraison
                      </div>

                      <div
                        style="
                          color: #18181b;
                          font-size: 15px;
                          font-weight: 700;
                          line-height: 1.5;
                          word-break: break-word;
                        "
                      >
                        ${safeShipmentNumber}
                      </div>
                    </td>
                  </tr>
                </table>


                <p
                  style="
                    margin: 0;
                    color: #52525b;
                    font-size: 14px;
                    line-height: 1.7;
                  "
                >
                  ${safeFooterMessage}
                </p>
              </td>
            </tr>


            <!-- =========================================================
                 FOOTER
                 ========================================================= -->

            <tr>
              <td
                style="
                  padding: 20px 30px;
                  background: #fafafa;
                  border-top: 1px solid #efeff2;
                "
              >
                <div
                  style="
                    color: #92929a;
                    font-size: 12px;
                    line-height: 1.6;
                  "
                >
                  Cet e-mail concerne une commande Cosmetics Empire.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}


/* ==========================================================================
   E-MAIL CONFIRMÉ — HTML
   ========================================================================== */

function createDeliveryConfirmedHtmlEmail(
  data:
    NormalizedDeliveryEmailData,
): string {
  return createDeliveryHtmlEmail({
    title:
      DELIVERY_CONFIRMED_SUBJECT,

    greeting:
      createHtmlGreeting(
        data.customerFirstName,
      ),

    message:
      `Votre commande ${data.orderNumber} a été marquée comme livrée.`,

    orderNumber:
      data.orderNumber,

    shipmentNumber:
      data.shipmentNumber,

    footerMessage:
      "Merci d’avoir choisi Cosmetics Empire.",

    statusLabel:
      "Livraison confirmée",

    statusTone:
      "success",
  });
}


/* ==========================================================================
   E-MAIL ANNULÉ — HTML
   ========================================================================== */

function createDeliveryCancelledHtmlEmail(
  data:
    NormalizedDeliveryEmailData,
): string {
  return createDeliveryHtmlEmail({
    title:
      DELIVERY_CANCELLED_SUBJECT,

    greeting:
      createHtmlGreeting(
        data.customerFirstName,
      ),

    message:
      `La livraison associée à votre commande ${data.orderNumber} a été annulée.`,

    orderNumber:
      data.orderNumber,

    shipmentNumber:
      data.shipmentNumber,

    footerMessage:
      "Pour toute information complémentaire, vous pouvez contacter Cosmetics Empire.",

    statusLabel:
      "Livraison annulée",

    statusTone:
      "cancelled",
  });
}


/* ==========================================================================
   ENVOI SÉCURISÉ
   ========================================================================== */

async function sendDeliveryEmail({
  data,
  subject,
  text,
  html,
  eventTag,
}: {
  readonly data:
    NormalizedDeliveryEmailData;

  readonly subject:
    string;

  readonly text:
    string;

  readonly html:
    string;

  readonly eventTag:
    typeof DELIVERY_CONFIRMED_TAG |
    typeof DELIVERY_CANCELLED_TAG;
}): Promise<DeliveryEmailResult> {
  try {
    const result =
      await sendTransactionalEmail({
        to:
          data.to,

        subject,

        text,

        html,

        tags: [
          DELIVERY_EMAIL_MODULE_TAG,
          eventTag,
        ],
      });


    return {
      providerMessageId:
        result.providerMessageId,
    };
  } catch (
    error
  ) {
    /**
     * Aucun destinataire, contenu d'e-mail ou secret n'est loggé ici.
     *
     * shipment-notifications.ts se chargera :
     *
     * - du EmailLog FAILED ;
     * - de la journalisation serveur contrôlée ;
     * - de continuer le workflow sans rollback de la livraison.
     */

    throw new DeliveryEmailError(
      "EMAIL_SEND_FAILED",
      "Impossible d’envoyer l’e-mail de livraison.",
      {
        cause:
          error,
      },
    );
  }
}


/* ==========================================================================
   CONFIRMATION — FONCTION PUBLIQUE
   ========================================================================== */

/**
 * E-mail envoyé lorsqu'une vraie transition Shipment -> DELIVERED
 * vient d'être validée.
 *
 * Cette fonction ne décide jamais si la livraison peut être confirmée.
 *
 * La transition métier appartient à :
 *
 * shipment-mutation.ts
 */

export async function sendDeliveryConfirmedEmail(
  input:
    SendDeliveryConfirmedEmailInput,
): Promise<DeliveryEmailResult> {
  const data =
    normalizeDeliveryEmailInput(
      input,
    );


  const text =
    createDeliveryConfirmedTextEmail(
      data,
    );


  const html =
    createDeliveryConfirmedHtmlEmail(
      data,
    );


  return sendDeliveryEmail({
    data,

    subject:
      DELIVERY_CONFIRMED_SUBJECT,

    text,

    html,

    eventTag:
      DELIVERY_CONFIRMED_TAG,
  });
}


/* ==========================================================================
   ANNULATION — FONCTION PUBLIQUE
   ========================================================================== */

/**
 * E-mail envoyé lorsqu'une vraie transition Shipment -> CANCELLED
 * vient d'être validée.
 *
 * Aucun motif d'annulation n'est ajouté puisque Shipment ne possède
 * actuellement aucun champ cancellationReason.
 */

export async function sendDeliveryCancelledEmail(
  input:
    SendDeliveryCancelledEmailInput,
): Promise<DeliveryEmailResult> {
  const data =
    normalizeDeliveryEmailInput(
      input,
    );


  const text =
    createDeliveryCancelledTextEmail(
      data,
    );


  const html =
    createDeliveryCancelledHtmlEmail(
      data,
    );


  return sendDeliveryEmail({
    data,

    subject:
      DELIVERY_CANCELLED_SUBJECT,

    text,

    html,

    eventTag:
      DELIVERY_CANCELLED_TAG,
  });
}


/* ==========================================================================
   TYPE GUARD ERROR
   ========================================================================== */

export function isDeliveryEmailError(
  error:
    unknown,
): error is DeliveryEmailError {
  return (
    error instanceof
    DeliveryEmailError
  );
}