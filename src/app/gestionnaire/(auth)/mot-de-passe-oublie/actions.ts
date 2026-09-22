"use server";

import {
  headers,
} from "next/headers";

import {
  requestGestionnairePasswordReset,
} from "@/server/gestionnaire/auth/password-reset";


/* ============================================================
   L&E COSMETICS EMPIRE
   MOT DE PASSE OUBLIÉ — SERVER ACTION
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/mot-de-passe-oublie/actions.ts

   Route :
   /gestionnaire/mot-de-passe-oublie

   RESPONSABILITÉS :

   - recevoir l'adresse e-mail ;
   - vérifier sa forme côté serveur ;
   - récupérer IP + User-Agent côté serveur ;
   - appeler password-reset.ts ;
   - respecter le rate limiting ;
   - ne jamais révéler si l'adresse existe ;
   - retourner un état propre au formulaire.

   IMPORTANT :

   Cette action :

   - ne génère pas elle-même le token ;
   - n'envoie pas directement l'e-mail ;
   - ne lit pas passwordHash ;
   - ne révèle pas si un compte existe ;
   - ne logge aucune donnée sensible.

   Toute la logique sensible se trouve dans :

   src/server/gestionnaire/auth/password-reset.ts
   ============================================================ */


/* ============================================================
   FIELD ERRORS
   ============================================================ */

export type ForgotPasswordFieldErrors =
  Readonly<{
    email?:
      string;
  }>;


/* ============================================================
   ACTION STATE
   ============================================================ */

export type ForgotPasswordActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error";

    message:
      string |
      null;

    fieldErrors:
      ForgotPasswordFieldErrors;

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
   CONSTANTS
   ============================================================ */

const MAX_EMAIL_LENGTH =
  254;


const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/* ============================================================
   SUCCESS MESSAGE
   ------------------------------------------------------------
   IMPORTANT :

   Ce message doit être IDENTIQUE que :

   - l'adresse existe ;
   - l'adresse n'existe pas ;
   - le compte n'est pas éligible.

   Cela empêche l'énumération des comptes.
   ============================================================ */

const PASSWORD_RESET_SUCCESS_MESSAGE =
  "Si un compte Gestionnaire correspond à cette adresse e-mail, un lien de réinitialisation vous a été envoyé.";


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
   CREATE ACTION STATE
   ============================================================ */

function createForgotPasswordState(
  options:
    Readonly<{
      status?:
        ForgotPasswordActionState["status"];

      message?:
        string |
        null;

      fieldErrors?:
        ForgotPasswordFieldErrors;

      email?:
        string;

      retryAfterSeconds?:
        number |
        null;
    }> = {},
): ForgotPasswordActionState {
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
      options.retryAfterSeconds ??
      null,
  };
}


/* ============================================================
   VALIDATE EMAIL
   ============================================================ */

function validateEmail(
  formData:
    FormData,
):
  | Readonly<{
      success:
        true;

      email:
        string;
    }>
  | Readonly<{
      success:
        false;

      email:
        string;

      error:
        string;
    }> {
  const email =
    normalizeEmail(
      readFormString(
        formData,
        "email",
      ),
    );


  if (
    email.length ===
    0
  ) {
    return {
      success:
        false,

      email,

      error:
        "Veuillez saisir votre adresse e-mail.",
    };
  }


  if (
    email.length >
    MAX_EMAIL_LENGTH
  ) {
    return {
      success:
        false,

      email,

      error:
        "L’adresse e-mail renseignée n’est pas valide.",
    };
  }


  if (
    !EMAIL_PATTERN.test(
      email,
    )
  ) {
    return {
      success:
        false,

      email,

      error:
        "Veuillez saisir une adresse e-mail valide.",
    };
  }


  return {
    success:
      true,

    email,
  };
}


