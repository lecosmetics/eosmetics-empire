import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  Minus,
  PackageCheck,
  ShoppingBag,
  Truck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import type {
  ManagerStatisticsKpis,
  ManagerStatisticsMoney,
  ManagerStatisticsMoneyComparison,
  ManagerStatisticsNumberComparison,
  ManagerStatisticsTrend,
} from "@/lib/gestionnaire/statistiques/statistics-types";

import styles from "@/app/gestionnaire/(espace-prive)/statistiques/statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — KPI GRID
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/statistiques/StatisticsKpiGrid.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher les 5 KPI principaux ;
 * - afficher uniquement les vraies valeurs reçues du serveur ;
 * - afficher les évolutions uniquement lorsqu'elles sont calculables ;
 * - respecter les différentes devises ;
 * - ne jamais additionner plusieurs devises différentes ;
 * - rester compatible desktop / tablette / mobile ;
 * - rester purement présentationnel.
 *
 *
 * KPI AFFICHÉS :
 *
 * 1. Chiffre d'affaires
 * 2. Commandes
 * 3. Clients
 * 4. Produits vendus
 * 5. Livraisons
 *
 *
 * CE COMPOSANT NE :
 *
 * - ne lit aucune session ;
 * - ne fait aucune requête Prisma ;
 * - ne recalcule aucune statistique métier ;
 * - ne reçoit aucun storeId ;
 * - ne contient aucune donnée de démonstration ;
 * - ne mélange aucune devise ;
 * - ne crée aucune route.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface StatisticsKpiGridProps {
  readonly kpis:
    ManagerStatisticsKpis;
}


/* ==========================================================================
   INTERNAL CARD TYPES
   ========================================================================== */

type StatisticsKpiTone =
  | "primary"
  | "blue"
  | "green"
  | "orange"
  | "purple";


interface StatisticsNumberKpiCardProps {
  readonly title:
    string;

  readonly value:
    number;

  readonly comparison:
    ManagerStatisticsNumberComparison;

  readonly icon:
    LucideIcon;

  readonly tone:
    StatisticsKpiTone;

  readonly valueLabel:
    string;
}


/* ==========================================================================
   NUMBER FORMATTER
   ========================================================================== */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


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


  return INTEGER_FORMATTER.format(
    value,
  );
}


/* ==========================================================================
   MONEY FORMATTER
   ========================================================================== */

/**
 * Les montants arrivent depuis statistics-query.ts sous forme de string.
 *
 * Ils représentent des Decimal Prisma déjà sérialisés.
 *
 * Pour l'affichage uniquement, nous les convertissons en number.
 *
 * Le calcul métier n'est jamais effectué ici.
 */

