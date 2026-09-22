/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CONFIGURATION OFFICIELLE — PAGE D’ACCUEIL PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/public-home.ts
 *
 * Route :
 *
 * /
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser exclusivement la configuration éditoriale, structurelle
 * et visuelle de la page d’accueil publique officielle.
 *
 * ============================================================================
 *
 * ARCHITECTURE OFFICIELLE
 *
 * Header public
 *      ↓
 * Hero
 *      ↓
 * 4 avantages
 *      ↓
 * Catégories
 *      ↓
 * Bannière résultats
 *      ↓
 * Produits phares
 *      ↓
 * Instagram
 *      ↓
 * Footer
 *
 * ============================================================================
 *
 * IMAGES OFFICIELLES
 *
 * Hero :
 *
 * /images/couverture.png
 *
 * Bannière résultats :
 *
 * /images/couverturea.png
 *
 * Instagram :
 *
 * /images/baimage.png
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier NE DOIT PAS :
 *
 * - appeler Prisma ;
 * - importer Prisma ;
 * - lire PostgreSQL ;
 * - lire une session ;
 * - créer des produits fictifs ;
 * - créer des catégories fictives ;
 * - créer des prix fictifs ;
 * - créer des stocks fictifs ;
 * - inventer une route ;
 * - recopier les coordonnées de l’entreprise ;
 * - recopier les réseaux sociaux ;
 * - dupliquer les images desktop/mobile ;
 * - créer de faux slides ;
 * - ajouter une section absente de l’architecture officielle.
 *
 * Identité / coordonnées / réseaux :
 *
 * src/config/public-site.ts
 *
 * Routes :
 *
 * src/config/routes.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   1. IDENTIFIANTS DES SECTIONS
   ========================================================================== */

export const PUBLIC_HOME_SECTION_IDS = {
  hero:
    "accueil",

  benefits:
    "avantages",

  categories:
    "categories",

  promotion:
    "resultats",

  featuredProducts:
    "produits-phares",

  instagram:
    "instagram",
} as const;


/* ==========================================================================
   2. ORDRE OFFICIEL
   ========================================================================== */

export const PUBLIC_HOME_SECTION_ORDER = [
  PUBLIC_HOME_SECTION_IDS.hero,
  PUBLIC_HOME_SECTION_IDS.benefits,
  PUBLIC_HOME_SECTION_IDS.categories,
  PUBLIC_HOME_SECTION_IDS.promotion,
  PUBLIC_HOME_SECTION_IDS.featuredProducts,
  PUBLIC_HOME_SECTION_IDS.instagram,
] as const;


/* ==========================================================================
   3. ASSETS OFFICIELS
   ========================================================================== */

export const PUBLIC_HOME_ASSETS = {
  hero:
    "/images/couverture.png",

  promotion:
    "/images/couverturea.png",

  instagram:
    "/images/baimage.png",
} as const;


/* ==========================================================================
   4. HERO
   ========================================================================== */

