import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShipmentStatus,
} from "@prisma/client";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/livraisons/shipment-types.ts
 *
 * RÔLE :
 *
 * Source centrale des types utilisés par le module Livraisons Gestionnaire.
 *
 * Le modèle Prisma réel utilisé est :
 *
 * Shipment
 *
 * et non un modèle Delivery parallèle.
 *
 * Ce fichier définit uniquement :
 *
 * - filtres ;
 * - KPI ;
 * - pagination ;
 * - liste ;
 * - détail ;
 * - commande liée ;
 * - produits ;
 * - paiements ;
 * - actions autorisées ;
 * - état des Server Actions ;
 * - helpers d'affichage.
 *
 * IMPORTANT :
 *
 * - aucun accès Prisma ;
 * - aucune requête DB ;
 * - aucune session ;
 * - aucune donnée fictive ;
 * - aucun statut inventé ;
 * - aucun transporteur inventé ;
 * - aucun tracking inventé ;
 * - aucun historique fictif ;
 * - aucune logique financière inventée.
 *
 * ============================================================================
 */


/* ==========================================================================
   PAGINATION
   ========================================================================== */

/**
 * La maquette et l'architecture du module utilisent 10 lignes par page.
 *
 * La pagination réelle sera effectuée côté serveur.
 */

export const MANAGER_SHIPMENTS_PAGE_SIZE =
  10;


/* ==========================================================================
   LIMITES D'ENTRÉE
   ========================================================================== */

export const MANAGER_SHIPMENT_SEARCH_MAX_LENGTH =
  160;


export const MANAGER_SHIPMENT_FILTER_VALUE_MAX_LENGTH =
  120;


export const MANAGER_SHIPMENT_ID_MAX_LENGTH =
  191;


/* ==========================================================================
   STATUTS PRISMA RÉELS
   ========================================================================== */

/**
 * Liste strictement alignée sur ShipmentStatus dans schema.prisma.
 *
 * Aucun statut supplémentaire ne doit être ajouté ici sans modification
 * préalable du modèle Prisma officiel.
 */

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
   FILTRE STATUT
   ========================================================================== */

export type ManagerShipmentStatusFilter =
  | "all"
  | ManagerShipmentStatus;


/* ==========================================================================
   FILTRES
   ========================================================================== */

/**
 * La période est représentée par deux dates ISO simples :
 *
 * YYYY-MM-DD
 *
 * Une valeur vide signifie :
 *
 * aucun filtre sur cette borne.
 */

export interface ManagerShipmentsFilters {
  readonly q:
    string;

  readonly dateFrom:
    string;

  readonly dateTo:
    string;

  readonly status:
    ManagerShipmentStatusFilter;

  readonly city:
    string;

  readonly carrier:
    string;

  readonly page:
    number;
}


/* ==========================================================================
   FILTRES PAR DÉFAUT
   ========================================================================== */

/**
 * Aucun intervalle de dates n'est imposé par défaut.
 *
 * La page affiche donc toutes les livraisons autorisées tant que
 * l'utilisateur n'applique pas de période.
 */

export const DEFAULT_MANAGER_SHIPMENTS_FILTERS:
  ManagerShipmentsFilters = {
  q:
    "",

  dateFrom:
    "",

  dateTo:
    "",

  status:
    "all",

  city:
    "",

  carrier:
    "",

  page:
    1,
};


/* ==========================================================================
   INPUT SERVICE LISTE
   ========================================================================== */

/**
 * Les valeurs proviennent des searchParams Next.js.
 *
 * shipment-query.ts sera responsable de :
 *
 * - normaliser ;
 * - limiter ;
 * - valider ;
 * - ignorer proprement une valeur incorrecte.
 */

export interface GetManagerShipmentsPageDataInput {
  readonly q?:
    string | null;

  readonly dateFrom?:
    string | null;

  readonly dateTo?:
    string | null;

  readonly status?:
    string | null;

  readonly city?:
    string | null;

  readonly carrier?:
    string | null;

  readonly page?:
    number | string | null;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

/**
 * Les montants Prisma Decimal / Numeric seront sérialisés en string.
 *
 * Cela évite de perdre de la précision en les convertissant
 * automatiquement en number.
 */

export interface ManagerShipmentMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


/* ==========================================================================
   KPI
   ========================================================================== */

export interface ManagerShipmentsKpis {
  /**
   * Tous les Shipment appartenant au store Gestionnaire.
   */
  readonly totalShipments:
    number;

  /**
   * PENDING + PREPARING.
   */
  readonly preparingShipments:
    number;

