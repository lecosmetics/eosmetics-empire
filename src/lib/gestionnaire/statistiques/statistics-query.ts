import "server-only";

import {
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  DEFAULT_MANAGER_STATISTICS_PERIOD_PRESET,
  MANAGER_STATISTICS_ORDER_STATUSES,
  MANAGER_STATISTICS_PAYMENT_METHODS,
  isManagerStatisticsPeriodPreset,
  type GetManagerStatisticsPageDataInput,
  type ManagerStatisticsActivitySummary,
  type ManagerStatisticsCategorySalesItem,
  type ManagerStatisticsCityPerformanceItem,
  type ManagerStatisticsFilters,
  type ManagerStatisticsKpis,
  type ManagerStatisticsLatestOrder,
  type ManagerStatisticsMoney,
  type ManagerStatisticsMoneyComparison,
  type ManagerStatisticsMoneyTotals,
  type ManagerStatisticsNumberComparison,
  type ManagerStatisticsOrderStatusDistributionItem,
  type ManagerStatisticsPageData,
  type ManagerStatisticsPaymentDistributionItem,
  type ManagerStatisticsPerformanceInsight,
  type ManagerStatisticsPeriod,
  type ManagerStatisticsPeriodPreset,
  type ManagerStatisticsPreviousPeriod,
  type ManagerStatisticsRecommendation,
  type ManagerStatisticsRevenueSeries,
  type ManagerStatisticsTimeGranularity,
  type ManagerStatisticsTopProduct,
  type ManagerStatisticsTrend,
} from "./statistics-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — QUERY
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/statistiques/statistics-query.ts
 *
 * RESPONSABILITÉS :
 *
 * - vérifier l'accès du Gestionnaire côté serveur ;
 * - récupérer le storeId depuis la session ;
 * - résoudre la période ;
 * - construire la période précédente ;
 * - lire les vraies commandes ;
 * - lire les vrais paiements PAID ;
 * - lire les vraies lignes vendues ;
 * - lire les vraies livraisons ;
 * - calculer les KPI ;
 * - calculer les évolutions ;
 * - construire les séries du chiffre d'affaires ;
 * - construire la répartition des commandes ;
 * - construire la répartition des paiements ;
 * - construire les ventes par catégorie ;
 * - construire les produits les plus vendus ;
 * - construire les dernières commandes ;
 * - construire les performances par ville ;
 * - construire un insight seulement lorsqu'il est justifiable ;
 * - construire une recommandation seulement lorsqu'elle est justifiable.
 *
 *
 * SÉCURITÉ :
 *
 * Le navigateur ne fournit jamais :
 *
 * - storeId ;
 * - managerId ;
 * - montant de chiffre d'affaires ;
 * - statut métier ;
 * - données agrégées.
 *
 * Toutes les données sont scoppées avec :
 *
 * requireGestionnairePrivateAccess()
 *      ↓
 * access.store.id
 *
 *
 * IMPORTANT :
 *
 * - aucune donnée fictive ;
 * - aucune donnée de démonstration ;
 * - aucune écriture DB ;
 * - aucune route inventée ;
 * - aucune dépendance graphique ;
 * - aucune utilisation de BigInt afin de rester compatible avec
 *   la cible TypeScript actuelle du projet.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const DAY_IN_MS =
  24 *
  60 *
  60 *
  1000;


const TOP_PRODUCTS_LIMIT =
  5;


const LATEST_ORDERS_LIMIT =
  5;


/**
 * Tableau volontairement mutable pour rester directement compatible
 * avec Prisma `notIn`.
 */

const EXCLUDED_SALE_ORDER_STATUSES:
  OrderStatus[] = [
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ];


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

interface DecimalLike {
  toString():
    string;
}


type MoneyAccumulator =
  Map<
    string,
    number
  >;


interface RevenueBucket {
  readonly key:
    string;

  readonly label:
    string;
}


interface OrderMetadata {
  readonly id:
    string;

  readonly currency:
    string;

  readonly shippingCity:
    string | null;

  readonly status:
    OrderStatus;
}


interface StoreProductMetadata {
  readonly id:
    string;

  readonly storeId:
    string;

  readonly productId:
    string;

  readonly stockQuantity:
    number;

  readonly lowStockThreshold:
    number;

  readonly product:
    {
      readonly id:
        string;

      readonly name:
        string;

      readonly sku:
        string;

      readonly category:
        {
          readonly id:
            string;

          readonly name:
            string;
        } | null;

      readonly images:
        readonly {
          readonly url:
            string;

          readonly altText:
            string | null;

          readonly isPrimary:
            boolean;

          readonly position:
            number;
        }[];
    };
}


interface SaleItemRecord {
  readonly id:
    string;

  readonly orderId:
    string;

  readonly storeProductId:
    string | null;

  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly quantity:
    number;

  readonly unitPrice:
    DecimalLike;

  readonly totalPrice:
    DecimalLike;

  readonly order:
    {
      readonly currency:
        string;

      readonly shippingCity:
        string | null;
    };

  readonly storeProduct:
    StoreProductMetadata | null;
}


interface MutableCategorySale {
  categoryId:
    string | null;

  categoryName:
    string | null;

  quantitySold:
    number;

  revenue:
    MoneyAccumulator;
}


interface MutableTopProduct {
  storeProductId:
    string;

  productId:
    string;

  productName:
    string;

  sku:
    string | null;

  categoryId:
    string | null;

  categoryName:
    string | null;

  image:
    {
      url:
        string;

      altText:
        string | null;
    } | null;

  quantitySold:
    number;

  revenue:
    MoneyAccumulator;

  stockQuantity:
    number;

  lowStockThreshold:
    number;
}


interface MutableCityPerformance {
  city:
    string;

  orderIds:
    Set<string>;

  productsSold:
    number;

  revenue:
    MoneyAccumulator;
}


/* ==========================================================================
   DATE — BASE
   ========================================================================== */

function padTwoDigits(
  value:
    number,
): string {
  return String(
    value,
  ).padStart(
    2,
    "0",
  );
}


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


function createUtcDate(
  year:
    number,
  month:
    number,
  day:
    number,
): Date {
  return new Date(
    Date.UTC(
      year,
      month,
      day,
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
        DAY_IN_MS,
  );
}


function toDateString(
  date:
    Date,
): string {
  return [
    date.getUTCFullYear(),
    "-",
    padTwoDigits(
      date.getUTCMonth() +
        1,
    ),
    "-",
    padTwoDigits(
      date.getUTCDate(),
    ),
  ].join(
    "",
  );
}


/* ==========================================================================
   DATE — PARSING
   ========================================================================== */

function parseDateString(
  value:
    string | null | undefined,
): Date | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    return null;
  }


  const parsed =
    new Date(
      `${normalized}T00:00:00.000Z`,
    );


  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return null;
  }


  /**
   * Empêche JavaScript de transformer silencieusement une date invalide.
   *
   * Exemple :
   *
   * 2026-02-31
   *     ↓
   * mars
   */

  if (
    toDateString(
      parsed,
    ) !==
    normalized
  ) {
    return null;
  }


  return parsed;
}


