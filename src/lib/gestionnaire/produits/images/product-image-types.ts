import type {
  ProductImageMimeType,
} from "@/lib/gestionnaire/produits/images/product-image-constants";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — CONTRATS API DES IMAGES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/images/product-image-types.ts
 *
 * RÔLE :
 *
 * Ce fichier centralise tous les contrats TypeScript utilisés entre :
 *
 * - ProduitImagesSection.tsx ;
 * - ModifierProduitImages.tsx ;
 * - /api/gestionnaire/produits/images ;
 * - product-image-storage.ts ;
 * - création produit ;
 * - modification produit.
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - ne contient aucun secret ;
 * - ne dépend pas de Prisma ;
 * - ne dépend pas de Supabase ;
 * - ne dépend pas de Node.js ;
 * - peut être importé côté navigateur ;
 * - peut être importé côté serveur ;
 * - décrit uniquement les données échangées.
 *
 * API actuelle :
 *
 * POST   /api/gestionnaire/produits/images
 * DELETE /api/gestionnaire/produits/images
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES DE BASE
   ========================================================================== */

/**
 * Identifiant opaque généré côté serveur pour une image uploadée.
 *
 * Le navigateur peut le conserver mais ne doit jamais le générer pour
 * autoriser une opération serveur.
 */
export type ProductImageFileId =
  string;


/**
 * Chemin réel de l'objet dans Supabase Storage.
 *
 * Exemple conceptuel :
 *
 * stores/<storeId>/<uploadGroupId>/<fileId>.webp
 *
 * Le serveur reste responsable de vérifier l'appartenance du chemin
 * à la boutique courante.
 */
export type ProductImageStoragePath =
  string;


/**
 * URL publique persistante retournée après upload.
 */
export type ProductImagePublicUrl =
  string;


/**
 * Identifiant permettant de regrouper plusieurs fichiers envoyés au cours
 * d'une même opération.
 */
export type ProductImageUploadGroupId =
  string;


/* ==========================================================================
   IMAGE UPLOADÉE
   ========================================================================== */

/**
 * Représente une image ayant été correctement enregistrée dans le Storage.
 *
 * Ce contrat correspond à ce que l'API POST renvoie actuellement.
 */
export interface ProductImageUploadedItem {
  /**
   * Identifiant serveur du fichier.
   */
  readonly fileId:
    ProductImageFileId;


  /**
   * Chemin réel dans le Storage.
   *
   * Nécessaire notamment pour :
   *
   * - supprimer une image temporaire ;
   * - vérifier son appartenance ;
   * - effectuer les compensations en cas d'échec.
   */
  readonly storagePath:
    ProductImageStoragePath;


  /**
   * URL publique persistante de l'image.
   */
  readonly url:
    ProductImagePublicUrl;


  /**
   * Nom du fichier tel qu'il a été envoyé à l'origine.
   *
   * Il est informatif uniquement.
   * Il ne doit jamais être utilisé comme autorisation Storage.
   */
  readonly originalFileName:
    string;


  /**
   * MIME type validé par notre pipeline d'upload.
   */
  readonly mimeType:
    ProductImageMimeType;


  /**
   * Taille originale en octets.
   */
  readonly size:
    number;
}


/* ==========================================================================
   CODES D'ERREUR — BASE
   ========================================================================== */

/**
 * Erreurs communes susceptibles d'être retournées lorsque l'accès privé
 * Gestionnaire n'est plus valable.
 */
export type ProductImageAccessErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN";


/**
 * Erreurs communes de requête.
 */
export type ProductImageRequestErrorCode =
  | "INVALID_REQUEST";


/* ==========================================================================
   CODES D'ERREUR — UPLOAD
   ========================================================================== */

/**
 * Erreurs connues et officiellement utilisées par l'API d'upload.
 */
export type ProductImageKnownUploadErrorCode =
  | ProductImageAccessErrorCode
  | ProductImageRequestErrorCode
  | "MISSING_FILE"
  | "TOO_MANY_FILES"
  | "INVALID_UPLOAD_GROUP"
  | "INVALID_FILE_NAME"
  | "INVALID_FILE_TYPE"
  | "INVALID_FILE_SIZE"
  | "UPLOAD_FAILED"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_UPLOAD_FAILED"
  | "STORAGE_PUBLIC_URL_FAILED";


/**
 * Code d'erreur d'upload.
 *
 * La partie `(string & {})` est volontaire.
 *
 * product-image-storage.ts peut posséder un code d'infrastructure plus
 * spécifique. La Route Handler propage alors ce code sans forcer un cast
 * dangereux.
 *
 * Les valeurs connues ci-dessus conservent néanmoins l'autocomplétion
 * TypeScript.
 */