export const PUBLIC_HOME_HERO_CONFIG = {
  sectionId:
    PUBLIC_HOME_SECTION_IDS.hero,

  mode:
    "static",

  image: {
    src:
      PUBLIC_HOME_ASSETS.hero,

    alt:
      "L&E Cosmetics Empire — Révèle ta beauté naturelle",

    priority:
      true,
  },

  /**
   * --------------------------------------------------------------------------
   * TITRE OFFICIEL
   * --------------------------------------------------------------------------
   *
   * RÉVÈLE
   * TA BEAUTÉ
   * NATURELLE
   *
   * IMPORTANT :
   *
   * La deuxième ligne contient deux couleurs :
   *
   * TA      → noir
   * BEAUTÉ  → rose
   *
   * `text` et `tone` restent présents afin de ne pas casser immédiatement
   * le composant actuel.
   *
   * `segments` devient la source précise utilisée par la nouvelle version
   * de PublicHomeHeroSection.tsx.
   */
  titleLines: [
    {
      id:
        "reveal",

      text:
        "RÉVÈLE",

      tone:
        "dark",

      segments: [
        {
          id:
            "reveal-dark",

          text:
            "RÉVÈLE",

          tone:
            "dark",
        },
      ],
    },

    {
      id:
        "beauty",

      text:
        "TA BEAUTÉ",

      tone:
        "dark",

      segments: [
        {
          id:
            "ta-dark",

          text:
            "TA ",

          tone:
            "dark",
        },

        {
          id:
            "beauty-primary",

          text:
            "BEAUTÉ",

          tone:
            "primary",
        },
      ],
    },

    {
      id:
        "natural",

      text:
        "NATURELLE",

      tone:
        "primary",

      segments: [
        {
          id:
            "natural-primary",

          text:
            "NATURELLE",

          tone:
            "primary",
        },
      ],
    },
  ],

  description:
    "Des soins efficaces pour une peau éclatante et en pleine santé.",

  action: {
    desktopLabel:
      "Découvrir nos produits",

    mobileLabel:
      "Découvrir maintenant",

    targetSectionId:
      PUBLIC_HOME_SECTION_IDS.featuredProducts,
  },

  presentation: {
    desktop:
      "wide-commercial-banner",

    mobile:
      "mobile-commercial-banner",

    preserveArtwork:
      true,

    duplicateImage:
      false,

    allowImageMultiplication:
      false,

    /**
     * Typographie correspondant à l’architecture officielle.
     */
    title: {
      uppercase:
        true,

      compactLineHeight:
        true,

      heavyWeight:
        true,

      italicAppearance:
        true,

      desktopAlignment:
        "left",

      mobileAlignment:
        "left",
    },

    mobileIndicators: {
      visible:
        true,

      count:
        4,

      activeIndex:
        0,

      decorativeOnly:
        true,

      ariaHidden:
        true,
    },
  },
} as const;


/* ==========================================================================
   5. AVANTAGES
   ========================================================================== */

export const PUBLIC_HOME_BENEFITS_CONFIG = {
  sectionId:
    PUBLIC_HOME_SECTION_IDS.benefits,

  ariaLabel:
    "Avantages L&E Cosmetics Empire",

  items: [
    {
      id:
        "delivery",

      icon:
        "truck",

      title:
        "Livraison rapide",

      description:
        "à Yaoundé et Douala",
    },

    {
      id:
        "original-products",

      icon:
        "shield-check",

      title:
        "Produits 100%",

      description:
        "originaux",
    },

    {
      id:
        "customer-service",

      icon:
        "headphones",

      title:
        "Service client",

      description:
        "disponible",
    },

    {
      id:
        "offers",

      icon:
        "gift",

      title:
        "Offres et promotions",

      description:
        "régulières",
    },
  ],

  presentation: {
    desktopColumns:
      4,

    mobileColumns:
      4,

    compactOnMobile:
      true,

    showDescription:
      true,
  },
} as const;


/* ==========================================================================
   6. CATÉGORIES OFFICIELLES
   ========================================================================== */

export const PUBLIC_HOME_CATEGORY_SLOTS = [
  {
    id:
      "face",

    desktopLabel:
      "Soins du visage",

    mobileLabel:
      "Visage",
  },

  {
    id:
      "body",

    desktopLabel:
      "Soins du corps",

    mobileLabel:
      "Corps",
  },

  {
    id:
      "hair",

    desktopLabel:
      "Soins capillaires",

    mobileLabel:
      "Cheveux",
  },

  {
    id:
      "gummies",

    desktopLabel:
      "Gommes & gélules",

    mobileLabel:
      "Gommes",
  },

  {
    id:
      "oils",

    desktopLabel:
      "Huiles & sérums",

    mobileLabel:
      "Huiles",
  },

  {
    id:
      "soaps",

    desktopLabel:
      "Savons & exfoliants",

    mobileLabel:
      "Savons",
  },
] as const;


/* ==========================================================================
   7. SECTION CATÉGORIES
   ========================================================================== */

