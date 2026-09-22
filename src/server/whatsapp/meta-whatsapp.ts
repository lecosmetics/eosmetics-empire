import "server-only";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * WHATSAPP — META WHATSAPP BUSINESS CLOUD API
 * ============================================================================
 *
 * Fichier :
 *
 * src/server/whatsapp/meta-whatsapp.ts
 *
 * RESPONSABILITÉS :
 *
 * - envoyer la confirmation de livraison sur WhatsApp ;
 * - utiliser exclusivement Meta WhatsApp Business Cloud API ;
 * - utiliser un template WhatsApp approuvé ;
 * - normaliser le numéro au format international ;
 * - valider les variables d'environnement serveur ;
 * - protéger le token Meta ;
 * - appliquer un timeout réseau ;
 * - analyser proprement la réponse Meta ;
 * - retourner l'identifiant du message envoyé ;
 * - ne jamais effectuer de retry automatique dangereux ;
 * - ne jamais exposer les secrets au navigateur ;
 * - ne jamais logger le numéro complet ;
 * - ne jamais logger le token ;
 * - ne jamais modifier la base de données ;
 * - ne jamais modifier Shipment ou Order.
 *
 * IMPORTANT :
 *
 * Ce provider est appelé uniquement APRÈS une mutation métier réussie.
 *
 * Shipment -> DELIVERED
 *       ↓
 * commit DB
 *       ↓
 * shipment-notifications.ts
 *       ↓
 * sendDeliveryConfirmedWhatsApp()
 *       ↓
 * Meta WhatsApp Cloud API
 *
 *
 * AUCUN WHATSAPP N'EST ENVOYÉ POUR L'ANNULATION.
 *
 * ============================================================================
 */


/* ==========================================================================
   META GRAPH API
   ========================================================================== */

const META_GRAPH_API_BASE_URL =
  "https://graph.facebook.com";


/* ==========================================================================
   TIMEOUT
   ========================================================================== */

/**
 * Aucun retry automatique.
 *
 * Pourquoi :
 *
 * si Meta reçoit réellement le message mais que la connexion est coupée
 * avant que notre serveur reçoive la réponse, un retry automatique pourrait
 * potentiellement envoyer le même message deux fois.
 *
 * L'idempotence métier est déjà contrôlée par shipment-mutation.ts.
 */

const META_REQUEST_TIMEOUT_MS =
  15_000;


/* ==========================================================================
   LIMITES
   ========================================================================== */

const MAX_PHONE_INPUT_LENGTH =
  64;


const MAX_CUSTOMER_FIRST_NAME_LENGTH =
  120;


const MAX_REFERENCE_LENGTH =
  191;


const MAX_PHONE_NUMBER_ID_LENGTH =
  128;


const MAX_API_VERSION_LENGTH =
  32;


const MAX_TEMPLATE_NAME_LENGTH =
  512;


const MAX_TEMPLATE_LANGUAGE_LENGTH =
  32;


/* ==========================================================================
   ENVIRONMENT VARIABLES
   ========================================================================== */

const ENV_ACCESS_TOKEN =
  "WHATSAPP_ACCESS_TOKEN";


const ENV_PHONE_NUMBER_ID =
  "WHATSAPP_PHONE_NUMBER_ID";


const ENV_API_VERSION =
  "WHATSAPP_API_VERSION";


const ENV_DELIVERY_CONFIRMED_TEMPLATE_NAME =
  "WHATSAPP_DELIVERY_CONFIRMED_TEMPLATE_NAME";


const ENV_DELIVERY_CONFIRMED_TEMPLATE_LANGUAGE =
  "WHATSAPP_DELIVERY_CONFIRMED_TEMPLATE_LANGUAGE";


/* ==========================================================================
   ERROR CODES
   ========================================================================== */

