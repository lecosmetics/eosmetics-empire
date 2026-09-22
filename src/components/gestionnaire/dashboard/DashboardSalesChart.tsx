"use client";

import {
  BarChart3,
  ChevronDown,
} from "lucide-react";

import {
  useId,
  useMemo,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DashboardSalesChartPoint,
} from "@/server/gestionnaire/dashboard/dashboard";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD SALES CHART
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/DashboardSalesChart.tsx

   RESPONSABILITÉS :

   - afficher la carte "Vue d’ensemble des ventes" ;
   - afficher les données réelles reçues du serveur ;
   - permettre de consulter :
       • chiffre d’affaires ;
       • commandes ;
       • produits vendus ;
   - afficher un Area Chart responsive ;
   - afficher des tooltips lisibles ;
   - gérer les périodes sans données ;
   - rester utilisable sur desktop et mobile.

   IMPORTANT :

   Ce composant :
   - ne fait aucune requête Prisma ;
   - ne connaît aucun storeId ;
   - ne connaît aucun managerId ;
   - n'invente aucune donnée ;
   - ne modifie aucune donnée métier.

   Toutes les données sont déjà sécurisées et calculées par :

   src/server/gestionnaire/dashboard/dashboard.ts
   ============================================================ */


/* ============================================================
   METRICS
   ============================================================ */

export type DashboardSalesMetric =
  | "revenue"
  | "orders"
  | "productsSold";


/* ============================================================
   PROPS
   ============================================================ */

type DashboardSalesChartProps =
  Readonly<{
    data:
      readonly DashboardSalesChartPoint[];

    currency:
      string | null;
  }>;


/* ============================================================
   METRIC CONFIGURATION
   ============================================================ */

const METRICS:
  Readonly<
    Record<
      DashboardSalesMetric,
      Readonly<{
        label:
          string;

        emptyLabel:
          string;
      }>
    >
  > = {
  revenue: {
    label:
      "Chiffre d’affaires",

    emptyLabel:
      "Aucune vente pour cette période.",
  },

  orders: {
    label:
      "Commandes",

    emptyLabel:
      "Aucune commande pour cette période.",
  },

  productsSold: {
    label:
      "Produits vendus",

    emptyLabel:
      "Aucun produit vendu pour cette période.",
  },
};


/* ============================================================
   CHART COLORS
   ------------------------------------------------------------
   Couleurs Cosmetics Empire.

   Les autres couleurs générales seront centralisées ensuite
   dans dashboard.css.
   ============================================================ */

const CHART_ACCENT =
  "#ed006d";


const CHART_GRID =
  "#ececef";


const CHART_AXIS =
  "#7a7a85";


const CHART_TOOLTIP_BACKGROUND =
  "#ffffff";


/* ============================================================
   FORMATTERS
   ============================================================ */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const MONEY_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
    },
  );


/* ============================================================
   PARSE ISO DATE
   ------------------------------------------------------------
   Les points provenant du serveur utilisent :

   YYYY-MM-DD

   On les interprète volontairement en UTC pour éviter qu'une
   conversion de fuseau ne décale le jour affiché.
   ============================================================ */

function parseChartDate(
  value:
    string,
): Date | null {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return null;
  }


  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);


  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );


  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }


  return date;
}


/* ============================================================
   RANGE GRANULARITY
   ============================================================ */

function isLongRange(
  data:
    readonly DashboardSalesChartPoint[],
): boolean {
  if (
    data.length <
    2
  ) {
    return false;
  }


  const first =
    parseChartDate(
      data[0]?.date ??
        "",
    );


  const last =
    parseChartDate(
      data[
        data.length -
          1
      ]?.date ??
        "",
    );


  if (
    !first ||
    !last
  ) {
    return (
      data.length >
      92
    );
  }


  const duration =
    last.getTime() -
    first.getTime();


  return (
    duration >
    92 *
      24 *
      60 *
      60 *
      1000
  );
}


/* ============================================================
   FORMAT X AXIS DATE
   ============================================================ */

