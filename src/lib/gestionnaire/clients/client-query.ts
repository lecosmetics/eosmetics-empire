import "server-only";

import {
  Prisma,
} from "@prisma/client";

import type {
  CustomerStatus,
} from "@prisma/client";

import {
  db,
} from "@/prisma/db";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  DEFAULT_MANAGER_CLIENTS_FILTERS,
  MANAGER_CLIENTS_PAGE_SIZE,
  createEmptyManagerClientsFilterOptions,
  createEmptyManagerClientsKpis,
  createEmptyManagerClientsPagination,
  isManagerClientStatusFilter,
  isManagerClientsSort,
  isManagerCustomerStatus,
  type GetManagerClientsPageDataInput,
  type ManagerClientDetail,
  type ManagerClientListItem,
  type ManagerClientMoney,
  type ManagerClientSpendingByCurrency,
  type ManagerClientsFilterOptions,
  type ManagerClientsFilters,
  type ManagerClientsKpis,
  type ManagerClientsPageData,
  type ManagerClientsPagination,
} from "./client-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/clients/client-query.ts
 *
 * RESPONSABILITÉS :
 *
 * - fonctionner exclusivement côté serveur ;
 * - récupérer la boutique depuis la session Gestionnaire ;
 * - ne jamais accepter storeId depuis le navigateur ;
 * - lister uniquement les clients ayant commandé dans cette boutique ;
 * - garantir une seule ligne par vrai Customer.id ;
 * - rechercher par prénom, nom, e-mail et téléphone ;
 * - filtrer par ville réelle ;
 * - filtrer par Customer.status réel ;
 * - trier selon la vraie dernière commande ;
 * - effectuer une pagination serveur ;
 * - calculer les KPI depuis PostgreSQL ;
 * - calculer orderCount côté base ;
 * - calculer firstOrderAt / lastOrderAt côté base ;
 * - calculer totalSpent depuis les paiements PAID ;
 * - conserver les devises séparées ;
 * - sécuriser /gestionnaire/clients/[clientId].
 *
 * ============================================================================
 *
 * POLITIQUE ACTUELLE POUR LES COMMANDES INVITÉES
 * ============================================================================
 *
 * Le Prisma autorise :
 *
 * Order.customerId = null
 *
 * mais aucune clé d'identité officielle pour regrouper plusieurs commandes
 * invitées n'est actuellement définie.
 *
 * Nous refusons donc volontairement de décider que :
 *
 * même e-mail = automatiquement même personne
 *
 * ou :
 *
 * même téléphone = automatiquement même personne
 *
 * sans règle métier officielle.
 *
 * Cette query travaille donc actuellement avec les vrais Customer.id.
 *
 * Une commande sans Customer.id reste une vraie commande, mais elle n'est
 * pas artificiellement transformée ici en Customer.
 *
 * ============================================================================
 */


/* ==========================================================================
   LIMITES INTERNES
   ========================================================================== */

const CLIENT_SEARCH_MAX_LENGTH =
  180;


const CLIENT_SEARCH_MAX_TOKENS =
  8;


const CLIENT_ID_MAX_LENGTH =
  191;


/* ==========================================================================
   TYPES INTERNES — RAW SQL
   ========================================================================== */

interface ClientCountRawRow {
  readonly totalCount:
    bigint | number | string;
}


interface ClientPageRawRow {
  readonly id:
    string;

  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly email:
    string | null;

  readonly phone:
    string | null;

  readonly status:
    CustomerStatus;

  readonly city:
    string | null;

  readonly orderCount:
    bigint | number | string;

  readonly firstOrderAt:
    Date | string;

  readonly lastOrderAt:
    Date | string;
}


interface ClientKpisRawRow {
  readonly totalClients:
    bigint | number | string | null;

  readonly activeClients:
    bigint | number | string | null;

  readonly newClients:
    bigint | number | string | null;

  readonly totalOrders:
    bigint | number | string | null;
}


interface ClientCityRawRow {
  readonly city:
    string;
}


