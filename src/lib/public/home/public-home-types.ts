import {
  PUBLIC_HOME_ASSETS,
  PUBLIC_HOME_BENEFITS_CONFIG,
  PUBLIC_HOME_CATEGORIES_CONFIG,
  PUBLIC_HOME_CATEGORY_SLOTS,
  PUBLIC_HOME_CONFIG,
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG,
  PUBLIC_HOME_HERO_CONFIG,
  PUBLIC_HOME_INSTAGRAM_CONFIG,
  PUBLIC_HOME_PRODUCT_FILTERS,
  PUBLIC_HOME_PROMOTION_CONFIG,
  PUBLIC_HOME_SECTION_IDS,
  PUBLIC_HOME_SECTION_ORDER,
} from "@/config/public-home";

import type {
  PublicProductCardData,
} from "@/lib/public/products/public-product-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TYPES — PAGE D’ACCUEIL PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/home/public-home-types.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript de la Home publique officielle.
 *
 * ============================================================================
 *
 * ARCHITECTURE OFFICIELLE
 *
 * Hero
 *   ↓
 * Avantages
 *   ↓
 * Catégories
 *   ↓
 * Bannière résultats
 *   ↓
 * Produits phares
 *   ↓
 * Instagram
 *
 * ============================================================================
 *
 * ARCHITECTURE COMMERCIALE
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * Une carte publique représente UNE offre StoreProduct.
 *
 * Deux StoreProduct différents liés au même Product restent donc
 * deux offres commerciales différentes.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - importer le client Prisma ;
 * - lire PostgreSQL ;
 * - lire une session ;
 * - contenir de JSX ;
 * - dépendre de React ;
 * - inventer des produits ;
 * - inventer des catégories ;
 * - inventer des prix ;
 * - inventer des stocks ;
 * - inventer des routes ;
 * - redéfinir manuellement la configuration de public-home.ts.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. UTILITAIRES GÉNÉRIQUES
   ========================================================================== */

export type PublicHomeDeepReadonly<T> =
  T extends
    (...args: never[]) =>
      unknown
    ? T
    : T extends readonly (
        infer U
      )[]
      ? readonly PublicHomeDeepReadonly<U>[]
      : T extends object
        ? {
            readonly [K in keyof T]:
              PublicHomeDeepReadonly<
                T[K]
              >;
          }
        : T;


export type PublicHomeRequiredText =
  string;


export type PublicHomeOptionalText =
  string |
  null;


/* ==========================================================================
   2. SECTIONS
   ========================================================================== */

export type PublicHomeSectionId =
  (
    typeof PUBLIC_HOME_SECTION_IDS
  )[
    keyof typeof PUBLIC_HOME_SECTION_IDS
  ];


export type PublicHomeSectionIds =
  typeof PUBLIC_HOME_SECTION_IDS;


export type PublicHomeSectionOrder =
  typeof PUBLIC_HOME_SECTION_ORDER;


export type PublicHomeSectionOrderItem =
  PublicHomeSectionOrder[number];


/* ==========================================================================
   3. ASSETS
   ========================================================================== */

export type PublicHomeAssets =
  typeof PUBLIC_HOME_ASSETS;


export type PublicHomeAssetKey =
  keyof PublicHomeAssets;


export type PublicHomeAssetPath =
  PublicHomeAssets[
    PublicHomeAssetKey
  ];


/* ==========================================================================
   4. HERO
   ========================================================================== */

export type PublicHomeHeroConfig =
  typeof PUBLIC_HOME_HERO_CONFIG;


export type PublicHomeHeroMode =
  PublicHomeHeroConfig[
    "mode"
  ];


export type PublicHomeHeroImage =
  PublicHomeHeroConfig[
    "image"
  ];


export type PublicHomeHeroAction =
  PublicHomeHeroConfig[
    "action"
  ];


export type PublicHomeHeroPresentation =
  PublicHomeHeroConfig[
    "presentation"
  ];


export type PublicHomeHeroTitlePresentation =
  PublicHomeHeroPresentation[
    "title"
  ];


export type PublicHomeHeroMobileIndicators =
  PublicHomeHeroPresentation[
    "mobileIndicators"
  ];


/* ==========================================================================
   5. HERO — LIGNES DU TITRE
   ========================================================================== */

export type PublicHomeHeroTitleLine =
  PublicHomeHeroConfig[
    "titleLines"
  ][number];


export type PublicHomeHeroTitleLineId =
  PublicHomeHeroTitleLine[
    "id"
  ];


