"use server";

import {
  headers,
} from "next/headers";

import {
  clearGestionnaireAuthSessions,
} from "@/server/gestionnaire/session";

import {
  completeGestionnairePasswordReset,
} from "@/server/gestionnaire/auth/password-reset";


/* ============================================================
   L&E COSMETICS EMPIRE
   RÉINITIALISATION MOT DE PASSE — SERVER ACTION
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/
   reinitialiser-mot-de-passe/actions.ts

   Route :
   /gestionnaire/reinitialiser-mot-de-passe

   RESPONSABILITÉS :

   - recevoir le token depuis le formulaire ;
   - recevoir le nouveau mot de passe ;
   - recevoir sa confirmation ;
   - refaire les validations côté serveur ;
   - transmettre IP + User-Agent au service sécurisé ;
   - appeler password-reset.ts ;
   - ne jamais retourner le mot de passe ;
   - ne jamais retourner le token ;
   - supprimer les cookies d'authentification après succès.

   IMPORTANT :

   Le vrai contrôle du token est réalisé dans :

   src/server/gestionnaire/auth/password-reset.ts

   Cette Server Action ne fait jamais confiance aux seules
   validations du navigateur.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const PASSWORD_MIN_LENGTH =
  10;


const PASSWORD_MAX_LENGTH =
  128;


const MAX_RESET_TOKEN_LENGTH =
  4_096;


const MAX_IP_LENGTH =
  128;


const MAX_USER_AGENT_LENGTH =
  1_000;


/* ============================================================
   FIELD ERRORS
   ============================================================ */

export type ResetPasswordFieldErrors =
  Readonly<{
    password?:
      string;

    passwordConfirmation?:
      string;
  }>;


/* ============================================================
   ACTION STATE
   ------------------------------------------------------------
   IMPORTANT :

   Le token n'est volontairement PAS conservé ici.

   Les mots de passe ne sont également jamais renvoyés au
   composant client après soumission.
   ============================================================ */

export type ResetPasswordActionState =
  Readonly<{
    status:
      | "idle"
      | "success"
      | "error"
      | "invalid_token";

    message:
      string |
      null;

    fieldErrors:
      ResetPasswordFieldErrors;
  }>;


/* ============================================================
   FORM DATA
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
   ACTION STATE FACTORY
   ============================================================ */

function createResetPasswordState(
  options:
    Readonly<{
      status?:
        ResetPasswordActionState["status"];

      message?:
        string |
        null;

      fieldErrors?:
        ResetPasswordFieldErrors;
    }> = {},
): ResetPasswordActionState {
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
  };
}


/* ============================================================
   CONTROL CHARACTER CHECK
   ------------------------------------------------------------
   Évite notamment les caractères de contrôle invisibles.

   Les espaces normaux restent autorisés afin de permettre
   l'utilisation de phrases de passe.
   ============================================================ */

function containsControlCharacters(
  value:
    string,
): boolean {
  return /[\u0000-\u001F\u007F]/.test(
    value,
  );
}


/* ============================================================
   REQUEST IP
   ------------------------------------------------------------
   L'adresse IP ne vient jamais du FormData.

   Priorité :

   1. cf-connecting-ip
   2. x-real-ip
   3. première valeur x-forwarded-for
   ============================================================ */

