import {
  generalAppRoutes,
} from "@/config/routes";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CONFIGURATION — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/public-products.ts
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser uniquement la configuration fonctionnelle, éditoriale et
 * visuelle de la page publique affichant toutes les offres produits.
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
 * Donc :
 *
 * même Product
 *
 * ├── StoreProduct boutique A
 * └── StoreProduct boutique B
 *
 * =
 *
 * deux offres commerciales distinctes.
 *
 * ============================================================================
 *
 * ROUTES
 *
 * Catalogue :
 *
 * /produits
 *
 * Détail d'une offre :
 *
 * /p/[qrToken]
 *
 * La route détail sera construite exclusivement avec :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * depuis :
 *
 * src/config/routes.ts
 *
 * ============================================================================
 *
 * IMAGE HERO
 *
 * Fichier physique :
 *
 * public/images/resulta.png
 *
 * URL Next.js :
 *
 * /images/resulta.png
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - importer Prisma ;
 * - accéder à PostgreSQL ;
 * - contenir des produits fictifs ;
 * - contenir des prix fictifs ;
 * - contenir des catégories fictives ;
 * - contenir des boutiques fictives ;
 * - contenir de JSX ;
 * - dépendre de React ;
 * - gérer le panier ;
 * - modifier le stock ;
 * - fabriquer les routes produit ;
 * - définir des données commerciales de démonstration.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. IDENTIFIANT DE PAGE
   ========================================================================== */

export const PUBLIC_PRODUCTS_PAGE_ID =
  "public-products-page" as const;


/* ==========================================================================
   2. ROUTE
   ========================================================================== */

/**
 * On réutilise la source officielle définie dans :
 *
 * src/config/routes.ts
 */
export const PUBLIC_PRODUCTS_ROUTE =
  generalAppRoutes.products;


/* ==========================================================================
   3. IDENTIFIANTS DE SECTIONS
   ========================================================================== */

export const PUBLIC_PRODUCTS_SECTION_IDS = {
  hero:
    "products-hero",

  catalog:
    "products-catalog",

  filters:
    "products-filters",

  grid:
    "products-grid",

  pagination:
    "products-pagination",
} as const;


/* ==========================================================================
   4. ORDRE DES SECTIONS
   ========================================================================== */

export const PUBLIC_PRODUCTS_SECTION_ORDER = [
  PUBLIC_PRODUCTS_SECTION_IDS.hero,
  PUBLIC_PRODUCTS_SECTION_IDS.catalog,
] as const;


/* ==========================================================================
   5. ASSETS
   ========================================================================== */

export const PUBLIC_PRODUCTS_ASSETS = {
  hero:
    "/images/resulta.png",
} as const;


/* ==========================================================================
   6. BREADCRUMB
   ========================================================================== */

export const PUBLIC_PRODUCTS_BREADCRUMB_CONFIG = {
  ariaLabel:
    "Fil d’Ariane",

  home: {
    label:
      "Accueil",

    href:
      generalAppRoutes.home,
  },

  current: {
    label:
      "Produits",
  },
} as const;


/* ==========================================================================
   7. HERO
   ========================================================================== */

export const PUBLIC_PRODUCTS_HERO_CONFIG = {
  sectionId:
    PUBLIC_PRODUCTS_SECTION_IDS.hero,

  image: {
    src:
      PUBLIC_PRODUCTS_ASSETS.hero,

    alt:
      "Catalogue L&E Cosmetics Empire",

    priority:
      true,

    fill:
      true,
  },

  eyebrow:
    "NOS PRODUITS",

  titleLines: [
    {
      id:
        "line-1",

      text:
        "Tous nos produits",
    },

    {
      id:
        "line-2",

      text:
        "pour votre beauté",
    },
  ],

  description:
    "Découvrez les produits L&E Cosmetics Empire actuellement disponibles.",

  presentation: {
    desktop: {
      minHeight:
        300,

      contentAlignment:
        "left",

      imagePosition:
        "center",
    },

    mobile: {
      minHeight:
        205,

      contentAlignment:
        "left",

      imagePosition:
        "center",
    },
  },
} as const;