  /**
   * SHIPPED + IN_TRANSIT.
   */
  readonly inProgressShipments:
    number;

  /**
   * DELIVERED uniquement.
   */
  readonly deliveredShipments:
    number;

  /**
   * FAILED + CANCELLED.
   *
   * RETURNED reste volontairement distinct et n'est pas artificiellement
   * assimilé à un échec ou une annulation.
   */
  readonly failedOrCancelledShipments:
    number;
}


/* ==========================================================================
   OPTIONS DE FILTRES
   ========================================================================== */

/**
 * Les villes et transporteurs seront chargés depuis les Shipment réels
 * appartenant au store courant.
 *
 * Aucune liste fixe n'est codée ici.
 */

export interface ManagerShipmentsFilterOptions {
  readonly cities:
    readonly string[];

  readonly carriers:
    readonly string[];
}


/* ==========================================================================
   APERÇU PRODUIT DANS LA LISTE
   ========================================================================== */

/**
 * OrderItem contient réellement :
 *
 * - id ;
 * - productName ;
 * - sku ;
 * - quantity.
 *
 * Le modèle actuel ne garantit pas une image snapshot sur OrderItem.
 * On ne crée donc aucun faux imageUrl ici.
 */

export interface ManagerShipmentItemPreview {
  readonly id:
    string;

  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly quantity:
    number;
}


/* ==========================================================================
   LIVRAISON — LIGNE DE LISTE
   ========================================================================== */

export interface ManagerShipmentListItem {
  readonly id:
    string;

  readonly shipmentNumber:
    string;

  readonly status:
    ManagerShipmentStatus;


  /* ------------------------------------------------------------------------
     CLIENT / DESTINATAIRE
     ------------------------------------------------------------------------ */

  readonly customerName:
    string;

  readonly customerPhone:
    string | null;


  /* ------------------------------------------------------------------------
     COMMANDE
     ------------------------------------------------------------------------ */

  readonly orderId:
    string;

  readonly orderNumber:
    string;


  /* ------------------------------------------------------------------------
     PRODUITS
     ------------------------------------------------------------------------ */

  readonly items:
    readonly ManagerShipmentItemPreview[];

  /**
   * Somme réelle des quantités OrderItem.
   *
   * Exemple :
   *
   * produit A x2
   * produit B x1
   *
   * itemCount = 3
   */
  readonly itemCount:
    number;


  /* ------------------------------------------------------------------------
     ADRESSE LIVRAISON
     ------------------------------------------------------------------------ */

  readonly city:
    string;

  readonly address:
    string;


  /* ------------------------------------------------------------------------
     TRANSPORTEUR
     ------------------------------------------------------------------------ */

  readonly carrier:
    string | null;


  /* ------------------------------------------------------------------------
     DATES RÉELLES DU SHIPMENT
     ------------------------------------------------------------------------ */

  readonly shippedAt:
    string | null;

  readonly deliveredAt:
    string | null;

  readonly createdAt:
    string;
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

export interface ManagerShipmentsPagination {
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
   DATA PAGE LISTE
   ========================================================================== */

export interface ManagerShipmentsPageData {
  readonly filters:
    ManagerShipmentsFilters;

  readonly kpis:
    ManagerShipmentsKpis;

  readonly filterOptions:
    ManagerShipmentsFilterOptions;

  readonly shipments:
    readonly ManagerShipmentListItem[];

  readonly pagination:
    ManagerShipmentsPagination;
}


/* ==========================================================================
   CLIENT / DESTINATAIRE DÉTAIL
   ========================================================================== */

/**
 * Ces informations doivent provenir du snapshot de la commande / livraison.
 *
 * On ne dépend pas d'une modification future du profil Customer pour
 * réécrire artificiellement l'historique d'une ancienne commande.
 */

export interface ManagerShipmentCustomerDetail {
  readonly customerId:
    string | null;

  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly fullName:
    string;

  readonly email:
    string | null;

  readonly phone:
    string | null;
}


/* ==========================================================================
   ADRESSE DÉTAIL
   ========================================================================== */

/**
 * Ces champs existent directement sur Shipment.
 */

export interface ManagerShipmentAddressDetail {
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
}


/* ==========================================================================
   PRODUIT DÉTAIL
   ========================================================================== */

export interface ManagerShipmentOrderItemDetail {
  readonly id:
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
    ManagerShipmentMoney;