export const PUBLIC_HOME_CATEGORIES_CONFIG = {
  sectionId:
    PUBLIC_HOME_SECTION_IDS.categories,

  title:
    "Nos Catégories",

  viewAll: {
    desktopLabel:
      "Voir toutes les catégories",

    mobileLabel:
      "Voir tout",

    routeSource:
      "routes",
  },

  slots:
    PUBLIC_HOME_CATEGORY_SLOTS,

  limit:
    6,

  requireActiveCategory:
    true,

  requireImage:
    true,

  presentation: {
    desktop: {
      columns:
        6,

      rows:
        1,
    },

    mobile: {
      columns:
        3,

      rows:
        2,

      horizontalCarousel:
        false,
    },

    preserveCategoryImage:
      true,
  },
} as const;


/* ==========================================================================
   8. BANNIÈRE RÉSULTATS
   ========================================================================== */

export const PUBLIC_HOME_PROMOTION_CONFIG = {
  sectionId:
    PUBLIC_HOME_SECTION_IDS.promotion,

  mode:
    "static",

  image: {
    /**
     * IMAGE OFFICIELLE CORRIGÉE.
     *
     * public/images/couverturea.png
     */
    src:
      PUBLIC_HOME_ASSETS.promotion,

    alt:
      "Produits L&E Cosmetics Empire — Des résultats visibles, une peau sublime",

    priority:
      false,
  },

  titleLines: [
    {
      id:
        "results",

      text:
        "DES RÉSULTATS",
    },

    {
      id:
        "visible",

      text:
        "VISIBLES,",
    },

    {
      id:
        "sublime",

      text:
        "UNE PEAU SUBLIME !",
    },
  ],

  action: {
    desktopLabel:
      "Voir nos best-sellers",

    mobileLabel:
      "Voir nos produits",

    targetSectionId:
      PUBLIC_HOME_SECTION_IDS.featuredProducts,
  },

  highlights: [
    {
      id:
        "radiance",

      icon:
        "sparkles",

      label:
        "Éclat naturel",
    },

    {
      id:
        "hydration",

      icon:
        "droplet",

      label:
        "Hydratation intense",
    },

    {
      id:
        "confidence",

      icon:
        "heart",

      label:
        "Confiance retrouvée",
    },
  ],

  presentation: {
    desktop:
      "wide-promotion-banner",

    mobile:
      "compact-promotion-banner",

    preserveArtwork:
      true,

    duplicateImage:
      false,

    allowImageMultiplication:
      false,

    showHighlightsOnDesktop:
      true,

    showHighlightsOnMobile:
      false,

    /**
     * L’image doit rester lisible et ne doit pas être remplacée
     * par une grande zone de texte.
     */
    imageFit:
      "cover",

    desktopImagePosition:
      "center",

    mobileImagePosition:
      "center",
  },
} as const;


/* ==========================================================================
   9. FILTRES PRODUITS — COMPATIBILITÉ
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * La nouvelle Home doit afficher directement les produits.
 *
 * Les filtres ne seront donc plus affichés dans la version finale.
 *
 * Cet export reste temporairement présent parce que :
 *
 * - public-home-types.ts ;
 * - PublicHomeProductFilters.tsx ;
 * - PublicHomeFeaturedProductsSection.tsx
 *
 * l’utilisent encore actuellement.
 *
 * Cela permet de corriger les fichiers l’un après l’autre sans casser
 * TypeScript entre deux étapes.
 */
export const PUBLIC_HOME_PRODUCT_FILTERS = [
  {
    id:
      "all",

    label:
      "Tous",

    categorySlotId:
      null,
  },

  {
    id:
      "face",

    label:
      "Visage",

    categorySlotId:
      "face",
  },

  {
    id:
      "body",

    label:
      "Corps",

    categorySlotId:
      "body",
  },

  {
    id:
      "hair",

    label:
      "Cheveux",

    categorySlotId:
      "hair",
  },

  {
    id:
      "gummies",

    label:
      "Gommes",

    categorySlotId:
      "gummies",
  },

  {
    id:
      "oils",

    label:
      "Huiles",

    categorySlotId:
      "oils",
  },

  {
    id:
      "soaps",

    label:
      "Savons",

    categorySlotId:
      "soaps",
  },
] as const;


