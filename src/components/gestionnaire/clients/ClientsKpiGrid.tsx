import type {
  ReactNode,
} from "react";

import {
  ShoppingBag,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import type {
  ManagerClientsKpis,
} from "@/lib/gestionnaire/clients/client-types";

import styles from "@/app/gestionnaire/(espace-prive)/clients/clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CLIENTS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/clients/ClientsKpiGrid.tsx
 *
 * Route :
 *
 * /gestionnaire/clients
 *
 * RÔLE :
 *
 * Afficher les 4 KPI principaux de la page Clients :
 *
 * 1. Total clients
 * 2. Clients actifs
 * 3. Nouveaux clients
 * 4. Total des commandes
 *
 * IMPORTANT :
 *
 * - aucune requête Prisma ;
 * - aucune session ;
 * - aucun calcul métier côté navigateur ;
 * - aucune donnée fictive ;
 * - aucune valeur codée en dur ;
 * - aucun graphique ;
 * - aucun KPI supplémentaire ;
 * - aucune segmentation CRM inventée.
 *
 * Les valeurs proviennent exclusivement de :
 *
 * getManagerClientsPageData()
 *
 * via :
 *
 * ManagerClientsKpis
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ClientsKpiGridProps {
  readonly kpis:
    ManagerClientsKpis;
}


/* ==========================================================================
   FORMAT NOMBRE
   ========================================================================== */

/**
 * Les KPI sont des compteurs entiers.
 *
 * Intl.NumberFormat est uniquement utilisé pour leur affichage.
 * Aucun calcul n'est effectué ici.
 */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function formatInteger(
  value:
    number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "0";
  }


  return INTEGER_FORMATTER.format(
    Math.max(
      0,
      Math.trunc(
        value,
      ),
    ),
  );
}


/* ==========================================================================
   TONALITÉS
   ========================================================================== */

type ClientKpiTone =
  | "primary"
  | "success"
  | "info"
  | "orders";


function getToneClassName(
  tone:
    ClientKpiTone,
): string {
  switch (
    tone
  ) {
    case "primary":
      return styles.clientsKpiCardPrimary;

    case "success":
      return styles.clientsKpiCardSuccess;

    case "info":
      return styles.clientsKpiCardInfo;

    case "orders":
      return styles.clientsKpiCardOrders;
  }
}


/* ==========================================================================
   CARTE KPI
   ========================================================================== */

interface ClientKpiCardProps {
  readonly label:
    string;

  readonly value:
    number;

  readonly secondary:
    string;

  readonly icon:
    ReactNode;

  readonly tone:
    ClientKpiTone;
}


function ClientKpiCard({
  label,
  value,
  secondary,
  icon,
  tone,
}: ClientKpiCardProps) {
  return (
    <article
      className={[
        styles.clientsKpiCard,
        getToneClassName(
          tone,
        ),
      ].join(" ")}
    >
      {/* =================================================================
          ICÔNE
          ================================================================= */}

      <div
        className={
          styles.clientsKpiIcon
        }
        aria-hidden="true"
      >
        {icon}
      </div>


      {/* =================================================================
          CONTENU
          ================================================================= */}

      <div
        className={
          styles.clientsKpiContent
        }
      >
        <span
          className={
            styles.clientsKpiLabel
          }
        >
          {label}
        </span>


        <strong
          className={
            styles.clientsKpiValue
          }
        >
          {formatInteger(
            value,
          )}
        </strong>


        <span
          className={
            styles.clientsKpiSecondary
          }
        >
          {secondary}
        </span>
      </div>
    </article>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function ClientsKpiGrid({
  kpis,
}: ClientsKpiGridProps) {
  return (
    <section
      className={
        styles.clientsKpiGrid
      }
      aria-label="Résumé des clients"
    >
      {/* =================================================================
          TOTAL CLIENTS
          ================================================================= */}

      <ClientKpiCard
        label="Total clients"
        value={
          kpis.totalClients
        }
        secondary="Clients uniques"
        tone="primary"
        icon={
          <Users
            size={21}
            strokeWidth={1.8}
          />
        }
      />


      {/* =================================================================
          CLIENTS ACTIFS
          =================================================================
          
          La valeur est préparée côté serveur.
          
          Dans l'implémentation actuelle :
          
          Customer.status = ACTIVE
          
          Nous n'inventons donc pas ici une règle :
          
          "actif depuis 30 jours"
          "actif depuis 90 jours"
          etc.
          ================================================================= */}

      <ClientKpiCard
        label="Clients actifs"
        value={
          kpis.activeClients
        }
        secondary="Clients avec statut actif"
        tone="success"
        icon={
          <UserCheck
            size={21}
            strokeWidth={1.8}
          />
        }
      />


      {/* =================================================================
          NOUVEAUX CLIENTS
          =================================================================
          
          client-query.ts détermine la première commande du client auprès
          de la boutique actuelle et calcule ce KPI pour le mois courant.
          ================================================================= */}

      <ClientKpiCard
        label="Nouveaux clients"
        value={
          kpis.newClients
        }
        secondary="Ce mois-ci"
        tone="info"
        icon={
          <UserPlus
            size={21}
            strokeWidth={1.8}
          />
        }
      />


      {/* =================================================================
          TOTAL COMMANDES
          ================================================================= */}

      <ClientKpiCard
        label="Total des commandes"
        value={
          kpis.totalOrders
        }
        secondary="Commandes passées par vos clients"
        tone="orders"
        icon={
          <ShoppingBag
            size={21}
            strokeWidth={1.8}
          />
        }
      />
    </section>
  );
}