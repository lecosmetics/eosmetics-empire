"use server";

import {

  createHash,

} from "node:crypto";

import {

  revalidatePath,

} from "next/cache";

import {

  headers,

} from "next/headers";

import {

  AuditAction,

  ManagerStatus,

  Prisma,

  ProductOrigin,

  ProductStatus,

  StockMovementType,

  StoreProductStatus,

  StoreStatus,

} from "@prisma/client";

import {

  db,

} from "@/prisma/db";

import {

  gestionnaireRouteBuilders,

  publicRouteBuilders,

  routes,

} from "@/config/routes";

import {

  requireGestionnairePrivateAccess,

} from "@/lib/gestionnaire/espace-prive/private-access";

import {

  deleteProductImageFromStorage,

} from "@/lib/gestionnaire/produits/images/product-image-storage";

import {

  activeProductCategoryExists,

  queryProductCreateStore,

} from "@/lib/gestionnaire/produits/ajouter/product-create-query";

import {

  parseProductCreateFormData,

} from "@/lib/gestionnaire/produits/ajouter/product-create-schema";

import {

  type ProductCreateActionState,

  type ProductCreateFieldErrors,

  type ProductCreateFormValues,

  type ProductCreateImageFieldError,

  type ProductCreateImageInput,

  type ProductCreateProductStatus,

  type ProductCreatePublicationStatus,

  type ProductCreateStoreProductStatus,

  type ProductCreateSuccessData,

  type ProductCreateValidatedInput,

} from "@/lib/gestionnaire/produits/ajouter/product-create-types";



/**

 * ============================================================================

 * L&E COSMETICS EMPIRE

 * ESPACE GESTIONNAIRE — CRÉATION / MODIFICATION D'UN PRODUIT

 * ============================================================================

 *

 * Fichier :

 *

 * src/lib/gestionnaire/produits/ajouter/product-create-actions.ts

 *

 * RESPONSABILITÉS :

 *

 * - authentifier le Gestionnaire côté serveur ;

 * - déterminer la boutique depuis la session ;

 * - valider FormData ;

 * - vérifier la catégorie ;

 * - vérifier les images uploadées ;

 * - empêcher l'utilisation d'images d'une autre boutique ;

 * - récupérer la devise réelle du Store ;

 * - générer un SKU serveur ;

 * - générer un slug serveur ;

 * - créer le qrToken public stable ;

 * - déterminer DRAFT / PUBLISHED / INACTIVE ;

 * - créer Product ;

 * - créer ProductImage ;

 * - créer StoreProduct ;

 * - créer le mouvement de stock INITIAL ou un ajustement en modification ;

 * - journaliser la création ou la modification ;

 * - protéger la création contre les doubles soumissions ;

 * - préserver SKU, slug et qrToken lors d’une modification ;

 * - revalider les routes concernées ;

 * - retourner les routes de détail et QR.

 *

 * IMPORTANT :

 *

 * Le navigateur ne choisit JAMAIS :

 *

 * - storeId ;

 * - managerId ;

 * - Product.origin ;

 * - SKU ;

 * - slug ;

 * - qrToken ;

 * - devise définitive ;

 * - propriétaire du produit.

 *

 * Toutes ces valeurs sont calculées ou vérifiées côté serveur.

 *

 * ============================================================================

 */



/* ==========================================================================

   CONSTANTES

   ========================================================================== */

const DEFAULT_DRAFT_PRICE =

  0;



const DEFAULT_DRAFT_STOCK =

  0;



const DEFAULT_LOW_STOCK_THRESHOLD =

  5;



const MAX_IP_ADDRESS_LENGTH =

  128;



const MAX_USER_AGENT_LENGTH =

  1_000;



const PRODUCT_ENTITY_TYPE =

  "Product";



const PRODUCT_FORM_MODE_FIELD =

  "mode";



const PRODUCT_FORM_PRODUCT_ID_FIELD =

  "productId";



const PRODUCT_FORM_INTENT_FIELD =

  "intent";



const PRODUCT_FORM_PUBLICATION_STATUS_FIELD =

  "publicationStatus";



const MAX_PRODUCT_ID_LENGTH =

  191;



/* ==========================================================================

   BUSINESS ERROR

   ========================================================================== */

type ProductCreateBusinessErrorCode =

  | "CATEGORY_UNAVAILABLE"

  | "STORE_UNAVAILABLE"

  | "MANAGER_UNAVAILABLE"

  | "INVALID_IMAGES"

  | "INVALID_PRODUCT_ID"

  | "PRODUCT_NOT_FOUND"

  | "PRODUCT_NOT_EDITABLE"

  | "CREATE_CONFLICT"

  | "UPDATE_CONFLICT";



class ProductCreateBusinessError extends Error {

  constructor(

    public readonly code:

      ProductCreateBusinessErrorCode,

    message:

      string,

    public readonly fieldErrors:

      ProductCreateFieldErrors |

      null =

        null,

    public readonly imageErrors:

      readonly ProductCreateImageFieldError[] =

        [],

  ) {

    super(

      message,

    );

    this.name =

      "ProductCreateBusinessError";

  }

}



/* ==========================================================================

   TYPES INTERNES

   ========================================================================== */

interface AuthenticatedProductCreateContext {

  managerId:

    string;

  storeId:

    string;

}



interface RequestAuditContext {

  ipAddress:

    string |

    null;

  userAgent:

    string |

    null;

}



interface ResolvedProductStatuses {

  productStatus:

    ProductStatus;

  storeProductStatus:

    StoreProductStatus;

  publicationStatus:

    ProductCreatePublicationStatus;

}



interface CreatedProductResult {

  productId:

    string;

  storeProductId:

    string;

  productName:

    string;

  sku:

    string;

  qrToken:

    string;

  productStatus:

    ProductStatus;

  storeProductStatus:

    StoreProductStatus;

}



type ProductMutationMode =

  | "create"

  | "edit";



type ProductMutationOperation =

  | "create"

  | "update";



interface ExistingProductImageRecord {

  id:

    string;

  url:

    string;

  altText:

    string |
    null;

  position:

    number;

  isPrimary:

    boolean;

}



interface ResolvedUpdateImage {

  existingImageId:

    string |
    null;

  url:

    string;

  altText:

    string |
    null;

  position:

    number;

  isPrimary:

    boolean;

}



interface ResolvedUpdateImages {

  images:

    readonly ResolvedUpdateImage[];

  removedImages:

    readonly ExistingProductImageRecord[];

}



interface UpdatedProductTransactionResult {

  updated:

    CreatedProductResult;

  removedStoragePaths:

    readonly string[];

}



/* ==========================================================================

   ACTION STATE — VALIDATION ERROR

   ========================================================================== */

function createValidationErrorState(

  params:

    Readonly<{

      message:

        string;

      fieldErrors:

        ProductCreateFieldErrors;

      imageErrors:

        readonly ProductCreateImageFieldError[];

      values:

        ProductCreateFormValues;

    }>,

): ProductCreateActionState {

  return {

    status:

      "validation-error",

    message:

      params.message,

    fieldErrors:

      params.fieldErrors,

    imageErrors:

      params.imageErrors,

    values:

      params.values,

    data:

      null,

  };

}



/* ==========================================================================

   ACTION STATE — BUSINESS ERROR

   ========================================================================== */

function createBusinessErrorState(

  params:

    Readonly<{

      message:

        string;

      values:

        ProductCreateFormValues;

      fieldErrors?:

        ProductCreateFieldErrors |

        null;

      imageErrors?:

        readonly ProductCreateImageFieldError[];

    }>,

): ProductCreateActionState {

  return {

    status:

      "business-error",

    message:

      params.message,

    fieldErrors:

      params.fieldErrors ??

      null,

    imageErrors:

      params.imageErrors ??

      [],

    values:

      params.values,

    data:

      null,

  };

}



/* ==========================================================================

   ACTION STATE — SERVER ERROR

   ========================================================================== */