/* ==========================================================================
   8. CATALOGUE
   ========================================================================== */

export const PUBLIC_PRODUCTS_CATALOG_CONFIG = {
  sectionId:
    PUBLIC_PRODUCTS_SECTION_IDS.catalog,

  title:
    "Tous les produits",

  showResultCount:
    true,

  resultCountLabels: {
    zero:
      "Aucun produit",

    singular:
      "1 produit",

    pluralSuffix:
      "produits",
  },

  /**
   * Aucun plafond global.
   *
   * La pagination décide uniquement combien d'offres sont affichées
   * sur une page donnée.
   */
  loadAllEligibleOffers:
    true,

  /**
   * Une même offre StoreProduct ne doit apparaître qu'une seule fois.
   *
   * On ne déduplique jamais par Product.id.
   */
  deduplicateBy:
    "storeProductId",
} as const;


/* ==========================================================================
   9. PARAMÈTRES URL
   ========================================================================== */

/**
 * Exemple :
 *
 * /produits?category=soins-visage&minPrice=5000&maxPrice=25000&sort=price-asc&page=2
 *
 * Ces paramètres ne contiennent aucune donnée sensible.
 */
export const PUBLIC_PRODUCTS_QUERY_PARAMETERS = {
  category:
    "category",

  minPrice:
    "minPrice",

  maxPrice:
    "maxPrice",

  promotion:
    "promo",

  sort:
    "sort",

  page:
    "page",
} as const;


/* ==========================================================================
   10. FILTRE CATÉGORIE
   ========================================================================== */

/**
 * Les options ne sont jamais écrites ici.
 *
 * Elles proviennent réellement de ProductCategory.
 */
export const PUBLIC_PRODUCTS_CATEGORY_FILTER_CONFIG = {
  id:
    "category",

  label:
    "Catégories",

  enabled:
    true,

  parameter:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS.category,

  source:
    "ProductCategory",

  useDatabaseCategories:
    true,

  requireActiveCategory:
    true,

  multiple:
    false,
} as const;


/* ==========================================================================
   11. FILTRE PRIX
   ========================================================================== */

/**
 * Les bornes utilisées par l'interface devront être calculées à partir
 * des vraies offres StoreProduct.
 *
 * Aucun :
 *
 * min = 1000
 * max = 100000
 *
 * n'est inventé dans cette configuration.
 */
export const PUBLIC_PRODUCTS_PRICE_FILTER_CONFIG = {
  id:
    "price",

  label:
    "Prix",

  enabled:
    true,

  minParameter:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS.minPrice,

  maxParameter:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS.maxPrice,

  source:
    "StoreProduct.price",

  deriveBoundsFromDatabase:
    true,

  allowManualMinimum:
    true,

  allowManualMaximum:
    true,
} as const;


/* ==========================================================================
   12. FILTRE PROMOTION
   ========================================================================== */

/**
 * Une offre est considérée comme réellement promotionnelle uniquement
 * lorsque :
 *
 * compareAtPrice !== null
 *
 * ET :
 *
 * compareAtPrice > price
 *
 * Aucun pourcentage n'est inventé.
 */
export const PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG = {
  id:
    "promotion",

  label:
    "Promotions",

  enabled:
    true,

  parameter:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS.promotion,

  activeValue:
    "1",

  source:
    "StoreProduct.compareAtPrice",

  requireCompareAtPriceGreaterThanPrice:
    true,
} as const;


/* ==========================================================================
   13. DISPONIBILITÉ PUBLIQUE
   ========================================================================== */

/**
 * La page demandée affiche les produits réellement disponibles.
 *
 * On ne montre donc pas par défaut des offres :
 *
 * HIDDEN
 * ARCHIVED
 * OUT_OF_STOCK
 *
 * dans la grille principale.
 */
