"use client";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import styles from "./commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/commandes/error.tsx
 *
 * Route concernée :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Intercepter une erreur inattendue survenue pendant le rendu de la route
 * Commandes et afficher un état d'erreur propre au Gestionnaire.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - est obligatoirement un Client Component pour fonctionner comme
 *   Error Boundary Next.js ;
 * - n'affiche jamais la stack technique ;
 * - n'affiche jamais error.message au Gestionnaire ;
 * - n'affiche jamais le digest d'erreur ;
 * - ne révèle aucune donnée Prisma ;
 * - ne révèle aucune donnée de session ;
 * - ne révèle aucun storeId ;
 * - ne révèle aucun managerId ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas de <main> supplémentaire ;
 * - ne crée aucune route fictive ;
 * - permet uniquement de relancer le segment avec reset().
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

export interface ManagerOrdersErrorProps {
  /**
   * Erreur reçue par l'Error Boundary.
   *
   * Elle est volontairement conservée dans la signature officielle
   * du composant mais son contenu n'est jamais rendu dans l'interface.
   */
  readonly error:
    Error & {
      digest?:
        string;
    };

  /**
   * Fonction fournie par Next.js.
   *
   * Elle demande à React / Next.js de tenter de rendre de nouveau
   * le segment concerné.
   */
  readonly reset:
    () => void;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ManagerOrdersError({
  reset,
}: ManagerOrdersErrorProps) {
  return (
    <div
      className={
        styles.ordersPage
      }
    >
      <section
        className={
          styles.ordersError
        }
        role="alert"
        aria-labelledby="orders-error-title"
        aria-describedby="orders-error-description"
      >
        <div
          className={
            styles.ordersErrorContent
          }
        >
          {/* ===============================================================
              ICÔNE
              =============================================================== */}

          <div
            className={
              styles.ordersErrorIcon
            }
            aria-hidden="true"
          >
            <AlertTriangle
              size={28}
              strokeWidth={1.8}
            />
          </div>


          {/* ===============================================================
              MESSAGE
              =============================================================== */}

          <h1
            id="orders-error-title"
            className={
              styles.ordersErrorTitle
            }
          >
            Impossible de charger les commandes.
          </h1>


          <p
            id="orders-error-description"
            className={
              styles.ordersErrorDescription
            }
          >
            Une erreur est survenue pendant le chargement de cette page.
            Réessayez pour charger de nouveau vos commandes.
          </p>


          {/* ===============================================================
              RÉESSAYER
              =============================================================== */}

          <button
            type="button"
            className={
              styles.ordersErrorRetry
            }
            onClick={
              reset
            }
          >
            <RefreshCw
              size={17}
              strokeWidth={1.8}
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