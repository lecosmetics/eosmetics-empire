import {
  CheckCircle2,
  FolderOpen,
  PauseCircle,
  type LucideIcon,
} from "lucide-react";

import type {
  ManagerCategoriesKpis,
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
 * src/components/gestionnaire/categories/CategoriesKpiGrid.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher les trois indicateurs principaux de la page :
 *
 * - Total catégories ;
 * - Catégories actives ;
 * - Catégories inactives.
 *
 * IMPORTANT :
 *
 * Les valeurs proviennent exclusivement des données serveur retournées par :
 *
 * src/lib/gestionnaire/categories/category-query.ts
 *
 * Ce composant ne doit jamais :
 *
 * - écrire des statistiques en dur ;
 * - effectuer une requête Prisma ;
 * - lire la session ;
 * - recalculer les données métier ;
 * - créer une catégorie ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - inventer des valeurs.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface CategoriesKpiGridProps {
  kpis:
    ManagerCategoriesKpis;
}


/* ==========================================================================
   KPI CARD — TYPES
   ========================================================================== */

interface CategoryKpiCardProps {
  label:
    string;

  value:
    number;

  icon:
    LucideIcon;

  variant:
    "default" |
    "active" |
    "inactive";
}


/* ==========================================================================
   HELPERS
   ========================================================================== */

const NUMBER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function normalizeKpiValue(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


function formatKpiValue(
  value:
    number,
): string {
  return NUMBER_FORMATTER.format(
    normalizeKpiValue(
      value,
    ),
  );
}


/* ==========================================================================
   KPI CARD
   ========================================================================== */

function CategoryKpiCard({
  label,
  value,
  icon:
    Icon,
  variant,
}: CategoryKpiCardProps) {
  const normalizedValue =
    normalizeKpiValue(
      value,
    );


  const variantClassName =
    variant ===
    "active"
      ? styles.categoryKpiCardActive
      : variant ===
          "inactive"
        ? styles.categoryKpiCardInactive
        : styles.categoryKpiCardDefault;


  return (
    <article
      className={[
        styles.categoryKpiCard,
        variantClassName,
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      aria-label={`${label} : ${formatKpiValue(
        normalizedValue,
      )}`}
    >
      <div
        className={
          styles.categoryKpiCardBody
        }
      >
        <div
          className={
            styles.categoryKpiCardContent
          }
        >
          <p
            className={
              styles.categoryKpiCardLabel
            }
          >
            {label}
          </p>


          <p
            className={
              styles.categoryKpiCardValue
            }
          >
            {formatKpiValue(
              normalizedValue,
            )}
          </p>
        </div>


        <div
          className={
            styles.categoryKpiCardIcon
          }
          aria-hidden="true"
        >
          <Icon
            size={22}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </article>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function CategoriesKpiGrid({
  kpis,
}: CategoriesKpiGridProps) {
  return (
    <section
      className={
        styles.categoriesKpiGrid
      }
      aria-label="Statistiques des catégories"
    >
      <CategoryKpiCard
        label="Total catégories"
        value={
          kpis.total
        }
        icon={
          FolderOpen
        }
        variant="default"
      />


      <CategoryKpiCard
        label="Catégories actives"
        value={
          kpis.active
        }
        icon={
          CheckCircle2
        }
        variant="active"
      />


      <CategoryKpiCard
        label="Catégories inactives"
        value={
          kpis.inactive
        }
        icon={
          PauseCircle
        }
        variant="inactive"
      />
    </section>
  );
}