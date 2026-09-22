

import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from "node:crypto";

import * as argon2 from "argon2";

import {
  Prisma,
  RegistrationStatus,
  SecurityRateLimitScope,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  resendEmailSender,
} from "@/server/email/resend";

import type {
  GestionnaireRegistrationData,
} from "@/lib/validation/gestionnaire-registration";


/* ============================================================
   L&E COSMETICS EMPIRE
   REGISTRATION SERVICE — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/server/gestionnaire/registration-service.ts

   Stack :
   - Next.js
   - Prisma ORM 7.10.0
   - PostgreSQL / Supabase
   - Argon2id
   - Resend via src/server/email/resend.ts

   RESPONSABILITÉS :

   - vérifier le code représentant côté serveur ;
   - limiter les tentatives ;
   - hasher le mot de passe ;
   - créer / reprendre une inscription temporaire ;
   - générer et sécuriser les OTP ;
   - vérifier les OTP ;
   - créer Store + Manager transactionnellement ;
   - activer le Gestionnaire ;
   - gérer les renvois OTP ;
   - ne jamais exposer les secrets au navigateur.

   IMPORTANT :

   Le code représentant, le mot de passe, l'OTP brut et les
   secrets serveur ne sont jamais enregistrés dans les logs.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const OTP_LENGTH = 6;

const OTP_EXPIRATION_MINUTES = 10;

const OTP_EXPIRATION_MS =
  OTP_EXPIRATION_MINUTES *
  60 *
  1000;

const OTP_MAX_ATTEMPTS = 5;

const OTP_RESEND_COOLDOWN_SECONDS = 60;

const OTP_RESEND_COOLDOWN_MS =
  OTP_RESEND_COOLDOWN_SECONDS *
  1000;

const PENDING_TOKEN_EXPIRATION_MINUTES = 30;

const PENDING_TOKEN_EXPIRATION_MS =
  PENDING_TOKEN_EXPIRATION_MINUTES *
  60 *
  1000;

const REGISTRATION_EXPIRATION_HOURS = 24;

const REGISTRATION_EXPIRATION_MS =
  REGISTRATION_EXPIRATION_HOURS *
  60 *
  60 *
  1000;

const REGISTRATION_RATE_LIMIT_MAX = 5;

const REGISTRATION_RATE_LIMIT_WINDOW_SECONDS =
  15 * 60;

const REPRESENTATIVE_CODE_RATE_LIMIT_MAX = 5;

const REPRESENTATIVE_CODE_RATE_LIMIT_WINDOW_SECONDS =
  15 * 60;

const VERIFICATION_RATE_LIMIT_MAX = 10;

const VERIFICATION_RATE_LIMIT_WINDOW_SECONDS =
  15 * 60;

const RESEND_RATE_LIMIT_MAX = 5;

const RESEND_RATE_LIMIT_WINDOW_SECONDS =
  60 * 60;

const STORE_SLUG_RANDOM_BYTES = 4;

const STORE_SLUG_MAX_ATTEMPTS = 8;


/* ============================================================
   ARGON2
   ============================================================ */

const ARGON2_OPTIONS =
  Object.freeze({
    type:
      argon2.argon2id,

    memoryCost:
      19456,

    timeCost:
      2,

    parallelism:
      1,
  });


/* ============================================================
   FAILURE CODES
   ============================================================ */

export type RegistrationServiceFailureCode =
  | "INVALID_REPRESENTATIVE_CODE"
  | "EMAIL_ALREADY_USED"
  | "RATE_LIMITED"
  | "EMAIL_DELIVERY_FAILED"
  | "REGISTRATION_UNAVAILABLE"
  | "UNKNOWN";


export type VerificationFailureCode =
  | "INVALID_OR_EXPIRED_CODE"
  | "TOO_MANY_ATTEMPTS"
  | "RATE_LIMITED"
  | "ACCOUNT_NOT_PENDING"
  | "UNKNOWN";


export type ResendVerificationFailureCode =
  | "RATE_LIMITED"
  | "EMAIL_DELIVERY_FAILED"
  | "ACCOUNT_NOT_PENDING"
  | "UNKNOWN";


/* ============================================================
   RATE LIMIT
   ============================================================ */

export type RegistrationRateLimitScope =
  | "registration-email"
  | "representative-code"
  | "verification-token"
  | "verification-resend";


export type RateLimitRequest =
  Readonly<{
    scope:
      RegistrationRateLimitScope;

    key:
      string;

    limit:
      number;

    windowSeconds:
      number;
  }>;


export type RateLimitResult =
  Readonly<{
    allowed:
      boolean;

    retryAfterSeconds?:
      number;
  }>;


/* ============================================================
   PENDING REGISTRATION RECORD
   ============================================================ */

export type PendingGestionnaireRecord =
  Readonly<{
    id:
      string;

    email:
      string;

    status:
      RegistrationStatus;

    otpHash:
      string;

    otpExpiresAt:
      Date;

    otpAttemptCount:
      number;

    otpResendCount:
      number;

    otpLastSentAt:
      Date | null;

    registrationTokenExpiresAt:
      Date;

    expiresAt:
      Date;
  }>;


/* ============================================================
   UPSERT PENDING REGISTRATION
   ============================================================ */

export type PendingRegistrationUpsertInput =
  Readonly<{
    shopName:
      string;

    country:
      string;

    city:
      string;

    shopAddress:
      string;

    phone:
      string;

    email:
      string;

    passwordHash:
      string;

    registrationTokenHash:
      string;

    registrationTokenExpiresAt:
      Date;

    otpHash:
      string;

    otpExpiresAt:
      Date;

    otpLastSentAt:
      Date;

    expiresAt:
      Date;
  }>;


export type PendingRegistrationUpsertResult =
  | Readonly<{
      kind:
        "pending";

      registrationId:
        string;
    }>
  | Readonly<{
      kind:
        "email_used";
    }>;


