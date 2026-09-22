import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import * as argon2 from "argon2";

import {
  AuditAction,
  EmailStatus,
  EmailType,
  ManagerStatus,
  SecurityRateLimitScope,
  StoreStatus,
} from "@prisma/client";

import {
  Resend,
} from "resend";

import {
  z,
} from "zod";

import {
  routes,
} from "@/config/routes";

import {
  db,
} from "@/prisma/db";


/* ============================================================
   L&E COSMETICS EMPIRE
   PASSWORD RESET SERVICE — GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/server/gestionnaire/auth/password-reset.ts

   PARCOURS :

   mot de passe oublié
          ↓
   adresse e-mail
          ↓
   rate limiting
          ↓
   compte éligible ?
          ↓
   token signé 20 minutes
          ↓
   e-mail Resend
          ↓
   /gestionnaire/reinitialiser-mot-de-passe?token=...
          ↓
   nouveau mot de passe
          ↓
   Argon2id
          ↓
   passwordChangedAt mis à jour
          ↓
   token précédent automatiquement invalide

   IMPORTANT :

   - aucune nouvelle table Prisma ;
   - aucun token brut stocké en base ;
   - aucun mot de passe stocké en clair ;
   - aucune révélation de l'existence d'un compte ;
   - le token devient inutilisable après changement du mot
     de passe grâce à passwordChangedAt.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const PASSWORD_RESET_TOKEN_VERSION =
  1;


const PASSWORD_RESET_TOKEN_KIND =
  "gestionnaire-password-reset";


const PASSWORD_RESET_EXPIRATION_MINUTES =
  20;


const PASSWORD_RESET_EXPIRATION_SECONDS =
  PASSWORD_RESET_EXPIRATION_MINUTES *
  60;


const PASSWORD_RESET_CLOCK_SKEW_SECONDS =
  60;


const MAX_RESET_TOKEN_LENGTH =
  4_096;


const PASSWORD_MIN_LENGTH =
  10;


const PASSWORD_MAX_LENGTH =
  128;


const MAX_EMAIL_LENGTH =
  254;


const MAX_IP_LENGTH =
  128;


const MAX_USER_AGENT_LENGTH =
  1_000;


const PASSWORD_RESET_EMAIL_LIMIT =
  3;


const PASSWORD_RESET_IP_LIMIT =
  10;


const PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS =
  15 * 60;


const PASSWORD_RESET_EMAIL_SUBJECT =
  "Réinitialisation de votre mot de passe L&E Cosmetics Empire";


/* ============================================================
   ARGON2
   ============================================================ */

const ARGON2_OPTIONS =
  Object.freeze({
    type:
      argon2.argon2id,

    memoryCost:
      19_456,

    timeCost:
      2,

    parallelism:
      1,
  });


/* ============================================================
   SCHEMAS
   ============================================================ */

const passwordResetRequestSchema =
  z.object({
    email:
      z
        .string()
        .trim()
        .min(1)
        .max(
          MAX_EMAIL_LENGTH,
        )
        .email()
        .transform(
          (
            value,
          ) =>
            value.toLowerCase(),
        ),
  });


const passwordResetCompletionSchema =
  z.object({
    token:
      z
        .string()
        .trim()
        .min(20)
        .max(
          MAX_RESET_TOKEN_LENGTH,
        ),

    password:
      z
        .string()
        .min(
          PASSWORD_MIN_LENGTH,
        )
        .max(
          PASSWORD_MAX_LENGTH,
        ),

    passwordConfirmation:
      z
        .string()
        .min(
          PASSWORD_MIN_LENGTH,
        )
        .max(
          PASSWORD_MAX_LENGTH,
        ),
  });


/* ============================================================
   INPUT TYPES
   ============================================================ */

export type RequestGestionnairePasswordResetInput =
  Readonly<{
    email:
      string;
  }>;


export type CompleteGestionnairePasswordResetInput =
  Readonly<{
    token:
      string;

    password:
      string;

    passwordConfirmation:
      string;
  }>;


export type PasswordResetRequestContext =
  Readonly<{
    ipAddress?:
      string |
      null;

    userAgent?:
      string |
      null;
  }>;


/* ============================================================
   RESULT TYPES
   ============================================================ */

export type RequestGestionnairePasswordResetResult =
  | Readonly<{
      ok:
        true;
    }>
  | Readonly<{
      ok:
        false;

      code:
        | "INVALID_INPUT"
        | "RATE_LIMITED"
        | "UNAVAILABLE";

      retryAfterSeconds?:
        number |
        null;
    }>;


export type CompleteGestionnairePasswordResetResult =
  | Readonly<{
      ok:
        true;
    }>
  | Readonly<{
      ok:
        false;

      code:
        | "INVALID_INPUT"
        | "PASSWORD_MISMATCH"
        | "PASSWORD_REUSE_NOT_ALLOWED"
        | "INVALID_OR_EXPIRED_TOKEN"
        | "UNAVAILABLE";
    }>;


