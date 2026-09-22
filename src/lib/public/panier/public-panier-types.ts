/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TYPES — PANIER PUBLIC
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/panier/public-panier-types.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par le Panier public.
 *
 * ============================================================================
 *
 * ARCHITECTURE DE SÉCURITÉ
 *
 * Le navigateur peut conserver :
 *
 * - StoreProduct.id ;
 * - quantité demandée.
 *
 * Le navigateur NE DOIT PAS être considéré comme source de vérité pour :
 *
 * - Product ;
 * - prix ;
 * - ancien prix ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - statut StoreProduct ;
 * - boutique ;
 * - total.
 *
 * ============================================================================
 *
 * AVANT UNE OPÉRATION SENSIBLE
 *
 * Le serveur doit impérativement recharger le StoreProduct et vérifier :
 *
 * - StoreProduct existe ;
 * - Product est encore public ;
 * - Store est encore public ;
 * - StoreProduct est ACTIVE ;
 * - stock actuel suffisant ;
 * - prix actuel ;
 * - devise actuelle ;
 * - quantité demandée valide.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Une ligne du Panier représente UNE offre StoreProduct.
 *
 * Deux boutiques vendant le même Product restent donc deux lignes
 * commerciales différentes si leurs StoreProduct.id sont différents.
 *
 * ============================================================================
 *
 * MULTI-DEVISE
 *
 * Plusieurs devises peuvent potentiellement être présentes.
 *
 * On ne doit jamais additionner directement :
 *
 * XAF + XOF + EUR + USD
 *
 * sans vraie conversion monétaire.
 *
 * Les sous-totaux sont donc groupés par devise.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - importer Prisma ;
 * - importer db ;
 * - lire PostgreSQL ;
 * - lire localStorage ;
 * - écrire localStorage ;
 * - importer React ;
 * - contenir du JSX ;
 * - créer une commande ;
 * - créer un paiement ;
 * - réserver du stock ;
 * - inventer un prix ;
 * - inventer un stock ;
 * - inventer une devise ;
 * - définir un modèle Prisma Cart/Panier non confirmé.
 *
 * ============================================================================
 */

import type {
  PublicProductAvailabilityStatus,
  PublicProductCardImage,
  PublicProductCurrency,
  PublicProductId,
  PublicProductMoneyAmount,
  PublicProductOfferId,
  PublicStoreProductStatus,
} from "@/lib/public/products/public-product-types";


/* ==========================================================================
   1. IDENTIFIANTS
   ========================================================================== */

/**
 * StoreProduct.id
 */
export type PublicPanierStoreProductId =
  PublicProductOfferId;


/**
 * Product.id
 */
export type PublicPanierProductId =
  PublicProductId;


/**
 * Store.id
 */
export type PublicPanierStoreId =
  string;


/* ==========================================================================
   2. QUANTITÉS
   ========================================================================== */

/**
 * Nombre entier positif.
 *
 * La validation runtime appartient :
 *
 * - au Provider côté client ;
 * - puis obligatoirement au serveur.
 */
export type PublicPanierQuantity =
  number;


/* ==========================================================================
   3. INTENTION MINIMALE DU NAVIGATEUR
   ========================================================================== */

/**
 * SEULE donnée commerciale nécessaire pour identifier une ligne du Panier.
 *
 * Aucun prix n'est stocké ici comme source de vérité.
 */
export type PublicPanierItemIntent =
  Readonly<{
    storeProductId:
      PublicPanierStoreProductId;

    quantity:
      PublicPanierQuantity;
  }>;


export type PublicPanierItemIntentCollection =
  readonly PublicPanierItemIntent[];


/* ==========================================================================
   4. ÉTAT PERSISTABLE
   ========================================================================== */

/**
 * Version du format du Panier.
 *
 * Permet une future migration du stockage navigateur sans ambiguïté.
 */
export type PublicPanierStorageVersion =
  1;


/**
 * État pouvant être persisté côté navigateur.
 *
 * IMPORTANT :
 *
 * Il ne contient volontairement :
 *
 * - aucun prix ;
 * - aucune devise ;
 * - aucun total ;
 * - aucun stock ;
 * - aucun Product ;
 * - aucune boutique.
 */
export type PublicPanierPersistedState =
  Readonly<{
    version:
      PublicPanierStorageVersion;

    items:
      PublicPanierItemIntentCollection;
  }>;


/* ==========================================================================
   5. PAYLOAD — AJOUT
   ========================================================================== */

