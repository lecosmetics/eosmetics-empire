import type {
  PublicCommandeMoney,
  PublicCommandePrepareInput,
  PublicCommandePreparedCheckout,
} from "@/lib/public/commande/public-commande-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — TYPES DE PAIEMENT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-payment-types.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par :
 *
 * - public-payment-query.ts ;
 * - public-payment-actions.ts ;
 * - PublicPaymentPage.tsx ;
 * - public-success-query.ts ;
 * - PublicSuccessPage.tsx ;
 * - public-order-receipt.ts ;
 * - public-order-email.ts.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier contient uniquement des contrats TypeScript.
 *
 * Il ne :
 *
 * - lit pas Prisma ;
 * - n'appelle pas PostgreSQL ;
 * - ne crée aucune Order ;
 * - ne crée aucun Payment ;
 * - ne contacte aucun provider ;
 * - ne génère aucun reçu ;
 * - n'envoie aucun e-mail.
 *
 * ============================================================================
 *
 * PAIEMENT À LA LIVRAISON :
 *
 * Le paiement à la livraison est un MODE MÉTIER du checkout.
 *
 * Il ne signifie jamais :
 *
 * Payment.status = PAID
 *
 * ============================================================================
 *
 * PAIEMENT EN LIGNE :
 *
 * Une méthode de paiement en ligne n'est disponible que lorsqu'un provider
 * réel est configuré côté serveur.
 *
 * Aucun faux provider ne doit être affiché uniquement pour remplir l'UI.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. MODE DE PAIEMENT PUBLIC
   ========================================================================== */

/**
 * CASH_ON_DELIVERY :
 *
 * commande créée sans débit en ligne.
 *
 * ONLINE :
 *
 * commande / tentative liée à un véritable provider configuré.
 */
export type PublicPaymentMode =
  | "CASH_ON_DELIVERY"
  | "ONLINE";


/* ==========================================================================
   2. MÉTHODES DE PAIEMENT PERSISTABLES
   ========================================================================== */

/**
 * Ces valeurs correspondent aux méthodes techniques actuellement prévues
 * par le modèle Payment.
 *
 * CASH_ON_DELIVERY n'est volontairement PAS ajouté ici.
 */
export type PublicPaymentDatabaseMethod =
  | "CASH"
  | "MOBILE_MONEY"
  | "CARD"
  | "BANK_TRANSFER"
  | "OTHER";


/**
 * Méthodes pouvant être proposées par un véritable provider en ligne.
 *
 * CASH est volontairement exclu du paiement en ligne public.
 */
export type PublicOnlinePaymentMethod =
  Exclude<
    PublicPaymentDatabaseMethod,
    "CASH"
  >;


/* ==========================================================================
   3. STATUTS TECHNIQUES DU PAIEMENT
   ========================================================================== */

export type PublicPaymentDatabaseStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";


/* ==========================================================================
   4. ÉTAT MÉTIER AFFICHÉ AU CLIENT
   ========================================================================== */

/**
 * TO_PAY :
 *
 * commande créée avec paiement à la livraison.
 *
 * PENDING :
 *
 * paiement en ligne démarré mais non confirmé.
 *
 * PAID :
 *
 * paiement réellement confirmé.
 *
 * FAILED :
 *
 * paiement échoué.
 *
 * CANCELLED :
 *
 * paiement annulé.
 */
export type PublicPaymentCustomerState =
  | "TO_PAY"
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";


/* ==========================================================================
   5. ÉTAT DU REÇU
   ========================================================================== */

export type PublicPaymentReceiptState =
  | "TO_PAY"
  | "PAID";


/* ==========================================================================
   6. IDENTIFIANTS
   ========================================================================== */

export type PublicPaymentProviderId =
  string;


export type PublicPaymentProviderReference =
  string;


export type PublicPaymentReference =
  string;


/* ==========================================================================
   7. PROVIDER DE PAIEMENT EN LIGNE
   ========================================================================== */

/**
 * Représentation publique d'un provider réellement configuré.
 *
 * Aucun secret :
 *
 * - API key ;
 * - secret ;
 * - token ;
 * - webhook secret
 *
 * ne doit être présent dans cette structure.
 */
export interface PublicOnlinePaymentProvider {
  readonly id:
    PublicPaymentProviderId;

  /**
   * Nom destiné à l'interface.
   */
  readonly label:
    string;