export type ProductImageUploadErrorCode =
  | ProductImageKnownUploadErrorCode
  | (
      string &
      {}
    );


/* ==========================================================================
   ERREUR D'UN FICHIER INDIVIDUEL
   ========================================================================== */

export interface ProductImageUploadFileError {
  /**
   * Position du fichier dans la requête multipart.
   *
   * Index basé sur 0.
   */
  readonly index:
    number;


  /**
   * Nom du fichier concerné lorsqu'il était exploitable.
   */
  readonly fileName:
    string | null;


  /**
   * Code machine.
   */
  readonly code:
    ProductImageUploadErrorCode;


  /**
   * Message destiné à l'interface.
   *
   * Aucun secret technique ne doit y être placé.
   */
  readonly message:
    string;
}


/* ==========================================================================
   POST — SUCCÈS
   ========================================================================== */

export interface ProductImageUploadSuccessResponse {
  readonly success:
    true;


  /**
   * Identifiant commun du lot ayant servi à l'upload.
   */
  readonly uploadGroupId:
    ProductImageUploadGroupId;


  /**
   * Images persistées dans le Storage.
   *
   * L'ordre correspond à l'ordre des fichiers reçus par l'API.
   */
  readonly images:
    readonly ProductImageUploadedItem[];
}


/* ==========================================================================
   POST — ERREUR
   ========================================================================== */

export interface ProductImageUploadErrorResponse {
  readonly success:
    false;


  readonly code:
    ProductImageUploadErrorCode;


  /**
   * Message générique pouvant être affiché à l'utilisateur.
   */
  readonly message:
    string;


  /**
   * Erreurs détaillées par fichier.
   *
   * Facultatif car certaines erreurs concernent la requête entière :
   *
   * - session ;
   * - boutique ;
   * - multipart invalide ;
   * - groupe d'upload.
   */
  readonly fileErrors?:
    readonly ProductImageUploadFileError[];
}


/* ==========================================================================
   POST — RESPONSE
   ========================================================================== */

/**
 * Discriminated union.
 *
 * Exemple :
 *
 * if (payload.success) {
 *   payload.images;
 * } else {
 *   payload.message;
 * }
 */
export type ProductImageUploadResponse =
  | ProductImageUploadSuccessResponse
  | ProductImageUploadErrorResponse;


/* ==========================================================================
   DELETE — REQUEST
   ========================================================================== */

/**
 * Corps JSON envoyé à :
 *
 * DELETE /api/gestionnaire/produits/images
 *
 * IMPORTANT :
 *
 * Aucun storeId n'est présent ici.
 *
 * La boutique propriétaire est obtenue exclusivement depuis la session
 * Gestionnaire côté serveur.
 */
export interface ProductImageDeleteRequest {
  readonly storagePath:
    ProductImageStoragePath;
}


/* ==========================================================================
   CODES D'ERREUR — DELETE
   ========================================================================== */

export type ProductImageDeleteErrorCode =
  | ProductImageAccessErrorCode
  | ProductImageRequestErrorCode
  | "INVALID_STORAGE_PATH"
  | "FILE_NOT_OWNED"
  | "DELETE_FAILED"
  | "STORAGE_NOT_CONFIGURED"
  | "STORAGE_DELETE_FAILED"
  | (
      string &
      {}
    );


/* ==========================================================================
   DELETE — SUCCÈS
   ========================================================================== */

export interface ProductImageDeleteSuccessResponse {
  readonly success:
    true;


  /**
   * Chemin effectivement supprimé.
   */
  readonly storagePath:
    ProductImageStoragePath;
}


/* ==========================================================================
   DELETE — ERREUR
   ========================================================================== */

export interface ProductImageDeleteErrorResponse {
  readonly success:
    false;


  readonly code:
    ProductImageDeleteErrorCode;


  /**
   * Message générique destiné à l'interface.
   */
  readonly message:
    string;
}


/* ==========================================================================
   DELETE — RESPONSE
   ========================================================================== */

export type ProductImageDeleteResponse =
  | ProductImageDeleteSuccessResponse
  | ProductImageDeleteErrorResponse;


/* ==========================================================================
   CONTRAT GÉNÉRIQUE D'ERREUR API
   ========================================================================== */

/**
 * Utile pour les composants qui souhaitent uniquement récupérer un message
 * sans connaître le type exact de l'opération.
 */
export interface ProductImageApiErrorLike {
  readonly success:
    false;

  readonly code:
    string;

  readonly message:
    string;
}


/* ==========================================================================
   HELPERS DE TYPES
   ========================================================================== */

/**
 * Type représentant toute réponse possible de l'API images.
 */
