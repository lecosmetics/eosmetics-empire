"use server";

import {
  redirect,
} from "next/navigation";

import {
  routes,
} from "@/config/routes";

import {
  resendGestionnaireVerificationCode,
  verifyGestionnaireEmailCode,
  type ResendVerificationFailureCode,
  type VerificationFailureCode,
} from "@/server/gestionnaire/registration-service";

import {
  clearPendingVerificationSession,
  createGestionnaireSession,
  getPendingVerificationToken,
} from "@/server/gestionnaire/session";


/* ============================================================
   L&E COSMETICS EMPIRE
   VÉRIFICATION E-MAIL — SERVER ACTIONS
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/verification/actions.ts

   Route :
   /gestionnaire/verification

   RESPONSABILITÉS :

   - recevoir le code OTP ;
   - vérifier son format côté serveur ;
   - récupérer la session temporaire HttpOnly ;
   - vérifier l'OTP côté serveur ;
   - gérer l'expiration et les tentatives ;
   - finaliser l'inscription ;
   - créer le véritable compte Gestionnaire ;
   - créer la session Gestionnaire ;
   - supprimer la session temporaire ;
   - rediriger vers /gestionnaire/dashboard ;
   - gérer le renvoi sécurisé d'un nouvel OTP.

   IMPORTANT :

   Le navigateur ne transmet jamais :

   - gestionnaireId ;
   - managerId ;
   - storeId ;
   - email ;
   - OTP attendu ;
   - hash OTP ;
   - pendingVerificationToken ;
   - code représentant ;
   - mot de passe hashé.

   L'inscription concernée est retrouvée exclusivement grâce
   au cookie temporaire sécurisé HttpOnly.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const OTP_LENGTH =
  6;


/* ============================================================
   ACTION STATE
   ------------------------------------------------------------
   "export type" est autorisé dans un fichier "use server"
   puisqu'il disparaît à la compilation.

   Aucune constante runtime n'est exportée depuis ce fichier.
   ============================================================ */

export type VerificationActionState =
  Readonly<{
    status:
      | "idle"
      | "error"
      | "success";

    message:
      string | null;

    codeError:
      string | null;

    resendCooldownSeconds:
      number | null;
  }>;


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
   NORMALIZE OTP
   ------------------------------------------------------------
   Valeur attendue :

   528194

   Les espaces éventuels sont supprimés.

   Aucun caractère non numérique n'est accepté.
   ============================================================ */

function normalizeVerificationCode(
  formData:
    FormData,
): string {
  return readFormString(
    formData,
    "code",
  )
    .replace(
      /\s+/g,
      "",
    )
    .trim();
}


/* ============================================================
   OTP FORMAT VALIDATION
   ============================================================ */

function isValidOtpFormat(
  code:
    string,
): boolean {
  return new RegExp(
    `^\\d{${OTP_LENGTH}}$`,
  ).test(
    code,
  );
}


/* ============================================================
   CREATE ERROR STATE
   ============================================================ */

function createVerificationError(
  options?: Readonly<{
    message?:
      string | null;

    codeError?:
      string | null;

    resendCooldownSeconds?:
      number | null;
  }>,
): VerificationActionState {
  return {
    status:
      "error",

    message:
      options?.message ??
      null,

    codeError:
      options?.codeError ??
      null,

    resendCooldownSeconds:
      options
        ?.resendCooldownSeconds ??
      null,
  };
}


/* ============================================================
   VERIFY FAILURE MAPPER
   ------------------------------------------------------------
   Les erreurs internes du service ne sont jamais directement
   exposées au navigateur.

   Seuls des messages contrôlés sont retournés.
   ============================================================ */

function mapVerificationFailure(
  code:
    VerificationFailureCode,

  retryAfterSeconds?:
    number | null,
): VerificationActionState {
  switch (code) {
    /* --------------------------------------------------------
       INVALID OR EXPIRED OTP
       -------------------------------------------------------- */

    case "INVALID_OR_EXPIRED_CODE":
      return createVerificationError({
        codeError:
          "Code incorrect ou expiré.",
      });


    /* --------------------------------------------------------
       TOO MANY ATTEMPTS
       -------------------------------------------------------- */

    case "TOO_MANY_ATTEMPTS":
      return createVerificationError({
        message:
          "Trop de tentatives ont été effectuées. Veuillez demander un nouveau code avant de réessayer.",
      });


    /* --------------------------------------------------------
       RATE LIMIT
       -------------------------------------------------------- */

    case "RATE_LIMITED":
      return createVerificationError({
        message:
          "Trop de tentatives ont été effectuées. Veuillez patienter quelques instants avant de réessayer.",

        resendCooldownSeconds:
          retryAfterSeconds ??
          null,
      });


    /* --------------------------------------------------------
       REGISTRATION NO LONGER PENDING
       -------------------------------------------------------- */

    case "ACCOUNT_NOT_PENDING":
      return createVerificationError({
        message:
          "Cette vérification n’est plus disponible. Veuillez reprendre la procédure d’accès à votre compte.",
      });


    /* --------------------------------------------------------
       SAFE FALLBACK
       -------------------------------------------------------- */

    case "UNKNOWN":
    default:
      return createVerificationError({
        message:
          "La vérification n’a pas pu être effectuée. Veuillez réessayer.",
      });
  }
}


