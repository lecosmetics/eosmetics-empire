import type {
  ReactNode,
} from "react";

import {
  BarChart3,
  ChartNoAxesCombined,
  CircleDollarSign,
  MapPinned,
  PieChart,
  Shapes,
  type LucideIcon,
} from "lucide-react";

import {
  getManagerStatisticsOrderStatusLabel,
  getManagerStatisticsPaymentMethodLabel,
  type ManagerStatisticsCategorySalesItem,
  type ManagerStatisticsCityPerformanceItem,
  type ManagerStatisticsMoney,
  type ManagerStatisticsOrderStatusDistributionItem,
  type ManagerStatisticsPaymentDistributionItem,
  type ManagerStatisticsRevenueSeries,
} from "@/lib/gestionnaire/statistiques/statistics-types";

import styles from "@/app/gestionnaire/(espace-prive)/statistiques/statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — GRAPHIQUES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/statistiques/StatisticsCharts.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher l'évolution réelle du chiffre d'affaires ;
 * - afficher la répartition réelle des commandes ;
 * - afficher les ventes réelles par catégorie ;
 * - afficher la répartition réelle des paiements ;
 * - afficher la performance réelle par ville ;
 * - rester indépendant de Prisma et de la session ;
 * - rester compatible avec les données sérialisées côté serveur.
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - recevoir un storeId ;
 * - inventer des données ;
 * - inventer des catégories ;
 * - inventer des modes de paiement ;
 * - mélanger plusieurs devises ;
 * - modifier une variable pendant le rendu React ;
 * - ajouter de dépendance graphique.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES — REVENUE CHART
   ========================================================================== */

const REVENUE_CHART_WIDTH =
  760;

const REVENUE_CHART_HEIGHT =
  260;

const REVENUE_CHART_PADDING_LEFT =
  56;

const REVENUE_CHART_PADDING_RIGHT =
  20;

const REVENUE_CHART_PADDING_TOP =
  22;

const REVENUE_CHART_PADDING_BOTTOM =
  42;

const REVENUE_GRID_LINES =
  4;


/* ==========================================================================
   CONSTANTES — DONUT
   ========================================================================== */

const DONUT_RADIUS =
  44;

const DONUT_CIRCUMFERENCE =
  2 *
  Math.PI *
  DONUT_RADIUS;


/* ==========================================================================
   TONS GRAPHIQUES
   ========================================================================== */

const CHART_TONE_CLASSES = [
  styles.statisticsChartTone1,
  styles.statisticsChartTone2,
  styles.statisticsChartTone3,
  styles.statisticsChartTone4,
  styles.statisticsChartTone5,
  styles.statisticsChartTone6,
  styles.statisticsChartTone7,
  styles.statisticsChartTone8,
] as const;


/* ==========================================================================
   FORMATTERS
   ========================================================================== */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const COMPACT_NUMBER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      notation:
        "compact",

      maximumFractionDigits:
        1,
    },
  );


/* ==========================================================================
   NUMBER HELPERS
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

  return INTEGER_FORMATTER.format(
    value,
  );
}


function formatCompactNumber(
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

  return COMPACT_NUMBER_FORMATTER.format(
    value,
  );
}


/* ==========================================================================
   MONEY HELPERS
   ========================================================================== */

function parseMoneyAmount(
  amount:
    string,
): number {
  const value =
    Number(
      amount,
    );

  return Number.isFinite(
    value,
  )
    ? value
    : 0;
}


