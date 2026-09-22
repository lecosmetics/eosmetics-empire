/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — TYPES DU DÉTAIL PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/detail/product-detail-types.ts
 *
 * OBJECTIFS :
 *
 * - fournir un contrat stable aux composants de présentation ;
 * - ne jamais importer Prisma dans les composants UI ;
 * - rester utilisable côté serveur et côté client ;
 * - rester compatible avec product-detail.ts ;
 * - rester compatible avec ProductDetailActions ;
 * - rester compatible avec ProductDeleteDialog ;
 * - rester compatible avec la suppression définitive serveur ;
 * - conserver temporairement certaines valeurs historiques afin d'éviter
 *   toute cassure pendant la migration des composants ;
 * - centraliser les types liés au QR, prix, stock et suppression.
 *
 *
 * SUPPRESSION DÉFINITIVE :
 *
 * Le contrat de suppression est désormais compatible avec une suppression
 * physique d'un produit STORE appartenant à la boutique connectée.
 *
 * La décision de supprimer reste exclusivement côté serveur.
 *
 * Un historique de commandes ou de stock ne doit pas être interprété ici
 * comme une interdiction automatique de suppression.
 *
 * La Server Action est responsable :
 *
 * - de préserver les commandes historiques ;
 * - de détacher les anciennes OrderItem du StoreProduct ;
 * - de supprimer les StockMovement concernés ;
 * - de supprimer StoreProduct ;
 * - de supprimer ProductImage ;
 * - de supprimer Product ;
 * - de protéger les produits CATALOG ;
 * - de protéger les produits appartenant à une autre boutique ;
 * - de protéger les Products partagés.
 *
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - ne contient aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne contient aucun secret ;
 * - ne contient aucune Server Action ;
 * - ne dépend pas de React ;
 * - ne dépend pas de Next.js ;
 * - peut être importé par un Client Component.
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS
   ========================================================================== */

export type ProductDetailProductId =
  string;


export type ProductDetailStoreProductId =
  string;


export type ProductDetailStoreId =
  string;


export type ProductDetailManagerId =
  string;


export type ProductDetailCategoryId =
  string;


export type ProductDetailImageId =
  string;


export type ProductDetailQrToken =
  string;


/* ==========================================================================
   LIMITES
   ========================================================================== */

export const PRODUCT_DETAIL_ID_MAX_LENGTH =
  191 as const;


export const PRODUCT_DETAIL_QR_TOKEN_MIN_LENGTH =
  20 as const;


export const PRODUCT_DETAIL_QR_TOKEN_MAX_LENGTH =
  128 as const;


/* ==========================================================================
   ORIGINE PRODUIT
   ========================================================================== */

export type ProductDetailOrigin =
  | "CATALOG"
  | "STORE";


/* ==========================================================================
   STATUT DU PRODUIT
   ========================================================================== */

/**
 * Statuts actuels du modèle Product.
 *
 * DRAFT
 * ACTIVE
 * ARCHIVED
 */

export type ProductDetailCurrentProductStatus =
  | "DRAFT"
  | "ACTIVE"
  | "ARCHIVED";


/**
 * INACTIVE reste temporairement accepté pour les anciens composants.
 *
 * Il pourra être retiré lorsque tous les composants utiliseront uniquement :
 *
 * DRAFT / ACTIVE / ARCHIVED
 */

export type ProductDetailLegacyProductStatus =
  "INACTIVE";


export type ProductDetailProductStatus =
  | ProductDetailCurrentProductStatus
  | ProductDetailLegacyProductStatus;


/* ==========================================================================
   STATUT STORE PRODUCT
   ========================================================================== */

/**
 * Statuts actuels de StoreProduct.
 */

export type ProductDetailCurrentStoreProductStatus =
  | "ACTIVE"
  | "OUT_OF_STOCK"
  | "HIDDEN"
  | "ARCHIVED";


/**
 * Ancienne valeur conservée temporairement pour compatibilité.
 */

export type ProductDetailLegacyStoreProductStatus =
  "INACTIVE";


export type ProductDetailStoreProductStatus =
  | ProductDetailCurrentStoreProductStatus
  | ProductDetailLegacyStoreProductStatus;


/* ==========================================================================
   STATUT DE PUBLICATION
   ========================================================================== */

export type ProductDetailPublicationStatus =
  | "PUBLISHED"
  | "DRAFT"
  | "INACTIVE"
  | "ARCHIVED";


/* ==========================================================================
   DISPONIBILITÉ
   ========================================================================== */

