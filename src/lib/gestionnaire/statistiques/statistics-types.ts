import type {
  OrderStatus,
  PaymentMethod,
} from "@prisma/client";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — TYPES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/statistiques/statistics-types.ts
 *
 * RÔLE :
 *
 * Centraliser tous les contrats TypeScript utilisés par :
 *
 * - statistics-query.ts
 * - StatisticsHeader.tsx
 * - StatisticsKpiGrid.tsx
 * - StatisticsCharts.tsx
 * - StatisticsTables.tsx
 * - StatisticsInsights.tsx
 * - StatisticsEmptyState.tsx
 * - page.tsx
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - lire le storeId ;
 * - accéder à PostgreSQL ;
 * - calculer les statistiques ;
 * - générer de fausses données ;
 * - effectuer de navigation ;
 * - contenir de JSX.
 *
 *
 * IMPORTANT :
 *
 * Les statistiques du projet sont scoppées par boutique.
 *
 * Le storeId ne fait volontairement PAS partie de l'input public de la page.
 *
 * Il sera récupéré côté serveur dans statistics-query.ts avec :
 *
 * requireGestionnairePrivateAccess()
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

export const MANAGER_STATISTICS_ROUTE =
  "/gestionnaire/statistiques" as const;


/* ==========================================================================
   DATE
   ========================================================================== */

/**
 * Format attendu dans les searchParams :
 *
 * YYYY-MM-DD
 */

export type ManagerStatisticsDateString =
  string;


/* ==========================================================================
   PÉRIODES
   ========================================================================== */

export const MANAGER_STATISTICS_PERIOD_PRESETS = [
  "today",
  "last7days",
  "last30days",
  "thisMonth",
  "previousMonth",
  "custom",
] as const;


export type ManagerStatisticsPeriodPreset =
  (typeof MANAGER_STATISTICS_PERIOD_PRESETS)[number];


/**
 * Période réellement utilisée pour les requêtes.
 *
 * startDate / endDate :
 * format public YYYY-MM-DD.
 *
 * startDateTime / endDateTimeExclusive :
 * dates ISO calculées côté serveur pour Prisma.
 */

export interface ManagerStatisticsPeriod {
  readonly preset:
    ManagerStatisticsPeriodPreset;

  readonly startDate:
    ManagerStatisticsDateString;

  readonly endDate:
    ManagerStatisticsDateString;

  readonly startDateTime:
    string;

  readonly endDateTimeExclusive:
    string;

  readonly daysCount:
    number;
}


/**
 * Période immédiatement précédente de même durée.
 *
 * Elle sert uniquement aux comparaisons KPI.
 */

export interface ManagerStatisticsPreviousPeriod {
  readonly startDate:
    ManagerStatisticsDateString;

  readonly endDate:
    ManagerStatisticsDateString;

  readonly startDateTime:
    string;

  readonly endDateTimeExclusive:
    string;

  readonly daysCount:
    number;
}


/* ==========================================================================
   FILTRES
   ========================================================================== */

export interface ManagerStatisticsFilters {
  readonly preset:
    ManagerStatisticsPeriodPreset;

  readonly from:
    ManagerStatisticsDateString;

  readonly to:
    ManagerStatisticsDateString;
}


/**
 * Input reçu par statistics-query.ts.
 *
 * Les valeurs sont optionnelles car la page doit pouvoir fonctionner
 * sans searchParams.
 *
 * IMPORTANT :
 *
 * Aucun :
 *
 * - storeId ;
 * - managerId ;
 * - revenue ;
 * - status métier ;
 *
 * n'est accepté ici.
 */

export interface GetManagerStatisticsPageDataInput {
  readonly preset?:
    string | null;

  readonly from?:
    string | null;

  readonly to?:
    string | null;
}


/* ==========================================================================
   MONNAIE
   ========================================================================== */

/**
 * Les montants Decimal Prisma sont sérialisés en string.
 *
 * Cela évite de transporter directement Decimal vers les Client Components.
 */

export interface ManagerStatisticsMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


/**
 * Certaines statistiques peuvent contenir plusieurs devises.
 *
 * On ne doit jamais additionner arbitrairement :
 *
 * XOF + EUR + USD
 *
 * Chaque devise reste donc séparée.
 */

export type ManagerStatisticsMoneyTotals =
  readonly ManagerStatisticsMoney[];


/* ==========================================================================
   ÉVOLUTION
   ========================================================================== */