/* ==========================================================================
   DATE — MOIS
   ========================================================================== */

function getUtcCurrentMonthStart(
  date:
    Date,
): Date {
  return createUtcDate(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    1,
  );
}


function getUtcPreviousMonthStart(
  date:
    Date,
): Date {
  return createUtcDate(
    date.getUTCFullYear(),
    date.getUTCMonth() -
      1,
    1,
  );
}


/* ==========================================================================
   PÉRIODE — CRÉATION
   ========================================================================== */

function createPeriodFromDates({
  preset,
  start,
  end,
}: {
  readonly preset:
    ManagerStatisticsPeriodPreset;

  readonly start:
    Date;

  readonly end:
    Date;
}): ManagerStatisticsPeriod {
  const normalizedStart =
    startOfUtcDay(
      start,
    );


  const normalizedEnd =
    startOfUtcDay(
      end,
    );


  const endExclusive =
    addUtcDays(
      normalizedEnd,
      1,
    );


  const daysCount =
    Math.max(
      1,
      Math.round(
        (
          endExclusive.getTime() -
          normalizedStart.getTime()
        ) /
          DAY_IN_MS,
      ),
    );


  return {
    preset,

    startDate:
      toDateString(
        normalizedStart,
      ),

    endDate:
      toDateString(
        normalizedEnd,
      ),

    startDateTime:
      normalizedStart.toISOString(),

    endDateTimeExclusive:
      endExclusive.toISOString(),

    daysCount,
  };
}


/* ==========================================================================
   PÉRIODE — PRESETS
   ========================================================================== */

function createPresetPeriod(
  preset:
    ManagerStatisticsPeriodPreset,
  now:
    Date,
): ManagerStatisticsPeriod {
  const today =
    startOfUtcDay(
      now,
    );


  switch (
    preset
  ) {
    case "today":
      return createPeriodFromDates({
        preset,

        start:
          today,

        end:
          today,
      });


    case "last7days":
      return createPeriodFromDates({
        preset,

        start:
          addUtcDays(
            today,
            -6,
          ),

        end:
          today,
      });


    case "last30days":
      return createPeriodFromDates({
        preset,

        start:
          addUtcDays(
            today,
            -29,
          ),

        end:
          today,
      });


    case "previousMonth": {
      const currentMonthStart =
        getUtcCurrentMonthStart(
          today,
        );


      const previousMonthStart =
        getUtcPreviousMonthStart(
          today,
        );


      return createPeriodFromDates({
        preset,

        start:
          previousMonthStart,

        end:
          addUtcDays(
            currentMonthStart,
            -1,
          ),
      });
    }


    case "thisMonth":
    case "custom":
    default:
      return createPeriodFromDates({
        preset:
          preset ===
          "custom"
            ? "custom"
            : "thisMonth",

        start:
          getUtcCurrentMonthStart(
            today,
          ),

        end:
          today,
      });
  }
}


/* ==========================================================================
   PÉRIODE — RÉSOLUTION
   ========================================================================== */

function resolveStatisticsPeriod(
  input:
    GetManagerStatisticsPageDataInput,
  now:
    Date,
): ManagerStatisticsPeriod {
  const preset =
    isManagerStatisticsPeriodPreset(
      input.preset,
    )
      ? input.preset
      : null;


  if (
    preset &&
    preset !==
      "custom"
  ) {
    return createPresetPeriod(
      preset,
      now,
    );
  }


  const customStart =
    parseDateString(
      input.from,
    );


  const customEnd =
    parseDateString(
      input.to,
    );


  if (
    customStart &&
    customEnd &&
    customStart.getTime() <=
      customEnd.getTime()
  ) {
    return createPeriodFromDates({
      preset:
        "custom",

      start:
        customStart,

      end:
        customEnd,
    });
  }


  return createPresetPeriod(
    DEFAULT_MANAGER_STATISTICS_PERIOD_PRESET,
    now,
  );
}


/* ==========================================================================
   PÉRIODE PRÉCÉDENTE
   ========================================================================== */

function createPreviousPeriod(
  period:
    ManagerStatisticsPeriod,
): ManagerStatisticsPreviousPeriod {
  const currentStart =
    new Date(
      period.startDateTime,
    );


  const previousEndExclusive =
    currentStart;


  const previousStart =
    addUtcDays(
      previousEndExclusive,
      -period.daysCount,
    );


  const previousEnd =
    addUtcDays(
      previousEndExclusive,
      -1,
    );


  return {
    startDate:
      toDateString(
        previousStart,
      ),

    endDate:
      toDateString(
        previousEnd,
      ),

    startDateTime:
      previousStart.toISOString(),

    endDateTimeExclusive:
      previousEndExclusive.toISOString(),

    daysCount:
      period.daysCount,
  };
}


/* ==========================================================================
   FILTRES UI
   ========================================================================== */

function createStatisticsFilters(
  period:
    ManagerStatisticsPeriod,
): ManagerStatisticsFilters {
  return {
    preset:
      period.preset,

    from:
      period.startDate,

    to:
      period.endDate,
  };
}


/* ==========================================================================
   MONEY — DEVISE
   ========================================================================== */

function normalizeCurrency(
  currency:
    string,
): string {
  const normalized =
    currency
      .trim()
      .toUpperCase();


  return normalized ||
    "XAF";
}


/* ==========================================================================
   MONEY — DECIMAL → CENTIMES
   ========================================================================== */

/**
 * Le schéma utilise Decimal(12, 2).
 *
 * On travaille donc en centimes entiers avec `number`.
 *
 * Cela évite :
 *
 * - les erreurs de précision de 0.1 + 0.2 ;
 * - l'utilisation de BigInt ;
 * - l'obligation de passer le target TS à ES2020.
 *
 * Decimal(12,2) reste très largement dans Number.MAX_SAFE_INTEGER
 * lorsqu'il est converti en centimes.
 */

function decimalToCents(
  value:
    DecimalLike,
): number {
  const raw =
    value
      .toString()
      .trim();


  const match =
    raw.match(
      /^(-?)(\d+)(?:\.(\d+))?$/,
    );


  if (
    !match
  ) {
    throw new Error(
      "INVALID_STATISTICS_MONEY_VALUE",
    );
  }


  const sign =
    match[1] ===
      "-"
      ? -1
      : 1;


  const whole =
    Number(
      match[2],
    );


  const decimalPart =
    (
      match[3] ??
      ""
    )
      .padEnd(
        2,
        "0",
      )
      .slice(
        0,
        2,
      );


  const fraction =
    Number(
      decimalPart ||
        "0",
    );


  const cents =
    sign *
    (
      whole *
        100 +
      fraction
    );


  if (
    !Number.isSafeInteger(
      cents,
    )
  ) {
    throw new Error(
      "STATISTICS_MONEY_VALUE_OUT_OF_RANGE",
    );
  }


  return cents;
}


/* ==========================================================================
   MONEY — CENTIMES → STRING
   ========================================================================== */