/* ============================================================
   OTP ATTEMPTS
   ============================================================ */

export type IncrementOtpAttemptsInput =
  Readonly<{
    registrationId:
      string;

    registrationTokenHash:
      string;
  }>;


/* ============================================================
   OTP ROTATION
   ============================================================ */

export type RotateOtpInput =
  Readonly<{
    registrationId:
      string;

    registrationTokenHash:
      string;

    otpHash:
      string;

    otpExpiresAt:
      Date;

    otpLastSentAt:
      Date;
  }>;


/* ============================================================
   ACCOUNT ACTIVATION
   ============================================================ */

export type ActivatePendingRegistrationInput =
  Readonly<{
    registrationId:
      string;

    registrationTokenHash:
      string;

    expectedOtpHash:
      string;

    emailVerifiedAt:
      Date;
  }>;


export type ActivatePendingRegistrationResult =
  | Readonly<{
      kind:
        "activated";

      gestionnaireId:
        string;
    }>
  | Readonly<{
      kind:
        "not_pending";
    }>
  | Readonly<{
      kind:
        "email_used";
    }>;


/* ============================================================
   PERSISTENCE CONTRACT
   ============================================================ */

export interface RegistrationPersistence {
  consumeRateLimit(
    request:
      RateLimitRequest,
  ): Promise<RateLimitResult>;


  upsertPendingRegistration(
    input:
      PendingRegistrationUpsertInput,
  ): Promise<PendingRegistrationUpsertResult>;


  findPendingByTokenHash(
    registrationTokenHash:
      string,
  ): Promise<PendingGestionnaireRecord | null>;


  incrementOtpAttempts(
    input:
      IncrementOtpAttemptsInput,
  ): Promise<number>;


  activatePendingRegistration(
    input:
      ActivatePendingRegistrationInput,
  ): Promise<ActivatePendingRegistrationResult>;


  rotatePendingOtp(
    input:
      RotateOtpInput,
  ): Promise<boolean>;
}


/* ============================================================
   EMAIL CONTRACT
   ------------------------------------------------------------
   src/server/email/resend.ts reste l'unique implémentation
   réelle de l'envoi d'e-mails.
   ============================================================ */

export type VerificationEmailInput =
  Readonly<{
    to:
      string;

    code:
      string;

    expiresInMinutes:
      number;
  }>;


export interface RegistrationEmailSender {
  sendVerificationCode(
    input:
      VerificationEmailInput,
  ): Promise<void>;
}


/* ============================================================
   INFRASTRUCTURE
   ============================================================ */

export type RegistrationServiceInfrastructure =
  Readonly<{
    persistence:
      RegistrationPersistence;

    emailSender:
      RegistrationEmailSender;
  }>;


/* ============================================================
   DATE HELPERS
   ============================================================ */

function addMilliseconds(
  date:
    Date,
  milliseconds:
    number,
): Date {
  return new Date(
    date.getTime() +
      milliseconds,
  );
}


function secondsUntil(
  futureDate:
    Date,
): number {
  return Math.max(
    1,
    Math.ceil(
      (
        futureDate.getTime() -
        Date.now()
      ) /
        1000,
    ),
  );
}


/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalizeEmail(
  email:
    string,
): string {
  return email
    .trim()
    .toLowerCase();
}


function normalizeSlugPart(
  value:
    string,
): string {
  const normalized =
    value
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      );


  return normalized ||
    "le-cosmetics";
}


/* ============================================================
   PRISMA ERROR
   ============================================================ */

function isUniqueConstraintError(
  error:
    unknown,
): boolean {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return false;
  }


  if (
    !(
      "code" in
      error
    )
  ) {
    return false;
  }


  return (
    error as {
      code?: unknown;
    }
  ).code ===
    "P2002";
}


/* ============================================================
   RATE LIMIT SCOPE MAPPER
   ============================================================ */

function mapRateLimitScope(
  scope:
    RegistrationRateLimitScope,
): SecurityRateLimitScope {
  switch (scope) {
    case "registration-email":
      return SecurityRateLimitScope
        .REGISTRATION_EMAIL;

    case "representative-code":
      return SecurityRateLimitScope
        .REPRESENTATIVE_CODE;

    case "verification-token":
      return SecurityRateLimitScope
        .VERIFICATION_TOKEN;

    case "verification-resend":
      return SecurityRateLimitScope
        .VERIFICATION_RESEND;
  }
}


/* ============================================================
   HASH RATE LIMIT KEY
   ============================================================ */

function hashRateLimitKey(
  value:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "hex",
    );
}


/* ============================================================
   CREATE UNIQUE STORE SLUG
   ============================================================ */

async function createUniqueStoreSlug(
  transaction:
    Prisma.TransactionClient,

  storeName:
    string,

  city:
    string,
): Promise<string> {
  const base =
    normalizeSlugPart(
      `${storeName}-${city}`,
    );


  for (
    let attempt = 0;
    attempt <
      STORE_SLUG_MAX_ATTEMPTS;
    attempt += 1
  ) {
    const suffix =
      randomBytes(
        STORE_SLUG_RANDOM_BYTES,
      ).toString(
        "hex",
      );


    const slug =
      `${base}-${suffix}`;


    const existingStore =
      await transaction
        .store
        .findUnique({
          where: {
            slug,
          },

          select: {
            id:
              true,
          },
        });


    if (!existingStore) {
      return slug;
    }
  }


  throw new Error(
    "STORE_SLUG_GENERATION_FAILED",
  );
}


/* ============================================================
   PRISMA PERSISTENCE
   ============================================================ */

