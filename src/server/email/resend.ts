import "server-only";

import {
  Resend,
} from "resend";

import type {
  RegistrationEmailSender,
  VerificationEmailInput,
} from "@/server/gestionnaire/registration-service";


/* ============================================================
   L&E COSMETICS EMPIRE
   TRANSACTIONAL EMAIL — RESEND
   ------------------------------------------------------------
   Fichier :
   src/server/email/resend.ts

   Stack :
   - Next.js
   - TypeScript
   - Resend

   RESPONSABILITÉS :

   - initialiser Resend exclusivement côté serveur ;
   - envoyer les OTP de vérification Gestionnaire ;
   - fournir une version HTML professionnelle ;
   - fournir une version texte ;
   - valider les paramètres avant envoi ;
   - ne jamais exposer RESEND_API_KEY ;
   - ne jamais logger l'OTP ;
   - ne jamais envoyer le mot de passe ;
   - ne jamais envoyer le code représentant ;
   - remonter uniquement des erreurs techniques contrôlées.

   VARIABLES D'ENVIRONNEMENT :

   RESEND_API_KEY
   RESEND_FROM_EMAIL
   RESEND_REPLY_TO_EMAIL   facultatif

   IMPORTANT :

   Aucune variable Resend ne doit utiliser NEXT_PUBLIC_.
   ============================================================ */


/* ============================================================
   BRAND
   ============================================================ */

const BRAND_NAME =
  "L&E Cosmetics Empire";


const EMAIL_SUBJECT =
  "Votre code de vérification L&E Cosmetics Empire";


/* ============================================================
   OTP CONSTRAINTS
   ============================================================ */

const OTP_LENGTH =
  6;


const MAX_OTP_EXPIRATION_MINUTES =
  60;


/* ============================================================
   ENVIRONMENT
   ============================================================ */

function getRequiredEnvironmentVariable(
  name:
    string,
): string {
  const value =
    process.env[name]
      ?.trim();


  if (!value) {
    throw new Error(
      `Configuration serveur manquante : ${name}.`,
    );
  }


  return value;
}


/* ============================================================
   RESEND API KEY
   ============================================================ */

function getResendApiKey():
  string {
  const apiKey =
    getRequiredEnvironmentVariable(
      "RESEND_API_KEY",
    );


  /*
   * Protection simple contre une variable manifestement
   * incorrecte.
   *
   * On ne loggue évidemment jamais la clé.
   */
  if (
    !apiKey.startsWith(
      "re_",
    )
  ) {
    throw new Error(
      "Configuration RESEND_API_KEY invalide.",
    );
  }


  return apiKey;
}


/* ============================================================
   FROM EMAIL
   ------------------------------------------------------------
   Exemple :

   L&E Cosmetics Empire <no-reply@votredomaine.com>

   Le domaine utilisé doit être autorisé chez Resend.
   ============================================================ */

function getResendFromEmail():
  string {
  return getRequiredEnvironmentVariable(
    "RESEND_FROM_EMAIL",
  );
}


/* ============================================================
   OPTIONAL REPLY-TO
   ============================================================ */

function getReplyToEmail():
  string | undefined {
  const value =
    process.env
      .RESEND_REPLY_TO_EMAIL
      ?.trim();


  return value ||
    undefined;
}


/* ============================================================
   RESEND CLIENT
   ------------------------------------------------------------
   Initialisation paresseuse.

   Le client n'est construit qu'au premier véritable envoi.

   Cela évite notamment de bloquer certaines opérations de
   build si l'environnement d'envoi n'est pas utilisé à ce
   moment-là.
   ============================================================ */

let resendClient:
  Resend | null =
  null;


function getResendClient():
  Resend {
  if (
    resendClient
  ) {
    return resendClient;
  }


  resendClient =
    new Resend(
      getResendApiKey(),
    );


  return resendClient;
}


/* ============================================================
   NORMALIZE RECIPIENT
   ============================================================ */

function normalizeRecipientEmail(
  email:
    string,
): string {
  return email
    .trim()
    .toLowerCase();
}


/* ============================================================
   VALIDATE RECIPIENT
   ------------------------------------------------------------
   Validation volontairement raisonnable.

   La validation métier principale de l'e-mail reste effectuée
   avant l'arrivée dans ce service.
   ============================================================ */