interface ClientSpendingRawRow {
  readonly customerId:
    string;

  readonly currency:
    string;

  readonly amount:
    Prisma.Decimal | number | string | null;
}


/* ==========================================================================
   NORMALISATION — TEXTE
   ========================================================================== */

function normalizeText(
  value:
    unknown,
): string {
  if (
    typeof value !==
      "string"
  ) {
    return "";
  }


  return value
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}


/* ==========================================================================
   NORMALISATION — TEXTE OPTIONNEL
   ========================================================================== */

function normalizeOptionalText(
  value:
    unknown,
): string | null {
  const normalized =
    normalizeText(
      value,
    );


  return normalized ||
    null;
}


/* ==========================================================================
   NORMALISATION — SEARCH
   ========================================================================== */

function normalizeSearchText(
  value:
    unknown,
): string {
  return normalizeText(
    value,
  ).slice(
    0,
    CLIENT_SEARCH_MAX_LENGTH,
  );
}


/* ==========================================================================
   TOKENS DE RECHERCHE
   ========================================================================== */

function getSearchTokens(
  value:
    string,
): readonly string[] {
  const uniqueTokens =
    new Set<string>();


  for (
    const token of value
      .split(/\s+/)
      .map(
        (
          item,
        ) =>
          item.trim(),
      )
      .filter(
        Boolean,
      )
  ) {
    uniqueTokens.add(
      token,
    );


    if (
      uniqueTokens.size >=
      CLIENT_SEARCH_MAX_TOKENS
    ) {
      break;
    }
  }


  return Array.from(
    uniqueTokens,
  );
}


/* ==========================================================================
   NORMALISATION — PAGE
   ========================================================================== */

function normalizePage(
  value:
    GetManagerClientsPageDataInput["page"],
): number {
  if (
    typeof value ===
      "number"
  ) {
    if (
      Number.isSafeInteger(
        value,
      ) &&
      value >
        0
    ) {
      return value;
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


  const page =
    Number(
      normalized,
    );


  if (
    !Number.isSafeInteger(
      page,
    ) ||
    page <
      1
  ) {
    return 1;
  }


  return page;
}


/* ==========================================================================
   NORMALISATION — FILTRES
   ========================================================================== */

function normalizeManagerClientsFilters(
  input:
    GetManagerClientsPageDataInput = {},
): ManagerClientsFilters {
  const rawStatus =
    normalizeText(
      input.status,
    );


  const rawSort =
    normalizeText(
      input.sort,
    );


  return {
    q:
      normalizeSearchText(
        input.q,
      ),

    city:
      normalizeText(
        input.city,
      ),

    status:
      isManagerClientStatusFilter(
        rawStatus,
      )
        ? rawStatus
        : DEFAULT_MANAGER_CLIENTS_FILTERS.status,

    sort:
      isManagerClientsSort(
        rawSort,
      )
        ? rawSort
        : DEFAULT_MANAGER_CLIENTS_FILTERS.sort,

    page:
      normalizePage(
        input.page,
      ),
  };
}


/* ==========================================================================
   NORMALISATION — CLIENT ID
   ========================================================================== */

function normalizeClientId(
  value:
    unknown,
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
      CLIENT_ID_MAX_LENGTH
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   NORMALISATION — INTEGER
   ========================================================================== */

function normalizeInteger(
  value:
    bigint | number | string | null | undefined,
): number {
  if (
    typeof value ===
      "bigint"
  ) {
    const converted =
      Number(
        value,
      );


    if (
      Number.isSafeInteger(
        converted,
      ) &&
      converted >=
        0
    ) {
      return converted;
    }


    throw new Error(
      "MANAGER_CLIENT_INTEGER_OUT_OF_RANGE",
    );
  }


  if (
    typeof value ===
      "number"
  ) {
    if (
      Number.isSafeInteger(
        value,
      ) &&
      value >=
        0
    ) {
      return value;
    }


    throw new Error(
      "MANAGER_CLIENT_INTEGER_INVALID",
    );
  }


  if (
    typeof value ===
      "string" &&
    /^\d+$/.test(
      value,
    )
  ) {
    const converted =
      Number(
        value,
      );


    if (
      Number.isSafeInteger(
        converted,
      )
    ) {
      return converted;
    }
  }


  return 0;
}


/* ==========================================================================
   NORMALISATION — DECIMAL
   ========================================================================== */

function normalizeDecimal(
  value:
    Prisma.Decimal | number | string | null | undefined,
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
    const normalized =
      value.trim();


    return normalized ||
      "0";
  }


  if (
    typeof value ===
      "number"
  ) {
    if (
      !Number.isFinite(
        value,
      )
    ) {
      throw new Error(
        "MANAGER_CLIENT_DECIMAL_INVALID",
      );
    }


    return String(
      value,
    );
  }


  return value.toString();
}


/* ==========================================================================
   NORMALISATION — DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    unknown,
): string {
  return normalizeText(
    value,
  ).toUpperCase();
}


/* ==========================================================================
   DATE ISO
   ========================================================================== */

function serializeDate(
  value:
    Date | string,
): string {
  const date =
    value instanceof Date
      ? value
      : new Date(
          value,
        );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "MANAGER_CLIENT_DATE_INVALID",
    );
  }


  return date.toISOString();
}


