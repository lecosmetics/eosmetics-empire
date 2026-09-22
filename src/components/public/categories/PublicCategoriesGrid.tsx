import {
  PUBLIC_CATEGORIES_CATALOG_CONFIG,
  PUBLIC_CATEGORIES_EMPTY_STATE_CONFIG,
} from "@/config/public-categories";

import type {
  PublicCategoriesGridProps,
} from "@/lib/public/categories/public-categories-types";

import PublicCategoryCard from "./PublicCategoryCard";

import styles from "./public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CATÉGORIES PUBLIQUES — GRILLE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/categories/PublicCategoriesGrid.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher toutes les catégories publiques réellement retournées par :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * ARCHITECTURE
 *
 * Toutes nos catégories                           12 catégories
 *
 * ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
 * │ catégorie  │ │ catégorie  │ │ catégorie  │ │ catégorie  │ │ catégorie  │
 * └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘
 *
 * ┌────────────┐ ┌────────────┐ ...
 *
 * ============================================================================
 *
 * RESPONSIVE
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
 * IMPORTANT :
 *
 * Le nombre de colonnes appartient uniquement au CSS :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * Ce composant ne crée :
 *
 * - aucun carousel ;
 * - aucun scroll horizontal ;
 * - aucune pagination artificielle ;
 * - aucune catégorie fictive ;
 * - aucun compteur fictif.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const CATALOG_CONFIG =
  PUBLIC_CATEGORIES_CATALOG_CONFIG;


const EMPTY_STATE_CONFIG =
  PUBLIC_CATEGORIES_EMPTY_STATE_CONFIG;


/* ==========================================================================
   2. IDENTIFIANTS ACCESSIBILITÉ
   ========================================================================== */

const SECTION_TITLE_ID =
  `${CATALOG_CONFIG.sectionId}-title`;


const SECTION_COUNT_ID =
  `${CATALOG_CONFIG.sectionId}-count`;


/* ==========================================================================
   3. FORMAT DU NOMBRE DE CATÉGORIES
   ========================================================================== */

/**
 * Exemples :
 *
 * 0 catégories
 * 1 catégorie
 * 12 catégories
 *
 * Le nombre provient exclusivement du tableau réel reçu en props.
 */
function formatCategoryCount(
  count:
    number,
): string {
  const normalizedCount =
    Number.isFinite(
      count,
    ) &&
    count >
      0
      ? Math.floor(
          count,
        )
      : 0;


  const label =
    normalizedCount ===
      1
      ? CATALOG_CONFIG
          .countLabels
          .singular
      : CATALOG_CONFIG
          .countLabels
          .plural;


  return `${normalizedCount} ${label}`;
}


/* ==========================================================================
   4. ÉTAT VIDE
   ========================================================================== */

function PublicCategoriesEmptyState() {
  return (
    <div
      className={
        styles.categoriesEmptyState
      }
      role="status"
    >
      <div
        className={
          styles.categoriesEmptyStateContent
        }
      >
        <h3
          className={
            styles.categoriesEmptyStateTitle
          }
        >
          {
            EMPTY_STATE_CONFIG.title
          }
        </h3>


        <p
          className={
            styles.categoriesEmptyStateDescription
          }
        >
          {
            EMPTY_STATE_CONFIG.description
          }
        </p>
      </div>
    </div>
  );
}


/* ==========================================================================
   5. HEADER DE SECTION
   ========================================================================== */

interface CategoriesSectionHeaderProps {
  readonly categoryCount:
    number;
}


function CategoriesSectionHeader({
  categoryCount,
}: CategoriesSectionHeaderProps) {
  const categoryCountLabel =
    formatCategoryCount(
      categoryCount,
    );


  return (
    <header
      className={
        styles.categoriesGridHeader
      }
    >
      {/* =================================================================
          TITRE
          ================================================================= */}

      <div
        className={
          styles.categoriesGridHeading
        }
      >
        <h2
          id={
            SECTION_TITLE_ID
          }
          className={
            styles.categoriesGridTitle
          }
        >
          {
            CATALOG_CONFIG.title
          }
        </h2>


        <span
          className={
            styles.categoriesGridTitleUnderline
          }
          aria-hidden="true"
        />
      </div>


      {/* =================================================================
          COMPTEUR
          ================================================================= */}

      {CATALOG_CONFIG.showCategoryCount ? (
        <p
          id={
            SECTION_COUNT_ID
          }
          className={
            styles.categoriesGridCount
          }
          aria-label={
            categoryCountLabel
          }
        >
          {
            categoryCountLabel
          }
        </p>
      ) : null}
    </header>
  );
}


