import "server-only";

import type {
  Prisma,
  ShipmentStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  MANAGER_SHIPMENT_FILTER_VALUE_MAX_LENGTH,
  MANAGER_SHIPMENT_ID_MAX_LENGTH,
  MANAGER_SHIPMENT_SEARCH_MAX_LENGTH,
  MANAGER_SHIPMENTS_PAGE_SIZE,
  createEmptyManagerShipmentsFilterOptions,
  createEmptyManagerShipmentsKpis,
  createEmptyManagerShipmentsPagination,
  getManagerShipmentAuthorizedActions,
  isManagerShipmentStatus,
  isManagerShipmentStatusFilter,
  type GetManagerShipmentsPageDataInput,
  type ManagerShipmentDetail,
  type ManagerShipmentListItem,
  type ManagerShipmentMoney,
  type ManagerShipmentStatus,
  type ManagerShipmentsFilterOptions,
  type ManagerShipmentsFilters,
  type ManagerShipmentsKpis,
  type ManagerShipmentsPageData,
  type ManagerShipmentsPagination,
} from "./shipment-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/livraisons/shipment-query.ts
 *
 * RESPONSABILITÉS :
 *
 * - vérifier l'accès Gestionnaire côté serveur ;
 * - récupérer le storeId depuis la session sécurisée ;
 * - charger les vraies livraisons Shipment ;
 * - empêcher toute fuite entre boutiques ;
 * - normaliser les filtres ;
 * - rechercher livraison / commande / cliente / téléphone ;
 * - filtrer par période ;
 * - filtrer par statut réel ShipmentStatus ;
 * - filtrer par ville réelle ;
 * - filtrer par transporteur réel ;
 * - calculer les KPI ;
 * - appliquer la pagination serveur ;
 * - récupérer le détail d'une livraison autorisée ;
 * - sérialiser les Decimal et Date pour les composants React.
 *
 * IMPORTANT :
 *
 * - aucun storeId n'est accepté depuis le navigateur ;
 * - aucun managerId n'est accepté depuis le navigateur ;
 * - aucune fausse donnée ;
 * - aucun faux transporteur ;
 * - aucun faux tracking ;
 * - aucun faux historique ;
 * - aucun statut inventé ;
 * - aucune mutation ;
 * - aucune notification ;
 * - aucune logique de paiement modifiée ici.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES INTERNES
   ========================================================================== */

const MAX_PAGE =
  1_000_000;


const MAX_SEARCH_TOKENS =
  8;


/* ==========================================================================
   INPUT DÉTAIL
   ========================================================================== */