const prismaRegistrationPersistence:
  RegistrationPersistence = {
  /* ----------------------------------------------------------
     RATE LIMIT
     ---------------------------------------------------------- */

  async consumeRateLimit(
    request,
  ) {
    const scope =
      mapRateLimitScope(
        request.scope,
      );


    const keyHash =
      hashRateLimitKey(
        request.key,
      );


    return db.$transaction(
      async (
        transaction,
      ) => {
        const now =
          new Date();


        const current =
          await transaction
            .securityRateLimit
            .findUnique({
              where: {
                scope_keyHash: {
                  scope,
                  keyHash,
                },
              },
            });


        /* ------------------------------------------
           FIRST ATTEMPT
           ------------------------------------------ */

        if (!current) {
          await transaction
            .securityRateLimit
            .create({
              data: {
                scope,
                keyHash,

                attemptCount:
                  1,

                windowStartedAt:
                  now,

                expiresAt:
                  addMilliseconds(
                    now,
                    request
                      .windowSeconds *
                      1000,
                  ),

                blockedUntil:
                  null,
              },
            });


          return {
            allowed:
              true,
          };
        }


        /* ------------------------------------------
           ACTIVE BLOCK
           ------------------------------------------ */

        if (
          current
            .blockedUntil &&
          current
            .blockedUntil
            .getTime() >
            now.getTime()
        ) {
          return {
            allowed:
              false,

            retryAfterSeconds:
              secondsUntil(
                current
                  .blockedUntil,
              ),
          };
        }


        /* ------------------------------------------
           WINDOW EXPIRED
           ------------------------------------------ */

        if (
          current
            .expiresAt
            .getTime() <=
          now.getTime()
        ) {
          await transaction
            .securityRateLimit
            .update({
              where: {
                id:
                  current.id,
              },

              data: {
                attemptCount:
                  1,

                windowStartedAt:
                  now,

                expiresAt:
                  addMilliseconds(
                    now,
                    request
                      .windowSeconds *
                      1000,
                  ),

                blockedUntil:
                  null,
              },
            });


          return {
            allowed:
              true,
          };
        }


        /* ------------------------------------------
           LIMIT REACHED
           ------------------------------------------ */

        if (
          current
            .attemptCount >=
          request.limit
        ) {
          await transaction
            .securityRateLimit
            .update({
              where: {
                id:
                  current.id,
              },

              data: {
                blockedUntil:
                  current
                    .expiresAt,
              },
            });


          return {
            allowed:
              false,

            retryAfterSeconds:
              secondsUntil(
                current
                  .expiresAt,
              ),
          };
        }


        /* ------------------------------------------
           ACCEPT + INCREMENT
           ------------------------------------------ */

        await transaction
          .securityRateLimit
          .update({
            where: {
              id:
                current.id,
            },

            data: {
              attemptCount: {
                increment:
                  1,
              },
            },
          });


        return {
          allowed:
            true,
        };
      },
    );
  },


  /* ----------------------------------------------------------
     CREATE / RESUME REGISTRATION
     ---------------------------------------------------------- */

  async upsertPendingRegistration(
    input,
  ) {
    const email =
      normalizeEmail(
        input.email,
      );


    try {
      return await db.$transaction(
        async (
          transaction,
        ): Promise<
          PendingRegistrationUpsertResult
        > => {
          const existingManager =
            await transaction
              .manager
              .findUnique({
                where: {
                  email,
                },

                select: {
                  id:
                    true,
                },
              });


          if (
            existingManager
          ) {
            return {
              kind:
                "email_used",
            };
          }


          const existingRegistration =
            await transaction
              .managerRegistration
              .findUnique({
                where: {
                  email,
                },

                select: {
                  id:
                    true,

                  status:
                    true,
                },
              });


          const registrationData = {
            storeName:
              input.shopName,

            country:
              input.country,

            city:
              input.city,

            address:
              input.shopAddress,

            phone:
              input.phone,

            email,

            passwordHash:
              input.passwordHash,

            status:
              RegistrationStatus
                .WAITING_EMAIL_VERIFICATION,

            otpHash:
              input.otpHash,

            otpExpiresAt:
              input.otpExpiresAt,

            otpAttemptCount:
              0,

            otpResendCount:
              0,

            otpLastSentAt:
              input.otpLastSentAt,

            emailVerifiedAt:
              null,

            registrationTokenHash:
              input
                .registrationTokenHash,

            registrationTokenExpiresAt:
              input
                .registrationTokenExpiresAt,

            expiresAt:
              input.expiresAt,

            completedAt:
              null,
          } satisfies
            Prisma.ManagerRegistrationUncheckedCreateInput;


          if (
            existingRegistration
          ) {
            if (
              existingRegistration
                .status ===
              RegistrationStatus
                .COMPLETED
            ) {
              return {
                kind:
                  "email_used",
              };
            }


            const updated =
              await transaction
                .managerRegistration
                .update({
                  where: {
                    id:
                      existingRegistration.id,
                  },

                  data: {
                    storeName:
                      registrationData
                        .storeName,

                    country:
                      registrationData
                        .country,

                    city:
                      registrationData
                        .city,

                    address:
                      registrationData
                        .address,

                    phone:
                      registrationData
                        .phone,

                    passwordHash:
                      registrationData
                        .passwordHash,

                    status:
                      registrationData
                        .status,

                    otpHash:
                      registrationData
                        .otpHash,

                    otpExpiresAt:
                      registrationData
                        .otpExpiresAt,

                    otpAttemptCount:
                      0,

                    otpResendCount:
                      0,

                    otpLastSentAt:
                      registrationData
                        .otpLastSentAt,

                    emailVerifiedAt:
                      null,

                    registrationTokenHash:
                      registrationData
                        .registrationTokenHash,

                    registrationTokenExpiresAt:
                      registrationData
                        .registrationTokenExpiresAt,

                    expiresAt:
                      registrationData
                        .expiresAt,

                    completedAt:
                      null,
                  },

                  select: {
                    id:
                      true,
                  },
                });


            return {
              kind:
                "pending",

              registrationId:
                updated.id,
            };
          }


          const created =
            await transaction
              .managerRegistration
              .create({
                data:
                  registrationData,

                select: {
                  id:
                    true,
                },
              });


          return {
            kind:
              "pending",

            registrationId:
              created.id,
          };
        },
      );
    } catch (
      error
    ) {
      if (
        isUniqueConstraintError(
          error,
        )
      ) {
        return {
          kind:
            "email_used",
        };
      }


      throw error;
    }
  },


  /* ----------------------------------------------------------
     FIND BY TOKEN HASH
     ---------------------------------------------------------- */

  async findPendingByTokenHash(
    registrationTokenHash,
  ) {
    const registration =
      await db
        .managerRegistration
        .findUnique({
          where: {
            registrationTokenHash,
          },

          select: {
            id:
              true,

            email:
              true,

            status:
              true,

            otpHash:
              true,

            otpExpiresAt:
              true,

            otpAttemptCount:
              true,

            otpResendCount:
              true,

            otpLastSentAt:
              true,

            registrationTokenExpiresAt:
              true,

            expiresAt:
              true,
          },
        });


    if (
      !registration
    ) {
      return null;
    }


    return registration;
  },


  /* ----------------------------------------------------------
     INCREMENT OTP ATTEMPTS
     ---------------------------------------------------------- */

  async incrementOtpAttempts(
    input,
  ) {
    const result =
      await db
        .managerRegistration
        .updateMany({
          where: {
            id:
              input
                .registrationId,

            registrationTokenHash:
              input
                .registrationTokenHash,

            status:
              RegistrationStatus
                .WAITING_EMAIL_VERIFICATION,
          },

          data: {
            otpAttemptCount: {
              increment:
                1,
            },
          },
        });


    if (
      result.count ===
      0
    ) {
      return OTP_MAX_ATTEMPTS;
    }


    const registration =
      await db
        .managerRegistration
        .findUnique({
          where: {
            id:
              input
                .registrationId,
          },

          select: {
            otpAttemptCount:
              true,
          },
        });


    return (
      registration
        ?.otpAttemptCount ??
      OTP_MAX_ATTEMPTS
    );
  },


  /* ----------------------------------------------------------
     ACTIVATE REGISTRATION
     ---------------------------------------------------------- */

  async activatePendingRegistration(
    input,
  ) {
    try {
      return await db.$transaction(
        async (
          transaction,
        ): Promise<
          ActivatePendingRegistrationResult
        > => {
          const now =
            new Date();


          const registration =
            await transaction
              .managerRegistration
              .findUnique({
                where: {
                  id:
                    input
                      .registrationId,
                },
              });


          if (
            !registration ||
            registration.status !==
              RegistrationStatus
                .WAITING_EMAIL_VERIFICATION ||
            registration
              .registrationTokenHash !==
              input
                .registrationTokenHash ||
            registration
              .otpHash !==
              input
                .expectedOtpHash ||
            registration
              .registrationTokenExpiresAt
              .getTime() <=
              now.getTime() ||
            registration
              .expiresAt
              .getTime() <=
              now.getTime()
          ) {
            return {
              kind:
                "not_pending",
            };
          }


          const existingManager =
            await transaction
              .manager
              .findUnique({
                where: {
                  email:
                    registration
                      .email,
                },

                select: {
                  id:
                    true,
                },
              });


          if (
            existingManager
          ) {
            return {
              kind:
                "email_used",
            };
          }


          const slug =
            await createUniqueStoreSlug(
              transaction,
              registration
                .storeName,
              registration
                .city,
            );


          const store =
            await transaction
              .store
              .create({
                data: {
                  name:
                    registration
                      .storeName,

                  slug,

                  city:
                    registration
                      .city,

                  country:
                    registration
                      .country,

                  address:
                    registration
                      .address,

                  phone:
                    registration
                      .phone,

                  email:
                    registration
                      .email,
                },

                select: {
                  id:
                    true,
                },
              });


          const manager =
            await transaction
              .manager
              .create({
                data: {
                  storeId:
                    store.id,

                  email:
                    registration
                      .email,

                  passwordHash:
                    registration
                      .passwordHash,

                  emailVerifiedAt:
                    input
                      .emailVerifiedAt,
                },

                select: {
                  id:
                    true,
                },
              });


          const invalidatedOtpHash =
            createHash(
              "sha256",
            )
              .update(
                randomBytes(
                  32,
                ),
              )
              .digest(
                "hex",
              );


          const invalidatedTokenHash =
            createHash(
              "sha256",
            )
              .update(
                randomBytes(
                  32,
                ),
              )
              .digest(
                "hex",
              );


          await transaction
            .managerRegistration
            .update({
              where: {
                id:
                  registration.id,
              },

              data: {
                status:
                  RegistrationStatus
                    .COMPLETED,

                emailVerifiedAt:
                  input
                    .emailVerifiedAt,

                completedAt:
                  now,

                otpHash:
                  invalidatedOtpHash,

                otpExpiresAt:
                  now,

                registrationTokenHash:
                  invalidatedTokenHash,

                registrationTokenExpiresAt:
                  now,
              },
            });


          return {
            kind:
              "activated",

            gestionnaireId:
              manager.id,
          };
        },
      );
    } catch (
      error
    ) {
      if (
        isUniqueConstraintError(
          error,
        )
      ) {
        return {
          kind:
            "email_used",
        };
      }


      throw error;
    }
  },


  /* ----------------------------------------------------------
     ROTATE OTP
     ---------------------------------------------------------- */

  async rotatePendingOtp(
    input,
  ) {
    const now =
      new Date();


    const result =
      await db
        .managerRegistration
        .updateMany({
          where: {
            id:
              input
                .registrationId,

            registrationTokenHash:
              input
                .registrationTokenHash,

            status:
              RegistrationStatus
                .WAITING_EMAIL_VERIFICATION,

            registrationTokenExpiresAt: {
              gt:
                now,
            },

            expiresAt: {
              gt:
                now,
            },
          },

          data: {
            otpHash:
              input.otpHash,

            otpExpiresAt:
              input.otpExpiresAt,

            otpAttemptCount:
              0,

            otpResendCount: {
              increment:
                1,
            },

            otpLastSentAt:
              input
                .otpLastSentAt,
          },
        });


    return (
      result.count ===
      1
    );
  },
};


