import {
  BarChart3,
  CircleDollarSign,
  PackageCheck,
  ShoppingBag,
} from "lucide-react";

import styles from "@/app/gestionnaire/(espace-prive)/statistiques/statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — EMPTY STATE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/statistiques/StatisticsEmptyState.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher un état vide propre lorsque la période sélectionnée
 *   ne contient aucune activité statistique ;
 * - éviter d'afficher des graphiques vides ou incohérents ;
 * - informer clairement le Gestionnaire ;
 * - rester cohérent avec le design de l'espace Gestionnaire ;
 * - fonctionner sur desktop et mobile.
 *
 *
 * CE COMPOSANT NE :
 *
 * - ne lit aucune session ;
 * - ne fait aucune requête Prisma ;
 * - ne reçoit aucun storeId ;
 * - ne calcule aucune statistique ;
 * - ne crée aucune donnée fictive ;
 * - ne crée aucune commande fictive ;
 * - ne crée aucun produit fictif ;
 * - ne crée aucun chiffre d'affaires fictif ;
 * - ne crée aucune nouvelle route ;
 * - ne recrée pas le layout Gestionnaire.
 *
 *
 * L'état vide doit être décidé par la page à partir de :
 *
 * data.activity.hasActivity
 *
 * retourné par :
 *
 * getManagerStatisticsPageData()
 *
 * ============================================================================
 */


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StatisticsEmptyState() {
  return (
    <section
      className={styles.statisticsEmptyState}
      aria-labelledby="statistics-empty-title"
      aria-describedby="statistics-empty-description"
    >
      {/* ==================================================================
          MAIN ICON
          ================================================================== */}

      <div
        className={styles.statisticsEmptyIcon}
        aria-hidden="true"
      >
        <BarChart3
          size={34}
          strokeWidth={1.7}
        />
      </div>


      {/* ==================================================================
          CONTENT
          ================================================================== */}

      <div className={styles.statisticsEmptyContent}>
        <h2
          id="statistics-empty-title"
          className={styles.statisticsEmptyTitle}
        >
          Aucune donnée statistique disponible
        </h2>


        <p
          id="statistics-empty-description"
          className={styles.statisticsEmptyDescription}
        >
          Aucune activité n’a été enregistrée pour la période sélectionnée.
          Les statistiques apparaîtront ici dès que votre boutique commencera
          à générer des données.
        </p>
      </div>


      {/* ==================================================================
          INFORMATION
          ================================================================== */}

      <div
        className={styles.statisticsEmptyIndicators}
        aria-label="Données utilisées pour les statistiques"
      >
        {/* ================================================================
            ORDERS
            ================================================================ */}

        <div className={styles.statisticsEmptyIndicator}>
          <span
            className={styles.statisticsEmptyIndicatorIcon}
            aria-hidden="true"
          >
            <ShoppingBag
              size={18}
              strokeWidth={1.8}
            />
          </span>


          <div>
            <strong>
              Commandes
            </strong>

            <span>
              Les commandes enregistrées alimenteront vos indicateurs.
            </span>
          </div>
        </div>


        {/* ================================================================
            REVENUE
            ================================================================ */}

        <div className={styles.statisticsEmptyIndicator}>
          <span
            className={styles.statisticsEmptyIndicatorIcon}
            aria-hidden="true"
          >
            <CircleDollarSign
              size={18}
              strokeWidth={1.8}
            />
          </span>


          <div>
            <strong>
              Chiffre d’affaires
            </strong>

            <span>
              Les paiements réellement encaissés seront pris en compte.
            </span>
          </div>
        </div>


        {/* ================================================================
            SALES
            ================================================================ */}

        <div className={styles.statisticsEmptyIndicator}>
          <span
            className={styles.statisticsEmptyIndicatorIcon}
            aria-hidden="true"
          >
            <PackageCheck
              size={18}
              strokeWidth={1.8}
            />
          </span>


          <div>
            <strong>
              Produits vendus
            </strong>

            <span>
              Les ventes réelles permettront d’identifier vos performances.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}