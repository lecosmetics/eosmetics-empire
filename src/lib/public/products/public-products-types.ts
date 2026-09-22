import {
  PUBLIC_PRODUCTS_ASSETS,
  PUBLIC_PRODUCTS_AVAILABILITY_CONFIG,
  PUBLIC_PRODUCTS_BOTTOM_NAV_CONFIG,
  PUBLIC_PRODUCTS_BREADCRUMB_CONFIG,
  PUBLIC_PRODUCTS_CARD_CONFIG,
  PUBLIC_PRODUCTS_CATALOG_CONFIG,
  PUBLIC_PRODUCTS_CATEGORY_FILTER_CONFIG,
  PUBLIC_PRODUCTS_CONFIG,
  PUBLIC_PRODUCTS_EMPTY_STATE_CONFIG,
  PUBLIC_PRODUCTS_FILTERS_CONFIG,
  PUBLIC_PRODUCTS_FOOTER_CONFIG,
  PUBLIC_PRODUCTS_GRID_CONFIG,
  PUBLIC_PRODUCTS_HERO_CONFIG,
  PUBLIC_PRODUCTS_LOADING_CONFIG,
  PUBLIC_PRODUCTS_PAGE_ID,
  PUBLIC_PRODUCTS_PAGINATION_CONFIG,
  PUBLIC_PRODUCTS_PANIER_INTEGRATION_CONFIG,
  PUBLIC_PRODUCTS_PRESENTATION_CONFIG,
  PUBLIC_PRODUCTS_PRICE_FILTER_CONFIG,
  PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG,
  PUBLIC_PRODUCTS_QUERY_PARAMETERS,
  PUBLIC_PRODUCTS_ROUTE,
  PUBLIC_PRODUCTS_SECTION_IDS,
  PUBLIC_PRODUCTS_SECTION_ORDER,
  PUBLIC_PRODUCTS_SORT_CONFIG,
  PUBLIC_PRODUCTS_TOOLBAR_CONFIG,
} from "@/config/public-products";

import type {
  PublicProductCardCollection,
  PublicProductCardData,
} from "@/lib/public/products/public-product-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TYPES — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/products/public-products-types.ts
 *
 * ============================================================================
 *
 * ROUTE :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par :
 *
 * - public-products-query.ts ;
 * - PublicProductsHero.tsx ;
 * - PublicProductsFilters.tsx ;
 * - PublicProductsToolbar.tsx ;
 * - PublicProductsGrid.tsx ;
 * - PublicProductsPagination.tsx ;
 * - app/(public)/produits/page.tsx ;
 * - app/(public)/produits/loading.tsx.
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
 * IMPORTANT :
 *
 * Une carte du catalogue représente UNE offre StoreProduct.
 *
 * Deux StoreProduct associés au même Product restent donc deux offres
 * différentes.
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - importer Prisma ;
 * - importer le client PostgreSQL ;
 * - effectuer de requête ;
 * - importer React ;
 * - contenir de JSX ;
 * - lire une session ;
 * - modifier le panier ;
 * - inventer un produit ;
 * - inventer un prix ;
 * - inventer une catégorie ;
 * - inventer un stock ;
 * - inventer une boutique ;
 * - construire une route produit.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. UTILITAIRES
   ========================================================================== */

export type PublicProductsRequiredText =
  string;


export type PublicProductsOptionalText =
  string |
  null;


export type PublicProductsCount =
  number;


/**
 * Valeur décimale sérialisée.
 *
 * Exemple :
 *
 * "12500.00"
 *
 * Aucun objet Prisma Decimal ne doit atteindre les composants.
 */
export type PublicProductsMoneyAmount =
  string;


/* ==========================================================================
   2. PAGE
   ========================================================================== */

export type PublicProductsPageId =
  typeof PUBLIC_PRODUCTS_PAGE_ID;


export type PublicProductsRoute =
  typeof PUBLIC_PRODUCTS_ROUTE;


