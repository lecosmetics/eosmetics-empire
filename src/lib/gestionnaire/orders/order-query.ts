import "server-only";

import {
  OrderStatus,
  PaymentStatus,
  Prisma,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  DEFAULT_MANAGER_ORDERS_FILTERS,
  MANAGER_ORDERS_PAGE_SIZE,
  getManagerOrdersTabStatuses,
  isManagerOrderPaymentMethodFilter,
  isManagerOrderStatusFilter,
  isManagerOrdersTab,
  type GetManagerOrderDetailInput,
  type GetManagerOrdersPageDataInput,
  type ManagerOrderDetail,
  type ManagerOrderDetailItem,
  type ManagerOrderDetailPayment,
  type ManagerOrderDetailShipment,
  type ManagerOrderListItem,
  type ManagerOrderPaymentSummary,
  type ManagerOrderProductImage,
  type ManagerOrderProductPreview,
  type ManagerOrdersFilters,
  type ManagerOrdersKpis,
  type ManagerOrdersPageData,
  type ManagerOrdersPagination,
  type ManagerOrdersTabCounts,
  type ManagerOrderShipmentSummary,
  type ManagerOrderRevenueByCurrency,
} from "./order-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/orders/order-query.ts
 *
 * RÔLE :
 *
 * Couche serveur centrale de :
 *
 * - /gestionnaire/commandes
 * - /gestionnaire/commandes/[orderId]
 *
 * RESPONSABILITÉS :
 *
 * - authentifier le Gestionnaire ;
 * - déterminer sa boutique depuis la session ;
 * - ne jamais accepter storeId depuis le navigateur ;
 * - normaliser les filtres ;
 * - filtrer les commandes ;
 * - calculer les KPI ;
 * - calculer les compteurs des onglets ;
 * - charger les vraies villes ;
 * - charger la page de commandes ;
 * - paginer côté serveur ;
 * - charger le détail d'une commande ;
 * - empêcher un Gestionnaire de lire une commande d'une autre boutique.
 *
 * IMPORTANT :
 *
 * Aucun composant client ne transmet :
 *
 * - storeId ;
 * - managerId.
 *
 * Ces informations proviennent uniquement de :
 *
 * requireGestionnairePrivateAccess()
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const MAX_SEARCH_LENGTH =
  180;


const MAX_CITY_LENGTH =
  160;


const MAX_IDENTIFIER_LENGTH =
  191;


const PRODUCT_PREVIEW_LIMIT =
  3;


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

interface OrderDateRange {
  readonly gte?:
    Date;

  readonly lt?:
    Date;
}


/* ==========================================================================
   NORMALISATION TEXTE
   ========================================================================== */

function normalizeText(
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
   TEXTE NULLABLE
   ========================================================================== */

function normalizeNullableText(
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
   DEVISE
   ========================================================================== */

/**
 * On ne remplace jamais silencieusement une devise manquante par XAF/XOF.
 *
 * Le schéma exige normalement une devise.
 * Une valeur vide indique donc un problème de données.
 */

function normalizeCurrency(
  value:
    string,
): string {
  const currency =
    value
      .trim()
      .toUpperCase();


  if (
    !currency
  ) {
    throw new Error(
      "Devise de commande invalide.",
    );
  }


  return currency;
}


/* ==========================================================================
   DECIMAL
   ========================================================================== */

function decimalToString(
  value:
    Prisma.Decimal,
): string {
  return value.toFixed(
    2,
  );
}


/* ==========================================================================
   DATE ISO YYYY-MM-DD
   ========================================================================== */

function normalizeDateInput(
  value:
    string | null | undefined,
): string {
  if (
    typeof value !==
      "string"
  ) {
    return "";
  }


  const normalized =
    value.trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    return "";
  }


  const [
    yearText,
    monthText,
    dayText,
  ] =
    normalized.split(
      "-",
    );


  const year =
    Number(
      yearText,
    );


  const month =
    Number(
      monthText,
    );


  const day =
    Number(
      dayText,
    );


  if (
    !Number.isInteger(
      year,
    ) ||
    !Number.isInteger(
      month,
    ) ||
    !Number.isInteger(
      day,
    )
  ) {
    return "";
  }


  const date =
    new Date(
      Date.UTC(
        year,
        month -
          1,
        day,
      ),
    );


  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month -
        1 ||
    date.getUTCDate() !==
      day
  ) {
    return "";
  }


  return normalized;
}


/* ==========================================================================
   DATE -> UTC
   ========================================================================== */

/**
 * Store ne possède actuellement pas de champ timezone.
 *
 * On utilise donc une interprétation UTC déterministe des dates de filtre
 * au lieu d'inventer un fuseau horaire à partir de la ville.
 */