function formatMoney({
  amount,
  currency,
}: ManagerStatisticsMoney): string {
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
   PERCENTAGE HELPERS
   ========================================================================== */

function clampPercentage(
  percentage:
    number,
): number {
  if (
    !Number.isFinite(
      percentage,
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      percentage,
    ),
  );
}


function formatPercentage(
  percentage:
    number,
): string {
  const normalized =
    Number.isFinite(
      percentage,
    )
      ? percentage
      : 0;

  return `${new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        1,
    },
  ).format(
    normalized,
  )}%`;
}


/* ==========================================================================
   TONE HELPERS
   ========================================================================== */

function getChartToneClass(
  index:
    number,
): string {
  return CHART_TONE_CLASSES[
    index %
      CHART_TONE_CLASSES.length
  ];
}


/* ==========================================================================
   MAXIMUM VALUE
   ========================================================================== */

function getMaximumValue(
  values:
    readonly number[],
): number {
  let maximum =
    0;

  for (
    const value of
    values
  ) {
    if (
      Number.isFinite(
        value,
      ) &&
      value >
        maximum
    ) {
      maximum =
        value;
    }
  }

  return maximum;
}


/* ==========================================================================
   EMPTY GRAPH
   ========================================================================== */

function StatisticsChartEmpty({
  message,
}: {
  readonly message:
    string;
}) {
  return (
    <div className={styles.statisticsChartEmpty}>
      <BarChart3
        size={27}
        strokeWidth={1.7}
        aria-hidden="true"
      />

      <p>
        {message}
      </p>
    </div>
  );
}


/* ==========================================================================
   CARD HEADER
   ========================================================================== */

function StatisticsChartCardHeader({
  title,
  subtitle,
  icon: Icon,
  trailing,
}: {
  readonly title:
    string;

  readonly subtitle?:
    string;

  readonly icon:
    LucideIcon;

  readonly trailing?:
    ReactNode;
}) {
  return (
    <div className={styles.statisticsChartCardHeader}>
      <div className={styles.statisticsChartCardHeading}>
        <span
          className={styles.statisticsChartCardIcon}
          aria-hidden="true"
        >
          <Icon
            size={18}
            strokeWidth={1.9}
          />
        </span>

        <div className={styles.statisticsChartCardTitleGroup}>
          <h2 className={styles.statisticsChartCardTitle}>
            {title}
          </h2>

          {subtitle ? (
            <p className={styles.statisticsChartCardSubtitle}>
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {trailing ? (
        <div className={styles.statisticsChartCardTrailing}>
          {trailing}
        </div>
      ) : null}
    </div>
  );
}


/* ==========================================================================
   REVENUE — POSITION X
   ========================================================================== */

function getRevenuePointX(
  index:
    number,
  total:
    number,
): number {
  const availableWidth =
    REVENUE_CHART_WIDTH -
    REVENUE_CHART_PADDING_LEFT -
    REVENUE_CHART_PADDING_RIGHT;

  if (
    total <=
    1
  ) {
    return (
      REVENUE_CHART_PADDING_LEFT +
      availableWidth /
        2
    );
  }

  return (
    REVENUE_CHART_PADDING_LEFT +
    (
      index /
      (
        total -
        1
      )
    ) *
      availableWidth
  );
}


/* ==========================================================================
   REVENUE — POSITION Y
   ========================================================================== */

function getRevenuePointY(
  value:
    number,
  maximum:
    number,
): number {
  const availableHeight =
    REVENUE_CHART_HEIGHT -
    REVENUE_CHART_PADDING_TOP -
    REVENUE_CHART_PADDING_BOTTOM;

  if (
    maximum <=
    0
  ) {
    return (
      REVENUE_CHART_PADDING_TOP +
      availableHeight
    );
  }

  return (
    REVENUE_CHART_PADDING_TOP +
    (
      1 -
      value /
        maximum
    ) *
      availableHeight
  );
}


/* ==========================================================================
   REVENUE — LINE PATH
   ========================================================================== */

function buildRevenueLinePath(
  values:
    readonly number[],
  maximum:
    number,
): string {
  return values
    .map(
      (
        value,
        index,
      ) => {
        const x =
          getRevenuePointX(
            index,
            values.length,
          );

        const y =
          getRevenuePointY(
            value,
            maximum,
          );

        return `${
          index ===
          0
            ? "M"
            : "L"
        } ${x.toFixed(2)} ${y.toFixed(2)}`;
      },
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   REVENUE — AREA PATH
   ========================================================================== */

function buildRevenueAreaPath(
  values:
    readonly number[],
  maximum:
    number,
): string {
  if (
    values.length ===
    0
  ) {
    return "";
  }

  const baselineY =
    REVENUE_CHART_HEIGHT -
    REVENUE_CHART_PADDING_BOTTOM;

  const firstX =
    getRevenuePointX(
      0,
      values.length,
    );

  const lastX =
    getRevenuePointX(
      values.length -
        1,
      values.length,
    );

  const linePath =
    buildRevenueLinePath(
      values,
      maximum,
    );

  return [
    `M ${firstX.toFixed(2)} ${baselineY.toFixed(2)}`,

    linePath.replace(
      /^M/,
      "L",
    ),

    `L ${lastX.toFixed(2)} ${baselineY.toFixed(2)}`,

    "Z",
  ].join(
    " ",
  );
}


/* ==========================================================================
   REVENUE — LABEL VISIBILITY
   ========================================================================== */

function shouldDisplayRevenueLabel(
  index:
    number,
  total:
    number,
): boolean {
  if (
    total <=
    7
  ) {
    return true;
  }

  const interval =
    Math.max(
      1,
      Math.ceil(
        total /
          6,
      ),
    );

  return (
    index ===
      0 ||
    index ===
      total -
        1 ||
    index %
      interval ===
      0
  );
}


/* ==========================================================================
   REVENUE SERIES
   ========================================================================== */

function RevenueSeriesChart({
  series,
}: {
  readonly series:
    ManagerStatisticsRevenueSeries;
}) {
  const values =
    series.points.map(
      (
        point,
      ) =>
        parseMoneyAmount(
          point.amount,
        ),
    );

  const maximum =
    getMaximumValue(
      values,
    );

  /**
   * Si tous les montants sont à zéro,
   * on conserve un maximum à zéro.
   *
   * getRevenuePointY() sait gérer ce cas.
   *
   * Cela évite d'afficher artificiellement une échelle 1 / 0,75 / 0,5...
   * alors que le chiffre d'affaires réel est nul.
   */
  const chartMaximum =
    maximum >
    0
      ? maximum
      : 0;

  const linePath =
    buildRevenueLinePath(
      values,
      chartMaximum,
    );

  const areaPath =
    buildRevenueAreaPath(
      values,
      chartMaximum,
    );

  return (
    <div className={styles.statisticsRevenueSeries}>
      <div className={styles.statisticsRevenueSeriesHeader}>
        <div>
          <span className={styles.statisticsRevenueCurrency}>
            {series.currency}
          </span>

          <span className={styles.statisticsRevenueGranularity}>
            {series.granularity ===
            "day"
              ? "Par jour"
              : series.granularity ===
                  "week"
                ? "Par semaine"
                : "Par mois"}
          </span>
        </div>
      </div>

      <div className={styles.statisticsRevenueChartViewport}>
        <svg
          className={styles.statisticsRevenueChart}
          viewBox={`0 0 ${REVENUE_CHART_WIDTH} ${REVENUE_CHART_HEIGHT}`}
          role="img"
          aria-label={`Évolution du chiffre d’affaires en ${series.currency}`}
          preserveAspectRatio="none"
        >
          <title>
            Évolution du chiffre d’affaires en {series.currency}
          </title>

          {/* ==============================================================
              GRID + Y AXIS
              ============================================================== */}

          {Array.from(
            {
              length:
                REVENUE_GRID_LINES +
                1,
            },
            (
              _value,
              index,
            ) => {
              const ratio =
                index /
                REVENUE_GRID_LINES;

              const y =
                REVENUE_CHART_PADDING_TOP +
                ratio *
                  (
                    REVENUE_CHART_HEIGHT -
                    REVENUE_CHART_PADDING_TOP -
                    REVENUE_CHART_PADDING_BOTTOM
                  );

              const value =
                chartMaximum *
                (
                  1 -
                  ratio
                );

              return (
                <g key={index}>
                  <line
                    x1={REVENUE_CHART_PADDING_LEFT}
                    x2={
                      REVENUE_CHART_WIDTH -
                      REVENUE_CHART_PADDING_RIGHT
                    }
                    y1={y}
                    y2={y}
                    className={styles.statisticsRevenueGridLine}
                  />

                  <text
                    x={
                      REVENUE_CHART_PADDING_LEFT -
                      9
                    }
                    y={
                      y +
                      4
                    }
                    textAnchor="end"
                    className={styles.statisticsRevenueAxisText}
                  >
                    {formatCompactNumber(
                      value,
                    )}
                  </text>
                </g>
              );
            },
          )}

          {/* ==============================================================
              AREA
              ============================================================== */}

          {areaPath ? (
            <path
              d={areaPath}
              className={styles.statisticsRevenueArea}
            />
          ) : null}

          {/* ==============================================================
              LINE
              ============================================================== */}

          {linePath ? (
            <path
              d={linePath}
              className={styles.statisticsRevenueLine}
              fill="none"
            />
          ) : null}

          {/* ==============================================================
              POINTS + X LABELS
              ============================================================== */}

          {series.points.map(
            (
              point,
              index,
            ) => {
              const value =
                values[index];

              const x =
                getRevenuePointX(
                  index,
                  values.length,
                );

              const y =
                getRevenuePointY(
                  value,
                  chartMaximum,
                );

              return (
                <g key={point.key}>
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    className={styles.statisticsRevenuePoint}
                  >
                    <title>
                      {point.label}
                      {" : "}
                      {formatMoney({
                        amount:
                          point.amount,

                        currency:
                          series.currency,
                      })}
                    </title>
                  </circle>

                  {shouldDisplayRevenueLabel(
                    index,
                    series.points.length,
                  ) ? (
                    <text
                      x={x}
                      y={
                        REVENUE_CHART_HEIGHT -
                        16
                      }
                      textAnchor={
                        index ===
                        0
                          ? "start"
                          : index ===
                              series.points.length -
                                1
                            ? "end"
                            : "middle"
                      }
                      className={styles.statisticsRevenueAxisText}
                    >
                      {point.label}
                    </text>
                  ) : null}
                </g>
              );
            },
          )}
        </svg>
      </div>
    </div>
  );
}


/* ==========================================================================
   REVENUE CARD
   ========================================================================== */

export function RevenueChartCard({
  series,
}: {
  readonly series:
    readonly ManagerStatisticsRevenueSeries[];
}) {
  return (
    <section className={styles.statisticsChartCard}>
      <StatisticsChartCardHeader
        title="Évolution du chiffre d’affaires"
        subtitle="Revenus réellement encaissés sur la période"
        icon={ChartNoAxesCombined}
      />

      <div className={styles.statisticsChartCardBody}>
        {series.length ===
        0 ? (
          <StatisticsChartEmpty
            message="Aucun chiffre d’affaires encaissé sur cette période."
          />
        ) : (
          <div className={styles.statisticsRevenueSeriesList}>
            {series.map(
              (
                revenueSeries,
              ) => (
                <RevenueSeriesChart
                  key={revenueSeries.currency}
                  series={revenueSeries}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   DONUT TYPES
   ========================================================================== */

interface DonutSegment {
  readonly key:
    string;

  readonly label:
    string;

  readonly value:
    number;

  readonly percentage:
    number;
}


interface RenderedDonutSegment {
  readonly segment:
    DonutSegment;

  readonly index:
    number;

  readonly percentage:
    number;

  readonly segmentLength:
    number;

  readonly remainingLength:
    number;

  readonly offset:
    number;
}


/* ==========================================================================
   DONUT — PREPARATION
   ========================================================================== */

/**
 * Construit tous les paramètres SVG AVANT le JSX.
 *
 * Aucun compteur mutable n'est modifié pendant le rendu React.
 *
 * Cela évite notamment :
 *
 * react-hooks/immutability
 *
 * "Cannot reassign variable after render completes"
 */

function buildRenderedDonutSegments(
  segments:
    readonly DonutSegment[],
): readonly RenderedDonutSegment[] {
  return segments.map(
    (
      segment,
      index,
    ) => {
      const percentage =
        clampPercentage(
          segment.percentage,
        );

      const consumedPercentage =
        segments
          .slice(
            0,
            index,
          )
          .reduce(
            (
              total,
              previousSegment,
            ) =>
              total +
              clampPercentage(
                previousSegment.percentage,
              ),
            0,
          );

      const segmentLength =
        DONUT_CIRCUMFERENCE *
        (
          percentage /
          100
        );

      const remainingLength =
        Math.max(
          0,
          DONUT_CIRCUMFERENCE -
            segmentLength,
        );

      const offset =
        -DONUT_CIRCUMFERENCE *
        (
          consumedPercentage /
          100
        );

      return {
        segment,

        index,

        percentage,

        segmentLength,

        remainingLength,

        offset,
      };
    },
  );
}


/* ==========================================================================
   DONUT
   ========================================================================== */

function StatisticsDonut({
  segments,
  centerValue,
  centerLabel,
  ariaLabel,
}: {
  readonly segments:
    readonly DonutSegment[];

  readonly centerValue:
    string;

  readonly centerLabel:
    string;

  readonly ariaLabel:
    string;
}) {
  const renderedSegments =
    buildRenderedDonutSegments(
      segments,
    );

  return (
    <div className={styles.statisticsDonutLayout}>
      {/* ==================================================================
          SVG
          ================================================================== */}

      <div className={styles.statisticsDonutChartWrapper}>
        <svg
          viewBox="0 0 120 120"
          className={styles.statisticsDonutChart}
          role="img"
          aria-label={ariaLabel}
        >
          <title>
            {ariaLabel}
          </title>

          <circle
            cx="60"
            cy="60"
            r={DONUT_RADIUS}
            className={styles.statisticsDonutTrack}
          />

          {renderedSegments.map(
            ({
              segment,
              index,
              percentage,
              segmentLength,
              remainingLength,
              offset,
            }) => (
              <circle
                key={segment.key}
                cx="60"
                cy="60"
                r={DONUT_RADIUS}
                className={[
                  styles.statisticsDonutSegment,
                  getChartToneClass(
                    index,
                  ),
                ].join(" ")}
                strokeDasharray={`${segmentLength} ${remainingLength}`}
                strokeDashoffset={offset}
                transform="rotate(-90 60 60)"
              >
                <title>
                  {segment.label}
                  {" : "}
                  {formatInteger(
                    segment.value,
                  )}
                  {" ("}
                  {formatPercentage(
                    percentage,
                  )}
                  {")"}
                </title>
              </circle>
            ),
          )}

          <text
            x="60"
            y="57"
            textAnchor="middle"
            className={styles.statisticsDonutCenterValue}
          >
            {centerValue}
          </text>

          <text
            x="60"
            y="72"
            textAnchor="middle"
            className={styles.statisticsDonutCenterLabel}
          >
            {centerLabel}
          </text>
        </svg>
      </div>

      {/* ==================================================================
          LEGEND
          ================================================================== */}

      <div className={styles.statisticsChartLegend}>
        {segments.map(
          (
            segment,
            index,
          ) => (
            <div
              key={segment.key}
              className={styles.statisticsChartLegendItem}
            >
              <span
                className={[
                  styles.statisticsChartLegendDot,
                  getChartToneClass(
                    index,
                  ),
                ].join(" ")}
                aria-hidden="true"
              />

              <span className={styles.statisticsChartLegendLabel}>
                {segment.label}
              </span>

              <strong className={styles.statisticsChartLegendValue}>
                {formatInteger(
                  segment.value,
                )}

                {" · "}

                {formatPercentage(
                  segment.percentage,
                )}
              </strong>
            </div>
          ),
        )}
      </div>
    </div>
  );
}


/* ==========================================================================
   ORDERS DISTRIBUTION
   ========================================================================== */

export function OrdersDistributionCard({
  distribution,
}: {
  readonly distribution:
    readonly ManagerStatisticsOrderStatusDistributionItem[];
}) {
  const totalOrders =
    distribution.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.count,
      0,
    );

  const segments:
    DonutSegment[] =
      distribution.map(
        (
          item,
        ) => ({
          key:
            item.status,

          label:
            getManagerStatisticsOrderStatusLabel(
              item.status,
            ),

          value:
            item.count,

          percentage:
            item.percentage,
        }),
      );

  return (
    <section className={styles.statisticsChartCard}>
      <StatisticsChartCardHeader
        title="Répartition des commandes"
        subtitle="Commandes par statut réel"
        icon={PieChart}
      />

      <div className={styles.statisticsChartCardBody}>
        {segments.length ===
        0 ? (
          <StatisticsChartEmpty
            message="Aucune commande sur cette période."
          />
        ) : (
          <StatisticsDonut
            segments={segments}
            centerValue={
              formatInteger(
                totalOrders,
              )
            }
            centerLabel={
              totalOrders >
              1
                ? "commandes"
                : "commande"
            }
            ariaLabel="Répartition des commandes par statut"
          />
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   CATEGORY SALES
   ========================================================================== */

export function CategorySalesCard({
  categories,
}: {
  readonly categories:
    readonly ManagerStatisticsCategorySalesItem[];
}) {
  return (
    <section className={styles.statisticsChartCard}>
      <StatisticsChartCardHeader
        title="Ventes par catégorie"
        subtitle="Répartition réelle des unités vendues"
        icon={Shapes}
      />

      <div className={styles.statisticsChartCardBody}>
        {categories.length ===
        0 ? (
          <StatisticsChartEmpty
            message="Aucune vente par catégorie sur cette période."
          />
        ) : (
          <div className={styles.statisticsBarsList}>
            {categories.map(
              (
                category,
                index,
              ) => {
                const label =
                  category.categoryName ??
                  "Sans catégorie";

                const percentage =
                  clampPercentage(
                    category.quantitySharePercentage,
                  );

                return (
                  <div
                    key={
                      category.categoryId ??
                      "__uncategorized__"
                    }
                    className={styles.statisticsBarItem}
                  >
                    <div className={styles.statisticsBarHeader}>
                      <span className={styles.statisticsBarLabel}>
                        {label}
                      </span>

                      <span className={styles.statisticsBarValue}>
                        {formatInteger(
                          category.quantitySold,
                        )}

                        {" · "}

                        {formatPercentage(
                          percentage,
                        )}
                      </span>
                    </div>

                    <div
                      className={styles.statisticsBarTrack}
                      role="progressbar"
                      aria-label={`${label} : ${formatInteger(
                        category.quantitySold,
                      )} unité(s), ${formatPercentage(
                        percentage,
                      )}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                    >
                      <span
                        className={[
                          styles.statisticsBarFill,
                          getChartToneClass(
                            index,
                          ),
                        ].join(" ")}
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   PAYMENT DISTRIBUTION
   ========================================================================== */

export function PaymentDistributionCard({
  distribution,
}: {
  readonly distribution:
    readonly ManagerStatisticsPaymentDistributionItem[];
}) {
  const totalPayments =
    distribution.reduce(
      (
        total,
        item,
      ) =>
        total +
        item.count,
      0,
    );

  const segments:
    DonutSegment[] =
      distribution.map(
        (
          item,
        ) => ({
          key:
            item.method,

          label:
            getManagerStatisticsPaymentMethodLabel(
              item.method,
            ),

          value:
            item.count,

          percentage:
            item.percentage,
        }),
      );

  return (
    <section className={styles.statisticsChartCard}>
      <StatisticsChartCardHeader
        title="Répartition des paiements"
        subtitle="Paiements encaissés par mode"
        icon={CircleDollarSign}
      />

      <div className={styles.statisticsChartCardBody}>
        {segments.length ===
        0 ? (
          <StatisticsChartEmpty
            message="Aucun paiement encaissé sur cette période."
          />
        ) : (
          <>
            <StatisticsDonut
              segments={segments}
              centerValue={
                formatInteger(
                  totalPayments,
                )
              }
              centerLabel={
                totalPayments >
                1
                  ? "paiements"
                  : "paiement"
              }
              ariaLabel="Répartition des paiements encaissés par mode"
            />

            <div className={styles.statisticsPaymentTotals}>
              {distribution.map(
                (
                  item,
                ) => (
                  <div
                    key={item.method}
                    className={styles.statisticsPaymentTotalItem}
                  >
                    <span>
                      {getManagerStatisticsPaymentMethodLabel(
                        item.method,
                      )}
                    </span>

                    <div className={styles.statisticsPaymentTotalValues}>
                      {item.totals.length ===
                      0 ? (
                        <strong>
                          —
                        </strong>
                      ) : (
                        item.totals.map(
                          (
                            money,
                          ) => (
                            <strong key={money.currency}>
                              {formatMoney(
                                money,
                              )}
                            </strong>
                          ),
                        )
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   CITY — SINGLE REVENUE CURRENCY
   ========================================================================== */

function getSingleCityRevenueCurrency(
  cities:
    readonly ManagerStatisticsCityPerformanceItem[],
): string | null {
  const currencies =
    new Set<string>();

  for (
    const city of
    cities
  ) {
    for (
      const money of
      city.revenue
    ) {
      currencies.add(
        money.currency,
      );

      if (
        currencies.size >
        1
      ) {
        return null;
      }
    }
  }

  if (
    currencies.size !==
    1
  ) {
    return null;
  }

  return Array.from(
    currencies,
  )[0];
}


/* ==========================================================================
   CITY — REVENUE MONEY
   ========================================================================== */

function getCityRevenueMoney(
  city:
    ManagerStatisticsCityPerformanceItem,
  currency:
    string,
): ManagerStatisticsMoney | null {
  return (
    city.revenue.find(
      (
        entry,
      ) =>
        entry.currency ===
        currency,
    ) ??
    null
  );
}


/* ==========================================================================
   CITY — REVENUE VALUE
   ========================================================================== */

function getCityRevenueValue(
  city:
    ManagerStatisticsCityPerformanceItem,
  currency:
    string,
): number {
  const money =
    getCityRevenueMoney(
      city,
      currency,
    );

  return money
    ? parseMoneyAmount(
        money.amount,
      )
    : 0;
}


/* ==========================================================================
   CITY PERFORMANCE
   ========================================================================== */

export function CityPerformanceCard({
  cities,
}: {
  readonly cities:
    readonly ManagerStatisticsCityPerformanceItem[];
}) {
  const revenueCurrency =
    getSingleCityRevenueCurrency(
      cities,
    );

  /**
   * Une seule devise présente :
   *
   * → barres basées sur le chiffre d'affaires.
   *
   * Plusieurs devises ou aucune devise :
   *
   * → barres basées sur le nombre réel de commandes.
   *
   * Ainsi aucune conversion ou addition monétaire artificielle
   * n'est effectuée.
   */

  const metric:
    "revenue" |
    "orders" =
      revenueCurrency
        ? "revenue"
        : "orders";

  const values =
    cities.map(
      (
        city,
      ) => {
        if (
          metric ===
            "revenue" &&
          revenueCurrency
        ) {
          return getCityRevenueValue(
            city,
            revenueCurrency,
          );
        }

        return city.ordersCount;
      },
    );

  const maximum =
    getMaximumValue(
      values,
    );

  return (
    <section className={styles.statisticsChartCard}>
      <StatisticsChartCardHeader
        title="Performance par ville"
        subtitle={
          metric ===
            "revenue" &&
          revenueCurrency
            ? `Chiffre d’affaires en ${revenueCurrency}`
            : "Nombre réel de commandes"
        }
        icon={MapPinned}
        trailing={
          <span className={styles.statisticsChartMetricBadge}>
            {metric ===
            "revenue"
              ? "Chiffre d’affaires"
              : "Commandes"}
          </span>
        }
      />

      <div className={styles.statisticsChartCardBody}>
        {cities.length ===
        0 ? (
          <StatisticsChartEmpty
            message="Aucune ville exploitable sur cette période."
          />
        ) : (
          <div className={styles.statisticsCityBars}>
            {cities.map(
              (
                city,
                index,
              ) => {
                const value =
                  values[index] ??
                  0;

                const percentage =
                  maximum >
                  0
                    ? clampPercentage(
                        (
                          value /
                          maximum
                        ) *
                          100,
                      )
                    : 0;

                let valueLabel:
                  string;

                if (
                  metric ===
                    "revenue" &&
                  revenueCurrency
                ) {
                  const revenue =
                    getCityRevenueMoney(
                      city,
                      revenueCurrency,
                    );

                  valueLabel =
                    revenue
                      ? formatMoney(
                          revenue,
                        )
                      : formatMoney({
                          amount:
                            "0",

                          currency:
                            revenueCurrency,
                        });
                } else {
                  valueLabel =
                    `${formatInteger(
                      city.ordersCount,
                    )} ${
                      city.ordersCount >
                      1
                        ? "commandes"
                        : "commande"
                    }`;
                }

                return (
                  <div
                    key={city.city}
                    className={styles.statisticsCityBarItem}
                  >
                    <div className={styles.statisticsCityBarHeader}>
                      <div className={styles.statisticsCityName}>
                        <span>
                          {city.city}
                        </span>

                        <small>
                          {formatInteger(
                            city.productsSold,
                          )}{" "}
                          unité
                          {city.productsSold >
                          1
                            ? "s"
                            : ""}{" "}
                          vendue
                          {city.productsSold >
                          1
                            ? "s"
                            : ""}
                        </small>
                      </div>

                      <strong className={styles.statisticsCityValue}>
                        {valueLabel}
                      </strong>
                    </div>

                    <div
                      className={styles.statisticsCityBarTrack}
                      role="progressbar"
                      aria-label={`${city.city} : ${valueLabel}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percentage}
                    >
                      <span
                        className={[
                          styles.statisticsCityBarFill,
                          getChartToneClass(
                            index,
                          ),
                        ].join(" ")}
                        style={{
                          width:
                            `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
    </section>
  );
}