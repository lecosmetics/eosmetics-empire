import Link from "next/link";

import {
  ChevronRight,
  Home,
  Truck,
} from "lucide-react";

import styles from "@/app/gestionnaire/(espace-prive)/livraisons/livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/livraisons/LivraisonsHeader.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher le fil d'Ariane de la page Livraisons ;
 * - afficher le titre principal ;
 * - afficher le sous-titre ;
 * - rester compatible avec le GestionnaireShell existant ;
 * - ne pas recréer le Header global ;
 * - ne pas recréer la Sidebar ;
 * - ne pas ajouter d'action métier non demandée.
 *
 * IMPORTANT :
 *
 * Le bouton "Nouvelle livraison" visible sur la maquette n'est
 * volontairement PAS ajouté.
 *
 * Le module actuel ne prévoit aucune création manuelle de Shipment.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE CONNUE
   ========================================================================== */

const LIVRAISONS_ROUTE =
  "/gestionnaire/livraisons";


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function LivraisonsHeader() {
  return (
    <header className={styles.livraisonsHeader}>
      {/* ====================================================================
          BREADCRUMB
          ==================================================================== */}

      <nav
        className={styles.livraisonsBreadcrumb}
        aria-label="Fil d’Ariane"
      >
        <span
          className={styles.livraisonsBreadcrumbHome}
          aria-hidden="true"
        >
          <Home
            size={17}
            strokeWidth={1.8}
          />
        </span>


        <ChevronRight
          className={styles.livraisonsBreadcrumbSeparator}
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <Link
          href={LIVRAISONS_ROUTE}
          className={styles.livraisonsBreadcrumbLink}
        >
          Livraisons
        </Link>


        <ChevronRight
          className={styles.livraisonsBreadcrumbSeparator}
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
        />


        <span
          className={styles.livraisonsBreadcrumbCurrent}
          aria-current="page"
        >
          Toutes les livraisons
        </span>
      </nav>


      {/* ====================================================================
          MAIN HEADER
          ==================================================================== */}

      <div className={styles.livraisonsHeaderMain}>
        <div className={styles.livraisonsHeaderCopy}>
          <div className={styles.livraisonsHeaderTitleRow}>
            <span
              className={styles.livraisonsHeaderIcon}
              aria-hidden="true"
            >
              <Truck
                size={22}
                strokeWidth={1.8}
              />
            </span>


            <h1 className={styles.livraisonsHeaderTitle}>
              Livraisons
            </h1>
          </div>


          <p className={styles.livraisonsHeaderSubtitle}>
            Suivez et gérez toutes vos livraisons en temps réel.
          </p>
        </div>
      </div>
    </header>
  );
}