export type ProductDetailAvailabilityStatus =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "HIDDEN"
  | "ARCHIVED";


/* ==========================================================================
   DEVISE
   ========================================================================== */

export type ProductDetailCurrency =
  string;


/* ==========================================================================
   CATÉGORIE
   ========================================================================== */

export interface ProductDetailCategory {
  readonly id:
    ProductDetailCategoryId;

  readonly name:
    string;

  readonly slug:
    string;
}


/* ==========================================================================
   IMAGE
   ========================================================================== */

export interface ProductDetailImage {
  readonly id:
    ProductDetailImageId;

  readonly url:
    string;

  readonly altText:
    string | null;

  readonly position:
    number;

  readonly isPrimary:
    boolean;
}


/* ==========================================================================
   BOUTIQUE
   ========================================================================== */

/**
 * Informations strictement nécessaires à la fiche produit.
 *
 * Aucun e-mail privé, mot de passe, token de session ou autre donnée
 * sensible du Gestionnaire ne doit être ajouté ici.
 */

export interface ProductDetailStore {
  readonly id:
    ProductDetailStoreId;

  readonly name:
    string;

  readonly slug?:
    string | null;

  readonly city:
    string | null;

  readonly country:
    string | null;
}


/* ==========================================================================
   PRIX
   ========================================================================== */

export interface ProductDetailPricing {
  /**
   * Prix réellement appliqué.
   */
  readonly price:
    number;


  /**
   * Prix de référence avant promotion.
   *
   * null lorsqu'aucune promotion n'est réellement active.
   */
  readonly compareAtPrice:
    number | null;


  readonly currency:
    ProductDetailCurrency;


  /**
   * true uniquement si :
   *
   * compareAtPrice !== null
   * compareAtPrice > price
   */
  readonly hasPromotion:
    boolean;


  /**
   * compareAtPrice - price
   *
   * null sans promotion.
   */
  readonly savingsAmount:
    number | null;


  /**
   * Pourcentage entier de réduction.
   *
   * null sans promotion.
   */
  readonly discountPercentage:
    number | null;
}


/* ==========================================================================
   INVENTAIRE
   ========================================================================== */

export interface ProductDetailInventory {
  readonly stockQuantity:
    number;

  readonly lowStockThreshold:
    number;

  readonly status:
    ProductDetailStoreProductStatus;


  /**
   * Statut d'affichage calculé.
   *
   * Optionnel pour rester compatible avec les anciens services.
   */
  readonly availabilityStatus?:
    ProductDetailAvailabilityStatus;


  readonly isAvailable:
    boolean;

  readonly isLowStock:
    boolean;


  /**
   * Peut être directement fourni par le nouveau service.
   */
  readonly isOutOfStock?:
    boolean;
}


/* ==========================================================================
   INFORMATIONS COMPLÉMENTAIRES
   ========================================================================== */

export interface ProductDetailAdditionalInformation {
  readonly ingredients:
    string | null;

  readonly weightContent:
    string | null;

  readonly usageInstructions:
    string | null;

  readonly unit:
    string | null;
}


/* ==========================================================================
   QR
   ========================================================================== */

export interface ProductDetailQr {
  /**
   * Token public stable enregistré dans StoreProduct.
   *
   * Le prix, le stock et les autres informations modifiables ne doivent
   * jamais être encodés directement dans le QR.
   */
  readonly token:
    ProductDetailQrToken;


  /**
   * true lorsque le token peut réellement servir à construire un QR.
   */
  readonly isReady?:
    boolean;


  /**
   * Route publique relative :
   *
   * /p/[qrToken]
   */
  readonly publicProductRoute?:
    string;


  /**
   * Alias historique utilisé par les composants existants.
   *
   * Peut contenir :
   *
   * /p/[qrToken]
   *
   * ou une URL absolue selon la couche qui construit ProductDetail.
   */
  readonly publicUrl:
    string | null;


  /**
   * Route privée Gestionnaire donnant accès au QR.
   */
  readonly qrRoute?:
    string;


  /**
   * Indique si la fiche publique correspondant au QR peut actuellement
   * être consultée.
   */
  readonly isPubliclyAvailable?:
    boolean;
}


/* ==========================================================================
   ROUTES
   ========================================================================== */

export interface ProductDetailRoutes {
  /**
   * /gestionnaire/produits/[productId]
   */
  readonly detail:
    string;


  /**
   * /gestionnaire/produits/[productId]/modifier
   */
  readonly edit:
    string;


