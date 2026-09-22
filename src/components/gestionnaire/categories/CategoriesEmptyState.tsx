import Link from "next/link";

import {
  FolderOpen,
  RotateCcw,
  SearchX,
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
 * src/components/gestionnaire/categories/CategoriesEmptyState.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher un état vide propre lorsque la liste des catégories ne contient
 * aucun résultat.
 *
 * CAS GÉRÉS :
 *
 * 1. aucune catégorie disponible ;
 * 2. aucune catégorie correspondant à une recherche ;
 * 3. aucune catégorie correspondant au filtre de statut ;
 * 4. recherche + filtre sans résultat.
 *
 * IMPORTANT :
 *
 * Ce composant ne doit jamais :
 *
 * - créer une catégorie ;
 * - proposer un bouton "Ajouter une catégorie" ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - effectuer une requête Prisma ;
 * - lire la session ;
 * - inventer des données ;
 * - afficher une erreur technique.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface CategoriesEmptyStateProps {
  filters:
    ManagerCategoriesFilters;
}


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const CATEGORIES_ROUTE =
  "/gestionnaire/categories";


/* ==========================================================================
   HELPERS — NORMALISATION
   ========================================================================== */

function normalizeText(
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
   TYPES INTERNES
   ========================================================================== */

interface EmptyStateContent {
  title:
    string;

  description:
    string;

  showReset:
    boolean;

  resetLabel:
    string;

  kind:
    "empty" |
    "filtered";
}


/* ==========================================================================
   CONTENU DE L'ÉTAT VIDE
   ========================================================================== */

function getEmptyStateContent(
  filters:
    ManagerCategoriesFilters,
): EmptyStateContent {
  const search =
    normalizeText(
      filters.q,
    );


  const hasSearch =
    search.length >
    0;


  const hasStatusFilter =
    filters.status !==
    "all";


  /* ------------------------------------------------------------------------
     RECHERCHE + STATUT
     ------------------------------------------------------------------------ */

  if (
    hasSearch &&
    hasStatusFilter
  ) {
    return {
      title:
        "Aucune catégorie trouvée",

      description:
        "Aucune catégorie ne correspond à votre recherche et au statut sélectionné.",

      showReset:
        true,

      resetLabel:
        "Réinitialiser les filtres",

      kind:
        "filtered",
    };
  }


  /* ------------------------------------------------------------------------
     RECHERCHE
     ------------------------------------------------------------------------ */

  if (
    hasSearch
  ) {
    return {
      title:
        "Aucun résultat",

      description:
        "Aucune catégorie ne correspond à votre recherche.",

      showReset:
        true,

      resetLabel:
        "Réinitialiser la recherche",

      kind:
        "filtered",
    };
  }


  /* ------------------------------------------------------------------------
     STATUT
     ------------------------------------------------------------------------ */

  if (
    hasStatusFilter
  ) {
    return {
      title:
        "Aucune catégorie trouvée",

      description:
        "Aucune catégorie ne correspond au statut sélectionné.",

      showReset:
        true,

      resetLabel:
        "Réinitialiser le filtre",

      kind:
        "filtered",
    };
  }


  /* ------------------------------------------------------------------------
     AUCUNE CATÉGORIE
     ------------------------------------------------------------------------ */

  return {
    title:
      "Aucune catégorie disponible",

    description:
      "Aucune catégorie n’est actuellement disponible.",

    showReset:
      false,

    resetLabel:
      "",

    kind:
      "empty",
  };
}


/* ==========================================================================
   ICÔNE
   ========================================================================== */

interface EmptyStateIconProps {
  kind:
    EmptyStateContent["kind"];
}


function EmptyStateIcon({
  kind,
}: EmptyStateIconProps) {
  return (
    <div
      className={
        styles.categoriesEmptyIcon
      }
      aria-hidden="true"
    >
      {kind ===
      "filtered" ? (
        <SearchX
          size={28}
          strokeWidth={1.7}
        />
      ) : (
        <FolderOpen
          size={28}
          strokeWidth={1.7}
        />
      )}
    </div>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function CategoriesEmptyState({
  filters,
}: CategoriesEmptyStateProps) {
  const content =
    getEmptyStateContent(
      filters,
    );


  return (
    <section
      className={
        styles.categoriesEmptyState
      }
      aria-labelledby="categories-empty-title"
      aria-describedby="categories-empty-description"
      aria-live="polite"
    >
      <div
        className={
          styles.categoriesEmptyContent
        }
      >
        {/* ===============================================================
            ICÔNE
            =============================================================== */}

        <EmptyStateIcon
          kind={
            content.kind
          }
        />


        {/* ===============================================================
            TEXTE
            =============================================================== */}

        <div
          className={
            styles.categoriesEmptyText
          }
        >
          <h2
            id="categories-empty-title"
            className={
              styles.categoriesEmptyTitle
            }
          >
            {content.title}
          </h2>


          <p
            id="categories-empty-description"
            className={
              styles.categoriesEmptyDescription
            }
          >
            {content.description}
          </p>
        </div>


        {/* ===============================================================
            RÉINITIALISATION
            =============================================================== */}

        {content.showReset ? (
          <Link
            href={
              CATEGORIES_ROUTE
            }
            className={
              styles.categoriesEmptyReset
            }
          >
            <RotateCcw
              size={16}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              {content.resetLabel}
            </span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}