/* ============================================================
   RESEND FAILURE MAPPER
   ============================================================ */

function mapResendFailure(
  code:
    ResendVerificationFailureCode,

  retryAfterSeconds?:
    number | null,
): VerificationActionState {
  switch (code) {
    /* --------------------------------------------------------
       RATE LIMIT / COOLDOWN
       -------------------------------------------------------- */

    case "RATE_LIMITED": {
      const retryAfter =
        retryAfterSeconds &&
        retryAfterSeconds > 0
          ? retryAfterSeconds
          : null;


      return createVerificationError({
        message:
          retryAfter
            ? `Veuillez patienter ${retryAfter} seconde${
                retryAfter > 1
                  ? "s"
                  : ""
              } avant de demander un nouveau code.`
            : "Veuillez patienter quelques instants avant de demander un nouveau code.",

        resendCooldownSeconds:
          retryAfter,
      });
    }


    /* --------------------------------------------------------
       EMAIL DELIVERY FAILURE
       -------------------------------------------------------- */

    case "EMAIL_DELIVERY_FAILED":
      return createVerificationError({
        message:
          "Le nouveau code n’a pas pu être envoyé pour le moment. Veuillez réessayer dans quelques instants.",
      });


    /* --------------------------------------------------------
       REGISTRATION NO LONGER PENDING
       -------------------------------------------------------- */

    case "ACCOUNT_NOT_PENDING":
      return createVerificationError({
        message:
          "Cette vérification n’est plus disponible.",
      });


    /* --------------------------------------------------------
       SAFE FALLBACK
       -------------------------------------------------------- */

    case "UNKNOWN":
    default:
      return createVerificationError({
        message:
          "Le code n’a pas pu être renvoyé. Veuillez réessayer.",
      });
  }
}


/* ============================================================
   VERIFY GESTIONNAIRE EMAIL ACTION
   ------------------------------------------------------------
   PARCOURS :

   OTP saisi
       ↓
   validation du format
       ↓
   lecture du cookie temporaire
       ↓
   vérification OTP serveur
       ↓
   finalisation ManagerRegistration
       ↓
   création Store
       ↓
   création Manager ACTIVE
       ↓
   création session Gestionnaire
       ↓
   suppression cookie temporaire
       ↓
   /gestionnaire/dashboard
   ============================================================ */

