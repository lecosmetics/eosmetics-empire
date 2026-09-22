import {
  randomBytes,
} from "node:crypto";

import {
  NextResponse,
} from "next/server";

import {
  getGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  PRODUCT_IMAGE_MAX_FILES,
  PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,
  PRODUCT_IMAGE_UPLOAD_FORM_FIELD,
  PRODUCT_IMAGE_UPLOAD_GROUP_FORM_FIELD,
  canAddProductImageFiles,
  isProductImageMimeType,
  isProductImageStorageIdentifierSafe,
  validateProductImageFileMetadata,
} from "@/lib/gestionnaire/produits/images/product-image-constants";

import {
  deleteProductImageFromStorage,
  deleteProductImagesFromStorage,
  uploadProductImageToStorage,
} from "@/lib/gestionnaire/produits/images/product-image-storage";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * API GESTIONNAIRE — IMAGES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/api/gestionnaire/produits/images/route.ts
 *
 * Endpoints :
 *
 * POST   /api/gestionnaire/produits/images
 * DELETE /api/gestionnaire/produits/images
 *
 * RESPONSABILITÉS :
 *
 * - vérifier la session Gestionnaire côté serveur ;
 * - déterminer le vrai storeId depuis la session ;
 * - ne jamais recevoir storeId depuis le navigateur ;
 * - valider les images avant envoi ;
 * - limiter le nombre et la taille des images ;
 * - transférer les fichiers vers Supabase Storage ;
 * - nettoyer les fichiers déjà uploadés si un lot échoue ;
 * - permettre la suppression sécurisée d'une image temporaire ;
 * - toujours retourner une réponse JSON exploitable.
 *
 * MODES D'UPLOAD :
 *
 * 1. multipart/form-data
 *
 *    Compatible avec ProduitImagesSection.tsx actuel.
 *
 * 2. image/jpeg | image/png | image/webp | image/avif
 *
 *    Mode binaire disponible pour une future migration.
 *
 * IMPORTANT :
 *
 * Cette route ne contient aucune SUPABASE_SECRET_KEY.
 *
 * Elle délègue l'accès privilégié Storage à :
 *
 * src/lib/gestionnaire/produits/images/product-image-storage.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   NEXT.JS
   ========================================================================== */

export const runtime =
  "nodejs";


export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const UPLOAD_GROUP_PREFIX =
  "upload_";


const UPLOAD_GROUP_RANDOM_BYTES =
  18;


/**
 * Headers utilisés uniquement par le mode binaire.
 *
 * Le mode multipart actuel n'en dépend pas.
 */
const BINARY_UPLOAD_GROUP_HEADER =
  "x-product-image-upload-group";


const BINARY_FILE_NAME_HEADER =
  "x-product-image-file-name";


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

interface GestionnaireImageAccess {
  readonly storeId:
    string;
}


interface UploadedImageApiItem {
  readonly fileId:
    string;

  readonly storagePath:
    string;

  readonly url:
    string;

  readonly originalFileName:
    string;

  readonly mimeType:
    string;

  readonly size:
    number;
}


interface ValidatedUploadFile {
  readonly index:
    number;

  readonly name:
    string;

  readonly mimeType:
    | "image/jpeg"
    | "image/png"
    | "image/webp"
    | "image/avif";

  readonly extension:
    | "jpg"
    | "jpeg"
    | "png"
    | "webp"
    | "avif";

  readonly size:
    number;

  readonly getBuffer:
    () => Promise<ArrayBuffer>;
}


/* ==========================================================================
   JSON RESPONSE
   ========================================================================== */

/**
 * Toute réponse de cette API doit rester JSON.
 *
 * Cela permet au navigateur de faire :
 *
 * await response.json()
 *
 * même lorsqu'une erreur serveur survient.
 */

function jsonResponse<T>(
  body:
    T,

  status:
    number,
): NextResponse<T> {
  return NextResponse.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}


/* ==========================================================================
   LOG SÉCURISÉ
   ========================================================================== */