function formatAxisDate(
  value:
    string,

  longRange:
    boolean,
): string {
  const date =
    parseChartDate(
      value,
    );


  if (!date) {
    return value;
  }


  if (longRange) {
    return new Intl.DateTimeFormat(
      "fr-FR",
      {
        month:
          "short",

        year:
          "2-digit",

        timeZone:
          "UTC",
      },
    ).format(
      date,
    );
  }


  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

      timeZone:
        "UTC",
    },
  ).format(
    date,
  );
}


/* ============================================================
   FORMAT TOOLTIP DATE
   ============================================================ */

function formatTooltipDate(
  value:
    string,
): string {
  const date =
    parseChartDate(
      value,
    );


  if (!date) {
    return value;
  }


  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  ).format(
    date,
  );
}


/* ============================================================
   FORMAT MONEY
   ============================================================ */

function formatMoney(
  value:
    number,

  currency:
    string | null,
): string {
  const formatted =
    MONEY_FORMATTER.format(
      value,
    );


  if (!currency) {
    return formatted;
  }


  return `${formatted} ${currency}`;
}


/* ============================================================
   FORMAT INTEGER
   ============================================================ */

function formatInteger(
  value:
    number,
): string {
  return INTEGER_FORMATTER.format(
    Math.max(
      0,
      value,
    ),
  );
}


/* ============================================================
   FORMAT METRIC VALUE
   ============================================================ */

function formatMetricValue(
  value:
    number,

  metric:
    DashboardSalesMetric,

  currency:
    string | null,
): string {
  if (
    metric ===
    "revenue"
  ) {
    return formatMoney(
      value,
      currency,
    );
  }


  return formatInteger(
    value,
  );
}


/* ============================================================
   Y AXIS COMPACT FORMAT
   ============================================================ */

function formatCompactNumber(
  value:
    number,
): string {
  const absolute =
    Math.abs(
      value,
    );


  if (
    absolute >=
    1_000_000_000
  ) {
    return `${new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          1,
      },
    ).format(
      value /
        1_000_000_000,
    )} Md`;
  }


  if (
    absolute >=
    1_000_000
  ) {
    return `${new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          1,
      },
    ).format(
      value /
        1_000_000,
    )} M`;
  }


  if (
    absolute >=
    1_000
  ) {
    return `${new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          1,
      },
    ).format(
      value /
        1_000,
    )} k`;
  }


  return INTEGER_FORMATTER.format(
    value,
  );
}


/* ============================================================
   GET METRIC VALUE
   ============================================================ */

function getMetricValue(
  point:
    DashboardSalesChartPoint,

  metric:
    DashboardSalesMetric,
): number {
  switch (metric) {
    case "orders":
      return point.orders;

    case "productsSold":
      return point.productsSold;

    case "revenue":
    default:
      return point.revenue;
  }
}


/* ============================================================
   GET ACCESSIBLE SUMMARY
   ------------------------------------------------------------
   Les informations essentielles ne doivent pas dépendre
   uniquement du graphique.
   ============================================================ */

