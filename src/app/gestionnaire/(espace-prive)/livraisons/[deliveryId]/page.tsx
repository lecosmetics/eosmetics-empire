import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import LivraisonDetailView from "@/components/gestionnaire/livraisons/LivraisonDetailView";

import {
  getManagerShipmentDetail,
} from "@/lib/gestionnaire/livraisons/shipment-query";

import {
  MANAGER_SHIPMENT_ID_MAX_LENGTH,
} from "@/lib/gestionnaire/livraisons/shipment-types";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL D'UNE LIVRAISON
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/livraisons/[deliveryId]
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/[deliveryId]/page.tsx
 *
 * RESPONSABILITÉS :
 *
 * - lire deliveryId depuis la route Next.js ;
 * - valider l'identifiant avant interrogation métier ;
 * - charger le vrai Shipment côté serveur ;
 * - respecter le Store du Gestionnaire authentifié ;
 * - retourner notFound() lorsque la ressource est absente/inaccessible ;
 * - transmettre les données sérialisées à LivraisonDetailView ;
 * - toujours relire des données fraîches après une mutation.
 *
 *
 * IMPORTANT :
 *
 * Cette page :
 *
 * - ne fait aucune requête Prisma directement ;
 * - ne lit aucun storeId depuis le navigateur ;
 * - ne lit aucun managerId depuis le navigateur ;
 * - ne fait confiance à aucun statut envoyé par le client ;
 * - ne crée aucune donnée fictive ;
 * - ne recrée pas le GestionnaireShell ;
 * - ne recrée pas la Sidebar ;
 * - ne recrée pas le Header global ;
 * - ne crée aucun <main> imbriqué ;
 * - ne limite pas artificiellement la largeur de la fiche.
 *
 *
 * La sécurité réelle reste dans :
 *
 * getManagerShipmentDetail()
 *        ↓
 * requireGestionnairePrivateAccess()
 *        ↓
 * shipment.storeId === store connecté
 *        ↓
 * order.storeId === store connecté
 *
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
  title:
    "Détail livraison | Cosmetics Empire",

  description:
    "Consultez et gérez une livraison depuis votre espace Gestionnaire Cosmetics Empire.",
};


/* ==========================================================================
   DONNÉES FRAÎCHES
   ========================================================================== */

/**
 * Les actions :
 *
 * - confirmation ;
 * - annulation ;
 *
 * revalident ensuite cette route.
 *
 * La fiche ne doit donc pas conserver une ancienne version du Shipment.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   PROPS — NEXT.JS 16
   ========================================================================== */

interface LivraisonDetailPageProps {
  readonly params:
    Promise<{
      readonly deliveryId:
        string;
    }>;
}


/* ==========================================================================
   NORMALISATION DELIVERY ID
   ========================================================================== */

/**
 * Le nom du segment URL reste deliveryId pour conserver une route lisible :
 *
 * /gestionnaire/livraisons/[deliveryId]
 *
 * Mais le modèle Prisma réel est Shipment.
 *
 * On transmet donc ensuite cet identifiant sous le nom shipmentId
 * à la couche métier.
 */

function normalizeDeliveryId(
  value:
    string,
): string | null {
  if (
    typeof value !==
      "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !normalized ||
    normalized.length >
      MANAGER_SHIPMENT_ID_MAX_LENGTH
  ) {
    return null;
  }


  /**
   * Les identifiants Prisma utilisés par le projet ne nécessitent
   * aucun caractère de contrôle.
   */
  if (
    /[\u0000-\u001F\u007F]/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function LivraisonDetailPage({
  params,
}: LivraisonDetailPageProps) {
  /* ------------------------------------------------------------------------
     1. PARAMÈTRES NEXT.JS
     ------------------------------------------------------------------------ */

  const {
    deliveryId,
  } =
    await params;


  /* ------------------------------------------------------------------------
     2. NORMALISATION DE L'IDENTIFIANT
     ------------------------------------------------------------------------ */

  const shipmentId =
    normalizeDeliveryId(
      deliveryId,
    );


  if (
    !shipmentId
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     3. LECTURE SERVEUR SÉCURISÉE
     ------------------------------------------------------------------------
     
     getManagerShipmentDetail() :
     
     - vérifie la session Gestionnaire ;
     - récupère le vrai storeId côté serveur ;
     - vérifie Shipment.storeId ;
     - vérifie également Order.storeId ;
     - sérialise Decimal en string ;
     - sérialise Date en ISO ;
     - récupère les vraies informations cliente ;
     - récupère l'adresse Shipment ;
     - récupère les vrais OrderItem ;
     - récupère les paiements du Store ;
     - calcule les actions autorisées.
     
     Aucun storeId n'est fourni par cette page.
     ------------------------------------------------------------------------ */

  const delivery =
    await getManagerShipmentDetail({
      shipmentId,
    });


  /* ------------------------------------------------------------------------
     4. ABSENT OU NON AUTORISÉ
     ------------------------------------------------------------------------
     
     Même résultat visuel pour :
     
     - identifiant inexistant ;
     - livraison supprimée ;
     - livraison d'une autre boutique ;
     - incohérence Shipment / Order.
     
     Cela évite de révéler l'existence d'une ressource étrangère.
     ------------------------------------------------------------------------ */

  if (
    !delivery
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     5. RENDER
     ------------------------------------------------------------------------ */

  return (
    <LivraisonDetailView
      delivery={delivery}
    />
  );
}