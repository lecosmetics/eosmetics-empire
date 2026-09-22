

import {
  z,
} from "zod";

import {
  PRODUCT_CREATE_DEFAULT_BRAND,
  PRODUCT_CREATE_FORM_FIELDS,
  PRODUCT_CREATE_LIMITS,
  normalizeProductCreateImages,
  type ProductCreateFieldErrors,
  type ProductCreateFormValues,
  type ProductCreateImageFieldError,
  type ProductCreateImageInput,
  type ProductCreateIntent,
  type ProductCreatePublicationStatus,
  type ProductCreateRawInput,
  type ProductCreateValidatedInput,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — VALIDATION CRÉATION / MODIFICATION PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/ajouter/product-create-schema.ts
 *
 * RESPONSABILITÉS :
 *
 * - lire FormData ;
 * - normaliser les valeurs ;
 * - valider les champs avec Zod ;
 * - appliquer les règles Brouillon / Publication ;
 * - valider les montants ;
 * - valider le stock ;
 * - valider les images uploadées et les images existantes en modification ;
 * - empêcher les incohérences évidentes ;
 * - produire ProductCreateValidatedInput ;
 * - fournir des erreurs directement exploitables par le formulaire.
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - ne fait aucune requête Prisma ;
 * - ne vérifie pas lui-même l'existence de la catégorie ;
 * - ne vérifie pas l'appartenance réelle d'une image au Store ;
 * - ne décide jamais du storeId ;
 * - ne décide jamais du managerId ;
 * - ne génère pas le QR ;
 * - ne génère pas le SKU ;
 * - ne génère pas le slug ;
 * - ne crée aucune donnée.
 *
 * Les vérifications nécessitant la base ou la session seront réalisées
 * dans product-create-actions.ts.
 *
 * ============================================================================
 */


/* ==========================================================================
   LIMITES INTERNES
   ========================================================================== */

/**
 * Protection contre un JSON d'images anormalement volumineux.
 *
 * Huit images avec leurs métadonnées normales restent très largement
 * sous cette limite.
 */

const MAX_IMAGES_SERIALIZED_LENGTH =
  64_000;


/**
 * Taille maximale raisonnable du nom MIME envoyé dans les métadonnées.
 */

const MAX_MIME_TYPE_LENGTH =
  100;


/* ==========================================================================
   TYPES — RÉSULTAT DE VALIDATION
   ========================================================================== */

export interface ProductCreateParseSuccess {
  success:
    true;

  data:
    ProductCreateValidatedInput;

  fieldErrors:
    null;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;
}


export interface ProductCreateParseFailure {
  success:
    false;

  data:
    null;

  message:
    string;

  fieldErrors:
    ProductCreateFieldErrors;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;
}


export type ProductCreateParseResult =
  | ProductCreateParseSuccess
  | ProductCreateParseFailure;


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

type MutableProductCreateFieldErrors = {
  [Key in keyof ProductCreateFieldErrors]?:
    string[];
};


interface ParsedMoneyResult {
  success:
    boolean;

  value:
    number |
    null;

  message:
    string |
    null;
}


interface ParsedStockResult {
  success:
    boolean;

  value:
    number |
    null;

  message:
    string |
    null;
}


interface ParsedImagesResult {
  images:
    ProductCreateImageInput[];

  fieldErrors:
    string[];

  imageErrors:
    ProductCreateImageFieldError[];
}


/* ==========================================================================
   MIME TYPES PRODUITS
   ========================================================================== */

/**
 * Ces valeurs correspondent au parcours d'upload produit actuel.
 *
 * La validation définitive du fichier réel reste dans l'API d'upload.
 */

const PRODUCT_IMAGE_ALLOWED_MIME_TYPES =
  new Set<string>([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);


/* ==========================================================================
   HELPERS — FORM DATA
   ========================================================================== */

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


  return typeof value ===
    "string"
    ? value
    : "";
}


/* ==========================================================================
   NORMALISATION — TEXTE SIMPLE
   ========================================================================== */

/**
 * Pour :
 *
 * - nom ;
 * - catégorie ;
 * - marque ;
 * - unité ;
 * - poids / contenance.
 *
 * Les retours à la ligne et espaces multiples deviennent un espace.
 */

function normalizeSingleLineText(
  value:
    string,
): string {
  return value
    .replace(
      /\u00a0/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


/* ==========================================================================
   NORMALISATION — TEXTE MULTILIGNE
   ========================================================================== */

function normalizeMultilineText(
  value:
    string,
): string {
  return value
    .replace(
      /\r\n?/g,
      "\n",
    )
    .trim();
}


/* ==========================================================================
   CARACTÈRES DE CONTRÔLE
   ========================================================================== */

/**
 * Autorise :
 *
 * - tabulation ;
 * - retour à la ligne.
 *
 * Refuse les autres caractères de contrôle.
 */

function containsInvalidControlCharacters(
  value:
    string,
): boolean {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(
    value,
  );
}


/* ==========================================================================
   ERREURS
   ========================================================================== */

function appendFieldError(
  errors:
    MutableProductCreateFieldErrors,

  field:
    keyof ProductCreateFieldErrors,

  message:
    string,
): void {
  const current =
    errors[field] ??
    [];


  current.push(
    message,
  );


  errors[field] =
    current;
}


function hasFieldErrors(
  errors:
    MutableProductCreateFieldErrors,
): boolean {
  return Object.values(
    errors,
  ).some(
    (
      value,
    ) =>
      Array.isArray(
        value,
      ) &&
      value.length >
        0,
  );
}


/* ==========================================================================
   RAW INPUT SCHEMA
   ========================================================================== */

/**
 * Première barrière Zod.
 *
 * Elle garantit surtout que les valeurs restent des chaînes de taille
 * raisonnable avant les validations métier plus précises.
 */

const productCreateRawInputSchema =
  z
    .object({
      intent:
        z
          .string()
          .max(
            32,
          ),

      submissionId:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .submissionId
              .max,
          ),

      name:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .name
              .max +
              100,
          ),

      categoryId:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .categoryId
              .max +
              20,
          ),

      brand:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .brand
              .max +
              50,
          ),

      description:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .description
              .max +
              500,
          ),

      price:
        z
          .string()
          .max(
            100,
          ),

      compareAtPrice:
        z
          .string()
          .max(
            100,
          ),

      stockQuantity:
        z
          .string()
          .max(
            100,
          ),

      unit:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .unit
              .max +
              50,
          ),

      ingredients:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .ingredients
              .max +
              500,
          ),

      weightContent:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .weightContent
              .max +
              50,
          ),

      usageInstructions:
        z
          .string()
          .max(
            PRODUCT_CREATE_LIMITS
              .usageInstructions
              .max +
              500,
          ),

      publicationStatus:
        z
          .string()
          .max(
            32,
          ),

      images:
        z
          .string()
          .max(
            MAX_IMAGES_SERIALIZED_LENGTH,
          ),
    })
    .strict();