/* ==========================================================================
   3. SECTIONS
   ========================================================================== */

export type PublicProductsSectionIds =
  typeof PUBLIC_PRODUCTS_SECTION_IDS;


export type PublicProductsSectionId =
  PublicProductsSectionIds[
    keyof PublicProductsSectionIds
  ];


export type PublicProductsSectionOrder =
  typeof PUBLIC_PRODUCTS_SECTION_ORDER;


export type PublicProductsSectionOrderItem =
  PublicProductsSectionOrder[number];


/* ==========================================================================
   4. ASSETS
   ========================================================================== */

export type PublicProductsAssets =
  typeof PUBLIC_PRODUCTS_ASSETS;


export type PublicProductsAssetKey =
  keyof PublicProductsAssets;


export type PublicProductsAssetPath =
  PublicProductsAssets[
    PublicProductsAssetKey
  ];


/* ==========================================================================
   5. BREADCRUMB
   ========================================================================== */

export type PublicProductsBreadcrumbConfig =
  typeof PUBLIC_PRODUCTS_BREADCRUMB_CONFIG;


export type PublicProductsBreadcrumbHome =
  PublicProductsBreadcrumbConfig[
    "home"
  ];


export type PublicProductsBreadcrumbCurrent =
  PublicProductsBreadcrumbConfig[
    "current"
  ];


/* ==========================================================================
   6. HERO
   ========================================================================== */

export type PublicProductsHeroConfig =
  typeof PUBLIC_PRODUCTS_HERO_CONFIG;


export type PublicProductsHeroImage =
  PublicProductsHeroConfig[
    "image"
  ];


export type PublicProductsHeroTitleLine =
  PublicProductsHeroConfig[
    "titleLines"
  ][number];


export type PublicProductsHeroPresentation =
  PublicProductsHeroConfig[
    "presentation"
  ];


/* ==========================================================================
   7. CATALOGUE
   ========================================================================== */

export type PublicProductsCatalogConfig =
  typeof PUBLIC_PRODUCTS_CATALOG_CONFIG;


/* ==========================================================================
   8. PARAMÈTRES URL
   ========================================================================== */

export type PublicProductsQueryParameters =
  typeof PUBLIC_PRODUCTS_QUERY_PARAMETERS;


export type PublicProductsQueryParameterName =
  PublicProductsQueryParameters[
    keyof PublicProductsQueryParameters
  ];


/**
 * Valeur brute que Next.js peut fournir dans searchParams.
 */
export type PublicProductsRawSearchParamValue =
  string |
  string[] |
  undefined;


/**
 * Objet searchParams brut.
 *
 * Compatible avec l'App Router.
 */
export type PublicProductsRawSearchParams =
  Readonly<
    Record<
      string,
      PublicProductsRawSearchParamValue
    >
  >;


/* ==========================================================================
   9. CONFIGURATION FILTRES
   ========================================================================== */

export type PublicProductsCategoryFilterConfig =
  typeof PUBLIC_PRODUCTS_CATEGORY_FILTER_CONFIG;


export type PublicProductsPriceFilterConfig =
  typeof PUBLIC_PRODUCTS_PRICE_FILTER_CONFIG;


export type PublicProductsPromotionFilterConfig =
  typeof PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG;


export type PublicProductsAvailabilityConfig =
  typeof PUBLIC_PRODUCTS_AVAILABILITY_CONFIG;


export type PublicProductsFiltersConfig =
  typeof PUBLIC_PRODUCTS_FILTERS_CONFIG;


/* ==========================================================================
   10. TRI
   ========================================================================== */

export type PublicProductsSortConfig =
  typeof PUBLIC_PRODUCTS_SORT_CONFIG;


export type PublicProductsSortOption =
  PublicProductsSortConfig[
    "options"
  ][number];


export type PublicProductsSortValue =
  PublicProductsSortOption[
    "value"
  ];


export type PublicProductsSortField =
  PublicProductsSortOption[
    "field"
  ];