/* ============================================================
   INFRASTRUCTURE CONFIGURATION
   ------------------------------------------------------------
   Implémentations réelles utilisées par défaut :

   - Persistence : Prisma / PostgreSQL / Supabase
   - E-mail      : Resend

   Les fonctions de configuration restent disponibles pour les
   tests, les environnements contrôlés ou un remplacement futur
   de l'infrastructure, sans modifier le code métier.
   ============================================================ */

let registrationPersistence:
  RegistrationPersistence =
  prismaRegistrationPersistence;


let registrationEmailSender:
  RegistrationEmailSender =
  resendEmailSender;


/* ============================================================
   FULL INFRASTRUCTURE OVERRIDE
   ------------------------------------------------------------
   Permet de remplacer simultanément la persistence et le
   transport e-mail, notamment pour des tests serveur.
   ============================================================ */

export function configureRegistrationServiceInfrastructure(
  infrastructure:
    RegistrationServiceInfrastructure,
): void {
  registrationPersistence =
    infrastructure.persistence;

  registrationEmailSender =
    infrastructure.emailSender;
}


/* ============================================================
   EMAIL SENDER OVERRIDE
   ------------------------------------------------------------
   Permet de remplacer uniquement le transport e-mail sans
   toucher à la persistence Prisma.
   ============================================================ */