/* ============================================================
   TOKEN VALIDATION RESULT
   ============================================================ */

export type PasswordResetTokenValidationResult =
  Readonly<{
    valid:
      boolean;
  }>;


/* ============================================================
   TOKEN PAYLOAD
   ============================================================ */

type PasswordResetTokenPayload =
  Readonly<{
    version:
      number;

    kind:
      typeof PASSWORD_RESET_TOKEN_KIND;

    subject:
      string;

    nonce:
      string;

    issuedAt:
      number;

    expiresAt:
      number;

    passwordChangedAt:
      number |
      null;
  }>;


/* ============================================================
   INTERNAL MANAGER
   ============================================================ */

type PasswordResetManager =
  Readonly<{
    id:
      string;

    storeId:
      string;

    email:
      string;

    passwordHash:
      string;

    passwordChangedAt:
      Date |
      null;

    status:
      ManagerStatus;

    emailVerifiedAt:
      Date |
      null;

    store:
      Readonly<{
        status:
          StoreStatus;
      }>;
  }>;


/* ============================================================
   RATE LIMIT
   ============================================================ */

type PasswordResetRateLimitEntry =
  Readonly<{
    keyHash:
      string;

    limit:
      number;
  }>;


/* ============================================================
   ENVIRONMENT
   ============================================================ */

function isProduction():
  boolean {
  return (
    process.env.NODE_ENV ===
    "production"
  );
}


/* ============================================================
   RESET SECRET
   ------------------------------------------------------------
   PASSWORD_RESET_SECRET peut être défini séparément.

   Sinon SESSION_SECRET est utilisé avec une séparation logique
   dédiée au password reset.

   Aucun NEXT_PUBLIC_.
   ============================================================ */

function getPasswordResetSecret():
  string {
  const secret =
    process.env
      .PASSWORD_RESET_SECRET
      ?.trim() ||
    process.env
      .SESSION_SECRET
      ?.trim();


  if (
    !secret ||
    secret.length <
      32
  ) {
    throw new Error(
      "PASSWORD_RESET_SECRET ou SESSION_SECRET est absent ou trop court.",
    );
  }


  return secret;
}


/* ============================================================
   RESEND CONFIGURATION
   ============================================================ */

function getResendApiKey():
  string {
  const value =
    process.env
      .RESEND_API_KEY
      ?.trim();


  if (!value) {
    throw new Error(
      "RESEND_API_KEY_MISSING",
    );
  }


  return value;
}


function getResendFromEmail():
  string {
  const value =
    process.env
      .RESEND_FROM_EMAIL
      ?.trim();


  if (!value) {
    throw new Error(
      "RESEND_FROM_EMAIL_MISSING",
    );
  }


  return value;
}


function getResendReplyToEmail():
  string | undefined {
  return (
    process.env
      .RESEND_REPLY_TO_EMAIL
      ?.trim() ||
    undefined
  );
}


/* ============================================================
   APPLICATION URL
   ------------------------------------------------------------
   Production :

   APP_URL=https://ton-domaine.com

   En développement, localhost est autorisé.
   ============================================================ */

function getApplicationBaseUrl():
  string {
  const configured =
    process.env
      .APP_URL
      ?.trim();


  if (configured) {
    try {
      const url =
        new URL(
          configured,
        );


      if (
        url.protocol !==
          "https:" &&
        url.protocol !==
          "http:"
      ) {
        throw new Error(
          "INVALID_PROTOCOL",
        );
      }


      return url
        .origin;
    } catch {
      throw new Error(
        "APP_URL_INVALID",
      );
    }
  }


  const vercelUrl =
    process.env
      .VERCEL_PROJECT_PRODUCTION_URL
      ?.trim() ||
    process.env
      .VERCEL_URL
      ?.trim();


  if (vercelUrl) {
    return `https://${vercelUrl.replace(
      /^https?:\/\//,
      "",
    )}`;
  }


  if (
    !isProduction()
  ) {
    return "http://localhost:3000";
  }


  throw new Error(
    "APP_URL_MISSING",
  );
}


/* ============================================================
   RESET ROUTE
   ------------------------------------------------------------
   Pendant l'ajout progressif de la fonctionnalité, le fallback
   permet au fichier de compiler même avant l'ajout définitif de
   resetPassword dans routes.ts.

   Dès que routes.gestionnaire.resetPassword existe, il sera
   automatiquement utilisé.
   ============================================================ */

function getResetPasswordRoute():
  string {
  const gestionnaireRoutes =
    routes.gestionnaire as
      typeof routes.gestionnaire & {
        resetPassword?:
          string;
      };


  return (
    gestionnaireRoutes
      .resetPassword ||
    "/gestionnaire/reinitialiser-mot-de-passe"
  );
}


/* ============================================================
   RESEND CLIENT
   ============================================================ */

let resendClient:
  Resend |
  null =
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
   REQUEST CONTEXT NORMALIZATION
   ============================================================ */