/* ==========================================================================
   IMAGE SCHEMA
   ========================================================================== */

function isValidHttpUrl(
  value:
    string,
): boolean {
  try {
    const url =
      new URL(
        value,
      );


    if (
      url.protocol !==
        "https:" &&
      url.protocol !==
        "http:"
    ) {
      return false;
    }


    if (
      url.username ||
      url.password
    ) {
      return false;
    }


    return true;
  } catch {
    return false;
  }
}


function isSafeStoragePath(
  value:
    string,
): boolean {
  if (
    !value ||
    value.includes(
      "\\",
    )
  ) {
    return false;
  }


  if (
    value.startsWith(
      "/",
    ) ||
    value.endsWith(
      "/",
    )
  ) {
    return false;
  }


  if (
    value.includes(
      "://",
    )
  ) {
    return false;
  }


  const segments =
    value.split(
      "/",
    );


  if (
    segments.some(
      (
        segment,
      ) =>
        !segment ||
        segment ===
          "." ||
        segment ===
          "..",
    )
  ) {
    return false;
  }


  return true;
}


const productCreateImageBaseShape = {
  url:
    z
      .string()
      .trim()
      .min(
        1,
        "L’adresse de l’image est manquante.",
      )
      .max(
        PRODUCT_CREATE_LIMITS
          .imageUrl
          .max,
        "L’adresse de l’image est trop longue.",
      )
      .refine(
        (
          value,
        ) =>
          isValidHttpUrl(
            value,
          ),
        {
          message:
            "L’adresse de l’image est invalide.",
        },
      ),

  originalFileName:
    z
      .union([
        z.string(),
        z.null(),
        z.undefined(),
      ])
      .transform(
        (
          value,
        ) => {
          if (
            typeof value !==
            "string"
          ) {
            return null;
          }


          const normalized =
            normalizeSingleLineText(
              value,
            );


          return normalized ||
            null;
        },
      )
      .refine(
        (
          value,
        ) =>
          value ===
            null ||
          (
            value.length <=
              PRODUCT_CREATE_LIMITS
                .imageFileName
                .max &&
            !containsInvalidControlCharacters(
              value,
            )
          ),
        {
          message:
            "Le nom du fichier image est invalide.",
        },
      ),

  mimeType:
    z
      .union([
        z.string(),
        z.null(),
        z.undefined(),
      ])
      .transform(
        (
          value,
        ) => {
          if (
            typeof value !==
            "string"
          ) {
            return null;
          }


          const normalized =
            value
              .trim()
              .toLowerCase();


          return normalized ||
            null;
        },
      )
      .refine(
        (
          value,
        ) =>
          value ===
            null ||
          (
            value.length <=
              MAX_MIME_TYPE_LENGTH &&
            PRODUCT_IMAGE_ALLOWED_MIME_TYPES.has(
              value,
            )
          ),
        {
          message:
            "Le type de fichier image n’est pas autorisé.",
        },
      ),

  size:
    z
      .union([
        z.number(),
        z.null(),
        z.undefined(),
      ])
      .transform(
        (
          value,
        ) =>
          typeof value ===
            "number"
            ? value
            : null,
      )
      .refine(
        (
          value,
        ) =>
          value ===
            null ||
          (
            Number.isSafeInteger(
              value,
            ) &&
            value >=
              0
          ),
        {
          message:
            "La taille du fichier image est invalide.",
        },
      ),

  altText:
    z
      .union([
        z.string(),
        z.null(),
        z.undefined(),
      ])
      .transform(
        (
          value,
        ) => {
          if (
            typeof value !==
            "string"
          ) {
            return null;
          }


          const normalized =
            normalizeSingleLineText(
              value,
            );


          return normalized ||
            null;
        },
      )
      .refine(
        (
          value,
        ) =>
          value ===
            null ||
          (
            value.length <=
              PRODUCT_CREATE_LIMITS
                .imageAltText
                .max &&
            !containsInvalidControlCharacters(
              value,
            )
          ),
        {
          message:
            `Le texte alternatif ne doit pas dépasser ${PRODUCT_CREATE_LIMITS.imageAltText.max} caractères.`,
        },
      ),

  position:
    z
      .number()
      .int()
      .nonnegative(),

  isPrimary:
    z
      .boolean(),
} as const;


