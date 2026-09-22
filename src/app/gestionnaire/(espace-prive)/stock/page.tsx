import type {
  Metadata,
} from "next";

import StockEmptyState from "@/components/gestionnaire/stock/StockEmptyState";
import StockFilters from "@/components/gestionnaire/stock/StockFilters";
import StockHeader from "@/components/gestionnaire/stock/StockHeader";
import StockKpiGrid from "@/components/gestionnaire/stock/StockKpiGrid";
import StockTable from "@/components/gestionnaire/stock/StockTable";

import {
  getManagerStockPageData,
} from "@/lib/gestionnaire/stock/stock-query";

import {
  isManagerStockStatusFilter,
  type ManagerStockStatusFilter,
} from "@/lib/gestionnaire/stock/stock-types";

import styles from "./stock.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/stock/page.tsx
 *
 * Route :
 *
 * /gestionnaire/stock
 *
 * RÔLE :
 *
 * Assembler la page Stock de l'espace Gestionnaire.
 *
 * RESPONSABILITÉS :
 *
 * - lire les search params ;
 * - normaliser les filtres venant de l'URL ;
 * - demander les données réelles à stock-query.ts ;
 * - afficher le header de la page ;
 * - afficher les KPI réels ;
 * - afficher les filtres ;
 * - afficher le tableau PC / les cartes mobile ;
 * - afficher l'état vide lorsqu'aucune ligne n'est disponible.
 *
 * IMPORTANT :
 *
 * Cette page :
 *
 * - ne fait aucune requête Prisma directe ;
 * - ne lit pas elle-même la session ;
 * - ne reçoit aucun storeId du navigateur ;
 * - ne reçoit aucun managerId du navigateur ;
 * - n'utilise aucune donnée fictive ;
 * - ne calcule aucun KPI métier ;
 * - ne calcule aucun statut de stock ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas un deuxième <main> dans le shell Gestionnaire.
 *
 * Toutes les données métier sont chargées dans :
 *
 * src/lib/gestionnaire/stock/stock-query.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   RENDU DYNAMIQUE
   ========================================================================== */

/**
 * La page dépend :
 *
 * - de la session Gestionnaire ;
 * - de la boutique connectée ;
 * - du stock courant ;
 * - des filtres de l'URL.
 *
 * Elle ne doit donc pas être pré-rendue comme une page publique statique.
 */

export const dynamic =
  "force-dynamic";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Stock | Cosmetics Empire",

    description:
      "Consultez et suivez les stocks de produits de votre boutique.",
  };


/* ==========================================================================
   TYPES SEARCH PARAMS
   ========================================================================== */

type StockSearchParamValue =
  | string
  | string[]
  | undefined;


interface StockPageSearchParams {
  q?:
    StockSearchParamValue;

  category?:
    StockSearchParamValue;

  status?:
    StockSearchParamValue;

  page?:
    StockSearchParamValue;
}


interface StockPageProps {
  searchParams:
    Promise<StockPageSearchParams>;
}


/* ==========================================================================
   PREMIÈRE VALEUR D'UN SEARCH PARAM
   ========================================================================== */

/**
 * Next.js peut techniquement fournir :
 *
 * ?q=a&q=b
 *
 * sous forme de tableau.
 *
 * Pour cette page, un filtre possède toujours une seule valeur.
 */

function getFirstSearchParam(
  value:
    StockSearchParamValue,
): string | undefined {
  if (
    Array.isArray(
      value,
    )
  ) {
    return value[0];
  }


  return value;
}


/* ==========================================================================
   NORMALISATION RECHERCHE
   ========================================================================== */

function parseSearch(
  value:
    StockSearchParamValue,
): string {
  const resolvedValue =
    getFirstSearchParam(
      value,
    );


  if (
    typeof resolvedValue !==
    "string"
  ) {
    return "";
  }


  return resolvedValue
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}


/* ==========================================================================
   NORMALISATION CATÉGORIE
   ========================================================================== */

function parseCategory(
  value:
    StockSearchParamValue,
): string {
  const resolvedValue =
    getFirstSearchParam(
      value,
    );


  if (
    typeof resolvedValue !==
    "string"
  ) {
    return "";
  }


  return resolvedValue
    .trim();
}


/* ==========================================================================
   NORMALISATION STATUT
   ========================================================================== */

function parseStatus(
  value:
    StockSearchParamValue,
): ManagerStockStatusFilter {
  const resolvedValue =
    getFirstSearchParam(
      value,
    );


  if (
    isManagerStockStatusFilter(
      resolvedValue,
    )
  ) {
    return resolvedValue;
  }


  return "all";
}


/* ==========================================================================
   NORMALISATION PAGE
   ========================================================================== */

function parsePage(
  value:
    StockSearchParamValue,
): number {
  const resolvedValue =
    getFirstSearchParam(
      value,
    );


  if (
    typeof resolvedValue !==
      "string" ||
    resolvedValue.trim() ===
      ""
  ) {
    return 1;
  }


  const parsedValue =
    Number(
      resolvedValue,
    );


  if (
    !Number.isFinite(
      parsedValue,
    )
  ) {
    return 1;
  }


  const page =
    Math.trunc(
      parsedValue,
    );


  if (
    page <
    1
  ) {
    return 1;
  }


  return page;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function StockPage({
  searchParams,
}: StockPageProps) {
  /* =========================================================================
     1. SEARCH PARAMS
     ========================================================================= */

  const resolvedSearchParams =
    await searchParams;


  /* =========================================================================
     2. FILTRES URL
     ========================================================================= */

  const search =
    parseSearch(
      resolvedSearchParams.q,
    );


  const category =
    parseCategory(
      resolvedSearchParams.category,
    );


  const status =
    parseStatus(
      resolvedSearchParams.status,
    );


  const page =
    parsePage(
      resolvedSearchParams.page,
    );


  /* =========================================================================
     3. DONNÉES RÉELLES
     ========================================================================= */

  /**
   * Le navigateur ne fournit ici que :
   *
   * - search ;
   * - category ;
   * - status ;
   * - page.
   *
   * storeId et managerId ne sont jamais envoyés au service.
   *
   * stock-query.ts récupère lui-même la boutique depuis la session
   * Gestionnaire sécurisée.
   */

  const data =
    await getManagerStockPageData({
      search,
      category,
      status,
      page,
    });


  /* =========================================================================
     4. ÉTAT DE LA LISTE
     ========================================================================= */

  const hasItems =
    data.items.length >
    0;


  /* =========================================================================
     5. RENDER
     ========================================================================= */

  return (
    <div
      className={
        styles.stockPage
      }
    >
      <div
        className={
          styles.stockMain
        }
      >
        {/* =================================================================
            HEADER DE PAGE
            ================================================================= */}

        <StockHeader />


        {/* =================================================================
            KPI
            ================================================================= */}

        <StockKpiGrid
          kpis={
            data.kpis
          }
        />


        {/* =================================================================
            FILTRES
            ================================================================= */}

        <StockFilters
          filters={
            data.filters
          }
          categories={
            data.categories
          }
        />


        {/* =================================================================
            LISTE / ÉTAT VIDE
            ================================================================= */}

        {hasItems ? (
          <StockTable
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
          <StockEmptyState
            filters={
              data.filters
            }
            totalProducts={
              data.kpis
                .totalProducts
            }
          />
        )}
      </div>
    </div>
  );
}