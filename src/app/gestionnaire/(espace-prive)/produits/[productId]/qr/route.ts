import QRCode from "qrcode";

import {
  getProductDetailPageData,
  isValidProductDetailId,
} from "@/lib/gestionnaire/produits/detail/product-detail";

import {
  getProductQrPublicUrl,
  isValidProductQrToken,
} from "@/lib/gestionnaire/produits/qr/product-qr";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — QR CODE PRIVÉ D'UN PRODUIT
 * ============================================================================
 *
 * Route :
 *
 * GET /gestionnaire/produits/[productId]/qr
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/[productId]/qr/route.ts
 *
 * RÔLE :
 *
 * - vérifier productId ;
 * - vérifier la session Gestionnaire ;
 * - vérifier que le produit appartient à la boutique courante ;
 * - récupérer le qrToken stable enregistré en base ;
 * - construire l'URL publique absolue ;
 * - générer un véritable QR Code SVG ;
 * - retourner une image vectorielle noire sur fond blanc ;
 * - empêcher le cache privé indésirable ;
 * - permettre éventuellement le téléchargement avec ?download=1.
 *
 * IMPORTANT :
 *
 * Le QR n'encode JAMAIS :
 *
 * - storeId ;
 * - managerId ;
 * - SKU ;
 * - prix ;
 * - stock ;
 * - catégorie ;
 * - statut ;
 * - données personnelles.
 *
 * Il encode seulement :
 *
 * https://domaine-public/p/[qrToken]
 *
 * Le qrToken est stable.
 *
 * Modifier ensuite :
 *
 * - prix ;
 * - stock ;
 * - description ;
 * - images ;
 * - catégorie ;
 *
 * ne modifie pas le QR.
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
   CONSTANTES QR
   ========================================================================== */

const QR_ERROR_CORRECTION_LEVEL =
  "M" as const;


const QR_MARGIN =
  4;


/**
 * qrcode utilise cette largeur pour générer le SVG.
 *
 * Le SVG reste vectoriel et peut donc être agrandi sans pixellisation.
 */
const QR_WIDTH =
  512;


/* ==========================================================================
   TYPES
   ========================================================================== */

interface ProductQrRouteContext {
  params:
    Promise<{
      productId:
        string;
    }>;
}


/* ==========================================================================
   RESPONSE — HEADERS COMMUNS
   ========================================================================== */

function createBaseHeaders():
  Headers {
  const headers =
    new Headers();


  /**
   * Route privée.
   *
   * On ne veut pas qu'un proxy/CDN public conserve un QR obtenu depuis
   * l'espace Gestionnaire.
   */
  headers.set(
    "Cache-Control",
    [
      "private",
      "no-store",
      "no-cache",
      "max-age=0",
      "must-revalidate",
    ].join(", "),
  );


  headers.set(
    "Pragma",
    "no-cache",
  );


  headers.set(
    "Expires",
    "0",
  );


  headers.set(
    "X-Content-Type-Options",
    "nosniff",
  );


  headers.set(
    "Referrer-Policy",
    "no-referrer",
  );


  /**
   * Le QR privé doit être chargé uniquement depuis le même site.
   */
  headers.set(
    "Cross-Origin-Resource-Policy",
    "same-origin",
  );


  /**
   * Le SVG généré par qrcode ne contient aucun JavaScript.
   *
   * Cette CSP ajoute une protection supplémentaire au cas où le contenu
   * serait ouvert directement dans un navigateur.
   */
  headers.set(
    "Content-Security-Policy",
    [
      "default-src 'none'",
      "img-src 'self' data:",
      "style-src 'unsafe-inline'",
      "sandbox",
    ].join("; "),
  );


  return headers;
}


/* ==========================================================================
   RESPONSE — 404
   ========================================================================== */

function createNotFoundResponse():
  Response {
  const headers =
    createBaseHeaders();


  headers.set(
    "Content-Type",
    "text/plain; charset=utf-8",
  );


  return new Response(
    "QR Code introuvable.",
    {
      status:
        404,

      headers,
    },
  );
}


