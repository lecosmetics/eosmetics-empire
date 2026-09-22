"use client";

import {
  CalendarDays,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useState,
  useTransition,
} from "react";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

import {
  routes,
} from "@/config/routes";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD PERIOD FILTER
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/DashboardPeriodFilter.tsx

   RESPONSABILITÉS :

   - afficher la période active ;
   - proposer les périodes prédéfinies ;
   - permettre une période personnalisée ;
   - stocker la période dans l'URL ;
   - conserver les autres search params ;
   - demander un nouveau rendu serveur ;
   - ne jamais calculer les statistiques côté client.

   EXEMPLES :

   /gestionnaire/dashboard?period=today

   /gestionnaire/dashboard?period=last30Days

   /gestionnaire/dashboard
     ?period=custom
     &from=2026-09-01
     &to=2026-09-30

   IMPORTANT :

   Le serveur reste la source de vérité.

   Ce composant ne reçoit :
   - aucun storeId ;
   - aucun managerId ;
   - aucune donnée sensible.
   ============================================================ */


/* ============================================================
   PERIOD PRESETS
   ============================================================ */

export type DashboardPeriodPreset =
  | "today"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "previousMonth"
  | "thisYear"
  | "custom";


/* ============================================================
   PERIOD VALUE
   ------------------------------------------------------------
   Structure minimale transmise par dashboard/page.tsx.

   Elle correspond au résultat public calculé par :

   server/gestionnaire/dashboard/dashboard.ts
   ============================================================ */

export type DashboardPeriodFilterValue =
  Readonly<{
    preset:
      DashboardPeriodPreset;

    from:
      string;

    to:
      string;

    label:
      string;
  }>;


/* ============================================================
   PROPS
   ============================================================ */

type DashboardPeriodFilterProps =
  Readonly<{
    period:
      DashboardPeriodFilterValue;
  }>;


/* ============================================================
   OPTIONS
   ============================================================ */

const PERIOD_OPTIONS:
  readonly Readonly<{
    value:
      DashboardPeriodPreset;

    label:
      string;
  }>[] = [
  {
    value:
      "today",

    label:
      "Aujourd’hui",
  },

  {
    value:
      "last7Days",

    label:
      "7 derniers jours",
  },

  {
    value:
      "last30Days",

    label:
      "30 derniers jours",
  },

  {
    value:
      "thisMonth",

    label:
      "Ce mois",
  },

  {
    value:
      "previousMonth",

    label:
      "Mois précédent",
  },

  {
    value:
      "thisYear",

    label:
      "Cette année",
  },

  {
    value:
      "custom",

    label:
      "Période personnalisée",
  },
];


/* ============================================================
   CUSTOM PERIOD LIMIT
   ------------------------------------------------------------
   Doit rester cohérent avec le service Dashboard.
   ============================================================ */

const MAX_CUSTOM_PERIOD_DAYS =
  366;


const DAY_MS =
  24 * 60 * 60 * 1000;


/* ============================================================
   ISO DATE VALIDATION
   ============================================================ */

function isValidIsoDate(
  value:
    string,
): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }


  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);


  if (
    !year ||
    !month ||
    !day
  ) {
    return false;
  }


  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    );


  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
}


/* ============================================================
   ISO DATE → UTC TIMESTAMP
   ============================================================ */

function isoDateToUtcTimestamp(
  value:
    string,
): number {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);


  return Date.UTC(
    year,
    month - 1,
    day,
  );
}


/* ============================================================
   VALIDATE CUSTOM RANGE
   ============================================================ */

function validateCustomRange(
  from:
    string,

  to:
    string,
): string | null {
  if (
    !from ||
    !to
  ) {
    return (
      "Veuillez sélectionner une date de début et une date de fin."
    );
  }


  if (
    !isValidIsoDate(
      from,
    ) ||
    !isValidIsoDate(
      to,
    )
  ) {
    return (
      "La période sélectionnée n’est pas valide."
    );
  }


  const fromTime =
    isoDateToUtcTimestamp(
      from,
    );


  const toTime =
    isoDateToUtcTimestamp(
      to,
    );


  if (
    toTime <
    fromTime
  ) {
    return (
      "La date de fin doit être postérieure ou égale à la date de début."
    );
  }


  const numberOfDays =
    Math.floor(
      (
        toTime -
        fromTime
      ) /
        DAY_MS,
    ) +
    1;


  if (
    numberOfDays >
    MAX_CUSTOM_PERIOD_DAYS
  ) {
    return (
      `La période personnalisée ne peut pas dépasser ${MAX_CUSTOM_PERIOD_DAYS} jours.`
    );
  }


  return null;
}


