import "server-only";

import {
  randomBytes,
} from "node:crypto";

import {
  Buffer,
} from "node:buffer";

import {
  PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,
  getProductImageExtensionFromMimeType,
  isProductImageExtension,
  isProductImageMimeType,
  isProductImageStorageIdentifierSafe,
  validateProductImageFileMetadata,
  type ProductImageExtension,
  type ProductImageMimeType,
} from "@/lib/gestionnaire/produits/images/product-image-constants";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — SUPABASE STORAGE DES IMAGES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/images/product-image-storage.ts
 *
 * RESPONSABILITÉS :
 *
 * - rester exclusivement côté serveur ;
 * - utiliser SUPABASE_SECRET_KEY ;
 * - ne jamais exposer cette clé au navigateur ;
 * - envoyer les images dans Supabase Storage ;
 * - ranger les images par boutique ;
 * - générer les chemins Storage côté serveur ;
 * - empêcher une boutique de supprimer les fichiers d'une autre ;
 * - produire l'URL publique permanente ;
 * - supprimer une ou plusieurs images ;
 * - vérifier les métadonnées avant upload ;
 * - vérifier le contenu binaire élémentaire de l'image ;
 * - ne jamais utiliser le nom original comme chemin Storage ;
 * - ne jamais faire confiance au storeId transmis par le navigateur.
 *
 * STRUCTURE STORAGE :
 *
 * product-images/
 * └── stores/
 *     └── {storeId}/
 *         └── {uploadGroupId}/
 *             └── {fileId}.{extension}
 *
 * Exemple :
 *
 * stores/cm123.../upload_a83.../img_Wx1....webp
 *
 * VARIABLES :
 *
 * SUPABASE_URL
 * SUPABASE_SECRET_KEY
 * SUPABASE_PRODUCT_IMAGES_BUCKET
 *
 * Le bucket doit actuellement être public car ProductImage.url est utilisé
 * directement par les pages publiques du produit.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const DEFAULT_PRODUCT_IMAGES_BUCKET =
  "product-images";


const STORAGE_ROOT =
  "stores";


const FILE_ID_PREFIX =
  "img_";


const FILE_ID_RANDOM_BYTES =
  24;


const STORAGE_PATH_MAX_LENGTH =
  1024;


const SUPABASE_REQUEST_TIMEOUT_MS =
  30_000;


/**
 * Les noms de fichiers sont uniques grâce à un identifiant aléatoire.
 *
 * On peut donc utiliser un cache long sans problème de fichier remplacé
 * sous le même nom.
 */
const PUBLIC_CACHE_CONTROL_SECONDS =
  31_536_000;


/* ==========================================================================
   TYPES — CONFIGURATION
   ========================================================================== */

interface ProductImageStorageConfiguration {
  readonly baseUrl:
    string;

  readonly secretKey:
    string;

  readonly bucket:
    string;
}


/* ==========================================================================
   TYPES — FICHIER EN ENTRÉE
   ========================================================================== */

export interface ProductImageStorageUploadFile {
  readonly name:
    string;

  readonly mimeType:
    ProductImageMimeType;

  readonly extension:
    ProductImageExtension;

  readonly size:
    number;

  readonly buffer:
    ArrayBuffer;
}


/* ==========================================================================
   TYPES — IMAGE STOCKÉE
   ========================================================================== */

export interface ProductImageStorageUploadedImage {
  readonly fileId:
    string;

  readonly storagePath:
    string;

  readonly publicUrl:
    string;

  readonly originalFileName:
    string;

  readonly mimeType:
    ProductImageMimeType;

  readonly size:
    number;
}


/* ==========================================================================
   CODES D'ERREUR UPLOAD
   ========================================================================== */

export type ProductImageStorageUploadErrorCode =
  | "STORAGE_NOT_CONFIGURED"
  | "INVALID_STORAGE_CONTEXT"
  | "INVALID_FILE"
  | "INVALID_FILE_TYPE"
  | "INVALID_FILE_SIZE"
  | "UPLOAD_FAILED";


