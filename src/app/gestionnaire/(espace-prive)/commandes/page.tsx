import type {
  Metadata,
} from "next";

import OrdersEmptyState from "@/components/gestionnaire/orders/OrdersEmptyState";
import OrdersFilters from "@/components/gestionnaire/orders/OrdersFilters";
import OrdersHeader from "@/components/gestionnaire/orders/OrdersHeader";
import OrdersKpiGrid from "@/components/gestionnaire/orders/OrdersKpiGrid";
import OrdersStatusTabs from "@/components/gestionnaire/orders/OrdersStatusTabs";
import OrdersTable from "@/components/gestionnaire/orders/OrdersTable";

import {
  getManagerOrdersPageData,
} from "@/lib/gestionnaire/orders/order-query";

import {
  isManagerOrderPaymentMethodFilter,
  isManagerOrderStatusFilter,
  isManagerOrdersTab,
  type GetManagerOrdersPageDataInput,
} from "@/lib/gestionnaire/orders/order-types";

import styles from "./commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/commandes/page.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Page serveur principale de gestion des commandes.
 *
 * RESPONSABILITÉS :
 *
 * - lire les paramètres de recherche de l'URL ;
 * - normaliser uniquement leur forme générale ;
 * - déléguer la validation métier à order-query.ts ;
 * - charger les vraies commandes de la boutique autorisée ;
 * - afficher les KPI ;
 * - afficher les onglets ;
 * - afficher les filtres ;
 * - afficher le tableau ;
 * - afficher l'état vide lorsqu'il n'y a aucun résultat.
 *
 * IMPORTANT :
 *
 * Cette page :
 *
 * - reste un Server Component ;
 * - ne fait aucune requête Prisma directement ;
 * - ne reçoit jamais storeId depuis le navigateur ;
 * - ne reçoit jamais managerId depuis le navigateur ;
 * - ne recrée pas le shell Gestionnaire ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas un deuxième <main> ;
 * - ne contient aucune donnée de démonstration ;
 * - ne crée aucune route d'export fictive ;
 * - utilise toute la largeur fournie par le layout Gestionnaire.
 *
 * La sécurité et le périmètre boutique sont appliqués dans :
 *
 * src/lib/gestionnaire/orders/order-query.ts
 *
 * via :
 *
 * requireGestionnairePrivateAccess()
 *
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Commandes | Cosmetics Empire",

    description:
      "Suivez et gérez les commandes de votre espace Gestionnaire Cosmetics Empire.",

    alternates: {
      canonical:
        "/gestionnaire/commandes",
    },
  };


/* ==========================================================================
   DONNÉES DYNAMIQUES
   ========================================================================== */

/**
 * Cette page contient des données privées et évolutives.
 *
 * On évite donc qu'une version statique de la liste soit réutilisée.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   SEARCH PARAMS
   ========================================================================== */

type SearchParamValue =
  | string
  | string[]
  | undefined;


type OrdersSearchParams =
  Readonly<
    Record<
      string,
      SearchParamValue
    >
  >;


export interface ManagerOrdersPageProps {
  readonly searchParams:
    Promise<OrdersSearchParams>;
}


/* ==========================================================================
   LECTURE PARAMÈTRE
   ========================================================================== */

/**
 * Next.js peut techniquement fournir :
 *
 * string
 * string[]
 * undefined
 *
 * Pour cette page, chaque filtre n'accepte qu'une seule valeur.
 * Si plusieurs valeurs existent, seule la première est considérée.
 */

function readSearchParam(
  value:
    SearchParamValue,
): string | null {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    const firstValue =
      value[0];


    return typeof firstValue ===
      "string"
      ? firstValue
      : null;
  }


  return null;
}


/* ==========================================================================
   PAGE NUMBER
   ========================================================================== */

function readPageParam(
  value:
    SearchParamValue,
): number | null {
  const rawValue =
    readSearchParam(
      value,
    );


  if (
    !rawValue
  ) {
    return null;
  }


  /*
   * On accepte uniquement un entier positif.
   *
   * Exemples refusés :
   *
   * - 0
   * - -1
   * - 1.5
   * - abc
   */

  if (
    !/^\d+$/.test(
      rawValue,
    )
  ) {
    return null;
  }


  const page =
    Number(
      rawValue,
    );


  if (
    !Number.isSafeInteger(
      page,
    ) ||
    page <
      1
  ) {
    return null;
  }


  return page;
}


