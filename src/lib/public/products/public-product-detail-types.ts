import type {
  PublicProductAvailabilityStatus,
  PublicProductCurrency,
  PublicProductId,
  PublicProductMoneyAmount,
  PublicProductOfferId,
  PublicStoreProductStatus,
} from "@/lib/public/products/public-product-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TYPES — FICHE PRODUIT PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/products/public-product-detail-types.ts
 *
 * ============================================================================
 *
 * ROUTE PUBLIQUE :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser tous les contrats TypeScript utilisés par la fiche publique
 * détaillée d'une offre produit.
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * ============================================================================
 *
 * UNE FICHE PUBLIQUE =
 *
 * UNE offre StoreProduct précise.
 *
 * ============================================================================
 *
 * Cela signifie que deux boutiques vendant le même Product peuvent avoir :
 *
 * - deux StoreProduct différents ;
 * - deux prix différents ;
 * - deux stocks différents ;
 * - deux devises différentes ;
 * - deux points de vente différents ;
 * - deux qrToken différents.
 *
 * ============================================================================
 *
 * IDENTITÉ PUBLIQUE :
 *
 * StoreProduct.qrToken
 *
 *        ↓
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * SOURCE DES DONNÉES :
 *
 * Product :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - sku ;
 * - brand ;
 * - description ;
 * - ingredients ;
 * - weightContent ;
 * - usageInstructions ;
 * - unit ;
 * - category ;
 * - images ;
 * - createdAt ;
 * - updatedAt.
 *
 * StoreProduct :
 *
 * - id ;
 * - productId ;
 * - price ;
 * - compareAtPrice ;
 * - currency ;
 * - stockQuantity ;
 * - lowStockThreshold ;
 * - status ;
 * - qrToken ;
 * - createdAt ;
 * - updatedAt.
 *
 * Store :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - city ;
 * - country.
 *
 * ============================================================================
 *
 * PAGE PREMIUM :
 *
 * Le contrat prépare également :
 *
 * - galerie produit ;
 * - panneau commercial ;
 * - promotion réelle ;
 * - ajout au Panier ;
 * - redirection vers le Panier ;
 * - retour catalogue ;
 * - catégorie ;
 * - livraison Afrique ;
 * - livraison internationale ;
 * - informations de livraison ;
 * - contact ;
 * - WhatsApp ;
 * - points de vente ;
 * - blocs de confiance ;
 * - informations produit détaillées ;
 * - politique d'affichage du Footer.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Sur /p/[qrToken] :
 *
 * - Header mobile conservé ;
 * - contenu produit conservé ;
 * - Footer MASQUÉ ;
 * - barre mobile basse conservée ;
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * - Header conservé ;
 * - fiche produit complète ;
 * - Footer conservé.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - importer Prisma ;
 * - importer le client PostgreSQL ;
 * - interroger PostgreSQL ;
 * - modifier PostgreSQL ;
 * - lire une session ;
 * - importer React ;
 * - contenir du JSX ;
 * - générer une URL ;
 * - créer un produit ;
 * - créer un prix ;
 * - créer un stock ;
 * - créer une boutique ;
 * - inventer une promotion ;
 * - inventer un délai de livraison ;
 * - inventer un tarif de livraison ;
 * - inventer une certification ;
 * - inventer une garantie ;
 * - contenir de données de démonstration.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. UTILITAIRES
   ========================================================================== */

export type PublicProductDetailRequiredText =
  string;


export type PublicProductDetailOptionalText =
  string |
  null;


/**
 * Date déjà sérialisée avant transmission à React.
 *
 * Exemple :
 *
 * 2026-09-22T12:30:00.000Z
 */
export type PublicProductDetailDateTime =
  string;


export type PublicProductDetailQuantity =
  number;


/* ==========================================================================
   2. IDENTIFIANTS
   ========================================================================== */

/**
 * StoreProduct.id
 */
export type PublicProductDetailOfferId =
  PublicProductOfferId;


/**
 * Product.id
 */
export type PublicProductDetailProductId =
  PublicProductId;


/**
 * Store.id
 */
export type PublicProductDetailStoreId =
  string;


/**
 * ProductCategory.id
 */
export type PublicProductDetailCategoryId =
  string;


/**
 * ProductImage.id
 */
export type PublicProductDetailImageId =
  string;