/* ==========================================================================
   RÉSULTAT UPLOAD
   ========================================================================== */

export interface ProductImageStorageUploadSuccess {
  readonly success:
    true;

  readonly image:
    ProductImageStorageUploadedImage;
}


export interface ProductImageStorageUploadFailure {
  readonly success:
    false;

  readonly code:
    ProductImageStorageUploadErrorCode;

  readonly message:
    string;
}


export type ProductImageStorageUploadResult =
  | ProductImageStorageUploadSuccess
  | ProductImageStorageUploadFailure;


/* ==========================================================================
   CODES D'ERREUR DELETE
   ========================================================================== */

export type ProductImageStorageDeleteErrorCode =
  | "STORAGE_NOT_CONFIGURED"
  | "INVALID_STORAGE_PATH"
  | "FILE_NOT_OWNED"
  | "DELETE_FAILED";


/* ==========================================================================
   RÉSULTAT DELETE UNIQUE
   ========================================================================== */

export interface ProductImageStorageDeleteSuccess {
  readonly success:
    true;

  readonly storagePath:
    string;
}


export interface ProductImageStorageDeleteFailure {
  readonly success:
    false;

  readonly code:
    ProductImageStorageDeleteErrorCode;

  readonly message:
    string;
}


export type ProductImageStorageDeleteResult =
  | ProductImageStorageDeleteSuccess
  | ProductImageStorageDeleteFailure;


/* ==========================================================================
   RÉSULTAT DELETE MULTIPLE
   ========================================================================== */

export interface ProductImagesStorageDeleteSuccess {
  readonly success:
    true;

  readonly storagePaths:
    readonly string[];
}


export interface ProductImagesStorageDeleteFailure {
  readonly success:
    false;

  readonly code:
    ProductImageStorageDeleteErrorCode;

  readonly message:
    string;
}


export type ProductImagesStorageDeleteResult =
  | ProductImagesStorageDeleteSuccess
  | ProductImagesStorageDeleteFailure;


/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