function formatMoney(
  money:
    ManagerStatisticsMoney,
): string {
  const numericAmount =
    Number(
      money.amount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${money.amount} ${money.currency}`;
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          money.currency,

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
    /**
     * Une devise non reconnue par Intl ne doit jamais casser
     * toute la page Statistiques.
     */

    return [
      new Intl.NumberFormat(
        "fr-FR",
        {
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
      ),

      money.currency,
    ].join(
      " ",
    );
  }
}


/* ==========================================================================
   PERCENTAGE FORMATTER
   ========================================================================== */

function formatPercentage(
  percentage:
    number,
): string {
  const absolute =
    Math.abs(
      percentage,
    );


  const formatted =
    new Intl.NumberFormat(
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


  return `${formatted}%`;
}


/* ==========================================================================
   TONE CLASSES
   ========================================================================== */

function getToneClassName(
  tone:
    StatisticsKpiTone,
): string {
  switch (
    tone
  ) {
    case "blue":
      return styles.statisticsKpiIconBlue;


    case "green":
      return styles.statisticsKpiIconGreen;


    case "orange":
      return styles.statisticsKpiIconOrange;


    case "purple":
      return styles.statisticsKpiIconPurple;


    case "primary":
    default:
      return styles.statisticsKpiIconPrimary;
  }
}


/* ==========================================================================
   TREND CLASS
   ========================================================================== */

function getTrendClassName(
  trend:
    ManagerStatisticsTrend,
): string {
  switch (
    trend
  ) {
    case "up":
      return styles.statisticsKpiTrendUp;


    case "down":
      return styles.statisticsKpiTrendDown;


    case "stable":
      return styles.statisticsKpiTrendStable;


    case "unavailable":
    default:
      return styles.statisticsKpiTrendUnavailable;
  }
}


/* ==========================================================================
   TREND ICON
   ========================================================================== */

function TrendIcon({
  trend,
}: {
  readonly trend:
    ManagerStatisticsTrend;
}) {
  switch (
    trend
  ) {
    case "up":
      return (
        <ArrowUpRight
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      );


    case "down":
      return (
        <ArrowDownRight
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      );


    case "stable":
      return (
        <Minus
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
        />
      );


    case "unavailable":
    default:
      return null;
  }
}


/* ==========================================================================
   TREND LABEL
   ========================================================================== */

function getTrendAccessibilityLabel(
  trend:
    ManagerStatisticsTrend,
  percentage:
    number,
): string {
  const percentageLabel =
    formatPercentage(
      percentage,
    );


  switch (
    trend
  ) {
    case "up":
      return `Hausse de ${percentageLabel} par rapport à la période précédente`;


    case "down":
      return `Baisse de ${percentageLabel} par rapport à la période précédente`;


    case "stable":
      return `Stable par rapport à la période précédente`;


    case "unavailable":
    default:
      return "Comparaison indisponible";
  }
}


/* ==========================================================================
   NUMBER TREND
   ========================================================================== */

function NumberTrend({
  comparison,
}: {
  readonly comparison:
    ManagerStatisticsNumberComparison;
}) {
  /**
   * Aucun pourcentage n'est affiché lorsque la période précédente
   * ne permet pas une comparaison correcte.
   */

  if (
    comparison.percentage ===
      null ||
    comparison.trend ===
      "unavailable"
  ) {
    return (
      <span className={styles.statisticsKpiComparisonMuted}>
        vs période précédente
      </span>
    );
  }


  return (
    <div className={styles.statisticsKpiComparison}>
      <span
        className={[
          styles.statisticsKpiTrend,
          getTrendClassName(
            comparison.trend,
          ),
        ].join(" ")}
        aria-label={
          getTrendAccessibilityLabel(
            comparison.trend,
            comparison.percentage,
          )
        }
      >
        <TrendIcon
          trend={comparison.trend}
        />

        <span>
          {comparison.trend ===
          "down"
            ? "-"
            : comparison.trend ===
                "up"
              ? "+"
              : ""}

          {formatPercentage(
            comparison.percentage,
          )}
        </span>
      </span>


      <span className={styles.statisticsKpiComparisonLabel}>
        vs période précédente
      </span>
    </div>
  );
}


/* ==========================================================================
   REVENUE TREND
   ========================================================================== */

function RevenueTrend({
  comparisons,
}: {
  readonly comparisons:
    readonly ManagerStatisticsMoneyComparison[];
}) {
  /**
   * Une comparaison globale n'est pertinente que si une seule devise
   * est présente.
   *
   * Avec plusieurs devises, aucun pourcentage global artificiel n'est créé.
   */

  if (
    comparisons.length !==
    1
  ) {
    return (
      <span className={styles.statisticsKpiComparisonMuted}>
        vs période précédente
      </span>
    );
  }


  const comparison =
    comparisons[0];


  if (
    comparison.percentage ===
      null ||
    comparison.trend ===
      "unavailable"
  ) {
    return (
      <span className={styles.statisticsKpiComparisonMuted}>
        vs période précédente
      </span>
    );
  }


  return (
    <div className={styles.statisticsKpiComparison}>
      <span
        className={[
          styles.statisticsKpiTrend,
          getTrendClassName(
            comparison.trend,
          ),
        ].join(" ")}
        aria-label={
          getTrendAccessibilityLabel(
            comparison.trend,
            comparison.percentage,
          )
        }
      >
        <TrendIcon
          trend={comparison.trend}
        />

        <span>
          {comparison.trend ===
          "down"
            ? "-"
            : comparison.trend ===
                "up"
              ? "+"
              : ""}

          {formatPercentage(
            comparison.percentage,
          )}
        </span>
      </span>


      <span className={styles.statisticsKpiComparisonLabel}>
        vs période précédente
      </span>
    </div>
  );
}


/* ==========================================================================
   REVENUE VALUES
   ========================================================================== */

function RevenueValues({
  values,
}: {
  readonly values:
    readonly ManagerStatisticsMoney[];
}) {
  /* ------------------------------------------------------------------------
     AUCUN PAIEMENT
     ------------------------------------------------------------------------ */

  if (
    values.length ===
    0
  ) {
    return (
      <span className={styles.statisticsKpiValue}>
        0
      </span>
    );
  }


  /* ------------------------------------------------------------------------
     UNE DEVISE
     ------------------------------------------------------------------------ */

  if (
    values.length ===
    1
  ) {
    return (
      <span className={styles.statisticsKpiValue}>
        {formatMoney(
          values[0],
        )}
      </span>
    );
  }


  /* ------------------------------------------------------------------------
     PLUSIEURS DEVISES
     ------------------------------------------------------------------------
     
     On ne calcule jamais un total global.
     
     Exemple :
     
     15 000 XOF
     30 EUR
     
     et jamais :
     
     15 030
     ------------------------------------------------------------------------ */

  return (
    <div className={styles.statisticsKpiMoneyList}>
      {values.map(
        (
          money,
        ) => (
          <span
            key={money.currency}
            className={styles.statisticsKpiMoneyValue}
          >
            {formatMoney(
              money,
            )}
          </span>
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   NUMBER KPI CARD
   ========================================================================== */

function StatisticsNumberKpiCard({
  title,
  value,
  comparison,
  icon: Icon,
  tone,
  valueLabel,
}: StatisticsNumberKpiCardProps) {
  return (
    <article
      className={styles.statisticsKpiCard}
      aria-label={`${title} : ${valueLabel}`}
    >
      {/* ==================================================================
          ICON
          ================================================================== */}

      <div
        className={[
          styles.statisticsKpiIcon,
          getToneClassName(
            tone,
          ),
        ].join(" ")}
        aria-hidden="true"
      >
        <Icon
          size={23}
          strokeWidth={1.9}
        />
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.statisticsKpiContent}>
        <span className={styles.statisticsKpiLabel}>
          {title}
        </span>


        <strong className={styles.statisticsKpiValue}>
          {formatInteger(
            value,
          )}
        </strong>


        <NumberTrend
          comparison={comparison}
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   REVENUE KPI CARD
   ========================================================================== */

function StatisticsRevenueKpiCard({
  kpis,
}: {
  readonly kpis:
    ManagerStatisticsKpis;
}) {
  const revenue =
    kpis.revenue;


  const accessibleValue =
    revenue.current.length >
    0
      ? revenue.current
          .map(
            formatMoney,
          )
          .join(
            ", ",
          )
      : "0";


  return (
    <article
      className={styles.statisticsKpiCard}
      aria-label={`Chiffre d’affaires : ${accessibleValue}`}
    >
      {/* ==================================================================
          ICON
          ================================================================== */}

      <div
        className={[
          styles.statisticsKpiIcon,
          styles.statisticsKpiIconPrimary,
        ].join(" ")}
        aria-hidden="true"
      >
        <CircleDollarSign
          size={23}
          strokeWidth={1.9}
        />
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.statisticsKpiContent}>
        <span className={styles.statisticsKpiLabel}>
          Chiffre d’affaires
        </span>


        <RevenueValues
          values={revenue.current}
        />


        <RevenueTrend
          comparisons={revenue.comparisons}
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function StatisticsKpiGrid({
  kpis,
}: StatisticsKpiGridProps) {
  return (
    <section
      className={styles.statisticsKpiSection}
      aria-labelledby="statistics-kpis-title"
    >
      {/* ==================================================================
          ACCESSIBLE TITLE
          ================================================================== */}

      <h2
        id="statistics-kpis-title"
        className={styles.statisticsVisuallyHidden}
      >
        Indicateurs principaux de la période
      </h2>


      {/* ==================================================================
          GRID
          ================================================================== */}

      <div className={styles.statisticsKpiGrid}>
        {/* ================================================================
            REVENUE
            ================================================================ */}

        <StatisticsRevenueKpiCard
          kpis={kpis}
        />


        {/* ================================================================
            ORDERS
            ================================================================ */}

        <StatisticsNumberKpiCard
          title="Commandes"
          value={kpis.orders.current}
          comparison={kpis.orders}
          icon={ShoppingBag}
          tone="blue"
          valueLabel={
            formatInteger(
              kpis.orders.current,
            )
          }
        />


        {/* ================================================================
            CUSTOMERS
            ================================================================ */}

        <StatisticsNumberKpiCard
          title="Clients"
          value={kpis.customers.current}
          comparison={kpis.customers}
          icon={UsersRound}
          tone="green"
          valueLabel={
            formatInteger(
              kpis.customers.current,
            )
          }
        />


        {/* ================================================================
            PRODUCTS SOLD
            ================================================================ */}

        <StatisticsNumberKpiCard
          title="Produits vendus"
          value={kpis.productsSold.current}
          comparison={kpis.productsSold}
          icon={PackageCheck}
          tone="orange"
          valueLabel={
            formatInteger(
              kpis.productsSold.current,
            )
          }
        />


        {/* ================================================================
            DELIVERIES
            ================================================================ */}

        <StatisticsNumberKpiCard
          title="Livraisons"
          value={kpis.deliveries.current}
          comparison={kpis.deliveries}
          icon={Truck}
          tone="purple"
          valueLabel={
            formatInteger(
              kpis.deliveries.current,
            )
          }
        />
      </div>
    </section>
  );
}