import Link from "next/link";

import {
  PackageSearch,
  RotateCcw,
} from "lucide-react";

import PublicProductCard from "@/components/public/products/PublicProductCard";

import {
  PUBLIC_PRODUCTS_EMPTY_STATE_CONFIG,
  PUBLIC_PRODUCTS_GRID_CONFIG,
  PUBLIC_PRODUCTS_ROUTE,
} from "@/config/public-products";

import type {
  PublicProductsGridProps,
} from "@/lib/public/products/public-products-types";

import styles from "./public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GRILLE — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductsGrid.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher les vraies offres commerciales retournées par :
 *
 * src/lib/public/products/public-products-query.ts
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * Une carte =
 *
 * StoreProduct
 *      ↓
 * Product
 *      ↓
 * Store
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Plusieurs StoreProduct appartenant au même Product restent plusieurs
 * offres commerciales distinctes.
 *
 * Exemple :
 *
 * Product A
 *
 * ├── StoreProduct boutique Cotonou
 * └── StoreProduct boutique Dakar
 *
 * =
 *
 * deux cartes différentes.
 *
 * ============================================================================
 *
 * RESPONSIVE
 *
 * La configuration impose :
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
 * La disposition exacte sera appliquée dans :
 *
 * public-products.module.css
 *
 * ============================================================================
 *
 * CARTE PRODUIT
 *
 * Ce composant réutilise exclusivement :
 *
 * src/components/public/products/PublicProductCard.tsx
 *
 * Il ne recrée pas une deuxième carte produit.
 *
 * ============================================================================
 *
 * PANIER
 *
 * Le futur bouton "Ajouter au panier" sera raccordé au composant produit
 * partagé lorsque :
 *
 * src/components/public/panier/PublicAddToPanierButton.tsx
 *
 * sera réellement implémenté.
 *
 * Ce fichier ne doit pas importer un composant Panier vide ou incomplet.
 *
 * ============================================================================
 *
 * CE COMPOSANT NE DOIT PAS :
 *
 * - utiliser "use client" ;
 * - importer Prisma ;
 * - interroger PostgreSQL ;
 * - modifier le stock ;
 * - gérer le Panier ;
 * - inventer un produit ;
 * - inventer un prix ;
 * - inventer une image ;
 * - inventer une promotion ;
 * - fusionner des StoreProduct par Product.id ;
 * - recalculer la pagination ;
 * - reconstruire les routes produit ;
 * - recréer PublicProductCard.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES DE PRÉSENTATION
   ========================================================================== */

/**
 * Priorité donnée uniquement aux toutes premières images visibles.
 *
 * Deux images constituent une valeur raisonnable commune aux deux colonnes
 * mobiles sans précharger toute une rangée desktop de cinq images.
 */
const PUBLIC_PRODUCTS_PRIORITY_IMAGE_COUNT =
  2;


/* ==========================================================================
   NORMALISATION SIMPLE
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
   VALIDATION MINIMALE D'UNE OFFRE
   ========================================================================== */

/**
 * La vraie validation métier appartient déjà à la couche serveur.
 *
 * Cette vérification est uniquement défensive afin d'éviter :
 *
 * - une clé React vide ;
 * - une carte sans StoreProduct.id ;
 * - une carte sans route publique ;
 * - une carte manifestement inexploitable.
 *
 * Aucun fallback métier n'est créé.
 */
function isRenderableCatalogProduct(
  product:
    PublicProductsGridProps[
      "products"
    ][number],
): boolean {
  return (
    normalizeRequiredText(
      product.storeProductId,
    ).length >
      0 &&

    normalizeRequiredText(
      product.productId,
    ).length >
      0 &&

    normalizeRequiredText(
      product.name,
    ).length >
      0 &&

    normalizeRequiredText(
      product.image.url,
    ).length >
      0 &&

    normalizeRequiredText(
      product.href,
    ).length >
      0
  );
}


/* ==========================================================================
   DÉDUPLICATION DÉFENSIVE
   ========================================================================== */

/**
 * On déduplique exclusivement par StoreProduct.id.
 *
 * IMPORTANT :
 *
 * On ne déduplique JAMAIS par Product.id.
 *
 * Deux boutiques peuvent commercialiser le même Product avec :
 *
 * - un prix différent ;
 * - un stock différent ;
 * - une devise différente ;
 * - un qrToken différent.
 *
 * Elles doivent donc rester deux cartes distinctes.
 */