function normalizeIpAddress(
  value:
    string |
    null |
    undefined,
): string | null {
  const normalized =
    value
      ?.trim()
      .slice(
        0,
        MAX_IP_LENGTH,
      );


  return normalized ||
    null;
}


function normalizeUserAgent(
  value:
    string |
    null |
    undefined,
): string | null {
  const normalized =
    value
      ?.trim()
      .slice(
        0,
        MAX_USER_AGENT_LENGTH,
      );


  return normalized ||
    null;
}


/* ============================================================
   BASE64URL
   ============================================================ */

function encodeBase64Url(
  value:
    string,
): string {
  return Buffer
    .from(
      value,
      "utf8",
    )
    .toString(
      "base64url",
    );
}


function decodeBase64Url(
  value:
    string,
): string | null {
  try {
    return Buffer
      .from(
        value,
        "base64url",
      )
      .toString(
        "utf8",
      );
  } catch {
    return null;
  }
}


/* ============================================================
   HMAC
   ============================================================ */

function createResetHmac(
  value:
    string,
): string {
  return createHmac(
    "sha256",
    getPasswordResetSecret(),
  )
    .update(
      `password-reset:${value}`,
      "utf8",
    )
    .digest(
      "base64url",
    );
}


/* ============================================================
   SAFE SIGNATURE COMPARISON
   ============================================================ */

function signaturesEqual(
  first:
    string,
  second:
    string,
): boolean {
  try {
    const firstBuffer =
      Buffer.from(
        first,
        "base64url",
      );


    const secondBuffer =
      Buffer.from(
        second,
        "base64url",
      );


    if (
      firstBuffer.length ===
        0 ||
      secondBuffer.length ===
        0 ||
      firstBuffer.length !==
        secondBuffer.length
    ) {
      return false;
    }


    return timingSafeEqual(
      firstBuffer,
      secondBuffer,
    );
  } catch {
    return false;
  }
}


/* ============================================================
   UNIX TIME
   ============================================================ */

function currentUnixTime():
  number {
  return Math.floor(
    Date.now() /
      1000,
  );
}


/* ============================================================
   CREATE PASSWORD VERSION
   ============================================================ */

function getPasswordVersion(
  passwordChangedAt:
    Date |
    null,
): number | null {
  return (
    passwordChangedAt
      ?.getTime() ??
    null
  );
}


/* ============================================================
   CREATE RESET TOKEN
   ============================================================ */

function createPasswordResetToken(
  manager:
    PasswordResetManager,
): string {
  const now =
    currentUnixTime();


  const payload:
    PasswordResetTokenPayload = {
    version:
      PASSWORD_RESET_TOKEN_VERSION,

    kind:
      PASSWORD_RESET_TOKEN_KIND,

    subject:
      manager.id,

    nonce:
      randomBytes(
        24,
      ).toString(
        "base64url",
      ),

    issuedAt:
      now,

    expiresAt:
      now +
      PASSWORD_RESET_EXPIRATION_SECONDS,

    passwordChangedAt:
      getPasswordVersion(
        manager
          .passwordChangedAt,
      ),
  };


  const encodedPayload =
    encodeBase64Url(
      JSON.stringify(
        payload,
      ),
    );


  const signature =
    createResetHmac(
      encodedPayload,
    );


  return `${encodedPayload}.${signature}`;
}


/* ============================================================
   PARSE RESET TOKEN
   ============================================================ */

function parsePasswordResetToken(
  token:
    string,
): PasswordResetTokenPayload | null {
  try {
    const normalized =
      token.trim();


    if (
      normalized.length <
        20 ||
      normalized.length >
        MAX_RESET_TOKEN_LENGTH
    ) {
      return null;
    }


    const parts =
      normalized.split(
        ".",
      );


    if (
      parts.length !==
      2
    ) {
      return null;
    }


    const [
      encodedPayload,
      receivedSignature,
    ] =
      parts;


    if (
      !encodedPayload ||
      !receivedSignature
    ) {
      return null;
    }


    const expectedSignature =
      createResetHmac(
        encodedPayload,
      );


    if (
      !signaturesEqual(
        receivedSignature,
        expectedSignature,
      )
    ) {
      return null;
    }


    const decoded =
      decodeBase64Url(
        encodedPayload,
      );


    if (!decoded) {
      return null;
    }


    const raw:
      unknown =
        JSON.parse(
          decoded,
        );


    if (
      typeof raw !==
        "object" ||
      raw ===
        null ||
      Array.isArray(
        raw,
      )
    ) {
      return null;
    }


    const payload =
      raw as
        Partial<PasswordResetTokenPayload>;


    if (
      payload.version !==
        PASSWORD_RESET_TOKEN_VERSION ||
      payload.kind !==
        PASSWORD_RESET_TOKEN_KIND ||
      typeof payload.subject !==
        "string" ||
      !payload.subject.trim() ||
      typeof payload.nonce !==
        "string" ||
      payload.nonce.length <
        20 ||
      typeof payload.issuedAt !==
        "number" ||
      !Number.isInteger(
        payload.issuedAt,
      ) ||
      typeof payload.expiresAt !==
        "number" ||
      !Number.isInteger(
        payload.expiresAt,
      ) ||
      !(
        payload.passwordChangedAt ===
          null ||
        (
          typeof payload.passwordChangedAt ===
            "number" &&
          Number.isInteger(
            payload.passwordChangedAt,
          )
        )
      )
    ) {
      return null;
    }


    const now =
      currentUnixTime();


    if (
      payload.expiresAt <=
      now
    ) {
      return null;
    }


    if (
      payload.issuedAt >
      now +
        PASSWORD_RESET_CLOCK_SKEW_SECONDS
    ) {
      return null;
    }


    if (
      payload.expiresAt <=
      payload.issuedAt
    ) {
      return null;
    }


    if (
      payload.expiresAt -
        payload.issuedAt >
      PASSWORD_RESET_EXPIRATION_SECONDS
    ) {
      return null;
    }


    return payload as
      PasswordResetTokenPayload;
  } catch {
    return null;
  }
}


