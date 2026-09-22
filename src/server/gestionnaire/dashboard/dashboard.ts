import "server-only";

import {
  ManagerStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  StoreStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD SERVICE — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/server/gestionnaire/dashboard/dashboard.ts

   RESPONSABILITÉS :

   - identifier le Gestionnaire connecté ;
   - déterminer son Store côté serveur ;
   - refuser un compte ou une boutique inactive ;
   - ne jamais accepter storeId depuis le navigateur ;
   - résoudre la période du Dashboard ;
   - calculer la période précédente ;
   - calculer les KPI ;
   - calculer les données du graphique ;
   - calculer la répartition des commandes ;
   - récupérer les dernières commandes ;
   - calculer les produits les plus vendus ;
   - fournir uniquement les données nécessaires au Dashboard.

   IMPORTANT :

   Aucun chiffre de démonstration n'est retourné.

   Toutes les valeurs proviennent de PostgreSQL / Prisma.

   Aucune donnée d'une autre boutique ne doit être retournée.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const DAY_MS =
  24 * 60 * 60 * 1000;


const DEFAULT_PERIOD_DAYS =
  30;


const MAX_CUSTOM_PERIOD_DAYS =
  366;


const RECENT_ORDERS_LIMIT =
  5;


const TOP_PRODUCTS_LIMIT =
  5;


/* ============================================================
   VALID SALES ORDER STATUSES
   ------------------------------------------------------------
   Ces statuts sont utilisés pour :

   - unités vendues ;
   - top produits.

   PENDING :
   pas encore considéré comme une vente effective.

   CANCELLED :
   ne doit jamais augmenter les ventes.

   REFUNDED :
   ne doit pas augmenter les ventes.

   Le CA est calculé séparément à partir de Payment.PAID.
   ============================================================ */

const SALES_ORDER_STATUSES:
  readonly OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.READY,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];


/* ============================================================
   PERIOD TYPES
   ============================================================ */

export type DashboardPeriodPreset =
  | "today"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "previousMonth"
  | "thisYear"
  | "custom";


export type DashboardPeriodInput =
  Readonly<{
    preset?:
      DashboardPeriodPreset | null;

    from?:
      string | null;

    to?:
      string | null;
  }>;


/* ============================================================
   TREND
   ============================================================ */

export type DashboardTrend =
  | "up"
  | "down"
  | "stable";


/* ============================================================
   REVENUE KPI
   ============================================================ */

export type DashboardRevenueKpi =
  Readonly<{
    amount:
      number | null;

    currency:
      string | null;

    mixedCurrencies:
      boolean;

    changePercent:
      number | null;

    trend:
      DashboardTrend;
  }>;


/* ============================================================
   STANDARD KPI
   ============================================================ */

export type DashboardCountKpi =
  Readonly<{
    value:
      number;

    changePercent:
      number | null;

    trend:
      DashboardTrend;
  }>;


/* ============================================================
   DASHBOARD SUMMARY
   ============================================================ */

export type DashboardSummary =
  Readonly<{
    revenue:
      DashboardRevenueKpi;

    orders:
      DashboardCountKpi;

    customers:
      DashboardCountKpi;

    productsSold:
      DashboardCountKpi;
  }>;


/* ============================================================
   SALES CHART
   ============================================================ */

export type DashboardSalesChartPoint =
  Readonly<{
    date:
      string;

    revenue:
      number;

    orders:
      number;

    productsSold:
      number;
  }>;


/* ============================================================
   ORDER DISTRIBUTION
   ============================================================ */

export type DashboardOrderDistributionKey =
  | "delivered"
  | "inProgress"
  | "pending"
  | "cancelled"
  | "refunded";


export type DashboardOrderDistributionItem =
  Readonly<{
    key:
      DashboardOrderDistributionKey;

    count:
      number;

    percentage:
      number;
  }>;


/* ============================================================
   RECENT ORDER
   ============================================================ */

export type DashboardRecentOrder =
  Readonly<{
    id:
      string;

    orderNumber:
      string;

    customerName:
      string;

    itemCount:
      number;

    total:
      number;

    currency:
      string;

    status:
      OrderStatus;

    createdAt:
      string;
  }>;


/* ============================================================
   TOP PRODUCT
   ============================================================ */

export type DashboardTopProduct =
  Readonly<{
    productId:
      string;

    storeProductId:
      string;

    name:
      string;

    imageUrl:
      string | null;

    imageAlt:
      string | null;

    unitsSold:
      number;

    revenue:
      number;

    currency:
      string;
  }>;


/* ============================================================
   PERFORMANCE
   ============================================================ */

export type DashboardPerformanceState =
  | "growth"
  | "stable"
  | "decline"
  | "insufficient";


export type DashboardPerformance =
  Readonly<{
    state:
      DashboardPerformanceState;

    changePercent:
      number | null;
  }>;


/* ============================================================
   PERIOD RESULT
   ============================================================ */

export type DashboardPeriod =
  Readonly<{
    preset:
      DashboardPeriodPreset;

    from:
      string;

    to:
      string;

    label:
      string;

    previousFrom:
      string;

    previousTo:
      string;
  }>;


/* ============================================================
   COMPLETE DASHBOARD DATA
   ============================================================ */

