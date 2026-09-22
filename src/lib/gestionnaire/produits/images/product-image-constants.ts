/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — CONSTANTES ET VALIDATION DES IMAGES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/images/product-image-constants.ts
 *
 * IMPORTANT :
 *
 * Ce module est volontairement UNIVERSAL :
 *
 * - utilisable dans un Client Component ;
 * - utilisable dans un Server Component ;
 * - utilisable dans un Route Handler ;
 * - aucune dépendance Node.js ;
 * - aucun secret ;
 * - aucun accès à Supabase ;
 * - aucun accès à Prisma ;
 * - aucun accès à la session Gestionnaire.
 *
 * Il constitue la source centrale pour :
 *
 * - le nombre maximum d'images ;
 * - la taille maximale par image ;
 * - les formats autorisés ;
 * - le champ multipart des fichiers ;
 * - le groupe d'upload ;
 * - la route API ;
 * - la validation préliminaire des métadonnées ;
 * - la validation des identifiants Storage.
 *
 * ATTENTION :
 *
 * La validation réalisée ici porte sur les MÉTADONNÉES du fichier :
 *
 * - nom ;
 * - MIME type ;
 * - taille.
 *
 * Elle ne remplace pas une validation binaire réelle du contenu du fichier.
 * Une route serveur peut ultérieurement ajouter une inspection des magic bytes
 * ou un traitement d'image sans modifier le contrat public de ce module.
 *
 * ============================================================================
 */


/* ==========================================================================
   LIMITES GLOBALES
   ========================================================================== */

/**
 * Nombre maximal d'images associables à un produit.
 *
 * Cette valeur doit rester synchronisée avec :
 *
 * PRODUCT_CREATE_LIMITS.images.max
 *
 * actuellement fixé à 8.
 */
export const PRODUCT_IMAGE_MAX_FILES =
  8 as const;


/**
 * Taille maximale d'une image en mégaoctets.
 *
 * La maquette produit fixe actuellement :
 *
 * max. 5 Mo par image.
 */
export const PRODUCT_IMAGE_MAX_FILE_SIZE_MB =
  5 as const;


/**
 * Un mégaoctet est calculé sur une base binaire.
 */
export const PRODUCT_IMAGE_BYTES_PER_MB =
  1024 * 1024;


/**
 * Taille maximale réellement vérifiée par l'application.
 */
export const PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES =
  PRODUCT_IMAGE_MAX_FILE_SIZE_MB *
  PRODUCT_IMAGE_BYTES_PER_MB;


/**
 * Un fichier vide n'est jamais accepté.
 */
export const PRODUCT_IMAGE_MIN_FILE_SIZE_BYTES =
  1 as const;


/**
 * Longueur maximale raisonnable du nom original du fichier.
 *
 * Le nom original n'est pas utilisé directement comme chemin Storage,
 * mais il reste contrôlé afin d'éviter les métadonnées anormales.
 */
export const PRODUCT_IMAGE_MAX_FILE_NAME_LENGTH =
  255 as const;


/* ==========================================================================
   API
   ========================================================================== */

/**
 * Endpoint unique utilisé par :
 *
 * POST   -> upload
 * DELETE -> suppression
 */
export const PRODUCT_IMAGE_UPLOAD_API_ROUTE =
  "/api/gestionnaire/produits/images" as const;


/**
 * Nom du champ multipart contenant les images.
 *
 * Exemple :
 *
 * formData.append("files", file)
 */
export const PRODUCT_IMAGE_UPLOAD_FORM_FIELD =
  "files" as const;


/**
 * Identifiant permettant de regrouper plusieurs images envoyées pendant
 * une même opération.
 */
export const PRODUCT_IMAGE_UPLOAD_GROUP_FORM_FIELD =
  "uploadGroupId" as const;


/* ==========================================================================
   MIME TYPES
   ========================================================================== */

export const PRODUCT_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;


export type ProductImageMimeType =
  (
    typeof PRODUCT_IMAGE_ALLOWED_MIME_TYPES
  )[number];


/* ==========================================================================
   EXTENSIONS
   ========================================================================== */

/**
 * Extensions reconnues en entrée.
 *
 * JPEG accepte volontairement :
 *
 * - .jpg
 * - .jpeg
 */
export const PRODUCT_IMAGE_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
] as const;


export type ProductImageExtension =
  (
    typeof PRODUCT_IMAGE_ALLOWED_EXTENSIONS
  )[number];


