"use client";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import styles from "./statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/statistiques/error.tsx
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur de rendu du segment Statistiques ;
 * - afficher un message utilisateur simple et sûr ;
 * - permettre de réessayer avec reset() ;
 * - ne jamais afficher de stack technique ;
 * - ne jamais afficher une erreur Prisma brute ;
 * - ne jamais exposer de données sensibles ;
 * - conserver le layout Gestionnaire existant ;
 * - rester responsive et pleine largeur.
 *
 *
 * IMPORTANT :
 *
 * Ce fichier ne :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne modifie aucune donnée ;
 * - ne recrée aucun <main> ;
 * - ne recrée aucune sidebar ;
 * - ne recrée aucun header global ;
 * - n'invente aucune route.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

interface StatisticsErrorProps {
  readonly error:
    Error & {
      digest?:
        string;
    };

  readonly reset:
    () => void;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StatisticsError({
  error,
  reset,
}: StatisticsErrorProps) {
  /**
   * `digest` est un identifiant technique opaque fourni par Next.js.
   *
   * Il peut être utile pour identifier une erreur côté support
   * sans exposer :
   *
   * - la stack ;
   * - le message Prisma ;
   * - les chemins serveur ;
   * - les données internes.
   */

  const errorReference =
    typeof error.digest ===
      "string" &&
    error.digest.trim().length >
      0
      ? error.digest.trim()
      : null;


  return (
    <div className={styles.statisticsPage}>
      <section
        className={styles.statisticsEmptyState}
        role="alert"
        aria-labelledby="statistics-error-title"
        aria-describedby="statistics-error-description"
      >
        {/* ==================================================================
            ICON
            ================================================================== */}

        <div
          className={styles.statisticsEmptyIcon}
          aria-hidden="true"
        >
          <AlertTriangle
            size={34}
            strokeWidth={1.8}
          />
        </div>


        {/* ==================================================================
            CONTENT
            ================================================================== */}

        <div className={styles.statisticsEmptyContent}>
          <h1
            id="statistics-error-title"
            className={styles.statisticsEmptyTitle}
          >
            Impossible de charger les statistiques
          </h1>


          <p
            id="statistics-error-description"
            className={styles.statisticsEmptyDescription}
          >
            Une erreur est survenue pendant le chargement des données de votre
            boutique. Vous pouvez réessayer sans quitter cette page.
          </p>


          {/* ================================================================
              SAFE ERROR REFERENCE
              ================================================================ */}

          {errorReference ? (
            <p
              className={styles.statisticsTableMuted}
              aria-label={`Référence de l’erreur : ${errorReference}`}
            >
              Référence : {errorReference}
            </p>
          ) : null}


          {/* ================================================================
              RETRY
              ================================================================ */}

          <button
            type="button"
            onClick={reset}
            className={styles.statisticsRecommendationAction}
          >
            <RefreshCw
              size={16}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Réessayer
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}