import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  Archive,
  ArrowLeft,
  BookOpen,
  Check,
  CirclePause,
  FilePenLine,
  Grid2X2,
  MapPin,
  Package,
  QrCode,
  ShieldCheck,
  Store,
} from "lucide-react";

import type {
  ProductDetail,
  ProductDetailPermissions,
  ProductDetailPublicationStatus,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — HEADER DE LA FICHE PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDetailHeader.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher le retour vers la liste des produits ;
 * - afficher le nom du produit ;
 * - afficher le SKU ;
 * - afficher le statut de publication ;
 * - afficher l'origine du produit ;
 * - afficher sa catégorie ;
 * - afficher la boutique ;
 * - afficher la localisation ;
 * - afficher les actions QR / modification selon permissions ;
 * - utiliser les routes préparées côté serveur lorsqu'elles existent ;
 * - rester indépendant de Prisma ;
 * - rester indépendant de la session ;
 * - ne réaliser aucune mutation.
 *
 * SÉCURITÉ :
 *
 * Les permissions reçues ici servent uniquement à l'affichage.
 *
 * Cacher un bouton ne constitue jamais une autorisation.
 *
 * Les routes et Server Actions doivent toujours refaire leurs contrôles
 * côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDetailHeaderProps {
  readonly product:
    ProductDetail;

  readonly permissions:
    ProductDetailPermissions;
}


interface StatusPresentation {
  readonly label:
    string;

  readonly className:
    string;

  readonly icon:
    ReactNode;
}


interface OriginPresentation {
  readonly label:
    string;

  readonly className:
    string;

  readonly icon:
    ReactNode;
}


/* ==========================================================================
   ROUTES
   ========================================================================== */

const PRODUCTS_ROUTE =
  "/gestionnaire/produits";


function getFallbackProductDetailRoute(
  productId:
    string,
): string {
  return `${PRODUCTS_ROUTE}/${encodeURIComponent(
    productId,
  )}`;
}


function getProductEditRoute(
  product:
    ProductDetail,
): string {
  const configuredRoute =
    product.routes?.edit?.trim();


  if (
    configuredRoute
  ) {
    return configuredRoute;
  }


  return `${getFallbackProductDetailRoute(
    product.id,
  )}/modifier`;
}


function getProductQrRoute(
  product:
    ProductDetail,
): string {
  const configuredRoute =
    product.routes?.qr?.trim();


  if (
    configuredRoute
  ) {
    return configuredRoute;
  }


  return `${getFallbackProductDetailRoute(
    product.id,
  )}/qr`;
}


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeDisplayText(
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
   LOCALISATION
   ========================================================================== */

function getStoreLocation(
  city:
    string | null | undefined,

  country:
    string | null | undefined,
): string | null {
  const values =
    [
      normalizeDisplayText(
        city,
      ),

      normalizeDisplayText(
        country,
      ),
    ].filter(
      (
        value,
      ): value is string =>
        Boolean(
          value,
        ),
    );


  if (
    values.length ===
    0
  ) {
    return null;
  }


  return values.join(
    ", ",
  );
}


/* ==========================================================================
   STATUT DE PUBLICATION
   ========================================================================== */

/**
 * Le nouveau service product-detail.ts fournit publicationStatus.
 *
 * C'est ce statut qu'on privilégie, car un Product ACTIVE peut par exemple
 * avoir son StoreProduct en HIDDEN et être donc INACTIVE publiquement.
 *
 * Si publicationStatus n'est pas encore disponible, on revient sur
 * product.status pour garder la compatibilité avec l'ancienne architecture.
 */

function resolvePublicationStatus(
  product:
    ProductDetail,
): ProductDetailPublicationStatus {
  if (
    product.publicationStatus
  ) {
    return product.publicationStatus;
  }


  switch (
    product.status
  ) {
    case "DRAFT":
      return "DRAFT";


    case "ARCHIVED":
      return "ARCHIVED";


    case "INACTIVE":
      return "INACTIVE";


    case "ACTIVE":
    default:
      return "PUBLISHED";
  }
}


/* ==========================================================================
   PRÉSENTATION STATUT
   ========================================================================== */

function getStatusPresentation(
  status:
    ProductDetailPublicationStatus,
): StatusPresentation {
  switch (
    status
  ) {
    case "DRAFT":
      return {
        label:
          "Brouillon",

        className:
          [
            "productDetailHeaderStatus",
            "productDetailHeaderStatusDraft",
          ].join(
            " ",
          ),

        icon:
          (
            <CirclePause
              size={14}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
      };


    case "INACTIVE":
      return {
        label:
          "Inactif",

        className:
          [
            "productDetailHeaderStatus",
            "productDetailHeaderStatusInactive",
          ].join(
            " ",
          ),

        icon:
          (
            <CirclePause
              size={14}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
      };


    case "ARCHIVED":
      return {
        label:
          "Archivé",

        className:
          [
            "productDetailHeaderStatus",
            "productDetailHeaderStatusArchived",
          ].join(
            " ",
          ),

        icon:
          (
            <Archive
              size={14}
              strokeWidth={2}
              aria-hidden="true"
            />
          ),
      };


    case "PUBLISHED":
    default:
      return {
        label:
          "Publié",

        className:
          [
            "productDetailHeaderStatus",
            "productDetailHeaderStatusPublished",
            "productDetailHeaderStatusActive",
          ].join(
            " ",
          ),

        icon:
          (
            <Check
              size={14}
              strokeWidth={2.4}
              aria-hidden="true"
            />
          ),
      };
  }
}


/* ==========================================================================
   ORIGINE
   ========================================================================== */

function getOriginPresentation(
  product:
    ProductDetail,
): OriginPresentation {
  if (
    product.origin ===
    "CATALOG"
  ) {
    return {
      label:
        "Catalogue L&E",

      className:
        [
          "productDetailHeaderOrigin",
          "productDetailHeaderOriginCatalog",
        ].join(
          " ",
        ),

      icon:
        (
          <BookOpen
            size={15}
            strokeWidth={1.9}
            aria-hidden="true"
          />
        ),
    };
  }


  return {
    label:
      "Produit boutique",

    className:
      [
        "productDetailHeaderOrigin",
        "productDetailHeaderOriginStore",
      ].join(
        " ",
      ),

    icon:
      (
        <Store
          size={15}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      ),
  };
}


/* ==========================================================================
   COMPOSANT
   ========================================================================== */

export default function ProductDetailHeader({
  product,
  permissions,
}: ProductDetailHeaderProps) {
  /* =========================================================================
     DONNÉES DE PRÉSENTATION
     ========================================================================= */

  const publicationStatus =
    resolvePublicationStatus(
      product,
    );


  const statusPresentation =
    getStatusPresentation(
      publicationStatus,
    );


  const originPresentation =
    getOriginPresentation(
      product,
    );


  const categoryName =
    normalizeDisplayText(
      product.category?.name,
    ) ??
    "Sans catégorie";


  const storeName =
    normalizeDisplayText(
      product.store.name,
    ) ??
    "Boutique";


  const storeLocation =
    getStoreLocation(
      product.store.city,
      product.store.country,
    );


  const sku =
    normalizeDisplayText(
      product.sku,
    ) ??
    "Non renseigné";


  const productName =
    normalizeDisplayText(
      product.name,
    ) ??
    "Produit";


  /* =========================================================================
     ACTIONS
     ========================================================================= */

  const canOpenQr =
    permissions.canViewQr &&
    Boolean(
      product.qr.token?.trim(),
    );


  const canEdit =
    permissions.canEdit;


  const hasActions =
    canOpenQr ||
    canEdit;


  const editRoute =
    canEdit
      ? getProductEditRoute(
          product,
        )
      : null;


  const qrRoute =
    canOpenQr
      ? getProductQrRoute(
          product,
        )
      : null;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <header
      className="productDetailHeader"
      aria-labelledby="product-detail-title"
    >
      {/* ===================================================================
          BARRE SUPÉRIEURE
          =================================================================== */}

      <div className="productDetailHeaderTop">
        <Link
          href={PRODUCTS_ROUTE}
          className="productDetailHeaderBack"
          aria-label="Retour à la liste des produits"
        >
          <ArrowLeft
            size={17}
            strokeWidth={2}
            aria-hidden="true"
          />

          <span>
            Mes produits
          </span>
        </Link>


        <div
          className="productDetailHeaderReference"
          aria-label={`SKU du produit : ${sku}`}
          title={sku}
        >
          <span className="productDetailHeaderReferenceLabel">
            SKU
          </span>

          <strong className="productDetailHeaderReferenceValue">
            {sku}
          </strong>
        </div>
      </div>


      {/* ===================================================================
          HERO
          =================================================================== */}

      <div className="productDetailHeaderHero">
        {/* =================================================================
            IDENTITÉ
            ================================================================= */}

        <div className="productDetailHeaderIdentity">
          <div
            className="productDetailHeaderIcon"
            aria-hidden="true"
          >
            <Package
              size={24}
              strokeWidth={1.8}
            />
          </div>


          <div className="productDetailHeaderContent">
            <span className="productDetailHeaderEyebrow">
              Gestion des produits
            </span>


            <h1
              id="product-detail-title"
              className="productDetailHeaderTitle"
            >
              {productName}
            </h1>


            {/* =============================================================
                BADGES
                ============================================================= */}

            <div
              className="productDetailHeaderBadges"
              aria-label="Informations principales du produit"
            >
              {/* ===========================================================
                  STATUT
                  =========================================================== */}

              <span
                className={
                  statusPresentation.className
                }
                title={`Statut : ${statusPresentation.label}`}
              >
                <span
                  className="productDetailHeaderBadgeIcon"
                  aria-hidden="true"
                >
                  {statusPresentation.icon}
                </span>

                <span>
                  {statusPresentation.label}
                </span>
              </span>


              {/* ===========================================================
                  ORIGINE
                  =========================================================== */}

              <span
                className={
                  originPresentation.className
                }
                title={`Origine : ${originPresentation.label}`}
              >
                <span
                  className="productDetailHeaderBadgeIcon"
                  aria-hidden="true"
                >
                  {originPresentation.icon}
                </span>

                <span>
                  {originPresentation.label}
                </span>
              </span>


              {/* ===========================================================
                  CATÉGORIE
                  =========================================================== */}

              <span
                className={[
                  "productDetailHeaderCategory",

                  product.category
                    ? ""
                    : "productDetailHeaderCategoryEmpty",
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
                title={`Catégorie : ${categoryName}`}
              >
                <Grid2X2
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  {categoryName}
                </span>
              </span>
            </div>
          </div>
        </div>


        {/* =================================================================
            ACTIONS PRINCIPALES
            ================================================================= */}

        {hasActions ? (
          <div
            className="productDetailHeaderActions"
            aria-label="Actions principales du produit"
          >
            {qrRoute ? (
              <Link
                href={qrRoute}
                className="productDetailHeaderQrButton"
                aria-label={`Afficher le QR du produit ${productName}`}
                title="Afficher le QR du produit"
              >
                <QrCode
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  QR produit
                </span>
              </Link>
            ) : null}


            {editRoute ? (
              <Link
                href={editRoute}
                className="productDetailHeaderEditButton"
                aria-label={`Modifier le produit ${productName}`}
                title="Modifier le produit"
              >
                <FilePenLine
                  size={17}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Modifier
                </span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>


      {/* ===================================================================
          INFORMATIONS RAPIDES
          =================================================================== */}

      <div
        className="productDetailHeaderInfoGrid"
        aria-label="Informations rapides du produit"
      >
        {/* =================================================================
            BOUTIQUE
            ================================================================= */}

        <div className="productDetailHeaderInfoItem">
          <div
            className="productDetailHeaderInfoIcon"
            aria-hidden="true"
          >
            <Store
              size={16}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailHeaderInfoContent">
            <span className="productDetailHeaderInfoLabel">
              Boutique
            </span>

            <strong
              className="productDetailHeaderInfoValue"
              title={storeName}
            >
              {storeName}
            </strong>
          </div>
        </div>


        {/* =================================================================
            LOCALISATION
            ================================================================= */}

        <div className="productDetailHeaderInfoItem">
          <div
            className="productDetailHeaderInfoIcon"
            aria-hidden="true"
          >
            <MapPin
              size={16}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailHeaderInfoContent">
            <span className="productDetailHeaderInfoLabel">
              Localisation
            </span>

            <strong
              className="productDetailHeaderInfoValue"
              title={
                storeLocation ??
                "Non renseignée"
              }
            >
              {storeLocation ??
                "Non renseignée"}
            </strong>
          </div>
        </div>


        {/* =================================================================
            CATÉGORIE
            ================================================================= */}

        <div className="productDetailHeaderInfoItem">
          <div
            className="productDetailHeaderInfoIcon"
            aria-hidden="true"
          >
            <Grid2X2
              size={16}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailHeaderInfoContent">
            <span className="productDetailHeaderInfoLabel">
              Catégorie
            </span>

            <strong
              className="productDetailHeaderInfoValue"
              title={categoryName}
            >
              {categoryName}
            </strong>
          </div>
        </div>


        {/* =================================================================
            SÉCURITÉ
            ================================================================= */}

        <div className="productDetailHeaderInfoItem">
          <div
            className="productDetailHeaderInfoIcon"
            aria-hidden="true"
          >
            <ShieldCheck
              size={16}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailHeaderInfoContent">
            <span className="productDetailHeaderInfoLabel">
              Accès
            </span>

            <strong className="productDetailHeaderInfoValue">
              Fiche sécurisée
            </strong>
          </div>
        </div>
      </div>
    </header>
  );
}