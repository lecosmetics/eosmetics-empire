import "server-only";

import {
  createHash,
} from "node:crypto";

import * as argon2 from "argon2";

import {
  AuditAction,
  ManagerStatus,
  RegistrationStatus,
  SecurityRateLimitScope,
  StoreStatus,
} from "@prisma/client";

import {
  z,
} from "zod";

import {
  db,
} from "@/prisma/db";


/* ============================================================
   L&E COSMETICS EMPIRE
   LOGIN SERVICE — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/server/gestionnaire/auth/login.ts

   RESPONSABILITÉS :

   - valider les données reçues côté serveur ;
   - normaliser l'adresse e-mail ;
   - vérifier le rate limiting de connexion ;
   - rechercher le Gestionnaire en base ;
   - vérifier le mot de passe Argon2id ;
   - éviter autant que possible l'énumération de comptes ;
   - vérifier la validation e-mail ;
   - vérifier ManagerStatus ;
   - vérifier StoreStatus ;
   - mettre à jour lastLoginAt ;
   - écrire les événements importants dans AuditLog ;
   - retourner uniquement les données nécessaires à actions.ts.

   IMPORTANT :

   Ce fichier NE crée PAS le cookie de session.

   La création de la session HttpOnly de 24 heures appartient à :

   src/server/gestionnaire/session.ts

   et sera appelée depuis :

   src/app/gestionnaire/(auth)/connexion/actions.ts

   Le mot de passe :
   - n'est jamais loggé ;
   - n'est jamais retourné ;
   - n'est jamais stocké en clair ;
   - n'est jamais placé dans une URL.
   ============================================================ */


/* ============================================================
   LOGIN SECURITY CONFIGURATION
   ------------------------------------------------------------
   Protection simple et adaptée au projet :

   E-mail :
   5 échecs / 15 minutes.

   IP :
   20 échecs / 15 minutes.

   Le compteur est supprimé après une authentification correcte.
   ============================================================ */

const LOGIN_EMAIL_MAX_FAILURES =
  5;


const LOGIN_IP_MAX_FAILURES =
  20;


const LOGIN_WINDOW_SECONDS =
  15 *
  60;


const LOGIN_WINDOW_MS =
  LOGIN_WINDOW_SECONDS *
  1000;


const MAX_EMAIL_LENGTH =
  254;


const MAX_PASSWORD_LENGTH =
  256;


const MAX_IP_ADDRESS_LENGTH =
  128;


const MAX_USER_AGENT_LENGTH =
  1_000;


/* ============================================================
   ARGON2
   ------------------------------------------------------------
   Même famille de paramètres que l'inscription Gestionnaire.

   Ces paramètres servent également lorsqu'un compte n'existe
   pas afin d'effectuer une opération coûteuse comparable à une
   vérification de mot de passe normale.

   Cela réduit les différences de temps évidentes entre :

   - e-mail existant ;
   - e-mail inconnu.
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
   SERVER INPUT VALIDATION
   ============================================================ */

const loginInputSchema =
  z.object({
    email:
      z
        .string()
        .trim()
        .min(
          1,
        )
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

    password:
      z
        .string()
        .min(
          1,
        )
        .max(
          MAX_PASSWORD_LENGTH,
        ),
  });


/* ============================================================
   PUBLIC TYPES
   ============================================================ */

export type LoginGestionnaireInput =
  Readonly<{
    email:
      string;

    password:
      string;
  }>;


export type LoginGestionnaireRequestContext =
  Readonly<{
    /*
     * Ces valeurs doivent être déterminées côté serveur
     * dans actions.ts.
     *
     * Elles ne doivent jamais provenir d'un champ du formulaire.
     */
    ipAddress?:
      string |
      null;

    userAgent?:
      string |
      null;
  }>;


/* ============================================================
   FAILURE CODES
   ============================================================ */

