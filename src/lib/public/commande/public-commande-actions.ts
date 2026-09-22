"use server";

import {
  createPublicCheckoutState,
} from "@/lib/public/commande/public-checkout-state";

import type {
  PublicCheckoutServerState,
  PublicCheckoutStateFailureCode,
} from "@/lib/public/commande/public-checkout-state";

import {
  calculatePublicCommandeDelivery,
} from "@/lib/public/commande/public-commande-delivery";

import {
  getPublicCommandeSingleSubtotal,
  isPublicCommandeSnapshotUsable,
  loadPublicCommandeSnapshot,
} from "@/lib/public/commande/public-commande-query";

import {
  getPublicCommandeFieldErrors,
  getPublicCommandeFormErrors,
  publicCommandePrepareInputSchema,
  validatePublicCommandeForm,
} from "@/lib/public/commande/public-commande-schema";

import type {
  PublicCommandeAddress,
  PublicCommandeDeliveryResult,
  PublicCommandeFieldErrors,
  PublicCommandeItemIssue,
  PublicCommandeLoadResult,
  PublicCommandeMoney,
  PublicCommandePrepareFailureCode,
  PublicCommandePrepareResult,
  PublicCommandePreparedCheckout,
  PublicCommandeSummary,
} from "@/lib/public/commande/public-commande-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — ACTIONS SERVEUR
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-commande-actions.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Orchestrer côté serveur la préparation du checkout public.
 *
 * ============================================================================
 *
 * FLUX :
 *
 * Panier navigateur
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 *              ↓
 *
 * informations cliente
 *
 *              ↓
 *
 * adresse
 *
 *              ↓
 *
 * validation Zod
 *
 *              ↓
 *
 * relecture PostgreSQL
 *
 * StoreProduct
 * Product
 * Store
 * ProductImage
 *
 *              ↓
 *
 * validation :
 *
 * - produit ;
 * - offre ;
 * - boutique ;
 * - stock ;
 * - quantité ;
 * - prix ;
 * - devise.
 *
 *              ↓
 *
 * calcul serveur livraison
 *
 *              ↓
 *
 * calcul serveur :
 *
 * sous-total
 * +
 * livraison
 * =
 * total
 *
 *              ↓
 *
 * PublicCommandePreparedCheckout
 *
 *              ↓
 *
 * PublicCheckoutServerState
 *
 *              ↓
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier n'accepte JAMAIS depuis le navigateur :
 *
 * - prix ;
 * - devise commerciale ;
 * - stock ;
 * - sous-total ;
 * - frais de livraison ;
 * - total ;
 * - état de paiement.
 *
 * ============================================================================
 *
 * CE FICHIER NE :
 *
 * - crée encore aucune Order ;
 * - crée aucun Payment ;
 * - crée aucun Receipt ;
 * - décrémente aucun stock ;
 * - réserve aucun stock ;
 * - envoie aucun e-mail ;
 * - génère aucun PDF ;
 * - ne fait confiance à aucun montant navigateur.
 *
 * ============================================================================
 *
 * La création définitive de commande appartiendra au parcours suivant :
 *
 * /commande/paiement
 *
 * avec :
 *
 * public-payment-actions.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES INTERNES
   ========================================================================== */

/**
 * Cas erreur extrait du contrat officiel.
 */
type PublicCommandePrepareFailure =
  Extract<
    PublicCommandePrepareResult,
    {
      readonly success:
        false;
    }
  >;


/**
 * Résultat interne complet.
 *
 * Il contient également le PublicCheckoutServerState afin d'éviter
 * de refaire inutilement la même préparation lorsqu'une action a besoin
 * de l'état prêt pour le paiement.
 */
type InternalPublicCommandePreparationResult =
  | Readonly<{
      success:
        true;

      checkout:
        PublicCommandePreparedCheckout;

      checkoutState:
        PublicCheckoutServerState;
    }>
  | Readonly<{
      success:
        false;

      failure:
        PublicCommandePrepareFailure;
    }>;


/**
 * Résultat de l'action qui prépare directement l'état de checkout.
 *
 * Ce type reste interne au module afin que ce fichier "use server"
 * n'exporte que des fonctions async.
 */
type PublicCommandeCheckoutStateActionResult =
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
        PublicCommandePrepareFailureCode;

      message:
        string;

      fieldErrors?:
        PublicCommandeFieldErrors;
    }>;


