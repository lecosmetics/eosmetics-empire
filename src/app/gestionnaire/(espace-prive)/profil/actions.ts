"use server";

import argon2 from "argon2";

import {
  revalidatePath,
} from "next/cache";

import {
  db,
} from "@/prisma/db";

import {
  getCountryByCode,
} from "@/config/countries";

import {
  getGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import type {
  GestionnaireProfileContactActionState,
  GestionnaireProfileContactFieldErrors,
  GestionnaireProfileContactValues,
  GestionnaireProfilePasswordActionState,
  GestionnaireProfilePasswordFieldErrors,
} from "@/lib/gestionnaire/profil/profile-types";

import {
  clearGestionnaireSession,
} from "@/server/gestionnaire/session";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL — SERVER ACTIONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/profil/actions.ts
 *
 * RESPONSABILITÉS :
 *
 * - mettre à jour les coordonnées réelles de la boutique ;
 * - changer le mot de passe du Gestionnaire connecté ;
 * - récupérer managerId et storeId uniquement depuis la session ;
 * - réutiliser le catalogue pays existant ;
 * - normaliser le téléphone côté serveur ;
 * - vérifier le mot de passe actuel avec Argon2 ;
 * - générer le nouveau hash Argon2id ;
 * - mettre à jour passwordChangedAt ;
 * - invalider la session après changement de mot de passe ;
 * - journaliser les opérations sensibles ;
 * - ne jamais retourner de mot de passe ou de hash au navigateur ;
 * - ne jamais exposer une erreur Prisma/PostgreSQL au navigateur.
 *
 *
 * IMPORTANT :
 *
 * Ces actions ne permettent PAS de modifier :
 *
 * - managerId ;
 * - storeId ;
 * - rôle ;
 * - statut Manager ;
 * - statut Store ;
 * - e-mail de connexion ;
 * - nom de la boutique.
 *
 * managerId et storeId sont toujours reconstruits côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES EXISTANTES
   ========================================================================== */

const PROFILE_ROUTE =
  "/gestionnaire/profil";


const DASHBOARD_ROUTE =
  "/gestionnaire/dashboard";


/* ==========================================================================
   FORM FIELDS — CONTACT
   ========================================================================== */

const CONTACT_FIELD_PHONE =
  "phone";


const CONTACT_FIELD_COUNTRY =
  "country";


const CONTACT_FIELD_CITY =
  "city";


const CONTACT_FIELD_ADDRESS =
  "address";


/* ==========================================================================
   FORM FIELDS — PASSWORD
   ========================================================================== */

const PASSWORD_FIELD_CURRENT =
  "currentPassword";


const PASSWORD_FIELD_NEW =
  "newPassword";


const PASSWORD_FIELD_CONFIRMATION =
  "newPasswordConfirmation";


/* ==========================================================================
   LIMITES — CONTACT
   ========================================================================== */

const PHONE_MAX_LENGTH =
  30;


const CITY_MIN_LENGTH =
  2;


const CITY_MAX_LENGTH =
  100;


const ADDRESS_MIN_LENGTH =
  5;


const ADDRESS_MAX_LENGTH =
  200;


/* ==========================================================================
   LIMITES — MOT DE PASSE
   ========================================================================== */

const PASSWORD_MIN_LENGTH =
  10;


const PASSWORD_MAX_LENGTH =
  128;


/* ==========================================================================
   ARGON2
   ========================================================================== */

/**
 * Même configuration Argon2id que celle utilisée par le parcours
 * d'inscription Gestionnaire.
 */

const PASSWORD_HASH_OPTIONS = {
  type:
    argon2.argon2id,

  memoryCost:
    65_536,

  timeCost:
    3,

  parallelism:
    1,
} as const;


/* ==========================================================================
   VALIDATION
   ========================================================================== */

const CITY_PATTERN =
  /^[\p{L}\p{M}\d.' -]+$/u;


const E164_PHONE_PATTERN =
  /^\+[1-9]\d{6,14}$/;


/* ==========================================================================
   COUNTRY TYPE
   ========================================================================== */

/**
 * On dérive volontairement le type directement depuis getCountryByCode().
 *
 * Aucun nouveau type pays n'est inventé ici.
 */

type ProfileCountry =
  NonNullable<
    ReturnType<
      typeof getCountryByCode
    >
  >;


/* ==========================================================================
   FORM DATA
   ========================================================================== */

function readFormDataString(
  formData:
    FormData,

  fieldName:
    string,

  options?: Readonly<{
    trim?:
      boolean;
  }>,
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


  if (
    options?.trim ===
    false
  ) {
    return value;
  }


  return value.trim();
}


/* ==========================================================================
   CONTROL CHARACTERS
   ========================================================================== */

function containsControlCharacters(
  value:
    string,
): boolean {
  return /[\u0000-\u001F\u007F]/.test(
    value,
  );
}


/* ==========================================================================
   NORMALISATION TEXTUELLE
   ========================================================================== */

function normalizeText(
  value:
    string,
): string {
  return value
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}


/* ==========================================================================
   TÉLÉPHONE — CHIFFRES
   ========================================================================== */

function getPhoneDigits(
  value:
    string,
): string {
  return value.replace(
    /\D/g,
    "",
  );
}


/* ==========================================================================
   TÉLÉPHONE — NORMALISATION INTERNATIONALE
   ========================================================================== */

/**
 * Cette fonction utilise uniquement :
 *
 * - country.code ;
 * - country.dialCode.
 *
 * Elle ne dépend d'aucun autre export de countries.ts.
 */

function normalizeProfilePhoneNumber(
  country:
    ProfileCountry,

  phone:
    string,
): string {
  const dialCodeDigits =
    getPhoneDigits(
      country.dialCode,
    );


  let phoneDigits =
    getPhoneDigits(
      phone,
    );


  if (
    !dialCodeDigits ||
    !phoneDigits
  ) {
    return "";
  }


  /* ------------------------------------------------------------------------
     NUMÉRO DÉJÀ INTERNATIONAL
     ------------------------------------------------------------------------ */

  if (
    phoneDigits.startsWith(
      dialCodeDigits,
    ) &&
    phoneDigits.length >
      dialCodeDigits.length
  ) {
    phoneDigits =
      phoneDigits.slice(
        dialCodeDigits.length,
      );
  }


  /* ------------------------------------------------------------------------
     PRÉFIXE NATIONAL
     ------------------------------------------------------------------------
     
     Dans la majorité des pays, le zéro national initial disparaît
     lorsque l'indicatif international est ajouté.
     
     L'Italie est conservée comme exception afin de ne pas supprimer
     un zéro pouvant faire partie du numéro.
     ------------------------------------------------------------------------ */

  if (
    country.code !==
    "IT"
  ) {
    phoneDigits =
      phoneDigits.replace(
        /^0+/,
        "",
      );
  }


  if (
    !phoneDigits
  ) {
    return "";
  }


  /* ------------------------------------------------------------------------
     E.164 = 15 CHIFFRES MAXIMUM
     ------------------------------------------------------------------------ */

  const maximumNationalLength =
    Math.max(
      15 -
        dialCodeDigits.length,
      0,
    );


  const nationalDigits =
    phoneDigits.slice(
      0,
      maximumNationalLength,
    );


  if (
    !nationalDigits
  ) {
    return "";
  }


  return `+${dialCodeDigits}${nationalDigits}`;
}


/* ==========================================================================
   TÉLÉPHONE — VALIDATION
   ========================================================================== */

function isValidProfilePhoneNumber(
  country:
    ProfileCountry,

  phone:
    string,
): boolean {
  const normalizedPhone =
    normalizeProfilePhoneNumber(
      country,
      phone,
    );


  if (
    !E164_PHONE_PATTERN.test(
      normalizedPhone,
    )
  ) {
    return false;
  }


  const expectedDialCode =
    `+${getPhoneDigits(
      country.dialCode,
    )}`;


  return normalizedPhone.startsWith(
    expectedDialCode,
  );
}


/* ==========================================================================
   CONTACT VALUES
   ========================================================================== */

function readContactValues(
  formData:
    FormData,
): GestionnaireProfileContactValues {
  return {
    phone:
      readFormDataString(
        formData,
        CONTACT_FIELD_PHONE,
      ),

    country:
      readFormDataString(
        formData,
        CONTACT_FIELD_COUNTRY,
      )
        .toUpperCase(),

    city:
      normalizeText(
        readFormDataString(
          formData,
          CONTACT_FIELD_CITY,
        ),
      ),

    address:
      normalizeText(
        readFormDataString(
          formData,
          CONTACT_FIELD_ADDRESS,
        ),
      ),
  };
}


/* ==========================================================================
   CONTACT ERROR STATE
   ========================================================================== */

function createContactErrorState(
  params:
    Readonly<{
      code:
        GestionnaireProfileContactActionState["code"];

      message:
        string;

      values:
        GestionnaireProfileContactValues;

      fieldErrors?:
        GestionnaireProfileContactFieldErrors;
    }>,
): GestionnaireProfileContactActionState {
  return {
    status:
      "error",

    message:
      params.message,

    code:
      params.code,

    fieldErrors:
      params.fieldErrors ??
      {},

    values:
      params.values,
  };
}


/* ==========================================================================
   CONTACT SUCCESS STATE
   ========================================================================== */

function createContactSuccessState(
  values:
    GestionnaireProfileContactValues,
): GestionnaireProfileContactActionState {
  return {
    status:
      "success",

    message:
      "Les informations de contact ont été mises à jour avec succès.",

    code:
      null,

    fieldErrors:
      {},

    values,
  };
}


/* ==========================================================================
   PASSWORD ERROR STATE
   ========================================================================== */

function createPasswordErrorState(
  params:
    Readonly<{
      code:
        GestionnaireProfilePasswordActionState["code"];

      message:
        string;

      fieldErrors?:
        GestionnaireProfilePasswordFieldErrors;
    }>,
): GestionnaireProfilePasswordActionState {
  return {
    status:
      "error",

    message:
      params.message,

    code:
      params.code,

    fieldErrors:
      params.fieldErrors ??
      {},
  };
}


/* ==========================================================================
   PASSWORD SUCCESS STATE
   ========================================================================== */

function createPasswordSuccessState():
  GestionnaireProfilePasswordActionState {
  return {
    status:
      "success",

    message:
      "Votre mot de passe a été modifié. Vous devez maintenant vous reconnecter.",

    code:
      null,

    fieldErrors:
      {},
  };
}


/* ==========================================================================
   CONTACT VALIDATION
   ========================================================================== */

function validateContactValues(
  values:
    GestionnaireProfileContactValues,
): Readonly<{
  valid:
    boolean;

  values:
    GestionnaireProfileContactValues;

  errors:
    GestionnaireProfileContactFieldErrors;
}> {
  const errors:
    GestionnaireProfileContactFieldErrors = {};


  /* ------------------------------------------------------------------------
     COUNTRY
     ------------------------------------------------------------------------ */

  const country =
    getCountryByCode(
      values.country,
    );


  if (
    !country
  ) {
    errors.country =
      "Sélectionnez un pays valide.";
  }


  /* ------------------------------------------------------------------------
     CITY
     ------------------------------------------------------------------------ */

  if (
    values.city.length <
    CITY_MIN_LENGTH
  ) {
    errors.city =
      `La ville doit contenir au moins ${CITY_MIN_LENGTH} caractères.`;
  } else if (
    values.city.length >
    CITY_MAX_LENGTH
  ) {
    errors.city =
      `La ville ne doit pas dépasser ${CITY_MAX_LENGTH} caractères.`;
  } else if (
    containsControlCharacters(
      values.city,
    ) ||
    !CITY_PATTERN.test(
      values.city,
    )
  ) {
    errors.city =
      "La ville contient des caractères non autorisés.";
  }


  /* ------------------------------------------------------------------------
     ADDRESS
     ------------------------------------------------------------------------ */

  if (
    values.address.length <
    ADDRESS_MIN_LENGTH
  ) {
    errors.address =
      `L’adresse doit contenir au moins ${ADDRESS_MIN_LENGTH} caractères.`;
  } else if (
    values.address.length >
    ADDRESS_MAX_LENGTH
  ) {
    errors.address =
      `L’adresse ne doit pas dépasser ${ADDRESS_MAX_LENGTH} caractères.`;
  } else if (
    containsControlCharacters(
      values.address,
    )
  ) {
    errors.address =
      "L’adresse contient des caractères non autorisés.";
  }


  /* ------------------------------------------------------------------------
     PHONE
     ------------------------------------------------------------------------ */

  let normalizedPhone =
    values.phone;


  if (
    !values.phone
  ) {
    errors.phone =
      "Le numéro de téléphone est requis.";
  } else if (
    values.phone.length >
    PHONE_MAX_LENGTH
  ) {
    errors.phone =
      "Le numéro de téléphone est trop long.";
  } else if (
    country
  ) {
    try {
      normalizedPhone =
        normalizeProfilePhoneNumber(
          country,
          values.phone,
        );


      if (
        !isValidProfilePhoneNumber(
          country,
          values.phone,
        ) ||
        !E164_PHONE_PATTERN.test(
          normalizedPhone,
        )
      ) {
        errors.phone =
          `Saisissez un numéro de téléphone valide pour ${country.name}.`;
      }
    } catch {
      errors.phone =
        "Le numéro de téléphone n’est pas valide.";
    }
  }


  /* ------------------------------------------------------------------------
     RESULT
     ------------------------------------------------------------------------ */

  return {
    valid:
      Object.keys(
        errors,
      ).length ===
      0,

    errors,

    values: {
      phone:
        normalizedPhone,

      country:
        country?.code ??
        values.country,

      city:
        values.city,

      address:
        values.address,
    },
  };
}


/* ==========================================================================
   PASSWORD VALIDATION
   ========================================================================== */

function validatePasswordInput(
  params:
    Readonly<{
      currentPassword:
        string;

      newPassword:
        string;

      newPasswordConfirmation:
        string;
    }>,
): GestionnaireProfilePasswordFieldErrors {
  const errors:
    GestionnaireProfilePasswordFieldErrors = {};


  /* ------------------------------------------------------------------------
     CURRENT PASSWORD
     ------------------------------------------------------------------------ */

  if (
    !params.currentPassword
  ) {
    errors.currentPassword =
      "Saisissez votre mot de passe actuel.";
  } else if (
    params.currentPassword.length >
    PASSWORD_MAX_LENGTH
  ) {
    errors.currentPassword =
      "Le mot de passe actuel est invalide.";
  }


  /* ------------------------------------------------------------------------
     NEW PASSWORD
     ------------------------------------------------------------------------ */

  if (
    !params.newPassword
  ) {
    errors.newPassword =
      "Saisissez votre nouveau mot de passe.";
  } else if (
    params.newPassword.length <
    PASSWORD_MIN_LENGTH
  ) {
    errors.newPassword =
      `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`;
  } else if (
    params.newPassword.length >
    PASSWORD_MAX_LENGTH
  ) {
    errors.newPassword =
      `Le nouveau mot de passe ne doit pas dépasser ${PASSWORD_MAX_LENGTH} caractères.`;
  } else if (
    containsControlCharacters(
      params.newPassword,
    )
  ) {
    errors.newPassword =
      "Le nouveau mot de passe contient des caractères non autorisés.";
  }


  /* ------------------------------------------------------------------------
     CONFIRMATION
     ------------------------------------------------------------------------ */

  if (
    !params.newPasswordConfirmation
  ) {
    errors.newPasswordConfirmation =
      "Confirmez votre nouveau mot de passe.";
  } else if (
    params.newPasswordConfirmation.length >
    PASSWORD_MAX_LENGTH
  ) {
    errors.newPasswordConfirmation =
      "La confirmation du mot de passe est trop longue.";
  } else if (
    params.newPassword !==
    params.newPasswordConfirmation
  ) {
    errors.newPasswordConfirmation =
      "Les deux nouveaux mots de passe ne correspondent pas.";
  }


  /* ------------------------------------------------------------------------
     SAME PASSWORD
     ------------------------------------------------------------------------ */

  if (
    params.currentPassword &&
    params.newPassword &&
    params.currentPassword ===
      params.newPassword
  ) {
    errors.newPassword =
      "Le nouveau mot de passe doit être différent du mot de passe actuel.";
  }


  return errors;
}


/* ==========================================================================
   PASSWORD VALIDATION ERROR CODE
   ========================================================================== */

function getPasswordValidationErrorCode(
  params:
    Readonly<{
      currentPassword:
        string;

      newPassword:
        string;

      newPasswordConfirmation:
        string;

      errors:
        GestionnaireProfilePasswordFieldErrors;
    }>,
): GestionnaireProfilePasswordActionState["code"] {
  if (
    params.currentPassword &&
    params.newPassword &&
    params.currentPassword ===
      params.newPassword
  ) {
    return "PASSWORD_UNCHANGED";
  }


  if (
    params.newPassword !==
      params.newPasswordConfirmation &&
    Boolean(
      params.errors
        .newPasswordConfirmation,
    )
  ) {
    return "PASSWORD_MISMATCH";
  }


  if (
    Boolean(
      params.errors
        .newPassword,
    )
  ) {
    return "PASSWORD_TOO_WEAK";
  }


  return "INVALID_INPUT";
}


/* ==========================================================================
   PASSWORD VERIFY
   ========================================================================== */

async function verifyPassword(
  passwordHash:
    string,

  password:
    string,
): Promise<boolean> {
  try {
    return await argon2.verify(
      passwordHash,
      password,
    );
  } catch {
    return false;
  }
}


/* ==========================================================================
   PASSWORD HASH
   ========================================================================== */

async function hashPassword(
  password:
    string,
): Promise<string> {
  return argon2.hash(
    password,
    PASSWORD_HASH_OPTIONS,
  );
}


/* ==========================================================================
   DB ERROR CODE
   ========================================================================== */

function getDatabaseErrorCode(
  error:
    unknown,
): string | null {
  if (
    typeof error !==
      "object" ||
    error ===
      null ||
    !(
      "code" in error
    )
  ) {
    return null;
  }


  const rawCode =
    (
      error as {
        readonly code?:
          unknown;
      }
    ).code;


  if (
    typeof rawCode !==
    "string"
  ) {
    return null;
  }


  const normalizedCode =
    rawCode.trim();


  if (
    !normalizedCode
  ) {
    return null;
  }


  return normalizedCode.slice(
    0,
    32,
  );
}


/* ==========================================================================
   LOG ERREUR
   ========================================================================== */

function logProfileActionError(
  action:
    "CONTACT_UPDATE" |
    "PASSWORD_CHANGE",

  error:
    unknown,
): void {
  console.error(
    `[L&E Cosmetics Empire][GestionnaireProfile][${action}] Échec de l’opération.`,
    {
      errorName:
        error instanceof Error
          ? error.name
          : "UnknownError",

      databaseCode:
        getDatabaseErrorCode(
          error,
        ),
    },
  );
}


/* ==========================================================================
   REVALIDATION
   ========================================================================== */

function safeRevalidateProfileRoutes():
  void {
  try {
    revalidatePath(
      PROFILE_ROUTE,
    );


    revalidatePath(
      DASHBOARD_ROUTE,
    );
  } catch (
    error
  ) {
    console.error(
      "[L&E Cosmetics Empire][GestionnaireProfile] Revalidation impossible.",
      {
        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );
  }
}


/* ==========================================================================
   SERVER ACTION — CONTACT
   ========================================================================== */

/**
 * Met à jour uniquement :
 *
 * - téléphone boutique ;
 * - pays boutique ;
 * - ville boutique ;
 * - adresse boutique.
 *
 * Le navigateur ne fournit jamais :
 *
 * - managerId ;
 * - storeId ;
 * - rôle ;
 * - statut.
 */

export async function updateGestionnaireProfileContactAction(
  _previousState:
    GestionnaireProfileContactActionState,

  formData:
    FormData,
): Promise<GestionnaireProfileContactActionState> {
  /* =========================================================================
     1. VALEURS
     ========================================================================= */

  const submittedValues =
    readContactValues(
      formData,
    );


  /* =========================================================================
     2. VALIDATION
     ========================================================================= */

  const validation =
    validateContactValues(
      submittedValues,
    );


  if (
    !validation.valid
  ) {
    const hasCountryError =
      Boolean(
        validation
          .errors
          .country,
      );


    const hasPhoneError =
      Boolean(
        validation
          .errors
          .phone,
      );


    return createContactErrorState({
      code:
        hasCountryError
          ? "UNSUPPORTED_COUNTRY"
          : hasPhoneError
            ? "INVALID_PHONE"
            : "INVALID_INPUT",

      message:
        "Certaines informations doivent être corrigées avant l’enregistrement.",

      fieldErrors:
        validation.errors,

      values:
        submittedValues,
    });
  }


  /* =========================================================================
     3. SESSION PRIVÉE
     ========================================================================= */

  const access =
    await getGestionnairePrivateAccess();


  if (
    !access
  ) {
    return createContactErrorState({
      code:
        "UNAUTHENTICATED",

      message:
        "Votre session n’est plus valide. Reconnectez-vous avant de continuer.",

      values:
        validation.values,
    });
  }


  const managerId =
    access.manager.id.trim();


  const storeId =
    access.store.id.trim();


  if (
    !managerId ||
    !storeId
  ) {
    return createContactErrorState({
      code:
        "UNAUTHENTICATED",

      message:
        "Votre session n’est plus valide. Reconnectez-vous avant de continuer.",

      values:
        validation.values,
    });
  }


  try {
    /* =======================================================================
       4. TRANSACTION
       ======================================================================= */

    const updated =
      await db.$transaction(
        async (
          tx,
        ) => {
          /* ----------------------------------------------------------------
             MANAGER + APPARTENANCE
             ---------------------------------------------------------------- */

          const manager =
            await tx.manager.findFirst({
              where: {
                id:
                  managerId,

                storeId,

                status:
                  "ACTIVE",

                emailVerifiedAt: {
                  not:
                    null,
                },

                store: {
                  is: {
                    id:
                      storeId,

                    status:
                      "ACTIVE",
                  },
                },
              },

              select: {
                id:
                  true,

                storeId:
                  true,
              },
            });


          if (
            !manager ||
            manager.storeId !==
              storeId
          ) {
            return false;
          }


          /* ----------------------------------------------------------------
             UPDATE STORE
             ---------------------------------------------------------------- */

          const result =
            await tx.store.updateMany({
              where: {
                id:
                  storeId,

                status:
                  "ACTIVE",
              },

              data: {
                phone:
                  validation
                    .values
                    .phone,

                country:
                  validation
                    .values
                    .country,

                city:
                  validation
                    .values
                    .city,

                address:
                  validation
                    .values
                    .address,
              },
            });


          if (
            result.count !==
            1
          ) {
            return false;
          }


          /* ----------------------------------------------------------------
             AUDIT LOG
             ---------------------------------------------------------------- */

          await tx.auditLog.create({
            data: {
              storeId,

              managerId,

              action:
                "UPDATE",

              entityType:
                "STORE_PROFILE",

              entityId:
                storeId,

              metadata: {
                source:
                  "GESTIONNAIRE_PROFILE",

                fields: [
                  "phone",
                  "country",
                  "city",
                  "address",
                ],
              },
            },
          });


          return true;
        },
      );


    /* =======================================================================
       5. STORE INTROUVABLE / ACCÈS MODIFIÉ
       ======================================================================= */

    if (
      !updated
    ) {
      return createContactErrorState({
        code:
          "STORE_NOT_FOUND",

        message:
          "La boutique n’est plus disponible ou votre accès a été modifié.",

        values:
          validation.values,
      });
    }


    /* =======================================================================
       6. REVALIDATION
       ======================================================================= */

    safeRevalidateProfileRoutes();


    /* =======================================================================
       7. SUCCÈS
       ======================================================================= */

    return createContactSuccessState(
      validation.values,
    );
  } catch (
    error
  ) {
    logProfileActionError(
      "CONTACT_UPDATE",
      error,
    );


    return createContactErrorState({
      code:
        "UPDATE_FAILED",

      message:
        "La mise à jour du profil n’a pas pu être effectuée. Veuillez réessayer.",

      values:
        validation.values,
    });
  }
}


/* ==========================================================================
   SERVER ACTION — CHANGEMENT DU MOT DE PASSE
   ========================================================================== */

/**
 * Cette action :
 *
 * 1. retrouve le Gestionnaire depuis sa session ;
 * 2. relit son hash actuel en base ;
 * 3. vérifie le mot de passe actuel avec Argon2 ;
 * 4. interdit la réutilisation du même mot de passe ;
 * 5. génère un nouveau hash Argon2id ;
 * 6. met à jour passwordChangedAt ;
 * 7. écrit un AuditLog ;
 * 8. supprime le cookie de session courant.
 *
 * Les mots de passe ne sont jamais retournés dans l'état du formulaire.
 */

export async function changeGestionnaireProfilePasswordAction(
  _previousState:
    GestionnaireProfilePasswordActionState,

  formData:
    FormData,
): Promise<GestionnaireProfilePasswordActionState> {
  /* =========================================================================
     1. LECTURE DES MOTS DE PASSE
     =========================================================================
     
     Les mots de passe ne sont volontairement pas trim().
     ========================================================================= */

  const currentPassword =
    readFormDataString(
      formData,
      PASSWORD_FIELD_CURRENT,
      {
        trim:
          false,
      },
    );


  const newPassword =
    readFormDataString(
      formData,
      PASSWORD_FIELD_NEW,
      {
        trim:
          false,
      },
    );


  const newPasswordConfirmation =
    readFormDataString(
      formData,
      PASSWORD_FIELD_CONFIRMATION,
      {
        trim:
          false,
      },
    );


  /* =========================================================================
     2. VALIDATION
     ========================================================================= */

  const validationErrors =
    validatePasswordInput({
      currentPassword,

      newPassword,

      newPasswordConfirmation,
    });


  if (
    Object.keys(
      validationErrors,
    ).length >
    0
  ) {
    return createPasswordErrorState({
      code:
        getPasswordValidationErrorCode({
          currentPassword,

          newPassword,

          newPasswordConfirmation,

          errors:
            validationErrors,
        }),

      message:
        "Vérifiez les informations du mot de passe avant de continuer.",

      fieldErrors:
        validationErrors,
    });
  }


  /* =========================================================================
     3. SESSION PRIVÉE
     ========================================================================= */

  const access =
    await getGestionnairePrivateAccess();


  if (
    !access
  ) {
    return createPasswordErrorState({
      code:
        "UNAUTHENTICATED",

      message:
        "Votre session n’est plus valide. Reconnectez-vous avant de continuer.",
    });
  }


  const managerId =
    access.manager.id.trim();


  const storeId =
    access.store.id.trim();


  if (
    !managerId ||
    !storeId
  ) {
    return createPasswordErrorState({
      code:
        "UNAUTHENTICATED",

      message:
        "Votre session n’est plus valide. Reconnectez-vous avant de continuer.",
    });
  }


  try {
    /* =======================================================================
       4. MANAGER + HASH ACTUEL
       ======================================================================= */

    const manager =
      await db.manager.findFirst({
        where: {
          id:
            managerId,

          storeId,

          status:
            "ACTIVE",

          emailVerifiedAt: {
            not:
              null,
          },

          store: {
            is: {
              id:
                storeId,

              status:
                "ACTIVE",
            },
          },
        },

        select: {
          id:
            true,

          storeId:
            true,

          passwordHash:
            true,
        },
      });


    if (
      !manager ||
      manager.storeId !==
        storeId
    ) {
      return createPasswordErrorState({
        code:
          "MANAGER_NOT_FOUND",

        message:
          "Votre compte Gestionnaire n’est plus disponible.",
      });
    }


    /* =======================================================================
       5. VÉRIFICATION DU MOT DE PASSE ACTUEL
       ======================================================================= */

    const currentPasswordMatches =
      await verifyPassword(
        manager.passwordHash,
        currentPassword,
      );


    if (
      !currentPasswordMatches
    ) {
      return createPasswordErrorState({
        code:
          "CURRENT_PASSWORD_INVALID",

        message:
          "Le mot de passe actuel est incorrect.",

        fieldErrors: {
          currentPassword:
            "Le mot de passe actuel est incorrect.",
        },
      });
    }


    /* =======================================================================
       6. INTERDIRE LE MÊME MOT DE PASSE
       ======================================================================= */

    const reusesCurrentPassword =
      await verifyPassword(
        manager.passwordHash,
        newPassword,
      );


    if (
      reusesCurrentPassword
    ) {
      return createPasswordErrorState({
        code:
          "PASSWORD_UNCHANGED",

        message:
          "Choisissez un nouveau mot de passe différent du mot de passe actuel.",

        fieldErrors: {
          newPassword:
            "Le nouveau mot de passe doit être différent du mot de passe actuel.",
        },
      });
    }


    /* =======================================================================
       7. NOUVEAU HASH
       ======================================================================= */

    const passwordHash =
      await hashPassword(
        newPassword,
      );


    const passwordChangedAt =
      new Date();


    /* =======================================================================
       8. TRANSACTION
       ======================================================================= */

    const changed =
      await db.$transaction(
        async (
          tx,
        ) => {
          /* ----------------------------------------------------------------
             UPDATE CONCURRENT-SAFE
             ----------------------------------------------------------------
             
             On répète passwordHash dans le WHERE.
             
             Si le mot de passe a changé depuis sa lecture, cette mutation
             n'écrase pas une modification plus récente.
             ---------------------------------------------------------------- */

          const result =
            await tx.manager.updateMany({
              where: {
                id:
                  managerId,

                storeId,

                status:
                  "ACTIVE",

                passwordHash:
                  manager.passwordHash,
              },

              data: {
                passwordHash,

                passwordChangedAt,
              },
            });


          if (
            result.count !==
            1
          ) {
            return false;
          }


          /* ----------------------------------------------------------------
             AUDIT
             ----------------------------------------------------------------
             
             Aucun mot de passe et aucun hash n'est enregistré.
             ---------------------------------------------------------------- */

          await tx.auditLog.create({
            data: {
              storeId,

              managerId,

              action:
                "PASSWORD_CHANGE",

              entityType:
                "MANAGER",

              entityId:
                managerId,

              metadata: {
                source:
                  "GESTIONNAIRE_PROFILE",
              },
            },
          });


          return true;
        },
      );


    /* =======================================================================
       9. CONFLIT
       ======================================================================= */

    if (
      !changed
    ) {
      return createPasswordErrorState({
        code:
          "UPDATE_FAILED",

        message:
          "Le mot de passe a été modifié pendant l’opération. Reconnectez-vous puis réessayez.",
      });
    }


    /* =======================================================================
       10. REVALIDATION
       ======================================================================= */

    safeRevalidateProfileRoutes();


    /* =======================================================================
       11. INVALIDATION SESSION
       =======================================================================
       
       passwordChangedAt invalide les anciennes sessions au prochain contrôle.
       
       Le cookie courant est également supprimé immédiatement.
       ======================================================================= */

    try {
      await clearGestionnaireSession();
    } catch (
      error
    ) {
      console.error(
        "[L&E Cosmetics Empire][GestionnaireProfile][PASSWORD_CHANGE] Nettoyage de session impossible.",
        {
          errorName:
            error instanceof Error
              ? error.name
              : "UnknownError",
        },
      );
    }


    /* =======================================================================
       12. SUCCÈS
       ======================================================================= */

    return createPasswordSuccessState();
  } catch (
    error
  ) {
    logProfileActionError(
      "PASSWORD_CHANGE",
      error,
    );


    return createPasswordErrorState({
      code:
        "UPDATE_FAILED",

      message:
        "Le mot de passe n’a pas pu être modifié. Veuillez réessayer.",
    });
  }
}