export interface GetManagerShipmentDetailInput {
  readonly shipmentId:
    string;
}


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeSingleLineText(
  value:
    string | null | undefined,

  maxLength:
    number,
): string {
  if (
    typeof value !==
      "string"
  ) {
    return "";
  }


  return value
    .normalize(
      "NFKC",
    )
    .replace(
      /[\u0000-\u001F\u007F]/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim()
    .slice(
      0,
      maxLength,
    );
}


/* ==========================================================================
   TEXTE OPTIONNEL DE SORTIE
   ========================================================================== */

function normalizeOptionalOutputText(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized ||
    null;
}


/* ==========================================================================
   RECHERCHE
   ========================================================================== */

function normalizeSearchQuery(
  value:
    string | null | undefined,
): string {
  return normalizeSingleLineText(
    value,
    MANAGER_SHIPMENT_SEARCH_MAX_LENGTH,
  );
}


function getSearchTokens(
  value:
    string,
): readonly string[] {
  if (
    !value
  ) {
    return [];
  }


  return value
    .split(
      /\s+/,
    )
    .map(
      (
        token,
      ) =>
        token.trim(),
    )
    .filter(
      Boolean,
    )
    .slice(
      0,
      MAX_SEARCH_TOKENS,
    );
}


/* ==========================================================================
   FILTRES TEXTE
   ========================================================================== */

function normalizeFilterValue(
  value:
    string | null | undefined,
): string {
  return normalizeSingleLineText(
    value,
    MANAGER_SHIPMENT_FILTER_VALUE_MAX_LENGTH,
  );
}


/* ==========================================================================
   DATE YYYY-MM-DD
   ========================================================================== */

function normalizeDateFilter(
  value:
    string | null | undefined,
): string {
  const normalized =
    normalizeSingleLineText(
      value,
      10,
    );


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    return "";
  }


  const date =
    new Date(
      `${normalized}T00:00:00.000Z`,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }


  if (
    date
      .toISOString()
      .slice(
        0,
        10,
      ) !==
      normalized
  ) {
    return "";
  }


  return normalized;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

function normalizePage(
  value:
    number | string | null | undefined,
): number {
  if (
    typeof value ===
      "number"
  ) {
    if (
      Number.isInteger(
        value,
      ) &&
      value >
        0
    ) {
      return Math.min(
        value,
        MAX_PAGE,
      );
    }


    return 1;
  }


  if (
    typeof value !==
      "string"
  ) {
    return 1;
  }


  const normalized =
    value.trim();


  if (
    !/^\d+$/.test(
      normalized,
    )
  ) {
    return 1;
  }


  const parsed =
    Number(
      normalized,
    );


  if (
    !Number.isSafeInteger(
      parsed,
    ) ||
    parsed <=
      0
  ) {
    return 1;
  }


  return Math.min(
    parsed,
    MAX_PAGE,
  );
}


/* ==========================================================================
   STATUT
   ========================================================================== */

function normalizeShipmentStatusFilter(
  value:
    string | null | undefined,
): ManagerShipmentsFilters["status"] {
  if (
    typeof value !==
      "string"
  ) {
    return "all";
  }


  const normalized =
    value
      .trim()
      .toUpperCase();


  if (
    normalized ===
      "ALL"
  ) {
    return "all";
  }


  if (
    isManagerShipmentStatusFilter(
      normalized,
    )
  ) {
    return normalized;
  }


  return "all";
}


/* ==========================================================================
   FILTRES COMPLETS
   ========================================================================== */

function normalizeManagerShipmentsFilters(
  input:
    GetManagerShipmentsPageDataInput,
): ManagerShipmentsFilters {
  return {
    q:
      normalizeSearchQuery(
        input.q,
      ),

    dateFrom:
      normalizeDateFilter(
        input.dateFrom,
      ),

    dateTo:
      normalizeDateFilter(
        input.dateTo,
      ),

    status:
      normalizeShipmentStatusFilter(
        input.status,
      ),

    city:
      normalizeFilterValue(
        input.city,
      ),

    carrier:
      normalizeFilterValue(
        input.carrier,
      ),

    page:
      normalizePage(
        input.page,
      ),
  };
}


/* ==========================================================================
   DATE BOUNDS
   ========================================================================== */

/**
 * Shipment ne possède pas actuellement de date "scheduledAt".
 *
 * Le filtre de période utilise donc createdAt :
 *
 * la date réelle de création de la livraison.
 *
 * Aucun champ inexistant n'est simulé.
 *
 * Les dates YYYY-MM-DD sont interprétées en UTC car le modèle Store actuel
 * ne possède pas de timezone métier dédiée.
 */

function createStartOfDayUtc(
  value:
    string,
): Date {
  return new Date(
    `${value}T00:00:00.000Z`,
  );
}


function createEndOfDayUtc(
  value:
    string,
): Date {
  return new Date(
    `${value}T23:59:59.999Z`,
  );
}


/* ==========================================================================
   OWNERSHIP
   ========================================================================== */

/**
 * On vérifie à la fois :
 *
 * Shipment.storeId
 *
 * ET :
 *
 * Order.storeId
 *
 * Cela protège également contre une éventuelle donnée incohérente en base.
 */

function createShipmentOwnershipWhere(
  storeId:
    string,
): Prisma.ShipmentWhereInput {
  return {
    storeId,

    order: {
      is: {
        storeId,
      },
    },
  };
}


/* ==========================================================================
   SEARCH WHERE
   ========================================================================== */

function createShipmentSearchWhere(
  search:
    string,
): Prisma.ShipmentWhereInput | null {
  const tokens =
    getSearchTokens(
      search,
    );


  if (
    tokens.length ===
      0
  ) {
    return null;
  }


  const tokenConditions:
    Prisma.ShipmentWhereInput[] =
      tokens.map(
        (
          token,
        ) => ({
          OR: [
            {
              shipmentNumber: {
                contains:
                  token,

                mode:
                  "insensitive",
              },
            },

            {
              recipientName: {
                contains:
                  token,

                mode:
                  "insensitive",
              },
            },

            {
              phone: {
                contains:
                  token,

                mode:
                  "insensitive",
              },
            },

            {
              order: {
                is: {
                  OR: [
                    {
                      orderNumber: {
                        contains:
                          token,

                        mode:
                          "insensitive",
                      },
                    },

                    {
                      customerFirstName: {
                        contains:
                          token,

                        mode:
                          "insensitive",
                      },
                    },

                    {
                      customerLastName: {
                        contains:
                          token,

                        mode:
                          "insensitive",
                      },
                    },

                    {
                      customerPhone: {
                        contains:
                          token,

                        mode:
                          "insensitive",
                      },
                    },
                  ],
                },
              },
            },
          ],
        }),
      );


  return {
    AND:
      tokenConditions,
  };
}


/* ==========================================================================
   WHERE COMPLET
   ========================================================================== */

function createManagerShipmentsWhere(
  storeId:
    string,

  filters:
    ManagerShipmentsFilters,
): Prisma.ShipmentWhereInput {
  const conditions:
    Prisma.ShipmentWhereInput[] = [
      createShipmentOwnershipWhere(
        storeId,
      ),
  ];


  /* ------------------------------------------------------------------------
     SEARCH
     ------------------------------------------------------------------------ */

  const searchWhere =
    createShipmentSearchWhere(
      filters.q,
    );


  if (
    searchWhere
  ) {
    conditions.push(
      searchWhere,
    );
  }


  /* ------------------------------------------------------------------------
     STATUT
     ------------------------------------------------------------------------ */

  if (
    filters.status !==
      "all"
  ) {
    conditions.push({
      status:
        filters.status,
    });
  }


  /* ------------------------------------------------------------------------
     VILLE
     ------------------------------------------------------------------------ */

  if (
    filters.city
  ) {
    conditions.push({
      city: {
        equals:
          filters.city,

        mode:
          "insensitive",
      },
    });
  }


  /* ------------------------------------------------------------------------
     TRANSPORTEUR
     ------------------------------------------------------------------------ */

  if (
    filters.carrier
  ) {
    conditions.push({
      carrier: {
        equals:
          filters.carrier,

        mode:
          "insensitive",
      },
    });
  }


  /* ------------------------------------------------------------------------
     PÉRIODE
     ------------------------------------------------------------------------ */

  if (
    filters.dateFrom ||
    filters.dateTo
  ) {
    const dateFilter: {
      gte?:
        Date;

      lte?:
        Date;
    } = {};


    if (
      filters.dateFrom
    ) {
      dateFilter.gte =
        createStartOfDayUtc(
          filters.dateFrom,
        );
    }


    if (
      filters.dateTo
    ) {
      dateFilter.lte =
        createEndOfDayUtc(
          filters.dateTo,
        );
    }


    conditions.push({
      createdAt:
        dateFilter,
    });
  }


  return {
    AND:
      conditions,
  };
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function serializeDecimal(
  value:
    unknown,
): string {
  if (
    value ===
      null ||
    value ===
      undefined
  ) {
    return "0";
  }


  if (
    typeof value ===
      "string"
  ) {
    return value;
  }


  if (
    typeof value ===
      "number" ||
    typeof value ===
      "bigint"
  ) {
    return String(
      value,
    );
  }


  if (
    typeof value ===
      "object" &&
    "toString" in
      value &&
    typeof value.toString ===
      "function"
  ) {
    return value.toString();
  }


  return String(
    value,
  );
}


function createMoney(
  amount:
    unknown,

  currency:
    string,
): ManagerShipmentMoney {
  return {
    amount:
      serializeDecimal(
        amount,
      ),

    currency:
      currency.trim(),
  };
}


/* ==========================================================================
   DATE SERIALIZATION
   ========================================================================== */

function serializeDate(
  value:
    Date | null | undefined,
): string | null {
  if (
    !value
  ) {
    return null;
  }


  return value.toISOString();
}


function serializeRequiredDate(
  value:
    Date,
): string {
  return value.toISOString();
}


/* ==========================================================================
   CUSTOMER NAME
   ========================================================================== */

function createCustomerFullName(
  firstName:
    string,

  lastName:
    string,

  fallback:
    string,
): string {
  const fullName =
    [
      firstName,
      lastName,
    ]
      .map(
        (
          value,
        ) =>
          value.trim(),
      )
      .filter(
        Boolean,
      )
      .join(
        " ",
      );


  if (
    fullName
  ) {
    return fullName;
  }


  return fallback.trim() ||
    "—";
}


/* ==========================================================================
   STATUT SÛR
   ========================================================================== */

function normalizeShipmentStatus(
  status:
    ShipmentStatus,
): ManagerShipmentStatus {
  if (
    !isManagerShipmentStatus(
      status,
    )
  ) {
    throw new Error(
      "[Cosmetics Empire] Statut de livraison non pris en charge.",
    );
  }


  return status;
}


/* ==========================================================================
   KPI
   ========================================================================== */

function buildManagerShipmentsKpis(
  rows:
    readonly {
      readonly status:
        ShipmentStatus;

      readonly _count: {
        readonly _all:
          number;
      };
    }[],
): ManagerShipmentsKpis {
  const kpis =
    createEmptyManagerShipmentsKpis();


  let totalShipments =
    0;

  let preparingShipments =
    0;

  let inProgressShipments =
    0;

  let deliveredShipments =
    0;

  let failedOrCancelledShipments =
    0;


  for (
    const row of rows
  ) {
    const status =
      normalizeShipmentStatus(
        row.status,
      );


    const count =
      row._count._all;


    totalShipments +=
      count;


    switch (
      status
    ) {
      case "PENDING":
      case "PREPARING":
        preparingShipments +=
          count;

        break;


      case "SHIPPED":
      case "IN_TRANSIT":
        inProgressShipments +=
          count;

        break;


      case "DELIVERED":
        deliveredShipments +=
          count;

        break;


      case "FAILED":
      case "CANCELLED":
        failedOrCancelledShipments +=
          count;

        break;


      case "RETURNED":
        /**
         * RETURNED est volontairement conservé comme statut distinct.
         *
         * Il n'est pas artificiellement compté comme CANCELLED ou FAILED.
         */
        break;
    }
  }


  return {
    ...kpis,

    totalShipments,

    preparingShipments,

    inProgressShipments,

    deliveredShipments,

    failedOrCancelledShipments,
  };
}


/* ==========================================================================
   OPTIONS — NORMALISATION
   ========================================================================== */

function normalizeUniqueOptions(
  values:
    readonly (
      string | null
    )[],
): readonly string[] {
  const unique =
    new Map<
      string,
      string
    >();


  for (
    const value of values
  ) {
    if (
      typeof value !==
        "string"
    ) {
      continue;
    }


    const normalized =
      value
        .trim()
        .replace(
          /\s+/g,
          " ",
        );


    if (
      !normalized
    ) {
      continue;
    }


    const key =
      normalized
        .toLocaleLowerCase(
          "fr",
        );


    if (
      !unique.has(
        key,
      )
    ) {
      unique.set(
        key,
        normalized,
      );
    }
  }


  return Array
    .from(
      unique.values(),
    )
    .sort(
      (
        first,
        second,
      ) =>
        first.localeCompare(
          second,
          "fr",
          {
            sensitivity:
              "base",
          },
        ),
    );
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function buildPagination({
  requestedPage,
  totalItems,
  itemCount,
}: {
  readonly requestedPage:
    number;

  readonly totalItems:
    number;

  readonly itemCount:
    number;
}): ManagerShipmentsPagination {
  if (
    totalItems <=
      0
  ) {
    return createEmptyManagerShipmentsPagination(
      1,
    );
  }


  const totalPages =
    Math.ceil(
      totalItems /
        MANAGER_SHIPMENTS_PAGE_SIZE,
    );


  const page =
    Math.min(
      Math.max(
        1,
        requestedPage,
      ),
      totalPages,
    );


  const startItem =
    (
      page -
      1
    ) *
      MANAGER_SHIPMENTS_PAGE_SIZE +
    1;


  const endItem =
    Math.min(
      startItem +
        itemCount -
        1,
      totalItems,
    );


  return {
    page,

    pageSize:
      MANAGER_SHIPMENTS_PAGE_SIZE,

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
   GET LIST PAGE DATA
   ========================================================================== */

export async function getManagerShipmentsPageData(
  input:
    GetManagerShipmentsPageDataInput = {},
): Promise<ManagerShipmentsPageData> {
  /* ------------------------------------------------------------------------
     ACCESS
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    access.store.id;


  /**
   * Diagnostic serveur DEV uniquement.
   *
   * Objectif :
   * vérifier ce que le runtime Next.js voit réellement pour la boutique
   * du Gestionnaire connecté, sans modifier les données ni la logique métier.
   *
   * Ce bloc n'est jamais exécuté en production.
   */
  if (
    process.env.NODE_ENV !==
      "production"
  ) {
    const [
      shipmentCountByStore,
      shipmentCountByOwnership,
    ] =
      await Promise.all([
        db.shipment.count({
          where: {
            storeId,
          },
        }),

        db.shipment.count({
          where:
            createShipmentOwnershipWhere(
              storeId,
            ),
        }),
      ]);


    console.info(
      "[Cosmetics Empire][Livraisons] Diagnostic lecture serveur",
      {
        storeId,
        shipmentCountByStore,
        shipmentCountByOwnership,
      },
    );
  }


  /* ------------------------------------------------------------------------
     FILTERS
     ------------------------------------------------------------------------ */

  const normalizedFilters =
    normalizeManagerShipmentsFilters(
      input,
    );


  const where =
    createManagerShipmentsWhere(
      storeId,
      normalizedFilters,
    );


  const ownershipWhere =
    createShipmentOwnershipWhere(
      storeId,
    );


  /* ------------------------------------------------------------------------
     GLOBAL DATA
     ------------------------------------------------------------------------ */

  const [
    totalItems,
    statusGroups,
    cityRows,
    carrierRows,
  ] =
    await Promise.all([
      db.shipment.count({
        where,
      }),


      db.shipment.groupBy({
        by: [
          "status",
        ],

        where:
          ownershipWhere,

        _count: {
          _all:
            true,
        },
      }),


      db.shipment.findMany({
        where:
          ownershipWhere,

        select: {
          city:
            true,
        },

        distinct: [
          "city",
        ],
      }),


      db.shipment.findMany({
        where: {
          AND: [
            ownershipWhere,

            {
              carrier: {
                not:
                  null,
              },
            },
          ],
        },

        select: {
          carrier:
            true,
        },

        distinct: [
          "carrier",
        ],
      }),
    ]);


  if (
    process.env.NODE_ENV !==
      "production"
  ) {
    console.info(
      "[Cosmetics Empire][Livraisons] Diagnostic filtres",
      {
        storeId,
        normalizedFilters,
        totalItems,
        statusGroups,
      },
    );
  }


  /* ------------------------------------------------------------------------
     PAGE EFFECTIVE
     ------------------------------------------------------------------------ */

  const totalPages =
    totalItems >
      0
      ? Math.ceil(
          totalItems /
            MANAGER_SHIPMENTS_PAGE_SIZE,
        )
      : 0;


  const effectivePage =
    totalPages >
      0
      ? Math.min(
          normalizedFilters.page,
          totalPages,
        )
      : 1;


  const skip =
    (
      effectivePage -
      1
    ) *
    MANAGER_SHIPMENTS_PAGE_SIZE;


  /* ------------------------------------------------------------------------
     SHIPMENTS
     ------------------------------------------------------------------------ */

  const shipmentRows =
    totalItems >
      0
      ? await db.shipment.findMany({
          where,

          orderBy: [
            {
              createdAt:
                "desc",
            },

            {
              id:
                "desc",
            },
          ],

          skip,

          take:
            MANAGER_SHIPMENTS_PAGE_SIZE,

          select: {
            id:
              true,

            shipmentNumber:
              true,

            status:
              true,

            carrier:
              true,

            city:
              true,

            address:
              true,

            shippedAt:
              true,

            deliveredAt:
              true,

            createdAt:
              true,

            phone:
              true,

            recipientName:
              true,

            order: {
              select: {
                id:
                  true,

                orderNumber:
                  true,

                customerFirstName:
                  true,

                customerLastName:
                  true,

                customerPhone:
                  true,

                items: {
                  orderBy: {
                    createdAt:
                      "asc",
                  },

                  select: {
                    id:
                      true,

                    productName:
                      true,

                    sku:
                      true,

                    quantity:
                      true,
                  },
                },
              },
            },
          },
        })
      : [];


  /* ------------------------------------------------------------------------
     SERIALIZATION
     ------------------------------------------------------------------------ */

  const shipments:
    ManagerShipmentListItem[] =
      shipmentRows.map(
        (
          shipment,
        ) => {
          const status =
            normalizeShipmentStatus(
              shipment.status,
            );


          const customerName =
            createCustomerFullName(
              shipment
                .order
                .customerFirstName,

              shipment
                .order
                .customerLastName,

              shipment
                .recipientName,
            );


          const customerPhone =
            normalizeOptionalOutputText(
              shipment
                .order
                .customerPhone,
            ) ??
            normalizeOptionalOutputText(
              shipment.phone,
            );


          const itemCount =
            shipment
              .order
              .items
              .reduce(
                (
                  total,
                  item,
                ) =>
                  total +
                  item.quantity,
                0,
              );


          return {
            id:
              shipment.id,

            shipmentNumber:
              shipment.shipmentNumber,

            status,

            customerName,

            customerPhone,

            orderId:
              shipment
                .order
                .id,

            orderNumber:
              shipment
                .order
                .orderNumber,

            items:
              shipment
                .order
                .items
                .map(
                  (
                    item,
                  ) => ({
                    id:
                      item.id,

                    productName:
                      item.productName,

                    sku:
                      normalizeOptionalOutputText(
                        item.sku,
                      ),

                    quantity:
                      item.quantity,
                  }),
                ),

            itemCount,

            city:
              shipment.city,

            address:
              shipment.address,

            carrier:
              normalizeOptionalOutputText(
                shipment.carrier,
              ),

            shippedAt:
              serializeDate(
                shipment.shippedAt,
              ),

            deliveredAt:
              serializeDate(
                shipment.deliveredAt,
              ),

            createdAt:
              serializeRequiredDate(
                shipment.createdAt,
              ),
          };
        },
      );


  /* ------------------------------------------------------------------------
     FILTER OPTIONS
     ------------------------------------------------------------------------ */

  const filterOptions:
    ManagerShipmentsFilterOptions = {
      ...createEmptyManagerShipmentsFilterOptions(),

      cities:
        normalizeUniqueOptions(
          cityRows.map(
            (
              row,
            ) =>
              row.city,
          ),
        ),

      carriers:
        normalizeUniqueOptions(
          carrierRows.map(
            (
              row,
            ) =>
              row.carrier,
          ),
        ),
    };


  /* ------------------------------------------------------------------------
     PAGINATION
     ------------------------------------------------------------------------ */

  const pagination =
    buildPagination({
      requestedPage:
        effectivePage,

      totalItems,

      itemCount:
        shipments.length,
    });


  /* ------------------------------------------------------------------------
     KPI
     ------------------------------------------------------------------------ */

  const kpis =
    buildManagerShipmentsKpis(
      statusGroups,
    );


  /* ------------------------------------------------------------------------
     RESULT
     ------------------------------------------------------------------------ */

  return {
    filters: {
      ...normalizedFilters,

      page:
        pagination.page,
    },

    kpis,

    filterOptions,

    shipments,

    pagination,
  };
}


/* ==========================================================================
   SHIPMENT ID
   ========================================================================== */

function normalizeShipmentId(
  value:
    string,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      MANAGER_SHIPMENT_ID_MAX_LENGTH
  ) {
    return null;
  }


  if (
    /[\u0000-\u001F\u007F]/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   GET SHIPMENT DETAIL
   ========================================================================== */

export async function getManagerShipmentDetail({
  shipmentId,
}: GetManagerShipmentDetailInput): Promise<ManagerShipmentDetail | null> {
  /* ------------------------------------------------------------------------
     ACCESS
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    access.store.id;


  /* ------------------------------------------------------------------------
     ID
     ------------------------------------------------------------------------ */

  const normalizedShipmentId =
    normalizeShipmentId(
      shipmentId,
    );


  if (
    !normalizedShipmentId
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     QUERY
     ------------------------------------------------------------------------ */

  const shipment =
    await db.shipment.findFirst({
      where: {
        id:
          normalizedShipmentId,

        storeId,

        order: {
          is: {
            storeId,
          },
        },
      },

      select: {
        id:
          true,

        shipmentNumber:
          true,

        status:
          true,

        carrier:
          true,

        trackingNumber:
          true,

        trackingUrl:
          true,

        recipientName:
          true,

        phone:
          true,

        country:
          true,

        city:
          true,

        address:
          true,

        postalCode:
          true,

        shippingCost:
          true,

        currency:
          true,

        shippedAt:
          true,

        deliveredAt:
          true,

        createdAt:
          true,

        updatedAt:
          true,

        order: {
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

            customerEmail:
              true,

            customerPhone:
              true,

            status:
              true,

            currency:
              true,

            totalAmount:
              true,

            confirmedAt:
              true,

            cancelledAt:
              true,

            deliveredAt:
              true,

            createdAt:
              true,

            items: {
              orderBy: {
                createdAt:
                  "asc",
              },

              select: {
                id:
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
            },

            payments: {
              where: {
                storeId,
              },

              orderBy: {
                createdAt:
                  "desc",
              },

              select: {
                id:
                  true,

                paymentReference:
                  true,

                method:
                  true,

                status:
                  true,

                provider:
                  true,

                providerReference:
                  true,

                currency:
                  true,

                amount:
                  true,

                paidAt:
                  true,

                createdAt:
                  true,
              },
            },
          },
        },
      },
    });


  /* ------------------------------------------------------------------------
     NOT FOUND / NOT AUTHORIZED
     ------------------------------------------------------------------------ */

  if (
    !shipment
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     STATUS
     ------------------------------------------------------------------------ */

  const status =
    normalizeShipmentStatus(
      shipment.status,
    );


  /* ------------------------------------------------------------------------
     CUSTOMER
     ------------------------------------------------------------------------ */

  const customerFullName =
    createCustomerFullName(
      shipment
        .order
        .customerFirstName,

      shipment
        .order
        .customerLastName,

      shipment
        .recipientName,
    );


  const customerPhone =
    normalizeOptionalOutputText(
      shipment
        .order
        .customerPhone,
    ) ??
    normalizeOptionalOutputText(
      shipment.phone,
    );


  /* ------------------------------------------------------------------------
     RESULT
     ------------------------------------------------------------------------ */

  return {
    shipment: {
      id:
        shipment.id,

      shipmentNumber:
        shipment.shipmentNumber,

      status,

      carrier:
        normalizeOptionalOutputText(
          shipment.carrier,
        ),

      trackingNumber:
        normalizeOptionalOutputText(
          shipment.trackingNumber,
        ),

      trackingUrl:
        normalizeOptionalOutputText(
          shipment.trackingUrl,
        ),

      shippingCost:
        createMoney(
          shipment.shippingCost,
          shipment.currency,
        ),

      shippedAt:
        serializeDate(
          shipment.shippedAt,
        ),

      deliveredAt:
        serializeDate(
          shipment.deliveredAt,
        ),

      createdAt:
        serializeRequiredDate(
          shipment.createdAt,
        ),

      updatedAt:
        serializeRequiredDate(
          shipment.updatedAt,
        ),
    },


    customer: {
      customerId:
        shipment
          .order
          .customerId,

      firstName:
        shipment
          .order
          .customerFirstName,

      lastName:
        shipment
          .order
          .customerLastName,

      fullName:
        customerFullName,

      email:
        normalizeOptionalOutputText(
          shipment
            .order
            .customerEmail,
        ),

      phone:
        customerPhone,
    },


    address: {
      recipientName:
        shipment.recipientName,

      phone:
        normalizeOptionalOutputText(
          shipment.phone,
        ),

      country:
        shipment.country,

      city:
        shipment.city,

      address:
        shipment.address,

      postalCode:
        normalizeOptionalOutputText(
          shipment.postalCode,
        ),
    },


    order: {
      id:
        shipment
          .order
          .id,

      orderNumber:
        shipment
          .order
          .orderNumber,

      status:
        shipment
          .order
          .status,

      total:
        createMoney(
          shipment
            .order
            .totalAmount,

          shipment
            .order
            .currency,
        ),

      createdAt:
        serializeRequiredDate(
          shipment
            .order
            .createdAt,
        ),

      confirmedAt:
        serializeDate(
          shipment
            .order
            .confirmedAt,
        ),

      cancelledAt:
        serializeDate(
          shipment
            .order
            .cancelledAt,
        ),

      deliveredAt:
        serializeDate(
          shipment
            .order
            .deliveredAt,
        ),

      payments:
        shipment
          .order
          .payments
          .map(
            (
              payment,
            ) => ({
              id:
                payment.id,

              paymentReference:
                payment
                  .paymentReference,

              method:
                payment.method,

              status:
                payment.status,

              provider:
                normalizeOptionalOutputText(
                  payment.provider,
                ),

              providerReference:
                normalizeOptionalOutputText(
                  payment
                    .providerReference,
                ),

              amount:
                createMoney(
                  payment.amount,
                  payment.currency,
                ),

              paidAt:
                serializeDate(
                  payment.paidAt,
                ),

              createdAt:
                serializeRequiredDate(
                  payment.createdAt,
                ),
            }),
          ),
    },


    items:
      shipment
        .order
        .items
        .map(
          (
            item,
          ) => ({
            id:
              item.id,

            storeProductId:
              item.storeProductId,

            productName:
              item.productName,

            sku:
              normalizeOptionalOutputText(
                item.sku,
              ),

            quantity:
              item.quantity,

            unitPrice:
              createMoney(
                item.unitPrice,
                shipment
                  .order
                  .currency,
              ),

            totalPrice:
              createMoney(
                item.totalPrice,
                shipment
                  .order
                  .currency,
              ),
          }),
        ),


    authorizedActions:
      getManagerShipmentAuthorizedActions(
        status,
      ),
  };
}