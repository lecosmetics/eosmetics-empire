"use client";

import {
  useTransition,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  LoaderCircle,
  RefreshCcw,
} from "lucide-react";

import styles from "../livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL LIVRAISON — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/[deliveryId]/error.tsx
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur inattendue sur la fiche d'une livraison ;
 * - afficher une interface utilisateur contrôlée ;
 * - ne jamais afficher de stack trace ;
 * - ne jamais afficher une erreur Prisma brute ;
 * - ne jamais exposer les données d'une cliente ;
 * - permettre de relancer le rendu avec reset() ;
 * - permettre de revenir à la liste des livraisons ;
 * - conserver le GestionnaireShell existant ;
 * - utiliser toute la largeur disponible du Main.
 *
 *
 * IMPORTANT :
 *
 * notFound() n'est pas traité ici.
 *
 * Une livraison :
 *
 * - inexistante ;
 * - appartenant à une autre boutique ;
 * - inaccessible ;
 *
 * doit être gérée par :
 *
 * notFound()
 *
 * dans :
 *
 * [deliveryId]/page.tsx
 *
 *
 * Ce error.tsx intervient uniquement lorsqu'une erreur inattendue
 * empêche le rendu normal de la fiche.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

interface LivraisonDetailErrorProps {
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

export default function LivraisonDetailError({
  reset,
}: LivraisonDetailErrorProps) {
  /* =========================================================================
     RETRY TRANSITION
     ========================================================================= */

  const [
    isRetrying,
    startRetryTransition,
  ] =
    useTransition();


  /* =========================================================================
     RETRY
     ========================================================================= */

  function handleRetry():
    void {
    if (
      isRetrying
    ) {
      return;
    }


    startRetryTransition(
      () => {
        reset();
      },
    );
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <div className={styles.livraisonDetail}>
      <section
        className={styles.livraisonsEmptyState}
        role="alert"
        aria-labelledby="livraison-detail-error-title"
        aria-describedby="livraison-detail-error-description"
      >
        {/* ==================================================================
            ICON
            ================================================================== */}

        <div
          className={styles.livraisonsEmptyIcon}
          aria-hidden="true"
        >
          <AlertTriangle
            size={31}
            strokeWidth={1.8}
          />
        </div>


        {/* ==================================================================
            CONTENT
            ================================================================== */}

        <div className={styles.livraisonsEmptyContent}>
          <h1
            id="livraison-detail-error-title"
            className={styles.livraisonsEmptyTitle}
          >
            Impossible de charger cette livraison.
          </h1>


          <p
            id="livraison-detail-error-description"
            className={styles.livraisonsEmptyDescription}
          >
            Une erreur est survenue pendant le chargement des informations
            de cette livraison. Vous pouvez réessayer ou revenir à la liste
            des livraisons.
          </p>


          {/* ================================================================
              ACTIONS
              ================================================================ */}

          <div className={styles.livraisonDetailActionsButtons}>
            {/* --------------------------------------------------------------
                BACK
                -------------------------------------------------------------- */}

            <Link
              href={LIVRAISONS_ROUTE}
              className={styles.livraisonDetailDialogSecondaryButton}
            >
              <ArrowLeft
                size={16}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                Retour aux livraisons
              </span>
            </Link>


            {/* --------------------------------------------------------------
                RETRY
                -------------------------------------------------------------- */}

            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className={styles.livraisonDetailDialogConfirmButton}
            >
              {isRetrying ? (
                <>
                  <LoaderCircle
                    className={styles.livraisonDetailSpinner}
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Rechargement...
                  </span>
                </>
              ) : (
                <>
                  <RefreshCcw
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Réessayer
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>


      {/* ==================================================================
          ACCESSIBILITY
          ================================================================== */}

      <span
        className={styles.livraisonsVisuallyHidden}
        aria-live="polite"
      >
        {isRetrying
          ? "Nouvelle tentative de chargement de la livraison."
          : ""}
      </span>
    </div>
  );
}