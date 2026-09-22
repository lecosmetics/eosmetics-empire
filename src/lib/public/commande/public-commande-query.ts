import "server-only";

import type {
  Prisma,
} from "@prisma/client";

import {
  publicCommandePanierInputSchema,
} from "@/lib/public/commande/public-commande-schema";

import type {
  PublicCommandeAvailability,
  PublicCommandeCurrencySubtotal,
  PublicCommandeItemIssue,
  PublicCommandeItemIssueCode,
  PublicCommandeItemState,
  PublicCommandeLoadResult,
  PublicCommandePanierInput,
  PublicCommandePanierItemInput,
  PublicCommandeProductImage,
  PublicCommandeSnapshot,
  PublicCommandeStore,
  PublicCommandeValidatedItem,
} from "@/lib/public/commande/public-commande-types";

import {
  db,
} from "@/prisma/db";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE â€” REQUÃŠTE CHECKOUT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-commande-query.ts
 *
 * ============================================================================
 *
 * RÃ”LE :
 *
 * Recharger cÃ´tÃ© serveur le contenu rÃ©el d'un Panier avant toute
 * prÃ©paration de commande.
 *
 * ============================================================================
 *
 * ENTRÃ‰E NAVIGATEUR AUTORISÃ‰E :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * LE SERVEUR RELIT ENSUITE :
 *
 * StoreProduct :
 *
 * - id ;
 * - productId ;
 * - storeId ;
 * - qrToken ;
 * - price ;
 * - currency ;
 * - stockQuantity ;
 * - lowStockThreshold ;
 * - status.
 *
 * Product :
 *
 * - id ;
 * - name ;
 * - sku ;
 * - status ;
 * - image.
 *
 * Store :
 *
 * - id ;
 * - name ;
 * - city ;
 * - country ;
 * - status.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le navigateur ne constitue jamais la source de vÃ©ritÃ© pour :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - disponibilitÃ© ;
 * - boutique ;
 * - image ;
 * - nom produit ;
 * - sous-total.
 *
 * ============================================================================
 *
 * CE FICHIER NE :
 *
 * - crÃ©e aucune commande ;
 * - crÃ©e aucun Customer ;
 * - crÃ©e aucune Address ;
 * - rÃ©serve aucun stock ;
 * - dÃ©crÃ©mente aucun stock ;
 * - crÃ©e aucun paiement ;
 * - crÃ©e aucune livraison ;
 * - calcule aucun frais de livraison ;
 * - gÃ©nÃ¨re aucun reÃ§u ;
 * - envoie aucun e-mail ;
 * - lit aucune session Gestionnaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. STATUTS PUBLICS CONFIRMÃ‰S
   ========================================================================== */

/**
 * On utilise volontairement les littÃ©raux confirmÃ©s dans le schÃ©ma Prisma.
 *
 * Cela Ã©vite d'ajouter ici une dÃ©pendance runtime inutile aux enums Prisma.
 */

const ACTIVE_PRODUCT_STATUS =
  "ACTIVE" as const;


const ACTIVE_STORE_STATUS =
  "ACTIVE" as const;


const ACTIVE_STORE_PRODUCT_STATUS =
  "ACTIVE" as const;


const OUT_OF_STOCK_STORE_PRODUCT_STATUS =
  "OUT_OF_STOCK" as const;


/* ==========================================================================
   2. SELECT PRISMA
   ========================================================================== */

/**
 * Une seule requÃªte permet de rÃ©cupÃ©rer toutes les informations utiles
 * pour chaque StoreProduct demandÃ©.
 *
 * Les images sont limitÃ©es Ã  une image principale exploitable pour
 * l'affichage du checkout.
 */
