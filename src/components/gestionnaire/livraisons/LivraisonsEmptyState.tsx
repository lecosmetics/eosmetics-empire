import Link from "next/link";

import {
  PackageOpen,
  RotateCcw,
  SearchX,
} from "lucide-react";

import {
  type ManagerShipmentsFilters,
} from "@/lib/gestionnaire/livraisons/shipment-types";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — EMPTY STATE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonsEmptyState.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher un état vide propre lorsqu'aucune livraison n'existe ;
 * - distinguer l'absence réelle de livraisons d'un résultat filtré vide ;
 * - permettre de réinitialiser les filtres lorsqu'ils ne retournent rien ;
 * - ne proposer aucune création manuelle de livraison ;
 * - ne créer aucune donnée fictive ;
 * - ne contenir aucune logique métier serveur.
 *
 * CAS 1 :
 *
 * aucune livraison dans la boutique
 *
 * ->
 *
 * "Aucune livraison pour le moment."
 *
 *
 * CAS 2 :
 *
 * des filtres sont appliqués mais aucune livraison ne correspond
 *
 * ->
 *
 * "Aucune livraison ne correspond à vos filtres."
 *
 * + bouton Réinitialiser les filtres.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonsEmptyStateProps {
  readonly filters:
    ManagerShipmentsFilters;
}


/* ==========================================================================
   ACTIVE FILTERS
   ========================================================================== */

/**
 * La pagination n'est volontairement pas considérée comme un filtre métier.
 *
 * shipment-query.ts ramène déjà une page hors limite vers une page valide.
 */

function hasActiveFilters(
  filters:
    ManagerShipmentsFilters,
): boolean {
  return (
    filters.q.trim() !==
      "" ||
    filters.dateFrom !==
      "" ||
    filters.dateTo !==
      "" ||
    filters.status !==
      "all" ||
    filters.city.trim() !==
      "" ||
    filters.carrier.trim() !==
      ""
  );
}


/* ==========================================================================
   NO DATA
   ========================================================================== */

function NoLivraisonsYet() {
  return (
    <section
      className={styles.livraisonsEmptyState}
      aria-labelledby="livraisons-empty-title"
      aria-describedby="livraisons-empty-description"
    >
      {/* ==================================================================
          ICON
          ================================================================== */}

      <div
        className={styles.livraisonsEmptyIcon}
        aria-hidden="true"
      >
        <PackageOpen
          size={30}
          strokeWidth={1.7}
        />
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.livraisonsEmptyContent}>
        <h2
          id="livraisons-empty-title"
          className={styles.livraisonsEmptyTitle}
        >
          Aucune livraison pour le moment.
        </h2>


        <p
          id="livraisons-empty-description"
          className={styles.livraisonsEmptyDescription}
        >
          Les livraisons apparaîtront ici lorsque vos commandes seront
          prêtes à être expédiées.
        </p>
      </div>
    </section>
  );
}


/* ==========================================================================
   FILTERED EMPTY
   ========================================================================== */

function NoFilteredLivraisons() {
  return (
    <section
      className={styles.livraisonsEmptyState}
      aria-labelledby="livraisons-filtered-empty-title"
      aria-describedby="livraisons-filtered-empty-description"
    >
      {/* ==================================================================
          ICON
          ================================================================== */}

      <div
        className={styles.livraisonsEmptyIcon}
        aria-hidden="true"
      >
        <SearchX
          size={30}
          strokeWidth={1.7}
        />
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.livraisonsEmptyContent}>
        <h2
          id="livraisons-filtered-empty-title"
          className={styles.livraisonsEmptyTitle}
        >
          Aucune livraison ne correspond à vos filtres.
        </h2>


        <p
          id="livraisons-filtered-empty-description"
          className={styles.livraisonsEmptyDescription}
        >
          Modifiez votre recherche ou réinitialisez les filtres pour
          afficher les autres livraisons disponibles.
        </p>


        <Link
          href={LIVRAISONS_ROUTE}
          className={styles.livraisonsEmptyReset}
        >
          <RotateCcw
            size={16}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            Réinitialiser les filtres
          </span>
        </Link>
      </div>
    </section>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LivraisonsEmptyState({
  filters,
}: LivraisonsEmptyStateProps) {
  if (
    hasActiveFilters(
      filters,
    )
  ) {
    return (
      <NoFilteredLivraisons />
    );
  }


  return (
    <NoLivraisonsYet />
  );
}