/**
 * StoreProduct.qrToken
 */
export type PublicProductDetailQrToken =
  string;


/* ==========================================================================
   3. ROUTE PUBLIQUE
   ========================================================================== */

/**
 * Route déjà préparée côté serveur avec :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * Exemple :
 *
 * /p/abc123...
 */
export type PublicProductDetailPublicPath =
  string;


/**
 * Route publique déjà construite ailleurs.
 *
 * Ce type ne doit jamais être utilisé pour fabriquer lui-même une URL.
 */
export type PublicProductDetailHref =
  string;


/* ==========================================================================
   4. PARAMÈTRES DE ROUTE NEXT.JS
   ========================================================================== */

export type PublicProductDetailRouteParams =
  Readonly<{
    qrToken:
      PublicProductDetailQrToken;
  }>;


/**
 * Next.js App Router.
 *
 * Les params sont asynchrones dans l'architecture actuelle.
 */
export interface PublicProductDetailRoutePageProps {
  readonly params:
    Promise<
      PublicProductDetailRouteParams
    >;
}


/* ==========================================================================
   5. IMAGE PRODUIT
   ========================================================================== */

export type PublicProductDetailImage =
  Readonly<{
    /**
     * ProductImage.id
     */
    id:
      PublicProductDetailImageId;

    /**
     * ProductImage.url
     */
    url:
      PublicProductDetailRequiredText;

    /**
     * ProductImage.altText ou Product.name comme fallback d'accessibilité.
     */
    altText:
      PublicProductDetailRequiredText;

    /**
     * ProductImage.position
     */
    position:
      number;

    /**
     * ProductImage.isPrimary
     */
    isPrimary:
      boolean;
  }>;


export type PublicProductDetailImageCollection =
  readonly PublicProductDetailImage[];


/* ==========================================================================
   6. CATÉGORIE
   ========================================================================== */

export type PublicProductDetailCategory =
  Readonly<{
    /**
     * ProductCategory.id
     */
    id:
      PublicProductDetailCategoryId;

    /**
     * ProductCategory.name
     */
    name:
      PublicProductDetailRequiredText;

    /**
     * ProductCategory.slug
     */
    slug:
      PublicProductDetailRequiredText;

    /**
     * Route publique déjà résolue.
     *
     * Exemple :
     *
     * /categories/soins-du-visage
     */
    href:
      PublicProductDetailHref;
  }>;


/* ==========================================================================
   7. BOUTIQUE
   ========================================================================== */

/**
 * Informations publiques minimales du point de vente.
 *
 * Aucune donnée Gestionnaire privée ne doit être incluse.
 */
export type PublicProductDetailStore =
  Readonly<{
    /**
     * Store.id
     */
    id:
      PublicProductDetailStoreId;

    /**
     * Store.name
     */
    name:
      PublicProductDetailRequiredText;

    /**
     * Store.slug
     */
    slug:
      PublicProductDetailRequiredText;

    /**
     * Store.city
     */
    city:
      PublicProductDetailRequiredText;

    /**
     * Store.country
     */
    country:
      PublicProductDetailRequiredText;
  }>;


/* ==========================================================================
   8. IDENTITÉ PRODUCT
   ========================================================================== */

export type PublicProductDetailIdentity =
  Readonly<{
    /**
     * Product.id
     */
    id:
      PublicProductDetailProductId;

    /**
     * Product.name
     */
    name:
      PublicProductDetailRequiredText;

    /**
     * Product.slug
     */
    slug:
      PublicProductDetailRequiredText;

    /**
     * Product.sku
     */
    sku:
      PublicProductDetailRequiredText;

    /**
     * Product.brand
     */
    brand:
      PublicProductDetailRequiredText;
  }>;


/* ==========================================================================
   9. DESCRIPTION ET INFORMATIONS PRODUIT
   ========================================================================== */

/**
 * Les champs restent null lorsque PostgreSQL ne possède pas la donnée.
 *
 * Aucun texte artificiel ne doit être ajouté pour remplir une section.
 */
export type PublicProductDetailContent =
  Readonly<{
    description:
      PublicProductDetailOptionalText;

    ingredients:
      PublicProductDetailOptionalText;

    weightContent:
      PublicProductDetailOptionalText;

    usageInstructions:
      PublicProductDetailOptionalText;

    unit:
      PublicProductDetailOptionalText;
  }>;


