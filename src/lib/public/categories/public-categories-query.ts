import "server-only";

import type {
  Prisma,
} from "@prisma/client";

import {
  PUBLIC_CATEGORIES_CATALOG_CONFIG,
  PUBLIC_CATEGORIES_DATA_CONFIG,
} from "@/config/public-categories";

import {
  publicRouteBuilders,
} from "@/config/routes";

import {
  db,
} from "@/prisma/db";

import type {
  PublicCategoriesPageData,
  PublicCategoryCardData,
  PublicCategoryCollection,
} from "@/lib/public/categories/public-categories-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * REQUÊTES SERVEUR — PAGE PUBLIQUE DES CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Préparer les vraies données nécessaires à :
 *
 * /categories
 *
 * ============================================================================
 *
 * DONNÉES LUES
 *
 * ProductCategory :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - description ;
 * - imageUrl ;
 * - imageAlt ;
 * - isActive.
 *
 * ============================================================================
 *
 * COMPTEUR DE PRODUITS
 *
 * Pour chaque catégorie, on calcule le nombre de Product DISTINCTS
 * réellement commercialisables.
 *
 * Architecture :
 *
 * ProductCategory
 *      ↓
 * Product
 *      ↓
 * StoreProduct
 *      ↓
 * Store
 *
 * ============================================================================
 *
 * UN PRODUCT EST COMPTÉ SI :
 *
 * Product :
 *
 * - appartient réellement à la catégorie ;
 * - status = ACTIVE ;
 * - possède une vraie image lorsque cette règle est activée.
 *
 * ET
 *
 * possède au moins un StoreProduct :
 *
 * - status = ACTIVE ;
 * - stockQuantity > 0 ;
 * - price > 0 ;
 *
 * appartenant à un Store :
 *
 * - status = ACTIVE.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le compteur représente des Product distincts.
 *
 * Exemple :
 *
 * Product A
 *   ├── StoreProduct boutique 1
 *   └── StoreProduct boutique 2
 *
 * availableProductCount :
 *
 * 1
 *
 * et non :
 *
 * 2
 *
 * ============================================================================
 *
 * ROUTES :
 *
 * Les routes dynamiques ne sont jamais construites manuellement ici.
 *
 * La source officielle est :
 *
 * src/config/routes.ts
 *
 * avec :
 *
 * publicRouteBuilders.categoryBySlug(slug)
 *
 * ============================================================================
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - créer une catégorie fictive ;
 * - créer une image fictive ;
 * - créer un compteur fictif ;
 * - inventer un produit ;
 * - inventer un stock ;
 * - inventer un prix ;
 * - inventer une boutique ;
 * - effectuer une requête Prisma par catégorie ;
 * - utiliser le nom de catégorie pour fabriquer un slug ;
 * - utiliser le nombre de StoreProduct comme nombre de Product ;
 * - construire manuellement /categories/[slug] ;
 * - exposer des objets Prisma aux composants.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. STATUTS PUBLICS
   ========================================================================== */

/**
 * Valeurs confirmées dans l'architecture Prisma actuelle.
 *
 * L'utilisation de littéraux évite d'ajouter une dépendance runtime
 * inutile aux enums Prisma dans cette couche.
 */
const PUBLIC_PRODUCT_STATUS =
  "ACTIVE" as const;


const PUBLIC_STORE_PRODUCT_STATUS =
  "ACTIVE" as const;


const PUBLIC_STORE_STATUS =
  "ACTIVE" as const;


/* ==========================================================================
   2. LIMITE
   ========================================================================== */

/**
 * Configuration actuelle :
 *
 * maxCategories = null
 *
 * donc toutes les catégories éligibles sont chargées.
 */
const MAXIMUM_PUBLIC_CATEGORIES:
  number |
  null =
    PUBLIC_CATEGORIES_CATALOG_CONFIG
      .maxCategories;


/* ==========================================================================
   3. NORMALISATION TEXTE
   ========================================================================== */

