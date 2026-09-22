import {
  PUBLIC_CATEGORIES_ASSETS,
  PUBLIC_CATEGORIES_BOTTOM_NAV_CONFIG,
  PUBLIC_CATEGORIES_BREADCRUMB_CONFIG,
  PUBLIC_CATEGORIES_CATALOG_CONFIG,
  PUBLIC_CATEGORIES_CONFIG,
  PUBLIC_CATEGORIES_DATA_CONFIG,
  PUBLIC_CATEGORIES_EMPTY_STATE_CONFIG,
  PUBLIC_CATEGORIES_FOOTER_CONFIG,
  PUBLIC_CATEGORIES_HERO_CONFIG,
  PUBLIC_CATEGORIES_LOADING_CONFIG,
  PUBLIC_CATEGORIES_PAGE_ID,
  PUBLIC_CATEGORIES_PROMOTION_CONFIG,
  PUBLIC_CATEGORIES_ROUTE,
  PUBLIC_CATEGORIES_SECTION_IDS,
  PUBLIC_CATEGORIES_SECTION_ORDER,
  PUBLIC_CATEGORY_CARD_CONFIG,
  PUBLIC_CATEGORY_PRODUCTS_PAGE_CONFIG,
} from "@/config/public-categories";

import type {
  PublicProductCardData,
} from "@/lib/public/products/public-product-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TYPES — CATÉGORIES PUBLIQUES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/categories/public-categories-types.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript utilisés par :
 *
 * /categories
 *
 * et :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * SOURCES DE VÉRITÉ
 *
 * Configuration visuelle :
 *
 * src/config/public-categories.ts
 *
 * Données réelles :
 *
 * ProductCategory
 *      ↓
 * Product
 *      ↓
 * StoreProduct
 *      ↓
 * Store
 *
 * Contrat produit public partagé :
 *
 * src/lib/public/products/public-product-types.ts
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - importer Prisma ;
 * - lire PostgreSQL ;
 * - lire une session ;
 * - contenir de JSX ;
 * - dépendre de React ;
 * - inventer une catégorie ;
 * - inventer un nombre de produits ;
 * - inventer une image ;
 * - inventer une route ;
 * - inventer un prix ;
 * - inventer un stock ;
 * - inventer une boutique.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. UTILITAIRES GÉNÉRIQUES
   ========================================================================== */

/**
 * Rend récursivement une structure en lecture seule.
 */
export type PublicCategoriesDeepReadonly<T> =
  T extends
    (...args: never[]) =>
      unknown
    ? T
    : T extends readonly (
        infer U
      )[]
      ? readonly PublicCategoriesDeepReadonly<U>[]
      : T extends object
        ? {
            readonly [K in keyof T]:
              PublicCategoriesDeepReadonly<
                T[K]
              >;
          }
        : T;


/**
 * Texte obligatoire déjà normalisé par la couche serveur.
 */
export type PublicCategoriesRequiredText =
  string;


/**
 * Texte éventuellement absent.
 */
export type PublicCategoriesOptionalText =
  string |
  null;


/**
 * Compteur public.
 *
 * La couche serveur devra garantir :
 *
 * value >= 0
 */
export type PublicCategoriesCount =
  number;


/* ==========================================================================
   2. PAGE
   ========================================================================== */

export type PublicCategoriesPageId =
  typeof PUBLIC_CATEGORIES_PAGE_ID;


export type PublicCategoriesRoute =
  typeof PUBLIC_CATEGORIES_ROUTE;


/* ==========================================================================
   3. SECTIONS
   ========================================================================== */

export type PublicCategoriesSectionIds =
  typeof PUBLIC_CATEGORIES_SECTION_IDS;


export type PublicCategoriesSectionId =
  PublicCategoriesSectionIds[
    keyof PublicCategoriesSectionIds
  ];


export type PublicCategoriesSectionOrder =
  typeof PUBLIC_CATEGORIES_SECTION_ORDER;


export type PublicCategoriesSectionOrderItem =
  PublicCategoriesSectionOrder[number];


/* ==========================================================================
   4. ASSETS
   ========================================================================== */

export type PublicCategoriesAssets =
  typeof PUBLIC_CATEGORIES_ASSETS;


export type PublicCategoriesAssetKey =
  keyof PublicCategoriesAssets;


export type PublicCategoriesAssetPath =
  PublicCategoriesAssets[
    PublicCategoriesAssetKey
  ];


