import "server-only";

import {
  Prisma,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  DEFAULT_MANAGER_STOCK_FILTERS,
  MANAGER_STOCK_PAGE_SIZE,
  getManagerStockStatus,
  isManagerStockStatusFilter,
  type GetManagerStockPageDataInput,
  type ManagerStockCategoryOption,
  type ManagerStockFilters,
  type ManagerStockItem,
  type ManagerStockKpis,
  type ManagerStockMoney,
  type ManagerStockPageData,
  type ManagerStockPagination,
  type ManagerStockStatus,
  type ManagerStockStatusFilter,
  type ManagerStockValueByCurrency,
} from "@/lib/gestionnaire/stock/stock-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/stock/stock-query.ts
 *
 * RÔLE :
 *
 * Charger toutes les données réelles nécessaires à :
 *
 * /gestionnaire/stock
 *
 * RESPONSABILITÉS :
 *
 * - vérifier l'accès Gestionnaire côté serveur ;
 * - récupérer storeId depuis la session sécurisée ;
 * - normaliser les search params ;
 * - rechercher par nom produit ou SKU ;
 * - filtrer par catégorie ;
 * - filtrer par statut de stock ;
 * - calculer les KPI réels ;
 * - calculer la valeur réelle du stock ;
 * - conserver les devises séparées ;
 * - récupérer l'image principale réelle ;
 * - appliquer une pagination serveur ;
 * - retourner uniquement les données nécessaires à l'interface.
 *
 * IMPORTANT :
 *
 * Ce fichier ne doit jamais :
 *
 * - recevoir storeId du navigateur ;
 * - recevoir managerId du navigateur ;
 * - utiliser de faux produits ;
 * - utiliser de faux stocks ;
 * - utiliser de faux montants ;
 * - utiliser une devise codée en dur ;
 * - créer un mouvement de stock ;
 * - modifier le stock ;
 * - utiliser un cache partagé entre Gestionnaires.
 *
 * ============================================================================
 */


/* ==========================================================================
   SELECT — LIGNE STOCK
   ========================================================================== */

/**
 * Une seule image est nécessaire dans le tableau.
 *
 * Ordre :
 *
 * 1. image marquée principale ;
 * 2. position ;
 * 3. date de création.
 */

const MANAGER_STOCK_ITEM_SELECT = {
  id:
    true,

  productId:
    true,

  price:
    true,

  currency:
    true,

  stockQuantity:
    true,

  lowStockThreshold:
    true,

  updatedAt:
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

          slug:
            true,
        },
      },

      images: {
        orderBy: [
          {
            isPrimary:
              "desc",
          },
          {
            position:
              "asc",
          },
          {
            createdAt:
              "asc",
          },
        ],

        take:
          1,

        select: {
          url:
            true,

          altText:
            true,
        },
      },
    },
  },
} satisfies Prisma.StoreProductSelect;


/* ==========================================================================
   TYPE INTERNE — RECORD PRISMA
   ========================================================================== */

type ManagerStockItemRecord =
  Prisma.StoreProductGetPayload<{
    select:
      typeof MANAGER_STOCK_ITEM_SELECT;
  }>;


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

interface ManagerStockCandidateRecord {
  id:
    string;

  stockQuantity:
    number;

  lowStockThreshold:
    number;
}


interface ManagerStockKpiRecord {
  stockQuantity:
    number;

  lowStockThreshold:
    number;

  price:
    Prisma.Decimal;

  currency:
    string;
}


/* ==========================================================================
   NORMALISATION — TEXTE
   ========================================================================== */

