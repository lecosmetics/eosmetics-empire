import type {
  OrderSource,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from "@prisma/client";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/orders/order-types.ts
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par :
 *
 * - /gestionnaire/commandes
 * - /gestionnaire/commandes/[orderId]
 * - order-query.ts
 * - les composants de la liste des commandes
 * - les composants du détail d'une commande
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne contient aucune fausse commande ;
 * - ne contient aucun faux montant ;
 * - ne contient aucun faux client ;
 * - ne contient aucune devise forcée ;
 * - ne reçoit aucun storeId depuis le navigateur ;
 * - ne reçoit aucun managerId depuis le navigateur ;
 * - respecte les statuts réellement présents dans Prisma.
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS
   ========================================================================== */

export type ManagerOrderId =
  string;


export type ManagerOrderItemId =
  string;


export type ManagerOrderPaymentId =
  string;


export type ManagerOrderShipmentId =
  string;


/* ==========================================================================
   PAGINATION
   ========================================================================== */

export const MANAGER_ORDERS_PAGE_SIZE =
  10;


export interface ManagerOrdersPagination {
  readonly page:
    number;

  readonly pageSize:
    number;

  readonly totalItems:
    number;

  readonly totalPages:
    number;

  readonly startItem:
    number;

  readonly endItem:
    number;

  readonly hasPreviousPage:
    boolean;

  readonly hasNextPage:
    boolean;
}


/* ==========================================================================
   STATUTS COMMANDE
   ========================================================================== */

/**
 * Liste strictement basée sur OrderStatus du schema Prisma actuel.
 *
 * REFUNDED existe réellement dans OrderStatus.
 *
 * RETURNED n'existe PAS dans OrderStatus.
 * RETURNED appartient à ShipmentStatus.
 */

export const MANAGER_ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const satisfies readonly OrderStatus[];


export type ManagerOrderStatus =
  (typeof MANAGER_ORDER_STATUSES)[number];


/* ==========================================================================
   STATUTS PAIEMENT
   ========================================================================== */

/**
 * Liste strictement basée sur PaymentStatus.
 *
 * UNPAID n'existe pas dans le schema actuel.
 */

export const MANAGER_PAYMENT_STATUSES = [
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const satisfies readonly PaymentStatus[];


export type ManagerPaymentStatus =
  (typeof MANAGER_PAYMENT_STATUSES)[number];


/* ==========================================================================
   MODES DE PAIEMENT
   ========================================================================== */

export const MANAGER_PAYMENT_METHODS = [
  "CASH",
  "MOBILE_MONEY",
  "CARD",
  "BANK_TRANSFER",
  "OTHER",
] as const satisfies readonly PaymentMethod[];


export type ManagerPaymentMethod =
  (typeof MANAGER_PAYMENT_METHODS)[number];


/* ==========================================================================
   STATUTS LIVRAISON
   ========================================================================== */

export const MANAGER_SHIPMENT_STATUSES = [
  "PENDING",
  "PREPARING",
  "SHIPPED",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "CANCELLED",
] as const satisfies readonly ShipmentStatus[];


export type ManagerShipmentStatus =
  (typeof MANAGER_SHIPMENT_STATUSES)[number];


/* ==========================================================================
   ONGLETS COMMANDES
   ========================================================================== */

/**
 * Ces valeurs correspondent aux onglets VISUELS demandés.
 *
 * Elles ne remplacent pas OrderStatus.
 *
 * "preparing" représente uniquement au niveau de l'interface :
 *
 * - PROCESSING
 * - READY
 *
 * Cela permet de conserver l'onglet unique :
 *
 * "À préparer"
 *
 * sans modifier les vrais statuts Prisma.
 */

export const MANAGER_ORDERS_TABS = [
  "all",
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "delivered",
  "cancelled",
] as const;


export type ManagerOrdersTab =
  (typeof MANAGER_ORDERS_TABS)[number];


/* ==========================================================================
   FILTRE STATUT COMMANDE
   ========================================================================== */

export const MANAGER_ORDER_STATUS_FILTERS = [
  "all",
  ...MANAGER_ORDER_STATUSES,
] as const;


export type ManagerOrderStatusFilter =
  (typeof MANAGER_ORDER_STATUS_FILTERS)[number];


/* ==========================================================================
   FILTRE MODE DE PAIEMENT
   ========================================================================== */

export const MANAGER_ORDER_PAYMENT_METHOD_FILTERS = [
  "all",
  ...MANAGER_PAYMENT_METHODS,
] as const;


export type ManagerOrderPaymentMethodFilter =
  (typeof MANAGER_ORDER_PAYMENT_METHOD_FILTERS)[number];


/* ==========================================================================
   FILTRES
   ========================================================================== */

export interface ManagerOrdersFilters {
  /**
   * Date au format :
   *
   * YYYY-MM-DD
   *
   * Une chaîne vide signifie :
   * aucune borne basse.
   */
  readonly dateFrom:
    string;

  /**
   * Date au format :
   *
   * YYYY-MM-DD
   *
   * Une chaîne vide signifie :
   * aucune borne haute.
   */
  readonly dateTo:
    string;

  /**
   * Recherche :
   *
   * - référence commande ;
   * - prénom ;
   * - nom ;
   * - téléphone ;
   * - e-mail si disponible.
   */
  readonly q:
    string;

  /**
   * Onglet visuel actif.
   */
  readonly tab:
    ManagerOrdersTab;

  /**
   * Filtre précis sur OrderStatus.
   */
  readonly status:
    ManagerOrderStatusFilter;

  /**
   * Filtre précis sur PaymentMethod.
   */
  readonly paymentMethod:
    ManagerOrderPaymentMethodFilter;

  /**
   * Ville de livraison.
   *
   * Chaîne vide :
   * toutes les villes.
   */
  readonly city:
    string;

  readonly page:
    number;
}


/* ==========================================================================
   FILTRES PAR DÉFAUT
   ========================================================================== */

/**
 * Aucune période arbitraire n'est imposée ici.
 *
 * Cela évite d'inventer :
 *
 * - le mois courant ;
 * - les 30 derniers jours ;
 * - une période issue uniquement de la maquette.
 *
 * Si une période officielle est définie plus tard au niveau métier,
 * elle pourra être appliquée dans la couche prévue pour cela.
 */

export const DEFAULT_MANAGER_ORDERS_FILTERS:
  Readonly<ManagerOrdersFilters> = {
    dateFrom:
      "",

    dateTo:
      "",

    q:
      "",

    tab:
      "all",

    status:
      "all",

    paymentMethod:
      "all",

    city:
      "",

    page:
      1,
  };


/* ==========================================================================
   INPUT SERVICE LISTE
   ========================================================================== */

/**
 * Aucun storeId.
 * Aucun managerId.
 *
 * Ces identifiants doivent être obtenus côté serveur depuis :
 *
 * requireGestionnairePrivateAccess()
 */

export interface GetManagerOrdersPageDataInput {
  readonly dateFrom?:
    string | null;

  readonly dateTo?:
    string | null;

  readonly q?:
    string | null;

  readonly tab?:
    ManagerOrdersTab | null;

  readonly status?:
    ManagerOrderStatusFilter | null;

  readonly paymentMethod?:
    ManagerOrderPaymentMethodFilter | null;

  readonly city?:
    string | null;

  readonly page?:
    number | null;
}


/* ==========================================================================
   INPUT DÉTAIL
   ========================================================================== */

export interface GetManagerOrderDetailInput {
  readonly orderId:
    ManagerOrderId;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

/**
 * Les valeurs Decimal Prisma sont transportées sous forme de chaîne.
 *
 * Cela évite une conversion automatique en Number qui pourrait entraîner
 * une perte de précision.
 */

export interface ManagerOrderMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


/* ==========================================================================
   CHIFFRE D'AFFAIRES PAR DEVISE
   ========================================================================== */

/**
 * On ne mélange jamais plusieurs devises dans une seule somme.
 *
 * Exemple :
 *
 * [
 *   { currency: "XOF", amount: "250000.00" },
 *   { currency: "EUR", amount: "85.00" }
 * ]
 *
 * On ne doit jamais produire :
 *
 * 250085
 */

export interface ManagerOrderRevenueByCurrency {
  readonly currency:
    string;

  readonly amount:
    string;
}


/* ==========================================================================
   KPI
   ========================================================================== */

export interface ManagerOrdersKpis {
  /**
   * Nombre réel de commandes dans le périmètre calculé par le service.
   */
  readonly totalOrders:
    number;

  /**
   * Chiffre d'affaires réel, séparé par devise.
   */
  readonly revenue:
    readonly ManagerOrderRevenueByCurrency[];

  /**
   * Commandes en traitement / préparation.
   *
   * La définition métier exacte sera centralisée dans order-query.ts.
   */
  readonly processingOrders:
    number;

  readonly deliveredOrders:
    number;

  readonly cancelledOrders:
    number;
}


/* ==========================================================================
   COMPTEURS ONGLETS
   ========================================================================== */

export interface ManagerOrdersTabCounts {
  readonly all:
    number;

  readonly pending:
    number;

  readonly confirmed:
    number;

  /**
   * Groupe visuel :
   *
   * PROCESSING + READY
   */
  readonly preparing:
    number;

  readonly shipped:
    number;

  readonly delivered:
    number;

  readonly cancelled:
    number;
}


/* ==========================================================================
   IMAGE PRODUIT
   ========================================================================== */

export interface ManagerOrderProductImage {
  readonly url:
    string;

  readonly altText:
    string | null;
}


/* ==========================================================================
   APERÇU PRODUIT DANS LE TABLEAU
   ========================================================================== */

export interface ManagerOrderProductPreview {
  readonly orderItemId:
    ManagerOrderItemId;

  /**
   * Snapshot du nom enregistré sur OrderItem.
   */
  readonly name:
    string;

  readonly quantity:
    number;

  /**
   * Image actuelle du produit si la relation est encore disponible.
   *
   * Null :
   * placeholder visuel.
   */
  readonly image:
    ManagerOrderProductImage | null;
}


/* ==========================================================================
   CLIENTE — LISTE
   ========================================================================== */

export interface ManagerOrderCustomerSummary {
  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly phone:
    string | null;

  readonly email:
    string | null;
}


/* ==========================================================================
   PAIEMENT — LISTE
   ========================================================================== */

/**
 * Une commande peut techniquement avoir plusieurs paiements.
 *
 * order-query.ts déterminera le paiement pertinent à afficher dans la liste.
 *
 * Le composant visuel ne doit pas essayer de refaire cette décision.
 */

export interface ManagerOrderPaymentSummary {
  readonly id:
    ManagerOrderPaymentId;

  readonly status:
    ManagerPaymentStatus;

  readonly method:
    ManagerPaymentMethod;

  readonly provider:
    string | null;
}


/* ==========================================================================
   LIVRAISON — LISTE
   ========================================================================== */

/**
 * Si aucune livraison n'existe :
 *
 * shipment = null
 *
 * L'interface pourra alors afficher :
 *
 * "Non expédiée"
 *
 * sans créer un faux ShipmentStatus dans la base.
 */

export interface ManagerOrderShipmentSummary {
  readonly id:
    ManagerOrderShipmentId;

  readonly status:
    ManagerShipmentStatus;
}


/* ==========================================================================
   COMMANDE — LIGNE DU TABLEAU
   ========================================================================== */

export interface ManagerOrderListItem {
  readonly id:
    ManagerOrderId;

  /**
   * Référence métier réelle :
   *
   * Order.orderNumber
   */
  readonly orderNumber:
    string;

  readonly customer:
    ManagerOrderCustomerSummary;

  /**
   * Quelques produits seulement pour l'aperçu visuel.
   *
   * On ne charge pas inutilement tout le détail dans la liste.
   */
  readonly productPreviews:
    readonly ManagerOrderProductPreview[];

  /**
   * Somme réelle des quantités des OrderItem.
   *
   * Exemple :
   *
   * quantité 2 + quantité 3 = 5 articles
   */
  readonly totalItems:
    number;

  readonly total:
    ManagerOrderMoney;

  readonly payment:
    ManagerOrderPaymentSummary | null;

  readonly status:
    ManagerOrderStatus;

  readonly shipment:
    ManagerOrderShipmentSummary | null;

  /**
   * Order.shippingCity
   */
  readonly shippingCity:
    string | null;

  /**
   * ISO 8601.
   */
  readonly createdAt:
    string;
}


/* ==========================================================================
   OPTIONS DES FILTRES
   ========================================================================== */

export interface ManagerOrdersFilterOptions {
  /**
   * Villes réelles trouvées dans les commandes autorisées
   * du Gestionnaire.
   */
  readonly cities:
    readonly string[];
}


/* ==========================================================================
   DONNÉES PAGE LISTE
   ========================================================================== */

export interface ManagerOrdersPageData {
  readonly kpis:
    ManagerOrdersKpis;

  readonly tabCounts:
    ManagerOrdersTabCounts;

  readonly filterOptions:
    ManagerOrdersFilterOptions;

  readonly items:
    readonly ManagerOrderListItem[];

  readonly filters:
    ManagerOrdersFilters;

  readonly pagination:
    ManagerOrdersPagination;
}


/* ==========================================================================
   DÉTAIL — CLIENTE
   ========================================================================== */

export interface ManagerOrderDetailCustomer {
  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly email:
    string | null;

  readonly phone:
    string | null;
}


/* ==========================================================================
   DÉTAIL — ADRESSE DE LIVRAISON
   ========================================================================== */

export interface ManagerOrderDetailShippingAddress {
  readonly recipientName:
    string | null;

  readonly phone:
    string | null;

  readonly country:
    string | null;

  readonly city:
    string | null;

  readonly address:
    string | null;

  readonly postalCode:
    string | null;
}


/* ==========================================================================
   DÉTAIL — ARTICLE
   ========================================================================== */

export interface ManagerOrderDetailItem {
  readonly id:
    ManagerOrderItemId;

  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly quantity:
    number;

  readonly unitPrice:
    ManagerOrderMoney;

  readonly totalPrice:
    ManagerOrderMoney;

  readonly image:
    ManagerOrderProductImage | null;
}


/* ==========================================================================
   DÉTAIL — PAIEMENT
   ========================================================================== */

export interface ManagerOrderDetailPayment {
  readonly id:
    ManagerOrderPaymentId;

  readonly paymentReference:
    string;

  readonly method:
    ManagerPaymentMethod;

  readonly status:
    ManagerPaymentStatus;

  readonly provider:
    string | null;

  readonly providerReference:
    string | null;

  readonly amount:
    ManagerOrderMoney;

  readonly paidAt:
    string | null;

  readonly failedAt:
    string | null;

  readonly refundedAt:
    string | null;

  readonly createdAt:
    string;
}


/* ==========================================================================
   DÉTAIL — LIVRAISON
   ========================================================================== */

export interface ManagerOrderDetailShipment {
  readonly id:
    ManagerOrderShipmentId;

  readonly shipmentNumber:
    string;

  readonly status:
    ManagerShipmentStatus;

  readonly carrier:
    string | null;

  readonly trackingNumber:
    string | null;

  readonly trackingUrl:
    string | null;

  readonly recipientName:
    string;

  readonly phone:
    string | null;

  readonly country:
    string;

  readonly city:
    string;

  readonly address:
    string;

  readonly postalCode:
    string | null;

  readonly shippingCost:
    ManagerOrderMoney;

  readonly shippedAt:
    string | null;

  readonly deliveredAt:
    string | null;

  readonly createdAt:
    string;
}


/* ==========================================================================
   DÉTAIL — MONTANTS
   ========================================================================== */

export interface ManagerOrderDetailAmounts {
  readonly subtotal:
    ManagerOrderMoney;

  readonly discount:
    ManagerOrderMoney;

  readonly shipping:
    ManagerOrderMoney;

  readonly tax:
    ManagerOrderMoney;

  readonly total:
    ManagerOrderMoney;
}


/* ==========================================================================
   DÉTAIL COMMANDE
   ========================================================================== */

export interface ManagerOrderDetail {
  readonly id:
    ManagerOrderId;

  readonly orderNumber:
    string;

  readonly source:
    OrderSource;

  readonly status:
    ManagerOrderStatus;

  readonly customer:
    ManagerOrderDetailCustomer;

  readonly shippingAddress:
    ManagerOrderDetailShippingAddress;

  readonly amounts:
    ManagerOrderDetailAmounts;

  readonly items:
    readonly ManagerOrderDetailItem[];

  readonly payments:
    readonly ManagerOrderDetailPayment[];

  readonly shipments:
    readonly ManagerOrderDetailShipment[];

  readonly notes:
    string | null;

  readonly confirmedAt:
    string | null;

  readonly cancelledAt:
    string | null;

  readonly deliveredAt:
    string | null;

  readonly createdAt:
    string;

  readonly updatedAt:
    string;
}


/* ==========================================================================
   SETS INTERNES — VALIDATION
   ========================================================================== */

const MANAGER_ORDER_STATUS_SET:
  ReadonlySet<string> =
    new Set(
      MANAGER_ORDER_STATUSES,
    );


const MANAGER_PAYMENT_STATUS_SET:
  ReadonlySet<string> =
    new Set(
      MANAGER_PAYMENT_STATUSES,
    );


const MANAGER_PAYMENT_METHOD_SET:
  ReadonlySet<string> =
    new Set(
      MANAGER_PAYMENT_METHODS,
    );


const MANAGER_SHIPMENT_STATUS_SET:
  ReadonlySet<string> =
    new Set(
      MANAGER_SHIPMENT_STATUSES,
    );


const MANAGER_ORDERS_TAB_SET:
  ReadonlySet<string> =
    new Set(
      MANAGER_ORDERS_TABS,
    );


/* ==========================================================================
   VALIDATION — ORDER STATUS
   ========================================================================== */

export function isManagerOrderStatus(
  value:
    unknown,
): value is ManagerOrderStatus {
  return (
    typeof value ===
      "string" &&
    MANAGER_ORDER_STATUS_SET.has(
      value,
    )
  );
}


/* ==========================================================================
   VALIDATION — PAYMENT STATUS
   ========================================================================== */

export function isManagerPaymentStatus(
  value:
    unknown,
): value is ManagerPaymentStatus {
  return (
    typeof value ===
      "string" &&
    MANAGER_PAYMENT_STATUS_SET.has(
      value,
    )
  );
}


/* ==========================================================================
   VALIDATION — PAYMENT METHOD
   ========================================================================== */

export function isManagerPaymentMethod(
  value:
    unknown,
): value is ManagerPaymentMethod {
  return (
    typeof value ===
      "string" &&
    MANAGER_PAYMENT_METHOD_SET.has(
      value,
    )
  );
}


/* ==========================================================================
   VALIDATION — SHIPMENT STATUS
   ========================================================================== */

export function isManagerShipmentStatus(
  value:
    unknown,
): value is ManagerShipmentStatus {
  return (
    typeof value ===
      "string" &&
    MANAGER_SHIPMENT_STATUS_SET.has(
      value,
    )
  );
}


/* ==========================================================================
   VALIDATION — TAB
   ========================================================================== */

export function isManagerOrdersTab(
  value:
    unknown,
): value is ManagerOrdersTab {
  return (
    typeof value ===
      "string" &&
    MANAGER_ORDERS_TAB_SET.has(
      value,
    )
  );
}


/* ==========================================================================
   VALIDATION — FILTRE ORDER STATUS
   ========================================================================== */

export function isManagerOrderStatusFilter(
  value:
    unknown,
): value is ManagerOrderStatusFilter {
  return (
    value ===
      "all" ||
    isManagerOrderStatus(
      value,
    )
  );
}


/* ==========================================================================
   VALIDATION — FILTRE PAYMENT METHOD
   ========================================================================== */

export function isManagerOrderPaymentMethodFilter(
  value:
    unknown,
): value is ManagerOrderPaymentMethodFilter {
  return (
    value ===
      "all" ||
    isManagerPaymentMethod(
      value,
    )
  );
}


/* ==========================================================================
   LABEL — ONGLETS
   ========================================================================== */

export function getManagerOrdersTabLabel(
  tab:
    ManagerOrdersTab,
): string {
  switch (
    tab
  ) {
    case "all":
      return "Toutes";

    case "pending":
      return "En attente";

    case "confirmed":
      return "Confirmées";

    case "preparing":
      return "À préparer";

    case "shipped":
      return "Expédiées";

    case "delivered":
      return "Livrées";

    case "cancelled":
      return "Annulées";
  }
}


/* ==========================================================================
   STATUTS REPRÉSENTÉS PAR UN ONGLET
   ========================================================================== */

export function getManagerOrdersTabStatuses(
  tab:
    ManagerOrdersTab,
): readonly ManagerOrderStatus[] {
  switch (
    tab
  ) {
    case "all":
      return MANAGER_ORDER_STATUSES;

    case "pending":
      return [
        "PENDING",
      ];

    case "confirmed":
      return [
        "CONFIRMED",
      ];

    case "preparing":
      return [
        "PROCESSING",
        "READY",
      ];

    case "shipped":
      return [
        "SHIPPED",
      ];

    case "delivered":
      return [
        "DELIVERED",
      ];

    case "cancelled":
      return [
        "CANCELLED",
      ];
  }
}


/* ==========================================================================
   LABEL — ORDER STATUS
   ========================================================================== */

export function getManagerOrderStatusLabel(
  status:
    ManagerOrderStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "CONFIRMED":
      return "Confirmée";

    case "PROCESSING":
      return "En traitement";

    case "READY":
      return "À préparer";

    case "SHIPPED":
      return "Expédiée";

    case "DELIVERED":
      return "Livrée";

    case "CANCELLED":
      return "Annulée";

    case "REFUNDED":
      return "Remboursée";
  }
}


/* ==========================================================================
   LABEL — PAYMENT STATUS
   ========================================================================== */

export function getManagerPaymentStatusLabel(
  status:
    ManagerPaymentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "PROCESSING":
      return "En cours";

    case "PAID":
      return "Payé";

    case "FAILED":
      return "Échoué";

    case "CANCELLED":
      return "Annulé";

    case "REFUNDED":
      return "Remboursé";

    case "PARTIALLY_REFUNDED":
      return "Partiellement remboursé";
  }
}


/* ==========================================================================
   LABEL — PAYMENT METHOD
   ========================================================================== */

export function getManagerPaymentMethodLabel(
  method:
    ManagerPaymentMethod,
): string {
  switch (
    method
  ) {
    case "CASH":
      return "Espèces";

    case "MOBILE_MONEY":
      return "Mobile Money";

    case "CARD":
      return "Carte bancaire";

    case "BANK_TRANSFER":
      return "Virement bancaire";

    case "OTHER":
      return "Autre";
  }
}


/* ==========================================================================
   LABEL — SHIPMENT STATUS
   ========================================================================== */

export function getManagerShipmentStatusLabel(
  status:
    ManagerShipmentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "Non expédiée";

    case "PREPARING":
      return "En préparation";

    case "SHIPPED":
      return "Expédiée";

    case "IN_TRANSIT":
      return "En livraison";

    case "DELIVERED":
      return "Livrée";

    case "FAILED":
      return "Échec livraison";

    case "RETURNED":
      return "Retournée";

    case "CANCELLED":
      return "Annulée";
  }
}