export function configureRegistrationEmailSender(
  emailSender:
    RegistrationEmailSender,
): void {
  registrationEmailSender =
    emailSender;
}


/* ============================================================
   GET INFRASTRUCTURE
   ============================================================ */

function getRegistrationInfrastructure():
  RegistrationServiceInfrastructure {
  return {
    persistence:
      registrationPersistence,

    emailSender:
      registrationEmailSender,
  };
}


/* ============================================================
   ENV — REPRESENTATIVE CODE HASH
   ============================================================ */

function getRepresentativeCodeHash():
  string | null {
  const value =
    process.env
      .REPRESENTATIVE_CODE_HASH
      ?.trim();


  return value ||
    null;
}


/* ============================================================
   ENV — OTP PEPPER
   ============================================================ */

function getOtpPepper():
  string | null {
  const value =
    process.env
      .OTP_PEPPER;


  if (
    !value ||
    value.length <
      32
  ) {
    return null;
  }


  return value;
}


/* ============================================================
   REPRESENTATIVE CODE
   ============================================================ */

async function verifyRepresentativeCode(
  submittedCode:
    string,
): Promise<boolean> {
  const representativeCodeHash =
    getRepresentativeCodeHash();


  if (
    !representativeCodeHash ||
    !submittedCode
  ) {
    return false;
  }


  try {
    return await argon2.verify(
      representativeCodeHash,
      submittedCode,
    );
  } catch {
    return false;
  }
}


/* ============================================================
   PASSWORD HASH
   ============================================================ */

async function hashPassword(
  password:
    string,
): Promise<string> {
  return argon2.hash(
    password,
    ARGON2_OPTIONS,
  );
}


/* ============================================================
   PENDING TOKEN
   ============================================================ */

function generatePendingVerificationToken():
  string {
  return randomBytes(
    32,
  ).toString(
    "base64url",
  );
}


function hashPendingVerificationToken(
  token:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      token,
      "utf8",
    )
    .digest(
      "hex",
    );
}


/* ============================================================
   OTP
   ============================================================ */

function generateOtp():
  string {
  const maximum =
    10 **
    OTP_LENGTH;


  return randomInt(
    0,
    maximum,
  )
    .toString()
    .padStart(
      OTP_LENGTH,
      "0",
    );
}


function hashOtp(
  pendingVerificationToken:
    string,

  otp:
    string,
): string | null {
  const pepper =
    getOtpPepper();


  if (!pepper) {
    return null;
  }


  return createHmac(
    "sha256",
    pepper,
  )
    .update(
      `${pendingVerificationToken}:${otp}`,
      "utf8",
    )
    .digest(
      "hex",
    );
}


/* ============================================================
   CONSTANT-TIME COMPARISON
   ============================================================ */

function secureHashEquals(
  firstHash:
    string,

  secondHash:
    string,
): boolean {
  try {
    const first =
      Buffer.from(
        firstHash,
        "hex",
      );


    const second =
      Buffer.from(
        secondHash,
        "hex",
      );


    if (
      first.length ===
        0 ||
      second.length ===
        0 ||
      first.length !==
        second.length
    ) {
      return false;
    }


    return timingSafeEqual(
      first,
      second,
    );
  } catch {
    return false;
  }
}


/* ============================================================
   RATE LIMIT EMAIL KEY
   ============================================================ */

function createEmailRateLimitKey(
  email:
    string,
): string {
  return createHash(
    "sha256",
  )
    .update(
      normalizeEmail(
        email,
      ),
      "utf8",
    )
    .digest(
      "hex",
    );
}


/* ============================================================
   MASK EMAIL
   ============================================================ */

function maskEmail(
  email:
    string,
): string {
  const separatorIndex =
    email.indexOf(
      "@",
    );


  if (
    separatorIndex <=
    0
  ) {
    return "Adresse e-mail";
  }


  const localPart =
    email.slice(
      0,
      separatorIndex,
    );


  const domain =
    email.slice(
      separatorIndex +
        1,
    );


  const visibleLength =
    Math.min(
      2,
      localPart.length,
    );


  const visiblePart =
    localPart.slice(
      0,
      visibleLength,
    );


  const hiddenLength =
    Math.max(
      4,
      localPart.length -
        visibleLength,
    );


  return `${visiblePart}${"*".repeat(
    hiddenLength,
  )}@${domain}`;
}


