"use client";

import {
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

import styles from "./clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/clients/error.tsx
 *
 * Route concernée :
 *
 * /gestionnaire/clients
 *
 * RÔLE :
 *
 * Afficher un état d'erreur propre lorsque la page Clients ne peut pas être
 * chargée correctement.
 *
 * IMPORTANT :
 *
 * - ne jamais afficher la stack technique au Gestionnaire ;
 * - ne jamais exposer le message brut d'une erreur serveur ;
 * - ne jamais exposer Prisma ;
 * - ne jamais exposer la base de données ;
 * - ne jamais exposer storeId ;
 * - ne jamais exposer managerId ;
 * - ne jamais afficher de fausses données ;
 * - ne pas recréer le shell ;
 * - ne pas recréer la sidebar ;
 * - ne pas recréer le header global ;
 * - ne pas créer de <main> imbriqué ;
 * - garder la page pleine largeur dans le Main Gestionnaire existant.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface ClientsErrorProps {
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

export default function ClientsError({
  reset,
}: ClientsErrorProps) {
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
        <section
          className={
            styles.clientsError
          }
          role="alert"
          aria-live="assertive"
          aria-labelledby="clients-error-title"
          aria-describedby="clients-error-description"
        >
          <div
            className={
              styles.clientsErrorContent
            }
          >
            {/* =============================================================
                ICÔNE
                ============================================================= */}

            <div
              className={
                styles.clientsErrorIcon
              }
              aria-hidden="true"
            >
              <AlertTriangle
                size={26}
                strokeWidth={1.8}
              />
            </div>


            {/* =============================================================
                TITRE
                ============================================================= */}

            <h1
              id="clients-error-title"
              className={
                styles.clientsErrorTitle
              }
            >
              Impossible de charger les clients.
            </h1>


            {/* =============================================================
                DESCRIPTION
                ============================================================= */}

            <p
              id="clients-error-description"
              className={
                styles.clientsErrorDescription
              }
            >
              Une erreur est survenue pendant le chargement des données.
              Réessayez pour actualiser la page.
            </p>


            {/* =============================================================
                RÉESSAYER
                ============================================================= */}

            <button
              type="button"
              className={
                styles.clientsErrorRetry
              }
              onClick={
                reset
              }
            >
              <RefreshCcw
                size={16}
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
    </div>
  );
}