function createServerErrorState(

  values:

    ProductCreateFormValues,

): ProductCreateActionState {

  return {

    status:

      "server-error",

    message:

      "Impossible d’enregistrer le produit pour le moment. Veuillez réessayer.",

    fieldErrors:

      null,

    imageErrors:

      [],

    values,

    data:

      null,

  };

}



/* ==========================================================================

   NORMALISATION — IDENTIFIANTS

   ========================================================================== */

function requireNonEmptyIdentifier(

  value:

    string,

  errorCode:

    string,

): string {

  const normalized =

    value.trim();



  if (

    !normalized

  ) {

    throw new Error(

      errorCode,

    );

  }



  return normalized;

}



/* ==========================================================================

   MODE CREATE / EDIT

   ========================================================================== */

function getProductMutationMode(

  formData:

    FormData,

): ProductMutationMode {

  const rawMode =

    formData.get(

      PRODUCT_FORM_MODE_FIELD,

    );



  if (

    typeof rawMode ===

      "string" &&

    rawMode

      .trim()

      .toLowerCase() ===

      "edit"

  ) {

    return "edit";

  }



  /*

   * Compatibilité descendante : les anciens formulaires de création

   * n'envoyaient pas encore le champ mode.

   */

  return "create";

}



function getEditProductId(

  formData:

    FormData,

): string | null {

  const rawProductId =

    formData.get(

      PRODUCT_FORM_PRODUCT_ID_FIELD,

    );



  if (

    typeof rawProductId !==

      "string"

  ) {

    return null;

  }



  const productId =

    rawProductId.trim();



  if (

    !productId ||

    productId.length >

      MAX_PRODUCT_ID_LENGTH ||

    !/^[A-Za-z0-9_-]+$/.test(

      productId,

    )

  ) {

    return null;

  }



  return productId;

}



/**

 * Le bouton unique "Enregistrer les modifications" n'a pas besoin

 * d'inventer un nouveau contrat de validation.

 *

 * En mode édition, si aucun submitter intent n'est présent, on dérive

 * l'intention à partir du statut de publication déjà porté par le formulaire.

 *

 * - DRAFT      -> draft

 * - PUBLISHED  -> publish

 * - INACTIVE   -> publish (le statut INACTIVE reste lu séparément)

 */

function normalizeProductMutationFormData(

  formData:

    FormData,

  mode:

    ProductMutationMode,

): FormData {

  if (

    mode !==

      "edit" ||

    formData.has(

      PRODUCT_FORM_INTENT_FIELD,

    )

  ) {

    return formData;

  }



  const normalized =

    new FormData();



  formData.forEach(

    (

      value,

      key,

    ) => {

      normalized.append(

        key,

        value,

      );

    },

  );



  const publicationStatus =

    String(

      normalized.get(

        PRODUCT_FORM_PUBLICATION_STATUS_FIELD,

      ) ??

      "",

    )

      .trim()

      .toUpperCase();



  normalized.set(

    PRODUCT_FORM_INTENT_FIELD,

    publicationStatus ===

      "DRAFT"

      ? "draft"

      : "publish",

  );



  return normalized;

}



/* ==========================================================================

   CONTEXTE AUTHENTIFIÉ

   ========================================================================== */

async function getAuthenticatedProductCreateContext():

  Promise<AuthenticatedProductCreateContext> {

  const access =

    await requireGestionnairePrivateAccess();



  const managerId =

    requireNonEmptyIdentifier(

      access.manager.id,

      "MANAGER_ACCESS_INVALID",

    );



  const storeId =

    requireNonEmptyIdentifier(

      access.store.id,

      "STORE_ACCESS_INVALID",

    );



  return {

    managerId,

    storeId,

  };

}



/* ==========================================================================

   REQUEST AUDIT CONTEXT

   ========================================================================== */

async function getRequestAuditContext():

  Promise<RequestAuditContext> {

  try {

    const requestHeaders =

      await headers();



    const cloudflareIp =

      requestHeaders

        .get(

          "cf-connecting-ip",

        )

        ?.trim();



    const realIp =

      requestHeaders

        .get(

          "x-real-ip",

        )

        ?.trim();



    const forwardedIp =

      requestHeaders

        .get(

          "x-forwarded-for",

        )

        ?.split(

          ",",

        )[0]

        ?.trim();



    const ipAddress =

      (

        cloudflareIp ||

        realIp ||

        forwardedIp ||

        null

      );



    const userAgent =

      requestHeaders

        .get(

          "user-agent",

        )

        ?.trim() ||

      null;



    return {

      ipAddress:

        ipAddress

          ?.slice(

            0,

            MAX_IP_ADDRESS_LENGTH,

          ) ??

        null,

      userAgent:

        userAgent

          ?.slice(

            0,

            MAX_USER_AGENT_LENGTH,

          ) ??

        null,

    };

  } catch {

    return {

      ipAddress:

        null,

      userAgent:

        null,

    };

  }

}



/* ==========================================================================

   NORMALISATION — DEVISE

   ========================================================================== */

function normalizeCurrency(

  value:

    string,

): string {

  const normalized =

    value

      .trim()

      .toUpperCase();



  if (

    !/^[A-Z]{3}$/.test(

      normalized,

    )

  ) {

    throw new ProductCreateBusinessError(

      "STORE_UNAVAILABLE",

      "La devise de cette boutique n’est pas correctement configurée.",

    );

  }



  return normalized;

}



/* ==========================================================================

   SLUG

   ========================================================================== */

/**

 * Crée uniquement la partie lisible.

 */

function slugifyProductName(

  value:

    string,

): string {

  const normalized =

    value

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



  return normalized ||

    "produit";

}



/* ==========================================================================

   FINGERPRINT DE SOUMISSION

   ========================================================================== */

/**

 * submissionId est généré une fois par formulaire.

 *

 * La combinaison :

 *

 * storeId + submissionId

 *

 * permet de dériver un identifiant stable pour cette tentative logique.

 *

 * Cela nous permet d'utiliser le SKU unique de Product comme garde

 * d'idempotence sans ajouter une nouvelle table uniquement pour le formulaire.

 */

function createSubmissionHash(

  namespace:

    string,

  storeId:

    string,

  submissionId:

    string,

): Buffer {

  return createHash(

    "sha256",

  )

    .update(

      namespace,

      "utf8",

    )

    .update(

      "\0",

      "utf8",

    )

    .update(

      storeId,

      "utf8",

    )

    .update(

      "\0",

      "utf8",

    )

    .update(

      submissionId,

      "utf8",

    )

    .digest();

}



/* ==========================================================================

   SKU STABLE POUR LA SOUMISSION

   ========================================================================== */

function createProductSku(

  storeId:

    string,

  submissionId:

    string,

): string {

  const hash =

    createSubmissionHash(

      "le-cosmetics-product-sku-v1",

      storeId,

      submissionId,

    )

      .toString(

        "hex",

      )

      .slice(

        0,

        20,

      )

      .toUpperCase();



  return `LE-${hash}`;

}



/* ==========================================================================

   SLUG UNIQUE

   ========================================================================== */

/**

 * Le suffixe dépend lui aussi de la soumission.

 *

 * Même produit + même soumission :

 * même slug.

 *

 * Nouveau formulaire :

 * nouveau suffixe.

 */

function createProductSlug(

  productName:

    string,

  storeId:

    string,

  submissionId:

    string,

): string {

  const readablePart =

    slugifyProductName(

      productName,

    );



  const suffix =

    createSubmissionHash(

      "le-cosmetics-product-slug-v1",

      storeId,

      submissionId,

    )

      .toString(

        "hex",

      )

      .slice(

        0,

        10,

      );



  return `${readablePart}-${suffix}`;

}



/* ==========================================================================

   QR TOKEN STABLE

   ========================================================================== */