/**
 * Aucun :
 *
 * - storeId ;
 * - secret Supabase ;
 * - URL PostgreSQL ;
 * - cookie ;
 * - token QR ;
 * - stack complète
 *
 * n'est loggé ici.
 */

function logUnexpectedApiError(
  operation:
    "POST" | "DELETE",

  error:
    unknown,
): void {
  const errorName =
    error instanceof Error
      ? error.name
      : "UnknownError";


  console.error(
    `[L&E Cosmetics Empire][ProductImagesAPI][${operation}] Erreur inattendue.`,
    {
      errorName,
    },
  );
}


/* ==========================================================================
   UPLOAD GROUP
   ========================================================================== */

function createUploadGroupId():
  string {
  return `${UPLOAD_GROUP_PREFIX}${randomBytes(
    UPLOAD_GROUP_RANDOM_BYTES,
  ).toString(
    "hex",
  )}`;
}


/* ==========================================================================
   AUTHENTIFICATION
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * Nous utilisons getGestionnairePrivateAccess() et non une valeur reçue depuis
 * la requête.
 *
 * Cela évite également une redirection HTML dans une Route API lorsque la
 * session n'est plus valide.
 */

async function getProductImageAccess():
  Promise<GestionnaireImageAccess | null> {
  const access =
    await getGestionnairePrivateAccess();


  if (
    !access
  ) {
    return null;
  }


  const storeId =
    access.store.id.trim();


  if (
    !storeId ||
    !isProductImageStorageIdentifierSafe(
      storeId,
    )
  ) {
    return null;
  }


  return {
    storeId,
  };
}


/* ==========================================================================
   NOM DE FICHIER
   ========================================================================== */

function normalizeFileName(
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
    null;
}


/* ==========================================================================
   HEADER FILE NAME
   ========================================================================== */

function getBinaryFileName(
  request:
    Request,
): string | null {
  const headerValue =
    request.headers.get(
      BINARY_FILE_NAME_HEADER,
    );


  if (
    !headerValue
  ) {
    return null;
  }


  try {
    return normalizeFileName(
      decodeURIComponent(
        headerValue,
      ),
    );
  } catch {
    return normalizeFileName(
      headerValue,
    );
  }
}


/* ==========================================================================
   UPLOAD GROUP — VALIDATION
   ========================================================================== */