  /**
   * Méthodes réellement supportées par ce provider.
   */
  readonly methods:
    readonly PublicOnlinePaymentMethod[];

  /**
   * Devises que le provider accepte actuellement.
   *
   * Exemple possible :
   *
   * ["XAF"]
   *
   * mais rien n'est inventé ici.
   */
  readonly currencies:
    readonly string[];

  /**
   * Provider disponible pour ce checkout précis.
   */
  readonly available:
    boolean;

  /**
   * Message informatif si indisponible.
   */
  readonly unavailableReason:
    string | null;
}


/* ==========================================================================
   8. OPTION — PAIEMENT À LA LIVRAISON
   ========================================================================== */

export interface PublicCashOnDeliveryOption {
  readonly mode:
    "CASH_ON_DELIVERY";

  readonly available:
    boolean;

  readonly label:
    string;

  readonly description:
    string;

  readonly unavailableReason:
    string | null;
}


/* ==========================================================================
   9. OPTION — PAIEMENT EN LIGNE
   ========================================================================== */

export interface PublicOnlinePaymentOption {
  readonly mode:
    "ONLINE";

  readonly available:
    boolean;

  readonly label:
    string;

  readonly description:
    string;

  readonly providers:
    readonly PublicOnlinePaymentProvider[];

  readonly unavailableReason:
    string | null;
}


/* ==========================================================================
   10. OPTIONS DE PAIEMENT
   ========================================================================== */

export type PublicPaymentOption =
  | PublicCashOnDeliveryOption
  | PublicOnlinePaymentOption;


/* ==========================================================================
   11. BROUILLON NAVIGATEUR
   ========================================================================== */

/**
 * Contrat du brouillon transporté entre :
 *
 * /commande
 *
 * et :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce brouillon ne contient aucun prix de confiance.
 *
 * Le serveur doit tout recalculer.
 */
export interface PublicPaymentBrowserDraft {
  readonly version:
    1;

  readonly createdAt:
    string;

  readonly input:
    PublicCommandePrepareInput;
}


/* ==========================================================================
   12. SÉLECTION — PAIEMENT À LA LIVRAISON
   ========================================================================== */

export interface PublicCashOnDeliverySelection {
  readonly mode:
    "CASH_ON_DELIVERY";
}


/* ==========================================================================
   13. SÉLECTION — PAIEMENT EN LIGNE
   ========================================================================== */

export interface PublicOnlinePaymentSelection {
  readonly mode:
    "ONLINE";

  /**
   * ID d'un provider déjà exposé par public-payment-query.ts.
   *
   * Le serveur doit quand même revérifier cet ID.
   */
  readonly providerId:
    string;

  readonly method:
    PublicOnlinePaymentMethod;
}


/* ==========================================================================
   14. SÉLECTION DE PAIEMENT
   ========================================================================== */

export type PublicPaymentSelection =
  | PublicCashOnDeliverySelection
  | PublicOnlinePaymentSelection;


/* ==========================================================================
   15. INPUT PAGE PAIEMENT
   ========================================================================== */

/**
 * Input minimal utilisé pour recharger la page paiement.
 *
 * Les informations commerciales sont recalculées côté serveur.
 */
export interface PublicPaymentQueryInput {
  readonly checkout:
    PublicCommandePrepareInput;
}


/* ==========================================================================
   16. INPUT ACTION FINALE
   ========================================================================== */

/**
 * Envoyé lorsqu'une cliente confirme son mode de paiement.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * checkout contient uniquement les données brutes :
 *
 * - IDs StoreProduct ;
 * - quantités ;
 * - cliente ;
 * - adresse.
 *
 * Aucun total navigateur n'est accepté.
 */
export interface PublicPaymentSubmitInput {
  readonly checkout:
    PublicCommandePrepareInput;

  readonly selection:
    PublicPaymentSelection;
}


/* ==========================================================================
   17. DONNÉES PAGE PAIEMENT
   ========================================================================== */

export interface PublicPaymentPageData {
  /**
   * Checkout fraîchement revalidé côté serveur.
   */
  readonly checkout:
    PublicCommandePreparedCheckout;

  /**
   * Options réellement disponibles.
   */
  readonly options:
    readonly PublicPaymentOption[];

  /**
   * Au moins une option permet-elle de continuer ?
   */
  readonly hasAvailablePaymentOption:
    boolean;
}


/* ==========================================================================
   18. CODES D'ÉCHEC — CHARGEMENT PAGE
   ========================================================================== */