export const PUBLIC_PRODUCTS_AVAILABILITY_CONFIG = {
  requireActiveProduct:
    true,

  requireActiveStore:
    true,

  requireActiveStoreProduct:
    true,

  requirePositiveStock:
    true,

  requirePositivePrice:
    true,

  requireProductImage:
    true,
} as const;


/* ==========================================================================
   14. TRI
   ========================================================================== */

/**
 * Tous les tris ci-dessous reposent sur des données réelles déjà présentes.
 *
 * Aucun :
 *
 * - populaire ;
 * - tendance ;
 * - bestseller ;
 * - recommandé ;
 *
 * n'est proposé sans données permettant réellement de le calculer.
 */
export const PUBLIC_PRODUCTS_SORT_CONFIG = {
  parameter:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS.sort,

  defaultValue:
    "recent",

  label:
    "Trier par",

  options: [
    {
      id:
        "recent",

      value:
        "recent",

      label:
        "Plus récents",

      field:
        "updatedAt",

      direction:
        "desc",
    },

    {
      id:
        "price-asc",

      value:
        "price-asc",

      label:
        "Prix croissant",

      field:
        "price",

      direction:
        "asc",
    },

    {
      id:
        "price-desc",

      value:
        "price-desc",

      label:
        "Prix décroissant",

      field:
        "price",

      direction:
        "desc",
    },

    {
      id:
        "name-asc",

      value:
        "name-asc",

      label:
        "Nom A à Z",

      field:
        "product.name",

      direction:
        "asc",
    },
  ],
} as const;


/* ==========================================================================
   15. PAGINATION
   ========================================================================== */

/**
 * 20 offres :
 *
 * Desktop :
 *
 * 5 colonnes × 4 lignes.
 *
 * Mobile :
 *
 * 2 colonnes × 10 lignes.
 */
export const PUBLIC_PRODUCTS_PAGINATION_CONFIG = {
  enabled:
    true,

  parameter:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS.page,

  pageSize:
    20,

  firstPage:
    1,

  showPrevious:
    true,

  showNext:
    true,

  maximumVisiblePageButtons:
    5,

  labels: {
    previous:
      "Page précédente",

    next:
      "Page suivante",

    page:
      "Page",
  },
} as const;


/* ==========================================================================
   16. TOOLBAR
   ========================================================================== */

export const PUBLIC_PRODUCTS_TOOLBAR_CONFIG = {
  showResultCount:
    true,

  showSort:
    true,

  mobileFiltersButton: {
    visible:
      true,

    label:
      "Filtres",
  },

  mobileSortButton: {
    visible:
      true,

    label:
      "Trier",
  },
} as const;


/* ==========================================================================
   17. SIDEBAR FILTRES
   ========================================================================== */

export const PUBLIC_PRODUCTS_FILTERS_CONFIG = {
  sectionId:
    PUBLIC_PRODUCTS_SECTION_IDS.filters,

  title:
    "Filtrer les produits",

  resetLabel:
    "Réinitialiser",

  desktop: {
    visible:
      true,

    sticky:
      true,

    width:
      250,
  },

  mobile: {
    visibleInline:
      false,

    useDrawer:
      true,
  },

  category:
    PUBLIC_PRODUCTS_CATEGORY_FILTER_CONFIG,

  price:
    PUBLIC_PRODUCTS_PRICE_FILTER_CONFIG,

  promotion:
    PUBLIC_PRODUCTS_PROMOTION_FILTER_CONFIG,
} as const;


/* ==========================================================================
   18. GRILLE
   ========================================================================== */

export const PUBLIC_PRODUCTS_GRID_CONFIG = {
  sectionId:
    PUBLIC_PRODUCTS_SECTION_IDS.grid,

  presentation: {
    desktop: {
      mode:
        "grid",

      columns:
        5,

      horizontalScroll:
        false,
    },

    tablet: {
      mode:
        "grid",

      columns:
        3,

      horizontalScroll:
        false,
    },

    mobile: {
      mode:
        "grid",

      columns:
        2,

      horizontalScroll:
        false,
    },
  },
} as const;