function normalizeText(
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


  return value
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


/* ==========================================================================
   NORMALISATION — RECHERCHE
   ========================================================================== */

function normalizeSearch(
  value:
    string |
    null |
    undefined,
): string {
  return normalizeText(
    value,
  );
}


/* ==========================================================================
   NORMALISATION — CATÉGORIE
   ========================================================================== */

function normalizeCategory(
  value:
    string |
    null |
    undefined,
): string {
  return normalizeText(
    value,
  );
}


/* ==========================================================================
   NORMALISATION — STATUT
   ========================================================================== */

function normalizeStatus(
  value:
    ManagerStockStatusFilter |
    null |
    undefined,
): ManagerStockStatusFilter {
  if (
    isManagerStockStatusFilter(
      value,
    )
  ) {
    return value;
  }


  return DEFAULT_MANAGER_STOCK_FILTERS
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
    return DEFAULT_MANAGER_STOCK_FILTERS
      .page;
  }


  const page =
    Math.trunc(
      value,
    );


  if (
    page <
    1
  ) {
    return DEFAULT_MANAGER_STOCK_FILTERS
      .page;
  }


  return page;
}


/* ==========================================================================
   NORMALISATION — QUANTITÉ
   ========================================================================== */

function normalizeQuantity(
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


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


/* ==========================================================================
   NORMALISATION — SEUIL
   ========================================================================== */

function normalizeLowStockThreshold(
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


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


/* ==========================================================================
   NORMALISATION — DEVISE
   ========================================================================== */

/**
 * Aucune devise par défaut n'est injectée ici.
 *
 * La valeur doit venir réellement de StoreProduct.currency.
 */

function normalizeCurrency(
  value:
    string,
): string {
  const currency =
    normalizeText(
      value,
    ).toUpperCase();


  if (
    !currency
  ) {
    throw new Error(
      "MANAGER_STOCK_CURRENCY_INVALID",
    );
  }


  return currency;
}


/* ==========================================================================
   STORE ID
   ========================================================================== */

/**
 * storeId vient exclusivement de la session Gestionnaire.
 */

function requireStoreId(
  value:
    string,
): string {
  const storeId =
    normalizeText(
      value,
    );


  if (
    !storeId
  ) {
    throw new Error(
      "MANAGER_STOCK_STORE_ID_INVALID",
    );
  }


  return storeId;
}


/* ==========================================================================
   FILTRES NORMALISÉS
   ========================================================================== */

function normalizeFilters(
  input:
    GetManagerStockPageDataInput,
): ManagerStockFilters {
  return {
    q:
      normalizeSearch(
        input.search,
      ),

    category:
      normalizeCategory(
        input.category,
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
   WHERE COMMUN
   ========================================================================== */

/**
 * Ce filtre applique uniquement :
 *
 * - boutique authentifiée ;
 * - recherche ;
 * - catégorie.
 *
 * Le statut de stock est traité séparément car LOW_STOCK nécessite une
 * comparaison entre deux colonnes :
 *
 * stockQuantity <= lowStockThreshold
 *
 * Pour rester compatible et prévisible avec Prisma, cette comparaison est
 * effectuée côté serveur sur un jeu minimal de champs lorsque le filtre
 * de statut est utilisé.
 */

function buildBaseStockWhere(
  storeId:
    string,

  filters:
    ManagerStockFilters,
): Prisma.StoreProductWhereInput {
  const andConditions:
    Prisma.StoreProductWhereInput[] = [
      {
        storeId,
      },
    ];


  /* ------------------------------------------------------------------------
     RECHERCHE
     ------------------------------------------------------------------------ */

  if (
    filters.q
  ) {
    andConditions.push({
      product: {
        OR: [
          {
            name: {
              contains:
                filters.q,

              mode:
                "insensitive",
            },
          },
          {
            sku: {
              contains:
                filters.q,

              mode:
                "insensitive",
            },
          },
        ],
      },
    });
  }


  /* ------------------------------------------------------------------------
     CATÉGORIE
     ------------------------------------------------------------------------ */

  if (
    filters.category
  ) {
    andConditions.push({
      product: {
        category: {
          slug:
            filters.category,
        },
      },
    });
  }


  return {
    AND:
      andConditions,
  };
}


/* ==========================================================================
   ORDRE DE LA LISTE
   ========================================================================== */

const MANAGER_STOCK_ORDER_BY:
  Prisma.StoreProductOrderByWithRelationInput[] = [
    {
      updatedAt:
        "desc",
    },
    {
      id:
        "asc",
    },
  ];


/* ==========================================================================
   STATUT — MATCH FILTRE
   ========================================================================== */

function matchesStockStatusFilter(
  record:
    Pick<
      ManagerStockCandidateRecord,
      | "stockQuantity"
      | "lowStockThreshold"
    >,

  filter:
    ManagerStockStatusFilter,
): boolean {
  if (
    filter ===
    "all"
  ) {
    return true;
  }


  const status =
    getManagerStockStatus(
      record.stockQuantity,
      record.lowStockThreshold,
    );


  switch (
    filter
  ) {
    case "in_stock":
      return status ===
        "IN_STOCK";

    case "low_stock":
      return status ===
        "LOW_STOCK";

    case "out_of_stock":
      return status ===
        "OUT_OF_STOCK";
  }
}


/* ==========================================================================
   PAGINATION — PAGE RÉSOLUE
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
      1,
      requestedPage,
    ),
    totalPages,
  );
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function buildPagination(
  page:
    number,

  pageSize:
    number,

  totalItems:
    number,
): ManagerStockPagination {
  const totalPages =
    totalItems >
    0
      ? Math.ceil(
          totalItems /
            pageSize,
        )
      : 0;


  const resolvedPage =
    getResolvedPage(
      page,
      totalPages,
    );


  const startItem =
    totalItems >
    0
      ? (
          resolvedPage -
          1
        ) *
          pageSize +
        1
      : 0;


  const endItem =
    totalItems >
    0
      ? Math.min(
          resolvedPage *
            pageSize,
          totalItems,
        )
      : 0;


  return {
    page:
      resolvedPage,

    pageSize,

    totalItems,

    totalPages,

    startItem,

    endItem,

    hasPreviousPage:
      resolvedPage >
      1,

    hasNextPage:
      totalPages >
        0 &&
      resolvedPage <
        totalPages,
  };
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function createMoney(
  amount:
    Prisma.Decimal,

  currency:
    string,
): ManagerStockMoney {
  return {
    amount:
      amount.toFixed(
        2,
      ),

    currency:
      normalizeCurrency(
        currency,
      ),
  };
}


/* ==========================================================================
   IMAGE PRINCIPALE
   ========================================================================== */

function buildStockImage(
  record:
    ManagerStockItemRecord,
): ManagerStockItem["image"] {
  const image =
    record.product
      .images[0];


  if (
    !image
  ) {
    return null;
  }


  const url =
    normalizeText(
      image.url,
    );


  if (
    !url
  ) {
    return null;
  }


  const altText =
    normalizeText(
      image.altText,
    );


  return {
    url,

    altText:
      altText ||
      record.product.name,
  };
}


/* ==========================================================================
   CONVERSION RECORD → ITEM
   ========================================================================== */

function buildStockItem(
  record:
    ManagerStockItemRecord,
): ManagerStockItem {
  const stockQuantity =
    normalizeQuantity(
      record.stockQuantity,
    );


  const lowStockThreshold =
    normalizeLowStockThreshold(
      record.lowStockThreshold,
    );


  const currency =
    normalizeCurrency(
      record.currency,
    );


  const stockStatus =
    getManagerStockStatus(
      stockQuantity,
      lowStockThreshold,
    );


  const estimatedValue =
    record.price.mul(
      stockQuantity,
    );


  return {
    storeProductId:
      record.id,

    productId:
      record.productId,

    name:
      record.product.name,

    sku:
      record.product.sku,

    image:
      buildStockImage(
        record,
      ),

    category:
      record.product
        .category
        ? {
            id:
              record.product
                .category
                .id,

            name:
              record.product
                .category
                .name,

            slug:
              record.product
                .category
                .slug,
          }
        : null,

    stockQuantity,

    lowStockThreshold,

    stockStatus,

    unitPrice:
      createMoney(
        record.price,
        currency,
      ),

    estimatedValue:
      createMoney(
        estimatedValue,
        currency,
      ),

    updatedAt:
      record.updatedAt
        .toISOString(),
  };
}


/* ==========================================================================
   CATÉGORIES
   ========================================================================== */

/**
 * Les catégories viennent réellement de ProductCategory.
 *
 * On ne code aucune catégorie en dur dans l'application.
 */

async function queryStockCategories():
  Promise<
    readonly ManagerStockCategoryOption[]
  > {
  const categories =
    await db.productCategory.findMany({
      where: {
        isActive:
          true,
      },

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

      select: {
        id:
          true,

        name:
          true,

        slug:
          true,
      },
    });


  return categories.map(
    (
      category,
    ) => ({
      id:
        category.id,

      name:
        category.name,

      slug:
        category.slug,
    }),
  );
}


/* ==========================================================================
   KPI — RECORDS
   ========================================================================== */

/**
 * Charge uniquement les champs nécessaires aux KPI.
 *
 * Pas d'images.
 * Pas de descriptions.
 * Pas de relations inutiles.
 */

async function queryStockKpiRecords(
  storeId:
    string,
): Promise<
  readonly ManagerStockKpiRecord[]
> {
  return db.storeProduct.findMany({
    where: {
      storeId,
    },

    select: {
      stockQuantity:
        true,

      lowStockThreshold:
        true,

      price:
        true,

      currency:
        true,
    },
  });
}


/* ==========================================================================
   KPI — CALCUL
   ========================================================================== */

function buildStockKpis(
  records:
    readonly ManagerStockKpiRecord[],
): ManagerStockKpis {
  let outOfStockProducts =
    0;


  let lowStockProducts =
    0;


  const totalByCurrency =
    new Map<
      string,
      Prisma.Decimal
    >();


  for (
    const record
    of records
  ) {
    const stockQuantity =
      normalizeQuantity(
        record.stockQuantity,
      );


    const lowStockThreshold =
      normalizeLowStockThreshold(
        record.lowStockThreshold,
      );


    const status:
      ManagerStockStatus =
        getManagerStockStatus(
          stockQuantity,
          lowStockThreshold,
        );


    if (
      status ===
      "OUT_OF_STOCK"
    ) {
      outOfStockProducts +=
        1;
    }


    if (
      status ===
      "LOW_STOCK"
    ) {
      lowStockProducts +=
        1;
    }


    /* ----------------------------------------------------------------------
       VALEUR PAR DEVISE
       ---------------------------------------------------------------------- */

    const currency =
      normalizeCurrency(
        record.currency,
      );


    const stockValue =
      record.price.mul(
        stockQuantity,
      );


    const currentTotal =
      totalByCurrency.get(
        currency,
      );


    totalByCurrency.set(
      currency,
      currentTotal
        ? currentTotal.add(
            stockValue,
          )
        : stockValue,
    );
  }


  const totalEstimatedValue:
    ManagerStockValueByCurrency[] =
      Array.from(
        totalByCurrency.entries(),
      )
        .sort(
          (
            first,
            second,
          ) =>
            first[0].localeCompare(
              second[0],
              "fr",
            ),
        )
        .map(
          (
            [
              currency,
              amount,
            ],
          ) => ({
            currency,

            amount:
              amount.toFixed(
                2,
              ),
          }),
        );


  return {
    totalProducts:
      records.length,

    totalEstimatedValue,

    outOfStockProducts,

    lowStockProducts,
  };
}


/* ==========================================================================
   CANDIDATS POUR FILTRE DE STATUT
   ========================================================================== */

/**
 * Lorsque status != all, on ne charge pas tous les détails produits.
 *
 * On récupère seulement :
 *
 * - id ;
 * - stockQuantity ;
 * - lowStockThreshold.
 *
 * Cela permet de calculer proprement :
 *
 * IN_STOCK
 * LOW_STOCK
 * OUT_OF_STOCK
 *
 * avant d'appliquer la pagination.
 */

async function queryStockCandidates(
  where:
    Prisma.StoreProductWhereInput,
): Promise<
  readonly ManagerStockCandidateRecord[]
> {
  return db.storeProduct.findMany({
    where,

    orderBy:
      MANAGER_STOCK_ORDER_BY,

    select: {
      id:
        true,

      stockQuantity:
        true,

      lowStockThreshold:
        true,
    },
  });
}


/* ==========================================================================
   TOTAL SANS FILTRE DE STATUT
   ========================================================================== */

async function queryStockCount(
  where:
    Prisma.StoreProductWhereInput,
): Promise<number> {
  return db.storeProduct.count({
    where,
  });
}


/* ==========================================================================
   ITEMS — PAGINATION DIRECTE
   ========================================================================== */

async function queryStockItemsPage(
  params:
    Readonly<{
      where:
        Prisma.StoreProductWhereInput;

      page:
        number;

      pageSize:
        number;
    }>,
): Promise<
  readonly ManagerStockItem[]
> {
  const records =
    await db.storeProduct.findMany({
      where:
        params.where,

      orderBy:
        MANAGER_STOCK_ORDER_BY,

      skip:
        (
          params.page -
          1
        ) *
        params.pageSize,

      take:
        params.pageSize,

      select:
        MANAGER_STOCK_ITEM_SELECT,
    });


  return records.map(
    buildStockItem,
  );
}


/* ==========================================================================
   ITEMS — À PARTIR D'IDS FILTRÉS
   ========================================================================== */

/**
 * Prisma ne garantit pas l'ordre d'un `id in [...]`.
 *
 * On reconstruit donc l'ordre après la requête à partir des IDs déjà
 * triés dans la liste des candidats.
 */

async function queryStockItemsByIds(
  ids:
    readonly string[],
): Promise<
  readonly ManagerStockItem[]
> {
  if (
    ids.length ===
    0
  ) {
    return [];
  }


  const records =
    await db.storeProduct.findMany({
      where: {
        id: {
          in:
            [...ids],
        },
      },

      select:
        MANAGER_STOCK_ITEM_SELECT,
    });


  const recordsById =
    new Map<
      string,
      ManagerStockItemRecord
    >(
      records.map(
        (
          record,
        ) => [
          record.id,
          record,
        ],
      ),
    );


  const orderedItems:
    ManagerStockItem[] =
      [];


  for (
    const id
    of ids
  ) {
    const record =
      recordsById.get(
        id,
      );


    if (
      !record
    ) {
      continue;
    }


    orderedItems.push(
      buildStockItem(
        record,
      ),
    );
  }


  return orderedItems;
}


/* ==========================================================================
   PAGE — SANS FILTRE DE STATUT
   ========================================================================== */

async function queryUnfilteredStatusPage(
  params:
    Readonly<{
      where:
        Prisma.StoreProductWhereInput;

      requestedPage:
        number;

      pageSize:
        number;
    }>,
): Promise<
  Readonly<{
    items:
      readonly ManagerStockItem[];

    pagination:
      ManagerStockPagination;
  }>
> {
  const totalItems =
    await queryStockCount(
      params.where,
    );


  const provisionalPagination =
    buildPagination(
      params.requestedPage,
      params.pageSize,
      totalItems,
    );


  const items =
    totalItems >
    0
      ? await queryStockItemsPage({
          where:
            params.where,

          page:
            provisionalPagination.page,

          pageSize:
            params.pageSize,
        })
      : [];


  return {
    items,

    pagination:
      provisionalPagination,
  };
}


/* ==========================================================================
   PAGE — AVEC FILTRE DE STATUT
   ========================================================================== */

async function queryFilteredStatusPage(
  params:
    Readonly<{
      where:
        Prisma.StoreProductWhereInput;

      status:
        Exclude<
          ManagerStockStatusFilter,
          "all"
        >;

      requestedPage:
        number;

      pageSize:
        number;
    }>,
): Promise<
  Readonly<{
    items:
      readonly ManagerStockItem[];

    pagination:
      ManagerStockPagination;
  }>
> {
  const candidates =
    await queryStockCandidates(
      params.where,
    );


  const matchingIds =
    candidates
      .filter(
        (
          candidate,
        ) =>
          matchesStockStatusFilter(
            candidate,
            params.status,
          ),
      )
      .map(
        (
          candidate,
        ) =>
          candidate.id,
      );


  const pagination =
    buildPagination(
      params.requestedPage,
      params.pageSize,
      matchingIds.length,
    );


  if (
    matchingIds.length ===
    0
  ) {
    return {
      items:
        [],

      pagination,
    };
  }


  const startIndex =
    (
      pagination.page -
      1
    ) *
    params.pageSize;


  const pageIds =
    matchingIds.slice(
      startIndex,
      startIndex +
        params.pageSize,
    );


  const items =
    await queryStockItemsByIds(
      pageIds,
    );


  return {
    items,

    pagination,
  };
}


/* ==========================================================================
   SERVICE PRINCIPAL
   ========================================================================== */

/**
 * Point d'entrée officiel de la page :
 *
 * /gestionnaire/stock
 *
 * IMPORTANT :
 *
 * Aucun storeId ni managerId n'est accepté en paramètre.
 *
 * Le périmètre est toujours :
 *
 * session sécurisée
 *       ↓
 * requireGestionnairePrivateAccess()
 *       ↓
 * access.store.id
 *       ↓
 * StoreProduct.storeId
 */

export async function getManagerStockPageData(
  input:
    GetManagerStockPageDataInput =
      {},
): Promise<
  ManagerStockPageData
> {
  /* =========================================================================
     1. AUTHENTIFICATION
     ========================================================================= */

  const access =
    await requireGestionnairePrivateAccess();


  /* =========================================================================
     2. BOUTIQUE DE LA SESSION
     ========================================================================= */

  const storeId =
    requireStoreId(
      access.store.id,
    );


  /* =========================================================================
     3. FILTRES
     ========================================================================= */

  const filters =
    normalizeFilters(
      input,
    );


  /* =========================================================================
     4. WHERE
     ========================================================================= */

  const where =
    buildBaseStockWhere(
      storeId,
      filters,
    );


  /* =========================================================================
     5. DONNÉES COMMUNES
     ========================================================================= */

  const [
    kpiRecords,
    categories,
  ] =
    await Promise.all([
      queryStockKpiRecords(
        storeId,
      ),

      queryStockCategories(),
    ]);


  const kpis =
    buildStockKpis(
      kpiRecords,
    );


  /* =========================================================================
     6. LISTE + PAGINATION
     ========================================================================= */

  const pageResult =
    filters.status ===
    "all"
      ? await queryUnfilteredStatusPage({
          where,

          requestedPage:
            filters.page,

          pageSize:
            MANAGER_STOCK_PAGE_SIZE,
        })
      : await queryFilteredStatusPage({
          where,

          status:
            filters.status,

          requestedPage:
            filters.page,

          pageSize:
            MANAGER_STOCK_PAGE_SIZE,
        });


  /* =========================================================================
     7. RÉSULTAT FINAL
     ========================================================================= */

  return {
    kpis,

    categories,

    items:
      pageResult.items,

    filters: {
      ...filters,

      /**
       * Si l'utilisateur demande :
       *
       * ?page=999
       *
       * et qu'il n'existe que 3 pages,
       *
       * le service renvoie page = 3.
       */
      page:
        pageResult
          .pagination
          .page,
    },

    pagination:
      pageResult.pagination,
  };
}