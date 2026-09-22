/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CRÉATION / MODIFICATION D'UN PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/ajouter/product-create-types.ts
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par :
 *
 * - product-create-schema.ts
 * - product-create-query.ts
 * - product-create-actions.ts
 * - AjouterProduitForm.tsx
 * - ProduitInformationsSection.tsx
 * - ProduitPrixStockSection.tsx
 * - ProduitDetailsSection.tsx
 * - ProduitImagesSection.tsx
 * - ProduitPreviewQrStatus.tsx
 * - page.tsx
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - écrire en base ;
 * - générer le QR ;
 * - générer le slug ;
 * - générer le SKU ;
 * - uploader des fichiers ;
 * - faire confiance à un storeId envoyé par le navigateur ;
 * - contenir de secret serveur.
 *
 * IMPORTANT :
 *
 * Les données d'autorisation comme :
 *
 * - storeId ;
 * - managerId ;
 * - rôle ;
 * - statut de la boutique ;
 *
 * ne font volontairement PAS partie du formulaire.
 *
 * Elles seront déterminées exclusivement côté serveur depuis
 * la session Gestionnaire authentifiée.
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS MÉTIER
   ========================================================================== */

/**
 * Alias explicites.
 *
 * Prisma utilise actuellement des cuid(), donc ces valeurs restent
 * techniquement des string.
 */

export type ProductCreateProductId =
  string;


export type ProductCreateStoreProductId =
  string;


export type ProductCreateCategoryId =
  string;


export type ProductCreateImageId =
  string;


export type ProductCreateQrToken =
  string;


/* ==========================================================================
   CONSTANTES — ORIGINE
   ========================================================================== */

/**
 * La page :
 *
 * /gestionnaire/produits/ajouter
 *
 * crée exclusivement un produit appartenant à la boutique actuelle.
 *
 * Le navigateur ne choisit jamais cette valeur.
 */

export const PRODUCT_CREATE_ORIGIN =
  "STORE" as const;


export type ProductCreateOrigin =
  typeof PRODUCT_CREATE_ORIGIN;


/* ==========================================================================
   CONSTANTES — MARQUE
   ========================================================================== */

/**
 * Marque officielle actuellement utilisée.
 *
 * Elle reste centralisée ici afin de ne pas avoir :
 *
 * "L&E Cosmetics"
 *
 * écrit manuellement dans plusieurs composants.
 *
 * Si le projet gère plusieurs marques plus tard, la liste devra alors
 * provenir d'une vraie source de données.
 */

export const PRODUCT_CREATE_DEFAULT_BRAND =
  "L&E Cosmetics" as const;


/* ==========================================================================
   INTENTION DE SOUMISSION
   ========================================================================== */

/**
 * Les deux gros boutons situés en haut de la page utilisent le même
 * formulaire.
 *
 * Enregistrer comme brouillon :
 *
 * intent = "draft"
 *
 * Publier le produit :
 *
 * intent = "publish"
 *
 * Cela permet au serveur d'appliquer des niveaux de validation différents.
 */

export const PRODUCT_CREATE_INTENTS = [
  "draft",
  "publish",
] as const;


export type ProductCreateIntent =
  (typeof PRODUCT_CREATE_INTENTS)[number];


/* ==========================================================================
   STATUT VISUEL DE LA PAGE
   ========================================================================== */

/**
 * Valeurs utilisées par la carte :
 *
 * Statut du produit
 *
 * Elles représentent l'intention métier de l'interface.
 *
 * Elles ne correspondent pas directement 1 pour 1 à un seul enum Prisma.
 *
 * Le serveur effectuera la traduction vers :
 *
 * Product.status
 * +
 * StoreProduct.status
 *
 * Exemple :
 *
 * PUBLISHED
 * Product.status      = ACTIVE
 * StoreProduct.status = ACTIVE / OUT_OF_STOCK
 *
 * DRAFT
 * Product.status      = DRAFT
 * StoreProduct.status = HIDDEN
 *
 * INACTIVE
 * Product.status      = ACTIVE
 * StoreProduct.status = HIDDEN
 */