/* ==========================================================================
   PÉRIODE — MOIS UTC COURANT
   ========================================================================== */

/**
 * Aucun fuseau métier Store n'est actuellement présent dans le modèle Store.
 *
 * Pour éviter d'inventer Africa/Dakar, Africa/Porto-Novo, etc.,
 * le calcul du KPI "Nouveaux clients — ce mois-ci" utilise UTC.
 */

function getCurrentUtcMonthRange(
  now:
    Date = new Date(),
): {
  readonly start:
    Date;

  readonly end:
    Date;
} {
  const start =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
        0,
        0,
        0,
        0,
      ),
    );


  const end =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() +
          1,
        1,
        0,
        0,
        0,
        0,
      ),
    );


  return {
    start,
    end,
  };
}


/* ==========================================================================
   SQL — CTE CLIENTS
   ========================================================================== */

/**
 * Une ligne = un vrai Customer.id.
 *
 * Les agrégations de commandes sont effectuées directement par PostgreSQL :
 *
 * COUNT
 * MIN
 * MAX
 *
 * et uniquement pour la boutique autorisée.
 */

function buildClientsBaseCte(
  storeId:
    string,
): Prisma.Sql {
  return Prisma.sql`
    WITH "client_stats" AS (
      SELECT
        c."id" AS "id",
        c."firstName" AS "firstName",
        c."lastName" AS "lastName",
        c."email" AS "email",
        c."phone" AS "phone",
        c."status" AS "status",

        COUNT(o."id")::bigint AS "orderCount",

        MIN(o."createdAt") AS "firstOrderAt",

        MAX(o."createdAt") AS "lastOrderAt"

      FROM "customers" c

      INNER JOIN "orders" o
        ON o."customerId" = c."id"
        AND o."storeId" = ${storeId}

      GROUP BY
        c."id",
        c."firstName",
        c."lastName",
        c."email",
        c."phone",
        c."status"
    ),

    "latest_client_city" AS (
      SELECT DISTINCT ON (
        o."customerId"
      )
        o."customerId" AS "customerId",

        NULLIF(
          BTRIM(
            o."shippingCity"
          ),
          ''
        ) AS "city"

      FROM "orders" o

      WHERE
        o."storeId" = ${storeId}
        AND o."customerId" IS NOT NULL

      ORDER BY
        o."customerId" ASC,
        o."createdAt" DESC,
        o."id" DESC
    )
  `;
}


/* ==========================================================================
   SQL — RECHERCHE
   ========================================================================== */