/* ==========================================================================
   10. PRIX
   ========================================================================== */

export type PublicProductDetailPricing =
  Readonly<{
    /**
     * StoreProduct.price
     *
     * Decimal sérialisé.
     */
    amount:
      PublicProductMoneyAmount;

    /**
     * StoreProduct.compareAtPrice
     *
     * Exposé seulement si :
     *
     * compareAtPrice > price
     */
    compareAtAmount:
      PublicProductMoneyAmount |
      null;

    /**
     * StoreProduct.currency
     */
    currency:
      PublicProductCurrency;

    /**
     * true uniquement lorsqu'une vraie réduction existe.
     */
    hasDiscount:
      boolean;

    /**
     * compareAtPrice - price
     *
     * Null lorsqu'il n'existe pas de réduction valide.
     */
    savingsAmount:
      PublicProductMoneyAmount |
      null;

    /**
     * Pourcentage calculé depuis les vrais montants.
     *
     * Aucun pourcentage marketing écrit en dur.
     */
    discountPercentage:
      number |
      null;
  }>;


/* ==========================================================================
   11. INVENTAIRE
   ========================================================================== */

export type PublicProductDetailInventory =
  Readonly<{
    /**
     * StoreProduct.status
     */
    status:
      PublicStoreProductStatus;

    /**
     * StoreProduct.stockQuantity
     */
    stockQuantity:
      PublicProductDetailQuantity;

    /**
     * StoreProduct.lowStockThreshold
     */
    lowStockThreshold:
      PublicProductDetailQuantity;

    /**
     * État d'affichage.
     */
    availability:
      PublicProductAvailabilityStatus;

    /**
     * true uniquement lorsque l'offre peut actuellement être ajoutée
     * au Panier selon les données chargées.
     *
     * Une validation serveur reste obligatoire avant une opération sensible.
     */
    isAvailable:
      boolean;

    /**
     * Stock disponible inférieur ou égal au seuil configuré.
     */
    isLowStock:
      boolean;
  }>;


/* ==========================================================================
   12. INTÉGRATION PANIER
   ========================================================================== */

/**
 * Données minimales nécessaires au bouton :
 *
 * Ajouter au panier
 *
 * ============================================================================
 *
 * Aucun prix n'est envoyé comme source de vérité client.
 *
 * ============================================================================
 */
export type PublicProductDetailPanierData =
  Readonly<{
    /**
     * StoreProduct.id
     */
    storeProductId:
      PublicProductDetailOfferId;

    /**
     * Quantité initiale.
     */
    defaultQuantity:
      PublicProductDetailQuantity;

    /**
     * Quantité disponible lors du chargement.
     *
     * Cette valeur reste indicative.
     */
    maximumQuantity:
      PublicProductDetailQuantity;

    /**
     * État actuel du bouton Panier.
     */
    canAddToPanier:
      boolean;
  }>;


/* ==========================================================================
   13. OFFRE COMMERCIALE
   ========================================================================== */

export type PublicProductDetailOffer =
  Readonly<{
    /**
     * StoreProduct.id
     */
    id:
      PublicProductDetailOfferId;

    /**
     * Alias explicite.
     */
    storeProductId:
      PublicProductDetailOfferId;

    /**
     * Product.id
     */
    productId:
      PublicProductDetailProductId;

    /**
     * StoreProduct.qrToken
     */
    qrToken:
      PublicProductDetailQrToken;

    /**
     * Route canonique :
     *
     * /p/[qrToken]
     */
    publicPath:
      PublicProductDetailPublicPath;
  }>;


/* ==========================================================================
   14. DONNÉES PRINCIPALES DE LA FICHE
   ========================================================================== */

/**
 * Structure complète retournée par :
 *
 * src/lib/public/products/public-product-detail-query.ts
 */