/* ==========================================================================
   PAGINATION VIDE
   ========================================================================== */

export function createEmptyManagerOrdersPagination(
  page:
    number = 1,
): ManagerOrdersPagination {
  const normalizedPage =
    Number.isFinite(
      page,
    ) &&
    page >
      0
      ? Math.trunc(
          page,
        )
      : 1;


  return {
    page:
      normalizedPage,

    pageSize:
      MANAGER_ORDERS_PAGE_SIZE,

    totalItems:
      0,

    totalPages:
      0,

    startItem:
      0,

    endItem:
      0,

    hasPreviousPage:
      false,

    hasNextPage:
      false,
  };
}


/* ==========================================================================
   COMPTEURS ONGLETS VIDES
   ========================================================================== */

export function createEmptyManagerOrdersTabCounts():
  ManagerOrdersTabCounts {
  return {
    all:
      0,

    pending:
      0,

    confirmed:
      0,

    preparing:
      0,

    shipped:
      0,

    delivered:
      0,

    cancelled:
      0,
  };
}


/* ==========================================================================
   KPI VIDES
   ========================================================================== */

export function createEmptyManagerOrdersKpis():
  ManagerOrdersKpis {
  return {
    totalOrders:
      0,

    revenue:
      [],

    processingOrders:
      0,

    deliveredOrders:
      0,

    cancelledOrders:
      0,
  };
}