import {
  Filter,
  Search,
} from "lucide-react";

import type {
  ManagerCategoriesFilters,
} from "@/lib/gestionnaire/categories/category-types";

import styles from "@/app/gestionnaire/(espace-prive)/categories/categories.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/categories/CategoriesFilters.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher les contrôles de filtrage de la liste des catégories :
 *
 * - recherche par nom ;
 * - filtre par statut ;
 * - soumission GET vers la page courante.
 *
 * PARAMÈTRES URL :
 *
 * q
 * status
 * page
 *
 * Exemples :
 *
 * /gestionnaire/categories?q=soins
 *
 * /gestionnaire/categories?status=active
 *
 * /gestionnaire/categories?q=soins&status=active
 *
 * IMPORTANT :
 *
 * - aucune requête Prisma ici ;
 * - aucune lecture de session ici ;
 * - aucune donnée métier calculée ici ;
 * - aucun storeId venant du navigateur ;
 * - aucun managerId venant du navigateur ;
 * - aucune création de catégorie ;
 * - aucune modification de catégorie ;
 * - aucune suppression de catégorie ;
 * - aucune fausse donnée.
 *
 * La validation définitive des paramètres reste effectuée côté serveur dans :
 *
 * src/lib/gestionnaire/categories/category-query.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface CategoriesFiltersProps {
  filters:
    ManagerCategoriesFilters;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const SEARCH_INPUT_ID =
  "categories-search";


const STATUS_SELECT_ID =
  "categories-status";


/* ==========================================================================
   HELPERS
   ========================================================================== */

function normalizeSearchValue(
  value:
    string,
): string {
  return value.trim();
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function CategoriesFilters({
  filters,
}: CategoriesFiltersProps) {
  const searchValue =
    normalizeSearchValue(
      filters.q,
    );


  return (
    <div
      className={
        styles.categoriesFilters
      }
    >
      <form
        method="get"
        className={
          styles.categoriesFiltersForm
        }
        role="search"
        aria-label="Rechercher et filtrer les catégories"
      >
        {/*
         * Toute nouvelle recherche repart volontairement à la première page.
         *
         * Cela évite par exemple de conserver :
         *
         * ?page=5
         *
         * après avoir appliqué un filtre ne contenant qu'une seule page.
         */}
        <input
          type="hidden"
          name="page"
          value="1"
        />


        {/* ===============================================================
            RECHERCHE
            =============================================================== */}

        <div
          className={
            styles.categoriesSearchField
          }
        >
          <label
            htmlFor={
              SEARCH_INPUT_ID
            }
            className={
              styles.categoriesFilterLabel
            }
          >
            Rechercher
          </label>


          <div
            className={
              styles.categoriesSearchControl
            }
          >
            <Search
              size={18}
              strokeWidth={1.8}
              className={
                styles.categoriesSearchIcon
              }
              aria-hidden="true"
            />


            <input
              id={
                SEARCH_INPUT_ID
              }
              type="search"
              name="q"
              defaultValue={
                searchValue
              }
              placeholder="Rechercher une catégorie..."
              className={
                styles.categoriesSearchInput
              }
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              aria-label="Rechercher une catégorie"
            />
          </div>
        </div>


        {/* ===============================================================
            STATUT
            =============================================================== */}

        <div
          className={
            styles.categoriesStatusField
          }
        >
          <label
            htmlFor={
              STATUS_SELECT_ID
            }
            className={
              styles.categoriesFilterLabel
            }
          >
            Statut
          </label>


          <div
            className={
              styles.categoriesStatusControl
            }
          >
            <Filter
              size={17}
              strokeWidth={1.8}
              className={
                styles.categoriesStatusIcon
              }
              aria-hidden="true"
            />


            <select
              id={
                STATUS_SELECT_ID
              }
              name="status"
              defaultValue={
                filters.status
              }
              className={
                styles.categoriesStatusSelect
              }
              aria-label="Filtrer les catégories par statut"
            >
              <option value="all">
                Tous les statuts
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>
          </div>
        </div>


        {/* ===============================================================
            SOUMISSION
            =============================================================== */}

        <div
          className={
            styles.categoriesFiltersActions
          }
        >
          <button
            type="submit"
            className={
              styles.categoriesFilterSubmit
            }
          >
            <Search
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Rechercher
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}