/* ==========================================================================
   ACCEPT ATTRIBUTE
   ========================================================================== */

/**
 * Utilisé directement par :
 *
 * <input type="file" accept={PRODUCT_IMAGE_ACCEPT_ATTRIBUTE} />
 *
 * L'attribut accept n'est PAS une sécurité.
 * La route serveur revérifie les métadonnées.
 */
export const PRODUCT_IMAGE_ACCEPT_ATTRIBUTE =
  PRODUCT_IMAGE_ALLOWED_MIME_TYPES.join(
    ",",
  );


/* ==========================================================================
   LABELS
   ========================================================================== */

export const PRODUCT_IMAGE_ALLOWED_FORMAT_LABELS =
  [
    "JPEG",
    "PNG",
    "WebP",
    "AVIF",
  ] as const;


/**
 * Texte exploitable directement dans certaines interfaces.
 */
export const PRODUCT_IMAGE_ALLOWED_FORMATS_LABEL =
  "JPEG, PNG, WebP ou AVIF" as const;


/* ==========================================================================
   MIME → EXTENSION CANONIQUE
   ========================================================================== */

/**
 * Pour le stockage, JPEG est normalisé en .jpg.
 */
const PRODUCT_IMAGE_MIME_EXTENSION_MAP:
  Readonly<
    Record<
      ProductImageMimeType,
      ProductImageExtension
    >
  > = {
    "image/jpeg":
      "jpg",

    "image/png":
      "png",

    "image/webp":
      "webp",

    "image/avif":
      "avif",
  };


/* ==========================================================================
   EXTENSION → MIME
   ========================================================================== */

const PRODUCT_IMAGE_EXTENSION_MIME_MAP:
  Readonly<
    Record<
      ProductImageExtension,
      ProductImageMimeType
    >
  > = {
    jpg:
      "image/jpeg",

    jpeg:
      "image/jpeg",

    png:
      "image/png",

    webp:
      "image/webp",

    avif:
      "image/avif",
  };


/* ==========================================================================
   TYPES — MÉTADONNÉES
   ========================================================================== */

export interface ProductImageFileMetadata {
  readonly name:
    string;

  readonly type:
    string;

  readonly size:
    number;
}


/* ==========================================================================
   TYPES — VALIDATION
   ========================================================================== */

export type ProductImageFileValidationErrorCode =
  | "INVALID_FILE_NAME"
  | "INVALID_MIME_TYPE"
  | "INVALID_FILE_SIZE";


export interface ProductImageFileValidationSuccess {
  readonly success:
    true;

  readonly mimeType:
    ProductImageMimeType;

  readonly extension:
    ProductImageExtension;
}


export interface ProductImageFileValidationFailure {
  readonly success:
    false;

  readonly code:
    ProductImageFileValidationErrorCode;

  readonly message:
    string;
}


export type ProductImageFileValidationResult =
  | ProductImageFileValidationSuccess
  | ProductImageFileValidationFailure;


/* ==========================================================================
   MIME TYPE GUARD
   ========================================================================== */

export function isProductImageMimeType(
  value:
    unknown,
): value is ProductImageMimeType {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  return (
    PRODUCT_IMAGE_ALLOWED_MIME_TYPES as
      readonly string[]
  ).includes(
    value
      .trim()
      .toLowerCase(),
  );
}


/* ==========================================================================
   EXTENSION GUARD
   ========================================================================== */

export function isProductImageExtension(
  value:
    unknown,
): value is ProductImageExtension {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  return (
    PRODUCT_IMAGE_ALLOWED_EXTENSIONS as
      readonly string[]
  ).includes(
    value
      .trim()
      .toLowerCase(),
  );
}


/* ==========================================================================
   EXTRACTION DE L'EXTENSION
   ========================================================================== */

export function getProductImageFileExtension(
  fileName:
    string,
): string | null {
  const normalizedName =
    fileName.trim();


  const lastDotIndex =
    normalizedName.lastIndexOf(
      ".",
    );


  if (
    lastDotIndex <=
      0 ||
    lastDotIndex ===
      normalizedName.length -
        1
  ) {
    return null;
  }


  return normalizedName
    .slice(
      lastDotIndex +
        1,
    )
    .trim()
    .toLowerCase();
}


/* ==========================================================================
   EXTENSION CANONIQUE
   ========================================================================== */