export type PublicPanierAddItemPayload =
  Readonly<{
    storeProductId:
      PublicPanierStoreProductId;

    quantity:
      PublicPanierQuantity;
  }>;


/* ==========================================================================
   6. PAYLOAD — MODIFICATION DE QUANTITÉ
   ========================================================================== */

export type PublicPanierSetQuantityPayload =
  Readonly<{
    storeProductId:
      PublicPanierStoreProductId;

    quantity:
      PublicPanierQuantity;
  }>;


/* ==========================================================================
   7. PAYLOAD — SUPPRESSION
   ========================================================================== */

export type PublicPanierRemoveItemPayload =
  Readonly<{
    storeProductId:
      PublicPanierStoreProductId;
  }>;


/* ==========================================================================
   8. PAYLOAD — VALIDATION SERVEUR
   ========================================================================== */

export type PublicPanierValidationInput =
  Readonly<{
    items:
      PublicPanierItemIntentCollection;
  }>;


/* ==========================================================================
   9. IMAGE DE LIGNE PANIER
   ========================================================================== */

/**
 * ProductImage réelle déjà normalisée côté serveur.
 */
export type PublicPanierItemImage =
  PublicProductCardImage;


/* ==========================================================================
   10. BOUTIQUE PUBLIQUE
   ========================================================================== */

export type PublicPanierItemStore =
  Readonly<{
    id:
      PublicPanierStoreId;

    name:
      string;

    city:
      string;

    country:
      string;
  }>;


/* ==========================================================================
   11. ÉTAT DE VALIDATION D'UNE LIGNE
   ========================================================================== */

export type PublicPanierItemState =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "UNAVAILABLE";


/* ==========================================================================
   12. RAISON PUBLIQUE D'INVALIDITÉ
   ========================================================================== */

/**
 * Codes destinés à l'interface.
 *
 * Ils restent volontairement génériques et n'exposent pas de détail
 * interne sensible.
 */
export type PublicPanierItemIssueCode =
  | "OFFER_NOT_FOUND"
  | "OFFER_UNAVAILABLE"
  | "OUT_OF_STOCK"
  | "INSUFFICIENT_STOCK"
  | "INVALID_QUANTITY";


/* ==========================================================================
   13. PROBLÈME DE LIGNE
   ========================================================================== */

export type PublicPanierItemIssue =
  Readonly<{
    storeProductId:
      PublicPanierStoreProductId;

    requestedQuantity:
      PublicPanierQuantity;

    code:
      PublicPanierItemIssueCode;
  }>;


export type PublicPanierItemIssueCollection =
  readonly PublicPanierItemIssue[];


/* ==========================================================================
   14. LIGNE VALIDÉE PAR LE SERVEUR
   ========================================================================== */

/**
 * Cette structure contient un SNAPSHOT d'affichage.
 *
 * Elle ne devient pas une autorisation permanente de commander.
 *
 * Le checkout devra encore revalider les données.
 */
export type PublicPanierValidatedItem =
  Readonly<{
    /**
     * StoreProduct.id
     */
    storeProductId:
      PublicPanierStoreProductId;

    /**
     * Product.id
     */
    productId:
      PublicPanierProductId;

    /**
     * Product.name
     */
    name:
      string;

    /**
     * Product.slug
     */
    slug:
      string;

    /**
     * Product.sku
     */
    sku:
      string;

    /**
     * Image produit réelle.
     */
    image:
      PublicPanierItemImage;

    /**
     * Route publique canonique /p/[qrToken].
     *
     * Construite côté serveur.
     */
    href:
      string;

    /**
     * StoreProduct.price actuel.
     */
    unitPrice:
      PublicProductMoneyAmount;

    /**
     * Ancien prix valide uniquement si supérieur au prix courant.
     */
    compareAtPrice:
      PublicProductMoneyAmount |
      null;

    /**
     * StoreProduct.currency actuelle.
     */
    currency:
      PublicProductCurrency;

    /**
     * Quantité demandée et acceptée pour ce snapshot.
     */
    quantity:
      PublicPanierQuantity;

    /**
     * Stock actuel au moment de la validation.
     */
    availableQuantity:
      PublicPanierQuantity;

    /**
     * État public de disponibilité.
     */
    availability:
      PublicProductAvailabilityStatus;

    /**
     * Statut commercial StoreProduct public.
     */
    status:
      PublicStoreProductStatus;

    /**
     * État spécifique de la ligne dans le Panier.
     */
    panierState:
      PublicPanierItemState;

    /**
     * Sous-total de ligne :
     *
     * unitPrice × quantity
     *
     * calculé côté serveur.
     */
    lineSubtotal:
      PublicProductMoneyAmount;

    /**
     * Boutique liée à cette offre.
     */
    store:
      PublicPanierItemStore;
  }>;