function buildClientSearchCondition(
  query:
    string,
): Prisma.Sql {
  const tokens =
    getSearchTokens(
      query,
    );


  if (
    tokens.length ===
      0
  ) {
    return Prisma.empty;
  }


  const conditions =
    tokens.map(
      (
        token,
      ) => {
        const pattern =
          `%${token}%`;


        return Prisma.sql`
          (
            cs."firstName" ILIKE ${pattern}
            OR cs."lastName" ILIKE ${pattern}
            OR COALESCE(
              cs."email",
              ''
            ) ILIKE ${pattern}
            OR COALESCE(
              cs."phone",
              ''
            ) ILIKE ${pattern}
          )
        `;
      },
    );


  return Prisma.sql`
    AND ${Prisma.join(
      conditions,
      " AND ",
    )}
  `;
}


/* ==========================================================================
   SQL — STATUT
   ========================================================================== */

function buildClientStatusCondition(
  filters:
    ManagerClientsFilters,
): Prisma.Sql {
  if (
    filters.status ===
      "all"
  ) {
    return Prisma.empty;
  }


  return Prisma.sql`
    AND cs."status"::text = ${filters.status}
  `;
}


/* ==========================================================================
   SQL — VILLE
   ========================================================================== */

function buildClientCityCondition(
  filters:
    ManagerClientsFilters,
): Prisma.Sql {
  if (
    !filters.city
  ) {
    return Prisma.empty;
  }


  return Prisma.sql`
    AND LOWER(
      COALESCE(
        lcc."city",
        ''
      )
    ) = LOWER(
      ${filters.city}
    )
  `;
}


/* ==========================================================================
   SQL — TRI
   ========================================================================== */

function buildClientSortSql(
  filters:
    ManagerClientsFilters,
): Prisma.Sql {
  if (
    filters.sort ===
      "last-order-asc"
  ) {
    return Prisma.sql`
      cs."lastOrderAt" ASC,
      cs."id" ASC
    `;
  }


  return Prisma.sql`
    cs."lastOrderAt" DESC,
    cs."id" ASC
  `;
}


/* ==========================================================================
   COUNT FILTRÉ
   ========================================================================== */

async function countFilteredClients(
  storeId:
    string,

  filters:
    ManagerClientsFilters,
): Promise<number> {
  const rows =
    await db.$queryRaw<
      ClientCountRawRow[]
    >(
      Prisma.sql`
        ${buildClientsBaseCte(
          storeId,
        )}

        SELECT
          COUNT(*)::bigint AS "totalCount"

        FROM "client_stats" cs

        LEFT JOIN "latest_client_city" lcc
          ON lcc."customerId" = cs."id"

        WHERE 1 = 1

        ${buildClientSearchCondition(
          filters.q,
        )}

        ${buildClientStatusCondition(
          filters,
        )}

        ${buildClientCityCondition(
          filters,
        )}
      `,
    );


  return normalizeInteger(
    rows[0]?.totalCount,
  );
}


/* ==========================================================================
   LISTE PAGINÉE
   ========================================================================== */

async function queryClientsPage(
  storeId:
    string,

  filters:
    ManagerClientsFilters,

  page:
    number,
): Promise<
  readonly ClientPageRawRow[]
> {
  const offset =
    (
      page -
      1
    ) *
    MANAGER_CLIENTS_PAGE_SIZE;


  return db.$queryRaw<
    ClientPageRawRow[]
  >(
    Prisma.sql`
      ${buildClientsBaseCte(
        storeId,
      )}

      SELECT
        cs."id",
        cs."firstName",
        cs."lastName",
        cs."email",
        cs."phone",
        cs."status",

        lcc."city" AS "city",

        cs."orderCount",
        cs."firstOrderAt",
        cs."lastOrderAt"

      FROM "client_stats" cs

      LEFT JOIN "latest_client_city" lcc
        ON lcc."customerId" = cs."id"

      WHERE 1 = 1

      ${buildClientSearchCondition(
        filters.q,
      )}

      ${buildClientStatusCondition(
        filters,
      )}

      ${buildClientCityCondition(
        filters,
      )}

      ORDER BY
        ${buildClientSortSql(
          filters,
        )}

      LIMIT ${MANAGER_CLIENTS_PAGE_SIZE}

      OFFSET ${offset}
    `,
  );
}