/**

 * Le token :

 *

 * - ne contient pas le prix ;

 * - ne contient pas le stock ;

 * - ne contient pas managerId ;

 * - ne contient pas la session ;

 * - ne contient pas de secret ;

 * - reste stable pour ce StoreProduct.

 *

 * Une modification ultérieure du produit ne touche donc jamais ce token.

 */

function createStableProductQrToken(

  storeId:

    string,

  submissionId:

    string,

): string {

  return createSubmissionHash(

    "le-cosmetics-product-qr-v1",

    storeId,

    submissionId,

  )

    .toString(

      "base64url",

    )

    .slice(

      0,

      32,

    );

}



/* ==========================================================================

   STATUTS

   ========================================================================== */

function resolveProductStatuses(

  input:

    ProductCreateValidatedInput,

): ResolvedProductStatuses {

  /* ------------------------------------------------------------------------

     BROUILLON

     ------------------------------------------------------------------------ */

  if (

    input.intent ===

    "draft"

  ) {

    return {

      productStatus:

        ProductStatus.DRAFT,

      storeProductStatus:

        StoreProductStatus.HIDDEN,

      publicationStatus:

        "DRAFT",

    };

  }



  /* ------------------------------------------------------------------------

     INACTIF

     ------------------------------------------------------------------------ */

  if (

    input.publicationStatus ===

    "INACTIVE"

  ) {

    return {

      productStatus:

        ProductStatus.ACTIVE,

      storeProductStatus:

        StoreProductStatus.HIDDEN,

      publicationStatus:

        "INACTIVE",

    };

  }



  /* ------------------------------------------------------------------------

     PUBLIÉ

     ------------------------------------------------------------------------ */

  const stock =

    input.stockQuantity ??

    DEFAULT_DRAFT_STOCK;



  return {

    productStatus:

      ProductStatus.ACTIVE,

    storeProductStatus:

      stock >

        0

        ? StoreProductStatus.ACTIVE

        : StoreProductStatus.OUT_OF_STOCK,

    publicationStatus:

      "PUBLISHED",

  };

}



/* ==========================================================================

   IMAGE STORAGE — EXTRACTION DU STORAGE PATH DEPUIS L'URL

   ========================================================================== */

function getStoragePathFromProductImageUrl(

  imageUrl:

    string,

): string | null {

  const bucket =

    process.env

      .SUPABASE_PRODUCT_IMAGES_BUCKET

      ?.trim();



  if (

    !bucket

  ) {

    return null;

  }



  try {

    const url =

      new URL(

        imageUrl,

      );



    const configuredSupabaseUrl =

      (

        process.env

          .SUPABASE_URL ??

        process.env

          .NEXT_PUBLIC_SUPABASE_URL ??

        ""

      )

        .trim();



    /*

     * Lorsque SUPABASE_URL est configurée, l'URL de l'image doit

     * appartenir au même origin.

     */

    if (

      configuredSupabaseUrl

    ) {

      try {

        const supabaseUrl =

          new URL(

            configuredSupabaseUrl,

          );



        if (

          url.origin !==

          supabaseUrl.origin

        ) {

          return null;

        }

      } catch {

        return null;

      }

    }



    const encodedMarker =

      `/storage/v1/object/public/${encodeURIComponent(

        bucket,

      )}/`;



    const rawMarker =

      `/storage/v1/object/public/${bucket}/`;



    let storagePart:

      string |

      null =

        null;



    const encodedIndex =

      url.pathname.indexOf(

        encodedMarker,

      );



    if (

      encodedIndex >=

      0

    ) {

      storagePart =

        url.pathname.slice(

          encodedIndex +

            encodedMarker.length,

        );

    } else {

      const rawIndex =

        url.pathname.indexOf(

          rawMarker,

        );



      if (

        rawIndex >=

        0

      ) {

        storagePart =

          url.pathname.slice(

            rawIndex +

              rawMarker.length,

          );

      }

    }



    if (

      !storagePart

    ) {

      return null;

    }



    const decoded =

      decodeURIComponent(

        storagePart,

      )

        .replace(

          /^\/+/,

          "",

        )

        .trim();



    if (

      !decoded ||

      decoded.includes(

        "..",

      ) ||

      decoded.includes(

        "\\\\",

      )

    ) {

      return null;

    }



    return decoded;

  } catch {

    return null;

  }

}



/* ==========================================================================

   IMAGE OWNERSHIP

   ========================================================================== */

/**

 * Cette vérification complète celle déjà faite par l'API d'upload.

 *

 * Même si quelqu'un modifie manuellement le FormData, une image appartenant

 * à une autre boutique ne doit jamais être enregistrée sur le produit.

 */

function validateUploadedImageOwnership(

  params:

    Readonly<{

      image:

        ProductCreateImageInput;

      storeId:

        string;

    }>,

): boolean {

  const {

    image,

    storeId,

  } =

    params;



  const storagePath =

    getStoragePathFromProductImageUrl(

      image.url,

    );



  if (

    !storagePath

  ) {

    return false;

  }



  const expectedStorePrefix =

    `stores/${storeId}/`;



  /*

   * L'autorisation finale repose sur le chemin serveur de la boutique.

   * On ne dépend volontairement pas de métadonnées optionnelles envoyées

   * par le navigateur (source, fileId, storagePath).

   *

   * Cela reste compatible avec le contrat minimal ProductCreateImageInput

   * tout en empêchant une boutique de réutiliser l'image d'une autre.

   */

  return storagePath.startsWith(

    expectedStorePrefix,

  );

}



/* ==========================================================================

   VALIDATION DE TOUTES LES IMAGES

   ========================================================================== */

function validateUploadedImagesOwnership(

  images:

    readonly ProductCreateImageInput[],

  storeId:

    string,

): ProductCreateImageFieldError[] {

  const errors:

    ProductCreateImageFieldError[] =

      [];



  images.forEach(

    (

      image,

      index,

    ) => {

      if (

        !validateUploadedImageOwnership({

          image,

          storeId,

        })

      ) {

        errors.push({

          index,

          message:

            "Cette image ne peut pas être utilisée pour ce produit.",

        });

      }

    },

  );



  return errors;

}



/* ==========================================================================

   PRISMA UNIQUE CONSTRAINT

   ========================================================================== */

function isPrismaUniqueConstraintError(

  error:

    unknown,

): error is Prisma.PrismaClientKnownRequestError {

  return (

    error instanceof

      Prisma.PrismaClientKnownRequestError &&

    error.code ===

      "P2002"

  );

}



/* ==========================================================================

   PRISMA FOREIGN KEY ERROR

   ========================================================================== */

function isPrismaForeignKeyError(

  error:

    unknown,

): boolean {

  return (

    error instanceof

      Prisma.PrismaClientKnownRequestError &&

    error.code ===

      "P2003"

  );

}



/* ==========================================================================

   CONVERSION DES STATUTS POUR LE CLIENT

   ========================================================================== */

function toClientProductStatus(

  value:

    ProductStatus,

): ProductCreateProductStatus {

  switch (

    value

  ) {

    case ProductStatus.DRAFT:

      return "DRAFT";

    case ProductStatus.ARCHIVED:

      return "ARCHIVED";

    case ProductStatus.ACTIVE:

    default:

      return "ACTIVE";

  }

}



function toClientStoreProductStatus(

  value:

    StoreProductStatus,

): ProductCreateStoreProductStatus {

  switch (

    value

  ) {

    case StoreProductStatus.OUT_OF_STOCK:

      return "OUT_OF_STOCK";

    case StoreProductStatus.HIDDEN:

      return "HIDDEN";

    case StoreProductStatus.ARCHIVED:

      return "ARCHIVED";

    case StoreProductStatus.ACTIVE:

    default:

      return "ACTIVE";

  }

}



/* ==========================================================================

   PUBLICATION STATUS DEPUIS LA DB

   ========================================================================== */