/* ============================================================
   ELIGIBLE MANAGER
   ============================================================ */

function managerCanResetPassword(
  manager:
    PasswordResetManager,
): boolean {
  return (
    manager.status ===
      ManagerStatus.ACTIVE &&
    Boolean(
      manager.emailVerifiedAt,
    ) &&
    manager.store.status ===
      StoreStatus.ACTIVE
  );
}


/* ============================================================
   FIND MANAGER BY EMAIL
   ============================================================ */

async function findManagerByEmail(
  email:
    string,
): Promise<PasswordResetManager | null> {
  const manager =
    await db.manager.findUnique({
      where: {
        email,
      },

      select: {
        id:
          true,

        storeId:
          true,

        email:
          true,

        passwordHash:
          true,

        passwordChangedAt:
          true,

        status:
          true,

        emailVerifiedAt:
          true,

        store: {
          select: {
            status:
              true,
          },
        },
      },
    });


  return manager;
}


/* ============================================================
   FIND MANAGER BY ID
   ============================================================ */

async function findManagerById(
  managerId:
    string,
): Promise<PasswordResetManager | null> {
  const manager =
    await db.manager.findUnique({
      where: {
        id:
          managerId,
      },

      select: {
        id:
          true,

        storeId:
          true,

        email:
          true,

        passwordHash:
          true,

        passwordChangedAt:
          true,

        status:
          true,

        emailVerifiedAt:
          true,

        store: {
          select: {
            status:
              true,
          },
        },
      },
    });


  return manager;
}


/* ============================================================
   VALIDATE TOKEN AGAINST CURRENT ACCOUNT
   ------------------------------------------------------------
   passwordChangedAt agit comme version du mot de passe.

   Exemple :

   token créé lorsque :
   passwordChangedAt = T1

   après reset :
   passwordChangedAt = T2

   ancien token contient T1
   base contient T2
   => token refusé.
   ============================================================ */

async function resolveManagerFromResetToken(
  token:
    string,
): Promise<{
  manager:
    PasswordResetManager;

  payload:
    PasswordResetTokenPayload;
} | null> {
  const payload =
    parsePasswordResetToken(
      token,
    );


  if (!payload) {
    return null;
  }


  const manager =
    await findManagerById(
      payload.subject,
    );


  if (
    !manager ||
    !managerCanResetPassword(
      manager,
    )
  ) {
    return null;
  }


  const currentPasswordVersion =
    getPasswordVersion(
      manager
        .passwordChangedAt,
    );


  if (
    currentPasswordVersion !==
    payload.passwordChangedAt
  ) {
    return null;
  }


  return {
    manager,
    payload,
  };
}


/* ============================================================
   PUBLIC TOKEN VALIDATION
   ------------------------------------------------------------
   Utilisée par la future page :

   /gestionnaire/reinitialiser-mot-de-passe

   pour savoir si elle doit afficher le formulaire.
   ============================================================ */

export async function validateGestionnairePasswordResetToken(
  token:
    string,
): Promise<PasswordResetTokenValidationResult> {
  try {
    const resolved =
      await resolveManagerFromResetToken(
        token,
      );


    return {
      valid:
        Boolean(
          resolved,
        ),
    };
  } catch {
    return {
      valid:
        false,
    };
  }
}


/* ============================================================
   RATE LIMIT KEY HASH
   ------------------------------------------------------------
   HMAC plutôt qu'un hash SHA256 simple.

   Même si la table de rate limiting était consultée, l'e-mail
   ou l'IP ne seraient pas directement récupérables sans secret.
   ============================================================ */

function createRateLimitKeyHash(
  type:
    "email" |
    "ip",

  value:
    string,
): string {
  return createHmac(
    "sha256",
    getPasswordResetSecret(),
  )
    .update(
      `password-reset-rate-limit:${type}:${value}`,
      "utf8",
    )
    .digest(
      "hex",
    );
}


