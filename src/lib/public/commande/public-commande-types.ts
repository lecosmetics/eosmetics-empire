/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — TYPES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-commande-types.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par le parcours public :
 *
 * /panier
 *    ↓
 * /commande
 *    ↓
 * /commande/paiement
 *    ↓
 * /commande/succes
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier contient UNIQUEMENT :
 *
 * - des types ;
 * - des interfaces ;
 * - des unions de valeurs métier ;
 * - des contrats de données.
 *
 * ============================================================================
 *
 * Ce fichier ne contient :
 *
 * - aucun composant React ;
 * - aucun "use client" ;
 * - aucun accès Prisma ;
 * - aucun accès PostgreSQL ;
 * - aucune Server Action ;
 * - aucune requête ;
 * - aucune validation Zod ;
 * - aucun calcul de livraison ;
 * - aucun montant de livraison codé en dur ;
 * - aucune création de commande ;
 * - aucun paiement ;
 * - aucun appel Resend ;
 * - aucune génération PDF.
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * Le navigateur ne constitue jamais la source de vérité pour :
 *
 * - le prix ;
 * - la devise ;
 * - le stock ;
 * - la disponibilité ;
 * - la boutique ;
 * - le sous-total ;
 * - les frais de livraison ;
 * - le total ;
 * - l'état du paiement.
 *
 * Le navigateur peut transmettre uniquement :
 *
 * - storeProductId ;
 * - quantity ;
 * - informations saisies par la cliente.
 *
 * Toutes les données commerciales doivent ensuite être recalculées
 * ou relues côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES MONÉTAIRES
   ========================================================================== */

/**
 * Un montant monétaire exposé dans les contrats publics.
 *
 * IMPORTANT :
 *
 * amount reste une string.
 *
 * Cela évite de convertir prématurément un Decimal PostgreSQL / Prisma
 * vers un number JavaScript et de perdre de la précision.
 *
 * Exemples :
 *
 * {
 *   amount: "20000",
 *   currency: "XAF"
 * }
 *
 * {
 *   amount: "25.50",
 *   currency: "EUR"
 * }
 */
export interface PublicCommandeMoney {
  readonly amount:
    string;

  readonly currency:
    string;
}


/**
 * Sous-total regroupé par devise.
 *
 * Utile si plusieurs offres du Panier ne partagent pas la même devise.
 *
 * Aucun total multi-devise ne doit être inventé.
 */
export interface PublicCommandeCurrencySubtotal {
  readonly currency:
    string;

  readonly amount:
    string;
}


/* ==========================================================================
   2. ENTRÉE PANIER — NAVIGATEUR
   ========================================================================== */

/**
 * Ligne minimale provenant du Panier navigateur.
 *
 * C'est volontairement le SEUL contrat accepté depuis le navigateur
 * pour identifier un produit commercial.
 *
 * Aucun prix n'est transmis ici.
 */
export interface PublicCommandePanierItemInput {
  readonly storeProductId:
    string;

  readonly quantity:
    number;
}


/**
 * Ensemble des lignes provenant du Panier.
 */
export interface PublicCommandePanierInput {
  readonly items:
    readonly PublicCommandePanierItemInput[];
}


/* ==========================================================================
   3. INFORMATIONS CLIENTE — ENTRÉE FORMULAIRE
   ========================================================================== */

/**
 * Valeurs brutes provenant du formulaire.
 *
 * Ces valeurs doivent passer dans :
 *
 * public-commande-schema.ts
 *
 * avant toute utilisation métier.
 */
export interface PublicCommandeCustomerInput {
  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly email:
    string;

  readonly phone:
    string;

  /**
   * Facultatif.
   *
   * Une chaîne vide peut être envoyée par le formulaire.
   * Le schéma pourra ensuite la transformer en null.
   */
  readonly whatsapp:
    string;
}


/**
 * Informations cliente après validation / normalisation serveur.
 */
export interface PublicCommandeCustomer {
  readonly firstName:
    string;

  readonly lastName:
    string;

  readonly email:
    string;

  readonly phone:
    string;

  readonly whatsapp:
    string | null;
}