export type PublicProductsSortDirection =
  PublicProductsSortOption[
    "direction"
  ];


/* ==========================================================================
   11. PAGINATION — CONFIGURATION
   ========================================================================== */

export type PublicProductsPaginationConfig =
  typeof PUBLIC_PRODUCTS_PAGINATION_CONFIG;


/* ==========================================================================
   12. TOOLBAR
   ========================================================================== */

export type PublicProductsToolbarConfig =
  typeof PUBLIC_PRODUCTS_TOOLBAR_CONFIG;


/* ==========================================================================
   13. GRILLE
   ========================================================================== */

export type PublicProductsGridConfig =
  typeof PUBLIC_PRODUCTS_GRID_CONFIG;


export type PublicProductsGridPresentation =
  PublicProductsGridConfig[
    "presentation"
  ];


export type PublicProductsDesktopGridPresentation =
  PublicProductsGridPresentation[
    "desktop"
  ];


export type PublicProductsTabletGridPresentation =
  PublicProductsGridPresentation[
    "tablet"
  ];


export type PublicProductsMobileGridPresentation =
  PublicProductsGridPresentation[
    "mobile"
  ];


/* ==========================================================================
   14. CARTE
   ========================================================================== */

export type PublicProductsCardConfig =
  typeof PUBLIC_PRODUCTS_CARD_CONFIG;


export type PublicProductsAddToPanierConfig =
  PublicProductsCardConfig[
    "addToPanier"
  ];


/* ==========================================================================
   15. PANIER — INTÉGRATION
   ========================================================================== */

export type PublicProductsPanierIntegrationConfig =
  typeof PUBLIC_PRODUCTS_PANIER_INTEGRATION_CONFIG;


/* ==========================================================================
   16. AUTRES CONFIGURATIONS
   ========================================================================== */

export type PublicProductsEmptyStateConfig =
  typeof PUBLIC_PRODUCTS_EMPTY_STATE_CONFIG;


export type PublicProductsLoadingConfig =
  typeof PUBLIC_PRODUCTS_LOADING_CONFIG;


export type PublicProductsFooterConfig =
  typeof PUBLIC_PRODUCTS_FOOTER_CONFIG;


export type PublicProductsBottomNavigationConfig =
  typeof PUBLIC_PRODUCTS_BOTTOM_NAV_CONFIG;


export type PublicProductsPresentationConfig =
  typeof PUBLIC_PRODUCTS_PRESENTATION_CONFIG;


export type PublicProductsConfig =
  typeof PUBLIC_PRODUCTS_CONFIG;


/* ==========================================================================
   17. CATÉGORIE — OPTION DE FILTRE
   ========================================================================== */

/**
 * Représente une vraie ProductCategory utilisable comme filtre.
 *
 * Aucun nom ou slug n'est défini manuellement dans la configuration.
 */
export type PublicProductsCategoryFilterOption =
  Readonly<{
    /**
     * ProductCategory.id
     */
    id:
      PublicProductsRequiredText;

    /**
     * ProductCategory.name
     */
    name:
      PublicProductsRequiredText;

    /**
     * ProductCategory.slug
     */
    slug:
      PublicProductsRequiredText;

    /**
     * Nombre réel d'offres StoreProduct éligibles à l'intérieur
     * de cette catégorie.
     *
     * Ce compteur est optionnel visuellement mais doit rester réel.
     */
    availableOfferCount:
      PublicProductsCount;
  }>;


/**
 * Toutes les catégories réellement utilisables dans le filtre.
 */
export type PublicProductsCategoryFilterCollection =
  readonly PublicProductsCategoryFilterOption[];


/* ==========================================================================
   18. BORNES RÉELLES DE PRIX
   ========================================================================== */

/**
 * Les valeurs viennent réellement de StoreProduct.price.
 *
 * Null signifie :
 *
 * aucune offre publique éligible permettant de calculer cette borne.
 */