function getProductImageStorageConfiguration():
  ProductImageStorageConfiguration | null {
  const rawUrl =
    (
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      ""
    ).trim();


  const secretKey =
    (
      process.env.SUPABASE_SECRET_KEY ??
      ""
    ).trim();


  const bucket =
    (
      process.env.SUPABASE_PRODUCT_IMAGES_BUCKET ??
      DEFAULT_PRODUCT_IMAGES_BUCKET
    ).trim();


  if (
    !rawUrl ||
    !secretKey ||
    !bucket
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     URL SUPABASE
     ------------------------------------------------------------------------ */

  let parsedUrl:
    URL;


  try {
    parsedUrl =
      new URL(
        rawUrl,
      );
  } catch {
    return null;
  }


  if (
    (
      parsedUrl.protocol !==
        "https:" &&
      !(
        parsedUrl.protocol ===
          "http:" &&
        (
          parsedUrl.hostname ===
            "localhost" ||
          parsedUrl.hostname ===
            "127.0.0.1"
        )
      )
    ) ||
    parsedUrl.username ||
    parsedUrl.password
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     BUCKET
     ------------------------------------------------------------------------ */

  if (
    bucket.length >
      100 ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(
      bucket,
    )
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     SECRET
     ------------------------------------------------------------------------ */

  if (
    secretKey.length <
    20
  ) {
    return null;
  }


  return {
    /**
     * On utilise uniquement l'origine.
     *
     * Cela évite une configuration accidentelle comme :
     *
     * https://xxx.supabase.co/rest/v1
     */
    baseUrl:
      parsedUrl.origin,

    secretKey,

    bucket,
  };
}


/* ==========================================================================
   HEADERS SUPABASE
   ========================================================================== */

/**
 * Les nouvelles clés Supabase `sb_secret_...` sont des clés serveur.
 *
 * `apikey` reste le header principal de la Gateway.
 *
 * Authorization est également fourni pour la compatibilité avec le service
 * Storage et le comportement des clients officiels Supabase.
 */

function buildSupabaseStorageHeaders(
  configuration:
    ProductImageStorageConfiguration,
): Record<string, string> {
  return {
    apikey:
      configuration.secretKey,

    Authorization:
      `Bearer ${configuration.secretKey}`,
  };
}


/* ==========================================================================
   TIMEOUT
   ========================================================================== */

function createSupabaseAbortSignal():
  AbortSignal {
  return AbortSignal.timeout(
    SUPABASE_REQUEST_TIMEOUT_MS,
  );
}


/* ==========================================================================
   IDENTIFIANT FICHIER
   ========================================================================== */

function createProductImageFileId():
  string {
  return `${FILE_ID_PREFIX}${randomBytes(
    FILE_ID_RANDOM_BYTES,
  ).toString(
    "base64url",
  )}`;
}


/* ==========================================================================
   NOM ORIGINAL
   ========================================================================== */

function normalizeOriginalFileName(
  value:
    string,
): string {
  const normalized =
    value
      .replace(
        /[\u0000-\u001F\u007F]/g,
        "",
      )
      .replace(
        /[/\\]/g,
        "_",
      )
      .trim()
      .slice(
        0,
        255,
      );


  return normalized ||
    "image-produit";
}


/* ==========================================================================
   ENCODAGE CHEMIN STORAGE
   ========================================================================== */

function encodeStoragePath(
  storagePath:
    string,
): string {
  return storagePath
    .split(
      "/",
    )
    .filter(
      Boolean,
    )
    .map(
      (
        segment,
      ) =>
        encodeURIComponent(
          segment,
        ),
    )
    .join(
      "/",
    );
}


/* ==========================================================================
   CONSTRUCTION STORAGE PATH
   ========================================================================== */

function buildProductImageStoragePath(
  params:
    Readonly<{
      storeId:
        string;

      uploadGroupId:
        string;

      fileId:
        string;

      extension:
        ProductImageExtension;
    }>,
): string | null {
  const storeId =
    params.storeId.trim();


  const uploadGroupId =
    params.uploadGroupId.trim();


  const fileId =
    params.fileId.trim();


  if (
    !isProductImageStorageIdentifierSafe(
      storeId,
    ) ||
    !isProductImageStorageIdentifierSafe(
      uploadGroupId,
    ) ||
    !isProductImageStorageIdentifierSafe(
      fileId,
    ) ||
    !isProductImageExtension(
      params.extension,
    )
  ) {
    return null;
  }


  const storagePath =
    [
      STORAGE_ROOT,
      storeId,
      uploadGroupId,
      `${fileId}.${params.extension}`,
    ].join(
      "/",
    );


  if (
    storagePath.length >
    STORAGE_PATH_MAX_LENGTH
  ) {
    return null;
  }


  return storagePath;
}


/* ==========================================================================
   VALIDATION STORAGE PATH
   ========================================================================== */

/**
 * Vérifie qu'un chemin correspond uniquement à notre architecture.
 *
 * Structure acceptée :
 *
 * stores/{storeId}/{uploadGroupId}/{filename.ext}
 */

function normalizeProductImageStoragePath(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value
      .trim()
      .replace(
        /\\/g,
        "/",
      )
      .replace(
        /^\/+/,
        "",
      )
      .replace(
        /\/+/g,
        "/",
      );


  if (
    !normalized ||
    normalized.length >
      STORAGE_PATH_MAX_LENGTH ||
    normalized.includes(
      "\0",
    ) ||
    normalized.includes(
      "..",
    ) ||
    normalized.includes(
      "%",
    )
  ) {
    return null;
  }


  const segments =
    normalized.split(
      "/",
    );


  if (
    segments.length !==
    4
  ) {
    return null;
  }


  const [
    root,
    storeId,
    uploadGroupId,
    fileName,
  ] =
    segments;


  if (
    root !==
      STORAGE_ROOT ||
    !storeId ||
    !uploadGroupId ||
    !fileName
  ) {
    return null;
  }


  if (
    !isProductImageStorageIdentifierSafe(
      storeId,
    ) ||
    !isProductImageStorageIdentifierSafe(
      uploadGroupId,
    )
  ) {
    return null;
  }


  /**
   * Accepte également les anciens fileId sans préfixe img_
   * pour éviter de casser d'éventuelles images déjà envoyées.
   */
  if (
    !/^[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(
      fileName,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   APPARTENANCE À UNE BOUTIQUE
   ========================================================================== */

export function isProductImageStoragePathOwnedByStore(
  params:
    Readonly<{
      storeId:
        string;

      storagePath:
        string;
    }>,
): boolean {
  const storeId =
    params.storeId.trim();


  if (
    !isProductImageStorageIdentifierSafe(
      storeId,
    )
  ) {
    return false;
  }


  const storagePath =
    normalizeProductImageStoragePath(
      params.storagePath,
    );


  if (
    !storagePath
  ) {
    return false;
  }


  const segments =
    storagePath.split(
      "/",
    );


  return (
    segments[0] ===
      STORAGE_ROOT &&
    segments[1] ===
      storeId
  );
}


/* ==========================================================================
   URL PUBLIQUE
   ========================================================================== */

function buildProductImagePublicUrl(
  params:
    Readonly<{
      configuration:
        ProductImageStorageConfiguration;

      storagePath:
        string;
    }>,
): string {
  return [
    params.configuration.baseUrl,

    "/storage/v1/object/public/",

    encodeURIComponent(
      params.configuration.bucket,
    ),

    "/",

    encodeStoragePath(
      params.storagePath,
    ),
  ].join(
    "",
  );
}


/* ==========================================================================
   SIGNATURE BINAIRE
   ========================================================================== */

function startsWithBytes(
  bytes:
    Uint8Array,

  signature:
    readonly number[],
): boolean {
  if (
    bytes.length <
    signature.length
  ) {
    return false;
  }


  for (
    let index =
      0;
    index <
    signature.length;
    index +=
      1
  ) {
    if (
      bytes[index] !==
      signature[index]
  ) {
      return false;
    }
  }


  return true;
}


/* ==========================================================================
   ASCII
   ========================================================================== */

function readAscii(
  bytes:
    Uint8Array,

  start:
    number,

  length:
    number,
): string {
  let output =
    "";


  const end =
    Math.min(
      bytes.length,
      start +
        length,
    );


  for (
    let index =
      start;
    index <
      end;
    index +=
      1
  ) {
    const value =
      bytes[index];


    if (
      typeof value ===
      "number"
  ) {
      output +=
        String.fromCharCode(
          value,
        );
    }
  }


  return output;
}


/* ==========================================================================
   DÉTECTION JPEG
   ========================================================================== */

function isJpegBinary(
  bytes:
    Uint8Array,
): boolean {
  return startsWithBytes(
    bytes,
    [
      0xff,
      0xd8,
      0xff,
    ],
  );
}


/* ==========================================================================
   DÉTECTION PNG
   ========================================================================== */

function isPngBinary(
  bytes:
    Uint8Array,
): boolean {
  return startsWithBytes(
    bytes,
    [
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
    ],
  );
}


/* ==========================================================================
   DÉTECTION WEBP
   ========================================================================== */

function isWebpBinary(
  bytes:
    Uint8Array,
): boolean {
  if (
    bytes.length <
    12
  ) {
    return false;
  }


  return (
    readAscii(
      bytes,
      0,
      4,
    ) ===
      "RIFF" &&
    readAscii(
      bytes,
      8,
      4,
    ) ===
      "WEBP"
  );
}


/* ==========================================================================
   DÉTECTION AVIF
   ========================================================================== */

/**
 * AVIF utilise le format ISO Base Media File Format.
 *
 * Le fichier doit notamment contenir :
 *
 * ftyp
 *
 * avec une marque AVIF/AVIS parmi les marques initiales.
 */

function isAvifBinary(
  bytes:
    Uint8Array,
): boolean {
  if (
    bytes.length <
    16
  ) {
    return false;
  }


  if (
    readAscii(
      bytes,
      4,
      4,
    ) !==
    "ftyp"
  ) {
    return false;
  }


  const header =
    readAscii(
      bytes,
      8,
      Math.min(
        56,
        bytes.length -
          8,
      ),
    );


  return (
    header.includes(
      "avif",
    ) ||
    header.includes(
      "avis",
    )
  );
}


/* ==========================================================================
   VALIDATION BINAIRE
   ========================================================================== */

function isProductImageBinaryCompatible(
  params:
    Readonly<{
      bytes:
        Uint8Array;

      mimeType:
        ProductImageMimeType;
    }>,
): boolean {
  switch (
    params.mimeType
  ) {
    case "image/jpeg":
      return isJpegBinary(
        params.bytes,
      );


    case "image/png":
      return isPngBinary(
        params.bytes,
      );


    case "image/webp":
      return isWebpBinary(
        params.bytes,
      );


    case "image/avif":
      return isAvifBinary(
        params.bytes,
      );


    default:
      return false;
  }
}


/* ==========================================================================
   ERREUR SUPABASE — LOG SÛR
   ========================================================================== */

interface SupabaseErrorSummary {
  readonly status:
    number;

  readonly code:
    string | null;
}


async function getSupabaseErrorSummary(
  response:
    Response,
): Promise<SupabaseErrorSummary> {
  let code:
    string | null =
    null;


  try {
    const body:
      unknown =
      await response
        .clone()
        .json();


    if (
      body &&
      typeof body ===
        "object"
    ) {
      const candidate =
        (
          body as {
            statusCode?:
              unknown;

            code?:
              unknown;

            error?:
              unknown;
          }
        );


      const rawCode =
        typeof candidate.code ===
          "string"
          ? candidate.code
          : typeof candidate.error ===
              "string"
            ? candidate.error
            : typeof candidate.statusCode ===
                "string"
              ? candidate.statusCode
              : null;


      if (
        rawCode &&
        /^[A-Za-z0-9_.:-]{1,80}$/.test(
          rawCode,
        )
      ) {
        code =
          rawCode;
      }
    }
  } catch {
    // Réponse non JSON : rien à exposer.
  }


  return {
    status:
      response.status,

    code,
  };
}


/* ==========================================================================
   LOG STORAGE
   ========================================================================== */

function logStorageFailure(
  operation:
    "upload" | "delete",

  summary:
    SupabaseErrorSummary,
): void {
  console.error(
    `[L&E Cosmetics Empire][ProductImageStorage] ${operation} failed.`,
    {
      status:
        summary.status,

      code:
        summary.code,
    },
  );
}


/* ==========================================================================
   UPLOAD
   ========================================================================== */

/**
 * Envoie UNE image.
 *
 * storeId et uploadGroupId doivent provenir de couches serveur validées.
 *
 * Cette fonction :
 *
 * - ne crée aucune ligne ProductImage ;
 * - ne modifie pas Prisma ;
 * - ne connaît pas productId.
 *
 * Elle gère uniquement le fichier physique.
 */

export async function uploadProductImageToStorage(
  params:
    Readonly<{
      storeId:
        string;

      uploadGroupId:
        string;

      file:
        ProductImageStorageUploadFile;
    }>,
): Promise<ProductImageStorageUploadResult> {
  /* ------------------------------------------------------------------------
     CONFIGURATION
     ------------------------------------------------------------------------ */

  const configuration =
    getProductImageStorageConfiguration();


  if (
    !configuration
  ) {
    return {
      success:
        false,

      code:
        "STORAGE_NOT_CONFIGURED",

      message:
        "Le stockage des images produits n’est pas correctement configuré.",
    };
  }


  /* ------------------------------------------------------------------------
     CONTEXTE
     ------------------------------------------------------------------------ */

  const storeId =
    params.storeId.trim();


  const uploadGroupId =
    params.uploadGroupId.trim();


  if (
    !isProductImageStorageIdentifierSafe(
      storeId,
    ) ||
    !isProductImageStorageIdentifierSafe(
      uploadGroupId,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_STORAGE_CONTEXT",

      message:
        "Le contexte de stockage de l’image est invalide.",
    };
  }


  /* ------------------------------------------------------------------------
     MIME
     ------------------------------------------------------------------------ */

  if (
    !isProductImageMimeType(
      params.file.mimeType,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_TYPE",

      message:
        "Le format de l’image n’est pas pris en charge.",
    };
  }


  const mimeType =
    params.file.mimeType;


  /* ------------------------------------------------------------------------
     EXTENSION CANONIQUE
     ------------------------------------------------------------------------ */

  const canonicalExtension =
    getProductImageExtensionFromMimeType(
      mimeType,
    );


  if (
    !isProductImageExtension(
      canonicalExtension,
    )
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_TYPE",

      message:
        "L’extension de l’image n’est pas prise en charge.",
    };
  }


  /* ------------------------------------------------------------------------
     VALIDATION MÉTADONNÉES
     ------------------------------------------------------------------------ */

  const metadataValidation =
    validateProductImageFileMetadata({
      name:
        params.file.name,

      type:
        mimeType,

      size:
        params.file.size,
    });


  if (
    !metadataValidation.success
  ) {
    return {
      success:
        false,

      code:
        metadataValidation.code ===
        "INVALID_FILE_SIZE"
          ? "INVALID_FILE_SIZE"
          : metadataValidation.code ===
              "INVALID_MIME_TYPE"
            ? "INVALID_FILE_TYPE"
            : "INVALID_FILE",

      message:
        metadataValidation.message,
    };
  }


  /* ------------------------------------------------------------------------
     BUFFER
     ------------------------------------------------------------------------ */

  if (
    !(params.file.buffer instanceof
      ArrayBuffer)
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE",

      message:
        "Le contenu de l’image est invalide.",
    };
  }


  const byteLength =
    params.file.buffer
      .byteLength;


  if (
    byteLength <=
      0 ||
    byteLength >
      PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES ||
    byteLength !==
      params.file.size
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_SIZE",

      message:
        "La taille réelle de l’image est invalide.",
    };
  }


  /* ------------------------------------------------------------------------
     SIGNATURE BINAIRE
     ------------------------------------------------------------------------ */

  const bytes =
    new Uint8Array(
      params.file.buffer,
    );


  if (
    !isProductImageBinaryCompatible({
      bytes,
      mimeType,
    })
  ) {
    return {
      success:
        false,

      code:
        "INVALID_FILE_TYPE",

      message:
        "Le contenu du fichier ne correspond pas au format d’image déclaré.",
    };
  }


  /* ------------------------------------------------------------------------
     FILE ID
     ------------------------------------------------------------------------ */

  const fileId =
    createProductImageFileId();


  /* ------------------------------------------------------------------------
     STORAGE PATH
     ------------------------------------------------------------------------ */

  const storagePath =
    buildProductImageStoragePath({
      storeId,

      uploadGroupId,

      fileId,

      extension:
        canonicalExtension,
    });


  if (
    !storagePath
  ) {
    return {
      success:
        false,

      code:
        "INVALID_STORAGE_CONTEXT",

      message:
        "Impossible de construire le chemin de stockage de l’image.",
    };
  }


  /* ------------------------------------------------------------------------
     ENDPOINT
     ------------------------------------------------------------------------ */

  const uploadUrl =
    [
      configuration.baseUrl,

      "/storage/v1/object/",

      encodeURIComponent(
        configuration.bucket,
      ),

      "/",

      encodeStoragePath(
        storagePath,
      ),
    ].join(
      "",
    );


  /* ------------------------------------------------------------------------
     UPLOAD HTTP
     ------------------------------------------------------------------------ */

  let response:
    Response;


  try {
    response =
      await fetch(
        uploadUrl,
        {
          method:
            "POST",

          cache:
            "no-store",

          signal:
            createSupabaseAbortSignal(),

          headers: {
            ...buildSupabaseStorageHeaders(
              configuration,
            ),

            "Content-Type":
              mimeType,

            "Cache-Control":
              `max-age=${PUBLIC_CACHE_CONTROL_SECONDS}`,

            "x-upsert":
              "false",
          },

          body:
            Buffer.from(
              params.file.buffer,
            ),
        },
      );
  } catch {
    return {
      success:
        false,

      code:
        "UPLOAD_FAILED",

      message:
        "Impossible de contacter le service de stockage des images.",
    };
  }


  /* ------------------------------------------------------------------------
     ERREUR SUPABASE
     ------------------------------------------------------------------------ */

  if (
    !response.ok
  ) {
    const summary =
      await getSupabaseErrorSummary(
        response,
      );


    logStorageFailure(
      "upload",
      summary,
    );


    return {
      success:
        false,

      code:
        "UPLOAD_FAILED",

      message:
        "Impossible d’enregistrer l’image dans le stockage.",
    };
  }


  /* ------------------------------------------------------------------------
     URL PUBLIQUE
     ------------------------------------------------------------------------ */

  const publicUrl =
    buildProductImagePublicUrl({
      configuration,

      storagePath,
    });


  /* ------------------------------------------------------------------------
     SUCCÈS
     ------------------------------------------------------------------------ */

  return {
    success:
      true,

    image: {
      fileId,

      storagePath,

      publicUrl,

      originalFileName:
        normalizeOriginalFileName(
          params.file.name,
        ),

      mimeType,

      size:
        byteLength,
    },
  };
}


/* ==========================================================================
   SUPPRESSION MULTIPLE INTERNE
   ========================================================================== */

async function deleteValidatedProductImagePaths(
  params:
    Readonly<{
      configuration:
        ProductImageStorageConfiguration;

      storagePaths:
        readonly string[];
    }>,
): Promise<boolean> {
  if (
    params.storagePaths.length ===
    0
  ) {
    return true;
  }


  const deleteUrl =
    [
      params.configuration.baseUrl,

      "/storage/v1/object/",

      encodeURIComponent(
        params.configuration.bucket,
      ),
    ].join(
      "",
    );


  let response:
    Response;


  try {
    response =
      await fetch(
        deleteUrl,
        {
          method:
            "DELETE",

          cache:
            "no-store",

          signal:
            createSupabaseAbortSignal(),

          headers: {
            ...buildSupabaseStorageHeaders(
              params.configuration,
            ),

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              prefixes:
                params.storagePaths,
            }),
        },
      );
  } catch {
    return false;
  }


  if (
    !response.ok
  ) {
    const summary =
      await getSupabaseErrorSummary(
        response,
      );


    logStorageFailure(
      "delete",
      summary,
    );


    return false;
  }


  return true;
}


/* ==========================================================================
   SUPPRESSION D'UNE IMAGE
   ========================================================================== */

export async function deleteProductImageFromStorage(
  params:
    Readonly<{
      storeId:
        string;

      storagePath:
        string;
    }>,
): Promise<ProductImageStorageDeleteResult> {
  const configuration =
    getProductImageStorageConfiguration();


  if (
    !configuration
  ) {
    return {
      success:
        false,

      code:
        "STORAGE_NOT_CONFIGURED",

      message:
        "Le stockage des images produits n’est pas correctement configuré.",
    };
  }


  /* ------------------------------------------------------------------------
     STORE ID
     ------------------------------------------------------------------------ */

  const storeId =
    params.storeId.trim();


  if (
    !isProductImageStorageIdentifierSafe(
      storeId,
    )
  ) {
    return {
      success:
        false,

      code:
        "FILE_NOT_OWNED",

      message:
        "Cette image n’appartient pas à la boutique active.",
    };
  }


  /* ------------------------------------------------------------------------
     STORAGE PATH
     ------------------------------------------------------------------------ */

  const storagePath =
    normalizeProductImageStoragePath(
      params.storagePath,
    );


  if (
    !storagePath
  ) {
    return {
      success:
        false,

      code:
        "INVALID_STORAGE_PATH",

      message:
        "Le chemin de l’image est invalide.",
    };
  }


  /* ------------------------------------------------------------------------
     TENANT CHECK
     ------------------------------------------------------------------------ */

  if (
    !isProductImageStoragePathOwnedByStore({
      storeId,
      storagePath,
    })
  ) {
    return {
      success:
        false,

      code:
        "FILE_NOT_OWNED",

      message:
        "Cette image n’appartient pas à la boutique active.",
    };
  }


  /* ------------------------------------------------------------------------
     DELETE
     ------------------------------------------------------------------------ */

  const deleted =
    await deleteValidatedProductImagePaths({
      configuration,

      storagePaths: [
        storagePath,
      ],
    });


  if (
    !deleted
  ) {
    return {
      success:
        false,

      code:
        "DELETE_FAILED",

      message:
        "Impossible de supprimer l’image du stockage.",
    };
  }


  return {
    success:
      true,

    storagePath,
  };
}


/* ==========================================================================
   SUPPRESSION DE PLUSIEURS IMAGES
   ========================================================================== */

/**
 * Utilisée notamment lorsqu'un upload multiple échoue après que certaines
 * images aient déjà été envoyées.
 *
 * La validation d'appartenance est appliquée à CHAQUE chemin avant que
 * Supabase ne reçoive la requête.
 */

export async function deleteProductImagesFromStorage(
  params:
    Readonly<{
      storeId:
        string;

      storagePaths:
        readonly string[];
    }>,
): Promise<ProductImagesStorageDeleteResult> {
  const configuration =
    getProductImageStorageConfiguration();


  if (
    !configuration
  ) {
    return {
      success:
        false,

      code:
        "STORAGE_NOT_CONFIGURED",

      message:
        "Le stockage des images produits n’est pas correctement configuré.",
    };
  }


  /* ------------------------------------------------------------------------
     STORE ID
     ------------------------------------------------------------------------ */

  const storeId =
    params.storeId.trim();


  if (
    !isProductImageStorageIdentifierSafe(
      storeId,
    )
  ) {
    return {
      success:
        false,

      code:
        "FILE_NOT_OWNED",

      message:
        "Une ou plusieurs images n’appartiennent pas à la boutique active.",
    };
  }


  /* ------------------------------------------------------------------------
     NORMALISATION / DÉDOUBLONNAGE
     ------------------------------------------------------------------------ */

  const normalizedPaths:
    string[] =
    [];


  const seenPaths =
    new Set<string>();


  for (
    const candidate
    of params.storagePaths
  ) {
    const storagePath =
      normalizeProductImageStoragePath(
        candidate,
      );


    if (
      !storagePath
    ) {
      return {
        success:
          false,

        code:
          "INVALID_STORAGE_PATH",

        message:
          "Un chemin d’image est invalide.",
      };
    }


    if (
      !isProductImageStoragePathOwnedByStore({
        storeId,
        storagePath,
      })
    ) {
      return {
        success:
          false,

        code:
          "FILE_NOT_OWNED",

        message:
          "Une ou plusieurs images n’appartiennent pas à la boutique active.",
      };
    }


    if (
      seenPaths.has(
        storagePath,
      )
    ) {
      continue;
    }


    seenPaths.add(
      storagePath,
    );


    normalizedPaths.push(
      storagePath,
    );
  }


  /* ------------------------------------------------------------------------
     RIEN À SUPPRIMER
     ------------------------------------------------------------------------ */

  if (
    normalizedPaths.length ===
    0
  ) {
    return {
      success:
        true,

      storagePaths:
        [],
    };
  }


  /* ------------------------------------------------------------------------
     DELETE SUPABASE
     ------------------------------------------------------------------------ */

  const deleted =
    await deleteValidatedProductImagePaths({
      configuration,

      storagePaths:
        normalizedPaths,
    });


  if (
    !deleted
  ) {
    return {
      success:
        false,

      code:
        "DELETE_FAILED",

      message:
        "Impossible de supprimer les images du stockage.",
    };
  }


  return {
    success:
      true,

    storagePaths:
      normalizedPaths,
  };
}