export type PublicHomeHeroTitleTone =
  PublicHomeHeroTitleLine[
    "tone"
  ];


/* ==========================================================================
   6. HERO — SEGMENTS DU TITRE
   ========================================================================== */

/**
 * Nouveau contrat nécessaire pour reproduire exactement :
 *
 * RÉVÈLE
 * TA BEAUTÉ
 * NATURELLE
 *
 * avec :
 *
 * RÉVÈLE     → noir
 * TA         → noir
 * BEAUTÉ     → rose
 * NATURELLE  → rose
 */
export type PublicHomeHeroTitleSegment =
  PublicHomeHeroTitleLine[
    "segments"
  ][number];


export type PublicHomeHeroTitleSegmentId =
  PublicHomeHeroTitleSegment[
    "id"
  ];


export type PublicHomeHeroTitleSegmentTone =
  PublicHomeHeroTitleSegment[
    "tone"
  ];


/* ==========================================================================
   7. AVANTAGES
   ========================================================================== */

export type PublicHomeBenefitsConfig =
  typeof PUBLIC_HOME_BENEFITS_CONFIG;


export type PublicHomeBenefit =
  PublicHomeBenefitsConfig[
    "items"
  ][number];


export type PublicHomeBenefitId =
  PublicHomeBenefit[
    "id"
  ];


export type PublicHomeBenefitIconName =
  PublicHomeBenefit[
    "icon"
  ];


export type PublicHomeBenefitsPresentation =
  PublicHomeBenefitsConfig[
    "presentation"
  ];


/* ==========================================================================
   8. CATÉGORIES — CONFIGURATION
   ========================================================================== */

export type PublicHomeCategoriesConfig =
  typeof PUBLIC_HOME_CATEGORIES_CONFIG;


export type PublicHomeCategorySlot =
  (
    typeof PUBLIC_HOME_CATEGORY_SLOTS
  )[number];


export type PublicHomeCategorySlotId =
  PublicHomeCategorySlot[
    "id"
  ];


export type PublicHomeCategoryDesktopLabel =
  PublicHomeCategorySlot[
    "desktopLabel"
  ];


export type PublicHomeCategoryMobileLabel =
  PublicHomeCategorySlot[
    "mobileLabel"
  ];


export type PublicHomeCategoriesPresentation =
  PublicHomeCategoriesConfig[
    "presentation"
  ];


/* ==========================================================================
   9. CATÉGORIE PUBLIQUE — IMAGE
   ========================================================================== */

export type PublicHomeCategoryImage =
  Readonly<{
    url:
      PublicHomeRequiredText;

    altText:
      PublicHomeRequiredText;
  }>;


/* ==========================================================================
   10. CATÉGORIE PUBLIQUE RÉELLE
   ========================================================================== */

/**
 * Catégorie réellement récupérée depuis ProductCategory.
 *
 * `slotId` correspond uniquement à sa position visuelle dans la Home.
 */
export type PublicHomeCategory =
  Readonly<{
    slotId:
      PublicHomeCategorySlotId;

    id:
      PublicHomeRequiredText;

    name:
      PublicHomeRequiredText;

    slug:
      PublicHomeRequiredText;

    description:
      PublicHomeOptionalText;

    desktopLabel:
      PublicHomeRequiredText;

    mobileLabel:
      PublicHomeRequiredText;

    image:
      PublicHomeCategoryImage;
  }>;


export type PublicHomeCategoryCollection =
  readonly PublicHomeCategory[];


/* ==========================================================================
   11. BANNIÈRE RÉSULTATS
   ========================================================================== */

export type PublicHomePromotionConfig =
  typeof PUBLIC_HOME_PROMOTION_CONFIG;


export type PublicHomePromotionMode =
  PublicHomePromotionConfig[
    "mode"
  ];


export type PublicHomePromotionTitleLine =
  PublicHomePromotionConfig[
    "titleLines"
  ][number];


export type PublicHomePromotionHighlight =
  PublicHomePromotionConfig[
    "highlights"
  ][number];


export type PublicHomePromotionHighlightId =
  PublicHomePromotionHighlight[
    "id"
  ];


export type PublicHomePromotionHighlightIconName =
  PublicHomePromotionHighlight[
    "icon"
  ];


export type PublicHomePromotionPresentation =
  PublicHomePromotionConfig[
    "presentation"
  ];


/* ==========================================================================
   12. FILTRES PRODUITS — COMPATIBILITÉ
   ========================================================================== */