export type PublicProductDetailData =
  Readonly<{
    offer:
      PublicProductDetailOffer;

    product:
      PublicProductDetailIdentity;

    content:
      PublicProductDetailContent;

    /**
     * Null lorsque Product.categoryId est réellement absent.
     */
    category:
      PublicProductDetailCategory |
      null;

    /**
     * Toutes les vraies ProductImage exploitables.
     */
    images:
      PublicProductDetailImageCollection;

    /**
     * Aucune image fictive.
     */
    primaryImage:
      PublicProductDetailImage |
      null;

    /**
     * Prix StoreProduct.
     */
    pricing:
      PublicProductDetailPricing;

    /**
     * Stock StoreProduct.
     */
    inventory:
      PublicProductDetailInventory;

    /**
     * Store réel lié à l'offre.
     */
    store:
      PublicProductDetailStore;

    /**
     * Intégration Panier.
     */
    panier:
      PublicProductDetailPanierData;

    /**
     * Dates sérialisées.
     */
    createdAt:
      PublicProductDetailDateTime;

    updatedAt:
      PublicProductDetailDateTime;
  }>;


/* ==========================================================================
   15. RÉSULTAT DE LA REQUÊTE
   ========================================================================== */

export type PublicProductDetailQueryResult =
  PublicProductDetailData |
  null;


/* ==========================================================================
   16. INPUT DE REQUÊTE
   ========================================================================== */

export type PublicProductDetailQueryInput =
  Readonly<{
    qrToken:
      PublicProductDetailQrToken;
  }>;


/* ==========================================================================
   17. ACTIONS DE NAVIGATION PREMIUM
   ========================================================================== */

/**
 * Actions de navigation possibles sur la fiche.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * ADD_TO_PANIER n'est volontairement PAS dans cette union.
 *
 * L'ajout au Panier reste géré par PublicAddToPanierButton.
 *
 * ============================================================================
 */
export type PublicProductDetailActionId =
  | "VIEW_PANIER"
  | "CONTINUE_SHOPPING"
  | "VIEW_CATEGORY"
  | "DELIVERY"
  | "CONTACT"
  | "WHATSAPP"
  | "POINTS_OF_SALE";


export type PublicProductDetailActionVariant =
  | "PRIMARY"
  | "SECONDARY"
  | "OUTLINE"
  | "TEXT";


export type PublicProductDetailAction =
  Readonly<{
    id:
      PublicProductDetailActionId;

    label:
      PublicProductDetailRequiredText;

    href:
      PublicProductDetailHref;

    variant:
      PublicProductDetailActionVariant;

    /**
     * true pour une destination externe comme WhatsApp.
     */
    external:
      boolean;

    /**
     * Description facultative utile pour accessibilité ou bloc premium.
     */
    description?:
      PublicProductDetailRequiredText;
  }>;


export type PublicProductDetailActionCollection =
  readonly PublicProductDetailAction[];


/* ==========================================================================
   18. LIVRAISON — PORTÉE
   ========================================================================== */

/**
 * Règle commerciale fixée pour cette fiche :
 *
 * - livraison en Afrique ;
 * - livraison internationale.
 *
 * ============================================================================
 *
 * Aucun délai ou tarif n'est défini ici.
 *
 * ============================================================================
 */
export type PublicProductDetailDeliveryScope =
  | "AFRICA"
  | "INTERNATIONAL";


export type PublicProductDetailDeliveryCoverage =
  Readonly<{
    id:
      PublicProductDetailDeliveryScope;

    title:
      PublicProductDetailRequiredText;

    description:
      PublicProductDetailRequiredText;
  }>;


export type PublicProductDetailDeliveryCoverageCollection =
  readonly PublicProductDetailDeliveryCoverage[];


/* ==========================================================================
   19. LIVRAISON — PRÉSENTATION
   ========================================================================== */

/**
 * Données éditoriales de la section livraison.
 *
 * Elles doivent provenir d'une configuration publique dédiée.
 *
 * Elles ne doivent pas être inventées dans PublicProductDetail.tsx.
 */
export type PublicProductDetailDeliveryPresentation =
  Readonly<{
    heading:
      PublicProductDetailRequiredText;

    description:
      PublicProductDetailRequiredText;

    /**
     * Doit pouvoir présenter :
     *
     * AFRICA
     * INTERNATIONAL
     */
    coverage:
      PublicProductDetailDeliveryCoverageCollection;

    /**
     * Route vers la page livraison existante.
     */
    deliveryHref:
      PublicProductDetailHref;

    /**
     * Texte prudent lorsque les frais ou délais varient selon la destination.
     */
    destinationNotice:
      PublicProductDetailRequiredText;
  }>;