  /**
   * /gestionnaire/produits/[productId]/qr
   */
  readonly qr:
    string;


  /**
   * /p/[qrToken]
   */
  readonly publicProduct:
    string | null;
}


/* ==========================================================================
   PRODUIT PRINCIPAL
   ========================================================================== */

/**
 * Contrat de présentation utilisé notamment par :
 *
 * - ProductDetailHeader ;
 * - ProductDetailGallery ;
 * - ProductDetailOverview ;
 * - ProductDetailPricing ;
 * - ProductDetailQr ;
 * - ProductDetailActions.
 *
 * Les objets Prisma bruts ne doivent jamais être transmis directement
 * aux composants de présentation.
 */

export interface ProductDetail {
  readonly id:
    ProductDetailProductId;


  /**
   * Identifiant de l'association produit/boutique.
   *
   * Optionnel pour compatibilité avec l'ancienne architecture.
   */
  readonly storeProductId?:
    ProductDetailStoreProductId;


  readonly name:
    string;

  readonly slug:
    string;

  readonly sku:
    string;

  readonly description:
    string | null;

  readonly brand:
    string | null;

  readonly origin:
    ProductDetailOrigin;

  readonly status:
    ProductDetailProductStatus;


  /**
   * Statut calculé utilisé par le nouveau service.
   */
  readonly publicationStatus?:
    ProductDetailPublicationStatus;


  readonly category:
    ProductDetailCategory | null;

  readonly images:
    readonly ProductDetailImage[];

  readonly primaryImage:
    ProductDetailImage | null;

  readonly pricing:
    ProductDetailPricing;

  readonly inventory:
    ProductDetailInventory;

  readonly qr:
    ProductDetailQr;

  readonly store:
    ProductDetailStore;


  /* ------------------------------------------------------------------------
     INFORMATIONS COSMÉTIQUES
     ------------------------------------------------------------------------ */

  readonly ingredients?:
    string | null;

  readonly weightContent?:
    string | null;

  readonly usageInstructions?:
    string | null;

  readonly unit?:
    string | null;


  /**
   * Le nouveau service peut fournir également les mêmes informations
   * sous forme regroupée.
   */
  readonly additionalInformation?:
    ProductDetailAdditionalInformation;


  /**
   * Routes déjà construites côté serveur.
   *
   * Optionnelles pendant la migration des anciens composants qui fabriquent
   * encore leurs routes localement.
   */
  readonly routes?:
    ProductDetailRoutes;


  readonly createdAt:
    Date;

  readonly updatedAt:
    Date;
}


/* ==========================================================================
   PERMISSIONS
   ========================================================================== */

/**
 * Ces permissions servent uniquement à la présentation.
 *
 * Elles ne remplacent jamais les vérifications transactionnelles effectuées
 * dans product-detail-actions.ts.
 *
 *
 * IMPORTANT POUR canDelete :
 *
 * canDelete indique que l'interface peut proposer l'action de suppression
 * au Gestionnaire.
 *
 * Un historique de commandes ou de mouvements de stock ne doit plus être
 * considéré par ce contrat comme une interdiction définitive.
 *
 * Le serveur reste responsable de vérifier au moment exact de la mutation :
 *
 * - que le Product existe toujours ;
 * - qu'il est bien associé à la boutique ;
 * - que son origin est STORE ;
 * - que createdByStoreId correspond à la boutique authentifiée ;
 * - qu'il n'est pas partagé avec une autre boutique.
 */

export interface ProductDetailPermissions {
  readonly canView:
    boolean;

  readonly canEdit:
    boolean;

  readonly canDelete:
    boolean;

  readonly canViewQr:
    boolean;

  readonly canPrintQr:
    boolean;


  /**
   * Droit utilisé pour ouvrir directement la fiche publique.
   *
   * Optionnel pour conserver la compatibilité avec l'ancienne couche.
   */
  readonly canOpenPublicProduct?:
    boolean;
}


/* ==========================================================================
   CONTEXTE D'ACCÈS
   ========================================================================== */

/**
 * Utilisé uniquement comme contrat de données.
 *
 * storeId et managerId doivent toujours provenir de la session serveur.
 */

export interface ProductDetailAccessContext {
  readonly storeId:
    ProductDetailStoreId;

  readonly managerId:
    ProductDetailManagerId;

  readonly productId:
    ProductDetailProductId;
}


/* ==========================================================================
   DONNÉES DE PAGE
   ========================================================================== */

export interface ProductDetailPageData {
  readonly product:
    ProductDetail;

