import type {
  Metadata,
} from "next";

import DashboardAutoRefresh from "@/components/gestionnaire/dashboard/DashboardAutoRefresh";
import DashboardKpiGrid from "@/components/gestionnaire/dashboard/DashboardKpiGrid";
import DashboardOrderDistribution from "@/components/gestionnaire/dashboard/DashboardOrderDistribution";
import DashboardPerformanceQuickActions from "@/components/gestionnaire/dashboard/DashboardPerformanceQuickActions";
import DashboardPeriodFilter from "@/components/gestionnaire/dashboard/DashboardPeriodFilter";
import DashboardRecentOrders from "@/components/gestionnaire/dashboard/DashboardRecentOrders";
import DashboardSalesChart from "@/components/gestionnaire/dashboard/DashboardSalesChart";
import DashboardTopProducts from "@/components/gestionnaire/dashboard/DashboardTopProducts";

import {
  getGestionnaireDashboardData,
} from "@/server/gestionnaire/dashboard/dashboard";

import type {
  DashboardPeriodPreset,
} from "@/server/gestionnaire/dashboard/dashboard";

import "./dashboard.css";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD GESTIONNAIRE
   ------------------------------------------------------------
   Route :
   /gestionnaire/dashboard

   Fichier :
   src/app/gestionnaire/(espace-prive)/dashboard/page.tsx

   RESPONSABILITÉS :

   - utiliser le layout Gestionnaire existant ;
   - ne recréer ni Sidebar ni Header global ;
   - lire la période depuis les search params ;
   - appeler le service Dashboard sécurisé ;
   - afficher uniquement les données du Store authentifié ;
   - assembler les zones suivant la maquette ;
   - rester dynamique et privé ;
   - utiliser toute la largeur disponible du workspace.

   IMPORTANT :

   Les requêtes Prisma ne sont PAS exécutées ici.

   Elles sont centralisées dans :

   src/server/gestionnaire/dashboard/dashboard.ts
   ============================================================ */


/* ============================================================
   PRIVATE / DYNAMIC PAGE
   ------------------------------------------------------------
   Le Dashboard contient des données privées et régulièrement
   mises à jour.

   Il ne doit jamais être généré comme une page statique commune
   entre plusieurs Gestionnaires.
   ============================================================ */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ============================================================
   METADATA
   ============================================================ */

export const metadata:
  Metadata = {
  title:
    "Tableau de bord | L&E Cosmetics Empire",

  description:
    "Tableau de bord de gestion de votre boutique L&E Cosmetics Empire.",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


/* ============================================================
   SEARCH PARAMS
   ------------------------------------------------------------
   Next.js 16 fournit les searchParams de page de manière
   asynchrone.

   On accepte également la forme directe afin de garder ce
   composant robuste et facile à tester.
   ============================================================ */

type DashboardSearchParams =
  Record<
    string,
    string |
    string[] |
    undefined
  >;


type DashboardPageProps =
  Readonly<{
    searchParams?:
      Promise<DashboardSearchParams> |
      DashboardSearchParams;
  }>;


/* ============================================================
   ALLOWED PERIODS
   ============================================================ */

const ALLOWED_PERIODS:
  readonly DashboardPeriodPreset[] = [
  "today",
  "last7Days",
  "last30Days",
  "thisMonth",
  "previousMonth",
  "thisYear",
  "custom",
];


/* ============================================================
   FIRST SEARCH PARAM VALUE
   ============================================================ */

function getSearchParamValue(
  value:
    string |
    string[] |
    undefined,
): string | undefined {
  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value.trim();


    return normalized ||
      undefined;
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    const first =
      value[0]
        ?.trim();


    return first ||
      undefined;
  }


  return undefined;
}


/* ============================================================
   VALIDATE PERIOD PRESET
   ------------------------------------------------------------
   On ne fait jamais confiance directement à une valeur venant
   de l'URL.

   Une valeur inconnue retombe simplement sur la période par
   défaut gérée par le service Dashboard.
   ============================================================ */

function getPeriodPreset(
  value:
    string | undefined,
): DashboardPeriodPreset | undefined {
  if (!value) {
    return undefined;
  }


  return ALLOWED_PERIODS.includes(
    value as DashboardPeriodPreset,
  )
    ? (
        value as
          DashboardPeriodPreset
      )
    : undefined;
}


/* ============================================================
   RESOLVE SEARCH PARAMS
   ============================================================ */

async function resolveSearchParams(
  searchParams:
    DashboardPageProps["searchParams"],
): Promise<DashboardSearchParams> {
  if (!searchParams) {
    return {};
  }


  return await Promise.resolve(
    searchParams,
  );
}


/* ============================================================
   PAGE
   ============================================================ */

