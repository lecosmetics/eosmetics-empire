import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgePercent,
  ChartNoAxesCombined,
  ChevronRight,
  CircleGauge,
  PackagePlus,
  ShoppingCart,
  Warehouse,
} from "lucide-react";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  routes,
} from "@/config/routes";

import type {
  DashboardPerformance,
} from "@/server/gestionnaire/dashboard/dashboard";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD PERFORMANCE + QUICK ACTIONS
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/
   DashboardPerformanceQuickActions.tsx

   RESPONSABILITÉS :

   - afficher la performance dynamique de la boutique ;
   - ne jamais afficher un message positif si les ventes baissent ;
   - afficher un état neutre si l'activité est stable ;
   - afficher un état propre si les données sont insuffisantes ;
   - proposer uniquement les raccourcis prévus par le Dashboard ;
   - utiliser la configuration centrale des routes.

   IMPORTANT :

   Ce composant :
   - ne fait aucune requête Prisma ;
   - ne calcule pas le chiffre d'affaires ;
   - ne reçoit aucun storeId ;
   - ne reçoit aucun managerId ;
   - ne contient aucun faux pourcentage ;
   - utilise uniquement le résultat calculé côté serveur.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type DashboardPerformanceQuickActionsProps =
  Readonly<{
    performance:
      DashboardPerformance;
  }>;


/* ============================================================
   PERFORMANCE DISPLAY
   ============================================================ */

type PerformanceDisplay =
  Readonly<{
    title:
      string;

    message:
      string;

    tone:
      "positive" |
      "negative" |
      "stable" |
      "neutral";

    icon:
      ReactNode;
  }>;


/* ============================================================
   QUICK ACTION
   ============================================================ */

type QuickAction =
  Readonly<{
    label:
      string;

    href:
      string;

    icon:
      ReactNode;
  }>;


/* ============================================================
   PERCENT FORMATTER
   ============================================================ */

const PERCENT_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        1,
    },
  );


/* ============================================================
   FORMAT PERCENT
   ============================================================ */

function formatPercent(
  value:
    number,
): string {
  return PERCENT_FORMATTER.format(
    Math.abs(
      value,
    ),
  );
}


/* ============================================================
   BUILD PERFORMANCE CONTENT
   ------------------------------------------------------------
   La décision growth / stable / decline / insufficient est déjà
   réalisée dans dashboard.ts.

   Ce composant ne fait que traduire cet état en présentation.
   ============================================================ */

function getPerformanceDisplay(
  performance:
    DashboardPerformance,
): PerformanceDisplay {
  /* ----------------------------------------------------------
     GROWTH
     ---------------------------------------------------------- */

  if (
    performance.state ===
    "growth"
  ) {
    if (
      performance.changePercent ===
      null
    ) {
      return {
        title:
          "Bonne performance !",

        message:
          "Vos ventes progressent par rapport à la période précédente.",

        tone:
          "positive",

        icon: (
          <ArrowUpRight
            size={23}
            strokeWidth={1.9}
          />
        ),
      };
    }


    return {
      title:
        "Bonne performance !",

      message:
        `Vos ventes ont augmenté de ${formatPercent(
          performance.changePercent,
        )} % par rapport à la période précédente.`,

      tone:
        "positive",

      icon: (
        <ArrowUpRight
          size={23}
          strokeWidth={1.9}
        />
      ),
    };
  }


  /* ----------------------------------------------------------
     DECLINE
     ---------------------------------------------------------- */

  if (
    performance.state ===
    "decline"
  ) {
    return {
      title:
        "Ventes en baisse",

      message:
        performance.changePercent !==
        null
          ? `Vos ventes ont diminué de ${formatPercent(
              performance.changePercent,
            )} % par rapport à la période précédente.`
          : "Vos ventes ont diminué par rapport à la période précédente.",

      tone:
        "negative",

      icon: (
        <ArrowDownRight
          size={23}
          strokeWidth={1.9}
        />
      ),
    };
  }


  /* ----------------------------------------------------------
     STABLE
     ---------------------------------------------------------- */

  if (
    performance.state ===
    "stable"
  ) {
    return {
      title:
        "Activité stable",

      message:
        "Vos ventes restent proches de la période précédente.",

      tone:
        "stable",

      icon: (
        <CircleGauge
          size={23}
          strokeWidth={1.8}
        />
      ),
    };
  }


  /* ----------------------------------------------------------
     INSUFFICIENT DATA
     ---------------------------------------------------------- */

  return {
    title:
      "Tendance à venir",

    message:
      "Pas encore assez de données pour établir une tendance.",

    tone:
      "neutral",

    icon: (
      <ChartNoAxesCombined
        size={23}
        strokeWidth={1.8}
      />
    ),
  };
}


/* ============================================================
   QUICK ACTIONS
   ------------------------------------------------------------
   Exactement les quatre raccourcis prévus par l'architecture.
   Aucun bloc supplémentaire n'est ajouté.
   ============================================================ */