function parseDateStartUtc(
  value:
    string,
): Date | null {
  const normalized =
    normalizeDateInput(
      value,
    );


  if (
    !normalized
  ) {
    return null;
  }


  return new Date(
    `${normalized}T00:00:00.000Z`,
  );
}


/* ==========================================================================
   JOUR SUIVANT
   ========================================================================== */

function addUtcDay(
  date:
    Date,
): Date {
  const next =
    new Date(
      date.getTime(),
    );


  next.setUTCDate(
    next.getUTCDate() +
      1,
  );


  return next;
}


/* ==========================================================================
   PLAGE DE DATES
   ========================================================================== */

/**
 * dateTo est inclusive visuellement.
 *
 * En SQL/Prisma :
 *
 * dateFrom <= createdAt < jour suivant dateTo
 */

function buildOrderDateRange(
  filters:
    Pick<
      ManagerOrdersFilters,
      | "dateFrom"
      | "dateTo"
    >,
): OrderDateRange | null {
  const from =
    parseDateStartUtc(
      filters.dateFrom,
    );


  const to =
    parseDateStartUtc(
      filters.dateTo,
    );


  if (
    !from &&
    !to
  ) {
    return null;
  }


  const range:
    OrderDateRange = {};


  if (
    from
  ) {
    Object.assign(
      range,
      {
        gte:
          from,
      },
    );
  }


  if (
    to
  ) {
    Object.assign(
      range,
      {
        lt:
          addUtcDay(
            to,
          ),
      },
    );
  }


  return range;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

function normalizePage(
  value:
    number | null | undefined,
): number {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    return 1;
  }


  const page =
    Math.trunc(
      value,
    );


  return page >
    0
    ? page
    : 1;
}


/* ==========================================================================
   FILTRES
   ========================================================================== */

function normalizeManagerOrdersFilters(
  input:
    GetManagerOrdersPageDataInput,
): ManagerOrdersFilters {
  const tab =
    isManagerOrdersTab(
      input.tab,
    )
      ? input.tab
      : DEFAULT_MANAGER_ORDERS_FILTERS.tab;


  const status =
    isManagerOrderStatusFilter(
      input.status,
    )
      ? input.status
      : DEFAULT_MANAGER_ORDERS_FILTERS.status;


  const paymentMethod =
    isManagerOrderPaymentMethodFilter(
      input.paymentMethod,
    )
      ? input.paymentMethod
      : DEFAULT_MANAGER_ORDERS_FILTERS.paymentMethod;


  return {
    dateFrom:
      normalizeDateInput(
        input.dateFrom,
      ),

    dateTo:
      normalizeDateInput(
        input.dateTo,
      ),

    q:
      normalizeText(
        input.q,
        MAX_SEARCH_LENGTH,
      ),

    tab,

    status,

    paymentMethod,

    city:
      normalizeText(
        input.city,
        MAX_CITY_LENGTH,
      ),

    page:
      normalizePage(
        input.page,
      ),
  };
}


/* ==========================================================================
   STORE ID
   ========================================================================== */

function requireStoreId(
  value:
    string,
): string {
  const storeId =
    value.trim();


  if (
    !storeId
  ) {
    throw new Error(
      "Boutique Gestionnaire invalide.",
    );
  }


  return storeId;
}


/* ==========================================================================
   ORDER ID
   ========================================================================== */

function normalizeOrderId(
  value:
    string,
): string | null {
  const orderId =
    value.trim();


  if (
    !orderId ||
    orderId.length >
      MAX_IDENTIFIER_LENGTH
  ) {
    return null;
  }


  return orderId;
}


/* ==========================================================================
   RECHERCHE
   ========================================================================== */

/**
 * Chaque mot saisi doit correspondre à au moins un champ.
 *
 * Exemple :
 *
 * "Aissatou Karim"
 *
 * peut correspondre à :
 *
 * customerFirstName = Aissatou
 * customerLastName = Karim
 */

function buildSearchWhere(
  search:
    string,
): Prisma.OrderWhereInput | null {
  const tokens =
    search
      .split(
        " ",
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
        8,
      );


  if (
    tokens.length ===
    0
  ) {
    return null;
  }


  return {
    AND:
      tokens.map(
        (
          token,
        ) => ({
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

            {
              customerEmail: {
                contains:
                  token,

                mode:
                  "insensitive",
              },
            },
          ],
        }),
      ),
  };
}


/* ==========================================================================
   WHERE COMMUN
   ========================================================================== */