export type LoginGestionnaireFailureCode =
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "EMAIL_VERIFICATION_REQUIRED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_DISABLED"
  | "RATE_LIMITED"
  | "UNKNOWN";


/* ============================================================
   RESULT
   ============================================================ */

export type LoginGestionnaireResult =
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
        LoginGestionnaireFailureCode;

      retryAfterSeconds?:
        number |
        null;
    }>;


/* ============================================================
   INTERNAL RATE LIMIT TYPES
   ============================================================ */

type LoginRateLimitEntry =
  Readonly<{
    keyHash:
      string;

    limit:
      number;
  }>;


type LoginRateLimitCheck =
  Readonly<{
    blocked:
      boolean;

    retryAfterSeconds:
      number |
      null;
  }>;


/* ============================================================
   MANAGER RECORD
   ============================================================ */

type LoginManagerRecord =
  Readonly<{
    id:
      string;

    storeId:
      string;

    email:
      string;

    passwordHash:
      string;

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
   PENDING REGISTRATION RECORD
   ------------------------------------------------------------
   Une inscription non terminée possède déjà le hash du mot de
   passe mais n'a pas encore créé le Manager définitif.
   ============================================================ */

type LoginPendingRegistrationRecord =
  Readonly<{
    passwordHash:
      string;

    status:
      RegistrationStatus;

    expiresAt:
      Date;
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

  now:
    Date = new Date(),
): number {
  return Math.max(
    1,
    Math.ceil(
      (
        futureDate.getTime() -
        now.getTime()
      ) /
        1000,
    ),
  );
}


/* ============================================================
   NORMALIZE EMAIL
   ============================================================ */

function normalizeEmail(
  email:
    string,
): string {
  return email
    .trim()
    .toLowerCase();
}


/* ============================================================
   NORMALIZE IP
   ------------------------------------------------------------
   L'adresse IP sera fournie par actions.ts après lecture des
   informations HTTP côté serveur.

   Elle n'est jamais lue depuis le formulaire.
   ============================================================ */

function normalizeIpAddress(
  ipAddress:
    string |
    null |
    undefined,
): string | null {
  if (
    !ipAddress
  ) {
    return null;
  }


  const normalized =
    ipAddress
      .trim()
      .slice(
        0,
        MAX_IP_ADDRESS_LENGTH,
      );


  if (
    !normalized ||
    normalized ===
      "unknown"
  ) {
    return null;
  }


  return normalized;
}


/* ============================================================
   NORMALIZE USER AGENT
   ============================================================ */

function normalizeUserAgent(
  userAgent:
    string |
    null |
    undefined,
): string | null {
  if (
    !userAgent
  ) {
    return null;
  }


  const normalized =
    userAgent
      .trim()
      .slice(
        0,
        MAX_USER_AGENT_LENGTH,
      );


  return normalized ||
    null;
}


/* ============================================================
   RATE LIMIT HASH
   ------------------------------------------------------------
   PostgreSQL ne reçoit jamais directement l'e-mail ou l'IP
   dans SecurityRateLimit.keyHash.
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
   BUILD RATE LIMIT ENTRIES
   ============================================================ */

function createLoginRateLimitEntries(
  email:
    string,

  ipAddress:
    string |
    null,
): readonly LoginRateLimitEntry[] {
  const entries:
    LoginRateLimitEntry[] = [
    {
      keyHash:
        hashRateLimitKey(
          `login:email:${email}`,
        ),

      limit:
        LOGIN_EMAIL_MAX_FAILURES,
    },
  ];


  if (
    ipAddress
  ) {
    entries.push({
      keyHash:
        hashRateLimitKey(
          `login:ip:${ipAddress}`,
        ),

      limit:
        LOGIN_IP_MAX_FAILURES,
    });
  }


  return entries;
}


/* ============================================================
   CHECK ONE RATE LIMIT
   ============================================================ */

async function checkRateLimitEntry(
  entry:
    LoginRateLimitEntry,

  now:
    Date,
): Promise<LoginRateLimitCheck> {
  const record =
    await db
      .securityRateLimit
      .findUnique({
        where: {
          scope_keyHash: {
            scope:
              SecurityRateLimitScope
                .LOGIN,

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
      });


  if (
    !record
  ) {
    return {
      blocked:
        false,

      retryAfterSeconds:
        null,
    };
  }


  /* ----------------------------------------------------------
     EXPLICIT BLOCK
     ---------------------------------------------------------- */

  if (
    record.blockedUntil &&
    record
      .blockedUntil
      .getTime() >
      now.getTime()
  ) {
    return {
      blocked:
        true,

      retryAfterSeconds:
        secondsUntil(
          record.blockedUntil,
          now,
        ),
    };
  }


  /* ----------------------------------------------------------
     WINDOW EXPIRED
     ---------------------------------------------------------- */

  if (
    record
      .expiresAt
      .getTime() <=
      now.getTime()
  ) {
    return {
      blocked:
        false,

      retryAfterSeconds:
        null,
    };
  }


  /* ----------------------------------------------------------
     LIMIT REACHED
     ----------------------------------------------------------
     On vérifie aussi attemptCount afin de rester protégé même
     si blockedUntil n'avait pas pu être enregistré lors d'une
     requête précédente.
     ---------------------------------------------------------- */

  if (
    record.attemptCount >=
    entry.limit
  ) {
    return {
      blocked:
        true,

      retryAfterSeconds:
        secondsUntil(
          record.expiresAt,
          now,
        ),
    };
  }


  return {
    blocked:
      false,

    retryAfterSeconds:
      null,
  };
}


/* ============================================================
   CHECK ALL LOGIN RATE LIMITS
   ============================================================ */

async function checkLoginRateLimits(
  entries:
    readonly LoginRateLimitEntry[],
): Promise<LoginRateLimitCheck> {
  const now =
    new Date();


  const checks =
    await Promise.all(
      entries.map(
        (
          entry,
        ) =>
          checkRateLimitEntry(
            entry,
            now,
          ),
      ),
    );


  const blockedChecks =
    checks.filter(
      (
        check,
      ) =>
        check.blocked,
    );


  if (
    blockedChecks.length ===
    0
  ) {
    return {
      blocked:
        false,

      retryAfterSeconds:
        null,
    };
  }


  const retryAfterSeconds =
    Math.max(
      ...blockedChecks.map(
        (
          check,
        ) =>
          check
            .retryAfterSeconds ??
          1,
      ),
    );


  return {
    blocked:
      true,

    retryAfterSeconds,
  };
}


/* ============================================================
   RECORD ONE LOGIN FAILURE
   ------------------------------------------------------------
   Une transaction interactive n'est pas nécessaire ici.

   Les opérations restent courtes et simples.
   ============================================================ */

async function recordLoginFailure(
  entry:
    LoginRateLimitEntry,
): Promise<void> {
  const now =
    new Date();


  const existing =
    await db
      .securityRateLimit
      .findUnique({
        where: {
          scope_keyHash: {
            scope:
              SecurityRateLimitScope
                .LOGIN,

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

          blockedUntil:
            true,
        },
      });


  /* ----------------------------------------------------------
     FIRST FAILURE
     ---------------------------------------------------------- */

  if (
    !existing
  ) {
    const expiresAt =
      addMilliseconds(
        now,
        LOGIN_WINDOW_MS,
      );


    /*
     * upsert protège également le cas où deux requêtes créent
     * exactement la même clé presque simultanément.
     */

    await db
      .securityRateLimit
      .upsert({
        where: {
          scope_keyHash: {
            scope:
              SecurityRateLimitScope
                .LOGIN,

            keyHash:
              entry.keyHash,
          },
        },

        create: {
          scope:
            SecurityRateLimitScope
              .LOGIN,

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
          attemptCount: {
            increment:
              1,
          },
        },
      });


    return;
  }


  /* ----------------------------------------------------------
     EXPIRED WINDOW → NEW WINDOW
     ---------------------------------------------------------- */

  if (
    existing
      .expiresAt
      .getTime() <=
    now.getTime()
  ) {
    const expiresAt =
      addMilliseconds(
        now,
        LOGIN_WINDOW_MS,
      );


    await db
      .securityRateLimit
      .update({
        where: {
          id:
            existing.id,
        },

        data: {
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


  /* ----------------------------------------------------------
     ACTIVE WINDOW
     ---------------------------------------------------------- */

  const nextAttemptCount =
    existing.attemptCount +
    1;


  const shouldBlock =
    nextAttemptCount >=
    entry.limit;


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
          shouldBlock
            ? existing.expiresAt
            : existing.blockedUntil,
      },
    });
}


/* ============================================================
   RECORD LOGIN FAILURES
   ============================================================ */

async function recordLoginFailures(
  entries:
    readonly LoginRateLimitEntry[],
): Promise<void> {
  await Promise.all(
    entries.map(
      (
        entry,
      ) =>
        recordLoginFailure(
          entry,
        ),
    ),
  );
}


/* ============================================================
   CLEAR LOGIN FAILURES
   ------------------------------------------------------------
   Une authentification correcte remet les compteurs associés
   à zéro.

   Cela évite qu'un ancien échec bloque ultérieurement un
   Gestionnaire légitime.
   ============================================================ */

async function clearLoginFailures(
  entries:
    readonly LoginRateLimitEntry[],
): Promise<void> {
  if (
    entries.length ===
    0
  ) {
    return;
  }


  try {
    await db
      .securityRateLimit
      .deleteMany({
        where: {
          scope:
            SecurityRateLimitScope
              .LOGIN,

          keyHash: {
            in:
              entries.map(
                (
                  entry,
                ) =>
                  entry.keyHash,
              ),
          },
        },
      });
  } catch {
    /*
     * L'effacement du rate limit après une authentification
     * correcte ne doit pas exposer de données ni provoquer de
     * journal contenant des informations sensibles.
     *
     * La session reste indépendante de cette opération.
     */
  }
}


/* ============================================================
   VERIFY PASSWORD
   ============================================================ */

async function verifyPassword(
  passwordHash:
    string,

  candidatePassword:
    string,
): Promise<boolean> {
  try {
    return await argon2.verify(
      passwordHash,
      candidatePassword,
    );
  } catch {
    return false;
  }
}


/* ============================================================
   UNKNOWN ACCOUNT TIMING WORK
   ------------------------------------------------------------
   Lorsqu'aucun hash n'existe, on réalise tout de même une
   opération Argon2id.

   Le hash obtenu est immédiatement jeté.

   Aucun mot de passe n'est enregistré.
   ============================================================ */

async function consumeUnknownAccountPasswordCost(
  candidatePassword:
    string,
): Promise<void> {
  try {
    await argon2.hash(
      candidatePassword,
      ARGON2_OPTIONS,
    );
  } catch {
    /*
     * Même en cas d'erreur Argon2, aucune information sensible
     * ne doit être exposée.
     */
  }
}


/* ============================================================
   SAFE AUDIT LOG
   ------------------------------------------------------------
   Un problème du journal d'audit ne doit jamais exposer :
   - le mot de passe ;
   - le hash du mot de passe ;
   - l'e-mail saisi ;
   - un token ;
   - un cookie.

   L'e-mail n'est volontairement PAS écrit dans metadata.
   ============================================================ */

async function writeAuditLog(
  input:
    Readonly<{
      action:
        AuditAction;

      managerId?:
        string |
        null;

      storeId?:
        string |
        null;

      reason?:
        string |
        null;

      ipAddress:
        string |
        null;

      userAgent:
        string |
        null;
    }>,
): Promise<void> {
  try {
    await db
      .auditLog
      .create({
        data: {
          managerId:
            input.managerId ??
            null,

          storeId:
            input.storeId ??
            null,

          action:
            input.action,

          entityType:
            "Manager",

          entityId:
            input.managerId ??
            null,

          metadata:
            input.reason
              ? {
                  reason:
                    input.reason,
                }
              : undefined,

          ipAddress:
            input.ipAddress,

          userAgent:
            input.userAgent,
        },
      });
  } catch {
    /*
     * Le logging ne doit pas faire fuiter d'informations
     * sensibles ni casser l'interface de connexion.
     */
  }
}


/* ============================================================
   INVALID CREDENTIALS
   ------------------------------------------------------------
   Centralise :

   - rate limiting ;
   - AuditLog LOGIN_FAILED ;
   - résultat générique.

   Le client recevra toujours le même type d'erreur pour :
   - e-mail inconnu ;
   - mauvais mot de passe.
   ============================================================ */

async function invalidCredentialsResult(
  input:
    Readonly<{
      rateLimitEntries:
        readonly LoginRateLimitEntry[];

      manager:
        LoginManagerRecord |
        null;

      ipAddress:
        string |
        null;

      userAgent:
        string |
        null;
    }>,
): Promise<LoginGestionnaireResult> {
  /*
   * Si l'enregistrement du rate limit échoue, l'authentification
   * reste refusée.
   *
   * On ne transforme jamais une erreur de sécurité en connexion
   * réussie.
   */

  try {
    await recordLoginFailures(
      input.rateLimitEntries,
    );
  } catch {
    return {
      ok:
        false,

      code:
        "UNKNOWN",
    };
  }


  await writeAuditLog({
    action:
      AuditAction.LOGIN_FAILED,

    managerId:
      input.manager?.id ??
      null,

    storeId:
      input.manager?.storeId ??
      null,

    reason:
      "INVALID_CREDENTIALS",

    ipAddress:
      input.ipAddress,

    userAgent:
      input.userAgent,
  });


  return {
    ok:
      false,

    code:
      "INVALID_CREDENTIALS",
  };
}


/* ============================================================
   LOGIN GESTIONNAIRE
   ============================================================ */

export async function loginGestionnaire(
  input:
    LoginGestionnaireInput,

  requestContext:
    LoginGestionnaireRequestContext = {},
): Promise<LoginGestionnaireResult> {
  /* ==========================================================
     1. SERVER VALIDATION
     ========================================================== */

  const parsed =
    loginInputSchema.safeParse(
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
    normalizeEmail(
      parsed.data.email,
    );


  const password =
    parsed.data.password;


  const ipAddress =
    normalizeIpAddress(
      requestContext
        .ipAddress,
    );


  const userAgent =
    normalizeUserAgent(
      requestContext
        .userAgent,
    );


  const rateLimitEntries =
    createLoginRateLimitEntries(
      email,
      ipAddress,
    );


  try {
    /* ========================================================
       2. RATE LIMIT CHECK
       ======================================================== */

    const rateLimit =
      await checkLoginRateLimits(
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


    /* ========================================================
       3. FIND ACCOUNT
       --------------------------------------------------------
       Manager = compte final validé.

       ManagerRegistration = inscription temporaire pouvant
       encore nécessiter la vérification e-mail.

       On n'accepte jamais de managerId venant du navigateur.
       ======================================================== */

    const [
      manager,
      pendingRegistration,
    ] =
      await Promise.all([
        db
          .manager
          .findUnique({
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
          }),

        db
          .managerRegistration
          .findUnique({
            where: {
              email,
            },

            select: {
              passwordHash:
                true,

              status:
                true,

              expiresAt:
                true,
            },
          }),
      ]);


    const managerRecord:
      LoginManagerRecord |
      null =
        manager;


    const registrationRecord:
      LoginPendingRegistrationRecord |
      null =
        pendingRegistration;


    /* ========================================================
       4. PASSWORD HASH SOURCE
       --------------------------------------------------------
       Priorité au Manager final.

       Si le Manager n'existe pas encore mais qu'une inscription
       temporaire existe, son hash permet de vérifier que la
       personne connaît réellement son mot de passe avant de lui
       indiquer qu'une vérification e-mail reste nécessaire.
       ======================================================== */

    const passwordHash =
      managerRecord
        ?.passwordHash ??
      registrationRecord
        ?.passwordHash ??
      null;


    /* ========================================================
       5. UNKNOWN ACCOUNT
       ======================================================== */

    if (
      !passwordHash
    ) {
      await consumeUnknownAccountPasswordCost(
        password,
      );


      return await invalidCredentialsResult({
        rateLimitEntries,

        manager:
          null,

        ipAddress,

        userAgent,
      });
    }


    /* ========================================================
       6. PASSWORD VERIFICATION
       ======================================================== */

    const passwordIsValid =
      await verifyPassword(
        passwordHash,
        password,
      );


    if (
      !passwordIsValid
    ) {
      return await invalidCredentialsResult({
        rateLimitEntries,

        manager:
          managerRecord,

        ipAddress,

        userAgent,
      });
    }


    /* ========================================================
       7. PASSWORD CORRECT
       --------------------------------------------------------
       Une fois le vrai mot de passe vérifié, les anciennes
       erreurs de connexion peuvent être supprimées.
       ======================================================== */

    await clearLoginFailures(
      rateLimitEntries,
    );


    /* ========================================================
       8. REGISTRATION NOT COMPLETED
       --------------------------------------------------------
       Aucun Manager final n'existe encore.

       On ne crée aucune seconde logique OTP ici.

       actions.ts pourra :
       - rediriger vers /gestionnaire/verification lorsque le
         cookie de vérification existant est disponible ;
       - ou afficher un message simple demandant de terminer
         l'inscription.
       ======================================================== */

    if (
      !managerRecord
    ) {
      const now =
        new Date();


      const registrationCanBeResumed =
        registrationRecord !==
          null &&
        registrationRecord
          .expiresAt
          .getTime() >
          now.getTime() &&
        registrationRecord.status !==
          RegistrationStatus
            .COMPLETED &&
        registrationRecord.status !==
          RegistrationStatus
            .EXPIRED &&
        registrationRecord.status !==
          RegistrationStatus
            .CANCELLED;


      if (
        registrationCanBeResumed
      ) {
        return {
          ok:
            false,

          code:
            "EMAIL_VERIFICATION_REQUIRED",
        };
      }


      /*
       * Le mot de passe correspond à une ancienne inscription
       * non utilisable, mais aucun compte final n'existe.
       *
       * On reste volontairement générique.
       */

      return {
        ok:
          false,

        code:
          "INVALID_CREDENTIALS",
      };
    }


    /* ========================================================
       9. EMAIL VERIFICATION
       ======================================================== */

    if (
      !managerRecord
        .emailVerifiedAt
    ) {
      await writeAuditLog({
        action:
          AuditAction.LOGIN_FAILED,

        managerId:
          managerRecord.id,

        storeId:
          managerRecord.storeId,

        reason:
          "EMAIL_VERIFICATION_REQUIRED",

        ipAddress,

        userAgent,
      });


      return {
        ok:
          false,

        code:
          "EMAIL_VERIFICATION_REQUIRED",
      };
    }


    /* ========================================================
       10. MANAGER SUSPENDED
       ======================================================== */

    if (
      managerRecord.status ===
      ManagerStatus.SUSPENDED
    ) {
      await writeAuditLog({
        action:
          AuditAction.LOGIN_FAILED,

        managerId:
          managerRecord.id,

        storeId:
          managerRecord.storeId,

        reason:
          "ACCOUNT_SUSPENDED",

        ipAddress,

        userAgent,
      });


      return {
        ok:
          false,

        code:
          "ACCOUNT_SUSPENDED",
      };
    }


    /* ========================================================
       11. MANAGER DISABLED
       ======================================================== */

    if (
      managerRecord.status ===
      ManagerStatus.DISABLED
    ) {
      await writeAuditLog({
        action:
          AuditAction.LOGIN_FAILED,

        managerId:
          managerRecord.id,

        storeId:
          managerRecord.storeId,

        reason:
          "ACCOUNT_DISABLED",

        ipAddress,

        userAgent,
      });


      return {
        ok:
          false,

        code:
          "ACCOUNT_DISABLED",
      };
    }


    /* ========================================================
       12. STORE SUSPENDED
       --------------------------------------------------------
       Même si le Manager est ACTIVE, une boutique suspendue
       ne doit pas ouvrir l'espace privé.
       ======================================================== */

    if (
      managerRecord
        .store
        .status ===
      StoreStatus.SUSPENDED
    ) {
      await writeAuditLog({
        action:
          AuditAction.LOGIN_FAILED,

        managerId:
          managerRecord.id,

        storeId:
          managerRecord.storeId,

        reason:
          "STORE_SUSPENDED",

        ipAddress,

        userAgent,
      });


      return {
        ok:
          false,

        code:
          "ACCOUNT_SUSPENDED",
      };
    }


    /* ========================================================
       13. STORE DISABLED
       ======================================================== */

    if (
      managerRecord
        .store
        .status ===
      StoreStatus.DISABLED
    ) {
      await writeAuditLog({
        action:
          AuditAction.LOGIN_FAILED,

        managerId:
          managerRecord.id,

        storeId:
          managerRecord.storeId,

        reason:
          "STORE_DISABLED",

        ipAddress,

        userAgent,
      });


      return {
        ok:
          false,

        code:
          "ACCOUNT_DISABLED",
      };
    }


    /* ========================================================
       14. FINAL ACTIVE CHECK
       --------------------------------------------------------
       Fail closed si un nouveau statut était ajouté plus tard.
       ======================================================== */

    if (
      managerRecord.status !==
        ManagerStatus.ACTIVE ||
      managerRecord
        .store
        .status !==
        StoreStatus.ACTIVE
    ) {
      return {
        ok:
          false,

        code:
          "ACCOUNT_DISABLED",
      };
    }


    /* ========================================================
       15. LAST LOGIN
       --------------------------------------------------------
       À ce stade :
       - e-mail correct ;
       - mot de passe correct ;
       - e-mail vérifié ;
       - Manager ACTIVE ;
       - Store ACTIVE.
       ======================================================== */

    const loginDate =
      new Date();


    await db
      .manager
      .update({
        where: {
          id:
            managerRecord.id,
        },

        data: {
          lastLoginAt:
            loginDate,
        },
      });


    /* ========================================================
       16. SUCCESS AUDIT
       ======================================================== */

    await writeAuditLog({
      action:
        AuditAction.LOGIN,

      managerId:
        managerRecord.id,

      storeId:
        managerRecord.storeId,

      reason:
        null,

      ipAddress,

      userAgent,
    });


    /* ========================================================
       17. SUCCESS
       --------------------------------------------------------
       On retourne uniquement l'identifiant interne nécessaire
       à actions.ts pour créer la session Gestionnaire.

       Le storeId n'est pas retourné au formulaire.
       Le mot de passe n'est jamais retourné.
       ======================================================== */

    return {
      ok:
        true,

      gestionnaireId:
        managerRecord.id,
    };
  } catch {
    /* ========================================================
       FAIL CLOSED
       --------------------------------------------------------
       Une erreur DB / Argon2 / infrastructure ne doit jamais
       transformer une connexion incertaine en connexion valide.
       ======================================================== */

    return {
      ok:
        false,

      code:
        "UNKNOWN",
    };
  }
}