/* ==========================================================================
   4. ADRESSE DE LIVRAISON — ENTRÉE FORMULAIRE
   ========================================================================== */

/**
 * Valeurs brutes saisies sur /commande.
 *
 * countryCode :
 *
 * code pays normalisé utilisé pour déterminer proprement la zone
 * de livraison.
 *
 * Exemple :
 *
 * CM
 *
 * countryName :
 *
 * nom visible / stockable.
 *
 * Exemple :
 *
 * Cameroun
 */
export interface PublicCommandeAddressInput {
  readonly countryCode:
    string;

  readonly countryName:
    string;

  readonly city:
    string;

  readonly address:
    string;

  readonly addressComplement:
    string;

  readonly postalCode:
    string;
}


/**
 * Adresse normalisée après validation serveur.
 */
export interface PublicCommandeAddress {
  readonly countryCode:
    string;

  readonly countryName:
    string;

  readonly city:
    string;

  readonly address:
    string;

  readonly addressComplement:
    string | null;

  readonly postalCode:
    string;
}


/* ==========================================================================
   5. FORMULAIRE COMPLET
   ========================================================================== */

/**
 * Données envoyées depuis la page /commande.
 *
 * IMPORTANT :
 *
 * Aucun montant financier ne fait partie de cet objet.
 */
export interface PublicCommandeFormInput {
  readonly customer:
    PublicCommandeCustomerInput;

  readonly address:
    PublicCommandeAddressInput;
}


/**
 * Données du formulaire après validation serveur.
 */
export interface PublicCommandeValidatedForm {
  readonly customer:
    PublicCommandeCustomer;

  readonly address:
    PublicCommandeAddress;
}


/* ==========================================================================
   6. CHAMPS DU FORMULAIRE
   ========================================================================== */

/**
 * Noms de champs reconnus par le checkout.
 *
 * Utilisé notamment pour retourner proprement les erreurs depuis Zod
 * vers l'interface cliente.
 */
export type PublicCommandeFieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "whatsapp"
  | "countryCode"
  | "countryName"
  | "city"
  | "address"
  | "addressComplement"
  | "postalCode";


/**
 * Erreurs associées aux champs.
 */
export type PublicCommandeFieldErrors =
  Partial<
    Record<
      PublicCommandeFieldName,
      string
    >
  >;


/* ==========================================================================
   7. ZONES DE LIVRAISON
   ========================================================================== */

/**
 * Classification officielle utilisée par le calcul de livraison.
 *
 * Les montants ne sont PAS définis ici.
 *
 * Ils seront centralisés dans :
 *
 * src/config/public-delivery.ts
 */
export type PublicCommandeDeliveryZone =
  | "CAMEROON"
  | "AFRICA"
  | "INTERNATIONAL";


/* ==========================================================================
   8. DEVIS DE LIVRAISON
   ========================================================================== */

/**
 * Résultat fiable d'un calcul de livraison effectué côté serveur.
 *
 * IMPORTANT :
 *
 * Cet objet ne doit jamais être accepté comme montant de confiance
 * lorsqu'il est renvoyé par le navigateur.
 *
 * Le serveur doit pouvoir le recalculer.
 */
export interface PublicCommandeDeliveryQuote {
  readonly zone:
    PublicCommandeDeliveryZone;

  readonly countryCode:
    string;

  readonly countryName:
    string;

  readonly amount:
    PublicCommandeMoney;
}


/* ==========================================================================
   9. ÉTAT DU CALCUL DE LIVRAISON
   ========================================================================== */

/**
 * Aucun calcul n'a encore été effectué.
 */
export interface PublicCommandeDeliveryIdleState {
  readonly status:
    "IDLE";

  readonly quote:
    null;

  readonly message:
    null;
}


/**
 * Calcul en cours côté interface.
 */
export interface PublicCommandeDeliveryCalculatingState {
  readonly status:
    "CALCULATING";

  readonly quote:
    null;

  readonly message:
    null;
}


/**
 * Calcul terminé correctement.
 */
export interface PublicCommandeDeliveryReadyState {
  readonly status:
    "READY";