export type PublicProductsPriceBounds =
  Readonly<{
    minimum:
      PublicProductsMoneyAmount |
      null;

    maximum:
      PublicProductsMoneyAmount |
      null;

    currency:
      PublicProductsRequiredText |
      null;
  }>;


/* ==========================================================================
   19. FILTRES ACTIFS NORMALISÉS
   ========================================================================== */

/**
 * Représentation serveur des paramètres de filtre après validation.
 *
 * Aucun composant n'a besoin de retraiter directement les query parameters.
 */
export type PublicProductsActiveFilters =
  Readonly<{
    /**
     * ProductCategory.slug réel.
     */
    categorySlug:
      PublicProductsOptionalText;

    /**
     * Montant minimum demandé.
     *
     * Valeur déjà validée et sérialisée.
     */
    minimumPrice:
      PublicProductsMoneyAmount |
      null;

    /**
     * Montant maximum demandé.
     */
    maximumPrice:
      PublicProductsMoneyAmount |
      null;

    /**
     * true :
     *
     * seulement les vraies promotions :
     *
     * compareAtPrice > price
     */
    promotionOnly:
      boolean;

    /**
     * Tri reconnu par la configuration.
     */
    sort:
      PublicProductsSortValue;

    /**
     * Page valide, toujours >= 1.
     */
    page:
      number;
  }>;


/* ==========================================================================
   20. ÉTAT DES FILTRES
   ========================================================================== */

export type PublicProductsFiltersState =
  Readonly<{
    active:
      PublicProductsActiveFilters;

    categories:
      PublicProductsCategoryFilterCollection;

    priceBounds:
      PublicProductsPriceBounds;
  }>;


/* ==========================================================================
   21. PAGINATION — DONNÉES
   ========================================================================== */

export type PublicProductsPaginationData =
  Readonly<{
    currentPage:
      number;

    pageSize:
      number;

    totalItems:
      PublicProductsCount;

    totalPages:
      PublicProductsCount;

    hasPreviousPage:
      boolean;

    hasNextPage:
      boolean;

    previousPage:
      number |
      null;

    nextPage:
      number |
      null;
  }>;


/* ==========================================================================
   22. LIEN DE PAGINATION
   ========================================================================== */

/**
 * href doit être préparé avec les paramètres actifs conservés.
 *
 * Le composant Pagination n'a pas besoin de reconstruire manuellement
 * la query string.
 */
export type PublicProductsPaginationLink =
  Readonly<{
    page:
      number;

    label:
      PublicProductsRequiredText;

    href:
      PublicProductsRequiredText;

    current:
      boolean;
  }>;


export type PublicProductsPaginationLinkCollection =
  readonly PublicProductsPaginationLink[];


/* ==========================================================================
   23. PAGINATION COMPLÈTE
   ========================================================================== */

export type PublicProductsPaginationView =
  Readonly<{
    data:
      PublicProductsPaginationData;

    pages:
      PublicProductsPaginationLinkCollection;

    previousHref:
      PublicProductsOptionalText;

    nextHref:
      PublicProductsOptionalText;
  }>;


/* ==========================================================================
   24. OFFRE PRODUIT
   ========================================================================== */

/**
 * Une offre catalogue réutilise directement le contrat public partagé.
 *
 * Une entrée = un StoreProduct.
 */
export type PublicProductsCatalogItem =
  PublicProductCardData;


export type PublicProductsCatalogCollection =
  PublicProductCardCollection;


/* ==========================================================================
   25. RÉSULTAT DE REQUÊTE — PAGE /produits
   ========================================================================== */

/**
 * Structure finale attendue de :
 *
 * getPublicProductsPageData(...)
 */
