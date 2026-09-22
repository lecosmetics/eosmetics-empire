import "server-only";

import {
  Prisma,
  ProductStatus,
  StoreProductStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * SERVICE — LISTE DES PRODUITS GESTIONNAIRE
 * ============================================================================
 *
 * Fichier :
 *
 * src/server/gestionnaire/products/product-list-service.ts
 *
 * RESPONSABILITÉS :
 *
 * - récupérer la boutique depuis la session Gestionnaire ;
 * - ne jamais accepter storeId depuis le navigateur ;
 * - charger uniquement les produits de cette boutique ;
 * - calculer les KPI réels ;
 * - effectuer la recherche côté serveur ;
 * - filtrer par statut ;
 * - filtrer par catégorie ;
 * - appliquer le tri ;
 * - paginer côté serveur ;
 * - charger uniquement les données utiles à la liste ;
 * - préparer des données sérialisables pour la page.
 *
 * PAGE :
 *
 * /gestionnaire/produits
 *
 * IMPORTANT :
 *
 * Ce service ne reçoit volontairement PAS :
 *
 * - storeId ;
 * - managerId ;
 * - representativeId.
 *
 * Le périmètre est déterminé exclusivement depuis :
 *
 * requireGestionnairePrivateAccess()
 *
 * puis :
 *
 * access.store.id
 *
 * ============================================================================
 */


/* ==========================================================================
   PAGINATION
   ========================================================================== */

export const GESTIONNAIRE_PRODUCTS_PAGE_SIZE =
  10;


/* ==========================================================================
   LIMITES DES PARAMÈTRES
   ========================================================================== */

const MAX_SEARCH_LENGTH =
  120;


const MAX_CATEGORY_SLUG_LENGTH =
  160;


const MAX_PAGE_NUMBER =
  100_000;


/* ==========================================================================
   STATUTS D'AFFICHAGE
   --------------------------------------------------------------------------
   Ces valeurs appartiennent uniquement à l'interface Mes produits.

   Elles ne remplacent PAS les enums Prisma.

   PUBLISHED :
   Product.status = ACTIVE
   ET
   StoreProduct.status = ACTIVE ou OUT_OF_STOCK

   DRAFT :
   Product.status = DRAFT

   INACTIVE :
   Product.status = ACTIVE
   ET
   StoreProduct.status = HIDDEN

   Les données ARCHIVED sont volontairement exclues de la liste
   opérationnelle Mes produits.
   ========================================================================== */

export type GestionnaireProductDisplayStatus =
  | "PUBLISHED"
  | "DRAFT"
  | "INACTIVE";


/* ==========================================================================
   ÉTAT DU STOCK
   ========================================================================== */

export type GestionnaireProductStockState =
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";


/* ==========================================================================
   FILTRE STATUT
   ========================================================================== */

export type GestionnaireProductsStatusFilter =
  | "all"
  | "published"
  | "draft"
  | "inactive";


/* ==========================================================================
   TRI
   ========================================================================== */

export type GestionnaireProductsSort =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc";


/* ==========================================================================
   SEARCH PARAMS
   ========================================================================== */

export type GestionnaireProductsSearchParams =
  Readonly<
    Record<
      string,
      string |
      string[] |
      undefined
    >
  >;


/* ==========================================================================
   QUERY NORMALISÉE
   ========================================================================== */

export interface GestionnaireProductsQuery {
  q:
    string;

  status:
    GestionnaireProductsStatusFilter;

  category:
    string |
    null;

  sort:
    GestionnaireProductsSort;

  page:
    number;
}


/* ==========================================================================
   KPI
   ========================================================================== */

export interface GestionnaireProductsStats {
  total:
    number;

  published:
    number;

  drafts:
    number;

  lowStock:
    number;
}


/* ==========================================================================
   CATÉGORIE DE FILTRE
   ========================================================================== */

export interface GestionnaireProductCategoryOption {
  name:
    string;

  slug:
    string;
}


/* ==========================================================================
   IMAGE DE LISTE
   ========================================================================== */

export interface GestionnaireProductListImage {
  url:
    string;

  altText:
    string |
    null;
}


/* ==========================================================================
   PRIX
   ========================================================================== */

export interface GestionnaireProductListPricing {
  /**
   * Prisma.Decimal est transformé en string afin que la donnée
   * puisse être transmise proprement au composant React.
   *
   * Exemple :
   *
   * "8500.00"
   */
  amount:
    string;

  currency:
    string;
}


/* ==========================================================================
   STOCK
   ========================================================================== */

export interface GestionnaireProductListInventory {
  quantity:
    number;

  lowStockThreshold:
    number;

  state:
    GestionnaireProductStockState;
}


/* ==========================================================================
   PRODUIT DE LISTE
   ========================================================================== */

export interface GestionnaireProductListItem {
  /**
   * ID du vrai Product.
   *
   * Utilisé pour :
   *
   * /gestionnaire/produits/[productId]
   *
   * et :
   *
   * /gestionnaire/produits/ajouter?productId=...
   */
  productId:
    string;

  /**
   * ID du StoreProduct.
   *
   * Conservé côté serveur/interface lorsque nécessaire pour les
   * opérations commerciales spécifiques à la boutique.
   */
  storeProductId:
    string;

  name:
    string;

  sku:
    string;

  image:
    GestionnaireProductListImage |
    null;

  category:
    Readonly<{
      name:
        string;

      slug:
        string;
    }> |
    null;

  pricing:
    GestionnaireProductListPricing;

  inventory:
    GestionnaireProductListInventory;

  status:
    GestionnaireProductDisplayStatus;

  createdAt:
    Date;
}


/* ==========================================================================
   PAGINATION PUBLIQUE DU SERVICE
   ========================================================================== */

export interface GestionnaireProductsPagination {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;

  from:
    number;

  to:
    number;

  hasPreviousPage:
    boolean;

  hasNextPage:
    boolean;
}


/* ==========================================================================
   RÉSULTAT COMPLET
   ========================================================================== */

export interface GestionnaireProductsListData {
  stats:
    GestionnaireProductsStats;

  categories:
    readonly GestionnaireProductCategoryOption[];

  products:
    readonly GestionnaireProductListItem[];

  query:
    GestionnaireProductsQuery;

  pagination:
    GestionnaireProductsPagination;
}


/* ==========================================================================
   HELPERS — SEARCH PARAM
   ========================================================================== */

function getFirstSearchParam(
  value:
    string |
    string[] |
    undefined,
): string | undefined {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    return value[0];
  }


  return undefined;
}


