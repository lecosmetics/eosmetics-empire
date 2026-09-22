import {
  z,
} from "zod";

import type {
  PublicCommandeAddress,
  PublicCommandeCustomer,
  PublicCommandeFieldErrors,
  PublicCommandeFieldName,
  PublicCommandeFormInput,
  PublicCommandePanierInput,
  PublicCommandePanierItemInput,
  PublicCommandePrepareInput,
  PublicCommandeValidatedForm,
} from "@/lib/public/commande/public-commande-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — VALIDATION
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-commande-schema.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Valider et normaliser les données envoyées depuis le navigateur pour :
 *
 * - les informations cliente ;
 * - l'adresse de livraison ;
 * - le contenu minimal du Panier ;
 * - la préparation du checkout.
 *
 * ============================================================================
 *
 * CE FICHIER NE :
 *
 * - lit aucune donnée Prisma ;
 * - n'interroge pas PostgreSQL ;
 * - ne calcule aucun prix ;
 * - ne calcule aucun frais de livraison ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - n'appelle aucun provider ;
 * - n'envoie aucun e-mail ;
 * - ne génère aucun PDF.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Les données suivantes ne sont JAMAIS acceptées depuis le navigateur :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - sous-total ;
 * - frais de livraison ;
 * - total ;
 * - statut de paiement.
 *
 * Elles seront toujours recalculées côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. LIMITES
   ========================================================================== */

/**
 * Ces limites protègent :
 *
 * - les Server Actions ;
 * - PostgreSQL ;
 * - les e-mails ;
 * - les reçus PDF ;
 * - l'interface.
 *
 * Elles ne définissent aucune règle commerciale.
 */
export const PUBLIC_COMMANDE_LIMITS = {
  firstName: {
    min:
      1,

    max:
      80,
  },

  lastName: {
    min:
      1,

    max:
      80,
  },

  email: {
    max:
      254,
  },

  phone: {
    min:
      6,

    max:
      32,

    minDigits:
      6,

    maxDigits:
      15,
  },

  countryCode: {
    length:
      2,
  },

  countryName: {
    min:
      2,

    max:
      100,
  },

  city: {
    min:
      1,

    max:
      120,
  },

  address: {
    min:
      3,

    max:
      250,
  },

  addressComplement: {
    max:
      180,
  },

  postalCode: {
    min:
      1,

    max:
      32,
  },

  storeProductId: {
    min:
      1,

    max:
      191,
  },

  panierItems: {
    max:
      100,
  },
} as const;


/* ==========================================================================
   2. CARACTÈRES DE CONTRÔLE
   ========================================================================== */

/**
 * On ne supprime pas silencieusement des caractères saisis par la cliente.
 *
 * Les caractères de contrôle dangereux / inutiles sont rejetés.
 *
 * Les retours à la ligne ne sont pas nécessaires dans les champs concernés.
 */
const CONTROL_CHARACTERS_PATTERN =
  /[\u0000-\u001F\u007F]/u;


/* ==========================================================================
   3. HELPERS
   ========================================================================== */

function hasNoControlCharacters(
  value:
    string,
): boolean {
  return !CONTROL_CHARACTERS_PATTERN.test(
    value,
  );
}


function countDigits(
  value:
    string,
): number {
  return (
    value.match(
      /\d/g,
    ) ?? []
  ).length;
}


function isValidPhoneCharacters(
  value:
    string,
): boolean {
  return /^[+0-9()\s.-]+$/u.test(
    value,
  );
}


function isValidPhoneValue(
  value:
    string,
): boolean {
  const digits =
    countDigits(
      value,
    );


  return (
    digits >=
      PUBLIC_COMMANDE_LIMITS.phone.minDigits &&
    digits <=
      PUBLIC_COMMANDE_LIMITS.phone.maxDigits &&
    isValidPhoneCharacters(
      value,
    )
  );
}


/* ==========================================================================
   4. CHAÎNE STANDARD
   ========================================================================== */

/**
 * Schéma de base.
 *
 * trim() supprime uniquement les espaces inutiles au début et à la fin.
 *
 * On ne transforme pas arbitrairement le contenu de la cliente.
 */
