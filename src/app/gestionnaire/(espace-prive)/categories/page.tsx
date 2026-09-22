import type {
  Metadata,
} from "next";

import CategoriesEmptyState from "@/components/gestionnaire/categories/CategoriesEmptyState";
import CategoriesFilters from "@/components/gestionnaire/categories/CategoriesFilters";
import CategoriesHeader from "@/components/gestionnaire/categories/CategoriesHeader";
import CategoriesKpiGrid from "@/components/gestionnaire/categories/CategoriesKpiGrid";
import CategoriesMobileList from "@/components/gestionnaire/categories/CategoriesMobileList";
import CategoriesTable from "@/components/gestionnaire/categories/CategoriesTable";

import {
  getManagerCategories,
} from "@/lib/gestionnaire/categories/category-query";

import {
  isManagerCategoryStatusFilter,
  type ManagerCategoryStatusFilter,
} from "@/lib/gestionnaire/categories/category-types";

import styles from "./categories.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/categories/page.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Assembler la page permettant au Gestionnaire de consulter les catégories
 * officielles de produits.
 *
 * LA PAGE AFFICHE :
 *
 * - le fil d'Ariane ;
 * - le titre ;
 * - le sous-titre ;
 * - les KPI réels ;
 * - la recherche ;
 * - le filtre de statut ;
 * - le tableau desktop ;
 * - les cartes mobile ;
 * - l'état vide ;
 * - la pagination.
 *
 * ACTION UNIQUE SUR UNE CATÉGORIE :
 *
 * Voir
 *
 * qui redirige vers :
 *
 * /gestionnaire/produits?category=<slug>
 *
 * IMPORTANT :
 *
 * Cette page ne doit jamais :
 *
 * - recréer le GestionnaireShell ;
 * - recréer la Sidebar ;
 * - recréer le Header global ;
 * - créer une catégorie ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - créer une page détail catégorie ;
 * - inventer une catégorie ;
 * - inventer une image ;
 * - inventer un nombre de produits ;
 * - accepter storeId depuis le navigateur ;
 * - accepter managerId depuis le navigateur.
 *
 * La session et le storeId sont déterminés exclusivement côté serveur dans :
 *
 * src/lib/gestionnaire/categories/category-query.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   CACHE / RENDU
   ========================================================================== */

/**
 * Les nombres de produits dépendent de la boutique actuellement connectée.
 *
 * La page ne doit donc jamais être partagée comme une page statique entre
 * plusieurs Gestionnaires.
 */

export const dynamic =
  "force-dynamic";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata: Metadata = {
  title:
    "Catégories | Cosmetics Empire",

  description:
    "Consultez les catégories de produits disponibles dans votre espace Gestionnaire Cosmetics Empire.",
};


/* ==========================================================================
   SEARCH PARAMS
   ========================================================================== */

type CategorySearchParamValue =
  string |
  string[] |
  undefined;


interface CategoriesPageSearchParams {
  q?:
    CategorySearchParamValue;

  status?:
    CategorySearchParamValue;

  page?:
    CategorySearchParamValue;
}


interface CategoriesPageProps {
  searchParams:
    Promise<CategoriesPageSearchParams>;
}


/* ==========================================================================
   HELPERS — SEARCH PARAM
   ========================================================================== */

/**
 * Une query string peut théoriquement contenir plusieurs fois la même clé :
 *
 * ?q=soins&q=visage
 *
 * La page conserve uniquement la première valeur.
 */

function getFirstSearchParam(
  value:
    CategorySearchParamValue,
): string | undefined {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    return value[0];
  }


  return undefined;
}


/* ==========================================================================
   HELPER — RECHERCHE
   ========================================================================== */

function parseSearch(
  value:
    CategorySearchParamValue,
): string {
  const rawValue =
    getFirstSearchParam(
      value,
    );


  if (
    typeof rawValue !==
    "string"
  ) {
    return "";
  }


  return rawValue.trim();
}