export default async function GestionnaireDashboardPage({
  searchParams,
}: DashboardPageProps) {
  /* ==========================================================
     1. URL PARAMETERS
     ========================================================== */

  const params =
    await resolveSearchParams(
      searchParams,
    );


  const periodPreset =
    getPeriodPreset(
      getSearchParamValue(
        params.period,
      ),
    );


  const from =
    getSearchParamValue(
      params.from,
    );


  const to =
    getSearchParamValue(
      params.to,
    );


  /* ==========================================================
     2. SECURE SERVER DATA
     ----------------------------------------------------------
     Aucun managerId ni storeId n'est transmis depuis l'URL.

     getGestionnaireDashboardData() récupère lui-même :

     session
        ↓
     Manager authentifié
        ↓
     Store autorisé
        ↓
     données de cette boutique uniquement.
     ========================================================== */

  const dashboard =
    await getGestionnaireDashboardData({
      preset:
        periodPreset,

      from,

      to,
    });


  /* ==========================================================
     3. RENDER
     ========================================================== */

  return (
    <>
      {/* ======================================================
          AUTOMATIC DATA REFRESH
          ------------------------------------------------------
          Aucun élément visuel.

          Le Dashboard récupère régulièrement les dernières
          données serveur sans recharger tout le shell.
          ====================================================== */}

      <DashboardAutoRefresh />


      {/* ======================================================
          DASHBOARD ROOT
          ------------------------------------------------------
          IMPORTANT :

          Ce conteneur doit utiliser TOUTE la largeur disponible
          du Main du Gestionnaire.

          dashboard.css imposera :

          width: 100%;
          max-width: none;
          min-width: 0;

          Aucun container centré étroit ne sera utilisé.
          ====================================================== */}

      <div
        className="gestionnaire-dashboard"
      >
        {/* ====================================================
            ZONE 1
            WELCOME + PERIOD
            ==================================================== */}

        <header
          className="gestionnaire-dashboard__hero"
        >
          <div
            className="gestionnaire-dashboard__welcome"
          >
            <p
              className="gestionnaire-dashboard__welcome-label"
            >
              Bienvenue,
            </p>

            <h1
              className="gestionnaire-dashboard__title"
            >
              {dashboard.store.name}
              <span
                className="gestionnaire-dashboard__wave"
                aria-hidden="true"
              >
                👋
              </span>
            </h1>

            <p
              className="gestionnaire-dashboard__description"
            >
              Voici un aperçu de l’activité de votre boutique aujourd’hui.
            </p>
          </div>


          <div
            className="gestionnaire-dashboard__period"
          >
            <DashboardPeriodFilter
              period={{
                preset:
                  dashboard
                    .period
                    .preset,

                from:
                  dashboard
                    .period
                    .from,

                to:
                  dashboard
                    .period
                    .to,

                label:
                  dashboard
                    .period
                    .label,
              }}
            />
          </div>
        </header>


        {/* ====================================================
            ZONE 2
            4 KPI
            ==================================================== */}

        <div
          className="gestionnaire-dashboard__kpis"
        >
          <DashboardKpiGrid
            summary={
              dashboard.summary
            }
          />
        </div>


        {/* ====================================================
            ZONE 3
            SALES + ORDERS DISTRIBUTION + SIDE COLUMN
            ----------------------------------------------------
            Desktop large :

            ┌────────────────────────┬───────────────┬───────────┐
            │ Sales                  │ Donut         │Performance│
            │                        │               │Quick links│
            └────────────────────────┴───────────────┴───────────┘

            Mobile / petit laptop :

            la grille s'adapte dans dashboard.css.
            ==================================================== */}

        <section
          className="gestionnaire-dashboard__overview"
          aria-label="Vue d’ensemble de l’activité"
        >
          {/* --------------------------------------------------
              SALES CHART
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard__sales"
          >
            <DashboardSalesChart
              data={
                dashboard
                  .salesChart
              }
              currency={
                dashboard
                  .salesChartCurrency
              }
            />
          </div>


          {/* --------------------------------------------------
              ORDER DISTRIBUTION
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard__distribution"
          >
            <DashboardOrderDistribution
              data={
                dashboard
                  .orderDistribution
              }
            />
          </div>


          {/* --------------------------------------------------
              PERFORMANCE + QUICK ACTIONS
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard__side"
          >
            <DashboardPerformanceQuickActions
              performance={
                dashboard
                  .performance
              }
            />
          </div>
        </section>


        {/* ====================================================
            ZONE 4
            RECENT ORDERS + TOP PRODUCTS
            ----------------------------------------------------
            Desktop :

            ┌────────────────────────────────┬──────────────────┐
            │ Dernières commandes            │ Top produits     │
            └────────────────────────────────┴──────────────────┘

            La table utilise la majorité de la largeur.
            ==================================================== */}

        <section
          className="gestionnaire-dashboard__bottom"
          aria-label="Commandes et produits"
        >
          {/* --------------------------------------------------
              RECENT ORDERS
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard__recent-orders"
          >
            <DashboardRecentOrders
              orders={
                dashboard
                  .recentOrders
              }
            />
          </div>


          {/* --------------------------------------------------
              TOP PRODUCTS
              -------------------------------------------------- */}

          <div
            className="gestionnaire-dashboard__top-products"
          >
            <DashboardTopProducts
              products={
                dashboard
                  .topProducts
              }
            />
          </div>
        </section>


        {/* ====================================================
            ACCESSIBLE UPDATE INFORMATION
            ----------------------------------------------------
            generatedAt ne doit pas encombrer visuellement la
            maquette mais reste disponible aux technologies
            d'assistance.
            ==================================================== */}

        <p
          className="gestionnaire-dashboard__sr-only"
        >
          {`Données du tableau de bord actualisées le ${new Intl.DateTimeFormat(
            "fr-FR",
            {
              dateStyle:
                "long",

              timeStyle:
                "short",

              timeZone:
                "UTC",
            },
          ).format(
            new Date(
              dashboard.generatedAt,
            ),
          )}.`}
        </p>
      </div>
    </>
  );
}