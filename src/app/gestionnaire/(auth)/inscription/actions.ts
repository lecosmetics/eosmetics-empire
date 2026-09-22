"use server";

import {
  redirect,
} from "next/navigation";

import {
  routes,
} from "@/config/routes";

import {
  validateGestionnaireRegistration,
  type GestionnaireRegistrationInput,
} from "@/lib/validation/gestionnaire-registration";

import {
  registerGestionnaire,
  type RegistrationServiceFailureCode,
} from "@/server/gestionnaire/registration-service";

import {
  setPendingVerificationSession,
} from "@/server/gestionnaire/session";


/* ============================================================
   L&E COSMETICS EMPIRE
   INSCRIPTION GESTIONNAIRE — SERVER ACTIONS
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/inscription/actions.ts

   Route :
   /gestionnaire/inscription

   RESPONSABILITÉS :

   - recevoir les données envoyées par RegistrationForm ;
   - lire et normaliser le FormData ;
   - refaire les validations côté serveur ;
   - déléguer toute logique sensible au service serveur ;
   - ne jamais exposer le code représentant officiel ;
   - ne jamais retourner le mot de passe ;
   - ne jamais retourner son hash ;
   - ne jamais retourner l'OTP ;
   - créer la session temporaire de vérification ;
   - rediriger vers /gestionnaire/verification.

   IMPORTANT — NEXT.JS :

   Un fichier contenant "use server" ne doit exporter comme
   valeurs runtime que des fonctions async.

   Sont donc autorisés ici :

   - export type ...
   - export async function ...

   Aucun objet runtime n'est exporté depuis ce fichier.
   ============================================================ */


/* ============================================================
   FIELD NAMES
   ============================================================ */

export type RegistrationFieldName =
  | "shopName"
  | "country"
  | "city"
  | "shopAddress"
  | "phone"
  | "email"
  | "representativeCode"
  | "password"
  | "passwordConfirmation";


/* ============================================================
   FIELD ERRORS
   ============================================================ */

export type RegistrationFieldErrors =
  Partial<
    Record<
      RegistrationFieldName,
      string
    >
  >;


/* ============================================================
   SAFE VALUES
   ------------------------------------------------------------
   Seules les données non sensibles peuvent revenir au client
   après une erreur.

   Ne sont jamais retournés :

   - representativeCode ;
   - password ;
   - passwordConfirmation.
   ============================================================ */

export type RegistrationSafeValues =
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
  }>;


/* ============================================================
   ACTION STATE
   ------------------------------------------------------------
   Type uniquement.

   L'état initial réel doit être créé côté composant client
   RegistrationForm.tsx.
   ============================================================ */

export type RegistrationActionState =
  Readonly<{
    status:
      | "idle"
      | "error";

    message:
      string | null;

    fieldErrors:
      RegistrationFieldErrors;

    values:
      RegistrationSafeValues;
  }>;


/* ============================================================
   READ STRING FROM FORMDATA
   ============================================================ */