const safeTrimmedStringSchema =
  z
    .string()
    .trim()
    .refine(
      hasNoControlCharacters,
      {
        message:
          "La valeur contient des caractères non autorisés.",
      },
    );


/* ==========================================================================
   5. PRÉNOM
   ========================================================================== */

export const publicCommandeFirstNameSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.firstName.min,
      "Le prénom est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.firstName.max,
      `Le prénom ne peut pas dépasser ${PUBLIC_COMMANDE_LIMITS.firstName.max} caractères.`,
    );


/* ==========================================================================
   6. NOM
   ========================================================================== */

export const publicCommandeLastNameSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.lastName.min,
      "Le nom est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.lastName.max,
      `Le nom ne peut pas dépasser ${PUBLIC_COMMANDE_LIMITS.lastName.max} caractères.`,
    );


/* ==========================================================================
   7. E-MAIL
   ========================================================================== */

export const publicCommandeEmailSchema =
  safeTrimmedStringSchema
    .min(
      1,
      "L’adresse e-mail est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.email.max,
      "L’adresse e-mail est trop longue.",
    )
    .email(
      "L’adresse e-mail n’est pas valide.",
    )
    .transform(
      (
        value,
      ) =>
        value.toLowerCase(),
    );


/* ==========================================================================
   8. TÉLÉPHONE
   ========================================================================== */

/**
 * Le schéma accepte par exemple :
 *
 * +237 6 94 72 46 91
 * 694724691
 * +33 6 12 34 56 78
 *
 * Il ne force pas ici un pays ou un préfixe particulier.
 */
export const publicCommandePhoneSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.phone.min,
      "Le numéro de téléphone est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.phone.max,
      "Le numéro de téléphone est trop long.",
    )
    .refine(
      isValidPhoneValue,
      {
        message:
          "Le numéro de téléphone n’est pas valide.",
      },
    );


/* ==========================================================================
   9. WHATSAPP FACULTATIF
   ========================================================================== */

/**
 * Version INPUT.
 *
 * Le formulaire navigateur transmet toujours une string.
 *
 * Une absence de numéro WhatsApp est représentée par :
 *
 * ""
 *
 * IMPORTANT :
 *
 * Cette version ne transforme PAS la chaîne vide en null.
 *
 * Elle reste donc compatible avec :
 *
 * PublicCommandeCustomerInput
 * PublicCommandePrepareInput
 */
export const publicCommandeWhatsappInputSchema =
  safeTrimmedStringSchema
    .max(
      PUBLIC_COMMANDE_LIMITS.phone.max,
      "Le numéro WhatsApp est trop long.",
    )
    .refine(
      (
        value,
      ) =>
        value.length ===
          0 ||
        isValidPhoneValue(
          value,
        ),
      {
        message:
          "Le numéro WhatsApp n’est pas valide.",
      },
    );


/**
 * Version NORMALISÉE.
 *
 * Après validation serveur :
 *
 * "" devient null.
 *
 * Une vraie valeur reste une string.
 *
 * Cette version alimente :
 *
 * PublicCommandeCustomer
 * PublicCommandeValidatedForm
 */
export const publicCommandeWhatsappSchema =
  publicCommandeWhatsappInputSchema
    .transform(
      (
        value,
      ) =>
        value.length >
        0
          ? value
          : null,
    );


/* ==========================================================================
   10. CODE PAYS
   ========================================================================== */

/**
 * Le code pays doit utiliser un code ISO alpha-2.
 *
 * Exemples :
 *
 * CM
 * BJ
 * FR
 * US
 *
 * IMPORTANT :
 *
 * Le fait qu'un code possède deux lettres ne signifie pas encore
 * qu'il correspond à un pays autorisé.
 *
 * La vérification de la vraie destination sera faite par :
 *
 * public-commande-delivery.ts
 *
 * à partir de la configuration officielle des pays.
 */
