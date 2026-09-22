import "server-only";

import {
  preparePublicCommandeCheckout,
} from "@/lib/public/commande/public-commande-actions";

import {
  safeParsePublicCommandePrepareInput,
} from "@/lib/public/commande/public-commande-schema";

import type {
  PublicCommandePrepareInput,
  PublicCommandePrepareResult,
  PublicCommandePreparedCheckout,
} from "@/lib/public/commande/public-commande-types";

import type {
  PublicCashOnDeliveryOption,
  PublicOnlinePaymentMethod,
  PublicOnlinePaymentOption,
  PublicOnlinePaymentProvider,
  PublicPaymentOption,
  PublicPaymentOptionAvailability,
  PublicPaymentPageFailureCode,
  PublicPaymentPageResult,
  PublicPaymentProviderValidationResult,
  PublicPaymentQueryInput,
} from "@/lib/public/commande/public-payment-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — REQUÊTE PAIEMENT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-payment-query.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Préparer les données fiables nécessaires à :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * FLUX :
 *
 * Brouillon navigateur
 *
 * {
 *   items: [
 *     {
 *       storeProductId,
 *       quantity
 *     }
 *   ],
 *
 *   customer,
 *   address
 * }
 *
 *              ↓
 *
 * validation runtime
 *
 *              ↓
 *
 * preparePublicCommandeCheckout()
 *
 *              ↓
 *
 * revalidation serveur :
 *
 * - produits ;
 * - offres ;
 * - boutiques ;
 * - stocks ;
 * - quantités ;
 * - prix ;
 * - devises ;
 * - adresse ;
 * - livraison ;
 * - sous-total ;
 * - total.
 *
 *              ↓
 *
 * options de paiement réellement disponibles
 *
 *              ↓
 *
 * PublicPaymentPageData
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier ne :
 *
 * - crée aucune Order ;
 * - crée aucun Payment ;
 * - réserve aucun stock ;
 * - décrémente aucun stock ;
 * - contacte aucun provider ;
 * - envoie aucun e-mail ;
 * - génère aucun reçu ;
 * - invente aucun moyen de paiement.
 *
 * ============================================================================
 *
 * PAIEMENT À LA LIVRAISON :
 *
 * Disponible pour un checkout valide.
 *
 * Aucun Payment PAID n'est créé ici.
 *
 * ============================================================================
 *
 * PAIEMENT EN LIGNE :
 *
 * Aucun provider n'étant encore branché dans l'architecture publique du
 * checkout, aucun faux provider n'est exposé.
 *
 * Lorsque le vrai provider sera intégré, il devra alimenter explicitement :
 *
 * getConfiguredPublicOnlinePaymentProviders()
 *
 * ============================================================================
 */


/* ==========================================================================
   1. MESSAGES
   ========================================================================== */

const PUBLIC_PAYMENT_QUERY_MESSAGES = {
  invalidInput:
    "Les informations de paiement ne sont pas valides.",

  emptyPanier:
    "Votre panier est vide.",

  panierChanged:
    "Votre panier a changé. Vérifiez de nouveau votre commande avant de continuer.",

  offerUnavailable:
    "Un ou plusieurs articles de votre panier ne sont plus disponibles.",

  insufficientStock:
    "La quantité demandée pour un ou plusieurs articles dépasse le stock disponible.",

  deliveryUnavailable:
    "Les frais de livraison ne peuvent plus être confirmés pour cette commande.",

  currencyMismatch:
    "La devise de la commande n’est pas compatible avec les options de paiement disponibles.",

  checkoutInvalid:
    "La commande doit être vérifiée de nouveau avant le paiement.",

  noPaymentOption:
    "Aucun mode de paiement n’est disponible actuellement.",

  serverError:
    "Impossible de préparer le paiement actuellement. Réessayez dans quelques instants.",

  onlineUnavailable:
    "Le paiement en ligne n’est pas encore disponible pour cette commande.",
} as const;


/* ==========================================================================
   2. TYPE INTERNE — RECORD
   ========================================================================== */

type UnknownRecord =
  Record<
    string,
    unknown
  >;


/* ==========================================================================
   3. VÉRIFICATION OBJET
   ========================================================================== */