/* ==========================================================================
   KPI
   ========================================================================== */

async function queryClientsKpis(
  storeId:
    string,
): Promise<ManagerClientsKpis> {
  const month =
    getCurrentUtcMonthRange();


  const rows =
    await db.$queryRaw<
      ClientKpisRawRow[]
    >(
      Prisma.sql`
        WITH "customer_order_stats" AS (
          SELECT
            o."customerId" AS "customerId",

            COUNT(o."id")::bigint AS "orderCount",

            MIN(
              o."createdAt"
            ) AS "firstOrderAt"

          FROM "orders" o

          WHERE
            o."storeId" = ${storeId}
            AND o."customerId" IS NOT NULL

          GROUP BY
            o."customerId"
        )

        SELECT
          COUNT(*)::bigint AS "totalClients",

          COUNT(*) FILTER (
            WHERE c."status"::text = 'ACTIVE'
          )::bigint AS "activeClients",

          COUNT(*) FILTER (
            WHERE
              cos."firstOrderAt" >= ${month.start}
              AND cos."firstOrderAt" < ${month.end}
          )::bigint AS "newClients",

          COALESCE(
            SUM(
              cos."orderCount"
            ),
            0
          )::bigint AS "totalOrders"

        FROM "customer_order_stats" cos

        INNER JOIN "customers" c
          ON c."id" = cos."customerId"
      `,
    );


  const row =
    rows[0];


  if (
    !row
  ) {
    return createEmptyManagerClientsKpis();
  }


  return {
    totalClients:
      normalizeInteger(
        row.totalClients,
      ),

    activeClients:
      normalizeInteger(
        row.activeClients,
      ),

    newClients:
      normalizeInteger(
        row.newClients,
      ),

    totalOrders:
      normalizeInteger(
        row.totalOrders,
      ),
  };
}


/* ==========================================================================
   VILLES RÉELLES
   ========================================================================== */

/**
 * La ville affichée dans la liste correspond à la ville de livraison
 * de la dernière commande du client dans cette boutique.
 *
 * Les options du filtre utilisent exactement cette même source.
 */

async function queryClientFilterOptions(
  storeId:
    string,
): Promise<ManagerClientsFilterOptions> {
  const rows =
    await db.$queryRaw<
      ClientCityRawRow[]
    >(
      Prisma.sql`
        WITH "latest_client_city" AS (
          SELECT DISTINCT ON (
            o."customerId"
          )
            o."customerId" AS "customerId",

            NULLIF(
              BTRIM(
                o."shippingCity"
              ),
              ''
            ) AS "city"

          FROM "orders" o

          WHERE
            o."storeId" = ${storeId}
            AND o."customerId" IS NOT NULL

          ORDER BY
            o."customerId" ASC,
            o."createdAt" DESC,
            o."id" DESC
        )

        SELECT DISTINCT
          lcc."city" AS "city"

        FROM "latest_client_city" lcc

        WHERE
          lcc."city" IS NOT NULL

        ORDER BY
          lcc."city" ASC
      `,
    );


  if (
    rows.length ===
      0
  ) {
    return createEmptyManagerClientsFilterOptions();
  }


  return {
    cities:
      rows
        .map(
          (
            row,
          ) =>
            normalizeText(
              row.city,
            ),
        )
        .filter(
          Boolean,
        ),
  };
}


/* ==========================================================================
   TOTAL DÉPENSÉ — PAIEMENTS CONFIRMÉS
   ========================================================================== */

/**
 * Même principe financier que la page Commandes :
 *
 * seuls les Payment.status = PAID sont considérés comme confirmés.
 *
 * Sont donc exclus du total :
 *
 * PENDING
 * PROCESSING
 * FAILED
 * CANCELLED
 * REFUNDED
 * PARTIALLY_REFUNDED
 *
 * Les montants sont groupés séparément par devise.
 *
 * Aucune conversion automatique n'est effectuée.
 */