export type PublicPanierValidatedItemCollection =
  readonly PublicPanierValidatedItem[];


/* ==========================================================================
   15. LIGNE PANIER AFFICHABLE
   ========================================================================== */

/**
 * Alias explicite pour les composants UI.
 */
export type PublicPanierDisplayItem =
  PublicPanierValidatedItem;


export type PublicPanierDisplayItemCollection =
  readonly PublicPanierDisplayItem[];


/* ==========================================================================
   16. RÉSUMÉ PAR DEVISE
   ========================================================================== */

/**
 * Un sous-total est calculé indépendamment pour chaque devise.
 *
 * Exemple :
 *
 * [
 *   { currency: "XAF", subtotal: "25000.00" },
 *   { currency: "EUR", subtotal: "30.00" }
 * ]
 *
 * Ces deux valeurs ne doivent pas être additionnées entre elles sans
 * mécanisme réel de conversion.
 */
export type PublicPanierCurrencySubtotal =
  Readonly<{
    currency:
      PublicProductCurrency;

    subtotal:
      PublicProductMoneyAmount;

    itemCount:
      number;

    totalQuantity:
      PublicPanierQuantity;
  }>;


export type PublicPanierCurrencySubtotalCollection =
  readonly PublicPanierCurrencySubtotal[];


/* ==========================================================================
   17. RÉSUMÉ DU PANIER
   ========================================================================== */

export type PublicPanierSummary =
  Readonly<{
    /**
     * Nombre de lignes StoreProduct distinctes.
     */
    itemCount:
      number;

    /**
     * Somme des quantités.
     */
    totalQuantity:
      PublicPanierQuantity;

    /**
     * Sous-totaux séparés par devise.
     */
    subtotals:
      PublicPanierCurrencySubtotalCollection;

    /**
     * true lorsqu'une seule devise est présente.
     */
    hasSingleCurrency:
      boolean;

    /**
     * true lorsqu'au moins deux devises sont présentes.
     */
    hasMixedCurrencies:
      boolean;

    /**
     * Devise unique si elle existe.
     */
    singleCurrency:
      PublicProductCurrency |
      null;

    /**
     * Total directement affichable uniquement si une seule devise existe.
     *
     * Null en multi-devise.
     */
    singleCurrencySubtotal:
      PublicProductMoneyAmount |
      null;
  }>;


/* ==========================================================================
   18. SNAPSHOT SERVEUR COMPLET
   ========================================================================== */

export type PublicPanierValidatedSnapshot =
  Readonly<{
    /**
     * Lignes réellement validées.
     */
    items:
      PublicPanierValidatedItemCollection;

    /**
     * Lignes rejetées ou devenues invalides.
     */
    issues:
      PublicPanierItemIssueCollection;

    /**
     * Résumé calculé uniquement depuis les lignes validées.
     */
    summary:
      PublicPanierSummary;

    /**
     * Indique qu'au moins une intention navigateur n'a pas pu être validée.
     */
    hasIssues:
      boolean;

    /**
     * Indique si le snapshot contient au moins une ligne exploitable.
     */
    hasItems:
      boolean;
  }>;


/* ==========================================================================
   19. RÉSULTAT DE VALIDATION SERVEUR
   ========================================================================== */

export type PublicPanierValidationSuccess =
  Readonly<{
    success:
      true;

    data:
      PublicPanierValidatedSnapshot;
  }>;


export type PublicPanierValidationFailureCode =
  | "INVALID_INPUT"
  | "VALIDATION_FAILED"
  | "SERVER_ERROR";


export type PublicPanierValidationFailure =
  Readonly<{
    success:
      false;

    code:
      PublicPanierValidationFailureCode;
  }>;


export type PublicPanierValidationResult =
  | PublicPanierValidationSuccess
  | PublicPanierValidationFailure;


/* ==========================================================================
   20. TYPES DE MUTATION CLIENT
   ========================================================================== */

export type PublicPanierMutationType =
  | "ADD_ITEM"
  | "SET_QUANTITY"
  | "REMOVE_ITEM"
  | "CLEAR";


/* ==========================================================================
   21. RÉSULTAT DE MUTATION CLIENT
   ========================================================================== */

export type PublicPanierMutationSuccess =
  Readonly<{
    success:
      true;
  }>;