/* ==========================================================================
   6. LISTE DES CARTES
   ========================================================================== */

function CategoriesCards({
  categories,
}: PublicCategoriesGridProps) {
  return (
    <ul
      className={
        styles.categoriesGrid
      }
      aria-label="Liste des catégories"
    >
      {categories.map(
        (
          category,
          index,
        ) => (
          <li
            key={
              category.id
            }
            className={
              styles.categoriesGridItem
            }
          >
            <PublicCategoryCard
              category={
                category
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
   7. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoriesGrid({
  categories,
}: PublicCategoriesGridProps) {
  /**
   * Le tableau reçu est déjà :
   *
   * - validé ;
   * - normalisé ;
   * - filtré ;
   * - sérialisé ;
   *
   * par la couche serveur.
   *
   * On ne refait donc aucune logique métier ici.
   */
  const categoryCount =
    categories.length;


  const hasCategories =
    categoryCount >
    0;


  return (
    <section
      id={
        CATALOG_CONFIG.sectionId
      }
      className={
        styles.categoriesGridSection
      }
      aria-labelledby={
        SECTION_TITLE_ID
      }
      aria-describedby={
        CATALOG_CONFIG.showCategoryCount
          ? SECTION_COUNT_ID
          : undefined
      }
    >
      <div
        className={
          styles.categoriesGridInner
        }
      >
        {/* =================================================================
            HEADER
            ================================================================= */}

        <CategoriesSectionHeader
          categoryCount={
            categoryCount
          }
        />


        {/* =================================================================
            CONTENU
            ================================================================= */}

        {hasCategories ? (
          <CategoriesCards
            categories={
              categories
            }
          />
        ) : (
          <PublicCategoriesEmptyState />
        )}
      </div>
    </section>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * SOURCE DES DONNÉES
 *
 * La grille reçoit :
 *
 * PublicCategoryCardData[]
 *
 * préparé par :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * AUCUNE REQUÊTE PRISMA
 *
 * Le composant n’accède pas :
 *
 * - à PostgreSQL ;
 * - à Prisma ;
 * - aux StoreProduct ;
 * - aux Store ;
 * - à une session.
 *
 * ============================================================================
 *
 * COMPTEUR GLOBAL
 *
 * Le nombre affiché est :
 *
 * categories.length
 *
 * donc le nombre exact de catégories réellement rendues.
 *
 * ============================================================================
 *
 * CARTES
 *
 * Chaque élément est envoyé à :
 *
 * src/components/public/categories/PublicCategoryCard.tsx
 *
 * ============================================================================
 *
 * PRIORITÉ IMAGE
 *
 * Les cinq premières cartes utilisent :
 *
 * imagePriority = true
 *
 * car elles constituent normalement la première ligne desktop.
 *
 * Les autres utilisent le chargement standard de Next Image.
 *
 * ============================================================================
 *
 * GRILLE
 *
 * Desktop :
 *
 * [ 1 ][ 2 ][ 3 ][ 4 ][ 5 ]
 * [ 6 ][ 7 ][ 8 ][ 9 ][10 ]
 *
 * Mobile :
 *
 * [ 1 ][ 2 ]
 * [ 3 ][ 4 ]
 * [ 5 ][ 6 ]
 *
 * Le nombre de lignes dépend uniquement du nombre réel de catégories.
 *
 * ============================================================================
 *
 * ÉTAT VIDE
 *
 * Si aucune catégorie n’est retournée :
 *
 * - aucune fausse carte ;
 * - aucun skeleton permanent ;
 * - aucun contenu de démonstration.
 *
 * Seul l’état neutre configuré dans :
 *
 * src/config/public-categories.ts
 *
 * est affiché.
 *
 * ============================================================================
 */