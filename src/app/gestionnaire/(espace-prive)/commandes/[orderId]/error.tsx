"use client";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";

import styles from "../commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — ERREUR DÉTAIL COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/commandes/[orderId]/error.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes/[orderId]
 *
 * RÔLE :
 *
 * Intercepter une erreur inattendue survenue pendant le chargement ou le rendu
 * du détail d'une commande.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - est un Client Component ;
 * - respecte le contrat Error Boundary de Next.js ;
 * - n'affiche jamais error.message ;
 * - n'affiche jamais error.stack ;
 * - n'affiche jamais error.digest ;
 * - ne révèle aucune information Prisma ;
 * - ne révèle aucun storeId ;
 * - ne révèle aucun managerId ;
 * - ne révèle aucun identifiant interne supplémentaire ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas de <main> imbriqué ;
 * - ne crée aucune route métier supplémentaire ;
 * - permet uniquement :
 *     - de réessayer avec reset() ;
 *     - de revenir vers la liste officielle des commandes.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE
   ========================================================================== */

const ORDERS_ROUTE =
  "/gestionnaire/commandes";


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

export interface ManagerOrderDetailErrorProps {
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

export default function ManagerOrderDetailError({
  reset,
}: ManagerOrderDetailErrorProps) {
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
        aria-labelledby="order-detail-error-title"
        aria-describedby="order-detail-error-description"
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
              TITRE
              =============================================================== */}

          <h1
            id="order-detail-error-title"
            className={
              styles.ordersErrorTitle
            }
          >
            Impossible de charger cette commande.
          </h1>


          {/* ===============================================================
              DESCRIPTION
              =============================================================== */}

          <p
            id="order-detail-error-description"
            className={
              styles.ordersErrorDescription
            }
          >
            Une erreur est survenue pendant le chargement du détail de la
            commande. Vous pouvez réessayer ou revenir à la liste des
            commandes.
          </p>


          {/* ===============================================================
              ACTIONS
              =============================================================== */}

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
                "16px",
            }}
          >
            {/* =============================================================
                RÉESSAYER
                ============================================================= */}

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


            {/* =============================================================
                RETOUR COMMANDES
                ============================================================= */}

            <Link
              href={
                ORDERS_ROUTE
              }
              className={
                styles.ordersEmptyResetButton
              }
            >
              <ArrowLeft
                size={17}
                strokeWidth={1.8}
                aria-hidden="true"
              />

              <span>
                Retour aux commandes
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}