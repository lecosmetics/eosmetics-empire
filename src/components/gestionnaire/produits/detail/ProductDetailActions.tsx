import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  ArrowRight,
  FilePenLine,
  Globe2,
  LockKeyhole,
  Package,
  Printer,
  QrCode,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";

import ProductDeleteDialog from "./ProductDeleteDialog";

import {
  isValidProductDetailQrToken,
  type ProductDetail,
  type ProductDetailPermissions,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — ACTIONS DU DÉTAIL PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDetailActions.tsx
 *
 * RESPONSABILITÉS :
 *
 * - retourner vers la liste des produits ;
 * - modifier le produit lorsque l'autorisation existe ;
 * - ouvrir le QR stable du produit ;
 * - télécharger / imprimer le QR ;
 * - ouvrir la fiche publique ;
 * - afficher les actions indisponibles ;
 * - afficher la zone sensible de suppression ;
 * - déléguer la suppression à ProductDeleteDialog ;
 * - respecter les permissions calculées côté serveur.
 *
 * IMPORTANT :
 *
 * Ce composant est uniquement une couche de présentation.
 *
 * Il ne décide jamais réellement :
 *
 * - si un Gestionnaire est authentifié ;
 * - si le produit appartient à la boutique ;
 * - si le produit peut être modifié ;
 * - si le produit peut être supprimé ;
 * - si un QR peut être consulté.
 *
 * Les vérifications définitives sont réalisées côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDetailActionsProps {
  readonly product:
    ProductDetail;

  readonly permissions:
    ProductDetailPermissions;
}


interface ProductActionLinkProps {
  readonly href:
    string;

  readonly icon:
    ReactNode;

  readonly title:
    string;

  readonly description:
    string;

  readonly className?:
    string;

  readonly openInNewTab?:
    boolean;

  readonly prefetch?:
    boolean;
}


interface ProductUnavailableActionProps {
  readonly icon:
    ReactNode;

  readonly title:
    string;

  readonly description:
    string;
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
   ROUTE INTERNE SÛRE
   ========================================================================== */

function isSafeInternalRoute(
  value:
    string | null | undefined,
): value is string {
  const normalized =
    normalizeText(
      value,
    );


  if (
    !normalized
  ) {
    return false;
  }


  return (
    normalized.startsWith(
      "/",
    ) &&
    !normalized.startsWith(
      "//",
    )
  );
}


/* ==========================================================================
   URL HTTP SÛRE
   ========================================================================== */

function isSafeHttpUrl(
  value:
    string | null | undefined,
): value is string {
  const normalized =
    normalizeText(
      value,
    );


  if (
    !normalized
  ) {
    return false;
  }


  try {
    const url =
      new URL(
        normalized,
      );


    return (
      (
        url.protocol ===
          "https:" ||
        url.protocol ===
          "http:"
      ) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}


/* ==========================================================================
   NOM DU PRODUIT
   ========================================================================== */

function getProductName(
  product:
    ProductDetail,
): string {
  return (
    normalizeText(
      product.name,
    ) ??
    "ce produit"
  );
}


/* ==========================================================================
   ROUTE DE BASE
   ========================================================================== */

function getProductBaseRoute(
  product:
    ProductDetail,
): string {
  const configuredRoute =
    product.routes?.detail;


  if (
    isSafeInternalRoute(
      configuredRoute,
    )
  ) {
    return configuredRoute;
  }


  return `${PRODUCTS_ROUTE}/${encodeURIComponent(
    product.id,
  )}`;
}


/* ==========================================================================
   ROUTE DE MODIFICATION
   ========================================================================== */

function getProductEditRoute(
  product:
    ProductDetail,
): string {
  const configuredRoute =
    product.routes?.edit;


  if (
    isSafeInternalRoute(
      configuredRoute,
    )
  ) {
    return configuredRoute;
  }


  return `${getProductBaseRoute(
    product,
  )}/modifier`;
}


/* ==========================================================================
   ROUTE QR
   ========================================================================== */

function getProductQrRoute(
  product:
    ProductDetail,
): string {
  const routeFromProduct =
    product.routes?.qr;


  if (
    isSafeInternalRoute(
      routeFromProduct,
    )
  ) {
    return routeFromProduct;
  }


  const routeFromQr =
    product.qr.qrRoute;


  if (
    isSafeInternalRoute(
      routeFromQr,
    )
  ) {
    return routeFromQr;
  }


  return `${getProductBaseRoute(
    product,
  )}/qr`;
}


/* ==========================================================================
   ROUTE DOWNLOAD QR
   ========================================================================== */

function getProductQrDownloadRoute(
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
   TOKEN QR
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
   * false = le service indique explicitement que le QR n'est pas prêt.
   *
   * undefined reste accepté pour la compatibilité avec les anciennes données.
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
   ROUTE PUBLIQUE
   ========================================================================== */

function getPublicProductRoute(
  product:
    ProductDetail,

  qrToken:
    string,
): string {
  const candidates:
    readonly (
      string |
      null |
      undefined
    )[] = [
      product.qr
        .publicProductRoute,

      product.qr
        .publicUrl,

      product.routes
        ?.publicProduct,
    ];


  for (
    const candidate
    of candidates
  ) {
    if (
      isSafeInternalRoute(
        candidate,
      ) ||
      isSafeHttpUrl(
        candidate,
      )
    ) {
      return candidate;
    }
  }


  return `${PUBLIC_PRODUCT_ROOT}/${encodeURIComponent(
    qrToken,
  )}`;
}


/* ==========================================================================
   ACTION DISPONIBLE
   ========================================================================== */

function ProductActionLink({
  href,
  icon,
  title,
  description,
  className,
  openInNewTab = false,
  prefetch = true,
}: ProductActionLinkProps) {
  const classes =
    [
      "productDetailActionsLink",
      className,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  const content =
    (
      <>
        <span
          className="productDetailActionsLinkIcon"
          aria-hidden="true"
        >
          {icon}
        </span>

        <span className="productDetailActionsLinkContent">
          <strong className="productDetailActionsLinkTitle">
            {title}
          </strong>

          <span className="productDetailActionsLinkDescription">
            {description}
          </span>
        </span>

        <span
          className="productDetailActionsLinkArrow"
          aria-hidden="true"
        >
          <ArrowRight
            size={16}
            strokeWidth={2}
          />
        </span>
      </>
    );


  /* ------------------------------------------------------------------------
     URL EXTERNE
     ------------------------------------------------------------------------ */

  if (
    isSafeHttpUrl(
      href,
    )
  ) {
    return (
      <a
        href={href}
        className={classes}
        target={
          openInNewTab
            ? "_blank"
            : undefined
        }
        rel={
          openInNewTab
            ? "noopener noreferrer"
            : undefined
        }
      >
        {content}
      </a>
    );
  }


  /* ------------------------------------------------------------------------
     ROUTE INTERNE
     ------------------------------------------------------------------------ */

  return (
    <Link
      href={href}
      className={classes}
      prefetch={prefetch}
      target={
        openInNewTab
          ? "_blank"
          : undefined
      }
      rel={
        openInNewTab
          ? "noopener noreferrer"
          : undefined
      }
    >
      {content}
    </Link>
  );
}


/* ==========================================================================
   ACTION INDISPONIBLE
   ========================================================================== */

function ProductUnavailableAction({
  icon,
  title,
  description,
}: ProductUnavailableActionProps) {
  return (
    <div
      className="productDetailActionsUnavailable"
      aria-disabled="true"
      role="group"
      aria-label={`${title}. ${description}`}
    >
      <span
        className="productDetailActionsUnavailableIcon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="productDetailActionsUnavailableContent">
        <strong className="productDetailActionsUnavailableTitle">
          {title}
        </strong>

        <span className="productDetailActionsUnavailableDescription">
          {description}
        </span>
      </span>

      <span
        className="productDetailActionsUnavailableLock"
        aria-hidden="true"
      >
        <LockKeyhole
          size={16}
          strokeWidth={1.9}
        />
      </span>
    </div>
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function ProductDetailActions({
  product,
  permissions,
}: ProductDetailActionsProps) {
  /* =========================================================================
     IDENTITÉ DU PRODUIT
     ========================================================================= */

  const productName =
    getProductName(
      product,
    );


  const isStoreProduct =
    product.origin ===
    "STORE";


  const isCatalogProduct =
    product.origin ===
    "CATALOG";


  /* =========================================================================
     ROUTES
     ========================================================================= */

  const editRoute =
    getProductEditRoute(
      product,
    );


  const qrRoute =
    getProductQrRoute(
      product,
    );


  /* =========================================================================
     QR
     ========================================================================= */

  const qrToken =
    getValidQrToken(
      product,
    );


  const hasQrToken =
    qrToken !==
    null;


  const canViewQr =
    Boolean(
      permissions.canViewQr &&
      hasQrToken,
    );


  const canPrintQr =
    Boolean(
      permissions.canPrintQr &&
      hasQrToken,
    );


  const qrDownloadRoute =
    canPrintQr
      ? getProductQrDownloadRoute(
          qrRoute,
        )
      : null;


  /* =========================================================================
     FICHE PUBLIQUE
     ========================================================================= */

  const publicProductRoute =
    qrToken
      ? getPublicProductRoute(
          product,
          qrToken,
        )
      : null;


  const isPubliclyAvailable =
    Boolean(
      hasQrToken &&
      publicProductRoute &&
      (
        product.qr
          .isPubliclyAvailable ??
        product.publicationStatus ===
          "PUBLISHED"
      ),
    );


  /**
   * canOpenPublicProduct est optionnel dans le contrat de compatibilité.
   *
   * Nouvelle architecture :
   *
   * permissions.canOpenPublicProduct
   *
   * Ancienne architecture :
   *
   * permissions.canViewQr
   */
  const canOpenPublicProduct =
    Boolean(
      isPubliclyAvailable &&
      (
        permissions
          .canOpenPublicProduct ??
        permissions.canViewQr
      ),
    );


  /* =========================================================================
     MODIFICATION
     ========================================================================= */

  const canEdit =
    permissions.canEdit;


  /* =========================================================================
     SUPPRESSION
     ========================================================================= */

  /**
   * Double protection de présentation :
   *
   * même si une permission incorrecte arrivait ici, un produit CATALOG ne
   * reçoit jamais le dialogue de suppression.
   *
   * product-detail-actions.ts refait néanmoins tous les contrôles côté serveur.
   */
  const canDelete =
    Boolean(
      permissions.canDelete &&
      isStoreProduct,
    );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className="productDetailActions"
      aria-labelledby="product-detail-actions-title"
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <div className="productDetailActionsHeader">
        <div
          className="productDetailActionsHeaderIcon"
          aria-hidden="true"
        >
          <Package
            size={20}
            strokeWidth={1.9}
          />
        </div>

        <div className="productDetailActionsHeaderContent">
          <span className="productDetailActionsEyebrow">
            Gestion
          </span>

          <h2
            id="product-detail-actions-title"
            className="productDetailActionsTitle"
          >
            Actions du produit
          </h2>

          <p className="productDetailActionsSubtitle">
            Accédez aux opérations autorisées pour ce produit dans votre boutique.
          </p>
        </div>
      </div>


      {/* ===================================================================
          ACTIONS
          =================================================================== */}

      <div className="productDetailActionsGrid">
        {/* =================================================================
            RETOUR AUX PRODUITS
            ================================================================= */}

        <ProductActionLink
          href={PRODUCTS_ROUTE}
          icon={
            <ArrowLeft
              size={18}
              strokeWidth={2}
            />
          }
          title="Mes produits"
          description="Retourner à la liste complète de vos produits."
          className="productDetailActionsLinkBack"
        />


        {/* =================================================================
            MODIFICATION
            ================================================================= */}

        {canEdit ? (
          <ProductActionLink
            href={editRoute}
            icon={
              <FilePenLine
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Modifier le produit"
            description="Modifier les informations, le prix, le stock et les images."
            className="productDetailActionsLinkEdit"
          />
        ) : (
          <ProductUnavailableAction
            icon={
              <FilePenLine
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Modification indisponible"
            description={
              isCatalogProduct
                ? "Ce produit provient du catalogue officiel L&E."
                : "Vous ne disposez pas de l’autorisation nécessaire."
            }
          />
        )}


        {/* =================================================================
            QR
            ================================================================= */}

        {canViewQr ? (
          <ProductActionLink
            href={qrRoute}
            icon={
              <QrCode
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Voir le QR produit"
            description="Ouvrir le QR stable associé à ce produit."
            className="productDetailActionsLinkQr"
            openInNewTab
            prefetch={false}
          />
        ) : (
          <ProductUnavailableAction
            icon={
              <QrCode
                size={18}
                strokeWidth={1.9}
              />
            }
            title="QR indisponible"
            description={
              hasQrToken
                ? "Vous n’êtes pas autorisé à consulter ce QR."
                : "Aucun QR valide n’est actuellement associé au produit."
            }
          />
        )}


        {/* =================================================================
            TÉLÉCHARGEMENT / IMPRESSION QR
            ================================================================= */}

        {canPrintQr &&
        qrDownloadRoute ? (
          <ProductActionLink
            href={qrDownloadRoute}
            icon={
              <Printer
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Télécharger le QR"
            description="Télécharger le QR au format SVG pour impression ou étiquetage."
            className="productDetailActionsLinkPrint"
            prefetch={false}
          />
        ) : (
          <ProductUnavailableAction
            icon={
              <Printer
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Impression indisponible"
            description="Un QR valide et une autorisation d’impression sont nécessaires."
          />
        )}


        {/* =================================================================
            FICHE PUBLIQUE
            ================================================================= */}

        {canOpenPublicProduct &&
        publicProductRoute ? (
          <ProductActionLink
            href={publicProductRoute}
            icon={
              <Globe2
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Fiche publique"
            description="Voir les informations publiques accessibles après le scan."
            className="productDetailActionsLinkPublic"
            openInNewTab
            prefetch={false}
          />
        ) : (
          <ProductUnavailableAction
            icon={
              <Globe2
                size={18}
                strokeWidth={1.9}
              />
            }
            title="Fiche publique indisponible"
            description={
              product.publicationStatus ===
              "DRAFT"
                ? "Le produit est encore enregistré comme brouillon."
                : product.publicationStatus ===
                    "ARCHIVED"
                  ? "Le produit est archivé."
                  : product.publicationStatus ===
                      "INACTIVE"
                    ? "Le produit est actuellement masqué du public."
                    : "La fiche publique n’est pas disponible pour le moment."
            }
          />
        )}
      </div>


      {/* ===================================================================
          SÉCURITÉ
          =================================================================== */}

      <div className="productDetailActionsSecurity">
        <div
          className="productDetailActionsSecurityIcon"
          aria-hidden="true"
        >
          <ShieldCheck
            size={18}
            strokeWidth={1.9}
          />
        </div>

        <div className="productDetailActionsSecurityContent">
          <span className="productDetailActionsSecurityEyebrow">
            Sécurité
          </span>

          <strong className="productDetailActionsSecurityTitle">
            Autorisations contrôlées côté serveur
          </strong>

          <p className="productDetailActionsSecurityText">
            Les actions sensibles sont revérifiées avec la session du
            Gestionnaire et la boutique actuellement authentifiée. Les
            identifiants de boutique ne sont jamais acceptés comme autorisation
            depuis le navigateur.
          </p>
        </div>
      </div>


      {/* ===================================================================
          ZONE SENSIBLE — SUPPRESSION AUTORISÉE
          =================================================================== */}

      {canDelete ? (
        <div className="productDetailActionsDangerZone">
          <div className="productDetailActionsDangerHeader">
            <span className="productDetailActionsDangerEyebrow">
              Zone sensible
            </span>

            <h3 className="productDetailActionsDangerTitle">
              Supprimer ce produit
            </h3>
          </div>


          <p className="productDetailActionsDangerDescription">
            Supprimer définitivement{" "}
            <strong>
              {productName}
            </strong>{" "}
            de votre boutique. Une confirmation sera demandée et le serveur
            vérifiera une nouvelle fois que l’opération est autorisée.
          </p>


          <div className="productDetailActionsDangerControl">
            <ProductDeleteDialog
              productId={product.id}
              productName={productName}
            />
          </div>
        </div>
      ) : isStoreProduct ? (
        /* =================================================================
           ZONE SENSIBLE — SUPPRESSION BLOQUÉE
           ================================================================= */

        <div className="productDetailActionsDangerZone">
          <div className="productDetailActionsDangerHeader">
            <span className="productDetailActionsDangerEyebrow">
              Zone sensible
            </span>

            <h3 className="productDetailActionsDangerTitle">
              Suppression indisponible
            </h3>
          </div>


          <p className="productDetailActionsDangerDescription">
            Ce produit ne peut pas être supprimé définitivement dans son état
            actuel. Un historique commercial, un mouvement de stock ou une
            autre relation métier peut devoir être conservé.
          </p>


          <div className="productDetailActionsDangerControl">
            <div
              className="productDetailActionsUnavailable"
              aria-disabled="true"
              role="group"
              aria-label="Suppression verrouillée"
            >
              <span
                className="productDetailActionsUnavailableIcon"
                aria-hidden="true"
              >
                <Trash2
                  size={17}
                  strokeWidth={1.9}
                />
              </span>

              <span className="productDetailActionsUnavailableContent">
                <strong className="productDetailActionsUnavailableTitle">
                  Suppression verrouillée
                </strong>

                <span className="productDetailActionsUnavailableDescription">
                  L’intégrité des données est protégée.
                </span>
              </span>

              <span
                className="productDetailActionsUnavailableLock"
                aria-hidden="true"
              >
                <LockKeyhole
                  size={16}
                  strokeWidth={1.9}
                />
              </span>
            </div>
          </div>
        </div>
      ) : null}


      {/* ===================================================================
          PRODUIT CATALOGUE
          =================================================================== */}

      {isCatalogProduct ? (
        <div className="productDetailActionsSecurity">
          <div
            className="productDetailActionsSecurityIcon"
            aria-hidden="true"
          >
            <Store
              size={18}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailActionsSecurityContent">
            <span className="productDetailActionsSecurityEyebrow">
              Catalogue L&E
            </span>

            <strong className="productDetailActionsSecurityTitle">
              Produit officiel partagé
            </strong>

            <p className="productDetailActionsSecurityText">
              Ce produit appartient au catalogue officiel L&E. Sa fiche globale
              ne peut donc pas être supprimée depuis une boutique Gestionnaire.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}