/**
 * Les filtres restent typés pendant la migration.
 *
 * La nouvelle configuration :
 *
 * filtersEnabled = false
 *
 * signifie qu’ils ne seront plus affichés dans la version finale.
 *
 * Ils restent néanmoins disponibles jusqu’à la mise à jour complète
 * des composants dépendants.
 */
export type PublicHomeProductFilter =
  (
    typeof PUBLIC_HOME_PRODUCT_FILTERS
  )[number];


export type PublicHomeProductFilterId =
  PublicHomeProductFilter[
    "id"
  ];


export type PublicHomeProductFilterLabel =
  PublicHomeProductFilter[
    "label"
  ];


export type PublicHomeProductFilterCategorySlotId =
  PublicHomeProductFilter[
    "categorySlotId"
  ];


export type PublicHomeProductFilterState =
  Readonly<{
    activeFilterId:
      PublicHomeProductFilterId;
  }>;


export type PublicHomeProductFilterChangeHandler =
  (
    filterId:
      PublicHomeProductFilterId,
  ) => void;


/* ==========================================================================
   13. PRODUITS PHARES — CONFIGURATION
   ========================================================================== */

export type PublicHomeFeaturedProductsConfig =
  typeof PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG;


export type PublicHomeFeaturedProductsDataConfig =
  PublicHomeFeaturedProductsConfig[
    "data"
  ];


export type PublicHomeFeaturedProductsPresentation =
  PublicHomeFeaturedProductsConfig[
    "presentation"
  ];


export type PublicHomeFeaturedProductsDesktopPresentation =
  PublicHomeFeaturedProductsPresentation[
    "desktop"
  ];


export type PublicHomeFeaturedProductsMobilePresentation =
  PublicHomeFeaturedProductsPresentation[
    "mobile"
  ];


export type PublicHomeFeaturedProductCardPresentation =
  PublicHomeFeaturedProductsPresentation[
    "card"
  ];


/* ==========================================================================
   14. CATÉGORIE ASSOCIÉE À UN PRODUIT
   ========================================================================== */

/**
 * Une offre commerciale n’a PLUS besoin d’appartenir à un slot Home
 * pour être affichée.
 *
 * Exemple :
 *
 * un Product possède une vraie catégorie en base,
 * mais cette catégorie n’est pas :
 *
 * - face ;
 * - body ;
 * - hair ;
 * - gummies ;
 * - oils ;
 * - soaps.
 *
 * L’offre reste parfaitement valide et doit apparaître dans la Home.
 *
 * `slotId` peut donc être null.
 */
export type PublicHomeProductCategory =
  Readonly<{
    id:
      PublicHomeRequiredText;

    name:
      PublicHomeRequiredText;

    slug:
      PublicHomeRequiredText;

    slotId:
      PublicHomeCategorySlotId |
      null;
  }>;


/* ==========================================================================
   15. OFFRE PRODUIT HOME
   ========================================================================== */

/**
 * Une offre Home conserve le contrat commercial public partagé.
 *
 * La catégorie devient uniquement une information complémentaire.
 *
 * Elle NE décide plus si le produit peut être affiché.
 */
export type PublicHomeFeaturedProduct =
  PublicProductCardData &
  Readonly<{
    category:
      PublicHomeProductCategory |
      null;
  }>;


/**
 * Chaque entrée correspond à UNE offre StoreProduct.
 *
 * Il n’existe aucune limite de cinq éléments dans ce type.
 */
export type PublicHomeFeaturedProductCollection =
  readonly PublicHomeFeaturedProduct[];


/* ==========================================================================
   16. ALIAS PRODUITS PUBLICS HOME
   ========================================================================== */

/**
 * Nom plus neutre pour les futurs composants qui n’ont plus besoin
 * de considérer la collection comme limitée à cinq "featured products".
 *
 * Les deux contrats pointent actuellement vers la même structure afin
 * de préserver la compatibilité.
 */
export type PublicHomeProduct =
  PublicHomeFeaturedProduct;


export type PublicHomeProductCollection =
  PublicHomeFeaturedProductCollection;


/* ==========================================================================
   17. INSTAGRAM
   ========================================================================== */

export type PublicHomeInstagramConfig =
  typeof PUBLIC_HOME_INSTAGRAM_CONFIG;


export type PublicHomeInstagramPresentation =
  PublicHomeInstagramConfig[
    "presentation"
  ];