/* ==========================================================================
   5. BREADCRUMB
   ========================================================================== */

export type PublicCategoriesBreadcrumbConfig =
  typeof PUBLIC_CATEGORIES_BREADCRUMB_CONFIG;


export type PublicCategoriesBreadcrumbHome =
  PublicCategoriesBreadcrumbConfig[
    "home"
  ];


export type PublicCategoriesBreadcrumbCurrent =
  PublicCategoriesBreadcrumbConfig[
    "current"
  ];


/* ==========================================================================
   6. HERO
   ========================================================================== */

export type PublicCategoriesHeroConfig =
  typeof PUBLIC_CATEGORIES_HERO_CONFIG;


export type PublicCategoriesHeroImage =
  PublicCategoriesHeroConfig[
    "image"
  ];


export type PublicCategoriesHeroTitleLine =
  PublicCategoriesHeroConfig[
    "titleLines"
  ][number];


export type PublicCategoriesHeroTitleLineId =
  PublicCategoriesHeroTitleLine[
    "id"
  ];


export type PublicCategoriesHeroPresentation =
  PublicCategoriesHeroConfig[
    "presentation"
  ];


export type PublicCategoriesHeroDesktopPresentation =
  PublicCategoriesHeroPresentation[
    "desktop"
  ];


export type PublicCategoriesHeroMobilePresentation =
  PublicCategoriesHeroPresentation[
    "mobile"
  ];


/* ==========================================================================
   7. CATALOGUE DES CATÉGORIES — CONFIGURATION
   ========================================================================== */

export type PublicCategoriesCatalogConfig =
  typeof PUBLIC_CATEGORIES_CATALOG_CONFIG;


export type PublicCategoriesCatalogPresentation =
  PublicCategoriesCatalogConfig[
    "presentation"
  ];


export type PublicCategoriesDesktopPresentation =
  PublicCategoriesCatalogPresentation[
    "desktop"
  ];


export type PublicCategoriesTabletPresentation =
  PublicCategoriesCatalogPresentation[
    "tablet"
  ];


export type PublicCategoriesMobilePresentation =
  PublicCategoriesCatalogPresentation[
    "mobile"
  ];


export type PublicCategoriesCardPresentation =
  PublicCategoriesCatalogPresentation[
    "card"
  ];


/* ==========================================================================
   8. CONFIGURATION CARTE CATÉGORIE
   ========================================================================== */

export type PublicCategoryCardConfig =
  typeof PUBLIC_CATEGORY_CARD_CONFIG;


/* ==========================================================================
   9. CONFIGURATION DONNÉES
   ========================================================================== */

export type PublicCategoriesDataConfig =
  typeof PUBLIC_CATEGORIES_DATA_CONFIG;


export type PublicCategoriesProductCountDataConfig =
  PublicCategoriesDataConfig[
    "productCount"
  ];


/* ==========================================================================
   10. CONFIGURATION PROMOTION
   ========================================================================== */

export type PublicCategoriesPromotionConfig =
  typeof PUBLIC_CATEGORIES_PROMOTION_CONFIG;


export type PublicCategoriesPromotionAction =
  PublicCategoriesPromotionConfig[
    "action"
  ];


export type PublicCategoriesPromotionPresentation =
  PublicCategoriesPromotionConfig[
    "presentation"
  ];


/* ==========================================================================
   11. FOOTER
   ========================================================================== */

export type PublicCategoriesFooterConfig =
  typeof PUBLIC_CATEGORIES_FOOTER_CONFIG;


export type PublicCategoriesFooterDesktopConfig =
  PublicCategoriesFooterConfig[
    "desktop"
  ];


export type PublicCategoriesFooterMobileConfig =
  PublicCategoriesFooterConfig[
    "mobile"
  ];


/* ==========================================================================
   12. BOTTOM NAVIGATION
   ========================================================================== */

export type PublicCategoriesBottomNavigationConfig =
  typeof PUBLIC_CATEGORIES_BOTTOM_NAV_CONFIG;


/* ==========================================================================
   13. ÉTAT VIDE
   ========================================================================== */

export type PublicCategoriesEmptyStateConfig =
  typeof PUBLIC_CATEGORIES_EMPTY_STATE_CONFIG;


/* ==========================================================================
   14. LOADING
   ========================================================================== */

export type PublicCategoriesLoadingConfig =
  typeof PUBLIC_CATEGORIES_LOADING_CONFIG;