export function getProductImageExtensionFromMimeType(
  mimeType:
    ProductImageMimeType,
): ProductImageExtension {
  return PRODUCT_IMAGE_MIME_EXTENSION_MAP[
    mimeType
  ];
}


/* ==========================================================================
   MIME ATTENDU POUR UNE EXTENSION
   ========================================================================== */

export function getProductImageMimeTypeFromExtension(
  extension:
    ProductImageExtension,
): ProductImageMimeType {
  return PRODUCT_IMAGE_EXTENSION_MIME_MAP[
    extension
  ];
}


/* ==========================================================================
   VALIDATION DU NOM
   ========================================================================== */

function validateProductImageFileName(
  value:
    unknown,
): ProductImageFileValidationFailure | null {
  if (
    typeof value !==
    "string"
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        "Le nom du fichier image est invalide.",
    };
  }


  const fileName =
    value.trim();


  if (
    !fileName
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        "Le nom du fichier image est obligatoire.",
    };
  }


  if (
    fileName.length >
    PRODUCT_IMAGE_MAX_FILE_NAME_LENGTH
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        `Le nom du fichier est trop long. Maximum ${PRODUCT_IMAGE_MAX_FILE_NAME_LENGTH} caractères.`,
    };
  }


  /**
   * Interdit :
   *
   * - caractères ASCII de contrôle ;
   * - DEL ;
   * - null byte.
   */
  if (
    /[\u0000-\u001F\u007F]/.test(
      fileName,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        "Le nom du fichier contient des caractères non autorisés.",
    };
  }


  /**
   * Même si le nom du fichier n'est jamais utilisé directement comme chemin
   * Storage, on refuse les séparateurs de chemins pour garder un contrat
   * strict et éviter toute ambiguïté.
   */
  if (
    fileName.includes(
      "/",
    ) ||
    fileName.includes(
      "\\",
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        "Le nom du fichier image est invalide.",
    };
  }


  const extension =
    getProductImageFileExtension(
      fileName,
    );


  if (
    !extension ||
    !isProductImageExtension(
      extension,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        "L’extension de l’image n’est pas prise en charge. Utilisez JPEG, PNG, WebP ou AVIF.",
    };
  }


  return null;
}


/* ==========================================================================
   VALIDATION MIME TYPE
   ========================================================================== */

function validateProductImageMimeType(
  value:
    unknown,
): ProductImageFileValidationFailure | null {
  if (
    typeof value !==
    "string"
  ) {
    return {
      success:
        false,

      code:
        "INVALID_MIME_TYPE",

      message:
        "Le format de l’image est invalide.",
    };
  }


  const mimeType =
    value
      .trim()
      .toLowerCase();


  if (
    !isProductImageMimeType(
      mimeType,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_MIME_TYPE",

      message:
        "Format non pris en charge. Utilisez une image JPEG, PNG, WebP ou AVIF.",
    };
  }


  return null;
}


/* ==========================================================================
   VALIDATION TAILLE
   ========================================================================== */

function validateProductImageFileSize(
  value:
    unknown,
): ProductImageFileValidationFailure | null {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    ) ||
    !Number.isInteger(
      value,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_SIZE",

      message:
        "La taille de l’image est invalide.",
    };
  }


  if (
    value <
    PRODUCT_IMAGE_MIN_FILE_SIZE_BYTES
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_SIZE",

      message:
        "Le fichier image est vide.",
    };
  }


  if (
    value >
    PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_SIZE",

      message:
        `L’image dépasse la taille maximale autorisée de ${PRODUCT_IMAGE_MAX_FILE_SIZE_MB} Mo.`,
    };
  }


  return null;
}


/* ==========================================================================
   COHÉRENCE EXTENSION / MIME
   ========================================================================== */

function validateProductImageExtensionMatchesMimeType(
  fileName:
    string,

  mimeType:
    ProductImageMimeType,
): ProductImageFileValidationFailure | null {
  const rawExtension =
    getProductImageFileExtension(
      fileName,
    );


  if (
    !rawExtension ||
    !isProductImageExtension(
      rawExtension,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_NAME",

      message:
        "L’extension du fichier image est invalide.",
    };
  }


  const expectedMimeType =
    getProductImageMimeTypeFromExtension(
      rawExtension,
    );


  if (
    expectedMimeType !==
    mimeType
  ) {
    return {
      success:
        false,

      code:
        "INVALID_MIME_TYPE",

      message:
        "Le format déclaré de l’image ne correspond pas à son extension.",
    };
  }


  return null;
}