function normalizeRequiredText(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


function normalizeOptionalText(
  value:
    string |
    null |
    undefined,
): string |
  null {
  const normalized =
    normalizeRequiredText(
      value,
    );


  return normalized.length >
    0
    ? normalized
    : null;
}


/* ==========================================================================
   4. NORMALISATION COMPTEUR
   ========================================================================== */

/**
 * Protection supplémentaire.
 *
 * Prisma retourne normalement déjà un entier >= 0.
 *
 * On évite cependant de laisser remonter une valeur incohérente
 * jusque dans l'interface publique.
 */
function normalizeCount(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    ) ||
    value <=
      0
  ) {
    return 0;
  }


  return Math.floor(
    value,
  );
}


/* ==========================================================================
   5. WHERE — STORE PRODUCT DISPONIBLE
   ========================================================================== */

/**
 * Conditions commerciales d'un StoreProduct qui permet à un Product
 * d'être compté comme réellement disponible.
 */
function buildAvailableStoreProductWhere():
  Prisma.StoreProductWhereInput {
  const where:
    Prisma.StoreProductWhereInput =
      {};


  /* ------------------------------------------------------------------------
     STORE PRODUCT ACTIF
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .productCount
      .requireActiveStoreProduct
  ) {
    where.status =
      PUBLIC_STORE_PRODUCT_STATUS;
  }


  /* ------------------------------------------------------------------------
     STOCK POSITIF
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .productCount
      .requirePositiveStock
  ) {
    where.stockQuantity = {
      gt:
        0,
    };
  }


  /* ------------------------------------------------------------------------
     PRIX POSITIF
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .productCount
      .requirePositivePrice
  ) {
    where.price = {
      gt:
        0,
    };
  }


  /* ------------------------------------------------------------------------
     BOUTIQUE ACTIVE
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .productCount
      .requireActiveStore
  ) {
    where.store = {
      status:
        PUBLIC_STORE_STATUS,
    };
  }


  return where;
}


/* ==========================================================================
   6. WHERE — PRODUCT DISPONIBLE
   ========================================================================== */

/**
 * Un Product est compté une seule fois même s'il possède plusieurs
 * StoreProduct publics.
 */
function buildAvailableProductWhere():
  Prisma.ProductWhereInput {
  const where:
    Prisma.ProductWhereInput =
      {};


  /* ------------------------------------------------------------------------
     PRODUCT ACTIF
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .productCount
      .requireActiveProduct
  ) {
    where.status =
      PUBLIC_PRODUCT_STATUS;
  }


  /* ------------------------------------------------------------------------
     IMAGE PRODUIT
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .productCount
      .requireProductImage
  ) {
    where.images = {
      some: {
        url: {
          not:
            "",
        },
      },
    };
  }


  /* ------------------------------------------------------------------------
     AU MOINS UNE OFFRE COMMERCIALISABLE
     ------------------------------------------------------------------------ */

  where.storeProducts = {
    some:
      buildAvailableStoreProductWhere(),
  };


  return where;
}


/* ==========================================================================
   7. WHERE PARTAGÉ DU COMPTEUR
   ========================================================================== */

/**
 * Construit une seule fois.
 *
 * Cette condition est ensuite utilisée directement par Prisma dans :
 *
 * _count.products
 */
const PUBLIC_AVAILABLE_PRODUCT_WHERE =
  buildAvailableProductWhere();


/* ==========================================================================
   8. SELECT PRISMA — CATÉGORIE
   ========================================================================== */

/**
 * Une seule requête récupère :
 *
 * - les informations de la catégorie ;
 * - le nombre de Product éligibles.
 *
 * Aucun N+1.
 */
const PUBLIC_CATEGORY_SELECT = {
  id:
    true,

  name:
    true,

  slug:
    true,

  description:
    true,

  imageUrl:
    true,

  imageAlt:
    true,

  isActive:
    true,

  _count: {
    select: {
      products: {
        where:
          PUBLIC_AVAILABLE_PRODUCT_WHERE,
      },
    },
  },
} satisfies Prisma.ProductCategorySelect;


/* ==========================================================================
   9. TYPE EXACT DU RÉSULTAT PRISMA
   ========================================================================== */

type PublicRawCategory =
  Prisma.ProductCategoryGetPayload<{
    select:
      typeof PUBLIC_CATEGORY_SELECT;
  }>;


/* ==========================================================================
   10. WHERE — PRODUCT CATEGORY
   ========================================================================== */

function buildPublicCategoryWhere():
  Prisma.ProductCategoryWhereInput {
  const where:
    Prisma.ProductCategoryWhereInput =
      {};


  /* ------------------------------------------------------------------------
     CATÉGORIE ACTIVE
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .requireActiveCategory
  ) {
    where.isActive =
      true;
  }


  /* ------------------------------------------------------------------------
     IMAGE CATÉGORIE
     ------------------------------------------------------------------------ */

  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .requireCategoryImage
  ) {
    /**
     * Élimine les imageUrl NULL directement côté PostgreSQL.
     *
     * Une chaîne vide éventuelle est ensuite rejetée pendant le mapping.
     *
     * Aucun fallback fictif n'est généré.
     */
    where.imageUrl = {
      not:
        null,
    };
  }


  /* ------------------------------------------------------------------------
     CATÉGORIES VIDES
     ------------------------------------------------------------------------ */

  if (
    !PUBLIC_CATEGORIES_CATALOG_CONFIG
      .includeEmptyActiveCategories
  ) {
    where.products = {
      some:
        PUBLIC_AVAILABLE_PRODUCT_WHERE,
    };
  }


  return where;
}


