import Link from "next/link";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleMinus,
  Lightbulb,
  PackageCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type {
  ManagerStatisticsPerformanceInsight,
  ManagerStatisticsRecommendation,
} from "@/lib/gestionnaire/statistiques/statistics-types";

import styles from "@/app/gestionnaire/(espace-prive)/statistiques/statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — INSIGHTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/statistiques/StatisticsInsights.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher une synthèse basée sur l'évolution réelle du chiffre d'affaires ;
 * - afficher une recommandation uniquement lorsqu'elle est réellement
 *   justifiée par les données ;
 * - permettre l'accès au vrai produit concerné ;
 * - rester purement présentationnel.
 *
 *
 * CE FICHIER NE :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne récupère aucun storeId ;
 * - ne calcule aucun chiffre d'affaires ;
 * - ne détermine aucun produit arbitrairement ;
 * - ne génère aucune recommandation fictive ;
 * - ne crée aucune nouvelle route.
 *
 *
 * L'insight est construit côté serveur uniquement lorsqu'une comparaison
 * financière cohérente est possible.
 *
 * La recommandation actuelle est construite uniquement lorsqu'un produit :
 *
 * - fait partie des meilleures ventes réelles ;
 * - possède encore un StoreProduct réel ;
 * - possède un stock actuel faible.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES EXISTANTES
   ========================================================================== */

const PRODUCTS_ROUTE =
  "/gestionnaire/produits";