/* ==========================================================================
   VALIDATION PUBLIQUE DES MÉTADONNÉES
   ========================================================================== */

/**
 * Utilisée côté client AVANT upload puis côté serveur AVANT Storage.
 *
 * Exemple :
 *
 * const validation =
 *   validateProductImageFileMetadata({
 *     name: file.name,
 *     type: file.type,
 *     size: file.size,
 *   });
 *
 * if (!validation.success) {
 *   console.log(validation.message);
 *   return;
 * }
 *
 * validation.mimeType
 * validation.extension
 */

export function validateProductImageFileMetadata(
  metadata:
    ProductImageFileMetadata,
): ProductImageFileValidationResult {
  /* ------------------------------------------------------------------------
     NOM
     ------------------------------------------------------------------------ */

  const fileNameValidation =
    validateProductImageFileName(
      metadata.name,
    );


  if (
    fileNameValidation
  ) {
    return fileNameValidation;
  }


  /* ------------------------------------------------------------------------
     MIME TYPE
     ------------------------------------------------------------------------ */

  const mimeTypeValidation =
    validateProductImageMimeType(
      metadata.type,
    );


  if (
    mimeTypeValidation
  ) {
    return mimeTypeValidation;
  }


  /* ------------------------------------------------------------------------
     TAILLE
     ------------------------------------------------------------------------ */

  const sizeValidation =
    validateProductImageFileSize(
      metadata.size,
    );


  if (
    sizeValidation
  ) {
    return sizeValidation;
  }


  /* ------------------------------------------------------------------------
     MIME NORMALISÉ
     ------------------------------------------------------------------------ */

  const mimeType =
    metadata.type
      .trim()
      .toLowerCase();


  if (
    !isProductImageMimeType(
      mimeType,
    )
  ) {
    /**
     * Protection TypeScript défensive.
     *
     * Normalement impossible puisque la validation MIME précédente vient
     * d'être exécutée.
     */
    return {
      success:
        false,

      code:
        "INVALID_MIME_TYPE",

      message:
        "Le format de l’image n’est pas pris en charge.",
    };
  }


  /* ------------------------------------------------------------------------
     COHÉRENCE EXTENSION / MIME
     ------------------------------------------------------------------------ */

  const extensionMimeValidation =
    validateProductImageExtensionMatchesMimeType(
      metadata.name,
      mimeType,
    );


  if (
    extensionMimeValidation
  ) {
    return extensionMimeValidation;
  }


  /* ------------------------------------------------------------------------
     SUCCÈS
     ------------------------------------------------------------------------ */

  return {
    success:
      true,

    mimeType,

    /**
     * Nous utilisons une extension canonique.
     *
     * image/jpeg => jpg
     *
     * même si le fichier original s'appelait .jpeg.
     */
    extension:
      getProductImageExtensionFromMimeType(
        mimeType,
      ),
  };
}


/* ==========================================================================
   CAPACITÉ D'AJOUT
   ========================================================================== */

/**
 * Vérifie qu'un ensemble de nouveaux fichiers peut être ajouté sans dépasser
 * PRODUCT_IMAGE_MAX_FILES.
 *
 * Exemples :
 *
 * 0 existante + 4 nouvelles => true
 * 6 existantes + 2 nouvelles => true
 * 7 existantes + 2 nouvelles => false
 */

export function canAddProductImageFiles(
  currentCount:
    number,

  additionalCount:
    number,
): boolean {
  if (
    !Number.isFinite(
      currentCount,
    ) ||
    !Number.isInteger(
      currentCount,
    ) ||
    currentCount <
      0
  ) {
    return false;
  }


  if (
    !Number.isFinite(
      additionalCount,
    ) ||
    !Number.isInteger(
      additionalCount,
    ) ||
    additionalCount <=
      0
  ) {
    return false;
  }


  if (
    currentCount >
    PRODUCT_IMAGE_MAX_FILES
  ) {
    return false;
  }


  return (
    currentCount +
      additionalCount <=
    PRODUCT_IMAGE_MAX_FILES
  );
}


/* ==========================================================================
   NOMBRE D'EMPLACEMENTS RESTANTS
   ========================================================================== */

export function getRemainingProductImageSlots(
  currentCount:
    number,
): number {
  if (
    !Number.isFinite(
      currentCount,
    )
  ) {
    return 0;
  }


  const normalizedCount =
    Math.max(
      0,
      Math.trunc(
        currentCount,
      ),
    );


  return Math.max(
    0,
    PRODUCT_IMAGE_MAX_FILES -
      normalizedCount,
  );
}


