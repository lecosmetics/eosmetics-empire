import "server-only";

import {
  calculatePublicCommandeDelivery,
  getPublicCommandeDeliveryAddressFingerprint,
} from "@/lib/public/commande/public-commande-delivery";

import type {
  PublicCheckoutStateStatus,
  PublicCommandeClientState,
  PublicCommandeDeliveryQuote,
  PublicCommandeMoney,
  PublicCommandePreparedCheckout,
  PublicCommandeSnapshot,
  PublicCommandeSummary,
} from "@/lib/public/commande/public-commande-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CHECKOUT PUBLIC — ÉTAT SERVEUR
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-checkout-state.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Sécuriser l'état préparé entre :
 *
 * /commande
 *
 * et :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * CE FICHIER :
 *
 * - vérifie le Panier déjà revalidé côté serveur ;
 * - vérifie la devise ;
 * - revérifie la livraison ;
 * - recalcule le résumé financier ;
 * - vérifie l'adresse liée au calcul de livraison ;
 * - détecte un état expiré lorsqu'une expiration est fournie ;
 * - produit un état serveur cohérent prêt pour le paiement.
 *
 * ============================================================================
 *
 * CE FICHIER NE :
 *
 * - lit pas localStorage ;
 * - ne fait confiance à aucun total navigateur ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - ne réserve aucun stock ;
 * - n'écrit rien dans PostgreSQL ;
 * - n'appelle pas Prisma ;
 * - n'envoie aucun e-mail ;
 * - ne génère aucun PDF.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cet état n'est PAS une preuve de paiement.
 *
 * Il n'est PAS non plus une réservation de stock.
 *
 * Avant création définitive d'une commande ou initialisation d'un paiement,
 * les données commerciales critiques doivent encore être revalidées.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. VERSION DU CONTRAT
   ========================================================================== */

/**
 * Permet de faire évoluer plus tard la structure de l'état checkout
 * sans confondre plusieurs versions.
 */
export const PUBLIC_CHECKOUT_STATE_VERSION =
  1 as const;


/* ==========================================================================
   2. TYPES D'ERREURS
   ========================================================================== */

export type PublicCheckoutStateFailureCode =
  | "INVALID_CHECKOUT"
  | "PANIER_UNAVAILABLE"
  | "DELIVERY_INVALID"
  | "CURRENCY_MISMATCH"
  | "TOTAL_INVALID"
  | "STATE_CHANGED"
  | "EXPIRED";


/* ==========================================================================
   3. ÉTAT SERVEUR PRÊT POUR LE PAIEMENT
   ========================================================================== */

/**
 * État serveur construit à partir d'un checkout déjà validé.
 *
 * ============================================================================
 *
 * expiresAt :
 *
 * null signifie qu'aucune durée d'expiration n'a encore été imposée
 * par la couche appelante.
 *
 * Ce fichier n'invente volontairement pas une durée comme :
 *
 * 15 minutes
 * 30 minutes
 * 1 heure
 *
 * Cette règle pourra être décidée explicitement dans
 * public-commande-actions.ts.
 */
export interface PublicCheckoutServerState {
  readonly version:
    typeof PUBLIC_CHECKOUT_STATE_VERSION;

  readonly status:
    "READY_FOR_PAYMENT";

  readonly createdAt:
    string;

  readonly expiresAt:
    string | null;

  /**
   * Empreinte de l'adresse utilisée lors du calcul de livraison.
   *
   * Elle permet de détecter toute modification de :
   *
   * - pays ;
   * - ville ;
   * - adresse ;
   * - complément ;
   * - code postal.
   */
  readonly addressFingerprint:
    string;

  /**
   * Checkout complet et déjà revalidé.
   */
  readonly checkout:
    PublicCommandePreparedCheckout;
}


/* ==========================================================================
   4. INPUT DE CRÉATION
   ========================================================================== */

export interface CreatePublicCheckoutStateInput {
  readonly checkout:
    PublicCommandePreparedCheckout;