  readonly quote:
    PublicCommandeDeliveryQuote;

  readonly message:
    null;
}


/**
 * Livraison actuellement impossible ou calcul impossible.
 */
export interface PublicCommandeDeliveryErrorState {
  readonly status:
    "ERROR";

  readonly quote:
    null;

  readonly message:
    string;
}


/**
 * État complet utilisé par l'interface.
 */
export type PublicCommandeDeliveryState =
  | PublicCommandeDeliveryIdleState
  | PublicCommandeDeliveryCalculatingState
  | PublicCommandeDeliveryReadyState
  | PublicCommandeDeliveryErrorState;


/* ==========================================================================
   10. BOUTIQUE
   ========================================================================== */

/**
 * Informations publiques minimales d'une boutique associée à une offre.
 */
export interface PublicCommandeStore {
  readonly id:
    string;

  readonly name:
    string;

  readonly city:
    string;

  readonly country:
    string;
}


/* ==========================================================================
   11. IMAGE PRODUIT
   ========================================================================== */

/**
 * Image normalisée pour le checkout.
 *
 * Le checkout n'a pas besoin de connaître le modèle Prisma ProductImage.
 */
export interface PublicCommandeProductImage {
  readonly url:
    string;

  readonly altText:
    string | null;
}


/* ==========================================================================
   12. DISPONIBILITÉ
   ========================================================================== */

export type PublicCommandeAvailability =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";


/**
 * État métier d'une ligne pendant la vérification du checkout.
 */
export type PublicCommandeItemState =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "UNAVAILABLE";


/* ==========================================================================
   13. PRODUIT VALIDÉ CÔTÉ SERVEUR
   ========================================================================== */

/**
 * Ligne de produit rechargée et vérifiée par le serveur.
 *
 * Toutes les valeurs commerciales de cet objet proviennent du serveur.
 */
export interface PublicCommandeValidatedItem {
  /**
   * Offre réellement commercialisée.
   */
  readonly storeProductId:
    string;


  /**
   * Produit maître associé.
   */
  readonly productId:
    string;


  /**
   * Token public stable permettant éventuellement de revenir
   * vers /p/[qrToken].
   */
  readonly qrToken:
    string;


  /**
   * Nom actuel du produit.
   */
  readonly name:
    string;


  readonly sku:
    string | null;


  readonly image:
    PublicCommandeProductImage | null;


  /**
   * Quantité demandée par la cliente.
   */
  readonly quantity:
    number;


  /**
   * Quantité réellement disponible au moment de la validation.
   */
  readonly availableQuantity:
    number;


  readonly availability:
    PublicCommandeAvailability;


  readonly state:
    PublicCommandeItemState;


  /**
   * Prix unitaire réellement relu côté serveur.
   */
  readonly unitPrice:
    PublicCommandeMoney;


  /**
   * quantity × unitPrice
   *
   * Calculé côté serveur.
   */
  readonly subtotal:
    PublicCommandeMoney;


  readonly store:
    PublicCommandeStore;
}


/* ==========================================================================
   14. PROBLÈMES SUR UNE LIGNE
   ========================================================================== */

/**
 * Codes cohérents avec les problèmes déjà rencontrés dans le Panier.
 */
export type PublicCommandeItemIssueCode =
  | "OFFER_NOT_FOUND"
  | "OFFER_UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY";


export interface PublicCommandeItemIssue {
  readonly storeProductId:
    string;

  readonly code:
    PublicCommandeItemIssueCode;

  readonly message:
    string;
}


/* ==========================================================================
   15. SNAPSHOT SERVEUR DU PANIER
   ========================================================================== */

/**
 * Snapshot complet généré après relecture serveur.
 *
 * IMPORTANT :
 *
 * Il s'agit d'un snapshot d'affichage / validation.
 *
 * La création finale d'une commande doit encore revalider les données
 * critiques avant écriture en base.
 */
export interface PublicCommandeSnapshot {
  readonly items:
    readonly PublicCommandeValidatedItem[];

  readonly issues:
    readonly PublicCommandeItemIssue[];