function centsToAmount(
  cents:
    number,
): string {
  if (
    !Number.isSafeInteger(
      cents,
    )
  ) {
    throw new Error(
      "STATISTICS_MONEY_TOTAL_OUT_OF_RANGE",
    );
  }


  const negative =
    cents <
    0;


  const absolute =
    Math.abs(
      cents,
    );


  const whole =
    Math.floor(
      absolute /
        100,
    );


  const fraction =
    absolute %
    100;


  const amount = [
    whole.toString(),
    ".",
    fraction
      .toString()
      .padStart(
        2,
        "0",
      ),
  ].join(
    "",
  );


  return negative
    ? `-${amount}`
    : amount;
}


/* ==========================================================================
   MONEY — ADDITION
   ========================================================================== */

function addMoney(
  accumulator:
    MoneyAccumulator,
  currency:
    string,
  amount:
    DecimalLike,
): void {
  const normalizedCurrency =
    normalizeCurrency(
      currency,
    );


  const previous =
    accumulator.get(
      normalizedCurrency,
    ) ??
    0;


  const next =
    previous +
    decimalToCents(
      amount,
    );


  if (
    !Number.isSafeInteger(
      next,
    )
  ) {
    throw new Error(
      "STATISTICS_MONEY_TOTAL_OUT_OF_RANGE",
    );
  }


  accumulator.set(
    normalizedCurrency,
    next,
  );
}


/* ==========================================================================
   MONEY — SÉRIALISATION
   ========================================================================== */

function serializeMoneyAccumulator(
  accumulator:
    MoneyAccumulator,
): ManagerStatisticsMoneyTotals {
  return Array
    .from(
      accumulator.entries(),
    )
    .sort(
      (
        [currencyA],
        [currencyB],
      ) =>
        currencyA.localeCompare(
          currencyB,
        ),
    )
    .map(
      (
        [
          currency,
          cents,
        ],
      ): ManagerStatisticsMoney => ({
        amount:
          centsToAmount(
            cents,
          ),

        currency,
      }),
    );
}


/* ==========================================================================
   POURCENTAGES
   ========================================================================== */

function roundPercentage(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.round(
    value *
      100,
  ) /
    100;
}


/* ==========================================================================
   COMPARAISON NUMÉRIQUE
   ========================================================================== */

function createNumberComparison(
  current:
    number,
  previous:
    number,
): ManagerStatisticsNumberComparison {
  const percentage =
    previous ===
      0
      ? null
      : roundPercentage(
          (
            (
              current -
              previous
            ) /
            previous
          ) *
            100,
        );


  let trend:
    ManagerStatisticsTrend;


  if (
    current ===
    previous
  ) {
    trend =
      "stable";
  } else if (
    previous ===
    0
  ) {
    trend =
      "unavailable";
  } else if (
    current >
    previous
  ) {
    trend =
      "up";
  } else {
    trend =
      "down";
  }


  return {
    current,

    previous,

    percentage,

    trend,
  };
}


/* ==========================================================================
   COMPARAISON MONÉTAIRE
   ========================================================================== */

function createMoneyComparisons(
  current:
    MoneyAccumulator,
  previous:
    MoneyAccumulator,
): readonly ManagerStatisticsMoneyComparison[] {
  const currencies =
    new Set<string>([
      ...current.keys(),
      ...previous.keys(),
    ]);


  return Array
    .from(
      currencies,
    )
    .sort()
    .map(
      (
        currency,
      ): ManagerStatisticsMoneyComparison => {
        const currentCents =
          current.get(
            currency,
          ) ??
          0;


        const previousCents =
          previous.get(
            currency,
          ) ??
          0;


        const percentage =
          previousCents ===
            0
            ? null
            : roundPercentage(
                (
                  (
                    currentCents -
                    previousCents
                  ) /
                  previousCents
                ) *
                  100,
              );


        let trend:
          ManagerStatisticsTrend;


        if (
          currentCents ===
          previousCents
        ) {
          trend =
            "stable";
        } else if (
          previousCents ===
          0
        ) {
          trend =
            "unavailable";
        } else if (
          currentCents >
          previousCents
        ) {
          trend =
            "up";
        } else {
          trend =
            "down";
        }


        return {
          currency,

          currentAmount:
            centsToAmount(
              currentCents,
            ),

          previousAmount:
            centsToAmount(
              previousCents,
            ),

          percentage,

          trend,
        };
      },
    );
}


/* ==========================================================================
   PART
   ========================================================================== */

function calculateSharePercentage(
  value:
    number,
  total:
    number,
): number {
  if (
    total <=
    0
  ) {
    return 0;
  }


  return roundPercentage(
    (
      value /
      total
    ) *
      100,
  );
}


/* ==========================================================================
   GRANULARITÉ DU CA
   ========================================================================== */

function getRevenueGranularity(
  period:
    ManagerStatisticsPeriod,
): ManagerStatisticsTimeGranularity {
  if (
    period.daysCount <=
    45
  ) {
    return "day";
  }


  if (
    period.daysCount <=
    180
  ) {
    return "week";
  }


  return "month";
}


/* ==========================================================================
   FORMAT DATE
   ========================================================================== */

const DAY_LABEL_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "numeric",

      month:
        "short",

      timeZone:
        "UTC",
    },
  );


const MONTH_LABEL_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      month:
        "short",

      year:
        "numeric",

      timeZone:
        "UTC",
    },
  );


function formatDayLabel(
  date:
    Date,
): string {
  return DAY_LABEL_FORMATTER.format(
    date,
  );
}


function formatMonthLabel(
  date:
    Date,
): string {
  return MONTH_LABEL_FORMATTER.format(
    date,
  );
}


/* ==========================================================================
   BUCKETS CA
   ========================================================================== */

function createRevenueBuckets(
  period:
    ManagerStatisticsPeriod,
  granularity:
    ManagerStatisticsTimeGranularity,
): readonly RevenueBucket[] {
  const start =
    new Date(
      period.startDateTime,
    );


  const endExclusive =
    new Date(
      period.endDateTimeExclusive,
    );


  /* ------------------------------------------------------------------------
     JOUR
     ------------------------------------------------------------------------ */

  if (
    granularity ===
    "day"
  ) {
    const buckets:
      RevenueBucket[] =
        [];


    let cursor =
      start;


    while (
      cursor.getTime() <
      endExclusive.getTime()
    ) {
      buckets.push({
        key:
          toDateString(
            cursor,
          ),

        label:
          formatDayLabel(
            cursor,
          ),
      });


      cursor =
        addUtcDays(
          cursor,
          1,
        );
    }


    return buckets;
  }


  /* ------------------------------------------------------------------------
     SEMAINE
     ------------------------------------------------------------------------ */

  if (
    granularity ===
    "week"
  ) {
    const buckets:
      RevenueBucket[] =
        [];


    let cursor =
      start;

    let index =
      0;


    const lastPeriodDay =
      addUtcDays(
        endExclusive,
        -1,
      );


    while (
      cursor.getTime() <
      endExclusive.getTime()
    ) {
      const theoreticalEnd =
        addUtcDays(
          cursor,
          6,
        );


      const actualEnd =
        theoreticalEnd.getTime() >
        lastPeriodDay.getTime()
          ? lastPeriodDay
          : theoreticalEnd;


      buckets.push({
        key:
          `week-${index}`,

        label:
          `${formatDayLabel(cursor)} – ${formatDayLabel(actualEnd)}`,
      });


      cursor =
        addUtcDays(
          cursor,
          7,
        );


      index +=
        1;
    }


    return buckets;
  }


  /* ------------------------------------------------------------------------
     MOIS
     ------------------------------------------------------------------------ */

  const buckets:
    RevenueBucket[] =
      [];


  let cursor =
    createUtcDate(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      1,
    );


  while (
    cursor.getTime() <
    endExclusive.getTime()
  ) {
    const key = [
      cursor.getUTCFullYear(),
      "-",
      padTwoDigits(
        cursor.getUTCMonth() +
          1,
      ),
    ].join(
      "",
    );


    buckets.push({
      key,

      label:
        formatMonthLabel(
          cursor,
        ),
    });


    cursor =
      createUtcDate(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth() +
          1,
        1,
      );
  }


  return buckets;
}