export type PublicProductsPageData =
  Readonly<{
    /**
     * Offres de la page courante uniquement.
     */
    products:
      PublicProductsCatalogCollection;

    /**
     * Nombre total d'offres correspondant aux filtres,
     * toutes pages confondues.
     */
    totalProductCount:
      PublicProductsCount;

    /**
     * Catégories utilisables par la sidebar / drawer.
     */
    categories:
      PublicProductsCategoryFilterCollection;

    /**
     * Bornes issues des vraies offres commerciales.
     */
    priceBounds:
      PublicProductsPriceBounds;

    /**
     * Valeurs URL déjà validées.
     */
    activeFilters:
      PublicProductsActiveFilters;

    /**
     * Pagination calculée côté serveur.
     */
    pagination:
      PublicProductsPaginationView;
  }>;


/* ==========================================================================
   26. ALIAS RÉSULTAT
   ========================================================================== */

export type PublicProductsQueryResult =
  PublicProductsPageData;


/* ==========================================================================
   27. PARAMÈTRES SERVEUR DE LA REQUÊTE
   ========================================================================== */

/**
 * Contrat que pourra recevoir public-products-query.ts.
 *
 * Il ne s'agit PAS directement de paramètres Prisma.
 */
export type PublicProductsQueryInput =
  Readonly<{
    searchParams:
      PublicProductsRawSearchParams;
  }>;


/* ==========================================================================
   28. PROPS NEXT.JS — PAGE /produits
   ========================================================================== */

/**
 * Next.js 16 utilise des searchParams asynchrones sur les pages App Router.
 */
export interface PublicProductsRoutePageProps {
  readonly searchParams:
    Promise<
      PublicProductsRawSearchParams
    >;
}


/* ==========================================================================
   29. PROPS — HERO
   ========================================================================== */

export interface PublicProductsHeroProps {
  readonly className?:
    string;
}


/* ==========================================================================
   30. PROPS — FILTRES
   ========================================================================== */

export interface PublicProductsFiltersProps {
  readonly categories:
    PublicProductsCategoryFilterCollection;

  readonly priceBounds:
    PublicProductsPriceBounds;

  readonly activeFilters:
    PublicProductsActiveFilters;
}


/* ==========================================================================
   31. PROPS — TOOLBAR
   ========================================================================== */

export interface PublicProductsToolbarProps {
  readonly totalProductCount:
    PublicProductsCount;

  readonly activeFilters:
    PublicProductsActiveFilters;
}


/* ==========================================================================
   32. PROPS — GRILLE
   ========================================================================== */

export interface PublicProductsGridProps {
  readonly products:
    PublicProductsCatalogCollection;
}


/* ==========================================================================
   33. PROPS — PAGINATION
   ========================================================================== */

export interface PublicProductsPaginationProps {
  readonly pagination:
    PublicProductsPaginationView;
}


/* ==========================================================================
   34. PROPS — PAGE CATALOGUE
   ========================================================================== */

export interface PublicProductsCatalogPageProps {
  readonly data:
    PublicProductsPageData;
}


/* ==========================================================================
   35. TRI — HELPERS
   ========================================================================== */

export type PublicProductsSortOptionCollection =
  readonly PublicProductsSortOption[];


/**
 * Vérification typée potentiellement utilisable par la couche serveur.
 */
export type PublicProductsSortPredicate =
  (
    value:
      string,
  ) => value is PublicProductsSortValue;


/* ==========================================================================
   36. FILTRE PRIX — VALEURS FORMULAIRE
   ========================================================================== */

/**
 * Les champs HTML travaillent avec des chaînes.
 *
 * La validation et la conversion restent côté serveur.
 */
export type PublicProductsPriceFilterFormValue =
  Readonly<{
    minimum:
      string;

    maximum:
      string;
  }>;


/* ==========================================================================
   37. FILTRES — FORMULAIRE PUBLIC
   ========================================================================== */

export type PublicProductsFilterFormValues =
  Readonly<{
    category:
      string;

    minimumPrice:
      string;

    maximumPrice:
      string;

    promotionOnly:
      boolean;

    sort:
      PublicProductsSortValue;
  }>;


/* ==========================================================================
   38. QUERY STRING NORMALISÉE
   ========================================================================== */