export type PublicPanierMutationFailureCode =
  | "INVALID_STORE_PRODUCT_ID"
  | "INVALID_QUANTITY"
  | "ITEM_NOT_FOUND";


export type PublicPanierMutationFailure =
  Readonly<{
    success:
      false;

    code:
      PublicPanierMutationFailureCode;
  }>;


export type PublicPanierMutationResult =
  | PublicPanierMutationSuccess
  | PublicPanierMutationFailure;


/* ==========================================================================
   22. ÉTAT CLIENT DU PANIER
   ========================================================================== */

/**
 * État minimal du Provider.
 *
 * Pas de prix ni stock persistant ici.
 */
export type PublicPanierClientState =
  Readonly<{
    items:
      PublicPanierItemIntentCollection;

    itemCount:
      number;

    totalQuantity:
      PublicPanierQuantity;

    hydrated:
      boolean;
  }>;


/* ==========================================================================
   23. API DU PROVIDER
   ========================================================================== */

/**
 * Contrat destiné à :
 *
 * src/components/public/panier/PublicPanierProvider.tsx
 *
 * Les opérations modifient seulement l'intention locale du Panier.
 *
 * Elles ne créent :
 *
 * - ni commande ;
 * - ni réservation de stock ;
 * - ni paiement.
 */
export type PublicPanierClientApi =
  Readonly<{
    addItem:
      (
        payload:
          PublicPanierAddItemPayload,
      ) =>
        PublicPanierMutationResult;

    setQuantity:
      (
        payload:
          PublicPanierSetQuantityPayload,
      ) =>
        PublicPanierMutationResult;

    removeItem:
      (
        payload:
          PublicPanierRemoveItemPayload,
      ) =>
        PublicPanierMutationResult;

    clear:
      () =>
        PublicPanierMutationResult;

    getItemQuantity:
      (
        storeProductId:
          PublicPanierStoreProductId,
      ) =>
        PublicPanierQuantity;
  }>;


/* ==========================================================================
   24. CONTEXTE CLIENT
   ========================================================================== */

export type PublicPanierContextValue =
  Readonly<{
    state:
      PublicPanierClientState;

    actions:
      PublicPanierClientApi;
  }>;


/* ==========================================================================
   25. PROPS — BOUTON AJOUTER AU PANIER
   ========================================================================== */

export type PublicAddToPanierButtonProps =
  Readonly<{
    /**
     * StoreProduct.id.
     */
    storeProductId:
      PublicPanierStoreProductId;

    /**
     * Quantité ajoutée lors du clic.
     *
     * Généralement 1.
     */
    quantity?:
      PublicPanierQuantity;

    /**
     * Désactivation pilotée par les vraies données publiques actuelles.
     */
    disabled?:
      boolean;

    /**
     * Texte facultatif.
     *
     * Le composant pourra conserver son label par défaut s'il est absent.
     */
    label?:
      string;

    /**
     * Classe CSS externe facultative.
     */
    className?:
      string;
  }>;


/**
 * ============================================================================
 * PROPS — PAGE PANIER
 * ============================================================================
 *
 * La page Panier ne reçoit actuellement aucune prop métier.
 *
 * Record<string, never> permet de représenter explicitement un objet
 * sans propriété tout en évitant le type `{}` interdit par ESLint.
 *
 * ============================================================================
 */
export type PublicPanierPageProps =
  Readonly<
    Record<
      string,
      never
    >
  >;


/* ==========================================================================
   27. ÉTAT DE CHARGEMENT DE LA PAGE PANIER
   ========================================================================== */

export type PublicPanierLoadingState =
  | "IDLE"
  | "VALIDATING"
  | "READY"
  | "ERROR";


/* ==========================================================================
   28. ÉTAT DE LA VUE PANIER
   ========================================================================== */

export type PublicPanierViewState =
  Readonly<{
    status:
      PublicPanierLoadingState;

    snapshot:
      PublicPanierValidatedSnapshot |
      null;
  }>;


/* ==========================================================================
   29. QUANTITÉ — LIMITES RUNTIME
   ========================================================================== */

/**
 * Contrat générique utilisé par l'interface.
 *
 * La valeur maximale finale vient toujours du stock serveur actuel.
 */
export type PublicPanierQuantityBounds =
  Readonly<{
    minimum:
      number;

    maximum:
      number;
  }>;


/* ==========================================================================
   30. DONNÉES D'UN CONTRÔLE QUANTITÉ
   ========================================================================== */