function getRequestIp(
  requestHeaders:
    Readonly<{
      get(
        name:
          string,
      ): string | null;
    }>,
): string | null {
  const cloudflareIp =
    requestHeaders
      .get(
        "cf-connecting-ip",
      )
      ?.trim()
      .slice(
        0,
        MAX_IP_LENGTH,
      );


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
      ?.trim()
      .slice(
        0,
        MAX_IP_LENGTH,
      );


  if (
    realIp
  ) {
    return realIp;
  }


  const forwardedFor =
    requestHeaders
      .get(
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
      ?.trim()
      .slice(
        0,
        MAX_IP_LENGTH,
      );


  return firstIp ||
    null;
}


/* ============================================================
   USER AGENT
   ============================================================ */

function getRequestUserAgent(
  requestHeaders:
    Readonly<{
      get(
        name:
          string,
      ): string | null;
    }>,
): string | null {
  const userAgent =
    requestHeaders
      .get(
        "user-agent",
      )
      ?.trim()
      .slice(
        0,
        MAX_USER_AGENT_LENGTH,
      );


  return userAgent ||
    null;
}


/* ============================================================
   VALIDATE TOKEN FORMAT
   ------------------------------------------------------------
   Ce contrôle ne valide PAS cryptographiquement le token.

   Il bloque simplement les entrées manifestement invalides
   avant d'appeler password-reset.ts.
   ============================================================ */

function isResetTokenFormatValid(
  token:
    string,
): boolean {
  return (
    token.length >=
      20 &&
    token.length <=
      MAX_RESET_TOKEN_LENGTH &&
    !containsControlCharacters(
      token,
    )
  );
}


/* ============================================================
   PASSWORD VALIDATION
   ============================================================ */

function validatePasswordFields(
  password:
    string,

  passwordConfirmation:
    string,
): ResetPasswordFieldErrors {
  const errors:
    {
      password?:
        string;

      passwordConfirmation?:
        string;
    } = {};


  /* ----------------------------------------------------------
     PASSWORD REQUIRED
     ---------------------------------------------------------- */

  if (
    password.length ===
    0
  ) {
    errors.password =
      "Veuillez saisir votre nouveau mot de passe.";
  } else if (
    password.length <
    PASSWORD_MIN_LENGTH
  ) {
    errors.password =
      `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  } else if (
    password.length >
    PASSWORD_MAX_LENGTH
  ) {
    errors.password =
      `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
  } else if (
    containsControlCharacters(
      password,
    )
  ) {
    errors.password =
      "Le mot de passe contient des caractères non autorisés.";
  }


  /* ----------------------------------------------------------
     CONFIRMATION REQUIRED
     ---------------------------------------------------------- */

  if (
    passwordConfirmation.length ===
    0
  ) {
    errors.passwordConfirmation =
      "Veuillez confirmer votre nouveau mot de passe.";
  } else if (
    passwordConfirmation.length >
    PASSWORD_MAX_LENGTH
  ) {
    errors.passwordConfirmation =
      "La confirmation du mot de passe n’est pas valide.";
  } else if (
    containsControlCharacters(
      passwordConfirmation,
    )
  ) {
    errors.passwordConfirmation =
      "La confirmation contient des caractères non autorisés.";
  }


  /* ----------------------------------------------------------
     MATCH
     ---------------------------------------------------------- */

  if (
    !errors.password &&
    !errors.passwordConfirmation &&
    password !==
      passwordConfirmation
  ) {
    errors.passwordConfirmation =
      "Les mots de passe ne correspondent pas.";
  }


  return errors;
}


/* ============================================================
   RESET PASSWORD ACTION
   ============================================================ */

export async function resetPasswordAction(
  _previousState:
    ResetPasswordActionState,

  formData:
    FormData,
): Promise<ResetPasswordActionState> {
  /*
   * useActionState transmet automatiquement l'état précédent.
   *
   * Il n'est jamais utilisé comme source de sécurité.
   */

  void _previousState;


  /* ==========================================================
     1. READ FORM
     ========================================================== */

  const token =
    readFormString(
      formData,
      "token",
    ).trim();


  /*
   * IMPORTANT :
   *
   * On ne trim PAS les mots de passe.
   *
   * Si l'utilisateur choisit volontairement des espaces dans
   * sa phrase de passe, ils font partie du mot de passe.
   */

  const password =
    readFormString(
      formData,
      "password",
    );


  const passwordConfirmation =
    readFormString(
      formData,
      "passwordConfirmation",
    );


  /* ==========================================================
     2. TOKEN BASIC VALIDATION
     ========================================================== */

  if (
    !isResetTokenFormatValid(
      token,
    )
  ) {
    return createResetPasswordState({
      status:
        "invalid_token",

      message:
        "Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.",
    });
  }


  /* ==========================================================
     3. PASSWORD VALIDATION
     ========================================================== */

  const fieldErrors =
    validatePasswordFields(
      password,
      passwordConfirmation,
    );


  if (
    Object.keys(
      fieldErrors,
    ).length >
    0
  ) {
    return createResetPasswordState({
      status:
        "error",

      message:
        null,

      fieldErrors,
    });
  }


  /* ==========================================================
     4. REQUEST CONTEXT
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
     * Une impossibilité de récupérer ces métadonnées ne doit
     * pas empêcher l'utilisateur de réinitialiser son mot de
     * passe.

     * Le token cryptographique reste obligatoire.
     */

    ipAddress =
      null;

    userAgent =
      null;
  }


  /* ==========================================================
     5. PASSWORD RESET SERVICE
     ========================================================== */

  let result:
    Awaited<
      ReturnType<
        typeof completeGestionnairePasswordReset
      >
    >;


  try {
    result =
      await completeGestionnairePasswordReset(
        {
          token,

          password,

          passwordConfirmation,
        },
        {
          ipAddress,
          userAgent,
        },
      );
  } catch {
    return createResetPasswordState({
      status:
        "error",

      message:
        "La réinitialisation du mot de passe est temporairement indisponible. Veuillez réessayer.",
    });
  }


  /* ==========================================================
     6. SUCCESS
     ========================================================== */

  if (
    result.ok
  ) {
    /*
     * Suppression du cookie de session actuellement présent
     * dans ce navigateur.
     *
     * Le changement de passwordChangedAt permettra également
     * au serveur de rejeter les anciennes sessions lorsque
     * session.ts appliquera ce contrôle.
     *
     * Une erreur de suppression du cookie ne doit pas annuler
     * le changement de mot de passe déjà réalisé en base.
     */

    try {
      await clearGestionnaireAuthSessions();
    } catch {
      /*
       * Best effort.
       */
    }


    return createResetPasswordState({
      status:
        "success",

      message:
        "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
    });
  }


  /* ==========================================================
     7. FAILURE MAPPING
     ========================================================== */

  switch (
    result.code
  ) {
    /* --------------------------------------------------------
       INVALID INPUT
       -------------------------------------------------------- */

    case "INVALID_INPUT":
      return createResetPasswordState({
        status:
          "error",

        message:
          "Les informations saisies ne sont pas valides. Vérifiez votre nouveau mot de passe.",
      });


    /* --------------------------------------------------------
       PASSWORD MISMATCH
       -------------------------------------------------------- */

    case "PASSWORD_MISMATCH":
      return createResetPasswordState({
        status:
          "error",

        fieldErrors: {
          passwordConfirmation:
            "Les mots de passe ne correspondent pas.",
        },
      });


    /* --------------------------------------------------------
       PASSWORD REUSE
       -------------------------------------------------------- */

    case "PASSWORD_REUSE_NOT_ALLOWED":
      return createResetPasswordState({
        status:
          "error",

        fieldErrors: {
          password:
            "Choisissez un nouveau mot de passe différent de votre mot de passe actuel.",
        },
      });


    /* --------------------------------------------------------
       INVALID / EXPIRED / ALREADY USED TOKEN
       -------------------------------------------------------- */

    case "INVALID_OR_EXPIRED_TOKEN":
      return createResetPasswordState({
        status:
          "invalid_token",

        message:
          "Ce lien de réinitialisation est invalide, a expiré ou a déjà été utilisé. Demandez un nouveau lien.",
      });


    /* --------------------------------------------------------
       UNAVAILABLE
       -------------------------------------------------------- */

    case "UNAVAILABLE":
    default:
      return createResetPasswordState({
        status:
          "error",

        message:
          "La réinitialisation du mot de passe est temporairement indisponible. Veuillez réessayer.",
      });
  }
}