  readonly permissions:
    ProductDetailPermissions;
}


/* ==========================================================================
   SUPPRESSION — INPUT
   ========================================================================== */

/**
 * Le navigateur transmet uniquement productId.
 *
 * storeId, managerId, rôle et permissions ne doivent jamais être ajoutés
 * à cet input.
 */

export interface ProductDeleteInput {
  readonly productId:
    ProductDetailProductId;
}


/* ==========================================================================
   SUPPRESSION — CODES D'ERREUR
   ========================================================================== */

/**
 * Codes publics pouvant être manipulés par les composants.
 *
 *
 * PRODUCT_HAS_ORDERS :
 *
 * conservé temporairement dans le contrat pour éviter de casser un ancien
 * composant qui ferait encore référence à cette valeur.
 *
 * La nouvelle suppression définitive ne doit normalement plus retourner ce
 * code uniquement parce qu'une ancienne commande référence le StoreProduct.
 *
 * Les commandes historiques doivent être conservées et leur référence
 * StoreProduct peut être détachée côté serveur.
 */

export type ProductDeleteErrorCode =
  | "INVALID_PRODUCT_ID"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_NOT_DELETABLE"

  /**
   * Compatibilité historique.
   *
   * Ne doit plus représenter un blocage automatique dans la nouvelle
   * suppression définitive.
   */
  | "PRODUCT_HAS_ORDERS"

  | "CATALOG_PRODUCT_NOT_DELETABLE"
  | "DELETE_FAILED";


/* ==========================================================================
   SUPPRESSION — RESULT
   ========================================================================== */

/**
 * Contrat historique générique.
 *
 * Conservé pour ne pas casser les consommateurs existants.
 */

export interface ProductDeleteSuccessResult {
  readonly success:
    true;

  readonly productId:
    ProductDetailProductId;

  readonly redirectTo:
    string;
}


export interface ProductDeleteErrorResult {
  readonly success:
    false;

  readonly code:
    ProductDeleteErrorCode;

  readonly message:
    string;
}


export type ProductDeleteResult =
  | ProductDeleteSuccessResult
  | ProductDeleteErrorResult;


/* ==========================================================================
   SERVER ACTION — STATE
   ========================================================================== */

export type ProductDeleteActionStatus =
  | "idle"
  | "success"
  | "error";


/**
 * État utilisé avec :
 *
 * useActionState(
 *   deleteProductAction,
 *   INITIAL_PRODUCT_DELETE_ACTION_STATE,
 * )
 */

export interface ProductDeleteActionState {
  readonly status:
    ProductDeleteActionStatus;

  readonly message:
    string | null;

  readonly code:
    ProductDeleteErrorCode | null;

  readonly productId:
    ProductDetailProductId | null;
}


/* ==========================================================================
   SERVER ACTION — INITIAL STATE
   ========================================================================== */

export const INITIAL_PRODUCT_DELETE_ACTION_STATE:
  ProductDeleteActionState = {
    status:
      "idle",

    message:
      null,

    code:
      null,

    productId:
      null,
  };


/* ==========================================================================
   IDENTIFIANT PRODUIT
   ========================================================================== */

/**
 * Validation syntaxique légère.
 *
 * Cela ne confirme jamais :
 *
 * - que le produit existe ;
 * - qu'il appartient à la boutique ;
 * - que le Gestionnaire peut le voir ;
 * - qu'il peut être supprimé.
 *
 * Toutes ces vérifications restent côté serveur.
 */

export function isValidProductDetailId(
  value:
    unknown,
): value is ProductDetailProductId {
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
      PRODUCT_DETAIL_ID_MAX_LENGTH
  ) {
    return false;
  }


  /**
   * Compatible avec :
   *
   * - CUID ;
   * - UUID sans caractères spéciaux autres que "-" ;
   * - identifiants alphanumériques internes ;
   * - underscore.
   */

  return /^[A-Za-z0-9_-]+$/.test(
    normalized,
  );
}


/* ==========================================================================
   TOKEN QR
   ========================================================================== */

export function isValidProductDetailQrToken(
  value:
    unknown,
): value is ProductDetailQrToken {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  const normalized =
    value.trim();


  if (
    normalized.length <
      PRODUCT_DETAIL_QR_TOKEN_MIN_LENGTH ||
    normalized.length >
      PRODUCT_DETAIL_QR_TOKEN_MAX_LENGTH
  ) {
    return false;
  }


  return /^[A-Za-z0-9_-]+$/.test(
    normalized,
  );
}