/* ==========================================================================
   CLÉ BUCKET CA
   ========================================================================== */

function getRevenueBucketKey(
  date:
    Date,
  period:
    ManagerStatisticsPeriod,
  granularity:
    ManagerStatisticsTimeGranularity,
): string {
  if (
    granularity ===
    "day"
  ) {
    return toDateString(
      date,
    );
  }


  if (
    granularity ===
    "week"
  ) {
    const start =
      new Date(
        period.startDateTime,
      );


    const difference =
      date.getTime() -
      start.getTime();


    const index =
      Math.max(
        0,
        Math.floor(
          difference /
            (
              7 *
              DAY_IN_MS
            ),
        ),
      );


    return `week-${index}`;
  }


  return [
    date.getUTCFullYear(),
    "-",
    padTwoDigits(
      date.getUTCMonth() +
        1,
    ),
  ].join(
    "",
  );
}


/* ==========================================================================
   SÉRIE CA
   ========================================================================== */

function buildRevenueSeries(
  payments:
    readonly {
      readonly currency:
        string;

      readonly amount:
        DecimalLike;

      readonly paidAt:
        Date | null;
    }[],
  period:
    ManagerStatisticsPeriod,
): readonly ManagerStatisticsRevenueSeries[] {
  const granularity =
    getRevenueGranularity(
      period,
    );


  const buckets =
    createRevenueBuckets(
      period,
      granularity,
    );


  const valuesByCurrency =
    new Map<
      string,
      Map<
        string,
        number
      >
    >();


  for (
    const payment of
    payments
  ) {
    if (
      !payment.paidAt
    ) {
      continue;
    }


    const currency =
      normalizeCurrency(
        payment.currency,
      );


    let values =
      valuesByCurrency.get(
        currency,
      );


    if (
      !values
    ) {
      values =
        new Map<
          string,
          number
        >();


      valuesByCurrency.set(
        currency,
        values,
      );
    }


    const key =
      getRevenueBucketKey(
        payment.paidAt,
        period,
        granularity,
      );


    values.set(
      key,
      (
        values.get(
          key,
        ) ??
        0
      ) +
        decimalToCents(
          payment.amount,
        ),
    );
  }


  return Array
    .from(
      valuesByCurrency.entries(),
    )
    .sort(
      (
        [currencyA],
        [currencyB],
      ) =>
        currencyA.localeCompare(
          currencyB,
        ),
    )
    .map(
      (
        [
          currency,
          values,
        ],
      ): ManagerStatisticsRevenueSeries => ({
        currency,

        granularity,

        points:
          buckets.map(
            (
              bucket,
            ) => ({
              key:
                bucket.key,

              label:
                bucket.label,

              amount:
                centsToAmount(
                  values.get(
                    bucket.key,
                  ) ??
                    0,
                ),
            }),
          ),
      }),
    );
}


/* ==========================================================================
   COMMANDES PAR STATUT
   ========================================================================== */

function buildOrderStatusDistribution(
  orders:
    readonly {
      readonly status:
        OrderStatus;
    }[],
): readonly ManagerStatisticsOrderStatusDistributionItem[] {
  if (
    orders.length ===
    0
  ) {
    return [];
  }


  const counts =
    new Map<
      OrderStatus,
      number
    >();


  for (
    const order of
    orders
  ) {
    counts.set(
      order.status,
      (
        counts.get(
          order.status,
        ) ??
        0
      ) +
        1,
    );
  }


  return MANAGER_STATISTICS_ORDER_STATUSES
    .filter(
      (
        status,
      ) =>
        (
          counts.get(
            status,
          ) ??
          0
        ) >
        0,
    )
    .map(
      (
        status,
      ) => {
        const count =
          counts.get(
            status,
          ) ??
          0;


        return {
          status,

          count,

          percentage:
            calculateSharePercentage(
              count,
              orders.length,
            ),
        };
      },
    );
}


/* ==========================================================================
   PAIEMENTS PAR MODE
   ========================================================================== */

function buildPaymentDistribution(
  payments:
    readonly {
      readonly method:
        (
          typeof MANAGER_STATISTICS_PAYMENT_METHODS
        )[number];

      readonly currency:
        string;

      readonly amount:
        DecimalLike;
    }[],
): readonly ManagerStatisticsPaymentDistributionItem[] {
  if (
    payments.length ===
    0
  ) {
    return [];
  }


  const counts =
    new Map<
      (
        typeof MANAGER_STATISTICS_PAYMENT_METHODS
      )[number],
      number
    >();


  const totals =
    new Map<
      (
        typeof MANAGER_STATISTICS_PAYMENT_METHODS
      )[number],
      MoneyAccumulator
    >();


  for (
    const payment of
    payments
  ) {
    counts.set(
      payment.method,
      (
        counts.get(
          payment.method,
        ) ??
        0
      ) +
        1,
    );


    let methodTotals =
      totals.get(
        payment.method,
      );


    if (
      !methodTotals
    ) {
      methodTotals =
        new Map<
          string,
          number
        >();


      totals.set(
        payment.method,
        methodTotals,
      );
    }


    addMoney(
      methodTotals,
      payment.currency,
      payment.amount,
    );
  }


  return MANAGER_STATISTICS_PAYMENT_METHODS
    .filter(
      (
        method,
      ) =>
        (
          counts.get(
            method,
          ) ??
          0
        ) >
        0,
    )
    .map(
      (
        method,
      ) => {
        const count =
          counts.get(
            method,
          ) ??
          0;


        return {
          method,

          count,

          percentage:
            calculateSharePercentage(
              count,
              payments.length,
            ),

          totals:
            serializeMoneyAccumulator(
              totals.get(
                method,
              ) ??
                new Map<
                  string,
                  number
                >(),
            ),
        };
      },
    );
}


/* ==========================================================================
   CLIENTS UNIQUES
   ========================================================================== */

function countUniqueCustomers(
  orders:
    readonly {
      readonly customerId:
        string | null;
    }[],
): number {
  const customerIds =
    new Set<string>();


  for (
    const order of
    orders
  ) {
    if (
      order.customerId
    ) {
      customerIds.add(
        order.customerId,
      );
    }
  }


  return customerIds.size;
}