/* ============================================================
   BUILD RATE LIMIT ENTRIES
   ============================================================ */

function createRateLimitEntries(
  email:
    string,

  ipAddress:
    string |
    null,
): readonly PasswordResetRateLimitEntry[] {
  const entries:
    PasswordResetRateLimitEntry[] = [
    {
      keyHash:
        createRateLimitKeyHash(
          "email",
          email,
        ),

      limit:
        PASSWORD_RESET_EMAIL_LIMIT,
    },
  ];


  if (
    ipAddress
  ) {
    entries.push({
      keyHash:
        createRateLimitKeyHash(
          "ip",
          ipAddress,
        ),

      limit:
        PASSWORD_RESET_IP_LIMIT,
    });
  }


  return entries;
}


/* ============================================================
   RETRY AFTER
   ============================================================ */

function retryAfterSeconds(
  future:
    Date,

  now:
    Date,
): number {
  return Math.max(
    1,
    Math.ceil(
      (
        future.getTime() -
        now.getTime()
      ) /
        1000,
    ),
  );
}


/* ============================================================
   CHECK RATE LIMIT
   ============================================================ */

async function checkPasswordResetRateLimit(
  entries:
    readonly PasswordResetRateLimitEntry[],
): Promise<{
  blocked:
    boolean;

  retryAfterSeconds:
    number |
    null;
}> {
  const now =
    new Date();


  const records =
    await Promise.all(
      entries.map(
        (
          entry,
        ) =>
          db
            .securityRateLimit
            .findUnique({
              where: {
                scope_keyHash: {
                  scope:
                    SecurityRateLimitScope
                      .PASSWORD_RESET,

                  keyHash:
                    entry.keyHash,
                },
              },

              select: {
                attemptCount:
                  true,

                expiresAt:
                  true,

                blockedUntil:
                  true,
              },
            }),
      ),
    );


  let longestRetry:
    number |
    null =
      null;


  for (
    let index = 0;
    index <
    entries.length;
    index += 1
  ) {
    const entry =
      entries[index];

    const record =
      records[index];


    if (
      !entry ||
      !record
    ) {
      continue;
    }


    if (
      record.blockedUntil &&
      record
        .blockedUntil
        .getTime() >
        now.getTime()
    ) {
      longestRetry =
        Math.max(
          longestRetry ??
            0,

          retryAfterSeconds(
            record.blockedUntil,
            now,
          ),
        );

      continue;
    }


    if (
      record
        .expiresAt
        .getTime() <=
        now.getTime()
    ) {
      continue;
    }


    if (
      record.attemptCount >=
      entry.limit
    ) {
      longestRetry =
        Math.max(
          longestRetry ??
            0,

          retryAfterSeconds(
            record.expiresAt,
            now,
          ),
        );
    }
  }


  return {
    blocked:
      longestRetry !==
      null,

    retryAfterSeconds:
      longestRetry,
  };
}


/* ============================================================
   RECORD RATE LIMIT ATTEMPT
   ============================================================ */

async function recordPasswordResetRateLimitAttempt(
  entry:
    PasswordResetRateLimitEntry,
): Promise<void> {
  const now =
    new Date();


  const expiresAt =
    new Date(
      now.getTime() +
      PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS *
        1000,
    );


  const existing =
    await db
      .securityRateLimit
      .findUnique({
        where: {
          scope_keyHash: {
            scope:
              SecurityRateLimitScope
                .PASSWORD_RESET,

            keyHash:
              entry.keyHash,
          },
        },

        select: {
          id:
            true,

          attemptCount:
            true,

          expiresAt:
            true,
        },
      });


  if (
    !existing ||
    existing
      .expiresAt
      .getTime() <=
      now.getTime()
  ) {
    await db
      .securityRateLimit
      .upsert({
        where: {
          scope_keyHash: {
            scope:
              SecurityRateLimitScope
                .PASSWORD_RESET,

            keyHash:
              entry.keyHash,
          },
        },

        create: {
          scope:
            SecurityRateLimitScope
              .PASSWORD_RESET,

          keyHash:
            entry.keyHash,

          attemptCount:
            1,

          windowStartedAt:
            now,

          expiresAt,

          blockedUntil:
            entry.limit <=
            1
              ? expiresAt
              : null,
        },

        update: {
          attemptCount:
            1,

          windowStartedAt:
            now,

          expiresAt,

          blockedUntil:
            entry.limit <=
            1
              ? expiresAt
              : null,
        },
      });


    return;
  }


  const nextAttemptCount =
    existing.attemptCount +
    1;


  await db
    .securityRateLimit
    .update({
      where: {
        id:
          existing.id,
      },

      data: {
        attemptCount: {
          increment:
            1,
        },

        blockedUntil:
          nextAttemptCount >=
          entry.limit
            ? existing
                .expiresAt
            : null,
      },
    });
}


/* ============================================================
   RECORD ALL RATE LIMIT ENTRIES
   ============================================================ */

