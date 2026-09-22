import "server-only";

import QRCode from "qrcode";

import {
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  publicRouteBuilders,
} from "@/config/routes";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PRODUITS — QR CODE OFFICIEL
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/qr/product-qr.ts
 *
 * RESPONSABILITÉS :
 *
 * - récupérer le qrToken stable déjà enregistré dans StoreProduct ;
 * - vérifier l'appartenance du produit à la boutique connectée ;
 * - construire la route publique /p/[qrToken] ;
 * - construire l'URL publique absolue ;
 * - générer un vrai QR Code SVG ;
 * - générer un vrai QR Code PNG haute résolution ;
 * - fournir des noms de fichiers propres pour téléchargement ;
 * - déterminer si la destination est actuellement publique.
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - modifier le produit ;
 * - modifier le stock ;
 * - modifier le prix ;
 * - recréer qrToken ;
 * - encoder managerId dans le QR ;
 * - encoder storeId dans le QR ;
 * - encoder le prix dans le QR ;
 * - encoder le stock dans le QR ;
 * - encoder un token d'authentification ;
 * - utiliser localhost en production.
 *
 * ============================================================================
 *
 * ARCHITECTURE QR :
 *
 * StoreProduct
 *     │
 *     └── qrToken
 *            │
 *            ↓
 *      /p/[qrToken]
 *            │
 *            ↓
 *   URL publique absolue
 *            │
 *            ↓
 *       QR SVG / PNG
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le qrToken appartient à StoreProduct.
 *
 * Il reste donc stable lorsque :
 *
 * - le nom change ;
 * - le prix change ;
 * - le stock change ;
 * - les images changent ;
 * - la description change.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONFIGURATION QR
   ========================================================================== */

export const PRODUCT_QR_CONFIG = {
  /**
   * Niveau équilibré et robuste pour un QR sans gros logo central.
   */
  errorCorrectionLevel:
    "M",

  /**
   * Zone calme autour du QR.
   *
   * 4 modules correspond à une marge sûre pour impression/scanner.
   */
  margin:
    4,

  /**
   * Taille SVG utilisée principalement pour l'affichage.
   *
   * Le SVG reste vectoriel.
   */
  svgWidth:
    512,

  /**
   * PNG haute définition pour impression.
   */
  pngWidth:
    1_024,

  /**
   * Couleurs volontairement simples.
   *
   * Noir sur blanc = meilleur contraste pour l'impression et le scan.
   */
  darkColor:
    "#000000",

  lightColor:
    "#FFFFFF",
} as const;


/* ==========================================================================
   LIMITES
   ========================================================================== */

const PRODUCT_QR_TOKEN_MIN_LENGTH =
  20;


const PRODUCT_QR_TOKEN_MAX_LENGTH =
  128;


const PRODUCT_QR_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]+$/;


const PRODUCT_QR_MIN_WIDTH =
  128;


const PRODUCT_QR_MAX_WIDTH =
  2_048;


const PRODUCT_QR_MIN_MARGIN =
  2;


const PRODUCT_QR_MAX_MARGIN =
  10;


/* ==========================================================================
   TYPES
   ========================================================================== */

export type ProductQrErrorCorrectionLevel =
  | "L"
  | "M"
  | "Q"
  | "H";


export interface ProductQrRenderOptions {
  width?:
    number;

  margin?:
    number;

  errorCorrectionLevel?:
    ProductQrErrorCorrectionLevel;
}


export interface ProductQrRecord {
  /**
   * Product.id
   */
  productId:
    string;

  /**
   * StoreProduct.id
   */
  storeProductId:
    string;

  productName:
    string;

  sku:
    string;

  /**
   * Token public stable enregistré en base.
   */
  qrToken:
    string;

  /**
   * Route relative :
   *
   * /p/[qrToken]
   */
  publicPath:
    string;

  /**
   * URL absolue encodée dans le QR.
   *
   * Exemple :
   *
   * https://cosmeticsempire.com/p/abc123
   */
  publicUrl:
    string;

  /**
   * Indique seulement si la fiche est actuellement accessible publiquement.
   *
   * Le QR peut exister même pour un brouillon.
   */
  isPubliclyAvailable:
    boolean;

  productStatus:
    ProductStatus;

  storeProductStatus:
    StoreProductStatus;
}


export interface ProductQrSvgResult
  extends ProductQrRecord {
  format:
    "svg";

  mimeType:
    "image/svg+xml";

  fileName:
    string;

  svg:
    string;
}


export interface ProductQrPngResult
  extends ProductQrRecord {
  format:
    "png";

  mimeType:
    "image/png";

  fileName:
    string;

  buffer:
    Buffer;
}