export const PRODUCT_CREATE_PUBLICATION_STATUSES = [
  "PUBLISHED",
  "DRAFT",
  "INACTIVE",
] as const;


export type ProductCreatePublicationStatus =
  (typeof PRODUCT_CREATE_PUBLICATION_STATUSES)[number];


/* ==========================================================================
   STATUTS PRISMA UTILISÉS PAR LE SERVICE
   ========================================================================== */

/**
 * On évite volontairement d'importer @prisma/client dans ce fichier
 * partagé avec des composants Client.
 */

export type ProductCreateProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ARCHIVED";


export type ProductCreateStoreProductStatus =
  | "ACTIVE"
  | "OUT_OF_STOCK"
  | "HIDDEN"
  | "ARCHIVED";


/* ==========================================================================
   STOCK MOVEMENT
   ========================================================================== */

/**
 * Mouvement utilisé lors de la création initiale.
 */

export const PRODUCT_CREATE_INITIAL_STOCK_MOVEMENT =
  "INITIAL" as const;


export type ProductCreateInitialStockMovement =
  typeof PRODUCT_CREATE_INITIAL_STOCK_MOVEMENT;


/* ==========================================================================
   DEVISE
   ========================================================================== */

/**
 * La devise n'est PLUS limitée au seul XAF.
 *
 * Elle doit être récupérée depuis Store.currency côté serveur.
 *
 * Exemples possibles selon le marché :
 *
 * XAF
 * XOF
 * EUR
 * USD
 *
 * Le client peut recevoir la devise pour affichage, mais ne décide jamais
 * quelle devise sera enregistrée pour contourner la configuration boutique.
 */

export type ProductCreateCurrency =
  string;


/**
 * Fallback historique uniquement.
 *
 * Le backend doit privilégier Store.currency.
 */

export const PRODUCT_CREATE_FALLBACK_CURRENCY =
  "XAF" as const;


/* ==========================================================================
   LIMITES MÉTIER PARTAGÉES
   ========================================================================== */

export const PRODUCT_CREATE_LIMITS = {
  name: {
    min:
      1,

    max:
      100,
  },

  brand: {
    max:
      120,
  },

  categoryId: {
    max:
      191,
  },

  description: {
    max:
      2_000,
  },

  ingredients: {
    max:
      2_000,
  },

  weightContent: {
    max:
      120,
  },

  usageInstructions: {
    max:
      2_000,
  },

  unit: {
    max:
      80,
  },

  currency: {
    length:
      3,
  },

  price: {
    maxIntegerDigits:
      10,

    decimalPlaces:
      2,
  },

  stockQuantity: {
    min:
      0,

    max:
      2_147_483_647,
  },

  imageUrl: {
    max:
      2_048,
  },

  imageStoragePath: {
    max:
      1_024,
  },

  imageFileId: {
    max:
      255,
  },

  imageFileName: {
    max:
      255,
  },

  imageAltText: {
    max:
      220,
  },

  images: {
    max:
      8,
  },

  submissionId: {
    min:
      16,

    max:
      128,
  },
} as const;


/* ==========================================================================
   FORM FIELD NAMES
   ========================================================================== */

export const PRODUCT_CREATE_FORM_FIELDS = {
  intent:
    "intent",

  submissionId:
    "submissionId",

  name:
    "name",

  categoryId:
    "categoryId",

  brand:
    "brand",

  description:
    "description",

  price:
    "price",

  compareAtPrice:
    "compareAtPrice",

  stockQuantity:
    "stockQuantity",

  unit:
    "unit",

  ingredients:
    "ingredients",

  weightContent:
    "weightContent",

  usageInstructions:
    "usageInstructions",

  publicationStatus:
    "publicationStatus",

  images:
    "images",
} as const;


/* ==========================================================================
   CATÉGORIE
   ========================================================================== */

export interface ProductCreateCategoryOption {
  id:
    ProductCreateCategoryId;

  name:
    string;

  slug:
    string;
}


/* ==========================================================================
   UNITÉ
   ========================================================================== */

export interface ProductCreateUnitOption {
  value:
    string;

  label:
    string;
}