export async function verifyGestionnaireEmailAction(
  _previousState:
    VerificationActionState,

  formData:
    FormData,
): Promise<VerificationActionState> {
  /*
   * Ce paramètre fait partie du contrat attendu par
   * useActionState().
   *
   * Il n'est volontairement pas utilisé dans cette action.
   */
  void _previousState;


  /* ----------------------------------------------------------
     1. READ OTP
     ---------------------------------------------------------- */

  const code =
    normalizeVerificationCode(
      formData,
    );


  /* ----------------------------------------------------------
     2. SERVER-SIDE FORMAT VALIDATION
     ---------------------------------------------------------- */

  if (!code) {
    return createVerificationError({
      codeError:
        "Veuillez saisir le code de vérification.",
    });
  }


  if (
    !isValidOtpFormat(
      code,
    )
  ) {
    return createVerificationError({
      codeError:
        "Le code de vérification doit contenir 6 chiffres.",
    });
  }


  /* ----------------------------------------------------------
     3. READ SECURE PENDING TOKEN
     ----------------------------------------------------------
     Le token provient uniquement du cookie HttpOnly.

     Il n'est jamais reçu depuis FormData.
     ---------------------------------------------------------- */

  const pendingVerificationToken =
    await getPendingVerificationToken();


  /* ----------------------------------------------------------
     4. MISSING / EXPIRED PENDING SESSION
     ---------------------------------------------------------- */

  if (
    !pendingVerificationToken
  ) {
    redirect(
      routes.gestionnaire.register,
    );
  }


  /* ----------------------------------------------------------
     5. VERIFY OTP SERVER-SIDE
     ---------------------------------------------------------- */

  let verificationResult:
    Awaited<
      ReturnType<
        typeof verifyGestionnaireEmailCode
      >
    >;


  try {
    verificationResult =
      await verifyGestionnaireEmailCode({
        pendingVerificationToken,
        code,
      });
  } catch {
    /*
     * Ne jamais logger ici :
     *
     * - OTP ;
     * - pendingVerificationToken ;
     * - mot de passe ;
     * - code représentant.
     */

    return createVerificationError({
      message:
        "La vérification n’a pas pu être effectuée. Veuillez réessayer.",
    });
  }


  /* ----------------------------------------------------------
     6. VERIFICATION FAILURE
     ---------------------------------------------------------- */

  if (
    !verificationResult.ok
  ) {
    return mapVerificationFailure(
      verificationResult.code,
      verificationResult
        .retryAfterSeconds,
    );
  }


  /* ----------------------------------------------------------
     7. REGISTRATION FINALIZED
     ----------------------------------------------------------
     verifyGestionnaireEmailCode() a maintenant effectué
     côté serveur :

     ManagerRegistration
       WAITING_EMAIL_VERIFICATION
              ↓
         OTP vérifié
              ↓
         Store créé
              ↓
         Manager ACTIVE créé
              ↓
     ManagerRegistration COMPLETED

     verificationResult.gestionnaireId contient le véritable
     Manager.id.
     ---------------------------------------------------------- */


  /* ----------------------------------------------------------
     8. CREATE AUTHENTICATED SESSION
     ---------------------------------------------------------- */

  try {
    await createGestionnaireSession(
      verificationResult
        .gestionnaireId,
    );
  } catch {
    /*
     * Le compte peut avoir été créé correctement alors que
     * l'écriture du cookie de session échoue exceptionnellement.

     * Aucun identifiant interne n'est exposé au navigateur.
     */

    return createVerificationError({
      message:
        "Votre adresse e-mail a été vérifiée, mais votre session n’a pas pu être ouverte automatiquement. Veuillez vous connecter.",
    });
  }


  /* ----------------------------------------------------------
     9. CLEAR TEMPORARY VERIFICATION COOKIE
     ---------------------------------------------------------- */

  try {
    await clearPendingVerificationSession();
  } catch {
    /*
     * La session authentifiée existe déjà.

     * On n'expose aucune information interne en cas d'échec
     * exceptionnel du nettoyage du cookie temporaire.
     */

    return createVerificationError({
      message:
        "Votre adresse e-mail a été vérifiée, mais la finalisation de votre session a rencontré un problème. Veuillez vous connecter.",
    });
  }


  /* ----------------------------------------------------------
     10. REDIRECT TO DASHBOARD
     ----------------------------------------------------------
     redirect() reste volontairement hors try/catch.

     Next.js utilise une interruption interne contrôlée pour
     effectuer la redirection.
     ---------------------------------------------------------- */

  redirect(
    routes.gestionnaire.dashboard,
  );
}


/* ============================================================
   RESEND VERIFICATION CODE ACTION
   ------------------------------------------------------------
   Cette action :

   - récupère le token temporaire côté serveur ;
   - applique le rate limiting ;
   - respecte le cooldown ;
   - génère un nouvel OTP côté service ;
   - invalide l'ancien OTP ;
   - envoie le nouveau code ;
   - ne retourne jamais le code au navigateur.
   ============================================================ */

export async function resendGestionnaireVerificationCodeAction(
  _previousState:
    VerificationActionState,

  _formData:
    FormData,
): Promise<VerificationActionState> {
  /*
   * Ces deux paramètres sont imposés par le contrat
   * useActionState().
   *
   * Cette action de renvoi n'a besoin ni de l'ancien state
   * ni des données du formulaire.
   */
  void _previousState;
  void _formData;


  /* ----------------------------------------------------------
     1. READ PENDING VERIFICATION TOKEN
     ---------------------------------------------------------- */

  const pendingVerificationToken =
    await getPendingVerificationToken();


  /* ----------------------------------------------------------
     2. NO PENDING SESSION
     ---------------------------------------------------------- */

  if (
    !pendingVerificationToken
  ) {
    redirect(
      routes.gestionnaire.register,
    );
  }


  /* ----------------------------------------------------------
     3. RESEND OTP SERVER-SIDE
     ---------------------------------------------------------- */

  let resendResult:
    Awaited<
      ReturnType<
        typeof resendGestionnaireVerificationCode
      >
    >;


  try {
    resendResult =
      await resendGestionnaireVerificationCode({
        pendingVerificationToken,
      });
  } catch {
    return createVerificationError({
      message:
        "Le nouveau code n’a pas pu être envoyé. Veuillez réessayer dans quelques instants.",
    });
  }


  /* ----------------------------------------------------------
     4. FAILURE
     ---------------------------------------------------------- */

  if (
    !resendResult.ok
  ) {
    return mapResendFailure(
      resendResult.code,
      resendResult
        .retryAfterSeconds,
    );
  }


  /* ----------------------------------------------------------
     5. SUCCESS
     ----------------------------------------------------------
     Le navigateur reçoit uniquement :

     - le message de succès ;
     - le cooldown.

     Il ne reçoit jamais le nouvel OTP.
     ---------------------------------------------------------- */

  return {
    status:
      "success",

    message:
      "Un nouveau code de vérification a été envoyé par e-mail.",

    codeError:
      null,

    resendCooldownSeconds:
      resendResult
        .cooldownSeconds,
  };
}