/* ==========================================================================
   ERREURS
   ========================================================================== */

export type ProductQrErrorCode =
  | "INVALID_PRODUCT_ID"
  | "INVALID_QR_TOKEN"
  | "PRODUCT_NOT_FOUND"
  | "QR_NOT_AVAILABLE"
  | "PUBLIC_ORIGIN_NOT_CONFIGURED"
  | "PUBLIC_ORIGIN_INVALID"
  | "QR_GENERATION_FAILED";


export class ProductQrError extends Error {
  constructor(
    public readonly code:
      ProductQrErrorCode,

    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      "ProductQrError";
  }
}


/* ==========================================================================
   TYPE GUARD ERREUR
   ========================================================================== */

export function isProductQrError(
  error:
    unknown,
): error is ProductQrError {
  return (
    error instanceof
    ProductQrError
  );
}


/* ==========================================================================
   NORMALISATION — CHAÎNE
   ========================================================================== */

function normalizeString(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/* ==========================================================================
   PRODUCT ID
   ========================================================================== */

function normalizeProductId(
  productId:
    unknown,
): string {
  const normalized =
    normalizeString(
      productId,
    );


  if (
    !normalized
  ) {
    throw new ProductQrError(
      "INVALID_PRODUCT_ID",
      "L’identifiant du produit est invalide.",
    );
  }


  if (
    normalized.length >
    191
  ) {
    throw new ProductQrError(
      "INVALID_PRODUCT_ID",
      "L’identifiant du produit est invalide.",
    );
  }


  return normalized;
}


/* ==========================================================================
   QR TOKEN
   ========================================================================== */

/**
 * Vérifie uniquement la forme technique du qrToken.
 *
 * Cette fonction ne vérifie pas encore son existence dans PostgreSQL.
 */

export function isValidProductQrToken(
  value:
    unknown,
): value is string {
  const normalized =
    normalizeString(
      value,
    );


  return (
    normalized.length >=
      PRODUCT_QR_TOKEN_MIN_LENGTH &&
    normalized.length <=
      PRODUCT_QR_TOKEN_MAX_LENGTH &&
    PRODUCT_QR_TOKEN_PATTERN.test(
      normalized,
    )
  );
}


/* ==========================================================================
   NORMALISATION QR TOKEN
   ========================================================================== */

export function normalizeProductQrToken(
  qrToken:
    unknown,
): string {
  const normalized =
    normalizeString(
      qrToken,
    );


  if (
    !isValidProductQrToken(
      normalized,
    )
  ) {
    throw new ProductQrError(
      "INVALID_QR_TOKEN",
      "Le QR Code de ce produit est invalide.",
    );
  }


  return normalized;
}


/* ==========================================================================
   PUBLIC ORIGIN
   ========================================================================== */

/**
 * Variable recommandée :
 *
 * PRODUCT_PUBLIC_ORIGIN=https://votre-domaine.com
 *
 * Le service accepte aussi les variables de domaine générales déjà
 * fréquemment utilisées dans une application Next.js.
 *
 * IMPORTANT :
 *
 * En production, aucun fallback localhost ou Vercel Preview automatique
 * n'est utilisé.
 *
 * Un QR destiné à être imprimé physiquement ne doit jamais devenir dépendant
 * d'une URL temporaire.
 */

function getConfiguredPublicOrigin():
  string {
  const candidates =
    [
      process.env
        .PRODUCT_PUBLIC_ORIGIN,

      process.env
        .NEXT_PUBLIC_APP_URL,

      process.env
        .NEXT_PUBLIC_SITE_URL,

      process.env
        .APP_URL,

      process.env
        .SITE_URL,
    ];


  for (
    const candidate
    of candidates
  ) {
    const normalized =
      normalizeString(
        candidate,
      );


    if (
      normalized
    ) {
      return normalized;
    }
  }


  /*
   * Développement local uniquement.
   */

  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    return "http://localhost:3000";
  }


  throw new ProductQrError(
    "PUBLIC_ORIGIN_NOT_CONFIGURED",
    "Le domaine public des produits n’est pas configuré.",
  );
}


/* ==========================================================================
   NORMALISATION PUBLIC ORIGIN
   ========================================================================== */

