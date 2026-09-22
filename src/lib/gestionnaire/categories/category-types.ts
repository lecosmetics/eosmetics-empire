/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/categories/category-types.ts
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par la page :
 *
 * /gestionnaire/categories
 *
 * Ce fichier est partagé par :
 *
 * - category-query.ts
 * - page.tsx
 * - CategoriesHeader.tsx
 * - CategoriesKpiGrid.tsx
 * - CategoriesFilters.tsx
 * - CategoriesTable.tsx
 * - CategoriesMobileList.tsx
 * - CategoriesEmptyState.tsx
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session Gestionnaire ;
 * - accéder directement à PostgreSQL ;
 * - accéder directement à Supabase Storage ;
 * - effectuer d'autorisation ;
 * - recevoir un managerId du navigateur ;
 * - recevoir un storeId du navigateur ;
 * - créer une catégorie ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - contenir de fausses données.
 *
 * IMPORTANT :
 *
 * Le Gestionnaire consulte les catégories officielles du catalogue.
 *
 * Le nombre de produits d'une catégorie doit être calculé côté serveur
 * uniquement pour la boutique liée au Gestionnaire authentifié.
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS
   ========================================================================== */

/**
 * Les identifiants restent des string afin de rester compatibles avec
 * les identifiants Prisma actuels.
 */

export type ManagerCategoryId =
  string;


/* ==========================================================================
   FILTRE DE STATUT
   ========================================================================== */

/**
 * ProductCategory possède réellement :
 *
 * isActive Boolean
 *
 * Le filtre Active / Inactive correspond donc à une donnée métier existante.
 */

export const MANAGER_CATEGORY_STATUS_FILTERS = [
  "all",
  "active",
  "inactive",
] as const;


export type ManagerCategoryStatusFilter =
  (typeof MANAGER_CATEGORY_STATUS_FILTERS)[number];


/* ==========================================================================
   PARAMÈTRES DE RECHERCHE NORMALISÉS
   ========================================================================== */

/**
 * Représentation interne des paramètres utilisés par la page.
 *
 * Exemple :
 *
 * /gestionnaire/categories?q=soins&status=active&page=1
 */

export interface ManagerCategoriesFilters {
  q:
    string;

  status:
    ManagerCategoryStatusFilter;

  page:
    number;
}


/* ==========================================================================
   VALEURS PAR DÉFAUT
   ========================================================================== */

export const DEFAULT_MANAGER_CATEGORIES_FILTERS:
  Readonly<ManagerCategoriesFilters> = {
  q:
    "",

  status:
    "all",

  page:
    1,
};


/* ==========================================================================
   PAGINATION
   ========================================================================== */

/**
 * Le catalogue officiel contient actuellement peu de catégories.
 *
 * 10 éléments par page permet notamment d'afficher les 10 catégories
 * officielles actuelles sur une seule page.
 *
 * La pagination reste néanmoins prête si de nouvelles catégories officielles
 * sont ajoutées plus tard.
 */

export const MANAGER_CATEGORIES_PAGE_SIZE =
  10;


export interface ManagerCategoriesPagination {
  /**
   * Page actuellement affichée.
   *
   * Commence à 1.
   */
  page:
    number;

  /**
   * Nombre maximum d'éléments par page.
   */
  pageSize:
    number;

  /**
   * Nombre total de catégories correspondant aux filtres courants.
   */
  totalItems:
    number;

  /**
   * Nombre total de pages.
   *
   * Une liste vide peut retourner 0 page.
   */
  totalPages:
    number;

  /**
   * Position du premier élément affiché.
   *
   * Exemple :
   *
   * 1
   *
   * pour :
   *
   * Affichage de 1 à 10 sur 10 catégories
   *
   * Vaut 0 lorsqu'aucun élément n'est affiché.
   */
  startItem:
    number;

  /**
   * Position du dernier élément affiché.
   *
   * Vaut 0 lorsqu'aucun élément n'est affiché.
   */
  endItem:
    number;

  hasPreviousPage:
    boolean;

  hasNextPage:
    boolean;
}


/* ==========================================================================
   CATÉGORIE — DONNÉES DE LISTE
   ========================================================================== */

/**
 * Données minimales nécessaires à l'affichage d'une catégorie.
 *
 * Aucune relation Prisma complète ne doit être transmise à l'interface.
 *
 * productCount :
 *
 * correspond exclusivement au nombre de produits associés à cette catégorie
 * dans la boutique du Gestionnaire connecté.
 *
 * Il ne doit jamais représenter le nombre global de produits de toutes
 * les boutiques.
 */