export type PublicHomeInstagramSocial =
  Readonly<{
    id:
      "instagram";

    label:
      PublicHomeRequiredText;

    handle:
      PublicHomeRequiredText;

    href:
      PublicHomeRequiredText;
  }>;


/* ==========================================================================
   18. CONFIGURATION GLOBALE
   ========================================================================== */

export type PublicHomeConfig =
  typeof PUBLIC_HOME_CONFIG;


/* ==========================================================================
   19. DONNÉES DYNAMIQUES DE LA HOME
   ========================================================================== */

/**
 * Résultat renvoyé par :
 *
 * getPublicHomeData()
 *
 * IMPORTANT :
 *
 * `featuredProducts` conserve son nom pour éviter de casser :
 *
 * - page.tsx ;
 * - PublicHomeFeaturedProductsSection.tsx ;
 * - les imports existants.
 *
 * Mais cette collection devra désormais contenir toutes les offres
 * publiques valides retournées par la requête.
 */
export type PublicHomeData =
  Readonly<{
    categories:
      PublicHomeCategoryCollection;

    featuredProducts:
      PublicHomeFeaturedProductCollection;
  }>;


/* ==========================================================================
   20. RÉSULTAT DE LA REQUÊTE
   ========================================================================== */

export type PublicHomeQueryResult =
  PublicHomeData;


/* ==========================================================================
   21. PROPS — CATÉGORIES
   ========================================================================== */

export interface PublicHomeCategoriesSectionProps {
  readonly categories:
    PublicHomeCategoryCollection;
}


/* ==========================================================================
   22. PROPS — PRODUITS
   ========================================================================== */

export interface PublicHomeFeaturedProductsSectionProps {
  readonly products:
    PublicHomeFeaturedProductCollection;
}


/**
 * Alias plus neutre utilisable plus tard sans casser le contrat actuel.
 */
export interface PublicHomeProductsSectionProps {
  readonly products:
    PublicHomeProductCollection;
}


/* ==========================================================================
   23. PROPS — FILTRES PRODUITS
   ========================================================================== */

export interface PublicHomeProductFiltersProps {
  readonly filters:
    readonly PublicHomeProductFilter[];

  readonly activeFilterId:
    PublicHomeProductFilterId;

  readonly onFilterChange:
    PublicHomeProductFilterChangeHandler;
}


/* ==========================================================================
   24. PROPS — PRODUITS FILTRÉS
   ========================================================================== */

/**
 * Conservé uniquement pour compatibilité pendant la migration.
 */
export interface PublicHomeFilteredProductsProps {
  readonly products:
    PublicHomeFeaturedProductCollection;

  readonly activeFilterId:
    PublicHomeProductFilterId;
}


/* ==========================================================================
   25. PROPS — CARTE CATÉGORIE
   ========================================================================== */

export interface PublicHomeCategoryCardProps {
  readonly category:
    PublicHomeCategory;

  readonly imagePriority?:
    boolean;
}


/* ==========================================================================
   26. PROPS — CARTE PRODUIT
   ========================================================================== */

export interface PublicHomeFeaturedProductCardProps {
  readonly product:
    PublicHomeFeaturedProduct;

  readonly imagePriority?:
    boolean;
}


/* ==========================================================================
   27. RÉSOLUTION DES CATÉGORIES HOME
   ========================================================================== */

export type PublicHomeResolvedCategorySlot =
  Readonly<{
    slotId:
      PublicHomeCategorySlotId;

    category:
      PublicHomeCategory |
      null;
  }>;


export type PublicHomeResolvedCategorySlotCollection =
  readonly PublicHomeResolvedCategorySlot[];


/* ==========================================================================
   28. MAP CATÉGORIE PRODUIT → SLOT HOME
   ========================================================================== */

/**
 * Contrat destiné à la couche serveur.
 *
 * Une catégorie Product peut ne correspondre à aucun slot Home.
 */
export type PublicHomeProductCategorySlotResolution =
  Readonly<{
    categoryId:
      PublicHomeRequiredText;

    slotId:
      PublicHomeCategorySlotId |
      null;
  }>;


/* ==========================================================================
   29. IDENTIFIANTS
   ========================================================================== */

export type PublicHomeCategoryId =
  PublicHomeCategory[
    "id"
  ];


export type PublicHomeCategorySlug =
  PublicHomeCategory[
    "slug"
  ];


export type PublicHomeFeaturedProductId =
  PublicHomeFeaturedProduct[
    "productId"
  ];