function normalizePublicOrigin(
  value:
    string,
): string {
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
      throw new Error(
        "INVALID_PROTOCOL",
      );
    }


    if (
      url.username ||
      url.password
    ) {
      throw new Error(
        "CREDENTIALS_NOT_ALLOWED",
      );
    }


    /*
     * Un origin ne doit pas contenir une route spécifique.
     */

    if (
      url.pathname !==
        "/" ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        "INVALID_ORIGIN_PATH",
      );
    }


    /*
     * En production :
     *
     * - HTTPS obligatoire ;
     * - localhost interdit ;
     * - 127.0.0.1 interdit.
     */

    if (
      process.env.NODE_ENV ===
      "production"
    ) {
      if (
        url.protocol !==
        "https:"
      ) {
        throw new Error(
          "HTTPS_REQUIRED",
        );
      }


      const hostname =
        url.hostname
          .toLowerCase();


      if (
        hostname ===
          "localhost" ||
        hostname ===
          "127.0.0.1" ||
        hostname ===
          "::1"
      ) {
        throw new Error(
          "LOCALHOST_NOT_ALLOWED",
        );
      }
    }


    return url.origin;
  } catch (
    error
  ) {
    if (
      error instanceof
      ProductQrError
    ) {
      throw error;
    }


    throw new ProductQrError(
      "PUBLIC_ORIGIN_INVALID",
      "Le domaine public configuré pour les QR Codes est invalide.",
    );
  }
}


/* ==========================================================================
   GET PUBLIC ORIGIN
   ========================================================================== */

export function getProductPublicOrigin():
  string {
  return normalizePublicOrigin(
    getConfiguredPublicOrigin(),
  );
}


/* ==========================================================================
   PUBLIC PATH
   ========================================================================== */

/**
 * Retourne uniquement :
 *
 * /p/[qrToken]
 *
 * Aucun domaine n'est ajouté ici.
 */

export function getProductQrPublicPath(
  qrToken:
    string,
): string {
  const normalizedToken =
    normalizeProductQrToken(
      qrToken,
    );


  return publicRouteBuilders
    .productByQr(
      normalizedToken,
    );
}


/* ==========================================================================
   PUBLIC URL
   ========================================================================== */

/**
 * C'est cette URL qui est réellement encodée dans le QR.
 *
 * Le QR ne contient donc aucune donnée métier sensible.
 */

export function getProductQrPublicUrl(
  qrToken:
    string,
): string {
  const publicOrigin =
    getProductPublicOrigin();


  const publicPath =
    getProductQrPublicPath(
      qrToken,
    );


  return new URL(
    publicPath,
    `${publicOrigin}/`,
  ).toString();
}


/* ==========================================================================
   PUBLICATION STATE
   ========================================================================== */

function isProductPubliclyAvailable(
  params:
    Readonly<{
      productStatus:
        ProductStatus;

      storeProductStatus:
        StoreProductStatus;

      storeStatus:
        StoreStatus;
    }>,
): boolean {
  if (
    params.storeStatus !==
    StoreStatus.ACTIVE
  ) {
    return false;
  }


  if (
    params.productStatus !==
    ProductStatus.ACTIVE
  ) {
    return false;
  }


  /*
   * Un produit en rupture de stock peut rester visible publiquement.
   *
   * Il sera simplement non achetable selon les règles de la fiche publique.
   */

  return (
    params.storeProductStatus ===
      StoreProductStatus.ACTIVE ||
    params.storeProductStatus ===
      StoreProductStatus.OUT_OF_STOCK
  );
}


/* ==========================================================================
   FILENAME
   ========================================================================== */

function createSafeFileBaseName(
  productName:
    string,

  sku:
    string,
): string {
  const normalizedName =
    productName
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
        70,
      );


  const normalizedSku =
    sku
      .trim()
      .replace(
        /[^A-Za-z0-9_-]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        40,
      );


  const namePart =
    normalizedName ||
    "produit";


  const skuPart =
    normalizedSku ||
    "le";


  return `${namePart}-${skuPart}-qr`;
}


/* ==========================================================================
   RENDER OPTIONS
   ========================================================================== */

function normalizeQrWidth(
  width:
    number |
    undefined,

  fallback:
    number,
): number {
  if (
    typeof width !==
      "number" ||
    !Number.isFinite(
      width,
    )
  ) {
    return fallback;
  }


  return Math.min(
    PRODUCT_QR_MAX_WIDTH,
    Math.max(
      PRODUCT_QR_MIN_WIDTH,
      Math.trunc(
        width,
      ),
    ),
  );
}


/* ==========================================================================
   MARGIN
   ========================================================================== */

function normalizeQrMargin(
  margin:
    number |
    undefined,
): number {
  if (
    typeof margin !==
      "number" ||
    !Number.isFinite(
      margin,
    )
  ) {
    return PRODUCT_QR_CONFIG
      .margin;
  }


  return Math.min(
    PRODUCT_QR_MAX_MARGIN,
    Math.max(
      PRODUCT_QR_MIN_MARGIN,
      Math.trunc(
        margin,
      ),
    ),
  );
}