/**
 * Nouvelle image envoyée pendant la saisie.
 *
 * Elle possède obligatoirement :
 *
 * - fileId ;
 * - storagePath ;
 * - source = UPLOADED.
 */
const productCreateUploadedImageInputSchema =
  z
    .object({
      ...productCreateImageBaseShape,

      id:
        z
          .null()
          .optional(),

      fileId:
        z
          .string()
          .trim()
          .min(
            1,
            "L’identifiant du fichier image est manquant.",
          )
          .max(
            PRODUCT_CREATE_LIMITS
              .imageFileId
              .max,
            "L’identifiant du fichier image est invalide.",
          ),

      storagePath:
        z
          .string()
          .trim()
          .min(
            1,
            "Le chemin de stockage de l’image est manquant.",
          )
          .max(
            PRODUCT_CREATE_LIMITS
              .imageStoragePath
              .max,
            "Le chemin de stockage de l’image est trop long.",
          )
          .refine(
            (
              value,
            ) =>
              isSafeStoragePath(
                value,
              ),
            {
              message:
                "Le chemin de stockage de l’image est invalide.",
            },
          ),

      source:
        z
          .literal(
            "UPLOADED",
          ),
    })
    .strict();


/**
 * Image déjà enregistrée dans ProductImage.
 *
 * En mode modification :
 *
 * - id = identifiant Prisma ProductImage ;
 * - fileId = null ;
 * - storagePath = null ;
 * - source = EXISTING.
 *
 * Le navigateur ne reçoit pas un chemin Storage artificiel pour une image
 * déjà enregistrée. La vérification d'appartenance au produit et à la boutique
 * reste obligatoirement côté serveur dans la Server Action.
 */
const productCreateExistingImageInputSchema =
  z
    .object({
      ...productCreateImageBaseShape,

      id:
        z
          .string()
          .trim()
          .min(
            1,
            "L’identifiant de l’image existante est manquant.",
          )
          .max(
            PRODUCT_CREATE_LIMITS
              .imageFileId
              .max,
            "L’identifiant de l’image existante est invalide.",
          ),

      fileId:
        z
          .null(),

      storagePath:
        z
          .null(),

      source:
        z
          .literal(
            "EXISTING",
          ),
    })
    .strict();


/**
 * Le même formulaire accepte désormais :
 *
 * - les nouvelles images uploadées ;
 * - les images existantes préchargées en mode modification.
 *
 * `source` sert de discriminateur fiable pour Zod et TypeScript.
 */
const productCreateImageInputSchema =
  z.discriminatedUnion(
    "source",
    [
      productCreateUploadedImageInputSchema,
      productCreateExistingImageInputSchema,
    ],
  );


/* ==========================================================================
   FORM VALUES
   ========================================================================== */

export function createProductCreateFormValuesFromRawInput(
  input:
    ProductCreateRawInput,
): ProductCreateFormValues {
  const status =
    normalizeSingleLineText(
      input.publicationStatus,
    );


  const publicationStatus:
    ProductCreatePublicationStatus =
      status ===
        "DRAFT" ||
      status ===
        "INACTIVE" ||
      status ===
        "PUBLISHED"
        ? status
        : "PUBLISHED";


  return {
    name:
      input.name,

    categoryId:
      input.categoryId,

    brand:
      input.brand,

    description:
      input.description,

    price:
      input.price,

    compareAtPrice:
      input.compareAtPrice,

    stockQuantity:
      input.stockQuantity,

    unit:
      input.unit,

    ingredients:
      input.ingredients,

    weightContent:
      input.weightContent,

    usageInstructions:
      input.usageInstructions,

    publicationStatus,
  };
}


/* ==========================================================================
   EXTRACTION DE FORMDATA
   ========================================================================== */

export function getProductCreateRawInputFromFormData(
  formData:
    FormData,
): ProductCreateRawInput {
  return {
    intent:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .intent,
      ),

    submissionId:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .submissionId,
      ),

    name:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .name,
      ),

    categoryId:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .categoryId,
      ),

    brand:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .brand,
      ),

    description:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .description,
      ),

    price:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .price,
      ),

    compareAtPrice:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .compareAtPrice,
      ),

    stockQuantity:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .stockQuantity,
      ),

    unit:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .unit,
      ),

    ingredients:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .ingredients,
      ),

    weightContent:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .weightContent,
      ),

    usageInstructions:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .usageInstructions,
      ),

    publicationStatus:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .publicationStatus,
      ),

    images:
      readFormString(
        formData,
        PRODUCT_CREATE_FORM_FIELDS
          .images,
      ),
  };
}