/* ==========================================================================
   UNITÉS VENDUES
   ========================================================================== */

function countProductsSold(
  items:
    readonly {
      readonly quantity:
        number;
    }[],
): number {
  return items.reduce(
    (
      total,
      item,
    ) =>
      total +
      item.quantity,
    0,
  );
}


/* ==========================================================================
   CATÉGORIES
   ========================================================================== */

function buildCategorySales(
  items:
    readonly SaleItemRecord[],
): readonly ManagerStatisticsCategorySalesItem[] {
  if (
    items.length ===
    0
  ) {
    return [];
  }


  const totalQuantity =
    countProductsSold(
      items,
    );


  const categories =
    new Map<
      string,
      MutableCategorySale
    >();


  for (
    const item of
    items
  ) {
    const category =
      item
        .storeProduct
        ?.product
        .category ??
      null;


    const key =
      category?.id ??
      "__UNCATEGORIZED__";


    let entry =
      categories.get(
        key,
      );


    if (
      !entry
    ) {
      entry = {
        categoryId:
          category?.id ??
          null,

        categoryName:
          category?.name ??
          null,

        quantitySold:
          0,

        revenue:
          new Map<
            string,
            number
          >(),
      };


      categories.set(
        key,
        entry,
      );
    }


    entry.quantitySold +=
      item.quantity;


    addMoney(
      entry.revenue,
      item.order.currency,
      item.totalPrice,
    );
  }


  return Array
    .from(
      categories.values(),
    )
    .sort(
      (
        a,
        b,
      ) =>
        b.quantitySold -
        a.quantitySold,
    )
    .map(
      (
        category,
      ) => ({
        categoryId:
          category.categoryId,

        categoryName:
          category.categoryName,

        quantitySold:
          category.quantitySold,

        quantitySharePercentage:
          calculateSharePercentage(
            category.quantitySold,
            totalQuantity,
          ),

        revenue:
          serializeMoneyAccumulator(
            category.revenue,
          ),
      }),
    );
}


/* ==========================================================================
   IMAGE PRINCIPALE
   ========================================================================== */

function getPrimaryProductImage(
  images:
    StoreProductMetadata["product"]["images"],
): {
  url:
    string;

  altText:
    string | null;
} | null {
  if (
    images.length ===
    0
  ) {
    return null;
  }


  const primary =
    images.find(
      (
        image,
      ) =>
        image.isPrimary,
    ) ??
    images[0];


  return {
    url:
      primary.url,

    altText:
      primary.altText,
  };
}


/* ==========================================================================
   TOP PRODUITS
   ========================================================================== */

function buildTopProducts(
  items:
    readonly SaleItemRecord[],
): readonly ManagerStatisticsTopProduct[] {
  const products =
    new Map<
      string,
      MutableTopProduct
    >();


  for (
    const item of
    items
  ) {
    const storeProduct =
      item.storeProduct;


    /**
     * La ligne historique reste valable pour le KPI même si le StoreProduct
     * n'existe plus.
     *
     * Mais sans StoreProduct réel, on ne crée pas de faux lien produit.
     */

    if (
      !storeProduct
    ) {
      continue;
    }


    let entry =
      products.get(
        storeProduct.id,
      );


    if (
      !entry
    ) {
      entry = {
        storeProductId:
          storeProduct.id,

        productId:
          storeProduct.product.id,

        productName:
          storeProduct.product.name,

        sku:
          item.sku ??
          storeProduct.product.sku,

        categoryId:
          storeProduct
            .product
            .category
            ?.id ??
          null,

        categoryName:
          storeProduct
            .product
            .category
            ?.name ??
          null,

        image:
          getPrimaryProductImage(
            storeProduct
              .product
              .images,
          ),

        quantitySold:
          0,

        revenue:
          new Map<
            string,
            number
          >(),

        stockQuantity:
          storeProduct.stockQuantity,

        lowStockThreshold:
          storeProduct.lowStockThreshold,
      };


      products.set(
        storeProduct.id,
        entry,
      );
    }


    entry.quantitySold +=
      item.quantity;


    addMoney(
      entry.revenue,
      item.order.currency,
      item.totalPrice,
    );
  }


  return Array
    .from(
      products.values(),
    )
    .sort(
      (
        first,
        second,
      ) => {
        const quantityDifference =
          second.quantitySold -
          first.quantitySold;


        if (
          quantityDifference !==
          0
        ) {
          return quantityDifference;
        }


        return first.productName.localeCompare(
          second.productName,
          "fr",
        );
      },
    )
    .slice(
      0,
      TOP_PRODUCTS_LIMIT,
    )
    .map(
      (
        product,
      ) => ({
        storeProductId:
          product.storeProductId,

        productId:
          product.productId,

        productName:
          product.productName,

        sku:
          product.sku,

        categoryId:
          product.categoryId,

        categoryName:
          product.categoryName,

        image:
          product.image,

        quantitySold:
          product.quantitySold,

        revenue:
          serializeMoneyAccumulator(
            product.revenue,
          ),

        stockQuantity:
          product.stockQuantity,

        lowStockThreshold:
          product.lowStockThreshold,
      }),
    );
}


/* ==========================================================================
   DERNIÈRES COMMANDES
   ========================================================================== */

function buildLatestOrders(
  orders:
    readonly {
      readonly id:
        string;

      readonly orderNumber:
        string;

      readonly customerFirstName:
        string;

      readonly customerLastName:
        string;

      readonly totalAmount:
        DecimalLike;

      readonly currency:
        string;

      readonly status:
        OrderStatus;

      readonly createdAt:
        Date;
    }[],
): readonly ManagerStatisticsLatestOrder[] {
  return orders
    .slice(
      0,
      LATEST_ORDERS_LIMIT,
    )
    .map(
      (
        order,
      ) => {
        const customerName = [
          order.customerFirstName.trim(),
          order.customerLastName.trim(),
        ]
          .filter(
            Boolean,
          )
          .join(
            " ",
          );


        return {
          id:
            order.id,

          orderNumber:
            order.orderNumber,

          customerName:
            customerName ||
            "—",

          amount: {
            amount:
              centsToAmount(
                decimalToCents(
                  order.totalAmount,
                ),
              ),

            currency:
              normalizeCurrency(
                order.currency,
              ),
          },

          status:
            order.status,

          createdAt:
            order
              .createdAt
              .toISOString(),
        };
      },
    );
}


/* ==========================================================================
   PERFORMANCE PAR VILLE
   ========================================================================== */