/* ==========================================================================
   2. MESSAGES
   ========================================================================== */

const PUBLIC_COMMANDE_ACTION_MESSAGES = {
  invalidForm:
    "Vérifiez les informations saisies avant de continuer.",

  emptyPanier:
    "Votre panier est vide.",

  invalidPanier:
    "Le contenu de votre panier n’est pas valide.",

  offerUnavailable:
    "Un ou plusieurs articles de votre panier ne sont plus disponibles.",

  insufficientStock:
    "La quantité demandée pour un ou plusieurs articles dépasse le stock disponible.",

  deliveryUnavailable:
    "Impossible de déterminer les frais de livraison pour cette destination.",

  currencyMismatch:
    "La devise du panier n’est pas compatible avec les frais de livraison actuellement configurés.",

  invalidTotal:
    "Le total de la commande ne peut pas être calculé correctement.",

  serverError:
    "Impossible de préparer votre commande actuellement. Réessayez dans quelques instants.",
} as const;


/* ==========================================================================
   3. NORMALISATION DEVISE
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
   4. VALIDATION DEVISE
   ========================================================================== */

function isValidCurrencyCode(
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
   5. NORMALISATION DES MONTANTS
   ========================================================================== */

/**
 * Les montants publics restent des strings.
 *
 * Exemples :
 *
 * 3000
 *
 * devient :
 *
 * 3000.00
 *
 * et :
 *
 * 12900.5
 *
 * devient :
 *
 * 12900.50
 *
 * ============================================================================
 *
 * Aucun Number() n'est utilisé pour les additions financières.
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


  const fractionPart =
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


  return `${integerPart}.${fractionPart}`;
}


/* ==========================================================================
   6. MONTANT → UNITÉS MINEURES STRING
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
 * ============================================================================
 *
 * Cette implémentation évite volontairement :
 *
 * - les nombres flottants pour les calculs ;
 * - les littéraux BigInt ;
 * - toute modification du target TypeScript du projet.
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


  const parts =
    normalized.split(
      ".",
    );


  const integerPart =
    parts[0] ??
    "0";


  const fractionPart =
    parts[1] ??
    "00";


  const result =
    `${integerPart}${fractionPart}`.replace(
      /^0+(?=\d)/u,
      "",
    );


  return result ||
    "0";
}


/* ==========================================================================
   7. ADDITION D'ENTIERS POSITIFS STRING
   ========================================================================== */

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
   8. UNITÉS MINEURES → MONTANT
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


  const fractionPart =
    normalized.slice(
      -2,
    );


  return `${integerPart}.${fractionPart}`;
}


/* ==========================================================================
   9. ADDITION MONÉTAIRE
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
   10. ERREUR STANDARD
   ========================================================================== */

function createPrepareFailure(
  code:
    PublicCommandePrepareFailureCode,

  message:
    string,

  fieldErrors?:
    PublicCommandeFieldErrors,
): PublicCommandePrepareFailure {
  if (
    fieldErrors &&
    Object.keys(
      fieldErrors,
    ).length >
      0
  ) {
    return {
      success:
        false,

      code,

      message,

      fieldErrors,
    };
  }


  return {
    success:
      false,

    code,

    message,
  };
}


/* ==========================================================================
   11. MESSAGE DES ERREURS GLOBALES ZOD
   ========================================================================== */

function getFirstFormErrorMessage(
  formErrors:
    readonly string[],
): string {
  return (
    formErrors[
      0
    ] ??
    PUBLIC_COMMANDE_ACTION_MESSAGES.invalidForm
  );
}


/* ==========================================================================
   12. MAPPING DES ERREURS DE CHARGEMENT DU PANIER
   ========================================================================== */

function mapLoadFailureToPrepareFailure(
  result:
    Extract<
      PublicCommandeLoadResult,
      {
        readonly success:
          false;
      }
    >,
): PublicCommandePrepareFailure {
  switch (
    result.code
  ) {
    case "EMPTY_PANIER":
      return createPrepareFailure(
        "EMPTY_PANIER",
        result.message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.emptyPanier,
      );


    case "INVALID_INPUT":
    case "VALIDATION_FAILED":
      return createPrepareFailure(
        "INVALID_PANIER",
        result.message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.invalidPanier,
      );


    case "SERVER_ERROR":
    default:
      return createPrepareFailure(
        "SERVER_ERROR",
        PUBLIC_COMMANDE_ACTION_MESSAGES.serverError,
      );
  }
}