function getMetricTotal(
  data:
    readonly DashboardSalesChartPoint[],

  metric:
    DashboardSalesMetric,
): number {
  return data.reduce(
    (
      total,
      point,
    ) =>
      total +
      getMetricValue(
        point,
        metric,
      ),
    0,
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardSalesChart({
  data,
  currency,
}: DashboardSalesChartProps) {
  const [
    metric,
    setMetric,
  ] =
    useState<DashboardSalesMetric>(
      "revenue",
    );


  /*
   * useId évite les collisions entre gradients SVG
   * en cas de plusieurs instances du composant.
   */

  const reactId =
    useId();


  const gradientId =
    `dashboard-sales-gradient-${reactId.replace(
      /:/g,
      "",
    )}`;


  /* ==========================================================
     NORMALIZED CHART DATA
     ----------------------------------------------------------
     Recharts travaille plus simplement avec un tableau mutable.

     Les données reçues restent elles-mêmes immuables.
     ========================================================== */

  const chartData =
    useMemo(
      () =>
        data.map(
          (
            point,
          ) => ({
            date:
              point.date,

            revenue:
              point.revenue,

            orders:
              point.orders,

            productsSold:
              point.productsSold,
          }),
        ),
      [
        data,
      ],
    );


  const longRange =
    useMemo(
      () =>
        isLongRange(
          data,
        ),
      [
        data,
      ],
    );


  const metricTotal =
    useMemo(
      () =>
        getMetricTotal(
          data,
          metric,
        ),
      [
        data,
        metric,
      ],
    );


  const hasData =
    metricTotal >
    0;


  const metricLabel =
    METRICS[
      metric
    ].label;


  const accessibleTotal =
    formatMetricValue(
      metricTotal,
      metric,
      currency,
    );


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      className="gestionnaire-dashboard-sales"
      aria-labelledby="gestionnaire-dashboard-sales-title"
    >
      {/* ======================================================
          CARD HEADER
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-sales__header"
      >
        <div
          className="gestionnaire-dashboard-sales__heading"
        >
          <span
            className="gestionnaire-dashboard-sales__heading-icon"
            aria-hidden="true"
          >
            <BarChart3
              size={20}
              strokeWidth={1.8}
            />
          </span>

          <div>
            <h2
              id="gestionnaire-dashboard-sales-title"
              className="gestionnaire-dashboard-sales__title"
            >
              Vue d’ensemble des ventes
            </h2>

            <p
              className="gestionnaire-dashboard-sales__subtitle"
            >
              Évolution de l’activité sur la période sélectionnée.
            </p>
          </div>
        </div>


        {/* ====================================================
            METRIC SELECTOR
            ==================================================== */}

        <div
          className="gestionnaire-dashboard-sales__metric"
        >
          <label
            htmlFor="gestionnaire-dashboard-sales-metric"
            className="gestionnaire-dashboard-sales__metric-label"
          >
            Afficher
          </label>

          <div
            className="gestionnaire-dashboard-sales__metric-control"
          >
            <select
              id="gestionnaire-dashboard-sales-metric"
              className="gestionnaire-dashboard-sales__metric-select"
              value={
                metric
              }
              onChange={(
                event,
              ) => {
                setMetric(
                  event
                    .target
                    .value as
                    DashboardSalesMetric,
                );
              }}
              aria-label="Métrique du graphique des ventes"
            >
              <option
                value="revenue"
              >
                Chiffre d’affaires
              </option>

              <option
                value="orders"
              >
                Commandes
              </option>

              <option
                value="productsSold"
              >
                Produits vendus
              </option>
            </select>

            <ChevronDown
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
              className="gestionnaire-dashboard-sales__metric-chevron"
            />
          </div>
        </div>
      </div>


      {/* ======================================================
          ACCESSIBLE TEXT SUMMARY
          ====================================================== */}

      <p
        className="gestionnaire-dashboard-sales__sr-only"
      >
        {`${metricLabel} sur la période : ${accessibleTotal}.`}
      </p>


      {/* ======================================================
          CHART / EMPTY STATE
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-sales__chart-container"
      >
        {hasData ? (
          <div
            className="gestionnaire-dashboard-sales__chart"
            role="img"
            aria-label={`${metricLabel} sur la période sélectionnée. Total : ${accessibleTotal}.`}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={
                  chartData
                }
                margin={{
                  top:
                    18,

                  right:
                    8,

                  bottom:
                    2,

                  left:
                    0,
                }}
              >
                {/* ============================================
                    GRADIENT
                    ============================================ */}

                <defs>
                  <linearGradient
                    id={
                      gradientId
                    }
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={
                        CHART_ACCENT
                      }
                      stopOpacity={
                        0.18
                      }
                    />

                    <stop
                      offset="72%"
                      stopColor={
                        CHART_ACCENT
                      }
                      stopOpacity={
                        0.04
                      }
                    />

                    <stop
                      offset="100%"
                      stopColor={
                        CHART_ACCENT
                      }
                      stopOpacity={
                        0
                      }
                    />
                  </linearGradient>
                </defs>


                {/* ============================================
                    GRID
                    ============================================ */}

                <CartesianGrid
                  vertical={
                    false
                  }
                  stroke={
                    CHART_GRID
                  }
                  strokeDasharray="3 5"
                />


                {/* ============================================
                    X AXIS
                    ============================================ */}

                <XAxis
                  dataKey="date"
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  minTickGap={
                    longRange
                      ? 35
                      : 24
                  }
                  tick={{
                    fill:
                      CHART_AXIS,

                    fontSize:
                      12,
                  }}
                  tickFormatter={(
                    value,
                  ) =>
                    formatAxisDate(
                      String(
                        value,
                      ),
                      longRange,
                    )
                  }
                />


                {/* ============================================
                    Y AXIS
                    ============================================ */}

                <YAxis
                  axisLine={
                    false
                  }
                  tickLine={
                    false
                  }
                  width={
                    58
                  }
                  allowDecimals={
                    metric ===
                    "revenue"
                  }
                  tick={{
                    fill:
                      CHART_AXIS,

                    fontSize:
                      12,
                  }}
                  tickFormatter={(
                    value,
                  ) =>
                    formatCompactNumber(
                      Number(
                        value,
                      ),
                    )
                  }
                />


                {/* ============================================
                    TOOLTIP
                    ============================================ */}

                <Tooltip
                  cursor={{
                    stroke:
                      CHART_ACCENT,

                    strokeWidth:
                      1,

                    strokeDasharray:
                      "4 4",

                    strokeOpacity:
                      0.35,
                  }}
                  contentStyle={{
                    backgroundColor:
                      CHART_TOOLTIP_BACKGROUND,

                    border:
                      "1px solid #ececef",

                    borderRadius:
                      "10px",

                    boxShadow:
                      "0 10px 30px rgba(18, 18, 23, 0.08)",

                    padding:
                      "10px 12px",
                  }}
                  labelStyle={{
                    color:
                      "#696970",

                    fontSize:
                      "12px",

                    fontWeight:
                      500,

                    marginBottom:
                      "5px",
                  }}
                  itemStyle={{
                    color:
                      "#16161b",

                    fontSize:
                      "13px",

                    fontWeight:
                      700,
                  }}
                  labelFormatter={(
                    label,
                  ) =>
                    formatTooltipDate(
                      String(
                        label,
                      ),
                    )
                  }
                  formatter={(
                    value,
                  ) => [
                    formatMetricValue(
                      Number(
                        value ??
                          0,
                      ),
                      metric,
                      currency,
                    ),

                    metricLabel,
                  ]}
                />


                {/* ============================================
                    AREA
                    ============================================ */}

                <Area
                  type="monotone"
                  dataKey={
                    metric
                  }
                  stroke={
                    CHART_ACCENT
                  }
                  strokeWidth={
                    2.5
                  }
                  fill={`url(#${gradientId})`}
                  activeDot={{
                    r:
                      5,

                    stroke:
                      CHART_ACCENT,

                    strokeWidth:
                      2,

                    fill:
                      "#ffffff",
                  }}
                  dot={{
                    r:
                      2.5,

                    stroke:
                      CHART_ACCENT,

                    strokeWidth:
                      1.5,

                    fill:
                      "#ffffff",
                  }}
                  animationDuration={
                    450
                  }
                  animationEasing="ease-out"
                  isAnimationActive={
                    true
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* ==================================================
             EMPTY STATE
             ================================================== */

          <div
            className="gestionnaire-dashboard-sales__empty"
            role="status"
          >
            <span
              className="gestionnaire-dashboard-sales__empty-icon"
              aria-hidden="true"
            >
              <BarChart3
                size={28}
                strokeWidth={1.6}
              />
            </span>

            <strong
              className="gestionnaire-dashboard-sales__empty-title"
            >
              Aucune donnée disponible
            </strong>

            <p
              className="gestionnaire-dashboard-sales__empty-text"
            >
              {
                METRICS[
                  metric
                ].emptyLabel
              }
            </p>
          </div>
        )}
      </div>
    </section>
  );
}