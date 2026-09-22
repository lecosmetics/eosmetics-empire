import type {
  ReactNode,
} from "react";

import {
  Barcode,
  CalendarDays,
  CircleCheck,
  FileText,
  FlaskConical,
  Grid2X2,
  Info,
  Package,
  RefreshCw,
  Ruler,
  Sparkles,
  Store,
  Tag,
  Weight,
} from "lucide-react";

import type {
  ProductDetail,
  ProductDetailPublicationStatus,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — VUE D'ENSEMBLE DU PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDetailOverview.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher la description ;
 * - afficher la catégorie ;
 * - afficher le SKU ;
 * - afficher la marque ;
 * - afficher l'origine ;
 * - afficher le vrai statut de publication ;
 * - afficher les informations cosmétiques complémentaires ;
 * - afficher les dates de création et de modification ;
 * - rester indépendant de Prisma ;
 * - rester indépendant de la session ;
 * - ne réaliser aucune mutation.
 *
 * IMPORTANT :
 *
 * Le composant reçoit uniquement un ProductDetail déjà :
 *
 * - chargé côté serveur ;
 * - autorisé pour la boutique courante ;
 * - normalisé par la couche métier.
 *
 * Les données affichées ici ne constituent jamais une vérification
 * d'autorisation.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDetailOverviewProps {
  readonly product:
    ProductDetail;
}


interface OverviewInformationItemProps {
  readonly icon:
    ReactNode;

  readonly label:
    string;

  readonly value:
    ReactNode;

  readonly className?:
    string;
}


interface StatusPresentation {
  readonly label:
    string;

  readonly className:
    string;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const EMPTY_VALUE =
  "Non renseigné";


const EMPTY_VALUE_FEMININE =
  "Non renseignée";


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
   DATE
   ========================================================================== */

/**
 * Accepte défensivement Date ou une valeur convertible.
 *
 * ProductDetail utilise normalement Date, mais cette protection évite qu'une
 * donnée sérialisée ou un ancien service ne fasse tomber toute la page.
 */

function normalizeDate(
  value:
    unknown,
): Date | null {
  if (
    value instanceof
    Date
  ) {
    return Number.isNaN(
      value.getTime(),
    )
      ? null
      : value;
  }


  if (
    typeof value ===
      "string" ||
    typeof value ===
      "number"
  ) {
    const parsed =
      new Date(
        value,
      );


    if (
      !Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return parsed;
    }
  }


  return null;
}


/* ==========================================================================
   FORMAT DATE
   ========================================================================== */

function formatProductDate(
  value:
    unknown,
): string {
  const date =
    normalizeDate(
      value,
    );


  if (
    !date
  ) {
    return EMPTY_VALUE_FEMININE;
  }


  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric",
      },
    ).format(
      date,
    );
  } catch {
    return EMPTY_VALUE_FEMININE;
  }
}


/* ==========================================================================
   FORMAT DATE + HEURE
   ========================================================================== */

function formatProductDateTime(
  value:
    unknown,
): string {
  const date =
    normalizeDate(
      value,
    );


  if (
    !date
  ) {
    return EMPTY_VALUE_FEMININE;
  }


  try {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      },
    ).format(
      date,
    );
  } catch {
    return EMPTY_VALUE_FEMININE;
  }
}


/* ==========================================================================
   ORIGINE
   ========================================================================== */

function getProductOriginLabel(
  origin:
    ProductDetail["origin"],
): string {
  switch (
    origin
  ) {
    case "CATALOG":
      return "Catalogue officiel L&E";


    case "STORE":
    default:
      return "Créé par la boutique";
  }
}


/* ==========================================================================
   STATUT DE PUBLICATION
   ========================================================================== */

/**
 * publicationStatus est privilégié.
 *
 * Exemple important :
 *
 * Product.status = ACTIVE
 * StoreProduct.status = HIDDEN
 *
 * Le produit est techniquement ACTIVE mais doit être présenté comme INACTIVE
 * publiquement.
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
   PRÉSENTATION DU STATUT
   ========================================================================== */