/* ==========================================================================
   13. SÉLECTION D'UNE ISSUE PRIORITAIRE
   ========================================================================== */

/**
 * Si plusieurs produits ont un problème, on choisit le problème le plus
 * directement actionnable pour la cliente.
 */
function getPriorityItemIssue(
  issues:
    readonly PublicCommandeItemIssue[],
): PublicCommandeItemIssue | null {
  const invalidQuantity =
    issues.find(
      (
        issue,
      ) =>
        issue.code ===
        "INVALID_QUANTITY",
    );


  if (
    invalidQuantity
  ) {
    return invalidQuantity;
  }


  const insufficientStock =
    issues.find(
      (
        issue,
      ) =>
        issue.code ===
        "INSUFFICIENT_STOCK",
    );


  if (
    insufficientStock
  ) {
    return insufficientStock;
  }


  const outOfStock =
    issues.find(
      (
        issue,
      ) =>
        issue.code ===
        "OUT_OF_STOCK",
    );


  if (
    outOfStock
  ) {
    return outOfStock;
  }


  const offerNotFound =
    issues.find(
      (
        issue,
      ) =>
        issue.code ===
        "OFFER_NOT_FOUND",
    );


  if (
    offerNotFound
  ) {
    return offerNotFound;
  }


  const offerUnavailable =
    issues.find(
      (
        issue,
      ) =>
        issue.code ===
        "OFFER_UNAVAILABLE",
    );


  return offerUnavailable ??
    issues[
      0
    ] ??
    null;
}


/* ==========================================================================
   14. MAPPING ISSUE PRODUIT
   ========================================================================== */

function mapItemIssuesToPrepareFailure(
  issues:
    readonly PublicCommandeItemIssue[],
): PublicCommandePrepareFailure {
  const issue =
    getPriorityItemIssue(
      issues,
    );


  if (
    issue ===
    null
  ) {
    return createPrepareFailure(
      "INVALID_PANIER",
      PUBLIC_COMMANDE_ACTION_MESSAGES.invalidPanier,
    );
  }


  switch (
    issue.code
  ) {
    case "INVALID_QUANTITY":
      return createPrepareFailure(
        "INVALID_PANIER",
        issue.message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.invalidPanier,
      );


    case "INSUFFICIENT_STOCK":
      return createPrepareFailure(
        "INSUFFICIENT_STOCK",
        issue.message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.insufficientStock,
      );


    case "OFFER_NOT_FOUND":
    case "OFFER_UNAVAILABLE":
    case "OUT_OF_STOCK":
    default:
      return createPrepareFailure(
        "OFFER_UNAVAILABLE",
        issue.message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.offerUnavailable,
      );
  }
}


/* ==========================================================================
   15. MAPPING ERREUR LIVRAISON
   ========================================================================== */

function mapDeliveryFailureToPrepareFailure(
  result:
    Extract<
      PublicCommandeDeliveryResult,
      {
        readonly success:
          false;
      }
    >,
): PublicCommandePrepareFailure {
  switch (
    result.code
  ) {
    case "CURRENCY_MISMATCH":
      return createPrepareFailure(
        "CURRENCY_MISMATCH",
        PUBLIC_COMMANDE_ACTION_MESSAGES.currencyMismatch,
      );


    case "SERVER_ERROR":
      return createPrepareFailure(
        "SERVER_ERROR",
        PUBLIC_COMMANDE_ACTION_MESSAGES.serverError,
      );


    case "INVALID_ADDRESS":
    case "UNSUPPORTED_DESTINATION":
    default:
      return createPrepareFailure(
        "DELIVERY_UNAVAILABLE",
        result.message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.deliveryUnavailable,
      );
  }
}


/* ==========================================================================
   16. MAPPING ERREUR CHECKOUT STATE
   ========================================================================== */

