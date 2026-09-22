import Link from "next/link";

import {
  RotateCcw,
  SearchX,
  Users,
} from "lucide-react";

import {
  DEFAULT_MANAGER_CLIENTS_SORT,
  type ManagerClientsFilters,
} from "@/lib/gestionnaire/clients/client-types";

import styles from "@/app/gestionnaire/(espace-prive)/clients/clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — EMPTY STATE CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/clients/ClientsEmptyState.tsx
 *
 * Route :
 *
 * /gestionnaire/clients
 *
 * RÔLE :
 *
 * Afficher un état vide propre lorsque :
 *
 * 1. aucun client n'a encore réellement commandé dans la boutique ;
 *
 * ou
 *
 * 2. des filtres sont appliqués mais aucun client ne correspond.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne crée aucun client ;
 * - ne propose aucun bouton "Ajouter un client" ;
 * - ne contient aucune donnée fictive ;
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne modifie aucune donnée ;
 * - ne supprime aucune donnée ;
 * - ne crée aucune route supplémentaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const CLIENTS_ROUTE =
  "/gestionnaire/clients";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ClientsEmptyStateProps {
  readonly filters:
    ManagerClientsFilters;
}


/* ==========================================================================
   DÉTECTION DES FILTRES ACTIFS
   ========================================================================== */

/**
 * La pagination n'est volontairement pas considérée comme un filtre métier.
 *
 * Les filtres actifs sont uniquement :
 *
 * - recherche ;
 * - ville ;
 * - statut ;
 * - tri différent du tri par défaut.
 */

function hasActiveClientFilters(
  filters:
    ManagerClientsFilters,
): boolean {
  return Boolean(
    filters.q.trim() ||
      filters.city.trim() ||
      filters.status !==
        "all" ||
      filters.sort !==
        DEFAULT_MANAGER_CLIENTS_SORT,
  );
}


/* ==========================================================================
   ÉTAT — AUCUN CLIENT
   ========================================================================== */

function NoClientsState() {
  return (
    <>
      <div
        className={
          styles.clientsEmptyIcon
        }
        aria-hidden="true"
      >
        <Users
          size={30}
          strokeWidth={1.7}
        />
      </div>


      <div
        className={
          styles.clientsEmptyContent
        }
      >
        <h2
          className={
            styles.clientsEmptyTitle
          }
        >
          Aucun client pour le moment.
        </h2>


        <p
          className={
            styles.clientsEmptyDescription
          }
        >
          Les clients apparaîtront ici dès qu’ils auront passé une commande
          dans votre boutique.
        </p>
      </div>
    </>
  );
}


/* ==========================================================================
   ÉTAT — AUCUN RÉSULTAT
   ========================================================================== */

function NoFilteredClientsState() {
  return (
    <>
      <div
        className={
          styles.clientsEmptyIcon
        }
        aria-hidden="true"
      >
        <SearchX
          size={30}
          strokeWidth={1.7}
        />
      </div>


      <div
        className={
          styles.clientsEmptyContent
        }
      >
        <h2
          className={
            styles.clientsEmptyTitle
          }
        >
          Aucun client ne correspond à votre recherche.
        </h2>


        <p
          className={
            styles.clientsEmptyDescription
          }
        >
          Modifiez vos critères de recherche ou réinitialisez les filtres pour
          afficher de nouveau les clients disponibles.
        </p>


        <Link
          href={
            CLIENTS_ROUTE
          }
          className={
            styles.clientsEmptyResetButton
          }
        >
          <RotateCcw
            size={16}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            Réinitialiser les filtres
          </span>
        </Link>
      </div>
    </>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function ClientsEmptyState({
  filters,
}: ClientsEmptyStateProps) {
  const hasFilters =
    hasActiveClientFilters(
      filters,
    );


  return (
    <section
      className={
        styles.clientsEmptyState
      }
      aria-labelledby="clients-empty-state-title"
    >
      {/*
       * Le titre visible est déjà présent dans l'état correspondant.
       *
       * Ce texte permet de fournir un intitulé stable à la section
       * sans modifier le rendu visuel.
       */}

      <span
        id="clients-empty-state-title"
        className={
          styles.clientsVisuallyHidden
        }
      >
        {hasFilters
          ? "Aucun résultat pour les filtres clients"
          : "Aucun client"}
      </span>


      {hasFilters ? (
        <NoFilteredClientsState />
      ) : (
        <NoClientsState />
      )}
    </section>
  );
}