function isUnknownRecord(
  value:
    unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


/* ==========================================================================
   4. NORMALISATION DEVISE
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
   5. VALIDATION DEVISE
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
   6. VALIDATION MONTANT
   ========================================================================== */

/**
 * Validation structurelle uniquement.
 *
 * Aucun calcul financier n'est effectué ici.
 */
function isValidMoneyAmount(
  amount:
    string,
): boolean {
  return /^\d+(?:\.\d{1,2})?$/u.test(
    amount.trim(),
  );
}


/* ==========================================================================
   7. VALIDATION INPUT QUERY
   ========================================================================== */

type ParsePublicPaymentQueryInputResult =
  | Readonly<{
      success:
        true;

      data:
        PublicPaymentQueryInput;
    }>
  | Readonly<{
      success:
        false;
    }>;


/**
 * Le payload de la page paiement doit avoir exactement :
 *
 * {
 *   checkout: PublicCommandePrepareInput
 * }
 *
 * ============================================================================
 *
 * Aucun champ financier supplémentaire n'est accepté.
 */
function parsePublicPaymentQueryInput(
  input:
    unknown,
): ParsePublicPaymentQueryInputResult {
  if (
    !isUnknownRecord(
      input,
    )
  ) {
    return {
      success:
        false,
    };
  }


  const keys =
    Object.keys(
      input,
    );


  if (
    keys.length !==
      1 ||
    keys[
      0
    ] !==
      "checkout"
  ) {
    return {
      success:
        false,
    };
  }


  const checkoutResult =
    safeParsePublicCommandePrepareInput(
      input.checkout,
    );


  if (
    !checkoutResult.success
  ) {
    return {
      success:
        false,
    };
  }


  const checkout:
    PublicCommandePrepareInput =
      checkoutResult.data;


  return {
    success:
      true,

    data: {
      checkout,
    },
  };
}


/* ==========================================================================
   8. MAPPING ERREURS CHECKOUT → PAIEMENT
   ========================================================================== */

function mapCommandePreparationFailure(
  result:
    Extract<
      PublicCommandePrepareResult,
      {
        readonly success:
          false;
      }
    >,
): Readonly<{
  code:
    PublicPaymentPageFailureCode;

  message:
    string;
}> {
  switch (
    result.code
  ) {
    case "EMPTY_PANIER":
      return {
        code:
          "EMPTY_PANIER",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.emptyPanier,
      };


    case "INVALID_PANIER":
      return {
        code:
          "PANIER_CHANGED",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.panierChanged,
      };


    case "OFFER_UNAVAILABLE":
      return {
        code:
          "OFFER_UNAVAILABLE",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.offerUnavailable,
      };


    case "INSUFFICIENT_STOCK":
      return {
        code:
          "INSUFFICIENT_STOCK",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.insufficientStock,
      };


    case "DELIVERY_UNAVAILABLE":
      return {
        code:
          "DELIVERY_UNAVAILABLE",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.deliveryUnavailable,
      };


    case "CURRENCY_MISMATCH":
      return {
        code:
          "CURRENCY_MISMATCH",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.currencyMismatch,
      };


    case "INVALID_FORM":
      return {
        code:
          "INVALID_INPUT",

        message:
          result.message ||
          PUBLIC_PAYMENT_QUERY_MESSAGES.invalidInput,
      };


    case "SERVER_ERROR":
    default:
      return {
        code:
          "SERVER_ERROR",

        message:
          PUBLIC_PAYMENT_QUERY_MESSAGES.serverError,
      };
  }
}


/* ==========================================================================
   9. VALIDATION CHECKOUT PRÉPARÉ
   ========================================================================== */

/**
 * preparePublicCommandeCheckout() réalise déjà la vraie revalidation.
 *
 * Ce contrôle supplémentaire protège néanmoins le contrat attendu
 * spécifiquement par la page paiement.
 */
function isPreparedCheckoutValidForPayment(
  checkout:
    PublicCommandePreparedCheckout,
): boolean {
  /* ------------------------------------------------------------------------
     PANIER
     ------------------------------------------------------------------------ */

  if (
    checkout.snapshot.items.length ===
      0 ||
    checkout.snapshot.issues.length >
      0 ||
    !checkout.snapshot.allItemsAvailable
  ) {
    return false;
  }


  /* ------------------------------------------------------------------------
     RÉSUMÉ
     ------------------------------------------------------------------------ */

  const {
    productsSubtotal,
    delivery,
    total,
  } =
    checkout.summary;


  if (
    productsSubtotal ===
      null ||
    delivery ===
      null ||
    total ===
      null
  ) {
    return false;
  }


  /* ------------------------------------------------------------------------
     DEVISES
     ------------------------------------------------------------------------ */

  const productsCurrency =
    normalizeCurrency(
      productsSubtotal.currency,
    );


  const deliveryCurrency =
    normalizeCurrency(
      delivery.currency,
    );


  const totalCurrency =
    normalizeCurrency(
      total.currency,
    );


  if (
    !isValidCurrencyCode(
      productsCurrency,
    ) ||
    !isValidCurrencyCode(
      deliveryCurrency,
    ) ||
    !isValidCurrencyCode(
      totalCurrency,
    )
  ) {
    return false;
  }


  if (
    productsCurrency !==
      deliveryCurrency ||
    productsCurrency !==
      totalCurrency
  ) {
    return false;
  }


  /* ------------------------------------------------------------------------
     MONTANTS
     ------------------------------------------------------------------------ */

  if (
    !isValidMoneyAmount(
      productsSubtotal.amount,
    ) ||
    !isValidMoneyAmount(
      delivery.amount,
    ) ||
    !isValidMoneyAmount(
      total.amount,
    )
  ) {
    return false;
  }


  return true;
}


/* ==========================================================================
   10. OPTION PAIEMENT À LA LIVRAISON
   ========================================================================== */

function buildCashOnDeliveryOption():
  PublicCashOnDeliveryOption {
  return {
    mode:
      "CASH_ON_DELIVERY",

    available:
      true,

    label:
      "Paiement à la livraison",

    description:
      "Passez votre commande maintenant et réglez le montant lors de la livraison.",

    unavailableReason:
      null,
  };
}


/* ==========================================================================
   11. PROVIDERS EN LIGNE CONFIGURÉS
   ========================================================================== */

/**
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Aucun provider de paiement public réel n'a encore été branché dans ce
 * parcours.
 *
 * On retourne donc une liste vide.
 *
 * ============================================================================
 *
 * NE PAS FAIRE :
 *
 * return [
 *   {
 *     id: "mobile-money",
 *     ...
 *   }
 * ];
 *
 * tant qu'un véritable provider n'est pas :
 *
 * - configuré ;
 * - sécurisé ;
 * - testé ;
 * - relié à son webhook ;
 * - relié à public-payment-actions.ts.
 *
 * ============================================================================
 *
 * Lorsqu'un provider réel sera intégré, cette fonction pourra être remplacée
 * ou alimentée depuis une configuration serveur dédiée.
 */
function getConfiguredPublicOnlinePaymentProviders():
  readonly PublicOnlinePaymentProvider[] {
  return [];
}


/* ==========================================================================
   12. PROVIDERS COMPATIBLES AVEC LA DEVISE
   ========================================================================== */

function getProvidersForCurrency(
  providers:
    readonly PublicOnlinePaymentProvider[],

  currency:
    string,
): readonly PublicOnlinePaymentProvider[] {
  const normalizedCurrency =
    normalizeCurrency(
      currency,
    );


  return providers.filter(
    (
      provider,
    ) =>
      provider.available &&
      provider.currencies.some(
        (
          providerCurrency,
        ) =>
          normalizeCurrency(
            providerCurrency,
          ) ===
          normalizedCurrency,
      ),
  );
}


/* ==========================================================================
   13. OPTION PAIEMENT EN LIGNE
   ========================================================================== */

function buildOnlinePaymentOption(
  checkout:
    PublicCommandePreparedCheckout,
): PublicOnlinePaymentOption {
  const total =
    checkout.summary.total;


  /**
   * Cette situation devrait normalement avoir été rejetée avant.
   */
  if (
    total ===
    null
  ) {
    return {
      mode:
        "ONLINE",

      available:
        false,

      label:
        "Paiement en ligne",

      description:
        "Réglez votre commande en ligne avec un moyen de paiement disponible.",

      providers:
        [],

      unavailableReason:
        PUBLIC_PAYMENT_QUERY_MESSAGES.onlineUnavailable,
    };
  }


  const configuredProviders =
    getConfiguredPublicOnlinePaymentProviders();


  const compatibleProviders =
    getProvidersForCurrency(
      configuredProviders,
      total.currency,
    );


  if (
    compatibleProviders.length ===
    0
  ) {
    return {
      mode:
        "ONLINE",

      available:
        false,

      label:
        "Paiement en ligne",

      description:
        "Réglez votre commande en ligne avec un moyen de paiement disponible.",

      providers:
        [],

      unavailableReason:
        PUBLIC_PAYMENT_QUERY_MESSAGES.onlineUnavailable,
    };
  }


  return {
    mode:
      "ONLINE",

    available:
      true,

    label:
      "Paiement en ligne",

    description:
      "Réglez votre commande avec l’un des moyens de paiement disponibles.",

    providers:
      compatibleProviders,

    unavailableReason:
      null,
  };
}


/* ==========================================================================
   14. CONSTRUCTION DES OPTIONS
   ========================================================================== */

export function getPublicPaymentOptions(
  checkout:
    PublicCommandePreparedCheckout,
): readonly PublicPaymentOption[] {
  return [
    buildCashOnDeliveryOption(),

    buildOnlinePaymentOption(
      checkout,
    ),
  ];
}


/* ==========================================================================
   15. OPTION DISPONIBLE ?
   ========================================================================== */

export function hasAvailablePublicPaymentOption(
  options:
    readonly PublicPaymentOption[],
): boolean {
  return options.some(
    (
      option,
    ) =>
      option.available,
  );
}


/* ==========================================================================
   16. DISPONIBILITÉ D'UN MODE
   ========================================================================== */

export function getPublicPaymentOptionAvailability(
  options:
    readonly PublicPaymentOption[],

  mode:
    PublicPaymentOption["mode"],
): PublicPaymentOptionAvailability {
  const option =
    options.find(
      (
        currentOption,
      ) =>
        currentOption.mode ===
        mode,
    );


  if (
    !option
  ) {
    return {
      available:
        false,

      reason:
        "Ce mode de paiement n’est pas disponible.",
    };
  }


  return {
    available:
      option.available,

    reason:
      option.available
        ? null
        : option.unavailableReason,
  };
}


/* ==========================================================================
   17. RÉCUPÉRER L'OPTION ONLINE
   ========================================================================== */

export function getPublicOnlinePaymentOption(
  options:
    readonly PublicPaymentOption[],
): PublicOnlinePaymentOption | null {
  const option =
    options.find(
      (
        currentOption,
      ) =>
        currentOption.mode ===
        "ONLINE",
    );


  if (
    !option ||
    option.mode !==
      "ONLINE"
  ) {
    return null;
  }


  return option;
}


/* ==========================================================================
   18. RECHERCHE PROVIDER
   ========================================================================== */

export function findPublicOnlinePaymentProvider(
  options:
    readonly PublicPaymentOption[],

  providerId:
    string,
): PublicOnlinePaymentProvider | null {
  const normalizedProviderId =
    providerId.trim();


  if (
    !normalizedProviderId
  ) {
    return null;
  }


  const onlineOption =
    getPublicOnlinePaymentOption(
      options,
    );


  if (
    !onlineOption
  ) {
    return null;
  }


  return (
    onlineOption.providers.find(
      (
        provider,
      ) =>
        provider.id ===
        normalizedProviderId,
    ) ??
    null
  );
}


/* ==========================================================================
   19. VALIDATION D'UN PROVIDER / MÉTHODE
   ========================================================================== */

/**
 * Helper destiné à public-payment-actions.ts.
 *
 * ============================================================================
 *
 * Même si la page a affiché un provider quelques secondes auparavant,
 * public-payment-actions.ts devra le revérifier au moment du clic final.
 */
export function validatePublicOnlinePaymentProvider(
  params:
    Readonly<{
      options:
        readonly PublicPaymentOption[];

      providerId:
        string;

      method:
        PublicOnlinePaymentMethod;

      currency:
        string;
    }>,
): PublicPaymentProviderValidationResult {
  const {
    options,
    providerId,
    method,
    currency,
  } =
    params;


  const provider =
    findPublicOnlinePaymentProvider(
      options,
      providerId,
    );


  if (
    provider ===
    null
  ) {
    return {
      success:
        false,

      code:
        "PROVIDER_NOT_FOUND",

      message:
        "Le moyen de paiement demandé est introuvable.",
    };
  }


  if (
    !provider.available
  ) {
    return {
      success:
        false,

      code:
        "PROVIDER_DISABLED",

      message:
        provider.unavailableReason ??
        "Ce moyen de paiement n’est pas disponible actuellement.",
    };
  }


  const methodSupported =
    provider.methods.includes(
      method,
    );


  if (
    !methodSupported
  ) {
    return {
      success:
        false,

      code:
        "METHOD_NOT_SUPPORTED",

      message:
        "Cette méthode de paiement n’est pas disponible avec ce provider.",
    };
  }


  const normalizedCurrency =
    normalizeCurrency(
      currency,
    );


  const currencySupported =
    provider.currencies.some(
      (
        providerCurrency,
      ) =>
        normalizeCurrency(
          providerCurrency,
        ) ===
        normalizedCurrency,
    );


  if (
    !currencySupported
  ) {
    return {
      success:
        false,

      code:
        "CURRENCY_NOT_SUPPORTED",

      message:
        "La devise de cette commande n’est pas prise en charge par ce moyen de paiement.",
    };
  }


  return {
    success:
      true,

    provider,
  };
}


/* ==========================================================================
   20. CHARGEMENT PRINCIPAL DE LA PAGE PAIEMENT
   ========================================================================== */

/**
 * Fonction principale utilisée par :
 *
 * PublicPaymentPage.tsx
 *
 * ou par une Server Action intermédiaire.
 *
 * ============================================================================
 *
 * Cette fonction ne fait confiance à aucun état financier enregistré
 * dans le navigateur.
 *
 * Elle repart du PublicCommandePrepareInput minimal et appelle :
 *
 * preparePublicCommandeCheckout()
 *
 * qui recharge et recalcule l'état réel.
 */
export async function loadPublicPaymentPage(
  input:
    unknown,
): Promise<PublicPaymentPageResult> {
  try {
    /* =======================================================================
       1. INPUT
       ======================================================================= */

    const parsedInput =
      parsePublicPaymentQueryInput(
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
          PUBLIC_PAYMENT_QUERY_MESSAGES.invalidInput,
      };
    }


    /* =======================================================================
       2. REVALIDATION CHECKOUT
       ======================================================================= */

    const checkoutResult =
      await preparePublicCommandeCheckout(
        parsedInput.data.checkout,
      );


    if (
      !checkoutResult.success
    ) {
      const mappedFailure =
        mapCommandePreparationFailure(
          checkoutResult,
        );


      return {
        success:
          false,

        code:
          mappedFailure.code,

        message:
          mappedFailure.message,
      };
    }


    const checkout =
      checkoutResult.data;


    /* =======================================================================
       3. VALIDATION PAIEMENT
       ======================================================================= */

    if (
      !isPreparedCheckoutValidForPayment(
        checkout,
      )
    ) {
      return {
        success:
          false,

        code:
          "CHECKOUT_INVALID",

        message:
          PUBLIC_PAYMENT_QUERY_MESSAGES.checkoutInvalid,
      };
    }


    /* =======================================================================
       4. OPTIONS
       ======================================================================= */

    const options =
      getPublicPaymentOptions(
        checkout,
      );


    const hasAvailablePaymentOption =
      hasAvailablePublicPaymentOption(
        options,
      );


    if (
      !hasAvailablePaymentOption
    ) {
      return {
        success:
          false,

        code:
          "NO_PAYMENT_OPTION",

        message:
          PUBLIC_PAYMENT_QUERY_MESSAGES.noPaymentOption,
      };
    }


    /* =======================================================================
       5. RÉSULTAT
       ======================================================================= */

    return {
      success:
        true,

      data: {
        checkout,

        options,

        hasAvailablePaymentOption,
      },
    };
  } catch {
    /**
     * Aucun détail interne n'est renvoyé :
     *
     * - stack ;
     * - Prisma ;
     * - PostgreSQL ;
     * - variables d'environnement ;
     * - secrets provider.
     */
    return {
      success:
        false,

      code:
        "SERVER_ERROR",

      message:
        PUBLIC_PAYMENT_QUERY_MESSAGES.serverError,
    };
  }
}


