"use client";

import {
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG,
} from "@/config/public-home";

import type {
  PublicHomeProductFilter,
  PublicHomeProductFilterId,
  PublicHomeProductFiltersProps,
} from "@/lib/public/home/public-home-types";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — FILTRES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomeProductFilters.tsx
 *
 * ============================================================================
 *
 * RÔLE ACTUEL
 *
 * Conserver le composant de filtres produits existant sans casser :
 *
 * - les contrats TypeScript ;
 * - les imports existants ;
 * - l’architecture du projet ;
 * - une éventuelle réactivation future.
 *
 * ============================================================================
 *
 * ARCHITECTURE ACTUELLEMENT VALIDÉE
 *
 * La section :
 *
 * "Nos Produits Phares"
 *
 * affiche maintenant directement toutes les offres publiques valides.
 *
 * Les filtres :
 *
 * Tous
 * Visage
 * Corps
 * Cheveux
 * Gommes
 * Huiles
 * Savons
 *
 * ne doivent donc PLUS apparaître actuellement.
 *
 * ============================================================================
 *
 * SOURCE DE VÉRITÉ
 *
 * src/config/public-home.ts
 *
 * avec :
 *
 * filtersEnabled: false
 *
 * ============================================================================
 *
 * IMPORTANT
 *
 * Ce fichier reste volontairement présent.
 *
 * Il n’est pas supprimé brutalement parce qu’il peut encore être importé
 * ailleurs pendant la migration de la Home.
 *
 * Lorsque :
 *
 * filtersEnabled === false
 *
 * le composant retourne simplement :
 *
 * null
 *
 * ============================================================================
 *
 * SI LES FILTRES SONT RÉACTIVÉS PLUS TARD
 *
 * Le composant conservera son fonctionnement contrôlé :
 *
 * - le parent fournit activeFilterId ;
 * - le parent fournit onFilterChange ;
 * - aucun état métier n’est stocké ici ;
 * - aucun appel réseau ;
 * - aucune requête Prisma ;
 * - aucun filtre fictif ;
 * - aucun produit fictif.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const CONFIG =
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG;


/**
 * On élargit volontairement le littéral `false` vers `boolean`.
 *
 * Cela garde ce composant réutilisable si `filtersEnabled` passe un jour
 * à `true` dans public-home.ts.
 */
const FILTERS_ENABLED:
  boolean =
    CONFIG.filtersEnabled;


/* ==========================================================================
   2. ACCESSIBILITÉ
   ========================================================================== */

const FILTERS_ARIA_LABEL =
  `${CONFIG.title} — filtres produits`;


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
   4. VALIDATION D’UN IDENTIFIANT
   ========================================================================== */

/**
 * Aucun identifiant de filtre n’est inventé.
 *
 * Seuls les identifiants réellement présents dans :
 *
 * PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG.filters
 *
 * sont acceptés.
 */
function isKnownFilterId(
  filterId:
    string,
): filterId is PublicHomeProductFilterId {
  const normalizedFilterId =
    normalizeRequiredText(
      filterId,
    );


  if (
    normalizedFilterId.length ===
    0
  ) {
    return false;
  }


  return CONFIG.filters.some(
    (
      filter,
    ) =>
      filter.id ===
      normalizedFilterId,
  );
}


/* ==========================================================================
   5. VALIDATION D’UN FILTRE
   ========================================================================== */

function isRenderableFilter(
  filter:
    PublicHomeProductFilter,
): boolean {
  const id =
    normalizeRequiredText(
      filter.id,
    );


  const label =
    normalizeRequiredText(
      filter.label,
    );


  return Boolean(
    id &&
    label &&
    isKnownFilterId(
      id,
    ),
  );
}


/* ==========================================================================
   6. PRÉPARATION DES FILTRES
   ========================================================================== */

/**
 * Sécurise la liste sans créer de valeurs de secours.
 *
 * Si un filtre apparaît plusieurs fois, seule sa première occurrence
 * est conservée.
 */
function getUniqueRenderableFilters(
  filters:
    readonly PublicHomeProductFilter[],
): PublicHomeProductFilter[] {
  const seenFilterIds =
    new Set<
      PublicHomeProductFilterId
    >();


  const result:
    PublicHomeProductFilter[] =
      [];


  for (
    const filter
    of filters
  ) {
    if (
      !isRenderableFilter(
        filter,
      )
    ) {
      continue;
    }


    if (
      seenFilterIds.has(
        filter.id,
      )
    ) {
      continue;
    }


    seenFilterIds.add(
      filter.id,
    );


    result.push(
      filter,
    );
  }


  return result;
}


/* ==========================================================================
   7. VALIDATION DU FILTRE ACTIF
   ========================================================================== */