function assertRecipientEmail(
  email:
    string,
): void {
  if (
    !email ||
    email.length >
      320
  ) {
    throw new Error(
      "Destinataire e-mail invalide.",
    );
  }


  const separatorIndex =
    email.lastIndexOf(
      "@",
    );


  if (
    separatorIndex <=
      0 ||
    separatorIndex >=
      email.length -
        1
  ) {
    throw new Error(
      "Destinataire e-mail invalide.",
    );
  }


  if (
    email.includes(
      "\n",
    ) ||
    email.includes(
      "\r",
    )
  ) {
    throw new Error(
      "Destinataire e-mail invalide.",
    );
  }
}


/* ============================================================
   VALIDATE OTP
   ============================================================ */

function assertVerificationCode(
  code:
    string,
): void {
  const otpPattern =
    new RegExp(
      `^\\d{${OTP_LENGTH}}$`,
    );


  if (
    !otpPattern.test(
      code,
    )
  ) {
    throw new Error(
      "Code de vérification invalide.",
    );
  }
}


/* ============================================================
   NORMALIZE EXPIRATION
   ============================================================ */

function normalizeExpirationMinutes(
  expiresInMinutes:
    number,
): number {
  if (
    !Number.isSafeInteger(
      expiresInMinutes,
    ) ||
    expiresInMinutes <=
      0 ||
    expiresInMinutes >
      MAX_OTP_EXPIRATION_MINUTES
  ) {
    throw new Error(
      "Durée d’expiration OTP invalide.",
    );
  }


  return expiresInMinutes;
}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

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


/* ============================================================
   PLURALIZE MINUTES
   ============================================================ */

function createExpirationText(
  expiresInMinutes:
    number,
): string {
  return `${expiresInMinutes} minute${
    expiresInMinutes >
      1
      ? "s"
      : ""
  }`;
}


/* ============================================================
   TEXT EMAIL
   ============================================================ */

function createVerificationTextEmail(
  code:
    string,

  expiresInMinutes:
    number,
): string {
  const expirationText =
    createExpirationText(
      expiresInMinutes,
    );


  return [
    BRAND_NAME,
    "",
    "Vérification de votre adresse e-mail",
    "",
    "Vous avez demandé la création de votre espace Gestionnaire.",
    "",
    "Votre code de vérification est :",
    "",
    code,
    "",
    `Ce code expire dans ${expirationText}.`,
    "",
    "Pour votre sécurité, ne communiquez jamais ce code à une autre personne.",
    "",
    "Si vous n’avez pas demandé cette inscription, vous pouvez ignorer cet e-mail.",
    "",
    BRAND_NAME,
    "E-mail automatique de vérification.",
  ].join(
    "\n",
  );
}


/* ============================================================
   HTML EMAIL
   ------------------------------------------------------------
   Template :
   - responsive ;
   - sans JavaScript ;
   - compatible avec les principaux clients e-mail ;
   - sans dépendance à une image externe ;
   - lisible même lorsque les images sont bloquées.
   ============================================================ */