async function queryPaidSpendingByCustomerIds(
  storeId:
    string,

  customerIds:
    readonly string[],
): Promise<
  ReadonlyMap<
    string,
    readonly ManagerClientSpendingByCurrency[]
  >
> {
  if (
    customerIds.length ===
      0
  ) {
    return new Map();
  }


  const rows =
    await db.$queryRaw<
      ClientSpendingRawRow[]
    >(
      Prisma.sql`
        SELECT
          o."customerId" AS "customerId",

          p."currency" AS "currency",

          COALESCE(
            SUM(
              p."amount"
            ),
            0
          ) AS "amount"

        FROM "payments" p

        INNER JOIN "orders" o
          ON o."id" = p."orderId"

        WHERE
          p."storeId" = ${storeId}

          AND o."storeId" = ${storeId}

          AND p."status"::text = 'PAID'

          AND o."customerId" IN (
            ${Prisma.join(
              customerIds,
            )}
          )

        GROUP BY
          o."customerId",
          p."currency"

        ORDER BY
          o."customerId" ASC,
          p."currency" ASC
      `,
    );


  const result =
    new Map<
      string,
      ManagerClientSpendingByCurrency[]
    >();


  for (
    const row of rows
  ) {
    const customerId =
      normalizeText(
        row.customerId,
      );


    const currency =
      normalizeCurrency(
        row.currency,
      );


    if (
      !customerId ||
      !currency
    ) {
      continue;
    }


    const current =
      result.get(
        customerId,
      ) ?? [];


    current.push({
      amount:
        normalizeDecimal(
          row.amount,
        ),

      currency,
    });


    result.set(
      customerId,
      current,
    );
  }


  return result;
}


/* ==========================================================================
   CONSTRUCTION D'UNE LIGNE
   ========================================================================== */

function buildClientListItem(
  row:
    ClientPageRawRow,

  spending:
    readonly ManagerClientSpendingByCurrency[],
): ManagerClientListItem {
  if (
    !isManagerCustomerStatus(
      row.status,
    )
  ) {
    throw new Error(
      "MANAGER_CLIENT_STATUS_INVALID",
    );
  }


  const id =
    normalizeText(
      row.id,
    );


  if (
    !id
  ) {
    throw new Error(
      "MANAGER_CLIENT_ID_INVALID",
    );
  }


  return {
    id,

    customerId:
      id,

    identitySource:
      "CUSTOMER",

    firstName:
      normalizeText(
        row.firstName,
      ),

    lastName:
      normalizeText(
        row.lastName,
      ),

    email:
      normalizeOptionalText(
        row.email,
      ),

    phone:
      normalizeOptionalText(
        row.phone,
      ),

    city:
      normalizeOptionalText(
        row.city,
      ),

    status:
      row.status,

    orderCount:
      normalizeInteger(
        row.orderCount,
      ),

    totalSpent:
      spending,

    firstOrderAt:
      serializeDate(
        row.firstOrderAt,
      ),

    lastOrderAt:
      serializeDate(
        row.lastOrderAt,
      ),
  };
}


/* ==========================================================================
   PAGINATION
   ========================================================================== */