export type GestionnaireDashboardData =
  Readonly<{
    store: Readonly<{
      name:
        string;

      city:
        string;

      country:
        string;
    }>;

    period:
      DashboardPeriod;

    summary:
      DashboardSummary;

    salesChart:
      readonly DashboardSalesChartPoint[];

    salesChartCurrency:
      string | null;

    orderDistribution:
      readonly DashboardOrderDistributionItem[];

    recentOrders:
      readonly DashboardRecentOrder[];

    topProducts:
      readonly DashboardTopProduct[];

    performance:
      DashboardPerformance;

    generatedAt:
      string;
  }>;


/* ============================================================
   INTERNAL PERIOD
   ============================================================ */

type InternalDashboardPeriod =
  Readonly<{
    preset:
      DashboardPeriodPreset;

    start:
      Date;

    endExclusive:
      Date;

    previousStart:
      Date;

    previousEndExclusive:
      Date;
  }>;


/* ============================================================
   RAW QUERY TYPES
   ============================================================ */

type RawCountRow =
  Readonly<{
    count:
      bigint | number | string;
  }>;


type RawChartRow =
  Readonly<{
    bucket:
      string;

    value:
      Prisma.Decimal | number | string | null;
  }>;


type RawTopProductRow =
  Readonly<{
    storeProductId:
      string;

    unitsSold:
      bigint | number | string;

    revenue:
      Prisma.Decimal | number | string | null;
  }>;


/* ============================================================
   NUMBER HELPERS
   ============================================================ */

function toNumber(
  value:
    Prisma.Decimal |
    bigint |
    number |
    string |
    null |
    undefined,
): number {
  if (
    value === null ||
    value === undefined
  ) {
    return 0;
  }


  const numberValue =
    Number(
      value,
    );


  return Number.isFinite(
    numberValue,
  )
    ? numberValue
    : 0;
}


/* ============================================================
   ROUND
   ============================================================ */

function roundTo(
  value:
    number,

  decimals:
    number,
): number {
  const multiplier =
    10 ** decimals;


  return Math.round(
    value *
      multiplier,
  ) /
    multiplier;
}


/* ============================================================
   UTC DATE HELPERS
   ------------------------------------------------------------
   Le schéma actuel ne contient pas encore de timezone propre
   au Store.

   Les bornes Dashboard sont donc calculées de manière stable
   en UTC côté serveur.

   Aucun fuseau n'est inventé.
   ============================================================ */

function startOfUtcDay(
  date:
    Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}


function addUtcDays(
  date:
    Date,

  days:
    number,
): Date {
  return new Date(
    date.getTime() +
      days *
        DAY_MS,
  );
}


function addUtcMonths(
  date:
    Date,

  months:
    number,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() +
        months,
      1,
    ),
  );
}


function startOfUtcMonth(
  date:
    Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1,
    ),
  );
}


function startOfUtcYear(
  date:
    Date,
): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      0,
      1,
    ),
  );
}


/* ============================================================
   ISO DATE
   ============================================================ */

function toIsoDate(
  date:
    Date,
): string {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
}


/* ============================================================
   PARSE YYYY-MM-DD
   ============================================================ */

