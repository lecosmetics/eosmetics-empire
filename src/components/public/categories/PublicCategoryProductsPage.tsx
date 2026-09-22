import Link from "next/link";

import {
  ChevronRight,
} from "lucide-react";

import {
  PUBLIC_CATEGORIES_BREADCRUMB_CONFIG,
  PUBLIC_CATEGORIES_CATALOG_CONFIG,
  PUBLIC_CATEGORIES_ROUTE,
} from "@/config/public-categories";

import PublicProductCard from "@/components/public/products/PublicProductCard";

import type {
  PublicCategoryProductsPageProps,
} from "@/lib/public/categories/public-categories-types";

import styles from "./public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — PRODUITS D’UNE CATÉGORIE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/categories/PublicCategoryProductsPage.tsx
 *
 * ============================================================================
 *
 * ROUTE CONSOMMATRICE :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher :
 *
 * - le fil d’Ariane ;
 * - le vrai nom de ProductCategory ;
 * - sa vraie description lorsqu’elle existe ;
 * - le vrai nombre d’offres disponibles ;
 * - toutes les vraies offres StoreProduct de la catégorie ;
 * - un état vide propre lorsqu’aucune offre n’est disponible.
 *
 * ============================================================================
 *
 * SOURCE DES DONNÉES
 *
 * src/lib/public/categories/public-category-products-query.ts
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
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
 * IMPORTANT :
 *
 * Une carte produit représente toujours UNE offre StoreProduct.
 *
 * Si un Product est vendu par plusieurs boutiques :
 *
 * Product A
 *
 * ├── StoreProduct boutique 1
 * └── StoreProduct boutique 2
 *
 * les deux cartes restent affichées.
 *
 * ============================================================================
 *
 * CE COMPOSANT NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire PostgreSQL ;
 * - lire une session ;
 * - fabriquer un produit ;
 * - fabriquer un prix ;
 * - fabriquer un stock ;
 * - fabriquer une boutique ;
 * - fabriquer une route produit ;
 * - filtrer à nouveau les données métier ;
 * - dédupliquer par Product.id ;
 * - devenir un Client Component.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const BREADCRUMB_CONFIG =
  PUBLIC_CATEGORIES_BREADCRUMB_CONFIG;


const CATALOG_CONFIG =
  PUBLIC_CATEGORIES_CATALOG_CONFIG;


/* ==========================================================================
   2. IDENTIFIANTS ACCESSIBILITÉ
   ========================================================================== */

const PAGE_TITLE_ID =
  "public-category-products-title";


const PAGE_DESCRIPTION_ID =
  "public-category-products-description";


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


/* ==========================================================================
   4. FORMAT DU COMPTEUR
   ========================================================================== */

/**
 * Exemples :
 *
 * 0 produit
 * 1 produit
 * 12 produits
 *
 * Aucun nombre n’est créé ici.
 *
 * La valeur provient de :
 *
 * data.productCount
 */
function formatProductCount(
  value:
    number,
): string {
  const count =
    Number.isFinite(
      value,
    ) &&
    value >
      0
      ? Math.floor(
          value,
        )
      : 0;


  if (
    count ===
    0
  ) {
    return CATALOG_CONFIG
      .productCountLabels
      .zero;
  }


  if (
    count ===
    1
  ) {
    return CATALOG_CONFIG
      .productCountLabels
      .singular;
  }


  return `${count} ${CATALOG_CONFIG.productCountLabels.pluralSuffix}`;
}


/* ==========================================================================
   5. BREADCRUMB
   ========================================================================== */

interface CategoryProductsBreadcrumbProps {
  readonly categoryName:
    string;
}