/**
 * Structure interne utile pour construire des URLs sans dépendre
 * directement de URLSearchParams dans les types métier.
 */
export type PublicProductsNormalizedQueryState =
  Readonly<{
    category?:
      string;

    minPrice?:
      string;

    maxPrice?:
      string;

    promo?:
      string;

    sort?:
      string;

    page?:
      string;
  }>;


/* ==========================================================================
   39. PAGE VIDE
   ========================================================================== */

export type PublicProductsEmptyState =
  Readonly<{
    isEmpty:
      boolean;

    totalProductCount:
      PublicProductsCount;

    hasActiveFilters:
      boolean;
  }>;


/* ==========================================================================
   40. ÉTAT DE PAGINATION
   ========================================================================== */

export type PublicProductsPaginationState =
  Readonly<{
    currentPage:
      number;

    totalPages:
      number;

    isFirstPage:
      boolean;

    isLastPage:
      boolean;
  }>;


/* ==========================================================================
   41. CONTRAT PANIER — CATALOGUE
   ========================================================================== */

/**
 * Données minimales qu'un bouton "Ajouter au panier" doit transmettre.
 *
 * IMPORTANT :
 *
 * Aucun prix n'est transmis comme autorité commerciale.
 *
 * Le prix sera relu côté serveur lors de la consultation/validation
 * du panier.
 */
export type PublicProductsAddToPanierPayload =
  Readonly<{
    /**
     * StoreProduct.id
     */
    storeProductId:
      PublicProductsRequiredText;

    /**
     * Quantité demandée.
     *
     * Toujours >= 1 après validation.
     */
    quantity:
      number;
  }>;


/* ==========================================================================
   42. RÉSULTAT LOCAL D'UN AJOUT AU PANIER
   ========================================================================== */

/**
 * Contrat UI uniquement.
 *
 * La validation définitive d'une commande reste serveur.
 */
export type PublicProductsAddToPanierResult =
  Readonly<
    | {
        success:
          true;

        storeProductId:
          PublicProductsRequiredText;

        quantity:
          number;
      }
    | {
        success:
          false;

        storeProductId:
          PublicProductsRequiredText;

        reason:
          "INVALID_PRODUCT" |
          "INVALID_QUANTITY" |
          "UNAVAILABLE";
      }
  >;


/* ==========================================================================
   43. DONNÉES PERSISTABLES DU PANIER
   ========================================================================== */

/**
 * Correspond volontairement à :
 *
 * PUBLIC_PRODUCTS_PANIER_INTEGRATION_CONFIG.persistedFields
 *
 * Prix, stock, devise et boutique ne sont pas stockés comme vérité.
 */
export type PublicProductsPersistedPanierItem =
  Readonly<{
    storeProductId:
      PublicProductsRequiredText;

    quantity:
      number;
  }>;


/* ==========================================================================
   44. COLLECTION PANIER MINIMALE
   ========================================================================== */

export type PublicProductsPersistedPanierCollection =
  readonly PublicProductsPersistedPanierItem[];


/* ==========================================================================
   45. COLONNES
   ========================================================================== */

export type PublicProductsDesktopColumns =
  PublicProductsDesktopGridPresentation[
    "columns"
  ];


export type PublicProductsTabletColumns =
  PublicProductsTabletGridPresentation[
    "columns"
  ];


export type PublicProductsMobileColumns =
  PublicProductsMobileGridPresentation[
    "columns"
  ];


/* ==========================================================================
   46. PAGE SIZE
   ========================================================================== */

export type PublicProductsPageSize =
  PublicProductsPaginationConfig[
    "pageSize"
  ];


/* ==========================================================================
   47. IMAGE HERO
   ========================================================================== */

export type PublicProductsHeroImageSource =
  PublicProductsHeroImage[
    "src"
  ];


/* ==========================================================================
   48. GARANTIES DONNÉES — CATALOGUE
   ========================================================================== */

/**
 * Type documentaire.
 *
 * Il n'introduit aucune logique runtime.
 */