/**
 * Ce WHERE sert aux :
 *
 * - compteurs d'onglets ;
 * - liste.
 *
 * Il inclut :
 *
 * - boutique ;
 * - période ;
 * - recherche ;
 * - paiement ;
 * - ville.
 *
 * Les statuts sont ajoutés séparément.
 */

function buildCommonOrdersWhere(
  storeId:
    string,

  filters:
    ManagerOrdersFilters,
): Prisma.OrderWhereInput {
  const and:
    Prisma.OrderWhereInput[] =
      [];


  const dateRange =
    buildOrderDateRange(
      filters,
    );


  if (
    dateRange
  ) {
    and.push({
      createdAt:
        dateRange,
    });
  }


  const searchWhere =
    buildSearchWhere(
      filters.q,
    );


  if (
    searchWhere
  ) {
    and.push(
      searchWhere,
    );
  }


  if (
    filters.city
  ) {
    and.push({
      shippingCity: {
        equals:
          filters.city,

        mode:
          "insensitive",
      },
    });
  }


  if (
    filters.paymentMethod !==
    "all"
  ) {
    and.push({
      payments: {
        some: {
          storeId,

          method:
            filters.paymentMethod,
        },
      },
    });
  }


  return {
    storeId,

    ...(and.length >
    0
      ? {
          AND:
            and,
        }
      : {}),
  };
}


/* ==========================================================================
   WHERE LISTE
   ========================================================================== */

function buildOrdersListWhere(
  storeId:
    string,

  filters:
    ManagerOrdersFilters,
): Prisma.OrderWhereInput {
  const common =
    buildCommonOrdersWhere(
      storeId,
      filters,
    );


  const statusConditions:
    Prisma.OrderWhereInput[] =
      [];


  if (
    filters.tab !==
    "all"
  ) {
    statusConditions.push({
      status: {
        in: [
          ...getManagerOrdersTabStatuses(
            filters.tab,
          ),
        ],
      },
    });
  }


  if (
    filters.status !==
    "all"
  ) {
    statusConditions.push({
      status:
        filters.status,
    });
  }


  if (
    statusConditions.length ===
    0
  ) {
    return common;
  }


  const existingAnd =
    Array.isArray(
      common.AND,
    )
      ? common.AND
      : common.AND
        ? [
            common.AND,
          ]
        : [];


  return {
    ...common,

    AND: [
      ...existingAnd,
      ...statusConditions,
    ],
  };
}


/* ==========================================================================
   WHERE KPI
   ========================================================================== */

/**
 * Les KPI représentent l'activité générale de la période.
 *
 * Ils ne changent pas lorsqu'on tape un nom ou lorsqu'on clique sur un
 * statut de tableau.
 *
 * Seule la période influe sur ce résumé.
 */

function buildOrdersSummaryWhere(
  storeId:
    string,

  filters:
    Pick<
      ManagerOrdersFilters,
      | "dateFrom"
      | "dateTo"
    >,
): Prisma.OrderWhereInput {
  const dateRange =
    buildOrderDateRange(
      filters,
    );


  return {
    storeId,

    ...(dateRange
      ? {
          createdAt:
            dateRange,
        }
      : {}),
  };
}


/* ==========================================================================
   SELECT LISTE
   ========================================================================== */