/* ==========================================================================
   20. ASSISTANCE CLIENT
   ========================================================================== */

export type PublicProductDetailSupportChannel =
  | "WHATSAPP"
  | "CONTACT";


export type PublicProductDetailSupportAction =
  Readonly<{
    channel:
      PublicProductDetailSupportChannel;

    label:
      PublicProductDetailRequiredText;

    href:
      PublicProductDetailHref;

    external:
      boolean;
  }>;


export type PublicProductDetailSupportPresentation =
  Readonly<{
    heading:
      PublicProductDetailRequiredText;

    description:
      PublicProductDetailRequiredText;

    actions:
      readonly PublicProductDetailSupportAction[];
  }>;


/* ==========================================================================
   21. BLOCS DE CONFIANCE / SERVICES
   ========================================================================== */

/**
 * Aucun bloc de confiance ne doit contenir une affirmation non vérifiée.
 *
 * Exemples autorisés lorsqu'ils correspondent à la configuration officielle :
 *
 * - livraison Afrique ;
 * - livraison internationale ;
 * - assistance client ;
 * - offre disponible chez un point de vente réel.
 */
export type PublicProductDetailCommercialHighlightId =
  | "AFRICA_DELIVERY"
  | "INTERNATIONAL_DELIVERY"
  | "SUPPORT"
  | "STORE_AVAILABILITY";


export type PublicProductDetailCommercialHighlight =
  Readonly<{
    id:
      PublicProductDetailCommercialHighlightId;

    title:
      PublicProductDetailRequiredText;

    description:
      PublicProductDetailRequiredText;

    href?:
      PublicProductDetailHref;
  }>;


export type PublicProductDetailCommercialHighlightCollection =
  readonly PublicProductDetailCommercialHighlight[];


/* ==========================================================================
   22. POLITIQUE DU SHELL DE LA FICHE
   ========================================================================== */

/**
 * Politique fixe demandée pour /p/[qrToken].
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Footer visible.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Footer masqué.
 *
 * La navigation mobile existante reste affichée :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * Ce type documente la règle.
 *
 * Son application réelle appartient au composant / CSS du shell.
 */
export type PublicProductDetailShellPolicy =
  Readonly<{
    desktopFooter:
      "SHOW";

    mobileFooter:
      "HIDE";

    mobileBottomNavigation:
      "KEEP_EXISTING";
  }>;


/* ==========================================================================
   23. PRÉSENTATION PREMIUM DE LA PAGE
   ========================================================================== */

/**
 * Configuration purement UI / éditoriale.
 *
 * ============================================================================
 *
 * Elle ne remplace jamais PublicProductDetailData.
 *
 * Les données produit restent dans :
 *
 * product
 *
 * tandis que :
 *
 * - les CTA ;
 * - la livraison ;
 * - le support ;
 * - les blocs commerciaux ;
 * - la politique du shell
 *
 * peuvent être préparés depuis une configuration publique.
 *
 * ============================================================================
 */
export type PublicProductDetailPresentationData =
  Readonly<{
    actions:
      PublicProductDetailActionCollection;

    delivery:
      PublicProductDetailDeliveryPresentation;

    support:
      PublicProductDetailSupportPresentation;

    highlights:
      PublicProductDetailCommercialHighlightCollection;

    shell:
      PublicProductDetailShellPolicy;
  }>;


/* ==========================================================================
   24. PROPS DU COMPOSANT PRINCIPAL
   ========================================================================== */

export interface PublicProductDetailProps {
  readonly product:
    PublicProductDetailData;

  /**
   * Facultatif pour conserver la compatibilité avec l'implémentation actuelle.
   *
   * La future fiche premium pourra recevoir cette configuration sans casser
   * les appels existants qui transmettent uniquement `product`.
   */
  readonly presentation?:
    PublicProductDetailPresentationData;
}


/* ==========================================================================
   25. PROPS GALERIE
   ========================================================================== */

export interface PublicProductDetailGalleryProps {
  readonly productName:
    PublicProductDetailRequiredText;

  readonly images:
    PublicProductDetailImageCollection;

  readonly primaryImage:
    PublicProductDetailImage |
    null;
}


/* ==========================================================================
   26. PROPS INFORMATIONS
   ========================================================================== */

export interface PublicProductDetailInformationProps {
  readonly identity:
    PublicProductDetailIdentity;