export const publicCommandeCountryCodeSchema =
  safeTrimmedStringSchema
    .length(
      PUBLIC_COMMANDE_LIMITS.countryCode.length,
      "Le code pays n’est pas valide.",
    )
    .regex(
      /^[A-Za-z]{2}$/u,
      "Le code pays n’est pas valide.",
    )
    .transform(
      (
        value,
      ) =>
        value.toUpperCase(),
    );


/* ==========================================================================
   11. NOM DU PAYS
   ========================================================================== */

/**
 * countryName est utile pour :
 *
 * - l'affichage ;
 * - le snapshot d'adresse ;
 * - le reçu ;
 * - l'e-mail.
 *
 * Il ne doit PAS être utilisé seul pour décider du tarif de livraison.
 */
export const publicCommandeCountryNameSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.countryName.min,
      "Le pays est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.countryName.max,
      "Le nom du pays est trop long.",
    );


/* ==========================================================================
   12. VILLE
   ========================================================================== */

export const publicCommandeCitySchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.city.min,
      "La ville est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.city.max,
      "Le nom de la ville est trop long.",
    );


/* ==========================================================================
   13. ADRESSE
   ========================================================================== */

export const publicCommandeAddressLineSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.address.min,
      "L’adresse de livraison est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.address.max,
      "L’adresse de livraison est trop longue.",
    );


/* ==========================================================================
   14. COMPLÉMENT D'ADRESSE
   ========================================================================== */

/**
 * Version INPUT.
 *
 * Le navigateur transmet toujours une string.
 *
 * Une absence de complément est représentée par :
 *
 * ""
 */
export const publicCommandeAddressComplementInputSchema =
  safeTrimmedStringSchema
    .max(
      PUBLIC_COMMANDE_LIMITS.addressComplement.max,
      "Le complément d’adresse est trop long.",
    );


/**
 * Version NORMALISÉE.
 *
 * Une chaîne vide devient null.
 *
 * Cette version est utilisée après validation serveur.
 */
export const publicCommandeAddressComplementSchema =
  publicCommandeAddressComplementInputSchema
    .transform(
      (
        value,
      ) =>
        value.length >
        0
          ? value
          : null,
    );

/* ==========================================================================
   15. CODE POSTAL
   ========================================================================== */

/**
 * On évite volontairement une regex trop restrictive.
 *
 * Les formats postaux varient fortement selon les pays.
 *
 * Exemples possibles :
 *
 * 75001
 * 1000
 * SW1A 1AA
 * 90210
 */
export const publicCommandePostalCodeSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.postalCode.min,
      "Le code postal est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.postalCode.max,
      "Le code postal est trop long.",
    );


/* ==========================================================================
   16. CLIENTE — INPUT NAVIGATEUR
   ========================================================================== */

/**
 * Contrat brut du formulaire.
 *
 * IMPORTANT :
 *
 * whatsapp reste une string.
 *
 * Une valeur vide reste :
 *
 * ""
 *
 * Ce schéma sert notamment à :
 *
 * publicCommandePrepareInputSchema
 *
 * afin de rester strictement compatible avec :
 *
 * PublicCommandeCustomerInput
 */
export const publicCommandeCustomerInputSchema =
  z
    .object({
      firstName:
        publicCommandeFirstNameSchema,

      lastName:
        publicCommandeLastNameSchema,

      email:
        publicCommandeEmailSchema,

      phone:
        publicCommandePhoneSchema,

      whatsapp:
        publicCommandeWhatsappInputSchema,
    })
    .strict();


/* ==========================================================================
   17. CLIENTE — NORMALISÉE
   ========================================================================== */

/**
 * Sortie :
 *
 * PublicCommandeCustomer
 *
 * Ici :
 *
 * whatsapp vide devient null.
 */
export const publicCommandeCustomerSchema =
  z
    .object({
      firstName:
        publicCommandeFirstNameSchema,

      lastName:
        publicCommandeLastNameSchema,

      email:
        publicCommandeEmailSchema,

      phone:
        publicCommandePhoneSchema,

      whatsapp:
        publicCommandeWhatsappSchema,
    })
    .strict();


/* ==========================================================================
   18. ADRESSE — INPUT NAVIGATEUR
   ========================================================================== */