/* ==========================================================================
   PRIX
   ========================================================================== */

export function isValidProductDetailPrice(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value >=
      0
  );
}


/* ==========================================================================
   STOCK
   ========================================================================== */

export function normalizeProductDetailStockQuantity(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


export function normalizeProductDetailLowStockThreshold(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


/* ==========================================================================
   IMAGE PRINCIPALE
   ========================================================================== */

/**
 * Priorité :
 *
 * 1. image marquée isPrimary ;
 * 2. position la plus basse ;
 * 3. null.
 *
 * La fonction ne modifie jamais le tableau reçu.
 */

export function getProductDetailPrimaryImage(
  images:
    readonly ProductDetailImage[],
): ProductDetailImage | null {
  if (
    images.length ===
    0
  ) {
    return null;
  }


  const explicitPrimary =
    images.find(
      (
        image,
      ) =>
        image.isPrimary,
    );


  if (
    explicitPrimary
  ) {
    return explicitPrimary;
  }


  const orderedImages =
    [
      ...images,
    ].sort(
      (
        firstImage,
        secondImage,
      ) =>
        firstImage.position -
        secondImage.position,
    );


  return (
    orderedImages[0] ??
    null
  );
}


/* ==========================================================================
   CONSTRUCTION DU PRIX
   ========================================================================== */

export function buildProductDetailPricing(
  params:
    Readonly<{
      price:
        number;

      compareAtPrice:
        number | null;

      currency:
        ProductDetailCurrency;
    }>,
): ProductDetailPricing {
  const price =
    isValidProductDetailPrice(
      params.price,
    )
      ? params.price
      : 0;


  const normalizedCompareAtPrice =
    isValidProductDetailPrice(
      params.compareAtPrice,
    )
      ? params.compareAtPrice
      : null;


  const currency =
    params.currency
      .trim()
      .toUpperCase() ||
    "XAF";


  const hasPromotion =
    normalizedCompareAtPrice !==
      null &&
    normalizedCompareAtPrice >
      price;


  if (
    !hasPromotion
  ) {
    return {
      price,

      compareAtPrice:
        null,

      currency,

      hasPromotion:
        false,

      savingsAmount:
        null,

      discountPercentage:
        null,
    };
  }


  const savingsAmount =
    normalizedCompareAtPrice -
    price;


  const rawPercentage =
    normalizedCompareAtPrice >
      0
      ? (
          savingsAmount /
          normalizedCompareAtPrice
        ) *
        100
      : 0;


  const discountPercentage =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          rawPercentage,
        ),
      ),
    );


  return {
    price,

    compareAtPrice:
      normalizedCompareAtPrice,

    currency,

    hasPromotion:
      true,

    savingsAmount,

    discountPercentage,
  };
}


/* ==========================================================================
   DISPONIBILITÉ
   ========================================================================== */

export function getProductDetailAvailabilityStatus(
  params:
    Readonly<{
      stockQuantity:
        number;

      lowStockThreshold:
        number;

      status:
        ProductDetailStoreProductStatus;
    }>,
): ProductDetailAvailabilityStatus {
  const stockQuantity =
    normalizeProductDetailStockQuantity(
      params.stockQuantity,
    );


  const lowStockThreshold =
    normalizeProductDetailLowStockThreshold(
      params.lowStockThreshold,
    );


  switch (
    params.status
  ) {
    case "ARCHIVED":
      return "ARCHIVED";


    case "HIDDEN":
    case "INACTIVE":
      return "HIDDEN";


    case "OUT_OF_STOCK":
      return "OUT_OF_STOCK";


    case "ACTIVE":
    default:
      if (
        stockQuantity <=
        0
      ) {
        return "OUT_OF_STOCK";
      }


      if (
        stockQuantity <=
        lowStockThreshold
      ) {
        return "LOW_STOCK";
      }


      return "IN_STOCK";
  }
}


/* ==========================================================================
   CONSTRUCTION INVENTAIRE
   ========================================================================== */