export type ManagerStatisticsTrend =
  | "up"
  | "down"
  | "stable"
  | "unavailable";


/**
 * Comparaison pour les KPI numériques :
 *
 * - commandes ;
 * - clients ;
 * - unités vendues ;
 * - livraisons.
 */

export interface ManagerStatisticsNumberComparison {
  readonly current:
    number;

  readonly previous:
    number;

  /**
   * null :
   *
   * le pourcentage ne peut pas être calculé proprement,
   * notamment lorsque previous === 0.
   */
  readonly percentage:
    number | null;

  readonly trend:
    ManagerStatisticsTrend;
}


/**
 * Comparaison du chiffre d'affaires pour une devise précise.
 */

export interface ManagerStatisticsMoneyComparison {
  readonly currency:
    string;

  readonly currentAmount:
    string;

  readonly previousAmount:
    string;

  readonly percentage:
    number | null;

  readonly trend:
    ManagerStatisticsTrend;
}


/* ==========================================================================
   KPI
   ========================================================================== */

export interface ManagerStatisticsRevenueKpi {
  readonly current:
    ManagerStatisticsMoneyTotals;

  readonly previous:
    ManagerStatisticsMoneyTotals;

  readonly comparisons:
    readonly ManagerStatisticsMoneyComparison[];
}


export interface ManagerStatisticsKpis {
  readonly revenue:
    ManagerStatisticsRevenueKpi;

  readonly orders:
    ManagerStatisticsNumberComparison;

  readonly customers:
    ManagerStatisticsNumberComparison;

  readonly productsSold:
    ManagerStatisticsNumberComparison;

  readonly deliveries:
    ManagerStatisticsNumberComparison;
}


/* ==========================================================================
   GRANULARITÉ DU GRAPHIQUE
   ========================================================================== */

export type ManagerStatisticsTimeGranularity =
  | "day"
  | "week"
  | "month";


/* ==========================================================================
   ÉVOLUTION DU CHIFFRE D'AFFAIRES
   ========================================================================== */

export interface ManagerStatisticsRevenuePoint {
  /**
   * Clé stable.
   *
   * Exemple :
   *
   * 2026-09-21
   */
  readonly key:
    string;

  /**
   * Libellé destiné à l'interface.
   *
   * Exemple :
   *
   * 21 sept.
   */
  readonly label:
    string;

  readonly amount:
    string;
}


/**
 * Une série est toujours associée à UNE devise.
 *
 * Ainsi aucune devise différente n'est additionnée.
 */

export interface ManagerStatisticsRevenueSeries {
  readonly currency:
    string;

  readonly granularity:
    ManagerStatisticsTimeGranularity;

  readonly points:
    readonly ManagerStatisticsRevenuePoint[];
}


/* ==========================================================================
   STATUTS COMMANDES
   ========================================================================== */

export const MANAGER_STATISTICS_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];


/* ==========================================================================
   RÉPARTITION COMMANDES
   ========================================================================== */

export interface ManagerStatisticsOrderStatusDistributionItem {
  readonly status:
    OrderStatus;

  readonly count:
    number;

  /**
   * Part du nombre total de commandes.
   *
   * Valeur comprise entre 0 et 100.
   */
  readonly percentage:
    number;
}


/* ==========================================================================
   MODES DE PAIEMENT
   ========================================================================== */

export const MANAGER_STATISTICS_PAYMENT_METHODS = [
  "CASH",
  "MOBILE_MONEY",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
] as const satisfies readonly PaymentMethod[];


/* ==========================================================================
   RÉPARTITION PAIEMENTS
   ========================================================================== */

export interface ManagerStatisticsPaymentDistributionItem {
  readonly method:
    PaymentMethod;

  readonly count:
    number;

  /**
   * Part basée sur le nombre réel de paiements concernés.
   */
  readonly percentage:
    number;

  /**
   * Montants séparés par devise.
   */
  readonly totals:
    ManagerStatisticsMoneyTotals;
}


/* ==========================================================================
   VENTES PAR CATÉGORIE
   ========================================================================== */

export interface ManagerStatisticsCategorySalesItem {
  readonly categoryId:
    string | null;

  readonly categoryName:
    string | null;

  /**
   * Nombre total d'unités vendues.
   */
  readonly quantitySold:
    number;

  /**
   * Part calculée sur les unités vendues.
   *
   * Ce choix évite de mélanger plusieurs devises.
   */
  readonly quantitySharePercentage:
    number;