function resolvePublicationStatusFromDatabase(

  productStatus:

    ProductStatus,

  storeProductStatus:

    StoreProductStatus,

): ProductCreatePublicationStatus {

  if (

    productStatus ===

    ProductStatus.DRAFT

  ) {

    return "DRAFT";

  }



  if (

    storeProductStatus ===

      StoreProductStatus.HIDDEN ||

    storeProductStatus ===

      StoreProductStatus.ARCHIVED

  ) {

    return "INACTIVE";

  }



  return "PUBLISHED";

}



/* ==========================================================================

   SUCCESS DATA

   ========================================================================== */

function createSuccessData(

  created:

    CreatedProductResult,

): ProductCreateSuccessData {

  const detailRoute =

    gestionnaireRouteBuilders

      .productDetails(

        created.productId,

      );



  const qrRoute =

    gestionnaireRouteBuilders

      .productQr(

        created.productId,

      );



  const publicProductRoute =

    publicRouteBuilders

      .productByQr(

        created.qrToken,

      );



  return {

    productId:

      created.productId,

    storeProductId:

      created.storeProductId,

    productName:

      created.productName,

    sku:

      created.sku,

    qrToken:

      created.qrToken,

    detailRoute,

    qrRoute,

    publicProductRoute,

    publicationStatus:

      resolvePublicationStatusFromDatabase(

        created.productStatus,

        created.storeProductStatus,

      ),

    productStatus:

      toClientProductStatus(

        created.productStatus,

      ),

    storeProductStatus:

      toClientStoreProductStatus(

        created.storeProductStatus,

      ),

  };

}



/* ==========================================================================

   SUCCESS STATE

   ========================================================================== */

function createSuccessState(

  params:

    Readonly<{

      created:

        CreatedProductResult;

      values:

        ProductCreateFormValues;

      duplicateSubmission?:

        boolean;

      operation?:

        ProductMutationOperation;

    }>,

): ProductCreateActionState {

  const data =

    createSuccessData(

      params.created,

    );



  const isDraft =

    data.publicationStatus ===

    "DRAFT";



  return {

    status:

      "success",

    message:

      params.operation ===

        "update"

        ? (

            isDraft

              ? "Brouillon modifié avec succès."

              : data.publicationStatus ===

                  "INACTIVE"

                ? "Produit modifié et conservé avec le statut inactif."

                : "Produit modifié avec succès."

          )

        : params.duplicateSubmission

          ? (

              isDraft

                ? "Ce brouillon avait déjà été enregistré."

                : "Ce produit avait déjà été créé."

            )

          : (

              isDraft

                ? "Produit enregistré comme brouillon."

                : data.publicationStatus ===

                    "INACTIVE"

                  ? "Produit enregistré avec le statut inactif."

                  : "Produit publié avec succès."

            ),

    fieldErrors:

      null,

    imageErrors:

      [],

    values:

      params.values,

    data,

  };

}



/* ==========================================================================

   RECHERCHE IDEMPOTENTE

   ========================================================================== */

/**

 * Le SKU est dérivé de :

 *

 * storeId + submissionId

 *

 * Une deuxième exécution du même formulaire retrouve donc le produit

 * déjà créé au lieu d'en créer une copie.

 */

async function findExistingProductForSubmission(

  params:

    Readonly<{

      storeId:

        string;

      sku:

        string;

    }>,

): Promise<CreatedProductResult | null> {

  const product =

    await db.product.findFirst({

      where: {

        sku:

          params.sku,

        origin:

          ProductOrigin.STORE,

        createdByStoreId:

          params.storeId,

        storeProducts: {

          some: {

            storeId:

              params.storeId,

          },

        },

      },

      select: {

        id:

          true,

        name:

          true,

        sku:

          true,

        status:

          true,

        storeProducts: {

          where: {

            storeId:

              params.storeId,

          },

          select: {

            id:

              true,

            qrToken:

              true,

            status:

              true,

          },

          take:

            1,

        },

      },

    });



  const storeProduct =

    product

      ?.storeProducts[0];



  if (

    !product ||

    !storeProduct

  ) {

    return null;

  }



  return {

    productId:

      product.id,

    storeProductId:

      storeProduct.id,

    productName:

      product.name,

    sku:

      product.sku,

    qrToken:

      storeProduct.qrToken,

    productStatus:

      product.status,

    storeProductStatus:

      storeProduct.status,

  };

}



/* ==========================================================================

   REVALIDATION

   ========================================================================== */

function revalidateProductMutationPaths(

  created:

    CreatedProductResult,

): void {

  const detailRoute =

    gestionnaireRouteBuilders

      .productDetails(

        created.productId,

      );



  const publicRoute =

    publicRouteBuilders

      .productByQr(

        created.qrToken,

      );



  revalidatePath(

    routes.gestionnaire.products,

  );



  revalidatePath(

    routes.gestionnaire.dashboard,

  );



  revalidatePath(

    routes.gestionnaire.stock,

  );



  revalidatePath(

    detailRoute,

  );



  revalidatePath(

    publicRoute,

  );

}



/* ==========================================================================

   TRANSACTION — CRÉATION

   ========================================================================== */