  /**
   * Nombre de lignes différentes.
   */
  readonly itemCount:
    number;


  /**
   * Somme des quantités.
   */
  readonly totalQuantity:
    number;


  /**
   * Boutiques réellement présentes dans les lignes.
   */
  readonly storeIds:
    readonly string[];


  /**
   * Devises réellement présentes.
   */
  readonly currencies:
    readonly string[];


  /**
   * Sous-totaux regroupés par devise.
   *
   * On ne mélange jamais artificiellement XAF, EUR, XOF, etc.
   */
  readonly subtotals:
    readonly PublicCommandeCurrencySubtotal[];


  /**
   * Vrai uniquement lorsque toutes les lignes sont actuellement
   * utilisables pour continuer.
   */
  readonly allItemsAvailable:
    boolean;
}


/* ==========================================================================
   16. RÉSUMÉ FINANCIER
   ========================================================================== */

/**
 * Résumé lorsque le checkout peut réellement produire un total.
 *
 * IMPORTANT :
 *
 * delivery peut être null tant que le pays n'a pas encore permis
 * de calculer les frais.
 *
 * total peut donc également rester null.
 */
export interface PublicCommandeSummary {
  /**
   * Sous-total produits.
   *
   * null lorsqu'un total unique ne peut pas être représenté proprement.
   */
  readonly productsSubtotal:
    PublicCommandeMoney | null;


  /**
   * Frais de livraison calculés par le serveur.
   */
  readonly delivery:
    PublicCommandeMoney | null;


  /**
   * Total final.
   *
   * Doit rester null tant que le serveur ne dispose pas de toutes
   * les données permettant un calcul fiable.
   */
  readonly total:
    PublicCommandeMoney | null;
}


/* ==========================================================================
   17. DONNÉES DE LA PAGE /COMMANDE
   ========================================================================== */

/**
 * Données nécessaires à l'affichage initial de /commande.
 */
export interface PublicCommandePageData {
  readonly snapshot:
    PublicCommandeSnapshot;

  readonly summary:
    PublicCommandeSummary;

  readonly delivery:
    PublicCommandeDeliveryState;
}


/* ==========================================================================
   18. CALCUL DE LIVRAISON — ENTRÉE
   ========================================================================== */

/**
 * Entrée du service :
 *
 * public-commande-delivery.ts
 *
 * On transmet l'adresse validée.
 *
 * Le montant n'est jamais fourni par le navigateur.
 */
export interface PublicCommandeDeliveryCalculationInput {
  readonly address:
    PublicCommandeAddress;
}


/* ==========================================================================
   19. CALCUL DE LIVRAISON — RÉSULTAT
   ========================================================================== */

export type PublicCommandeDeliveryFailureCode =
  | "INVALID_ADDRESS"
  | "UNSUPPORTED_DESTINATION"
  | "CURRENCY_MISMATCH"
  | "SERVER_ERROR";


