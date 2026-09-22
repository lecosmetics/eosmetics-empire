import type {
  AddressType,
  CustomerStatus,
  OrderStatus,
} from "@prisma/client";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/clients/client-types.ts
 *
 * RÔLE :
 *
 * Centraliser les contrats de données utilisés par :
 *
 * - /gestionnaire/clients
 * - /gestionnaire/clients/[clientId]
 * - client-query.ts
 * - les composants Clients
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne contient aucune donnée fictive ;
 * - ne contient aucune logique React ;
 * - ne contient aucune logique CSS ;
 * - ne décide pas du storeId autorisé ;
 * - ne décide pas comment identifier artificiellement un invité ;
 * - ne convertit jamais les devises ;
 * - ne mélange jamais plusieurs devises dans un seul total.
 *
 * La sécurité et les agrégations resteront dans :
 *
 * src/lib/gestionnaire/clients/client-query.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   PAGINATION
   ========================================================================== */

/**
 * Valeur simple et cohérente avec la maquette desktop.
 *
 * La pagination reste réalisée côté serveur.
 */

export const MANAGER_CLIENTS_PAGE_SIZE =
  10;


/* ==========================================================================
   STATUTS CLIENT RÉELS
   ========================================================================== */

/**
 * Ces valeurs correspondent au vrai enum Prisma CustomerStatus.
 *
 * On n'ajoute volontairement pas :
 *
 * INACTIVE
 * VIP
 * PREMIUM
 * GOLD
 * SILVER
 *
 * car ces valeurs n'existent pas dans le schéma actuel.
 */

export const MANAGER_CUSTOMER_STATUSES = [
  "ACTIVE",
  "BLOCKED",
  "ARCHIVED",
] as const satisfies readonly CustomerStatus[];


export type ManagerCustomerStatus =
  (typeof MANAGER_CUSTOMER_STATUSES)[number];


/* ==========================================================================
   TRI
   ========================================================================== */

/**
 * Pour la liste principale, on garde un tri simple basé sur une vraie donnée :
 *
 * Order.createdAt
 *
 * Aucune "date d'inscription" artificielle n'est utilisée pour déterminer
 * l'ordre commercial des clients.
 */

export const MANAGER_CLIENT_SORTS = [
  "last-order-desc",
  "last-order-asc",
] as const;


export type ManagerClientsSort =
  (typeof MANAGER_CLIENT_SORTS)[number];


export const DEFAULT_MANAGER_CLIENTS_SORT:
  ManagerClientsSort =
  "last-order-desc";


/* ==========================================================================
   SOURCE D'IDENTITÉ
   ========================================================================== */

/**
 * CUSTOMER :
 *
 * La ligne correspond à un vrai Customer enregistré et possède donc
 * Customer.id.
 *
 * ORDER_SNAPSHOT :
 *
 * Certaines commandes peuvent avoir customerId = null.
 * Dans ce cas, les informations disponibles proviennent du snapshot Order :
 *
 * - customerFirstName
 * - customerLastName
 * - customerEmail
 * - customerPhone
 *
 * IMPORTANT :
 *
 * Ce type ne définit volontairement PAS la règle permettant de fusionner
 * plusieurs commandes invitées.
 *
 * Cette règle devra être appliquée dans client-query.ts uniquement si une
 * logique officielle fiable existe dans le projet.
 */

export type ManagerClientIdentitySource =
  | "CUSTOMER"
  | "ORDER_SNAPSHOT";


/* ==========================================================================
   FILTRES
   ========================================================================== */

export type ManagerClientStatusFilter =
  | "all"
  | ManagerCustomerStatus;


export interface ManagerClientsFilters {
  /**
   * Recherche :
   *
   * prénom
   * nom
   * e-mail
   * téléphone
   */
  readonly q:
    string;

  /**
   * Ville réelle issue des données disponibles pour ce store.
   */
  readonly city:
    string;

  /**
   * Statut réel CustomerStatus.
   */
  readonly status:
    ManagerClientStatusFilter;

  /**
   * Tri basé sur la dernière commande.
   */
  readonly sort:
    ManagerClientsSort;

  /**
   * Page courante, à partir de 1.
   */
  readonly page:
    number;
}


/* ==========================================================================
   FILTRES PAR DÉFAUT
   ========================================================================== */

export const DEFAULT_MANAGER_CLIENTS_FILTERS:
  ManagerClientsFilters = {
    q:
      "",

    city:
      "",

    status:
      "all",

    sort:
      DEFAULT_MANAGER_CLIENTS_SORT,

    page:
      1,
  };


/* ==========================================================================
   INPUT BRUT DU SERVICE
   ========================================================================== */

/**
 * Ce type accepte volontairement les valeurs pouvant venir d'une URL.
 *
 * client-query.ts devra :
 *
 * - nettoyer les chaînes ;
 * - valider les statuts ;
 * - valider le tri ;
 * - normaliser la pagination ;
 * - ne jamais utiliser directement une valeur non validée.
 */