async function createProductTransaction(

  params:

    Readonly<{

      input:

        ProductCreateValidatedInput;

      managerId:

        string;

      storeId:

        string;

      currency:

        string;

      sku:

        string;

      slug:

        string;

      qrToken:

        string;

      requestAudit:

        RequestAuditContext;

    }>,

): Promise<CreatedProductResult> {

  const {

    input,

    managerId,

    storeId,

    sku,

    slug,

    qrToken,

    requestAudit,

  } =

    params;



  return db.$transaction(

    async (

      tx,

    ) => {

      /* --------------------------------------------------------------------

         1. RE-VÉRIFICATION MANAGER + STORE

         -------------------------------------------------------------------- */

      const activeManager =

        await tx.manager.findFirst({

          where: {

            id:

              managerId,

            storeId,

            status:

              ManagerStatus.ACTIVE,

            emailVerifiedAt: {

              not:

                null,

            },

            store: {

              status:

                StoreStatus.ACTIVE,

            },

          },

          select: {

            id:

              true,

            store: {

              select: {

                id:

                  true,

                currency:

                  true,

                status:

                  true,

              },

            },

          },

        });



      if (

        !activeManager

      ) {

        throw new ProductCreateBusinessError(

          "MANAGER_UNAVAILABLE",

          "Votre compte ou votre boutique n’est plus disponible pour cette opération.",

        );

      }



      /* --------------------------------------------------------------------

         2. DEVISE ACTUELLE

         -------------------------------------------------------------------- */

      const currency =

        normalizeCurrency(

          activeManager

            .store

            .currency,

        );



      /* --------------------------------------------------------------------

         3. IDEMPOTENCE DANS LA TRANSACTION

         -------------------------------------------------------------------- */

      const existingProduct =

        await tx.product.findUnique({

          where: {

            sku,

          },

          select: {

            id:

              true,

            name:

              true,

            sku:

              true,

            status:

              true,

            origin:

              true,

            createdByStoreId:

              true,

            storeProducts: {

              where: {

                storeId,

              },

              select: {

                id:

                  true,

                qrToken:

                  true,

                status:

                  true,

              },

              take:

                1,

            },

          },

        });



      if (

        existingProduct

      ) {

        const existingStoreProduct =

          existingProduct

            .storeProducts[0];



        if (

          existingProduct.origin ===

            ProductOrigin.STORE &&

          existingProduct.createdByStoreId ===

            storeId &&

          existingStoreProduct

        ) {

          return {

            productId:

              existingProduct.id,

            storeProductId:

              existingStoreProduct.id,

            productName:

              existingProduct.name,

            sku:

              existingProduct.sku,

            qrToken:

              existingStoreProduct

                .qrToken,

            productStatus:

              existingProduct.status,

            storeProductStatus:

              existingStoreProduct

                .status,

          };

        }



        throw new ProductCreateBusinessError(

          "CREATE_CONFLICT",

          "Impossible de créer ce produit avec cette soumission. Rechargez la page puis réessayez.",

        );

      }



      /* --------------------------------------------------------------------

         4. CATÉGORIE — RE-VÉRIFICATION TRANSACTIONNELLE

         -------------------------------------------------------------------- */

      if (

        input.categoryId

      ) {

        const category =

          await tx.productCategory.findFirst({

            where: {

              id:

                input.categoryId,

              isActive:

                true,

            },

            select: {

              id:

                true,

            },

          });



        if (

          !category

        ) {

          throw new ProductCreateBusinessError(

            "CATEGORY_UNAVAILABLE",

            "La catégorie sélectionnée n’est plus disponible.",

            {

              categoryId: [

                "La catégorie sélectionnée n’existe plus ou n’est plus disponible.",

              ],

            },

          );

        }

      }



      /* --------------------------------------------------------------------

         5. STATUTS

         -------------------------------------------------------------------- */

      const resolvedStatuses =

        resolveProductStatuses(

          input,

        );



      /* --------------------------------------------------------------------

         6. DONNÉES COMMERCIALES

         -------------------------------------------------------------------- */

      const stockQuantity =

        input.stockQuantity ??

        DEFAULT_DRAFT_STOCK;



      const price =

        new Prisma.Decimal(

          input.price ??

          DEFAULT_DRAFT_PRICE,

        );



      const compareAtPrice =

        input.compareAtPrice ===

          null

          ? null

          : new Prisma.Decimal(

              input.compareAtPrice,

            );



      /* --------------------------------------------------------------------

         7. CRÉATION PRODUCT

         -------------------------------------------------------------------- */

      const product =

        await tx.product.create({

          data: {

            origin:

              ProductOrigin.STORE,

            createdByStoreId:

              storeId,

            categoryId:

              input.categoryId,

            name:

              input.name,

            slug,

            sku,

            description:

              input.description,

            brand:

              input.brand,

            ingredients:

              input.ingredients,

            weightContent:

              input.weightContent,

            usageInstructions:

              input.usageInstructions,

            unit:

              input.unit,

            status:

              resolvedStatuses

                .productStatus,

            /*

             * Les images ont déjà été uploadées via l'API sécurisée.

             * ProductImage conserve seulement les URLs et métadonnées

             * utiles au produit.

             */

            images:

              input.images.length >

                0

                ? {

                    create:

                      input.images.map(

                        (

                          image,

                        ) => ({

                          url:

                            image.url,

                          altText:

                            image.altText ??

                            null,

                          position:

                            image.position,

                          isPrimary:

                            image.isPrimary,

                        }),

                      ),

                  }

                : undefined,

          },

          select: {

            id:

              true,

            name:

              true,

            sku:

              true,

            status:

              true,

          },

        });



      /* --------------------------------------------------------------------

         8. STORE PRODUCT

         -------------------------------------------------------------------- */

      const storeProduct =

        await tx.storeProduct.create({

          data: {

            storeId,

            productId:

              product.id,

            price,

            compareAtPrice,

            currency,

            stockQuantity,

            lowStockThreshold:

              DEFAULT_LOW_STOCK_THRESHOLD,

            status:

              resolvedStatuses

                .storeProductStatus,

            qrToken,

          },

          select: {

            id:

              true,

            qrToken:

              true,

            status:

              true,

          },

        });



      /* --------------------------------------------------------------------

         9. STOCK INITIAL

         --------------------------------------------------------------------

         Pour un brouillon sans stock renseigné :

         aucun mouvement artificiel n'est créé.

         Lorsque le gestionnaire renseigne réellement le champ, même 0,

         l'état initial peut être tracé.

         -------------------------------------------------------------------- */

      if (

        input.stockQuantity !==

        null

      ) {

        await tx.stockMovement.create({

          data: {

            storeId,

            storeProductId:

              storeProduct.id,

            managerId,

            type:

              StockMovementType.INITIAL,

            quantity:

              stockQuantity,

            quantityBefore:

              0,

            quantityAfter:

              stockQuantity,

            reason:

              "Stock initial lors de la création du produit.",

            reference:

              product.sku,

          },

        });

      }



      /* --------------------------------------------------------------------

         10. AUDIT

         -------------------------------------------------------------------- */

      await tx.auditLog.create({

        data: {

          storeId,

          managerId,

          action:

            AuditAction.CREATE,

          entityType:

            PRODUCT_ENTITY_TYPE,

          entityId:

            product.id,

          metadata: {

            origin:

              ProductOrigin.STORE,

            intent:

              input.intent,

            publicationStatus:

              resolvedStatuses

                .publicationStatus,

            productStatus:

              resolvedStatuses

                .productStatus,

            storeProductStatus:

              resolvedStatuses

                .storeProductStatus,

            sku:

              product.sku,

            currency,

            stockQuantity,

            imageCount:

              input.images.length,

          },

          ipAddress:

            requestAudit.ipAddress,

          userAgent:

            requestAudit.userAgent,

        },

      });



      /* --------------------------------------------------------------------

         11. RÉSULTAT

         -------------------------------------------------------------------- */

      return {

        productId:

          product.id,

        storeProductId:

          storeProduct.id,

        productName:

          product.name,

        sku:

          product.sku,

        qrToken:

          storeProduct.qrToken,

        productStatus:

          product.status,

        storeProductStatus:

          storeProduct.status,

      };

    },

  );

}



/* ==========================================================================

   MODIFICATION — RÉSOLUTION DES IMAGES

   ========================================================================== */

function normalizeImageUrl(

  value:

    string,

): string {

  return value.trim();

}



function resolveSubmittedImagesForUpdate(

  params:

    Readonly<{

      existingImages:

        readonly ExistingProductImageRecord[];

      submittedImages:

        readonly ProductCreateImageInput[];

      storeId:

        string;

    }>,

): ResolvedUpdateImages {

  const existingByUrl =

    new Map<

      string,

      ExistingProductImageRecord[]

    >();



  for (

    const image

    of params.existingImages

  ) {

    const url =

      normalizeImageUrl(

        image.url,

      );



    const current =

      existingByUrl.get(

        url,

      ) ??

      [];



    current.push(

      image,

    );



    existingByUrl.set(

      url,

      current,

    );

  }



  const usedExistingImageIds =

    new Set<string>();



  const seenSubmittedUrls =

    new Set<string>();



  const resolvedImages:

    ResolvedUpdateImage[] =

      [];



  params.submittedImages.forEach(

    (

      image,

      index,

    ) => {

      const url =

        normalizeImageUrl(

          image.url,

        );



      if (

        !url ||

        seenSubmittedUrls.has(

          url,

        )

      ) {

        throw new ProductCreateBusinessError(

          "INVALID_IMAGES",

          "La liste des images du produit est invalide.",

          {

            images: [

              "Une même image ne peut pas être enregistrée plusieurs fois.",

            ],

          },

          [

            {

              index,

              message:

                "Cette image est dupliquée ou invalide.",

            },

          ],

        );

      }



      seenSubmittedUrls.add(

        url,

      );



      const candidates =

        existingByUrl.get(

          url,

        );



      const existingImage =

        candidates

          ?.find(

            (candidate) =>

              !usedExistingImageIds.has(

                candidate.id,

              ),

          ) ??

        null;



      if (

        existingImage

      ) {

        usedExistingImageIds.add(

          existingImage.id,

        );



        resolvedImages.push({

          existingImageId:

            existingImage.id,

          url,

          altText:

            image.altText ??

            null,

          position:

            index,

          isPrimary:

            image.isPrimary,

        });



        return;

      }



      /*

       * URL inconnue de ProductImage = nouvelle image.

       * Elle doit obligatoirement pointer vers le Storage de la boutique

       * authentifiée.

       */

      if (

        !validateUploadedImageOwnership({

          image,

          storeId:

            params.storeId,

        })

      ) {

        throw new ProductCreateBusinessError(

          "INVALID_IMAGES",

          "Une ou plusieurs images ne peuvent pas être utilisées pour ce produit.",

          {

            images: [

              "Vérifiez les images ajoutées au produit.",

            ],

          },

          [

            {

              index,

              message:

                "Cette image n'appartient pas à la boutique authentifiée.",

            },

          ],

        );

      }



      resolvedImages.push({

        existingImageId:

          null,

        url,

        altText:

          image.altText ??

          null,

        position:

          index,

        isPrimary:

          image.isPrimary,

      });

    },

  );



  if (

    resolvedImages.length >

      0

  ) {

    const primaryCount =

      resolvedImages.filter(

        (image) =>

          image.isPrimary,

      ).length;



    if (

      primaryCount >

        1

    ) {

      throw new ProductCreateBusinessError(

        "INVALID_IMAGES",

        "Une seule image peut être définie comme image principale.",

        {

          images: [

            "Sélectionnez une seule image principale.",

          ],

        },

      );

    }



    if (

      primaryCount ===

        0

    ) {

      resolvedImages[0] = {

        ...resolvedImages[0],

        isPrimary:

          true,

      };

    }

  }



  const removedImages =

    params.existingImages.filter(

      (image) =>

        !usedExistingImageIds.has(

          image.id,

        ),

    );



  return {

    images:

      resolvedImages,

    removedImages,

  };

}



