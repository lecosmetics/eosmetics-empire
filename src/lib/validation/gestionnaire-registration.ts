import {
  z,
} from "zod";

import {
  isSupportedCountryCode,
  normalizeCountryCode,
} from "@/config/countries";


/* ============================================================
   COSMETICS EMPIRE
   VALIDATION — INSCRIPTION GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/lib/validation/gestionnaire-registration.ts

   UTILISÉ PAR :

   src/app/gestionnaire/(auth)/inscription/actions.ts

   RESPONSABILITÉS :

   - valider toutes les données d'inscription côté serveur ;
   - normaliser les champs textuels ;
   - vérifier que le pays existe ;
   - normaliser le téléphone international ;
   - vérifier l'adresse e-mail ;
   - appliquer une politique de mot de passe raisonnable ;
   - vérifier la confirmation du mot de passe ;
   - préparer des erreurs simples pour le formulaire.

   IMPORTANT :

   CE FICHIER NE VÉRIFIE PAS LE CODE REPRÉSENTANT OFFICIEL.

   Il vérifie uniquement :

   - présence ;
   - type ;
   - taille maximale raisonnable.

   La comparaison avec le véritable secret reste exclusivement
   dans :

   src/server/gestionnaire/registration-service.ts

   Le véritable code représentant ne doit jamais être présent
   dans :

   - ce fichier ;
   - le JavaScript client ;
   - Git ;
   - NEXT_PUBLIC_*.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const SHOP_NAME_MIN_LENGTH = 2;
const SHOP_NAME_MAX_LENGTH = 120;

const CITY_MIN_LENGTH = 2;
const CITY_MAX_LENGTH = 100;

const SHOP_ADDRESS_MIN_LENGTH = 4;
const SHOP_ADDRESS_MAX_LENGTH = 220;

const EMAIL_MAX_LENGTH = 254;

const REPRESENTATIVE_CODE_MAX_LENGTH = 128;

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;


/* ============================================================
   REGISTRATION FIELD NAMES
   ============================================================ */

export type GestionnaireRegistrationField =
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
   INPUT RECEIVED FROM SERVER ACTION
   ------------------------------------------------------------
   Il s'agit de la structure reçue avant validation définitive.
   ============================================================ */

export type GestionnaireRegistrationInput =
  Readonly<{
    shopName: string;

    country: string;

    city: string;

    shopAddress: string;

    phone: string;

    email: string;

    representativeCode: string;

    password: string;

    passwordConfirmation: string;
  }>;


/* ============================================================
   FIELD ERRORS
   ============================================================ */

export type GestionnaireRegistrationFieldErrors =
  Partial<
    Record<
      GestionnaireRegistrationField,
      string
    >
  >;


/* ============================================================
   NORMALIZE SIMPLE TEXT
   ------------------------------------------------------------
   Exemple :

   "  L&E   Cosmetics Dakar  "

   devient :

   "L&E Cosmetics Dakar"
   ============================================================ */

function normalizeSimpleText(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}


/* ============================================================
   NORMALIZE ADDRESS
   ------------------------------------------------------------
   L'adresse peut être plus complexe qu'un nom simple.

   On nettoie uniquement les espaces inutiles sans modifier
   arbitrairement son contenu.
   ============================================================ */

function normalizeAddress(
  value: string,
): string {
  return value
    .trim()
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ");
}


/* ============================================================
   NORMALIZE EMAIL
   ============================================================ */

function normalizeEmail(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase();
}


/* ============================================================
   NORMALIZE INTERNATIONAL PHONE
   ------------------------------------------------------------
   Entrées acceptables :

   +237 699 12 34 56
   +237-699-123-456
   +237 (699) 123 456

   deviennent :

   +237699123456

   IMPORTANT :

   Cette fonction ne prétend pas déterminer si un numéro
   appartient réellement à une personne.

   Elle produit uniquement un format international cohérent.
   ============================================================ */

function normalizeInternationalPhone(
  value: string,
): string {
  const trimmedValue =
    value.trim();


  if (!trimmedValue) {
    return "";
  }


  /*
   * On retire uniquement les séparateurs visuels usuels.
   *
   * Les lettres ou caractères inconnus restent présents et
   * feront échouer la validation.
   */

  return trimmedValue.replace(
    /[\s().-]/g,
    "",
  );
}