function buildCityPerformance({
  payments,
  saleItems,
  ordersById,
}: {
  readonly payments:
    readonly {
      readonly orderId:
        string;

      readonly currency:
        string;

      readonly amount:
        DecimalLike;
    }[];

  readonly saleItems:
    readonly SaleItemRecord[];

  readonly ordersById:
    ReadonlyMap<
      string,
      OrderMetadata
    >;
}): readonly ManagerStatisticsCityPerformanceItem[] {
  const cities =
    new Map<
      string,
      MutableCityPerformance
    >();


  function getCityEntry(
    rawCity:
      string | null,
  ): MutableCityPerformance | null {
    const city =
      rawCity?.trim() ??
      "";


    if (
      !city
    ) {
      return null;
    }


    const key =
      city.toLocaleLowerCase(
        "fr",
      );


    let entry =
      cities.get(
        key,
      );


    if (
      !entry
    ) {
      entry = {
        city,

        orderIds:
          new Set<string>(),

        productsSold:
          0,

        revenue:
          new Map<
            string,
            number
          >(),
      };


      cities.set(
        key,
        entry,
      );
    }


    return entry;
  }


  /* ------------------------------------------------------------------------
     CA RÉEL PAYÉ
     ------------------------------------------------------------------------ */

  for (
    const payment of
    payments
  ) {
    const order =
      ordersById.get(
        payment.orderId,
      );


    const entry =
      getCityEntry(
        order?.shippingCity ??
          null,
      );


    if (
      !entry
    ) {
      continue;
    }


    entry.orderIds.add(
      payment.orderId,
    );


    addMoney(
      entry.revenue,
      payment.currency,
      payment.amount,
    );
  }


  /* ------------------------------------------------------------------------
     PRODUITS VENDUS
     ------------------------------------------------------------------------ */

  for (
    const item of
    saleItems
  ) {
    const entry =
      getCityEntry(
        item.order.shippingCity,
      );


    if (
      !entry
    ) {
      continue;
    }


    entry.orderIds.add(
      item.orderId,
    );


    entry.productsSold +=
      item.quantity;
  }


  return Array
    .from(
      cities.values(),
    )
    .sort(
      (
        first,
        second,
      ) => {
        const orderDifference =
          second.orderIds.size -
          first.orderIds.size;


        if (
          orderDifference !==
          0
        ) {
          return orderDifference;
        }


        const productsDifference =
          second.productsSold -
          first.productsSold;


        if (
          productsDifference !==
          0
        ) {
          return productsDifference;
        }


        return first.city.localeCompare(
          second.city,
          "fr",
        );
      },
    )
    .map(
      (
        city,
      ) => ({
        city:
          city.city,

        ordersCount:
          city.orderIds.size,

        productsSold:
          city.productsSold,

        revenue:
          serializeMoneyAccumulator(
            city.revenue,
          ),
      }),
    );
}


/* ==========================================================================
   INSIGHT
   ========================================================================== */

function buildPerformanceInsight(
  comparisons:
    readonly ManagerStatisticsMoneyComparison[],
): ManagerStatisticsPerformanceInsight | null {
  /**
   * Plusieurs devises :
   *
   * on ne crée pas une conclusion globale artificielle.
   */

  if (
    comparisons.length !==
    1
  ) {
    return null;
  }


  const comparison =
    comparisons[0];


  if (
    comparison.percentage ===
      null ||
    comparison.trend ===
      "unavailable"
  ) {
    return null;
  }


  const trend =
    comparison.trend;


  let kind:
    ManagerStatisticsPerformanceInsight["kind"];


  if (
    trend ===
    "up"
  ) {
    kind =
      "revenue-increase";
  } else if (
    trend ===
    "down"
  ) {
    kind =
      "revenue-decrease";
  } else {
    kind =
      "revenue-stable";
  }


  return {
    kind,

    currency:
      comparison.currency,

    currentAmount:
      comparison.currentAmount,

    previousAmount:
      comparison.previousAmount,

    percentage:
      comparison.percentage,

    trend,
  };
}


/* ==========================================================================
   RECOMMANDATION
   ========================================================================== */

function buildRecommendation(
  topProducts:
    readonly ManagerStatisticsTopProduct[],
): ManagerStatisticsRecommendation | null {
  const candidate =
    topProducts.find(
      (
        product,
      ) =>
        product.quantitySold >
          0 &&
        product.stockQuantity <=
          product.lowStockThreshold,
    );


  if (
    !candidate
  ) {
    return null;
  }


  return {
    kind:
      "top-seller-low-stock",

    productId:
      candidate.productId,

    storeProductId:
      candidate.storeProductId,

    productName:
      candidate.productName,

    quantitySold:
      candidate.quantitySold,

    stockQuantity:
      candidate.stockQuantity,

    lowStockThreshold:
      candidate.lowStockThreshold,
  };
}


/* ==========================================================================
   ACTIVITÉ
   ========================================================================== */

function buildActivitySummary({
  ordersCount,
  paidPaymentsCount,
  productsSoldCount,
  deliveriesCount,
}: {
  readonly ordersCount:
    number;

  readonly paidPaymentsCount:
    number;

  readonly productsSoldCount:
    number;

  readonly deliveriesCount:
    number;
}): ManagerStatisticsActivitySummary {
  const hasOrders =
    ordersCount >
    0;


  const hasPaidPayments =
    paidPaymentsCount >
    0;


  const hasProductsSold =
    productsSoldCount >
    0;


  const hasDeliveries =
    deliveriesCount >
    0;


  return {
    hasOrders,

    hasPaidPayments,

    hasProductsSold,

    hasDeliveries,

    hasActivity:
      hasOrders ||
      hasPaidPayments ||
      hasProductsSold ||
      hasDeliveries,
  };
}


/* ==========================================================================
   QUERY PRINCIPALE
   ========================================================================== */