  readonly content:
    PublicProductDetailContent;

  readonly category:
    PublicProductDetailCategory |
    null;
}


/* ==========================================================================
   27. PROPS PRIX
   ========================================================================== */

export interface PublicProductDetailPricingProps {
  readonly pricing:
    PublicProductDetailPricing;
}


/* ==========================================================================
   28. PROPS STOCK
   ========================================================================== */

export interface PublicProductDetailInventoryProps {
  readonly inventory:
    PublicProductDetailInventory;
}


/* ==========================================================================
   29. PROPS BOUTIQUE
   ========================================================================== */

export interface PublicProductDetailStoreProps {
  readonly store:
    PublicProductDetailStore;
}


/* ==========================================================================
   30. PROPS PANIER
   ========================================================================== */

export interface PublicProductDetailPanierProps {
  readonly panier:
    PublicProductDetailPanierData;
}


/* ==========================================================================
   31. PROPS SECTION LIVRAISON
   ========================================================================== */

export interface PublicProductDetailDeliveryProps {
  readonly delivery:
    PublicProductDetailDeliveryPresentation;
}


/* ==========================================================================
   32. PROPS SECTION SUPPORT
   ========================================================================== */

export interface PublicProductDetailSupportProps {
  readonly support:
    PublicProductDetailSupportPresentation;
}


/* ==========================================================================
   33. PROPS ACTIONS
   ========================================================================== */

export interface PublicProductDetailActionsProps {
  readonly actions:
    PublicProductDetailActionCollection;
}


/* ==========================================================================
   34. BREADCRUMB
   ========================================================================== */

export type PublicProductDetailBreadcrumbItem =
  Readonly<{
    label:
      PublicProductDetailRequiredText;

    href:
      PublicProductDetailHref |
      null;

    current:
      boolean;
  }>;


export type PublicProductDetailBreadcrumb =
  readonly PublicProductDetailBreadcrumbItem[];


/* ==========================================================================
   35. SEO
   ========================================================================== */

export type PublicProductDetailSeoData =
  Readonly<{
    title:
      PublicProductDetailRequiredText;

    description:
      PublicProductDetailRequiredText;

    canonicalPath:
      PublicProductDetailPublicPath;

    imageUrl:
      PublicProductDetailRequiredText |
      null;

    imageAlt:
      PublicProductDetailRequiredText |
      null;
  }>;


/* ==========================================================================
   36. RÉSUMÉ PUBLIC
   ========================================================================== */

export type PublicProductDetailSummary =
  Readonly<{
    storeProductId:
      PublicProductDetailOfferId;

    qrToken:
      PublicProductDetailQrToken;

    publicPath:
      PublicProductDetailPublicPath;

    productName:
      PublicProductDetailRequiredText;

    storeName:
      PublicProductDetailRequiredText;

    price:
      PublicProductMoneyAmount;

    compareAtPrice:
      PublicProductMoneyAmount |
      null;

    currency:
      PublicProductCurrency;

    availability:
      PublicProductAvailabilityStatus;

    isAvailable:
      boolean;

    primaryImageUrl:
      PublicProductDetailRequiredText |
      null;
  }>;


/* ==========================================================================
   37. VISIBILITÉ DES INFORMATIONS
   ========================================================================== */

/**
 * Aucun contenu fictif ne doit être créé pour remplir une section vide.
 */
export type PublicProductDetailContentVisibility =
  Readonly<{
    hasDescription:
      boolean;

    hasIngredients:
      boolean;

    hasWeightContent:
      boolean;

    hasUsageInstructions:
      boolean;

    hasUnit:
      boolean;

    hasCategory:
      boolean;

    hasImages:
      boolean;

    hasDiscount:
      boolean;
  }>;


/* ==========================================================================
   38. IDENTIFIANTS DES SECTIONS PREMIUM
   ========================================================================== */

export type PublicProductDetailSectionId =
  | "overview"
  | "description"
  | "usage"
  | "ingredients"
  | "details"
  | "store"
  | "delivery"
  | "support";


export type PublicProductDetailSectionVisibility =
  Readonly<{
    id:
      PublicProductDetailSectionId;

    visible:
      boolean;
  }>;


export type PublicProductDetailSectionVisibilityCollection =
  readonly PublicProductDetailSectionVisibility[];