export interface GetManagerClientsPageDataInput {
  readonly q?:
    string | null;

  readonly city?:
    string | null;

  readonly status?:
    string | null;

  readonly sort?:
    string | null;

  readonly page?:
    number | string | null;
}


/* ==========================================================================
   MONEY
   ========================================================================== */

/**
 * Les montants restent des chaînes.
 *
 * Cela évite une conversion inutile des Decimal Prisma vers number
 * pour les contrats UI.
 */

export interface ManagerClientMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


/**
 * Total dépensé séparé par devise.
 *
 * Exemple valide :
 *
 * [
 *   { amount: "125000.00", currency: "XAF" },
 *   { amount: "40.00", currency: "EUR" }
 * ]
 *
 * Il ne faut jamais produire artificiellement :
 *
 * 125040
 */

export interface ManagerClientSpendingByCurrency {
  readonly amount:
    string;

  readonly currency:
    string;
}


/* ==========================================================================
   KPI
   ========================================================================== */

export interface ManagerClientsKpis {
  /**
   * Nombre de clients uniques trouvés dans le périmètre de la boutique.
   */
  readonly totalClients:
    number;

  /**
   * Nombre de clients dont le vrai Customer.status est ACTIVE.
   *
   * Les commandes invitées sans Customer ne doivent pas recevoir
   * artificiellement ce statut.
   */
  readonly activeClients:
    number;

  /**
   * Clients dont la première commande auprès de cette boutique
   * tombe dans la période courante utilisée par le service.
   *
   * La définition temporelle exacte est centralisée dans client-query.ts.
   */
  readonly newClients:
    number;

  /**
   * Nombre total réel de commandes associées aux clients visibles
   * dans le périmètre de la boutique.
   */
  readonly totalOrders:
    number;
}


/* ==========================================================================
   CLIENT — LISTE
   ========================================================================== */

export interface ManagerClientListItem {
  /**
   * Identifiant stable de la ligne préparé côté serveur.
   *
   * Pour un vrai Customer, il doit correspondre à Customer.id.
   *
   * Pour une commande invitée, aucune stratégie artificielle n'est imposée
   * dans ce fichier.
   */
  readonly id:
    string;

  /**
   * Vrai Customer.id lorsqu'il existe.
   *
   * null lorsque les commandes concernées ont customerId = null.
   */
  readonly customerId:
    string | null;

  readonly identitySource:
    ManagerClientIdentitySource;

  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly email:
    string | null;

  readonly phone:
    string | null;

  /**
   * Le modèle Customer ne contient actuellement aucun champ avatar.
   *
   * Les composants doivent donc utiliser les initiales tant qu'aucune
   * vraie image client n'existe dans le schéma.
   */

  /**
   * Ville réellement retenue par client-query.ts depuis les données
   * disponibles dans le périmètre du store.
   */
  readonly city:
    string | null;

  /**
   * Statut réel CustomerStatus.
   *
   * null pour une identité provenant uniquement d'un snapshot Order.
   */
  readonly status:
    ManagerCustomerStatus | null;

  /**
   * Nombre de commandes uniquement pour le store autorisé.
   */
  readonly orderCount:
    number;

  /**
   * Total commercial séparé par devise.
   *
   * Les règles d'inclusion/exclusion des paiements sont calculées
   * côté serveur.
   */
  readonly totalSpent:
    readonly ManagerClientSpendingByCurrency[];

  /**
   * Première commande connue auprès du store.
   *
   * ISO 8601 sérialisé.
   */
  readonly firstOrderAt:
    string;

  /**
   * Dernière commande connue auprès du store.
   *
   * ISO 8601 sérialisé.
   */
  readonly lastOrderAt:
    string;
}


/* ==========================================================================
   OPTIONS FILTRES
   ========================================================================== */

export interface ManagerClientsFilterOptions {
  /**
   * Villes réellement trouvées pour les clients du store courant.
   *
   * Aucun tableau statique Dakar / Cotonou / Yaoundé n'est autorisé.
   */
  readonly cities:
    readonly string[];
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

export interface ManagerClientsPagination {
  readonly page:
    number;

  readonly pageSize:
    number;

  readonly totalItems:
    number;

  readonly totalPages:
    number;

  /**
   * Position humaine, donc 1 pour le premier résultat.
   *
   * 0 lorsque la liste est vide.
   */
  readonly startItem:
    number;

  /**
   * Position humaine du dernier résultat de la page.
   *
   * 0 lorsque la liste est vide.
   */
  readonly endItem:
    number;

  readonly hasPreviousPage:
    boolean;

  readonly hasNextPage:
    boolean;
}


/* ==========================================================================
   PAGE DATA
   ========================================================================== */

export interface ManagerClientsPageData {
  readonly filters:
    ManagerClientsFilters;

  readonly kpis:
    ManagerClientsKpis;

  readonly filterOptions:
    ManagerClientsFilterOptions;

  readonly clients:
    readonly ManagerClientListItem[];