async function recordPasswordResetRateLimitAttempts(
  entries:
    readonly PasswordResetRateLimitEntry[],
): Promise<void> {
  await Promise.all(
    entries.map(
      (
        entry,
      ) =>
        recordPasswordResetRateLimitAttempt(
          entry,
        ),
    ),
  );
}


/* ============================================================
   HTML ESCAPE
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
   RESET URL
   ============================================================ */

function createPasswordResetUrl(
  token:
    string,
): string {
  const url =
    new URL(
      getResetPasswordRoute(),
      getApplicationBaseUrl(),
    );


  url.searchParams.set(
    "token",
    token,
  );


  return url.toString();
}


/* ============================================================
   EMAIL — TEXT
   ============================================================ */

function createPasswordResetTextEmail(
  resetUrl:
    string,
): string {
  return [
    "L&E Cosmetics Empire",
    "",
    "Réinitialisation de votre mot de passe",
    "",
    "Une demande de réinitialisation du mot de passe de votre espace Gestionnaire a été effectuée.",
    "",
    `Utilisez ce lien : ${resetUrl}`,
    "",
    `Ce lien expire dans ${PASSWORD_RESET_EXPIRATION_MINUTES} minutes.`,
    "",
    "Si vous n'avez pas demandé cette modification, ignorez simplement cet e-mail.",
    "",
    "Ne partagez jamais ce lien avec une autre personne.",
  ].join(
    "\n",
  );
}


/* ============================================================
   EMAIL — HTML
   ============================================================ */

