"use client";

import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
} from "react";

import {
  routes,
} from "@/config/routes";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD ERROR BOUNDARY
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(espace-prive)/dashboard/error.tsx

   OBJECTIFS :

   - intercepter proprement une erreur du Dashboard ;
   - ne pas faire tomber tout l'espace Gestionnaire ;
   - ne jamais exposer les détails internes au navigateur ;
   - permettre de relancer le rendu de la page ;
   - conserver le layout Gestionnaire existant ;
   - rester propre sur PC et mobile ;
   - utiliser toute la largeur disponible du workspace.

   IMPORTANT :

   Ce fichier ne recrée :
   - ni Sidebar ;
   - ni Header ;
   - ni GestionnaireShell.

   Il remplace uniquement le contenu du Dashboard lorsqu'une
   erreur non gérée survient.
   ============================================================ */


/* ============================================================
   PROPS NEXT.JS ERROR BOUNDARY
   ============================================================ */

type GestionnaireDashboardErrorProps =
  Readonly<{
    error:
      Error & {
        digest?:
          string;
      };

    reset:
      () => void;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireDashboardError({
  error,
  reset,
}: GestionnaireDashboardErrorProps) {
  /* ==========================================================
     SERVER / CLIENT LOGGING
     ----------------------------------------------------------
     On ne rend jamais error.message ou error.stack dans
     l'interface.

     Le log permet néanmoins de garder une trace pendant le
     développement et dans la plateforme d'observabilité qui
     pourra être branchée plus tard.

     Le digest Next.js peut servir à retrouver une erreur serveur
     sans exposer les détails internes à l'utilisateur.
     ========================================================== */

  useEffect(
    () => {
      console.error(
        "Gestionnaire Dashboard error",
        {
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


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className="gestionnaire-dashboard gestionnaire-dashboard--error"
    >
      <section
        className="gestionnaire-dashboard-error"
        role="alert"
        aria-labelledby="gestionnaire-dashboard-error-title"
        aria-describedby="gestionnaire-dashboard-error-description"
      >
        {/* ====================================================
            ICON
            ==================================================== */}

        <div
          className="gestionnaire-dashboard-error__icon"
          aria-hidden="true"
        >
          <AlertTriangle
            size={30}
            strokeWidth={1.7}
          />
        </div>


        {/* ====================================================
            CONTENT
            ==================================================== */}

        <div
          className="gestionnaire-dashboard-error__content"
        >
          <p
            className="gestionnaire-dashboard-error__eyebrow"
          >
            Tableau de bord
          </p>

          <h1
            id="gestionnaire-dashboard-error-title"
            className="gestionnaire-dashboard-error__title"
          >
            Impossible de charger les données
          </h1>

          <p
            id="gestionnaire-dashboard-error-description"
            className="gestionnaire-dashboard-error__description"
          >
            Une erreur est survenue pendant le chargement de votre tableau de
            bord. Vous pouvez réessayer immédiatement.
          </p>


          {/* ==================================================
              ACTIONS
              ================================================== */}

          <div
            className="gestionnaire-dashboard-error__actions"
          >
            <button
              type="button"
              className="gestionnaire-dashboard-error__retry"
              onClick={
                reset
              }
            >
              <RefreshCw
                size={18}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                Réessayer
              </span>
            </button>

            <Link
              href={
                routes
                  .gestionnaire
                  .dashboard
              }
              className="gestionnaire-dashboard-error__secondary"
            >
              Recharger le tableau de bord
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}