/* ==========================================================================

   MODIFICATION — NETTOYAGE STORAGE APRÈS COMMIT

   ========================================================================== */

async function cleanupRemovedProductImageStorage(

  params:

    Readonly<{

      storeId:

        string;

      storagePaths:

        readonly string[];

    }>,

): Promise<void> {

  const uniqueStoragePaths =

    [

      ...new Set(

        params.storagePaths,

      ),

    ];



  for (

    const storagePath

    of uniqueStoragePaths

  ) {

    try {

      await deleteProductImageFromStorage({

        storeId:

          params.storeId,

        storagePath,

      });

    } catch {

      /*

       * La transaction DB est déjà validée.

       * Un échec ponctuel de nettoyage Storage ne doit jamais transformer

       * une modification réussie en faux échec utilisateur.

       */

    }

  }

}



/* ==========================================================================

   TRANSACTION — MODIFICATION

   ========================================================================== */

async function updateProductTransaction(

  params:

    Readonly<{

      input:

        ProductCreateValidatedInput;

      productId:

        string;

      managerId:

        string;

      storeId:

        string;

      requestAudit:

        RequestAuditContext;

    }>,

): Promise<UpdatedProductTransactionResult> {

  const {

    input,

    productId,

    managerId,

    storeId,

    requestAudit,

  } =

    params;



  return db.$transaction(

    async (

      tx,

    ) => {

      /* --------------------------------------------------------------------

         1. MANAGER + STORE ACTIFS

         -------------------------------------------------------------------- */

      const activeManager =

        await tx.manager.findFirst({

          where: {

            id:

              managerId,

            storeId,

            status:

              ManagerStatus.ACTIVE,

            emailVerifiedAt: {

              not:

                null,

            },

            store: {

              status:

                StoreStatus.ACTIVE,

            },

          },

          select: {

            id:

              true,

            store: {

              select: {

                id:

                  true,

                currency:

                  true,

              },

            },

          },

        });



      if (

        !activeManager

      ) {

        throw new ProductCreateBusinessError(

          "MANAGER_UNAVAILABLE",

          "Votre compte ou votre boutique n’est plus disponible pour cette opération.",

        );

      }



      const currency =

        normalizeCurrency(

          activeManager

            .store

            .currency,

        );



      /* --------------------------------------------------------------------

         2. PRODUIT APPARTENANT À LA BOUTIQUE

         -------------------------------------------------------------------- */

      const currentProduct =

        await tx.product.findFirst({

          where: {

            id:

              productId,

            origin:

              ProductOrigin.STORE,

            createdByStoreId:

              storeId,

            status: {

              in: [

                ProductStatus.DRAFT,

                ProductStatus.ACTIVE,

              ],

            },

            storeProducts: {

              some: {

                storeId,

                status: {

                  in: [

                    StoreProductStatus.ACTIVE,

                    StoreProductStatus.OUT_OF_STOCK,

                    StoreProductStatus.HIDDEN,

                  ],

                },

              },

            },

          },

          select: {

            id:

              true,

            name:

              true,

            sku:

              true,

            status:

              true,

            images: {

              select: {

                id:

                  true,

                url:

                  true,

                altText:

                  true,

                position:

                  true,

                isPrimary:

                  true,

              },

              orderBy: [

                {

                  position:

                    "asc",

                },

                {

                  createdAt:

                    "asc",

                },

              ],

            },

            storeProducts: {

              where: {

                storeId,

              },

              select: {

                id:

                  true,

                price:

                  true,

                compareAtPrice:

                  true,

                currency:

                  true,

                stockQuantity:

                  true,

                lowStockThreshold:

                  true,

                status:

                  true,

                qrToken:

                  true,

              },

              take:

                1,

            },

          },

        });



      if (

        !currentProduct

      ) {

        throw new ProductCreateBusinessError(

          "PRODUCT_NOT_FOUND",

          "Le produit demandé est introuvable ou n’est plus modifiable.",

        );

      }



      const currentStoreProduct =

        currentProduct

          .storeProducts[0];



      if (

        !currentStoreProduct ||

        currentStoreProduct.status ===

          StoreProductStatus.ARCHIVED

      ) {

        throw new ProductCreateBusinessError(

          "PRODUCT_NOT_EDITABLE",

          "Les informations commerciales de ce produit ne sont plus modifiables.",

        );

      }



      /* --------------------------------------------------------------------

         3. CATÉGORIE — RE-VÉRIFICATION TRANSACTIONNELLE

         -------------------------------------------------------------------- */

      if (

        input.categoryId

      ) {

        const category =

          await tx.productCategory.findFirst({

            where: {

              id:

                input.categoryId,

              isActive:

                true,

            },

            select: {

              id:

                true,

            },

          });



        if (

          !category

        ) {

          throw new ProductCreateBusinessError(

            "CATEGORY_UNAVAILABLE",

            "La catégorie sélectionnée n’est plus disponible.",

            {

              categoryId: [

                "La catégorie sélectionnée n’existe plus ou n’est plus disponible.",

              ],

            },

          );

        }

      }



      /* --------------------------------------------------------------------

         4. STOCK / PRIX / STATUTS

         -------------------------------------------------------------------- */

      const stockQuantity =

        input.stockQuantity ??

        currentStoreProduct

          .stockQuantity;



      const price =

        input.price ===

          null

          ? currentStoreProduct

              .price

          : new Prisma.Decimal(

              input.price,

            );



      const compareAtPrice =

        input.compareAtPrice ===

          null

          ? null

          : new Prisma.Decimal(

              input.compareAtPrice,

            );



      const effectiveInput:

        ProductCreateValidatedInput =

        {

          ...input,

          stockQuantity,

        };



      const resolvedStatuses =

        resolveProductStatuses(

          effectiveInput,

        );



      /* --------------------------------------------------------------------

         5. IMAGES

         -------------------------------------------------------------------- */

      const imageChanges =

        resolveSubmittedImagesForUpdate({

          existingImages:

            currentProduct.images,

          submittedImages:

            input.images,

          storeId,

        });



      const removedImageIds =

        imageChanges

          .removedImages

          .map(

            (image) =>

              image.id,

          );



      const removedStoragePaths =

        imageChanges

          .removedImages

          .map(

            (image) =>

              getStoragePathFromProductImageUrl(

                image.url,

              ),

          )

          .filter(

            (

              storagePath,

            ): storagePath is string =>

              storagePath !==

              null,

          );



      /* --------------------------------------------------------------------

         6. PRODUCT

         -------------------------------------------------------------------- */

      const updatedProduct =

        await tx.product.update({

          where: {

            id:

              currentProduct.id,

          },

          data: {

            categoryId:

              input.categoryId,

            name:

              input.name,

            description:

              input.description,

            brand:

              input.brand,

            ingredients:

              input.ingredients,

            weightContent:

              input.weightContent,

            usageInstructions:

              input.usageInstructions,

            unit:

              input.unit,

            status:

              resolvedStatuses

                .productStatus,



            /*

             * Intentionnellement non modifiés :

             *

             * - origin ;

             * - createdByStoreId ;

             * - sku ;

             * - slug.

             */

          },

          select: {

            id:

              true,

            name:

              true,

            sku:

              true,

            status:

              true,

          },

        });



      /* --------------------------------------------------------------------

         7. STORE PRODUCT

         -------------------------------------------------------------------- */

      const updatedStoreProduct =

        await tx.storeProduct.update({

          where: {

            id:

              currentStoreProduct.id,

          },

          data: {

            price,

            compareAtPrice,

            currency,

            stockQuantity,

            status:

              resolvedStatuses

                .storeProductStatus,



            /*

             * lowStockThreshold et qrToken restent inchangés.

             */

          },

          select: {

            id:

              true,

            qrToken:

              true,

            status:

              true,

          },

        });



      /* --------------------------------------------------------------------

         8. IMAGES RETIRÉES

         -------------------------------------------------------------------- */

      if (

        removedImageIds.length >

          0

      ) {

        const deletionResult =

          await tx.productImage.deleteMany({

            where: {

              productId:

                currentProduct.id,

              id: {

                in:

                  removedImageIds,

              },

            },

          });



        if (

          deletionResult.count !==

            removedImageIds.length

        ) {

          throw new ProductCreateBusinessError(

            "UPDATE_CONFLICT",

            "Les images du produit ont changé pendant la modification. Rechargez la page puis réessayez.",

          );

        }

      }



      /* --------------------------------------------------------------------

         9. IMAGES CONSERVÉES / NOUVELLES

         -------------------------------------------------------------------- */

      for (

        const image

        of imageChanges.images

      ) {

        if (

          image.existingImageId

        ) {

          const updateResult =

            await tx.productImage.updateMany({

              where: {

                id:

                  image.existingImageId,

                productId:

                  currentProduct.id,

              },

              data: {

                altText:

                  image.altText,

                position:

                  image.position,

                isPrimary:

                  image.isPrimary,

              },

            });



          if (

            updateResult.count !==

              1

          ) {

            throw new ProductCreateBusinessError(

              "UPDATE_CONFLICT",

              "Une image du produit a changé pendant la modification. Rechargez la page puis réessayez.",

            );

          }



          continue;

        }



        await tx.productImage.create({

          data: {

            productId:

              currentProduct.id,

            url:

              image.url,

            altText:

              image.altText,

            position:

              image.position,

            isPrimary:

              image.isPrimary,

          },

        });

      }



      /* --------------------------------------------------------------------

         10. MOUVEMENT DE STOCK

         -------------------------------------------------------------------- */

      const stockDifference =

        stockQuantity -

        currentStoreProduct

          .stockQuantity;



      if (

        stockDifference !==

          0

      ) {

        await tx.stockMovement.create({

          data: {

            storeId,

            storeProductId:

              currentStoreProduct.id,

            managerId,

            type:

              stockDifference >

                0

                ? StockMovementType.ADJUSTMENT_IN

                : StockMovementType.ADJUSTMENT_OUT,

            quantity:

              Math.abs(

                stockDifference,

              ),

            quantityBefore:

              currentStoreProduct

                .stockQuantity,

            quantityAfter:

              stockQuantity,

            reason:

              "Ajustement du stock lors de la modification du produit.",

            reference:

              updatedProduct.sku,

          },

        });

      }



      /* --------------------------------------------------------------------

         11. AUDIT

         -------------------------------------------------------------------- */

      await tx.auditLog.create({

        data: {

          storeId,

          managerId,

          action:

            AuditAction.UPDATE,

          entityType:

            PRODUCT_ENTITY_TYPE,

          entityId:

            updatedProduct.id,

          metadata: {

            origin:

              ProductOrigin.STORE,

            intent:

              input.intent,

            publicationStatus:

              resolvedStatuses

                .publicationStatus,

            productStatusBefore:

              currentProduct.status,

            productStatusAfter:

              updatedProduct.status,

            storeProductStatusBefore:

              currentStoreProduct.status,

            storeProductStatusAfter:

              updatedStoreProduct.status,

            sku:

              updatedProduct.sku,

            qrTokenPreserved:

              true,

            currency,

            stockBefore:

              currentStoreProduct

                .stockQuantity,

            stockAfter:

              stockQuantity,

            lowStockThreshold:

              currentStoreProduct

                .lowStockThreshold,

            imageCountBefore:

              currentProduct

                .images

                .length,

            imageCountAfter:

              imageChanges

                .images

                .length,

            removedImageCount:

              removedImageIds.length,

          },

          ipAddress:

            requestAudit.ipAddress,

          userAgent:

            requestAudit.userAgent,

        },

      });



      /* --------------------------------------------------------------------

         12. RÉSULTAT — IDENTITÉS PRÉSERVÉES

         -------------------------------------------------------------------- */

      return {

        updated: {

          productId:

            updatedProduct.id,

          storeProductId:

            updatedStoreProduct.id,

          productName:

            updatedProduct.name,

          sku:

            updatedProduct.sku,

          qrToken:

            updatedStoreProduct

              .qrToken,

          productStatus:

            updatedProduct.status,

          storeProductStatus:

            updatedStoreProduct

              .status,

        },

        removedStoragePaths,

      };

    },

  );

}