/* ==========================================================================
   INTENT
   ========================================================================== */

function parseIntent(
  value:
    string,

  errors:
    MutableProductCreateFieldErrors,
): ProductCreateIntent | null {
  const normalized =
    normalizeSingleLineText(
      value,
    );


  if (
    normalized ===
      "draft" ||
    normalized ===
      "publish"
  ) {
    return normalized;
  }


  appendFieldError(
    errors,
    "intent",
    "L’action demandée est invalide. Veuillez réessayer.",
  );


  return null;
}


/* ==========================================================================
   SUBMISSION ID
   ========================================================================== */

function parseSubmissionId(
  value:
    string,

  errors:
    MutableProductCreateFieldErrors,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
    );


  if (
    normalized.length <
      PRODUCT_CREATE_LIMITS
        .submissionId
        .min ||
    normalized.length >
      PRODUCT_CREATE_LIMITS
        .submissionId
        .max
  ) {
    appendFieldError(
      errors,
      "submissionId",
      "La soumission du formulaire est invalide. Rechargez la page puis réessayez.",
    );


    return "";
  }


  if (
    !/^[A-Za-z0-9_-]+$/.test(
      normalized,
    )
  ) {
    appendFieldError(
      errors,
      "submissionId",
      "La soumission du formulaire est invalide. Rechargez la page puis réessayez.",
    );


    return "";
  }


  return normalized;
}


/* ==========================================================================
   NOM
   ========================================================================== */

function parseProductName(
  value:
    string,

  errors:
    MutableProductCreateFieldErrors,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
    );


  if (
    !normalized
  ) {
    appendFieldError(
      errors,
      "name",
      "Le nom du produit est obligatoire.",
    );


    return "";
  }


  if (
    normalized.length >
    PRODUCT_CREATE_LIMITS
      .name
      .max
  ) {
    appendFieldError(
      errors,
      "name",
      `Le nom du produit ne doit pas dépasser ${PRODUCT_CREATE_LIMITS.name.max} caractères.`,
    );
  }


  if (
    containsInvalidControlCharacters(
      normalized,
    )
  ) {
    appendFieldError(
      errors,
      "name",
      "Le nom du produit contient des caractères non autorisés.",
    );
  }


  return normalized;
}


/* ==========================================================================
   CATÉGORIE
   ========================================================================== */

function parseCategoryId(
  value:
    string,

  intent:
    ProductCreateIntent |
    null,

  errors:
    MutableProductCreateFieldErrors,
): string | null {
  const normalized =
    normalizeSingleLineText(
      value,
    );


  if (
    !normalized
  ) {
    if (
      intent ===
      "publish"
    ) {
      appendFieldError(
        errors,
        "categoryId",
        "Veuillez sélectionner une catégorie.",
      );
    }


    return null;
  }


  if (
    normalized.length >
    PRODUCT_CREATE_LIMITS
      .categoryId
      .max
  ) {
    appendFieldError(
      errors,
      "categoryId",
      "La catégorie sélectionnée est invalide.",
    );


    return null;
  }


  if (
    containsInvalidControlCharacters(
      normalized,
    )
  ) {
    appendFieldError(
      errors,
      "categoryId",
      "La catégorie sélectionnée est invalide.",
    );


    return null;
  }


  return normalized;
}


/* ==========================================================================
   MARQUE
   ========================================================================== */

/**
 * Pour l'architecture actuelle, L&E Cosmetics est la marque officielle
 * utilisée par défaut.
 *
 * Tant qu'aucune table de marques officielles n'existe, le navigateur
 * ne doit pas pouvoir inventer arbitrairement une autre marque.
 */

function parseBrand(
  value:
    string,

  errors:
    MutableProductCreateFieldErrors,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
    );


  if (
    !normalized
  ) {
    return PRODUCT_CREATE_DEFAULT_BRAND;
  }


  if (
    normalized.length >
    PRODUCT_CREATE_LIMITS
      .brand
      .max
  ) {
    appendFieldError(
      errors,
      "brand",
      "La marque renseignée est invalide.",
    );


    return PRODUCT_CREATE_DEFAULT_BRAND;
  }


  const normalizedOfficialBrand =
    PRODUCT_CREATE_DEFAULT_BRAND
      .toLocaleLowerCase(
        "fr",
      );


  if (
    normalized.toLocaleLowerCase(
      "fr",
    ) !==
    normalizedOfficialBrand
  ) {
    appendFieldError(
      errors,
      "brand",
      "La marque sélectionnée n’est pas autorisée.",
    );


    return PRODUCT_CREATE_DEFAULT_BRAND;
  }


  return PRODUCT_CREATE_DEFAULT_BRAND;
}


/* ==========================================================================
   DESCRIPTION
   ========================================================================== */

