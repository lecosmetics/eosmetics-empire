import PublicProductsFilters from "@/components/public/products/PublicProductsFilters";
import PublicProductsGrid from "@/components/public/products/PublicProductsGrid";
import PublicProductsHero from "@/components/public/products/PublicProductsHero";
import PublicProductsPagination from "@/components/public/products/PublicProductsPagination";
import PublicProductsToolbar from "@/components/public/products/PublicProductsToolbar";

import {
  getPublicProductsPageData,
} from "@/lib/public/products/public-products-query";

import type {
  PublicProductsRoutePageProps,
} from "@/lib/public/products/public-products-types";

import styles from "@/components/public/products/public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — TOUS LES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/produits/page.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Assembler la page publique complète du catalogue produits.
 *
 * ============================================================================
 *
 * ARCHITECTURE
 *
 * Public Layout existant
 *
 * ├── PublicHeader
 * │
 * ├── /produits
 * │   │
 * │   ├── PublicProductsHero
 * │   │
 * │   └── Catalogue
 * │       │
 * │       ├── PublicProductsFilters
 * │       └── Zone résultats
 * │           ├── PublicProductsToolbar
 * │           ├── PublicProductsGrid
 * │           └── PublicProductsPagination
 * │
 * ├── PublicFooter
 * │
 * └── PublicMobileBottomNav
 *
 * ============================================================================
 *
 * DONNÉES
 *
 * Toutes les données dynamiques proviennent de :
 *
 * src/lib/public/products/public-products-query.ts
 *
 * ============================================================================
 *
 * UNE CARTE =
 *
 * UNE offre StoreProduct réelle.
 *
 * ============================================================================
 *
 * FILTRES :
 *
 * - catégorie ;
 * - prix minimum ;
 * - prix maximum ;
 * - promotion ;
 * - tri ;
 * - pagination.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette page reste un Server Component.
 *
 * Elle ne doit pas :
 *
 * - utiliser "use client" ;
 * - importer Prisma ;
 * - appeler directement db ;
 * - inventer des produits ;
 * - inventer des catégories ;
 * - inventer des prix ;
 * - inventer du stock ;
 * - créer un deuxième Header ;
 * - créer un deuxième Footer ;
 * - créer une deuxième navigation mobile ;
 * - reconstruire les cartes produit.
 *
 * ============================================================================
 */


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function PublicProductsPage({
  searchParams,
}: PublicProductsRoutePageProps) {
  /* =========================================================================
     PARAMÈTRES URL
     ========================================================================= */

  const resolvedSearchParams =
    await searchParams;


  /* =========================================================================
     DONNÉES SERVEUR
     ========================================================================= */

  const data =
    await getPublicProductsPageData({
      searchParams:
        resolvedSearchParams,
    });


  /* =========================================================================
     RENDU
     ========================================================================= */

  return (
    <div
      className={
        styles.productsPage
      }
      data-public-products-page="true"
    >
      {/* ==================================================================
          HERO
          ================================================================== */}

      <PublicProductsHero />


      {/* ==================================================================
          CATALOGUE
          ================================================================== */}

      <section
        className={
          styles.productsCatalogSection
        }
        aria-labelledby="public-products-catalog-title"
      >
        <div
          className={
            styles.productsCatalogInner
          }
        >
          {/* ================================================================
              ENTÊTE DU CATALOGUE
              ================================================================ */}

          <header
            className={
              styles.productsCatalogHeader
            }
          >
            <div
              className={
                styles.productsCatalogHeading
              }
            >
              <h2
                id="public-products-catalog-title"
                className={
                  styles.productsCatalogTitle
                }
              >
                Tous nos produits
              </h2>
            </div>
          </header>


          {/* ================================================================
              LAYOUT FILTRES + RÉSULTATS
              ================================================================ */}

          <div
            className={
              styles.productsCatalogLayout
            }
          >
            {/* ==============================================================
                FILTRES
                ============================================================== */}

            <PublicProductsFilters
              categories={
                data.categories
              }
              priceBounds={
                data.priceBounds
              }
              activeFilters={
                data.activeFilters
              }
            />


            {/* ==============================================================
                RÉSULTATS
                ============================================================== */}

            <div
              className={
                styles.productsCatalogMain
              }
            >
              {/* ============================================================
                  TOOLBAR
                  ============================================================ */}

              <PublicProductsToolbar
                totalProductCount={
                  data.totalProductCount
                }
                activeFilters={
                  data.activeFilters
                }
              />


              {/* ============================================================
                  GRILLE
                  ============================================================ */}

              <PublicProductsGrid
                products={
                  data.products
                }
              />


              {/* ============================================================
                  PAGINATION
                  ============================================================ */}

              <PublicProductsPagination
                pagination={
                  data.pagination
                }
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}