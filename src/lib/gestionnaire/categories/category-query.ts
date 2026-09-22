import "server-only";

import type {
  Prisma,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  DEFAULT_MANAGER_CATEGORIES_FILTERS,
  MANAGER_CATEGORIES_PAGE_SIZE,
  isManagerCategoryStatusFilter,
  type GetManagerCategoriesInput,
  type ManagerCategoriesFilters,
  type ManagerCategoriesKpis,
  type ManagerCategoriesPageData,
  type ManagerCategoriesPagination,
  type ManagerCategoryListItem,
  type ManagerCategoryStatusFilter,
} from "@/lib/gestionnaire/categories/category-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/categories/category-query.ts
 *
 * RÔLE :
 *
 * Charger les données nécessaires à :
 *
 * /gestionnaire/categories
 *
 * Ce module :
 *
 * - reste exclusivement côté serveur ;
 * - vérifie l'accès privé Gestionnaire ;
 * - récupère storeId depuis la session sécurisée ;
 * - charge les catégories officielles ;
 * - applique la recherche sur le nom ;
 * - applique le filtre Active / Inactive ;
 * - applique une pagination simple ;
 * - calcule les KPI réels ;
 * - calcule le nombre de produits de chaque catégorie uniquement
 *   pour la boutique du Gestionnaire connecté ;
 * - retourne uniquement les données nécessaires à l'interface.
 *
 * IMPORTANT :
 *
 * Ce fichier ne doit jamais :
 *
 * - accepter storeId depuis le navigateur ;
 * - accepter managerId depuis le navigateur ;
 * - compter les produits de toutes les boutiques ;
 * - inventer une catégorie ;
 * - inventer une image ;
 * - inventer une description ;
 * - inventer une date ;
 * - inventer un statut ;
 * - créer, modifier ou supprimer une catégorie.
 *
 * ============================================================================
 */


/* ==========================================================================
   NORMALISATION — RECHERCHE
   ========================================================================== */

/**
 * La recherche reste volontairement simple.
 *
 * Elle est appliquée uniquement sur :
 *
 * ProductCategory.name
 */

function normalizeSearch(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


/* ==========================================================================
   NORMALISATION — STATUT
   ========================================================================== */

function normalizeStatus(
  value:
    ManagerCategoryStatusFilter |
    null |
    undefined,
): ManagerCategoryStatusFilter {
  if (
    isManagerCategoryStatusFilter(
      value,
    )
  ) {
    return value;
  }


  return DEFAULT_MANAGER_CATEGORIES_FILTERS
    .status;
}


/* ==========================================================================
   NORMALISATION — PAGE
   ========================================================================== */

function normalizePage(
  value:
    number |
    null |
    undefined,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    return DEFAULT_MANAGER_CATEGORIES_FILTERS
      .page;
  }


  const normalized =
    Math.trunc(
      value,
    );


  if (
    normalized <
    1
  ) {
    return DEFAULT_MANAGER_CATEGORIES_FILTERS
      .page;
  }


  return normalized;
}


/* ==========================================================================
   NORMALISATION — IDENTIFIANT
   ========================================================================== */

/**
 * requireGestionnairePrivateAccess() réalise déjà les contrôles métier.
 *
 * Cette vérification défensive empêche simplement une requête Prisma
 * avec un identifiant vide en cas d'incohérence inattendue.
 */

function requireStoreId(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    !normalized
  ) {
    throw new Error(
      "GESTIONNAIRE_STORE_ID_INVALID",
    );
  }


  return normalized;
}


/* ==========================================================================
   FILTRES NORMALISÉS
   ========================================================================== */

function normalizeFilters(
  input:
    GetManagerCategoriesInput,
): ManagerCategoriesFilters {
  return {
    q:
      normalizeSearch(
        input.search,
      ),

    status:
      normalizeStatus(
        input.status,
      ),

    page:
      normalizePage(
        input.page,
      ),
  };
}


/* ==========================================================================
   WHERE — CATÉGORIES
   ========================================================================== */

