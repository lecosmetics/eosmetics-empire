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
 * Ce fichier contient uniquement les graphiques nécessaires à la page :
 *
 * - RevenueChartCard ;
 * - OrdersDistributionCard ;
 * - CategorySalesCard ;
 * - PaymentDistributionCard ;
 * - CityPerformanceCard.
 *
 *
 * IMPORTANT :
 *
 * - aucune requête Prisma ;
 * - aucune lecture de session ;
 * - aucun storeId reçu ;
 * - aucun calcul métier sensible ;
 * - aucune donnée fictive ;
 * - aucune bibliothèque graphique supplémentaire ;
 * - aucune catégorie inventée ;
 * - aucun statut inventé ;
 * - aucune devise mélangée.
 *
 *
 * Les données reçues ici sont déjà :
 *
 * - autorisées ;
 * - filtrées ;
 * - agrégées ;
 * - sérialisées ;
 *
 * par statistics-query.ts.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES GRAPHIQUE CA
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
   CONSTANTES DONUT
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

/**
 * Les couleurs réelles seront centralisées dans statistiques.module.css.
 *
 * Chaque classe définit :
 *
 * --statistics-chart-tone
 *
 * afin que le même ton puisse servir :
 *
 * - au donut ;
 * - à la légende ;
 * - aux barres ;
 * - aux indicateurs.
 */

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
   HELPERS — NUMBER
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
   HELPERS — MONEY
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
    parseMoneyAmount(
      amount,
    );


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
    return `${numericAmount.toLocaleString("fr-FR")} ${currency}`;
  }
}


/* ==========================================================================
   HELPERS — PERCENTAGE
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
  return `${new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        1,
    },
  ).format(
    percentage,
  )}%`;
}


/* ==========================================================================
   HELPERS — TONE
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
   HELPERS — MAX
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
    typeof ChartNoAxesCombined;

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
   REVENUE — X
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
   REVENUE — Y
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
   REVENUE — PATH
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
   REVENUE — AREA
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
   REVENUE — X LABEL VISIBILITY
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
   REVENUE — SERIES CHART
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


  const safeMaximum =
    maximum >
    0
      ? maximum
      : 1;


  const linePath =
    buildRevenueLinePath(
      values,
      safeMaximum,
    );


  const areaPath =
    buildRevenueAreaPath(
      values,
      safeMaximum,
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
                safeMaximum *
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


          {areaPath ? (
            <path
              d={areaPath}
              className={styles.statisticsRevenueArea}
            />
          ) : null}


          {linePath ? (
            <path
              d={linePath}
              className={styles.statisticsRevenueLine}
              fill="none"
            />
          ) : null}


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
                  safeMaximum,
                );


              return (
                <g key={point.key}>
                  <circle
                    cx={x}
                    cy={y}
                    r={4}
                    className={styles.statisticsRevenuePoint}
                  />


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
   DONUT — SEGMENT
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


/* ==========================================================================
   DONUT — CUMULATIVE OFFSET
   ========================================================================== */

/**
 * Calcule de manière pure le pourcentage déjà consommé par les segments
 * précédents.
 *
 * IMPORTANT :
 *
 * On n'utilise volontairement aucune variable mutable déclarée dans le
 * composant React. Cela évite :
 *
 * react-hooks/immutability
 *
 * et garantit qu'un nouveau rendu repart toujours uniquement des props.
 */

function getConsumedPercentageBeforeIndex(
  segments:
    readonly DonutSegment[],
  index:
    number,
): number {
  const consumed =
    segments
      .slice(
        0,
        index,
      )
      .reduce(
        (
          total,
          segment,
        ) =>
          total +
          clampPercentage(
            segment.percentage,
          ),
        0,
      );


  return clampPercentage(
    consumed,
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
  return (
    <div className={styles.statisticsDonutLayout}>
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


          {segments.map(
            (
              segment,
              index,
            ) => {
              const percentage =
                clampPercentage(
                  segment.percentage,
                );


              const segmentLength =
                DONUT_CIRCUMFERENCE *
                (
                  percentage /
                  100
                );


              const consumedPercentage =
                getConsumedPercentageBeforeIndex(
                  segments,
                  index,
                );


              const offset =
                -DONUT_CIRCUMFERENCE *
                (
                  consumedPercentage /
                  100
                );


              return (
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
                  strokeDasharray={`${segmentLength} ${DONUT_CIRCUMFERENCE - segmentLength}`}
                  strokeDashoffset={offset}
                  transform="rotate(-90 60 60)"
                  aria-hidden="true"
                />
              );
            },
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
   CITY — SINGLE CURRENCY
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
   CITY — REVENUE VALUE
   ========================================================================== */

function getCityRevenueValue(
  city:
    ManagerStatisticsCityPerformanceItem,
  currency:
    string,
): number {
  const money =
    city.revenue.find(
      (
        entry,
      ) =>
        entry.currency ===
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
      ) =>
        metric ===
        "revenue"
          ? getCityRevenueValue(
              city,
              revenueCurrency as string,
            )
          : city.ordersCount,
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
          "revenue"
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
                  values[index];


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


                const valueLabel =
                  metric ===
                  "revenue" &&
                  revenueCurrency
                    ? formatMoney({
                        amount:
                          String(
                            value,
                          ),

                        currency:
                          revenueCurrency,
                      })
                    : `${formatInteger(
                        city.ordersCount,
                      )} ${
                        city.ordersCount >
                        1
                          ? "commandes"
                          : "commande"
                      }`;


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
                            : ""} vendue
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