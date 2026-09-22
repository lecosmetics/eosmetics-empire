import Link from "next/link";

import {
  ChevronRight,
  Download,
} from "lucide-react";

import styles from "@/app/gestionnaire/(espace-prive)/commandes/commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/orders/OrdersHeader.tsx
 *
 * Route officielle :
 *
 * /gestionnaire/commandes
 *
 * RÔLE :
 *
 * Afficher :
 *
 * - le fil d'Ariane ;
 * - le titre Commandes ;
 * - le sous-titre ;
 * - l'emplacement du bouton Exporter.
 *
 * IMPORTANT :
 *
 * - aucune requête ;
 * - aucune donnée fictive ;
 * - aucune route d'export inventée ;
 * - aucune nouvelle Sidebar ;
 * - aucun nouveau Header global ;
 * - aucune dépendance à une configuration de route qui n'existe pas.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE OFFICIELLE
   ========================================================================== */

const ORDERS_ROUTE =
  "/gestionnaire/commandes";


/* ==========================================================================
   TEXTES
   ========================================================================== */

const PAGE_TITLE =
  "Commandes";


const PAGE_SUBTITLE =
  "Suivez et gérez toutes vos commandes en temps réel.";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface OrdersHeaderProps {
  /**
   * Route d'export réelle uniquement.
   *
   * Si aucune fonction d'export n'existe encore :
   *
   * exportHref = null
   *
   * Le bouton reste visible mais désactivé.
   */
  readonly exportHref?:
    string | null;
}


/* ==========================================================================
   VALIDATION DU LIEN EXPORT
   ========================================================================== */

function normalizeExportHref(
  value:
    string | null | undefined,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const href =
    value.trim();


  if (
    !href
  ) {
    return null;
  }


  /*
   * On accepte uniquement une route interne.
   */

  if (
    !href.startsWith(
      "/",
    )
  ) {
    return null;
  }


  /*
   * On refuse :
   *
   * //example.com
   */

  if (
    href.startsWith(
      "//",
    )
  ) {
    return null;
  }


  return href;
}


/* ==========================================================================
   ACTION EXPORT
   ========================================================================== */

interface OrdersExportActionProps {
  readonly href:
    string | null;
}


function OrdersExportAction({
  href,
}: OrdersExportActionProps) {
  /*
   * Une vraie fonctionnalité d'export a été fournie.
   */

  if (
    href
  ) {
    return (
      <a
        href={
          href
        }
        className={
          styles.ordersExportButton
        }
      >
        <Download
          size={18}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span>
          Exporter
        </span>
      </a>
    );
  }


  /*
   * Aucun export réel n'existe encore.
   *
   * On respecte la maquette sans créer de faux lien.
   */

  return (
    <span
      className={[
        styles.ordersExportButton,
        styles.ordersExportButtonDisabled,
      ].join(
        " ",
      )}
      aria-disabled="true"
    >
      <Download
        size={18}
        strokeWidth={1.8}
        aria-hidden="true"
      />

      <span>
        Exporter
      </span>
    </span>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function OrdersHeader({
  exportHref = null,
}: OrdersHeaderProps) {
  const safeExportHref =
    normalizeExportHref(
      exportHref,
    );


  return (
    <header
      className={
        styles.ordersHeader
      }
    >
      {/* ===================================================================
          FIL D'ARIANE
          =================================================================== */}

      <nav
        className={
          styles.ordersBreadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <Link
          href={
            ORDERS_ROUTE
          }
          className={
            styles.ordersBreadcrumbLink
          }
        >
          Commandes
        </Link>


        <ChevronRight
          size={15}
          strokeWidth={1.8}
          className={
            styles.ordersBreadcrumbSeparator
          }
          aria-hidden="true"
        />


        <span
          className={
            styles.ordersBreadcrumbCurrent
          }
          aria-current="page"
        >
          Toutes les commandes
        </span>
      </nav>


      {/* ===================================================================
          TITRE + ACTION
          =================================================================== */}

      <div
        className={
          styles.ordersHeaderRow
        }
      >
        <div
          className={
            styles.ordersHeaderContent
          }
        >
          <h1
            className={
              styles.ordersTitle
            }
          >
            {PAGE_TITLE}
          </h1>


          <p
            className={
              styles.ordersSubtitle
            }
          >
            {PAGE_SUBTITLE}
          </p>
        </div>


        <div
          className={
            styles.ordersHeaderActions
          }
        >
          <OrdersExportAction
            href={
              safeExportHref
            }
          />
        </div>
      </div>
    </header>
  );
}