/* ==========================================================================
   21. VERSION TYPÉE
   ========================================================================== */

export async function loadTypedPublicPaymentPage(
  input:
    PublicPaymentQueryInput,
): Promise<PublicPaymentPageResult> {
  return loadPublicPaymentPage(
    input,
  );
}


/* ==========================================================================
   22. CHARGEMENT DIRECT DEPUIS LE CHECKOUT BRUT
   ========================================================================== */

/**
 * Helper pratique pour les composants / actions qui possèdent déjà directement
 * le PublicCommandePrepareInput.
 */
export async function loadPublicPaymentPageFromCheckout(
  checkout:
    PublicCommandePrepareInput,
): Promise<PublicPaymentPageResult> {
  return loadPublicPaymentPage({
    checkout,
  });
}


/* ==========================================================================
   23. CHECKOUT RÉEL UNIQUEMENT
   ========================================================================== */

/**
 * Retourne le checkout uniquement lorsque toute la page paiement est encore
 * valide.
 *
 * ============================================================================
 *
 * Utile pour public-payment-actions.ts avant une nouvelle vérification finale.
 */
export async function getVerifiedPublicPaymentCheckout(
  checkout:
    PublicCommandePrepareInput,
): Promise<PublicCommandePreparedCheckout | null> {
  const result =
    await loadPublicPaymentPageFromCheckout(
      checkout,
    );


  if (
    !result.success
  ) {
    return null;
  }


  return result.data.checkout;
}


