"use client";

import {
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import styles from "./categories.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/categories/error.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher une erreur propre lorsqu'une erreur inattendue empêche le
 * chargement de la page Catégories.
 *
 * COMPORTEMENT :
 *
 * - afficher un message utilisateur simple ;
 * - ne jamais afficher de stack technique ;
 * - ne jamais afficher de message Prisma brut ;
 * - permettre de réessayer avec reset() ;
 * - rester dans le GestionnaireShell existant ;
 * - conserver la pleine largeur de la page.
 *
 * IMPORTANT :
 *
 * Ce fichier ne doit jamais :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - exposer des données sensibles ;
 * - afficher error.message à l'utilisateur ;
 * - afficher error.stack ;
 * - créer une catégorie ;
 * - modifier une catégorie ;
 * - supprimer une catégorie ;
 * - recréer la sidebar ;
 * - recréer le header global.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface CategoriesErrorProps {
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

export default function CategoriesError({
  reset,
}: CategoriesErrorProps) {
  return (
    <div
      className={
        styles.categoriesPage
      }
    >
      <main
        className={
          styles.categoriesMain
        }
      >
        <section
          className={
            styles.categoriesError
          }
          role="alert"
          aria-labelledby="categories-error-title"
          aria-describedby="categories-error-description"
        >
          <div
            className={
              styles.categoriesErrorContent
            }
          >
            {/* ===========================================================
                ICÔNE
                =========================================================== */}

            <div
              className={
                styles.categoriesEmptyIcon
              }
              aria-hidden="true"
            >
              <AlertTriangle
                size={28}
                strokeWidth={1.8}
              />
            </div>


            {/* ===========================================================
                TITRE
                =========================================================== */}

            <h1
              id="categories-error-title"
              className={
                styles.categoriesErrorTitle
              }
            >
              Impossible de charger les catégories
            </h1>


            {/* ===========================================================
                DESCRIPTION
                =========================================================== */}

            <p
              id="categories-error-description"
              className={
                styles.categoriesErrorDescription
              }
            >
              Une erreur est survenue pendant le chargement des catégories.
              Veuillez réessayer.
            </p>


            {/* ===========================================================
                ACTION
                =========================================================== */}

            <button
              type="button"
              className={
                styles.categoriesErrorRetry
              }
              onClick={
                reset
              }
            >
              <RotateCcw
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                Réessayer
              </span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}