/* ============================================================
   READ FORMDATA STRING
   ============================================================ */

function readFormString(
  formData:
    FormData,

  name:
    string,
): string {
  const value =
    formData.get(
      name,
    );


  return typeof value ===
    "string"
    ? value.trim()
    : "";
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardPeriodFilter({
  period,
}: DashboardPeriodFilterProps) {
  const router =
    useRouter();


  const searchParams =
    useSearchParams();


  const [
    isPending,
    startTransition,
  ] =
    useTransition();


  const [
    customError,
    setCustomError,
  ] =
    useState<
      string | null
    >(
      null,
    );


  /* ==========================================================
     NAVIGATE WITH SEARCH PARAMS
     ----------------------------------------------------------
     Tous les paramètres déjà présents sont conservés.

     Exemple futur :

     metric=revenue

     ne sera pas supprimé lorsqu'on change de période.
     ========================================================== */

  function navigateWithParams(
    params:
      URLSearchParams,
  ): void {
    const query =
      params.toString();


    const href =
      query
        ? `${routes.gestionnaire.dashboard}?${query}`
        : routes
            .gestionnaire
            .dashboard;


    startTransition(
      () => {
        router.replace(
          href,
          {
            scroll:
              false,
          },
        );
      },
    );
  }


  /* ==========================================================
     PRESET CHANGE
     ========================================================== */

  function handlePresetChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const nextPreset =
      event
        .target
        .value as
        DashboardPeriodPreset;


    setCustomError(
      null,
    );


    const params =
      new URLSearchParams(
        searchParams.toString(),
      );


    /* --------------------------------------------------------
       CUSTOM
       --------------------------------------------------------
       Lorsqu'on ouvre le mode personnalisé, on conserve d'abord
       les dates de la période actuellement affichée.

       L'utilisateur pourra ensuite les modifier puis appliquer.
       -------------------------------------------------------- */

    if (
      nextPreset ===
      "custom"
    ) {
      params.set(
        "period",
        "custom",
      );


      params.set(
        "from",
        period.from,
      );


      params.set(
        "to",
        period.to,
      );


      navigateWithParams(
        params,
      );


      return;
    }


    /* --------------------------------------------------------
       PREDEFINED PERIOD
       --------------------------------------------------------
       Pour un preset, aucune date envoyée par le navigateur
       n'est nécessaire.

       Le serveur calcule lui-même les vraies bornes.
       -------------------------------------------------------- */

    params.set(
      "period",
      nextPreset,
    );


    params.delete(
      "from",
    );


    params.delete(
      "to",
    );


    navigateWithParams(
      params,
    );
  }


  /* ==========================================================
     CUSTOM PERIOD SUBMIT
     ========================================================== */

  function handleCustomPeriodSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();


    if (
      isPending
    ) {
      return;
    }


    const formData =
      new FormData(
        event.currentTarget,
      );


    const from =
      readFormString(
        formData,
        "from",
      );


    const to =
      readFormString(
        formData,
        "to",
      );


    const validationError =
      validateCustomRange(
        from,
        to,
      );


    if (
      validationError
    ) {
      setCustomError(
        validationError,
      );


      return;
    }


    setCustomError(
      null,
    );


    const params =
      new URLSearchParams(
        searchParams.toString(),
      );


    params.set(
      "period",
      "custom",
    );


    params.set(
      "from",
      from,
    );


    params.set(
      "to",
      to,
    );


    navigateWithParams(
      params,
    );
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className="gestionnaire-dashboard-period"
      aria-busy={
        isPending
      }
    >
      {/* ======================================================
          MAIN PERIOD CONTROL
          ====================================================== */}

      <div
        className={[
          "gestionnaire-dashboard-period__control",

          isPending
            ? "gestionnaire-dashboard-period__control--pending"
            : "",
        ]
          .filter(
            Boolean,
          )
          .join(
            " ",
          )}
      >
        {/* ----------------------------------------------------
            CALENDAR
            ---------------------------------------------------- */}

        <span
          className="gestionnaire-dashboard-period__icon"
          aria-hidden="true"
        >
          {isPending ? (
            <LoaderCircle
              size={19}
              strokeWidth={1.8}
              className="gestionnaire-dashboard-period__loader"
            />
          ) : (
            <CalendarDays
              size={19}
              strokeWidth={1.8}
            />
          )}
        </span>


        {/* ----------------------------------------------------
            VISIBLE ACTIVE PERIOD
            ---------------------------------------------------- */}

        <div
          className="gestionnaire-dashboard-period__content"
          aria-hidden="true"
        >
          <span
            className="gestionnaire-dashboard-period__label"
          >
            Période
          </span>

          <span
            className="gestionnaire-dashboard-period__value"
          >
            {period.label}
          </span>
        </div>


        {/* ----------------------------------------------------
            CHEVRON
            ---------------------------------------------------- */}

        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className="gestionnaire-dashboard-period__chevron"
          aria-hidden="true"
        />


        {/* ----------------------------------------------------
            ACCESSIBLE NATIVE SELECT
            ----------------------------------------------------
            Le select couvre le contrôle visuel.

            On conserve donc :
            - accessibilité native ;
            - clavier ;
            - navigation ;
            - sélection mobile native.
            ---------------------------------------------------- */}

        <label
          htmlFor="gestionnaire-dashboard-period-select"
          className="gestionnaire-dashboard-period__sr-only"
        >
          Sélectionner la période du tableau de bord
        </label>

        <select
          id="gestionnaire-dashboard-period-select"
          className="gestionnaire-dashboard-period__select"
          value={
            period.preset
          }
          onChange={
            handlePresetChange
          }
          disabled={
            isPending
          }
          aria-label="Sélectionner la période du tableau de bord"
        >
          {PERIOD_OPTIONS.map(
            (
              option,
            ) => (
              <option
                key={
                  option.value
                }
                value={
                  option.value
                }
              >
                {
                  option.label
                }
              </option>
            ),
          )}
        </select>
      </div>


      {/* ======================================================
          CUSTOM PERIOD
          ------------------------------------------------------
          Visible uniquement lorsque le serveur confirme que
          la période active est "custom".
          ====================================================== */}

      {period.preset ===
      "custom" ? (
        <form
          className="gestionnaire-dashboard-period__custom"
          onSubmit={
            handleCustomPeriodSubmit
          }
        >
          {/* --------------------------------------------------
              FROM
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard-period__date-field"
          >
            <label
              htmlFor="gestionnaire-dashboard-period-from"
              className="gestionnaire-dashboard-period__date-label"
            >
              Du
            </label>

            <input
              id="gestionnaire-dashboard-period-from"
              name="from"
              type="date"
              className="gestionnaire-dashboard-period__date-input"
              defaultValue={
                period.from
              }
              disabled={
                isPending
              }
              required
            />
          </div>


          {/* --------------------------------------------------
              TO
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard-period__date-field"
          >
            <label
              htmlFor="gestionnaire-dashboard-period-to"
              className="gestionnaire-dashboard-period__date-label"
            >
              Au
            </label>

            <input
              id="gestionnaire-dashboard-period-to"
              name="to"
              type="date"
              className="gestionnaire-dashboard-period__date-input"
              defaultValue={
                period.to
              }
              disabled={
                isPending
              }
              required
            />
          </div>


          {/* --------------------------------------------------
              APPLY
              -------------------------------------------------- */}

          <button
            type="submit"
            className="gestionnaire-dashboard-period__apply"
            disabled={
              isPending
            }
          >
            {isPending
              ? "Actualisation..."
              : "Appliquer"}
          </button>


          {/* --------------------------------------------------
              CUSTOM ERROR
              -------------------------------------------------- */}

          {customError ? (
            <p
              className="gestionnaire-dashboard-period__error"
              role="alert"
            >
              {customError}
            </p>
          ) : null}
        </form>
      ) : null}


      {/* ======================================================
          SCREEN READER STATUS
          ====================================================== */}

      <span
        className="gestionnaire-dashboard-period__sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isPending
          ? "Actualisation des données du tableau de bord."
          : ""}
      </span>
    </div>
  );
}