function mapCheckoutStateFailureToPrepareFailure(
  code:
    PublicCheckoutStateFailureCode,

  message:
    string,
): PublicCommandePrepareFailure {
  switch (
    code
  ) {
    case "PANIER_UNAVAILABLE":
      return createPrepareFailure(
        "OFFER_UNAVAILABLE",
        message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.offerUnavailable,
      );


    case "DELIVERY_INVALID":
      return createPrepareFailure(
        "DELIVERY_UNAVAILABLE",
        message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.deliveryUnavailable,
      );


    case "CURRENCY_MISMATCH":
      return createPrepareFailure(
        "CURRENCY_MISMATCH",
        message ||
          PUBLIC_COMMANDE_ACTION_MESSAGES.currencyMismatch,
      );


    case "TOTAL_INVALID":
      return createPrepareFailure(
        "SERVER_ERROR",
        PUBLIC_COMMANDE_ACTION_MESSAGES.invalidTotal,
      );


    case "INVALID_CHECKOUT":
    case "STATE_CHANGED":
    case "EXPIRED":
    default:
      return createPrepareFailure(
        "SERVER_ERROR",
        PUBLIC_COMMANDE_ACTION_MESSAGES.serverError,
      );
  }
}


/* ==========================================================================
   17. ADRESSE NORMALISÉE → INPUT LIVRAISON
   ========================================================================== */

/**
 * PublicCommandeAddress contient :
 *
 * addressComplement: string | null
 *
 * Le schéma navigateur attend :
 *
 * addressComplement: string
 *
 * On transforme uniquement null en chaîne vide pour repasser proprement
 * par la validation runtime de public-commande-delivery.ts.
 */
function buildDeliveryCalculationInput(
  address:
    PublicCommandeAddress,
) {
  return {
    address: {
      countryCode:
        address.countryCode,

      countryName:
        address.countryName,

      city:
        address.city,

      address:
        address.address,

      addressComplement:
        address.addressComplement ??
        "",

      postalCode:
        address.postalCode,
    },
  };
}


/* ==========================================================================
   18. CONSTRUCTION DU RÉSUMÉ
   ========================================================================== */

