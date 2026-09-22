/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CONFIGURATION — PAGE PUBLIQUE DES CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/public-categories.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser uniquement la configuration éditoriale et visuelle de :
 *
 * /categories
 *
 * Cette page doit afficher toutes les vraies catégories disponibles sur
 * le site à partir des données ProductCategory récupérées côté serveur.
 *
 * ============================================================================
 *
 * ARCHITECTURE DE LA PAGE
 *
 * Desktop :
 *
 * Header public existant
 * ↓
 * Breadcrumb
 * ↓
 * Hero catégories
 * ↓
 * Toutes nos catégories
 * ↓
 * Grille de vraies catégories
 * ↓
 * Bannière de fin
 * ↓
 * Footer public existant
 *
 * Mobile :
 *
 * Header mobile existant
 * ↓
 * Breadcrumb
 * ↓
 * Hero catégories
 * ↓
 * Toutes nos catégories
 * ↓
 * Grille 2 colonnes
 * ↓
 * Bannière de fin
 * ↓
 * PAS DE FOOTER
 * ↓
 * Bottom Navigation publique existante
 *
 * ============================================================================
 *
 * IMAGE PRINCIPALE
 *
 * Fichier physique :
 *
 * public/imagse/resulta.png
 *
 * URL publique Next.js :
 *
 * /imagse/resulta.png
 *
 * IMPORTANT :
 *
 * Le dossier s’appelle volontairement :
 *
 * imagse
 *
 * conformément au chemin réel fourni.
 *
 * ============================================================================
 *
 * DONNÉES DYNAMIQUES
 *
 * Les catégories NE SONT PAS définies dans ce fichier.
 *
 * Elles seront récupérées depuis :
 *
 * ProductCategory
 *
 * dans :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - importer Prisma ;
 * - lire PostgreSQL ;
 * - contenir des catégories fictives ;
 * - contenir des nombres de produits fictifs ;
 * - contenir des prix ;
 * - contenir des stocks ;
 * - contenir des StoreProduct ;
 * - contenir de JSX ;
 * - dépendre de React ;
 * - fabriquer des slugs ;
 * - fabriquer les routes des catégories ;
 * - contenir de logique responsive JavaScript.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. IDENTIFIANT DE PAGE
   ========================================================================== */

export const PUBLIC_CATEGORIES_PAGE_ID =
  "public-categories-page" as const;


/* ==========================================================================
   2. ROUTE PRINCIPALE
   ========================================================================== */

/**
 * Route publique explicitement fixée pour la page générale.
 *
 * Les routes dynamiques :
 *
 * /categories/[slug]
 *
 * resteront centralisées dans src/config/routes.ts lors de sa vérification.
 */
export const PUBLIC_CATEGORIES_ROUTE =
  "/categories" as const;


/* ==========================================================================
   3. IDENTIFIANTS DE SECTIONS
   ========================================================================== */

export const PUBLIC_CATEGORIES_SECTION_IDS = {
  hero:
    "categories-hero",

  catalog:
    "toutes-les-categories",

  promotion:
    "categories-promotion",
} as const;


/* ==========================================================================
   4. ORDRE OFFICIEL DES SECTIONS
   ========================================================================== */

export const PUBLIC_CATEGORIES_SECTION_ORDER = [
  PUBLIC_CATEGORIES_SECTION_IDS.hero,
  PUBLIC_CATEGORIES_SECTION_IDS.catalog,
  PUBLIC_CATEGORIES_SECTION_IDS.promotion,
] as const;


/* ==========================================================================
   5. ASSETS
   ========================================================================== */

export const PUBLIC_CATEGORIES_ASSETS = {
  hero:
    "/images/resulta.png",
} as const;


/* ==========================================================================
   6. BREADCRUMB
   ========================================================================== */

/**
 * Le breadcrumb ne fabrique aucune catégorie.
 *
 * La page générale affiche uniquement :
 *
 * Accueil > Catégories
 */
export const PUBLIC_CATEGORIES_BREADCRUMB_CONFIG = {
  ariaLabel:
    "Fil d’Ariane",

  home: {
    label:
      "Accueil",

    href:
      "/",
  },

  current: {
    label:
      "Catégories",
  },
} as const;