function getProductDetailRoute(
  productId:
    string,
): string {
  return `${PRODUCTS_ROUTE}/${encodeURIComponent(productId)}`;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function formatMoneyAmount(
  amount:
    string,
  currency:
    string,
): string {
  const numericAmount =
    Number(
      amount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${amount} ${currency}`;
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency,

        currencyDisplay:
          "code",

        minimumFractionDigits:
          Number.isInteger(
            numericAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return [
      numericAmount.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits:
            2,
        },
      ),

      currency,
    ].join(
      " ",
    );
  }
}


/* ==========================================================================
   INTEGER
   ========================================================================== */

function formatInteger(
  value:
    number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "0";
  }


  return new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  ).format(
    value,
  );
}


/* ==========================================================================
   PERCENTAGE
   ========================================================================== */

function formatPercentage(
  percentage:
    number,
): string {
  const absolute =
    Math.abs(
      percentage,
    );


  return new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        Number.isInteger(
          absolute,
        )
          ? 0
          : 1,

      maximumFractionDigits:
        2,
    },
  ).format(
    absolute,
  );
}


/* ==========================================================================
   INSIGHT PRESENTATION
   ========================================================================== */

interface PerformanceInsightPresentation {
  readonly title:
    string;

  readonly description:
    string;

  readonly icon:
    "up" |
    "down" |
    "stable";

  readonly tone:
    "positive" |
    "negative" |
    "neutral";
}


function createPerformanceInsightPresentation(
  insight:
    ManagerStatisticsPerformanceInsight,
): PerformanceInsightPresentation {
  const percentage =
    formatPercentage(
      insight.percentage,
    );


  switch (
    insight.kind
  ) {
    case "revenue-increase":
      return {
        title:
          "Bonne performance !",

        description:
          `Votre chiffre d’affaires a augmenté de ${percentage}% par rapport à la période précédente.`,

        icon:
          "up",

        tone:
          "positive",
      };


    case "revenue-decrease":
      return {
        title:
          "Chiffre d’affaires en baisse",

        description:
          `Votre chiffre d’affaires a diminué de ${percentage}% par rapport à la période précédente.`,

        icon:
          "down",

        tone:
          "negative",
      };


    case "revenue-stable":
    default:
      return {
        title:
          "Performance stable",

        description:
          "Votre chiffre d’affaires est stable par rapport à la période précédente.",

        icon:
          "stable",

        tone:
          "neutral",
      };
  }
}


/* ==========================================================================
   INSIGHT TONE
   ========================================================================== */

function getPerformanceInsightToneClass(
  tone:
    PerformanceInsightPresentation["tone"],
): string {
  switch (
    tone
  ) {
    case "positive":
      return styles.statisticsInsightPositive;


    case "negative":
      return styles.statisticsInsightNegative;


    case "neutral":
    default:
      return styles.statisticsInsightNeutral;
  }
}


/* ==========================================================================
   INSIGHT ICON
   ========================================================================== */

function PerformanceInsightIcon({
  icon,
}: {
  readonly icon:
    PerformanceInsightPresentation["icon"];
}) {
  switch (
    icon
  ) {
    case "up":
      return (
        <TrendingUp
          size={27}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      );


    case "down":
      return (
        <TrendingDown
          size={27}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      );


    case "stable":
    default:
      return (
        <CircleMinus
          size={27}
          strokeWidth={1.9}
          aria-hidden="true"
        />
      );
  }
}


/* ==========================================================================
   INSIGHT TREND BADGE
   ========================================================================== */

function PerformanceInsightTrend({
  insight,
}: {
  readonly insight:
    ManagerStatisticsPerformanceInsight;
}) {
  const percentage =
    formatPercentage(
      insight.percentage,
    );


  if (
    insight.trend ===
    "up"
  ) {
    return (
      <span
        className={[
          styles.statisticsInsightTrend,
          styles.statisticsInsightTrendUp,
        ].join(" ")}
      >
        <ArrowUpRight
          size={14}
          strokeWidth={2}
          aria-hidden="true"
        />

        +{percentage}%
      </span>
    );
  }


  if (
    insight.trend ===
    "down"
  ) {
    return (
      <span
        className={[
          styles.statisticsInsightTrend,
          styles.statisticsInsightTrendDown,
        ].join(" ")}
      >
        <ArrowDownRight
          size={14}
          strokeWidth={2}
          aria-hidden="true"
        />

        -{percentage}%
      </span>
    );
  }


  return (
    <span
      className={[
        styles.statisticsInsightTrend,
        styles.statisticsInsightTrendStable,
      ].join(" ")}
    >
      <CircleMinus
        size={14}
        strokeWidth={2}
        aria-hidden="true"
      />

      0%
    </span>
  );
}


/* ==========================================================================
   PERFORMANCE INSIGHT
   ========================================================================== */

export function PerformanceInsightCard({
  insight,
}: {
  readonly insight:
    ManagerStatisticsPerformanceInsight | null;
}) {
  /* ------------------------------------------------------------------------
     COMPARAISON NON DISPONIBLE
     ------------------------------------------------------------------------
     
     On n'invente ni tendance ni pourcentage.
     ------------------------------------------------------------------------ */

  if (
    !insight
  ) {
    return (
      <section
        className={[
          styles.statisticsInsightCard,
          styles.statisticsInsightNeutral,
        ].join(" ")}
        aria-labelledby="statistics-performance-insight-title"
      >
        <div
          className={styles.statisticsInsightIcon}
          aria-hidden="true"
        >
          <CircleMinus
            size={27}
            strokeWidth={1.9}
          />
        </div>


        <div className={styles.statisticsInsightContent}>
          <h2
            id="statistics-performance-insight-title"
            className={styles.statisticsInsightTitle}
          >
            Évolution de la performance
          </h2>


          <p className={styles.statisticsInsightDescription}>
            La comparaison avec la période précédente n’est pas disponible
            pour cette sélection.
          </p>
        </div>
      </section>
    );
  }


  const presentation =
    createPerformanceInsightPresentation(
      insight,
    );


  return (
    <section
      className={[
        styles.statisticsInsightCard,
        getPerformanceInsightToneClass(
          presentation.tone,
        ),
      ].join(" ")}
      aria-labelledby="statistics-performance-insight-title"
    >
      {/* ==================================================================
          ICON
          ================================================================== */}

      <div
        className={styles.statisticsInsightIcon}
        aria-hidden="true"
      >
        <PerformanceInsightIcon
          icon={presentation.icon}
        />
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.statisticsInsightContent}>
        <div className={styles.statisticsInsightTitleRow}>
          <h2
            id="statistics-performance-insight-title"
            className={styles.statisticsInsightTitle}
          >
            {presentation.title}
          </h2>


          <PerformanceInsightTrend
            insight={insight}
          />
        </div>


        <p className={styles.statisticsInsightDescription}>
          {presentation.description}
        </p>


        {/* =================================================================
            REAL VALUES
            ================================================================= */}

        <dl className={styles.statisticsInsightValues}>
          <div>
            <dt>
              Période actuelle
            </dt>

            <dd>
              {formatMoneyAmount(
                insight.currentAmount,
                insight.currency,
              )}
            </dd>
          </div>


          <div>
            <dt>
              Période précédente
            </dt>

            <dd>
              {formatMoneyAmount(
                insight.previousAmount,
                insight.currency,
              )}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}


/* ==========================================================================
   RECOMMENDATION
   ========================================================================== */

export function RecommendationCard({
  recommendation,
}: {
  readonly recommendation:
    ManagerStatisticsRecommendation | null;
}) {
  /* ------------------------------------------------------------------------
     AUCUNE RECOMMANDATION JUSTIFIÉE
     ------------------------------------------------------------------------
     
     Pas de produit inventé.
     Pas de conseil artificiel.
     ------------------------------------------------------------------------ */

  if (
    !recommendation
  ) {
    return (
      <section
        className={styles.statisticsRecommendationCard}
        aria-labelledby="statistics-recommendation-title"
      >
        <div
          className={styles.statisticsRecommendationIcon}
          aria-hidden="true"
        >
          <Lightbulb
            size={24}
            strokeWidth={1.8}
          />
        </div>


        <div className={styles.statisticsRecommendationContent}>
          <h2
            id="statistics-recommendation-title"
            className={styles.statisticsRecommendationTitle}
          >
            Recommandation
          </h2>


          <p className={styles.statisticsRecommendationDescription}>
            Aucune recommandation basée sur les ventes et le stock n’est
            nécessaire pour cette période.
          </p>
        </div>
      </section>
    );
  }


  /* ------------------------------------------------------------------------
     RECOMMANDATION ACTUELLE
     ------------------------------------------------------------------------ */

  switch (
    recommendation.kind
  ) {
    case "top-seller-low-stock":
    default:
      return (
        <section
          className={styles.statisticsRecommendationCard}
          aria-labelledby="statistics-recommendation-title"
        >
          {/* ==============================================================
              ICON
              ============================================================== */}

          <div
            className={styles.statisticsRecommendationIcon}
            aria-hidden="true"
          >
            <PackageCheck
              size={25}
              strokeWidth={1.8}
            />
          </div>


          {/* ==============================================================
              CONTENT
              ============================================================== */}

          <div className={styles.statisticsRecommendationContent}>
            <h2
              id="statistics-recommendation-title"
              className={styles.statisticsRecommendationTitle}
            >
              Recommandation
            </h2>


            <p className={styles.statisticsRecommendationDescription}>
              <strong>
                {recommendation.productName}
              </strong>{" "}
              fait partie des produits les plus vendus sur la période
              sélectionnée et son stock actuel est faible.
            </p>


            {/* ============================================================
                REAL DATA
                ============================================================ */}

            <dl className={styles.statisticsRecommendationMetrics}>
              <div>
                <dt>
                  Vendus
                </dt>

                <dd>
                  {formatInteger(
                    recommendation.quantitySold,
                  )}
                </dd>
              </div>


              <div>
                <dt>
                  Stock actuel
                </dt>

                <dd>
                  {formatInteger(
                    recommendation.stockQuantity,
                  )}
                </dd>
              </div>


              <div>
                <dt>
                  Seuil faible
                </dt>

                <dd>
                  {formatInteger(
                    recommendation.lowStockThreshold,
                  )}
                </dd>
              </div>
            </dl>


            {/* ============================================================
                REAL PRODUCT ROUTE
                ============================================================ */}

            <Link
              href={
                getProductDetailRoute(
                  recommendation.productId,
                )
              }
              className={styles.statisticsRecommendationAction}
            >
              <span>
                Voir le produit
              </span>


              <ArrowRight
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>
      );
  }
}