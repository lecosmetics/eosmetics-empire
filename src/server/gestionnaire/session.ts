import "server-only";

import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import {
  cookies,
} from "next/headers";

import {
  ManagerStatus,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  getPendingVerificationDisplay,
} from "@/server/gestionnaire/registration-service";


/* ============================================================
   L&E COSMETICS EMPIRE
   SESSION SERVICE — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/server/gestionnaire/session.ts

   Stack :
   - Next.js
   - Prisma ORM 7.10.0
   - PostgreSQL / Supabase
   - Cookies HttpOnly
   - HMAC-SHA256

   RESPONSABILITÉS :

   1. gérer la session temporaire de vérification e-mail ;
   2. stocker le pendingVerificationToken dans un cookie
      HttpOnly ;
   3. identifier une inscription en attente ;
   4. supprimer la session temporaire après validation ;
   5. créer la session authentifiée Gestionnaire ;
   6. signer cryptographiquement la session ;
   7. vérifier la signature ;
   8. vérifier issuedAt / expiresAt ;
   9. imposer une durée maximale ABSOLUE de 24 heures ;
   10. empêcher toute prolongation automatique ;
   11. vérifier que le Gestionnaire existe toujours ;
   12. vérifier que son e-mail est toujours validé ;
   13. vérifier Manager.status === ACTIVE ;
   14. vérifier Store.status === ACTIVE ;
   15. vérifier la version actuelle du mot de passe ;
   16. invalider les anciennes sessions après changement
       ou réinitialisation du mot de passe ;
   17. supprimer les cookies lors de la déconnexion ;
   18. rendre la session authentifiée disponible aussi bien
       dans /gestionnaire/* que dans /api/gestionnaire/*.

   RÈGLE DE SESSION :

   Connexion :
   20 septembre 2026 à 10:00

   Expiration :
   21 septembre 2026 à 10:00 maximum.

   Une activité à 21:00 NE repousse PAS l'expiration.

   INVALIDATION MOT DE PASSE :

   Une session conserve la valeur de passwordChangedAt qui
   existait au moment de sa création.

   Si le mot de passe change :

   ancien passwordChangedAt !== nouveau passwordChangedAt

   La session est alors immédiatement refusée lors de la
   prochaine requête serveur.

   COOKIE PATHS :

   - vérification temporaire :
     /gestionnaire

   - session authentifiée :
     /

   Le cookie authentifié doit utiliser "/" afin d'être envoyé
   aussi bien vers :

   /gestionnaire/*
   /api/gestionnaire/*

   IMPORTANT :

   Aucun cookie d'authentification n'est accessible via
   document.cookie.

   Aucun mot de passe, OTP, code représentant ou secret
   d'infrastructure n'est placé dans les cookies.

   La session Gestionnaire est volontairement NON GLISSANTE.
   ============================================================ */


/* ============================================================
   COOKIE NAMES
   ============================================================ */

const PENDING_VERIFICATION_COOKIE_NAME =
  "ce_gestionnaire_pending";


const GESTIONNAIRE_SESSION_COOKIE_NAME =
  "ce_gestionnaire_session";


/* ============================================================
   COOKIE PATHS
   ------------------------------------------------------------
   Le cookie temporaire de vérification reste volontairement
   limité à l'espace Gestionnaire.

   La vraie session authentifiée utilise "/" afin d'être
   disponible également pour les Route Handlers :

   /api/gestionnaire/*
   ============================================================ */

const PENDING_VERIFICATION_COOKIE_PATH =
  "/gestionnaire";


const GESTIONNAIRE_SESSION_COOKIE_PATH =
  "/";


/*
 * Ancien chemin utilisé par la session Gestionnaire.
 *
 * Il est conservé uniquement pour pouvoir supprimer les
 * anciens cookies déjà présents dans les navigateurs après
 * la migration vers path="/".
 */

const LEGACY_GESTIONNAIRE_SESSION_COOKIE_PATH =
  "/gestionnaire";