function readFormString(
  formData:
    FormData,

  fieldName:
    RegistrationFieldName,
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
   NORMALIZE REGISTRATION INPUT
   ------------------------------------------------------------
   Les champs textuels ordinaires sont normalisés.

   Les mots de passe ne sont volontairement jamais trim() afin
   de respecter exactement la valeur saisie par l'utilisateur.
   ============================================================ */

function getRegistrationInput(
  formData:
    FormData,
): GestionnaireRegistrationInput {
  return {
    shopName:
      readFormString(
        formData,
        "shopName",
      ).trim(),

    country:
      readFormString(
        formData,
        "country",
      )
        .trim()
        .toUpperCase(),

    city:
      readFormString(
        formData,
        "city",
      ).trim(),

    shopAddress:
      readFormString(
        formData,
        "shopAddress",
      ).trim(),

    phone:
      readFormString(
        formData,
        "phone",
      ).trim(),

    email:
      readFormString(
        formData,
        "email",
      )
        .trim()
        .toLowerCase(),

    representativeCode:
      readFormString(
        formData,
        "representativeCode",
      ).trim(),

    password:
      readFormString(
        formData,
        "password",
      ),

    passwordConfirmation:
      readFormString(
        formData,
        "passwordConfirmation",
      ),
  };
}


/* ============================================================
   CREATE SAFE VALUES
   ============================================================ */

function getSafeValues(
  input:
    GestionnaireRegistrationInput,
): RegistrationSafeValues {
  return {
    shopName:
      input.shopName,

    country:
      input.country,

    city:
      input.city,

    shopAddress:
      input.shopAddress,

    phone:
      input.phone,

    email:
      input.email,
  };
}


/* ============================================================
   CREATE ERROR STATE
   ============================================================ */

function createErrorState(
  values:
    RegistrationSafeValues,

  options?: Readonly<{
    message?:
      string | null;

    fieldErrors?:
      RegistrationFieldErrors;
  }>,
): RegistrationActionState {
  return {
    status:
      "error",

    message:
      options?.message ??
      null,

    fieldErrors:
      options?.fieldErrors ??
      {},

    values,
  };
}


/* ============================================================
   FORMAT RETRY DELAY
   ============================================================ */

function createRetryMessage(
  retryAfterSeconds?:
    number | null,
): string {
  if (
    !retryAfterSeconds ||
    retryAfterSeconds <= 0
  ) {
    return (
      "Trop de tentatives ont été effectuées. " +
      "Veuillez patienter quelques instants avant de réessayer."
    );
  }


  if (
    retryAfterSeconds <
    60
  ) {
    return (
      `Trop de tentatives ont été effectuées. ` +
      `Veuillez patienter environ ${retryAfterSeconds} seconde${
        retryAfterSeconds > 1
          ? "s"
          : ""
      } avant de réessayer.`
    );
  }


  const minutes =
    Math.max(
      1,
      Math.ceil(
        retryAfterSeconds /
          60,
      ),
    );


  return (
    `Trop de tentatives ont été effectuées. ` +
    `Veuillez patienter environ ${minutes} minute${
      minutes > 1
        ? "s"
        : ""
    } avant de réessayer.`
  );
}


/* ============================================================
   SERVICE FAILURE → SAFE USER ERROR
   ------------------------------------------------------------
   Les codes internes ne sont jamais retournés directement au
   navigateur.

   Seuls des messages métier contrôlés sont produits.
   ============================================================ */

function mapServiceFailure(
  code:
    RegistrationServiceFailureCode,

  values:
    RegistrationSafeValues,

  retryAfterSeconds?:
    number | null,
): RegistrationActionState {
  switch (code) {
    /* --------------------------------------------------------
       INVALID REPRESENTATIVE CODE
       -------------------------------------------------------- */

    case "INVALID_REPRESENTATIVE_CODE":
      return createErrorState(
        values,
        {
          fieldErrors: {
            representativeCode:
              "Code représentant invalide.",
          },
        },
      );


    /* --------------------------------------------------------
       EMAIL ALREADY USED
       -------------------------------------------------------- */

    case "EMAIL_ALREADY_USED":
      return createErrorState(
        values,
        {
          fieldErrors: {
            email:
              "Cette adresse e-mail est déjà utilisée.",
          },
        },
      );


    /* --------------------------------------------------------
       RATE LIMIT
       -------------------------------------------------------- */

    case "RATE_LIMITED":
      return createErrorState(
        values,
        {
          message:
            createRetryMessage(
              retryAfterSeconds,
            ),
        },
      );


    /* --------------------------------------------------------
       EMAIL DELIVERY FAILURE
       -------------------------------------------------------- */

    case "EMAIL_DELIVERY_FAILED":
      return createErrorState(
        values,
        {
          message:
            "Le code de vérification n’a pas pu être envoyé. Veuillez vérifier votre adresse e-mail puis réessayer dans quelques instants.",
        },
      );


    /* --------------------------------------------------------
       SERVER CONFIGURATION / SERVICE UNAVAILABLE
       -------------------------------------------------------- */

    case "REGISTRATION_UNAVAILABLE":
      return createErrorState(
        values,
        {
          message:
            "L’inscription est temporairement indisponible. Veuillez réessayer dans quelques instants.",
        },
      );


    /* --------------------------------------------------------
       SAFE FALLBACK
       -------------------------------------------------------- */

    case "UNKNOWN":
    default:
      return createErrorState(
        values,
        {
          message:
            "Une erreur est survenue pendant l’inscription. Veuillez réessayer.",
        },
      );
  }
}


/* ============================================================
   REGISTER GESTIONNAIRE ACTION
   ------------------------------------------------------------
   PARCOURS :

   FormData
       ↓
   extraction / normalisation
       ↓
   validation serveur
       ↓
   registration-service.ts
       ↓
   rate limiting
       ↓
   vérification code représentant
       ↓
   hash Argon2id du mot de passe
       ↓
   ManagerRegistration
       ↓
   OTP sécurisé
       ↓
   envoi Resend
       ↓
   cookie HttpOnly temporaire
       ↓
   /gestionnaire/verification
   ============================================================ */

export async function registerGestionnaireAction(
  _previousState:
    RegistrationActionState,

  formData:
    FormData,
): Promise<RegistrationActionState> {
  /*
   * Ce paramètre est imposé par useActionState().
   *
   * Cette action ne dépend pas de l'état précédent.
   */
  void _previousState;


  /* ----------------------------------------------------------
     1. READ / NORMALIZE INPUT
     ---------------------------------------------------------- */

  const input =
    getRegistrationInput(
      formData,
    );


  /* ----------------------------------------------------------
     2. CREATE SAFE RETURN VALUES
     ---------------------------------------------------------- */

  const safeValues =
    getSafeValues(
      input,
    );


  /* ----------------------------------------------------------
     3. COMPLETE SERVER-SIDE VALIDATION
     ---------------------------------------------------------- */

  const validation =
    validateGestionnaireRegistration(
      input,
    );


  if (
    !validation.success
  ) {
    return createErrorState(
      safeValues,
      {
        fieldErrors:
          validation.fieldErrors,
      },
    );
  }


  /* ----------------------------------------------------------
     4. REGISTRATION SERVICE
     ----------------------------------------------------------
     Ce service prend en charge :

     - rate limiting ;
     - code représentant ;
     - duplication d'e-mail ;
     - Argon2id ;
     - Prisma / Supabase ;
     - OTP ;
     - expiration ;
     - token temporaire ;
     - Resend.

     Aucun secret n'est traité dans le composant client.
     ---------------------------------------------------------- */

  let result:
    Awaited<
      ReturnType<
        typeof registerGestionnaire
      >
    >;


  try {
    result =
      await registerGestionnaire(
        validation.data,
      );
  } catch {
    /*
     * Ne jamais logger ici :
     *
     * - FormData complet ;
     * - password ;
     * - passwordConfirmation ;
     * - representativeCode ;
     * - OTP ;
     * - pendingVerificationToken.
     */

    return createErrorState(
      safeValues,
      {
        message:
          "Une erreur est survenue pendant l’inscription. Veuillez réessayer.",
      },
    );
  }


  /* ----------------------------------------------------------
     5. REGISTRATION FAILURE
     ---------------------------------------------------------- */

  if (
    !result.ok
  ) {
    return mapServiceFailure(
      result.code,
      safeValues,
      result.retryAfterSeconds,
    );
  }


  /* ----------------------------------------------------------
     6. CREATE PENDING VERIFICATION COOKIE
     ----------------------------------------------------------
     registration-service.ts retourne uniquement un token
     opaque temporaire.

     session.ts le place dans un cookie :

     - HttpOnly ;
     - Secure en production ;
     - SameSite=Lax ;
     - path=/gestionnaire ;
     - durée courte.

     Le token n'est jamais ajouté dans l'URL.
     ---------------------------------------------------------- */

  try {
    await setPendingVerificationSession(
      result
        .pendingVerificationToken,
    );
  } catch {
    /*
     * À ce stade l'inscription temporaire peut déjà exister en
     * base et l'e-mail peut déjà avoir été envoyé.

     * On ne révèle aucune donnée interne au navigateur.
     */

    return createErrorState(
      safeValues,
      {
        message:
          "Votre inscription a été reçue, mais la session de vérification n’a pas pu être préparée. Veuillez réessayer.",
      },
    );
  }


  /* ----------------------------------------------------------
     7. REDIRECT
     ----------------------------------------------------------
     redirect() reste impérativement hors try/catch.

     Next.js l'implémente via une interruption interne contrôlée
     qui ne doit pas être transformée en erreur métier.
     ---------------------------------------------------------- */

  redirect(
    routes.gestionnaire
      .verification,
  );
}