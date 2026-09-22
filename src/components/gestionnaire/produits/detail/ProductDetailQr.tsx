import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  ArrowUpRight,
  Check,
  Download,
  Globe2,
  Package,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
  TriangleAlert,
} from "lucide-react";

import {
  isValidProductDetailQrToken,
  type ProductDetail,
  type ProductDetailPermissions,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — QR CODE DU PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDetailQr.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher l'état du QR du produit ;
 * - afficher le véritable QR généré par la route privée ;
 * - utiliser uniquement le qrToken stable enregistré en base ;
 * - afficher un aperçu tronqué du token ;
 * - afficher la boutique et le produit associés ;
 * - expliquer le fonctionnement du QR stable ;
 * - permettre d'ouvrir le QR ;
 * - permettre le téléchargement SVG ;
 * - permettre l'accès à la fiche publique lorsque celle-ci est disponible ;
 * - respecter les permissions déjà calculées côté serveur ;
 * - ne jamais générer ou modifier qrToken côté navigateur ;
 * - ne jamais encoder prix, stock ou données métier dans le composant.
 *
 * ARCHITECTURE :
 *
 * StoreProduct.qrToken
 *        │
 *        ▼
 * /gestionnaire/produits/[productId]/qr
 *        │
 *        ▼
 * QR SVG
 *        │
 *        ▼
 * /p/[qrToken]
 *
 * IMPORTANT :
 *
 * Le QR est stable.
 *
 * Modifier :
 *
 * - le prix ;
 * - le stock ;
 * - la description ;
 * - les images ;
 * - la catégorie ;
 *
 * ne nécessite pas de générer un nouveau QR.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDetailQrProps {
  readonly product:
    ProductDetail;

  readonly permissions:
    ProductDetailPermissions;
}


interface QrInformationItemProps {
  readonly icon:
    ReactNode;

  readonly label:
    string;

  readonly value:
    ReactNode;
}


/* ==========================================================================
   ROUTES
   ========================================================================== */

const PRODUCTS_ROUTE =
  "/gestionnaire/produits";


const PUBLIC_PRODUCT_ROOT =
  "/p";


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeText(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized ||
    null;
}


/* ==========================================================================
   PRODUCT NAME
   ========================================================================== */

function getProductName(
  product:
    ProductDetail,
): string {
  return (
    normalizeText(
      product.name,
    ) ??
    "Produit"
  );
}


/* ==========================================================================
   STORE NAME
   ========================================================================== */

function getStoreName(
  product:
    ProductDetail,
): string {
  return (
    normalizeText(
      product.store.name,
    ) ??
    "Boutique"
  );
}


/* ==========================================================================
   QR TOKEN
   ========================================================================== */

function getValidQrToken(
  product:
    ProductDetail,
): string | null {
  const token =
    normalizeText(
      product.qr.token,
    );


  if (
    !token ||
    !isValidProductDetailQrToken(
      token,
    )
  ) {
    return null;
  }


  /**
   * isReady est optionnel dans le contrat de compatibilité.
   *
   * - false => le service indique explicitement que le QR n'est pas prêt ;
   * - undefined => ancien service, le token valide suffit ;
   * - true => QR prêt.
   */
  if (
    product.qr.isReady ===
    false
  ) {
    return null;
  }


  return token;
}


/* ==========================================================================
   APERÇU TOKEN
   ========================================================================== */

/**
 * Le token complet n'a pas besoin d'être affiché visuellement.
 *
 * Il reste néanmoins encodé dans la route publique.
 */

function formatQrTokenPreview(
  token:
    string,
): string {
  const normalized =
    token.trim();


  if (
    normalized.length <=
    22
  ) {
    return normalized;
  }


  return [
    normalized.slice(
      0,
      10,
    ),

    "…",

    normalized.slice(
      -8,
    ),
  ].join(
    "",
  );
}


/* ==========================================================================
   ROUTE QR PRIVÉE
   ========================================================================== */

function getProductQrRoute(
  product:
    ProductDetail,
): string {
  const routeFromProduct =
    normalizeText(
      product.routes?.qr,
    );


  if (
    routeFromProduct &&
    routeFromProduct.startsWith(
      "/",
    ) &&
    !routeFromProduct.startsWith(
      "//",
    )
  ) {
    return routeFromProduct;
  }


  const routeFromQr =
    normalizeText(
      product.qr.qrRoute,
    );


  if (
    routeFromQr &&
    routeFromQr.startsWith(
      "/",
    ) &&
    !routeFromQr.startsWith(
      "//",
    )
  ) {
    return routeFromQr;
  }


  return `${PRODUCTS_ROUTE}/${encodeURIComponent(
    product.id,
  )}/qr`;
}


/* ==========================================================================
   ROUTE PUBLIQUE
   ========================================================================== */

function normalizePublicProductRoute(
  value:
    string | null | undefined,
): string | null {
  const route =
    normalizeText(
      value,
    );


  if (
    !route
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     ROUTE INTERNE
     ------------------------------------------------------------------------ */

  if (
    route.startsWith(
      "/",
    ) &&
    !route.startsWith(
      "//",
    )
  ) {
    return route;
  }


  /* ------------------------------------------------------------------------
     URL ABSOLUE
     ------------------------------------------------------------------------ */

  try {
    const url =
      new URL(
        route,
      );


    if (
      (
        url.protocol !==
          "https:" &&
        url.protocol !==
          "http:"
      ) ||
      url.username ||
      url.password
    ) {
      return null;
    }


    return url.toString();
  } catch {
    return null;
  }
}


/* ==========================================================================
   PUBLIC PRODUCT ROUTE
   ========================================================================== */

function getPublicProductRoute(
  product:
    ProductDetail,

  qrToken:
    string,
): string {
  const fromDedicatedField =
    normalizePublicProductRoute(
      product.qr
        .publicProductRoute,
    );


  if (
    fromDedicatedField
  ) {
    return fromDedicatedField;
  }


  const fromLegacyField =
    normalizePublicProductRoute(
      product.qr.publicUrl,
    );


  if (
    fromLegacyField
  ) {
    return fromLegacyField;
  }


  const fromProductRoutes =
    normalizePublicProductRoute(
      product.routes
        ?.publicProduct,
    );


  if (
    fromProductRoutes
  ) {
    return fromProductRoutes;
  }


  return `${PUBLIC_PRODUCT_ROOT}/${encodeURIComponent(
    qrToken,
  )}`;
}


/* ==========================================================================
   DOWNLOAD ROUTE
   ========================================================================== */

function getQrDownloadRoute(
  qrRoute:
    string,
): string {
  return qrRoute.includes(
    "?",
  )
    ? `${qrRoute}&download=1`
    : `${qrRoute}?download=1`;
}


/* ==========================================================================
   URL EXTERNE
   ========================================================================== */

function isExternalHttpUrl(
  value:
    string,
): boolean {
  return (
    value.startsWith(
      "https://",
    ) ||
    value.startsWith(
      "http://",
    )
  );
}


/* ==========================================================================
   INFORMATION QR
   ========================================================================== */

function QrInformationItem({
  icon,
  label,
  value,
}: QrInformationItemProps) {
  return (
    <div className="productDetailQrInfoItem">
      <div
        className="productDetailQrInfoIcon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="productDetailQrInfoContent">
        <span className="productDetailQrInfoLabel">
          {label}
        </span>

        <div className="productDetailQrInfoValue">
          {value}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   ÉTAT INDISPONIBLE
   ========================================================================== */

function ProductQrUnavailable({
  productName,
}: {
  readonly productName:
    string;
}) {
  return (
    <div
      className="productDetailQrUnavailable"
      role="status"
      aria-live="polite"
    >
      <div
        className="productDetailQrUnavailableIcon"
        aria-hidden="true"
      >
        <QrCode
          size={58}
          strokeWidth={1.35}
        />
      </div>

      <div className="productDetailQrUnavailableContent">
        <span className="productDetailQrUnavailableEyebrow">
          QR produit
        </span>

        <h3 className="productDetailQrUnavailableTitle">
          QR indisponible
        </h3>

        <p className="productDetailQrUnavailableText">
          Aucun identifiant QR valide n’est actuellement associé au produit{" "}
          <strong>
            {productName}
          </strong>
          .
        </p>
      </div>
    </div>
  );
}


/* ==========================================================================
   APERÇU QR
   ========================================================================== */

function ProductQrPreview({
  qrRoute,
  productName,
  qrTokenPreview,
  canViewQr,
}: {
  readonly qrRoute:
    string;

  readonly productName:
    string;

  readonly qrTokenPreview:
    string;

  readonly canViewQr:
    boolean;
}) {
  return (
    <div className="productDetailQrPreview">
      <div className="productDetailQrPreviewVisual">
        {canViewQr ? (
          <>
            {/*
             * La route retourne directement un SVG image/svg+xml.
             *
             * On utilise volontairement <img> plutôt que next/image :
             *
             * - il s'agit d'une route dynamique privée ;
             * - le SVG est déjà optimisé pour le QR ;
             * - aucune optimisation raster n'est nécessaire ;
             * - le navigateur doit charger l'image avec la session courante.
             */}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrRoute}
              alt={`QR Code du produit ${productName}`}
              width={116}
              height={116}
              loading="eager"
              decoding="async"
              style={{
                display:
                  "block",

                width:
                  "100%",

                height:
                  "100%",

                objectFit:
                  "contain",

                borderRadius:
                  "10px",

                background:
                  "#ffffff",
              }}
            />
          </>
        ) : (
          <div
            className="productDetailQrPlaceholder"
            aria-hidden="true"
          >
            <QrCode
              size={60}
              strokeWidth={1.35}
            />
          </div>
        )}


        <span className="productDetailQrPreviewBadge">
          <Check
            size={12}
            strokeWidth={2.4}
            aria-hidden="true"
          />

          <span>
            Actif
          </span>
        </span>
      </div>


      <div className="productDetailQrPreviewContent">
        <span className="productDetailQrPreviewLabel">
          Identifiant QR stable
        </span>

        <code
          className="productDetailQrToken"
          title="Identifiant QR du produit"
        >
          {qrTokenPreview}
        </code>

        <p className="productDetailQrPreviewDescription">
          Ce même QR continue de fonctionner après une modification du prix,
          du stock, des images ou des informations du produit.
        </p>
      </div>
    </div>
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function ProductDetailQr({
  product,
  permissions,
}: ProductDetailQrProps) {
  /* =========================================================================
     PRODUIT
     ========================================================================= */

  const productName =
    getProductName(
      product,
    );


  const storeName =
    getStoreName(
      product,
    );


  /* =========================================================================
     TOKEN
     ========================================================================= */

  const qrToken =
    getValidQrToken(
      product,
    );


  const qrAvailable =
    qrToken !==
    null;


  /* =========================================================================
     PERMISSIONS
     ========================================================================= */

  const canViewQr =
    qrAvailable &&
    permissions.canViewQr;


  const canPrintQr =
    qrAvailable &&
    permissions.canPrintQr;


  /* =========================================================================
     ROUTES
     ========================================================================= */

  const qrRoute =
    qrAvailable
      ? getProductQrRoute(
          product,
        )
      : null;


  const downloadRoute =
    qrRoute &&
    canPrintQr
      ? getQrDownloadRoute(
          qrRoute,
        )
      : null;


  const publicProductRoute =
    qrToken
      ? getPublicProductRoute(
          product,
          qrToken,
        )
      : null;


  /* =========================================================================
     FICHE PUBLIQUE
     ========================================================================= */

  const publicProductAvailable =
    Boolean(
      qrAvailable &&
      publicProductRoute &&
      (
        product.qr
          .isPubliclyAvailable ??
        product.publicationStatus ===
          "PUBLISHED"
      ),
    );


  /**
   * Compatibilité :
   *
   * canOpenPublicProduct est optionnel dans product-detail-types.ts.
   *
   * Ancienne architecture :
   * on s'appuie sur canViewQr.
   *
   * Nouvelle architecture :
   * on respecte canOpenPublicProduct.
   */
  const canOpenPublicProduct =
    Boolean(
      publicProductAvailable &&
      (
        permissions
          .canOpenPublicProduct ??
        permissions.canViewQr
      ),
    );


  /* =========================================================================
     TOKEN PREVIEW
     ========================================================================= */

  const qrTokenPreview =
    qrToken
      ? formatQrTokenPreview(
          qrToken,
        )
      : null;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className="productDetailQr"
      aria-labelledby="product-detail-qr-title"
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <div className="productDetailQrHeader">
        <div className="productDetailQrHeaderMain">
          <div
            className="productDetailQrHeaderIcon"
            aria-hidden="true"
          >
            <QrCode
              size={20}
              strokeWidth={1.85}
            />
          </div>

          <div className="productDetailQrHeaderContent">
            <span className="productDetailQrEyebrow">
              Identification
            </span>

            <h2
              id="product-detail-qr-title"
              className="productDetailQrTitle"
            >
              QR du produit
            </h2>

            <p className="productDetailQrSubtitle">
              Accès stable aux informations publiques du produit.
            </p>
          </div>
        </div>


        {/* =================================================================
            ÉTAT
            ================================================================= */}

        {qrAvailable ? (
          <div
            className="productDetailQrStatus productDetailQrStatusReady"
            role="status"
          >
            <span
              className="productDetailQrStatusIcon"
              aria-hidden="true"
            >
              <Check
                size={13}
                strokeWidth={2.4}
              />
            </span>

            <span>
              QR prêt
            </span>
          </div>
        ) : (
          <div
            className="productDetailQrStatus productDetailQrStatusUnavailable"
            role="status"
          >
            <TriangleAlert
              size={13}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              Indisponible
            </span>
          </div>
        )}
      </div>


      {/* ===================================================================
          CONTENU
          =================================================================== */}

      {qrAvailable &&
      qrToken &&
      qrTokenPreview &&
      qrRoute ? (
        <div className="productDetailQrContent">
          {/* =================================================================
              APERÇU DU VRAI QR
              ================================================================= */}

          <ProductQrPreview
            qrRoute={qrRoute}
            productName={productName}
            qrTokenPreview={qrTokenPreview}
            canViewQr={canViewQr}
          />


          {/* =================================================================
              INFORMATIONS
              ================================================================= */}

          <div className="productDetailQrInfoGrid">
            <QrInformationItem
              icon={
                <Package
                  size={17}
                  strokeWidth={1.9}
                />
              }
              label="Produit"
              value={
                <strong>
                  {productName}
                </strong>
              }
            />


            <QrInformationItem
              icon={
                <Store
                  size={17}
                  strokeWidth={1.9}
                />
              }
              label="Boutique"
              value={
                <strong>
                  {storeName}
                </strong>
              }
            />


            <QrInformationItem
              icon={
                <RefreshCw
                  size={17}
                  strokeWidth={1.9}
                />
              }
              label="Actualisation"
              value={
                <span>
                  Données relues à chaque scan
                </span>
              }
            />


            <QrInformationItem
              icon={
                <ShieldCheck
                  size={17}
                  strokeWidth={1.9}
                />
              }
              label="Contenu QR"
              value={
                <span>
                  URL stable uniquement
                </span>
              }
            />
          </div>


          {/* =================================================================
              EXPLICATION
              ================================================================= */}

          <div className="productDetailQrExplanation">
            <div
              className="productDetailQrExplanationIcon"
              aria-hidden="true"
            >
              <ShieldCheck
                size={17}
                strokeWidth={1.9}
              />
            </div>

            <div className="productDetailQrExplanationContent">
              <strong className="productDetailQrExplanationTitle">
                QR stable et réutilisable
              </strong>

              <p className="productDetailQrExplanationText">
                Le QR contient uniquement l’adresse publique liée à son
                identifiant stable. Le prix, le stock, la promotion et les
                autres informations restent dans la base de données et sont
                récupérés au moment de la consultation.
              </p>
            </div>
          </div>


          {/* =================================================================
              ACTIONS
              ================================================================= */}

          {canViewQr ||
          canPrintQr ||
          canOpenPublicProduct ? (
            <div className="productDetailQrActions">
              {/* =============================================================
                  OUVRIR LE QR
                  ============================================================= */}

              {canViewQr ? (
                <Link
                  href={qrRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="productDetailQrPrimaryAction"
                  aria-label={`Ouvrir le QR Code du produit ${productName}`}
                >
                  <QrCode
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <span>
                    Ouvrir le QR
                  </span>

                  <ArrowUpRight
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
              ) : null}


              {/* =============================================================
                  TÉLÉCHARGER SVG
                  ============================================================= */}

              {downloadRoute ? (
                <Link
                  href={downloadRoute}
                  prefetch={false}
                  className="productDetailQrSecondaryAction"
                  aria-label={`Télécharger le QR Code du produit ${productName} au format SVG`}
                >
                  <Download
                    size={15}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Télécharger SVG
                  </span>
                </Link>
              ) : null}


              {/* =============================================================
                  FICHE PUBLIQUE
                  ============================================================= */}

              {canOpenPublicProduct &&
              publicProductRoute ? (
                isExternalHttpUrl(
                  publicProductRoute,
                ) ? (
                  <a
                    href={publicProductRoute}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="productDetailQrSecondaryAction"
                    aria-label={`Ouvrir la fiche publique du produit ${productName}`}
                  >
                    <Globe2
                      size={15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Fiche publique
                    </span>

                    <ArrowUpRight
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </a>
                ) : (
                  <Link
                    href={publicProductRoute}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className="productDetailQrSecondaryAction"
                    aria-label={`Ouvrir la fiche publique du produit ${productName}`}
                  >
                    <Globe2
                      size={15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Fiche publique
                    </span>

                    <ArrowUpRight
                      size={14}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </Link>
                )
              ) : null}


              {/* =============================================================
                  INDICATION IMPRESSION
                  ============================================================= */}

              {canPrintQr &&
              !downloadRoute ? (
                <Link
                  href={qrRoute}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                  className="productDetailQrSecondaryAction"
                  aria-label={`Ouvrir le QR du produit ${productName} pour impression`}
                >
                  <Printer
                    size={15}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Imprimer
                  </span>
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <ProductQrUnavailable
          productName={productName}
        />
      )}
    </section>
  );
}