/* ==========================================================================
   ERROR CORRECTION
   ========================================================================== */

function normalizeErrorCorrectionLevel(
  value:
    ProductQrErrorCorrectionLevel |
    undefined,
): ProductQrErrorCorrectionLevel {
  switch (
    value
  ) {
    case "L":
    case "M":
    case "Q":
    case "H":
      return value;

    default:
      return PRODUCT_QR_CONFIG
        .errorCorrectionLevel;
  }
}


/* ==========================================================================
   QR RECORD — LECTURE DB
   ========================================================================== */

/**
 * Lecture interne par :
 *
 * storeId + productId
 *
 * La contrainte :
 *
 * @@unique([storeId, productId])
 *
 * de StoreProduct permet une lecture exacte.
 */

async function queryProductQrRecord(
  params:
    Readonly<{
      storeId:
        string;

      productId:
        string;
    }>,
): Promise<ProductQrRecord | null> {
  const storeId =
    normalizeString(
      params.storeId,
    );


  const productId =
    normalizeProductId(
      params.productId,
    );


  if (
    !storeId
  ) {
    return null;
  }


  const storeProduct =
    await db.storeProduct.findUnique({
      where: {
        storeId_productId: {
          storeId,

          productId,
        },
      },

      select: {
        id:
          true,

        qrToken:
          true,

        status:
          true,

        store: {
          select: {
            status:
              true,
          },
        },

        product: {
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
        },
      },
    });


  if (
    !storeProduct
  ) {
    return null;
  }


  const qrToken =
    normalizeProductQrToken(
      storeProduct.qrToken,
    );


  const publicPath =
    getProductQrPublicPath(
      qrToken,
    );


  const publicUrl =
    getProductQrPublicUrl(
      qrToken,
    );


  return {
    productId:
      storeProduct.product.id,

    storeProductId:
      storeProduct.id,

    productName:
      storeProduct.product.name,

    sku:
      storeProduct.product.sku,

    qrToken,

    publicPath,

    publicUrl,

    isPubliclyAvailable:
      isProductPubliclyAvailable({
        productStatus:
          storeProduct.product.status,

        storeProductStatus:
          storeProduct.status,

        storeStatus:
          storeProduct.store.status,
      }),

    productStatus:
      storeProduct.product.status,

    storeProductStatus:
      storeProduct.status,
  };
}


/* ==========================================================================
   GET QR — GESTIONNAIRE
   ========================================================================== */

/**
 * Fonction principale pour :
 *
 * /gestionnaire/produits/[productId]
 *
 * et :
 *
 * /gestionnaire/produits/[productId]/qr
 *
 * SÉCURITÉ :
 *
 * Le storeId n'est jamais reçu du navigateur.
 *
 * Il provient exclusivement de la session Gestionnaire.
 */

export async function getGestionnaireProductQr(
  productId:
    string,
): Promise<ProductQrRecord> {
  const normalizedProductId =
    normalizeProductId(
      productId,
    );


  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    normalizeString(
      access.store.id,
    );


  if (
    !storeId
  ) {
    throw new ProductQrError(
      "PRODUCT_NOT_FOUND",
      "Ce produit est introuvable.",
    );
  }


  const record =
    await queryProductQrRecord({
      storeId,

      productId:
        normalizedProductId,
    });


  if (
    !record
  ) {
    /*
     * Message volontairement générique.
     *
     * On ne révèle pas qu'un produit portant cet ID pourrait appartenir
     * à une autre boutique.
     */

    throw new ProductQrError(
      "PRODUCT_NOT_FOUND",
      "Ce produit est introuvable.",
    );
  }


  return record;
}


/* ==========================================================================
   GENERATE SVG — URL
   ========================================================================== */

/**
 * Génère un vrai QR vectoriel à partir d'une URL déjà validée.
 *
 * SVG est recommandé pour :
 *
 * - impression professionnelle ;
 * - packaging ;
 * - étiquettes ;
 * - présentoirs ;
 * - documents PDF.
 */

async function generateQrSvgFromPublicUrl(
  publicUrl:
    string,

  options:
    ProductQrRenderOptions =
      {},
): Promise<string> {
  const width =
    normalizeQrWidth(
      options.width,
      PRODUCT_QR_CONFIG.svgWidth,
    );


  const margin =
    normalizeQrMargin(
      options.margin,
    );


  const errorCorrectionLevel =
    normalizeErrorCorrectionLevel(
      options.errorCorrectionLevel,
    );


  try {
    return await QRCode.toString(
      publicUrl,
      {
        type:
          "svg",

        width,

        margin,

        errorCorrectionLevel,

        color: {
          dark:
            PRODUCT_QR_CONFIG
              .darkColor,

          light:
            PRODUCT_QR_CONFIG
              .lightColor,
        },
      },
    );
  } catch {
    throw new ProductQrError(
      "QR_GENERATION_FAILED",
      "Impossible de générer le QR Code du produit.",
    );
  }
}