/* ============================================================
   REGISTER RESULT
   ============================================================ */

export type RegisterGestionnaireResult =
  | Readonly<{
      ok:
        true;

      pendingVerificationToken:
        string;
    }>
  | Readonly<{
      ok:
        false;

      code:
        RegistrationServiceFailureCode;

      retryAfterSeconds?:
        number | null;
    }>;


/* ============================================================
   REGISTER GESTIONNAIRE
   ============================================================ */

export async function registerGestionnaire(
  data:
    GestionnaireRegistrationData,
): Promise<RegisterGestionnaireResult> {
  const infrastructure =
    getRegistrationInfrastructure();


  if (
    !getRepresentativeCodeHash() ||
    !getOtpPepper()
  ) {
    return {
      ok: false,

      code:
        "REGISTRATION_UNAVAILABLE",
    };
  }


  try {
    const email =
      normalizeEmail(
        data.email,
      );


    const emailKey =
      createEmailRateLimitKey(
        email,
      );


    /* --------------------------------------------------------
       1. REGISTRATION RATE LIMIT
       -------------------------------------------------------- */

    const registrationRateLimit =
      await infrastructure
        .persistence
        .consumeRateLimit({
          scope:
            "registration-email",

          key:
            emailKey,

          limit:
            REGISTRATION_RATE_LIMIT_MAX,

          windowSeconds:
            REGISTRATION_RATE_LIMIT_WINDOW_SECONDS,
        });


    if (
      !registrationRateLimit
        .allowed
    ) {
      return {
        ok: false,

        code:
          "RATE_LIMITED",

        retryAfterSeconds:
          registrationRateLimit
            .retryAfterSeconds ??
          null,
      };
    }


    /* --------------------------------------------------------
       2. REPRESENTATIVE CODE RATE LIMIT
       -------------------------------------------------------- */

    const representativeRateLimit =
      await infrastructure
        .persistence
        .consumeRateLimit({
          scope:
            "representative-code",

          key:
            emailKey,

          limit:
            REPRESENTATIVE_CODE_RATE_LIMIT_MAX,

          windowSeconds:
            REPRESENTATIVE_CODE_RATE_LIMIT_WINDOW_SECONDS,
        });


    if (
      !representativeRateLimit
        .allowed
    ) {
      return {
        ok: false,

        code:
          "RATE_LIMITED",

        retryAfterSeconds:
          representativeRateLimit
            .retryAfterSeconds ??
          null,
      };
    }


    /* --------------------------------------------------------
       3. REPRESENTATIVE CODE
       -------------------------------------------------------- */

    const representativeCodeIsValid =
      await verifyRepresentativeCode(
        data
          .representativeCode,
      );


    if (
      !representativeCodeIsValid
    ) {
      return {
        ok: false,

        code:
          "INVALID_REPRESENTATIVE_CODE",
      };
    }


    /* --------------------------------------------------------
       4. PASSWORD HASH
       -------------------------------------------------------- */

    const passwordHash =
      await hashPassword(
        data.password,
      );


    /* --------------------------------------------------------
       5. PENDING TOKEN
       -------------------------------------------------------- */

    const pendingVerificationToken =
      generatePendingVerificationToken();


    const registrationTokenHash =
      hashPendingVerificationToken(
        pendingVerificationToken,
      );


    /* --------------------------------------------------------
       6. OTP
       -------------------------------------------------------- */

    const otp =
      generateOtp();


    const otpHash =
      hashOtp(
        pendingVerificationToken,
        otp,
      );


    if (!otpHash) {
      return {
        ok: false,

        code:
          "REGISTRATION_UNAVAILABLE",
      };
    }


    /* --------------------------------------------------------
       7. DATES
       -------------------------------------------------------- */

    const now =
      new Date();


    const otpExpiresAt =
      addMilliseconds(
        now,
        OTP_EXPIRATION_MS,
      );


    const registrationTokenExpiresAt =
      addMilliseconds(
        now,
        PENDING_TOKEN_EXPIRATION_MS,
      );


    const expiresAt =
      addMilliseconds(
        now,
        REGISTRATION_EXPIRATION_MS,
      );


    /* --------------------------------------------------------
       8. CREATE / RESUME TEMPORARY REGISTRATION
       -------------------------------------------------------- */

    const pendingResult =
      await infrastructure
        .persistence
        .upsertPendingRegistration({
          shopName:
            data.shopName,

          country:
            data.country,

          city:
            data.city,

          shopAddress:
            data.shopAddress,

          phone:
            data.phone,

          email,

          passwordHash,

          registrationTokenHash,

          registrationTokenExpiresAt,

          otpHash,

          otpExpiresAt,

          otpLastSentAt:
            now,

          expiresAt,
        });


    if (
      pendingResult.kind ===
      "email_used"
    ) {
      return {
        ok: false,

        code:
          "EMAIL_ALREADY_USED",
      };
    }


    /* --------------------------------------------------------
       9. SEND OTP
       -------------------------------------------------------- */

    try {
      await infrastructure
        .emailSender
        .sendVerificationCode({
          to:
            email,

          code:
            otp,

          expiresInMinutes:
            OTP_EXPIRATION_MINUTES,
        });
    } catch {
      return {
        ok: false,

        code:
          "EMAIL_DELIVERY_FAILED",
      };
    }


    /* --------------------------------------------------------
       10. SUCCESS
       -------------------------------------------------------- */

    return {
      ok: true,

      pendingVerificationToken,
    };
  } catch {
    return {
      ok: false,

      code:
        "UNKNOWN",
    };
  }
}