/**
 * Contrat brut du formulaire d'adresse.
 *
 * IMPORTANT :
 *
 * addressComplement reste une string.
 *
 * Une absence de complément reste :
 *
 * ""
 *
 * Ce schéma reste compatible avec :
 *
 * PublicCommandeAddressInput
 * PublicCommandePrepareInput
 */
export const publicCommandeAddressInputSchema =
  z
    .object({
      countryCode:
        publicCommandeCountryCodeSchema,

      countryName:
        publicCommandeCountryNameSchema,

      city:
        publicCommandeCitySchema,

      address:
        publicCommandeAddressLineSchema,

      addressComplement:
        publicCommandeAddressComplementInputSchema,

      postalCode:
        publicCommandePostalCodeSchema,
    })
    .strict();


/* ==========================================================================
   19. ADRESSE — NORMALISÉE
   ========================================================================== */

/**
 * Sortie :
 *
 * PublicCommandeAddress
 *
 * Ici :
 *
 * addressComplement vide devient null.
 */
export const publicCommandeAddressSchema =
  z
    .object({
      countryCode:
        publicCommandeCountryCodeSchema,

      countryName:
        publicCommandeCountryNameSchema,

      city:
        publicCommandeCitySchema,

      address:
        publicCommandeAddressLineSchema,

      addressComplement:
        publicCommandeAddressComplementSchema,

      postalCode:
        publicCommandePostalCodeSchema,
    })
    .strict();


/* ==========================================================================
   20. FORMULAIRE /COMMANDE
   ========================================================================== */

/**
 * Entrée navigateur :
 *
 * PublicCommandeFormInput
 *
 * Sortie normalisée :
 *
 * PublicCommandeValidatedForm
 */
export const publicCommandeFormSchema =
  z
    .object({
      customer:
        publicCommandeCustomerSchema,

      address:
        publicCommandeAddressSchema,
    })
    .strict();


/* ==========================================================================
   21. STORE PRODUCT ID
   ========================================================================== */

export const publicCommandeStoreProductIdSchema =
  safeTrimmedStringSchema
    .min(
      PUBLIC_COMMANDE_LIMITS.storeProductId.min,
      "L’identifiant du produit est obligatoire.",
    )
    .max(
      PUBLIC_COMMANDE_LIMITS.storeProductId.max,
      "L’identifiant du produit n’est pas valide.",
    );


/* ==========================================================================
   22. QUANTITÉ PANIER
   ========================================================================== */

/**
 * Aucune limite de stock n'est décidée ici.
 *
 * Le schéma vérifie uniquement qu'il s'agit d'une quantité entière positive.
 *
 * Le stock réel sera vérifié dans PostgreSQL.
 */
export const publicCommandeQuantitySchema =
  z
    .number()
    .finite(
      "La quantité n’est pas valide.",
    )
    .int(
      "La quantité doit être un nombre entier.",
    )
    .positive(
      "La quantité doit être supérieure à zéro.",
    );


/* ==========================================================================
   23. LIGNE PANIER
   ========================================================================== */

/**
 * Aucune donnée commerciale n'est acceptée.
 *
 * Seulement :
 *
 * storeProductId
 * quantity
 */
export const publicCommandePanierItemInputSchema =
  z
    .object({
      storeProductId:
        publicCommandeStoreProductIdSchema,

      quantity:
        publicCommandeQuantitySchema,
    })
    .strict();


/* ==========================================================================
   24. PANIER COMPLET
   ========================================================================== */

export const publicCommandePanierInputSchema =
  z
    .object({
      items:
        z
          .array(
            publicCommandePanierItemInputSchema,
          )
          .min(
            1,
            "Le panier est vide.",
          )
          .max(
            PUBLIC_COMMANDE_LIMITS.panierItems.max,
            "Le panier contient trop d’articles différents.",
          ),
    })
    .strict();


/* ==========================================================================
   25. PRÉPARATION DU CHECKOUT
   ========================================================================== */