function parseDescription(
  value:
    string,

  intent:
    ProductCreateIntent |
    null,

  errors:
    MutableProductCreateFieldErrors,
): string | null {
  const normalized =
    normalizeMultilineText(
      value,
    );


  if (
    !normalized
  ) {
    if (
      intent ===
      "publish"
    ) {
      appendFieldError(
        errors,
        "description",
        "La description du produit est obligatoire pour la publication.",
      );
    }


    return null;
  }


  if (
    normalized.length >
    PRODUCT_CREATE_LIMITS
      .description
      .max
  ) {
    appendFieldError(
      errors,
      "description",
      `La description ne doit pas dépasser ${PRODUCT_CREATE_LIMITS.description.max} caractères.`,
    );
  }


  if (
    containsInvalidControlCharacters(
      normalized,
    )
  ) {
    appendFieldError(
      errors,
      "description",
      "La description contient des caractères non autorisés.",
    );
  }


  return normalized;
}


/* ==========================================================================
   TEXTES FACULTATIFS
   ========================================================================== */

function parseOptionalSingleLineField(
  value:
    string,

  field:
    "unit" |
    "weightContent",

  maxLength:
    number,

  label:
    string,

  errors:
    MutableProductCreateFieldErrors,
): string | null {
  const normalized =
    normalizeSingleLineText(
      value,
    );


  if (
    !normalized
  ) {
    return null;
  }


  if (
    normalized.length >
    maxLength
  ) {
    appendFieldError(
      errors,
      field,
      `${label} ne doit pas dépasser ${maxLength} caractères.`,
    );
  }


  if (
    containsInvalidControlCharacters(
      normalized,
    )
  ) {
    appendFieldError(
      errors,
      field,
      `${label} contient des caractères non autorisés.`,
    );
  }


  return normalized;
}


function parseOptionalMultilineField(
  value:
    string,

  field:
    "ingredients" |
    "usageInstructions",

  maxLength:
    number,

  label:
    string,

  errors:
    MutableProductCreateFieldErrors,
): string | null {
  const normalized =
    normalizeMultilineText(
      value,
    );


  if (
    !normalized
  ) {
    return null;
  }


  if (
    normalized.length >
    maxLength
  ) {
    appendFieldError(
      errors,
      field,
      `${label} ne doit pas dépasser ${maxLength} caractères.`,
    );
  }


  if (
    containsInvalidControlCharacters(
      normalized,
    )
  ) {
    appendFieldError(
      errors,
      field,
      `${label} contient des caractères non autorisés.`,
    );
  }


  return normalized;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

/**
 * Formats acceptés :
 *
 * 12500
 * 12500.5
 * 12500.50
 * 12500,50
 * 12 500
 *
 * Les espaces sont retirés.
 *
 * Les notations scientifiques et signes négatifs sont refusés.
 */

function parseMoney(
  rawValue:
    string,

  options:
    Readonly<{
      required:
        boolean;

      label:
        string;
    }>,
): ParsedMoneyResult {
  const trimmed =
    rawValue.trim();


  if (
    !trimmed
  ) {
    if (
      options.required
    ) {
      return {
        success:
          false,

        value:
          null,

        message:
          `${options.label} est obligatoire.`,
      };
    }


    return {
      success:
        true,

      value:
        null,

      message:
        null,
    };
  }


  const withoutSpaces =
    trimmed
      .replace(
        /\u00a0/g,
        "",
      )
      .replace(
        /\s/g,
        "",
      );


  const moneyPattern =
    new RegExp(
      `^\\d{1,${PRODUCT_CREATE_LIMITS.price.maxIntegerDigits}}(?:[\\.,]\\d{1,${PRODUCT_CREATE_LIMITS.price.decimalPlaces}})?$`,
    );


  if (
    !moneyPattern.test(
      withoutSpaces,
    )
  ) {
    return {
      success:
        false,

      value:
        null,

      message:
        `${options.label} est invalide.`,
    };
  }


  const canonical =
    withoutSpaces.replace(
      ",",
      ".",
    );


  const numericValue =
    Number(
      canonical,
    );


  if (
    !Number.isFinite(
      numericValue,
    ) ||
    numericValue <
      0
  ) {
    return {
      success:
        false,

      value:
        null,

      message:
        `${options.label} est invalide.`,
    };
  }


  return {
    success:
      true,

    value:
      numericValue,

    message:
      null,
  };
}


/* ==========================================================================
   STOCK
   ========================================================================== */

function parseStockQuantity(
  rawValue:
    string,

  required:
    boolean,
): ParsedStockResult {
  const normalized =
    rawValue.trim();


  if (
    !normalized
  ) {
    if (
      required
    ) {
      return {
        success:
          false,

        value:
          null,

        message:
          "Le stock disponible est obligatoire.",
      };
    }


    return {
      success:
        true,

      value:
        null,

      message:
        null,
    };
  }


  if (
    !/^\d+$/.test(
      normalized,
    )
  ) {
    return {
      success:
        false,

      value:
        null,

      message:
        "Le stock doit être un nombre entier supérieur ou égal à 0.",
    };
  }


  const value =
    Number(
      normalized,
    );


  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <
      PRODUCT_CREATE_LIMITS
        .stockQuantity
        .min ||
    value >
      PRODUCT_CREATE_LIMITS
        .stockQuantity
        .max
  ) {
    return {
      success:
        false,

      value:
        null,

      message:
        "La quantité de stock est invalide.",
    };
  }


  return {
    success:
      true,

    value,

    message:
      null,
  };
}