function normalizeUploadGroupId(
  value:
    string | null,
): string | null {
  if (
    value ===
    null
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    !isProductImageStorageIdentifierSafe(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   STATUS STORAGE
   ========================================================================== */

function getStorageUploadHttpStatus(
  code:
    string,
): number {
  switch (
    code
  ) {
    case "STORAGE_NOT_CONFIGURED":
      return 503;


    case "INVALID_STORAGE_CONTEXT":
    case "INVALID_FILE":
    case "INVALID_FILE_TYPE":
    case "INVALID_FILE_SIZE":
      return 400;


    case "UPLOAD_FAILED":
    default:
      return 502;
  }
}


/* ==========================================================================
   FILE ERROR
   ========================================================================== */

function createFileError(
  params:
    Readonly<{
      index:
        number;

      fileName:
        string | null;

      code:
        string;

      message:
        string;
    }>,
) {
  return {
    index:
      params.index,

    fileName:
      params.fileName,

    code:
      params.code,

    message:
      params.message,
  };
}


/* ==========================================================================
   CLEANUP
   ========================================================================== */

/**
 * Nettoyage compensatoire.
 *
 * Exemple :
 *
 * 3 images doivent être envoyées.
 *
 * - image 1 OK
 * - image 2 OK
 * - image 3 échoue
 *
 * Les images 1 et 2 sont alors retirées du Storage afin d'éviter des fichiers
 * orphelins.
 */

async function cleanupUploadedImages(
  storeId:
    string,

  uploadedImages:
    readonly UploadedImageApiItem[],
): Promise<void> {
  if (
    uploadedImages.length ===
    0
  ) {
    return;
  }


  const storagePaths =
    uploadedImages
      .map(
        (
          image,
        ) =>
          image.storagePath,
      )
      .filter(
        (
          storagePath,
        ) =>
          typeof storagePath ===
            "string" &&
          storagePath.trim().length >
            0,
      );


  if (
    storagePaths.length ===
    0
  ) {
    return;
  }


  try {
    await deleteProductImagesFromStorage({
      storeId,

      storagePaths,
    });
  } catch {
    /**
     * Best effort.
     *
     * Une erreur de cleanup ne doit pas masquer l'erreur principale.
     */
  }
}


/* ==========================================================================
   UPLOAD DES FICHIERS VALIDÉS
   ========================================================================== */

async function uploadValidatedFiles(
  params:
    Readonly<{
      storeId:
        string;

      uploadGroupId:
        string;

      files:
        readonly ValidatedUploadFile[];
    }>,
): Promise<NextResponse> {
  const uploadedImages:
    UploadedImageApiItem[] =
    [];


  for (
    const file
    of params.files
  ) {
    /* ----------------------------------------------------------------------
       BUFFER
       ---------------------------------------------------------------------- */

    let buffer:
      ArrayBuffer;


    try {
      buffer =
        await file.getBuffer();
    } catch {
      await cleanupUploadedImages(
        params.storeId,
        uploadedImages,
      );


      return jsonResponse(
        {
          success:
            false,

          code:
            "INVALID_REQUEST",

          message:
            "Impossible de lire l’une des images sélectionnées.",

          fileErrors: [
            createFileError({
              index:
                file.index,

              fileName:
                file.name,

              code:
                "INVALID_REQUEST",

              message:
                "Impossible de lire ce fichier.",
            }),
          ],
        },
        400,
      );
    }


    /* ----------------------------------------------------------------------
       VÉRIFICATION TAILLE RÉELLE
       ---------------------------------------------------------------------- */

    if (
      buffer.byteLength <=
        0 ||
      buffer.byteLength !==
        file.size ||
      buffer.byteLength >
        PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES
    ) {
      await cleanupUploadedImages(
        params.storeId,
        uploadedImages,
      );


      return jsonResponse(
        {
          success:
            false,

          code:
            "INVALID_FILE_SIZE",

          message:
            "La taille réelle de l’image est invalide.",

          fileErrors: [
            createFileError({
              index:
                file.index,

              fileName:
                file.name,

              code:
                "INVALID_FILE_SIZE",

              message:
                "La taille réelle de cette image est invalide.",
            }),
          ],
        },
        400,
      );
    }


    /* ----------------------------------------------------------------------
       STORAGE
       ---------------------------------------------------------------------- */

    let result:
      Awaited<
        ReturnType<
          typeof uploadProductImageToStorage
        >
      >;


    try {
      result =
        await uploadProductImageToStorage({
          storeId:
            params.storeId,

          uploadGroupId:
            params.uploadGroupId,

          file: {
            name:
              file.name,

            mimeType:
              file.mimeType,

            extension:
              file.extension,

            size:
              file.size,

            buffer,
          },
        });
    } catch (
      error
    ) {
      logUnexpectedApiError(
        "POST",
        error,
      );


      await cleanupUploadedImages(
        params.storeId,
        uploadedImages,
      );


      return jsonResponse(
        {
          success:
            false,

          code:
            "UPLOAD_FAILED",

          message:
            "Une erreur est survenue pendant l’envoi de l’image.",

          fileErrors: [
            createFileError({
              index:
                file.index,

              fileName:
                file.name,

              code:
                "UPLOAD_FAILED",

              message:
                "Impossible d’envoyer cette image.",
            }),
          ],
        },
        500,
      );
    }


    /* ----------------------------------------------------------------------
       STORAGE REFUSÉ
       ---------------------------------------------------------------------- */

    if (
      !result.success
    ) {
      await cleanupUploadedImages(
        params.storeId,
        uploadedImages,
      );


      return jsonResponse(
        {
          success:
            false,

          code:
            result.code,

          message:
            result.message,

          fileErrors: [
            createFileError({
              index:
                file.index,

              fileName:
                file.name,

              code:
                result.code,

              message:
                result.message,
            }),
          ],
        },
        getStorageUploadHttpStatus(
          result.code,
        ),
      );
    }


    /* ----------------------------------------------------------------------
       SUCCÈS FICHIER
       ---------------------------------------------------------------------- */

    uploadedImages.push({
      fileId:
        result.image.fileId,

      storagePath:
        result.image.storagePath,

      url:
        result.image.publicUrl,

      originalFileName:
        result.image.originalFileName,

      mimeType:
        result.image.mimeType,

      size:
        result.image.size,
    });
  }


  /* =========================================================================
     SUCCÈS DU LOT
     ========================================================================= */

  return jsonResponse(
    {
      success:
        true,

      uploadGroupId:
        params.uploadGroupId,

      images:
        uploadedImages,
    },
    201,
  );
}


/* ==========================================================================
   MULTIPART — FILE GUARD
   ========================================================================== */

function isFormDataFile(
  value:
    FormDataEntryValue,
): value is File {
  if (
    typeof value ===
    "string"
  ) {
    return false;
  }


  return (
    typeof value.name ===
      "string" &&
    typeof value.type ===
      "string" &&
    typeof value.size ===
      "number" &&
    typeof value.arrayBuffer ===
      "function"
  );
}


/* ==========================================================================
   MULTIPART POST
   ========================================================================== */

/**
 * Ce mode garantit la compatibilité immédiate avec ProduitImagesSection.tsx
 * actuel.
 */

async function handleMultipartUpload(
  request:
    Request,

  access:
    GestionnaireImageAccess,
): Promise<NextResponse> {
  /* ------------------------------------------------------------------------
     FORM DATA
     ------------------------------------------------------------------------ */

  let formData:
    FormData;


  try {
    formData =
      await request.formData();
  } catch {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_REQUEST",

        message:
          "Impossible de lire les images envoyées.",
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     FILES
     ------------------------------------------------------------------------ */

  const formEntries =
    formData.getAll(
      PRODUCT_IMAGE_UPLOAD_FORM_FIELD,
    );


  const files =
    formEntries.filter(
      isFormDataFile,
    );


  if (
    files.length ===
    0
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "MISSING_FILE",

        message:
          "Sélectionnez au moins une image.",
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     QUANTITÉ
     ------------------------------------------------------------------------ */

  if (
    files.length >
      PRODUCT_IMAGE_MAX_FILES ||
    !canAddProductImageFiles(
      0,
      files.length,
    )
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "TOO_MANY_FILES",

        message:
          `Vous pouvez envoyer au maximum ${PRODUCT_IMAGE_MAX_FILES} images à la fois.`,
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     UPLOAD GROUP
     ------------------------------------------------------------------------ */

  const requestedUploadGroupValue =
    formData.get(
      PRODUCT_IMAGE_UPLOAD_GROUP_FORM_FIELD,
    );


  let uploadGroupId =
    createUploadGroupId();


  if (
    typeof requestedUploadGroupValue ===
      "string" &&
    requestedUploadGroupValue
      .trim()
      .length >
      0
  ) {
    const requestedUploadGroupId =
      normalizeUploadGroupId(
        requestedUploadGroupValue,
      );


    if (
      !requestedUploadGroupId
    ) {
      return jsonResponse(
        {
          success:
            false,

          code:
            "INVALID_UPLOAD_GROUP",

          message:
            "Le groupe d’envoi des images est invalide.",
        },
        400,
      );
    }


    uploadGroupId =
      requestedUploadGroupId;
  }


  /* ------------------------------------------------------------------------
     VALIDATION AVANT LE PREMIER UPLOAD
     ------------------------------------------------------------------------ */

  const validatedFiles:
    ValidatedUploadFile[] =
    [];


  const fileErrors:
    ReturnType<
      typeof createFileError
    >[] =
    [];


  for (
    let index =
      0;
    index <
      files.length;
    index +=
      1
  ) {
    const file =
      files[index];


    if (
      !file
    ) {
      continue;
    }


    const validation =
      validateProductImageFileMetadata({
        name:
          file.name,

        type:
          file.type,

        size:
          file.size,
      });


    if (
      !validation.success
    ) {
      const code =
        validation.code ===
        "INVALID_FILE_NAME"
          ? "INVALID_FILE_NAME"
          : validation.code ===
              "INVALID_MIME_TYPE"
            ? "INVALID_FILE_TYPE"
            : validation.code ===
                "INVALID_FILE_SIZE"
              ? "INVALID_FILE_SIZE"
              : "INVALID_REQUEST";


      fileErrors.push(
        createFileError({
          index,

          fileName:
            normalizeFileName(
              file.name,
            ),

          code,

          message:
            validation.message,
        }),
      );


      continue;
    }


    validatedFiles.push({
      index,

      name:
        normalizeFileName(
          file.name,
        ) ??
        `image-${index + 1}.${validation.extension}`,

      mimeType:
        validation.mimeType,

      extension:
        validation.extension,

      size:
        file.size,

      getBuffer:
        () =>
          file.arrayBuffer(),
    });
  }


  /* ------------------------------------------------------------------------
     ERREURS DE VALIDATION
     ------------------------------------------------------------------------ */

  if (
    fileErrors.length >
    0
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_REQUEST",

        message:
          "Une ou plusieurs images ne respectent pas les règles d’envoi.",

        fileErrors,
      },
      400,
    );
  }


  if (
    validatedFiles.length ===
    0
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "MISSING_FILE",

        message:
          "Aucune image valide n’a été reçue.",
      },
      400,
    );
  }


  return uploadValidatedFiles({
    storeId:
      access.storeId,

    uploadGroupId,

    files:
      validatedFiles,
  });
}


/* ==========================================================================
   BINARY POST
   ========================================================================== */

/**
 * Format futur possible :
 *
 * POST /api/gestionnaire/produits/images
 *
 * Content-Type: image/jpeg
 *
 * x-product-image-file-name: produit.jpg
 * x-product-image-upload-group: upload_xxx
 *
 * body = fichier brut
 */

async function handleBinaryUpload(
  request:
    Request,

  access:
    GestionnaireImageAccess,
): Promise<NextResponse> {
  const contentType =
    (
      request.headers.get(
        "content-type",
      ) ??
      ""
    )
      .split(
        ";",
      )[0]
      ?.trim()
      .toLowerCase() ??
    "";


  /* ------------------------------------------------------------------------
     MIME
     ------------------------------------------------------------------------ */

  if (
    !isProductImageMimeType(
      contentType,
    )
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_FILE_TYPE",

        message:
          "Le format de l’image n’est pas pris en charge.",
      },
      415,
    );
  }


  /* ------------------------------------------------------------------------
     FILE NAME
     ------------------------------------------------------------------------ */

  const fileName =
    getBinaryFileName(
      request,
    );


  if (
    !fileName
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_FILE_NAME",

        message:
          "Le nom du fichier est manquant ou invalide.",
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     CONTENT LENGTH
     ------------------------------------------------------------------------ */

  const contentLengthHeader =
    request.headers.get(
      "content-length",
    );


  if (
    contentLengthHeader
  ) {
    const declaredSize =
      Number(
        contentLengthHeader,
      );


    if (
      !Number.isFinite(
        declaredSize,
      ) ||
      declaredSize <=
        0 ||
      declaredSize >
        PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES
    ) {
      return jsonResponse(
        {
          success:
            false,

          code:
            "INVALID_FILE_SIZE",

          message:
            "La taille de l’image est invalide.",
        },
        413,
      );
    }
  }


  /* ------------------------------------------------------------------------
     BODY
     ------------------------------------------------------------------------ */

  let buffer:
    ArrayBuffer;


  try {
    buffer =
      await request.arrayBuffer();
  } catch {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_REQUEST",

        message:
          "Impossible de lire l’image envoyée.",
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     MÉTADONNÉES
     ------------------------------------------------------------------------ */

  const validation =
    validateProductImageFileMetadata({
      name:
        fileName,

      type:
        contentType,

      size:
        buffer.byteLength,
    });


  if (
    !validation.success
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          validation.code ===
          "INVALID_MIME_TYPE"
            ? "INVALID_FILE_TYPE"
            : validation.code ===
                "INVALID_FILE_SIZE"
              ? "INVALID_FILE_SIZE"
              : "INVALID_FILE_NAME",

        message:
          validation.message,
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     UPLOAD GROUP
     ------------------------------------------------------------------------ */

  const rawUploadGroupId =
    request.headers.get(
      BINARY_UPLOAD_GROUP_HEADER,
    );


  let uploadGroupId =
    createUploadGroupId();


  if (
    rawUploadGroupId
  ) {
    const normalizedUploadGroupId =
      normalizeUploadGroupId(
        rawUploadGroupId,
      );


    if (
      !normalizedUploadGroupId
    ) {
      return jsonResponse(
        {
          success:
            false,

          code:
            "INVALID_UPLOAD_GROUP",

          message:
            "Le groupe d’envoi de l’image est invalide.",
        },
        400,
      );
    }


    uploadGroupId =
      normalizedUploadGroupId;
  }


  /* ------------------------------------------------------------------------
     STORAGE
     ------------------------------------------------------------------------ */

  return uploadValidatedFiles({
    storeId:
      access.storeId,

    uploadGroupId,

    files: [
      {
        index:
          0,

        name:
          fileName,

        mimeType:
          validation.mimeType,

        extension:
          validation.extension,

        size:
          buffer.byteLength,

        getBuffer:
          async () =>
            buffer,
      },
    ],
  });
}


/* ==========================================================================
   POST INTERNE
   ========================================================================== */

async function handlePost(
  request:
    Request,
): Promise<NextResponse> {
  /* ------------------------------------------------------------------------
     AUTH
     ------------------------------------------------------------------------ */

  const access =
    await getProductImageAccess();


  if (
    !access
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "UNAUTHORIZED",

        message:
          "Votre session Gestionnaire n’est plus valide.",
      },
      401,
    );
  }


  /* ------------------------------------------------------------------------
     CONTENT TYPE
     ------------------------------------------------------------------------ */

  const contentType =
    (
      request.headers.get(
        "content-type",
      ) ??
      ""
    ).toLowerCase();


  /* ------------------------------------------------------------------------
     MULTIPART
     ------------------------------------------------------------------------ */

  if (
    contentType.includes(
      "multipart/form-data",
    )
  ) {
    return handleMultipartUpload(
      request,
      access,
    );
  }


  /* ------------------------------------------------------------------------
     BINARY
     ------------------------------------------------------------------------ */

  if (
    isProductImageMimeType(
      contentType
        .split(
          ";",
        )[0]
        ?.trim() ??
        "",
    )
  ) {
    return handleBinaryUpload(
      request,
      access,
    );
  }


  /* ------------------------------------------------------------------------
     UNSUPPORTED
     ------------------------------------------------------------------------ */

  return jsonResponse(
    {
      success:
        false,

      code:
        "INVALID_REQUEST",

      message:
        "Le format de la requête d’envoi des images n’est pas pris en charge.",
    },
    415,
  );
}


/* ==========================================================================
   POST PUBLIC
   ========================================================================== */

/**
 * Protection globale :
 *
 * même une erreur inattendue doit produire une réponse JSON.
 */

export async function POST(
  request:
    Request,
): Promise<NextResponse> {
  try {
    return await handlePost(
      request,
    );
  } catch (
    error
  ) {
    logUnexpectedApiError(
      "POST",
      error,
    );


    return jsonResponse(
      {
        success:
          false,

        code:
          "UPLOAD_FAILED",

        message:
          "Une erreur interne est survenue pendant l’envoi des images.",
      },
      500,
    );
  }
}


/* ==========================================================================
   DELETE BODY
   ========================================================================== */

interface DeleteImageRequestBody {
  readonly storagePath?:
    unknown;
}


/* ==========================================================================
   DELETE INTERNE
   ========================================================================== */

async function handleDelete(
  request:
    Request,
): Promise<NextResponse> {
  /* ------------------------------------------------------------------------
     AUTH
     ------------------------------------------------------------------------ */

  const access =
    await getProductImageAccess();


  if (
    !access
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "UNAUTHORIZED",

        message:
          "Votre session Gestionnaire n’est plus valide.",
      },
      401,
    );
  }


  /* ------------------------------------------------------------------------
     JSON
     ------------------------------------------------------------------------ */

  let body:
    DeleteImageRequestBody;


  try {
    const rawBody:
      unknown =
      await request.json();


    if (
      typeof rawBody !==
        "object" ||
      rawBody ===
        null
    ) {
      return jsonResponse(
        {
          success:
            false,

          code:
            "INVALID_REQUEST",

          message:
            "La requête de suppression est invalide.",
        },
        400,
      );
    }


    body =
      rawBody as DeleteImageRequestBody;
  } catch {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_REQUEST",

        message:
          "La requête de suppression est invalide.",
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     STORAGE PATH
     ------------------------------------------------------------------------ */

  if (
    typeof body.storagePath !==
    "string"
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_STORAGE_PATH",

        message:
          "Le chemin de l’image est manquant.",
      },
      400,
    );
  }


  const storagePath =
    body.storagePath.trim();


  if (
    !storagePath
  ) {
    return jsonResponse(
      {
        success:
          false,

        code:
          "INVALID_STORAGE_PATH",

        message:
          "Le chemin de l’image est invalide.",
      },
      400,
    );
  }


  /* ------------------------------------------------------------------------
     STORAGE DELETE
     ------------------------------------------------------------------------ */

  const deleteResult =
    await deleteProductImageFromStorage({
      storeId:
        access.storeId,

      storagePath,
    });


  /* ------------------------------------------------------------------------
     STORAGE ERROR
     ------------------------------------------------------------------------ */

  if (
    !deleteResult.success
  ) {
    switch (
      deleteResult.code
    ) {
      case "FILE_NOT_OWNED":
        return jsonResponse(
          {
            success:
              false,

            code:
              "FILE_NOT_OWNED",

            message:
              deleteResult.message,
          },
          403,
        );


      case "INVALID_STORAGE_PATH":
        return jsonResponse(
          {
            success:
              false,

            code:
              "INVALID_STORAGE_PATH",

            message:
              deleteResult.message,
          },
          400,
        );


      case "STORAGE_NOT_CONFIGURED":
        return jsonResponse(
          {
            success:
              false,

            code:
              "DELETE_FAILED",

            message:
              "Le stockage des images n’est pas correctement configuré.",
          },
          503,
        );


      case "DELETE_FAILED":
      default:
        return jsonResponse(
          {
            success:
              false,

            code:
              "DELETE_FAILED",

            message:
              deleteResult.message,
          },
          502,
        );
    }
  }


  /* ------------------------------------------------------------------------
     SUCCESS
     ------------------------------------------------------------------------ */

  return jsonResponse(
    {
      success:
        true,

      storagePath:
        deleteResult.storagePath,
    },
    200,
  );
}


/* ==========================================================================
   DELETE PUBLIC
   ========================================================================== */

export async function DELETE(
  request:
    Request,
): Promise<NextResponse> {
  try {
    return await handleDelete(
      request,
    );
  } catch (
    error
  ) {
    logUnexpectedApiError(
      "DELETE",
      error,
    );


    return jsonResponse(
      {
        success:
          false,

        code:
          "DELETE_FAILED",

        message:
          "Une erreur interne est survenue pendant la suppression de l’image.",
      },
      500,
    );
  }
}