/* ==========================================================================
   15. CONFIGURATION PAGE PRODUITS D’UNE CATÉGORIE
   ========================================================================== */

export type PublicCategoryProductsPageConfig =
  typeof PUBLIC_CATEGORY_PRODUCTS_PAGE_CONFIG;


export type PublicCategoryProductsPresentation =
  PublicCategoryProductsPageConfig[
    "presentation"
  ];


export type PublicCategoryProductsDesktopPresentation =
  PublicCategoryProductsPresentation[
    "desktop"
  ];


export type PublicCategoryProductsTabletPresentation =
  PublicCategoryProductsPresentation[
    "tablet"
  ];


export type PublicCategoryProductsMobilePresentation =
  PublicCategoryProductsPresentation[
    "mobile"
  ];


/* ==========================================================================
   16. CONFIGURATION GLOBALE
   ========================================================================== */

export type PublicCategoriesConfig =
  typeof PUBLIC_CATEGORIES_CONFIG;


/* ==========================================================================
   17. IMAGE RÉELLE D’UNE CATÉGORIE
   ========================================================================== */

/**
 * Image publique réellement issue de ProductCategory.
 *
 * Aucun placeholder fictif n’est créé.
 */
export type PublicCategoryImage =
  Readonly<{
    url:
      PublicCategoriesRequiredText;

    altText:
      PublicCategoriesRequiredText;
  }>;


/* ==========================================================================
   18. IDENTIFIANTS CATÉGORIE
   ========================================================================== */

export type PublicCategoryId =
  PublicCategoriesRequiredText;


export type PublicCategorySlug =
  PublicCategoriesRequiredText;


/* ==========================================================================
   19. CARTE CATÉGORIE PUBLIQUE
   ========================================================================== */

/**
 * Données strictement nécessaires à une carte de :
 *
 * /categories
 *
 * ============================================================================
 *
 * ProductCategory fournit :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - description ;
 * - image.
 *
 * La couche serveur ajoute :
 *
 * - availableProductCount ;
 * - href.
 *
 * ============================================================================
 *
 * `availableProductCount` n’est jamais inventé.
 *
 * Il devra être calculé en fonction des vraies offres publiques valides :
 *
 * Product ACTIVE
 *      ↓
 * StoreProduct ACTIVE
 *      ↓
 * Store ACTIVE
 *
 * avec les autres conditions définies dans :
 *
 * PUBLIC_CATEGORIES_DATA_CONFIG.productCount
 */
export type PublicCategoryCardData =
  Readonly<{
    id:
      PublicCategoryId;

    name:
      PublicCategoriesRequiredText;

    slug:
      PublicCategorySlug;

    description:
      PublicCategoriesOptionalText;

    image:
      PublicCategoryImage;

    availableProductCount:
      PublicCategoriesCount;

    /**
     * Route déjà résolue côté serveur.
     *
     * Exemple attendu :
     *
     * /categories/soins-du-visage
     *
     * mais le composant ne doit jamais la fabriquer lui-même.
     */
    href:
      PublicCategoriesRequiredText;
  }>;


/* ==========================================================================
   20. COLLECTION DES CATÉGORIES
   ========================================================================== */

/**
 * Toutes les catégories éligibles réellement retournées par la base.
 *
 * Aucun nombre maximal n’est imposé par ce type.
 */
export type PublicCategoryCollection =
  readonly PublicCategoryCardData[];


/* ==========================================================================
   21. ALIAS EXPLICITES
   ========================================================================== */

export type PublicCategory =
  PublicCategoryCardData;


export type PublicCategoriesCollection =
  PublicCategoryCollection;


/* ==========================================================================
   22. DONNÉES DE LA PAGE /categories
   ========================================================================== */

/**
 * Résultat final attendu de :
 *
 * getPublicCategoriesPageData()
 *
 * dans :
 *
 * src/lib/public/categories/public-categories-query.ts
 */
export type PublicCategoriesPageData =
  Readonly<{
    categories:
      PublicCategoryCollection;

    /**
     * Nombre réellement retourné par la requête.
     *
     * Il ne doit pas être écrit en dur.
     */
    categoryCount:
      PublicCategoriesCount;
  }>;


/* ==========================================================================
   23. RÉSULTAT DE REQUÊTE /categories
   ========================================================================== */

export type PublicCategoriesQueryResult =
  PublicCategoriesPageData;


/* ==========================================================================
   24. PROPS — HERO
   ========================================================================== */