/* ==========================================================================
   19. CARTE PRODUIT — CATALOGUE
   ========================================================================== */

/**
 * La carte réutilisable existe déjà :
 *
 * src/components/public/products/PublicProductCard.tsx
 *
 * Cette configuration indique uniquement ce que la version catalogue
 * devra présenter.
 */
export const PUBLIC_PRODUCTS_CARD_CONFIG = {
  showImage:
    true,

  showName:
    true,

  showCategory:
    true,

  showPrice:
    true,

  showCompareAtPrice:
    true,

  showPromotionBadge:
    true,

  showStore:
    false,

  showLocation:
    false,

  showSku:
    false,

  showRating:
    false,

  showFavoriteAction:
    false,

  productDetailLink:
    true,

  addToPanier: {
    enabled:
      true,

    label:
      "Ajouter au panier",

    defaultQuantity:
      1,

    /**
     * L'ajout devra utiliser StoreProduct.id.
     *
     * Jamais Product.id seul.
     */
    identifier:
      "storeProductId",

    /**
     * La carte n'a pas le droit de considérer son prix sérialisé
     * comme valeur autoritaire lors de la commande.
     */
    serverRevalidationRequired:
      true,
  },
} as const;


/* ==========================================================================
   20. PANIER — CONTRAT D'INTÉGRATION
   ========================================================================== */

/**
 * Le panier sera développé séparément dans :
 *
 * src/lib/public/panier/
 * src/components/public/panier/
 *
 * Ce bloc ne crée aucune logique panier.
 *
 * Il fixe seulement le contrat attendu par le catalogue.
 */
export const PUBLIC_PRODUCTS_PANIER_INTEGRATION_CONFIG = {
  enabled:
    true,

  itemIdentifier:
    "storeProductId",

  defaultQuantity:
    1,

  persistSelection:
    true,

  /**
   * Données minimales persistables côté navigateur.
   */
  persistedFields: [
    "storeProductId",
    "quantity",
  ],

  /**
   * Ces données doivent toujours être relues côté serveur.
   */
  serverValidatedFields: [
    "price",
    "currency",
    "stockQuantity",
    "status",
    "product",
    "store",
  ],
} as const;


/* ==========================================================================
   21. ÉTAT VIDE
   ========================================================================== */

export const PUBLIC_PRODUCTS_EMPTY_STATE_CONFIG = {
  title:
    "Aucun produit disponible",

  description:
    "Aucun produit ne correspond actuellement aux critères sélectionnés.",

  resetFiltersLabel:
    "Réinitialiser les filtres",
} as const;


/* ==========================================================================
   22. LOADING
   ========================================================================== */

/**
 * Skeletons uniquement.
 *
 * Aucun produit fictif ne doit être affiché pendant le chargement.
 */
export const PUBLIC_PRODUCTS_LOADING_CONFIG = {
  showSkeletons:
    true,

  skeletonCount:
    10,

  exposeFakeProductData:
    false,
} as const;


/* ==========================================================================
   23. FOOTER
   ========================================================================== */

/**
 * Exigence de la page :
 *
 * PC :
 * Footer visible.
 *
 * Mobile :
 * Footer masqué.
 *
 * Les 5 boutons de PublicMobileBottomNav restent visibles.
 */
export const PUBLIC_PRODUCTS_FOOTER_CONFIG = {
  desktop: {
    visible:
      true,
  },

  mobile: {
    visible:
      false,
  },

  mobileBreakpoint:
    767,
} as const;


/* ==========================================================================
   24. BOTTOM NAVIGATION
   ========================================================================== */

export const PUBLIC_PRODUCTS_BOTTOM_NAV_CONFIG = {
  useGlobalBottomNavigation:
    true,

  mobileVisible:
    true,

  /**
   * Aucun sixième bouton ne sera créé.
   */
  createAdditionalNavigation:
    false,
} as const;


/* ==========================================================================
   25. RESPONSIVE GLOBAL
   ========================================================================== */