/* ==========================================================================
   RESPONSE — 500
   ========================================================================== */

function createInternalErrorResponse():
  Response {
  const headers =
    createBaseHeaders();


  headers.set(
    "Content-Type",
    "text/plain; charset=utf-8",
  );


  return new Response(
    "Impossible de générer le QR Code pour le moment.",
    {
      status:
        500,

      headers,
    },
  );
}


/* ==========================================================================
   PRODUCT ID
   ========================================================================== */

function normalizeProductId(
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
    value.trim();


  if (
    !isValidProductDetailId(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   DOWNLOAD FLAG
   ========================================================================== */

/**
 * Par défaut :
 *
 * GET /qr
 *
 * retourne :
 *
 * Content-Disposition: inline
 *
 * Pour télécharger :
 *
 * GET /qr?download=1
 *
 * retourne :
 *
 * Content-Disposition: attachment
 */

function shouldDownload(
  request:
    Request,
): boolean {
  try {
    const url =
      new URL(
        request.url,
      );


    return (
      url.searchParams.get(
        "download",
      ) ===
        "1"
    );
  } catch {
    return false;
  }
}


/* ==========================================================================
   SAFE FILE NAME
   ========================================================================== */

function createSafeFileNamePart(
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


  return (
    normalized ||
    "produit"
  );
}


/* ==========================================================================
   CONTENT DISPOSITION
   ========================================================================== */

function createContentDisposition(
  params:
    Readonly<{
      download:
        boolean;

      productName:
        string;
    }>,
): string {
  const mode =
    params.download
      ? "attachment"
      : "inline";


  const safeProductName =
    createSafeFileNamePart(
      params.productName,
    );


  const asciiFileName =
    `le-cosmetics-${safeProductName}-qr.svg`;


  /**
   * filename contient uniquement des caractères ASCII déjà filtrés.
   *
   * Cela évite :
   *
   * - injection de header ;
   * - guillemets non maîtrisés ;
   * - CRLF ;
   * - caractères système indésirables.
   */
  return `${mode}; filename="${asciiFileName}"`;
}


/* ==========================================================================
   QR URL
   ========================================================================== */

function assertQrPublicUrl(
  value:
    string,
): string {
  let url:
    URL;


  try {
    url =
      new URL(
        value,
      );
  } catch {
    throw new Error(
      "PRODUCT_QR_PUBLIC_URL_INVALID",
    );
  }


  if (
    url.protocol !==
      "https:" &&
    url.protocol !==
      "http:"
  ) {
    throw new Error(
      "PRODUCT_QR_PUBLIC_URL_INVALID_PROTOCOL",
    );
  }


  if (
    url.username ||
    url.password
  ) {
    throw new Error(
      "PRODUCT_QR_PUBLIC_URL_CONTAINS_CREDENTIALS",
    );
  }


  return url.toString();
}


/* ==========================================================================
   SVG GENERATION
   ========================================================================== */

async function generateQrSvg(
  publicUrl:
    string,
): Promise<string> {
  return QRCode.toString(
    publicUrl,
    {
      type:
        "svg",

      errorCorrectionLevel:
        QR_ERROR_CORRECTION_LEVEL,

      margin:
        QR_MARGIN,

      width:
        QR_WIDTH,

      color: {
        /**
         * QR classique volontairement noir / blanc.
         *
         * Plus robuste pour :
         *
         * - smartphone ;
         * - impression ;
         * - étiquette ;
         * - photocopie ;
         * - impression thermique ;
         * - luminosité variable.
         */
        dark:
          "#000000",

        light:
          "#FFFFFF",
      },
    },
  );
}


/* ==========================================================================
   SVG VALIDATION
   ========================================================================== */

/**
 * qrcode est la seule source du SVG.
 *
 * Cette vérification n'est pas une sanitation générale HTML.
 * Elle empêche simplement une réponse vide ou manifestement incorrecte.
 */

function isGeneratedSvgValid(
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


  return (
    normalized.startsWith(
      "<svg",
    ) &&
    normalized.includes(
      "</svg>",
    )
  );
}


/* ==========================================================================
   GET
   ========================================================================== */

export async function GET(
  request:
    Request,

  context:
    ProductQrRouteContext,
): Promise<Response> {
  try {
    /* =======================================================================
       1. PARAMS
       ======================================================================= */

    const {
      productId:
        rawProductId,
    } =
      await context.params;


    const productId =
      normalizeProductId(
        rawProductId,
      );


    if (
      !productId
    ) {
      return createNotFoundResponse();
    }


    /* =======================================================================
       2. ACCÈS PRODUIT
       =======================================================================
       
       getProductDetailPageData() :
       
       - vérifie la session Gestionnaire ;
       - récupère storeId depuis la session ;
       - fait le lookup storeId + productId ;
       - refuse les produits des autres boutiques ;
       - retourne null si inaccessible.
       
       La route ne reçoit volontairement AUCUN storeId.
       ======================================================================= */

    const pageData =
      await getProductDetailPageData(
        productId,
      );


    if (
      !pageData
    ) {
      return createNotFoundResponse();
    }


    const {
      product,
      permissions,
    } =
      pageData;


    /* =======================================================================
       3. PERMISSION QR
       ======================================================================= */

    if (
      !permissions.canView ||
      !permissions.canViewQr
    ) {
      return createNotFoundResponse();
    }


    /* =======================================================================
       4. TOKEN
       ======================================================================= */

    const qrToken =
      product.qr.token.trim();


    if (
      !product.qr.isReady ||
      !isValidProductQrToken(
        qrToken,
      )
    ) {
      return createNotFoundResponse();
    }


    /* =======================================================================
       5. URL PUBLIQUE ABSOLUE
       =======================================================================
       
       Le QR doit contenir une URL absolue.
       
       Exemple :
       
       https://lecosmetics.com/p/mP2X...
       
       et jamais simplement :
       
       /p/mP2X...
       ======================================================================= */

    const publicUrl =
      assertQrPublicUrl(
        getProductQrPublicUrl(
          qrToken,
        ),
      );


    /* =======================================================================
       6. GÉNÉRATION DU QR
       ======================================================================= */

    const svg =
      await generateQrSvg(
        publicUrl,
      );


    if (
      !isGeneratedSvgValid(
        svg,
      )
    ) {
      throw new Error(
        "PRODUCT_QR_INVALID_GENERATED_SVG",
      );
    }


    /* =======================================================================
       7. HEADERS
       ======================================================================= */

    const headers =
      createBaseHeaders();


    headers.set(
      "Content-Type",
      "image/svg+xml; charset=utf-8",
    );


    headers.set(
      "Content-Disposition",
      createContentDisposition({
        download:
          shouldDownload(
            request,
          ),

        productName:
          product.name,
      }),
    );


    /**
     * Évite certains comportements de transformation automatique
     * côté proxy/CDN.
     */
    headers.set(
      "Content-Encoding",
      "identity",
    );


    /* =======================================================================
       8. RESPONSE
       ======================================================================= */

    return new Response(
      svg,
      {
        status:
          200,

        headers,
      },
    );
  } catch (
    error
  ) {
    /* =======================================================================
       9. ERREUR INATTENDUE
       =======================================================================
       
       On ne renvoie jamais :
       
       - error.message ;
       - stack ;
       - Prisma error ;
       - connexion DB ;
       - secret ;
       - URL interne.
       
       Le détail technique reste uniquement côté serveur.
       ======================================================================= */

    console.error(
      "[L&E Cosmetics Empire][ProductQrRoute]",
      error instanceof Error
        ? {
            name:
              error.name,

            message:
              error.message,
          }
        : "Erreur QR inconnue",
    );


    return createInternalErrorResponse();
  }
}