/* ==========================================================================
   STATUT DE PUBLICATION
   ========================================================================== */

function parsePublicationStatus(
  rawValue:
    string,

  intent:
    ProductCreateIntent |
    null,

  errors:
    MutableProductCreateFieldErrors,
): ProductCreatePublicationStatus {
  /**
   * Le bouton "Enregistrer comme brouillon" a priorité.
   */

  if (
    intent ===
    "draft"
  ) {
    return "DRAFT";
  }


  const normalized =
    normalizeSingleLineText(
      rawValue,
    );


  /**
   * Valeur par défaut du formulaire.
   */

  if (
    !normalized
  ) {
    return "PUBLISHED";
  }


  if (
    normalized ===
    "PUBLISHED" ||
    normalized ===
    "INACTIVE"
  ) {
    return normalized;
  }


  if (
    normalized ===
    "DRAFT"
  ) {
    appendFieldError(
      errors,
      "publicationStatus",
      "Pour enregistrer un brouillon, utilisez le bouton « Enregistrer comme brouillon ».",
    );


    return "DRAFT";
  }


  appendFieldError(
    errors,
    "publicationStatus",
    "Le statut du produit est invalide.",
  );


  return "PUBLISHED";
}


/* ==========================================================================
   IMAGES JSON
   ========================================================================== */

function parseImagesJson(
  rawValue:
    string,
): unknown {
  const normalized =
    rawValue.trim();


  if (
    !normalized
  ) {
    return [];
  }


  if (
    normalized.length >
    MAX_IMAGES_SERIALIZED_LENGTH
  ) {
    return Symbol.for(
      "product-images-too-large",
    );
  }


  try {
    return JSON.parse(
      normalized,
    ) as unknown;
  } catch {
    return Symbol.for(
      "invalid-product-images-json",
    );
  }
}


/* ==========================================================================
   IMAGES
   ========================================================================== */

function parseProductImages(
  rawValue:
    string,
): ParsedImagesResult {
  const parsed =
    parseImagesJson(
      rawValue,
    );


  if (
    parsed ===
    Symbol.for(
      "product-images-too-large",
    )
  ) {
    return {
      images:
        [],

      fieldErrors: [
        "Les données des images sont trop volumineuses.",
      ],

      imageErrors:
        [],
    };
  }


  if (
    parsed ===
    Symbol.for(
      "invalid-product-images-json",
    )
  ) {
    return {
      images:
        [],

      fieldErrors: [
        "Les données des images sont invalides.",
      ],

      imageErrors:
        [],
    };
  }


  if (
    !Array.isArray(
      parsed,
    )
  ) {
    return {
      images:
        [],

      fieldErrors: [
        "Les données des images sont invalides.",
      ],

      imageErrors:
        [],
    };
  }


  if (
    parsed.length >
    PRODUCT_CREATE_LIMITS
      .images
      .max
  ) {
    return {
      images:
        [],

      fieldErrors: [
        `Vous pouvez ajouter au maximum ${PRODUCT_CREATE_LIMITS.images.max} images par produit.`,
      ],

      imageErrors:
        [],
    };
  }


  const images:
    ProductCreateImageInput[] =
      [];


  const imageErrors:
    ProductCreateImageFieldError[] =
      [];


  parsed.forEach(
    (
      candidate,
      index,
    ) => {
      const result =
        productCreateImageInputSchema
          .safeParse(
            candidate,
          );


      if (
        !result.success
      ) {
        const message =
          result.error
            .issues[0]
            ?.message ??
          "Cette image est invalide.";


        imageErrors.push({
          index,
          message,
        });


        return;
      }


      images.push(
        result.data,
      );
    },
  );


  if (
    imageErrors.length >
    0
  ) {
    return {
      images:
        [],

      fieldErrors:
        [],

      imageErrors,
    };
  }


  /* ------------------------------------------------------------------------
     DOUBLONS
     ------------------------------------------------------------------------ */

  const imageUrls =
    new Set<string>();


  const uploadedFileIds =
    new Set<string>();


  const uploadedStoragePaths =
    new Set<string>();


  const existingImageIds =
    new Set<string>();


  images.forEach(
    (
      image,
      index,
    ) => {
      /* --------------------------------------------------------------------
         URL
         --------------------------------------------------------------------
         Une même URL ne doit pas apparaître deux fois, quelle que soit
         l'origine de l'image.
         -------------------------------------------------------------------- */

      if (
        imageUrls.has(
          image.url,
        )
      ) {
        imageErrors.push({
          index,
          message:
            "Cette image est présente plusieurs fois.",
        });
      } else {
        imageUrls.add(
          image.url,
        );
      }


      /* --------------------------------------------------------------------
         IMAGE EXISTANTE
         -------------------------------------------------------------------- */

      if (
        image.source ===
        "EXISTING"
      ) {
        if (
          existingImageIds.has(
            image.id,
          )
        ) {
          imageErrors.push({
            index,
            message:
              "Cette image existante est présente plusieurs fois.",
          });
        } else {
          existingImageIds.add(
            image.id,
          );
        }


        return;
      }


      /* --------------------------------------------------------------------
         NOUVELLE IMAGE UPLOADÉE
         --------------------------------------------------------------------
         Ici TypeScript sait que :

         - fileId est string ;
         - storagePath est string ;
         - source = UPLOADED.
         -------------------------------------------------------------------- */

      if (
        uploadedFileIds.has(
          image.fileId,
        )
      ) {
        imageErrors.push({
          index,
          message:
            "Cette image uploadée est présente plusieurs fois.",
        });
      } else {
        uploadedFileIds.add(
          image.fileId,
        );
      }


      if (
        uploadedStoragePaths.has(
          image.storagePath,
        )
      ) {
        imageErrors.push({
          index,
          message:
            "Ce fichier image est présent plusieurs fois.",
        });
      } else {
        uploadedStoragePaths.add(
          image.storagePath,
        );
      }
    },
  );


  if (
    imageErrors.length >
    0
  ) {
    return {
      images:
        [],

      fieldErrors:
        [],

      imageErrors,
    };
  }


  /**
   * Le navigateur peut envoyer des positions arbitraires.
   *
   * Le serveur reconstruit donc :
   *
   * 0
   * 1
   * 2
   * ...
   *
   * et garantit une seule image principale.
   */

  const normalizedImages =
    normalizeProductCreateImages(
      images,
    );


  return {
    images:
      normalizedImages,

    fieldErrors:
      [],

    imageErrors:
      [],
  };
}