function createPasswordResetHtmlEmail(
  resetUrl:
    string,
): string {
  const safeUrl =
    escapeHtml(
      resetUrl,
    );


  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <title>
      Réinitialisation du mot de passe
    </title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background: #f7f7f8;
      font-family: Arial, Helvetica, sans-serif;
      color: #24242a;
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
        background: #f7f7f8;
        padding: 32px 14px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width: 100%;
              max-width: 560px;
              background: #ffffff;
              border: 1px solid #ececef;
              border-radius: 16px;
            "
          >
            <tr>
              <td
                style="
                  padding: 34px 32px 14px;
                  text-align: center;
                "
              >
                <div
                  style="
                    color: #ed006d;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 1px;
                  "
                >
                  L&amp;E COSMETICS EMPIRE
                </div>

                <h1
                  style="
                    margin: 16px 0 8px;
                    color: #1f2025;
                    font-size: 26px;
                    line-height: 1.25;
                  "
                >
                  Réinitialisez votre mot de passe
                </h1>

                <p
                  style="
                    margin: 0;
                    color: #777b86;
                    font-size: 14px;
                    line-height: 1.65;
                  "
                >
                  Une demande de réinitialisation a été reçue
                  pour votre espace Gestionnaire.
                </p>
              </td>
            </tr>

            <tr>
              <td
                align="center"
                style="
                  padding: 22px 32px;
                "
              >
                <a
                  href="${safeUrl}"
                  style="
                    display: inline-block;
                    padding: 14px 24px;
                    border-radius: 10px;
                    background: #ed006d;
                    color: #ffffff;
                    font-size: 14px;
                    font-weight: 700;
                    text-decoration: none;
                  "
                >
                  Réinitialiser mon mot de passe
                </a>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 4px 32px 28px;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #858995;
                    font-size: 12px;
                    line-height: 1.65;
                  "
                >
                  Ce lien est valable pendant
                  ${PASSWORD_RESET_EXPIRATION_MINUTES} minutes.
                  Après utilisation, il devient automatiquement
                  invalide.
                </p>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 20px 32px 28px;
                  border-top: 1px solid #f0f0f2;
                  text-align: center;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #9a9da6;
                    font-size: 11px;
                    line-height: 1.65;
                  "
                >
                  Si vous n’avez pas demandé cette
                  réinitialisation, ignorez cet e-mail.
                  Ne partagez jamais ce lien.
                </p>
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
   SEND RESET EMAIL
   ------------------------------------------------------------
   EmailLog conserve uniquement la trace métier.

   Le token et l'URL ne sont jamais enregistrés dans EmailLog.
   ============================================================ */

async function sendPasswordResetEmail(
  manager:
    PasswordResetManager,

  resetUrl:
    string,
): Promise<void> {
  let emailLogId:
    string |
    null =
      null;


  try {
    const emailLog =
      await db.emailLog.create({
        data: {
          storeId:
            manager.storeId,

          type:
            EmailType
              .PASSWORD_RESET,

          status:
            EmailStatus
              .PENDING,

          recipient:
            manager.email,

          subject:
            PASSWORD_RESET_EMAIL_SUBJECT,

          provider:
            "resend",

          referenceType:
            "MANAGER",

          referenceId:
            manager.id,
        },

        select: {
          id:
            true,
        },
      });


    emailLogId =
      emailLog.id;


    const resend =
      getResendClient();


    const {
      data,
      error,
    } =
      await resend
        .emails
        .send({
          from:
            getResendFromEmail(),

          to: [
            manager.email,
          ],

          subject:
            PASSWORD_RESET_EMAIL_SUBJECT,

          text:
            createPasswordResetTextEmail(
              resetUrl,
            ),

          html:
            createPasswordResetHtmlEmail(
              resetUrl,
            ),

          replyTo:
            getResendReplyToEmail(),
        });


    if (
      error ||
      !data?.id
    ) {
      await db.emailLog.update({
        where: {
          id:
            emailLog.id,
        },

        data: {
          status:
            EmailStatus
              .FAILED,

          failedAt:
            new Date(),

          failureReason:
            "Échec de l’envoi de l’e-mail de réinitialisation.",
        },
      });


      throw new Error(
        "PASSWORD_RESET_EMAIL_FAILED",
      );
    }


    await db.emailLog.update({
      where: {
        id:
          emailLog.id,
      },

      data: {
        status:
          EmailStatus
            .SENT,

        sentAt:
          new Date(),

        providerMessageId:
          data.id,
      },
    });
  } catch {
    if (
      emailLogId
    ) {
      try {
        await db.emailLog.updateMany({
          where: {
            id:
              emailLogId,

            status:
              EmailStatus
                .PENDING,
          },

          data: {
            status:
              EmailStatus
                .FAILED,

            failedAt:
              new Date(),

            failureReason:
              "Échec interne de l’envoi de l’e-mail de réinitialisation.",
          },
        });
      } catch {
        /*
         * Best effort.
         *
         * Aucun token, aucune URL et aucun secret ne sont loggés.
         */
      }
    }


    throw new Error(
      "PASSWORD_RESET_EMAIL_FAILED",
    );
  }
}


/* ============================================================
   INFRASTRUCTURE CHECK
   ------------------------------------------------------------
   Effectué avant de rechercher le compte afin qu'une mauvaise
   configuration serveur ne produise pas des réponses
   différentes selon l'existence de l'e-mail.
   ============================================================ */

function assertPasswordResetInfrastructure():
  void {
  getPasswordResetSecret();

  getResendApiKey();

  getResendFromEmail();

  getApplicationBaseUrl();
}


/* ============================================================
   REQUEST PASSWORD RESET
   ------------------------------------------------------------
   RÉPONSE ANTI-ÉNUMÉRATION :

   Pour :
   - compte inexistant ;
   - compte non éligible ;
   - e-mail envoyé ;

   le résultat public reste :

   { ok: true }

   Ainsi l'interface peut toujours afficher :

   "Si un compte correspond à cette adresse, un lien de
   réinitialisation a été envoyé."
   ============================================================ */

export async function requestGestionnairePasswordReset(
  input:
    RequestGestionnairePasswordResetInput,

  context:
    PasswordResetRequestContext = {},
): Promise<RequestGestionnairePasswordResetResult> {
  const parsed =
    passwordResetRequestSchema
      .safeParse(
        input,
      );


  if (
    !parsed.success
  ) {
    return {
      ok:
        false,

      code:
        "INVALID_INPUT",
    };
  }


  const email =
    parsed.data.email;


  const ipAddress =
    normalizeIpAddress(
      context.ipAddress,
    );


  const rateLimitEntries =
    createRateLimitEntries(
      email,
      ipAddress,
    );


  try {
    /* --------------------------------------------------------
       RATE LIMIT CHECK
       -------------------------------------------------------- */

    const rateLimit =
      await checkPasswordResetRateLimit(
        rateLimitEntries,
      );


    if (
      rateLimit.blocked
    ) {
      return {
        ok:
          false,

        code:
          "RATE_LIMITED",

        retryAfterSeconds:
          rateLimit
            .retryAfterSeconds,
      };
    }


    /* --------------------------------------------------------
       CONSUME ATTEMPT
       -------------------------------------------------------- */

    await recordPasswordResetRateLimitAttempts(
      rateLimitEntries,
    );


    /* --------------------------------------------------------
       SERVER CONFIGURATION
       -------------------------------------------------------- */

    assertPasswordResetInfrastructure();


    /* --------------------------------------------------------
       ACCOUNT LOOKUP
       -------------------------------------------------------- */

    const manager =
      await findManagerByEmail(
        email,
      );


    /*
     * IMPORTANT :
     *
     * Réponse identique si le compte n'existe pas.
     */

    if (
      !manager ||
      !managerCanResetPassword(
        manager,
      )
    ) {
      return {
        ok:
          true,
      };
    }


    /* --------------------------------------------------------
       CREATE TOKEN
       -------------------------------------------------------- */

    const token =
      createPasswordResetToken(
        manager,
      );


    const resetUrl =
      createPasswordResetUrl(
        token,
      );


    /* --------------------------------------------------------
       SEND EMAIL
       --------------------------------------------------------
       Une erreur Resend n'est volontairement pas transformée
       en message permettant de confirmer l'existence du compte.

       EmailLog conservera l'échec technique.
       -------------------------------------------------------- */

    try {
      await sendPasswordResetEmail(
        manager,
        resetUrl,
      );
    } catch {
      /*
       * Réponse publique générique.
       */
    }


    return {
      ok:
        true,
    };
  } catch {
    return {
      ok:
        false,

      code:
        "UNAVAILABLE",
    };
  }
}


/* ============================================================
   COMPLETE PASSWORD RESET
   ============================================================ */

export async function completeGestionnairePasswordReset(
  input:
    CompleteGestionnairePasswordResetInput,

  context:
    PasswordResetRequestContext = {},
): Promise<CompleteGestionnairePasswordResetResult> {
  const parsed =
    passwordResetCompletionSchema
      .safeParse(
        input,
      );


  if (
    !parsed.success
  ) {
    return {
      ok:
        false,

      code:
        "INVALID_INPUT",
    };
  }


  const {
    token,
    password,
    passwordConfirmation,
  } =
    parsed.data;


  /* ----------------------------------------------------------
     PASSWORD CONFIRMATION
     ---------------------------------------------------------- */

  if (
    password !==
    passwordConfirmation
  ) {
    return {
      ok:
        false,

      code:
        "PASSWORD_MISMATCH",
    };
  }


  try {
    /* --------------------------------------------------------
       TOKEN + ACCOUNT
       -------------------------------------------------------- */

    const resolved =
      await resolveManagerFromResetToken(
        token,
      );


    if (
      !resolved
    ) {
      return {
        ok:
          false,

        code:
          "INVALID_OR_EXPIRED_TOKEN",
      };
    }


    const {
      manager,
      payload,
    } =
      resolved;


    /* --------------------------------------------------------
       PREVENT CURRENT PASSWORD REUSE
       -------------------------------------------------------- */

    let isCurrentPassword =
      false;


    try {
      isCurrentPassword =
        await argon2.verify(
          manager.passwordHash,
          password,
        );
    } catch {
      return {
        ok:
          false,

        code:
          "UNAVAILABLE",
      };
    }


    if (
      isCurrentPassword
    ) {
      return {
        ok:
          false,

        code:
          "PASSWORD_REUSE_NOT_ALLOWED",
      };
    }


    /* --------------------------------------------------------
       HASH NEW PASSWORD
       -------------------------------------------------------- */

    const newPasswordHash =
      await argon2.hash(
        password,
        ARGON2_OPTIONS,
      );


    /* --------------------------------------------------------
       NEW PASSWORD VERSION
       --------------------------------------------------------
       On garantit une valeur strictement supérieure à
       l'ancienne lorsque passwordChangedAt existait.
       -------------------------------------------------------- */

    const now =
      Date.now();


    const previousPasswordVersion =
      payload
        .passwordChangedAt ??
      0;


    const newPasswordChangedAt =
      new Date(
        Math.max(
          now,
          previousPasswordVersion +
            1,
        ),
      );


    /* --------------------------------------------------------
       ATOMIC SINGLE-USE UPDATE
       --------------------------------------------------------
       updateMany permet de vérifier que passwordChangedAt n'a
       pas changé depuis la génération/validation du token.

       Si deux requêtes tentent d'utiliser simultanément le même
       lien, une seule peut réussir.
       -------------------------------------------------------- */

    const updateResult =
      await db.manager.updateMany({
        where: {
          id:
            manager.id,

          status:
            ManagerStatus.ACTIVE,

          emailVerifiedAt: {
            not:
              null,
          },

          passwordChangedAt:
            manager
              .passwordChangedAt,
        },

        data: {
          passwordHash:
            newPasswordHash,

          passwordChangedAt:
            newPasswordChangedAt,
        },
      });


    if (
      updateResult.count !==
      1
    ) {
      return {
        ok:
          false,

        code:
          "INVALID_OR_EXPIRED_TOKEN",
      };
    }


    /* --------------------------------------------------------
       AUDIT LOG
       --------------------------------------------------------
       Aucun mot de passe ou token n'est enregistré.
       -------------------------------------------------------- */

    const ipAddress =
      normalizeIpAddress(
        context.ipAddress,
      );


    const userAgent =
      normalizeUserAgent(
        context.userAgent,
      );


    try {
      await db.auditLog.create({
        data: {
          storeId:
            manager.storeId,

          managerId:
            manager.id,

          action:
            AuditAction
              .PASSWORD_CHANGE,

          entityType:
            "Manager",

          entityId:
            manager.id,

          metadata: {
            source:
              "PASSWORD_RESET",
          },

          ipAddress,

          userAgent,
        },
      });
    } catch {
      /*
       * Le changement de mot de passe a déjà réussi.
       *
       * Un problème d'AuditLog ne doit pas remettre l'ancien
       * mot de passe en service.
       */
    }


    return {
      ok:
        true,
    };
  } catch {
    return {
      ok:
        false,

      code:
        "UNAVAILABLE",
    };
  }
}