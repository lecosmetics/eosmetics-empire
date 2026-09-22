import type {
  Metadata,
} from "next";

import LivraisonsEmptyState from "@/components/gestionnaire/livraisons/LivraisonsEmptyState";
import LivraisonsFilters from "@/components/gestionnaire/livraisons/LivraisonsFilters";
import LivraisonsHeader from "@/components/gestionnaire/livraisons/LivraisonsHeader";
import LivraisonsKpiGrid from "@/components/gestionnaire/livraisons/LivraisonsKpiGrid";
import LivraisonsTable from "@/components/gestionnaire/livraisons/LivraisonsTable";

import {
  getManagerShipmentsPageData,
} from "@/lib/gestionnaire/livraisons/shipment-query";

import styles from "./livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/livraisons
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/page.tsx
 *
 * RESPONSABILITÉS :
 *
 * - lire les searchParams de la route ;
 * - transmettre uniquement les filtres à la couche serveur ;
 * - charger les vraies livraisons autorisées ;
 * - afficher les KPI ;
 * - afficher les filtres ;
 * - afficher la table ;
 * - afficher l'état vide lorsque nécessaire ;
 * - rester dans le GestionnaireShell existant.
 *
 * IMPORTANT :
 *
 * Cette page NE :
 *
 * - ne crée pas un autre <main> ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne fait pas directement de requête Prisma ;
 * - ne fait pas confiance à un storeId provenant du navigateur ;
 * - ne contient aucune donnée fictive ;
 * - ne crée aucune livraison manuellement ;
 * - ne limite pas artificiellement la largeur du contenu.
 *
 * La sécurité et le scoping Gestionnaire / Store sont assurés
 * dans shipment-query.ts via requireGestionnairePrivateAccess().
 *
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
  title:
    "Livraisons | Cosmetics Empire",

  description:
    "Suivez et gérez les livraisons de votre espace Gestionnaire Cosmetics Empire.",
};


/* ==========================================================================
   FRESH SERVER DATA
   ========================================================================== */

/**
 * Les livraisons doivent être relues côté serveur.
 *
 * Après une confirmation ou une annulation :
 *
 * Server Action
 *   ↓
 * revalidatePath()
 *   ↓
 * nouvelle lecture
 *   ↓
 * données à jour
 *
 * Aucun WebSocket n'est nécessaire pour ce besoin.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   SEARCH PARAM TYPES
   ========================================================================== */

type LivraisonsSearchParamValue =
  | string
  | string[]
  | undefined;


interface LivraisonsSearchParams {
  readonly q?:
    LivraisonsSearchParamValue;

  readonly dateFrom?:
    LivraisonsSearchParamValue;

  readonly dateTo?:
    LivraisonsSearchParamValue;

  readonly status?:
    LivraisonsSearchParamValue;

  readonly city?:
    LivraisonsSearchParamValue;

  readonly carrier?:
    LivraisonsSearchParamValue;

  readonly page?:
    LivraisonsSearchParamValue;
}


/* ==========================================================================
   PAGE PROPS — NEXT.JS 16
   ========================================================================== */

interface LivraisonsPageProps {
  readonly searchParams:
    Promise<LivraisonsSearchParams>;
}


/* ==========================================================================
   SEARCH PARAM VALUE
   ========================================================================== */

/**
 * Next.js peut théoriquement fournir :
 *
 * ?city=Dakar&city=Abidjan
 *
 * sous forme de tableau.
 *
 * Notre interface n'utilise qu'une valeur par filtre.
 *
 * On prend donc uniquement la première valeur sans inventer de règle
 * supplémentaire.
 */

function getSearchParamValue(
  value:
    LivraisonsSearchParamValue,
): string | undefined {
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
      : undefined;
  }


  return undefined;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function LivraisonsPage({
  searchParams,
}: LivraisonsPageProps) {
  /* ------------------------------------------------------------------------
     SEARCH PARAMS
     ------------------------------------------------------------------------ */

  const resolvedSearchParams =
    await searchParams;


  /* ------------------------------------------------------------------------
     SERVER DATA
     ------------------------------------------------------------------------
     
     getManagerShipmentsPageData() :
     
     - vérifie le Gestionnaire connecté ;
     - récupère le store autorisé ;
     - scope toutes les requêtes par storeId ;
     - normalise les filtres ;
     - calcule les KPI ;
     - récupère les options réelles de filtre ;
     - récupère les Shipment réels ;
     - calcule la pagination.
     
     Aucun storeId n'est fourni depuis le navigateur.
     ------------------------------------------------------------------------ */

  const data =
    await getManagerShipmentsPageData({
      q:
        getSearchParamValue(
          resolvedSearchParams.q,
        ),

      dateFrom:
        getSearchParamValue(
          resolvedSearchParams.dateFrom,
        ),

      dateTo:
        getSearchParamValue(
          resolvedSearchParams.dateTo,
        ),

      status:
        getSearchParamValue(
          resolvedSearchParams.status,
        ),

      city:
        getSearchParamValue(
          resolvedSearchParams.city,
        ),

      carrier:
        getSearchParamValue(
          resolvedSearchParams.carrier,
        ),

      page:
        getSearchParamValue(
          resolvedSearchParams.page,
        ),
    });


  /* ------------------------------------------------------------------------
     DATA
     ------------------------------------------------------------------------ */

  const {
    filters,
    kpis,
    filterOptions,
    shipments,
    pagination,
  } =
    data;


  const hasShipments =
    shipments.length >
    0;


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <div className={styles.livraisonsPage}>
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <LivraisonsHeader />


      {/* ==================================================================
          KPI
          ================================================================== */}

      <LivraisonsKpiGrid
        kpis={kpis}
      />


      {/* ==================================================================
          FILTERS
          ================================================================== */}

      <LivraisonsFilters
        filters={filters}
        options={filterOptions}
      />


      {/* ==================================================================
          RESULTS
          ================================================================== */}

      {hasShipments ? (
        <LivraisonsTable
          shipments={shipments}
          filters={filters}
          pagination={pagination}
        />
      ) : (
        <LivraisonsEmptyState
          filters={filters}
        />
      )}
    </div>
  );
}