function buildPagination(
  totalItems:
    number,

  requestedPage:
    number,
): ManagerClientsPagination {
  if (
    totalItems <=
      0
  ) {
    return createEmptyManagerClientsPagination(
      MANAGER_CLIENTS_PAGE_SIZE,
    );
  }


  const totalPages =
    Math.ceil(
      totalItems /
        MANAGER_CLIENTS_PAGE_SIZE,
    );


  const page =
    Math.min(
      Math.max(
        requestedPage,
        1,
      ),
      totalPages,
    );


  const startItem =
    (
      page -
      1
    ) *
      MANAGER_CLIENTS_PAGE_SIZE +
    1;


  const endItem =
    Math.min(
      page *
        MANAGER_CLIENTS_PAGE_SIZE,
      totalItems,
    );


  return {
    page,

    pageSize:
      MANAGER_CLIENTS_PAGE_SIZE,

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
   PAGE PRINCIPALE
   ========================================================================== */

export async function getManagerClientsPageData(
  input:
    GetManagerClientsPageDataInput = {},
): Promise<ManagerClientsPageData> {
  /* ------------------------------------------------------------------------
     1. ACCÈS PRIVÉ
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    access.store.id;


  /* ------------------------------------------------------------------------
     2. FILTRES
     ------------------------------------------------------------------------ */

  const normalizedFilters =
    normalizeManagerClientsFilters(
      input,
    );


  /* ------------------------------------------------------------------------
     3. DONNÉES INDÉPENDANTES
     ------------------------------------------------------------------------
     
     Ces requêtes peuvent être exécutées en parallèle :
     
     - total filtré ;
     - KPI ;
     - villes.
     ------------------------------------------------------------------------ */

  const [
    totalItems,
    kpis,
    filterOptions,
  ] =
    await Promise.all([
      countFilteredClients(
        storeId,
        normalizedFilters,
      ),

      queryClientsKpis(
        storeId,
      ),

      queryClientFilterOptions(
        storeId,
      ),
    ]);


  /* ------------------------------------------------------------------------
     4. PAGINATION
     ------------------------------------------------------------------------ */

  const pagination =
    buildPagination(
      totalItems,
      normalizedFilters.page,
    );


  const filters:
    ManagerClientsFilters = {
      ...normalizedFilters,

      page:
        pagination.page,
  };


  /* ------------------------------------------------------------------------
     5. AUCUN CLIENT
     ------------------------------------------------------------------------ */

  if (
    totalItems ===
      0
  ) {
    return {
      filters,

      kpis,

      filterOptions,

      clients:
        [],

      pagination,
    };
  }


  /* ------------------------------------------------------------------------
     6. PAGE CLIENTS
     ------------------------------------------------------------------------ */

  const rows =
    await queryClientsPage(
      storeId,
      filters,
      pagination.page,
    );


  /* ------------------------------------------------------------------------
     7. TOTALS PAYÉS
     ------------------------------------------------------------------------ */

  const customerIds =
    rows.map(
      (
        row,
      ) =>
        row.id,
    );


  const spendingByCustomer =
    await queryPaidSpendingByCustomerIds(
      storeId,
      customerIds,
    );


  /* ------------------------------------------------------------------------
     8. SÉRIALISATION
     ------------------------------------------------------------------------ */

  const clients =
    rows.map(
      (
        row,
      ) =>
        buildClientListItem(
          row,
          spendingByCustomer.get(
            row.id,
          ) ?? [],
        ),
    );


  return {
    filters,

    kpis,

    filterOptions,

    clients,

    pagination,
  };
}


/* ==========================================================================
   MONEY
   ========================================================================== */

function buildMoney(
  amount:
    Prisma.Decimal,

  currency:
    string,
): ManagerClientMoney {
  return {
    amount:
      normalizeDecimal(
        amount,
      ),

    currency:
      normalizeCurrency(
        currency,
      ),
  };
}


/* ==========================================================================
   DÉTAIL CLIENT
   ========================================================================== */

/**
 * Sécurité :
 *
 * clientId seul ne suffit jamais.
 *
 * La requête exige également :
 *
 * Customer.orders.some({
 *   storeId: store courant
 * })
 *
 * Ainsi :
 *
 * Gestionnaire A
 * ne peut pas ouvrir
 * un Customer ayant uniquement commandé chez Gestionnaire B.
 */

export async function getManagerClientDetail(
  input:
    Readonly<{
      clientId:
        string;
    }>,
): Promise<ManagerClientDetail | null> {
  /* ------------------------------------------------------------------------
     1. IDENTIFIANT
     ------------------------------------------------------------------------ */

  const clientId =
    normalizeClientId(
      input.clientId,
    );


  if (
    !clientId
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     2. ACCÈS PRIVÉ
     ------------------------------------------------------------------------ */

  const access =
    await requireGestionnairePrivateAccess();


  const storeId =
    access.store.id;


  /* ------------------------------------------------------------------------
     3. CLIENT AUTORISÉ
     ------------------------------------------------------------------------ */

  const customer =
    await db.customer.findFirst({
      where: {
        id:
          clientId,

        orders: {
          some: {
            storeId,
          },
        },
      },

      select: {
        id:
          true,

        firstName:
          true,

        lastName:
          true,

        email:
          true,

        phone:
          true,

        status:
          true,

        createdAt:
          true,

        addresses: {
          orderBy: [
            {
              isDefault:
                "desc",
            },
            {
              createdAt:
                "asc",
            },
          ],

          select: {
            id:
              true,

            type:
              true,

            label:
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

            isDefault:
              true,
          },
        },

        orders: {
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

            orderNumber:
              true,

            status:
              true,

            totalAmount:
              true,

            currency:
              true,

            shippingCity:
              true,

            createdAt:
              true,
          },
        },
      },
    });


  if (
    !customer
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     4. COHÉRENCE DES COMMANDES
     ------------------------------------------------------------------------ */

  if (
    customer.orders.length ===
      0
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     5. STATUT
     ------------------------------------------------------------------------ */

  if (
    !isManagerCustomerStatus(
      customer.status,
    )
  ) {
    throw new Error(
      "MANAGER_CLIENT_STATUS_INVALID",
    );
  }


  /* ------------------------------------------------------------------------
     6. TOTAL PAYÉ
     ------------------------------------------------------------------------ */

  const spendingByCustomer =
    await queryPaidSpendingByCustomerIds(
      storeId,
      [
        customer.id,
      ],
    );


  const totalSpent =
    spendingByCustomer.get(
      customer.id,
    ) ?? [];


  /* ------------------------------------------------------------------------
     7. PREMIÈRE / DERNIÈRE COMMANDE
     ------------------------------------------------------------------------ */

  const latestOrder =
    customer.orders[0];


  const firstOrder =
    customer.orders[
      customer.orders.length -
        1
    ];


  if (
    !latestOrder ||
    !firstOrder
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     8. VILLE
     ------------------------------------------------------------------------
     
     On utilise la ville de livraison de la dernière commande.
     
     Aucune ville n'est inventée si cette information n'existe pas.
     ------------------------------------------------------------------------ */

  const city =
    normalizeOptionalText(
      latestOrder.shippingCity,
    );


  /* ------------------------------------------------------------------------
     9. RÉSULTAT
     ------------------------------------------------------------------------ */

  return {
    id:
      customer.id,

    customerId:
      customer.id,

    identitySource:
      "CUSTOMER",

    firstName:
      normalizeText(
        customer.firstName,
      ),

    lastName:
      normalizeText(
        customer.lastName,
      ),

    email:
      normalizeOptionalText(
        customer.email,
      ),

    phone:
      normalizeOptionalText(
        customer.phone,
      ),

    city,

    status:
      customer.status,

    customerCreatedAt:
      customer.createdAt.toISOString(),

    firstOrderAt:
      firstOrder.createdAt.toISOString(),

    lastOrderAt:
      latestOrder.createdAt.toISOString(),

    orderCount:
      customer.orders.length,

    totalSpent,

    addresses:
      customer.addresses.map(
        (
          address,
        ) => ({
          id:
            address.id,

          type:
            address.type,

          label:
            normalizeOptionalText(
              address.label,
            ),

          recipientName:
            normalizeText(
              address.recipientName,
            ),

          phone:
            normalizeOptionalText(
              address.phone,
            ),

          country:
            normalizeText(
              address.country,
            ),

          city:
            normalizeText(
              address.city,
            ),

          address:
            normalizeText(
              address.address,
            ),

          postalCode:
            normalizeOptionalText(
              address.postalCode,
            ),

          isDefault:
            address.isDefault,
        }),
      ),

    orders:
      customer.orders.map(
        (
          order,
        ) => ({
          id:
            order.id,

          orderNumber:
            order.orderNumber,

          status:
            order.status,

          total:
            buildMoney(
              order.totalAmount,
              order.currency,
            ),

          createdAt:
            order.createdAt.toISOString(),
        }),
      ),
  };
}