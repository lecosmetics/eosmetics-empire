import type {
  ReactNode,
} from "react";

import {
  BadgePercent,
  Banknote,
  Check,
  CircleDollarSign,
  Coins,
  PackageCheck,
  PackageX,
  PiggyBank,
  TrendingDown,
  TriangleAlert,
  WalletCards,
} from "lucide-react";

import type {
  ProductDetail,
  ProductDetailAvailabilityStatus,
  ProductDetailPricing as ProductDetailPricingData,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — PRIX ET DISPONIBILITÉ DU PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/detail/ProductDetailPricing.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher le prix actuel ;
 * - afficher le prix de référence ;
 * - détecter défensivement une promotion valide ;
 * - afficher le montant économisé ;
 * - afficher le pourcentage de réduction ;
 * - afficher la devise ;
 * - afficher le stock disponible ;
 * - afficher l'état de disponibilité ;
 * - gérer proprement les valeurs incohérentes ;
 * - ne jamais modifier les données reçues ;
 * - rester indépendant de Prisma ;
 * - rester indépendant de la session ;
 * - ne réaliser aucune mutation.
 *
 * CONVENTION :
 *
 * Sans promotion :
 *
 * price          = prix de vente
 * compareAtPrice = null
 *
 * Avec promotion :
 *
 * price          = prix promotionnel actuel
 * compareAtPrice = ancien prix / prix de référence
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

export interface ProductDetailPricingProps {
  readonly product:
    ProductDetail;
}


interface PricingMetricProps {
  readonly icon:
    ReactNode;

  readonly label:
    string;

  readonly children:
    ReactNode;

  readonly className?:
    string;
}


interface AvailabilityPresentation {
  readonly label:
    string;

  readonly description:
    string;

  readonly icon:
    ReactNode;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const DEFAULT_CURRENCY =
  "XAF";


const EMPTY_VALUE =
  "Non renseigné";


/* ==========================================================================
   NOMBRE
   ========================================================================== */

function normalizeMoneyAmount(
  value:
    unknown,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    value,
  );
}


/* ==========================================================================
   DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return DEFAULT_CURRENCY;
  }


  const normalized =
    value
      .trim()
      .toUpperCase();


  if (
    !/^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    return DEFAULT_CURRENCY;
  }


  return normalized;
}


/* ==========================================================================
   FORMATAGE PRIX
   ========================================================================== */

function formatProductPrice(
  amount:
    number,

  currency:
    string,
): string {
  const safeAmount =
    normalizeMoneyAmount(
      amount,
    );


  const normalizedCurrency =
    normalizeCurrency(
      currency,
    );


  /* ------------------------------------------------------------------------
     FRANC CFA — CAMEROUN / CEMAC
     ------------------------------------------------------------------------ */

  if (
    normalizedCurrency ===
    "XAF"
  ) {
    const formatted =
      new Intl.NumberFormat(
        "fr-FR",
        {
          maximumFractionDigits:
            0,
        },
      ).format(
        safeAmount,
      );


    return `${formatted} FCFA`;
  }


  /* ------------------------------------------------------------------------
     FRANC CFA — UEMOA
     ------------------------------------------------------------------------ */

  if (
    normalizedCurrency ===
    "XOF"
  ) {
    const formatted =
      new Intl.NumberFormat(
        "fr-FR",
        {
          maximumFractionDigits:
            0,
        },
      ).format(
        safeAmount,
      );


    return `${formatted} FCFA`;
  }


  /* ------------------------------------------------------------------------
     AUTRES DEVISES
     ------------------------------------------------------------------------ */

  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        minimumFractionDigits:
          Number.isInteger(
            safeAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      safeAmount,
    );
  } catch {
    return `${safeAmount.toLocaleString(
      "fr-FR",
      {
        maximumFractionDigits:
          2,
      },
    )} ${normalizedCurrency}`;
  }
}


/* ==========================================================================
   NOM DEVISE
   ========================================================================== */

function getCurrencyDisplayName(
  currency:
    string,
): string {
  const normalizedCurrency =
    normalizeCurrency(
      currency,
    );


  switch (
    normalizedCurrency
  ) {
    case "XAF":
      return "Franc CFA CEMAC (XAF)";


    case "XOF":
      return "Franc CFA UEMOA (XOF)";


    case "EUR":
      return "Euro (EUR)";


    case "USD":
      return "Dollar américain (USD)";


    case "GBP":
      return "Livre sterling (GBP)";


    case "CAD":
      return "Dollar canadien (CAD)";


    case "CHF":
      return "Franc suisse (CHF)";


    case "NGN":
      return "Naira nigérian (NGN)";


    default:
      return normalizedCurrency;
  }
}