/* ==========================================================================

   MODIFICATION — ORCHESTRATION

   ========================================================================== */

async function updateExistingProduct(

  params:

    Readonly<{

      input:

        ProductCreateValidatedInput;

      values:

        ProductCreateFormValues;

      productId:

        string;

      managerId:

        string;

      storeId:

        string;

    }>,

): Promise<ProductCreateActionState> {

  const requestAudit =

    await getRequestAuditContext();



  let transactionResult:

    UpdatedProductTransactionResult;



  try {

    transactionResult =

      await updateProductTransaction({

        input:

          params.input,

        productId:

          params.productId,

        managerId:

          params.managerId,

        storeId:

          params.storeId,

        requestAudit,

      });

  } catch (

    error

  ) {

    if (

      error instanceof

        ProductCreateBusinessError

    ) {

      return createBusinessErrorState({

        message:

          error.message,

        values:

          params.values,

        fieldErrors:

          error.fieldErrors,

        imageErrors:

          error.imageErrors,

      });

    }



    if (

      isPrismaUniqueConstraintError(

        error,

      )

    ) {

      return createBusinessErrorState({

        message:

          "Un conflit est survenu pendant la modification du produit. Rechargez la page puis réessayez.",

        values:

          params.values,

      });

    }



    if (

      isPrismaForeignKeyError(

        error,

      )

    ) {

      return createBusinessErrorState({

        message:

          "Certaines informations liées au produit ne sont plus disponibles. Rechargez la page puis réessayez.",

        values:

          params.values,

      });

    }



    return createServerErrorState(

      params.values,

    );

  }



  if (

    transactionResult

      .removedStoragePaths

      .length >

      0

  ) {

    await cleanupRemovedProductImageStorage({

      storeId:

        params.storeId,

      storagePaths:

        transactionResult

          .removedStoragePaths,

    });

  }



  try {

    revalidateProductMutationPaths(

      transactionResult.updated,

    );

  } catch {

    /*

     * DB déjà commitée : la revalidation ne doit pas produire un faux échec.

     */

  }



  return createSuccessState({

    created:

      transactionResult.updated,

    values:

      params.values,

    operation:

      "update",

  });

}



/* ==========================================================================

   SERVER ACTION

   ========================================================================== */