/* ==========================================================================
   39. ACTION AJOUT PANIER
   ========================================================================== */

export type PublicProductDetailAddToPanierPayload =
  Readonly<{
    storeProductId:
      PublicProductDetailOfferId;

    quantity:
      PublicProductDetailQuantity;
  }>;


/* ==========================================================================
   40. ÉTAT DU BOUTON PANIER
   ========================================================================== */

export type PublicProductDetailAddToPanierState =
  | "AVAILABLE"
  | "OUT_OF_STOCK"
  | "UNAVAILABLE";


/* ==========================================================================
   41. DONNÉES DU BOUTON PANIER
   ========================================================================== */

export type PublicProductDetailAddToPanierButtonData =
  Readonly<{
    state:
      PublicProductDetailAddToPanierState;

    payload:
      PublicProductDetailAddToPanierPayload;

    maximumQuantity:
      PublicProductDetailQuantity;
  }>;


/* ==========================================================================
   42. ÉTAT D'ACHAT / CTA
   ========================================================================== */

/**
 * Contrat utile au panneau commercial premium.
 */
export type PublicProductDetailPurchaseState =
  Readonly<{
    canAddToPanier:
      boolean;

    availability:
      PublicProductAvailabilityStatus;

    stockQuantity:
      PublicProductDetailQuantity;

    maximumQuantity:
      PublicProductDetailQuantity;
  }>;


/* ==========================================================================
   43. GARANTIES STRUCTURELLES
   ========================================================================== */

export type PublicProductDetailDataGuarantees =
  Readonly<{
    representsStoreProductOffer:
      true;

    productIsReal:
      true;

    storeProductIsReal:
      true;

    storeIsReal:
      true;

    pricesAreReal:
      true;

    currencyIsReal:
      true;

    stockIsReal:
      true;

    imagesAreReal:
      true;

    qrTokenIsReal:
      true;

    routeIsCanonical:
      true;

    noDemoProduct:
      true;

    noDemoPrice:
      true;

    noDemoStock:
      true;

    noDemoStore:
      true;
  }>;


/* ==========================================================================
   44. GARANTIES PANIER
   ========================================================================== */

export type PublicProductDetailPanierGuarantees =
  Readonly<{
    usesStoreProductId:
      true;

    clientPriceIsNotTrusted:
      true;

    stockMustBeRevalidated:
      true;

    priceMustBeRevalidated:
      true;

    statusMustBeRevalidated:
      true;

    storeMustBeRevalidated:
      true;
  }>;


/* ==========================================================================
   45. GARANTIES LIVRAISON
   ========================================================================== */

/**
 * La page peut annoncer une couverture Afrique + internationale.
 *
 * ============================================================================
 *
 * Elle ne doit en revanche pas inventer :
 *
 * - délai ;
 * - prix ;
 * - transporteur ;
 * - date de livraison ;
 * - gratuité ;
 * - garantie de livraison.
 *
 * ============================================================================
 */
export type PublicProductDetailDeliveryGuarantees =
  Readonly<{
    africaCoverage:
      true;

    internationalCoverage:
      true;

    noFakeDeliveryPrice:
      true;

    noFakeDeliveryDelay:
      true;

    destinationRulesMayVary:
      true;
  }>;


/* ==========================================================================
   46. GARANTIES UI
   ========================================================================== */

export type PublicProductDetailUiGuarantees =
  Readonly<{
    desktopFooterVisible:
      true;

    mobileFooterHidden:
      true;

    mobileBottomNavigationPreserved:
      true;

    usesExistingPublicHeader:
      true;

    doesNotCreateSecondPublicNavigation:
      true;

    doesNotCreateSecondPanier:
      true;
  }>;


/* ==========================================================================
   47. PAGE DATA COMPLÈTE
   ========================================================================== */

/**
 * Alias explicite pour :
 *
 * src/app/(public)/p/[qrToken]/page.tsx
 */
export type PublicProductDetailPageData =
  PublicProductDetailData;


/* ==========================================================================
   48. PAGE PROPS INTERNE
   ========================================================================== */

export interface PublicProductDetailPageComponentProps {
  readonly data:
    PublicProductDetailPageData;

  readonly presentation?:
    PublicProductDetailPresentationData;
}


/* ==========================================================================
   49. TYPE IMAGE PRINCIPALE
   ========================================================================== */

