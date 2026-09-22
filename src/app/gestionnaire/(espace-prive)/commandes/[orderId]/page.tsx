import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import OrderDetailView from "@/components/gestionnaire/orders/OrderDetailView";

import {
  getManagerOrderDetail,
} from "@/lib/gestionnaire/orders/order-query";

import styles from "../commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL D'UNE COMMANDE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/commandes/[orderId]/page.tsx
 *
 * Route :
 *
 * /gestionnaire/commandes/[orderId]
 *
 * RÔLE :
 *
 * Afficher le détail d'une commande appartenant réellement à la boutique
 * du Gestionnaire actuellement authentifié.
 *
 * RESPONSABILITÉS :
 *
 * - récupérer orderId depuis la route ;
 * - normaliser l'identifiant reçu ;
 * - charger la commande via le service serveur officiel ;
 * - transformer en 404 :
 *     - un identifiant vide ;
 *     - une commande inexistante ;
 *     - une commande appartenant à une autre boutique ;
 * - transmettre uniquement les données sérialisées à OrderDetailView ;
 * - rester en lecture seule.
 *
 * IMPORTANT :
 *
 * Cette page :
 *
 * - reste un Server Component ;
 * - ne fait aucune requête Prisma directement ;
 * - ne reçoit jamais storeId depuis l'URL ;
 * - ne reçoit jamais managerId depuis l'URL ;
 * - ne fait jamais confiance au navigateur pour déterminer la boutique ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée pas de <main> imbriqué ;
 * - ne contient aucune donnée fictive ;
 * - ne modifie aucun statut ;
 * - ne crée aucun paiement ;
 * - ne crée aucune livraison.
 *
 * La protection réelle du périmètre boutique reste centralisée dans :
 *
 * src/lib/gestionnaire/orders/order-query.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Détail de la commande | Cosmetics Empire",

    description:
      "Consultez les informations détaillées d’une commande de votre espace Gestionnaire Cosmetics Empire.",

    robots: {
      index:
        false,

      follow:
        false,
    },
  };


/* ==========================================================================
   DONNÉES DYNAMIQUES
   ========================================================================== */

/**
 * Une commande est une donnée privée et évolutive.
 *
 * La page doit donc toujours être résolue à partir des données serveur
 * actuelles.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   TYPES
   ========================================================================== */

interface ManagerOrderDetailPageProps {
  readonly params:
    Promise<{
      orderId:
        string;
    }>;
}


/* ==========================================================================
   NORMALISATION IDENTIFIANT
   ========================================================================== */

/**
 * Cette fonction ne décide pas qu'une commande est autorisée.
 *
 * Elle nettoie uniquement la valeur provenant du segment dynamique.
 *
 * L'autorisation réelle reste exclusivement appliquée dans
 * getManagerOrderDetail().
 */

function normalizeOrderId(
  value:
    string,
): string {
  return value.trim();
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function ManagerOrderDetailPage({
  params,
}: ManagerOrderDetailPageProps) {
  /* ------------------------------------------------------------------------
     1. PARAMÈTRES DE ROUTE
     ------------------------------------------------------------------------ */

  const {
    orderId:
      rawOrderId,
  } =
    await params;


  const orderId =
    normalizeOrderId(
      rawOrderId,
    );


  /* ------------------------------------------------------------------------
     2. IDENTIFIANT INEXPLOITABLE
     ------------------------------------------------------------------------
     Aucun appel DB inutile lorsque le segment est vide.
     ------------------------------------------------------------------------ */

  if (
    !orderId
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     3. CHARGEMENT SÉCURISÉ
     ------------------------------------------------------------------------
     getManagerOrderDetail() récupère lui-même le contexte Gestionnaire
     sécurisé et recherche la commande dans la boutique autorisée.
     
     On ne transmet ici que :
     
     orderId
     
     Jamais :
     
     storeId
     managerId
     ------------------------------------------------------------------------ */

  const order =
    await getManagerOrderDetail({
      orderId,
    });


  /* ------------------------------------------------------------------------
     4. COMMANDE ABSENTE OU INACCESSIBLE
     ------------------------------------------------------------------------
     On utilise volontairement le même comportement pour :
     
     - commande inexistante ;
     - commande appartenant à une autre boutique.
     
     Cela évite également de révéler l'existence d'une commande étrangère.
     ------------------------------------------------------------------------ */

  if (
    !order
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     5. RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.ordersPage
      }
    >
      <OrderDetailView
        order={
          order
        }
      />
    </div>
  );
}