export function buildProductDetailInventory(
  params:
    Readonly<{
      stockQuantity:
        number;

      lowStockThreshold:
        number;

      status:
        ProductDetailStoreProductStatus;
    }>,
): ProductDetailInventory {
  const stockQuantity =
    normalizeProductDetailStockQuantity(
      params.stockQuantity,
    );


  const lowStockThreshold =
    normalizeProductDetailLowStockThreshold(
      params.lowStockThreshold,
    );


  const availabilityStatus =
    getProductDetailAvailabilityStatus({
      stockQuantity,

      lowStockThreshold,

      status:
        params.status,
    });


  const isAvailable =
    availabilityStatus ===
      "IN_STOCK" ||
    availabilityStatus ===
      "LOW_STOCK";


  const isLowStock =
    availabilityStatus ===
    "LOW_STOCK";


  const isOutOfStock =
    availabilityStatus ===
    "OUT_OF_STOCK";


  return {
    stockQuantity,

    lowStockThreshold,

    status:
      params.status,

    availabilityStatus,

    isAvailable,

    isLowStock,

    isOutOfStock,
  };
}


/* ==========================================================================
   PUBLICATION
   ========================================================================== */

/**
 * Calcule l'état logique de publication.
 *
 * Convention :
 *
 * Product DRAFT
 *   => DRAFT
 *
 * Product ARCHIVED
 * ou StoreProduct ARCHIVED
 *   => ARCHIVED
 *
 * Product ACTIVE + StoreProduct ACTIVE / OUT_OF_STOCK
 *   => PUBLISHED
 *
 * Product ACTIVE + StoreProduct HIDDEN / INACTIVE
 *   => INACTIVE
 */

export function getProductDetailPublicationStatus(
  params:
    Readonly<{
      productStatus:
        ProductDetailProductStatus;

      storeProductStatus:
        ProductDetailStoreProductStatus;
    }>,
): ProductDetailPublicationStatus {
  if (
    params.productStatus ===
      "ARCHIVED" ||
    params.storeProductStatus ===
      "ARCHIVED"
  ) {
    return "ARCHIVED";
  }


  if (
    params.productStatus ===
    "DRAFT"
  ) {
    return "DRAFT";
  }


  /**
   * Compatibilité avec l'ancien statut produit.
   */
  if (
    params.productStatus ===
    "INACTIVE"
  ) {
    return "INACTIVE";
  }


  if (
    params.storeProductStatus ===
      "HIDDEN" ||
    params.storeProductStatus ===
      "INACTIVE"
  ) {
    return "INACTIVE";
  }


  return "PUBLISHED";
}


/* ==========================================================================
   DISPONIBILITÉ PUBLIQUE
   ========================================================================== */

export function isProductDetailPubliclyAvailable(
  params:
    Readonly<{
      productStatus:
        ProductDetailProductStatus;

      storeProductStatus:
        ProductDetailStoreProductStatus;
    }>,
): boolean {
  if (
    params.productStatus !==
    "ACTIVE"
  ) {
    return false;
  }


  return (
    params.storeProductStatus ===
      "ACTIVE" ||
    params.storeProductStatus ===
      "OUT_OF_STOCK"
  );
}


/* ==========================================================================
   IMAGES — TRI
   ========================================================================== */

export function sortProductDetailImages(
  images:
    readonly ProductDetailImage[],
): ProductDetailImage[] {
  return [
    ...images,
  ].sort(
    (
      firstImage,
      secondImage,
    ) => {
      if (
        firstImage.isPrimary !==
        secondImage.isPrimary
      ) {
        return firstImage.isPrimary
          ? -1
          : 1;
      }


      if (
        firstImage.position !==
        secondImage.position
      ) {
        return (
          firstImage.position -
          secondImage.position
        );
      }


      return firstImage.id.localeCompare(
        secondImage.id,
      );
    },
  );
}


/* ==========================================================================
   TYPE GUARD — ORIGIN
   ========================================================================== */

export function isProductDetailOrigin(
  value:
    unknown,
): value is ProductDetailOrigin {
  return (
    value ===
      "CATALOG" ||
    value ===
      "STORE"
  );
}


/* ==========================================================================
   TYPE GUARD — PRODUCT STATUS
   ========================================================================== */

export function isProductDetailProductStatus(
  value:
    unknown,
): value is ProductDetailProductStatus {
  return (
    value ===
      "DRAFT" ||
    value ===
      "ACTIVE" ||
    value ===
      "ARCHIVED" ||
    value ===
      "INACTIVE"
  );
}


/* ==========================================================================
   TYPE GUARD — STORE PRODUCT STATUS
   ========================================================================== */

export function isProductDetailStoreProductStatus(
  value:
    unknown,
): value is ProductDetailStoreProductStatus {
  return (
    value ===
      "ACTIVE" ||
    value ===
      "OUT_OF_STOCK" ||
    value ===
      "HIDDEN" ||
    value ===
      "ARCHIVED" ||
    value ===
      "INACTIVE"
  );
}