export interface ManagerCategoryListItem {
  id:
    ManagerCategoryId;

  /**
   * Nom officiel de la catégorie.
   *
   * Exemple :
   *
   * Soins du visage
   */
  name:
    string;

  /**
   * Slug officiel.
   *
   * Il pourra être utilisé pour construire le filtre vers :
   *
   * /gestionnaire/produits
   */
  slug:
    string;

  /**
   * Description réellement enregistrée en base.
   *
   * Aucune description ne doit être inventée lorsqu'elle est absente.
   */
  description:
    string | null;

  /**
   * URL publique de l'image officielle.
   *
   * L'image physique reste dans Supabase Storage.
   */
  imageUrl:
    string | null;

  /**
   * Texte alternatif de l'image.
   */
  imageAlt:
    string | null;

  /**
   * Statut réel provenant de ProductCategory.isActive.
   */
  isActive:
    boolean;

  /**
   * Nombre réel de produits de cette catégorie pour la boutique actuellement
   * authentifiée.
   */
  productCount:
    number;

  /**
   * Date réelle de création de la catégorie.
   *
   * La couche serveur convertit la Date Prisma en chaîne ISO afin que le
   * contrat transmis aux composants reste sérialisable et indépendant
   * de Prisma.
   *
   * Exemple :
   *
   * 2026-03-12T14:32:00.000Z
   */
  createdAt:
    string;
}


/* ==========================================================================
   KPI
   ========================================================================== */

/**
 * KPI généraux des catégories officielles.
 *
 * Ces valeurs ne doivent jamais être écrites en dur.
 *
 * Exemple :
 *
 * total    = 10
 * active   = 10
 * inactive = 0
 *
 * uniquement si ces valeurs correspondent réellement à la base.
 */

export interface ManagerCategoriesKpis {
  total:
    number;

  active:
    number;

  inactive:
    number;
}


/* ==========================================================================
   DONNÉES COMPLÈTES DE LA PAGE
   ========================================================================== */

/**
 * Contrat retourné par category-query.ts à page.tsx.
 */

export interface ManagerCategoriesPageData {
  /**
   * Catégories de la page courante après application :
   *
   * - de la recherche ;
   * - du statut ;
   * - de la pagination.
   */
  categories:
    readonly ManagerCategoryListItem[];

  /**
   * KPI calculés depuis les vraies catégories.
   */
  kpis:
    ManagerCategoriesKpis;

  /**
   * Filtres actuellement appliqués.
   */
  filters:
    ManagerCategoriesFilters;

  /**
   * Informations nécessaires à l'affichage de la pagination.
   */
  pagination:
    ManagerCategoriesPagination;
}


/* ==========================================================================
   INPUT — QUERY SERVEUR
   ========================================================================== */

/**
 * Paramètres publics pouvant être utilisés pour demander les catégories.
 *
 * IMPORTANT :
 *
 * Ce contrat ne contient volontairement aucun :
 *
 * - managerId ;
 * - storeId ;
 * - role ;
 * - permission.
 *
 * La boutique et le Gestionnaire doivent être déterminés exclusivement
 * côté serveur depuis la session authentifiée.
 */

export interface GetManagerCategoriesInput {
  search?:
    string | null;

  status?:
    ManagerCategoryStatusFilter | null;

  page?:
    number | null;
}


/* ==========================================================================
   HELPER — STATUS FILTER
   ========================================================================== */

/**
 * Vérifie qu'une valeur correspond réellement à l'un des filtres autorisés.
 *
 * Cette fonction ne réalise aucune autorisation métier.
 */

export function isManagerCategoryStatusFilter(
  value:
    unknown,
): value is ManagerCategoryStatusFilter {
  return (
    value ===
      "all" ||
    value ===
      "active" ||
    value ===
      "inactive"
  );
}


/* ==========================================================================
   HELPER — ACTIVE LABEL
   ========================================================================== */

/**
 * Libellé simple utilisé par les interfaces desktop/mobile.
 *
 * On conserve volontairement seulement :
 *
 * Active
 * Inactive
 */

export function getManagerCategoryStatusLabel(
  isActive:
    boolean,
): "Active" | "Inactive" {
  return isActive
    ? "Active"
    : "Inactive";
}


/* ==========================================================================
   HELPER — PAGINATION EMPTY
   ========================================================================== */

/**
 * État de pagination initial utilisable avant ou en absence de résultat.
 */

export function createEmptyManagerCategoriesPagination(
  pageSize:
    number =
      MANAGER_CATEGORIES_PAGE_SIZE,
): ManagerCategoriesPagination {
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