function createVerificationHtmlEmail(
  code:
    string,

  expiresInMinutes:
    number,
): string {
  const safeCode =
    escapeHtml(
      code,
    );


  const expirationText =
    escapeHtml(
      createExpirationText(
        expiresInMinutes,
      ),
    );


  const currentYear =
    new Date()
      .getFullYear();


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

    <title>
      Vérification de votre adresse e-mail
    </title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f5f5f7;
      color: #17171b;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    "
  >
    <div
      style="
        display: none;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        color: transparent;
      "
    >
      Votre code de vérification pour accéder à votre espace Gestionnaire.
    </div>

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
        background-color: #f5f5f7;
        border-collapse: collapse;
      "
    >
      <tr>
        <td
          align="center"
          style="
            padding: 36px 16px;
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
              max-width: 560px;
              border-collapse: separate;
              background-color: #ffffff;
              border: 1px solid #e7e7eb;
              border-radius: 18px;
              overflow: hidden;
            "
          >
            <!-- BRAND -->

            <tr>
              <td
                align="center"
                style="
                  padding: 32px 28px 10px;
                "
              >
                <div
                  style="
                    margin: 0;
                    color: #ed006d;
                    font-size: 13px;
                    line-height: 1.4;
                    font-weight: 700;
                    letter-spacing: 1.4px;
                    text-transform: uppercase;
                  "
                >
                  L&amp;E Cosmetics Empire
                </div>
              </td>
            </tr>


            <!-- TITLE -->

            <tr>
              <td
                align="center"
                style="
                  padding: 6px 30px 0;
                "
              >
                <h1
                  style="
                    margin: 0;
                    color: #17171b;
                    font-size: 26px;
                    line-height: 1.28;
                    font-weight: 700;
                  "
                >
                  Vérification de votre adresse e-mail
                </h1>
              </td>
            </tr>


            <!-- INTRODUCTION -->

            <tr>
              <td
                align="center"
                style="
                  padding: 16px 34px 0;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #62626d;
                    font-size: 15px;
                    line-height: 1.65;
                  "
                >
                  Utilisez le code ci-dessous pour vérifier votre
                  adresse e-mail et poursuivre la création de votre
                  espace Gestionnaire.
                </p>
              </td>
            </tr>


            <!-- OTP -->

            <tr>
              <td
                align="center"
                style="
                  padding: 30px 24px 22px;
                "
              >
                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    border-collapse: separate;
                  "
                >
                  <tr>
                    <td
                      align="center"
                      style="
                        min-width: 220px;
                        padding: 19px 28px;
                        background-color: #fff3f8;
                        border: 1px solid #f4c5da;
                        border-radius: 13px;
                        color: #9f0055;
                        font-size: 32px;
                        line-height: 1;
                        font-weight: 700;
                        letter-spacing: 8px;
                        white-space: nowrap;
                      "
                    >
                      ${safeCode}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>


            <!-- EXPIRATION -->

            <tr>
              <td
                align="center"
                style="
                  padding: 0 34px;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #62626d;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  Ce code expire dans
                  <strong
                    style="
                      color: #17171b;
                    "
                  >
                    ${expirationText}
                  </strong>.
                </p>
              </td>
            </tr>


            <!-- SECURITY -->

            <tr>
              <td
                style="
                  padding: 26px 30px 30px;
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
                    border-collapse: separate;
                    background-color: #fafafa;
                    border: 1px solid #ededf0;
                    border-radius: 12px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding: 16px 18px;
                        color: #74747f;
                        font-size: 12px;
                        line-height: 1.65;
                        text-align: center;
                      "
                    >
                      Pour votre sécurité, ne communiquez jamais ce
                      code à une autre personne.
                      <br />
                      Si vous n’avez pas demandé cette inscription,
                      ignorez simplement cet e-mail.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>


          <!-- FOOTER -->

          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width: 100%;
              max-width: 560px;
              border-collapse: collapse;
            "
          >
            <tr>
              <td
                align="center"
                style="
                  padding: 18px 20px 0;
                  color: #92929d;
                  font-size: 11px;
                  line-height: 1.6;
                "
              >
                © ${currentYear} L&amp;E Cosmetics Empire.
                <br />
                E-mail automatique de vérification.
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


/* ============================================================
   SEND VERIFICATION EMAIL
   ============================================================ */

export async function sendVerificationEmail({
  to,
  code,
  expiresInMinutes,
}: VerificationEmailInput): Promise<void> {
  /* ----------------------------------------------------------
     1. RECIPIENT
     ---------------------------------------------------------- */

  const recipient =
    normalizeRecipientEmail(
      to,
    );


  assertRecipientEmail(
    recipient,
  );


  /* ----------------------------------------------------------
     2. OTP
     ---------------------------------------------------------- */

  assertVerificationCode(
    code,
  );


  /* ----------------------------------------------------------
     3. EXPIRATION
     ---------------------------------------------------------- */

  const normalizedExpiration =
    normalizeExpirationMinutes(
      expiresInMinutes,
    );


  /* ----------------------------------------------------------
     4. SERVER CONFIGURATION
     ---------------------------------------------------------- */

  const from =
    getResendFromEmail();


  const replyTo =
    getReplyToEmail();


  const resend =
    getResendClient();


  /* ----------------------------------------------------------
     5. MESSAGE
     ---------------------------------------------------------- */

  const text =
    createVerificationTextEmail(
      code,
      normalizedExpiration,
    );


  const html =
    createVerificationHtmlEmail(
      code,
      normalizedExpiration,
    );


  /* ----------------------------------------------------------
     6. SEND
     ----------------------------------------------------------
     Ne jamais logger :

     - recipient ;
     - code ;
     - text ;
     - html ;
     - RESEND_API_KEY ;
     - payload complet.
     ---------------------------------------------------------- */

  const {
    data,
    error,
  } =
    await resend.emails.send({
      from,

      to: [
        recipient,
      ],

      subject:
        EMAIL_SUBJECT,

      text,

      html,

      ...(replyTo
        ? {
            replyTo,
          }
        : {}),
    });


  /* ----------------------------------------------------------
     7. PROVIDER ERROR
     ---------------------------------------------------------- */

  if (error) {
    throw new Error(
      "RESEND_VERIFICATION_EMAIL_FAILED",
    );
  }


  /* ----------------------------------------------------------
     8. PROVIDER RESPONSE VALIDATION
     ---------------------------------------------------------- */

  if (
    !data ||
    typeof data.id !==
      "string" ||
    !data.id.trim()
  ) {
    throw new Error(
      "RESEND_VERIFICATION_EMAIL_MISSING_ID",
    );
  }
}

/* ============================================================
   TRANSACTIONAL EMAIL
   ------------------------------------------------------------
   Envoi e-mail transactionnel générique utilisant le MÊME
   client Resend que les e-mails de vérification Gestionnaire.

   Utilisé notamment par :

   - delivery-emails.ts ;
   - futures notifications transactionnelles.

   IMPORTANT :

   - aucune nouvelle instance Resend ;
   - aucune API key exposée ;
   - aucun secret transmis au navigateur ;
   - aucun payload sensible loggé ;
   - le FROM reste contrôlé côté serveur ;
   - le Reply-To central existant est réutilisé.
   ============================================================ */


/* ============================================================
   TRANSACTIONAL TAG
   ============================================================ */

export interface TransactionalEmailTag {
  readonly name:
    string;

  readonly value:
    string;
}


/* ============================================================
   TRANSACTIONAL INPUT
   ============================================================ */

export interface SendTransactionalEmailInput {
  readonly to:
    string;

  readonly subject:
    string;

  readonly text:
    string;

  readonly html:
    string;

  readonly tags?:
    readonly TransactionalEmailTag[];

  readonly replyTo?:
    string | null;
}


/* ============================================================
   TRANSACTIONAL RESULT
   ============================================================ */

export interface TransactionalEmailResult {
  readonly providerMessageId:
    string;
}


/* ============================================================
   LIMITS
   ============================================================ */

const TRANSACTIONAL_EMAIL_MAX_RECIPIENT_LENGTH =
  320;


const TRANSACTIONAL_EMAIL_MAX_SUBJECT_LENGTH =
  998;


const TRANSACTIONAL_EMAIL_MAX_TAG_NAME_LENGTH =
  256;


const TRANSACTIONAL_EMAIL_MAX_TAG_VALUE_LENGTH =
  256;


/* ============================================================
   NORMALIZE SINGLE LINE
   ============================================================ */

function normalizeTransactionalSingleLine(
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


/* ============================================================
   RECIPIENT
   ============================================================ */

function normalizeTransactionalRecipient(
  value:
    string,
): string {
  const recipient =
    normalizeTransactionalSingleLine(
      value,
      TRANSACTIONAL_EMAIL_MAX_RECIPIENT_LENGTH,
    )
      .toLowerCase();


  if (
    !recipient ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      recipient,
    )
  ) {
    throw new Error(
      "RESEND_TRANSACTIONAL_EMAIL_INVALID_RECIPIENT",
    );
  }


  return recipient;
}


/* ============================================================
   SUBJECT
   ============================================================ */

function normalizeTransactionalSubject(
  value:
    string,
): string {
  const subject =
    normalizeTransactionalSingleLine(
      value,
      TRANSACTIONAL_EMAIL_MAX_SUBJECT_LENGTH,
    );


  if (
    !subject
  ) {
    throw new Error(
      "RESEND_TRANSACTIONAL_EMAIL_INVALID_SUBJECT",
    );
  }


  return subject;
}


/* ============================================================
   TAGS
   ============================================================ */

function normalizeTransactionalTags(
  tags:
    readonly TransactionalEmailTag[] | undefined,
): Array<{
  name:
    string;

  value:
    string;
}> | undefined {
  if (
    !tags ||
    tags.length ===
      0
  ) {
    return undefined;
  }


  const normalizedTags =
    tags
      .map(
        (
          tag,
        ) => {
          const name =
            normalizeTransactionalSingleLine(
              tag.name,
              TRANSACTIONAL_EMAIL_MAX_TAG_NAME_LENGTH,
            );


          const value =
            normalizeTransactionalSingleLine(
              tag.value,
              TRANSACTIONAL_EMAIL_MAX_TAG_VALUE_LENGTH,
            );


          if (
            !name ||
            !value
          ) {
            return null;
          }


          return {
            name,
            value,
          };
        },
      )
      .filter(
        (
          tag,
        ): tag is {
          name:
            string;

          value:
            string;
        } =>
          tag !==
          null,
      );


  return normalizedTags.length >
    0
    ? normalizedTags
    : undefined;
}


/* ============================================================
   TRANSACTIONAL EMAIL SENDER
   ============================================================ */

export async function sendTransactionalEmail({
  to,
  subject,
  text,
  html,
  tags,
  replyTo,
}: SendTransactionalEmailInput): Promise<TransactionalEmailResult> {
  /* ----------------------------------------------------------
     VALIDATION
     ---------------------------------------------------------- */

  const recipient =
    normalizeTransactionalRecipient(
      to,
    );


  const normalizedSubject =
    normalizeTransactionalSubject(
      subject,
    );


  const normalizedText =
    text.trim();


  const normalizedHtml =
    html.trim();


  if (
    !normalizedText
  ) {
    throw new Error(
      "RESEND_TRANSACTIONAL_EMAIL_MISSING_TEXT",
    );
  }


  if (
    !normalizedHtml
  ) {
    throw new Error(
      "RESEND_TRANSACTIONAL_EMAIL_MISSING_HTML",
    );
  }


  const normalizedTags =
    normalizeTransactionalTags(
      tags,
    );


  /* ----------------------------------------------------------
     CLIENT EXISTANT
     ---------------------------------------------------------- */

  const resend =
    getResendClient();


  /* ----------------------------------------------------------
     REPLY TO
     ---------------------------------------------------------- */

  const normalizedReplyTo =
    typeof replyTo ===
      "string"
      ? replyTo.trim() ||
        undefined
      : replyTo ===
          null
        ? undefined
        : getReplyToEmail();


  /* ----------------------------------------------------------
     SEND
     ---------------------------------------------------------- */

  const {
    data,
    error,
  } =
    await resend.emails.send({
      from:
        getResendFromEmail(),

      to: [
        recipient,
      ],

      subject:
        normalizedSubject,

      text:
        normalizedText,

      html:
        normalizedHtml,

      replyTo:
        normalizedReplyTo,

      tags:
        normalizedTags,
    });


  /* ----------------------------------------------------------
     PROVIDER ERROR
     ---------------------------------------------------------- */

  if (
    error
  ) {
    /**
     * Ne jamais logger ici :
     *
     * - recipient ;
     * - contenu HTML ;
     * - contenu texte ;
     * - API key ;
     * - payload complet.
     */

    throw new Error(
      "RESEND_TRANSACTIONAL_EMAIL_FAILED",
    );
  }


  /* ----------------------------------------------------------
     MESSAGE ID
     ---------------------------------------------------------- */

  const providerMessageId =
    data?.id?.trim();


  if (
    !providerMessageId
  ) {
    throw new Error(
      "RESEND_TRANSACTIONAL_EMAIL_MISSING_ID",
    );
  }


  return {
    providerMessageId,
  };
}


/* ============================================================
   REGISTRATION EMAIL SENDER
   ------------------------------------------------------------
   Implémentation du contrat utilisé par :

   registration-service.ts

   registration-service.ts ne connaît pas Resend directement.

   Il travaille uniquement avec :

   RegistrationEmailSender
   ============================================================ */

export const resendEmailSender:
  RegistrationEmailSender = {
  async sendVerificationCode(
    input:
      VerificationEmailInput,
  ): Promise<void> {
    await sendVerificationEmail(
      input,
    );
  },
};