/**
 * Construit uniquement les filtres applicables à la liste.
 *
 * Les KPI globaux ne dépendent volontairement pas de la recherche courante.
 */

function buildCategoryWhere(
  filters:
    ManagerCategoriesFilters,
): Prisma.ProductCategoryWhereInput {
  const where:
    Prisma.ProductCategoryWhereInput = {};


  /* ------------------------------------------------------------------------
     RECHERCHE
     ------------------------------------------------------------------------ */

  if (
    filters.q
  ) {
    where.name = {
      contains:
        filters.q,

      mode:
        "insensitive",
    };
  }


  /* ------------------------------------------------------------------------
     STATUT
     ------------------------------------------------------------------------ */

  if (
    filters.status ===
    "active"
  ) {
    where.isActive =
      true;
  }


  if (
    filters.status ===
    "inactive"
  ) {
    where.isActive =
      false;
  }


  return where;
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function getResolvedPage(
  requestedPage:
    number,

  totalPages:
    number,
): number {
  if (
    totalPages <=
    0
  ) {
    return 1;
  }


  return Math.min(
    Math.max(
      requestedPage,
      1,
    ),
    totalPages,
  );
}


function buildPagination(
  params:
    Readonly<{
      page:
        number;

      pageSize:
        number;

      totalItems:
        number;

      totalPages:
        number;

      currentItems:
        number;
    }>,
): ManagerCategoriesPagination {
  const {
    page,
    pageSize,
    totalItems,
    totalPages,
    currentItems,
  } =
    params;


  if (
    totalItems ===
      0 ||
    currentItems ===
      0
  ) {
    return {
      page,

      pageSize,

      totalItems,

      totalPages,

      startItem:
        0,

      endItem:
        0,

      hasPreviousPage:
        page >
        1,

      hasNextPage:
        page <
        totalPages,
    };
  }


  const startItem =
    (
      page -
      1
    ) *
      pageSize +
    1;


  const endItem =
    Math.min(
      startItem +
        currentItems -
        1,

      totalItems,
    );


  return {
    page,

    pageSize,

    totalItems,

    totalPages,

    startItem,

    endItem,

    hasPreviousPage:
      page >
      1,

    hasNextPage:
      page <
      totalPages,
  };
}


/* ==========================================================================
   KPI
   ========================================================================== */

/**
 * Les KPI représentent les catégories officielles réellement présentes
 * en base.
 *
 * Ils ne sont pas modifiés par :
 *
 * - la recherche ;
 * - le filtre statut ;
 * - la pagination.
 */

async function queryCategoriesKpis():
  Promise<ManagerCategoriesKpis> {
  const [
    total,
    active,
  ] =
    await db.$transaction([
      db.productCategory.count(),

      db.productCategory.count({
        where: {
          isActive:
            true,
        },
      }),
    ]);


  return {
    total,

    active,

    inactive:
      Math.max(
        0,
        total -
          active,
      ),
  };
}


/* ==========================================================================
   TOTAL FILTRÉ
   ========================================================================== */

async function queryFilteredCategoryCount(
  where:
    Prisma.ProductCategoryWhereInput,
): Promise<number> {
  return db.productCategory.count({
    where,
  });
}


/* ==========================================================================
   LISTE DES CATÉGORIES
   ========================================================================== */

/**
 * Point important :
 *
 * ProductCategory possède :
 *
 * products Product[]
 *
 * Product possède :
 *
 * storeProducts StoreProduct[]
 *
 * StoreProduct possède :
 *
 * storeId
 *
 * Le _count ci-dessous compte donc uniquement les Product ayant au moins
 * un StoreProduct appartenant à la boutique authentifiée.
 *
 * Ainsi :
 *
 * Gestionnaire Dakar
 * → compte uniquement ses produits.
 *
 * Gestionnaire Yaoundé
 * → compte uniquement ses produits.
 */

async function queryCategories(
  params:
    Readonly<{
      storeId:
        string;

      where:
        Prisma.ProductCategoryWhereInput;

      page:
        number;

      pageSize:
        number;
    }>,
): Promise<ManagerCategoryListItem[]> {
  const {
    storeId,
    where,
    page,
    pageSize,
  } =
    params;


  const skip =
    (
      page -
      1
    ) *
    pageSize;


  const categories =
    await db.productCategory.findMany({
      where,

      orderBy: [
        {
          name:
            "asc",
        },

        {
          id:
            "asc",
        },
      ],

      skip,

      take:
        pageSize,

      select: {
        id:
          true,

        name:
          true,

        slug:
          true,

        description:
          true,

        imageUrl:
          true,

        imageAlt:
          true,

        isActive:
          true,

        createdAt:
          true,

        _count: {
          select: {
            products: {
              where: {
                storeProducts: {
                  some: {
                    storeId,
                  },
                },
              },
            },
          },
        },
      },
    });


  return categories.map(
    (
      category,
    ): ManagerCategoryListItem => ({
      id:
        category.id,

      name:
        category.name,

      slug:
        category.slug,

      description:
        category.description,

      imageUrl:
        category.imageUrl,

      imageAlt:
        category.imageAlt,

      isActive:
        category.isActive,

      productCount:
        category._count
          .products,

      createdAt:
        category.createdAt
          .toISOString(),
    }),
  );
}


/* ==========================================================================
   QUERY PRINCIPALE
   ========================================================================== */

/**
 * Charge toutes les données nécessaires à la page :
 *
 * /gestionnaire/categories
 *
 * SÉCURITÉ :
 *
 * Aucun storeId n'est accepté en argument.
 *
 * Le storeId provient exclusivement de :
 *
 * requireGestionnairePrivateAccess()
 *
 * et donc de la session Gestionnaire validée côté serveur.
 */

export async function getManagerCategories(
  input:
    GetManagerCategoriesInput =
      {},
): Promise<ManagerCategoriesPageData> {
  /* ------------------------------------------------------------------------
     1. ACCÈS PRIVÉ
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    requireStoreId(
      access.store.id,
    );


  /* ------------------------------------------------------------------------
     2. FILTRES
     ------------------------------------------------------------------------ */

  const normalizedFilters =
    normalizeFilters(
      input,
    );


  const where =
    buildCategoryWhere(
      normalizedFilters,
    );


  /* ------------------------------------------------------------------------
     3. KPI + NOMBRE FILTRÉ
     ------------------------------------------------------------------------ */

  const [
    kpis,
    totalItems,
  ] =
    await Promise.all([
      queryCategoriesKpis(),

      queryFilteredCategoryCount(
        where,
      ),
    ]);


  /* ------------------------------------------------------------------------
     4. PAGINATION
     ------------------------------------------------------------------------ */

  const pageSize =
    MANAGER_CATEGORIES_PAGE_SIZE;


  const totalPages =
    totalItems >
      0
      ? Math.ceil(
          totalItems /
            pageSize,
        )
      : 0;


  /**
   * Si l'utilisateur demande :
   *
   * ?page=50
   *
   * alors qu'une seule page existe, on retombe proprement sur la dernière
   * page disponible au lieu d'afficher artificiellement une liste vide.
   */

  const resolvedPage =
    getResolvedPage(
      normalizedFilters.page,
      totalPages,
    );


  /* ------------------------------------------------------------------------
     5. CATÉGORIES
     ------------------------------------------------------------------------ */

  const categories =
    await queryCategories({
      storeId,

      where,

      page:
        resolvedPage,

      pageSize,
    });


  /* ------------------------------------------------------------------------
     6. PAGINATION FINALE
     ------------------------------------------------------------------------ */

  const pagination =
    buildPagination({
      page:
        resolvedPage,

      pageSize,

      totalItems,

      totalPages,

      currentItems:
        categories.length,
    });


  /* ------------------------------------------------------------------------
     7. RÉSULTAT
     ------------------------------------------------------------------------ */

  return {
    categories,

    kpis,

    filters: {
      ...normalizedFilters,

      page:
        resolvedPage,
    },

    pagination,
  };
}