function buildCommandeSummary(
  productsSubtotal:
    PublicCommandeMoney,

  delivery:
    PublicCommandeMoney,
):
  | Readonly<{
      success:
        true;

      data:
        PublicCommandeSummary;
    }>
  | Readonly<{
      success:
        false;

      code:
        "CURRENCY_MISMATCH" |
        "TOTAL_INVALID";
    }> {
  const productsCurrency =
    normalizeCurrency(
      productsSubtotal.currency,
    );


  const deliveryCurrency =
    normalizeCurrency(
      delivery.currency,
    );


  if (
    !isValidCurrencyCode(
      productsCurrency,
    ) ||
    !isValidCurrencyCode(
      deliveryCurrency,
    )
  ) {
    return {
      success:
        false,

      code:
        "TOTAL_INVALID",
    };
  }


  /**
   * Aucun taux de change n'est inventé.
   *
   * Actuellement :
   *
   * frais de livraison = XAF.
   *
   * Donc un panier EUR / USD / XOF ne peut pas être additionné
   * automatiquement à la livraison XAF sans vraie règle de conversion.
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


  const normalizedSubtotal =
    normalizeMoneyAmount(
      productsSubtotal.amount,
    );


  const normalizedDelivery =
    normalizeMoneyAmount(
      delivery.amount,
    );


  if (
    normalizedSubtotal ===
      null ||
    normalizedDelivery ===
      null
  ) {
    return {
      success:
        false,

      code:
        "TOTAL_INVALID",
    };
  }


  const total =
    addMoneyAmounts(
      normalizedSubtotal,
      normalizedDelivery,
    );


  if (
    total ===
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
            normalizedSubtotal,

          currency:
            productsCurrency,
        },

        delivery: {
          amount:
            normalizedDelivery,

          currency:
            deliveryCurrency,
        },

        total: {
          amount:
            total,

          currency:
            productsCurrency,
        },
      };


  return {
    success:
      true,

    data:
      summary,
  };
}


/* ==========================================================================
   19. PRÉPARATION INTERNE PRINCIPALE
   ========================================================================== */

/**
 * Cette fonction constitue le cœur du fichier.
 *
 * Elle n'est volontairement PAS exportée.
 *
 * Les seules entrées exposées publiquement restent des Server Actions async.
 */
async function preparePublicCommandeInternal(
  input:
    unknown,
): Promise<InternalPublicCommandePreparationResult> {
  try {
    /* =======================================================================
       1. VALIDATION PAYLOAD BRUT
       ======================================================================= */

    const rawInputResult =
      publicCommandePrepareInputSchema.safeParse(
        input,
      );


    if (
      !rawInputResult.success
    ) {
      const fieldErrors =
        getPublicCommandeFieldErrors(
          rawInputResult.error,
        );


      const formErrors =
        getPublicCommandeFormErrors(
          rawInputResult.error,
        );


      return {
        success:
          false,

        failure:
          createPrepareFailure(
            "INVALID_FORM",
            getFirstFormErrorMessage(
              formErrors,
            ),
            fieldErrors,
          ),
      };
    }


    const rawInput =
      rawInputResult.data;


    /* =======================================================================
       2. NORMALISATION CLIENTE + ADRESSE
       ======================================================================= */

    const formResult =
      validatePublicCommandeForm({
        customer:
          rawInput.customer,

        address:
          rawInput.address,
      });


    if (
      !formResult.success
    ) {
      return {
        success:
          false,

        failure:
          createPrepareFailure(
            "INVALID_FORM",
            getFirstFormErrorMessage(
              formResult.formErrors,
            ),
            formResult.fieldErrors,
          ),
      };
    }


    const validatedForm =
      formResult.data;


    /* =======================================================================
       3. RELECTURE SERVEUR DU PANIER
       ======================================================================= */

    const snapshotResult =
      await loadPublicCommandeSnapshot({
        items:
          rawInput.items,
      });


    if (
      !snapshotResult.success
    ) {
      return {
        success:
          false,

        failure:
          mapLoadFailureToPrepareFailure(
            snapshotResult,
          ),
      };
    }


    const snapshot =
      snapshotResult.data;


    /* =======================================================================
       4. ISSUES PRODUITS
       ======================================================================= */

    if (
      snapshot.issues.length >
      0
    ) {
      return {
        success:
          false,

        failure:
          mapItemIssuesToPrepareFailure(
            snapshot.issues,
          ),
      };
    }


    /* =======================================================================
       5. VALIDATION GLOBALE DU SNAPSHOT
       ======================================================================= */

    if (
      !isPublicCommandeSnapshotUsable(
        snapshot,
      )
    ) {
      return {
        success:
          false,

        failure:
          createPrepareFailure(
            "INVALID_PANIER",
            PUBLIC_COMMANDE_ACTION_MESSAGES.invalidPanier,
          ),
      };
    }


    /* =======================================================================
       6. SOUS-TOTAL UNIQUE
       ======================================================================= */

    const productsSubtotal =
      getPublicCommandeSingleSubtotal(
        snapshot,
      );


    /**
     * Plusieurs devises :
     *
     * XAF
     * +
     * EUR
     *
     * par exemple.
     *
     * Aucun taux de change n'est inventé.
     */
    if (
      productsSubtotal ===
      null
    ) {
      return {
        success:
          false,

        failure:
          createPrepareFailure(
            "CURRENCY_MISMATCH",
            PUBLIC_COMMANDE_ACTION_MESSAGES.currencyMismatch,
          ),
      };
    }


    const productsSubtotalMoney:
      PublicCommandeMoney =
        {
          amount:
            productsSubtotal.amount,

          currency:
            normalizeCurrency(
              productsSubtotal.currency,
            ),
        };


    /* =======================================================================
       7. LIVRAISON SERVEUR
       ======================================================================= */

    const deliveryResult =
      calculatePublicCommandeDelivery(
        buildDeliveryCalculationInput(
          validatedForm.address,
        ),
      );


    if (
      !deliveryResult.success
    ) {
      return {
        success:
          false,

        failure:
          mapDeliveryFailureToPrepareFailure(
            deliveryResult,
          ),
      };
    }


    const delivery =
      deliveryResult.data;


    /* =======================================================================
       8. RÉSUMÉ FINANCIER
       ======================================================================= */

    const summaryResult =
      buildCommandeSummary(
        productsSubtotalMoney,
        delivery.amount,
      );


    if (
      !summaryResult.success
    ) {
      if (
        summaryResult.code ===
        "CURRENCY_MISMATCH"
      ) {
        return {
          success:
            false,

          failure:
            createPrepareFailure(
              "CURRENCY_MISMATCH",
              PUBLIC_COMMANDE_ACTION_MESSAGES.currencyMismatch,
            ),
        };
      }


      return {
        success:
          false,

        failure:
          createPrepareFailure(
            "SERVER_ERROR",
            PUBLIC_COMMANDE_ACTION_MESSAGES.invalidTotal,
          ),
      };
    }


    /* =======================================================================
       9. CHECKOUT PRÉPARÉ
       ======================================================================= */

    const preparedCheckout:
      PublicCommandePreparedCheckout =
        {
          customer:
            validatedForm.customer,

          address:
            validatedForm.address,

          snapshot,

          delivery,

          summary:
            summaryResult.data,
        };


    /* =======================================================================
       10. CONTRÔLE CHECKOUT STATE
       ======================================================================= */

    /**
     * createPublicCheckoutState() effectue une deuxième vérification de :
     *
     * - Panier ;
     * - livraison ;
     * - adresse ;
     * - devise ;
     * - résumé ;
     * - total.
     *
     * Aucune expiration arbitraire n'est créée ici.
     */
    const checkoutStateResult =
      createPublicCheckoutState({
        checkout:
          preparedCheckout,
      });


    if (
      !checkoutStateResult.success
    ) {
      return {
        success:
          false,

        failure:
          mapCheckoutStateFailureToPrepareFailure(
            checkoutStateResult.code,
            checkoutStateResult.message,
          ),
      };
    }


    /* =======================================================================
       11. RÉSULTAT
       ======================================================================= */

    return {
      success:
        true,

      /**
       * On utilise le checkout reconstruit par checkout-state afin de
       * récupérer les valeurs fraîchement vérifiées.
       */
      checkout:
        checkoutStateResult.data.checkout,

      checkoutState:
        checkoutStateResult.data,
    };
  } catch {
    return {
      success:
        false,

      failure:
        createPrepareFailure(
          "SERVER_ERROR",
          PUBLIC_COMMANDE_ACTION_MESSAGES.serverError,
        ),
    };
  }
}


/* ==========================================================================
   20. ACTION — REVALIDER LE PANIER
   ========================================================================== */

/**
 * Action utilisable depuis l'interface /commande pour obtenir le snapshot
 * serveur actuel du Panier.
 *
 * ============================================================================
 *
 * Elle ne crée aucune commande.
 */
export async function loadPublicCommandeForCheckout(
  input:
    unknown,
): Promise<PublicCommandeLoadResult> {
  return loadPublicCommandeSnapshot(
    input,
  );
}


/* ==========================================================================
   21. ACTION — CALCULER LA LIVRAISON
   ========================================================================== */

/**
 * Action destinée au formulaire lorsque le pays / l'adresse change.
 *
 * ============================================================================
 *
 * Le navigateur transmet l'adresse.
 *
 * Le navigateur ne transmet jamais :
 *
 * 3000
 * 7000
 * 12700
 *
 * comme montant de confiance.
 *
 * Le montant est recalculé côté serveur depuis :
 *
 * src/config/public-delivery.ts
 */
export async function calculatePublicCommandeDeliveryAction(
  input:
    unknown,
): Promise<PublicCommandeDeliveryResult> {
  return calculatePublicCommandeDelivery(
    input,
  );
}


/* ==========================================================================
   22. ACTION — PRÉPARER LE CHECKOUT
   ========================================================================== */

/**
 * Action principale appelée lorsque la cliente termine /commande.
 *
 * ============================================================================
 *
 * Cette action :
 *
 * 1. valide les informations cliente ;
 * 2. valide l'adresse ;
 * 3. recharge le Panier depuis PostgreSQL ;
 * 4. revérifie les offres ;
 * 5. revérifie les prix ;
 * 6. revérifie les devises ;
 * 7. revérifie les stocks ;
 * 8. calcule les frais de livraison ;
 * 9. calcule le total ;
 * 10. valide l'état checkout.
 *
 * ============================================================================
 *
 * Elle ne crée encore :
 *
 * - aucune Order ;
 * - aucun Payment ;
 * - aucun Receipt.
 */
export async function preparePublicCommandeCheckout(
  input:
    unknown,
): Promise<PublicCommandePrepareResult> {
  const result =
    await preparePublicCommandeInternal(
      input,
    );


  if (
    !result.success
  ) {
    return result.failure;
  }


  return {
    success:
      true,

    data:
      result.checkout,
  };
}


/* ==========================================================================
   23. ACTION — PRÉPARER L'ÉTAT POUR /COMMANDE/PAIEMENT
   ========================================================================== */

/**
 * Variante complète utilisée lorsque la couche appelante a également besoin
 * du PublicCheckoutServerState.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Retourner cet objet au navigateur ne suffit PAS à le rendre inviolable.
 *
 * Il ne faudra donc jamais récupérer cet objet plus tard depuis le navigateur
 * et le considérer directement comme autoritaire.
 *
 * public-payment-query.ts et public-payment-actions.ts devront à nouveau
 * effectuer les validations critiques avant :
 *
 * - création définitive de commande ;
 * - paiement ;
 * - paiement à la livraison.
 *
 * ============================================================================
 *
 * Cette action existe pour préparer le flux proprement, mais elle ne constitue
 * pas encore un stockage persistant du checkout.
 */
export async function preparePublicCommandeCheckoutState(
  input:
    unknown,
): Promise<PublicCommandeCheckoutStateActionResult> {
  const result =
    await preparePublicCommandeInternal(
      input,
    );


  if (
    !result.success
  ) {
    return {
      success:
        false,

      code:
        result.failure.code,

      message:
        result.failure.message,

      ...(
        result.failure.fieldErrors
          ? {
              fieldErrors:
                result.failure.fieldErrors,
            }
          : {}
      ),
    };
  }


  return {
    success:
      true,

    data:
      result.checkoutState,
  };
}


/* ==========================================================================
   24. DOCUMENTATION DU FLUX
   ========================================================================== */

/**
 * ============================================================================
 *
 * /PANIER
 *
 * localStorage :
 *
 * storeProductId
 * quantity
 *
 *                ↓
 *
 * /COMMANDE
 *
 *                ↓
 *
 * cliente saisit :
 *
 * prénom
 * nom
 * e-mail
 * téléphone
 * WhatsApp éventuel
 * pays
 * ville
 * adresse
 * complément
 * code postal
 *
 *                ↓
 *
 * preparePublicCommandeCheckout()
 *
 *                ↓
 *
 * PUBLIC COMMANDE SCHEMA
 *
 * validation runtime
 *
 *                ↓
 *
 * PUBLIC COMMANDE QUERY
 *
 * PostgreSQL
 *
 *                ↓
 *
 * prix réel
 * stock réel
 * devise réelle
 * boutique réelle
 * statut réel
 *
 *                ↓
 *
 * PUBLIC COMMANDE DELIVERY
 *
 * countryCode
 *
 *                ↓
 *
 * CAMEROUN
 *
 * 3 000 XAF
 *
 * OU
 *
 * AFRIQUE HORS CAMEROUN
 *
 * 7 000 XAF
 *
 * OU
 *
 * INTERNATIONAL
 *
 * 12 700 XAF
 *
 *                ↓
 *
 * PUBLIC COMMANDE SUMMARY
 *
 * sous-total réel
 *
 * +
 *
 * livraison serveur
 *
 * =
 *
 * total serveur
 *
 *                ↓
 *
 * PUBLIC CHECKOUT STATE
 *
 *                ↓
 *
 * READY_FOR_PAYMENT
 *
 *                ↓
 *
 * /COMMANDE/PAIEMENT
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * READY_FOR_PAYMENT ne signifie jamais :
 *
 * commande créée
 *
 * ou :
 *
 * paiement confirmé.
 *
 * ============================================================================
 *
 * PAIEMENT À LA LIVRAISON :
 *
 * La création réelle de la commande sera effectuée plus tard par
 * public-payment-actions.ts.
 *
 * Aucun Payment PAID ne devra être fabriqué.
 *
 * ============================================================================
 *
 * PAIEMENT EN LIGNE :
 *
 * public-payment-actions.ts devra revérifier :
 *
 * prix
 * stock
 * devise
 * livraison
 * total
 *
 * avant de contacter le vrai provider.
 *
 * ============================================================================
 *
 * APRÈS CRÉATION RÉELLE DE LA COMMANDE :
 *
 * public-order-receipt.ts
 *
 *                ↓
 *
 * PDF
 *
 *                ↓
 *
 * public-order-email.ts
 *
 *                ↓
 *
 * Resend
 *
 *                ↓
 *
 * e-mail de confirmation + reçu PDF
 *
 * ============================================================================
 */