/* ==========================================================================
   7. HERO
   ========================================================================== */

export const PUBLIC_CATEGORIES_HERO_CONFIG = {
  sectionId:
    PUBLIC_CATEGORIES_SECTION_IDS.hero,

  /**
   * Image unique utilisée pour desktop et mobile.
   */
  image: {
    src:
      PUBLIC_CATEGORIES_ASSETS.hero,

    alt:
      "Univers des catégories L&E Cosmetics Empire",

    priority:
      true,

    /**
     * Le composant utilisera `fill`.
     *
     * Le cadrage exact sera géré uniquement en CSS.
     */
    fill:
      true,
  },

  eyebrow:
    "NOS CATÉGORIES",

  titleLines: [
    {
      id:
        "line-1",

      text:
        "Trouvez les produits",
    },

    {
      id:
        "line-2",

      text:
        "qui vous subliment",
    },
  ],

  description:
    "Des soins adaptés à chaque besoin, pour une beauté naturelle et éclatante au quotidien.",

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
        210,

      contentAlignment:
        "left",

      imagePosition:
        "center",
    },
  },
} as const;


/* ==========================================================================
   8. SECTION — TOUTES NOS CATÉGORIES
   ========================================================================== */

export const PUBLIC_CATEGORIES_CATALOG_CONFIG = {
  sectionId:
    PUBLIC_CATEGORIES_SECTION_IDS.catalog,

  title:
    "Toutes nos catégories",

  /**
   * Le nombre affiché à droite du titre proviendra réellement
   * du tableau retourné par la requête serveur.
   *
   * Exemple :
   *
   * 20 catégories
   *
   * n’est jamais écrit en dur ici.
   */
  showCategoryCount:
    true,

  countLabels: {
    singular:
      "catégorie",

    plural:
      "catégories",
  },

  /**
   * Une catégorie active reste affichable même lorsqu’aucune offre publique
   * n’est actuellement disponible.
   *
   * Cela permet d’afficher réellement toutes les catégories disponibles
   * dans le catalogue administratif sans inventer de contenu.
   */
  includeEmptyActiveCategories:
    true,

  /**
   * Une vraie image est nécessaire pour reproduire correctement
   * l’architecture visuelle des cartes.
   *
   * Aucun fallback fictif n’est prévu.
   */
  requireImage:
    true,

  /**
   * Aucun plafond artificiel.
   *
   * Toutes les catégories réellement retournées par le serveur
   * pourront être affichées.
   */
  maxCategories:
    null,

  productCountLabels: {
    zero:
      "0 produit",

    singular:
      "1 produit",

    pluralSuffix:
      "produits",
  },

  presentation: {
    desktop: {
      mode:
        "grid",

      columns:
        5,

      showAllCategories:
        true,

      horizontalScroll:
        false,
    },

    tablet: {
      mode:
        "grid",

      columns:
        3,

      showAllCategories:
        true,

      horizontalScroll:
        false,
    },

    mobile: {
      mode:
        "grid",

      columns:
        2,

      showAllCategories:
        true,

      horizontalScroll:
        false,
    },

    card: {
      showImage:
        true,

      showName:
        true,

      showProductCount:
        true,

      showArrow:
        true,
    },
  },
} as const;


/* ==========================================================================
   9. COMPORTEMENT DES CARTES
   ========================================================================== */

export const PUBLIC_CATEGORY_CARD_CONFIG = {
  /**
   * Une carte utilise toujours :
   *
   * - le vrai nom ProductCategory ;
   * - le vrai slug ProductCategory ;
   * - la vraie image ProductCategory ;
   * - le vrai nombre de produits publics calculé côté serveur.
   */
  useDatabaseName:
    true,

  useDatabaseSlug:
    true,

  useDatabaseImage:
    true,

  useRealProductCount:
    true,

  /**
   * Aucun fallback visuel inventé.
   */
  allowGeneratedImageFallback:
    false,

  /**
   * Le href final sera construit côté serveur avec le builder officiel
   * qui sera vérifié dans :
   *
   * src/config/routes.ts
   */
  routeSource:
    "public-route-builder",
} as const;