/* ==========================================================================
   GENERATE PNG — URL
   ========================================================================== */

/**
 * PNG haute résolution.
 *
 * Utile lorsque l'utilisateur télécharge un format directement utilisable
 * dans un outil classique de mise en page ou d'impression.
 */

async function generateQrPngFromPublicUrl(
  publicUrl:
    string,

  options:
    ProductQrRenderOptions =
      {},
): Promise<Buffer> {
  const width =
    normalizeQrWidth(
      options.width,
      PRODUCT_QR_CONFIG.pngWidth,
    );


  const margin =
    normalizeQrMargin(
      options.margin,
    );


  const errorCorrectionLevel =
    normalizeErrorCorrectionLevel(
      options.errorCorrectionLevel,
    );


  try {
    return await QRCode.toBuffer(
      publicUrl,
      {
        type:
          "png",

        width,

        margin,

        errorCorrectionLevel,

        color: {
          dark:
            PRODUCT_QR_CONFIG
              .darkColor,

          light:
            PRODUCT_QR_CONFIG
              .lightColor,
        },
      },
    );
  } catch {
    throw new ProductQrError(
      "QR_GENERATION_FAILED",
      "Impossible de générer le QR Code du produit.",
    );
  }
}


/* ==========================================================================
   GENERATE SVG — TOKEN
   ========================================================================== */

/**
 * Génération simple lorsqu'on possède déjà un qrToken validé.
 *
 * Cette fonction ne consulte pas PostgreSQL.
 *
 * Elle est utile pour les services qui ont déjà récupéré le StoreProduct
 * de manière sûre.
 */

export async function generateProductQrSvgFromToken(
  qrToken:
    string,

  options:
    ProductQrRenderOptions =
      {},
): Promise<string> {
  const publicUrl =
    getProductQrPublicUrl(
      qrToken,
    );


  return generateQrSvgFromPublicUrl(
    publicUrl,
    options,
  );
}


/* ==========================================================================
   GENERATE PNG — TOKEN
   ========================================================================== */

export async function generateProductQrPngFromToken(
  qrToken:
    string,

  options:
    ProductQrRenderOptions =
      {},
): Promise<Buffer> {
  const publicUrl =
    getProductQrPublicUrl(
      qrToken,
    );


  return generateQrPngFromPublicUrl(
    publicUrl,
    options,
  );
}


/* ==========================================================================
   SVG OFFICIEL — GESTIONNAIRE
   ========================================================================== */

/**
 * Fonction recommandée pour la page privée et la route de téléchargement SVG.
 *
 * Elle effectue :
 *
 * session
 * ↓
 * boutique
 * ↓
 * StoreProduct
 * ↓
 * qrToken stocké
 * ↓
 * URL publique
 * ↓
 * SVG
 */

export async function generateGestionnaireProductQrSvg(
  productId:
    string,

  options:
    ProductQrRenderOptions =
      {},
): Promise<ProductQrSvgResult> {
  const qr =
    await getGestionnaireProductQr(
      productId,
    );


  const svg =
    await generateQrSvgFromPublicUrl(
      qr.publicUrl,
      options,
    );


  const fileBaseName =
    createSafeFileBaseName(
      qr.productName,
      qr.sku,
    );


  return {
    ...qr,

    format:
      "svg",

    mimeType:
      "image/svg+xml",

    fileName:
      `${fileBaseName}.svg`,

    svg,
  };
}


/* ==========================================================================
   PNG OFFICIEL — GESTIONNAIRE
   ========================================================================== */

/**
 * Fonction recommandée pour la route de téléchargement PNG.
 */

export async function generateGestionnaireProductQrPng(
  productId:
    string,

  options:
    ProductQrRenderOptions =
      {},
): Promise<ProductQrPngResult> {
  const qr =
    await getGestionnaireProductQr(
      productId,
    );


  const buffer =
    await generateQrPngFromPublicUrl(
      qr.publicUrl,
      options,
    );


  const fileBaseName =
    createSafeFileBaseName(
      qr.productName,
      qr.sku,
    );


  return {
    ...qr,

    format:
      "png",

    mimeType:
      "image/png",

    fileName:
      `${fileBaseName}.png`,

    buffer,
  };
}