/**
 * Le Hero principal n’a normalement besoin d’aucune donnée dynamique.
 *
 * Cette interface reste disponible pour permettre une évolution propre
 * sans mettre de logique métier dans le composant.
 */
export interface PublicCategoriesHeroProps {
  readonly className?:
    string;
}


/* ==========================================================================
   25. PROPS — CARTE CATÉGORIE
   ========================================================================== */

export interface PublicCategoryCardProps {
  readonly category:
    PublicCategoryCardData;

  readonly imagePriority?:
    boolean;
}


/* ==========================================================================
   26. PROPS — GRILLE CATÉGORIES
   ========================================================================== */

export interface PublicCategoriesGridProps {
  readonly categories:
    PublicCategoryCollection;
}


/* ==========================================================================
   27. PROPS — PROMOTION
   ========================================================================== */

export interface PublicCategoriesPromoProps {
  /**
   * Route Produits déjà résolue.
   *
   * Le composant ne doit pas inventer son href.
   */
  readonly productsHref:
    PublicCategoriesRequiredText;
}


/* ==========================================================================
   28. FORMAT DU COMPTEUR CATÉGORIES
   ========================================================================== */

/**
 * Contrat utilisable pour un helper de présentation.
 *
 * Exemples :
 *
 * 1 catégorie
 * 20 catégories
 */
export type PublicCategoriesCountPresentation =
  Readonly<{
    value:
      PublicCategoriesCount;

    label:
      PublicCategoriesRequiredText;
  }>;


/* ==========================================================================
   29. FORMAT DU COMPTEUR PRODUITS
   ========================================================================== */

/**
 * Contrat utilisable pour afficher :
 *
 * 0 produit
 * 1 produit
 * 12 produits
 *
 * Le nombre reste toujours une vraie donnée.
 */
export type PublicCategoryProductCountPresentation =
  Readonly<{
    value:
      PublicCategoriesCount;

    label:
      PublicCategoriesRequiredText;
  }>;


/* ==========================================================================
   30. DONNÉES D’UNE CATÉGORIE — PAGE DÉTAIL
   ========================================================================== */

/**
 * Données de ProductCategory nécessaires à :
 *
 * /categories/[slug]
 *
 * L’image peut être null sur la page détail.
 *
 * Pourquoi ?
 *
 * La page générale /categories exige actuellement une image.
 *
 * Mais une URL réelle existante ne doit pas nécessairement devenir
 * invalide uniquement parce que son image a été retirée de la base.
 *
 * Aucun fallback fictif ne sera créé.
 */
export type PublicCategoryDetail =
  Readonly<{
    id:
      PublicCategoryId;

    name:
      PublicCategoriesRequiredText;

    slug:
      PublicCategorySlug;

    description:
      PublicCategoriesOptionalText;

    image:
      PublicCategoryImage |
      null;
  }>;


/* ==========================================================================
   31. OFFRE PUBLIQUE D’UNE CATÉGORIE
   ========================================================================== */

/**
 * On réutilise directement le contrat produit public existant.
 *
 * Une entrée représente toujours :
 *
 * UNE offre StoreProduct.
 */
export type PublicCategoryProduct =
  PublicProductCardData;


/**
 * Plusieurs StoreProduct du même Product restent plusieurs offres.
 */
export type PublicCategoryProductCollection =
  readonly PublicCategoryProduct[];


/* ==========================================================================
   32. PAGE PRODUITS D’UNE CATÉGORIE
   ========================================================================== */

/**
 * Résultat final attendu de :
 *
 * getPublicCategoryProductsData(slug)
 *
 * dans :
 *
 * src/lib/public/categories/public-category-products-query.ts
 */
export type PublicCategoryProductsPageData =
  Readonly<{
    category:
      PublicCategoryDetail;

    products:
      PublicCategoryProductCollection;

    /**
     * Nombre d’offres réellement retenues après validation.
     */
    productCount:
      PublicCategoriesCount;
  }>;


/* ==========================================================================
   33. RÉSULTAT DE LA REQUÊTE DÉTAIL
   ========================================================================== */

export type PublicCategoryProductsQueryResult =
  PublicCategoryProductsPageData;


/* ==========================================================================
   34. CAS CATÉGORIE INTROUVABLE
   ========================================================================== */