/* ==========================================================================
   10. RÈGLES DE DONNÉES — CATÉGORIES
   ========================================================================== */

/**
 * Ces valeurs décrivent uniquement ce que la future requête serveur
 * doit respecter.
 *
 * Elles ne réalisent aucune requête elles-mêmes.
 */
export const PUBLIC_CATEGORIES_DATA_CONFIG = {
  requireActiveCategory:
    true,

  requireCategoryImage:
    PUBLIC_CATEGORIES_CATALOG_CONFIG.requireImage,

  /**
   * La page doit afficher toutes les catégories actives éligibles.
   */
  loadAllCategories:
    true,

  maxCategories:
    PUBLIC_CATEGORIES_CATALOG_CONFIG.maxCategories,

  /**
   * Le compteur d’une catégorie doit reposer uniquement sur des produits
   * réellement commercialisables.
   */
  productCount: {
    requireActiveProduct:
      true,

    requireActiveStoreProduct:
      true,

    requireActiveStore:
      true,

    requirePositiveStock:
      true,

    requirePositivePrice:
      true,

    requireProductImage:
      true,
  },
} as const;


/* ==========================================================================
   11. BANNIÈRE BASSE
   ========================================================================== */

/**
 * Cette section reprend uniquement le contenu visible dans l’architecture
 * fournie.
 *
 * Aucun argument supplémentaire du type :
 *
 * - "qualité garantie" ;
 * - "satisfaction garantie" ;
 * - "100 % original" ;
 *
 * n’est ajouté ici.
 */
export const PUBLIC_CATEGORIES_PROMOTION_CONFIG = {
  sectionId:
    PUBLIC_CATEGORIES_SECTION_IDS.promotion,

  eyebrow:
    "Prenez soin de vous",

  title:
    "dans chaque catégorie",

  description:
    "Des produits pour révéler votre beauté naturelle.",

  action: {
    label:
      "Découvrir nos produits",

    /**
     * Le bouton doit utiliser la vraie route Produits du projet.
     *
     * Sa résolution définitive sera raccordée à la configuration de routes
     * existante lorsque src/config/routes.ts sera vérifié.
     */
    routeKey:
      "products",
  },

  presentation: {
    desktop: {
      visible:
        true,
    },

    mobile: {
      visible:
        true,
    },
  },
} as const;


/* ==========================================================================
   12. FOOTER
   ========================================================================== */

/**
 * Besoin fonctionnel explicite :
 *
 * Desktop :
 * footer visible.
 *
 * Mobile :
 * footer masqué uniquement sur la page catégories.
 *
 * La Bottom Navigation globale reste visible.
 */