/**
 * Payload accepté avant passage vers :
 *
 * /commande/paiement
 *
 * IMPORTANT :
 *
 * Aucun :
 *
 * - prix ;
 * - stock ;
 * - devise ;
 * - livraison ;
 * - total
 *
 * n'est accepté ici.
 */
export const publicCommandePrepareInputSchema =
  z
    .object({
      items:
        z
          .array(
            publicCommandePanierItemInputSchema,
          )
          .min(
            1,
            "Le panier est vide.",
          )
          .max(
            PUBLIC_COMMANDE_LIMITS.panierItems.max,
            "Le panier contient trop d’articles différents.",
          ),

      /**
       * IMPORTANT :
       *
       * Ici nous utilisons volontairement les schémas INPUT.
       *
       * Le résultat doit rester compatible avec :
       *
       * PublicCommandePrepareInput
       *
       * donc :
       *
       * whatsapp          = string
       * addressComplement = string
       *
       * La normalisation vers null intervient ensuite lorsque les
       * informations métier validées sont produites.
       */
      customer:
        publicCommandeCustomerInputSchema,

      address:
        publicCommandeAddressInputSchema,
    })
    .strict();


/* ==========================================================================
   26. VÉRIFICATION DES TYPES DE SORTIE
   ========================================================================== */

/**
 * Ces fonctions ne font rien à l'exécution.
 *
 * Elles permettent à TypeScript de vérifier que les sorties Zod restent
 * compatibles avec les contrats officiels de public-commande-types.ts.
 */

function assertPublicCommandeCustomerType(
  value:
    PublicCommandeCustomer,
): PublicCommandeCustomer {
  return value;
}


function assertPublicCommandeAddressType(
  value:
    PublicCommandeAddress,
): PublicCommandeAddress {
  return value;
}


function assertPublicCommandeValidatedFormType(
  value:
    PublicCommandeValidatedForm,
): PublicCommandeValidatedForm {
  return value;
}


function assertPublicCommandePanierItemInputType(
  value:
    PublicCommandePanierItemInput,
): PublicCommandePanierItemInput {
  return value;
}


function assertPublicCommandePanierInputType(
  value:
    PublicCommandePanierInput,
): PublicCommandePanierInput {
  return value;
}


function assertPublicCommandePrepareInputType(
  value:
    PublicCommandePrepareInput,
): PublicCommandePrepareInput {
  return value;
}


/* ==========================================================================
   27. PARSE CLIENTE
   ========================================================================== */

export function parsePublicCommandeCustomer(
  input:
    unknown,
): PublicCommandeCustomer {
  const parsed =
    publicCommandeCustomerSchema.parse(
      input,
    );


  return assertPublicCommandeCustomerType(
    parsed,
  );
}


/* ==========================================================================
   28. PARSE ADRESSE
   ========================================================================== */

export function parsePublicCommandeAddress(
  input:
    unknown,
): PublicCommandeAddress {
  const parsed =
    publicCommandeAddressSchema.parse(
      input,
    );


  return assertPublicCommandeAddressType(
    parsed,
  );
}


/* ==========================================================================
   29. PARSE FORMULAIRE
   ========================================================================== */

export function parsePublicCommandeForm(
  input:
    unknown,
): PublicCommandeValidatedForm {
  const parsed =
    publicCommandeFormSchema.parse(
      input,
    );


  return assertPublicCommandeValidatedFormType(
    parsed,
  );
}


/* ==========================================================================
   30. PARSE PANIER
   ========================================================================== */

export function parsePublicCommandePanierInput(
  input:
    unknown,
): PublicCommandePanierInput {
  const parsed =
    publicCommandePanierInputSchema.parse(
      input,
    );


  return assertPublicCommandePanierInputType(
    parsed,
  );
}


/* ==========================================================================
   31. PARSE LIGNE PANIER
   ========================================================================== */

export function parsePublicCommandePanierItemInput(
  input:
    unknown,
): PublicCommandePanierItemInput {
  const parsed =
    publicCommandePanierItemInputSchema.parse(
      input,
    );


  return assertPublicCommandePanierItemInputType(
    parsed,
  );
}


