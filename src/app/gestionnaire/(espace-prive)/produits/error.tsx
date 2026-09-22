"use client";

import {
  useEffect,
} from "react";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import styles from "./produits.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ERROR — MES PRODUITS
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/error.tsx
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur inattendue de la route Mes produits ;
 * - ne jamais afficher directement une erreur Prisma ;
 * - ne jamais afficher une stack technique au Gestionnaire ;
 * - proposer une action Réessayer ;
 * - conserver le layout Gestionnaire existant ;
 * - ne jamais recréer Sidebar / Header ;
 * - rester pleine largeur dans le Main ;
 * - fonctionner sur PC et mobile.
 *
 * IMPORTANT :
 *
 * Cette page est un Error Boundary Next.js.
 *
 * Elle doit obligatoirement être un Client Component afin de recevoir
 * et utiliser la fonction reset().
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

interface GestionnaireProductsErrorProps {
  error:
    Error & {
      digest?:
        string;
    };

  reset:
    () => void;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function GestionnaireProductsError({
  error,
  reset,
}: GestionnaireProductsErrorProps) {
  /* ------------------------------------------------------------------------
     JOURNALISATION CÔTÉ CLIENT
     ------------------------------------------------------------------------
     L'erreur complète peut être visible dans la console de développement
     pour faciliter le diagnostic.

     Elle n'est jamais affichée directement dans l'interface Gestionnaire.
     ------------------------------------------------------------------------ */

  useEffect(
    () => {
      console.error(
        "[Cosmetics Empire] Impossible de charger la page Mes produits.",
        error,
      );
    },
    [
      error,
    ],
  );


  /* ------------------------------------------------------------------------
     RETRY
     ------------------------------------------------------------------------ */

  function handleRetry():
    void {
    reset();
  }


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <section
      className={
        styles.productsPage
      }
      aria-labelledby="products-error-title"
    >
      <div
        className={
          styles.productsContent
        }
      >
        <div
          className={
            styles.productsError
          }
        >
          <div
            className={
              styles.productsErrorCard
            }
            role="alert"
            aria-live="assertive"
          >
            {/* ==========================================================
                ICON
                ========================================================== */}

            <div
              className={
                styles.productsErrorIcon
              }
              aria-hidden="true"
            >
              <AlertTriangle
                size={25}
                strokeWidth={1.8}
              />
            </div>


            {/* ==========================================================
                TITLE
                ========================================================== */}

            <h1
              id="products-error-title"
              className={
                styles.productsErrorTitle
              }
            >
              Impossible de charger les produits
            </h1>


            {/* ==========================================================
                DESCRIPTION
                ========================================================== */}

            <p
              className={
                styles.productsErrorDescription
              }
            >
              Une erreur est survenue pendant le chargement de vos
              produits. Vos données n’ont pas été modifiées.
              Réessayez dans quelques instants.
            </p>


            {/* ==========================================================
                RETRY
                ========================================================== */}

            <button
              type="button"
              className={
                styles.productsErrorRetry
              }
              onClick={
                handleRetry
              }
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
        </div>
      </div>
    </section>
  );
}