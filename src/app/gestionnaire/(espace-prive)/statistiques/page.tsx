import type {
  Metadata,
} from "next";

import StatisticsHeader from "@/components/gestionnaire/statistiques/StatisticsHeader";

import StatisticsKpiGrid from "@/components/gestionnaire/statistiques/StatisticsKpiGrid";

import {
  CategorySalesCard,
  CityPerformanceCard,
  OrdersDistributionCard,
  PaymentDistributionCard,
  RevenueChartCard,
} from "@/components/gestionnaire/statistiques/StatisticsCharts";

import {
  LatestOrdersCard,
  TopProductsCard,
} from "@/components/gestionnaire/statistiques/StatisticsTables";

import {
  PerformanceInsightCard,
  RecommendationCard,
} from "@/components/gestionnaire/statistiques/StatisticsInsights";

import StatisticsEmptyState from "@/components/gestionnaire/statistiques/StatisticsEmptyState";

import {
  getManagerStatisticsPageData,
} from "@/lib/gestionnaire/statistiques/statistics-query";

import type {
  GetManagerStatisticsPageDataInput,
} from "@/lib/gestionnaire/statistiques/statistics-types";

import styles from "./statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/statistiques
 *
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/statistiques/page.tsx
 *
 *
 * RESPONSABILITÉS :
 *
 * - lire les searchParams ;
 * - normaliser les paramètres utiles ;
 * - appeler getManagerStatisticsPageData() ;
 * - transmettre les données aux composants ;
 * - afficher l'état vide si aucune activité n'existe ;
 * - organiser le dashboard statistiques ;
 * - exploiter toute la largeur disponible du Main existant.
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer directement des requêtes Prisma ;
 * - recevoir un storeId du navigateur ;
 * - recevoir un managerId du navigateur ;
 * - recalculer les statistiques ;
 * - inventer des données ;
 * - créer un deuxième layout ;
 * - créer une deuxième sidebar ;
 * - créer un deuxième header global ;
 * - créer un nouveau <main>.
 *
 *
 * SÉCURITÉ :
 *
 * La vérification de session et le scope boutique sont réalisés dans :
 *
 * getManagerStatisticsPageData()
 *
 * qui appelle :
 *
 * requireGestionnairePrivateAccess()
 *
 * Le navigateur ne choisit jamais la boutique.
 *
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
  title:
    "Statistiques | Cosmetics Empire",

  description:
    "Consultez les statistiques et performances réelles de votre boutique Cosmetics Empire.",
};


/* ==========================================================================
   RENDERING
   ========================================================================== */

/**
 * Les statistiques doivent toujours refléter les données réelles
 * disponibles lors de la requête.
 *
 * La page ne doit pas être pré-rendue statiquement avec des données anciennes.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   SEARCH PARAMS
   ========================================================================== */

type StatisticsSearchParamValue =
  | string
  | string[]
  | undefined;


interface StatisticsPageProps {
  readonly searchParams:
    Promise<
      Record<
        string,
        StatisticsSearchParamValue
      >
    >;
}


/* ==========================================================================
   SEARCH PARAM — SINGLE VALUE
   ========================================================================== */

/**
 * Next.js peut théoriquement recevoir plusieurs fois le même paramètre :
 *
 * ?from=2026-09-01&from=2026-09-02
 *
 * La page ne transmet jamais directement un tableau à la couche métier.
 *
 * En cas de plusieurs valeurs, seule la première chaîne non vide est retenue.
 */

function getSingleSearchParam(
  value:
    StatisticsSearchParamValue,
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
    for (
      const item of
      value
    ) {
      const normalized =
        item.trim();


      if (
        normalized
      ) {
        return normalized;
      }
    }
  }


  return undefined;
}


/* ==========================================================================
   BUILD QUERY INPUT
   ========================================================================== */

/**
 * Seuls les paramètres réellement supportés sont transmis à la query :
 *
 * - preset
 * - from
 * - to
 *
 * Aucun autre paramètre URL ne peut influencer la requête métier.
 */