function parseIsoDate(
  value:
    string | null | undefined,
): Date | null {
  if (
    !value ||
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
      .split(
        "-",
      )
      .map(
        Number,
      );


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
   PERIOD LABEL
   ============================================================ */

function formatPeriodDate(
  date:
    Date,
): string {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "short",

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
   DEFAULT PERIOD
   ============================================================ */

function createDefaultPeriod(
  now:
    Date,
): InternalDashboardPeriod {
  const today =
    startOfUtcDay(
      now,
    );


  const endExclusive =
    addUtcDays(
      today,
      1,
    );


  const start =
    addUtcDays(
      endExclusive,
      -DEFAULT_PERIOD_DAYS,
    );


  const previousEndExclusive =
    start;


  const previousStart =
    addUtcDays(
      previousEndExclusive,
      -DEFAULT_PERIOD_DAYS,
    );


  return {
    preset:
      "last30Days",

    start,

    endExclusive,

    previousStart,

    previousEndExclusive,
  };
}


/* ============================================================
   CUSTOM PERIOD
   ============================================================ */

function createCustomPeriod(
  from:
    string | null | undefined,

  to:
    string | null | undefined,
): InternalDashboardPeriod | null {
  const start =
    parseIsoDate(
      from,
    );


  const inclusiveEnd =
    parseIsoDate(
      to,
    );


  if (
    !start ||
    !inclusiveEnd
  ) {
    return null;
  }


  const endExclusive =
    addUtcDays(
      inclusiveEnd,
      1,
    );


  if (
    endExclusive.getTime() <=
    start.getTime()
  ) {
    return null;
  }


  const duration =
    endExclusive.getTime() -
    start.getTime();


  if (
    duration >
    MAX_CUSTOM_PERIOD_DAYS *
      DAY_MS
  ) {
    return null;
  }


  return {
    preset:
      "custom",

    start,

    endExclusive,

    previousStart:
      new Date(
        start.getTime() -
          duration,
      ),

    previousEndExclusive:
      start,
  };
}


/* ============================================================
   PRESET PERIOD
   ============================================================ */

function createPresetPeriod(
  preset:
    DashboardPeriodPreset,

  now:
    Date,
): InternalDashboardPeriod {
  const today =
    startOfUtcDay(
      now,
    );


  const tomorrow =
    addUtcDays(
      today,
      1,
    );


  switch (preset) {
    /* --------------------------------------------------------
       TODAY
       -------------------------------------------------------- */

    case "today":
      return {
        preset,

        start:
          today,

        endExclusive:
          tomorrow,

        previousStart:
          addUtcDays(
            today,
            -1,
          ),

        previousEndExclusive:
          today,
      };


    /* --------------------------------------------------------
       LAST 7 DAYS
       -------------------------------------------------------- */

    case "last7Days": {
      const start =
        addUtcDays(
          tomorrow,
          -7,
        );


      return {
        preset,

        start,

        endExclusive:
          tomorrow,

        previousStart:
          addUtcDays(
            start,
            -7,
          ),

        previousEndExclusive:
          start,
      };
    }


    /* --------------------------------------------------------
       LAST 30 DAYS
       -------------------------------------------------------- */

    case "last30Days":
      return createDefaultPeriod(
        now,
      );


    /* --------------------------------------------------------
       THIS MONTH
       -------------------------------------------------------- */

    case "thisMonth": {
      const start =
        startOfUtcMonth(
          today,
        );


      const duration =
        tomorrow.getTime() -
        start.getTime();


      const previousStart =
        addUtcMonths(
          start,
          -1,
        );


      const currentMonthStart =
        start;


      const candidatePreviousEnd =
        new Date(
          previousStart.getTime() +
            duration,
        );


      const previousEndExclusive =
        candidatePreviousEnd.getTime() >
        currentMonthStart.getTime()
          ? currentMonthStart
          : candidatePreviousEnd;


      return {
        preset,

        start,

        endExclusive:
          tomorrow,

        previousStart,

        previousEndExclusive,
      };
    }


    /* --------------------------------------------------------
       PREVIOUS MONTH
       -------------------------------------------------------- */

    case "previousMonth": {
      const currentMonthStart =
        startOfUtcMonth(
          today,
        );


      const start =
        addUtcMonths(
          currentMonthStart,
          -1,
        );


      const previousStart =
        addUtcMonths(
          start,
          -1,
        );


      return {
        preset,

        start,

        endExclusive:
          currentMonthStart,

        previousStart,

        previousEndExclusive:
          start,
      };
    }


    /* --------------------------------------------------------
       THIS YEAR
       -------------------------------------------------------- */

    case "thisYear": {
      const start =
        startOfUtcYear(
          today,
        );


      const previousStart =
        new Date(
          Date.UTC(
            start.getUTCFullYear() -
              1,
            0,
            1,
          ),
        );


      const duration =
        tomorrow.getTime() -
        start.getTime();


      const candidatePreviousEnd =
        new Date(
          previousStart.getTime() +
            duration,
        );


      return {
        preset,

        start,

        endExclusive:
          tomorrow,

        previousStart,

        previousEndExclusive:
          candidatePreviousEnd.getTime() >
          start.getTime()
            ? start
            : candidatePreviousEnd,
      };
    }


    /* --------------------------------------------------------
       CUSTOM WITHOUT VALID DATES
       -------------------------------------------------------- */

    case "custom":
    default:
      return createDefaultPeriod(
        now,
      );
  }
}


/* ============================================================
   RESOLVE DASHBOARD PERIOD
   ============================================================ */

function resolveDashboardPeriod(
  input:
    DashboardPeriodInput,
): InternalDashboardPeriod {
  const now =
    new Date();


  /*
   * Des dates explicites sont prioritaires.
   */

  const custom =
    createCustomPeriod(
      input.from,
      input.to,
    );


  if (custom) {
    return custom;
  }


  const preset =
    input.preset ??
    "last30Days";


  return createPresetPeriod(
    preset,
    now,
  );
}


/* ============================================================
   PUBLIC PERIOD
   ============================================================ */

function createPublicPeriod(
  period:
    InternalDashboardPeriod,
): DashboardPeriod {
  const inclusiveEnd =
    new Date(
      period.endExclusive.getTime() -
        1,
    );


  const previousInclusiveEnd =
    new Date(
      period
        .previousEndExclusive
        .getTime() -
        1,
    );


  return {
    preset:
      period.preset,

    from:
      toIsoDate(
        period.start,
      ),

    to:
      toIsoDate(
        inclusiveEnd,
      ),

    label:
      `${formatPeriodDate(
        period.start,
      )} - ${formatPeriodDate(
        inclusiveEnd,
      )}`,

    previousFrom:
      toIsoDate(
        period.previousStart,
      ),

    previousTo:
      toIsoDate(
        previousInclusiveEnd,
      ),
  };
}


/* ============================================================
   CHANGE
   ============================================================ */

function calculateChangePercent(
  current:
    number,

  previous:
    number,
): number | null {
  if (
    previous === 0
  ) {
    if (
      current === 0
    ) {
      return 0;
    }


    /*
     * Une croissance depuis zéro n'a pas de pourcentage fini
     * mathématiquement correct.
     */

    return null;
  }


  return roundTo(
    (
      (
        current -
        previous
      ) /
      previous
    ) *
      100,
    1,
  );
}


/* ============================================================
   TREND
   ============================================================ */

function getTrend(
  current:
    number,

  previous:
    number,

  changePercent:
    number | null,
): DashboardTrend {
  if (
    changePercent === null
  ) {
    if (
      current >
      previous
    ) {
      return "up";
    }


    if (
      current <
      previous
    ) {
      return "down";
    }


    return "stable";
  }


  if (
    changePercent >
    0
  ) {
    return "up";
  }


  if (
    changePercent <
    0
  ) {
    return "down";
  }


  return "stable";
}


/* ============================================================
   CURRENCY RESOLUTION
   ------------------------------------------------------------
   On ne mélange jamais deux devises.

   Priorité :

   1. devises des paiements PAID de la période actuelle +
      période précédente ;

   2. si aucune vente payée n'existe encore, devise des produits
      commercialisés par le Store.

   Si plusieurs devises sont rencontrées :

   currency = null
   mixedCurrencies = true

   Aucun montant multi-devise n'est additionné.
   ============================================================ */

async function resolveDashboardCurrency(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  period:
    InternalDashboardPeriod,
): Promise<
  Readonly<{
    currency:
      string | null;

    mixedCurrencies:
      boolean;
  }>
> {
  const paymentCurrencies =
    await transaction
      .payment
      .findMany({
        where: {
          storeId,

          status:
            PaymentStatus.PAID,

          paidAt: {
            gte:
              period.previousStart,

            lt:
              period.endExclusive,
          },
        },

        distinct: [
          "currency",
        ],

        select: {
          currency:
            true,
        },

        take:
          3,
      });


  if (
    paymentCurrencies.length >
    1
  ) {
    return {
      currency:
        null,

      mixedCurrencies:
        true,
    };
  }


  if (
    paymentCurrencies.length ===
    1
  ) {
    return {
      currency:
        paymentCurrencies[0]
          ?.currency ??
        null,

      mixedCurrencies:
        false,
    };
  }


  const storeProductCurrencies =
    await transaction
      .storeProduct
      .findMany({
        where: {
          storeId,
        },

        distinct: [
          "currency",
        ],

        select: {
          currency:
            true,
        },

        take:
          3,
      });


  if (
    storeProductCurrencies.length >
    1
  ) {
    return {
      currency:
        null,

      mixedCurrencies:
        true,
    };
  }


  return {
    currency:
      storeProductCurrencies[0]
        ?.currency ??
      null,

    mixedCurrencies:
      false,
  };
}


/* ============================================================
   REVENUE
   ------------------------------------------------------------
   Convention actuelle :

   CA confirmé =
   somme des Payment.amount dont :

   status = PAID

   et :

   paidAt appartient à la période.

   Les paiements :

   PENDING
   PROCESSING
   FAILED
   CANCELLED
   REFUNDED
   PARTIALLY_REFUNDED

   ne sont pas ajoutés au CA PAID.

   Le schéma actuel ne contient pas de refundedAmount permettant
   de calculer précisément un remboursement partiel net.
   ============================================================ */

async function getRevenue(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  currency:
    string | null,

  start:
    Date,

  endExclusive:
    Date,
): Promise<number | null> {
  if (!currency) {
    return null;
  }


  const aggregate =
    await transaction
      .payment
      .aggregate({
        where: {
          storeId,

          status:
            PaymentStatus.PAID,

          currency,

          paidAt: {
            gte:
              start,

            lt:
              endExclusive,
          },
        },

        _sum: {
          amount:
            true,
        },
      });


  return toNumber(
    aggregate
      ._sum
      .amount,
  );
}


/* ============================================================
   DISTINCT CUSTOMERS
   ------------------------------------------------------------
   Le KPI Clients représente ici :

   clients identifiés distincts ayant commandé pendant la
   période.

   Les commandes dont customerId est null ne sont pas
   artificiellement dédupliquées à partir d'un nom ou téléphone.
   ============================================================ */

async function getDistinctCustomersCount(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  start:
    Date,

  endExclusive:
    Date,
): Promise<number> {
  const rows =
    await transaction
      .$queryRaw<RawCountRow[]>(
        Prisma.sql`
          SELECT
            COUNT(
              DISTINCT "customerId"
            )::bigint AS "count"
          FROM "orders"
          WHERE
            "storeId" = ${storeId}
            AND "customerId" IS NOT NULL
            AND "createdAt" >= ${start}
            AND "createdAt" < ${endExclusive}
        `,
      );


  return toNumber(
    rows[0]
      ?.count,
  );
}


/* ============================================================
   SOLD UNITS
   ============================================================ */

async function getProductsSoldCount(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  start:
    Date,

  endExclusive:
    Date,
): Promise<number> {
  const result =
    await transaction
      .orderItem
      .aggregate({
        where: {
          order: {
            storeId,

            createdAt: {
              gte:
                start,

              lt:
                endExclusive,
            },

            status: {
              in:
                [
                  ...SALES_ORDER_STATUSES,
                ],
            },
          },
        },

        _sum: {
          quantity:
            true,
        },
      });


  return result
    ._sum
    .quantity ??
    0;
}


/* ============================================================
   SUMMARY PERIOD VALUES
   ============================================================ */

async function getPeriodSummaryValues(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  currency:
    string | null,

  start:
    Date,

  endExclusive:
    Date,
) {
  const [
    revenue,
    orders,
    customers,
    productsSold,
  ] =
    await Promise.all([
      getRevenue(
        transaction,
        storeId,
        currency,
        start,
        endExclusive,
      ),

      transaction
        .order
        .count({
          where: {
            storeId,

            createdAt: {
              gte:
                start,

              lt:
                endExclusive,
            },
          },
        }),

      getDistinctCustomersCount(
        transaction,
        storeId,
        start,
        endExclusive,
      ),

      getProductsSoldCount(
        transaction,
        storeId,
        start,
        endExclusive,
      ),
    ]);


  return {
    revenue,
    orders,
    customers,
    productsSold,
  };
}


/* ============================================================
   BUILD SUMMARY
   ============================================================ */

function buildDashboardSummary(
  current:
    Awaited<
      ReturnType<
        typeof getPeriodSummaryValues
      >
    >,

  previous:
    Awaited<
      ReturnType<
        typeof getPeriodSummaryValues
      >
    >,

  currency:
    string | null,

  mixedCurrencies:
    boolean,
): DashboardSummary {
  const revenueChange =
    current.revenue !== null &&
    previous.revenue !== null
      ? calculateChangePercent(
          current.revenue,
          previous.revenue,
        )
      : null;


  const ordersChange =
    calculateChangePercent(
      current.orders,
      previous.orders,
    );


  const customersChange =
    calculateChangePercent(
      current.customers,
      previous.customers,
    );


  const productsSoldChange =
    calculateChangePercent(
      current.productsSold,
      previous.productsSold,
    );


  return {
    revenue: {
      amount:
        current.revenue,

      currency,

      mixedCurrencies,

      changePercent:
        revenueChange,

      trend:
        current.revenue !==
          null &&
        previous.revenue !==
          null
          ? getTrend(
              current.revenue,
              previous.revenue,
              revenueChange,
            )
          : "stable",
    },

    orders: {
      value:
        current.orders,

      changePercent:
        ordersChange,

      trend:
        getTrend(
          current.orders,
          previous.orders,
          ordersChange,
        ),
    },

    customers: {
      value:
        current.customers,

      changePercent:
        customersChange,

      trend:
        getTrend(
          current.customers,
          previous.customers,
          customersChange,
        ),
    },

    productsSold: {
      value:
        current.productsSold,

      changePercent:
        productsSoldChange,

      trend:
        getTrend(
          current.productsSold,
          previous.productsSold,
          productsSoldChange,
        ),
    },
  };
}


/* ============================================================
   CHART GRANULARITY
   ============================================================ */

type ChartGranularity =
  | "day"
  | "month";


function getChartGranularity(
  period:
    InternalDashboardPeriod,
): ChartGranularity {
  const days =
    Math.ceil(
      (
        period
          .endExclusive
          .getTime() -
        period
          .start
          .getTime()
      ) /
        DAY_MS,
    );


  return days >
    92
    ? "month"
    : "day";
}


/* ============================================================
   CREATE CHART BUCKETS
   ============================================================ */

function createChartBuckets(
  period:
    InternalDashboardPeriod,

  granularity:
    ChartGranularity,
): string[] {
  const buckets:
    string[] = [];


  if (
    granularity ===
    "month"
  ) {
    let cursor =
      new Date(
        Date.UTC(
          period
            .start
            .getUTCFullYear(),

          period
            .start
            .getUTCMonth(),

          1,
        ),
      );


    while (
      cursor.getTime() <
      period
        .endExclusive
        .getTime()
    ) {
      buckets.push(
        toIsoDate(
          cursor,
        ),
      );


      cursor =
        addUtcMonths(
          cursor,
          1,
        );
    }


    return buckets;
  }


  let cursor =
    period.start;


  while (
    cursor.getTime() <
    period
      .endExclusive
      .getTime()
  ) {
    buckets.push(
      toIsoDate(
        cursor,
      ),
    );


    cursor =
      addUtcDays(
        cursor,
        1,
      );
  }


  return buckets;
}


/* ============================================================
   SALES CHART
   ============================================================ */

async function getSalesChart(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  currency:
    string | null,

  period:
    InternalDashboardPeriod,
): Promise<
  readonly DashboardSalesChartPoint[]
> {
  const granularity =
    getChartGranularity(
      period,
    );


  const paymentBucket =
    granularity ===
    "month"
      ? Prisma.sql`
          to_char(
            date_trunc(
              'month',
              p."paidAt"
            ),
            'YYYY-MM-01'
          )
        `
      : Prisma.sql`
          to_char(
            date_trunc(
              'day',
              p."paidAt"
            ),
            'YYYY-MM-DD'
          )
        `;


  const orderBucket =
    granularity ===
    "month"
      ? Prisma.sql`
          to_char(
            date_trunc(
              'month',
              o."createdAt"
            ),
            'YYYY-MM-01'
          )
        `
      : Prisma.sql`
          to_char(
            date_trunc(
              'day',
              o."createdAt"
            ),
            'YYYY-MM-DD'
          )
        `;


  const soldStatusSql =
    Prisma.join(
      SALES_ORDER_STATUSES.map(
        (
          status,
        ) =>
          Prisma.sql`${status}`,
      ),
    );


  const revenuePromise:
    Promise<RawChartRow[]> =
    currency
      ? transaction
          .$queryRaw<RawChartRow[]>(
            Prisma.sql`
              SELECT
                ${paymentBucket}
                  AS "bucket",

                COALESCE(
                  SUM(
                    p."amount"
                  ),
                  0
                )
                  AS "value"

              FROM "payments" p

              WHERE
                p."storeId" =
                  ${storeId}

                AND p."status"::text =
                  ${PaymentStatus.PAID}

                AND p."currency" =
                  ${currency}

                AND p."paidAt" >=
                  ${period.start}

                AND p."paidAt" <
                  ${period.endExclusive}

              GROUP BY 1
              ORDER BY 1
            `,
          )
      : Promise.resolve(
          [],
        );


  const ordersPromise =
    transaction
      .$queryRaw<RawChartRow[]>(
        Prisma.sql`
          SELECT
            ${orderBucket}
              AS "bucket",

            COUNT(*)::bigint
              AS "value"

          FROM "orders" o

          WHERE
            o."storeId" =
              ${storeId}

            AND o."createdAt" >=
              ${period.start}

            AND o."createdAt" <
              ${period.endExclusive}

          GROUP BY 1
          ORDER BY 1
        `,
      );


  const productsPromise =
    transaction
      .$queryRaw<RawChartRow[]>(
        Prisma.sql`
          SELECT
            ${orderBucket}
              AS "bucket",

            COALESCE(
              SUM(
                oi."quantity"
              ),
              0
            )::bigint
              AS "value"

          FROM "order_items" oi

          INNER JOIN "orders" o
            ON o."id" =
               oi."orderId"

          WHERE
            o."storeId" =
              ${storeId}

            AND o."createdAt" >=
              ${period.start}

            AND o."createdAt" <
              ${period.endExclusive}

            AND o."status"::text
              IN (
                ${soldStatusSql}
              )

          GROUP BY 1
          ORDER BY 1
        `,
      );


  const [
    revenueRows,
    orderRows,
    productRows,
  ] =
    await Promise.all([
      revenuePromise,
      ordersPromise,
      productsPromise,
    ]);


  const revenueMap =
    new Map<
      string,
      number
    >(
      revenueRows.map(
        (
          row,
        ) => [
          row.bucket,
          toNumber(
            row.value,
          ),
        ],
      ),
    );


  const orderMap =
    new Map<
      string,
      number
    >(
      orderRows.map(
        (
          row,
        ) => [
          row.bucket,
          toNumber(
            row.value,
          ),
        ],
      ),
    );


  const productMap =
    new Map<
      string,
      number
    >(
      productRows.map(
        (
          row,
        ) => [
          row.bucket,
          toNumber(
            row.value,
          ),
        ],
      ),
    );


  return createChartBuckets(
    period,
    granularity,
  ).map(
    (
      bucket,
    ) => ({
      date:
        bucket,

      revenue:
        revenueMap.get(
          bucket,
        ) ??
        0,

      orders:
        orderMap.get(
          bucket,
        ) ??
        0,

      productsSold:
        productMap.get(
          bucket,
        ) ??
        0,
    }),
  );
}


/* ============================================================
   ORDER DISTRIBUTION
   ============================================================ */

async function getOrderDistribution(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  period:
    InternalDashboardPeriod,
): Promise<
  readonly DashboardOrderDistributionItem[]
> {
  const groups =
    await transaction
      .order
      .groupBy({
        by: [
          "status",
        ],

        where: {
          storeId,

          createdAt: {
            gte:
              period.start,

            lt:
              period.endExclusive,
          },
        },

        _count: {
          _all:
            true,
        },
      });


  const counts =
    new Map<
      OrderStatus,
      number
    >();


  for (
    const group
    of groups
  ) {
    counts.set(
      group.status,
      group
        ._count
        ._all,
    );
  }


  const getCount =
    (
      status:
        OrderStatus,
    ) =>
      counts.get(
        status,
      ) ??
      0;


  const delivered =
    getCount(
      OrderStatus.DELIVERED,
    );


  const inProgress =
    getCount(
      OrderStatus.CONFIRMED,
    ) +
    getCount(
      OrderStatus.PROCESSING,
    ) +
    getCount(
      OrderStatus.READY,
    ) +
    getCount(
      OrderStatus.SHIPPED,
    );


  const pending =
    getCount(
      OrderStatus.PENDING,
    );


  const cancelled =
    getCount(
      OrderStatus.CANCELLED,
    );


  const refunded =
    getCount(
      OrderStatus.REFUNDED,
    );


  const values:
    Array<
      readonly [
        DashboardOrderDistributionKey,
        number,
      ]
    > = [
      [
        "delivered",
        delivered,
      ],

      [
        "inProgress",
        inProgress,
      ],

      [
        "pending",
        pending,
      ],

      [
        "cancelled",
        cancelled,
      ],

      [
        "refunded",
        refunded,
      ],
    ];


  const total =
    values.reduce(
      (
        sum,
        [
          ,
          count,
        ],
      ) =>
        sum +
        count,
      0,
    );


  return values.map(
    (
      [
        key,
        count,
      ],
    ) => ({
      key,

      count,

      percentage:
        total >
        0
          ? roundTo(
              (
                count /
                total
              ) *
                100,
              1,
            )
          : 0,
    }),
  );
}


/* ============================================================
   RECENT ORDERS
   ============================================================ */

async function getRecentOrders(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  period:
    InternalDashboardPeriod,
): Promise<
  readonly DashboardRecentOrder[]
> {
  const orders =
    await transaction
      .order
      .findMany({
        where: {
          storeId,

          createdAt: {
            gte:
              period.start,

            lt:
              period.endExclusive,
          },
        },

        orderBy: {
          createdAt:
            "desc",
        },

        take:
          RECENT_ORDERS_LIMIT,

        select: {
          id:
            true,

          orderNumber:
            true,

          customerFirstName:
            true,

          customerLastName:
            true,

          totalAmount:
            true,

          currency:
            true,

          status:
            true,

          createdAt:
            true,

          items: {
            select: {
              quantity:
                true,
            },
          },
        },
      });


  return orders.map(
    (
      order,
    ) => ({
      id:
        order.id,

      orderNumber:
        order
          .orderNumber,

      customerName:
        `${order.customerFirstName} ${order.customerLastName}`
          .trim(),

      itemCount:
        order.items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),

      total:
        toNumber(
          order
            .totalAmount,
        ),

      currency:
        order.currency,

      status:
        order.status,

      createdAt:
        order
          .createdAt
          .toISOString(),
    }),
  );
}


/* ============================================================
   TOP PRODUCTS
   ============================================================ */

async function getTopProducts(
  transaction:
    Prisma.TransactionClient,

  storeId:
    string,

  period:
    InternalDashboardPeriod,
): Promise<
  readonly DashboardTopProduct[]
> {
  const soldStatusSql =
    Prisma.join(
      SALES_ORDER_STATUSES.map(
        (
          status,
        ) =>
          Prisma.sql`${status}`,
      ),
    );


  const ranking =
    await transaction
      .$queryRaw<
        RawTopProductRow[]
      >(
        Prisma.sql`
          SELECT
            oi."storeProductId"
              AS "storeProductId",

            SUM(
              oi."quantity"
            )::bigint
              AS "unitsSold",

            COALESCE(
              SUM(
                oi."totalPrice"
              ),
              0
            )
              AS "revenue"

          FROM "order_items" oi

          INNER JOIN "orders" o
            ON o."id" =
               oi."orderId"

          WHERE
            o."storeId" =
              ${storeId}

            AND oi."storeProductId"
              IS NOT NULL

            AND o."createdAt" >=
              ${period.start}

            AND o."createdAt" <
              ${period.endExclusive}

            AND o."status"::text
              IN (
                ${soldStatusSql}
              )

          GROUP BY
            oi."storeProductId"

          ORDER BY
            SUM(
              oi."quantity"
            ) DESC,

            SUM(
              oi."totalPrice"
            ) DESC

          LIMIT ${TOP_PRODUCTS_LIMIT}
        `,
      );


  if (
    ranking.length ===
    0
  ) {
    return [];
  }


  const ids =
    ranking.map(
      (
        row,
      ) =>
        row.storeProductId,
    );


  const storeProducts =
    await transaction
      .storeProduct
      .findMany({
        where: {
          storeId,

          id: {
            in:
              ids,
          },
        },

        select: {
          id:
            true,

          currency:
            true,

          product: {
            select: {
              id:
                true,

              name:
                true,

              images: {
                orderBy: {
                  position:
                    "asc",
                },

                take:
                  8,

                select: {
                  url:
                    true,

                  altText:
                    true,

                  isPrimary:
                    true,

                  position:
                    true,
                },
              },
            },
          },
        },
      });


  const storeProductMap =
    new Map(
      storeProducts.map(
        (
          storeProduct,
        ) => [
          storeProduct.id,
          storeProduct,
        ],
      ),
    );


  return ranking
    .map(
      (
        row,
      ):
        DashboardTopProduct |
        null => {
        const storeProduct =
          storeProductMap.get(
            row.storeProductId,
          );


        if (
          !storeProduct
        ) {
          return null;
        }


        const image =
          storeProduct
            .product
            .images
            .find(
              (
                candidate,
              ) =>
                candidate.isPrimary,
            ) ??
          storeProduct
            .product
            .images[0] ??
          null;


        return {
          productId:
            storeProduct
              .product
              .id,

          storeProductId:
            storeProduct.id,

          name:
            storeProduct
              .product
              .name,

          imageUrl:
            image
              ?.url ??
            null,

          imageAlt:
            image
              ?.altText ??
            storeProduct
              .product
              .name,

          unitsSold:
            toNumber(
              row.unitsSold,
            ),

          revenue:
            toNumber(
              row.revenue,
            ),

          currency:
            storeProduct
              .currency,
        };
      },
    )
    .filter(
      (
        item,
      ): item is
        DashboardTopProduct =>
        item !== null,
    );
}


/* ============================================================
   PERFORMANCE
   ------------------------------------------------------------
   Seuils issus du cahier Dashboard :

   > +5 %
   croissance

   -5 % à +5 %
   stable

   < -5 %
   baisse

   Aucune vente actuelle et précédente :
   données insuffisantes.
   ============================================================ */

function createPerformance(
  currentRevenue:
    number | null,

  previousRevenue:
    number | null,

  changePercent:
    number | null,
): DashboardPerformance {
  if (
    currentRevenue ===
      null ||
    previousRevenue ===
      null
  ) {
    return {
      state:
        "insufficient",

      changePercent:
        null,
    };
  }


  if (
    currentRevenue ===
      0 &&
    previousRevenue ===
      0
  ) {
    return {
      state:
        "insufficient",

      changePercent:
        0,
    };
  }


  if (
    previousRevenue ===
      0 &&
    currentRevenue >
      0
  ) {
    return {
      state:
        "growth",

      changePercent:
        null,
    };
  }


  if (
    changePercent ===
    null
  ) {
    return {
      state:
        "insufficient",

      changePercent:
        null,
    };
  }


  if (
    changePercent >
    5
  ) {
    return {
      state:
        "growth",

      changePercent,
    };
  }


  if (
    changePercent <
    -5
  ) {
    return {
      state:
        "decline",

      changePercent,
    };
  }


  return {
    state:
      "stable",

    changePercent,
  };
}


/* ============================================================
   GET GESTIONNAIRE DASHBOARD DATA
   ------------------------------------------------------------
   SÉCURITÉ :

   Aucun managerId ou storeId n'est accepté depuis le navigateur.

   Parcours :

   cookie HttpOnly signé
          ↓
   session Gestionnaire
          ↓
   Manager authentifié
          ↓
   Manager.storeId depuis PostgreSQL
          ↓
   requêtes Dashboard filtrées par ce storeId

   IMPORTANT :

   Le Dashboard est une interface de lecture.

   Nous n'utilisons volontairement PAS de transaction Prisma
   interactive autour de toutes les requêtes Dashboard.

   Une transaction interactive longue peut expirer lorsque
   plusieurs agrégations sont exécutées, notamment avec une
   base PostgreSQL distante.

   Les requêtes indépendantes sont parallélisées avec
   Promise.all() afin de garder le chargement rapide.
   ============================================================ */

export async function getGestionnaireDashboardData(
  input:
    DashboardPeriodInput = {},
): Promise<GestionnaireDashboardData> {
  /* ----------------------------------------------------------
   1. PRIVATE AUTHENTICATED ACCESS
   ----------------------------------------------------------
   Le contrôle d'accès privé central vérifie notamment :

   - session signée valide ;
   - Manager existant ;
   - e-mail vérifié ;
   - Manager ACTIVE ;
   - Store correspondant ;
   - Store ACTIVE.

   managerId et storeId ne proviennent jamais du navigateur.
   ---------------------------------------------------------- */

const access =
  await requireGestionnairePrivateAccess();


  /* ----------------------------------------------------------
     2. PERIOD
     ---------------------------------------------------------- */

  const period =
    resolveDashboardPeriod(
      input,
    );


  /* ----------------------------------------------------------
     3. MANAGER + STORE
     ----------------------------------------------------------
     Le storeId vient exclusivement de la base à partir de
     l'identité authentifiée.

     Aucun storeId fourni par URL ou navigateur n'est utilisé.
     ---------------------------------------------------------- */

  const manager =
  await db.manager.findUnique({
    where: {
      id:
        access.manager.id,
    },

    select: {
      status:
        true,

      store: {
        select: {
          id:
            true,

          name:
            true,

          city:
            true,

          country:
            true,

          status:
            true,
        },
      },
    },
  });


  /* ----------------------------------------------------------
     4. ACCESS CONTROL
     ---------------------------------------------------------- */

  if (
    !manager ||
    manager.status !==
      ManagerStatus.ACTIVE ||
    manager.store.status !==
      StoreStatus.ACTIVE
  ) {
    throw new Error(
      "GESTIONNAIRE_DASHBOARD_ACCESS_DENIED",
    );
  }


  const storeId =
    manager.store.id;


  /* ----------------------------------------------------------
     5. CURRENCY
     ----------------------------------------------------------
     On détermine d'abord la devise afin que les calculs de CA
     et graphique financier restent cohérents.

     Plusieurs devises ne sont jamais additionnées ensemble.
     ---------------------------------------------------------- */

  const currencyInfo =
    await resolveDashboardCurrency(
      db,
      storeId,
      period,
    );


  /* ----------------------------------------------------------
     6. DASHBOARD DATA
     ----------------------------------------------------------
     Toutes ces zones sont indépendantes une fois :

     - le Gestionnaire vérifié ;
     - le storeId déterminé ;
     - la devise déterminée.

     Elles peuvent donc être exécutées parallèlement.

     Cela réduit fortement le temps total de chargement.
     ---------------------------------------------------------- */

  const [
    currentSummary,
    previousSummary,
    salesChart,
    orderDistribution,
    recentOrders,
    topProducts,
  ] =
    await Promise.all([
      /* ------------------------------------------------------
         CURRENT PERIOD SUMMARY
         ------------------------------------------------------ */

      getPeriodSummaryValues(
        db,
        storeId,
        currencyInfo.currency,
        period.start,
        period.endExclusive,
      ),


      /* ------------------------------------------------------
         PREVIOUS PERIOD SUMMARY
         ------------------------------------------------------ */

      getPeriodSummaryValues(
        db,
        storeId,
        currencyInfo.currency,
        period.previousStart,
        period.previousEndExclusive,
      ),


      /* ------------------------------------------------------
         SALES CHART
         ------------------------------------------------------ */

      getSalesChart(
        db,
        storeId,
        currencyInfo.currency,
        period,
      ),


      /* ------------------------------------------------------
         ORDER DISTRIBUTION
         ------------------------------------------------------ */

      getOrderDistribution(
        db,
        storeId,
        period,
      ),


      /* ------------------------------------------------------
         RECENT ORDERS
         ------------------------------------------------------ */

      getRecentOrders(
        db,
        storeId,
        period,
      ),


      /* ------------------------------------------------------
         TOP PRODUCTS
         ------------------------------------------------------ */

      getTopProducts(
        db,
        storeId,
        period,
      ),
    ]);


  /* ----------------------------------------------------------
     7. SUMMARY + COMPARISONS
     ---------------------------------------------------------- */

  const summary =
    buildDashboardSummary(
      currentSummary,
      previousSummary,
      currencyInfo.currency,
      currencyInfo.mixedCurrencies,
    );


  /* ----------------------------------------------------------
     8. PERFORMANCE
     ---------------------------------------------------------- */

  const performance =
    createPerformance(
      currentSummary.revenue,
      previousSummary.revenue,
      summary.revenue.changePercent,
    );


  /* ----------------------------------------------------------
     9. SAFE RESULT
     ----------------------------------------------------------
     Le navigateur ne reçoit volontairement pas :

     - storeId ;
     - managerId ;
     - données d'une autre boutique ;
     - informations Prisma inutiles.

     Il reçoit uniquement ce qui est nécessaire à l'affichage.
     ---------------------------------------------------------- */

  return {
    store: {
      name:
        manager.store.name,

      city:
        manager.store.city,

      country:
        manager.store.country,
    },

    period:
      createPublicPeriod(
        period,
      ),

    summary,

    salesChart,

    salesChartCurrency:
      currencyInfo.currency,

    orderDistribution,

    recentOrders,

    topProducts,

    performance,

    generatedAt:
      new Date().toISOString(),
  };
}