export type PublicPanierQuantityControlData =
  Readonly<{
    storeProductId:
      PublicPanierStoreProductId;

    quantity:
      PublicPanierQuantity;

    bounds:
      PublicPanierQuantityBounds;

    canDecrease:
      boolean;

    canIncrease:
      boolean;
  }>;


/* ==========================================================================
   31. PROPS — CONTRÔLE QUANTITÉ
   ========================================================================== */

export type PublicPanierQuantityControlProps =
  Readonly<{
    data:
      PublicPanierQuantityControlData;
  }>;


/* ==========================================================================
   32. PROPS — LIGNE PANIER
   ========================================================================== */

export type PublicPanierItemProps =
  Readonly<{
    item:
      PublicPanierDisplayItem;
  }>;


/* ==========================================================================
   33. PROPS — RÉSUMÉ
   ========================================================================== */

export type PublicPanierSummaryProps =
  Readonly<{
    summary:
      PublicPanierSummary;
  }>;


/* ==========================================================================
   34. ÉTAT VIDE
   ========================================================================== */

export type PublicPanierEmptyState =
  Readonly<{
    isEmpty:
      boolean;

    itemCount:
      0;
  }>;


/* ==========================================================================
   35. GARANTIES DE SÉCURITÉ
   ========================================================================== */

/**
 * Contrat documentaire.
 *
 * Il n'exécute aucune logique runtime.
 */
export type PublicPanierSecurityGuarantees =
  Readonly<{
    browserStoresOnlyOfferIdentityAndQuantity:
      true;

    clientPriceIsNotTrusted:
      true;

    clientCurrencyIsNotTrusted:
      true;

    clientStockIsNotTrusted:
      true;

    clientStatusIsNotTrusted:
      true;

    priceMustBeRevalidatedServerSide:
      true;

    currencyMustBeRevalidatedServerSide:
      true;

    stockMustBeRevalidatedServerSide:
      true;

    storeMustBeRevalidatedServerSide:
      true;

    productMustBeRevalidatedServerSide:
      true;

    storeProductMustBeRevalidatedServerSide:
      true;

    checkoutMustRevalidateAgain:
      true;
  }>;


/* ==========================================================================
   36. GARANTIES MULTI-DEVISE
   ========================================================================== */

export type PublicPanierCurrencyGuarantees =
  Readonly<{
    subtotalsAreGroupedByCurrency:
      true;

    mixedCurrenciesAreNeverBlindlyAdded:
      true;

    conversionRequiresRealExchangeLogic:
      true;
  }>;


/* ==========================================================================
   37. ALIASES PRATIQUES
   ========================================================================== */

export type PublicPanierItem =
  PublicPanierValidatedItem;


export type PublicPanierItems =
  PublicPanierValidatedItemCollection;


export type PublicPanierSnapshot =
  PublicPanierValidatedSnapshot;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * PANIER NAVIGATEUR :
 *
 * [
 *   {
 *     storeProductId,
 *     quantity
 *   }
 * ]
 *
 * ============================================================================
 *
 * AUCUN PRIX PERSISTÉ COMME SOURCE DE VÉRITÉ.
 *
 * AUCUN STOCK PERSISTÉ COMME SOURCE DE VÉRITÉ.
 *
 * AUCUNE DEVISE PERSISTÉE COMME SOURCE DE VÉRITÉ.
 *
 * ============================================================================
 *
 * VALIDATION SERVEUR :
 *
 * StoreProduct
 *      ↓
 * Product
 *      ↓
 * Store
 *
 * puis :
 *
 * - prix actuel ;
 * - devise actuelle ;
 * - stock actuel ;
 * - statut actuel ;
 * - quantité autorisée.
 *
 * ============================================================================
 *
 * UNE LIGNE PANIER =
 *
 * UNE offre StoreProduct.
 *
 * ============================================================================
 *
 * MULTI-DEVISE :
 *
 * sous-totaux séparés par devise.
 *
 * Aucune addition monétaire incorrecte.
 *
 * ============================================================================
 *
 * CE FICHIER N'IMPOSE AUCUN :
 *
 * - modèle Prisma Cart ;
 * - modèle Prisma CartItem ;
 * - cookie panier ;
 * - compte client ;
 * - session panier serveur ;
 * - localStorage particulier ;
 * - paiement ;
 * - fournisseur de paiement ;
 * - livraison ;
 * - promotion.
 *
 * Ces décisions appartiennent aux couches correspondantes et seront
 * intégrées uniquement lorsqu'elles sont réellement confirmées.
 *
 * ============================================================================
 */