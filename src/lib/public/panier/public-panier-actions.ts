"use server";

import "server-only";

import {
  Prisma,
  ProductStatus,
  StoreProductStatus,
  StoreStatus,
} from "@prisma/client";

import {
  publicRouteBuilders,
} from "@/config/routes";

import type {
  PublicPanierCurrencySubtotal,
  PublicPanierItemIntent,
  PublicPanierItemIssue,
  PublicPanierSummary,
  PublicPanierValidatedItem,
  PublicPanierValidatedSnapshot,
  PublicPanierValidationInput,
  PublicPanierValidationResult,
} from "@/lib/public/panier/public-panier-types";

import {
  db,
} from "@/prisma/db";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ACTIONS SERVEUR — PANIER PUBLIC
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/panier/public-panier-actions.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Valider côté serveur les intentions présentes dans le Panier navigateur.
 *
 * ============================================================================
 *
 * LE NAVIGATEUR ENVOIE UNIQUEMENT :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * LE SERVEUR RECHARGE :
 *
 * StoreProduct
 *      ↓
 * Product
 *      ↓
 * Store
 *
 * puis vérifie :
 *
 * - offre existante ;
 * - Product ACTIVE ;
 * - Store ACTIVE ;
 * - StoreProduct public ;
 * - prix > 0 ;
 * - devise exploitable ;
 * - stock courant ;
 * - quantité demandée ;
 * - image produit réelle ;
 * - qrToken réel.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette action ne :
 *
 * - réserve PAS de stock ;
 * - décrémente PAS de stock ;
 * - crée PAS de commande ;
 * - crée PAS de paiement ;
 * - crée PAS de livraison ;
 * - enregistre PAS le Panier en base ;
 * - fait PAS confiance au prix navigateur ;
 * - fait PAS confiance au stock navigateur ;
 * - fait PAS confiance à la devise navigateur.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONSTANTES TECHNIQUES
   ========================================================================== */

/**
 * Longueur défensive d'un identifiant technique.
 *
 * Aucun format CUID précis n'est imposé ici afin de ne pas coupler
 * inutilement la validation publique à une implémentation particulière.
 */
const PUBLIC_PANIER_STORE_PRODUCT_ID_MAX_LENGTH =
  191;


/**
 * Taille technique d'un lot de lecture Prisma.
 *
 * Cela ne limite PAS le nombre d'articles autorisés dans le Panier.
 *
 * Les identifiants sont simplement lus par lots afin d'éviter une requête
 * `IN (...)` inutilement énorme.
 */
const PUBLIC_PANIER_QUERY_CHUNK_SIZE =
  100;


/* ==========================================================================
   2. TYPES INTERNES
   ========================================================================== */

type PublicPanierNormalizedInput =
  Readonly<{
    intents:
      readonly PublicPanierItemIntent[];

    issues:
      readonly PublicPanierItemIssue[];
  }>;


type PublicPanierInputNormalizationResult =
  | Readonly<{
      success:
        true;

      data:
        PublicPanierNormalizedInput;
    }>
  | Readonly<{
      success:
        false;
    }>;


type PublicPanierResolvedItem =
  Readonly<{
    item:
      PublicPanierValidatedItem |
      null;

    issue:
      PublicPanierItemIssue |
      null;
  }>;


/* ==========================================================================
   3. SELECT PRISMA
   ========================================================================== */

const PUBLIC_PANIER_STORE_PRODUCT_SELECT = {
  id:
    true,

  productId:
    true,

  storeId:
    true,

  price:
    true,

  compareAtPrice:
    true,

  currency:
    true,

  stockQuantity:
    true,

  lowStockThreshold:
    true,

  status:
    true,

  qrToken:
    true,

  store: {
    select: {
      id:
        true,

      name:
        true,

      city:
        true,

      country:
        true,

      status:
        true,
    },
  },

  product: {
    select: {
      id:
        true,

      name:
        true,

      slug:
        true,

      sku:
        true,

      status:
        true,

      images: {
        where: {
          url: {
            not:
              "",
          },
        },

        select: {
          id:
            true,

          url:
            true,

          altText:
            true,

          position:
            true,

          isPrimary:
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

          {
            id:
              "asc",
          },
        ],

        take:
          1,
      },
    },
  },
} satisfies Prisma.StoreProductSelect;