/* ============================================================
   PHONE FORMAT
   ------------------------------------------------------------
   Validation générale inspirée du format international E.164 :

   + suivi de 8 à 15 chiffres.

   Nous ne faisons pas ici une validation spécifique à chaque
   opérateur ou pays.
   ============================================================ */

const INTERNATIONAL_PHONE_PATTERN =
  /^\+[1-9]\d{7,14}$/;


/* ============================================================
   BASE SCHEMA
   ============================================================ */

const gestionnaireRegistrationSchema =
  z
    .object({
      /* ------------------------------------------------------
         SHOP NAME
         ------------------------------------------------------ */

      shopName:
        z
          .string({
            error:
              "Nom de la boutique requis.",
          })
          .transform(
            normalizeSimpleText,
          )
          .pipe(
            z
              .string()
              .min(
                SHOP_NAME_MIN_LENGTH,
                "Nom de la boutique requis.",
              )
              .max(
                SHOP_NAME_MAX_LENGTH,
                "Le nom de la boutique est trop long.",
              ),
          ),


      /* ------------------------------------------------------
         COUNTRY
         ------------------------------------------------------ */

      country:
        z
          .string({
            error:
              "Veuillez sélectionner un pays.",
          })
          .transform(
            normalizeCountryCode,
          )
          .refine(
            (
              countryCode,
            ) =>
              countryCode.length >
                0 &&
              isSupportedCountryCode(
                countryCode,
              ),
            {
              message:
                "Veuillez sélectionner un pays valide.",
            },
          ),


      /* ------------------------------------------------------
         CITY
         ------------------------------------------------------ */

      city:
        z
          .string({
            error:
              "Ville requise.",
          })
          .transform(
            normalizeSimpleText,
          )
          .pipe(
            z
              .string()
              .min(
                CITY_MIN_LENGTH,
                "Ville requise.",
              )
              .max(
                CITY_MAX_LENGTH,
                "Le nom de la ville est trop long.",
              ),
          ),


      /* ------------------------------------------------------
         SHOP ADDRESS
         ------------------------------------------------------ */

      shopAddress:
        z
          .string({
            error:
              "Adresse de la boutique requise.",
          })
          .transform(
            normalizeAddress,
          )
          .pipe(
            z
              .string()
              .min(
                SHOP_ADDRESS_MIN_LENGTH,
                "Adresse de la boutique requise.",
              )
              .max(
                SHOP_ADDRESS_MAX_LENGTH,
                "L’adresse de la boutique est trop longue.",
              ),
          ),


      /* ------------------------------------------------------
         PHONE
         ------------------------------------------------------ */

      phone:
        z
          .string({
            error:
              "Numéro de téléphone requis.",
          })
          .transform(
            normalizeInternationalPhone,
          )
          .refine(
            (
              phone,
            ) =>
              INTERNATIONAL_PHONE_PATTERN.test(
                phone,
              ),
            {
              message:
                "Numéro de téléphone invalide.",
            },
          ),


      /* ------------------------------------------------------
         EMAIL
         ------------------------------------------------------ */

      email:
        z
          .string({
            error:
              "Adresse e-mail requise.",
          })
          .transform(
            normalizeEmail,
          )
          .pipe(
            z
              .string()
              .min(
                1,
                "Adresse e-mail requise.",
              )
              .max(
                EMAIL_MAX_LENGTH,
                "Adresse e-mail invalide.",
              )
              .email(
                "Adresse e-mail invalide.",
              ),
          ),


      /* ------------------------------------------------------
         REPRESENTATIVE CODE
         ------------------------------------------------------
         ATTENTION :

         Nous ne vérifions PAS ici la valeur officielle.

         Une validation plus précise de sa structure pourrait
         révéler inutilement des informations sur le secret.

         Le service serveur effectuera la vraie comparaison.
         ------------------------------------------------------ */

      representativeCode:
        z
          .string({
            error:
              "Code représentant requis.",
          })
          .transform(
            (
              value,
            ) =>
              value.trim(),
          )
          .pipe(
            z
              .string()
              .min(
                1,
                "Code représentant requis.",
              )
              .max(
                REPRESENTATIVE_CODE_MAX_LENGTH,
                "Code représentant invalide.",
              ),
          ),


      /* ------------------------------------------------------
         PASSWORD
         ------------------------------------------------------
         Aucun trim volontaire.

         Si l'utilisateur choisit volontairement un espace
         dans son mot de passe, nous ne devons pas modifier
         silencieusement son secret.
         ------------------------------------------------------ */

      password:
        z
          .string({
            error:
              "Mot de passe requis.",
          })
          .min(
            PASSWORD_MIN_LENGTH,
            `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
          )
          .max(
            PASSWORD_MAX_LENGTH,
            "Le mot de passe est trop long.",
          ),


      /* ------------------------------------------------------
         PASSWORD CONFIRMATION
         ------------------------------------------------------ */

      passwordConfirmation:
        z
          .string({
            error:
              "Confirmation du mot de passe requise.",
          })
          .min(
            1,
            "Confirmation du mot de passe requise.",
          )
          .max(
            PASSWORD_MAX_LENGTH,
            "La confirmation du mot de passe est trop longue.",
          ),
    })


    /* ========================================================
       PASSWORD MATCH
       ======================================================== */

    .refine(
      (
        data,
      ) =>
        data.password ===
        data.passwordConfirmation,
      {
        message:
          "Les mots de passe ne correspondent pas.",

        path: [
          "passwordConfirmation",
        ],
      },
    );


/* ============================================================
   VALIDATED DATA TYPE
   ------------------------------------------------------------
   Type réellement produit après :

   - nettoyage ;
   - normalisation ;
   - validation.
   ============================================================ */

export type GestionnaireRegistrationData =
  z.infer<
    typeof gestionnaireRegistrationSchema
  >;


/* ============================================================
   SUCCESS RESULT
   ============================================================ */

export type GestionnaireRegistrationValidationSuccess =
  Readonly<{
    success: true;

    data:
      GestionnaireRegistrationData;
  }>;


/* ============================================================
   FAILURE RESULT
   ============================================================ */

export type GestionnaireRegistrationValidationFailure =
  Readonly<{
    success: false;

    fieldErrors:
      GestionnaireRegistrationFieldErrors;
  }>;


/* ============================================================
   VALIDATION RESULT
   ============================================================ */

export type GestionnaireRegistrationValidationResult =
  | GestionnaireRegistrationValidationSuccess
  | GestionnaireRegistrationValidationFailure;


/* ============================================================
   VALID FIELD NAME
   ============================================================ */

function isRegistrationFieldName(
  value: string,
): value is GestionnaireRegistrationField {
  switch (value) {
    case "shopName":
    case "country":
    case "city":
    case "shopAddress":
    case "phone":
    case "email":
    case "representativeCode":
    case "password":
    case "passwordConfirmation":
      return true;

    default:
      return false;
  }
}


/* ============================================================
   ZOD ERRORS → FORM ERRORS
   ------------------------------------------------------------
   On garde uniquement le premier message de chaque champ.

   Exemple :

   {
     email: "Adresse e-mail invalide.",
     password: "Le mot de passe doit contenir..."
   }

   Aucun détail interne Zod n'est envoyé au formulaire.
   ============================================================ */

function getFieldErrors(
  error: z.ZodError,
): GestionnaireRegistrationFieldErrors {
  const fieldErrors:
    GestionnaireRegistrationFieldErrors =
    {};


  for (
    const issue of error.issues
  ) {
    const field =
      issue.path[0];


    if (
      typeof field !==
      "string"
    ) {
      continue;
    }


    if (
      !isRegistrationFieldName(
        field,
      )
    ) {
      continue;
    }


    /*
     * On conserve le premier message utile du champ.
     */

    if (
      fieldErrors[field]
    ) {
      continue;
    }


    fieldErrors[field] =
      issue.message;
  }


  return fieldErrors;
}


/* ============================================================
   VALIDATE REGISTRATION
   ------------------------------------------------------------
   Fonction appelée depuis la Server Action.

   Exemple succès :

   {
     success: true,
     data: {
       shopName: "...",
       country: "CM",
       ...
     }
   }

   Exemple erreur :

   {
     success: false,
     fieldErrors: {
       email: "Adresse e-mail invalide."
     }
   }
   ============================================================ */

export function validateGestionnaireRegistration(
  input:
    GestionnaireRegistrationInput,
): GestionnaireRegistrationValidationResult {
  const result =
    gestionnaireRegistrationSchema.safeParse(
      input,
    );


  if (!result.success) {
    return {
      success: false,

      fieldErrors:
        getFieldErrors(
          result.error,
        ),
    };
  }


  return {
    success: true,

    data:
      result.data,
  };
}