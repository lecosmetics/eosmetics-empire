"use client";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCcw,
} from "lucide-react";

import styles from "../clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL CLIENT — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/clients/[clientId]/error.tsx
 *
 * Route :
 *
 * /gestionnaire/clients/[clientId]
 *
 * RÔLE :
 *
 * Afficher un état d'erreur propre lorsqu'une erreur inattendue empêche
 * le chargement du détail d'un client.
 *
 * IMPORTANT :
 *
 * - ne jamais afficher le message brut de l'erreur ;
 * - ne jamais afficher la stack ;
 * - ne jamais exposer Prisma ;
 * - ne jamais exposer la base de données ;
 * - ne jamais exposer storeId ;
 * - ne jamais exposer managerId ;
 * - ne jamais exposer les données d'un autre client ;
 * - ne jamais créer de fausses données ;
 * - ne jamais recréer la sidebar ;
 * - ne jamais recréer le header global ;
 * - ne jamais créer un <main> imbriqué ;
 * - rester dans le shell privé Gestionnaire existant.
 *
 * Le cas "client inexistant ou non autorisé" n'arrive normalement pas ici :
 *
 * page.tsx utilise notFound().
 *
 * Ce fichier traite uniquement les erreurs inattendues du segment.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const CLIENTS_ROUTE =
  "/gestionnaire/clients";


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

interface ClientDetailErrorProps {
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

export default function ClientDetailError({
  reset,
}: ClientDetailErrorProps) {
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
          aria-labelledby="client-detail-error-title"
          aria-describedby="client-detail-error-description"
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
                size={27}
                strokeWidth={1.8}
              />
            </div>


            {/* =============================================================
                TITRE
                ============================================================= */}

            <h1
              id="client-detail-error-title"
              className={
                styles.clientsErrorTitle
              }
            >
              Impossible de charger ce client.
            </h1>


            {/* =============================================================
                DESCRIPTION
                ============================================================= */}

            <p
              id="client-detail-error-description"
              className={
                styles.clientsErrorDescription
              }
            >
              Une erreur est survenue pendant le chargement des informations
              du client. Vous pouvez réessayer ou revenir à la liste des
              clients.
            </p>


            {/* =============================================================
                ACTIONS
                ============================================================= */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                flexWrap:
                  "wrap",

                gap:
                  "10px",

                marginTop:
                  "18px",
              }}
            >
              {/* -----------------------------------------------------------
                  RÉESSAYER
                  ----------------------------------------------------------- */}

              <button
                type="button"
                className={
                  styles.clientsErrorRetry
                }
                onClick={
                  reset
                }
                style={{
                  marginTop:
                    0,
                }}
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


              {/* -----------------------------------------------------------
                  RETOUR
                  ----------------------------------------------------------- */}

              <Link
                href={
                  CLIENTS_ROUTE
                }
                className={
                  styles.clientDetailBackButton
                }
              >
                <ArrowLeft
                  size={16}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>
                  Retour aux clients
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}