/* ==========================================================================
   DONNÉES DE PAGE — BOUTIQUE
   ========================================================================== */

export interface ProductCreateStoreDisplay {
  name:
    string;

  currency:
    ProductCreateCurrency;
}


/* ==========================================================================
   DONNÉES INITIALES DE PAGE
   ========================================================================== */

export interface ProductCreatePageData {
  store:
    ProductCreateStoreDisplay;

  categories:
    readonly ProductCreateCategoryOption[];

  units:
    readonly ProductCreateUnitOption[];

  brand:
    string;
}


/* ==========================================================================
   IMAGE — SOURCE
   ========================================================================== */

/**
 * Deux sources sont désormais supportées :
 *
 * UPLOADED
 * → nouvelle image envoyée via l'API sécurisée.
 *
 * EXISTING
 * → image ProductImage déjà enregistrée en base lors d'une modification.
 */

export type ProductCreateImageSource =
  | "UPLOADED"
  | "EXISTING";


/* ==========================================================================
   IMAGE — BASE COMMUNE
   ========================================================================== */

export interface ProductCreateImageBase {
  /**
   * URL persistante utilisable pour l'affichage.
   */
  url:
    string;

  /**
   * Nom original lorsque cette information existe.
   */
  originalFileName?:
    string |
    null;

  /**
   * Type MIME lorsque cette information existe.
   */
  mimeType?:
    string |
    null;

  /**
   * Taille du fichier en octets lorsqu'elle est connue.
   */
  size?:
    number |
    null;

  /**
   * Texte alternatif.
   */
  altText?:
    string |
    null;

  /**
   * Position dans la galerie.
   */
  position:
    number;

  /**
   * Indique l'image principale.
   */
  isPrimary:
    boolean;
}


/* ==========================================================================
   IMAGE — NOUVELLE IMAGE UPLOADÉE
   ========================================================================== */

export interface ProductCreateUploadedImageInput
  extends ProductCreateImageBase {
  /**
   * Une nouvelle image n'a pas encore d'id ProductImage Prisma.
   */
  id?:
    null;

  /**
   * Identifiant temporaire retourné par l'API d'upload.
   */
  fileId:
    string;

  /**
   * Chemin réel dans le stockage objet.
   */
  storagePath:
    string;

  /**
   * Discriminant du type.
   */
  source:
    "UPLOADED";
}


/* ==========================================================================
   IMAGE — IMAGE EXISTANTE
   ========================================================================== */

export interface ProductCreateExistingImageInput
  extends ProductCreateImageBase {
  /**
   * Identifiant réel ProductImage en base.
   *
   * C'est cet identifiant qui permet au backend de retrouver et conserver
   * l'image lors d'une modification.
   */
  id:
    ProductCreateImageId;

  /**
   * Une image existante n'est pas un nouvel upload temporaire.
   */
  fileId:
    null;

  /**
   * Le chemin Storage n'est pas fourni par le formulaire d'édition.
   *
   * Le backend doit retrouver et contrôler l'image depuis PostgreSQL
   * grâce à son id et au produit autorisé.
   */
  storagePath:
    null;

  /**
   * Discriminant du type.
   */
  source:
    "EXISTING";
}


/* ==========================================================================
   IMAGE — CONTRAT GLOBAL
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * Cette définition doit exister UNE SEULE FOIS dans ce fichier.
 *
 * Elle permet à TypeScript de distinguer automatiquement :
 *
 * source === "UPLOADED"
 * → fileId: string
 * → storagePath: string
 *
 * source === "EXISTING"
 * → id: string
 * → fileId: null
 * → storagePath: null
 */

export type ProductCreateImageInput =
  | ProductCreateUploadedImageInput
  | ProductCreateExistingImageInput;


/* ==========================================================================
   IMAGE — DONNÉES ENREGISTRÉES
   ========================================================================== */

export interface ProductCreateImageResult {
  id:
    ProductCreateImageId;

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


/* ==========================================================================
   DONNÉES BRUTES DU FORMULAIRE
   ========================================================================== */

export interface ProductCreateRawInput {
  intent:
    string;

  submissionId:
    string;

  name:
    string;

  categoryId:
    string;