function buildManagerOrderListSelect(
  storeId:
    string,
) {
  return {
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

    customerEmail:
      true,

    shippingCity:
      true,

    currency:
      true,

    totalAmount:
      true,

    status:
      true,

    createdAt:
      true,

    items: {
      orderBy: [
        {
          createdAt:
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

        productName:
          true,

        quantity:
          true,

        storeProduct: {
          select: {
            storeId:
              true,

            product: {
              select: {
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
          },
        },
      },
    },

    payments: {
      where: {
        storeId,
      },

      orderBy: [
        {
          updatedAt:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take:
        1,

      select: {
        id:
          true,

        status:
          true,

        method:
          true,

        provider:
          true,
      },
    },

    shipments: {
      where: {
        storeId,
      },

      orderBy: [
        {
          updatedAt:
            "desc",
        },
        {
          createdAt:
            "desc",
        },
      ],

      take:
        1,

      select: {
        id:
          true,

        status:
          true,
      },
    },
  } satisfies Prisma.OrderSelect;
}


type ManagerOrderListRecord =
  Prisma.OrderGetPayload<{
    select:
      ReturnType<
        typeof buildManagerOrderListSelect
      >;
  }>;


/* ==========================================================================
   IMAGE PRODUIT
   ========================================================================== */

function mapProductImage(
  record:
    ManagerOrderListRecord["items"][number],

  storeId:
    string,
): ManagerOrderProductImage | null {
  const storeProduct =
    record.storeProduct;


  if (
    !storeProduct ||
    storeProduct.storeId !==
      storeId
  ) {
    return null;
  }


  const image =
    storeProduct
      .product
      .images[0];


  if (
    !image
  ) {
    return null;
  }


  const url =
    image.url.trim();


  if (
    !url
  ) {
    return null;
  }


  return {
    url,

    altText:
      normalizeNullableText(
        image.altText,
      ),
  };
}


/* ==========================================================================
   PRODUITS — PREVIEW
   ========================================================================== */

function mapProductPreviews(
  record:
    ManagerOrderListRecord,

  storeId:
    string,
): readonly ManagerOrderProductPreview[] {
  return record.items
    .slice(
      0,
      PRODUCT_PREVIEW_LIMIT,
    )
    .map(
      (
        item,
      ) => ({
        orderItemId:
          item.id,

        name:
          item.productName.trim(),

        quantity:
          item.quantity,

        image:
          mapProductImage(
            item,
            storeId,
          ),
      }),
    );
}


/* ==========================================================================
   TOTAL ARTICLES
   ========================================================================== */

function getTotalOrderItems(
  items:
    readonly {
      readonly quantity:
        number;
    }[],
): number {
  return items.reduce(
    (
      total,
      item,
    ) =>
      total +
      item.quantity,
    0,
  );
}


/* ==========================================================================
   PAIEMENT — SUMMARY
   ========================================================================== */

function mapPaymentSummary(
  record:
    ManagerOrderListRecord,
): ManagerOrderPaymentSummary | null {
  const payment =
    record.payments[0];


  if (
    !payment
  ) {
    return null;
  }


  return {
    id:
      payment.id,

    status:
      payment.status,

    method:
      payment.method,

    provider:
      normalizeNullableText(
        payment.provider,
      ),
  };
}


/* ==========================================================================
   LIVRAISON — SUMMARY
   ========================================================================== */

function mapShipmentSummary(
  record:
    ManagerOrderListRecord,
): ManagerOrderShipmentSummary | null {
  const shipment =
    record.shipments[0];


  if (
    !shipment
  ) {
    return null;
  }


  return {
    id:
      shipment.id,

    status:
      shipment.status,
  };
}


/* ==========================================================================
   MAP LIGNE
   ========================================================================== */

function mapOrderListItem(
  record:
    ManagerOrderListRecord,

  storeId:
    string,
): ManagerOrderListItem {
  return {
    id:
      record.id,

    orderNumber:
      record.orderNumber.trim(),

    customer: {
      firstName:
        record.customerFirstName.trim(),

      lastName:
        record.customerLastName.trim(),

      phone:
        normalizeNullableText(
          record.customerPhone,
        ),

      email:
        normalizeNullableText(
          record.customerEmail,
        ),
    },

    productPreviews:
      mapProductPreviews(
        record,
        storeId,
      ),

    totalItems:
      getTotalOrderItems(
        record.items,
      ),

    total: {
      amount:
        decimalToString(
          record.totalAmount,
        ),

      currency:
        normalizeCurrency(
          record.currency,
        ),
    },

    payment:
      mapPaymentSummary(
        record,
      ),

    status:
      record.status,

    shipment:
      mapShipmentSummary(
        record,
      ),

    shippingCity:
      normalizeNullableText(
        record.shippingCity,
      ),

    createdAt:
      record.createdAt.toISOString(),
  };
}


/* ==========================================================================
   KPI — STATUTS
   ========================================================================== */

async function querySummaryStatusCounts(
  storeId:
    string,

  filters:
    ManagerOrdersFilters,
) {
  return db.order.groupBy({
    by: [
      "status",
    ],

    where:
      buildOrdersSummaryWhere(
        storeId,
        filters,
      ),

    _count: {
      _all:
        true,
    },
  });
}


/* ==========================================================================
   KPI — REVENU
   ========================================================================== */

/**
 * Convention actuelle :
 *
 * Le chiffre d'affaires affiché ici correspond aux paiements dont le statut
 * courant est réellement PAID.
 *
 * Les paiements :
 *
 * - REFUNDED
 * - PARTIALLY_REFUNDED
 *
 * ne sont pas additionnés automatiquement.
 *
 * Le modèle actuel ne contient pas un montant séparé de remboursement,
 * donc on ne fabrique pas un faux calcul de CA net.
 *
 * Lorsque le projet possédera une vraie entité Refund / refundedAmount,
 * ce calcul pourra évoluer proprement.
 */

async function queryRevenueByCurrency(
  storeId:
    string,

  filters:
    ManagerOrdersFilters,
) {
  const dateRange =
    buildOrderDateRange(
      filters,
    );


  return db.payment.groupBy({
    by: [
      "currency",
    ],

    where: {
      storeId,

      status:
        PaymentStatus.PAID,

      order: {
        is: {
          storeId,

          ...(dateRange
            ? {
                createdAt:
                  dateRange,
              }
            : {}),
        },
      },
    },

    _sum: {
      amount:
        true,
    },
  });
}


/* ==========================================================================
   BUILD REVENUE
   ========================================================================== */

function buildRevenue(
  rows:
    Awaited<
      ReturnType<
        typeof queryRevenueByCurrency
      >
    >,
): readonly ManagerOrderRevenueByCurrency[] {
  return rows
    .map(
      (
        row,
      ) => ({
        currency:
          normalizeCurrency(
            row.currency,
          ),

        amount:
          row._sum.amount
            ? decimalToString(
                row._sum.amount,
              )
            : "0.00",
      }),
    )
    .sort(
      (
        a,
        b,
      ) =>
        a.currency.localeCompare(
          b.currency,
        ),
    );
}


/* ==========================================================================
   BUILD KPI
   ========================================================================== */

function buildOrdersKpis(
  statusRows:
    Awaited<
      ReturnType<
        typeof querySummaryStatusCounts
      >
    >,

  revenue:
    readonly ManagerOrderRevenueByCurrency[],
): ManagerOrdersKpis {
  let totalOrders =
    0;

  let processingOrders =
    0;

  let deliveredOrders =
    0;

  let cancelledOrders =
    0;


  for (
    const row of
    statusRows
  ) {
    const count =
      row._count._all;


    totalOrders +=
      count;


    switch (
      row.status
    ) {
      case OrderStatus.PROCESSING:
      case OrderStatus.READY:
        processingOrders +=
          count;

        break;

      case OrderStatus.DELIVERED:
        deliveredOrders +=
          count;

        break;

      case OrderStatus.CANCELLED:
        cancelledOrders +=
          count;

        break;

      default:
        break;
    }
  }


  return {
    totalOrders,

    revenue,

    processingOrders,

    deliveredOrders,

    cancelledOrders,
  };
}


/* ==========================================================================
   ONGLETS
   ========================================================================== */

async function queryTabStatusCounts(
  storeId:
    string,

  filters:
    ManagerOrdersFilters,
) {
  return db.order.groupBy({
    by: [
      "status",
    ],

    where:
      buildCommonOrdersWhere(
        storeId,
        filters,
      ),

    _count: {
      _all:
        true,
    },
  });
}


/* ==========================================================================
   BUILD ONGLETS
   ========================================================================== */

function buildTabCounts(
  rows:
    Awaited<
      ReturnType<
        typeof queryTabStatusCounts
      >
    >,
): ManagerOrdersTabCounts {
  let all =
    0;

  let pending =
    0;

  let confirmed =
    0;

  let preparing =
    0;

  let shipped =
    0;

  let delivered =
    0;

  let cancelled =
    0;


  for (
    const row of
    rows
  ) {
    const count =
      row._count._all;


    /*
     * Toutes les commandes sont comptées ici.
     *
     * Cela inclut également REFUNDED,
     * même si REFUNDED n'a pas d'onglet dédié
     * dans la maquette.
     */

    all +=
      count;


    switch (
      row.status
    ) {
      case OrderStatus.PENDING:
        pending +=
          count;

        break;


      case OrderStatus.CONFIRMED:
        confirmed +=
          count;

        break;


      case OrderStatus.PROCESSING:
      case OrderStatus.READY:
        preparing +=
          count;

        break;


      case OrderStatus.SHIPPED:
        shipped +=
          count;

        break;


      case OrderStatus.DELIVERED:
        delivered +=
          count;

        break;


      case OrderStatus.CANCELLED:
        cancelled +=
          count;

        break;


      case OrderStatus.REFUNDED:
        /*
         * REFUNDED reste inclus dans "Toutes".
         *
         * Aucun onglet supplémentaire n'est créé,
         * conformément à l'architecture validée.
         */
        break;
    }
  }


  return {
    all,

    pending,

    confirmed,

    preparing,

    shipped,

    delivered,

    cancelled,
  };
}


/* ==========================================================================
   VILLES
   ========================================================================== */

async function queryManagerOrderCities(
  storeId:
    string,
): Promise<readonly string[]> {
  const rows =
    await db.order.findMany({
      where: {
        storeId,

        shippingCity: {
          not:
            null,
        },
      },

      select: {
        shippingCity:
          true,
      },

      distinct: [
        "shippingCity",
      ],
    });


  const unique =
    new Map<
      string,
      string
    >();


  for (
    const row of
    rows
  ) {
    const city =
      normalizeNullableText(
        row.shippingCity,
      );


    if (
      !city
    ) {
      continue;
    }


    const key =
      city.toLocaleLowerCase(
        "fr-FR",
      );


    if (
      !unique.has(
        key,
      )
    ) {
      unique.set(
        key,
        city,
      );
    }
  }


  return Array.from(
    unique.values(),
  ).sort(
    (
      a,
      b,
    ) =>
      a.localeCompare(
        b,
        "fr-FR",
        {
          sensitivity:
            "base",
        },
      ),
  );
}


/* ==========================================================================
   COUNT LISTE
   ========================================================================== */

async function queryOrdersCount(
  where:
    Prisma.OrderWhereInput,
): Promise<number> {
  return db.order.count({
    where,
  });
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function buildOrdersPagination(
  requestedPage:
    number,

  totalItems:
    number,
): ManagerOrdersPagination {
  const pageSize =
    MANAGER_ORDERS_PAGE_SIZE;


  const totalPages =
    totalItems >
      0
      ? Math.ceil(
          totalItems /
            pageSize,
        )
      : 0;


  const page =
    totalPages >
      0
      ? Math.min(
          Math.max(
            requestedPage,
            1,
          ),
          totalPages,
        )
      : 1;


  const startItem =
    totalItems >
      0
      ? (
          page -
          1
        ) *
          pageSize +
        1
      : 0;


  const endItem =
    totalItems >
      0
      ? Math.min(
          page *
            pageSize,
          totalItems,
        )
      : 0;


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
      totalPages >
        0 &&
      page <
        totalPages,
  };
}


/* ==========================================================================
   QUERY LISTE
   ========================================================================== */

async function queryOrderListItems(
  storeId:
    string,

  where:
    Prisma.OrderWhereInput,

  pagination:
    ManagerOrdersPagination,
): Promise<readonly ManagerOrderListItem[]> {
  if (
    pagination.totalItems ===
    0
  ) {
    return [];
  }


  const records =
    await db.order.findMany({
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

      skip:
        (
          pagination.page -
          1
        ) *
        pagination.pageSize,

      take:
        pagination.pageSize,

      select:
        buildManagerOrderListSelect(
          storeId,
        ),
    });


  return records.map(
    (
      record,
    ) =>
      mapOrderListItem(
        record,
        storeId,
      ),
  );
}


/* ==========================================================================
   PAGE DATA
   ========================================================================== */

export async function getManagerOrdersPageData(
  input:
    GetManagerOrdersPageDataInput = {},
): Promise<ManagerOrdersPageData> {
  /* ------------------------------------------------------------------------
     1. AUTHENTIFICATION / PÉRIMÈTRE
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

  const filters =
    normalizeManagerOrdersFilters(
      input,
    );


  /* ------------------------------------------------------------------------
     3. WHERE LISTE
     ------------------------------------------------------------------------ */

  const listWhere =
    buildOrdersListWhere(
      storeId,
      filters,
    );


  /* ------------------------------------------------------------------------
     4. DONNÉES INDÉPENDANTES
     ------------------------------------------------------------------------ */

  const [
    summaryStatusRows,
    revenueRows,
    tabRows,
    cities,
    totalItems,
  ] =
    await Promise.all([
      querySummaryStatusCounts(
        storeId,
        filters,
      ),

      queryRevenueByCurrency(
        storeId,
        filters,
      ),

      queryTabStatusCounts(
        storeId,
        filters,
      ),

      queryManagerOrderCities(
        storeId,
      ),

      queryOrdersCount(
        listWhere,
      ),
    ]);


  /* ------------------------------------------------------------------------
     5. KPI
     ------------------------------------------------------------------------ */

  const revenue =
    buildRevenue(
      revenueRows,
    );


  const kpis =
    buildOrdersKpis(
      summaryStatusRows,
      revenue,
    );


  /* ------------------------------------------------------------------------
     6. ONGLETS
     ------------------------------------------------------------------------ */

  const tabCounts =
    buildTabCounts(
      tabRows,
    );


  /* ------------------------------------------------------------------------
     7. PAGINATION
     ------------------------------------------------------------------------ */

  const pagination =
    buildOrdersPagination(
      filters.page,
      totalItems,
    );


  /* ------------------------------------------------------------------------
     8. LIGNES
     ------------------------------------------------------------------------ */

  const items =
    await queryOrderListItems(
      storeId,
      listWhere,
      pagination,
    );


  /* ------------------------------------------------------------------------
     9. RETOUR
     ------------------------------------------------------------------------ */

  return {
    kpis,

    tabCounts,

    filterOptions: {
      cities,
    },

    items,

    filters: {
      ...filters,

      /**
       * Si l'URL demandait une page supérieure au nombre réel de pages,
       * on retourne la page réellement utilisée.
       */
      page:
        pagination.page,
    },

    pagination,
  };
}


/* ==========================================================================
   SELECT DÉTAIL
   ========================================================================== */

function buildManagerOrderDetailSelect(
  storeId:
    string,
) {
  return {
    id:
      true,

    orderNumber:
      true,

    source:
      true,

    status:
      true,

    customerFirstName:
      true,

    customerLastName:
      true,

    customerEmail:
      true,

    customerPhone:
      true,

    shippingRecipientName:
      true,

    shippingPhone:
      true,

    shippingCountry:
      true,

    shippingCity:
      true,

    shippingAddress:
      true,

    shippingPostalCode:
      true,

    currency:
      true,

    subtotal:
      true,

    discountAmount:
      true,

    shippingAmount:
      true,

    taxAmount:
      true,

    totalAmount:
      true,

    notes:
      true,

    confirmedAt:
      true,

    cancelledAt:
      true,

    deliveredAt:
      true,

    createdAt:
      true,

    updatedAt:
      true,

    items: {
      orderBy: [
        {
          createdAt:
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

        storeProduct: {
          select: {
            storeId:
              true,

            product: {
              select: {
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
          },
        },
      },
    },

    payments: {
      where: {
        storeId,
      },

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

        failedAt:
          true,

        refundedAt:
          true,

        createdAt:
          true,
      },
    },

    shipments: {
      where: {
        storeId,
      },

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
      },
    },
  } satisfies Prisma.OrderSelect;
}


type ManagerOrderDetailRecord =
  Prisma.OrderGetPayload<{
    select:
      ReturnType<
        typeof buildManagerOrderDetailSelect
      >;
  }>;


/* ==========================================================================
   IMAGE DÉTAIL
   ========================================================================== */

function mapDetailItemImage(
  item:
    ManagerOrderDetailRecord["items"][number],

  storeId:
    string,
): ManagerOrderProductImage | null {
  const storeProduct =
    item.storeProduct;


  if (
    !storeProduct ||
    storeProduct.storeId !==
      storeId
  ) {
    return null;
  }


  const image =
    storeProduct
      .product
      .images[0];


  if (
    !image
  ) {
    return null;
  }


  const url =
    image.url.trim();


  if (
    !url
  ) {
    return null;
  }


  return {
    url,

    altText:
      normalizeNullableText(
        image.altText,
      ),
  };
}


/* ==========================================================================
   MAP ARTICLE DÉTAIL
   ========================================================================== */

function mapDetailItem(
  item:
    ManagerOrderDetailRecord["items"][number],

  orderCurrency:
    string,

  storeId:
    string,
): ManagerOrderDetailItem {
  return {
    id:
      item.id,

    productName:
      item.productName.trim(),

    sku:
      normalizeNullableText(
        item.sku,
      ),

    quantity:
      item.quantity,

    unitPrice: {
      amount:
        decimalToString(
          item.unitPrice,
        ),

      currency:
        orderCurrency,
    },

    totalPrice: {
      amount:
        decimalToString(
          item.totalPrice,
        ),

      currency:
        orderCurrency,
    },

    image:
      mapDetailItemImage(
        item,
        storeId,
      ),
  };
}


/* ==========================================================================
   MAP PAIEMENT DÉTAIL
   ========================================================================== */

function mapDetailPayment(
  payment:
    ManagerOrderDetailRecord["payments"][number],
): ManagerOrderDetailPayment {
  return {
    id:
      payment.id,

    paymentReference:
      payment.paymentReference.trim(),

    method:
      payment.method,

    status:
      payment.status,

    provider:
      normalizeNullableText(
        payment.provider,
      ),

    providerReference:
      normalizeNullableText(
        payment.providerReference,
      ),

    amount: {
      amount:
        decimalToString(
          payment.amount,
        ),

      currency:
        normalizeCurrency(
          payment.currency,
        ),
    },

    paidAt:
      payment.paidAt
        ?.toISOString() ??
      null,

    failedAt:
      payment.failedAt
        ?.toISOString() ??
      null,

    refundedAt:
      payment.refundedAt
        ?.toISOString() ??
      null,

    createdAt:
      payment.createdAt.toISOString(),
  };
}


/* ==========================================================================
   MAP LIVRAISON DÉTAIL
   ========================================================================== */

function mapDetailShipment(
  shipment:
    ManagerOrderDetailRecord["shipments"][number],
): ManagerOrderDetailShipment {
  return {
    id:
      shipment.id,

    shipmentNumber:
      shipment.shipmentNumber.trim(),

    status:
      shipment.status,

    carrier:
      normalizeNullableText(
        shipment.carrier,
      ),

    trackingNumber:
      normalizeNullableText(
        shipment.trackingNumber,
      ),

    trackingUrl:
      normalizeNullableText(
        shipment.trackingUrl,
      ),

    recipientName:
      shipment.recipientName.trim(),

    phone:
      normalizeNullableText(
        shipment.phone,
      ),

    country:
      shipment.country.trim(),

    city:
      shipment.city.trim(),

    address:
      shipment.address.trim(),

    postalCode:
      normalizeNullableText(
        shipment.postalCode,
      ),

    shippingCost: {
      amount:
        decimalToString(
          shipment.shippingCost,
        ),

      currency:
        normalizeCurrency(
          shipment.currency,
        ),
    },

    shippedAt:
      shipment.shippedAt
        ?.toISOString() ??
      null,

    deliveredAt:
      shipment.deliveredAt
        ?.toISOString() ??
      null,

    createdAt:
      shipment.createdAt.toISOString(),
  };
}


/* ==========================================================================
   MAP DÉTAIL
   ========================================================================== */

function mapManagerOrderDetail(
  record:
    ManagerOrderDetailRecord,

  storeId:
    string,
): ManagerOrderDetail {
  const currency =
    normalizeCurrency(
      record.currency,
    );


  return {
    id:
      record.id,

    orderNumber:
      record.orderNumber.trim(),

    source:
      record.source,

    status:
      record.status,

    customer: {
      firstName:
        record.customerFirstName.trim(),

      lastName:
        record.customerLastName.trim(),

      email:
        normalizeNullableText(
          record.customerEmail,
        ),

      phone:
        normalizeNullableText(
          record.customerPhone,
        ),
    },

    shippingAddress: {
      recipientName:
        normalizeNullableText(
          record.shippingRecipientName,
        ),

      phone:
        normalizeNullableText(
          record.shippingPhone,
        ),

      country:
        normalizeNullableText(
          record.shippingCountry,
        ),

      city:
        normalizeNullableText(
          record.shippingCity,
        ),

      address:
        normalizeNullableText(
          record.shippingAddress,
        ),

      postalCode:
        normalizeNullableText(
          record.shippingPostalCode,
        ),
    },

    amounts: {
      subtotal: {
        amount:
          decimalToString(
            record.subtotal,
          ),

        currency,
      },

      discount: {
        amount:
          decimalToString(
            record.discountAmount,
          ),

        currency,
      },

      shipping: {
        amount:
          decimalToString(
            record.shippingAmount,
          ),

        currency,
      },

      tax: {
        amount:
          decimalToString(
            record.taxAmount,
          ),

        currency,
      },

      total: {
        amount:
          decimalToString(
            record.totalAmount,
          ),

        currency,
      },
    },

    items:
      record.items.map(
        (
          item,
        ) =>
          mapDetailItem(
            item,
            currency,
            storeId,
          ),
      ),

    payments:
      record.payments.map(
        mapDetailPayment,
      ),

    shipments:
      record.shipments.map(
        mapDetailShipment,
      ),

    notes:
      normalizeNullableText(
        record.notes,
      ),

    confirmedAt:
      record.confirmedAt
        ?.toISOString() ??
      null,

    cancelledAt:
      record.cancelledAt
        ?.toISOString() ??
      null,

    deliveredAt:
      record.deliveredAt
        ?.toISOString() ??
      null,

    createdAt:
      record.createdAt.toISOString(),

    updatedAt:
      record.updatedAt.toISOString(),
  };
}


/* ==========================================================================
   DÉTAIL COMMANDE
   ========================================================================== */

export async function getManagerOrderDetail(
  input:
    GetManagerOrderDetailInput,
): Promise<ManagerOrderDetail | null> {
  /* ------------------------------------------------------------------------
     1. AUTHENTIFICATION
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    requireStoreId(
      access.store.id,
    );


  /* ------------------------------------------------------------------------
     2. IDENTIFIANT
     ------------------------------------------------------------------------ */

  const orderId =
    normalizeOrderId(
      input.orderId,
    );


  if (
    !orderId
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     3. QUERY STRICTEMENT SCOPÉE
     ------------------------------------------------------------------------ */

  const record =
    await db.order.findFirst({
      where: {
        id:
          orderId,

        storeId,
      },

      select:
        buildManagerOrderDetailSelect(
          storeId,
        ),
    });


  if (
    !record
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     4. RETOUR
     ------------------------------------------------------------------------ */

  return mapManagerOrderDetail(
    record,
    storeId,
  );
}