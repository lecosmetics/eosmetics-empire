import styles from "../commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CHARGEMENT DÉTAIL COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/commandes/[orderId]/loading.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes/[orderId]
 *
 * RÔLE :
 *
 * Afficher un état de chargement neutre pendant la récupération sécurisée
 * du détail d'une commande.
 *
 * Le squelette représente uniquement la structure visuelle de la page :
 *
 * - en-tête de la commande ;
 * - informations générales ;
 * - cliente ;
 * - adresse de livraison ;
 * - produits ;
 * - montants ;
 * - paiements ;
 * - livraison.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête ;
 * - ne lit aucune session ;
 * - ne reçoit aucun orderId ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne contient aucune fausse commande ;
 * - ne contient aucun faux montant ;
 * - ne contient aucun faux client ;
 * - ne contient aucun faux paiement ;
 * - ne contient aucune fausse livraison ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas de <main> imbriqué ;
 * - utilise toute la largeur disponible.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

/**
 * Nombre de lignes neutres utilisées pour représenter la zone des produits.
 *
 * Ces lignes ne représentent pas de vraies commandes ni de vrais articles.
 */

const ORDER_ITEM_SKELETON_COUNT =
  4;


/**
 * Nombre de lignes neutres utilisées dans les blocs paiement et livraison.
 */

const RECORD_SKELETON_COUNT =
  3;


/* ==========================================================================
   CARTE SQUELETTE SIMPLE
   ========================================================================== */

function DetailCardSkeleton() {
  return (
    <div
      className={
        styles.ordersLoadingKpi
      }
      aria-hidden="true"
    />
  );
}


/* ==========================================================================
   LIGNES SQUELETTES
   ========================================================================== */

function DetailRowsSkeleton({
  count,
}: {
  readonly count:
    number;
}) {
  return (
    <div
      className={
        styles.ordersLoadingTable
      }
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            count,
        },
        (
          _item,
          index,
        ) => (
          <div
            key={
              index
            }
            className={
              styles.ordersLoadingRow
            }
          />
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   EN-TÊTE
   ========================================================================== */

function DetailHeaderSkeleton() {
  return (
    <div
      className={
        styles.ordersLoadingHeader
      }
      aria-hidden="true"
    />
  );
}


/* ==========================================================================
   INFORMATIONS PRINCIPALES
   ========================================================================== */

function DetailTopCardsSkeleton() {
  return (
    <div
      className={
        styles.orderDetailTopGrid
      }
      aria-hidden="true"
    >
      <DetailCardSkeleton />

      <DetailCardSkeleton />

      <DetailCardSkeleton />
    </div>
  );
}


/* ==========================================================================
   PRODUITS
   ========================================================================== */

function DetailProductsSkeleton() {
  return (
    <DetailRowsSkeleton
      count={
        ORDER_ITEM_SKELETON_COUNT
      }
    />
  );
}


/* ==========================================================================
   MONTANTS + PAIEMENTS
   ========================================================================== */

function DetailFinancialSkeleton() {
  return (
    <div
      className={
        styles.orderDetailTwoColumns
      }
      aria-hidden="true"
    >
      <div
        className={
          styles.ordersLoadingTable
        }
      >
        <div
          className={
            styles.ordersLoadingRow
          }
        />

        <div
          className={
            styles.ordersLoadingRow
          }
        />

        <div
          className={
            styles.ordersLoadingRow
          }
        />

        <div
          className={
            styles.ordersLoadingRow
          }
        />

        <div
          className={
            styles.ordersLoadingRow
          }
        />
      </div>


      <DetailRowsSkeleton
        count={
          RECORD_SKELETON_COUNT
        }
      />
    </div>
  );
}


/* ==========================================================================
   LIVRAISON
   ========================================================================== */

function DetailShipmentSkeleton() {
  return (
    <DetailRowsSkeleton
      count={
        RECORD_SKELETON_COUNT
      }
    />
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function ManagerOrderDetailLoading() {
  return (
    <div
      className={
        styles.ordersPage
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={
          styles.orderDetailView
        }
      >
        {/* =================================================================
            TEXTE ACCESSIBLE
            ================================================================= */}

        <span
          className={
            styles.ordersVisuallyHidden
          }
        >
          Chargement du détail de la commande…
        </span>


        {/* =================================================================
            HEADER
            ================================================================= */}

        <DetailHeaderSkeleton />


        {/* =================================================================
            INFORMATIONS / CLIENTE / ADRESSE
            ================================================================= */}

        <DetailTopCardsSkeleton />


        {/* =================================================================
            PRODUITS
            ================================================================= */}

        <DetailProductsSkeleton />


        {/* =================================================================
            MONTANTS / PAIEMENTS
            ================================================================= */}

        <DetailFinancialSkeleton />


        {/* =================================================================
            LIVRAISON
            ================================================================= */}

        <DetailShipmentSkeleton />
      </div>
    </div>
  );
}