  brand:
    string;

  description:
    string;

  price:
    string;

  compareAtPrice:
    string;

  stockQuantity:
    string;

  unit:
    string;

  ingredients:
    string;

  weightContent:
    string;

  usageInstructions:
    string;

  publicationStatus:
    string;

  /**
   * JSON sérialisé provenant de ProduitImagesSection.
   */
  images:
    string;
}


/* ==========================================================================
   DONNÉES VALIDÉES
   ========================================================================== */

export interface ProductCreateValidatedInput {
  intent:
    ProductCreateIntent;

  submissionId:
    string;

  name:
    string;

  categoryId:
    ProductCreateCategoryId |
    null;

  brand:
    string;

  description:
    string |
    null;

  price:
    number |
    null;

  compareAtPrice:
    number |
    null;

  stockQuantity:
    number |
    null;

  unit:
    string |
    null;

  ingredients:
    string |
    null;

  weightContent:
    string |
    null;

  usageInstructions:
    string |
    null;

  publicationStatus:
    ProductCreatePublicationStatus;

  images:
    readonly ProductCreateImageInput[];
}


/* ==========================================================================
   VALEURS DU FORMULAIRE À CONSERVER APRÈS ERREUR
   ========================================================================== */

export interface ProductCreateFormValues {
  name:
    string;

  categoryId:
    string;

  brand:
    string;

  description:
    string;

  price:
    string;

  compareAtPrice:
    string;

  stockQuantity:
    string;

  unit:
    string;

  ingredients:
    string;

  weightContent:
    string;

  usageInstructions:
    string;

  publicationStatus:
    ProductCreatePublicationStatus;
}


/* ==========================================================================
   VALEURS INITIALES DU FORMULAIRE
   ========================================================================== */

export const PRODUCT_CREATE_INITIAL_FORM_VALUES:
  ProductCreateFormValues = {
  name:
    "",

  categoryId:
    "",

  brand:
    PRODUCT_CREATE_DEFAULT_BRAND,

  description:
    "",

  price:
    "",

  compareAtPrice:
    "",

  stockQuantity:
    "0",

  unit:
    "",

  ingredients:
    "",

  weightContent:
    "",

  usageInstructions:
    "",

  publicationStatus:
    "PUBLISHED",
};


/* ==========================================================================
   ERREURS PAR CHAMP
   ========================================================================== */

export interface ProductCreateFieldErrors {
  intent?:
    readonly string[];

  submissionId?:
    readonly string[];

  name?:
    readonly string[];

  categoryId?:
    readonly string[];

  brand?:
    readonly string[];

  description?:
    readonly string[];

  price?:
    readonly string[];

  compareAtPrice?:
    readonly string[];

  stockQuantity?:
    readonly string[];

  unit?:
    readonly string[];

  ingredients?:
    readonly string[];

  weightContent?:
    readonly string[];

  usageInstructions?:
    readonly string[];

  publicationStatus?:
    readonly string[];

  images?:
    readonly string[];
}


/* ==========================================================================
   ERREURS INDIVIDUELLES D'IMAGES
   ========================================================================== */

export interface ProductCreateImageFieldError {
  index:
    number;

  message:
    string;
}


/* ==========================================================================
   DONNÉES DE SUCCÈS
   ========================================================================== */

export interface ProductCreateSuccessData {
  productId:
    ProductCreateProductId;

  storeProductId:
    ProductCreateStoreProductId;

  productName:
    string;

  sku:
    string;

  qrToken:
    ProductCreateQrToken;

  detailRoute:
    string;

  qrRoute:
    string;

  publicProductRoute:
    string;

  publicationStatus:
    ProductCreatePublicationStatus;

  productStatus:
    ProductCreateProductStatus;

  storeProductStatus:
    ProductCreateStoreProductStatus;
}


/* ==========================================================================
   ACTION STATE — STATUTS
   ========================================================================== */

export type ProductCreateActionStatus =
  | "idle"
  | "validation-error"
  | "business-error"
  | "server-error"
  | "success";


/* ==========================================================================
   ACTION STATE — IDLE
   ========================================================================== */

export interface ProductCreateIdleState {
  status:
    "idle";