function getProductStatusPresentation(
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
            "productDetailOverviewStatus",
            "productDetailOverviewStatusDraft",
          ].join(
            " ",
          ),
      };


    case "INACTIVE":
      return {
        label:
          "Inactif",

        className:
          [
            "productDetailOverviewStatus",
            "productDetailOverviewStatusInactive",
          ].join(
            " ",
          ),
      };


    case "ARCHIVED":
      return {
        label:
          "Archivé",

        className:
          [
            "productDetailOverviewStatus",
            "productDetailOverviewStatusArchived",
          ].join(
            " ",
          ),
      };


    case "PUBLISHED":
    default:
      return {
        label:
          "Publié",

        className:
          [
            "productDetailOverviewStatus",
            "productDetailOverviewStatusPublished",
            "productDetailOverviewStatusActive",
          ].join(
            " ",
          ),
      };
  }
}


/* ==========================================================================
   INFORMATION COMPLÉMENTAIRE
   ========================================================================== */

/**
 * Le nouveau ProductDetail expose les champs de deux façons possibles :
 *
 * product.ingredients
 *
 * ou :
 *
 * product.additionalInformation.ingredients
 *
 * On supporte les deux pendant la migration sans dupliquer les données.
 */

function getAdditionalProductValue(
  directValue:
    string | null | undefined,

  groupedValue:
    string | null | undefined,
): string | null {
  return (
    normalizeText(
      directValue,
    ) ??
    normalizeText(
      groupedValue,
    )
  );
}


/* ==========================================================================
   SOUS-COMPOSANT — INFORMATION
   ========================================================================== */