/* ==========================================================================
   11. IMAGE PUBLIQUE D'UNE CATÉGORIE
   ========================================================================== */

function getPublicCategoryImage(
  category: {
    readonly name:
      string;

    readonly imageUrl:
      string |
      null;

    readonly imageAlt:
      string |
      null;
  },
): PublicCategoryCardData["image"] |
  null {
  const categoryName =
    normalizeRequiredText(
      category.name,
    );


  const imageUrl =
    normalizeRequiredText(
      category.imageUrl,
    );


  if (
    categoryName.length ===
      0 ||
    imageUrl.length ===
      0
  ) {
    return null;
  }


  /**
   * imageAlt peut être absent.
   *
   * Le vrai nom ProductCategory est alors utilisé comme texte alternatif.
   *
   * Cela ne crée aucune donnée commerciale fictive.
   */
  const imageAlt =
    normalizeRequiredText(
      category.imageAlt,
    ) ||
    categoryName;


  return {
    url:
      imageUrl,

    altText:
      imageAlt,
  };
}


/* ==========================================================================
   12. ROUTE PUBLIQUE DE CATÉGORIE
   ========================================================================== */

/**
 * Route :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * La route n'est plus construite manuellement dans ce fichier.
 *
 * La source officielle est :
 *
 * src/config/routes.ts
 *
 * via :
 *
 * publicRouteBuilders.categoryBySlug(slug)
 *
 * ============================================================================
 *
 * Le slug :
 *
 * - vient directement de ProductCategory.slug ;
 * - n'est jamais fabriqué depuis ProductCategory.name ;
 * - est validé avant d'être envoyé au builder.
 */
function buildPublicCategoryHref(
  slug:
    string,
): string {
  const normalizedSlug =
    normalizeRequiredText(
      slug,
    );


  if (
    normalizedSlug.length ===
    0
  ) {
    return "";
  }


  return publicRouteBuilders
    .categoryBySlug(
      normalizedSlug,
    );
}


/* ==========================================================================
   13. MAPPING PRISMA → CARTE PUBLIQUE
   ========================================================================== */