function buildStatisticsQueryInput(
  searchParams:
    Record<
      string,
      StatisticsSearchParamValue
    >,
): GetManagerStatisticsPageDataInput {
  return {
    preset:
      getSingleSearchParam(
        searchParams.preset,
      ),

    from:
      getSingleSearchParam(
        searchParams.from,
      ),

    to:
      getSingleSearchParam(
        searchParams.to,
      ),
  };
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function GestionnaireStatisticsPage({
  searchParams,
}: StatisticsPageProps) {
  /* ------------------------------------------------------------------------
     SEARCH PARAMS
     ------------------------------------------------------------------------ */

  const resolvedSearchParams =
    await searchParams;


  const queryInput =
    buildStatisticsQueryInput(
      resolvedSearchParams,
    );


  /* ------------------------------------------------------------------------
     DATA
     ------------------------------------------------------------------------
     
     Cette fonction :
     
     - vérifie l'accès Gestionnaire ;
     - détermine la boutique depuis la session ;
     - valide/résout la période ;
     - interroge Prisma ;
     - calcule les vraies statistiques.
     
     Aucun storeId n'est fourni ici.
     ------------------------------------------------------------------------ */

  const data =
    await getManagerStatisticsPageData(
      queryInput,
    );


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div className={styles.statisticsPage}>
      {/* ==================================================================
          HEADER + PERIOD FILTER
          ================================================================== */}

      <StatisticsHeader
        filters={data.filters}
      />


      {/* ==================================================================
          EMPTY STATE
          ==================================================================
          
          S'il n'existe réellement :
          
          - aucune commande ;
          - aucun paiement encaissé ;
          - aucune vente ;
          - aucune livraison ;
          
          on ne construit pas artificiellement un dashboard rempli de zéros.
          
          Le filtre de période reste toutefois visible dans le Header.
          ================================================================== */}

      {!data.activity.hasActivity ? (
        <StatisticsEmptyState />
      ) : (
        <>
          {/* ==============================================================
              KPI
              ============================================================== */}

          <StatisticsKpiGrid
            kpis={data.kpis}
          />


          {/* ==============================================================
              TOP ANALYTICS
              
              Desktop large :
              
              ┌──────────────────────┬────────────┬────────────┐
              │ Évolution CA         │ Commandes  │ Catégories │
              └──────────────────────┴────────────┴────────────┘
              ============================================================== */}

          <div className={styles.statisticsTopChartsGrid}>
            <RevenueChartCard
              series={data.revenueSeries}
            />


            <OrdersDistributionCard
              distribution={
                data.orderStatusDistribution
              }
            />


            <CategorySalesCard
              categories={
                data.categorySales
              }
            />
          </div>


          {/* ==============================================================
              TABLES + PAYMENTS
              
              Desktop large :
              
              ┌──────────────────┬──────────────────┬─────────────┐
              │ Top produits     │ Dernières cmdes  │ Paiements   │
              └──────────────────┴──────────────────┴─────────────┘
              ============================================================== */}

          <div className={styles.statisticsTablesGrid}>
            <TopProductsCard
              products={
                data.topProducts
              }
            />


            <LatestOrdersCard
              orders={
                data.latestOrders
              }
            />


            <PaymentDistributionCard
              distribution={
                data.paymentDistribution
              }
            />
          </div>


          {/* ==============================================================
              BOTTOM ANALYTICS
              
              Desktop large :
              
              ┌────────────────────┬──────────────┬────────────────┐
              │ Performance ville  │ Performance  │ Recommandation │
              └────────────────────┴──────────────┴────────────────┘
              ============================================================== */}

          <div className={styles.statisticsBottomGrid}>
            <CityPerformanceCard
              cities={
                data.cityPerformance
              }
            />


            <PerformanceInsightCard
              insight={
                data.insight
              }
            />


            <RecommendationCard
              recommendation={
                data.recommendation
              }
            />
          </div>
        </>
      )}
    </div>
  );
}