export type ProductImageApiResponse =
  | ProductImageUploadResponse
  | ProductImageDeleteResponse;


/**
 * Toute réponse d'échec possible.
 */
export type ProductImageApiErrorResponse =
  | ProductImageUploadErrorResponse
  | ProductImageDeleteErrorResponse;


/**
 * Toute réponse de succès possible.
 */
export type ProductImageApiSuccessResponse =
  | ProductImageUploadSuccessResponse
  | ProductImageDeleteSuccessResponse;


/* ==========================================================================
   TYPE GUARDS — OBJET
   ========================================================================== */

/**
 * Vérifie uniquement qu'une valeur est un objet JSON exploitable.
 *
 * Ce helper ne remplace pas une validation métier serveur.
 */
function isRecord(
  value:
    unknown,
): value is Record<string, unknown> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


/* ==========================================================================
   TYPE GUARD — ERREUR API
   ========================================================================== */

export function isProductImageApiErrorResponse(
  value:
    unknown,
): value is ProductImageApiErrorResponse {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }


  return (
    value.success ===
      false &&
    typeof value.code ===
      "string" &&
    value.code.trim().length >
      0 &&
    typeof value.message ===
      "string" &&
    value.message.trim().length >
      0
  );
}


/* ==========================================================================
   TYPE GUARD — IMAGE UPLOADÉE
   ========================================================================== */

export function isProductImageUploadedItem(
  value:
    unknown,
): value is ProductImageUploadedItem {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }


  if (
    typeof value.fileId !==
      "string" ||
    !value.fileId.trim()
  ) {
    return false;
  }


  if (
    typeof value.storagePath !==
      "string" ||
    !value.storagePath.trim()
  ) {
    return false;
  }


  if (
    typeof value.url !==
      "string" ||
    !value.url.trim()
  ) {
    return false;
  }


  if (
    typeof value.originalFileName !==
      "string" ||
    !value.originalFileName.trim()
  ) {
    return false;
  }


  if (
    typeof value.mimeType !==
      "string" ||
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ].includes(
      value.mimeType,
    )
  ) {
    return false;
  }


  if (
    typeof value.size !==
      "number" ||
    !Number.isFinite(
      value.size,
    ) ||
    value.size <=
      0
  ) {
    return false;
  }


  return true;
}


/* ==========================================================================
   TYPE GUARD — UPLOAD SUCCESS
   ========================================================================== */

export function isProductImageUploadSuccessResponse(
  value:
    unknown,
): value is ProductImageUploadSuccessResponse {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }


  if (
    value.success !==
      true
  ) {
    return false;
  }


  if (
    typeof value.uploadGroupId !==
      "string" ||
    !value.uploadGroupId.trim()
  ) {
    return false;
  }


  if (
    !Array.isArray(
      value.images,
    )
  ) {
    return false;
  }


  return value.images.every(
    isProductImageUploadedItem,
  );
}


/* ==========================================================================
   TYPE GUARD — UPLOAD RESPONSE
   ========================================================================== */

export function isProductImageUploadResponse(
  value:
    unknown,
): value is ProductImageUploadResponse {
  return (
    isProductImageUploadSuccessResponse(
      value,
    ) ||
    isProductImageApiErrorResponse(
      value,
    )
  );
}


/* ==========================================================================
   TYPE GUARD — DELETE SUCCESS
   ========================================================================== */

export function isProductImageDeleteSuccessResponse(
  value:
    unknown,
): value is ProductImageDeleteSuccessResponse {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }


  return (
    value.success ===
      true &&
    typeof value.storagePath ===
      "string" &&
    value.storagePath.trim().length >
      0
  );
}


/* ==========================================================================
   TYPE GUARD — DELETE RESPONSE
   ========================================================================== */

export function isProductImageDeleteResponse(
  value:
    unknown,
): value is ProductImageDeleteResponse {
  return (
    isProductImageDeleteSuccessResponse(
      value,
    ) ||
    isProductImageApiErrorResponse(
      value,
    )
  );
}


/* ==========================================================================
   EXTRACTION SÛRE DU MESSAGE
   ========================================================================== */

/**
 * Permet à un Client Component de récupérer proprement un message d'erreur
 * après `response.json()`.
 *
 * Exemple :
 *
 * const payload: unknown = await response.json();
 *
 * const message =
 *   getProductImageApiErrorMessage(
 *     payload,
 *     "Impossible d'envoyer l'image.",
 *   );
 */
export function getProductImageApiErrorMessage(
  value:
    unknown,

  fallback:
    string,
): string {
  if (
    isProductImageApiErrorResponse(
      value,
    )
  ) {
    const message =
      value.message.trim();


    if (
      message
    ) {
      return message;
    }
  }


  return fallback;
}