export const PUBLIC_CATEGORIES_FOOTER_CONFIG = {
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
   13. BOTTOM NAVIGATION
   ========================================================================== */

/**
 * La page ne crée aucune nouvelle Bottom Navigation.
 *
 * Elle continue d’utiliser :
 *
 * src/components/public/PublicMobileBottomNav.tsx
 */
export const PUBLIC_CATEGORIES_BOTTOM_NAV_CONFIG = {
  useGlobalBottomNavigation:
    true,

  mobileVisible:
    true,
} as const;


/* ==========================================================================
   14. ÉTATS VIDES
   ========================================================================== */

/**
 * Aucun faux contenu n’est créé lorsqu’aucune catégorie n’existe.
 *
 * Le futur composant pourra afficher ce message réel et neutre.
 */
export const PUBLIC_CATEGORIES_EMPTY_STATE_CONFIG = {
  title:
    "Aucune catégorie disponible",

  description:
    "Aucune catégorie n’est actuellement disponible.",
} as const;


/* ==========================================================================
   15. LOADING
   ========================================================================== */

/**
 * Le loading.tsx pourra utiliser des blocs visuels neutres.
 *
 * Aucun faux nom de catégorie et aucun faux compteur ne doivent apparaître
 * pendant le chargement.
 */
export const PUBLIC_CATEGORIES_LOADING_CONFIG = {
  showSkeletons:
    true,

  desktopSkeletonCount:
    10,

  mobileSkeletonCount:
    6,

  exposeFakeCategoryData:
    false,
} as const;


/* ==========================================================================
   16. PAGE D’UNE CATÉGORIE
   ========================================================================== */

/**
 * Configuration générale utilisée plus tard par :
 *
 * /categories/[slug]
 *
 * Aucun slug n’est défini ici.
 */
export const PUBLIC_CATEGORY_PRODUCTS_PAGE_CONFIG = {
  /**
   * Le nom de la catégorie affiché devra toujours provenir
   * de ProductCategory.
   */
  useDatabaseCategoryName:
    true,

  useDatabaseCategoryDescription:
    true,

  useDatabaseCategoryImage:
    true,

  /**
   * Les offres doivent être chargées directement depuis la base.
   */
  loadAllEligibleOffers:
    true,

  /**
   * Aucun maximum arbitraire.
   */
  maxProducts:
    null,

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
   17. CONFIGURATION GLOBALE
   ========================================================================== */

export const PUBLIC_CATEGORIES_CONFIG = {
  pageId:
    PUBLIC_CATEGORIES_PAGE_ID,

  route:
    PUBLIC_CATEGORIES_ROUTE,

  sectionIds:
    PUBLIC_CATEGORIES_SECTION_IDS,

  sectionOrder:
    PUBLIC_CATEGORIES_SECTION_ORDER,

  assets:
    PUBLIC_CATEGORIES_ASSETS,

  breadcrumb:
    PUBLIC_CATEGORIES_BREADCRUMB_CONFIG,

  hero:
    PUBLIC_CATEGORIES_HERO_CONFIG,

  catalog:
    PUBLIC_CATEGORIES_CATALOG_CONFIG,

  categoryCard:
    PUBLIC_CATEGORY_CARD_CONFIG,

  data:
    PUBLIC_CATEGORIES_DATA_CONFIG,

  promotion:
    PUBLIC_CATEGORIES_PROMOTION_CONFIG,

  footer:
    PUBLIC_CATEGORIES_FOOTER_CONFIG,

  bottomNavigation:
    PUBLIC_CATEGORIES_BOTTOM_NAV_CONFIG,

  emptyState:
    PUBLIC_CATEGORIES_EMPTY_STATE_CONFIG,

  loading:
    PUBLIC_CATEGORIES_LOADING_CONFIG,

  categoryProductsPage:
    PUBLIC_CATEGORY_PRODUCTS_PAGE_CONFIG,
} as const;


/* ==========================================================================
   18. TYPES DÉRIVABLES DEPUIS LA CONFIGURATION
   ========================================================================== */

/**
 * Ces exports restent des valeurs runtime.
 *
 * Les contrats TypeScript complets seront centralisés dans :
 *
 * src/lib/public/categories/public-categories-types.ts
 *
 * On évite volontairement ici de dupliquer les interfaces.
 */


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES
 *
 * PAGE :
 *
 * /categories
 *
 * ============================================================================
 *
 * HERO :
 *
 * /imagse/resulta.png
 *
 * Une seule image.
 *
 * ============================================================================
 *
 * CATÉGORIES :
 *
 * - aucune catégorie en dur ;
 * - aucune catégorie fictive ;
 * - toutes les catégories viennent de ProductCategory ;
 * - nombre de produits calculé côté serveur ;
 * - aucune limite artificielle.
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
 * ROUTES :
 *
 * /categories
 *
 * puis :
 *
 * /categories/[slug]
 *
 * avec le vrai slug ProductCategory.
 *
 * La construction finale de la route dynamique sera centralisée dans
 * src/config/routes.ts.
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * - Footer masqué uniquement sur cette page ;
 * - Bottom Navigation globale conservée ;
 * - aucune deuxième barre mobile créée.
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - logique React ;
 * - session ;
 * - catégorie fictive ;
 * - quantité fictive ;
 * - prix fictif ;
 * - stock fictif ;
 * - route dynamique fabriquée dans ce fichier.
 *
 * ============================================================================
 */