  /**
   * Chiffre d'affaires séparé par devise.
   */
  readonly revenue:
    ManagerStatisticsMoneyTotals;
}


/* ==========================================================================
   PRODUITS LES PLUS VENDUS
   ========================================================================== */

export interface ManagerStatisticsTopProductImage {
  readonly url:
    string;

  readonly altText:
    string | null;
}


export interface ManagerStatisticsTopProduct {
  /**
   * StoreProduct réellement vendu.
   */
  readonly storeProductId:
    string;

  /**
   * Product correspondant.
   *
   * Cet identifiant permet notamment d'utiliser la route existante :
   *
   * /gestionnaire/produits/[productId]
   */
  readonly productId:
    string;

  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly categoryId:
    string | null;

  readonly categoryName:
    string | null;

  readonly image:
    ManagerStatisticsTopProductImage | null;

  readonly quantitySold:
    number;

  readonly revenue:
    ManagerStatisticsMoneyTotals;

  /**
   * Stock actuel.
   *
   * Cette valeur peut être utilisée par une recommandation réelle.
   */
  readonly stockQuantity:
    number;

  readonly lowStockThreshold:
    number;
}


/* ==========================================================================
   DERNIÈRES COMMANDES
   ========================================================================== */

export interface ManagerStatisticsLatestOrder {
  readonly id:
    string;

  readonly orderNumber:
    string;

  readonly customerName:
    string;

  readonly amount:
    ManagerStatisticsMoney;

  readonly status:
    OrderStatus;

  /**
   * ISO Date string.
   */
  readonly createdAt:
    string;
}


/* ==========================================================================
   PERFORMANCE PAR VILLE
   ========================================================================== */

export interface ManagerStatisticsCityPerformanceItem {
  readonly city:
    string;

  readonly ordersCount:
    number;

  readonly productsSold:
    number;

  readonly revenue:
    ManagerStatisticsMoneyTotals;
}


/* ==========================================================================
   SYNTHÈSE PERFORMANCE
   ========================================================================== */

export type ManagerStatisticsInsightKind =
  | "revenue-increase"
  | "revenue-decrease"
  | "revenue-stable";


export interface ManagerStatisticsPerformanceInsight {
  readonly kind:
    ManagerStatisticsInsightKind;

  /**
   * Devise utilisée pour cette analyse.
   */
  readonly currency:
    string;

  readonly currentAmount:
    string;

  readonly previousAmount:
    string;

  readonly percentage:
    number;

  readonly trend:
    Exclude<
      ManagerStatisticsTrend,
      "unavailable"
    >;
}


/* ==========================================================================
   RECOMMANDATION
   ========================================================================== */

/**
 * Pour cette première version, nous ne créons qu'une recommandation
 * objectivement justifiable par les données :
 *
 * produit très vendu + stock faible.
 */

export type ManagerStatisticsRecommendationKind =
  "top-seller-low-stock";


export interface ManagerStatisticsRecommendation {
  readonly kind:
    ManagerStatisticsRecommendationKind;

  readonly productId:
    string;

  readonly storeProductId:
    string;

  readonly productName:
    string;

  readonly quantitySold:
    number;

  readonly stockQuantity:
    number;

  readonly lowStockThreshold:
    number;
}


/* ==========================================================================
   ÉTAT GLOBAL
   ========================================================================== */

export interface ManagerStatisticsActivitySummary {
  readonly hasOrders:
    boolean;

  readonly hasPaidPayments:
    boolean;

  readonly hasProductsSold:
    boolean;

  readonly hasDeliveries:
    boolean;

  /**
   * true si au moins une donnée métier pertinente existe
   * sur la période sélectionnée.
   */
  readonly hasActivity:
    boolean;
}


/* ==========================================================================
   PAGE DATA
   ========================================================================== */

/**
 * Contrat complet retourné par :
 *
 * getManagerStatisticsPageData()
 */

export interface ManagerStatisticsPageData {
  readonly filters:
    ManagerStatisticsFilters;

  readonly period:
    ManagerStatisticsPeriod;

  readonly previousPeriod:
    ManagerStatisticsPreviousPeriod;

  readonly activity:
    ManagerStatisticsActivitySummary;

  readonly kpis:
    ManagerStatisticsKpis;

  readonly revenueSeries:
    readonly ManagerStatisticsRevenueSeries[];

  readonly orderStatusDistribution:
    readonly ManagerStatisticsOrderStatusDistributionItem[];