/* ============================================================
   COOKIE EXPIRATIONS
   ============================================================ */

const PENDING_VERIFICATION_MAX_AGE_SECONDS =
  30 * 60;


/*
 * ==========================================================
 * SESSION GESTIONNAIRE — DURÉE ABSOLUE
 * ==========================================================
 *
 * 24 heures exactement au maximum.
 *
 * Cette même durée protège :
 *
 * - le payload signé ;
 * - le cookie ;
 * - la validation serveur.
 *
 * Aucune lecture de session ne réécrit le cookie.
 * ==========================================================
 */

const GESTIONNAIRE_SESSION_MAX_AGE_SECONDS =
  24 * 60 * 60;


/* ============================================================
   CLOCK SKEW
   ============================================================ */

const SESSION_CLOCK_SKEW_SECONDS =
  60;


/* ============================================================
   TOKEN LIMITS
   ============================================================ */

const MAX_SESSION_TOKEN_LENGTH =
  4_096;


const MAX_PENDING_VERIFICATION_TOKEN_LENGTH =
  4_096;


/* ============================================================
   SESSION VERSION
   ------------------------------------------------------------
   VERSION 3 :

   - session absolue de 24 heures ;
   - Manager ACTIVE ;
   - Store ACTIVE ;
   - e-mail vérifié ;
   - passwordChangedAt signé ;
   - invalidation automatique après changement du mot de passe.

   Les anciennes sessions version 1 et 2 sont volontairement
   rejetées.
   ============================================================ */

const SESSION_VERSION =
  3;


/* ============================================================
   SESSION KIND
   ============================================================ */

const SESSION_KIND =
  "gestionnaire-session";


/* ============================================================
   SIGNED SESSION PAYLOAD
   ------------------------------------------------------------
   passwordChangedAt :

   timestamp en millisecondes du dernier changement de mot de
   passe au moment de la connexion.

   Ce n'est pas un secret.

   Sa présence dans le payload SIGNÉ permet de comparer
   précisément la session à l'état actuel de Manager.
   ============================================================ */

