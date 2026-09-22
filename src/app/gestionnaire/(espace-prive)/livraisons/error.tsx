"use client";

import {
  useEffect,
} from "react";

import {
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

import styles from "./livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/error.tsx
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur de rendu de la route Livraisons ;
 * - afficher un message utilisateur simple et contrôlé ;
 * - permettre de relancer le chargement avec reset() ;
 * - conserver le GestionnaireShell existant ;
 * - utiliser toute la largeur disponible du Main ;
 * - ne jamais afficher les détails internes de l'erreur ;
 * - ne jamais exposer une stack trace ;
 * - ne jamais exposer une erreur Prisma ;
 * - ne jamais exposer une erreur d'authentification interne ;
 * - ne jamais exposer un secret fournisseur.
 *
 * MESSAGE UTILISATEUR :
 *
 * "Impossible de charger les livraisons."
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonsErrorProps {
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

export default function LivraisonsError({
  error,
  reset,
}: LivraisonsErrorProps) {
  /* =========================================================================
     JOURNALISATION CLIENT CONTRÔLÉE
     ========================================================================= */

  useEffect(
    () => {
      /**
       * On conserve uniquement quelques informations techniques utiles
       * au développement.
       *
       * Le contenu complet de l'erreur n'est jamais affiché dans l'interface.
       *
       * En production, Next.js peut déjà masquer certains détails des erreurs
       * Server Components et fournir uniquement un digest.
       */

      console.error(
        "[Cosmetics Empire] Impossible de charger la page Livraisons.",
        {
          name:
            error.name,

          message:
            error.message,

          digest:
            error.digest ??
            null,
        },
      );
    },
    [
      error,
    ],
  );


  /* =========================================================================
     RETRY
     ========================================================================= */

  function handleRetry():
    void {
    reset();
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <div className={styles.livraisonsPage}>
      <section
        className={styles.livraisonsEmptyState}
        role="alert"
        aria-labelledby="livraisons-error-title"
        aria-describedby="livraisons-error-description"
      >
        {/* ==================================================================
            ICON
            ================================================================== */}

        <div
          className={styles.livraisonsEmptyIcon}
          aria-hidden="true"
        >
          <AlertTriangle
            size={30}
            strokeWidth={1.8}
          />
        </div>


        {/* ==================================================================
            CONTENT
            ================================================================== */}

        <div className={styles.livraisonsEmptyContent}>
          <h1
            id="livraisons-error-title"
            className={styles.livraisonsEmptyTitle}
          >
            Impossible de charger les livraisons.
          </h1>


          <p
            id="livraisons-error-description"
            className={styles.livraisonsEmptyDescription}
          >
            Une erreur est survenue pendant le chargement des données.
            Réessayez pour relancer la lecture des livraisons.
          </p>


          {/* ================================================================
              RETRY
              ================================================================ */}

          <button
            type="button"
            onClick={handleRetry}
            className={styles.livraisonsEmptyReset}
          >
            <RefreshCcw
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