export async function getManagerStatisticsPageData(
  input:
    GetManagerStatisticsPageDataInput = {},
): Promise<ManagerStatisticsPageData> {
  /* ------------------------------------------------------------------------
     1. ACCÈS PRIVÉ
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    typeof access.store.id ===
      "string"
      ? access.store.id.trim()
      : "";


  if (
    !storeId
  ) {
    throw new Error(
      "MANAGER_STATISTICS_STORE_CONTEXT_INVALID",
    );
  }


  /* ------------------------------------------------------------------------
     2. PÉRIODES
     ------------------------------------------------------------------------ */

  const period =
    resolveStatisticsPeriod(
      input,
      new Date(),
    );


  const previousPeriod =
    createPreviousPeriod(
      period,
    );


  const filters =
    createStatisticsFilters(
      period,
    );


  const currentStart =
    new Date(
      period.startDateTime,
    );


  const currentEnd =
    new Date(
      period.endDateTimeExclusive,
    );


  const previousStart =
    new Date(
      previousPeriod.startDateTime,
    );


  const previousEnd =
    new Date(
      previousPeriod.endDateTimeExclusive,
    );


  /* ------------------------------------------------------------------------
     3. COMMANDES + PAIEMENTS + LIVRAISONS
     ------------------------------------------------------------------------ */

  const [
    ordersForComparison,
    paidPaymentsForComparison,
    currentDeliveriesCount,
    previousDeliveriesCount,
  ] =
    await Promise.all([
      db.order.findMany({
        where: {
          storeId,

          createdAt: {
            gte:
              previousStart,

            lt:
              currentEnd,
          },
        },

        select: {
          id:
            true,

          orderNumber:
            true,

          customerId:
            true,

          customerFirstName:
            true,

          customerLastName:
            true,

          status:
            true,

          currency:
            true,

          totalAmount:
            true,

          shippingCity:
            true,

          createdAt:
            true,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      }),


      db.payment.findMany({
        where: {
          storeId,

          status:
            PaymentStatus.PAID,

          paidAt: {
            gte:
              previousStart,

            lt:
              currentEnd,
          },
        },

        select: {
          id:
            true,

          orderId:
            true,

          method:
            true,

          currency:
            true,

          amount:
            true,

          paidAt:
            true,
        },
      }),


      db.shipment.count({
        where: {
          storeId,

          createdAt: {
            gte:
              currentStart,

            lt:
              currentEnd,
          },
        },
      }),


      db.shipment.count({
        where: {
          storeId,

          createdAt: {
            gte:
              previousStart,

            lt:
              previousEnd,
          },
        },
      }),
    ]);


  /* =========================================================================
     4. COMMANDES ACTUELLES / PRÉCÉDENTES
     ========================================================================= */

  const currentOrders =
    ordersForComparison.filter(
      (
        order,
      ) =>
        order.createdAt.getTime() >=
        currentStart.getTime(),
    );


  const previousOrders =
    ordersForComparison.filter(
      (
        order,
      ) =>
        order.createdAt.getTime() <
        currentStart.getTime(),
    );


  /* =========================================================================
     5. PAIEMENTS ACTUELS / PRÉCÉDENTS
     ========================================================================= */

  const currentPayments =
    paidPaymentsForComparison.filter(
      (
        payment,
      ) =>
        payment.paidAt !==
          null &&
        payment.paidAt.getTime() >=
          currentStart.getTime(),
    );


  const previousPayments =
    paidPaymentsForComparison.filter(
      (
        payment,
      ) =>
        payment.paidAt !==
          null &&
        payment.paidAt.getTime() <
          currentStart.getTime(),
    );


  /* =========================================================================
     6. CA
     ========================================================================= */

  const currentRevenue:
    MoneyAccumulator =
      new Map<
        string,
        number
      >();


  const previousRevenue:
    MoneyAccumulator =
      new Map<
        string,
        number
      >();


  for (
    const payment of
    currentPayments
  ) {
    addMoney(
      currentRevenue,
      payment.currency,
      payment.amount,
    );
  }


  for (
    const payment of
    previousPayments
  ) {
    addMoney(
      previousRevenue,
      payment.currency,
      payment.amount,
    );
  }


  const revenueComparisons =
    createMoneyComparisons(
      currentRevenue,
      previousRevenue,
    );


  /* =========================================================================
     7. COMMANDES AYANT UN PAIEMENT DANS LES DEUX PÉRIODES
     ========================================================================= */

  const candidatePaidOrderIds =
    Array.from(
      new Set(
        paidPaymentsForComparison.map(
          (
            payment,
          ) =>
            payment.orderId,
        ),
      ),
    );


  /* =========================================================================
     8. PREMIÈRE DATE PAID RÉELLE
     =========================================================================
     
     On ne considère pas seulement la fenêtre courante.
     
     Cela empêche une ancienne commande déjà payée d'être comptée
     une seconde fois comme "produit vendu" si un autre paiement PAID
     est enregistré plus tard.
     ========================================================================= */

  const allPaidDatesForCandidateOrders =
    candidatePaidOrderIds.length ===
      0
      ? []
      : await db.payment.findMany({
          where: {
            storeId,

            status:
              PaymentStatus.PAID,

            orderId: {
              in:
                candidatePaidOrderIds,
            },

            paidAt: {
              not:
                null,
            },
          },

          select: {
            orderId:
              true,

            paidAt:
              true,
          },

          orderBy: {
            paidAt:
              "asc",
          },
        });


  const firstPaidAtByOrderId =
    new Map<
      string,
      Date
    >();


  for (
    const payment of
    allPaidDatesForCandidateOrders
  ) {
    if (
      !payment.paidAt ||
      firstPaidAtByOrderId.has(
        payment.orderId,
      )
    ) {
      continue;
    }


    firstPaidAtByOrderId.set(
      payment.orderId,
      payment.paidAt,
    );
  }


  /* =========================================================================
   9. MÉTADONNÉES DES COMMANDES PAYÉES
   ========================================================================= */

const saleOrderIds =
  Array
    .from(
      firstPaidAtByOrderId.entries(),
    )
    .filter(
      (
        [
          ,
          paidAt,
        ],
      ) =>
        paidAt.getTime() >=
          previousStart.getTime() &&
        paidAt.getTime() <
          currentEnd.getTime(),
    )
    .map(
      (
        [
          orderId,
        ],
      ) =>
        orderId,
    );


const saleOrders =
  saleOrderIds.length ===
    0
    ? []
    : await db.order.findMany({
        where: {
          storeId,

          id: {
            in:
              saleOrderIds,
          },

          status: {
            notIn:
              EXCLUDED_SALE_ORDER_STATUSES,
          },
        },

        select: {
          id:
            true,

          currency:
            true,

          shippingCity:
            true,

          status:
            true,
        },
      });


const saleOrdersById =
  new Map<
    string,
    OrderMetadata
  >(
    saleOrders.map(
      (
        order,
      ) => [
        order.id,
        {
          id:
            order.id,

          currency:
            order.currency,

          shippingCity:
            order.shippingCity,

          status:
            order.status,
        },
      ],
    ),
  );


const validSaleOrderIds =
  Array.from(
    saleOrdersById.keys(),
  );


  /* =========================================================================
     10. ORDER ITEMS — SCALAIRES UNIQUEMENT
     =========================================================================
     
     IMPORTANT :
     
     On ne dépend pas ici d'une inférence Prisma complexe incluant :
     
     order
     storeProduct
     
     Les relations nécessaires sont chargées séparément et recomposées
     explicitement plus bas.
     ========================================================================= */

  const rawSaleItems =
    validSaleOrderIds.length ===
      0
      ? []
      : await db.orderItem.findMany({
          where: {
            orderId: {
              in:
                validSaleOrderIds,
            },
          },

          select: {
            id:
              true,

            orderId:
              true,

            storeProductId:
              true,

            productName:
              true,

            sku:
              true,

            quantity:
              true,

            unitPrice:
              true,

            totalPrice:
              true,
          },
        });


  /* =========================================================================
     11. STORE PRODUCTS NÉCESSAIRES
     ========================================================================= */

  const storeProductIds =
    Array.from(
      new Set(
        rawSaleItems
          .map(
            (
              item,
            ) =>
              item.storeProductId,
          )
          .filter(
            (
              value,
            ): value is string =>
              typeof value ===
                "string" &&
              value.length >
                0,
          ),
      ),
    );


  const storeProducts =
    storeProductIds.length ===
      0
      ? []
      : await db.storeProduct.findMany({
          where: {
            storeId,

            id: {
              in:
                storeProductIds,
            },
          },

          select: {
            id:
              true,

            storeId:
              true,

            productId:
              true,

            stockQuantity:
              true,

            lowStockThreshold:
              true,

            product: {
              select: {
                id:
                  true,

                name:
                  true,

                sku:
                  true,

                category: {
                  select: {
                    id:
                      true,

                    name:
                      true,
                  },
                },

                images: {
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

                  orderBy: {
                    position:
                      "asc",
                  },
                },
              },
            },
          },
        });


  const storeProductsById =
    new Map<
      string,
      StoreProductMetadata
    >(
      storeProducts.map(
        (
          storeProduct,
        ) => [
          storeProduct.id,
          storeProduct,
        ],
      ),
    );


  /* =========================================================================
     12. RECOMPOSITION DES VENTES
     ========================================================================= */

  const saleItems:
    SaleItemRecord[] =
      [];


  for (
    const item of
    rawSaleItems
  ) {
    const order =
      saleOrdersById.get(
        item.orderId,
      );


    if (
      !order
    ) {
      continue;
    }


    const storeProduct =
      item.storeProductId
        ? (
            storeProductsById.get(
              item.storeProductId,
            ) ??
            null
          )
        : null;


    saleItems.push({
      id:
        item.id,

      orderId:
        item.orderId,

      storeProductId:
        item.storeProductId,

      productName:
        item.productName,

      sku:
        item.sku,

      quantity:
        item.quantity,

      unitPrice:
        item.unitPrice,

      totalPrice:
        item.totalPrice,

      order: {
        currency:
          order.currency,

        shippingCity:
          order.shippingCity,
      },

      storeProduct,
    });
  }


  /* =========================================================================
     13. VENTES ACTUELLES / PRÉCÉDENTES
     ========================================================================= */

  const currentSaleItems =
    saleItems.filter(
      (
        item,
      ) => {
        const paidAt =
          firstPaidAtByOrderId.get(
            item.orderId,
          );


        return (
          paidAt !==
            undefined &&
          paidAt.getTime() >=
            currentStart.getTime() &&
          paidAt.getTime() <
            currentEnd.getTime()
        );
      },
    );


  const previousSaleItems =
    saleItems.filter(
      (
        item,
      ) => {
        const paidAt =
          firstPaidAtByOrderId.get(
            item.orderId,
          );


        return (
          paidAt !==
            undefined &&
          paidAt.getTime() >=
            previousStart.getTime() &&
          paidAt.getTime() <
            previousEnd.getTime()
        );
      },
    );


  /* =========================================================================
     14. KPI
     ========================================================================= */

  const currentCustomersCount =
    countUniqueCustomers(
      currentOrders,
    );


  const previousCustomersCount =
    countUniqueCustomers(
      previousOrders,
    );


  const currentProductsSoldCount =
    countProductsSold(
      currentSaleItems,
    );


  const previousProductsSoldCount =
    countProductsSold(
      previousSaleItems,
    );


  const kpis:
    ManagerStatisticsKpis = {
    revenue: {
      current:
        serializeMoneyAccumulator(
          currentRevenue,
        ),

      previous:
        serializeMoneyAccumulator(
          previousRevenue,
        ),

      comparisons:
        revenueComparisons,
    },

    orders:
      createNumberComparison(
        currentOrders.length,
        previousOrders.length,
      ),

    customers:
      createNumberComparison(
        currentCustomersCount,
        previousCustomersCount,
      ),

    productsSold:
      createNumberComparison(
        currentProductsSoldCount,
        previousProductsSoldCount,
      ),

    deliveries:
      createNumberComparison(
        currentDeliveriesCount,
        previousDeliveriesCount,
      ),
  };


  /* =========================================================================
     15. SÉRIE CA
     ========================================================================= */

  const revenueSeries =
    buildRevenueSeries(
      currentPayments,
      period,
    );


  /* =========================================================================
     16. RÉPARTITION COMMANDES
     ========================================================================= */

  const orderStatusDistribution =
    buildOrderStatusDistribution(
      currentOrders,
    );


  /* =========================================================================
     17. CATÉGORIES
     ========================================================================= */

  const categorySales =
    buildCategorySales(
      currentSaleItems,
    );


  /* =========================================================================
     18. TOP PRODUITS
     ========================================================================= */

  const topProducts =
    buildTopProducts(
      currentSaleItems,
    );


  /* =========================================================================
     19. DERNIÈRES COMMANDES
     ========================================================================= */

  const latestOrders =
    buildLatestOrders(
      currentOrders,
    );


  /* =========================================================================
     20. RÉPARTITION PAIEMENTS
     ========================================================================= */

  const paymentDistribution =
    buildPaymentDistribution(
      currentPayments,
    );


  /* =========================================================================
     21. ORDERS POUR PERFORMANCE VILLE
     =========================================================================
     
     Certains paiements peuvent concerner une commande créée avant
     les deux périodes comparées.
     
     On récupère donc explicitement la ville de toutes les commandes
     concernées par les paiements actuels.
     ========================================================================= */

  const currentPaymentOrderIds =
    Array.from(
      new Set(
        currentPayments.map(
          (
            payment,
          ) =>
            payment.orderId,
        ),
      ),
    );


  const paymentOrders =
    currentPaymentOrderIds.length ===
      0
      ? []
      : await db.order.findMany({
          where: {
            storeId,

            id: {
              in:
                currentPaymentOrderIds,
            },
          },

          select: {
            id:
              true,

            currency:
              true,

            shippingCity:
              true,

            status:
              true,
          },
        });


  const paymentOrdersById =
    new Map<
      string,
      OrderMetadata
    >(
      paymentOrders.map(
        (
          order,
        ) => [
          order.id,
          {
            id:
              order.id,

            currency:
              order.currency,

            shippingCity:
              order.shippingCity,

            status:
              order.status,
          },
        ],
      ),
    );


  /**
   * Ajoute aussi les commandes utilisées par les ventes si elles ne
   * sont pas déjà présentes.
   */

  for (
    const [
      orderId,
      order,
    ] of
    saleOrdersById
  ) {
    if (
      !paymentOrdersById.has(
        orderId,
      )
    ) {
      paymentOrdersById.set(
        orderId,
        order,
      );
    }
  }


  /* =========================================================================
     22. PERFORMANCE VILLE
     ========================================================================= */

  const cityPerformance =
    buildCityPerformance({
      payments:
        currentPayments,

      saleItems:
        currentSaleItems,

      ordersById:
        paymentOrdersById,
    });


  /* =========================================================================
     23. INSIGHT
     ========================================================================= */

  const insight =
    buildPerformanceInsight(
      revenueComparisons,
    );


  /* =========================================================================
     24. RECOMMANDATION
     ========================================================================= */

  const recommendation =
    buildRecommendation(
      topProducts,
    );


  /* =========================================================================
     25. ACTIVITÉ
     ========================================================================= */

  const activity =
    buildActivitySummary({
      ordersCount:
        currentOrders.length,

      paidPaymentsCount:
        currentPayments.length,

      productsSoldCount:
        currentProductsSoldCount,

      deliveriesCount:
        currentDeliveriesCount,
    });


  /* =========================================================================
     26. RETOUR
     ========================================================================= */

  return {
    filters,

    period,

    previousPeriod,

    activity,

    kpis,

    revenueSeries,

    orderStatusDistribution,

    categorySales,

    topProducts,

    latestOrders,

    paymentDistribution,

    cityPerformance,

    insight,

    recommendation,
  };
}