type GestionnaireSessionPayload =
  Readonly<{
    version:
      number;

    kind:
      typeof SESSION_KIND;

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
   PUBLIC SESSION TYPE
   ============================================================ */

export type GestionnaireSession =
  Readonly<{
    gestionnaireId:
      string;

    issuedAt:
      Date;

    expiresAt:
      Date;
  }>;


/* ============================================================
   INTERNAL PARSED SESSION
   ============================================================ */

type ParsedGestionnaireSession =
  Readonly<{
    session:
      GestionnaireSession;

    passwordChangedAt:
      number |
      null;
  }>;


/* ============================================================
   PENDING VERIFICATION SESSION
   ============================================================ */

export type PendingVerificationSession =
  Readonly<{
    maskedEmail:
      string;
  }>;


/* ============================================================
   ACTIVE GESTIONNAIRE RECORD
   ============================================================ */

type ActiveGestionnaireRecord =
  Readonly<{
    id:
      string;

    status:
      ManagerStatus;

    emailVerifiedAt:
      Date |
      null;

    passwordChangedAt:
      Date |
      null;

    store:
      Readonly<{
        status:
          StoreStatus;
      }>;
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
   SESSION SECRET
   ------------------------------------------------------------
   Variable attendue :

   SESSION_SECRET=<secret serveur long et aléatoire>

   INTERDIT :

   NEXT_PUBLIC_SESSION_SECRET
   ============================================================ */

function getSessionSecret():
  string {
  const secret =
    process.env
      .SESSION_SECRET
      ?.trim();


  if (
    !secret ||
    secret.length <
      32
  ) {
    throw new Error(
      "SESSION_SECRET est absent ou trop court.",
    );
  }


  return secret;
}


/* ============================================================
   UNIX TIME
   ============================================================ */

function getCurrentUnixTime():
  number {
  return Math.floor(
    Date.now() /
      1000,
  );
}


/* ============================================================
   PASSWORD VERSION
   ------------------------------------------------------------
   Utilise les millisecondes afin d'éviter les problèmes liés
   à deux opérations réalisées pendant la même seconde.

   null reste une valeur valide pour les anciens comptes dont
   passwordChangedAt n'a jamais été initialisé.
   ============================================================ */

function getPasswordVersion(
  passwordChangedAt:
    Date |
    null,
): number | null {
  if (
    !passwordChangedAt
  ) {
    return null;
  }


  return passwordChangedAt
    .getTime();
}


/* ============================================================
   BASE64URL ENCODE
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


/* ============================================================
   BASE64URL DECODE
   ============================================================ */

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
   SIGN VALUE
   ============================================================ */

function signValue(
  value:
    string,
): string {
  return createHmac(
    "sha256",
    getSessionSecret(),
  )
    .update(
      value,
      "utf8",
    )
    .digest(
      "base64url",
    );
}


/* ============================================================
   SECURE SIGNATURE COMPARISON
   ============================================================ */

function secureSignatureEquals(
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
   GENERATE SESSION NONCE
   ============================================================ */

function generateSessionNonce():
  string {
  return randomBytes(
    16,
  ).toString(
    "base64url",
  );
}


/* ============================================================
   GET ACTIVE GESTIONNAIRE
   ------------------------------------------------------------
   Une signature valide ne suffit jamais.

   Le serveur vérifie également :

   - Manager existe ;
   - e-mail vérifié ;
   - Manager ACTIVE ;
   - Store ACTIVE ;
   - passwordChangedAt actuel.
   ============================================================ */

async function getActiveGestionnaire(
  gestionnaireId:
    string,
): Promise<ActiveGestionnaireRecord | null> {
  try {
    const manager =
      await db.manager.findUnique({
        where: {
          id:
            gestionnaireId,
        },

        select: {
          id:
            true,

          status:
            true,

          emailVerifiedAt:
            true,

          passwordChangedAt:
            true,

          store: {
            select: {
              status:
                true,
            },
          },
        },
      });


    if (
      !manager
    ) {
      return null;
    }


    if (
      !manager.emailVerifiedAt
    ) {
      return null;
    }


    if (
      manager.status !==
      ManagerStatus.ACTIVE
    ) {
      return null;
    }


    if (
      manager.store.status !==
      StoreStatus.ACTIVE
    ) {
      return null;
    }


    return manager;
  } catch {
    /*
     * FAIL CLOSED.
     *
     * En cas d'erreur DB, aucune session ne doit être considérée
     * comme autorisée.
     */

    return null;
  }
}


/* ============================================================
   REQUIRE ACTIVE GESTIONNAIRE RECORD
   ============================================================ */

async function requireActiveGestionnaireRecord(
  gestionnaireId:
    string,
): Promise<ActiveGestionnaireRecord> {
  const manager =
    await getActiveGestionnaire(
      gestionnaireId,
    );


  if (
    !manager
  ) {
    throw new Error(
      "GESTIONNAIRE_NOT_ACTIVE",
    );
  }


  return manager;
}


/* ============================================================
   CREATE SIGNED GESTIONNAIRE TOKEN
   ------------------------------------------------------------
   Format :

   base64url(payload).signature

   RÈGLE ABSOLUE :

   issuedAt  = maintenant
   expiresAt = issuedAt + 24 heures

   Le token conserve également la valeur actuelle de
   passwordChangedAt.
   ============================================================ */

function createSignedGestionnaireToken(
  manager:
    ActiveGestionnaireRecord,
): Readonly<{
  token:
    string;

  issuedAt:
    Date;

  expiresAt:
    Date;
}> {
  const now =
    getCurrentUnixTime();


  const expiresAt =
    now +
    GESTIONNAIRE_SESSION_MAX_AGE_SECONDS;


  const payload:
    GestionnaireSessionPayload = {
    version:
      SESSION_VERSION,

    kind:
      SESSION_KIND,

    subject:
      manager.id,

    nonce:
      generateSessionNonce(),

    issuedAt:
      now,

    expiresAt,

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
    signValue(
      encodedPayload,
    );


  return {
    token:
      `${encodedPayload}.${signature}`,

    issuedAt:
      new Date(
        now *
          1000,
      ),

    expiresAt:
      new Date(
        expiresAt *
          1000,
      ),
  };
}


/* ============================================================
   PARSE SIGNED GESTIONNAIRE TOKEN
   ============================================================ */

function parseSignedGestionnaireToken(
  token:
    string,
): ParsedGestionnaireSession | null {
  try {
    /* --------------------------------------------------------
       TOKEN BASIC VALIDATION
       -------------------------------------------------------- */

    if (
      !token ||
      token.length >
        MAX_SESSION_TOKEN_LENGTH
    ) {
      return null;
    }


    const parts =
      token.split(
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


    /* --------------------------------------------------------
       SIGNATURE VALIDATION
       -------------------------------------------------------- */

    const expectedSignature =
      signValue(
        encodedPayload,
      );


    if (
      !secureSignatureEquals(
        receivedSignature,
        expectedSignature,
      )
    ) {
      return null;
    }


    /* --------------------------------------------------------
       PAYLOAD DECODING
       -------------------------------------------------------- */

    const decodedPayload =
      decodeBase64Url(
        encodedPayload,
      );


    if (
      !decodedPayload
    ) {
      return null;
    }


    const rawPayload:
      unknown =
        JSON.parse(
          decodedPayload,
        );


    /* --------------------------------------------------------
       OBJECT VALIDATION
       -------------------------------------------------------- */

    if (
      typeof rawPayload !==
        "object" ||
      rawPayload ===
        null ||
      Array.isArray(
        rawPayload,
      )
    ) {
      return null;
    }


    const payload =
      rawPayload as
        Partial<GestionnaireSessionPayload>;


    /* --------------------------------------------------------
       PAYLOAD STRUCTURE
       -------------------------------------------------------- */

    if (
      payload.version !==
        SESSION_VERSION ||
      payload.kind !==
        SESSION_KIND ||
      typeof payload.subject !==
        "string" ||
      payload.subject.trim().length ===
        0 ||
      typeof payload.nonce !==
        "string" ||
      payload.nonce.length <
        10 ||
      typeof payload.issuedAt !==
        "number" ||
      !Number.isFinite(
        payload.issuedAt,
      ) ||
      !Number.isInteger(
        payload.issuedAt,
      ) ||
      typeof payload.expiresAt !==
        "number" ||
      !Number.isFinite(
        payload.expiresAt,
      ) ||
      !Number.isInteger(
        payload.expiresAt,
      ) ||
      !(
        payload.passwordChangedAt ===
          null ||
        (
          typeof payload.passwordChangedAt ===
            "number" &&
          Number.isFinite(
            payload.passwordChangedAt,
          ) &&
          Number.isInteger(
            payload.passwordChangedAt,
          ) &&
          payload.passwordChangedAt >=
            0
        )
      )
    ) {
      return null;
    }


    /* --------------------------------------------------------
       TIME VALIDATION
       -------------------------------------------------------- */

    const now =
      getCurrentUnixTime();


    /*
     * Session expirée.
     */

    if (
      payload.expiresAt <=
      now
    ) {
      return null;
    }


    /*
     * issuedAt ne doit pas venir anormalement du futur.
     */

    if (
      payload.issuedAt >
      now +
        SESSION_CLOCK_SKEW_SECONDS
    ) {
      return null;
    }


    /*
     * expiresAt doit être strictement postérieur à issuedAt.
     */

    if (
      payload.expiresAt <=
      payload.issuedAt
    ) {
      return null;
    }


    /*
     * Aucun token ne peut déclarer une durée supérieure
     * à 24 heures.
     */

    const declaredLifetime =
      payload.expiresAt -
      payload.issuedAt;


    if (
      declaredLifetime >
      GESTIONNAIRE_SESSION_MAX_AGE_SECONDS
    ) {
      return null;
    }


    if (
      declaredLifetime <=
      0
    ) {
      return null;
    }


    return {
      session: {
        gestionnaireId:
          payload.subject.trim(),

        issuedAt:
          new Date(
            payload.issuedAt *
              1000,
          ),

        expiresAt:
          new Date(
            payload.expiresAt *
              1000,
          ),
      },

      passwordChangedAt:
        payload.passwordChangedAt,
    };
  } catch {
    return null;
  }
}


/* ============================================================
   PASSWORD VERSION MATCH
   ------------------------------------------------------------
   C'est cette vérification qui invalide automatiquement une
   ancienne session lorsqu'un mot de passe est modifié.

   Exemple :

   session :
   passwordChangedAt = 1000

   base après reset :
   passwordChangedAt = 2000

   1000 !== 2000
   => session refusée.
   ============================================================ */

function hasCurrentPasswordVersion(
  manager:
    ActiveGestionnaireRecord,

  parsedSession:
    ParsedGestionnaireSession,
): boolean {
  const currentPasswordVersion =
    getPasswordVersion(
      manager
        .passwordChangedAt,
    );


  return (
    currentPasswordVersion ===
    parsedSession.passwordChangedAt
  );
}


/* ============================================================
   SET PENDING VERIFICATION SESSION
   ============================================================ */

export async function setPendingVerificationSession(
  pendingVerificationToken:
    string,
): Promise<void> {
  const normalizedToken =
    pendingVerificationToken
      .trim();


  if (
    normalizedToken.length <
      20 ||
    normalizedToken.length >
      MAX_PENDING_VERIFICATION_TOKEN_LENGTH
  ) {
    throw new Error(
      "Token de vérification invalide.",
    );
  }


  const cookieStore =
    await cookies();


  cookieStore.set(
    PENDING_VERIFICATION_COOKIE_NAME,
    normalizedToken,
    {
      httpOnly:
        true,

      secure:
        isProduction(),

      sameSite:
        "lax",

      path:
        PENDING_VERIFICATION_COOKIE_PATH,

      maxAge:
        PENDING_VERIFICATION_MAX_AGE_SECONDS,

      priority:
        "high",
    },
  );
}


/* ============================================================
   GET PENDING VERIFICATION TOKEN
   ============================================================ */

export async function getPendingVerificationToken():
  Promise<string | null> {
  const cookieStore =
    await cookies();


  const value =
    cookieStore
      .get(
        PENDING_VERIFICATION_COOKIE_NAME,
      )
      ?.value
      ?.trim();


  if (
    !value ||
    value.length <
      20 ||
    value.length >
      MAX_PENDING_VERIFICATION_TOKEN_LENGTH
  ) {
    return null;
  }


  return value;
}


/* ============================================================
   GET PENDING VERIFICATION SESSION
   ------------------------------------------------------------
   Le navigateur ne reçoit jamais le token.

   Il reçoit uniquement :

   {
     maskedEmail: "je****@gmail.com"
   }
   ============================================================ */

export async function getPendingVerificationSession():
  Promise<PendingVerificationSession | null> {
  const pendingVerificationToken =
    await getPendingVerificationToken();


  if (
    !pendingVerificationToken
  ) {
    return null;
  }


  try {
    const display =
      await getPendingVerificationDisplay(
        pendingVerificationToken,
      );


    if (
      !display
    ) {
      return null;
    }


    return {
      maskedEmail:
        display.maskedEmail,
    };
  } catch {
    return null;
  }
}


/* ============================================================
   CLEAR PENDING VERIFICATION SESSION
   ============================================================ */

export async function clearPendingVerificationSession():
  Promise<void> {
  const cookieStore =
    await cookies();


  cookieStore.set(
    PENDING_VERIFICATION_COOKIE_NAME,
    "",
    {
      httpOnly:
        true,

      secure:
        isProduction(),

      sameSite:
        "lax",

      path:
        PENDING_VERIFICATION_COOKIE_PATH,

      maxAge:
        0,

      expires:
        new Date(0),

      priority:
        "high",
    },
  );
}


/* ============================================================
   CREATE AUTHENTICATED GESTIONNAIRE SESSION
   ------------------------------------------------------------
   Utilisée notamment :

   - après validation OTP ;
   - après connexion e-mail / mot de passe.

   Vérifications AVANT création :

   - Manager existe ;
   - e-mail vérifié ;
   - Manager ACTIVE ;
   - Store ACTIVE.

   La version actuelle de passwordChangedAt est ensuite placée
   dans le token signé.

   DURÉE :

   24 heures maximum, non glissantes.

   COOKIE PATH :

   "/"

   Cela permet au navigateur d'envoyer la même session vers :

   - /gestionnaire/*
   - /api/gestionnaire/*
   ============================================================ */

export async function createGestionnaireSession(
  gestionnaireId:
    string,
): Promise<void> {
  const normalizedGestionnaireId =
    gestionnaireId
      .trim();


  if (
    !normalizedGestionnaireId
  ) {
    throw new Error(
      "Identifiant Gestionnaire invalide.",
    );
  }


  /* ----------------------------------------------------------
     DATABASE AUTHORIZATION + PASSWORD VERSION
     ---------------------------------------------------------- */

  const manager =
    await requireActiveGestionnaireRecord(
      normalizedGestionnaireId,
    );


  /* ----------------------------------------------------------
     CREATE ABSOLUTE 24-HOUR SESSION
     ---------------------------------------------------------- */

  const signedSession =
    createSignedGestionnaireToken(
      manager,
    );


  /* ----------------------------------------------------------
     WRITE HTTPONLY COOKIE
     ---------------------------------------------------------- */

  const cookieStore =
    await cookies();


  cookieStore.set(
    GESTIONNAIRE_SESSION_COOKIE_NAME,
    signedSession.token,
    {
      httpOnly:
        true,

      secure:
        isProduction(),

      sameSite:
        "lax",

      path:
        GESTIONNAIRE_SESSION_COOKIE_PATH,

      maxAge:
        GESTIONNAIRE_SESSION_MAX_AGE_SECONDS,

      expires:
        signedSession.expiresAt,

      priority:
        "high",
    },
  );
}


/* ============================================================
   GET AUTHENTICATED GESTIONNAIRE SESSION
   ------------------------------------------------------------
   Vérifications à CHAQUE lecture serveur :

   1. cookie présent ;
   2. taille raisonnable ;
   3. format valide ;
   4. signature HMAC valide ;
   5. version valide ;
   6. type de token valide ;
   7. issuedAt valide ;
   8. expiresAt valide ;
   9. durée <= 24 heures ;
   10. session non expirée ;
   11. Manager existe ;
   12. e-mail vérifié ;
   13. Manager ACTIVE ;
   14. Store ACTIVE ;
   15. passwordChangedAt identique.

   IMPORTANT :

   Cette fonction NE RÉÉCRIT PAS LE COOKIE.

   Aucun sliding expiration.
   ============================================================ */

export async function getGestionnaireSession():
  Promise<GestionnaireSession | null> {
  const cookieStore =
    await cookies();


  const token =
    cookieStore
      .get(
        GESTIONNAIRE_SESSION_COOKIE_NAME,
      )
      ?.value;


  if (
    !token
  ) {
    return null;
  }


  /* ----------------------------------------------------------
     CRYPTOGRAPHIC VALIDATION + EXPIRATION
     ---------------------------------------------------------- */

  const parsedSession =
    parseSignedGestionnaireToken(
      token,
    );


  if (
    !parsedSession
  ) {
    return null;
  }


  /* ----------------------------------------------------------
     DATABASE AUTHORIZATION
     ---------------------------------------------------------- */

  const manager =
    await getActiveGestionnaire(
      parsedSession
        .session
        .gestionnaireId,
    );


  if (
    !manager
  ) {
    return null;
  }


  /* ----------------------------------------------------------
     PASSWORD CHANGE INVALIDATION
     ----------------------------------------------------------
     Une réinitialisation ou modification du mot de passe
     modifie Manager.passwordChangedAt.

     Toute session possédant l'ancienne version devient donc
     immédiatement invalide côté serveur.
     ---------------------------------------------------------- */

  if (
    !hasCurrentPasswordVersion(
      manager,
      parsedSession,
    )
  ) {
    return null;
  }


  return parsedSession.session;
}


/* ============================================================
   REQUIRE GESTIONNAIRE SESSION
   ------------------------------------------------------------
   Utilisée par les zones privées.

   Garantit que la session a déjà validé :

   - signature ;
   - version ;
   - expiration ;
   - durée maximale 24 h ;
   - Manager ACTIVE ;
   - e-mail vérifié ;
   - Store ACTIVE ;
   - version actuelle du mot de passe.
   ============================================================ */

export async function requireGestionnaireSession():
  Promise<GestionnaireSession> {
  const session =
    await getGestionnaireSession();


  if (
    !session
  ) {
    throw new Error(
      "GESTIONNAIRE_SESSION_REQUIRED",
    );
  }


  return session;
}


/* ============================================================
   CLEAR AUTHENTICATED SESSION
   ------------------------------------------------------------
   Déconnexion manuelle du navigateur courant.

   Cette fonction supprime :

   1. le cookie actuel avec Path=/ ;
   2. l'ancien cookie historique avec Path=/gestionnaire.

   Le second nettoyage permet d'éviter qu'un ancien cookie
   possédant le même nom reste présent dans le navigateur
   après la migration du scope de session.

   Après nettoyage :

   prochaine requête privée sans session valide => refusée.
   ============================================================ */

export async function clearGestionnaireSession():
  Promise<void> {
  const cookieStore =
    await cookies();


  const expirationOptions = {
    httpOnly:
      true,

    secure:
      isProduction(),

    sameSite:
      "lax" as const,

    maxAge:
      0,

    expires:
      new Date(0),

    priority:
      "high" as const,
  };


  /*
   * ==========================================================
   * COOKIE ACTUEL
   * ----------------------------------------------------------
   * Nouvelle session authentifiée :
   *
   * Path=/
   * ==========================================================
   */

  cookieStore.set(
    GESTIONNAIRE_SESSION_COOKIE_NAME,
    "",
    {
      ...expirationOptions,

      path:
        GESTIONNAIRE_SESSION_COOKIE_PATH,
    },
  );


  /*
   * ==========================================================
   * NETTOYAGE DU COOKIE HISTORIQUE
   * ----------------------------------------------------------
   * Anciennes versions :
   *
   * Path=/gestionnaire
   *
   * Ce nettoyage pourra rester en place sans risque.
   * ==========================================================
   */

  cookieStore.set(
    GESTIONNAIRE_SESSION_COOKIE_NAME,
    "",
    {
      ...expirationOptions,

      path:
        LEGACY_GESTIONNAIRE_SESSION_COOKIE_PATH,
    },
  );
}


/* ============================================================
   CLEAR ALL GESTIONNAIRE AUTH SESSIONS
   ------------------------------------------------------------
   Nettoie :

   - cookie temporaire de vérification ;
   - cookie authentifié Gestionnaire actuel ;
   - ancien cookie Gestionnaire /gestionnaire.

   Les suppressions sont volontairement effectuées
   séquentiellement sur le même cycle de réponse.
   ============================================================ */

export async function clearGestionnaireAuthSessions():
  Promise<void> {
  await clearPendingVerificationSession();

  await clearGestionnaireSession();
}