/* ==========================================================================
   10. PRODUITS PHARES
   ========================================================================== */

export const PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG = {
  sectionId:
    PUBLIC_HOME_SECTION_IDS.featuredProducts,

  title:
    "Nos Produits Phares",

  viewAll: {
    desktopLabel:
      "Voir tous les produits",

    mobileLabel:
      "Voir tout",

    routeSource:
      "routes",
  },

  /**
   * --------------------------------------------------------------------------
   * CHARGEMENT DES PRODUITS
   * --------------------------------------------------------------------------
   *
   * La Home doit pouvoir recevoir toutes les offres publiques valides.
   *
   * La requête serveur ne devra donc plus limiter la liste générale
   * arbitrairement à cinq produits.
   */
  data: {
    loadAllPublicProducts:
      true,

    requireCategoryMatch:
      false,

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

    maxProducts:
      null,
  },

  /**
   * --------------------------------------------------------------------------
   * FILTRES
   * --------------------------------------------------------------------------
   *
   * Conservés dans le contrat pour compatibilité pendant la migration.
   *
   * `enabled: false` signifie que la version finale doit afficher
   * directement les produits.
   */
  filters:
    PUBLIC_HOME_PRODUCT_FILTERS,

  filtersEnabled:
    false,

  defaultFilterId:
    "all",

  /**
   * --------------------------------------------------------------------------
   * COMPATIBILITÉ TEMPORAIRE
   * --------------------------------------------------------------------------
   *
   * Cette propriété reste présente car les fichiers actuels l’utilisent.
   *
   * Elle représente désormais le NOMBRE DE COLONNES desktop,
   * et non une limite totale de produits.
   *
   * public-home-query.ts et PublicHomeFeaturedProductsSection.tsx seront
   * corrigés ensuite afin de ne plus utiliser cette valeur comme `take`
   * ou `slice`.
   */
  visibleProductLimit:
    5,

  addToCartLabel:
    "Ajouter au panier",

  presentation: {
    /**
     * ================================================================
     * DESKTOP
     * ================================================================
     *
     * 5 produits par ligne.
     *
     * Le nombre de lignes est libre selon le nombre réel de produits.
     */
    desktop: {
      mode:
        "grid",

      columns:
        5,

      rows:
        "auto",

      horizontalCarousel:
        false,

      showAllProducts:
        true,
    },

    /**
     * ================================================================
     * MOBILE
     * ================================================================
     *
     * Exactement 2 produits par ligne.
     *
     * Plus de carousel horizontal.
     * Plus de carte partiellement visible.
     */
    mobile: {
      mode:
        "grid",

      columns:
        2,

      rows:
        "auto",

      horizontalCarousel:
        false,

      showPartialNextCard:
        false,

      scrollSnap:
        false,

      showAllProducts:
        true,
    },

    /**
     * La carte correspond à l’architecture :
     *
     * IMAGE
     * Nom
     * Prix
     * Ajouter au panier
     */
    card: {
      compact:
        true,

      showProductImage:
        true,

      showProductName:
        true,

      showPrice:
        true,

      showAddToCart:
        true,

      showCompareAtPrice:
        true,

      showSku:
        false,

      showStoreName:
        false,

      showLocation:
        false,

      showAvailabilityBadge:
        false,

      showRatings:
        false,

      showReviews:
        false,

      showFavoriteButton:
        false,

      showDiscoverAction:
        false,
    },

    /**
     * Ces propriétés restent également au premier niveau pour préserver
     * temporairement la compatibilité avec les composants déjà créés.
     */
    showProductImage:
      true,

    showProductName:
      true,

    showPrice:
      true,

    showAddToCart:
      true,

    showSku:
      false,

    showStoreName:
      false,

    showLocation:
      false,

    showAvailabilityBadge:
      false,

    showRatings:
      false,

    showReviews:
      false,

    showFavoriteButton:
      false,
  },
} as const;


