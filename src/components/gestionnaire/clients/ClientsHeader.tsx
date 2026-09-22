import Link from "next/link";

import {
  ChevronRight,
  Download,
} from "lucide-react";

import styles from "@/app/gestionnaire/(espace-prive)/clients/clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/clients/ClientsHeader.tsx
 *
 * Route :
 *
 * /gestionnaire/clients
 *
 * RÔLE :
 *
 * Afficher l'en-tête de la page Clients :
 *
 * - fil d'Ariane ;
 * - titre ;
 * - sous-titre ;
 * - emplacement du bouton Exporter.
 *
 * IMPORTANT :
 *
 * - aucune donnée fictive ;
 * - aucune requête Prisma ;
 * - aucune lecture de session ;
 * - aucune nouvelle navigation ;
 * - aucun nouveau shell ;
 * - aucun nouveau header global ;
 * - aucun export fictif.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE OFFICIELLE
   ========================================================================== */

const CLIENTS_ROUTE =
  "/gestionnaire/clients";


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ClientsHeader() {
  return (
    <header
      className={
        styles.clientsHeader
      }
    >
      {/* ===================================================================
          FIL D'ARIANE
          =================================================================== */}

      <nav
        className={
          styles.clientsBreadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <Link
          href={
            CLIENTS_ROUTE
          }
          className={
            styles.clientsBreadcrumbLink
          }
        >
          Clients
        </Link>


        <ChevronRight
          className={
            styles.clientsBreadcrumbSeparator
          }
          size={14}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <span
          className={
            styles.clientsBreadcrumbCurrent
          }
          aria-current="page"
        >
          Tous les clients
        </span>
      </nav>


      {/* ===================================================================
          TITRE + ACTION
          =================================================================== */}

      <div
        className={
          styles.clientsHeaderRow
        }
      >
        {/* =================================================================
            TEXTE
            ================================================================= */}

        <div
          className={
            styles.clientsHeaderContent
          }
        >
          <h1
            className={
              styles.clientsTitle
            }
          >
            Clients
          </h1>


          <p
            className={
              styles.clientsSubtitle
            }
          >
            Tous les clients qui ont passé commande dans votre boutique.
          </p>
        </div>


        {/* =================================================================
            EXPORT
            =================================================================
            
            Aucun vrai export Clients n'est actuellement implémenté.
            
            Le bouton reste donc volontairement désactivé.
            
            Ne pas lui ajouter :
            
            - href fictif ;
            - route API fictive ;
            - génération CSV côté navigateur ;
            - données mockées.
            
            Lorsqu'un vrai export sécurisé sera créé, il devra obligatoirement
            être scoppé au store du Gestionnaire connecté.
            ================================================================= */}

        <div
          className={
            styles.clientsHeaderActions
          }
        >
          <button
            type="button"
            className={[
              styles.clientsExportButton,
              styles.clientsExportButtonDisabled,
            ].join(" ")}
            disabled
            aria-disabled="true"
            title="L’export sera disponible lorsqu’une fonctionnalité d’export sécurisée sera mise en place."
          >
            <Download
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              Exporter
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}