const PUBLIC_COMMANDE_STORE_PRODUCT_SELECT = {
  id:
    true,

  storeId:
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

  status:
    true,

  qrToken:
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

      images: {
        select: {
          url:
            true,

          altText:
            true,

          position:
            true,

          isPrimary:
            true,

          createdAt:
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
} satisfies Prisma.StoreProductSelect;


/**
 * Type strictement dÃ©rivÃ© du select.
 *
 * Cela Ã©vite les :
 *
 * implicit any
 *
 * dans les transformations plus bas.
 */
type PublicCommandeStoreProductRow =
  Prisma.StoreProductGetPayload<{
    select:
      typeof PUBLIC_COMMANDE_STORE_PRODUCT_SELECT;
  }>;


/* ==========================================================================
   3. INPUT NORMALISÃ‰ INTERNE
   ========================================================================== */

interface NormalizedPanierItem {
  readonly storeProductId:
    string;

  readonly quantity:
    number;
}


/* ==========================================================================
   4. NORMALISATION TEXTE
   ========================================================================== */

function normalizeRequiredText(
  value:
    string,
): string {
  return value.trim();
}


function normalizeCurrency(
  value:
    string,
): string {
  return value
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   5. VALIDATION DEVISE
   ========================================================================== */

/**
 * Le checkout accepte ici un code monÃ©taire composÃ© de trois lettres.
 *
 * Exemples :
 *
 * XAF
 * XOF
 * EUR
 * USD
 *
 * Ce helper ne fait aucune conversion monÃ©taire.
 */
function isValidCurrencyCode(
  currency:
    string,
): boolean {
  return /^[A-Z]{3}$/u.test(
    currency,
  );
}


/* ==========================================================================
   6. DECIMAL â†’ UNITÃ‰S MINEURES
   ========================================================================== */

/**
 * Les prix Prisma sont Decimal(12, 2).
 *
 * On Ã©vite Number() pour les additions financiÃ¨res.
 *
 * Exemple :
 *
 * "12900.50"
 *
 * devient :
 *
 * 129005BigInt(0)
 */
function decimalAmountToMinorUnits(
  value:
    string,
): bigint | null {
  const normalized =
    value.trim();


  const match =
    /^([+-]?)(\d+)(?:\.(\d{1,2}))?$/u.exec(
      normalized,
    );


  if (
    !match
  ) {
    return null;
  }


  const sign =
    match[1] ===
    "-"
      ? BigInt(-1)
      : BigInt(1);


  const integerPart =
    match[2];


  const fractionPart =
    (
      match[3] ??
      ""
    )
      .padEnd(
        2,
        "0",
      )
      .slice(
        0,
        2,
      );


  try {
    return sign *
      (
        BigInt(
          integerPart,
        ) *
          BigInt(100) +
        BigInt(
          fractionPart ||
            "0",
        )
      );
  } catch {
    return null;
  }
}


/* ==========================================================================
   7. UNITÃ‰S MINEURES â†’ DECIMAL
   ========================================================================== */

function minorUnitsToDecimalAmount(
  value:
    bigint,
): string {
  const negative =
    value <
    BigInt(0);


  const absolute =
    negative
      ? -value
      : value;


  const integerPart =
    absolute /
    BigInt(100);


  const fractionPart =
    (
      absolute %
      BigInt(100)
    )
      .toString()
      .padStart(
        2,
        "0",
      );


  const prefix =
    negative
      ? "-"
      : "";


  return `${prefix}${integerPart.toString()}.${fractionPart}`;
}


/* ==========================================================================
   8. PRIX POSITIF
   ========================================================================== */

function isPositiveMoneyAmount(
  amount:
    string,
): boolean {
  const minorUnits =
    decimalAmountToMinorUnits(
      amount,
    );


  return (
    minorUnits !==
      null &&
    minorUnits >
      BigInt(0)
  );
}


/* ==========================================================================
   9. NORMALISATION DU PANIER
   ========================================================================== */

/**
 * Le Provider du Panier devrait normalement conserver une seule ligne
 * par StoreProduct.
 *
 * Le serveur ne dÃ©pend cependant pas de cette hypothÃ¨se.
 *
 * Si le mÃªme StoreProduct est envoyÃ© plusieurs fois :
 *
 * - les quantitÃ©s sont regroupÃ©es ;
 * - l'ordre de la premiÃ¨re occurrence est conservÃ©.
 *
 * Aucun prix n'est lu depuis le navigateur.
 */
function normalizePanierItems(
  items:
    readonly PublicCommandePanierItemInput[],
): readonly NormalizedPanierItem[] | null {
  const quantities =
    new Map<
      string,
      number
    >();


  const order:
    string[] =
      [];


  for (
    const item of
    items
  ) {
    const storeProductId =
      item.storeProductId.trim();


    if (
      !storeProductId
    ) {
      return null;
    }


    if (
      !Number.isSafeInteger(
        item.quantity,
      ) ||
      item.quantity <=
        0
    ) {
      return null;
    }


    const previousQuantity =
      quantities.get(
        storeProductId,
      ) ??
      0;


    const nextQuantity =
      previousQuantity +
      item.quantity;


    if (
      !Number.isSafeInteger(
        nextQuantity,
      ) ||
      nextQuantity <=
        0
    ) {
      return null;
    }


    if (
      !quantities.has(
        storeProductId,
      )
    ) {
      order.push(
        storeProductId,
      );
    }


    quantities.set(
      storeProductId,
      nextQuantity,
    );
  }


  return order.map(
    (
      storeProductId,
    ) => ({
      storeProductId,

      quantity:
        quantities.get(
          storeProductId,
        ) ??
        0,
    }),
  );
}


/* ==========================================================================
   10. DISPONIBILITÃ‰ DU STOCK
   ========================================================================== */

function getAvailability(
  stockQuantity:
    number,

  lowStockThreshold:
    number,
): PublicCommandeAvailability {
  if (
    stockQuantity <=
    0
  ) {
    return "OUT_OF_STOCK";
  }


  const normalizedThreshold =
    Math.max(
      0,
      lowStockThreshold,
    );


  if (
    stockQuantity <=
    normalizedThreshold
  ) {
    return "LOW_STOCK";
  }


  return "AVAILABLE";
}


/* ==========================================================================
   11. IMAGE PRINCIPALE
   ========================================================================== */

function getPrimaryImage(
  row:
    PublicCommandeStoreProductRow,
): PublicCommandeProductImage | null {
  const image =
    row.product.images[
      0
    ] ??
    null;


  if (
    image ===
    null
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


  const altText =
    image.altText?.trim() ||
    null;


  return {
    url,

    altText,
  };
}


/* ==========================================================================
   12. BOUTIQUE
   ========================================================================== */

function buildStore(
  row:
    PublicCommandeStoreProductRow,
): PublicCommandeStore {
  return {
    id:
      row.store.id,

    name:
      normalizeRequiredText(
        row.store.name,
      ),

    city:
      normalizeRequiredText(
        row.store.city,
      ),

    country:
      normalizeRequiredText(
        row.store.country,
      ),
  };
}


/* ==========================================================================
   13. VALIDITÃ‰ STRUCTURELLE D'UNE OFFRE
   ========================================================================== */

/**
 * Une offre doit possÃ©der suffisamment d'informations pour Ãªtre utilisÃ©e
 * dans un checkout rÃ©el.
 */
function hasValidCommercialData(
  row:
    PublicCommandeStoreProductRow,
): boolean {
  const productName =
    normalizeRequiredText(
      row.product.name,
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


  const qrToken =
    normalizeRequiredText(
      row.qrToken,
    );


  const currency =
    normalizeCurrency(
      row.currency,
    );


  const unitPrice =
    row.price.toFixed(
      2,
    );


  return (
    productName.length >
      0 &&
    storeName.length >
      0 &&
    storeCity.length >
      0 &&
    storeCountry.length >
      0 &&
    qrToken.length >
      0 &&
    isValidCurrencyCode(
      currency,
    ) &&
    isPositiveMoneyAmount(
      unitPrice,
    )
  );
}


/* ==========================================================================
   14. Ã‰TAT DE LA LIGNE
   ========================================================================== */

function getItemState(
  row:
    PublicCommandeStoreProductRow,

  requestedQuantity:
    number,
): PublicCommandeItemState {
  /**
   * Product non public.
   */
  if (
    row.product.status !==
    ACTIVE_PRODUCT_STATUS
  ) {
    return "UNAVAILABLE";
  }


  /**
   * Boutique non active.
   */
  if (
    row.store.status !==
    ACTIVE_STORE_STATUS
  ) {
    return "UNAVAILABLE";
  }


  /**
   * Offre cachÃ©e / archivÃ©e / autre Ã©tat non commercialisable.
   */
  if (
    row.status !==
      ACTIVE_STORE_PRODUCT_STATUS &&
    row.status !==
      OUT_OF_STOCK_STORE_PRODUCT_STATUS
  ) {
    return "UNAVAILABLE";
  }


  /**
   * DonnÃ©es commerciales incohÃ©rentes.
   */
  if (
    !hasValidCommercialData(
      row,
    )
  ) {
    return "UNAVAILABLE";
  }


  /**
   * Le statut OUT_OF_STOCK fait foi mÃªme si une donnÃ©e stock incohÃ©rente
   * indique encore une quantitÃ© positive.
   */
  if (
    row.status ===
      OUT_OF_STOCK_STORE_PRODUCT_STATUS ||
    row.stockQuantity <=
      0
  ) {
    return "OUT_OF_STOCK";
  }


  if (
    requestedQuantity >
    row.stockQuantity
  ) {
    return "INSUFFICIENT_STOCK";
  }


  return "AVAILABLE";
}


/* ==========================================================================
   15. CODE D'ERREUR DE LIGNE
   ========================================================================== */

function getItemIssueCode(
  state:
    PublicCommandeItemState,
): PublicCommandeItemIssueCode | null {
  switch (
    state
  ) {
    case "UNAVAILABLE":
      return "OFFER_UNAVAILABLE";

    case "OUT_OF_STOCK":
      return "OUT_OF_STOCK";

    case "INSUFFICIENT_STOCK":
      return "INSUFFICIENT_STOCK";

    case "AVAILABLE":
    default:
      return null;
  }
}


/* ==========================================================================
   16. MESSAGE D'ERREUR DE LIGNE
   ========================================================================== */

function getItemIssueMessage(
  code:
    PublicCommandeItemIssueCode,
): string {
  switch (
    code
  ) {
    case "OFFER_NOT_FOUND":
      return "Cet article nâ€™existe plus dans le catalogue.";

    case "OFFER_UNAVAILABLE":
      return "Cet article nâ€™est plus disponible Ã  la commande.";

    case "OUT_OF_STOCK":
      return "Cet article est actuellement en rupture de stock.";

    case "INSUFFICIENT_STOCK":
      return "La quantitÃ© demandÃ©e dÃ©passe le stock actuellement disponible.";

    case "INVALID_QUANTITY":
      return "La quantitÃ© demandÃ©e pour cet article nâ€™est pas valide.";

    default:
      return "Cet article ne peut pas Ãªtre commandÃ© actuellement.";
  }
}


/* ==========================================================================
   17. CONSTRUCTION D'UNE ISSUE
   ========================================================================== */

function createItemIssue(
  storeProductId:
    string,

  code:
    PublicCommandeItemIssueCode,
): PublicCommandeItemIssue {
  return {
    storeProductId,

    code,

    message:
      getItemIssueMessage(
        code,
      ),
  };
}


/* ==========================================================================
   18. CONSTRUCTION D'UNE LIGNE VALIDÃ‰E
   ========================================================================== */

function buildValidatedItem(
  row:
    PublicCommandeStoreProductRow,

  requestedQuantity:
    number,
): PublicCommandeValidatedItem {
  const state =
    getItemState(
      row,
      requestedQuantity,
    );


  const currency =
    normalizeCurrency(
      row.currency,
    );


  const unitPriceAmount =
    row.price.toFixed(
      2,
    );


  /**
   * Le Decimal Prisma reste cÃ´tÃ© serveur.
   *
   * Aucun Decimal n'est exposÃ© au composant.
   */
  const subtotalAmount =
    row.price
      .mul(
        requestedQuantity,
      )
      .toFixed(
        2,
      );


  return {
    storeProductId:
      row.id,

    productId:
      row.product.id,

    qrToken:
      row.qrToken.trim(),

    name:
      row.product.name.trim(),

    sku:
      row.product.sku?.trim() ||
      null,

    image:
      getPrimaryImage(
        row,
      ),

    quantity:
      requestedQuantity,

    availableQuantity:
      Math.max(
        0,
        row.stockQuantity,
      ),

    availability:
      getAvailability(
        row.stockQuantity,
        row.lowStockThreshold,
      ),

    state,

    unitPrice: {
      amount:
        unitPriceAmount,

      currency,
    },

    subtotal: {
      amount:
        subtotalAmount,

      currency,
    },

    store:
      buildStore(
        row,
      ),
  };
}


/* ==========================================================================
   19. SOMME DES QUANTITÃ‰S
   ========================================================================== */

function getTotalRequestedQuantity(
  items:
    readonly NormalizedPanierItem[],
): number | null {
  let total =
    0;


  for (
    const item of
    items
  ) {
    const nextTotal =
      total +
      item.quantity;


    if (
      !Number.isSafeInteger(
        nextTotal,
      )
    ) {
      return null;
    }


    total =
      nextTotal;
  }


  return total;
}


/* ==========================================================================
   20. SOUS-TOTAUX PAR DEVISE
   ========================================================================== */

/**
 * Les sous-totaux sont calculÃ©s uniquement Ã  partir des lignes rÃ©ellement
 * commandables.
 *
 * Une ligne :
 *
 * - indisponible ;
 * - en rupture ;
 * - avec quantitÃ© insuffisante
 *
 * n'est jamais incorporÃ©e silencieusement dans un total exploitable.
 */
function buildCurrencySubtotals(
  items:
    readonly PublicCommandeValidatedItem[],
): readonly PublicCommandeCurrencySubtotal[] {
  const totals =
    new Map<
      string,
      bigint
    >();


  for (
    const item of
    items
  ) {
    if (
      item.state !==
      "AVAILABLE"
    ) {
      continue;
    }


    const amount =
      decimalAmountToMinorUnits(
        item.subtotal.amount,
      );


    if (
      amount ===
      null
    ) {
      continue;
    }


    const currency =
      normalizeCurrency(
        item.subtotal.currency,
      );


    const previous =
      totals.get(
        currency,
      ) ??
      BigInt(0);


    totals.set(
      currency,
      previous +
        amount,
    );
  }


  return Array
    .from(
      totals.entries(),
    )
    .sort(
      (
        left,
        right,
      ) =>
        left[0].localeCompare(
          right[0],
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
          minorUnitsToDecimalAmount(
            amount,
          ),
      }),
    );
}


/* ==========================================================================
   21. IDS BOUTIQUES UNIQUES
   ========================================================================== */

function getUniqueStoreIds(
  items:
    readonly PublicCommandeValidatedItem[],
): readonly string[] {
  const storeIds =
    new Set<string>();


  for (
    const item of
    items
  ) {
    storeIds.add(
      item.store.id,
    );
  }


  return Array.from(
    storeIds,
  );
}


/* ==========================================================================
   22. DEVISES UNIQUES
   ========================================================================== */

function getUniqueCurrencies(
  items:
    readonly PublicCommandeValidatedItem[],
): readonly string[] {
  const currencies =
    new Set<string>();


  for (
    const item of
    items
  ) {
    const currency =
      normalizeCurrency(
        item.unitPrice.currency,
      );


    if (
      isValidCurrencyCode(
        currency,
      )
    ) {
      currencies.add(
        currency,
      );
    }
  }


  return Array.from(
    currencies,
  );
}


/* ==========================================================================
   23. PANIER VIDE BRUT
   ========================================================================== */

function isClearlyEmptyPanier(
  input:
    unknown,
): boolean {
  if (
    typeof input !==
      "object" ||
    input ===
      null ||
    Array.isArray(
      input,
    )
  ) {
    return false;
  }


  const record =
    input as Record<
      string,
      unknown
    >;


  return (
    Array.isArray(
      record.items,
    ) &&
    record.items.length ===
      0
  );
}


/* ==========================================================================
   24. CHARGEMENT PRINCIPAL
   ========================================================================== */

/**
 * Fonction principale du fichier.
 *
 * ============================================================================
 *
 * Exemple :
 *
 * const result =
 *   await loadPublicCommandeSnapshot({
 *     items: [
 *       {
 *         storeProductId: "...",
 *         quantity: 2,
 *       },
 *     ],
 *   });
 *
 * ============================================================================
 *
 * RÃ©sultat :
 *
 * succÃ¨s :
 *
 * {
 *   success: true,
 *   data: PublicCommandeSnapshot
 * }
 *
 * Ã©chec global :
 *
 * {
 *   success: false,
 *   code: "...",
 *   message: "..."
 * }
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Une offre absente / indisponible ne produit pas nÃ©cessairement
 * une erreur serveur globale.
 *
 * Elle est reprÃ©sentÃ©e dans :
 *
 * snapshot.issues
 *
 * afin que l'interface puisse expliquer prÃ©cisÃ©ment le problÃ¨me.
 */
export async function loadPublicCommandeSnapshot(
  input:
    unknown,
): Promise<PublicCommandeLoadResult> {
  try {
    /* =======================================================================
       PANIER VIDE
       ======================================================================= */

    if (
      isClearlyEmptyPanier(
        input,
      )
    ) {
      return {
        success:
          false,

        code:
          "EMPTY_PANIER",

        message:
          "Votre panier est vide.",
      };
    }


    /* =======================================================================
       VALIDATION RUNTIME
       ======================================================================= */

    const parsedInput =
      publicCommandePanierInputSchema.safeParse(
        input,
      );


    if (
      !parsedInput.success
    ) {
      return {
        success:
          false,

        code:
          "INVALID_INPUT",

        message:
          "Le contenu du panier nâ€™est pas valide.",
      };
    }


    /* =======================================================================
       NORMALISATION
       ======================================================================= */

    const normalizedItems =
      normalizePanierItems(
        parsedInput.data.items,
      );


    if (
      normalizedItems ===
        null
    ) {
      return {
        success:
          false,

        code:
          "INVALID_INPUT",

        message:
          "Le contenu du panier nâ€™est pas valide.",
      };
    }


    if (
      normalizedItems.length ===
      0
    ) {
      return {
        success:
          false,

        code:
          "EMPTY_PANIER",

        message:
          "Votre panier est vide.",
      };
    }


    const totalRequestedQuantity =
      getTotalRequestedQuantity(
        normalizedItems,
      );


    if (
      totalRequestedQuantity ===
      null
    ) {
      return {
        success:
          false,

        code:
          "INVALID_INPUT",

        message:
          "Les quantitÃ©s du panier ne sont pas valides.",
      };
    }


    /* =======================================================================
       IDS
       ======================================================================= */

    const storeProductIds =
      normalizedItems.map(
        (
          item,
        ) =>
          item.storeProductId,
      );


    /* =======================================================================
       REQUÃŠTE PRISMA UNIQUE
       ======================================================================= */

    /**
     * IMPORTANT :
     *
     * On ne filtre volontairement PAS ici :
     *
     * Product.status
     * Store.status
     * StoreProduct.status
     * stockQuantity
     *
     * Sinon une offre devenue indisponible disparaÃ®trait complÃ¨tement
     * et nous ne pourrions plus expliquer correctement la raison Ã 
     * la cliente.
     */
    const rows =
      await db.storeProduct.findMany({
        where: {
          id: {
            in:
              storeProductIds,
          },
        },

        select:
          PUBLIC_COMMANDE_STORE_PRODUCT_SELECT,
      });


    /* =======================================================================
       INDEX DB
       ======================================================================= */

    const rowById =
      new Map<
        string,
        PublicCommandeStoreProductRow
      >();


    for (
      const row of
      rows
    ) {
      rowById.set(
        row.id,
        row,
      );
    }


    /* =======================================================================
       SNAPSHOT
       ======================================================================= */

    const validatedItems:
      PublicCommandeValidatedItem[] =
        [];


    const issues:
      PublicCommandeItemIssue[] =
        [];


    /* =======================================================================
       ORDRE DU PANIER CONSERVÃ‰
       ======================================================================= */

    for (
      const requestedItem of
      normalizedItems
    ) {
      const row =
        rowById.get(
          requestedItem.storeProductId,
        );


      /**
       * Offre supprimÃ©e / inexistante.
       */
      if (
        !row
      ) {
        issues.push(
          createItemIssue(
            requestedItem.storeProductId,
            "OFFER_NOT_FOUND",
          ),
        );


        continue;
      }


      const validatedItem =
        buildValidatedItem(
          row,
          requestedItem.quantity,
        );


      validatedItems.push(
        validatedItem,
      );


      const issueCode =
        getItemIssueCode(
          validatedItem.state,
        );


      if (
        issueCode
      ) {
        issues.push(
          createItemIssue(
            requestedItem.storeProductId,
            issueCode,
          ),
        );
      }
    }


    /* =======================================================================
       MÃ‰TADONNÃ‰ES
       ======================================================================= */

    const storeIds =
      getUniqueStoreIds(
        validatedItems,
      );


    const currencies =
      getUniqueCurrencies(
        validatedItems,
      );


    const subtotals =
      buildCurrencySubtotals(
        validatedItems,
      );


    const allItemsAvailable =
      issues.length ===
        0 &&
      validatedItems.length ===
        normalizedItems.length &&
      validatedItems.length >
        0 &&
      validatedItems.every(
        (
          item,
        ) =>
          item.state ===
          "AVAILABLE",
      );


    /* =======================================================================
       RÃ‰SULTAT
       ======================================================================= */

    const snapshot:
      PublicCommandeSnapshot =
        {
          items:
            validatedItems,

          issues,

          /**
           * Nombre de rÃ©fÃ©rences distinctes demandÃ©es.
           *
           * Une rÃ©fÃ©rence introuvable reste une ligne du Panier demandÃ©.
           */
          itemCount:
            normalizedItems.length,

          /**
           * Somme des quantitÃ©s demandÃ©es.
           */
          totalQuantity:
            totalRequestedQuantity,

          storeIds,

          currencies,

          subtotals,

          allItemsAvailable,
        };


    return {
      success:
        true,

      data:
        snapshot,
    };
  } catch {
    /**
     * Aucun dÃ©tail :
     *
     * - Prisma ;
     * - PostgreSQL ;
     * - stack trace ;
     * - infrastructure
     *
     * n'est exposÃ© au navigateur.
     */
    return {
      success:
        false,

      code:
        "SERVER_ERROR",

      message:
        "Impossible de vÃ©rifier votre panier actuellement. RÃ©essayez dans quelques instants.",
    };
  }
}


/* ==========================================================================
   25. VERSION TYPÃ‰E
   ========================================================================== */

/**
 * Helper lorsqu'un appelant possÃ¨de dÃ©jÃ  :
 *
 * PublicCommandePanierInput
 *
 * On conserve malgrÃ© tout la validation runtime dans la fonction principale.
 */
export async function loadPublicCommandeSnapshotFromTypedInput(
  input:
    PublicCommandePanierInput,
): Promise<PublicCommandeLoadResult> {
  return loadPublicCommandeSnapshot(
    input,
  );
}


/* ==========================================================================
   26. SNAPSHOT STRICTEMENT COMMANDABLE
   ========================================================================== */

/**
 * Retourne directement le snapshot uniquement lorsque toutes les lignes
 * sont actuellement commandables.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette fonction reste une vÃ©rification ponctuelle.
 *
 * Elle ne constitue PAS :
 *
 * - une rÃ©servation de stock ;
 * - une garantie que le stock sera encore identique une seconde plus tard ;
 * - une autorisation de paiement.
 *
 * public-commande-actions.ts devra refaire la validation critique au moment
 * de prÃ©parer rÃ©ellement le checkout.
 */
export async function loadAvailablePublicCommandeSnapshot(
  input:
    unknown,
): Promise<
  PublicCommandeSnapshot |
  null
> {
  const result =
    await loadPublicCommandeSnapshot(
      input,
    );


  if (
    !result.success
  ) {
    return null;
  }


  if (
    !result.data.allItemsAvailable
  ) {
    return null;
  }


  return result.data;
}


/* ==========================================================================
   27. DÃ‰TECTION MULTI-BOUTIQUE
   ========================================================================== */

/**
 * Le schÃ©ma Order actuel appartient Ã  une boutique.
 *
 * Ce helper permet aux couches suivantes de savoir si le Panier contient
 * plusieurs boutiques.
 *
 * Aucune stratÃ©gie de split-order n'est exÃ©cutÃ©e dans cette requÃªte.
 */
export function isPublicCommandeMultiStoreSnapshot(
  snapshot:
    PublicCommandeSnapshot,
): boolean {
  return snapshot.storeIds.length >
    1;
}


/* ==========================================================================
   28. DÃ‰TECTION MULTI-DEVISE
   ========================================================================== */

/**
 * Aucun taux de change n'est inventÃ©.
 *
 * Si plusieurs devises sont prÃ©sentes, les couches suivantes doivent
 * explicitement gÃ©rer ou refuser cette situation.
 */
export function isPublicCommandeMultiCurrencySnapshot(
  snapshot:
    PublicCommandeSnapshot,
): boolean {
  return snapshot.currencies.length >
    1;
}


/* ==========================================================================
   29. DEVISE UNIQUE
   ========================================================================== */

export function getPublicCommandeSingleCurrency(
  snapshot:
    PublicCommandeSnapshot,
): string | null {
  if (
    snapshot.currencies.length !==
    1
  ) {
    return null;
  }


  return snapshot.currencies[
    0
  ] ??
    null;
}


/* ==========================================================================
   30. BOUTIQUE UNIQUE
   ========================================================================== */

export function getPublicCommandeSingleStoreId(
  snapshot:
    PublicCommandeSnapshot,
): string | null {
  if (
    snapshot.storeIds.length !==
    1
  ) {
    return null;
  }


  return snapshot.storeIds[
    0
  ] ??
    null;
}


/* ==========================================================================
   31. SOUS-TOTAL UNIQUE
   ========================================================================== */

/**
 * Retourne le sous-total uniquement lorsque le snapshot possÃ¨de exactement
 * une devise.
 *
 * Aucun total multi-devise n'est fabriquÃ©.
 */
export function getPublicCommandeSingleSubtotal(
  snapshot:
    PublicCommandeSnapshot,
): PublicCommandeCurrencySubtotal | null {
  if (
    snapshot.subtotals.length !==
    1
  ) {
    return null;
  }


  return snapshot.subtotals[
    0
  ] ??
    null;
}


/* ==========================================================================
   32. VÃ‰RIFICATION D'UN SNAPSHOT UTILISABLE
   ========================================================================== */

/**
 * ContrÃ´le pratique avant le calcul de livraison ou la prÃ©paration
 * du checkout.
 *
 * ============================================================================
 *
 * Un snapshot est utilisable lorsque :
 *
 * - au moins une ligne existe ;
 * - aucune issue n'existe ;
 * - toutes les lignes sont disponibles ;
 * - toutes les quantitÃ©s sont positives ;
 * - tous les prix sont positifs ;
 * - toutes les devises sont valides.
 */
export function isPublicCommandeSnapshotUsable(
  snapshot:
    PublicCommandeSnapshot,
): boolean {
  if (
    snapshot.items.length ===
      0 ||
    snapshot.issues.length >
      0 ||
    !snapshot.allItemsAvailable
  ) {
    return false;
  }


  for (
    const item of
    snapshot.items
  ) {
    if (
      !Number.isSafeInteger(
        item.quantity,
      ) ||
      item.quantity <=
        0
    ) {
      return false;
    }


    if (
      item.availableQuantity <
      item.quantity
    ) {
      return false;
    }


    if (
      item.state !==
      "AVAILABLE"
    ) {
      return false;
    }


    if (
      !isValidCurrencyCode(
        normalizeCurrency(
          item.unitPrice.currency,
        ),
      )
    ) {
      return false;
    }


    if (
      !isPositiveMoneyAmount(
        item.unitPrice.amount,
      )
    ) {
      return false;
    }


    if (
      !isPositiveMoneyAmount(
        item.subtotal.amount,
      )
    ) {
      return false;
    }
  }


  return true;
}


/* ==========================================================================
   33. DOCUMENTATION DU FLUX
   ========================================================================== */

/**
 * ============================================================================
 *
 * NAVIGATEUR
 *
 * localStorage
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 *                 â†“
 *
 * publicCommandePanierInputSchema
 *
 *                 â†“
 *
 * normalisation / regroupement
 *
 *                 â†“
 *
 * UNE REQUÃŠTE PostgreSQL
 *
 *                 â†“
 *
 * StoreProduct
 *    â”‚
 *    â”œâ”€â”€ Product
 *    â”‚      â””â”€â”€ ProductImage
 *    â”‚
 *    â””â”€â”€ Store
 *
 *                 â†“
 *
 * PRIX RÃ‰EL
 * DEVISE RÃ‰ELLE
 * STOCK RÃ‰EL
 * STATUTS RÃ‰ELS
 * BOUTIQUE RÃ‰ELLE
 * IMAGE RÃ‰ELLE
 *
 *                 â†“
 *
 * PublicCommandeSnapshot
 *
 * ============================================================================
 *
 * EXEMPLE â€” ARTICLE DISPONIBLE
 *
 * demandÃ© :
 *
 * 2 unitÃ©s
 *
 * stock :
 *
 * 15
 *
 * rÃ©sultat :
 *
 * state = AVAILABLE
 *
 * ============================================================================
 *
 * EXEMPLE â€” STOCK INSUFFISANT
 *
 * demandÃ© :
 *
 * 10
 *
 * stock :
 *
 * 4
 *
 * rÃ©sultat :
 *
 * state = INSUFFICIENT_STOCK
 *
 * +
 *
 * issue = INSUFFICIENT_STOCK
 *
 * ============================================================================
 *
 * EXEMPLE â€” OFFRE SUPPRIMÃ‰E
 *
 * storeProductId absent de PostgreSQL
 *
 * rÃ©sultat :
 *
 * issue = OFFER_NOT_FOUND
 *
 * ============================================================================
 *
 * EXEMPLE â€” PRODUIT ARCHIVÃ‰
 *
 * Product.status != ACTIVE
 *
 * rÃ©sultat :
 *
 * state = UNAVAILABLE
 *
 * ============================================================================
 *
 * EXEMPLE â€” BOUTIQUE SUSPENDUE
 *
 * Store.status != ACTIVE
 *
 * rÃ©sultat :
 *
 * state = UNAVAILABLE
 *
 * ============================================================================
 *
 * EXEMPLE â€” OFFRE OUT_OF_STOCK
 *
 * rÃ©sultat :
 *
 * state = OUT_OF_STOCK
 *
 * ============================================================================
 *
 * MULTI-DEVISE
 *
 * XAF
 * EUR
 *
 *                 â†“
 *
 * aucun taux de change inventÃ©
 *
 *                 â†“
 *
 * deux sous-totaux distincts
 *
 * ============================================================================
 *
 * MULTI-BOUTIQUE
 *
 * Boutique A
 * Boutique B
 *
 *                 â†“
 *
 * les deux boutiques restent distinctes
 *
 *                 â†“
 *
 * aucune fusion mÃ©tier artificielle
 *
 * ============================================================================
 *
 * SÃ‰CURITÃ‰ FINALE
 *
 * Ce snapshot reste temporaire.
 *
 * Avant de crÃ©er une vraie commande :
 *
 * public-commande-actions.ts
 *
 * devra revalider :
 *
 * - StoreProduct ;
 * - Product ;
 * - Store ;
 * - prix ;
 * - devise ;
 * - stock ;
 * - quantitÃ© ;
 * - livraison ;
 * - total.
 *
 * ============================================================================
 */