/* ==========================================================================
   HELPER — STATUT
   ========================================================================== */

function parseStatus(
  value:
    CategorySearchParamValue,
): ManagerCategoryStatusFilter {
  const rawValue =
    getFirstSearchParam(
      value,
    );


  if (
    isManagerCategoryStatusFilter(
      rawValue,
    )
  ) {
    return rawValue;
  }


  return "all";
}


/* ==========================================================================
   HELPER — PAGE
   ========================================================================== */

function parsePage(
  value:
    CategorySearchParamValue,
): number {
  const rawValue =
    getFirstSearchParam(
      value,
    );


  if (
    typeof rawValue !==
      "string" ||
    !rawValue.trim()
  ) {
    return 1;
  }


  const parsedValue =
    Number(
      rawValue,
    );


  if (
    !Number.isFinite(
      parsedValue,
    )
  ) {
    return 1;
  }


  const normalizedPage =
    Math.trunc(
      parsedValue,
    );


  if (
    normalizedPage <
    1
  ) {
    return 1;
  }


  return normalizedPage;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  /* ------------------------------------------------------------------------
     1. SEARCH PARAMS
     ------------------------------------------------------------------------ */

  const resolvedSearchParams =
    await searchParams;


  const search =
    parseSearch(
      resolvedSearchParams.q,
    );


  const status =
    parseStatus(
      resolvedSearchParams.status,
    );


  const page =
    parsePage(
      resolvedSearchParams.page,
    );


  /* ------------------------------------------------------------------------
     2. DONNÉES SERVEUR
     ------------------------------------------------------------------------ */

  const data =
    await getManagerCategories({
      search,
      status,
      page,
    });


  const hasCategories =
    data.categories.length >
    0;


  /* ------------------------------------------------------------------------
     3. RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.categoriesPage
      }
    >
      <main
        className={
          styles.categoriesMain
        }
      >
        {/* ===============================================================
            HEADER PAGE
            =============================================================== */}

        <CategoriesHeader />


        {/* ===============================================================
            KPI
            =============================================================== */}

        <CategoriesKpiGrid
          kpis={
            data.kpis
          }
        />


        {/* ===============================================================
            LISTE
            =============================================================== */}

        <section
          className={
            styles.categoriesListCard
          }
          aria-labelledby="categories-list-title"
        >
          {/* -------------------------------------------------------------
              TITRE DE LA LISTE
              ------------------------------------------------------------- */}

          <div
            className={
              styles.categoriesListHeader
            }
          >
            <div
              className={
                styles.categoriesListHeading
              }
            >
              <h2
                id="categories-list-title"
                className={
                  styles.categoriesListTitle
                }
              >
                Liste de mes catégories
              </h2>


              <p
                className={
                  styles.categoriesListDescription
                }
              >
                Consultez les catégories disponibles et les produits associés
                à votre boutique.
              </p>
            </div>
          </div>


          {/* -------------------------------------------------------------
              RECHERCHE + STATUT
              ------------------------------------------------------------- */}

          <CategoriesFilters
            filters={
              data.filters
            }
          />


          {/* -------------------------------------------------------------
              RÉSULTATS
              ------------------------------------------------------------- */}

          {hasCategories ? (
            <>
              {/* =========================================================
                  DESKTOP
                  ========================================================= */}

              <CategoriesTable
                categories={
                  data.categories
                }
                filters={
                  data.filters
                }
                pagination={
                  data.pagination
                }
              />


              {/* =========================================================
                  MOBILE / TABLETTE
                  ========================================================= */}

              <CategoriesMobileList
                categories={
                  data.categories
                }
                filters={
                  data.filters
                }
                pagination={
                  data.pagination
                }
              />
            </>
          ) : (
            /* ===========================================================
               ÉTAT VIDE
               =========================================================== */

            <CategoriesEmptyState
              filters={
                data.filters
              }
            />
          )}
        </section>
      </main>
    </div>
  );
}