/* ==========================================================================
   NORMALISATION — STRING
   ========================================================================== */

function normalizeString(
  value:
    unknown,
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/* ==========================================================================
   NORMALISATION — RECHERCHE
   ========================================================================== */

function normalizeSearchQuery(
  value:
    unknown,
): string {
  return normalizeString(
    value,
  ).slice(
    0,
    MAX_SEARCH_LENGTH,
  );
}


/* ==========================================================================
   NORMALISATION — STATUT
   ========================================================================== */

function normalizeStatusFilter(
  value:
    unknown,
): GestionnaireProductsStatusFilter {
  const normalized =
    normalizeString(
      value,
    )
      .toLowerCase();


  switch (
    normalized
  ) {
    case "published":
      return "published";

    case "draft":
      return "draft";

    case "inactive":
      return "inactive";

    default:
      return "all";
  }
}


/* ==========================================================================
   NORMALISATION — CATÉGORIE
   ========================================================================== */

function normalizeCategoryFilter(
  value:
    unknown,
): string | null {
  const normalized =
    normalizeString(
      value,
    );


  if (
    !normalized
  ) {
    return null;
  }


  if (
    normalized.length >
    MAX_CATEGORY_SLUG_LENGTH
  ) {
    return null;
  }


  /*
   * ProductCategory.slug est utilisé comme valeur du filtre.
   *
   * On reste volontairement tolérant :
   * une valeur non existante retournera simplement zéro résultat.
   */

  return normalized;
}


/* ==========================================================================
   NORMALISATION — TRI
   ========================================================================== */

function normalizeSort(
  value:
    unknown,
): GestionnaireProductsSort {
  const normalized =
    normalizeString(
      value,
    )
      .toLowerCase();


  switch (
    normalized
  ) {
    case "oldest":
      return "oldest";

    case "name-asc":
      return "name-asc";

    case "name-desc":
      return "name-desc";

    default:
      return "newest";
  }
}


/* ==========================================================================
   NORMALISATION — PAGE
   ========================================================================== */

function normalizePage(
  value:
    unknown,
): number {
  const normalized =
    normalizeString(
      value,
    );


  if (
    !normalized
  ) {
    return 1;
  }


  const parsed =
    Number.parseInt(
      normalized,
      10,
    );


  if (
    !Number.isFinite(
      parsed,
    ) ||
    parsed <
      1
  ) {
    return 1;
  }


  return Math.min(
    parsed,
    MAX_PAGE_NUMBER,
  );
}


/* ==========================================================================
   NORMALISATION COMPLÈTE DES SEARCH PARAMS
   ========================================================================== */

export function normalizeGestionnaireProductsQuery(
  searchParams:
    GestionnaireProductsSearchParams,
): GestionnaireProductsQuery {
  return {
    q:
      normalizeSearchQuery(
        getFirstSearchParam(
          searchParams.q,
        ),
      ),

    status:
      normalizeStatusFilter(
        getFirstSearchParam(
          searchParams.status,
        ),
      ),

    category:
      normalizeCategoryFilter(
        getFirstSearchParam(
          searchParams.category,
        ),
      ),

    sort:
      normalizeSort(
        getFirstSearchParam(
          searchParams.sort,
        ),
      ),

    page:
      normalizePage(
        getFirstSearchParam(
          searchParams.page,
        ),
      ),
  };
}


/* ==========================================================================
   BASE SCOPE — PRODUITS OPÉRATIONNELS
   --------------------------------------------------------------------------
   ARCHIVED signifie que la donnée est conservée historiquement mais
   retirée du fonctionnement normal.

   Ces produits ne sont donc pas affichés dans Mes produits.

   Cela permet également à une future stratégie de suppression par
   archivage de faire disparaître le produit de cette liste sans
   supprimer son historique.
   ========================================================================== */

function buildBaseStoreProductWhere(
  storeId:
    string,
): Prisma.StoreProductWhereInput {
  return {
    storeId,

    status: {
      not:
        StoreProductStatus.ARCHIVED,
    },

    product: {
      status: {
        not:
          ProductStatus.ARCHIVED,
      },
    },
  };
}


/* ==========================================================================
   FILTRE DE STATUT
   ========================================================================== */

function buildStatusWhere(
  status:
    GestionnaireProductsStatusFilter,
): Prisma.StoreProductWhereInput | null {
  switch (
    status
  ) {
    case "published":
      return {
        product: {
          status:
            ProductStatus.ACTIVE,
        },

        status: {
          in: [
            StoreProductStatus.ACTIVE,
            StoreProductStatus.OUT_OF_STOCK,
          ],
        },
      };


    case "draft":
      return {
        product: {
          status:
            ProductStatus.DRAFT,
        },
      };


    case "inactive":
      return {
        product: {
          status:
            ProductStatus.ACTIVE,
        },

        status:
          StoreProductStatus.HIDDEN,
      };


    case "all":
    default:
      return null;
  }
}


/* ==========================================================================
   WHERE DE LISTE
   ========================================================================== */

function buildProductsListWhere(
  params:
    Readonly<{
      storeId:
        string;

      query:
        GestionnaireProductsQuery;
    }>,
): Prisma.StoreProductWhereInput {
  const {
    storeId,
    query,
  } =
    params;


  const filters:
    Prisma.StoreProductWhereInput[] =
      [
        buildBaseStoreProductWhere(
          storeId,
        ),
      ];


  /* ------------------------------------------------------------------------
     RECHERCHE
     ------------------------------------------------------------------------ */

  if (
    query.q
  ) {
    filters.push({
      product: {
        OR: [
          {
            name: {
              contains:
                query.q,

              mode:
                "insensitive",
            },
          },

          {
            sku: {
              contains:
                query.q,

              mode:
                "insensitive",
            },
          },
        ],
      },
    });
  }


  /* ------------------------------------------------------------------------
     STATUT
     ------------------------------------------------------------------------ */

  const statusWhere =
    buildStatusWhere(
      query.status,
    );


  if (
    statusWhere
  ) {
    filters.push(
      statusWhere,
    );
  }


  /* ------------------------------------------------------------------------
     CATÉGORIE
     ------------------------------------------------------------------------ */

  if (
    query.category
  ) {
    filters.push({
      product: {
        category: {
          slug:
            query.category,
        },
      },
    });
  }


  return {
    AND:
      filters,
  };
}


/* ==========================================================================
   ORDER BY
   ========================================================================== */

function buildProductsOrderBy(
  sort:
    GestionnaireProductsSort,
): Prisma.StoreProductOrderByWithRelationInput[] {
  switch (
    sort
  ) {
    case "oldest":
      return [
        {
          createdAt:
            "asc",
        },

        {
          id:
            "asc",
        },
      ];


    case "name-asc":
      return [
        {
          product: {
            name:
              "asc",
          },
        },

        {
          createdAt:
            "desc",
        },

        {
          id:
            "asc",
        },
      ];


    case "name-desc":
      return [
        {
          product: {
            name:
              "desc",
          },
        },

        {
          createdAt:
            "desc",
        },

        {
          id:
            "asc",
        },
      ];


    case "newest":
    default:
      return [
        {
          createdAt:
            "desc",
        },

        {
          id:
            "desc",
        },
      ];
  }
}


/* ==========================================================================
   STATUT D'AFFICHAGE
   ========================================================================== */

function getProductDisplayStatus(
  params:
    Readonly<{
      productStatus:
        ProductStatus;

      storeProductStatus:
        StoreProductStatus;
    }>,
): GestionnaireProductDisplayStatus {
  if (
    params.productStatus ===
    ProductStatus.DRAFT
  ) {
    return "DRAFT";
  }


  if (
    params.productStatus ===
      ProductStatus.ACTIVE &&
    (
      params.storeProductStatus ===
        StoreProductStatus.ACTIVE ||
      params.storeProductStatus ===
        StoreProductStatus.OUT_OF_STOCK
    )
  ) {
    return "PUBLISHED";
  }


  return "INACTIVE";
}


/* ==========================================================================
   STOCK STATE
   ========================================================================== */

function getProductStockState(
  params:
    Readonly<{
      quantity:
        number;

      lowStockThreshold:
        number;

      storeProductStatus:
        StoreProductStatus;
    }>,
): GestionnaireProductStockState {
  const quantity =
    Math.max(
      0,
      Math.trunc(
        params.quantity,
      ),
    );


  const lowStockThreshold =
    Math.max(
      0,
      Math.trunc(
        params.lowStockThreshold,
      ),
    );


  if (
    quantity <=
      0 ||
    params.storeProductStatus ===
      StoreProductStatus.OUT_OF_STOCK
  ) {
    return "OUT_OF_STOCK";
  }


  if (
    lowStockThreshold >
      0 &&
    quantity <=
      lowStockThreshold
  ) {
    return "LOW_STOCK";
  }


  return "IN_STOCK";
}


/* ==========================================================================
   KPI — TOTAL / PUBLIÉS / BROUILLONS / STOCK FAIBLE
   ========================================================================== */

async function getGestionnaireProductsStats(
  storeId:
    string,
): Promise<GestionnaireProductsStats> {
  const baseWhere =
    buildBaseStoreProductWhere(
      storeId,
    );


  const [
    total,
    published,
    drafts,
    lowStockCandidates,
  ] =
    await Promise.all([
      /* --------------------------------------------------------------------
         TOTAL
         -------------------------------------------------------------------- */

      db.storeProduct.count({
        where:
          baseWhere,
      }),


      /* --------------------------------------------------------------------
         PUBLIÉS
         -------------------------------------------------------------------- */

      db.storeProduct.count({
        where: {
          AND: [
            baseWhere,

            {
              product: {
                status:
                  ProductStatus.ACTIVE,
              },

              status: {
                in: [
                  StoreProductStatus.ACTIVE,
                  StoreProductStatus.OUT_OF_STOCK,
                ],
              },
            },
          ],
        },
      }),


      /* --------------------------------------------------------------------
         BROUILLONS
         -------------------------------------------------------------------- */

      db.storeProduct.count({
        where: {
          AND: [
            baseWhere,

            {
              product: {
                status:
                  ProductStatus.DRAFT,
              },
            },
          ],
        },
      }),


      /* --------------------------------------------------------------------
         CANDIDATS STOCK FAIBLE
         --------------------------------------------------------------------
         La comparaison :
         
         stockQuantity <= lowStockThreshold
         
         dépend de deux colonnes de la même ligne.
         
         Pour rester compatible avec le client Prisma du projet et éviter
         une requête SQL brute spécifique à PostgreSQL, nous récupérons
         uniquement les deux entiers nécessaires sur les produits actifs.
         
         Même avec plusieurs milliers de produits, la quantité de données
         reste très limitée.
         -------------------------------------------------------------------- */

      db.storeProduct.findMany({
        where: {
          AND: [
            baseWhere,

            {
              status:
                StoreProductStatus.ACTIVE,

              product: {
                status:
                  ProductStatus.ACTIVE,
              },

              stockQuantity: {
                gt:
                  0,
              },

              lowStockThreshold: {
                gt:
                  0,
              },
            },
          ],
        },

        select: {
          stockQuantity:
            true,

          lowStockThreshold:
            true,
        },
      }),
    ]);


  const lowStock =
    lowStockCandidates.reduce(
      (
        count,
        item,
      ) => {
        return item.stockQuantity <=
          item.lowStockThreshold
          ? count + 1
          : count;
      },
      0,
    );


  return {
    total,

    published,

    drafts,

    lowStock,
  };
}


/* ==========================================================================
   CATÉGORIES DISPONIBLES POUR CETTE BOUTIQUE
   --------------------------------------------------------------------------
   On retourne uniquement les catégories réellement utilisées par au moins
   un produit opérationnel de la boutique.

   Cela évite d'afficher des dizaines de catégories inutiles dans le filtre.
   ========================================================================== */

async function getGestionnaireProductCategories(
  storeId:
    string,
): Promise<GestionnaireProductCategoryOption[]> {
  const categories =
    await db.productCategory.findMany({
      where: {
        products: {
          some: {
            status: {
              not:
                ProductStatus.ARCHIVED,
            },

            storeProducts: {
              some: {
                storeId,

                status: {
                  not:
                    StoreProductStatus.ARCHIVED,
                },
              },
            },
          },
        },
      },

      select: {
        name:
          true,

        slug:
          true,
      },

      orderBy: {
        name:
          "asc",
      },
    });


  return categories
    .map(
      (
        category,
      ) => {
        return {
          name:
            category.name.trim(),

          slug:
            category.slug.trim(),
        };
      },
    )
    .filter(
      (
        category,
      ) =>
        Boolean(
          category.name &&
          category.slug,
        ),
    );
}


/* ==========================================================================
   NORMALISATION DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    string,
): string {
  return value
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   CHARGEMENT DES PRODUITS PAGINÉS
   ========================================================================== */

async function getPaginatedProducts(
  params:
    Readonly<{
      where:
        Prisma.StoreProductWhereInput;

      orderBy:
        Prisma.StoreProductOrderByWithRelationInput[];

      skip:
        number;

      take:
        number;
    }>,
): Promise<GestionnaireProductListItem[]> {
  const storeProducts =
    await db.storeProduct.findMany({
      where:
        params.where,

      orderBy:
        params.orderBy,

      skip:
        params.skip,

      take:
        params.take,

      select: {
        id:
          true,

        price:
          true,

        currency:
          true,

        stockQuantity:
          true,

        lowStockThreshold:
          true,

        status:
          true,

        createdAt:
          true,

        product: {
          select: {
            id:
              true,

            name:
              true,

            sku:
              true,

            status:
              true,

            category: {
              select: {
                name:
                  true,

                slug:
                  true,
              },
            },

            images: {
              select: {
                url:
                  true,

                altText:
                  true,
              },

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
            },
          },
        },
      },
    });


  return storeProducts.map(
    (
      storeProduct,
    ) => {
      const product =
        storeProduct.product;


      const firstImage =
        product.images[0] ??
        null;


      const quantity =
        Math.max(
          0,
          Math.trunc(
            storeProduct
              .stockQuantity,
          ),
        );


      const lowStockThreshold =
        Math.max(
          0,
          Math.trunc(
            storeProduct
              .lowStockThreshold,
          ),
        );


      return {
        productId:
          product.id,

        storeProductId:
          storeProduct.id,

        name:
          product.name.trim(),

        sku:
          product.sku.trim(),

        image:
          firstImage
            ? {
                url:
                  firstImage.url,

                altText:
                  firstImage
                    .altText,
              }
            : null,

        category:
          product.category
            ? {
                name:
                  product
                    .category
                    .name
                    .trim(),

                slug:
                  product
                    .category
                    .slug
                    .trim(),
              }
            : null,

        pricing: {
          amount:
            storeProduct
              .price
              .toFixed(
                2,
              ),

          currency:
            normalizeCurrency(
              storeProduct
                .currency,
            ),
        },

        inventory: {
          quantity,

          lowStockThreshold,

          state:
            getProductStockState({
              quantity,

              lowStockThreshold,

              storeProductStatus:
                storeProduct
                  .status,
            }),
        },

        status:
          getProductDisplayStatus({
            productStatus:
              product.status,

            storeProductStatus:
              storeProduct
                .status,
          }),

        createdAt:
          storeProduct
            .createdAt,
      };
    },
  );
}


/* ==========================================================================
   SERVICE PRINCIPAL
   ========================================================================== */

/**
 * Charge toutes les données nécessaires à :
 *
 * /gestionnaire/produits
 *
 * SÉCURITÉ :
 *
 * Aucun storeId n'est reçu du navigateur.
 *
 * Le storeId vient uniquement de :
 *
 * requireGestionnairePrivateAccess()
 *
 * Cette fonction constitue l'entrée principale recommandée pour page.tsx.
 */

export async function getGestionnaireProductsListData(
  searchParams:
    GestionnaireProductsSearchParams,
): Promise<GestionnaireProductsListData> {
  /* ------------------------------------------------------------------------
     1. ACCÈS PRIVÉ
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    access.store.id;


  if (
    !storeId
  ) {
    /*
     * Cette situation ne devrait normalement jamais arriver si
     * requireGestionnairePrivateAccess() remplit correctement son contrat.
     *
     * Fail closed.
     */

    throw new Error(
      "GESTIONNAIRE_STORE_REQUIRED",
    );
  }


  /* ------------------------------------------------------------------------
     2. QUERY PARAMS
     ------------------------------------------------------------------------ */

  const normalizedQuery =
    normalizeGestionnaireProductsQuery(
      searchParams,
    );


  /* ------------------------------------------------------------------------
     3. WHERE + ORDER BY
     ------------------------------------------------------------------------ */

  const where =
    buildProductsListWhere({
      storeId,

      query:
        normalizedQuery,
    });


  const orderBy =
    buildProductsOrderBy(
      normalizedQuery.sort,
    );


  /* ------------------------------------------------------------------------
     4. KPI + CATÉGORIES + TOTAL FILTRÉ
     ------------------------------------------------------------------------
     Les KPI représentent toujours la boutique entière.
     
     Ils ne changent donc pas lorsque l'utilisateur tape une recherche.
     ------------------------------------------------------------------------ */

  const [
    stats,
    categories,
    totalItems,
  ] =
    await Promise.all([
      getGestionnaireProductsStats(
        storeId,
      ),

      getGestionnaireProductCategories(
        storeId,
      ),

      db.storeProduct.count({
        where,
      }),
    ]);


  /* ------------------------------------------------------------------------
     5. PAGINATION
     ------------------------------------------------------------------------ */

  const totalPages =
    totalItems ===
      0
      ? 0
      : Math.ceil(
          totalItems /
            GESTIONNAIRE_PRODUCTS_PAGE_SIZE,
        );


  /*
   * Une URL manuellement modifiée avec page=999999 ne doit pas
   * provoquer une erreur.
   *
   * Si des résultats existent, on ramène la page à la dernière page
   * réellement disponible.
   */

  const currentPage =
    totalPages ===
      0
      ? 1
      : Math.min(
          normalizedQuery.page,
          totalPages,
        );


  const skip =
    (
      currentPage -
      1
    ) *
    GESTIONNAIRE_PRODUCTS_PAGE_SIZE;


  /* ------------------------------------------------------------------------
     6. PRODUITS DE LA PAGE
     ------------------------------------------------------------------------ */

  const products =
    totalItems ===
      0
      ? []
      : await getPaginatedProducts({
          where,

          orderBy,

          skip,

          take:
            GESTIONNAIRE_PRODUCTS_PAGE_SIZE,
        });


  /* ------------------------------------------------------------------------
     7. BORNES D'AFFICHAGE
     ------------------------------------------------------------------------ */

  const from =
    totalItems ===
      0
      ? 0
      : skip +
        1;


  const to =
    totalItems ===
      0
      ? 0
      : skip +
        products.length;


  /* ------------------------------------------------------------------------
     8. QUERY RETOURNÉE
     ------------------------------------------------------------------------
     On retourne la page réellement utilisée afin que l'interface reste
     cohérente même lorsqu'une page trop élevée a été saisie manuellement.
     ------------------------------------------------------------------------ */

  const query:
    GestionnaireProductsQuery = {
    ...normalizedQuery,

    page:
      currentPage,
  };


  /* ------------------------------------------------------------------------
     9. RÉSULTAT
     ------------------------------------------------------------------------ */

  return {
    stats,

    categories,

    products,

    query,

    pagination: {
      page:
        currentPage,

      pageSize:
        GESTIONNAIRE_PRODUCTS_PAGE_SIZE,

      totalItems,

      totalPages,

      from,

      to,

      hasPreviousPage:
        currentPage >
        1,

      hasNextPage:
        totalPages >
          0 &&
        currentPage <
          totalPages,
    },
  };
}