/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/stock/stock-types.ts
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par la page :
 *
 * /gestionnaire/stock
 *
 * Ce fichier est partagé par :
 *
 * - stock-query.ts
 * - page.tsx
 * - StockHeader.tsx
 * - StockKpiGrid.tsx
 * - StockFilters.tsx
 * - StockTable.tsx
 * - StockEmptyState.tsx
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session Gestionnaire ;
 * - accéder directement à PostgreSQL ;
 * - recevoir un storeId libre depuis le navigateur ;
 * - recevoir un managerId libre depuis le navigateur ;
 * - modifier le stock ;
 * - créer un mouvement de stock ;
 * - contenir de fausses données ;
 * - contenir de faux montants ;
 * - contenir de faux produits.
 *
 * IMPORTANT :
 *
 * Le stock réel de la boutique est porté par StoreProduct.
 *
 * Les champs métier utilisés par cette page sont notamment :
 *
 * - stockQuantity ;
 * - lowStockThreshold ;
 * - price ;
 * - currency ;
 * - updatedAt ;
 * - product ;
 * - product.category ;
 * - product.images.
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS
   ========================================================================== */

export type ManagerStockProductId =
  string;


export type ManagerStoreProductId =
  string;


export type ManagerStockCategoryId =
  string;


/* ==========================================================================
   STATUT MÉTIER DU STOCK
   ========================================================================== */

/**
 * Statut calculé à partir de :
 *
 * stockQuantity
 * lowStockThreshold
 *
 * Règles :
 *
 * OUT_OF_STOCK
 * stockQuantity <= 0
 *
 * LOW_STOCK
 * stockQuantity > 0
 * &&
 * stockQuantity <= lowStockThreshold
 *
 * IN_STOCK
 * stockQuantity > lowStockThreshold
 */

export const MANAGER_STOCK_STATUSES = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
] as const;


export type ManagerStockStatus =
  (typeof MANAGER_STOCK_STATUSES)[number];


/* ==========================================================================
   FILTRE DE STATUT
   ========================================================================== */

export const MANAGER_STOCK_STATUS_FILTERS = [
  "all",
  "in_stock",
  "low_stock",
  "out_of_stock",
] as const;


export type ManagerStockStatusFilter =
  (typeof MANAGER_STOCK_STATUS_FILTERS)[number];


/* ==========================================================================
   FILTRES
   ========================================================================== */

export interface ManagerStockFilters {
  /**
   * Recherche par :
   *
   * - nom du produit ;
   * - SKU / référence.
   */
  q:
    string;

  /**
   * Slug de la catégorie.
   *
   * Chaîne vide :
   * toutes les catégories.
   */
  category:
    string;

  /**
   * Filtre métier du stock.
   */
  status:
    ManagerStockStatusFilter;

  /**
   * Page courante.
   */
  page:
    number;
}


/* ==========================================================================
   FILTRES PAR DÉFAUT
   ========================================================================== */

export const DEFAULT_MANAGER_STOCK_FILTERS:
  Readonly<ManagerStockFilters> = {
    q:
      "",

    category:
      "",

    status:
      "all",

    page:
      1,
  };


/* ==========================================================================
   PAGINATION
   ========================================================================== */

export const MANAGER_STOCK_PAGE_SIZE =
  10;


export interface ManagerStockPagination {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;

  startItem:
    number;

  endItem:
    number;

  hasPreviousPage:
    boolean;

  hasNextPage:
    boolean;
}


/* ==========================================================================
   CATÉGORIE UTILISÉE DANS LES FILTRES
   ========================================================================== */

export interface ManagerStockCategoryOption {
  id:
    ManagerStockCategoryId;

  name:
    string;

  slug:
    string;
}


/* ==========================================================================
   CATÉGORIE D'UNE LIGNE STOCK
   ========================================================================== */

export interface ManagerStockProductCategory {
  id:
    ManagerStockCategoryId;