export type PublicProductDetailPrimaryImage =
  PublicProductDetailData[
    "primaryImage"
  ];


/* ==========================================================================
   50. TYPE PRIX DE LA FICHE
   ========================================================================== */

export type PublicProductDetailPrice =
  PublicProductDetailData[
    "pricing"
  ];


/* ==========================================================================
   51. TYPE INVENTAIRE DE LA FICHE
   ========================================================================== */

export type PublicProductDetailStock =
  PublicProductDetailData[
    "inventory"
  ];


/* ==========================================================================
   52. TYPE BOUTIQUE DE LA FICHE
   ========================================================================== */

export type PublicProductDetailPointOfSale =
  PublicProductDetailData[
    "store"
  ];


/* ==========================================================================
   53. TYPE PRODUIT DE LA FICHE
   ========================================================================== */

export type PublicProductDetailProduct =
  PublicProductDetailData[
    "product"
  ];


/* ==========================================================================
   54. TYPE OFFRE DE LA FICHE
   ========================================================================== */

export type PublicProductDetailStoreProduct =
  PublicProductDetailData[
    "offer"
  ];


/* ==========================================================================
   55. TYPE CONTENU DE LA FICHE
   ========================================================================== */

export type PublicProductDetailProductContent =
  PublicProductDetailData[
    "content"
  ];


/* ==========================================================================
   56. TYPE CATÉGORIE DE LA FICHE
   ========================================================================== */

export type PublicProductDetailProductCategory =
  PublicProductDetailData[
    "category"
  ];


/* ==========================================================================
   57. TYPE PANIER DE LA FICHE
   ========================================================================== */

export type PublicProductDetailPanier =
  PublicProductDetailData[
    "panier"
  ];


/* ==========================================================================
   58. CONTRAT FINAL DE LA PAGE PREMIUM
   ========================================================================== */

/**
 * Structure complète pouvant être assemblée par la page Server Component :
 *
 * - données produit réelles ;
 * - présentation commerciale contrôlée.
 *
 * ============================================================================
 *
 * La query produit ne doit pas être obligée de connaître :
 *
 * - WhatsApp ;
 * - route Livraison ;
 * - route Contact ;
 * - politique Footer.
 *
 * Ces informations appartiennent plutôt à la configuration publique.
 *
 * ============================================================================
 */
export type PublicProductDetailPremiumPageData =
  Readonly<{
    product:
      PublicProductDetailData;

    presentation:
      PublicProductDetailPresentationData;
  }>;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ROUTE :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * UNE FICHE =
 *
 * UNE offre StoreProduct.
 *
 * ============================================================================
 *
 * CONTENU PREMIUM PRÉVU :
 *
 * GALERIE PRODUIT
 *
 *        ↓
 *
 * NOM / MARQUE / CATÉGORIE / SKU
 *
 *        ↓
 *
 * PRIX / PROMOTION RÉELLE
 *
 *        ↓
 *
 * STOCK / DISPONIBILITÉ
 *
 *        ↓
 *
 * AJOUTER AU PANIER
 *
 *        ↓
 *
 * VOIR MON PANIER
 *
 *        ↓
 *
 * CONTINUER MES ACHATS
 *
 *        ↓
 *
 * POINT DE VENTE
 *
 *        ↓
 *
 * DESCRIPTION
 *
 *        ↓
 *
 * CONSEILS D'UTILISATION
 *
 *        ↓
 *
 * INGRÉDIENTS
 *
 *        ↓
 *
 * CONTENANCE / UNITÉ
 *
 *        ↓
 *
 * LIVRAISON AFRIQUE
 *
 *        ↓
 *
 * LIVRAISON INTERNATIONALE
 *
 *        ↓
 *
 * INFORMATIONS LIVRAISON
 *
 *        ↓
 *
 * WHATSAPP / CONTACT
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Footer affiché.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Footer masqué.
 *
 * Navigation basse conservée :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - fausse disponibilité ;
 * - fausse réduction ;
 * - fausse certification ;
 * - fausse garantie ;
 * - fausse livraison gratuite ;
 * - faux délai de livraison ;
 * - faux prix de livraison ;
 * - fausse boutique ;
 * - fausse image ;
 * - fausse catégorie.
 *
 * ============================================================================
 */