/* ==========================================================================
   4. TYPE PRISMA EXACT
   ========================================================================== */

type PublicPanierRawStoreProduct =
  Prisma.StoreProductGetPayload<{
    select:
      typeof PUBLIC_PANIER_STORE_PRODUCT_SELECT;
  }>;


/* ==========================================================================
   5. NORMALISATION TEXTE
   ========================================================================== */

function normalizeRequiredText(
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
   6. IDENTIFIANT STORE PRODUCT
   ========================================================================== */

function normalizeStoreProductId(
  value:
    unknown,
): string |
  null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    normalized.length ===
      0 ||
    normalized.length >
      PUBLIC_PANIER_STORE_PRODUCT_ID_MAX_LENGTH
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   7. DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    string |
    null |
    undefined,
): string |
  null {
  const normalized =
    normalizeRequiredText(
      value,
    ).toUpperCase();


  if (
    !/^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   8. NORMALISATION INPUT CLIENT
   ========================================================================== */

/**
 * Cette fonction constitue la frontière runtime.
 *
 * Les types TypeScript ne protègent pas contre un appel HTTP malformé.
 *
 * On vérifie donc réellement la structure reçue.
 */
function normalizeValidationInput(
  input:
    unknown,
): PublicPanierInputNormalizationResult {
  if (
    typeof input !==
      "object" ||
    input ===
      null ||
    !(
      "items" in
      input
    )
  ) {
    return {
      success:
        false,
    };
  }


  const rawItems =
    (
      input as {
        items?:
          unknown;
      }
    ).items;


  if (
    !Array.isArray(
      rawItems,
    )
  ) {
    return {
      success:
        false,
    };
  }


  const normalizedItems =
    new Map<
      string,
      number
    >();


  const invalidQuantityIds =
    new Set<
      string
    >();


  const issues:
    PublicPanierItemIssue[] =
      [];


  let totalQuantity =
    0;


  for (
    const rawItem
    of rawItems
  ) {
    if (
      typeof rawItem !==
        "object" ||
      rawItem ===
        null
    ) {
      return {
        success:
          false,
      };
    }


    const candidate =
      rawItem as {
        storeProductId?:
          unknown;

        quantity?:
          unknown;
      };


    const storeProductId =
      normalizeStoreProductId(
        candidate
          .storeProductId,
      );


    /**
     * Sans StoreProduct.id exploitable, aucune ligne ne peut être identifiée
     * proprement.
     */
    if (
      !storeProductId
    ) {
      return {
        success:
          false,
      };
    }


    const quantity =
      candidate.quantity;


    /**
     * Une valeur non numérique indique une structure de requête incorrecte.
     */
    if (
      typeof quantity !==
      "number" ||
      !Number.isFinite(
        quantity,
      )
    ) {
      return {
        success:
          false,
      };
    }


    /**
     * Une quantité peut être signalée précisément lorsque l'identifiant
     * de l'offre est valide.
     */
    if (
      !Number.isSafeInteger(
        quantity,
      ) ||
      quantity <=
        0
    ) {
      invalidQuantityIds.add(
        storeProductId,
      );


      normalizedItems.delete(
        storeProductId,
      );


      issues.push({
        storeProductId,

        requestedQuantity:
          quantity,

        code:
          "INVALID_QUANTITY",
      });


      continue;
    }


    /**
     * Si une précédente occurrence du même StoreProduct était invalide,
     * on ne réintroduit pas silencieusement cette ligne.
     */
    if (
      invalidQuantityIds.has(
        storeProductId,
      )
    ) {
      continue;
    }


    const previousQuantity =
      normalizedItems.get(
        storeProductId,
      ) ??
      0;


    const mergedQuantity =
      previousQuantity +
      quantity;


    /**
     * Plusieurs occurrences du même StoreProduct sont fusionnées.
     *
     * La clé commerciale reste StoreProduct.id.
     */
    if (
      !Number.isSafeInteger(
        mergedQuantity,
      )
    ) {
      invalidQuantityIds.add(
        storeProductId,
      );


      normalizedItems.delete(
        storeProductId,
      );


      issues.push({
        storeProductId,

        requestedQuantity:
          mergedQuantity,

        code:
          "INVALID_QUANTITY",
      });


      continue;
    }


    normalizedItems.set(
      storeProductId,
      mergedQuantity,
    );
  }


  const intents:
    PublicPanierItemIntent[] =
      [];


  for (
    const [
      storeProductId,
      quantity,
    ]
    of normalizedItems
  ) {
    const nextTotalQuantity =
      totalQuantity +
      quantity;


    if (
      !Number.isSafeInteger(
        nextTotalQuantity,
      )
    ) {
      return {
        success:
          false,
      };
    }


    totalQuantity =
      nextTotalQuantity;


    intents.push({
      storeProductId,

      quantity,
    });
  }


  return {
    success:
      true,

    data: {
      intents,

      issues,
    },
  };
}


/* ==========================================================================
   9. DÉCOUPAGE EN LOTS
   ========================================================================== */

function chunkStoreProductIds(
  ids:
    readonly string[],
): readonly (
  readonly string[]
)[] {
  const chunks:
    string[][] =
      [];


  for (
    let index =
      0;
    index <
      ids.length;
    index +=
      PUBLIC_PANIER_QUERY_CHUNK_SIZE
  ) {
    chunks.push(
      ids.slice(
        index,
        index +
          PUBLIC_PANIER_QUERY_CHUNK_SIZE,
      ),
    );
  }


  return chunks;
}


/* ==========================================================================
   10. CHARGEMENT STORE PRODUCT
   ========================================================================== */

/**
 * On ne filtre PAS ici les statuts dans le `where`.
 *
 * Pourquoi ?
 *
 * Parce que nous devons pouvoir distinguer :
 *
 * - offre inexistante ;
 * - offre OUT_OF_STOCK ;
 * - offre HIDDEN / ARCHIVED ;
 * - Store inactif ;
 * - Product inactif.
 *
 * Cette distinction permet de retourner le bon état sans exposer de
 * données privées supplémentaires.
 */
async function queryStoreProducts(
  storeProductIds:
    readonly string[],
): Promise<
  PublicPanierRawStoreProduct[]
> {
  if (
    storeProductIds.length ===
    0
  ) {
    return [];
  }


  const chunks =
    chunkStoreProductIds(
      storeProductIds,
    );


  const results =
    await Promise.all(
      chunks.map(
        (
          ids,
        ) =>
          db.storeProduct.findMany({
            where: {
              id: {
                in:
                  [...ids],
              },
            },

            select:
              PUBLIC_PANIER_STORE_PRODUCT_SELECT,
          }),
      ),
    );


  return results.flat();
}


/* ==========================================================================
   11. IMAGE PRODUIT
   ========================================================================== */

function getPublicPanierImage(
  row:
    PublicPanierRawStoreProduct,

  productName:
    string,
): PublicPanierValidatedItem[
  "image"
] |
  null {
  const image =
    row.product
      .images[0];


  if (
    !image
  ) {
    return null;
  }


  const url =
    normalizeRequiredText(
      image.url,
    );


  if (
    !url
  ) {
    return null;
  }


  return {
    url,

    altText:
      normalizeRequiredText(
        image.altText,
      ) ||
      productName,
  };
}


/* ==========================================================================
   12. PRIX BARRÉ
   ========================================================================== */

function getValidCompareAtPrice(
  price:
    Prisma.Decimal,

  compareAtPrice:
    Prisma.Decimal |
    null,
): string |
  null {
  if (
    compareAtPrice ===
    null ||
    !compareAtPrice.gt(
      price,
    )
  ) {
    return null;
  }


  return compareAtPrice.toFixed(
    2,
  );
}


/* ==========================================================================
   13. DISPONIBILITÉ
   ========================================================================== */

function resolveAvailability(
  status:
    StoreProductStatus,

  stockQuantity:
    number,

  lowStockThreshold:
    number,
): PublicPanierValidatedItem[
  "availability"
] {
  if (
    status !==
      StoreProductStatus.ACTIVE ||
    stockQuantity <=
      0
  ) {
    return "OUT_OF_STOCK";
  }


  if (
    lowStockThreshold >
      0 &&
    stockQuantity <=
      lowStockThreshold
  ) {
    return "LOW_STOCK";
  }


  return "IN_STOCK";
}


/* ==========================================================================
   14. STATUT PUBLIC
   ========================================================================== */

function resolvePublicStoreProductStatus(
  status:
    StoreProductStatus,
): PublicPanierValidatedItem[
  "status"
] |
  null {
  switch (
    status
  ) {
    case StoreProductStatus.ACTIVE:
      return "ACTIVE";


    case StoreProductStatus.OUT_OF_STOCK:
      return "OUT_OF_STOCK";


    case StoreProductStatus.HIDDEN:
    case StoreProductStatus.ARCHIVED:
    default:
      return null;
  }
}


/* ==========================================================================
   15. PROBLÈME DE LIGNE
   ========================================================================== */

function createIssue(
  storeProductId:
    string,

  requestedQuantity:
    number,

  code:
    PublicPanierItemIssue[
      "code"
    ],
): PublicPanierItemIssue {
  return {
    storeProductId,

    requestedQuantity,

    code,
  };
}


/* ==========================================================================
   16. RÉSOLUTION D'UNE LIGNE
   ========================================================================== */

function resolvePanierItem(
  row:
    PublicPanierRawStoreProduct,

  requestedQuantity:
    number,
): PublicPanierResolvedItem {
  const storeProductId =
    normalizeRequiredText(
      row.id,
    );


  /* ------------------------------------------------------------------------
     IDENTITÉ DE BASE
     ------------------------------------------------------------------------ */

  if (
    !storeProductId
  ) {
    return {
      item:
        null,

      issue:
        null,
    };
  }


  /* ------------------------------------------------------------------------
     PRODUCT / STORE PUBLICS
     ------------------------------------------------------------------------ */

  if (
    row.product.status !==
      ProductStatus.ACTIVE ||
    row.store.status !==
      StoreStatus.ACTIVE
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     STATUT STORE PRODUCT
     ------------------------------------------------------------------------ */

  const publicStatus =
    resolvePublicStoreProductStatus(
      row.status,
    );


  if (
    !publicStatus
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     DONNÉES PRODUIT
     ------------------------------------------------------------------------ */

  const productId =
    normalizeRequiredText(
      row.product.id,
    );


  const productName =
    normalizeRequiredText(
      row.product.name,
    );


  const productSlug =
    normalizeRequiredText(
      row.product.slug,
    );


  const productSku =
    normalizeRequiredText(
      row.product.sku,
    );


  if (
    !productId ||
    !productName ||
    !productSlug ||
    !productSku
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     BOUTIQUE
     ------------------------------------------------------------------------ */

  const storeId =
    normalizeRequiredText(
      row.store.id,
    );


  const storeName =
    normalizeRequiredText(
      row.store.name,
    );


  const storeCity =
    normalizeRequiredText(
      row.store.city,
    );


  const storeCountry =
    normalizeRequiredText(
      row.store.country,
    );


  if (
    !storeId ||
    !storeName ||
    !storeCity ||
    !storeCountry
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  if (
    !row.price.gt(
      0,
    )
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     DEVISE
     ------------------------------------------------------------------------ */

  const currency =
    normalizeCurrency(
      row.currency,
    );


  if (
    !currency
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     QR / ROUTE
     ------------------------------------------------------------------------ */

  const qrToken =
    normalizeRequiredText(
      row.qrToken,
    );


  if (
    !qrToken
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  const href =
    publicRouteBuilders
      .productByQr(
        qrToken,
      );


  /* ------------------------------------------------------------------------
     IMAGE
     ------------------------------------------------------------------------ */

  const image =
    getPublicPanierImage(
      row,
      productName,
    );


  if (
    !image
  ) {
    return {
      item:
        null,

      issue:
        createIssue(
          storeProductId,
          requestedQuantity,
          "OFFER_UNAVAILABLE",
        ),
    };
  }


  /* ------------------------------------------------------------------------
     STOCK
     ------------------------------------------------------------------------ */

  const stockQuantity =
    Math.max(
      0,
      Math.trunc(
        row.stockQuantity,
      ),
    );


  const lowStockThreshold =
    Math.max(
      0,
      Math.trunc(
        row.lowStockThreshold,
      ),
    );


  const availability =
    resolveAvailability(
      row.status,
      stockQuantity,
      lowStockThreshold,
    );


  /* ------------------------------------------------------------------------
     ÉTAT PANIER
     ------------------------------------------------------------------------ */

  let panierState:
    PublicPanierValidatedItem[
      "panierState"
    ];


  let issue:
    PublicPanierItemIssue |
    null =
      null;


  if (
    publicStatus ===
      "OUT_OF_STOCK" ||
    stockQuantity <=
      0
  ) {
    panierState =
      "OUT_OF_STOCK";


    issue =
      createIssue(
        storeProductId,
        requestedQuantity,
        "OUT_OF_STOCK",
      );
  } else if (
    requestedQuantity >
    stockQuantity
  ) {
    panierState =
      "INSUFFICIENT_STOCK";


    issue =
      createIssue(
        storeProductId,
        requestedQuantity,
        "INSUFFICIENT_STOCK",
      );
  } else {
    panierState =
      "AVAILABLE";
  }


  /* ------------------------------------------------------------------------
     SOUS-TOTAL DE LIGNE
     ------------------------------------------------------------------------ */

  const lineSubtotal =
    row.price
      .mul(
        requestedQuantity,
      )
      .toFixed(
        2,
      );


  /* ------------------------------------------------------------------------
     ITEM FINAL
     ------------------------------------------------------------------------ */

  const item:
    PublicPanierValidatedItem = {
      storeProductId,

      productId,

      name:
        productName,

      slug:
        productSlug,

      sku:
        productSku,

      image,

      href,

      unitPrice:
        row.price.toFixed(
          2,
        ),

      compareAtPrice:
        getValidCompareAtPrice(
          row.price,
          row.compareAtPrice,
        ),

      currency,

      quantity:
        requestedQuantity,

      availableQuantity:
        stockQuantity,

      availability,

      status:
        publicStatus,

      panierState,

      lineSubtotal,

      store: {
        id:
          storeId,

        name:
          storeName,

        city:
          storeCity,

        country:
          storeCountry,
      },
    };


  return {
    item,

    issue,
  };
}


/* ==========================================================================
   17. RÉSUMÉ PAR DEVISE
   ========================================================================== */

/**
 * Seules les lignes actuellement AVAILABLE participent aux montants
 * commandables.
 *
 * Une ligne OUT_OF_STOCK ou INSUFFICIENT_STOCK reste visible dans le Panier
 * mais ne gonfle jamais le total utilisable pour une future commande.
 */
function buildPanierSummary(
  items:
    readonly PublicPanierValidatedItem[],
): PublicPanierSummary {
  const availableItems =
    items.filter(
      (
        item,
      ) =>
        item.panierState ===
        "AVAILABLE",
    );


  const groups =
    new Map<
      string,
      {
        subtotal:
          Prisma.Decimal;

        itemCount:
          number;

        totalQuantity:
          number;
      }
    >();


  let totalQuantity =
    0;


  for (
    const item
    of availableItems
  ) {
    const current =
      groups.get(
        item.currency,
      );


    const lineSubtotal =
      new Prisma.Decimal(
        item.lineSubtotal,
      );


    if (
      current
    ) {
      current.subtotal =
        current.subtotal.plus(
          lineSubtotal,
        );

      current.itemCount +=
        1;

      current.totalQuantity +=
        item.quantity;
    } else {
      groups.set(
        item.currency,
        {
          subtotal:
            lineSubtotal,

          itemCount:
            1,

          totalQuantity:
            item.quantity,
        },
      );
    }


    totalQuantity +=
      item.quantity;
  }


  const subtotals:
    PublicPanierCurrencySubtotal[] =
      Array.from(
        groups.entries(),
      )
        .sort(
          (
            [currencyA],
            [currencyB],
          ) =>
            currencyA.localeCompare(
              currencyB,
            ),
        )
        .map(
          (
            [
              currency,
              data,
            ],
          ) => ({
            currency,

            subtotal:
              data.subtotal.toFixed(
                2,
              ),

            itemCount:
              data.itemCount,

            totalQuantity:
              data.totalQuantity,
          }),
        );


  const hasSingleCurrency =
    subtotals.length ===
    1;


  const hasMixedCurrencies =
    subtotals.length >
    1;


  const singleSubtotal =
    hasSingleCurrency
      ? subtotals[0] ??
        null
      : null;


  return {
    itemCount:
      availableItems.length,

    totalQuantity,

    subtotals,

    hasSingleCurrency,

    hasMixedCurrencies,

    singleCurrency:
      singleSubtotal
        ?.currency ??
      null,

    singleCurrencySubtotal:
      singleSubtotal
        ?.subtotal ??
      null,
  };
}


/* ==========================================================================
   18. SNAPSHOT VIDE
   ========================================================================== */

function buildEmptySnapshot(
  issues:
    readonly PublicPanierItemIssue[] =
      [],
): PublicPanierValidatedSnapshot {
  return {
    items:
      [],

    issues:
      [...issues],

    summary: {
      itemCount:
        0,

      totalQuantity:
        0,

      subtotals:
        [],

      hasSingleCurrency:
        false,

      hasMixedCurrencies:
        false,

      singleCurrency:
        null,

      singleCurrencySubtotal:
        null,
    },

    hasIssues:
      issues.length >
      0,

    hasItems:
      false,
  };
}


/* ==========================================================================
   19. ACTION SERVEUR PRINCIPALE
   ========================================================================== */

/**
 * Valide le Panier contre l'état ACTUEL de PostgreSQL.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette action fournit un snapshot d'affichage fiable au moment T.
 *
 * Elle ne constitue PAS encore une autorisation définitive de commande.
 *
 * Le futur checkout devra refaire cette validation dans son propre flux
 * transactionnel juste avant :
 *
 * - réservation de stock ;
 * - création de commande ;
 * - paiement.
 *
 * ============================================================================
 */
export async function validatePublicPanier(
  input:
    PublicPanierValidationInput,
): Promise<
  PublicPanierValidationResult
> {
  try {
    /* ----------------------------------------------------------------------
       1. VALIDATION RUNTIME
       ---------------------------------------------------------------------- */

    const normalizedInput =
      normalizeValidationInput(
        input,
      );


    if (
      !normalizedInput.success
    ) {
      return {
        success:
          false,

        code:
          "INVALID_INPUT",
      };
    }


    const {
      intents,
      issues:
        inputIssues,
    } =
      normalizedInput.data;


    /* ----------------------------------------------------------------------
       2. PANIER SANS OFFRE À CHARGER
       ---------------------------------------------------------------------- */

    if (
      intents.length ===
      0
    ) {
      return {
        success:
          true,

        data:
          buildEmptySnapshot(
            inputIssues,
          ),
      };
    }


    /* ----------------------------------------------------------------------
       3. CHARGEMENT DES OFFRES
       ---------------------------------------------------------------------- */

    const storeProductIds =
      intents.map(
        (
          item,
        ) =>
          item.storeProductId,
      );


    const rows =
      await queryStoreProducts(
        storeProductIds,
      );


    /* ----------------------------------------------------------------------
       4. INDEX DES RÉSULTATS
       ---------------------------------------------------------------------- */

    const rowsById =
      new Map<
        string,
        PublicPanierRawStoreProduct
      >();


    for (
      const row
      of rows
    ) {
      rowsById.set(
        row.id,
        row,
      );
    }


    /* ----------------------------------------------------------------------
       5. RÉSOLUTION DANS L'ORDRE DU PANIER
       ---------------------------------------------------------------------- */

    const validatedItems:
      PublicPanierValidatedItem[] =
        [];


    const issues:
      PublicPanierItemIssue[] =
        [
          ...inputIssues,
        ];


    for (
      const intent
      of intents
    ) {
      const row =
        rowsById.get(
          intent.storeProductId,
        );


      /* --------------------------------------------------------------------
         OFFRE ABSENTE
         -------------------------------------------------------------------- */

      if (
        !row
      ) {
        issues.push(
          createIssue(
            intent.storeProductId,
            intent.quantity,
            "OFFER_NOT_FOUND",
          ),
        );


        continue;
      }


      /* --------------------------------------------------------------------
         VALIDATION DE L'OFFRE
         -------------------------------------------------------------------- */

      const resolved =
        resolvePanierItem(
          row,
          intent.quantity,
        );


      if (
        resolved.item
      ) {
        validatedItems.push(
          resolved.item,
        );
      }


      if (
        resolved.issue
      ) {
        issues.push(
          resolved.issue,
        );
      }
    }


    /* ----------------------------------------------------------------------
       6. RÉSUMÉ COMMERCIAL
       ---------------------------------------------------------------------- */

    const summary =
      buildPanierSummary(
        validatedItems,
      );


    /* ----------------------------------------------------------------------
       7. SNAPSHOT FINAL
       ---------------------------------------------------------------------- */

    const snapshot:
      PublicPanierValidatedSnapshot = {
        items:
          validatedItems,

        issues,

        summary,

        hasIssues:
          issues.length >
          0,

        hasItems:
          validatedItems.length >
          0,
      };


    return {
      success:
        true,

      data:
        snapshot,
    };
  } catch {
    /**
     * Aucun détail Prisma / PostgreSQL n'est exposé au navigateur.
     */
    return {
      success:
        false,

      code:
        "SERVER_ERROR",
    };
  }
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * FLUX :
 *
 * Browser
 *
 * [
 *   {
 *     storeProductId,
 *     quantity
 *   }
 * ]
 *
 *                ↓
 *
 * validatePublicPanier()
 *
 *                ↓
 *
 * PostgreSQL
 *
 * StoreProduct
 * Product
 * Store
 * ProductImage
 *
 *                ↓
 *
 * validation :
 *
 * Product ACTIVE
 *
 * +
 *
 * Store ACTIVE
 *
 * +
 *
 * StoreProduct ACTIVE / OUT_OF_STOCK
 *
 * +
 *
 * prix actuel
 *
 * +
 *
 * devise actuelle
 *
 * +
 *
 * stock actuel
 *
 * +
 *
 * quantité demandée
 *
 *                ↓
 *
 * PublicPanierValidatedSnapshot
 *
 * ============================================================================
 *
 * OUT_OF_STOCK :
 *
 * la ligne peut rester visible dans le Panier,
 * mais elle n'entre pas dans le total commandable.
 *
 * ============================================================================
 *
 * INSUFFICIENT_STOCK :
 *
 * la ligne peut rester visible afin que la cliente puisse corriger
 * sa quantité,
 * mais elle n'entre pas dans le total commandable.
 *
 * ============================================================================
 *
 * HIDDEN / ARCHIVED :
 *
 * aucune donnée commerciale n'est exposée dans les items.
 *
 * issue = OFFER_UNAVAILABLE
 *
 * ============================================================================
 *
 * PRODUCT / STORE INACTIF :
 *
 * aucune ligne commandable.
 *
 * ============================================================================
 *
 * MULTI-DEVISE :
 *
 * les totaux sont regroupés séparément :
 *
 * XAF
 * XOF
 * EUR
 * USD
 *
 * Aucune addition aveugle entre devises.
 *
 * ============================================================================
 *
 * CETTE ACTION NE :
 *
 * - modifie aucun stock ;
 * - réserve aucun stock ;
 * - crée aucune commande ;
 * - crée aucun paiement ;
 * - crée aucun mouvement de stock ;
 * - écrit aucun prix depuis le navigateur ;
 * - écrit aucune devise depuis le navigateur ;
 * - crée aucun modèle Cart artificiel.
 *
 * ============================================================================
 */