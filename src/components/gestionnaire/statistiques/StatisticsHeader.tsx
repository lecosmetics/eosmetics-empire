"use client";

import {
  useTransition,
  type ChangeEvent,
} from "react";

import {
  CalendarDays,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  MANAGER_STATISTICS_PERIOD_PRESETS,
  MANAGER_STATISTICS_ROUTE,
  getManagerStatisticsPeriodLabel,
  isManagerStatisticsPeriodPreset,
  type ManagerStatisticsFilters,
  type ManagerStatisticsPeriodPreset,
} from "@/lib/gestionnaire/statistiques/statistics-types";

import styles from "@/app/gestionnaire/(espace-prive)/statistiques/statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — HEADER
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/statistiques/StatisticsHeader.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher le fil d'Ariane ;
 * - afficher le titre de la page ;
 * - afficher le sous-titre ;
 * - afficher le sélecteur de période ;
 * - permettre une période prédéfinie ;
 * - permettre une période personnalisée ;
 * - synchroniser la période avec les searchParams ;
 * - déclencher une nouvelle lecture serveur après changement.
 *
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne lit aucune donnée métier ;
 * - ne fait aucune requête Prisma ;
 * - ne lit aucun storeId ;
 * - ne lit aucun managerId ;
 * - ne calcule aucun KPI ;
 * - ne contient aucune donnée de démonstration ;
 * - ne crée aucune nouvelle route ;
 * - ne recrée pas le Header global du Gestionnaire.
 *
 *
 * La page serveur reste responsable de :
 *
 * searchParams
 *      ↓
 * statistics-query.ts
 *      ↓
 * vraies statistiques
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface StatisticsHeaderProps {
  readonly filters:
    ManagerStatisticsFilters;
}


/* ==========================================================================
   SEARCH PARAMS
   ========================================================================== */

/**
 * Construit uniquement les paramètres officiellement utilisés
 * par la page Statistiques :
 *
 * - preset
 * - from
 * - to
 *
 * Aucun storeId / managerId n'est jamais envoyé dans l'URL.
 */

function buildStatisticsHref({
  preset,
  from,
  to,
}: ManagerStatisticsFilters): string {
  const params =
    new URLSearchParams();


  params.set(
    "preset",
    preset,
  );


  /**
   * On conserve from / to dans l'URL pour que :
   *
   * - la période soit lisible ;
   * - un refresh conserve la période ;
   * - le serveur dispose toujours des dates réellement résolues ;
   * - une période personnalisée puisse être partagée.
   */

  if (
    from
  ) {
    params.set(
      "from",
      from,
    );
  }


  if (
    to
  ) {
    params.set(
      "to",
      to,
    );
  }


  const query =
    params.toString();


  return query
    ? `${MANAGER_STATISTICS_ROUTE}?${query}`
    : MANAGER_STATISTICS_ROUTE;
}


/* ==========================================================================
   NORMALISATION DATE
   ========================================================================== */