/* ==========================================================================
   PROMOTION
   ========================================================================== */

/**
 * Nous ne faisons pas confiance uniquement à hasPromotion.
 *
 * Une promotion est réellement valide uniquement lorsque :
 *
 * - price est valide ;
 * - compareAtPrice existe ;
 * - compareAtPrice > price.
 */

function hasValidPromotion(
  pricing:
    ProductDetailPricingData,
): boolean {
  const currentPrice =
    normalizeMoneyAmount(
      pricing.price,
    );


  const compareAtPrice =
    pricing.compareAtPrice;


  return (
    pricing.hasPromotion ===
      true &&
    typeof compareAtPrice ===
      "number" &&
    Number.isFinite(
      compareAtPrice,
    ) &&
    compareAtPrice >
      currentPrice
  );
}


/* ==========================================================================
   ÉCONOMIE
   ========================================================================== */

function getSavingsAmount(
  pricing:
    ProductDetailPricingData,
): number | null {
  if (
    !hasValidPromotion(
      pricing,
    ) ||
    pricing.compareAtPrice ===
      null
  ) {
    return null;
  }


  const calculatedSavings =
    normalizeMoneyAmount(
      pricing.compareAtPrice,
    ) -
    normalizeMoneyAmount(
      pricing.price,
    );


  if (
    calculatedSavings <=
    0
  ) {
    return null;
  }


  /**
   * Le service peut déjà fournir savingsAmount.
   *
   * On privilégie néanmoins un recalcul cohérent afin d'éviter d'afficher
   * un ancien calcul si price ou compareAtPrice ont changé.
   */
  return calculatedSavings;
}


/* ==========================================================================
   POURCENTAGE
   ========================================================================== */

function getDiscountPercentage(
  pricing:
    ProductDetailPricingData,
): number | null {
  if (
    !hasValidPromotion(
      pricing,
    ) ||
    pricing.compareAtPrice ===
      null ||
    pricing.compareAtPrice <=
      0
  ) {
    return null;
  }


  const savings =
    getSavingsAmount(
      pricing,
    );


  if (
    savings ===
    null
  ) {
    return null;
  }


  const calculatedPercentage =
    (
      savings /
      pricing.compareAtPrice
    ) *
    100;


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        calculatedPercentage,
      ),
    ),
  );
}


/* ==========================================================================
   STOCK
   ========================================================================== */