function getUniqueRenderableProducts(
  products:
    PublicProductsGridProps[
      "products"
    ],
): PublicProductsGridProps[
  "products"
] {
  const seenStoreProductIds =
    new Set<
      string
    >();


  const result:
    Array<
      PublicProductsGridProps[
        "products"
      ][number]
    > =
      [];


  for (
    const product
    of products
  ) {
    if (
      !isRenderableCatalogProduct(
        product,
      )
    ) {
      continue;
    }


    const storeProductId =
      product
        .storeProductId
        .trim();


    if (
      seenStoreProductIds.has(
        storeProductId,
      )
    ) {
      continue;
    }


    seenStoreProductIds.add(
      storeProductId,
    );


    result.push(
      product,
    );
  }


  return result;
}


/* ==========================================================================
   ÉTAT VIDE
   ========================================================================== */

function PublicProductsEmptyGrid() {
  const emptyState =
    PUBLIC_PRODUCTS_EMPTY_STATE_CONFIG;


  return (
    <div
      className={
        styles.productsEmptyState
      }
      role="status"
      aria-live="polite"
      data-public-products-empty="true"
    >
      {/* ==================================================================
          ICÔNE
          ================================================================== */}

      <div
        className={
          styles.productsEmptyStateIcon
        }
        aria-hidden="true"
      >
        <PackageSearch
          size={
            34
          }
          strokeWidth={
            1.6
          }
        />
      </div>


      {/* ==================================================================
          CONTENU
          ================================================================== */}

      <div
        className={
          styles.productsEmptyStateContent
        }
      >
        <h2
          className={
            styles.productsEmptyStateTitle
          }
        >
          {
            emptyState.title
          }
        </h2>


        <p
          className={
            styles.productsEmptyStateDescription
          }
        >
          {
            emptyState.description
          }
        </p>
      </div>


      {/* ==================================================================
          RÉINITIALISATION
          ------------------------------------------------------------------
          Retour vers /produits sans query string.
          Cela retire :
          
          - catégorie ;
          - prix minimum ;
          - prix maximum ;
          - promotion ;
          - tri personnalisé ;
          - page.
          ================================================================== */}

      <Link
        href={
          PUBLIC_PRODUCTS_ROUTE
        }
        className={
          styles.productsEmptyStateReset
        }
      >
        <RotateCcw
          size={
            16
          }
          strokeWidth={
            1.9
          }
          aria-hidden="true"
        />

        <span>
          {
            emptyState
              .resetFiltersLabel
          }
        </span>
      </Link>
    </div>
  );
}


/* ==========================================================================
   COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicProductsGrid({
  products,
}: PublicProductsGridProps) {
  const renderableProducts =
    getUniqueRenderableProducts(
      products,
    );


  /* =========================================================================
     AUCUN PRODUIT
     ========================================================================= */

  if (
    renderableProducts.length ===
    0
  ) {
    return (
      <section
        id={
          PUBLIC_PRODUCTS_GRID_CONFIG
            .sectionId
        }
        className={
          styles.productsGridSection
        }
        aria-label="Produits"
        data-public-products-grid="true"
        data-product-count="0"
      >
        <PublicProductsEmptyGrid />
      </section>
    );
  }


  /* =========================================================================
     GRILLE
     ========================================================================= */

  return (
    <section
      id={
        PUBLIC_PRODUCTS_GRID_CONFIG
          .sectionId
      }
      className={
        styles.productsGridSection
      }
      aria-label="Produits"
      data-public-products-grid="true"
      data-product-count={
        renderableProducts.length
      }
      data-desktop-columns={
        PUBLIC_PRODUCTS_GRID_CONFIG
          .presentation
          .desktop
          .columns
      }
      data-tablet-columns={
        PUBLIC_PRODUCTS_GRID_CONFIG
          .presentation
          .tablet
          .columns
      }
      data-mobile-columns={
        PUBLIC_PRODUCTS_GRID_CONFIG
          .presentation
          .mobile
          .columns
      }
    >
      <ul
        className={
          styles.productsGrid
        }
        role="list"
      >
        {renderableProducts.map(
          (
            product,
            index,
          ) => {
            const imagePriority =
              index <
              PUBLIC_PRODUCTS_PRIORITY_IMAGE_COUNT;


            return (
              <li
                key={
                  product.storeProductId
                }
                className={
                  styles.productsGridItem
                }
                data-store-product-id={
                  product.storeProductId
                }
              >
                <PublicProductCard
                  product={
                    product
                  }
                  imagePriority={
                    imagePriority
                  }
                  className={
                    styles.productsGridCard
                  }
                />
              </li>
            );
          },
        )}
      </ul>
    </section>
  );
}