function normalizeDateInput(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized,
    )
  ) {
    return "";
  }


  return normalized;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StatisticsHeader({
  filters,
}: StatisticsHeaderProps) {
  const router =
    useRouter();


  const [
    isNavigating,
    startNavigation,
  ] =
    useTransition();


  /* =========================================================================
     NAVIGATION
     ========================================================================= */

  function navigate(
    nextFilters:
      ManagerStatisticsFilters,
  ): void {
    const href =
      buildStatisticsHref(
        nextFilters,
      );


    startNavigation(
      () => {
        router.push(
          href,
          {
            scroll:
              false,
          },
        );
      },
    );
  }


  /* =========================================================================
     PRESET
     ========================================================================= */

  function handlePresetChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const value =
      event.currentTarget.value;


    if (
      !isManagerStatisticsPeriodPreset(
        value,
      )
    ) {
      return;
    }


    const preset:
      ManagerStatisticsPeriodPreset =
        value;


    /**
     * Pour une période personnalisée, on conserve les dates
     * actuellement calculées par le serveur comme point de départ.
     *
     * Pour les presets automatiques, statistics-query.ts recalculera
     * lui-même la vraie période.
     */

    navigate({
      preset,

      from:
        filters.from,

      to:
        filters.to,
    });
  }


  /* =========================================================================
     CUSTOM — FROM
     ========================================================================= */

  function handleFromChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const nextFrom =
      normalizeDateInput(
        event.currentTarget.value,
      );


    if (
      !nextFrom
    ) {
      return;
    }


    /**
     * Si la nouvelle date de début dépasse la date de fin,
     * on aligne la date de fin sur la nouvelle date.
     *
     * Cela évite d'envoyer volontairement une plage invalide.
     */

    const nextTo =
      filters.to &&
      nextFrom >
        filters.to
        ? nextFrom
        : filters.to;


    navigate({
      preset:
        "custom",

      from:
        nextFrom,

      to:
        nextTo,
    });
  }


  /* =========================================================================
     CUSTOM — TO
     ========================================================================= */

  function handleToChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ): void {
    const nextTo =
      normalizeDateInput(
        event.currentTarget.value,
      );


    if (
      !nextTo
    ) {
      return;
    }


    /**
     * Même protection dans l'autre sens :
     *
     * si "to" devient antérieur à "from",
     * la période commence à cette nouvelle date.
     */

    const nextFrom =
      filters.from &&
      nextTo <
        filters.from
        ? nextTo
        : filters.from;


    navigate({
      preset:
        "custom",

      from:
        nextFrom,

      to:
        nextTo,
    });
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <header className={styles.statisticsHeader}>
      {/* ==================================================================
          BREADCRUMB
          ================================================================== */}

      <nav
        className={styles.statisticsBreadcrumb}
        aria-label="Fil d’Ariane"
      >
        <span
          className={styles.statisticsBreadcrumbRoot}
          aria-hidden="true"
        >
          Tableau de bord
        </span>


        <ChevronRight
          size={14}
          strokeWidth={1.9}
          className={styles.statisticsBreadcrumbSeparator}
          aria-hidden="true"
        />


        <span
          className={styles.statisticsBreadcrumbCurrent}
          aria-current="page"
        >
          Statistiques
        </span>
      </nav>


      {/* ==================================================================
          MAIN HEADER
          ================================================================== */}

      <div className={styles.statisticsHeaderMain}>
        {/* ================================================================
            TITLE
            ================================================================ */}

        <div className={styles.statisticsHeaderCopy}>
          <h1 className={styles.statisticsTitle}>
            Statistiques
          </h1>


          <p className={styles.statisticsSubtitle}>
            Visualisez la performance de votre boutique en temps réel.
          </p>
        </div>


        {/* ================================================================
            PERIOD
            ================================================================ */}

        <div
          className={styles.statisticsPeriodPanel}
          aria-busy={isNavigating}
        >
          <div className={styles.statisticsPeriodIcon}>
            {isNavigating ? (
              <LoaderCircle
                size={18}
                strokeWidth={1.9}
                className={styles.statisticsSpinner}
                aria-hidden="true"
              />
            ) : (
              <CalendarDays
                size={18}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            )}
          </div>


          {/* ==============================================================
              PRESET
              ============================================================== */}

          <div className={styles.statisticsPeriodPreset}>
            <label
              htmlFor="statistics-period-preset"
              className={styles.statisticsVisuallyHidden}
            >
              Période des statistiques
            </label>


            <select
              id="statistics-period-preset"
              value={filters.preset}
              onChange={handlePresetChange}
              disabled={isNavigating}
              className={styles.statisticsPeriodSelect}
              aria-label="Sélectionner une période"
            >
              {MANAGER_STATISTICS_PERIOD_PRESETS.map(
                (
                  preset,
                ) => (
                  <option
                    key={preset}
                    value={preset}
                  >
                    {getManagerStatisticsPeriodLabel(
                      preset,
                    )}
                  </option>
                ),
              )}
            </select>
          </div>


          {/* ==============================================================
              DATE RANGE
              ============================================================== */}

          <div className={styles.statisticsPeriodDates}>
            <div className={styles.statisticsPeriodDateField}>
              <label
                htmlFor="statistics-date-from"
                className={styles.statisticsVisuallyHidden}
              >
                Date de début
              </label>


              <input
                id="statistics-date-from"
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={handleFromChange}
                disabled={isNavigating}
                className={styles.statisticsPeriodDateInput}
                aria-label="Date de début des statistiques"
              />
            </div>


            <span
              className={styles.statisticsPeriodDateSeparator}
              aria-hidden="true"
            >
              —
            </span>


            <div className={styles.statisticsPeriodDateField}>
              <label
                htmlFor="statistics-date-to"
                className={styles.statisticsVisuallyHidden}
              >
                Date de fin
              </label>


              <input
                id="statistics-date-to"
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={handleToChange}
                disabled={isNavigating}
                className={styles.statisticsPeriodDateInput}
                aria-label="Date de fin des statistiques"
              />
            </div>
          </div>
        </div>
      </div>


      {/* ==================================================================
          NAVIGATION STATUS — ACCESSIBILITY
          ================================================================== */}

      <span
        className={styles.statisticsVisuallyHidden}
        aria-live="polite"
      >
        {isNavigating
          ? "Actualisation des statistiques selon la période sélectionnée."
          : ""}
      </span>
    </header>
  );
}