export type PublicHomeFeaturedStoreProductId =
  PublicHomeFeaturedProduct[
    "storeProductId"
  ];


/* ==========================================================================
   30. FILTRAGE — COMPATIBILITÉ
   ========================================================================== */

export type PublicHomeFilteredProductCollection =
  readonly PublicHomeFeaturedProduct[];


export type PublicHomeProductFilterPredicate =
  (
    product:
      PublicHomeFeaturedProduct,

    activeFilterId:
      PublicHomeProductFilterId,
  ) => boolean;


/* ==========================================================================
   31. GRILLE PRODUITS
   ========================================================================== */

/**
 * Contrat dérivé de la configuration officielle.
 *
 * Desktop :
 *
 * 5 colonnes.
 *
 * Mobile :
 *
 * 2 colonnes.
 */
export type PublicHomeProductGridDesktopColumns =
  PublicHomeFeaturedProductsDesktopPresentation[
    "columns"
  ];


export type PublicHomeProductGridMobileColumns =
  PublicHomeFeaturedProductsMobilePresentation[
    "columns"
  ];


export type PublicHomeProductDesktopMode =
  PublicHomeFeaturedProductsDesktopPresentation[
    "mode"
  ];


export type PublicHomeProductMobileMode =
  PublicHomeFeaturedProductsMobilePresentation[
    "mode"
  ];


/* ==========================================================================
   32. CHARGEMENT DES PRODUITS
   ========================================================================== */

export type PublicHomeProductsLoadAll =
  PublicHomeFeaturedProductsDataConfig[
    "loadAllPublicProducts"
  ];


export type PublicHomeProductsRequireCategoryMatch =
  PublicHomeFeaturedProductsDataConfig[
    "requireCategoryMatch"
  ];


export type PublicHomeProductsMaximum =
  PublicHomeFeaturedProductsDataConfig[
    "maxProducts"
  ];


/* ==========================================================================
   33. GARANTIES MÉTIER
   ========================================================================== */

/**
 * Contrat documentaire de la couche serveur.
 *
 * Aucun objet de ce type n’a besoin d’être instancié.
 */
export type PublicHomeDataGuarantees =
  Readonly<{
    categoriesAreReal:
      true;

    categoriesHaveImages:
      true;

    productsRepresentStoreProducts:
      true;

    productsDoNotRequireHomeCategoryMatch:
      true;

    allEligibleProductsCanBeLoaded:
      true;

    productsAreNotGloballyLimitedToFive:
      true;

    pricesAreReal:
      true;

    stocksAreReal:
      true;

    storesAreReal:
      true;

    productRoutesAreResolved:
      true;

    noDemoCommercialData:
      true;
  }>;


/* ==========================================================================
   34. CONTRAT COMPLET DE LA HOME
   ========================================================================== */

export type PublicHomePageContract =
  Readonly<{
    config:
      PublicHomeConfig;

    data:
      PublicHomeData;
  }>;


/* ==========================================================================
   35. RÉEXPORT DU CONTRAT PRODUIT PARTAGÉ
   ========================================================================== */

export type {
  PublicProductCardData,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * CETTE VERSION PRÉPARE :
 *
 * HERO
 *
 * RÉVÈLE
 * TA BEAUTÉ
 * NATURELLE
 *
 * avec segmentation :
 *
 * RÉVÈLE      noir
 * TA          noir
 * BEAUTÉ      rose
 * NATURELLE   rose
 *
 * --------------------------------------------------------------------------
 *
 * PRODUITS
 *
 * - aucune obligation d’appartenir aux 6 catégories Home ;
 * - aucune limite TypeScript à 5 produits ;
 * - Product → StoreProduct → Store conservé ;
 * - catégorie produit facultative ;
 * - slot Home facultatif ;
 * - filtres conservés temporairement pour compatibilité.
 *
 * --------------------------------------------------------------------------
 *
 * GRILLE CIBLE
 *
 * Desktop :
 *
 * 5 produits par ligne.
 *
 * Mobile :
 *
 * 2 produits par ligne.
 *
 * --------------------------------------------------------------------------
 *
 * IMAGE PROMOTION
 *
 * /images/couverturea.png
 *
 * --------------------------------------------------------------------------
 *
 * AUCUNE DONNÉE DE DÉMONSTRATION.
 * AUCUNE ROUTE INVENTÉE.
 * AUCUNE LOGIQUE PRISMA DANS CE FICHIER.
 *
 * ============================================================================
 */