export type PublicCommandeDeliveryResult =
  | Readonly<{
      success:
        true;

      data:
        PublicCommandeDeliveryQuote;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicCommandeDeliveryFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   20. CHARGEMENT DU CHECKOUT
   ========================================================================== */

export type PublicCommandeLoadFailureCode =
  | "EMPTY_PANIER"
  | "INVALID_INPUT"
  | "VALIDATION_FAILED"
  | "SERVER_ERROR";


/**
 * Résultat retourné par :
 *
 * public-commande-query.ts
 */
export type PublicCommandeLoadResult =
  | Readonly<{
      success:
        true;

      data:
        PublicCommandeSnapshot;
    }>
  | Readonly<{
      success:
        false;

      code:
        PublicCommandeLoadFailureCode;

      message:
        string;
    }>;


/* ==========================================================================
   21. PRÉPARATION DU CHECKOUT
   ========================================================================== */

/**
 * Données que l'interface peut transmettre lorsqu'une cliente souhaite
 * continuer vers le paiement.
 *
 * IMPORTANT :
 *
 * Aucun prix n'est présent.
 *
 * Aucun frais de livraison n'est présent.
 *
 * Aucun total n'est présent.
 */
export interface PublicCommandePrepareInput {
  readonly items:
    readonly PublicCommandePanierItemInput[];

  readonly customer:
    PublicCommandeCustomerInput;

  readonly address:
    PublicCommandeAddressInput;
}


/* ==========================================================================
   22. CHECKOUT PRÉPARÉ
   ========================================================================== */

/**
 * État fiable obtenu après :
 *
 * - validation du formulaire ;
 * - relecture des produits ;
 * - vérification du stock ;
 * - relecture des prix ;
 * - vérification des boutiques ;
 * - vérification des devises ;
 * - calcul serveur de la livraison.
 *
 * Cet objet peut ensuite alimenter public-checkout-state.ts.
 */
export interface PublicCommandePreparedCheckout {
  readonly customer:
    PublicCommandeCustomer;

  readonly address:
    PublicCommandeAddress;

  readonly snapshot:
    PublicCommandeSnapshot;

  readonly delivery:
    PublicCommandeDeliveryQuote;

  readonly summary:
    PublicCommandeSummary;
}


/* ==========================================================================
   23. ÉCHECS DE PRÉPARATION
   ========================================================================== */

export type PublicCommandePrepareFailureCode =
  | "INVALID_FORM"
  | "EMPTY_PANIER"
  | "INVALID_PANIER"
  | "OFFER_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "DELIVERY_UNAVAILABLE"
  | "CURRENCY_MISMATCH"
  | "SERVER_ERROR";


/* ==========================================================================
   24. RÉSULTAT DE PRÉPARATION
   ========================================================================== */

/**
 * Résultat principal attendu de public-commande-actions.ts
 * avant le passage vers /commande/paiement.
 */
export type PublicCommandePrepareResult =
  | Readonly<{
      success:
        true;

      data:
        PublicCommandePreparedCheckout;
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
   25. ÉTAT DU CHECKOUT
   ========================================================================== */

/**
 * États généraux du parcours avant paiement.
 *
 * La logique réelle de stockage / signature / expiration sera gérée dans :
 *
 * public-checkout-state.ts
 */
export type PublicCheckoutStateStatus =
  | "COLLECTING_INFORMATION"
  | "VALIDATING"
  | "READY_FOR_PAYMENT"
  | "INVALID"
  | "EXPIRED";


/* ==========================================================================
   26. ÉTAT CLIENT DE LA PAGE COMMANDE
   ========================================================================== */

/**
 * Contrat pratique pour PublicCommandePage.tsx.
 *
 * Ce type décrit l'état d'interface.
 *
 * Il ne donne aucune autorité au navigateur sur les montants.
 */
export interface PublicCommandeClientState {
  readonly status:
    PublicCheckoutStateStatus;

  readonly delivery:
    PublicCommandeDeliveryState;

  readonly summary:
    PublicCommandeSummary;

  readonly fieldErrors:
    PublicCommandeFieldErrors;

  readonly message:
    string | null;
}


/* ==========================================================================
   27. INFORMATIONS DE COMMANDE CRÉÉE
   ========================================================================== */

/**
 * Référence minimale d'une commande créée.
 *
 * Utilisable ensuite par :
 *
 * - paiement ;
 * - succès ;
 * - reçu PDF ;
 * - e-mail.
 */
export interface PublicCommandeCreatedOrderReference {
  readonly orderId:
    string;

  readonly orderNumber:
    string;
}


/**
 * Une opération peut produire une ou plusieurs références si l'architecture
 * serveur doit ultérieurement séparer plusieurs commandes.
 *
 * Le type n'impose toutefois aucune stratégie de séparation.
 */
export interface PublicCommandeCreationReference {
  readonly orders:
    readonly PublicCommandeCreatedOrderReference[];
}


/* ==========================================================================
   28. DONNÉES POUR REÇU
   ========================================================================== */

/**
 * Ligne commerciale utilisable pour construire le futur reçu PDF.
 *
 * Les valeurs doivent provenir d'une commande réellement enregistrée,
 * jamais directement du navigateur.
 */
export interface PublicCommandeReceiptItem {
  readonly productName:
    string;

  readonly sku:
    string | null;

  readonly imageUrl:
    string | null;

  readonly quantity:
    number;

  readonly unitPrice:
    PublicCommandeMoney;

  readonly totalPrice:
    PublicCommandeMoney;
}


/**
 * Données communes nécessaires au reçu.
 *
 * Le statut de paiement détaillé sera complété par les types spécifiques
 * présents dans public-payment-types.ts.
 */
export interface PublicCommandeReceiptData {
  readonly orderId:
    string;

  readonly orderNumber:
    string;

  readonly createdAt:
    string;

  readonly customer:
    PublicCommandeCustomer;

  readonly address:
    PublicCommandeAddress;

  readonly items:
    readonly PublicCommandeReceiptItem[];

  readonly productsSubtotal:
    PublicCommandeMoney;

  readonly delivery:
    PublicCommandeMoney;

  readonly total:
    PublicCommandeMoney;
}


/* ==========================================================================
   29. HELPERS DE TYPES
   ========================================================================== */

/**
 * Type utilitaire permettant d'obtenir uniquement le cas succès
 * d'un résultat discriminé.
 */
export type PublicCommandeSuccessResult<
  TResult extends {
    readonly success:
      boolean;
  },
> =
  Extract<
    TResult,
    {
      readonly success:
        true;
    }
  >;


/**
 * Type utilitaire permettant d'obtenir uniquement le cas erreur.
 */
export type PublicCommandeFailureResult<
  TResult extends {
    readonly success:
      boolean;
  },
> =
  Extract<
    TResult,
    {
      readonly success:
        false;
    }
  >;


/* ==========================================================================
   30. DOCUMENTATION DU CONTRAT
   ========================================================================== */

/**
 * ============================================================================
 *
 * FLUX DE DONNÉES
 *
 * ============================================================================
 *
 * PANIER NAVIGATEUR
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 *                ↓
 *
 * public-commande-query.ts
 *
 *                ↓
 *
 * PostgreSQL
 *
 * StoreProduct
 * Product
 * ProductImage
 * Store
 *
 *                ↓
 *
 * PublicCommandeSnapshot
 *
 *                ↓
 *
 * INFORMATIONS CLIENTE
 *
 * prénom
 * nom
 * e-mail
 * téléphone
 * WhatsApp facultatif
 *
 *                ↓
 *
 * ADRESSE
 *
 * pays
 * ville
 * adresse
 * complément facultatif
 * code postal
 *
 *                ↓
 *
 * public-commande-schema.ts
 *
 *                ↓
 *
 * PublicCommandeValidatedForm
 *
 *                ↓
 *
 * public-commande-delivery.ts
 *
 *                ↓
 *
 * PublicCommandeDeliveryQuote
 *
 *                ↓
 *
 * PublicCommandePreparedCheckout
 *
 *                ↓
 *
 * public-checkout-state.ts
 *
 *                ↓
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * TARIFS DE LIVRAISON :
 *
 * Les montants eux-mêmes ne sont volontairement PAS présents dans ce fichier.
 *
 * Ils seront centralisés dans :
 *
 * src/config/public-delivery.ts
 *
 * avec les règles validées :
 *
 * Cameroun
 * Afrique hors Cameroun
 * International
 *
 * ============================================================================
 *
 * PAIEMENT :
 *
 * Les types spécifiques :
 *
 * - paiement à la livraison ;
 * - paiement en ligne ;
 * - statut de paiement ;
 * - provider ;
 * - méthode ;
 *
 * appartiennent à :
 *
 * src/lib/public/commande/public-payment-types.ts
 *
 * ============================================================================
 *
 * REÇU :
 *
 * PublicCommandeReceiptData sert uniquement de contrat commun.
 *
 * La génération réelle du PDF appartiendra à :
 *
 * src/lib/public/commande/public-order-receipt.ts
 *
 * ============================================================================
 *
 * RÈGLE ABSOLUE :
 *
 * prix
 * stock
 * devise
 * livraison
 * total
 * statut de paiement
 *
 * doivent toujours être revérifiés côté serveur avant une écriture définitive
 * ou un paiement.
 *
 * ============================================================================
 */