/* ==========================================================================
   INPUT QUERY
   ========================================================================== */

function buildOrdersQueryInput(
  searchParams:
    OrdersSearchParams,
): GetManagerOrdersPageDataInput {
  const rawTab =
    readSearchParam(
      searchParams.tab,
    );


  const rawStatus =
    readSearchParam(
      searchParams.status,
    );


  const rawPaymentMethod =
    readSearchParam(
      searchParams.paymentMethod,
    );


  return {
    dateFrom:
      readSearchParam(
        searchParams.dateFrom,
      ),

    dateTo:
      readSearchParam(
        searchParams.dateTo,
      ),

    q:
      readSearchParam(
        searchParams.q,
      ),

    /*
     * Les guards utilisés ici sont ceux déjà définis dans order-types.ts.
     *
     * On n'invente donc aucune valeur d'onglet.
     */

    tab:
      isManagerOrdersTab(
        rawTab,
      )
        ? rawTab
        : null,

    /*
     * Même principe pour OrderStatus.
     */

    status:
      isManagerOrderStatusFilter(
        rawStatus,
      )
        ? rawStatus
        : null,

    /*
     * Même principe pour PaymentMethod.
     */

    paymentMethod:
      isManagerOrderPaymentMethodFilter(
        rawPaymentMethod,
      )
        ? rawPaymentMethod
        : null,

    city:
      readSearchParam(
        searchParams.city,
      ),

    page:
      readPageParam(
        searchParams.page,
      ),
  };
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function ManagerOrdersPage({
  searchParams,
}: ManagerOrdersPageProps) {
  /* ------------------------------------------------------------------------
     1. PARAMÈTRES URL
     ------------------------------------------------------------------------ */

  const resolvedSearchParams =
    await searchParams;


  const queryInput =
    buildOrdersQueryInput(
      resolvedSearchParams,
    );


  /* ------------------------------------------------------------------------
     2. DONNÉES SERVEUR
     ------------------------------------------------------------------------
     getManagerOrdersPageData() :
     
     - vérifie la session Gestionnaire ;
     - récupère le vrai storeId côté serveur ;
     - scope toutes les requêtes à cette boutique ;
     - calcule les KPI ;
     - calcule les compteurs d'onglets ;
     - charge les villes réelles ;
     - applique les filtres ;
     - applique la pagination ;
     - retourne uniquement des données sérialisables.
     ------------------------------------------------------------------------ */

  const data =
    await getManagerOrdersPageData(
      queryInput,
    );


  /* ------------------------------------------------------------------------
     3. RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.ordersPage
      }
    >
      <div
        className={
          styles.ordersContent
        }
      >
        {/* =================================================================
            HEADER DE PAGE
            ================================================================= */}

        <OrdersHeader />


        {/* =================================================================
            KPI
            ================================================================= */}

        <OrdersKpiGrid
          kpis={
            data.kpis
          }
        />


        {/* =================================================================
            ONGLET + FILTRES
            ================================================================= */}

        <section
          className={
            styles.ordersStatusTabsSection
          }
          aria-label="Gestion et filtrage des commandes"
        >
          <OrdersStatusTabs
            activeTab={
              data.filters.tab
            }
            counts={
              data.tabCounts
            }
            filters={
              data.filters
            }
          />


          <OrdersFilters
            filters={
              data.filters
            }
            filterOptions={
              data.filterOptions
            }
          />
        </section>


        {/* =================================================================
            LISTE / EMPTY STATE
            ================================================================= */}

        {data.items.length >
        0 ? (
          <OrdersTable
            items={
              data.items
            }
            filters={
              data.filters
            }
            pagination={
              data.pagination
            }
          />
        ) : (
          <OrdersEmptyState
            filters={
              data.filters
            }
          />
        )}
      </div>
    </div>
  );
}