  message:
    null;

  fieldErrors:
    null;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;

  data:
    null;
}


/* ==========================================================================
   ACTION STATE — VALIDATION ERROR
   ========================================================================== */

export interface ProductCreateValidationErrorState {
  status:
    "validation-error";

  message:
    string;

  fieldErrors:
    ProductCreateFieldErrors;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;

  data:
    null;
}


/* ==========================================================================
   ACTION STATE — BUSINESS ERROR
   ========================================================================== */

export interface ProductCreateBusinessErrorState {
  status:
    "business-error";

  message:
    string;

  fieldErrors:
    ProductCreateFieldErrors |
    null;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;

  data:
    null;
}


/* ==========================================================================
   ACTION STATE — SERVER ERROR
   ========================================================================== */

export interface ProductCreateServerErrorState {
  status:
    "server-error";

  message:
    string;

  fieldErrors:
    null;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;

  data:
    null;
}


/* ==========================================================================
   ACTION STATE — SUCCESS
   ========================================================================== */

export interface ProductCreateSuccessState {
  status:
    "success";

  message:
    string;

  fieldErrors:
    null;

  imageErrors:
    readonly ProductCreateImageFieldError[];

  values:
    ProductCreateFormValues;

  data:
    ProductCreateSuccessData;
}


/* ==========================================================================
   ACTION STATE GLOBAL
   ========================================================================== */

export type ProductCreateActionState =
  | ProductCreateIdleState
  | ProductCreateValidationErrorState
  | ProductCreateBusinessErrorState
  | ProductCreateServerErrorState
  | ProductCreateSuccessState;


/* ==========================================================================
   ÉTAT INITIAL
   ========================================================================== */

export const PRODUCT_CREATE_INITIAL_STATE:
  ProductCreateIdleState = {
  status:
    "idle",

  message:
    null,

  fieldErrors:
    null,

  imageErrors:
    [],

  values:
    PRODUCT_CREATE_INITIAL_FORM_VALUES,

  data:
    null,
};


/* ==========================================================================
   APERÇU PRODUIT
   ========================================================================== */

export interface ProductCreatePreview {
  name:
    string;

  brand:
    string;

  description:
    string;

  price:
    string;

  compareAtPrice:
    string;

  currency:
    ProductCreateCurrency;

  primaryImageUrl:
    string |
    null;
}


/* ==========================================================================
   QR — ÉTAT AVANT CRÉATION
   ========================================================================== */

export interface ProductCreatePendingQr {
  status:
    "pending";

  message:
    string;
}


/* ==========================================================================
   QR — ÉTAT APRÈS CRÉATION / CHARGEMENT
   ========================================================================== */

export interface ProductCreateReadyQr {
  status:
    "ready";

  qrToken:
    ProductCreateQrToken;

  publicProductRoute:
    string;