  readonly totalPrice:
    ManagerShipmentMoney;
}


/* ==========================================================================
   PAIEMENT DÉTAIL
   ========================================================================== */

/**
 * Une commande peut techniquement avoir plusieurs Payment.
 *
 * On ne transforme donc pas artificiellement le paiement en un unique
 * champ "paymentStatus".
 */

export interface ManagerShipmentPaymentDetail {
  readonly id:
    string;

  readonly paymentReference:
    string;

  readonly method:
    PaymentMethod;

  readonly status:
    PaymentStatus;

  readonly provider:
    string | null;

  readonly providerReference:
    string | null;

  readonly amount:
    ManagerShipmentMoney;

  readonly paidAt:
    string | null;

  readonly createdAt:
    string;
}


/* ==========================================================================
   COMMANDE DÉTAIL
   ========================================================================== */

export interface ManagerShipmentOrderDetail {
  readonly id:
    string;

  readonly orderNumber:
    string;

  readonly status:
    OrderStatus;

  readonly total:
    ManagerShipmentMoney;

  readonly createdAt:
    string;

  readonly confirmedAt:
    string | null;

  readonly cancelledAt:
    string | null;

  readonly deliveredAt:
    string | null;

  readonly payments:
    readonly ManagerShipmentPaymentDetail[];
}


/* ==========================================================================
   INFORMATIONS SHIPMENT
   ========================================================================== */

export interface ManagerShipmentCoreDetail {
  readonly id:
    string;

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

  readonly shippingCost:
    ManagerShipmentMoney;

  readonly shippedAt:
    string | null;

  readonly deliveredAt:
    string | null;

  readonly createdAt:
    string;

  readonly updatedAt:
    string;
}


/* ==========================================================================
   ACTIONS AUTORISÉES
   ========================================================================== */

/**
 * Le navigateur ne décide jamais réellement si une action est autorisée.
 *
 * Ces valeurs servent uniquement à l'affichage.
 *
 * Les Server Actions devront refaire toutes les validations :
 *
 * - session ;
 * - store ;
 * - ownership ;
 * - statut courant ;
 * - transition autorisée.
 */

export interface ManagerShipmentAuthorizedActions {
  readonly canConfirm:
    boolean;

  readonly canCancel:
    boolean;
}


/* ==========================================================================
   DÉTAIL COMPLET
   ========================================================================== */

export interface ManagerShipmentDetail {
  readonly shipment:
    ManagerShipmentCoreDetail;

  readonly customer:
    ManagerShipmentCustomerDetail;

  readonly address:
    ManagerShipmentAddressDetail;

  readonly order:
    ManagerShipmentOrderDetail;

  readonly items:
    readonly ManagerShipmentOrderItemDetail[];

  readonly authorizedActions:
    ManagerShipmentAuthorizedActions;
}


/* ==========================================================================
   ACTIONS MÉTIER
   ========================================================================== */

export type ManagerShipmentAction =
  | "confirm"
  | "cancel";


/* ==========================================================================
   ACTION STATE
   ========================================================================== */

/**
 * Contrat retourné au composant LivraisonDetailActions.
 *
 * Aucune stack, aucune erreur Prisma et aucun détail sensible ne doit
 * être envoyé au navigateur.
 */

export interface ManagerShipmentActionState {
  readonly status:
    | "idle"
    | "success"
    | "error";

  readonly action:
    ManagerShipmentAction | null;

  readonly message:
    string | null;

  readonly shipmentId:
    string | null;