function normalizeStockQuantity(
  value:
    unknown,
): number {
  if (
    typeof value !==
      "number" ||
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
   DISPONIBILITÉ
   ========================================================================== */

function resolveAvailabilityStatus(
  product:
    ProductDetail,
): ProductDetailAvailabilityStatus {
  if (
    product.inventory
      .availabilityStatus
  ) {
    return product.inventory
      .availabilityStatus;
  }


  const stockQuantity =
    normalizeStockQuantity(
      product.inventory
        .stockQuantity,
    );


  const threshold =
    normalizeStockQuantity(
      product.inventory
        .lowStockThreshold,
    );


  switch (
    product.inventory.status
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
        threshold
      ) {
        return "LOW_STOCK";
      }


      return "IN_STOCK";
  }
}


/* ==========================================================================
   PRÉSENTATION DISPONIBILITÉ
   ========================================================================== */

function getAvailabilityPresentation(
  status:
    ProductDetailAvailabilityStatus,
): AvailabilityPresentation {
  switch (
    status
  ) {
    case "LOW_STOCK":
      return {
        label:
          "Stock faible",

        description:
          "Le seuil d’alerte de stock est atteint.",

        icon:
          (
            <TriangleAlert
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          ),
      };


    case "OUT_OF_STOCK":
      return {
        label:
          "Rupture de stock",

        description:
          "Aucune unité n’est actuellement disponible.",

        icon:
          (
            <PackageX
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          ),
      };


    case "HIDDEN":
      return {
        label:
          "Produit masqué",

        description:
          "Le produit n’est actuellement pas proposé publiquement.",

        icon:
          (
            <TriangleAlert
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          ),
      };


    case "ARCHIVED":
      return {
        label:
          "Produit archivé",

        description:
          "Le produit n’est plus actif dans la boutique.",

        icon:
          (
            <PackageX
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          ),
      };


    case "IN_STOCK":
    default:
      return {
        label:
          "En stock",

        description:
          "Le produit est actuellement disponible.",

        icon:
          (
            <PackageCheck
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          ),
      };
  }
}


/* ==========================================================================
   SOUS-COMPOSANT — MÉTRIQUE
   ========================================================================== */

function PricingMetric({
  icon,
  label,
  children,
  className,
}: PricingMetricProps) {
  const classes =
    [
      "productDetailPricingMetric",
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
        className="productDetailPricingMetricIcon"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="productDetailPricingMetricContent">
        <span className="productDetailPricingMetricLabel">
          {label}
        </span>

        <div className="productDetailPricingMetricValue">
          {children}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function ProductDetailPricing({
  product,
}: ProductDetailPricingProps) {
  /* =========================================================================
     PRICING
     ========================================================================= */

  const {
    pricing,
  } =
    product;


  const currentAmount =
    normalizeMoneyAmount(
      pricing.price,
    );


  const currency =
    normalizeCurrency(
      pricing.currency,
    );


  const hasPromotion =
    hasValidPromotion(
      pricing,
    );


  /* =========================================================================
     PRIX FORMATÉS
     ========================================================================= */

  const currentPrice =
    formatProductPrice(
      currentAmount,
      currency,
    );


  const referencePrice =
    hasPromotion &&
    pricing.compareAtPrice !==
      null
      ? formatProductPrice(
          pricing.compareAtPrice,
          currency,
        )
      : null;


  const savingsAmount =
    getSavingsAmount(
      pricing,
    );


  const savings =
    savingsAmount !==
      null
      ? formatProductPrice(
          savingsAmount,
          currency,
        )
      : null;


  const discountPercentage =
    getDiscountPercentage(
      pricing,
    );


  const currencyLabel =
    getCurrencyDisplayName(
      currency,
    );


  /* =========================================================================
     INVENTAIRE
     ========================================================================= */

  const stockQuantity =
    normalizeStockQuantity(
      product.inventory
        .stockQuantity,
    );


  const lowStockThreshold =
    normalizeStockQuantity(
      product.inventory
        .lowStockThreshold,
    );


  const availabilityStatus =
    resolveAvailabilityStatus(
      product,
    );


  const availability =
    getAvailabilityPresentation(
      availabilityStatus,
    );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className="productDetailPricing"
      aria-labelledby="product-detail-pricing-title"
    >
      {/* ===================================================================
          HEADER
          =================================================================== */}

      <div className="productDetailPricingHeader">
        <div className="productDetailPricingHeaderMain">
          <div
            className="productDetailPricingHeaderIcon"
            aria-hidden="true"
          >
            <CircleDollarSign
              size={20}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailPricingHeaderContent">
            <span className="productDetailPricingEyebrow">
              Tarification
            </span>

            <h2
              id="product-detail-pricing-title"
              className="productDetailPricingTitle"
            >
              Prix et disponibilité
            </h2>

            <p className="productDetailPricingSubtitle">
              Prix, promotion et stock actuellement appliqués par votre boutique.
            </p>
          </div>
        </div>


        {/* =================================================================
            ÉTAT DU PRIX
            ================================================================= */}

        <div
          className={[
            "productDetailPricingState",

            hasPromotion
              ? "productDetailPricingStatePromotion"
              : "productDetailPricingStateNormal",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          {hasPromotion ? (
            <>
              <BadgePercent
                size={14}
                strokeWidth={2}
                aria-hidden="true"
              />

              <span>
                Promotion active
              </span>
            </>
          ) : (
            <>
              <Check
                size={14}
                strokeWidth={2.4}
                aria-hidden="true"
              />

              <span>
                Prix normal
              </span>
            </>
          )}
        </div>
      </div>


      {/* ===================================================================
          PRIX PRINCIPAL
          =================================================================== */}

      <div
        className={[
          "productDetailPricingHero",

          hasPromotion
            ? "productDetailPricingHeroPromotion"
            : "",
        ]
          .filter(
            Boolean,
          )
          .join(
            " ",
          )}
      >
        <div className="productDetailPricingHeroMain">
          <span className="productDetailPricingHeroLabel">
            {hasPromotion
              ? "Prix promotionnel actuel"
              : "Prix de vente actuel"}
          </span>


          <div className="productDetailPricingHeroPriceRow">
            <strong className="productDetailPricingHeroPrice">
              {currentPrice}
            </strong>


            {discountPercentage !==
            null ? (
              <span
                className="productDetailPricingDiscountBadge"
                aria-label={`${discountPercentage} pour cent de réduction`}
              >
                -{discountPercentage} %
              </span>
            ) : null}
          </div>


          {/* =================================================================
              PRIX DE RÉFÉRENCE
              ================================================================= */}

          {hasPromotion &&
          referencePrice ? (
            <div className="productDetailPricingReference">
              <span className="productDetailPricingReferenceLabel">
                Prix normal
              </span>

              <span className="productDetailPricingReferencePrice">
                {referencePrice}
              </span>
            </div>
          ) : (
            <p className="productDetailPricingHeroDescription">
              Aucun prix promotionnel n’est actuellement appliqué à ce produit.
            </p>
          )}
        </div>


        <div
          className="productDetailPricingHeroIcon"
          aria-hidden="true"
        >
          {hasPromotion ? (
            <BadgePercent
              size={23}
              strokeWidth={1.8}
            />
          ) : (
            <WalletCards
              size={23}
              strokeWidth={1.8}
            />
          )}
        </div>
      </div>


      {/* ===================================================================
          MÉTRIQUES
          =================================================================== */}

      <div className="productDetailPricingMetrics">
        {/* =================================================================
            PRIX ACTUEL
            ================================================================= */}

        <PricingMetric
          icon={
            <Banknote
              size={18}
              strokeWidth={1.9}
            />
          }
          label="Prix actuel"
        >
          <strong className="productDetailPricingMetricAmount">
            {currentPrice}
          </strong>
        </PricingMetric>


        {/* =================================================================
            PRIX NORMAL
            ================================================================= */}

        {hasPromotion &&
        referencePrice ? (
          <PricingMetric
            icon={
              <TrendingDown
                size={18}
                strokeWidth={1.9}
              />
            }
            label="Prix normal"
          >
            <span className="productDetailPricingMetricOldAmount">
              {referencePrice}
            </span>
          </PricingMetric>
        ) : null}


        {/* =================================================================
            ÉCONOMIE
            ================================================================= */}

        {hasPromotion &&
        savings ? (
          <PricingMetric
            icon={
              <PiggyBank
                size={18}
                strokeWidth={1.9}
              />
            }
            label="Économie"
            className="productDetailPricingMetricSavings"
          >
            <div className="productDetailPricingSavingValue">
              <strong>
                {savings}
              </strong>

              {discountPercentage !==
              null ? (
                <span>
                  {discountPercentage} % de réduction
                </span>
              ) : null}
            </div>
          </PricingMetric>
        ) : null}


        {/* =================================================================
            DEVISE
            ================================================================= */}

        <PricingMetric
          icon={
            <Coins
              size={18}
              strokeWidth={1.9}
            />
          }
          label="Devise"
        >
          <span
            className="productDetailPricingCurrency"
            title={currency}
          >
            {currencyLabel ||
              EMPTY_VALUE}
          </span>
        </PricingMetric>


        {/* =================================================================
            STOCK
            ================================================================= */}

        <PricingMetric
          icon={
            <PackageCheck
              size={18}
              strokeWidth={1.9}
            />
          }
          label="Stock disponible"
        >
          <strong className="productDetailPricingMetricAmount">
            {stockQuantity.toLocaleString(
              "fr-FR",
            )}{" "}
            unité
            {stockQuantity >
            1
              ? "s"
              : ""}
          </strong>
        </PricingMetric>


        {/* =================================================================
            DISPONIBILITÉ
            ================================================================= */}

        <PricingMetric
          icon={
            availability.icon
          }
          label="Disponibilité"
        >
          <div>
            <strong>
              {availability.label}
            </strong>

            <div className="productDetailPricingHeroDescription">
              {availability.description}
            </div>
          </div>
        </PricingMetric>


        {/* =================================================================
            SEUIL STOCK
            ================================================================= */}

        <PricingMetric
          icon={
            <TriangleAlert
              size={18}
              strokeWidth={1.9}
            />
          }
          label="Seuil d’alerte"
        >
          <span>
            {lowStockThreshold.toLocaleString(
              "fr-FR",
            )}{" "}
            unité
            {lowStockThreshold >
            1
              ? "s"
              : ""}
          </span>
        </PricingMetric>
      </div>


      {/* ===================================================================
          RÉCAPITULATIF PROMOTION
          =================================================================== */}

      {hasPromotion &&
      referencePrice &&
      savings ? (
        <div className="productDetailPricingPromotionSummary">
          <div
            className="productDetailPricingPromotionSummaryIcon"
            aria-hidden="true"
          >
            <BadgePercent
              size={18}
              strokeWidth={1.9}
            />
          </div>

          <div className="productDetailPricingPromotionSummaryContent">
            <span className="productDetailPricingPromotionSummaryEyebrow">
              Avantage client
            </span>

            <strong className="productDetailPricingPromotionSummaryTitle">
              Promotion en cours
            </strong>

            <p className="productDetailPricingPromotionSummaryText">
              Le prix passe de{" "}
              <strong>
                {referencePrice}
              </strong>{" "}
              à{" "}
              <strong>
                {currentPrice}
              </strong>
              , soit une économie de{" "}
              <strong>
                {savings}
              </strong>
              {discountPercentage !==
              null
                ? ` (${discountPercentage} %).`
                : "."}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}