/* ==========================================================================
   32. PARSE PRÉPARATION CHECKOUT
   ========================================================================== */

export function parsePublicCommandePrepareInput(
  input:
    unknown,
): PublicCommandePrepareInput {
  const parsed =
    publicCommandePrepareInputSchema.parse(
      input,
    );


  return assertPublicCommandePrepareInputType(
    parsed,
  );
}


/* ==========================================================================
   33. SAFE PARSE FORMULAIRE
   ========================================================================== */

/**
 * Variante sans throw.
 *
 * Utile dans une Server Action.
 */
export function safeParsePublicCommandeForm(
  input:
    unknown,
) {
  return publicCommandeFormSchema.safeParse(
    input,
  );
}


/* ==========================================================================
   34. SAFE PARSE PANIER
   ========================================================================== */

export function safeParsePublicCommandePanierInput(
  input:
    unknown,
) {
  return publicCommandePanierInputSchema.safeParse(
    input,
  );
}


/* ==========================================================================
   35. SAFE PARSE PRÉPARATION CHECKOUT
   ========================================================================== */

export function safeParsePublicCommandePrepareInput(
  input:
    unknown,
) {
  return publicCommandePrepareInputSchema.safeParse(
    input,
  );
}


/* ==========================================================================
   36. CHAMPS RECONNUS
   ========================================================================== */

/**
 * Cet ensemble permet de transformer proprement les issues Zod
 * en erreurs utilisables par le formulaire React.
 */
const PUBLIC_COMMANDE_FIELD_NAMES =
  new Set<PublicCommandeFieldName>(
    [
      "firstName",
      "lastName",
      "email",
      "phone",
      "whatsapp",
      "countryCode",
      "countryName",
      "city",
      "address",
      "addressComplement",
      "postalCode",
    ],
  );


/* ==========================================================================
   37. TYPE GUARD NOM DE CHAMP
   ========================================================================== */

function isPublicCommandeFieldName(
  value:
    unknown,
): value is PublicCommandeFieldName {
  return (
    typeof value ===
      "string" &&
    PUBLIC_COMMANDE_FIELD_NAMES.has(
      value as PublicCommandeFieldName,
    )
  );
}


/* ==========================================================================
   38. EXTRACTION DES ERREURS DE CHAMPS
   ========================================================================== */

/**
 * Transforme :
 *
 * customer.firstName
 *
 * ou :
 *
 * address.city
 *
 * en :
 *
 * {
 *   firstName: "...",
 *   city: "..."
 * }
 *
 * compatible avec :
 *
 * PublicCommandeFieldErrors
 */
export function getPublicCommandeFieldErrors(
  error:
    z.ZodError,
): PublicCommandeFieldErrors {
  const fieldErrors:
    PublicCommandeFieldErrors =
      {};


  for (
    const issue of
    error.issues
  ) {
    const lastPathPart =
      issue.path[
        issue.path.length -
          1
      ];


    if (
      !isPublicCommandeFieldName(
        lastPathPart,
      )
    ) {
      continue;
    }


    /**
     * On garde la première erreur utile par champ.
     *
     * Cela évite d'afficher plusieurs messages concurrents
     * sous le même input.
     */
    if (
      fieldErrors[
        lastPathPart
      ]
    ) {
      continue;
    }


    fieldErrors[
      lastPathPart
    ] =
      issue.message;
  }


  return fieldErrors;
}


/* ==========================================================================
   39. ERREURS GLOBALES
   ========================================================================== */

/**
 * Retourne uniquement les erreurs qui ne correspondent pas directement
 * à un champ du formulaire.
 */
export function getPublicCommandeFormErrors(
  error:
    z.ZodError,
): readonly string[] {
  const messages:
    string[] =
      [];


  for (
    const issue of
    error.issues
  ) {
    const lastPathPart =
      issue.path[
        issue.path.length -
          1
      ];


    if (
      isPublicCommandeFieldName(
        lastPathPart,
      )
    ) {
      continue;
    }


    if (
      !messages.includes(
        issue.message,
      )
    ) {
      messages.push(
        issue.message,
      );
    }
  }


  return messages;
}


