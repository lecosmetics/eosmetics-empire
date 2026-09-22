import type {
  Metadata,
} from "next";

import ClientsEmptyState from "@/components/gestionnaire/clients/ClientsEmptyState";
import ClientsFilters from "@/components/gestionnaire/clients/ClientsFilters";
import ClientsHeader from "@/components/gestionnaire/clients/ClientsHeader";
import ClientsKpiGrid from "@/components/gestionnaire/clients/ClientsKpiGrid";
import ClientsTable from "@/components/gestionnaire/clients/ClientsTable";

import {
  getManagerClientsPageData,
} from "@/lib/gestionnaire/clients/client-query";

import styles from "./clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/clients
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/clients/page.tsx
 *
 * RESPONSABILITÉS :
 *
 * - rester un Server Component ;
 * - lire uniquement les paramètres utiles de l'URL ;
 * - transmettre ces paramètres à client-query.ts ;
 * - laisser client-query.ts déterminer le vrai storeId depuis la session ;
 * - afficher les KPI réels ;
 * - afficher les filtres ;
 * - afficher les vrais clients ;
 * - afficher l'état vide adapté ;
 * - conserver une page pleine largeur dans le Main Gestionnaire.
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - faire directement de requête Prisma ;
 * - accepter un storeId depuis l'URL ;
 * - accepter un managerId depuis l'URL ;
 * - recréer la sidebar ;
 * - recréer le header global ;
 * - créer un autre <main> ;
 * - générer de fausses données ;
 * - calculer les KPI côté navigateur ;
 * - contenir de logique métier financière.
 *
 * ============================================================================
 */


/* ==========================================================================
   NEXT.JS — DONNÉES PRIVÉES
   ========================================================================== */

/**
 * Cette page contient des données propres au Gestionnaire authentifié.
 *
 * Elle doit être rendue dynamiquement et ne doit pas être transformée
 * en page statique partagée.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/**
 * Prisma fonctionne côté serveur Node.js dans cette architecture.
 */

export const runtime =
  "nodejs";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Clients | Cosmetics Empire",

    description:
      "Consultez les clients ayant passé commande dans votre boutique.",

    robots: {
      index:
        false,

      follow:
        false,
    },
  };


/* ==========================================================================
   SEARCH PARAMS
   ========================================================================== */

interface ClientsPageSearchParams {
  readonly q?:
    string | string[];

  readonly city?:
    string | string[];

  readonly status?:
    string | string[];

  readonly sort?:
    string | string[];

  readonly page?:
    string | string[];
}


interface ClientsPageProps {
  readonly searchParams:
    Promise<ClientsPageSearchParams>;
}


/* ==========================================================================
   PARAMÈTRE UNIQUE
   ========================================================================== */

/**
 * Next.js peut techniquement fournir plusieurs valeurs pour un même
 * query param.
 *
 * La page Clients n'en utilise qu'une.
 *
 * Exemple :
 *
 * ?city=Cotonou&city=Abomey
 *
 * devient simplement :
 *
 * Cotonou
 *
 * client-query.ts effectue ensuite sa propre normalisation et sa propre
 * validation métier.
 */

function getSingleSearchParameter(
  value:
    string | string[] | undefined,
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
   PAGE
   ========================================================================== */

export default async function ClientsPage({
  searchParams,
}: ClientsPageProps) {
  /* ------------------------------------------------------------------------
     1. QUERY PARAMS
     ------------------------------------------------------------------------ */

  const params =
    await searchParams;


  const q =
    getSingleSearchParameter(
      params.q,
    );


  const city =
    getSingleSearchParameter(
      params.city,
    );


  const status =
    getSingleSearchParameter(
      params.status,
    );


  const sort =
    getSingleSearchParameter(
      params.sort,
    );


  const page =
    getSingleSearchParameter(
      params.page,
    );


  /* ------------------------------------------------------------------------
     2. DONNÉES RÉELLES
     ------------------------------------------------------------------------
     
     getManagerClientsPageData() :
     
     - vérifie l'accès Gestionnaire ;
     - récupère le storeId depuis la session ;
     - applique les filtres ;
     - calcule les KPI ;
     - récupère les villes réelles ;
     - applique la pagination serveur ;
     - récupère uniquement les clients autorisés ;
     - calcule les montants confirmés par devise.
     
     Aucun storeId n'est fourni ici.
     ------------------------------------------------------------------------ */

  const data =
    await getManagerClientsPageData({
      q,
      city,
      status,
      sort,
      page,
    });


  /* ------------------------------------------------------------------------
     3. ÉTAT
     ------------------------------------------------------------------------ */

  const hasClients =
    data.clients.length >
    0;


  /* ------------------------------------------------------------------------
     4. RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.clientsPage
      }
    >
      <div
        className={
          styles.clientsContent
        }
      >
        {/* ================================================================
            HEADER DE LA PAGE
            ================================================================ */}

        <ClientsHeader />


        {/* ================================================================
            KPI
            ================================================================ */}

        <ClientsKpiGrid
          kpis={
            data.kpis
          }
        />


        {/* ================================================================
            FILTRES
            ================================================================ */}

        <ClientsFilters
          filters={
            data.filters
          }
          filterOptions={
            data.filterOptions
          }
        />


        {/* ================================================================
            LISTE / EMPTY STATE
            ================================================================ */}

        {hasClients ? (
          <ClientsTable
            clients={
              data.clients
            }
            filters={
              data.filters
            }
            pagination={
              data.pagination
            }
          />
        ) : (
          <ClientsEmptyState
            filters={
              data.filters
            }
          />
        )}
      </div>
    </div>
  );
}