/**

 * Point d'entrée du formulaire :

 *

 * AjouterProduitForm.tsx

 *

 * --------------------------------------------------------------------------

 *

 * Ordre :

 *

 * session

 * ↓

 * validation

 * ↓

 * catégorie

 * ↓

 * images

 * ↓

 * devise boutique

 * ↓

 * génération identités

 * ↓

 * transaction

 * ↓

 * Product

 * ↓

 * ProductImage

 * ↓

 * StoreProduct

 * ↓

 * StockMovement INITIAL

 * ↓

 * AuditLog

 * ↓

 * succès

 *

 * ==========================================================================

 */

export async function createProductAction(

  _previousState:

    ProductCreateActionState,

  formData:

    FormData,

): Promise<ProductCreateActionState> {

  /*

   * useActionState fournit l'état précédent.

   *

   * Il n'est jamais considéré comme une source d'autorisation.

   */

  void _previousState;



  const mutationMode =

    getProductMutationMode(

      formData,

    );



  const editProductId =

    mutationMode ===

      "edit"

      ? getEditProductId(

          formData,

        )

      : null;



  const normalizedFormData =

    normalizeProductMutationFormData(

      formData,

      mutationMode,

    );



  /* =========================================================================

     1. AUTHENTIFICATION

     ========================================================================= */

  const authContext =

    await getAuthenticatedProductCreateContext();



  const {

    managerId,

    storeId,

  } =

    authContext;



  /* =========================================================================

     2. VALIDATION DU FORMULAIRE

     ========================================================================= */

  const parsed =

    parseProductCreateFormData(

      normalizedFormData,

    );



  if (

    !parsed.success

  ) {

    return createValidationErrorState({

      message:

        parsed.message,

      fieldErrors:

        parsed.fieldErrors,

      imageErrors:

        parsed.imageErrors,

      values:

        parsed.values,

    });

  }



  const input =

    parsed.data;



  const values =

    parsed.values;



  /* =========================================================================

     3. CATÉGORIE — PRÉ-VÉRIFICATION

     ========================================================================= */

  if (

    input.categoryId

  ) {

    let categoryAvailable:

      boolean;



    try {

      categoryAvailable =

        await activeProductCategoryExists(

          input.categoryId,

        );

    } catch {

      return createServerErrorState(

        values,

      );

    }



    if (

      !categoryAvailable

    ) {

      return createBusinessErrorState({

        message:

          "La catégorie sélectionnée n’est plus disponible.",

        values,

        fieldErrors: {

          categoryId: [

            "La catégorie sélectionnée n’existe plus ou n’est plus disponible.",

          ],

        },

      });

    }

  }



  /* =========================================================================

     4. MODIFICATION D'UN PRODUIT EXISTANT

     ========================================================================= */

  if (

    mutationMode ===

      "edit"

  ) {

    if (

      !editProductId

    ) {

      return createBusinessErrorState({

        message:

          "Le produit à modifier est invalide.",

        values,

      });

    }



    return updateExistingProduct({

      input,

      values,

      productId:

        editProductId,

      managerId,

      storeId,

    });

  }



  /* =========================================================================

     5. IMAGES — APPARTENANCE À LA BOUTIQUE

     ========================================================================= */

  const imageOwnershipErrors =

    validateUploadedImagesOwnership(

      input.images,

      storeId,

    );



  if (

    imageOwnershipErrors.length >

    0

  ) {

    return createBusinessErrorState({

      message:

        "Une ou plusieurs images ne peuvent pas être utilisées pour ce produit.",

      values,

      fieldErrors: {

        images: [

          "Vérifiez les images ajoutées au produit.",

        ],

      },

      imageErrors:

        imageOwnershipErrors,

    });

  }



  /* =========================================================================

     5. CONFIGURATION BOUTIQUE

     ========================================================================= */

  let storeConfiguration:

    Awaited<

      ReturnType<

        typeof queryProductCreateStore

      >

    >;



  try {

    storeConfiguration =

      await queryProductCreateStore({

        storeId,

      });

  } catch {

    return createBusinessErrorState({

      message:

        "Cette boutique n’est pas disponible pour la création de produits.",

      values,

    });

  }



  const currency =

    normalizeCurrency(

      storeConfiguration

        .currency,

    );



  /* =========================================================================

     6. IDENTITÉS TECHNIQUES

     ========================================================================= */

  const sku =

    createProductSku(

      storeId,

      input.submissionId,

    );



  const slug =

    createProductSlug(

      input.name,

      storeId,

      input.submissionId,

    );



  const qrToken =

    createStableProductQrToken(

      storeId,

      input.submissionId,

    );



  /* =========================================================================

     7. IDEMPOTENCE AVANT TRANSACTION

     ========================================================================= */

  try {

    const existing =

      await findExistingProductForSubmission({

        storeId,

        sku,

      });



    if (

      existing

    ) {

      revalidateProductMutationPaths(

        existing,

      );



      return createSuccessState({

        created:

          existing,

        values,

        duplicateSubmission:

          true,

      });

    }

  } catch {

    /*

     * Une erreur de lecture ici n'autorise pas la création aveugle à

     * être considérée comme réussie.

     *

     * La transaction et la contrainte UNIQUE du SKU restent néanmoins

     * la protection définitive contre la duplication.

     */

  }



  /* =========================================================================

     8. AUDIT REQUEST CONTEXT

     ========================================================================= */

  const requestAudit =

    await getRequestAuditContext();



  /* =========================================================================

     9. TRANSACTION

     ========================================================================= */

  let created:

    CreatedProductResult;



  try {

    created =

      await createProductTransaction({

        input,

        managerId,

        storeId,

        currency,

        sku,

        slug,

        qrToken,

        requestAudit,

      });

  } catch (

    error

  ) {

    /* ----------------------------------------------------------------------

       ERREUR MÉTIER

       ---------------------------------------------------------------------- */

    if (

      error instanceof

      ProductCreateBusinessError

    ) {

      return createBusinessErrorState({

        message:

          error.message,

        values,

        fieldErrors:

          error.fieldErrors,

        imageErrors:

          error.imageErrors,

      });

    }



    /* ----------------------------------------------------------------------

       DOUBLE SOUMISSION CONCURRENTE

       ----------------------------------------------------------------------

       Cas :

       clic 1

       clic 2 presque simultanément

       Les deux requêtes peuvent franchir la lecture précédente.

       La contrainte UNIQUE sur SKU tranche alors définitivement.

       ---------------------------------------------------------------------- */

    if (

      isPrismaUniqueConstraintError(

        error,

      )

    ) {

      try {

        const existing =

          await findExistingProductForSubmission({

            storeId,

            sku,

          });



        if (

          existing

        ) {

          revalidateProductMutationPaths(

            existing,

          );



          return createSuccessState({

            created:

              existing,

            values,

            duplicateSubmission:

              true,

          });

        }

      } catch {

        /*

         * On continue vers le message générique.

         */

      }



      return createBusinessErrorState({

        message:

          "Un conflit est survenu pendant la création du produit. Rechargez la page puis réessayez.",

        values,

      });

    }



    /* ----------------------------------------------------------------------

       FOREIGN KEY

       ---------------------------------------------------------------------- */

    if (

      isPrismaForeignKeyError(

        error,

      )

    ) {

      return createBusinessErrorState({

        message:

          "Certaines informations liées au produit ne sont plus disponibles. Rechargez la page puis réessayez.",

        values,

      });

    }



    /*

     * Ne jamais retourner au navigateur :

     *

     * - error.message Prisma ;

     * - stack trace ;

     * - requête SQL ;

     * - URL DB ;

     * - secret.

     */

    return createServerErrorState(

      values,

    );

  }



  /* =========================================================================

     10. REVALIDATION

     ========================================================================= */

  try {

    revalidateProductMutationPaths(

      created,

    );

  } catch {

    /*

     * Le produit est déjà correctement créé en base.

     *

     * Une erreur de revalidation de cache ne doit pas transformer

     * une transaction réussie en échec utilisateur.

     */

  }



  /* =========================================================================

     11. SUCCESS

     ========================================================================= */

  return createSuccessState({

    created,

    values,

    duplicateSubmission:

      false,

  });

}