export type MetaWhatsAppErrorCode =
  | "CONFIGURATION_MISSING"
  | "CONFIGURATION_INVALID"
  | "INVALID_PHONE"
  | "INVALID_TEMPLATE_PARAMETER"
  | "REQUEST_TIMEOUT"
  | "NETWORK_ERROR"
  | "META_REQUEST_FAILED"
  | "INVALID_META_RESPONSE";


/* ==========================================================================
   PROVIDER ERROR
   ========================================================================== */

export class MetaWhatsAppError extends Error {
  public readonly code:
    MetaWhatsAppErrorCode;


  public readonly statusCode:
    number | null;


  public readonly providerCode:
    number | null;


  public readonly retryable:
    boolean;


  public constructor(
    code:
      MetaWhatsAppErrorCode,

    message:
      string,

    options?: {
      readonly statusCode?:
        number | null;

      readonly providerCode?:
        number | null;

      readonly retryable?:
        boolean;

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
      "MetaWhatsAppError";


    this.code =
      code;


    this.statusCode =
      options?.statusCode ??
      null;


    this.providerCode =
      options?.providerCode ??
      null;


    this.retryable =
      options?.retryable ??
      false;


    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}


/* ==========================================================================
   INPUT PUBLIC
   ========================================================================== */

export interface SendDeliveryConfirmedWhatsAppInput {
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
   RESULT PUBLIC
   ========================================================================== */

export interface DeliveryWhatsAppResult {
  /**
   * Identifiant du message retourné par Meta.
   *
   * Exemple conceptuel :
   *
   * wamid....
   *
   * Le code ne génère jamais cet identifiant lui-même.
   */
  readonly providerMessageId:
    string | null;
}


/* ==========================================================================
   CONFIG
   ========================================================================== */

interface MetaWhatsAppConfig {
  readonly accessToken:
    string;

  readonly phoneNumberId:
    string;

  readonly apiVersion:
    string;

  readonly templateName:
    string;

  readonly templateLanguage:
    string;
}


/* ==========================================================================
   NORMALIZED INPUT
   ========================================================================== */

interface NormalizedDeliveryWhatsAppInput {
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
   META TEMPLATE PAYLOAD
   ========================================================================== */

interface MetaWhatsAppTemplateTextParameter {
  readonly type:
    "text";

  readonly text:
    string;
}


interface MetaWhatsAppTemplateBodyComponent {
  readonly type:
    "body";

  readonly parameters:
    readonly MetaWhatsAppTemplateTextParameter[];
}


interface MetaWhatsAppTemplatePayload {
  readonly messaging_product:
    "whatsapp";

  readonly recipient_type:
    "individual";

  readonly to:
    string;

  readonly type:
    "template";

  readonly template: {
    readonly name:
      string;

    readonly language: {
      readonly code:
        string;
    };

    readonly components: readonly [
      MetaWhatsAppTemplateBodyComponent,
    ];
  };
}


/* ==========================================================================
   META RESPONSE
   ========================================================================== */

interface MetaWhatsAppMessageResponse {
  readonly id?:
    unknown;
}


interface MetaWhatsAppSuccessResponse {
  readonly messages?:
    unknown;
}


interface MetaWhatsAppApiError {
  readonly code?:
    unknown;
}


interface MetaWhatsAppErrorResponse {
  readonly error?:
    unknown;
}


/* ==========================================================================
   REQUIRED ENV
   ========================================================================== */

function getRequiredEnvironmentVariable(
  name:
    string,
): string {
  const value =
    process
      .env[name]
      ?.trim();


  if (
    !value
  ) {
    throw new MetaWhatsAppError(
      "CONFIGURATION_MISSING",
      `Configuration WhatsApp manquante : ${name}.`,
    );
  }


  return value;
}


/* ==========================================================================
   CONFIGURATION — ACCESS TOKEN
   ========================================================================== */

function getWhatsAppAccessToken():
  string {
  const token =
    getRequiredEnvironmentVariable(
      ENV_ACCESS_TOKEN,
    );


  if (
    /[\r\n\u0000]/.test(
      token,
    )
  ) {
    throw new MetaWhatsAppError(
      "CONFIGURATION_INVALID",
      "La configuration du token WhatsApp est invalide.",
    );
  }


  return token;
}


/* ==========================================================================
   CONFIGURATION — PHONE NUMBER ID
   ========================================================================== */

function getWhatsAppPhoneNumberId():
  string {
  const value =
    getRequiredEnvironmentVariable(
      ENV_PHONE_NUMBER_ID,
    );


  if (
    value.length >
      MAX_PHONE_NUMBER_ID_LENGTH ||
    !/^\d+$/.test(
      value,
    )
  ) {
    throw new MetaWhatsAppError(
      "CONFIGURATION_INVALID",
      "WHATSAPP_PHONE_NUMBER_ID est invalide.",
    );
  }


  return value;
}


/* ==========================================================================
   CONFIGURATION — API VERSION
   ========================================================================== */

/**
 * La version Graph API n'est volontairement PAS codée en dur.
 *
 * Exemple de forme attendue :
 *
 * vXX.X
 *
 * La version réellement utilisée reste contrôlée par l'environnement
 * du projet.
 */

function getWhatsAppApiVersion():
  string {
  const value =
    getRequiredEnvironmentVariable(
      ENV_API_VERSION,
    );


  if (
    value.length >
      MAX_API_VERSION_LENGTH ||
    !/^v\d+\.\d+$/.test(
      value,
    )
  ) {
    throw new MetaWhatsAppError(
      "CONFIGURATION_INVALID",
      "WHATSAPP_API_VERSION est invalide.",
    );
  }


  return value;
}


/* ==========================================================================
   CONFIGURATION — TEMPLATE NAME
   ========================================================================== */

/**
 * Aucun nom de template fictif n'est codé ici.
 *
 * Le nom doit correspondre exactement au template approuvé
 * dans WhatsApp Manager.
 */

function getDeliveryConfirmedTemplateName():
  string {
  const value =
    getRequiredEnvironmentVariable(
      ENV_DELIVERY_CONFIRMED_TEMPLATE_NAME,
    );


  if (
    value.length >
      MAX_TEMPLATE_NAME_LENGTH ||
    !/^[a-z0-9_]+$/.test(
      value,
    )
  ) {
    throw new MetaWhatsAppError(
      "CONFIGURATION_INVALID",
      "Le nom du template WhatsApp de confirmation est invalide.",
    );
  }


  return value;
}


/* ==========================================================================
   CONFIGURATION — TEMPLATE LANGUAGE
   ========================================================================== */

/**
 * Aucun code langue n'est imposé silencieusement.
 *
 * Il doit correspondre à la langue réellement approuvée pour le template.
 */

function getDeliveryConfirmedTemplateLanguage():
  string {
  const value =
    getRequiredEnvironmentVariable(
      ENV_DELIVERY_CONFIRMED_TEMPLATE_LANGUAGE,
    );


  if (
    value.length >
      MAX_TEMPLATE_LANGUAGE_LENGTH ||
    !/^[A-Za-z]{2,3}(?:_[A-Za-z]{2})?$/.test(
      value,
    )
  ) {
    throw new MetaWhatsAppError(
      "CONFIGURATION_INVALID",
      "La langue du template WhatsApp est invalide.",
    );
  }


  return value;
}


/* ==========================================================================
   LOAD CONFIG
   ========================================================================== */

function getMetaWhatsAppConfig():
  MetaWhatsAppConfig {
  return {
    accessToken:
      getWhatsAppAccessToken(),

    phoneNumberId:
      getWhatsAppPhoneNumberId(),

    apiVersion:
      getWhatsAppApiVersion(),

    templateName:
      getDeliveryConfirmedTemplateName(),

    templateLanguage:
      getDeliveryConfirmedTemplateLanguage(),
  };
}


/* ==========================================================================
   NORMALIZE SINGLE LINE
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
   NORMALIZE INTERNATIONAL PHONE
   ========================================================================== */

/**
 * Meta attend un numéro international.
 *
 * Ce code accepte :
 *
 * +229XXXXXXXX
 * 00229XXXXXXXX
 * 229XXXXXXXX
 *
 * puis transmet uniquement les chiffres.
 *
 * IMPORTANT :
 *
 * aucune déduction de pays n'est faite ici.
 *
 * Exemple :
 *
 * un numéro local "97000000"
 *
 * ne reçoit jamais automatiquement "+229".
 *
 * Le projet doit fournir un vrai numéro international.
 */

function normalizeInternationalPhone(
  value:
    string,
): string {
  if (
    typeof value !==
      "string"
  ) {
    throw new MetaWhatsAppError(
      "INVALID_PHONE",
      "Le numéro WhatsApp est invalide.",
    );
  }


  const normalized =
    value
      .normalize(
        "NFKC",
      )
      .trim();


  if (
    !normalized ||
    normalized.length >
      MAX_PHONE_INPUT_LENGTH ||
    /[\u0000-\u001F\u007F]/.test(
      normalized,
    )
  ) {
    throw new MetaWhatsAppError(
      "INVALID_PHONE",
      "Le numéro WhatsApp est invalide.",
    );
  }


  /**
   * Seuls les caractères de présentation habituels sont supprimés.
   *
   * Aucun chiffre n'est inventé.
   */
  let compact =
    normalized.replace(
      /[\s().-]/g,
      "",
    );


  if (
    compact.startsWith(
      "00",
    )
  ) {
    compact =
      compact.slice(
        2,
      );
  } else if (
    compact.startsWith(
      "+",
    )
  ) {
    compact =
      compact.slice(
        1,
      );
  }


  if (
    !/^\d{8,15}$/.test(
      compact,
    )
  ) {
    throw new MetaWhatsAppError(
      "INVALID_PHONE",
      "Le numéro WhatsApp doit être au format international.",
    );
  }


  return compact;
}


/* ==========================================================================
   TEMPLATE PARAMETER
   ========================================================================== */

function normalizeRequiredTemplateParameter({
  value,
  maxLength,
}: {
  readonly value:
    string;

  readonly maxLength:
    number;
}): string {
  const normalized =
    normalizeSingleLineText(
      value,
      maxLength,
    );


  if (
    !normalized
  ) {
    throw new MetaWhatsAppError(
      "INVALID_TEMPLATE_PARAMETER",
      "Une donnée requise pour le template WhatsApp est absente.",
    );
  }


  return normalized;
}


/* ==========================================================================
   NORMALIZE INPUT
   ========================================================================== */

function normalizeDeliveryConfirmedInput(
  input:
    SendDeliveryConfirmedWhatsAppInput,
): NormalizedDeliveryWhatsAppInput {
  return {
    to:
      normalizeInternationalPhone(
        input.to,
      ),

    customerFirstName:
      normalizeRequiredTemplateParameter({
        value:
          input.customerFirstName,

        maxLength:
          MAX_CUSTOMER_FIRST_NAME_LENGTH,
      }),

    orderNumber:
      normalizeRequiredTemplateParameter({
        value:
          input.orderNumber,

        maxLength:
          MAX_REFERENCE_LENGTH,
      }),

    shipmentNumber:
      normalizeRequiredTemplateParameter({
        value:
          input.shipmentNumber,

        maxLength:
          MAX_REFERENCE_LENGTH,
      }),
  };
}


/* ==========================================================================
   GRAPH API URL
   ========================================================================== */

function createMessagesEndpoint(
  config:
    MetaWhatsAppConfig,
): string {
  /**
   * phoneNumberId et apiVersion sont déjà strictement validés avant
   * d'arriver ici.
   *
   * L'URL de base reste fixe pour éviter qu'une variable d'environnement
   * puisse transformer ce provider en requête vers une destination arbitraire.
   */

  return [
    META_GRAPH_API_BASE_URL,
    config.apiVersion,
    config.phoneNumberId,
    "messages",
  ].join(
    "/",
  );
}


/* ==========================================================================
   PAYLOAD
   ========================================================================== */

/**
 * CONTRAT DU TEMPLATE APPROUVÉ :
 *
 * Body parameter {{1}}
 * -> prénom cliente
 *
 * Body parameter {{2}}
 * -> référence commande
 *
 * Body parameter {{3}}
 * -> référence livraison
 *
 *
 * Exemple conceptuel du template Meta :
 *
 * Bonjour {{1}},
 * votre commande {{2}} a bien été livrée.
 * Référence de livraison : {{3}}.
 * Merci d’avoir choisi Cosmetics Empire.
 *
 *
 * Le NOM du template n'est PAS codé ici.
 * Il vient de l'environnement.
 */

function createDeliveryConfirmedPayload({
  config,
  input,
}: {
  readonly config:
    MetaWhatsAppConfig;

  readonly input:
    NormalizedDeliveryWhatsAppInput;
}): MetaWhatsAppTemplatePayload {
  return {
    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      input.to,

    type:
      "template",

    template: {
      name:
        config.templateName,

      language: {
        code:
          config.templateLanguage,
      },

      components: [
        {
          type:
            "body",

          parameters: [
            {
              type:
                "text",

              text:
                input.customerFirstName,
            },

            {
              type:
                "text",

              text:
                input.orderNumber,
            },

            {
              type:
                "text",

              text:
                input.shipmentNumber,
            },
          ],
        },
      ],
    },
  };
}


/* ==========================================================================
   UNKNOWN RECORD
   ========================================================================== */

function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


/* ==========================================================================
   PARSE JSON RESPONSE
   ========================================================================== */

async function parseMetaResponse(
  response:
    Response,
): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}


/* ==========================================================================
   PROVIDER MESSAGE ID
   ========================================================================== */

function extractProviderMessageId(
  payload:
    unknown,
): string | null {
  if (
    !isRecord(
      payload,
    )
  ) {
    return null;
  }


  const success =
    payload as MetaWhatsAppSuccessResponse;


  if (
    !Array.isArray(
      success.messages,
    ) ||
    success.messages.length ===
      0
  ) {
    return null;
  }


  const firstMessage =
    success.messages[0];


  if (
    !isRecord(
      firstMessage,
    )
  ) {
    return null;
  }


  const message =
    firstMessage as MetaWhatsAppMessageResponse;


  if (
    typeof message.id !==
      "string"
  ) {
    return null;
  }


  const id =
    message.id.trim();


  return id ||
    null;
}


/* ==========================================================================
   META PROVIDER ERROR CODE
   ========================================================================== */

function extractProviderErrorCode(
  payload:
    unknown,
): number | null {
  if (
    !isRecord(
      payload,
    )
  ) {
    return null;
  }


  const errorResponse =
    payload as MetaWhatsAppErrorResponse;


  if (
    !isRecord(
      errorResponse.error,
    )
  ) {
    return null;
  }


  const providerError =
    errorResponse.error as MetaWhatsAppApiError;


  if (
    typeof providerError.code !==
      "number" ||
    !Number.isFinite(
      providerError.code,
    )
  ) {
    return null;
  }


  return providerError.code;
}


/* ==========================================================================
   HTTP RETRYABILITY
   ========================================================================== */

/**
 * Cette information est uniquement descriptive.
 *
 * CE PROVIDER NE RETRY PAS AUTOMATIQUEMENT.
 */

function isRetryableHttpStatus(
  status:
    number,
): boolean {
  return (
    status ===
      408 ||
    status ===
      425 ||
    status ===
      429 ||
    status >=
      500
  );
}


/* ==========================================================================
   SEND REQUEST
   ========================================================================== */

async function sendMetaWhatsAppRequest({
  config,
  payload,
}: {
  readonly config:
    MetaWhatsAppConfig;

  readonly payload:
    MetaWhatsAppTemplatePayload;
}): Promise<DeliveryWhatsAppResult> {
  const endpoint =
    createMessagesEndpoint(
      config,
    );


  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      META_REQUEST_TIMEOUT_MS,
    );


  try {
    const response =
      await fetch(
        endpoint,
        {
          method:
            "POST",

          headers: {
            Authorization:
              `Bearer ${config.accessToken}`,

            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              payload,
            ),

          signal:
            controller.signal,
        },
      );


    const responsePayload =
      await parseMetaResponse(
        response,
      );


    /* ----------------------------------------------------------------------
       HTTP ERROR
       ---------------------------------------------------------------------- */

    if (
      !response.ok
    ) {
      throw new MetaWhatsAppError(
        "META_REQUEST_FAILED",
        "Meta WhatsApp n’a pas accepté la demande d’envoi.",
        {
          statusCode:
            response.status,

          providerCode:
            extractProviderErrorCode(
              responsePayload,
            ),

          retryable:
            isRetryableHttpStatus(
              response.status,
            ),
        },
      );
    }


    /* ----------------------------------------------------------------------
       MESSAGE ID
       ---------------------------------------------------------------------- */

    const providerMessageId =
      extractProviderMessageId(
        responsePayload,
      );


    if (
      !providerMessageId
    ) {
      throw new MetaWhatsAppError(
        "INVALID_META_RESPONSE",
        "La réponse Meta WhatsApp ne contient aucun identifiant de message valide.",
        {
          statusCode:
            response.status,

          retryable:
            false,
        },
      );
    }


    return {
      providerMessageId,
    };
  } catch (
    error
  ) {
    /* ----------------------------------------------------------------------
       PROVIDER ERROR DÉJÀ NORMALISÉE
       ---------------------------------------------------------------------- */

    if (
      error instanceof
        MetaWhatsAppError
    ) {
      throw error;
    }


    /* ----------------------------------------------------------------------
       TIMEOUT
       ---------------------------------------------------------------------- */

    if (
      controller
        .signal
        .aborted
    ) {
      throw new MetaWhatsAppError(
        "REQUEST_TIMEOUT",
        "La requête vers Meta WhatsApp a expiré.",
        {
          retryable:
            true,

          cause:
            error,
        },
      );
    }


    /* ----------------------------------------------------------------------
       NETWORK
       ---------------------------------------------------------------------- */

    throw new MetaWhatsAppError(
      "NETWORK_ERROR",
      "Impossible de joindre Meta WhatsApp.",
      {
        retryable:
          true,

        cause:
          error,
      },
    );
  } finally {
    clearTimeout(
      timeout,
    );
  }
}


/* ==========================================================================
   SEND DELIVERY CONFIRMED WHATSAPP
   ========================================================================== */

/**
 * Fonction publique utilisée par :
 *
 * shipment-notifications.ts
 *
 *
 * Cette fonction :
 *
 * 1. charge la configuration Meta côté serveur ;
 * 2. valide le numéro ;
 * 3. valide les paramètres du template ;
 * 4. construit le payload officiel ;
 * 5. envoie le template ;
 * 6. vérifie la réponse ;
 * 7. retourne l'identifiant Meta.
 *
 *
 * Elle ne décide JAMAIS si Shipment peut devenir DELIVERED.
 */

export async function sendDeliveryConfirmedWhatsApp(
  input:
    SendDeliveryConfirmedWhatsAppInput,
): Promise<DeliveryWhatsAppResult> {
  const config =
    getMetaWhatsAppConfig();


  const normalizedInput =
    normalizeDeliveryConfirmedInput(
      input,
    );


  const payload =
    createDeliveryConfirmedPayload({
      config,

      input:
        normalizedInput,
    });


  return sendMetaWhatsAppRequest({
    config,

    payload,
  });
}


/* ==========================================================================
   TYPE GUARD ERROR
   ========================================================================== */

export function isMetaWhatsAppError(
  error:
    unknown,
): error is MetaWhatsAppError {
  return (
    error instanceof
    MetaWhatsAppError
  );
}