function OverviewInformationItem({
  icon,
  label,
  value,
  className,
}: OverviewInformationItemProps) {
  const classes =
    [
      "productDetailOverviewItem",
      className,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  return (
    <div className={classes}>
      <div
        className="productDetailOverviewItemIcon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="productDetailOverviewItemContent">
        <span className="productDetailOverviewItemLabel">
          {label}
        </span>

        <div className="productDetailOverviewItemValue">
          {value}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   SOUS-COMPOSANT — TIMELINE
   ========================================================================== */

function OverviewTimelineItem({
  icon,
  label,
  value,
  date,
}: {
  readonly icon:
    ReactNode;

  readonly label:
    string;

  readonly value:
    string;

  readonly date:
    unknown;
}) {
  const normalizedDate =
    normalizeDate(
      date,
    );


  return (
    <div className="productDetailOverviewTimelineItem">
      <div
        className="productDetailOverviewTimelineIcon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="productDetailOverviewTimelineContent">
        <span className="productDetailOverviewTimelineLabel">
          {label}
        </span>

        {normalizedDate ? (
          <time
            className="productDetailOverviewTimelineValue"
            dateTime={
              normalizedDate.toISOString()
            }
          >
            {value}
          </time>
        ) : (
          <span className="productDetailOverviewTimelineValue">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}


/* ==========================================================================
   COMPOSANT
   ========================================================================== */

export default function ProductDetailOverview({
  product,
}: ProductDetailOverviewProps) {
  /* =========================================================================
     DESCRIPTION
     ========================================================================= */

  const description =
    normalizeText(
      product.description,
    );


  /* =========================================================================
     CATÉGORIE
     ========================================================================= */

  const categoryName =
    normalizeText(
      product.category?.name,
    );


  /* =========================================================================
     SKU
     ========================================================================= */

  const sku =
    normalizeText(
      product.sku,
    ) ??
    EMPTY_VALUE;


  /* =========================================================================
     MARQUE
     ========================================================================= */

  const brand =
    normalizeText(
      product.brand,
    ) ??
    EMPTY_VALUE_FEMININE;


  /* =========================================================================
     ORIGINE
     ========================================================================= */

  const originLabel =
    getProductOriginLabel(
      product.origin,
    );


  /* =========================================================================
     STATUT
     ========================================================================= */

  const publicationStatus =
    resolvePublicationStatus(
      product,
    );


  const status =
    getProductStatusPresentation(
      publicationStatus,
    );


  /* =========================================================================
     INFORMATIONS COMPLÉMENTAIRES
     ========================================================================= */

  const ingredients =
    getAdditionalProductValue(
      product.ingredients,
      product.additionalInformation
        ?.ingredients,
    );


  const weightContent =
    getAdditionalProductValue(
      product.weightContent,
      product.additionalInformation
        ?.weightContent,
    );


  const usageInstructions =
    getAdditionalProductValue(
      product.usageInstructions,
      product.additionalInformation
        ?.usageInstructions,
    );


  const unit =
    getAdditionalProductValue(
      product.unit,
      product.additionalInformation
        ?.unit,
    );


  const hasAdditionalInformation =
    Boolean(
      ingredients ||
      weightContent ||
      usageInstructions ||
      unit,
    );


  /* =========================================================================
     DATES
     ========================================================================= */

  const createdAt =
    formatProductDate(
      product.createdAt,
    );


  const updatedAt =
    formatProductDateTime(
      product.updatedAt,
    );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className="productDetailOverview"
      aria-labelledby="product-detail-overview-title"
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <div className="productDetailOverviewHeader">
        <div
          className="productDetailOverviewHeaderIcon"
          aria-hidden="true"
        >
          <Info
            size={20}
            strokeWidth={1.9}
          />
        </div>

        <div className="productDetailOverviewHeaderContent">
          <span className="productDetailOverviewEyebrow">
            Fiche produit
          </span>

          <h2
            id="product-detail-overview-title"
            className="productDetailOverviewTitle"
          >
            Informations générales
          </h2>

          <p className="productDetailOverviewSubtitle">
            Identification et informations principales du produit.
          </p>
        </div>
      </div>


      {/* ===================================================================
          DESCRIPTION
          =================================================================== */}

      <div className="productDetailOverviewDescription">
        <div className="productDetailOverviewDescriptionHeader">
          <div
            className="productDetailOverviewDescriptionIcon"
            aria-hidden="true"
          >
            <FileText
              size={18}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailOverviewDescriptionHeading">
            <span className="productDetailOverviewDescriptionEyebrow">
              Présentation
            </span>

            <h3 className="productDetailOverviewDescriptionTitle">
              Description du produit
            </h3>
          </div>
        </div>


        <div className="productDetailOverviewDescriptionBody">
          {description ? (
            <p className="productDetailOverviewDescriptionText">
              {description}
            </p>
          ) : (
            <div
              className="productDetailOverviewDescriptionEmpty"
              role="status"
            >
              <p>
                Aucune description n’a été renseignée pour ce produit.
              </p>
            </div>
          )}
        </div>
      </div>


      {/* ===================================================================
          IDENTIFICATION
          =================================================================== */}

      <div className="productDetailOverviewBlock">
        <div className="productDetailOverviewBlockHeader">
          <div>
            <span className="productDetailOverviewBlockEyebrow">
              Identification
            </span>

            <h3 className="productDetailOverviewBlockTitle">
              Données du produit
            </h3>
          </div>
        </div>


        <div className="productDetailOverviewGrid">
          {/* =================================================================
              CATÉGORIE
              ================================================================= */}

          <OverviewInformationItem
            icon={
              <Grid2X2
                size={17}
                strokeWidth={1.9}
              />
            }
            label="Catégorie"
            value={
              <span
                className={[
                  "productDetailOverviewCategory",

                  categoryName
                    ? ""
                    : "productDetailOverviewCategoryEmpty",
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
              >
                {categoryName ??
                  "Sans catégorie"}
              </span>
            }
          />


          {/* =================================================================
              SKU
              ================================================================= */}

          <OverviewInformationItem
            icon={
              <Barcode
                size={18}
                strokeWidth={1.8}
              />
            }
            label="Référence SKU"
            value={
              <code
                className="productDetailOverviewSku"
                title={sku}
              >
                {sku}
              </code>
            }
          />


          {/* =================================================================
              MARQUE
              ================================================================= */}

          <OverviewInformationItem
            icon={
              <Tag
                size={17}
                strokeWidth={1.9}
              />
            }
            label="Marque"
            value={
              <span>
                {brand}
              </span>
            }
          />


          {/* =================================================================
              ORIGINE
              ================================================================= */}

          <OverviewInformationItem
            icon={
              product.origin ===
              "CATALOG" ? (
                <Package
                  size={17}
                  strokeWidth={1.9}
                />
              ) : (
                <Store
                  size={17}
                  strokeWidth={1.9}
                />
              )
            }
            label="Origine"
            value={
              <span className="productDetailOverviewOrigin">
                {originLabel}
              </span>
            }
          />


          {/* =================================================================
              STATUT
              ================================================================= */}

          <OverviewInformationItem
            icon={
              <CircleCheck
                size={18}
                strokeWidth={1.9}
              />
            }
            label="Statut de publication"
            value={
              <span className={status.className}>
                <span
                  className="productDetailOverviewStatusDot"
                  aria-hidden="true"
                />

                <span>
                  {status.label}
                </span>
              </span>
            }
          />
        </div>
      </div>


      {/* ===================================================================
          INFORMATIONS COSMÉTIQUES
          =================================================================== */}

      {hasAdditionalInformation ? (
        <div className="productDetailOverviewBlock">
          <div className="productDetailOverviewBlockHeader">
            <div>
              <span className="productDetailOverviewBlockEyebrow">
                Informations complémentaires
              </span>

              <h3 className="productDetailOverviewBlockTitle">
                Caractéristiques du produit
              </h3>
            </div>
          </div>


          <div className="productDetailOverviewGrid">
            {/* ===============================================================
                POIDS / CONTENANCE
                =============================================================== */}

            {weightContent ? (
              <OverviewInformationItem
                icon={
                  <Weight
                    size={17}
                    strokeWidth={1.9}
                  />
                }
                label="Poids / contenance"
                value={
                  <span>
                    {weightContent}
                  </span>
                }
              />
            ) : null}


            {/* ===============================================================
                UNITÉ
                =============================================================== */}

            {unit ? (
              <OverviewInformationItem
                icon={
                  <Ruler
                    size={17}
                    strokeWidth={1.9}
                  />
                }
                label="Unité"
                value={
                  <span>
                    {unit}
                  </span>
                }
              />
            ) : null}


            {/* ===============================================================
                INGRÉDIENTS
                =============================================================== */}

            {ingredients ? (
              <OverviewInformationItem
                icon={
                  <FlaskConical
                    size={17}
                    strokeWidth={1.9}
                  />
                }
                label="Ingrédients"
                value={
                  <span>
                    {ingredients}
                  </span>
                }
              />
            ) : null}


            {/* ===============================================================
                MODE D'UTILISATION
                =============================================================== */}

            {usageInstructions ? (
              <OverviewInformationItem
                icon={
                  <Sparkles
                    size={17}
                    strokeWidth={1.9}
                  />
                }
                label="Mode d’utilisation"
                value={
                  <span>
                    {usageInstructions}
                  </span>
                }
              />
            ) : null}
          </div>
        </div>
      ) : null}


      {/* ===================================================================
          HISTORIQUE
          =================================================================== */}

      <div className="productDetailOverviewBlock">
        <div className="productDetailOverviewBlockHeader">
          <div>
            <span className="productDetailOverviewBlockEyebrow">
              Historique
            </span>

            <h3 className="productDetailOverviewBlockTitle">
              Suivi de la fiche
            </h3>
          </div>
        </div>


        <div className="productDetailOverviewTimeline">
          <OverviewTimelineItem
            icon={
              <CalendarDays
                size={17}
                strokeWidth={1.9}
              />
            }
            label="Produit créé le"
            value={createdAt}
            date={product.createdAt}
          />


          <OverviewTimelineItem
            icon={
              <RefreshCw
                size={17}
                strokeWidth={1.9}
              />
            }
            label="Dernière modification"
            value={updatedAt}
            date={product.updatedAt}
          />
        </div>
      </div>
    </section>
  );
}