/* ==========================================================================
   11. INSTAGRAM
   ========================================================================== */

export const PUBLIC_HOME_INSTAGRAM_CONFIG = {
  sectionId:
    PUBLIC_HOME_SECTION_IDS.instagram,

  image: {
    src:
      PUBLIC_HOME_ASSETS.instagram,

    alt:
      "Univers Instagram L&E Cosmetics Empire",

    priority:
      false,
  },

  title:
    "Suivez-nous sur Instagram",

  socialId:
    "instagram",

  presentation: {
    desktop:
      "text-and-wide-gallery",

    mobile:
      "stacked-social-gallery",

    preserveArtwork:
      true,

    duplicateImage:
      false,

    allowImageMultiplication:
      false,
  },
} as const;


/* ==========================================================================
   12. CONFIGURATION GLOBALE
   ========================================================================== */

export const PUBLIC_HOME_CONFIG = {
  sectionIds:
    PUBLIC_HOME_SECTION_IDS,

  sectionOrder:
    PUBLIC_HOME_SECTION_ORDER,

  assets:
    PUBLIC_HOME_ASSETS,

  hero:
    PUBLIC_HOME_HERO_CONFIG,

  benefits:
    PUBLIC_HOME_BENEFITS_CONFIG,

  categories:
    PUBLIC_HOME_CATEGORIES_CONFIG,

  promotion:
    PUBLIC_HOME_PROMOTION_CONFIG,

  featuredProducts:
    PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG,

  instagram:
    PUBLIC_HOME_INSTAGRAM_CONFIG,
} as const;


/* ==========================================================================
   13. TYPES DÉRIVÉS
   ========================================================================== */

export type PublicHomeSectionId =
  (
    typeof PUBLIC_HOME_SECTION_IDS
  )[
    keyof typeof PUBLIC_HOME_SECTION_IDS
  ];


export type PublicHomeSectionOrder =
  typeof PUBLIC_HOME_SECTION_ORDER;


export type PublicHomeAssetKey =
  keyof typeof PUBLIC_HOME_ASSETS;


export type PublicHomeBenefit =
  (
    typeof PUBLIC_HOME_BENEFITS_CONFIG.items
  )[number];


export type PublicHomeCategorySlot =
  (
    typeof PUBLIC_HOME_CATEGORY_SLOTS
  )[number];


export type PublicHomeProductFilter =
  (
    typeof PUBLIC_HOME_PRODUCT_FILTERS
  )[number];


/* ==========================================================================
   14. GARANTIES DE LA VERSION ACTUELLE
   ========================================================================== */

/**
 * Cette configuration fixe désormais les corrections suivantes :
 *
 * HERO
 *
 * RÉVÈLE
 * TA BEAUTÉ
 * NATURELLE
 *
 * avec :
 *
 * TA       → noir
 * BEAUTÉ   → rose
 * NATURELLE → rose
 *
 * --------------------------------------------------------------------------
 *
 * PROMOTION
 *
 * Image officielle :
 *
 * /images/couverturea.png
 *
 * --------------------------------------------------------------------------
 *
 * PRODUITS
 *
 * Desktop :
 *
 * 5 produits par ligne.
 *
 * Mobile :
 *
 * 2 produits par ligne.
 *
 * Tous les produits publics valides doivent pouvoir être chargés.
 *
 * Aucun carousel horizontal produit.
 *
 * Aucun `take: 5` global dans la requête finale.
 *
 * Aucun `slice(0, 5)` dans le composant final.
 *
 * Les catégories Home ne doivent pas déterminer si une offre commerciale
 * peut être affichée.
 *
 * --------------------------------------------------------------------------
 *
 * CARTE PRODUIT
 *
 * IMAGE
 * Nom
 * Prix
 * Ajouter au panier
 *
 * Sans :
 *
 * - SKU ;
 * - grosse localisation ;
 * - boutique ;
 * - bouton Découvrir ;
 * - notation fictive.
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * FIN
 * ============================================================================
 */