function CategoryProductsBreadcrumb({
  categoryName,
}: CategoryProductsBreadcrumbProps) {
  return (
    <nav
      className={
        styles.categoriesHeroBreadcrumb
      }
      aria-label={
        BREADCRUMB_CONFIG.ariaLabel
      }
    >
      <ol
        className={
          styles.categoriesHeroBreadcrumbList
        }
      >
        {/* ===============================================================
            ACCUEIL
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbItem
          }
        >
          <Link
            href={
              BREADCRUMB_CONFIG
                .home
                .href
            }
            className={
              styles.categoriesHeroBreadcrumbLink
            }
          >
            {
              BREADCRUMB_CONFIG
                .home
                .label
            }
          </Link>
        </li>


        {/* ===============================================================
            SÉPARATEUR
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbSeparator
          }
          aria-hidden="true"
        >
          <ChevronRight
            size={
              14
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </li>


        {/* ===============================================================
            CATÉGORIES
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbItem
          }
        >
          <Link
            href={
              PUBLIC_CATEGORIES_ROUTE
            }
            className={
              styles.categoriesHeroBreadcrumbLink
            }
          >
            {
              BREADCRUMB_CONFIG
                .current
                .label
            }
          </Link>
        </li>


        {/* ===============================================================
            SÉPARATEUR
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbSeparator
          }
          aria-hidden="true"
        >
          <ChevronRight
            size={
              14
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </li>


        {/* ===============================================================
            CATÉGORIE COURANTE
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbItem
          }
          aria-current="page"
        >
          <span
            className={
              styles.categoriesHeroBreadcrumbCurrent
            }
            title={
              categoryName
            }
          >
            {
              categoryName
            }
          </span>
        </li>
      </ol>
    </nav>
  );
}


/* ==========================================================================
   6. HEADER
   ========================================================================== */

interface CategoryProductsHeaderProps {
  readonly categoryName:
    string;

  readonly description:
    string |
    null;

  readonly productCount:
    number;
}


function CategoryProductsHeader({
  categoryName,
  description,
  productCount,
}: CategoryProductsHeaderProps) {
  const countLabel =
    formatProductCount(
      productCount,
    );


  return (
    <>
      {/* ==================================================================
          BREADCRUMB
          ================================================================== */}

      <div
        className={
          styles.categoriesHeroBreadcrumbContainer
        }
      >
        <CategoryProductsBreadcrumb
          categoryName={
            categoryName
          }
        />
      </div>


      {/* ==================================================================
          ENTÊTE CATÉGORIE
          ================================================================== */}

      <header
        className={
          styles.categoryProductsHeader
        }
      >
        <div
          className={
            styles.categoryProductsHeading
          }
        >
          <h1
            id={
              PAGE_TITLE_ID
            }
            className={
              styles.categoryProductsTitle
            }
          >
            {
              categoryName
            }
          </h1>


          {description ? (
            <p
              id={
                PAGE_DESCRIPTION_ID
              }
              className={
                styles.categoryProductsDescription
              }
            >
              {
                description
              }
            </p>
          ) : null}
        </div>


        <p
          className={
            styles.categoryProductsCount
          }
          aria-label={
            countLabel
          }
        >
          {
            countLabel
          }
        </p>
      </header>
    </>
  );
}


/* ==========================================================================
   7. ÉTAT VIDE
   ========================================================================== */

interface CategoryProductsEmptyStateProps {
  readonly categoryName:
    string;
}


function CategoryProductsEmptyState({
  categoryName,
}: CategoryProductsEmptyStateProps) {
  return (
    <div
      className={
        styles.categoryProductsEmpty
      }
      role="status"
    >
      Aucun produit disponible actuellement dans la catégorie{" "}
      <strong>
        {
          categoryName
        }
      </strong>
      .
    </div>
  );
}


/* ==========================================================================
   8. GRILLE PRODUITS
   ========================================================================== */

function CategoryProductsGrid({
  products,
}: {
  readonly products:
    PublicCategoryProductsPageProps[
      "data"
    ][
      "products"
    ];
}) {
  return (
    <ul
      className={
        styles.categoryProductsGrid
      }
      aria-label="Produits disponibles dans cette catégorie"
    >
      {products.map(
        (
          product,
          index,
        ) => (
          <li
            key={
              product.storeProductId
            }
            className={
              styles.categoryProductsGridItem
            }
          >
            <PublicProductCard
              product={
                product
              }
              imagePriority={
                index <
                5
              }
            />
          </li>
        ),
      )}
    </ul>
  );
}


/* ==========================================================================
   9. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoryProductsPage({
  data,
}: PublicCategoryProductsPageProps) {
  /* ------------------------------------------------------------------------
     CATÉGORIE
     ------------------------------------------------------------------------ */

  const categoryName =
    normalizeRequiredText(
      data.category.name,
    );


  const categoryDescription =
    normalizeRequiredText(
      data.category.description,
    ) ||
    null;


  /* ------------------------------------------------------------------------
     DONNÉES
     ------------------------------------------------------------------------ */

  const products =
    data.products;


  /**
   * La requête serveur fournit déjà productCount.
   *
   * On utilise néanmoins la collection réellement reçue comme dernière
   * protection de cohérence d’affichage.
   *
   * Cela évite qu’un compteur diverge de la grille si la structure
   * évolue plus tard.
   */
  const productCount =
    products.length;


  const hasProducts =
    productCount >
    0;


  /* ------------------------------------------------------------------------
     PROTECTION
     ------------------------------------------------------------------------ */

  /**
   * Cette situation ne devrait normalement jamais arriver car la couche
   * serveur invalide déjà une catégorie sans nom exploitable.
   *
   * On évite malgré tout de rendre un titre vide.
   */
  if (
    !categoryName
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.categoryProductsPage
      }
      data-public-categories-page="true"
      data-category-id={
        data.category.id
      }
      data-category-slug={
        data.category.slug
      }
      data-product-count={
        productCount
      }
      aria-labelledby={
        PAGE_TITLE_ID
      }
      aria-describedby={
        categoryDescription
          ? PAGE_DESCRIPTION_ID
          : undefined
      }
    >
      {/* ==================================================================
          EN-TÊTE
          ================================================================== */}

      <CategoryProductsHeader
        categoryName={
          categoryName
        }
        description={
          categoryDescription
        }
        productCount={
          productCount
        }
      />


      {/* ==================================================================
          PRODUITS
          ================================================================== */}

      {hasProducts ? (
        <CategoryProductsGrid
          products={
            products
          }
        />
      ) : (
        <CategoryProductsEmptyState
          categoryName={
            categoryName
          }
        />
      )}
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ROUTE CONSOMMATRICE :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * DONNÉES :
 *
 * PublicCategoryProductsPageData
 *
 * ============================================================================
 *
 * CATÉGORIE :
 *
 * vraie ProductCategory.
 *
 * ============================================================================
 *
 * PRODUITS :
 *
 * vraies offres StoreProduct.
 *
 * ============================================================================
 *
 * CARTE :
 *
 * src/components/public/products/PublicProductCard.tsx
 *
 * Elle n’est pas recréée ici.
 *
 * ============================================================================
 *
 * CLÉ REACT :
 *
 * product.storeProductId
 *
 * et non :
 *
 * product.productId
 *
 * Cela permet de conserver plusieurs offres du même Product.
 *
 * ============================================================================
 *
 * RESPONSIVE :
 *
 * Desktop :
 *
 * 5 produits par ligne.
 *
 * Tablette :
 *
 * 3 produits par ligne.
 *
 * Mobile :
 *
 * 2 produits par ligne.
 *
 * Les règles sont déjà présentes dans :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * ============================================================================
 *
 * FOOTER MOBILE :
 *
 * data-public-categories-page="true"
 *
 * permet de conserver le même comportement que /categories :
 *
 * - Footer masqué en mobile ;
 * - Footer visible sur PC ;
 * - Bottom Navigation globale conservée.
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - fausse catégorie ;
 * - faux produit ;
 * - faux compteur commercial ;
 * - fausse route produit ;
 * - fusion de StoreProduct ;
 * - logique cliente React.
 *
 * ============================================================================
 */