function getSafeActiveFilterId(
  activeFilterId:
    PublicHomeProductFilterId,
  filters:
    readonly PublicHomeProductFilter[],
):
  PublicHomeProductFilterId |
  null {
  if (
    filters.some(
      (
        filter,
      ) =>
        filter.id ===
        activeFilterId,
    )
  ) {
    return activeFilterId;
  }


  const defaultFilterId =
    CONFIG.defaultFilterId;


  if (
    filters.some(
      (
        filter,
      ) =>
        filter.id ===
        defaultFilterId,
    )
  ) {
    return defaultFilterId;
  }


  return (
    filters[0]
      ?.id ??
    null
  );
}


/* ==========================================================================
   8. CLASSE DU BOUTON
   ========================================================================== */

function getFilterButtonClassName(
  isActive:
    boolean,
): string {
  return [
    styles.productFilterButton,
    isActive
      ? styles.productFilterButtonActive
      : "",
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   9. PROPS D’UN BOUTON FILTRE
   ========================================================================== */

interface PublicHomeProductFilterButtonProps {
  readonly filter:
    PublicHomeProductFilter;

  readonly isActive:
    boolean;

  readonly onSelect:
    (
      filterId:
        PublicHomeProductFilterId,
    ) => void;
}


/* ==========================================================================
   10. BOUTON FILTRE
   ========================================================================== */

function PublicHomeProductFilterButton({
  filter,
  isActive,
  onSelect,
}: PublicHomeProductFilterButtonProps) {
  const label =
    normalizeRequiredText(
      filter.label,
    );


  const handleClick =
    () => {
      if (
        isActive
      ) {
        return;
      }


      onSelect(
        filter.id,
      );
    };


  return (
    <li
      className={
        styles.productFilterItem
      }
    >
      <button
        type="button"
        className={
          getFilterButtonClassName(
            isActive,
          )
        }
        aria-pressed={
          isActive
        }
        data-filter-id={
          filter.id
        }
        data-filter-active={
          isActive
            ? "true"
            : "false"
        }
        onClick={
          handleClick
        }
      >
        {
          label
        }
      </button>
    </li>
  );
}


/* ==========================================================================
   11. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicHomeProductFilters({
  filters,
  activeFilterId,
  onFilterChange,
}: PublicHomeProductFiltersProps) {
  /**
   * ========================================================================
   * ARCHITECTURE ACTUELLE
   * ========================================================================
   *
   * Les catégories de filtrage ne doivent actuellement pas apparaître.
   *
   * Cette décision provient exclusivement de :
   *
   * PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG.filtersEnabled
   *
   * Aucun CSS n’est utilisé pour cacher artificiellement une logique
   * toujours active.
   */
  if (
    !FILTERS_ENABLED
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     FILTRES VALIDES
     ------------------------------------------------------------------------ */

  const visibleFilters =
    getUniqueRenderableFilters(
      filters,
    );


  if (
    visibleFilters.length ===
    0
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     FILTRE ACTIF SÛR
     ------------------------------------------------------------------------ */

  const safeActiveFilterId =
    getSafeActiveFilterId(
      activeFilterId,
      visibleFilters,
    );


  if (
    safeActiveFilterId ===
    null
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     RENDU
     ------------------------------------------------------------------------ */

  return (
    <ul
      className={
        styles.productFilters
      }
      aria-label={
        FILTERS_ARIA_LABEL
      }
    >
      {visibleFilters.map(
        (
          filter,
        ) => (
          <PublicHomeProductFilterButton
            key={
              filter.id
            }
            filter={
              filter
            }
            isActive={
              filter.id ===
              safeActiveFilterId
            }
            onSelect={
              onFilterChange
            }
          />
        ),
      )}
    </ul>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ÉTAT ACTUEL
 *
 * public-home.ts :
 *
 * filtersEnabled: false
 *
 * Résultat :
 *
 * ce composant retourne `null`.
 *
 * ============================================================================
 *
 * POURQUOI LE FICHIER N’EST PAS SUPPRIMÉ
 *
 * Il reste disponible afin de :
 *
 * - préserver les imports existants ;
 * - préserver PublicHomeProductFiltersProps ;
 * - éviter une cassure pendant la migration ;
 * - permettre une réactivation future explicite.
 *
 * ============================================================================
 *
 * SECTION PRODUITS ACTUELLE
 *
 * Nos Produits Phares
 *
 * Desktop :
 *
 * [1][2][3][4][5]
 * [6][7][8][9][10]
 * [...]
 *
 * Mobile :
 *
 * [1][2]
 * [3][4]
 * [5][6]
 * [...]
 *
 * Aucun filtre n’est nécessaire pour rendre ces produits.
 *
 * ============================================================================
 *
 * SI LES FILTRES SONT RÉACTIVÉS
 *
 * Ce composant garantit :
 *
 * - vrais filtres de configuration uniquement ;
 * - aucune duplication ;
 * - bouton HTML natif ;
 * - type="button" ;
 * - aria-pressed ;
 * - composant contrôlé ;
 * - aucun useEffect ;
 * - aucun appel réseau ;
 * - aucune requête Prisma ;
 * - aucune route inventée ;
 * - aucun produit inventé.
 *
 * ============================================================================
 */