function mapRawCategoryToPublicCategory(
  category:
    PublicRawCategory,
): PublicCategoryCardData |
  null {
  /* ------------------------------------------------------------------------
     IDENTIFIANT
     ------------------------------------------------------------------------ */

  const id =
    normalizeRequiredText(
      category.id,
    );


  /* ------------------------------------------------------------------------
     NOM
     ------------------------------------------------------------------------ */

  const name =
    normalizeRequiredText(
      category.name,
    );


  /* ------------------------------------------------------------------------
     SLUG
     ------------------------------------------------------------------------ */

  const slug =
    normalizeRequiredText(
      category.slug,
    );


  /* ------------------------------------------------------------------------
     VALIDATION STRUCTURELLE
     ------------------------------------------------------------------------ */

  if (
    !id ||
    !name ||
    !slug
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IMAGE
     ------------------------------------------------------------------------ */

  const image =
    getPublicCategoryImage(
      category,
    );


  /**
   * La configuration actuelle exige une vraie image.
   *
   * Aucun placeholder de démonstration.
   */
  if (
    PUBLIC_CATEGORIES_DATA_CONFIG
      .requireCategoryImage &&
    !image
  ) {
    return null;
  }


  /**
   * PublicCategoryCardData exige actuellement une image.
   *
   * Si requireCategoryImage devient false plus tard, le contrat TypeScript
   * et PublicCategoryCard devront être modifiés ensemble.
   *
   * On ne fabrique jamais d'image de remplacement ici.
   */
  if (
    !image
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     ROUTE
     ------------------------------------------------------------------------ */

  const href =
    buildPublicCategoryHref(
      slug,
    );


  if (
    href.length ===
    0
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     COMPTEUR RÉEL
     ------------------------------------------------------------------------ */

  const availableProductCount =
    normalizeCount(
      category
        ._count
        .products,
    );


  /* ------------------------------------------------------------------------
     CONTRAT FINAL
     ------------------------------------------------------------------------ */

  return {
    id,

    name,

    slug,

    description:
      normalizeOptionalText(
        category.description,
      ),

    image,

    availableProductCount,

    href,
  };
}


/* ==========================================================================
   14. TYPE GUARD
   ========================================================================== */

function isPublicCategoryCardData(
  value:
    PublicCategoryCardData |
    null,
): value is PublicCategoryCardData {
  return value !==
    null;
}


/* ==========================================================================
   15. REQUÊTE BRUTE DES CATÉGORIES
   ========================================================================== */

/**
 * Lit toutes les catégories éligibles.
 *
 * Ordre :
 *
 * name ASC
 * id ASC
 *
 * Aucun ordre :
 *
 * - sponsorisé ;
 * - bestseller ;
 * - populaire ;
 * - marketing ;
 *
 * n'est inventé.
 */
async function queryRawPublicCategories():
  Promise<
    PublicRawCategory[]
  > {
  const where =
    buildPublicCategoryWhere();


  /**
   * Une limite Prisma n'est appliquée que lorsqu'une vraie limite
   * positive existe dans la configuration.
   *
   * Configuration actuelle :
   *
   * maxCategories = null
   *
   * donc aucun `take`.
   */
  if (
    typeof MAXIMUM_PUBLIC_CATEGORIES ===
      "number" &&
    Number.isInteger(
      MAXIMUM_PUBLIC_CATEGORIES,
    ) &&
    MAXIMUM_PUBLIC_CATEGORIES >
      0
  ) {
    return db.productCategory.findMany({
      where,

      orderBy: [
        {
          name:
            "asc",
        },

        {
          id:
            "asc",
        },
      ],

      take:
        MAXIMUM_PUBLIC_CATEGORIES,

      select:
        PUBLIC_CATEGORY_SELECT,
    });
  }


  return db.productCategory.findMany({
    where,

    orderBy: [
      {
        name:
          "asc",
      },

      {
        id:
          "asc",
      },
    ],

    select:
      PUBLIC_CATEGORY_SELECT,
  });
}


/* ==========================================================================
   16. COLLECTION PUBLIQUE
   ========================================================================== */

async function queryPublicCategoryCollection():
  Promise<
    PublicCategoryCollection
  > {
  const rawCategories =
    await queryRawPublicCategories();


  if (
    rawCategories.length ===
    0
  ) {
    return [];
  }


  return rawCategories
    .map(
      mapRawCategoryToPublicCategory,
    )
    .filter(
      isPublicCategoryCardData,
    );
}


/* ==========================================================================
   17. API PRINCIPALE — /categories
   ========================================================================== */

/**
 * Fonction consommée par :
 *
 * src/app/(public)/categories/page.tsx
 *
 * Résultat :
 *
 * {
 *   categories,
 *   categoryCount
 * }
 *
 * ============================================================================
 *
 * categoryCount représente exactement le nombre de cartes
 * réellement rendables.
 *
 * Aucun nombre n'est écrit en dur.
 */
export async function getPublicCategoriesPageData():
  Promise<
    PublicCategoriesPageData
  > {
  const categories =
    await queryPublicCategoryCollection();


  return {
    categories,

    categoryCount:
      categories.length,
  };
}


/* ==========================================================================
   18. API COLLECTION SEULE
   ========================================================================== */

/**
 * Permet à une autre couche serveur de récupérer directement les catégories
 * publiques sans dupliquer les règles de visibilité.
 *
 * Exclusivement serveur grâce à :
 *
 * import "server-only";
 */
export async function getPublicCategories():
  Promise<
    PublicCategoryCollection
  > {
  return queryPublicCategoryCollection();
}


/* ==========================================================================
   19. EXPORT DU TYPE PRISMA INTERNE
   ========================================================================== */

export type {
  PublicRawCategory,
};


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES
 *
 * ============================================================================
 *
 * CATÉGORIES
 *
 * - vraies ProductCategory ;
 * - catégories actives ;
 * - vraies images ;
 * - vrais slugs ;
 * - vraies descriptions éventuelles ;
 * - aucune catégorie fictive ;
 * - aucune limite lorsque maxCategories = null.
 *
 * ============================================================================
 *
 * COMPTEUR
 *
 * availableProductCount représente :
 *
 * le nombre de Product DISTINCTS de la catégorie possédant au moins
 * une offre publique réellement commercialisable.
 *
 * ============================================================================
 *
 * CONDITIONS ACTUELLES
 *
 * Product.status = ACTIVE
 *
 * +
 *
 * vraie ProductImage
 *
 * +
 *
 * StoreProduct.status = ACTIVE
 *
 * +
 *
 * StoreProduct.stockQuantity > 0
 *
 * +
 *
 * StoreProduct.price > 0
 *
 * +
 *
 * Store.status = ACTIVE
 *
 * ============================================================================
 *
 * EXEMPLE
 *
 * ProductCategory :
 *
 * Soins du visage
 *
 * Product A
 *   ├── StoreProduct 1 ACTIVE
 *   └── StoreProduct 2 ACTIVE
 *
 * Product B
 *   └── StoreProduct 3 ACTIVE
 *
 * Product C
 *   └── aucun StoreProduct disponible
 *
 * Résultat :
 *
 * availableProductCount = 2
 *
 * ============================================================================
 *
 * ROUTE CATÉGORIE
 *
 * publicRouteBuilders.categoryBySlug(slug)
 *
 * ============================================================================
 *
 * SOURCE OFFICIELLE DES ROUTES
 *
 * src/config/routes.ts
 *
 * ============================================================================
 *
 * PERFORMANCE
 *
 * Une seule requête principale ProductCategory.
 *
 * Le compteur filtré est réalisé dans la requête Prisma.
 *
 * Aucun :
 *
 * catégorie 1 → requête compteur
 * catégorie 2 → requête compteur
 * catégorie 3 → requête compteur
 *
 * donc aucun N+1.
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - faux produit ;
 * - faux compteur ;
 * - faux stock ;
 * - faux prix ;
 * - faux slug ;
 * - fallback image fictif ;
 * - classement commercial inventé ;
 * - accès session ;
 * - logique React ;
 * - URL dynamique construite manuellement.
 *
 * ============================================================================
 */