export type PublicProductsDataGuarantees =
  Readonly<{
    productsRepresentStoreProducts:
      true;

    productsAreReal:
      true;

    productsAreActive:
      true;

    storesAreActive:
      true;

    storeProductsAreActive:
      true;

    pricesAreReal:
      true;

    stocksAreReal:
      true;

    currenciesAreReal:
      true;

    productImagesAreReal:
      true;

    productRoutesAreResolved:
      true;

    categoriesAreReal:
      true;

    paginationIsServerDerived:
      true;

    noDemoProducts:
      true;

    noDemoPrices:
      true;

    noDemoCategories:
      true;
  }>;


/* ==========================================================================
   49. GARANTIES PANIER
   ========================================================================== */

export type PublicProductsPanierGuarantees =
  Readonly<{
    usesStoreProductId:
      true;

    persistsQuantityOnlyWithIdentifier:
      true;

    revalidatesPriceServerSide:
      true;

    revalidatesStockServerSide:
      true;

    revalidatesStatusServerSide:
      true;

    doesNotTrustClientPrice:
      true;
  }>;


/* ==========================================================================
   50. CONTRAT GLOBAL PAGE
   ========================================================================== */

export type PublicProductsPageContract =
  Readonly<{
    config:
      PublicProductsConfig;

    data:
      PublicProductsPageData;
  }>;


/* ==========================================================================
   51. RÉEXPORTS DU CONTRAT PRODUIT PARTAGÉ
   ========================================================================== */

/**
 * Permet aux fichiers de la feature catalogue d'importer les contrats
 * principaux depuis cette couche lorsqu'ils en ont besoin.
 */
export type {
  PublicProductCardCollection,
  PublicProductCardData,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * PAGE :
 *
 * /produits
 *
 * ============================================================================
 *
 * UNE CARTE PRODUIT REPRÉSENTE :
 *
 * StoreProduct
 *
 * ============================================================================
 *
 * UNE CARTE POSSÈDE :
 *
 * - vrai StoreProduct.id ;
 * - vrai Product.id ;
 * - vrai nom Product ;
 * - vrai SKU ;
 * - vraie ProductImage ;
 * - vrai prix StoreProduct ;
 * - vrai compareAtPrice éventuel ;
 * - vraie devise ;
 * - vrai stock ;
 * - vraie disponibilité ;
 * - vraie route /p/[qrToken] déjà résolue ;
 * - vraie boutique.
 *
 * ============================================================================
 *
 * FILTRES :
 *
 * Catégorie :
 *
 * ProductCategory.slug
 *
 * Prix :
 *
 * StoreProduct.price
 *
 * Promotion :
 *
 * compareAtPrice > price
 *
 * ============================================================================
 *
 * TRI :
 *
 * - récent ;
 * - prix croissant ;
 * - prix décroissant ;
 * - nom A → Z.
 *
 * Aucun tri "populaire" ou "meilleure vente" n'est inventé.
 *
 * ============================================================================
 *
 * PAGINATION :
 *
 * totalProductCount
 * totalPages
 * currentPage
 * pageSize
 * previous / next
 * liens déjà résolus.
 *
 * ============================================================================
 *
 * GRILLE :
 *
 * Desktop :
 *
 * 5 colonnes.
 *
 * Tablette :
 *
 * 3 colonnes.
 *
 * Mobile :
 *
 * 2 colonnes.
 *
 * ============================================================================
 *
 * PANIER :
 *
 * Données persistables minimales :
 *
 * storeProductId
 * quantity
 *
 * ============================================================================
 *
 * NE PAS FAIRE CONFIANCE AU NAVIGATEUR POUR :
 *
 * price
 * currency
 * stockQuantity
 * status
 * store
 *
 * Ces données devront être relues côté serveur.
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - donnée fictive ;
 * - logique React ;
 * - logique navigateur ;
 * - route produit construite dans ce fichier.
 *
 * ============================================================================
 */