  readonly categorySales:
    readonly ManagerStatisticsCategorySalesItem[];

  readonly topProducts:
    readonly ManagerStatisticsTopProduct[];

  readonly latestOrders:
    readonly ManagerStatisticsLatestOrder[];

  readonly paymentDistribution:
    readonly ManagerStatisticsPaymentDistributionItem[];

  readonly cityPerformance:
    readonly ManagerStatisticsCityPerformanceItem[];

  readonly insight:
    ManagerStatisticsPerformanceInsight | null;

  readonly recommendation:
    ManagerStatisticsRecommendation | null;
}


/* ==========================================================================
   LABELS — PÉRIODE
   ========================================================================== */

const MANAGER_STATISTICS_PERIOD_LABELS:
  Readonly<
    Record<
      ManagerStatisticsPeriodPreset,
      string
    >
  > = {
  today:
    "Aujourd’hui",

  last7days:
    "7 derniers jours",

  last30days:
    "30 derniers jours",

  thisMonth:
    "Ce mois",

  previousMonth:
    "Mois précédent",

  custom:
    "Période personnalisée",
};


export function getManagerStatisticsPeriodLabel(
  preset:
    ManagerStatisticsPeriodPreset,
): string {
  return MANAGER_STATISTICS_PERIOD_LABELS[
    preset
  ];
}


/* ==========================================================================
   LABELS — COMMANDES
   ========================================================================== */

const MANAGER_STATISTICS_ORDER_STATUS_LABELS:
  Readonly<
    Record<
      OrderStatus,
      string
    >
  > = {
  PENDING:
    "En attente",

  CONFIRMED:
    "Confirmée",

  PROCESSING:
    "En traitement",

  READY:
    "À préparer",

  SHIPPED:
    "Expédiée",

  DELIVERED:
    "Livrée",

  CANCELLED:
    "Annulée",

  REFUNDED:
    "Remboursée",
};


export function getManagerStatisticsOrderStatusLabel(
  status:
    OrderStatus,
): string {
  return MANAGER_STATISTICS_ORDER_STATUS_LABELS[
    status
  ];
}


/* ==========================================================================
   LABELS — PAIEMENTS
   ========================================================================== */

const MANAGER_STATISTICS_PAYMENT_METHOD_LABELS:
  Readonly<
    Record<
      PaymentMethod,
      string
    >
  > = {
  CASH:
    "Espèces",

  MOBILE_MONEY:
    "Mobile Money",

  CARD:
    "Carte",

  BANK_TRANSFER:
    "Virement bancaire",

  OTHER:
    "Autre",
};


export function getManagerStatisticsPaymentMethodLabel(
  method:
    PaymentMethod,
): string {
  return MANAGER_STATISTICS_PAYMENT_METHOD_LABELS[
    method
  ];
}


/* ==========================================================================
   TYPE GUARDS — PÉRIODES
   ========================================================================== */

export function isManagerStatisticsPeriodPreset(
  value:
    unknown,
): value is ManagerStatisticsPeriodPreset {
  return (
    typeof value ===
      "string" &&
    (
      MANAGER_STATISTICS_PERIOD_PRESETS as
        readonly string[]
    ).includes(
      value,
    )
  );
}


/* ==========================================================================
   TYPE GUARDS — ORDER STATUS
   ========================================================================== */

export function isManagerStatisticsOrderStatus(
  value:
    unknown,
): value is OrderStatus {
  return (
    typeof value ===
      "string" &&
    (
      MANAGER_STATISTICS_ORDER_STATUSES as
        readonly string[]
    ).includes(
      value,
    )
  );
}


/* ==========================================================================
   TYPE GUARDS — PAYMENT METHOD
   ========================================================================== */

export function isManagerStatisticsPaymentMethod(
  value:
    unknown,
): value is PaymentMethod {
  return (
    typeof value ===
      "string" &&
    (
      MANAGER_STATISTICS_PAYMENT_METHODS as
        readonly string[]
    ).includes(
      value,
    )
  );
}


/* ==========================================================================
   DEFAULT FILTERS
   ========================================================================== */

/**
 * Les dates ne sont volontairement PAS fixées ici.
 *
 * Elles doivent être calculées côté serveur à partir de la vraie date
 * du moment dans statistics-query.ts.
 */

export const DEFAULT_MANAGER_STATISTICS_PERIOD_PRESET:
  ManagerStatisticsPeriodPreset =
    "thisMonth";