/**
 * La couche serveur pourra retourner null lorsqu’un slug :
 *
 * - n’existe pas ;
 * - correspond à une catégorie inactive ;
 * - est invalide.
 *
 * page.tsx pourra alors utiliser notFound().
 */
export type PublicCategoryProductsQueryNullableResult =
  PublicCategoryProductsQueryResult |
  null;


/* ==========================================================================
   35. PARAMÈTRES DE ROUTE DYNAMIQUE
   ========================================================================== */

/**
 * Contrat de la route :
 *
 * /categories/[slug]
 *
 * Compatible avec l’App Router.
 */
export type PublicCategoryRouteParams =
  Readonly<{
    slug:
      PublicCategorySlug;
  }>;


/* ==========================================================================
   36. PROPS — PAGE PRODUITS CATÉGORIE
   ========================================================================== */

export interface PublicCategoryProductsPageProps {
  readonly data:
    PublicCategoryProductsPageData;
}


/* ==========================================================================
   37. PROPS — GRILLE PRODUITS CATÉGORIE
   ========================================================================== */

export interface PublicCategoryProductsGridProps {
  readonly products:
    PublicCategoryProductCollection;
}


/* ==========================================================================
   38. IDENTIFIANTS PRODUITS
   ========================================================================== */

export type PublicCategoryProductId =
  PublicCategoryProduct[
    "productId"
  ];


export type PublicCategoryStoreProductId =
  PublicCategoryProduct[
    "storeProductId"
  ];


/* ==========================================================================
   39. DONNÉES DYNAMIQUES VS CONFIGURATION
   ========================================================================== */

/**
 * Contrat complet de la page /categories.
 *
 * Il n’est pas nécessaire de construire cet objet à l’exécution.
 */
export type PublicCategoriesPageContract =
  Readonly<{
    config:
      PublicCategoriesConfig;

    data:
      PublicCategoriesPageData;
  }>;


/**
 * Contrat complet de /categories/[slug].
 */
export type PublicCategoryProductsPageContract =
  Readonly<{
    config:
      PublicCategoryProductsPageConfig;

    data:
      PublicCategoryProductsPageData;
  }>;


/* ==========================================================================
   40. GARANTIES — PAGE CATÉGORIES
   ========================================================================== */

/**
 * Type documentaire.
 *
 * Il ne contient aucune logique runtime.
 */
export type PublicCategoriesDataGuarantees =
  Readonly<{
    /**
     * Toutes les catégories proviennent de ProductCategory.
     */
    categoriesAreReal:
      true;

    /**
     * Les catégories de la grille sont actives.
     */
    categoriesAreActive:
      true;

    /**
     * Toutes les cartes de la grille possèdent une vraie image.
     */
    categoryImagesAreReal:
      true;

    /**
     * Les nombres de produits ne sont pas écrits en dur.
     */
    productCountsAreReal:
      true;

    /**
     * Les routes sont résolues avant d’atteindre les cartes.
     */
    categoryRoutesAreResolved:
      true;

    /**
     * Aucune catégorie fictive.
     */
    noDemoCategories:
      true;

    /**
     * Aucun compteur fictif.
     */
    noDemoCounts:
      true;
  }>;


/* ==========================================================================
   41. GARANTIES — PRODUITS D’UNE CATÉGORIE
   ========================================================================== */

export type PublicCategoryProductsDataGuarantees =
  Readonly<{
    categoryIsReal:
      true;

    categoryIsActive:
      true;

    productsRepresentStoreProducts:
      true;

    productsBelongToCategory:
      true;

    productsAreActive:
      true;

    storeProductsAreActive:
      true;

    storesAreActive:
      true;

    pricesAreReal:
      true;

    stocksAreReal:
      true;

    productImagesAreReal:
      true;

    productRoutesAreResolved:
      true;

    noDemoProducts:
      true;
  }>;


/* ==========================================================================
   42. HELPERS DE TYPE — PRÉSENTATION
   ========================================================================== */

export type PublicCategoriesDesktopColumns =
  PublicCategoriesDesktopPresentation[
    "columns"
  ];


export type PublicCategoriesTabletColumns =
  PublicCategoriesTabletPresentation[
    "columns"
  ];


export type PublicCategoriesMobileColumns =
  PublicCategoriesMobilePresentation[
    "columns"
  ];


export type PublicCategoryProductsDesktopColumns =
  PublicCategoryProductsDesktopPresentation[
    "columns"
  ];


export type PublicCategoryProductsTabletColumns =
  PublicCategoryProductsTabletPresentation[
    "columns"
  ];