/* ============================================================
   REQUEST IP
   ------------------------------------------------------------
   L'IP n'est jamais reçue depuis FormData.

   Priorités :

   1. cf-connecting-ip
   2. x-real-ip
   3. première IP de x-forwarded-for
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
   REQUEST USER AGENT
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
   RATE LIMIT MESSAGE
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
    return "Trop de demandes ont été effectuées. Veuillez patienter quelques minutes avant de réessayer.";
  }


  if (
    retryAfterSeconds <
    60
  ) {
    return `Trop de demandes ont été effectuées. Réessayez dans environ ${retryAfterSeconds} seconde${
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


  return `Trop de demandes ont été effectuées. Réessayez dans environ ${minutes} minute${
    minutes >
    1
      ? "s"
      : ""
  }.`;
}


/* ============================================================
   REQUEST PASSWORD RESET ACTION
   ============================================================ */

export async function forgotPasswordAction(
  _previousState:
    ForgotPasswordActionState,

  formData:
    FormData,
): Promise<ForgotPasswordActionState> {
  /*
   * Nécessaire pour useActionState().
   *
   * L'état précédent n'est jamais utilisé comme donnée
   * d'authentification.
   */

  void _previousState;


  /* ==========================================================
     1. SERVER-SIDE FORM VALIDATION
     ========================================================== */

  const validation =
    validateEmail(
      formData,
    );


  if (
    !validation.success
  ) {
    return createForgotPasswordState({
      status:
        "error",

      email:
        validation.email,

      fieldErrors: {
        email:
          validation.error,
      },

      message:
        null,
    });
  }


  const email =
    validation.email;


  /* ==========================================================
     2. REQUEST CONTEXT
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
     * Une absence d'IP exploitable ne doit pas empêcher
     * complètement le parcours.

     * Le rate limiting par e-mail reste appliqué par le
     * service password-reset.ts.
     */

    ipAddress =
      null;

    userAgent =
      null;
  }


  /* ==========================================================
     3. PASSWORD RESET SERVICE
     ========================================================== */

  let result:
    Awaited<
      ReturnType<
        typeof requestGestionnairePasswordReset
      >
    >;


  try {
    result =
      await requestGestionnairePasswordReset(
        {
          email,
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
     * - FormData ;
     * - token ;
     * - secrets ;
     * - hash ;
     * - informations d'authentification.
     */

    return createForgotPasswordState({
      status:
        "error",

      email,

      message:
        "Le service de récupération du mot de passe est temporairement indisponible. Veuillez réessayer.",
    });
  }


  /* ==========================================================
     4. SUCCESS
     ----------------------------------------------------------
     IMPORTANT :

     Le service retourne aussi ok:true lorsque :

     - le compte n'existe pas ;
     - le compte n'est pas éligible.

     C'est volontaire.

     Nous affichons donc exactement le même message.
     ========================================================== */

  if (
    result.ok
  ) {
    return createForgotPasswordState({
      status:
        "success",

      email:
        "",

      message:
        PASSWORD_RESET_SUCCESS_MESSAGE,

      fieldErrors:
        {},

      retryAfterSeconds:
        null,
    });
  }


  /* ==========================================================
     5. FAILURE
     ========================================================== */

  switch (
    result.code
  ) {
    /* --------------------------------------------------------
       INVALID INPUT
       -------------------------------------------------------- */

    case "INVALID_INPUT":
      return createForgotPasswordState({
        status:
          "error",

        email,

        fieldErrors: {
          email:
            "Veuillez saisir une adresse e-mail valide.",
        },
      });


    /* --------------------------------------------------------
       RATE LIMITED
       -------------------------------------------------------- */

    case "RATE_LIMITED":
      return createForgotPasswordState({
        status:
          "error",

        email,

        message:
          createRateLimitMessage(
            result.retryAfterSeconds,
          ),

        retryAfterSeconds:
          result.retryAfterSeconds ??
          null,
      });


    /* --------------------------------------------------------
       SERVICE UNAVAILABLE
       -------------------------------------------------------- */

    case "UNAVAILABLE":
    default:
      return createForgotPasswordState({
        status:
          "error",

        email,

        message:
          "Le service de récupération du mot de passe est temporairement indisponible. Veuillez réessayer.",
      });
  }
}