const QUICK_ACTIONS:
  readonly QuickAction[] = [
  {
    label:
      "Ajouter un produit",

    href:
      routes
        .gestionnaire
        .addProduct,

    icon: (
      <PackagePlus
        size={19}
        strokeWidth={1.8}
      />
    ),
  },

  {
    label:
      "Créer une promotion",

    href:
      routes
        .gestionnaire
        .promotions,

    icon: (
      <BadgePercent
        size={19}
        strokeWidth={1.8}
      />
    ),
  },

  {
    label:
      "Voir les commandes",

    href:
      routes
        .gestionnaire
        .orders,

    icon: (
      <ShoppingCart
        size={19}
        strokeWidth={1.8}
      />
    ),
  },

  {
    label:
      "Gérer le stock",

    href:
      routes
        .gestionnaire
        .stock,

    icon: (
      <Warehouse
        size={19}
        strokeWidth={1.8}
      />
    ),
  },
];


/* ============================================================
   QUICK ACTION LINK
   ============================================================ */

function QuickActionLink({
  action,
}: Readonly<{
  action:
    QuickAction;
}>) {
  return (
    <Link
      href={
        action.href
      }
      className="gestionnaire-dashboard-quick-actions__link"
    >
      <span
        className="gestionnaire-dashboard-quick-actions__link-main"
      >
        <span
          className="gestionnaire-dashboard-quick-actions__icon"
          aria-hidden="true"
        >
          {action.icon}
        </span>

        <span
          className="gestionnaire-dashboard-quick-actions__label"
        >
          {action.label}
        </span>
      </span>

      <ChevronRight
        size={18}
        strokeWidth={1.8}
        className="gestionnaire-dashboard-quick-actions__chevron"
        aria-hidden="true"
      />
    </Link>
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardPerformanceQuickActions({
  performance,
}: DashboardPerformanceQuickActionsProps) {
  const display =
    getPerformanceDisplay(
      performance,
    );


  return (
    <aside
      className="gestionnaire-dashboard-side-column"
      aria-label="Performance et raccourcis du tableau de bord"
    >
      {/* ======================================================
          PERFORMANCE CARD
          ====================================================== */}

      <section
        className={[
          "gestionnaire-dashboard-performance",
          `gestionnaire-dashboard-performance--${display.tone}`,
        ].join(
          " ",
        )}
        aria-labelledby="gestionnaire-dashboard-performance-title"
      >
        <div
          className="gestionnaire-dashboard-performance__top"
        >
          <span
            className="gestionnaire-dashboard-performance__icon"
            aria-hidden="true"
          >
            {display.icon}
          </span>

          <div
            className="gestionnaire-dashboard-performance__heading"
          >
            <span
              className="gestionnaire-dashboard-performance__eyebrow"
            >
              Performance
            </span>

            <h2
              id="gestionnaire-dashboard-performance-title"
              className="gestionnaire-dashboard-performance__title"
            >
              {display.title}
            </h2>
          </div>
        </div>


        <p
          className="gestionnaire-dashboard-performance__message"
        >
          {display.message}
        </p>


        {/* ----------------------------------------------------
            DECORATIVE TREND INDICATOR
            ---------------------------------------------------- */}

        <div
          className="gestionnaire-dashboard-performance__footer"
          aria-hidden="true"
        >
          <span
            className="gestionnaire-dashboard-performance__line"
          />

          <span
            className="gestionnaire-dashboard-performance__footer-icon"
          >
            {performance.state ===
            "growth" ? (
              <ArrowUpRight
                size={16}
                strokeWidth={2}
              />
            ) : performance.state ===
              "decline" ? (
              <ArrowDownRight
                size={16}
                strokeWidth={2}
              />
            ) : (
              <ArrowRight
                size={16}
                strokeWidth={2}
              />
            )}
          </span>
        </div>
      </section>


      {/* ======================================================
          QUICK ACTIONS CARD
          ====================================================== */}

      <section
        className="gestionnaire-dashboard-quick-actions"
        aria-labelledby="gestionnaire-dashboard-quick-actions-title"
      >
        <div
          className="gestionnaire-dashboard-quick-actions__header"
        >
          <div>
            <h2
              id="gestionnaire-dashboard-quick-actions-title"
              className="gestionnaire-dashboard-quick-actions__title"
            >
              Raccourcis rapides
            </h2>

            <p
              className="gestionnaire-dashboard-quick-actions__subtitle"
            >
              Accédez rapidement aux opérations principales.
            </p>
          </div>
        </div>


        <nav
          className="gestionnaire-dashboard-quick-actions__list"
          aria-label="Raccourcis rapides Gestionnaire"
        >
          {QUICK_ACTIONS.map(
            (
              action,
            ) => (
              <QuickActionLink
                key={
                  action.href
                }
                action={
                  action
                }
              />
            ),
          )}
        </nav>
      </section>
    </aside>
  );
}