  name:
    string;

  slug:
    string;
}


/* ==========================================================================
   IMAGE PRINCIPALE
   ========================================================================== */

export interface ManagerStockProductImage {
  url:
    string;

  altText:
    string | null;
}


/* ==========================================================================
   MONTANT
   ========================================================================== */

/**
 * Les montants restent sous forme de chaîne décimale.
 *
 * Exemple :
 *
 * "5000.00"
 *
 * Cela évite de dégrader inutilement la précision d'un Decimal Prisma
 * pendant le transport entre la couche serveur et l'interface.
 */

export interface ManagerStockMoney {
  amount:
    string;

  currency:
    string;
}


/* ==========================================================================
   VALEUR TOTALE PAR DEVISE
   ========================================================================== */

/**
 * La base autorise une devise par StoreProduct.
 *
 * On ne doit donc pas additionner arbitrairement :
 *
 * XOF + EUR + USD
 *
 * dans un seul montant.
 *
 * Cette structure permet au service serveur de retourner les totaux réels
 * séparément lorsqu'une boutique contient plusieurs devises.
 */

export interface ManagerStockValueByCurrency {
  currency:
    string;

  amount:
    string;
}


/* ==========================================================================
   LIGNE DE STOCK
   ========================================================================== */

export interface ManagerStockItem {
  /**
   * Identifiant du StoreProduct.
   *
   * C'est la ligne commerciale réellement liée à la boutique.
   */
  storeProductId:
    ManagerStoreProductId;

  /**
   * Identifiant du Product.
   *
   * Utilisé notamment pour ouvrir :
   *
   * /gestionnaire/produits/[productId]
   */
  productId:
    ManagerStockProductId;

  /**
   * Nom réel du produit.
   */
  name:
    string;

  /**
   * SKU / référence réelle.
   */
  sku:
    string;

  /**
   * Image principale réelle.
   *
   * null si aucune image produit n'existe.
   */
  image:
    ManagerStockProductImage | null;

  /**
   * Catégorie réelle.
   *
   * null si le produit n'est rattaché à aucune catégorie.
   */
  category:
    ManagerStockProductCategory | null;

  /**
   * Quantité actuellement disponible.
   */
  stockQuantity:
    number;

  /**
   * Seuil d'alerte enregistré sur StoreProduct.
   */
  lowStockThreshold:
    number;

  /**
   * Statut calculé à partir de la quantité et du seuil.
   */
  stockStatus:
    ManagerStockStatus;

  /**
   * Prix unitaire enregistré pour cette boutique.
   */
  unitPrice:
    ManagerStockMoney;

  /**
   * Valeur estimée de cette ligne :
   *
   * stockQuantity × price
   */
  estimatedValue:
    ManagerStockMoney;

  /**
   * Dernière mise à jour réelle du StoreProduct.
   *
   * ISO 8601 afin de rester sérialisable entre Server Components
   * et composants d'affichage.
   */
  updatedAt:
    string;
}


/* ==========================================================================
   KPI
   ========================================================================== */

export interface ManagerStockKpis {
  /**
   * Nombre total de StoreProduct suivis pour la boutique connectée.
   */
  totalProducts:
    number;

  /**
   * Valeur estimée totale du stock.
   *
   * Séparée par devise pour éviter une addition incohérente
   * de devises différentes.
   */
  totalEstimatedValue:
    readonly ManagerStockValueByCurrency[];

  /**
   * stockQuantity <= 0
   */
  outOfStockProducts:
    number;

  /**
   * stockQuantity > 0
   * &&
   * stockQuantity <= lowStockThreshold
   */
  lowStockProducts:
    number;
}


/* ==========================================================================
   DONNÉES COMPLÈTES DE LA PAGE
   ========================================================================== */

export interface ManagerStockPageData {
  /**
   * KPI réels de la boutique.
   */
  kpis:
    ManagerStockKpis;