export const PUBLIC_PRODUCTS_PRESENTATION_CONFIG = {
  fullWidth:
    true,

  useMaximumPageWidth:
    false,

  gutters: {
    desktop:
      "compact",

    tablet:
      "compact",

    mobile:
      "very-compact",
  },

  sidebar: {
    desktop:
      true,

    tablet:
      false,

    mobile:
      false,
  },
} as const;


/* ==========================================================================
   26. CONFIGURATION GLOBALE
   ========================================================================== */

export const PUBLIC_PRODUCTS_CONFIG = {
  pageId:
    PUBLIC_PRODUCTS_PAGE_ID,

  route:
    PUBLIC_PRODUCTS_ROUTE,

  sections:
    PUBLIC_PRODUCTS_SECTION_IDS,

  sectionOrder:
    PUBLIC_PRODUCTS_SECTION_ORDER,

  assets:
    PUBLIC_PRODUCTS_ASSETS,

  breadcrumb:
    PUBLIC_PRODUCTS_BREADCRUMB_CONFIG,

  hero:
    PUBLIC_PRODUCTS_HERO_CONFIG,

  catalog:
    PUBLIC_PRODUCTS_CATALOG_CONFIG,

  queryParameters:
    PUBLIC_PRODUCTS_QUERY_PARAMETERS,

  availability:
    PUBLIC_PRODUCTS_AVAILABILITY_CONFIG,

  filters:
    PUBLIC_PRODUCTS_FILTERS_CONFIG,

  sort:
    PUBLIC_PRODUCTS_SORT_CONFIG,

  pagination:
    PUBLIC_PRODUCTS_PAGINATION_CONFIG,

  toolbar:
    PUBLIC_PRODUCTS_TOOLBAR_CONFIG,

  grid:
    PUBLIC_PRODUCTS_GRID_CONFIG,

  card:
    PUBLIC_PRODUCTS_CARD_CONFIG,

  panier:
    PUBLIC_PRODUCTS_PANIER_INTEGRATION_CONFIG,

  emptyState:
    PUBLIC_PRODUCTS_EMPTY_STATE_CONFIG,

  loading:
    PUBLIC_PRODUCTS_LOADING_CONFIG,

  footer:
    PUBLIC_PRODUCTS_FOOTER_CONFIG,

  bottomNavigation:
    PUBLIC_PRODUCTS_BOTTOM_NAV_CONFIG,

  presentation:
    PUBLIC_PRODUCTS_PRESENTATION_CONFIG,
} as const;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ROUTE :
 *
 * /produits
 *
 * ============================================================================
 *
 * HERO :
 *
 * public/images/resulta.png
 *
 * URL :
 *
 * /images/resulta.png
 *
 * ============================================================================
 *
 * DONNÉES :
 *
 * StoreProduct
 *      ↓
 * Product
 *      ↓
 * ProductCategory
 *      ↓
 * ProductImage
 *
 * et :
 *
 * StoreProduct
 *      ↓
 * Store
 *
 * ============================================================================
 *
 * VISIBILITÉ :
 *
 * Product ACTIVE
 *
 * Store ACTIVE
 *
 * StoreProduct ACTIVE
 *
 * stock > 0
 *
 * prix > 0
 *
 * vraie image
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
 * PAGINATION :
 *
 * 20 offres par page.
 *
 * ============================================================================
 *
 * PANIER :
 *
 * storeProductId + quantity
 *
 * uniquement comme références persistables.
 *
 * Prix, stock, devise, statut et boutique doivent être revérifiés côté
 * serveur avant toute opération sensible.
 *
 * ============================================================================
 *
 * DÉTAIL PRODUIT :
 *
 * /p/[qrToken]
 *
 * construit ailleurs exclusivement avec :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Footer masqué.
 *
 * PublicMobileBottomNav globale conservée.
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - produit fictif ;
 * - prix fictif ;
 * - stock fictif ;
 * - catégorie fictive ;
 * - boutique fictive ;
 * - route produit inventée ;
 * - calcul de commande côté configuration.
 *
 * ============================================================================
 */