/* ============================================================
   VERIFY INPUT / RESULT
   ============================================================ */

export type VerifyGestionnaireEmailInput =
  Readonly<{
    pendingVerificationToken:
      string;

    code:
      string;
  }>;


export type VerifyGestionnaireEmailResult =
  | Readonly<{
      ok:
        true;

      gestionnaireId:
        string;
    }>
  | Readonly<{
      ok:
        false;

      code:
        VerificationFailureCode;

      retryAfterSeconds?:
        number | null;
    }>;


/* ============================================================
   VERIFY EMAIL CODE
   ============================================================ */

export async function verifyGestionnaireEmailCode(
  input:
    VerifyGestionnaireEmailInput,
): Promise<VerifyGestionnaireEmailResult> {
  const infrastructure =
    getRegistrationInfrastructure();


  if (
    !getOtpPepper()
  ) {
    return {
      ok: false,

      code:
        "UNKNOWN",
    };
  }


  try {
    const registrationTokenHash =
      hashPendingVerificationToken(
        input
          .pendingVerificationToken,
      );


    /* --------------------------------------------------------
       1. RATE LIMIT
       -------------------------------------------------------- */

    const rateLimit =
      await infrastructure
        .persistence
        .consumeRateLimit({
          scope:
            "verification-token",

          key:
            registrationTokenHash,

          limit:
            VERIFICATION_RATE_LIMIT_MAX,

          windowSeconds:
            VERIFICATION_RATE_LIMIT_WINDOW_SECONDS,
        });


    if (
      !rateLimit.allowed
    ) {
      return {
        ok: false,

        code:
          "RATE_LIMITED",

        retryAfterSeconds:
          rateLimit
            .retryAfterSeconds ??
          null,
      };
    }


    /* --------------------------------------------------------
       2. FIND REGISTRATION
       -------------------------------------------------------- */

    const pendingAccount =
      await infrastructure
        .persistence
        .findPendingByTokenHash(
          registrationTokenHash,
        );


    if (
      !pendingAccount ||
      pendingAccount.status !==
        RegistrationStatus
          .WAITING_EMAIL_VERIFICATION
    ) {
      return {
        ok: false,

        code:
          "ACCOUNT_NOT_PENDING",
      };
    }


    const now =
      new Date();


    /* --------------------------------------------------------
       3. REGISTRATION / TOKEN EXPIRATION
       -------------------------------------------------------- */

    if (
      pendingAccount
        .registrationTokenExpiresAt
        .getTime() <=
        now.getTime() ||
      pendingAccount
        .expiresAt
        .getTime() <=
        now.getTime()
    ) {
      return {
        ok: false,

        code:
          "ACCOUNT_NOT_PENDING",
      };
    }


    /* --------------------------------------------------------
       4. MAX OTP ATTEMPTS
       -------------------------------------------------------- */

    if (
      pendingAccount
        .otpAttemptCount >=
      OTP_MAX_ATTEMPTS
    ) {
      return {
        ok: false,

        code:
          "TOO_MANY_ATTEMPTS",
      };
    }


    /* --------------------------------------------------------
       5. OTP EXPIRATION
       -------------------------------------------------------- */

    if (
      pendingAccount
        .otpExpiresAt
        .getTime() <=
      now.getTime()
    ) {
      return {
        ok: false,

        code:
          "INVALID_OR_EXPIRED_CODE",
      };
    }


    /* --------------------------------------------------------
       6. HASH SUBMITTED OTP
       -------------------------------------------------------- */

    const submittedOtpHash =
      hashOtp(
        input
          .pendingVerificationToken,

        input.code,
      );


    if (
      !submittedOtpHash
    ) {
      return {
        ok: false,

        code:
          "UNKNOWN",
      };
    }


    /* --------------------------------------------------------
       7. SECURE COMPARISON
       -------------------------------------------------------- */

    const otpIsValid =
      secureHashEquals(
        submittedOtpHash,
        pendingAccount
          .otpHash,
      );


    if (!otpIsValid) {
      const attempts =
        await infrastructure
          .persistence
          .incrementOtpAttempts({
            registrationId:
              pendingAccount.id,

            registrationTokenHash,
          });


      if (
        attempts >=
        OTP_MAX_ATTEMPTS
      ) {
        return {
          ok: false,

          code:
            "TOO_MANY_ATTEMPTS",
        };
      }


      return {
        ok: false,

        code:
          "INVALID_OR_EXPIRED_CODE",
      };
    }


    /* --------------------------------------------------------
       8. CREATE STORE + MANAGER
       -------------------------------------------------------- */

    const activation =
      await infrastructure
        .persistence
        .activatePendingRegistration({
          registrationId:
            pendingAccount.id,

          registrationTokenHash,

          expectedOtpHash:
            pendingAccount
              .otpHash,

          emailVerifiedAt:
            now,
        });


    if (
      activation.kind !==
      "activated"
    ) {
      return {
        ok: false,

        code:
          "ACCOUNT_NOT_PENDING",
      };
    }


    /* --------------------------------------------------------
       9. SUCCESS
       -------------------------------------------------------- */

    return {
      ok: true,

      gestionnaireId:
        activation
          .gestionnaireId,
    };
  } catch {
    return {
      ok: false,

      code:
        "UNKNOWN",
    };
  }
}


/* ============================================================
   RESEND INPUT / RESULT
   ============================================================ */

export type ResendVerificationCodeInput =
  Readonly<{
    pendingVerificationToken:
      string;
  }>;


export type ResendVerificationCodeResult =
  | Readonly<{
      ok:
        true;

      cooldownSeconds:
        number;
    }>
  | Readonly<{
      ok:
        false;

      code:
        ResendVerificationFailureCode;

      retryAfterSeconds?:
        number | null;
    }>;