  /**
   * Facultatif.
   *
   * Par défaut :
   *
   * new Date()
   */
  readonly createdAt?:
    Date;

  /**
   * Facultatif.
   *
   * Aucune durée d'expiration arbitraire n'est créée ici.
   */
  readonly expiresAt?:
    Date | null;
}


/* ==========================================================================
   5. RÉSULTAT DE CRÉATION
   ========================================================================== */

export type CreatePublicCheckoutStateResult =
  | Readonly<{
      success:
        true;

      data:
        PublicCheckoutServerState;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicCheckoutStateFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   6. RÉSULTAT DE VALIDATION
   ========================================================================== */

export type ValidatePublicCheckoutStateResult =
  | Readonly<{
      success:
        true;

      data:
        PublicCheckoutServerState;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicCheckoutStateFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   7. MESSAGES
   ========================================================================== */

const PUBLIC_CHECKOUT_STATE_MESSAGES = {
  invalidCheckout:
    "Les informations de la commande ne sont plus valides.",

  panierUnavailable:
    "Un ou plusieurs articles de votre panier ne sont plus disponibles.",

  deliveryInvalid:
    "Les frais de livraison doivent être recalculés.",

  currencyMismatch:
    "La devise des produits ne permet pas de calculer le total avec les frais de livraison actuels.",

  totalInvalid:
    "Le total de la commande ne peut pas être calculé correctement.",

  stateChanged:
    "Les informations de la commande ont changé. Une nouvelle vérification est nécessaire.",

  expired:
    "La session de commande a expiré. Veuillez vérifier de nouveau votre commande.",
} as const;


/* ==========================================================================
   8. NORMALISATION DEVISE
   ========================================================================== */

function normalizeCurrency(
  currency:
    string,
): string {
  return currency
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   9. VALIDATION DEVISE
   ========================================================================== */

function isValidCurrency(
  currency:
    string,
): boolean {
  return /^[A-Z]{3}$/u.test(
    normalizeCurrency(
      currency,
    ),
  );
}


/* ==========================================================================
   10. NORMALISATION MONTANT
   ========================================================================== */

/**
 * Transforme notamment :
 *
 * "3000"
 *
 * en :
 *
 * "3000.00"
 *
 * et :
 *
 * "3000.5"
 *
 * en :
 *
 * "3000.50"
 *
 * ============================================================================
 *
 * Aucun Number() n'est utilisé pour effectuer les additions financières.
 */
function normalizeMoneyAmount(
  amount:
    string,
): string | null {
  const normalized =
    amount.trim();


  const match =
    /^(\d+)(?:\.(\d{1,2}))?$/u.exec(
      normalized,
    );


  if (
    !match
  ) {
    return null;
  }


  const integerPart =
    (
      match[1] ??
      "0"
    ).replace(
      /^0+(?=\d)/u,
      "",
    );


  const decimalPart =
    (
      match[2] ??
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


  return `${integerPart}.${decimalPart}`;
}


/* ==========================================================================
   11. DECIMAL → CHAÎNE D'UNITÉS MINEURES
   ========================================================================== */

/**
 * Exemple :
 *
 * 12900.50
 *
 * devient :
 *
 * 1290050
 *
 * sous forme de string.
 *
 * ============================================================================
 *
 * Cette approche évite :
 *
 * - Number flottant pour les additions ;
 * - BigInt literal ;
 * - dépendance au target ES2020.
 */
function moneyAmountToMinorUnitString(
  amount:
    string,
): string | null {
  const normalized =
    normalizeMoneyAmount(
      amount,
    );


  if (
    normalized ===
    null
  ) {
    return null;
  }


  const [
    integerPart,
    decimalPart,
  ] =
    normalized.split(
      ".",
    );


  const minorUnits =
    `${integerPart}${decimalPart}`.replace(
      /^0+(?=\d)/u,
      "",
    );


  return minorUnits ||
    "0";
}


/* ==========================================================================
   12. ADDITION DE DEUX ENTIERS POSITIFS EN STRING
   ========================================================================== */

/**
 * Addition décimale exacte sans :
 *
 * Number
 * BigInt literal
 *
 * Exemple :
 *
 * "4000000"
 * +
 * "300000"
 *
 * =
 *
 * "4300000"
 */
function addUnsignedIntegerStrings(
  left:
    string,

  right:
    string,
): string {
  let leftIndex =
    left.length -
    1;

  let rightIndex =
    right.length -
    1;

  let carry =
    0;

  let result =
    "";


  while (
    leftIndex >=
      0 ||
    rightIndex >=
      0 ||
    carry >
      0
  ) {
    const leftDigit =
      leftIndex >=
      0
        ? left.charCodeAt(
            leftIndex,
          ) -
          48
        : 0;


    const rightDigit =
      rightIndex >=
      0
        ? right.charCodeAt(
            rightIndex,
          ) -
          48
        : 0;


    const sum =
      leftDigit +
      rightDigit +
      carry;


    result =
      `${sum % 10}${result}`;


    carry =
      Math.floor(
        sum /
          10,
      );


    leftIndex -=
      1;

    rightIndex -=
      1;
  }


  return result.replace(
    /^0+(?=\d)/u,
    "",
  );
}


/* ==========================================================================
   13. UNITÉS MINEURES → DECIMAL
   ========================================================================== */

function minorUnitStringToMoneyAmount(
  value:
    string,
): string {
  const normalized =
    value
      .replace(
        /^0+(?=\d)/u,
        "",
      )
      .padStart(
        3,
        "0",
      );


  const integerPart =
    normalized.slice(
      0,
      -2,
    );


  const decimalPart =
    normalized.slice(
      -2,
    );


  return `${integerPart}.${decimalPart}`;
}


/* ==========================================================================
   14. ADDITION DE DEUX MONTANTS
   ========================================================================== */

function addMoneyAmounts(
  left:
    string,

  right:
    string,
): string | null {
  const leftMinor =
    moneyAmountToMinorUnitString(
      left,
    );


  const rightMinor =
    moneyAmountToMinorUnitString(
      right,
    );


  if (
    leftMinor ===
      null ||
    rightMinor ===
      null
  ) {
    return null;
  }


  const totalMinor =
    addUnsignedIntegerStrings(
      leftMinor,
      rightMinor,
    );


  return minorUnitStringToMoneyAmount(
    totalMinor,
  );
}


/* ==========================================================================
   15. COMPARAISON DE MONTANTS
   ========================================================================== */

function areMoneyAmountsEqual(
  left:
    string,

  right:
    string,
): boolean {
  const normalizedLeft =
    normalizeMoneyAmount(
      left,
    );


  const normalizedRight =
    normalizeMoneyAmount(
      right,
    );


  return (
    normalizedLeft !==
      null &&
    normalizedRight !==
      null &&
    normalizedLeft ===
      normalizedRight
  );
}


/* ==========================================================================
   16. COMPARAISON MONEY
   ========================================================================== */

function areMoneyValuesEqual(
  left:
    PublicCommandeMoney | null,

  right:
    PublicCommandeMoney | null,
): boolean {
  if (
    left ===
      null ||
    right ===
      null
  ) {
    return (
      left ===
        null &&
      right ===
        null
    );
  }


  return (
    normalizeCurrency(
      left.currency,
    ) ===
      normalizeCurrency(
        right.currency,
      ) &&
    areMoneyAmountsEqual(
      left.amount,
      right.amount,
    )
  );
}


/* ==========================================================================
   17. COMPARAISON RÉSUMÉ
   ========================================================================== */

function arePublicCommandeSummariesEqual(
  left:
    PublicCommandeSummary,

  right:
    PublicCommandeSummary,
): boolean {
  return (
    areMoneyValuesEqual(
      left.productsSubtotal,
      right.productsSubtotal,
    ) &&
    areMoneyValuesEqual(
      left.delivery,
      right.delivery,
    ) &&
    areMoneyValuesEqual(
      left.total,
      right.total,
    )
  );
}


/* ==========================================================================
   18. VÉRIFICATION DU SNAPSHOT
   ========================================================================== */

/**
 * Le snapshot doit représenter un Panier actuellement commandable.
 */
function isSnapshotReadyForCheckout(
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


  if (
    snapshot.items.length !==
    snapshot.itemCount
  ) {
    return false;
  }


  for (
    const item of
    snapshot.items
  ) {
    if (
      item.state !==
      "AVAILABLE"
    ) {
      return false;
    }


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
      !Number.isSafeInteger(
        item.availableQuantity,
      ) ||
      item.availableQuantity <
        item.quantity
    ) {
      return false;
    }


    const unitPriceAmount =
      normalizeMoneyAmount(
        item.unitPrice.amount,
      );


    const subtotalAmount =
      normalizeMoneyAmount(
        item.subtotal.amount,
      );


    if (
      unitPriceAmount ===
        null ||
      subtotalAmount ===
        null
    ) {
      return false;
    }


    if (
      !isValidCurrency(
        item.unitPrice.currency,
      ) ||
      !isValidCurrency(
        item.subtotal.currency,
      )
    ) {
      return false;
    }


    if (
      normalizeCurrency(
        item.unitPrice.currency,
      ) !==
      normalizeCurrency(
        item.subtotal.currency,
      )
    ) {
      return false;
    }
  }


  return true;
}


/* ==========================================================================
   19. SOUS-TOTAL PRODUITS UNIQUE
   ========================================================================== */

/**
 * Aucun total multi-devise n'est fabriqué.
 */
function getSingleProductsSubtotal(
  snapshot:
    PublicCommandeSnapshot,
): PublicCommandeMoney | null {
  if (
    snapshot.subtotals.length !==
    1
  ) {
    return null;
  }


  const subtotal =
    snapshot.subtotals[
      0
    ];


  if (
    !subtotal
  ) {
    return null;
  }


  const currency =
    normalizeCurrency(
      subtotal.currency,
    );


  const amount =
    normalizeMoneyAmount(
      subtotal.amount,
    );


  if (
    !isValidCurrency(
      currency,
    ) ||
    amount ===
      null
  ) {
    return null;
  }


  return {
    amount,

    currency,
  };
}


/* ==========================================================================
   20. RECALCUL DE LIVRAISON
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * PublicCommandeAddress est déjà normalisée :
 *
 * addressComplement peut donc être null.
 *
 * public-commande-delivery.ts valide cependant son input navigateur avec
 * le schéma brut.
 *
 * Nous convertissons donc explicitement null vers "" avant la nouvelle
 * validation runtime.
 */
function recalculateDelivery(
  checkout:
    PublicCommandePreparedCheckout,
):
  | Readonly<{
      success:
        true;

      quote:
        PublicCommandeDeliveryQuote;
    }>
  | Readonly<{
      success:
        false;
    }> {
  const result =
    calculatePublicCommandeDelivery({
      address: {
        countryCode:
          checkout.address.countryCode,

        countryName:
          checkout.address.countryName,

        city:
          checkout.address.city,

        address:
          checkout.address.address,

        addressComplement:
          checkout.address.addressComplement ??
          "",

        postalCode:
          checkout.address.postalCode,
      },
    });


  if (
    !result.success
  ) {
    return {
      success:
        false,
    };
  }


  return {
    success:
      true,

    quote:
      result.data,
  };
}


/* ==========================================================================
   21. COMPARAISON DEVIS LIVRAISON
   ========================================================================== */

function areDeliveryQuotesEqual(
  left:
    PublicCommandeDeliveryQuote,

  right:
    PublicCommandeDeliveryQuote,
): boolean {
  return (
    left.zone ===
      right.zone &&
    normalizeCurrency(
      left.amount.currency,
    ) ===
      normalizeCurrency(
        right.amount.currency,
      ) &&
    areMoneyAmountsEqual(
      left.amount.amount,
      right.amount.amount,
    ) &&
    left.countryCode
      .trim()
      .toUpperCase() ===
      right.countryCode
        .trim()
        .toUpperCase()
  );
}


/* ==========================================================================
   22. CONSTRUCTION DU RÉSUMÉ FIABLE
   ========================================================================== */

function buildVerifiedSummary(
  snapshot:
    PublicCommandeSnapshot,

  delivery:
    PublicCommandeDeliveryQuote,
):
  | Readonly<{
      success:
        true;

      summary:
        PublicCommandeSummary;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicCheckoutStateFailureCode;
    }> {
  const productsSubtotal =
    getSingleProductsSubtotal(
      snapshot,
    );


  if (
    productsSubtotal ===
    null
  ) {
    return {
      success:
        false,

      code:
        "CURRENCY_MISMATCH",
    };
  }


  const deliveryCurrency =
    normalizeCurrency(
      delivery.amount.currency,
    );


  const productsCurrency =
    normalizeCurrency(
      productsSubtotal.currency,
    );


  /**
   * Aucun taux de change n'est inventé.
   *
   * Exemple interdit :
   *
   * produits EUR
   * +
   * livraison XAF
   *
   * sans règle de conversion officielle.
   */
  if (
    productsCurrency !==
    deliveryCurrency
  ) {
    return {
      success:
        false,

      code:
        "CURRENCY_MISMATCH",
    };
  }


  const normalizedDeliveryAmount =
    normalizeMoneyAmount(
      delivery.amount.amount,
    );


  if (
    normalizedDeliveryAmount ===
    null
  ) {
    return {
      success:
        false,

      code:
        "TOTAL_INVALID",
    };
  }


  const totalAmount =
    addMoneyAmounts(
      productsSubtotal.amount,
      normalizedDeliveryAmount,
    );


  if (
    totalAmount ===
    null
  ) {
    return {
      success:
        false,

      code:
        "TOTAL_INVALID",
    };
  }


  const summary:
    PublicCommandeSummary =
      {
        productsSubtotal: {
          amount:
            productsSubtotal.amount,

          currency:
            productsCurrency,
        },

        delivery: {
          amount:
            normalizedDeliveryAmount,

          currency:
            deliveryCurrency,
        },

        total: {
          amount:
            totalAmount,

          currency:
            productsCurrency,
        },
      };


  return {
    success:
      true,

    summary,
  };
}


/* ==========================================================================
   23. VALIDATION DU CHECKOUT PRÉPARÉ
   ========================================================================== */

function validatePreparedCheckout(
  checkout:
    PublicCommandePreparedCheckout,
):
  | Readonly<{
      success:
        true;

      summary:
        PublicCommandeSummary;

      delivery:
        PublicCommandeDeliveryQuote;

      addressFingerprint:
        string;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicCheckoutStateFailureCode;

      message:
        string;
    }> {
  /* ------------------------------------------------------------------------
     PANIER
     ------------------------------------------------------------------------ */

  if (
    !isSnapshotReadyForCheckout(
      checkout.snapshot,
    )
  ) {
    return {
      success:
        false,

      code:
        "PANIER_UNAVAILABLE",

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.panierUnavailable,
    };
  }


  /* ------------------------------------------------------------------------
     LIVRAISON — RECALCUL SERVEUR
     ------------------------------------------------------------------------ */

  const deliveryResult =
    recalculateDelivery(
      checkout,
    );


  if (
    !deliveryResult.success
  ) {
    return {
      success:
        false,

      code:
        "DELIVERY_INVALID",

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.deliveryInvalid,
    };
  }


  /* ------------------------------------------------------------------------
     ANCIEN DEVIS VS DEVIS ACTUEL
     ------------------------------------------------------------------------ */

  if (
    !areDeliveryQuotesEqual(
      checkout.delivery,
      deliveryResult.quote,
    )
  ) {
    return {
      success:
        false,

      code:
        "STATE_CHANGED",

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.stateChanged,
    };
  }


  /* ------------------------------------------------------------------------
     RÉSUMÉ SERVEUR
     ------------------------------------------------------------------------ */

  const summaryResult =
    buildVerifiedSummary(
      checkout.snapshot,
      deliveryResult.quote,
    );


  if (
    !summaryResult.success
  ) {
    const message =
      summaryResult.code ===
      "CURRENCY_MISMATCH"
        ? PUBLIC_CHECKOUT_STATE_MESSAGES.currencyMismatch
        : PUBLIC_CHECKOUT_STATE_MESSAGES.totalInvalid;


    return {
      success:
        false,

      code:
        summaryResult.code,

      message,
    };
  }


  /* ------------------------------------------------------------------------
     ANCIEN RÉSUMÉ VS RÉSUMÉ RECALCULÉ
     ------------------------------------------------------------------------ */

  if (
    !arePublicCommandeSummariesEqual(
      checkout.summary,
      summaryResult.summary,
    )
  ) {
    return {
      success:
        false,

      code:
        "STATE_CHANGED",

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.stateChanged,
    };
  }


  /* ------------------------------------------------------------------------
     EMPREINTE ADRESSE
     ------------------------------------------------------------------------ */

  const addressFingerprint =
    getPublicCommandeDeliveryAddressFingerprint(
      checkout.address,
    );


  return {
    success:
      true,

    summary:
      summaryResult.summary,

    delivery:
      deliveryResult.quote,

    addressFingerprint,
  };
}


/* ==========================================================================
   24. DATE ISO
   ========================================================================== */

function isValidDate(
  value:
    Date,
): boolean {
  return Number.isFinite(
    value.getTime(),
  );
}


/* ==========================================================================
   25. CRÉATION DE L'ÉTAT
   ========================================================================== */

export function createPublicCheckoutState(
  input:
    CreatePublicCheckoutStateInput,
): CreatePublicCheckoutStateResult {
  try {
    const createdAt =
      input.createdAt ??
      new Date();


    const expiresAt =
      input.expiresAt ??
      null;


    if (
      !isValidDate(
        createdAt,
      )
    ) {
      return {
        success:
          false,

        code:
          "INVALID_CHECKOUT",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.invalidCheckout,
      };
    }


    if (
      expiresAt !==
        null &&
      !isValidDate(
        expiresAt,
      )
    ) {
      return {
        success:
          false,

        code:
          "INVALID_CHECKOUT",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.invalidCheckout,
      };
    }


    if (
      expiresAt !==
        null &&
      expiresAt.getTime() <=
        createdAt.getTime()
    ) {
      return {
        success:
          false,

        code:
          "EXPIRED",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.expired,
      };
    }


    const validation =
      validatePreparedCheckout(
        input.checkout,
      );


    if (
      !validation.success
    ) {
      return validation;
    }


    /**
     * On reconstruit le checkout avec les valeurs financières
     * fraîchement recalculées.
     *
     * On ne conserve donc pas aveuglément un ancien résumé.
     */
    const verifiedCheckout:
      PublicCommandePreparedCheckout =
        {
          customer:
            input.checkout.customer,

          address:
            input.checkout.address,

          snapshot:
            input.checkout.snapshot,

          delivery:
            validation.delivery,

          summary:
            validation.summary,
        };


    const state:
      PublicCheckoutServerState =
        {
          version:
            PUBLIC_CHECKOUT_STATE_VERSION,

          status:
            "READY_FOR_PAYMENT",

          createdAt:
            createdAt.toISOString(),

          expiresAt:
            expiresAt
              ? expiresAt.toISOString()
              : null,

          addressFingerprint:
            validation.addressFingerprint,

          checkout:
            verifiedCheckout,
        };


    return {
      success:
        true,

      data:
        state,
    };
  } catch {
    return {
      success:
        false,

      code:
        "INVALID_CHECKOUT",

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.invalidCheckout,
    };
  }
}


/* ==========================================================================
   26. EXPIRATION
   ========================================================================== */

export function isPublicCheckoutStateExpired(
  state:
    PublicCheckoutServerState,

  now:
    Date =
      new Date(),
): boolean {
  if (
    state.expiresAt ===
    null
  ) {
    return false;
  }


  const expiresAt =
    new Date(
      state.expiresAt,
    );


  if (
    !isValidDate(
      expiresAt,
    )
  ) {
    return true;
  }


  return now.getTime() >=
    expiresAt.getTime();
}


/* ==========================================================================
   27. STATUT ACTUEL
   ========================================================================== */

export function getPublicCheckoutStateStatus(
  state:
    PublicCheckoutServerState,

  now:
    Date =
      new Date(),
): PublicCheckoutStateStatus {
  if (
    isPublicCheckoutStateExpired(
      state,
      now,
    )
  ) {
    return "EXPIRED";
  }


  return "READY_FOR_PAYMENT";
}


/* ==========================================================================
   28. VALIDATION D'UN ÉTAT EXISTANT
   ========================================================================== */

/**
 * À utiliser avant d'autoriser une étape sensible.
 *
 * ============================================================================
 *
 * Cette validation vérifie :
 *
 * - version ;
 * - statut ;
 * - expiration ;
 * - adresse ;
 * - empreinte ;
 * - Panier ;
 * - livraison ;
 * - devise ;
 * - résumé ;
 * - total.
 *
 * ============================================================================
 *
 * ATTENTION :
 *
 * Le stock reste une donnée concurrente.
 *
 * Cette validation ne remplace donc pas la requête finale de
 * public-commande-actions.ts juste avant création de la commande.
 */
export function validatePublicCheckoutState(
  state:
    PublicCheckoutServerState,

  now:
    Date =
      new Date(),
): ValidatePublicCheckoutStateResult {
  try {
    if (
      state.version !==
      PUBLIC_CHECKOUT_STATE_VERSION
    ) {
      return {
        success:
          false,

        code:
          "INVALID_CHECKOUT",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.invalidCheckout,
      };
    }


    if (
      state.status !==
      "READY_FOR_PAYMENT"
    ) {
      return {
        success:
          false,

        code:
          "INVALID_CHECKOUT",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.invalidCheckout,
      };
    }


    if (
      isPublicCheckoutStateExpired(
        state,
        now,
      )
    ) {
      return {
        success:
          false,

        code:
          "EXPIRED",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.expired,
      };
    }


    const currentFingerprint =
      getPublicCommandeDeliveryAddressFingerprint(
        state.checkout.address,
      );


    if (
      currentFingerprint !==
      state.addressFingerprint
    ) {
      return {
        success:
          false,

        code:
          "STATE_CHANGED",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.stateChanged,
      };
    }


    const validation =
      validatePreparedCheckout(
        state.checkout,
      );


    if (
      !validation.success
    ) {
      return validation;
    }


    if (
      validation.addressFingerprint !==
      state.addressFingerprint
    ) {
      return {
        success:
          false,

        code:
          "STATE_CHANGED",

        message:
          PUBLIC_CHECKOUT_STATE_MESSAGES.stateChanged,
      };
    }


    const verifiedCheckout:
      PublicCommandePreparedCheckout =
        {
          customer:
            state.checkout.customer,

          address:
            state.checkout.address,

          snapshot:
            state.checkout.snapshot,

          delivery:
            validation.delivery,

          summary:
            validation.summary,
        };


    return {
      success:
        true,

      data: {
        ...state,

        checkout:
          verifiedCheckout,
      },
    };
  } catch {
    return {
      success:
        false,

      code:
        "INVALID_CHECKOUT",

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.invalidCheckout,
    };
  }
}


/* ==========================================================================
   29. CONSTRUCTION DE L'ÉTAT CLIENT
   ========================================================================== */

/**
 * Ce contrat sert à alimenter PublicCommandePage.tsx.
 *
 * Aucun champ financier n'est accepté depuis le navigateur.
 */
export function buildPublicCommandeClientState(
  state:
    PublicCheckoutServerState,

  now:
    Date =
      new Date(),
): PublicCommandeClientState {
  const status =
    getPublicCheckoutStateStatus(
      state,
      now,
    );


  if (
    status ===
    "EXPIRED"
  ) {
    return {
      status:
        "EXPIRED",

      delivery: {
        status:
          "IDLE",

        quote:
          null,

        message:
          null,
      },

      summary:
        state.checkout.summary,

      fieldErrors:
        {},

      message:
        PUBLIC_CHECKOUT_STATE_MESSAGES.expired,
    };
  }


  return {
    status:
      "READY_FOR_PAYMENT",

    delivery: {
      status:
        "READY",

      quote:
        state.checkout.delivery,

      message:
        null,
    },

    summary:
      state.checkout.summary,

    fieldErrors:
      {},

    message:
      null,
  };
}


/* ==========================================================================
   30. PEUT CONTINUER VERS LE PAIEMENT
   ========================================================================== */

export function canPublicCheckoutContinueToPayment(
  state:
    PublicCheckoutServerState,

  now:
    Date =
      new Date(),
): boolean {
  const result =
    validatePublicCheckoutState(
      state,
      now,
    );


  return result.success;
}


/* ==========================================================================
   31. RÉCUPÉRATION DU TOTAL FINAL
   ========================================================================== */

/**
 * Retourne le total uniquement si l'état est encore valide.
 */
export function getPublicCheckoutVerifiedTotal(
  state:
    PublicCheckoutServerState,

  now:
    Date =
      new Date(),
): PublicCommandeMoney | null {
  const result =
    validatePublicCheckoutState(
      state,
      now,
    );


  if (
    !result.success
  ) {
    return null;
  }


  return result.data.checkout.summary.total;
}


/* ==========================================================================
   32. DOCUMENTATION DU FLUX
   ========================================================================== */

/**
 * ============================================================================
 *
 * /COMMANDE
 *
 * Cliente remplit :
 *
 * prénom
 * nom
 * e-mail
 * téléphone
 * pays
 * ville
 * adresse
 * complément
 * code postal
 *
 *                ↓
 *
 * public-commande-schema.ts
 *
 *                ↓
 *
 * informations validées
 *
 *                ↓
 *
 * public-commande-query.ts
 *
 *                ↓
 *
 * prix
 * stock
 * devise
 * boutique
 * produit
 *
 * rechargés depuis PostgreSQL
 *
 *                ↓
 *
 * public-commande-delivery.ts
 *
 *                ↓
 *
 * livraison serveur
 *
 *                ↓
 *
 * PublicCommandePreparedCheckout
 *
 *                ↓
 *
 * createPublicCheckoutState()
 *
 *                ↓
 *
 * vérification :
 *
 * Panier disponible
 * +
 * adresse stable
 * +
 * livraison recalculée
 * +
 * devise compatible
 * +
 * sous-total recalculé
 * +
 * total recalculé
 *
 *                ↓
 *
 * READY_FOR_PAYMENT
 *
 *                ↓
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * SI LA CLIENTE CHANGE :
 *
 * pays
 * ville
 * adresse
 * complément
 * code postal
 *
 *                ↓
 *
 * nouvelle empreinte
 *
 *                ↓
 *
 * STATE_CHANGED
 *
 *                ↓
 *
 * nouveau calcul obligatoire
 *
 * ============================================================================
 *
 * SI LA LIVRAISON CHANGE :
 *
 * ancien devis
 *
 * !=
 *
 * nouveau devis serveur
 *
 *                ↓
 *
 * STATE_CHANGED
 *
 * ============================================================================
 *
 * SI LES PRODUITS SONT EN XAF
 *
 * ET :
 *
 * livraison XAF
 *
 *                ↓
 *
 * total calculable
 *
 * ============================================================================
 *
 * SI LES PRODUITS SONT EN EUR
 *
 * ET :
 *
 * livraison XAF
 *
 *                ↓
 *
 * CURRENCY_MISMATCH
 *
 *                ↓
 *
 * AUCUN taux de change inventé.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * READY_FOR_PAYMENT ne signifie PAS :
 *
 * - paiement réussi ;
 * - commande créée ;
 * - stock réservé ;
 * - reçu généré.
 *
 * ============================================================================
 */