export type PublicCategoryProductsMobileColumns =
  PublicCategoryProductsMobilePresentation[
    "columns"
  ];


/* ==========================================================================
   43. HELPERS DE TYPE — DONNÉES
   ========================================================================== */

export type PublicCategoriesRequireActiveCategory =
  PublicCategoriesDataConfig[
    "requireActiveCategory"
  ];


export type PublicCategoriesRequireImage =
  PublicCategoriesDataConfig[
    "requireCategoryImage"
  ];


export type PublicCategoriesLoadAll =
  PublicCategoriesDataConfig[
    "loadAllCategories"
  ];


export type PublicCategoriesMaximum =
  PublicCategoriesDataConfig[
    "maxCategories"
  ];


/* ==========================================================================
   44. HELPERS DE TYPE — FOOTER
   ========================================================================== */

export type PublicCategoriesDesktopFooterVisible =
  PublicCategoriesFooterDesktopConfig[
    "visible"
  ];


export type PublicCategoriesMobileFooterVisible =
  PublicCategoriesFooterMobileConfig[
    "visible"
  ];


export type PublicCategoriesMobileFooterBreakpoint =
  PublicCategoriesFooterConfig[
    "mobileBreakpoint"
  ];


/* ==========================================================================
   45. HELPERS DE TYPE — IMAGE HERO
   ========================================================================== */

export type PublicCategoriesHeroImageSource =
  PublicCategoriesHeroImage[
    "src"
  ];


/* ==========================================================================
   46. HELPERS DE TYPE — COLLECTION
   ========================================================================== */

/**
 * Predicate utilisable après une transformation serveur.
 */
export type PublicCategoryCardPredicate =
  (
    category:
      PublicCategoryCardData,
  ) => boolean;


/**
 * Predicate utilisable pour les offres produits d’une catégorie.
 */
export type PublicCategoryProductPredicate =
  (
    product:
      PublicCategoryProduct,
  ) => boolean;


/* ==========================================================================
   47. ÉTAT VIDE — PAGE CATÉGORIES
   ========================================================================== */

export type PublicCategoriesEmptyState =
  Readonly<{
    isEmpty:
      boolean;

    categoryCount:
      PublicCategoriesCount;
  }>;


/* ==========================================================================
   48. ÉTAT VIDE — PRODUITS D’UNE CATÉGORIE
   ========================================================================== */

export type PublicCategoryProductsEmptyState =
  Readonly<{
    isEmpty:
      boolean;

    productCount:
      PublicCategoriesCount;
  }>;


/* ==========================================================================
   49. RÉEXPORT PRODUIT PUBLIC
   ========================================================================== */

/**
 * Permet aux fichiers de la feature catégories d’importer le contrat produit
 * depuis un point central sans le redéfinir.
 */
export type {
  PublicProductCardData,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * PAGE :
 *
 * /categories
 *
 * ============================================================================
 *
 * UNE CARTE CATÉGORIE CONTIENT :
 *
 * - vrai id ;
 * - vrai nom ;
 * - vrai slug ;
 * - vraie description éventuelle ;
 * - vraie image ;
 * - vrai nombre de produits disponibles ;
 * - vraie route déjà résolue.
 *
 * ============================================================================
 *
 * ROUTE DYNAMIQUE :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * LA PAGE D’UNE CATÉGORIE CONTIENT :
 *
 * - vraie ProductCategory ;
 * - vraies offres StoreProduct ;
 * - vrais prix ;
 * - vrais stocks ;
 * - vraies images ;
 * - vraies routes produits.
 *
 * ============================================================================
 *
 * ARCHITECTURE PRODUITS :
 *
 * ProductCategory
 *       ↓
 * Product
 *       ↓
 * StoreProduct
 *       ↓
 * Store
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Deux StoreProduct différents associés au même Product restent deux offres
 * distinctes.
 *
 * ============================================================================
 *
 * GRILLE CATÉGORIES :
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
 * FOOTER :
 *
 * Desktop :
 *
 * visible.
 *
 * Mobile :
 *
 * masqué sur /categories.
 *
 * Bottom Navigation globale :
 *
 * conservée.
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - logique PostgreSQL ;
 * - logique React ;
 * - fausse catégorie ;
 * - faux compteur ;
 * - faux produit ;
 * - fausse route ;
 * - donnée commerciale de démonstration.
 *
 * ============================================================================
 */