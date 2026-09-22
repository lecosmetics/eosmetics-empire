"use server";

import {
  headers,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import {
  routes,
} from "@/config/routes";

import {
  loginGestionnaire,
  type LoginGestionnaireFailureCode,
} from "@/server/gestionnaire/auth/login";

import {
  clearPendingVerificationSession,
  createGestionnaireSession,
  getPendingVerificationToken,
} from "@/server/gestionnaire/session";


/* ============================================================
   L&E COSMETICS EMPIRE
   CONNEXION GESTIONNAIRE — SERVER ACTION
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/connexion/actions.ts

   Route :
   /gestionnaire/connexion

   RESPONSABILITÉS :

   - recevoir le formulaire de connexion ;
   - valider les champs essentiels côté serveur ;
   - récupérer IP + User-Agent côté serveur ;
   - appeler le service sécurisé login.ts ;
   - ne jamais faire confiance à un managerId venant du client ;
   - gérer les erreurs métier ;
   - reprendre la vérification e-mail si nécessaire ;
   - créer la session Gestionnaire HttpOnly ;
   - nettoyer une ancienne session de vérification ;
   - rediriger vers /gestionnaire/dashboard.

   IMPORTANT :

   Ce fichier ne vérifie PAS directement le hash du mot de passe.

   Cette responsabilité appartient à :

   src/server/gestionnaire/auth/login.ts

   Ce fichier ne construit PAS lui-même le cookie.

   Cette responsabilité appartient à :

   src/server/gestionnaire/session.ts

   Aucun mot de passe n'est :
   - conservé dans l'état retourné ;
   - loggé ;
   - placé dans une URL ;
   - renvoyé au navigateur après soumission.
   ============================================================ */


/* ============================================================
   TYPES — FIELD ERRORS
   ============================================================ */

export type LoginFieldErrors =
  Readonly<{
    email?:
      string;

    password?:
      string;
  }>;


/* ============================================================
   TYPES — ACTION STATE
   ------------------------------------------------------------
   IMPORTANT :

   Dans un fichier "use server", nous exportons uniquement :

   - des types ;
   - des fonctions async.

   Nous n'exportons aucune constante runtime afin d'éviter :

   A "use server" file can only export async functions.
   ============================================================ */

export type LoginActionState =
  Readonly<{
    status:
      | "idle"
      | "error"
      | "verification_required";

    message:
      string |
      null;

    fieldErrors:
      LoginFieldErrors;

    values:
      Readonly<{
        email:
          string;
      }>;

    retryAfterSeconds:
      number |
      null;
  }>;


/* ============================================================
   FORM LIMITS
   ============================================================ */

const MAX_EMAIL_LENGTH =
  254;


const MAX_PASSWORD_LENGTH =
  256;


/* ============================================================
   EMAIL FORMAT
   ------------------------------------------------------------
   Validation légère ici pour l'expérience formulaire.

   La validation définitive est refaite dans login.ts.
   ============================================================ */

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/* ============================================================
   READ FORM STRING
   ============================================================ */

function readFormString(
  formData:
    FormData,

  fieldName:
    string,
): string {
  const value =
    formData.get(
      fieldName,
    );


  if (
    typeof value !==
      "string"
  ) {
    return "";
  }


  return value;
}


/* ============================================================
   NORMALIZE EMAIL
   ============================================================ */

function normalizeEmail(
  value:
    string,
): string {
  return value
    .trim()
    .toLowerCase();
}


/* ============================================================
   CREATE STATE
   ============================================================ */

function createLoginState(
  options:
    Readonly<{
      status?:
        LoginActionState["status"];

      message?:
        string |
        null;

      fieldErrors?:
        LoginFieldErrors;

      email?:
        string;

      retryAfterSeconds?:
        number |
        null;
    }> = {},
): LoginActionState {
  return {
    status:
      options.status ??
      "error",

    message:
      options.message ??
      null,

    fieldErrors:
      options.fieldErrors ??
      {},

    values: {
      email:
        options.email ??
        "",
    },

    retryAfterSeconds:
      options
        .retryAfterSeconds ??
      null,
  };
}


/* ============================================================
   VALIDATE FORM
   ============================================================ */

function validateLoginForm(
  formData:
    FormData,
):
  | Readonly<{
      success:
        true;

      email:
        string;

      password:
        string;
    }>
  | Readonly<{
      success:
        false;

      email:
        string;

      fieldErrors:
        LoginFieldErrors;
    }> {
  const email =
    normalizeEmail(
      readFormString(
        formData,
        "email",
      ),
    );


  /*
   * Le mot de passe n'est volontairement :
   *
   * - ni trim() ;
   * - ni transformé ;
   * - ni normalisé.
   *
   * Les espaces peuvent faire partie d'un vrai mot de passe.
   */

  const password =
    readFormString(
      formData,
      "password",
    );


  const fieldErrors: {
    email?:
      string;

    password?:
      string;
  } = {};


  /* ----------------------------------------------------------
     EMAIL
     ---------------------------------------------------------- */

  if (
    email.length ===
    0
  ) {
    fieldErrors.email =
      "Veuillez saisir votre adresse e-mail.";
  } else if (
    email.length >
    MAX_EMAIL_LENGTH
  ) {
    fieldErrors.email =
      "L’adresse e-mail renseignée n’est pas valide.";
  } else if (
    !EMAIL_PATTERN.test(
      email,
    )
  ) {
    fieldErrors.email =
      "Veuillez saisir une adresse e-mail valide.";
  }


  /* ----------------------------------------------------------
     PASSWORD
     ---------------------------------------------------------- */

  if (
    password.length ===
    0
  ) {
    fieldErrors.password =
      "Veuillez saisir votre mot de passe.";
  } else if (
    password.length >
    MAX_PASSWORD_LENGTH
  ) {
    fieldErrors.password =
      "Le mot de passe renseigné n’est pas valide.";
  }


  if (
    Object.keys(
      fieldErrors,
    ).length >
    0
  ) {
    return {
      success:
        false,

      email,

      fieldErrors,
    };
  }


  return {
    success:
      true,

    email,

    password,
  };
}


/* ============================================================
   REQUEST IP
   ------------------------------------------------------------
   IMPORTANT :

   L'adresse IP n'est jamais reçue depuis FormData.

   Elle est déterminée uniquement depuis la requête HTTP
   accessible au Server Action.

   Selon l'hébergement, le reverse proxy peut fournir :

   - cf-connecting-ip ;
   - x-real-ip ;
   - x-forwarded-for.

   x-forwarded-for peut contenir plusieurs IP :

   client, proxy1, proxy2

   Nous conservons seulement la première valeur.
   ============================================================ */

function getRequestIp(
  requestHeaders:
    Headers,
): string | null {
  const cloudflareIp =
    requestHeaders
      .get(
        "cf-connecting-ip",
      )
      ?.trim();


  if (
    cloudflareIp
  ) {
    return cloudflareIp;
  }


  const realIp =
    requestHeaders
      .get(
        "x-real-ip",
      )
      ?.trim();


  if (
    realIp
  ) {
    return realIp;
  }


  const forwardedFor =
    requestHeaders.get(
      "x-forwarded-for",
    );


  if (
    !forwardedFor
  ) {
    return null;
  }


  const firstIp =
    forwardedFor
      .split(
        ",",
      )[0]
      ?.trim();


  return firstIp ||
    null;
}


/* ============================================================
   USER AGENT
   ============================================================ */

function getRequestUserAgent(
  requestHeaders:
    Headers,
): string | null {
  const userAgent =
    requestHeaders
      .get(
        "user-agent",
      )
      ?.trim();


  return userAgent ||
    null;
}


/* ============================================================
   RETRY MESSAGE
   ============================================================ */

function createRateLimitMessage(
  retryAfterSeconds:
    number |
    null |
    undefined,
): string {
  if (
    !retryAfterSeconds ||
    retryAfterSeconds <=
      0
  ) {
    return "Trop de tentatives de connexion. Veuillez patienter quelques minutes avant de réessayer.";
  }


  if (
    retryAfterSeconds <
    60
  ) {
    return `Trop de tentatives de connexion. Réessayez dans environ ${retryAfterSeconds} seconde${
      retryAfterSeconds >
      1
        ? "s"
        : ""
    }.`;
  }


  const minutes =
    Math.max(
      1,
      Math.ceil(
        retryAfterSeconds /
          60,
      ),
    );


  return `Trop de tentatives de connexion. Réessayez dans environ ${minutes} minute${
    minutes >
    1
      ? "s"
      : ""
  }.`;
}


/* ============================================================
   MAP LOGIN FAILURE
   ============================================================ */

function mapLoginFailure(
  failureCode:
    LoginGestionnaireFailureCode,

  email:
    string,

  retryAfterSeconds?:
    number |
    null,
): LoginActionState {
  switch (
    failureCode
  ) {
    /* --------------------------------------------------------
       INVALID INPUT
       -------------------------------------------------------- */

    case "INVALID_INPUT":
      return createLoginState({
        email,

        message:
          "Veuillez vérifier les informations saisies puis réessayer.",
      });


    /* --------------------------------------------------------
       INVALID CREDENTIALS
       --------------------------------------------------------
       Message volontairement générique.

       On ne distingue jamais côté interface :

       - e-mail inconnu ;
       - mauvais mot de passe.
       -------------------------------------------------------- */

    case "INVALID_CREDENTIALS":
      return createLoginState({
        email,

        message:
          "Adresse e-mail ou mot de passe incorrect.",
      });


    /* --------------------------------------------------------
       SUSPENDED
       -------------------------------------------------------- */

    case "ACCOUNT_SUSPENDED":
      return createLoginState({
        email,

        message:
          "Ce compte ne peut pas accéder à l’espace Gestionnaire pour le moment.",
      });


    /* --------------------------------------------------------
       DISABLED
       -------------------------------------------------------- */

    case "ACCOUNT_DISABLED":
      return createLoginState({
        email,

        message:
          "Ce compte ne peut pas accéder à l’espace Gestionnaire.",
      });


    /* --------------------------------------------------------
       RATE LIMITED
       -------------------------------------------------------- */

    case "RATE_LIMITED":
      return createLoginState({
        email,

        message:
          createRateLimitMessage(
            retryAfterSeconds,
          ),

        retryAfterSeconds:
          retryAfterSeconds ??
          null,
      });


    /* --------------------------------------------------------
       VERIFICATION
       --------------------------------------------------------
       Ce cas est normalement traité avant cet appel afin de
       permettre la redirection vers /verification.

       Ce fallback garde cependant l'action robuste.
       -------------------------------------------------------- */

    case "EMAIL_VERIFICATION_REQUIRED":
      return createLoginState({
        status:
          "verification_required",

        email,

        message:
          "Votre adresse e-mail doit encore être vérifiée avant d’accéder à l’espace Gestionnaire.",
      });


    /* --------------------------------------------------------
       UNKNOWN
       -------------------------------------------------------- */

    case "UNKNOWN":
    default:
      return createLoginState({
        email,

        message:
          "La connexion n’a pas pu être effectuée. Veuillez réessayer.",
      });
  }
}


/* ============================================================
   LOGIN ACTION
   ------------------------------------------------------------
   PARCOURS :

   Formulaire
      ↓
   validation serveur
      ↓
   IP / User-Agent serveur
      ↓
   loginGestionnaire()
      ↓
   mot de passe Argon2id
      ↓
   Manager ACTIVE
      ↓
   Store ACTIVE
      ↓
   createGestionnaireSession()
      ↓
   cookie HttpOnly
      ↓
   /gestionnaire/dashboard
   ============================================================ */

export async function loginGestionnaireAction(
  _previousState:
    LoginActionState,

  formData:
    FormData,
): Promise<LoginActionState> {
  /*
   * previousState est nécessaire pour useActionState().
   *
   * Il n'est pas utilisé pour authentifier la requête.
   */

  void _previousState;


  /* ==========================================================
     1. VALIDATE FORM
     ========================================================== */

  const validation =
    validateLoginForm(
      formData,
    );


  if (
    !validation.success
  ) {
    return createLoginState({
      email:
        validation.email,

      fieldErrors:
        validation
          .fieldErrors,

      message:
        "Veuillez corriger les champs indiqués.",
    });
  }


  const {
    email,
    password,
  } =
    validation;


  /* ==========================================================
     2. REQUEST CONTEXT
     ----------------------------------------------------------
     Ces informations sont obtenues côté serveur.

     Aucun champ "ip", "managerId" ou "storeId" du navigateur
     n'est utilisé.
     ========================================================== */

  let ipAddress:
    string |
    null =
      null;


  let userAgent:
    string |
    null =
      null;


  try {
    const requestHeaders =
      await headers();


    ipAddress =
      getRequestIp(
        requestHeaders,
      );


    userAgent =
      getRequestUserAgent(
        requestHeaders,
      );
  } catch {
    /*
     * La connexion ne dépend pas obligatoirement de la présence
     * d'une IP exploitable.
     *
     * Le rate limiting par e-mail reste disponible dans le
     * service.
     */

    ipAddress =
      null;

    userAgent =
      null;
  }


  /* ==========================================================
     3. AUTHENTICATE
     ========================================================== */

  let loginResult:
    Awaited<
      ReturnType<
        typeof loginGestionnaire
      >
    >;


  try {
    loginResult =
      await loginGestionnaire(
        {
          email,
          password,
        },
        {
          ipAddress,
          userAgent,
        },
      );
  } catch {
    /*
     * Ne jamais logger ici :
     *
     * - password ;
     * - FormData ;
     * - hash Argon2 ;
     * - cookie ;
     * - token de session.
     */

    return createLoginState({
      email,

      message:
        "La connexion n’a pas pu être effectuée. Veuillez réessayer.",
    });
  }


  /* ==========================================================
     4. AUTHENTICATION FAILURE
     ========================================================== */

  if (
    !loginResult.ok
  ) {
    /* --------------------------------------------------------
       EMAIL VERIFICATION REQUIRED
       --------------------------------------------------------
       On réutilise strictement le parcours d'inscription déjà
       existant.

       Aucun nouveau token OTP n'est créé ici.
       Aucun nouvel OTP n'est inventé ici.
       -------------------------------------------------------- */

    if (
      loginResult.code ===
      "EMAIL_VERIFICATION_REQUIRED"
    ) {
      let pendingVerificationToken:
        string |
        null =
          null;


      try {
        pendingVerificationToken =
          await getPendingVerificationToken();
      } catch {
        pendingVerificationToken =
          null;
      }


      /*
       * Si le navigateur possède encore sa session temporaire
       * HttpOnly issue de l'inscription, la page de vérification
       * peut reprendre exactement le flux existant.
       */

      if (
        pendingVerificationToken
      ) {
        redirect(
          routes
            .gestionnaire
            .verification,
        );
      }


      /*
       * Aucun token temporaire exploitable.
       *
       * On ne crée pas une deuxième logique de vérification dans
       * la page de connexion.
       */

      return createLoginState({
        status:
          "verification_required",

        email,

        message:
          "Votre adresse e-mail doit encore être vérifiée. Reprenez la vérification de votre inscription pour continuer.",
      });
    }


    return mapLoginFailure(
      loginResult.code,
      email,
      loginResult
        .retryAfterSeconds,
    );
  }


  /* ==========================================================
     5. CREATE AUTHENTICATED SESSION
     ----------------------------------------------------------
     loginGestionnaire() retourne l'identifiant réel retrouvé
     côté serveur.

     Aucun managerId venant du navigateur n'est utilisé.
     ========================================================== */

  try {
    await createGestionnaireSession(
      loginResult
        .gestionnaireId,
    );
  } catch {
    /*
     * Le mot de passe peut être valide mais si la session
     * sécurisée ne peut pas être créée, l'accès au Dashboard
     * reste refusé.
     */

    return createLoginState({
      email,

      message:
        "Votre identité a été vérifiée, mais la session sécurisée n’a pas pu être ouverte. Veuillez réessayer.",
    });
  }


  /* ==========================================================
     6. CLEAN OLD PENDING VERIFICATION COOKIE
     ----------------------------------------------------------
     Un utilisateur peut éventuellement avoir conservé un ancien
     cookie temporaire après avoir terminé son inscription.

     Son nettoyage n'est pas une condition de réussite de la
     connexion authentifiée.

     Le cookie Gestionnaire valide vient déjà d'être créé.
     ========================================================== */

  try {
    await clearPendingVerificationSession();
  } catch {
    /*
     * Best effort uniquement.

     * On ne détruit pas une connexion valide parce qu'un ancien
     * cookie temporaire n'a pas pu être nettoyé.
     */
  }


  /* ==========================================================
     7. REDIRECT
     ----------------------------------------------------------
     IMPORTANT :

     redirect() reste volontairement HORS d'un try/catch.

     Next.js implémente redirect() avec une interruption interne
     contrôlée.

     La capturer transformerait une redirection réussie en
     fausse erreur.
     ========================================================== */

  redirect(
    routes
      .gestionnaire
      .dashboard,
  );
}