/* ==========================================================================
   40. VALIDATION FORMULAIRE — HELPER COMPLET
   ========================================================================== */

/**
 * Helper pratique pour public-commande-actions.ts.
 *
 * Il retourne :
 *
 * succès :
 *
 * {
 *   success: true,
 *   data: PublicCommandeValidatedForm
 * }
 *
 * erreur :
 *
 * {
 *   success: false,
 *   fieldErrors,
 *   formErrors
 * }
 */
export function validatePublicCommandeForm(
  input:
    unknown,
):
  | Readonly<{
      success:
        true;

      data:
        PublicCommandeValidatedForm;
    }>
  | Readonly<{
      success:
        false;

      fieldErrors:
        PublicCommandeFieldErrors;

      formErrors:
        readonly string[];
    }> {
  const result =
    publicCommandeFormSchema.safeParse(
      input,
    );


  if (
    !result.success
  ) {
    return {
      success:
        false,

      fieldErrors:
        getPublicCommandeFieldErrors(
          result.error,
        ),

      formErrors:
        getPublicCommandeFormErrors(
          result.error,
        ),
    };
  }


  return {
    success:
      true,

    data:
      assertPublicCommandeValidatedFormType(
        result.data,
      ),
  };
}


/* ==========================================================================
   41. VALIDATION DES INPUTS FORMELLEMENT TYPÉS
   ========================================================================== */

/**
 * Ces fonctions sont pratiques lorsqu'un appelant possède déjà un type
 * TypeScript mais qu'une validation runtime reste nécessaire.
 *
 * TypeScript ne remplace jamais la validation serveur.
 */

export function validateTypedPublicCommandeFormInput(
  input:
    PublicCommandeFormInput,
) {
  return safeParsePublicCommandeForm(
    input,
  );
}


export function validateTypedPublicCommandePanierInput(
  input:
    PublicCommandePanierInput,
) {
  return safeParsePublicCommandePanierInput(
    input,
  );
}


export function validateTypedPublicCommandePrepareInput(
  input:
    PublicCommandePrepareInput,
) {
  return safeParsePublicCommandePrepareInput(
    input,
  );
}


/* ==========================================================================
   42. DOCUMENTATION
   ========================================================================== */

/**
 * ============================================================================
 *
 * FORMULAIRE CLIENTE
 *
 * ============================================================================
 *
 * firstName
 * lastName
 * email
 * phone
 * whatsapp
 *
 * ============================================================================
 *
 * ADRESSE DE LIVRAISON
 *
 * ============================================================================
 *
 * countryCode
 * countryName
 * city
 * address
 * addressComplement
 * postalCode
 *
 * ============================================================================
 *
 * PANIER
 *
 * ============================================================================
 *
 * Le navigateur est autorisé à transmettre uniquement :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * INTERDIT DANS LE PAYLOAD NAVIGATEUR
 *
 * ============================================================================
 *
 * price
 * promotionalPrice
 * currency
 * stock
 * availableQuantity
 * shippingAmount
 * subtotal
 * totalAmount
 * paymentStatus
 *
 * ============================================================================
 *
 * LIVRAISON
 *
 * ============================================================================
 *
 * Ce fichier ne détermine jamais :
 *
 * 3 000 XAF
 * 7 000 XAF
 * 12 700 XAF
 *
 * Ces tarifs appartiennent exclusivement à :
 *
 * src/config/public-delivery.ts
 *
 * Puis :
 *
 * src/lib/public/commande/public-commande-delivery.ts
 *
 * effectuera le calcul serveur.
 *
 * ============================================================================
 *
 * PAYS
 *
 * ============================================================================
 *
 * Le navigateur peut transmettre :
 *
 * countryCode
 * countryName
 *
 * Mais le serveur doit utiliser le countryCode validé et sa propre
 * configuration pour déterminer :
 *
 * CAMEROON
 * AFRICA
 * INTERNATIONAL
 *
 * Le texte countryName venant du navigateur ne doit jamais décider
 * du prix de livraison.
 *
 * ============================================================================
 */