  readonly pagination:
    ManagerClientsPagination;
}


/* ==========================================================================
   ADRESSE — DÉTAIL CLIENT
   ========================================================================== */

/**
 * Structure basée directement sur CustomerAddress.
 */

export interface ManagerClientAddress {
  readonly id:
    string;

  readonly type:
    AddressType;

  readonly label:
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

  readonly isDefault:
    boolean;
}


/* ==========================================================================
   COMMANDE — DÉTAIL CLIENT
   ========================================================================== */

/**
 * Résumé volontairement léger.
 *
 * La page détail client n'a pas besoin de recevoir tout l'objet Order,
 * tous ses paiements, toutes ses livraisons et tous ses produits
 * simplement pour afficher son historique.
 */

export interface ManagerClientOrderSummary {
  readonly id:
    string;

  readonly orderNumber:
    string;

  readonly status:
    OrderStatus;

  readonly total:
    ManagerClientMoney;

  readonly createdAt:
    string;
}


/* ==========================================================================
   DÉTAIL CLIENT
   ========================================================================== */

export interface ManagerClientDetail {
  readonly id:
    string;

  readonly customerId:
    string | null;

  readonly identitySource:
    ManagerClientIdentitySource;

  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly email:
    string | null;

  readonly phone:
    string | null;

  readonly city:
    string | null;

  readonly status:
    ManagerCustomerStatus | null;

  /**
   * Date de création du vrai Customer.
   *
   * null pour une identité uniquement issue d'un snapshot de commande.
   */
  readonly customerCreatedAt:
    string | null;

  readonly firstOrderAt:
    string;

  readonly lastOrderAt:
    string;

  readonly orderCount:
    number;

  readonly totalSpent:
    readonly ManagerClientSpendingByCurrency[];

  readonly addresses:
    readonly ManagerClientAddress[];

  readonly orders:
    readonly ManagerClientOrderSummary[];
}


/* ==========================================================================
   GUARDS — CUSTOMER STATUS
   ========================================================================== */

export function isManagerCustomerStatus(
  value:
    unknown,
): value is ManagerCustomerStatus {
  return (
    typeof value ===
      "string" &&
    (
      value ===
        "ACTIVE" ||
      value ===
        "BLOCKED" ||
      value ===
        "ARCHIVED"
    )
  );
}


export function isManagerClientStatusFilter(
  value:
    unknown,
): value is ManagerClientStatusFilter {
  return (
    value ===
      "all" ||
    isManagerCustomerStatus(
      value,
    )
  );
}


/* ==========================================================================
   GUARD — SORT
   ========================================================================== */

export function isManagerClientsSort(
  value:
    unknown,
): value is ManagerClientsSort {
  return (
    value ===
      "last-order-desc" ||
    value ===
      "last-order-asc"
  );
}


/* ==========================================================================
   LABELS — CUSTOMER STATUS
   ========================================================================== */

export function getManagerCustomerStatusLabel(
  status:
    ManagerCustomerStatus,
): string {
  switch (
    status
  ) {
    case "ACTIVE":
      return "Actif";

    case "BLOCKED":
      return "Bloqué";

    case "ARCHIVED":
      return "Archivé";
  }
}


/* ==========================================================================
   LABELS — SORT
   ========================================================================== */

export function getManagerClientsSortLabel(
  sort:
    ManagerClientsSort,
): string {
  switch (
    sort
  ) {
    case "last-order-desc":
      return "Dernière commande : plus récente";

    case "last-order-asc":
      return "Dernière commande : plus ancienne";
  }
}


/* ==========================================================================
   FACTORY — FILTRES
   ========================================================================== */

export function createDefaultManagerClientsFilters():
  ManagerClientsFilters {
  return {
    q:
      DEFAULT_MANAGER_CLIENTS_FILTERS.q,

    city:
      DEFAULT_MANAGER_CLIENTS_FILTERS.city,

    status:
      DEFAULT_MANAGER_CLIENTS_FILTERS.status,

    sort:
      DEFAULT_MANAGER_CLIENTS_FILTERS.sort,

    page:
      DEFAULT_MANAGER_CLIENTS_FILTERS.page,
  };
}


/* ==========================================================================
   FACTORY — KPI VIDES
   ========================================================================== */

export function createEmptyManagerClientsKpis():
  ManagerClientsKpis {
  return {
    totalClients:
      0,

    activeClients:
      0,

    newClients:
      0,

    totalOrders:
      0,
  };
}


/* ==========================================================================
   FACTORY — PAGINATION VIDE
   ========================================================================== */

export function createEmptyManagerClientsPagination(
  pageSize:
    number =
      MANAGER_CLIENTS_PAGE_SIZE,
): ManagerClientsPagination {
  return {
    page:
      1,

    pageSize,

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
   FACTORY — OPTIONS FILTRES VIDES
   ========================================================================== */

export function createEmptyManagerClientsFilterOptions():
  ManagerClientsFilterOptions {
  return {
    cities:
      [],
  };
}