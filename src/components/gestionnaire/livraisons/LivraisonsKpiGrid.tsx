import type {
  ReactNode,
} from "react";

import {
  CheckCircle2,
  Clock3,
  PackageCheck,
  Truck,
  XCircle,
} from "lucide-react";

import type {
  ManagerShipmentsKpis,
} from "@/lib/gestionnaire/livraisons/shipment-types";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonsKpiGrid.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher les cinq KPI réels du module Livraisons ;
 * - ne jamais charger de données directement ;
 * - ne jamais contenir de valeurs fictives ;
 * - recevoir les statistiques calculées côté serveur ;
 * - conserver une présentation claire sur grand écran ;
 * - rester responsive sur tablette et mobile.
 *
 * KPI :
 *
 * 1. Total livraisons
 * 2. À préparer
 * 3. En cours
 * 4. Livrées
 * 5. Échouées / Annulées
 *
 * Les regroupements métier sont calculés côté serveur :
 *
 * À préparer
 * -> PENDING + PREPARING
 *
 * En cours
 * -> SHIPPED + IN_TRANSIT
 *
 * Livrées
 * -> DELIVERED
 *
 * Échouées / Annulées
 * -> FAILED + CANCELLED
 *
 * RETURNED reste volontairement distinct.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

interface LivraisonsKpiGridProps {
  readonly kpis:
    ManagerShipmentsKpis;
}


/* ==========================================================================
   CARD TONES
   ========================================================================== */

type LivraisonKpiTone =
  | "primary"
  | "preparing"
  | "progress"
  | "success"
  | "danger";


/* ==========================================================================
   KPI CARD PROPS
   ========================================================================== */

interface LivraisonKpiCardProps {
  readonly label:
    string;

  readonly value:
    number;

  readonly description:
    string;

  readonly icon:
    ReactNode;

  readonly tone:
    LivraisonKpiTone;
}


/* ==========================================================================
   FORMAT COUNT
   ========================================================================== */

const countFormatter =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function formatCount(
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


  return countFormatter.format(
    Math.max(
      0,
      Math.trunc(
        value,
      ),
    ),
  );
}


/* ==========================================================================
   TONE CLASS
   ========================================================================== */

function getToneClassName(
  tone:
    LivraisonKpiTone,
): string {
  switch (
    tone
  ) {
    case "primary":
      return styles.livraisonsKpiIconPrimary;

    case "preparing":
      return styles.livraisonsKpiIconPreparing;

    case "progress":
      return styles.livraisonsKpiIconProgress;

    case "success":
      return styles.livraisonsKpiIconSuccess;

    case "danger":
      return styles.livraisonsKpiIconDanger;
  }
}


/* ==========================================================================
   KPI CARD
   ========================================================================== */

function LivraisonKpiCard({
  label,
  value,
  description,
  icon,
  tone,
}: LivraisonKpiCardProps) {
  return (
    <article
      className={styles.livraisonsKpiCard}
      aria-label={`${label} : ${formatCount(value)}`}
    >
      {/* ==================================================================
          ICON
          ================================================================== */}

      <div
        className={[
          styles.livraisonsKpiIcon,
          getToneClassName(
            tone,
          ),
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.livraisonsKpiContent}>
        <span className={styles.livraisonsKpiLabel}>
          {label}
        </span>


        <strong className={styles.livraisonsKpiValue}>
          {formatCount(
            value,
          )}
        </strong>


        <span className={styles.livraisonsKpiDescription}>
          {description}
        </span>
      </div>
    </article>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LivraisonsKpiGrid({
  kpis,
}: LivraisonsKpiGridProps) {
  return (
    <section
      className={styles.livraisonsKpiSection}
      aria-labelledby="livraisons-kpi-title"
    >
      {/* ==================================================================
          ACCESSIBLE TITLE
          ================================================================== */}

      <h2
        id="livraisons-kpi-title"
        className={styles.livraisonsVisuallyHidden}
      >
        Statistiques des livraisons
      </h2>


      {/* ==================================================================
          GRID
          ================================================================== */}

      <div className={styles.livraisonsKpiGrid}>
        {/* --------------------------------------------------------------
            TOTAL
            -------------------------------------------------------------- */}

        <LivraisonKpiCard
          label="Total livraisons"
          value={kpis.totalShipments}
          description="Toutes vos livraisons"
          tone="primary"
          icon={
            <PackageCheck
              size={24}
              strokeWidth={1.9}
            />
          }
        />


        {/* --------------------------------------------------------------
            À PRÉPARER
            -------------------------------------------------------------- */}

        <LivraisonKpiCard
          label="À préparer"
          value={kpis.preparingShipments}
          description="En attente d’expédition"
          tone="preparing"
          icon={
            <Clock3
              size={24}
              strokeWidth={1.9}
            />
          }
        />


        {/* --------------------------------------------------------------
            EN COURS
            -------------------------------------------------------------- */}

        <LivraisonKpiCard
          label="En cours"
          value={kpis.inProgressShipments}
          description="En cours de livraison"
          tone="progress"
          icon={
            <Truck
              size={24}
              strokeWidth={1.9}
            />
          }
        />


        {/* --------------------------------------------------------------
            LIVRÉES
            -------------------------------------------------------------- */}

        <LivraisonKpiCard
          label="Livrées"
          value={kpis.deliveredShipments}
          description="Livraisons confirmées"
          tone="success"
          icon={
            <CheckCircle2
              size={24}
              strokeWidth={1.9}
            />
          }
        />


        {/* --------------------------------------------------------------
            ÉCHOUÉES / ANNULÉES
            -------------------------------------------------------------- */}

        <LivraisonKpiCard
          label="Échouées / Annulées"
          value={kpis.failedOrCancelledShipments}
          description="Livraisons à traiter"
          tone="danger"
          icon={
            <XCircle
              size={24}
              strokeWidth={1.9}
            />
          }
        />
      </div>
    </section>
  );
}