export type PublicPaymentPageFailureCode =
  | "INVALID_INPUT"
  | "EMPTY_PANIER"
  | "PANIER_CHANGED"
  | "OFFER_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "DELIVERY_UNAVAILABLE"
  | "CURRENCY_MISMATCH"
  | "CHECKOUT_INVALID"
  | "NO_PAYMENT_OPTION"
  | "SERVER_ERROR";


/* ==========================================================================
   19. RÉSULTAT PAGE PAIEMENT
   ========================================================================== */

export type PublicPaymentPageResult =
  | Readonly<{
      success:
        true;

      data:
        PublicPaymentPageData;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicPaymentPageFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   20. RÉFÉRENCE DE COMMANDE CRÉÉE
   ========================================================================== */

/**
 * Contrat léger retourné après création réelle d'une Order.
 *
 * ============================================================================
 *
 * orders[] reste volontairement un tableau.
 *
 * Le contrat n'impose pas ici une stratégie multi-boutique qui n'a pas encore
 * été définitivement fixée.
 */
export interface PublicPaymentOrderReference {
  readonly id:
    string;

  readonly orderNumber:
    string;

  readonly storeId:
    string;

  readonly currency:
    string;

  readonly total:
    PublicCommandeMoney;
}


/* ==========================================================================
   21. RÉFÉRENCE DE PAIEMENT EN LIGNE
   ========================================================================== */

export interface PublicOnlinePaymentReference {
  readonly id:
    string;

  readonly paymentReference:
    PublicPaymentReference;

  readonly providerId:
    string;

  readonly providerReference:
    string | null;

  readonly method:
    PublicOnlinePaymentMethod;

  readonly status:
    PublicPaymentDatabaseStatus;

  readonly amount:
    PublicCommandeMoney;
}


/* ==========================================================================
   22. SESSION PROVIDER
   ========================================================================== */

/**
 * Résultat éventuel retourné lorsqu'un provider nécessite une redirection.
 *
 * ============================================================================
 *
 * redirectUrl peut rester null pour un provider dont le paiement se poursuit
 * autrement.
 */
export interface PublicOnlinePaymentSession {
  readonly providerId:
    string;

  readonly providerReference:
    string | null;

  readonly redirectUrl:
    string | null;
}


/* ==========================================================================
   23. SUCCÈS — PAIEMENT À LA LIVRAISON
   ========================================================================== */

/**
 * Le type empêche volontairement de déclarer PAID pour ce mode.
 */
export interface PublicCashOnDeliverySuccess {
  readonly mode:
    "CASH_ON_DELIVERY";

  readonly customerState:
    "TO_PAY";

  readonly receiptState:
    "TO_PAY";

  readonly orders:
    readonly PublicPaymentOrderReference[];

  /**
   * Aucun Payment PAID artificiel.
   */
  readonly payment:
    null;
}


/* ==========================================================================
   24. SUCCÈS — PAIEMENT EN LIGNE
   ========================================================================== */

/**
 * Une initialisation en ligne n'implique pas nécessairement que le paiement
 * soit déjà confirmé.
 */
export interface PublicOnlinePaymentSuccess {
  readonly mode:
    "ONLINE";

  readonly customerState:
    Extract<
      PublicPaymentCustomerState,
      "PENDING" |
      "PAID"
    >;

  readonly receiptState:
    PublicPaymentReceiptState;

  readonly orders:
    readonly PublicPaymentOrderReference[];

  readonly payment:
    PublicOnlinePaymentReference;

  readonly session:
    PublicOnlinePaymentSession | null;
}


/* ==========================================================================
   25. SUCCÈS FINAL D'UNE ACTION DE PAIEMENT
   ========================================================================== */

export type PublicPaymentSuccessData =
  | PublicCashOnDeliverySuccess
  | PublicOnlinePaymentSuccess;


/* ==========================================================================
   26. CODES D'ÉCHEC — ACTION
   ========================================================================== */

export type PublicPaymentActionFailureCode =
  | "INVALID_INPUT"
  | "INVALID_SELECTION"
  | "EMPTY_PANIER"
  | "PANIER_CHANGED"
  | "OFFER_NOT_FOUND"
  | "OFFER_UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "DELIVERY_UNAVAILABLE"
  | "CURRENCY_MISMATCH"
  | "TOTAL_CHANGED"
  | "PAYMENT_OPTION_UNAVAILABLE"
  | "PAYMENT_PROVIDER_UNAVAILABLE"
  | "PAYMENT_METHOD_UNAVAILABLE"
  | "ORDER_CREATION_FAILED"
  | "PAYMENT_INITIALIZATION_FAILED"
  | "SERVER_ERROR";


/* ==========================================================================
   27. RÉSULTAT ACTION PAIEMENT
   ========================================================================== */

export type PublicPaymentActionResult =
  | Readonly<{
      success:
        true;

      data:
        PublicPaymentSuccessData;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicPaymentActionFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   28. ÉTAT DE L'INTERFACE PAIEMENT
   ========================================================================== */

export type PublicPaymentClientStatus =
  | "LOADING"
  | "READY"
  | "SUBMITTING"
  | "REDIRECTING"
  | "ERROR";


/* ==========================================================================
   29. ÉTAT CLIENT COMPLET
   ========================================================================== */

export interface PublicPaymentClientState {
  readonly status:
    PublicPaymentClientStatus;

  readonly selection:
    PublicPaymentSelection | null;

  readonly message:
    string | null;
}


/* ==========================================================================
   30. VALIDITÉ D'UNE OPTION
   ========================================================================== */

export interface PublicPaymentOptionAvailability {
  readonly available:
    boolean;

  readonly reason:
    string | null;
}


/* ==========================================================================
   31. VÉRIFICATION PROVIDER
   ========================================================================== */

/**
 * Résultat interne possible de public-payment-query.ts lorsqu'il vérifie
 * un provider demandé.
 */
export type PublicPaymentProviderValidationResult =
  | Readonly<{
      success:
        true;

      provider:
        PublicOnlinePaymentProvider;
    }>
  | Readonly<{
      success:
        false;

      code:
        "PROVIDER_NOT_FOUND" |
        "PROVIDER_DISABLED" |
        "METHOD_NOT_SUPPORTED" |
        "CURRENCY_NOT_SUPPORTED";

      message:
        string;
    }>;


/* ==========================================================================
   32. SNAPSHOT FINANCIER AVANT CRÉATION
   ========================================================================== */

/**
 * Snapshot utilisé juste avant l'écriture définitive de la commande.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ces montants doivent provenir du serveur.
 */
export interface PublicPaymentFinancialSnapshot {
  readonly productsSubtotal:
    PublicCommandeMoney;

  readonly delivery:
    PublicCommandeMoney;

  readonly total:
    PublicCommandeMoney;
}


/* ==========================================================================
   33. COMMANDE PRÊTE À ÊTRE CRÉÉE
   ========================================================================== */

/**
 * Contrat interne destiné à public-payment-actions.ts.
 *
 * Il représente un checkout qui vient d'être revérifié.
 */
export interface PublicPaymentVerifiedCheckout {
  readonly checkout:
    PublicCommandePreparedCheckout;

  readonly financial:
    PublicPaymentFinancialSnapshot;
}


/* ==========================================================================
   34. MODE DU REÇU
   ========================================================================== */

export type PublicReceiptPaymentMode =
  | "CASH_ON_DELIVERY"
  | "ONLINE";


/* ==========================================================================
   35. INFORMATIONS PAIEMENT POUR REÇU
   ========================================================================== */

export type PublicReceiptPaymentInformation =
  | Readonly<{
      mode:
        "CASH_ON_DELIVERY";

      label:
        "Paiement à la livraison";

      state:
        "TO_PAY";
    }>
  | Readonly<{
      mode:
        "ONLINE";

      label:
        string;

      state:
        "PAID";

      paymentReference:
        string;
    }>;


/* ==========================================================================
   36. DONNÉES POUR PAGE SUCCÈS
   ========================================================================== */

/**
 * Données minimales que public-success-query.ts pourra fournir après avoir
 * relu l'état réel en base.
 *
 * ============================================================================
 *
 * La présence de /commande/succes dans l'URL ne prouve rien.
 *
 * Ces données doivent venir d'une vraie relecture serveur.
 */
export interface PublicPaymentSuccessPageData {
  readonly orders:
    readonly PublicPaymentOrderReference[];

  readonly paymentMode:
    PublicPaymentMode;

  readonly paymentState:
    PublicPaymentCustomerState;

  readonly receiptState:
    PublicPaymentReceiptState;

  readonly customerEmail:
    string | null;
}


/* ==========================================================================
   37. RÉSULTAT PAGE SUCCÈS
   ========================================================================== */

export type PublicPaymentSuccessPageFailureCode =
  | "INVALID_REFERENCE"
  | "ORDER_NOT_FOUND"
  | "PAYMENT_NOT_FOUND"
  | "PAYMENT_NOT_CONFIRMED"
  | "SERVER_ERROR";


export type PublicPaymentSuccessPageResult =
  | Readonly<{
      success:
        true;

      data:
        PublicPaymentSuccessPageData;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicPaymentSuccessPageFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   38. ÉTAT E-MAIL / REÇU APRÈS CRÉATION
   ========================================================================== */

/**
 * L'échec de l'e-mail ne doit pas annuler une Order déjà créée.
 */
export type PublicOrderPostCreationTaskStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED";


export interface PublicOrderPostCreationTasks {
  readonly receipt:
    PublicOrderPostCreationTaskStatus;

  readonly email:
    PublicOrderPostCreationTaskStatus;
}


/* ==========================================================================
   39. RÉSULTAT GLOBAL POST-CRÉATION
   ========================================================================== */

/**
 * Permet à public-payment-actions.ts de retourner une vraie commande même si
 * l'envoi du reçu ou de l'e-mail doit être retenté plus tard.
 */
export interface PublicOrderCreationCompletion {
  readonly orders:
    readonly PublicPaymentOrderReference[];

  readonly tasks:
    PublicOrderPostCreationTasks;
}


/* ==========================================================================
   40. TYPE GUARDS UTILITAIRES
   ========================================================================== */

export type PublicCashOnDeliveryPaymentSuccess =
  Extract<
    PublicPaymentSuccessData,
    {
      readonly mode:
        "CASH_ON_DELIVERY";
    }
  >;


export type PublicOnlinePaymentActionSuccess =
  Extract<
    PublicPaymentSuccessData,
    {
      readonly mode:
        "ONLINE";
    }
  >;


export type PublicPaymentActionFailure =
  Extract<
    PublicPaymentActionResult,
    {
      readonly success:
        false;
    }
  >;


export type PublicPaymentPageFailure =
  Extract<
    PublicPaymentPageResult,
    {
      readonly success:
        false;
    }
  >;


/* ==========================================================================
   41. DOCUMENTATION DU FLUX
   ========================================================================== */

/**
 * ============================================================================
 *
 * /COMMANDE
 *
 * PublicCommandePrepareInput
 *
 *              ↓
 *
 * /COMMANDE/PAIEMENT
 *
 * public-payment-query.ts
 *
 *              ↓
 *
 * revalidation serveur :
 *
 * produits
 * boutiques
 * stock
 * prix
 * devise
 * adresse
 * livraison
 * total
 *
 *              ↓
 *
 * PublicPaymentPageData
 *
 *              ↓
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ OPTION 1                                                    │
 * │                                                             │
 * │ PAIEMENT À LA LIVRAISON                                     │
 * │                                                             │
 * │ mode = CASH_ON_DELIVERY                                     │
 * │                                                             │
 * │ création Order                                              │
 * │                                                             │
 * │ Payment PAID artificiel = INTERDIT                          │
 * │                                                             │
 * │ reçu = À payer                                              │
 * └─────────────────────────────────────────────────────────────┘
 *
 * ou :
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │ OPTION 2                                                    │
 * │                                                             │
 * │ PAIEMENT EN LIGNE                                           │
 * │                                                             │
 * │ uniquement si provider réel configuré                       │
 * │                                                             │
 * │ MOBILE_MONEY / CARD / BANK_TRANSFER / OTHER                 │
 * │                                                             │
 * │ jamais de faux provider                                     │
 * └─────────────────────────────────────────────────────────────┘
 *
 *              ↓
 *
 * public-payment-actions.ts
 *
 *              ↓
 *
 * REVALIDATION FINALE
 *
 *              ↓
 *
 * création réelle Order
 *
 *              ↓
 *
 * si ONLINE :
 *
 * création / initialisation vraie Payment
 *
 *              ↓
 *
 * public-order-receipt.ts
 *
 *              ↓
 *
 * génération PDF
 *
 *              ↓
 *
 * public-order-email.ts
 *
 *              ↓
 *
 * e-mail de confirmation
 *
 *              ↓
 *
 * /commande/succes
 *
 *              ↓
 *
 * public-success-query.ts
 *
 *              ↓
 *
 * relecture serveur réelle
 *
 * ============================================================================
 */