/* ============================================================
   RESEND VERIFICATION CODE
   ============================================================ */

export async function resendGestionnaireVerificationCode(
  input:
    ResendVerificationCodeInput,
): Promise<ResendVerificationCodeResult> {
  const infrastructure =
    getRegistrationInfrastructure();


  if (
    !getOtpPepper()
  ) {
    return {
      ok: false,

      code:
        "UNKNOWN",
    };
  }


  try {
    const registrationTokenHash =
      hashPendingVerificationToken(
        input
          .pendingVerificationToken,
      );


    /* --------------------------------------------------------
       1. RATE LIMIT
       -------------------------------------------------------- */

    const rateLimit =
      await infrastructure
        .persistence
        .consumeRateLimit({
          scope:
            "verification-resend",

          key:
            registrationTokenHash,

          limit:
            RESEND_RATE_LIMIT_MAX,

          windowSeconds:
            RESEND_RATE_LIMIT_WINDOW_SECONDS,
        });


    if (
      !rateLimit.allowed
    ) {
      return {
        ok: false,

        code:
          "RATE_LIMITED",

        retryAfterSeconds:
          rateLimit
            .retryAfterSeconds ??
          null,
      };
    }


    /* --------------------------------------------------------
       2. FIND REGISTRATION
       -------------------------------------------------------- */

    const pendingAccount =
      await infrastructure
        .persistence
        .findPendingByTokenHash(
          registrationTokenHash,
        );


    if (
      !pendingAccount ||
      pendingAccount.status !==
        RegistrationStatus
          .WAITING_EMAIL_VERIFICATION
    ) {
      return {
        ok: false,

        code:
          "ACCOUNT_NOT_PENDING",
      };
    }


    const now =
      new Date();


    /* --------------------------------------------------------
       3. REGISTRATION / TOKEN EXPIRATION
       -------------------------------------------------------- */

    if (
      pendingAccount
        .registrationTokenExpiresAt
        .getTime() <=
        now.getTime() ||
      pendingAccount
        .expiresAt
        .getTime() <=
        now.getTime()
    ) {
      return {
        ok: false,

        code:
          "ACCOUNT_NOT_PENDING",
      };
    }


    /* --------------------------------------------------------
       4. COOLDOWN
       -------------------------------------------------------- */

    if (
      pendingAccount
        .otpLastSentAt
    ) {
      const nextAllowedAt =
        pendingAccount
          .otpLastSentAt
          .getTime() +
        OTP_RESEND_COOLDOWN_MS;


      if (
        now.getTime() <
        nextAllowedAt
      ) {
        return {
          ok: false,

          code:
            "RATE_LIMITED",

          retryAfterSeconds:
            Math.max(
              1,
              Math.ceil(
                (
                  nextAllowedAt -
                  now.getTime()
                ) /
                  1000,
              ),
            ),
        };
      }
    }


    /* --------------------------------------------------------
       5. NEW OTP
       -------------------------------------------------------- */

    const otp =
      generateOtp();


    const otpHash =
      hashOtp(
        input
          .pendingVerificationToken,
        otp,
      );


    if (!otpHash) {
      return {
        ok: false,

        code:
          "UNKNOWN",
      };
    }


    const otpExpiresAt =
      addMilliseconds(
        now,
        OTP_EXPIRATION_MS,
      );


    /* --------------------------------------------------------
       6. INVALIDATE OLD OTP + STORE NEW OTP
       -------------------------------------------------------- */

    const rotated =
      await infrastructure
        .persistence
        .rotatePendingOtp({
          registrationId:
            pendingAccount.id,

          registrationTokenHash,

          otpHash,

          otpExpiresAt,

          otpLastSentAt:
            now,
        });


    if (!rotated) {
      return {
        ok: false,

        code:
          "ACCOUNT_NOT_PENDING",
      };
    }


    /* --------------------------------------------------------
       7. SEND NEW OTP
       -------------------------------------------------------- */

    try {
      await infrastructure
        .emailSender
        .sendVerificationCode({
          to:
            pendingAccount
              .email,

          code:
            otp,

          expiresInMinutes:
            OTP_EXPIRATION_MINUTES,
        });
    } catch {
      return {
        ok: false,

        code:
          "EMAIL_DELIVERY_FAILED",
      };
    }


    /* --------------------------------------------------------
       8. SUCCESS
       -------------------------------------------------------- */

    return {
      ok: true,

      cooldownSeconds:
        OTP_RESEND_COOLDOWN_SECONDS,
    };
  } catch {
    return {
      ok: false,

      code:
        "UNKNOWN",
    };
  }
}


/* ============================================================
   PENDING DISPLAY
   ============================================================ */

export type PendingVerificationDisplay =
  Readonly<{
    maskedEmail:
      string;
  }>;


/* ============================================================
   GET PENDING VERIFICATION DISPLAY
   ============================================================ */

export async function getPendingVerificationDisplay(
  pendingVerificationToken:
    string,
): Promise<PendingVerificationDisplay | null> {
  if (
    !pendingVerificationToken
  ) {
    return null;
  }


  try {
    const registrationTokenHash =
      hashPendingVerificationToken(
        pendingVerificationToken,
      );


    const pendingAccount =
      await registrationPersistence
        .findPendingByTokenHash(
          registrationTokenHash,
        );


    if (
      !pendingAccount ||
      pendingAccount.status !==
        RegistrationStatus
          .WAITING_EMAIL_VERIFICATION
    ) {
      return null;
    }


    const now =
      Date.now();


    if (
      pendingAccount
        .registrationTokenExpiresAt
        .getTime() <=
        now ||
      pendingAccount
        .expiresAt
        .getTime() <=
        now
    ) {
      return null;
    }


    return {
      maskedEmail:
        maskEmail(
          pendingAccount.email,
        ),
    };
  } catch {
    return null;
  }
}