  /**
   * Catégories réelles disponibles pour le filtre.
   */
  categories:
    readonly ManagerStockCategoryOption[];

  /**
   * Produits de la page courante.
   */
  items:
    readonly ManagerStockItem[];

  /**
   * Filtres normalisés réellement appliqués.
   */
  filters:
    ManagerStockFilters;

  /**
   * Pagination serveur.
   */
  pagination:
    ManagerStockPagination;
}


/* ==========================================================================
   INPUT DU SERVICE SERVEUR
   ========================================================================== */

/**
 * Cet input contient uniquement les critères venant éventuellement
 * de la query string.
 *
 * Il ne contient volontairement :
 *
 * - ni managerId ;
 * - ni storeId.
 *
 * Ces identifiants doivent provenir exclusivement de la session serveur.
 */

export interface GetManagerStockPageDataInput {
  search?:
    string | null;

  category?:
    string | null;

  status?:
    ManagerStockStatusFilter | null;

  page?:
    number | null;
}


/* ==========================================================================
   VALIDATION DU FILTRE DE STATUT
   ========================================================================== */

export function isManagerStockStatusFilter(
  value:
    unknown,
): value is ManagerStockStatusFilter {
  return (
    value ===
      "all" ||
    value ===
      "in_stock" ||
    value ===
      "low_stock" ||
    value ===
      "out_of_stock"
  );
}


/* ==========================================================================
   CALCUL DU STATUT
   ========================================================================== */

/**
 * Fonction pure.
 *
 * Aucune base de données.
 * Aucune session.
 * Aucun effet de bord.
 */

export function getManagerStockStatus(
  stockQuantity:
    number,

  lowStockThreshold:
    number,
): ManagerStockStatus {
  const quantity =
    Number.isFinite(
      stockQuantity,
    )
      ? Math.max(
          0,
          Math.trunc(
            stockQuantity,
          ),
        )
      : 0;


  const threshold =
    Number.isFinite(
      lowStockThreshold,
    )
      ? Math.max(
          0,
          Math.trunc(
            lowStockThreshold,
          ),
        )
      : 0;


  if (
    quantity <=
    0
  ) {
    return "OUT_OF_STOCK";
  }


  if (
    quantity <=
    threshold
  ) {
    return "LOW_STOCK";
  }


  return "IN_STOCK";
}


/* ==========================================================================
   LABEL DU STATUT
   ========================================================================== */

export function getManagerStockStatusLabel(
  status:
    ManagerStockStatus,
):
  | "En stock"
  | "Stock faible"
  | "Rupture" {
  switch (
    status
  ) {
    case "IN_STOCK":
      return "En stock";

    case "LOW_STOCK":
      return "Stock faible";

    case "OUT_OF_STOCK":
      return "Rupture";
  }
}


/* ==========================================================================
   LABEL DU FILTRE
   ========================================================================== */

export function getManagerStockStatusFilterLabel(
  status:
    ManagerStockStatusFilter,
):
  | "Tous les statuts"
  | "En stock"
  | "Stock faible"
  | "Rupture" {
  switch (
    status
  ) {
    case "all":
      return "Tous les statuts";

    case "in_stock":
      return "En stock";

    case "low_stock":
      return "Stock faible";

    case "out_of_stock":
      return "Rupture";
  }
}


/* ==========================================================================
   PAGINATION VIDE
   ========================================================================== */

export function createEmptyManagerStockPagination(
  pageSize:
    number =
      MANAGER_STOCK_PAGE_SIZE,
): ManagerStockPagination {
  const normalizedPageSize =
    Number.isFinite(
      pageSize,
    )
      ? Math.max(
          1,
          Math.trunc(
            pageSize,
          ),
        )
      : MANAGER_STOCK_PAGE_SIZE;


  return {
    page:
      1,

    pageSize:
      normalizedPageSize,

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