  qrRoute:
    string;
}


export type ProductCreateQrState =
  | ProductCreatePendingQr
  | ProductCreateReadyQr;


/* ==========================================================================
   HELPERS — TYPE GUARDS
   ========================================================================== */

export function isProductCreateSuccessState(
  state:
    ProductCreateActionState,
): state is ProductCreateSuccessState {
  return (
    state.status ===
    "success"
  );
}


export function isProductCreateValidationErrorState(
  state:
    ProductCreateActionState,
): state is ProductCreateValidationErrorState {
  return (
    state.status ===
    "validation-error"
  );
}


export function isProductCreateBusinessErrorState(
  state:
    ProductCreateActionState,
): state is ProductCreateBusinessErrorState {
  return (
    state.status ===
    "business-error"
  );
}


export function isProductCreateServerErrorState(
  state:
    ProductCreateActionState,
): state is ProductCreateServerErrorState {
  return (
    state.status ===
    "server-error"
  );
}


export function isProductCreateErrorState(
  state:
    ProductCreateActionState,
): state is
  | ProductCreateValidationErrorState
  | ProductCreateBusinessErrorState
  | ProductCreateServerErrorState {
  return (
    state.status ===
      "validation-error" ||
    state.status ===
      "business-error" ||
    state.status ===
      "server-error"
  );
}


/* ==========================================================================
   HELPERS — FIELD ERRORS
   ========================================================================== */

export function hasProductCreateFieldErrors(
  state:
    ProductCreateActionState,
): boolean {
  if (
    !state.fieldErrors
  ) {
    return false;
  }


  return Object.values(
    state.fieldErrors,
  ).some(
    (
      errors,
    ) =>
      Array.isArray(
        errors,
      ) &&
      errors.length >
        0,
  );
}


export function getProductCreateFirstFieldError(
  errors:
    readonly string[] |
    undefined,
): string | null {
  return (
    errors?.[0] ??
    null
  );
}


/* ==========================================================================
   HELPERS — INTENTION
   ========================================================================== */

export function isProductCreateIntent(
  value:
    unknown,
): value is ProductCreateIntent {
  return (
    value ===
      "draft" ||
    value ===
      "publish"
  );
}


/* ==========================================================================
   HELPERS — PUBLICATION STATUS
   ========================================================================== */

export function isProductCreatePublicationStatus(
  value:
    unknown,
): value is ProductCreatePublicationStatus {
  return (
    value ===
      "PUBLISHED" ||
    value ===
      "DRAFT" ||
    value ===
      "INACTIVE"
  );
}


/* ==========================================================================
   HELPERS — IMAGE SOURCE
   ========================================================================== */

export function isProductCreateUploadedImage(
  image:
    ProductCreateImageInput,
): image is ProductCreateUploadedImageInput {
  return (
    image.source ===
    "UPLOADED"
  );
}


export function isProductCreateExistingImage(
  image:
    ProductCreateImageInput,
): image is ProductCreateExistingImageInput {
  return (
    image.source ===
    "EXISTING"
  );
}


/* ==========================================================================
   HELPERS — PRIMARY IMAGE
   ========================================================================== */

export function getProductCreatePrimaryImage(
  images:
    readonly ProductCreateImageInput[],
): ProductCreateImageInput | null {
  if (
    images.length ===
    0
  ) {
    return null;
  }


  return (
    images.find(
      (
        image,
      ) =>
        image.isPrimary,
    ) ??
    images[0] ??
    null
  );
}


/* ==========================================================================
   HELPERS — NORMALIZE IMAGE ORDER
   ========================================================================== */

export function normalizeProductCreateImages(
  images:
    readonly ProductCreateImageInput[],
): ProductCreateImageInput[] {
  if (
    images.length ===
    0
  ) {
    return [];
  }


  const primaryIndex =
    images.findIndex(
      (
        image,
      ) =>
        image.isPrimary,
    );


  const resolvedPrimaryIndex =
    primaryIndex >=
      0
      ? primaryIndex
      : 0;


  return images.map(
    (
      image,
      index,
    ): ProductCreateImageInput => ({
      ...image,

      position:
        index,

      isPrimary:
        index ===
        resolvedPrimaryIndex,
    }),
  );
}


/* ==========================================================================
   HELPERS — PROMOTION
   ========================================================================== */

export function hasProductCreateCompareAtPrice(
  input:
    Pick<
      ProductCreateValidatedInput,
      "compareAtPrice"
    >,
): boolean {
  return (
    input.compareAtPrice !==
    null
  );
}


/* ==========================================================================
   HELPERS — PUBLICATION
   ========================================================================== */

export function isProductCreatePublishIntent(
  input:
    Pick<
      ProductCreateValidatedInput,
      "intent"
    >,
): boolean {
  return (
    input.intent ===
    "publish"
  );
}


/* ==========================================================================
   HELPERS — DRAFT
   ========================================================================== */

export function isProductCreateDraftIntent(
  input:
    Pick<
      ProductCreateValidatedInput,
      "intent"
    >,
): boolean {
  return (
    input.intent ===
    "draft"
  );
}


/* ==========================================================================
   QR INITIAL STATE
   ========================================================================== */

export const PRODUCT_CREATE_PENDING_QR_STATE:
  ProductCreatePendingQr = {
  status:
    "pending",

  message:
    "Le QR Code sera généré après l’enregistrement du produit.",
};