/* ==========================================================================
   IDENTIFIANTS STORAGE
   ========================================================================== */

/**
 * Identifiants acceptés pour les segments Storage internes :
 *
 * - storeId ;
 * - uploadGroupId ;
 * - fileId.
 *
 * Exemples valides :
 *
 * cmabc123xyz
 * upload_8ab4f...
 * abc_DEF-123
 *
 * Exemple invalide :
 *
 * ../../autre-boutique
 */

export function isProductImageStorageIdentifierSafe(
  value:
    unknown,
): value is string {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      191
  ) {
    return false;
  }


  /**
   * Un segment Storage ne peut contenir que :
   *
   * - lettres ;
   * - chiffres ;
   * - underscore ;
   * - tiret.
   *
   * Aucun :
   *
   * - slash ;
   * - backslash ;
   * - point ;
   * - espace ;
   * - caractère de contrôle.
   */
  return /^[A-Za-z0-9_-]+$/.test(
    normalized,
  );
}


/* ==========================================================================
   NOM DE FICHIER SÛR — INFORMATIONNEL
   ========================================================================== */

/**
 * Cette fonction NE génère pas les chemins Storage.
 *
 * Elle permet seulement de transformer un nom original en base lisible si un
 * service serveur en a besoin.
 *
 * Le véritable chemin Storage doit toujours être créé côté serveur avec un
 * identifiant aléatoire.
 */

export function normalizeProductImageFileNameBase(
  fileName:
    string,
): string {
  const extension =
    getProductImageFileExtension(
      fileName,
    );


  const nameWithoutExtension =
    extension
      ? fileName.slice(
          0,
          -(
            extension.length +
            1
          ),
        )
      : fileName;


  const normalized =
    nameWithoutExtension
      .normalize(
        "NFKD",
      )
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        80,
      );


  return (
    normalized ||
    "image-produit"
  );
}


/* ==========================================================================
   FORMATAGE DE TAILLE
   ========================================================================== */

/**
 * Helper réutilisable dans l'interface.
 */

export function formatProductImageFileSize(
  bytes:
    number | null | undefined,
): string {
  if (
    typeof bytes !==
      "number" ||
    !Number.isFinite(
      bytes,
    ) ||
    bytes <
      0
  ) {
    return "—";
  }


  if (
    bytes <
    1024
  ) {
    return `${Math.round(
      bytes,
    )} o`;
  }


  const kilobytes =
    bytes /
    1024;


  if (
    kilobytes <
    1024
  ) {
    return `${kilobytes.toFixed(
      kilobytes >=
        100
        ? 0
        : 1,
    )} Ko`;
  }


  const megabytes =
    kilobytes /
    1024;


  return `${megabytes.toFixed(
    megabytes >=
      100
      ? 0
      : 1,
  )} Mo`;
}


/* ==========================================================================
   CONFIGURATION PUBLIQUE
   ========================================================================== */

/**
 * Objet pratique pour les composants ou tests.
 *
 * Aucune information sensible ici.
 */

export const PRODUCT_IMAGE_CONFIG =
  Object.freeze({
    maxFiles:
      PRODUCT_IMAGE_MAX_FILES,

    maxFileSizeMb:
      PRODUCT_IMAGE_MAX_FILE_SIZE_MB,

    maxFileSizeBytes:
      PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,

    minFileSizeBytes:
      PRODUCT_IMAGE_MIN_FILE_SIZE_BYTES,

    maxFileNameLength:
      PRODUCT_IMAGE_MAX_FILE_NAME_LENGTH,

    accept:
      PRODUCT_IMAGE_ACCEPT_ATTRIBUTE,

    apiRoute:
      PRODUCT_IMAGE_UPLOAD_API_ROUTE,

    fileFormField:
      PRODUCT_IMAGE_UPLOAD_FORM_FIELD,

    uploadGroupFormField:
      PRODUCT_IMAGE_UPLOAD_GROUP_FORM_FIELD,

    allowedMimeTypes:
      PRODUCT_IMAGE_ALLOWED_MIME_TYPES,

    allowedExtensions:
      PRODUCT_IMAGE_ALLOWED_EXTENSIONS,

    formatLabel:
      PRODUCT_IMAGE_ALLOWED_FORMATS_LABEL,
  } as const);