/* ==========================================================================
   24. OPTION CASH ON DELIVERY
   ========================================================================== */

export function getPublicCashOnDeliveryOption(
  options:
    readonly PublicPaymentOption[],
): PublicCashOnDeliveryOption | null {
  const option =
    options.find(
      (
        currentOption,
      ) =>
        currentOption.mode ===
        "CASH_ON_DELIVERY",
    );


  if (
    !option ||
    option.mode !==
      "CASH_ON_DELIVERY"
  ) {
    return null;
  }


  return option;
}


/* ==========================================================================
   25. DOCUMENTATION DU FLUX
   ========================================================================== */

/**
 * ============================================================================
 *
 * /COMMANDE
 *
 *              ↓
 *
 * sessionStorage
 *
 * UNIQUEMENT :
 *
 * storeProductId
 * quantity
 * cliente
 * adresse
 *
 *              ↓
 *
 * /COMMANDE/PAIEMENT
 *
 *              ↓
 *
 * loadPublicPaymentPage()
 *
 *              ↓
 *
 * validation runtime
 *
 *              ↓
 *
 * preparePublicCommandeCheckout()
 *
 *              ↓
 *
 * PostgreSQL
 *
 * relecture :
 *
 * StoreProduct
 * Product
 * Store
 * stock
 * prix
 * devise
 *
 *              ↓
 *
 * livraison recalculée côté serveur
 *
 *              ↓
 *
 * sous-total recalculé
 *
 *              ↓
 *
 * total recalculé
 *
 *              ↓
 *
 * OPTIONS
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ PAIEMENT À LA LIVRAISON                                     │
 * │                                                              │
 * │ disponible                                                   │
 * │                                                              │
 * │ aucun Payment PAID créé ici                                  │
 * └──────────────────────────────────────────────────────────────┘
 *
 * +
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ PAIEMENT EN LIGNE                                            │
 * │                                                              │
 * │ seulement si un vrai provider est configuré                  │
 * │                                                              │
 * │ aucun provider fictif                                        │
 * └──────────────────────────────────────────────────────────────┘
 *
 *              ↓
 *
 * PublicPaymentPageData
 *
 *              ↓
 *
 * PublicPaymentPage.tsx
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * public-payment-query.ts ne crée encore rien en base.
 *
 * La création définitive appartient à :
 *
 * public-payment-actions.ts
 *
 * qui devra ENCORE revérifier les données immédiatement avant :
 *
 * - Order ;
 * - Payment éventuel ;
 * - mouvement de stock éventuel ;
 * - Receipt ;
 * - e-mail.
 *
 * ============================================================================
 */