/* ==========================================================================
   VALIDATION PRINCIPALE
   ========================================================================== */

export function parseProductCreateInput(
  rawInput:
    ProductCreateRawInput,
): ProductCreateParseResult {
  /* ------------------------------------------------------------------------
     VALEURS À RÉAFFICHER
     ------------------------------------------------------------------------ */

  const values =
    createProductCreateFormValuesFromRawInput(
      rawInput,
    );


  /* ------------------------------------------------------------------------
     PREMIÈRE BARRIÈRE ZOD
     ------------------------------------------------------------------------ */

  const rawResult =
    productCreateRawInputSchema.safeParse(
      rawInput,
    );


  if (
    !rawResult.success
  ) {
    return {
      success:
        false,

      data:
        null,

      message:
        "Certaines informations du produit sont invalides.",

      fieldErrors: {
        name: [
          "Le formulaire contient des données invalides. Vérifiez les informations saisies.",
        ],
      },

      imageErrors:
        [],

      values,
    };
  }


  const input =
    rawResult.data;


  const fieldErrors:
    MutableProductCreateFieldErrors =
      {};


  /* ------------------------------------------------------------------------
     ACTION
     ------------------------------------------------------------------------ */

  const intent =
    parseIntent(
      input.intent,
      fieldErrors,
    );


  /* ------------------------------------------------------------------------
     ANTI DOUBLE-SOUMISSION
     ------------------------------------------------------------------------ */

  const submissionId =
    parseSubmissionId(
      input.submissionId,
      fieldErrors,
    );


  /* ------------------------------------------------------------------------
     INFORMATIONS GÉNÉRALES
     ------------------------------------------------------------------------ */

  const name =
    parseProductName(
      input.name,
      fieldErrors,
    );


  const categoryId =
    parseCategoryId(
      input.categoryId,
      intent,
      fieldErrors,
    );


  const brand =
    parseBrand(
      input.brand,
      fieldErrors,
    );


  const description =
    parseDescription(
      input.description,
      intent,
      fieldErrors,
    );


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  const priceResult =
    parseMoney(
      input.price,
      {
        required:
          intent ===
          "publish",

        label:
          "Le prix de vente",
      },
    );


  if (
    !priceResult.success &&
    priceResult.message
  ) {
    appendFieldError(
      fieldErrors,
      "price",
      priceResult.message,
    );
  }


  const compareAtPriceResult =
    parseMoney(
      input.compareAtPrice,
      {
        required:
          false,

        label:
          "Le prix barré",
      },
    );


  if (
    !compareAtPriceResult.success &&
    compareAtPriceResult.message
  ) {
    appendFieldError(
      fieldErrors,
      "compareAtPrice",
      compareAtPriceResult.message,
    );
  }


  /* ------------------------------------------------------------------------
     COHÉRENCE PRIX BARRÉ
     ------------------------------------------------------------------------ */

  if (
    compareAtPriceResult.success &&
    compareAtPriceResult.value !==
      null
  ) {
    if (
      !priceResult.success ||
      priceResult.value ===
        null
    ) {
      appendFieldError(
        fieldErrors,
        "price",
        "Renseignez le prix de vente avant d’ajouter un prix barré.",
      );
    } else if (
      compareAtPriceResult.value <=
      priceResult.value
    ) {
      appendFieldError(
        fieldErrors,
        "compareAtPrice",
        "Le prix barré doit être supérieur au prix de vente.",
      );
    }
  }


  /* ------------------------------------------------------------------------
     STOCK
     ------------------------------------------------------------------------ */

  const stockResult =
    parseStockQuantity(
      input.stockQuantity,
      intent ===
        "publish",
    );


  if (
    !stockResult.success &&
    stockResult.message
  ) {
    appendFieldError(
      fieldErrors,
      "stockQuantity",
      stockResult.message,
    );
  }


  /* ------------------------------------------------------------------------
     UNITÉ
     ------------------------------------------------------------------------ */

  const unit =
    parseOptionalSingleLineField(
      input.unit,
      "unit",
      PRODUCT_CREATE_LIMITS
        .unit
        .max,
      "L’unité",
      fieldErrors,
    );


  /* ------------------------------------------------------------------------
     DÉTAILS SUPPLÉMENTAIRES
     ------------------------------------------------------------------------ */

  const ingredients =
    parseOptionalMultilineField(
      input.ingredients,
      "ingredients",
      PRODUCT_CREATE_LIMITS
        .ingredients
        .max,
      "Les ingrédients",
      fieldErrors,
    );


  const weightContent =
    parseOptionalSingleLineField(
      input.weightContent,
      "weightContent",
      PRODUCT_CREATE_LIMITS
        .weightContent
        .max,
      "Le poids / la contenance",
      fieldErrors,
    );


  const usageInstructions =
    parseOptionalMultilineField(
      input.usageInstructions,
      "usageInstructions",
      PRODUCT_CREATE_LIMITS
        .usageInstructions
        .max,
      "Le mode d’utilisation",
      fieldErrors,
    );


  /* ------------------------------------------------------------------------
     STATUT
     ------------------------------------------------------------------------ */

  const publicationStatus =
    parsePublicationStatus(
      input.publicationStatus,
      intent,
      fieldErrors,
    );


  /* ------------------------------------------------------------------------
     IMAGES
     ------------------------------------------------------------------------ */

  const imageResult =
    parseProductImages(
      input.images,
    );


  imageResult.fieldErrors.forEach(
    (
      message,
    ) => {
      appendFieldError(
        fieldErrors,
        "images",
        message,
      );
    },
  );


  /* ------------------------------------------------------------------------
     PUBLICATION — RÈGLES OBLIGATOIRES
     ------------------------------------------------------------------------
     Pour Publier :
     
     - nom ;
     - catégorie ;
     - description ;
     - prix ;
     - stock.

     Les images restent facultatives dans cette version car le cahier des
     charges ne les a pas définies comme obligation absolue de publication.
     ------------------------------------------------------------------------ */

  if (
    intent ===
    "publish"
  ) {
    if (
      !categoryId &&
      !fieldErrors.categoryId
    ) {
      appendFieldError(
        fieldErrors,
        "categoryId",
        "Veuillez sélectionner une catégorie.",
      );
    }


    if (
      !description &&
      !fieldErrors.description
    ) {
      appendFieldError(
        fieldErrors,
        "description",
        "La description du produit est obligatoire pour la publication.",
      );
    }


    if (
      priceResult.value ===
        null &&
      !fieldErrors.price
    ) {
      appendFieldError(
        fieldErrors,
        "price",
        "Le prix de vente est obligatoire.",
      );
    }


    if (
      stockResult.value ===
        null &&
      !fieldErrors.stockQuantity
    ) {
      appendFieldError(
        fieldErrors,
        "stockQuantity",
        "Le stock disponible est obligatoire.",
      );
    }
  }


  /* ------------------------------------------------------------------------
     ERREURS
     ------------------------------------------------------------------------ */

  if (
    !intent ||
    hasFieldErrors(
      fieldErrors,
    ) ||
    imageResult.imageErrors
      .length >
      0
  ) {
    return {
      success:
        false,

      data:
        null,

      message:
        intent ===
          "publish"
          ? "Impossible de publier le produit. Vérifiez les informations indiquées."
          : "Impossible d’enregistrer le brouillon. Vérifiez les informations indiquées.",

      fieldErrors:
        fieldErrors as
          ProductCreateFieldErrors,

      imageErrors:
        imageResult.imageErrors,

      values,
    };
  }


  /* ------------------------------------------------------------------------
     DONNÉES VALIDÉES
     ------------------------------------------------------------------------ */

  const validatedInput:
    ProductCreateValidatedInput = {
    intent,

    submissionId,

    name,

    categoryId,

    brand,

    description,

    price:
      priceResult.value,

    compareAtPrice:
      compareAtPriceResult
        .value,

    stockQuantity:
      stockResult.value,

    unit,

    ingredients,

    weightContent,

    usageInstructions,

    publicationStatus,

    images:
      imageResult.images,
  };


  return {
    success:
      true,

    data:
      validatedInput,

    fieldErrors:
      null,

    imageErrors:
      [],

    values,
  };
}


/* ==========================================================================
   VALIDATION DIRECTE DE FORMDATA
   ========================================================================== */

/**
 * Point d'entrée principal pour :
 *
 * product-create-actions.ts
 *
 * Exemple :
 *
 * const parsed =
 *   parseProductCreateFormData(formData);
 *
 * if (!parsed.success) {
 *   return ...
 * }
 *
 * const input = parsed.data;
 */

export function parseProductCreateFormData(
  formData:
    FormData,
): ProductCreateParseResult {
  return parseProductCreateInput(
    getProductCreateRawInputFromFormData(
      formData,
    ),
  );
}