  readonly shipmentStatus:
    ManagerShipmentStatus | null;
}


/* ==========================================================================
   ÉTAT INITIAL ACTION
   ========================================================================== */

export const INITIAL_MANAGER_SHIPMENT_ACTION_STATE:
  ManagerShipmentActionState = {
  status:
    "idle",

  action:
    null,

  message:
    null,

  shipmentId:
    null,

  shipmentStatus:
    null,
};


/* ==========================================================================
   INPUT CONFIRMATION
   ========================================================================== */

export interface ConfirmManagerShipmentInput {
  readonly shipmentId:
    string;
}


/* ==========================================================================
   INPUT ANNULATION
   ========================================================================== */

/**
 * Le Shipment Prisma actuel ne contient aucun champ cancellationReason.
 *
 * Aucun motif n'est donc ajouté artificiellement à cette première version.
 */

export interface CancelManagerShipmentInput {
  readonly shipmentId:
    string;
}


/* ==========================================================================
   GUARD — STATUT SHIPMENT
   ========================================================================== */

export function isManagerShipmentStatus(
  value:
    unknown,
): value is ManagerShipmentStatus {
  return (
    typeof value ===
      "string" &&
    MANAGER_SHIPMENT_STATUSES.includes(
      value as ManagerShipmentStatus,
    )
  );
}


/* ==========================================================================
   GUARD — FILTRE STATUT
   ========================================================================== */

export function isManagerShipmentStatusFilter(
  value:
    unknown,
): value is ManagerShipmentStatusFilter {
  return (
    value ===
      "all" ||
    isManagerShipmentStatus(
      value,
    )
  );
}


/* ==========================================================================
   LABELS STATUT
   ========================================================================== */

export function getManagerShipmentStatusLabel(
  status:
    ManagerShipmentStatus,
): string {
  switch (
    status
  ) {
    case "PENDING":
      return "En attente";

    case "PREPARING":
      return "À préparer";

    case "SHIPPED":
      return "Expédiée";

    case "IN_TRANSIT":
      return "En cours";

    case "DELIVERED":
      return "Livrée";

    case "FAILED":
      return "Échouée";

    case "RETURNED":
      return "Retournée";

    case "CANCELLED":
      return "Annulée";
  }
}


/* ==========================================================================
   GROUPES KPI
   ========================================================================== */

export function isManagerShipmentPreparingStatus(
  status:
    ManagerShipmentStatus,
): boolean {
  return (
    status ===
      "PENDING" ||
    status ===
      "PREPARING"
  );
}


export function isManagerShipmentInProgressStatus(
  status:
    ManagerShipmentStatus,
): boolean {
  return (
    status ===
      "SHIPPED" ||
    status ===
      "IN_TRANSIT"
  );
}


export function isManagerShipmentDeliveredStatus(
  status:
    ManagerShipmentStatus,
): boolean {
  return (
    status ===
    "DELIVERED"
  );
}


export function isManagerShipmentFailedOrCancelledStatus(
  status:
    ManagerShipmentStatus,
): boolean {
  return (
    status ===
      "FAILED" ||
    status ===
      "CANCELLED"
  );
}


/* ==========================================================================
   ACTIONS UI SELON STATUT
   ========================================================================== */

/**
 * Cette fonction ne constitue PAS le contrôle de sécurité final.
 *
 * Elle sert seulement à construire l'interface.
 *
 * shipment-mutation.ts devra appliquer sa propre validation atomique
 * côté serveur avant toute modification.
 *
 * Première règle métier conservatrice :
 *
 * - DELIVERED : terminal ;
 * - CANCELLED : terminal ;
 * - RETURNED : pas de confirmation / annulation depuis cette interface ;
 * - FAILED : pas de confirmation / annulation depuis cette interface.
 *
 * Les autres états peuvent encore être confirmés ou annulés.
 */

export function getManagerShipmentAuthorizedActions(
  status:
    ManagerShipmentStatus,
): ManagerShipmentAuthorizedActions {
  switch (
    status
  ) {
    case "PENDING":
    case "PREPARING":
    case "SHIPPED":
    case "IN_TRANSIT":
      return {
        canConfirm:
          true,

        canCancel:
          true,
      };

    case "DELIVERED":
    case "FAILED":
    case "RETURNED":
    case "CANCELLED":
      return {
        canConfirm:
          false,

        canCancel:
          false,
      };
  }
}


/* ==========================================================================
   FACTORY — FILTRES
   ========================================================================== */

export function createDefaultManagerShipmentsFilters():
  ManagerShipmentsFilters {
  return {
    ...DEFAULT_MANAGER_SHIPMENTS_FILTERS,
  };
}


/* ==========================================================================
   FACTORY — KPI
   ========================================================================== */

export function createEmptyManagerShipmentsKpis():
  ManagerShipmentsKpis {
  return {
    totalShipments:
      0,

    preparingShipments:
      0,

    inProgressShipments:
      0,

    deliveredShipments:
      0,

    failedOrCancelledShipments:
      0,
  };
}


/* ==========================================================================
   FACTORY — OPTIONS
   ========================================================================== */

export function createEmptyManagerShipmentsFilterOptions():
  ManagerShipmentsFilterOptions {
  return {
    cities:
      [],

    carriers:
      [],
  };
}


/* ==========================================================================
   FACTORY — PAGINATION
   ========================================================================== */

export function createEmptyManagerShipmentsPagination(
  page:
    number = 1,
): ManagerShipmentsPagination {
  const normalizedPage =
    Number.isInteger(
      page,
    ) &&
    page >
      0
      ? page
      : 1;


  return {
    page:
      normalizedPage,

    pageSize:
      MANAGER_SHIPMENTS_PAGE_SIZE,

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