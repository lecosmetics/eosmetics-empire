import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import ClientDetailView from "@/components/gestionnaire/clients/ClientDetailView";

import {
  getManagerClientDetail,
} from "@/lib/gestionnaire/clients/client-query";

import styles from "../clients.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL CLIENT
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/clients/[clientId]
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/clients/[clientId]/page.tsx
 *
 * RESPONSABILITÉS :
 *
 * - rester un Server Component ;
 * - lire uniquement le clientId depuis le segment dynamique ;
 * - demander le détail au service serveur client-query.ts ;
 * - ne jamais accepter storeId depuis l'URL ;
 * - ne jamais accepter managerId depuis l'URL ;
 * - ne jamais requêter Prisma directement dans cette page ;
 * - retourner notFound() si le client n'existe pas ou n'appartient pas
 *   au périmètre autorisé du Gestionnaire ;
 * - afficher uniquement les données validées par le service ;
 * - conserver la pleine largeur du Main Gestionnaire existant.
 *
 * SÉCURITÉ :
 *
 * Le clientId transmis dans l'URL n'accorde aucun droit.
 *
 * getManagerClientDetail() :
 *
 * - vérifie la session Gestionnaire ;
 * - détermine le vrai storeId côté serveur ;
 * - vérifie que le Customer possède au moins une commande dans ce store ;
 * - retourne null si l'accès n'est pas autorisé.
 *
 * Cela empêche notamment :
 *
 * Gestionnaire A
 *   -> /gestionnaire/clients/client-de-b
 *
 * d'accéder à un client appartenant uniquement au périmètre de B.
 *
 * ============================================================================
 */


/* ==========================================================================
   NEXT.JS — DONNÉES PRIVÉES
   ========================================================================== */

/**
 * Le contenu dépend de la session authentifiée et contient des données client.
 *
 * Il ne doit pas être généré statiquement ni partagé entre plusieurs
 * Gestionnaires.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


export const runtime =
  "nodejs";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Détail client | Cosmetics Empire",

    description:
      "Consultez les informations et l’historique d’un client de votre boutique.",

    robots: {
      index:
        false,

      follow:
        false,
    },
  };


/* ==========================================================================
   PROPS
   ========================================================================== */

interface ClientDetailPageProps {
  readonly params:
    Promise<{
      readonly clientId:
        string;
    }>;
}


/* ==========================================================================
   NORMALISATION DU SEGMENT
   ========================================================================== */

/**
 * Cette validation est seulement une première protection syntaxique.
 *
 * La véritable autorisation reste exclusivement réalisée dans :
 *
 * getManagerClientDetail()
 */

function normalizeClientId(
  value:
    unknown,
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
      191
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  /* ------------------------------------------------------------------------
     1. PARAMÈTRES NEXT.JS
     ------------------------------------------------------------------------ */

  const resolvedParams =
    await params;


  const clientId =
    normalizeClientId(
      resolvedParams.clientId,
    );


  /* ------------------------------------------------------------------------
     2. IDENTIFIANT INVALIDE
     ------------------------------------------------------------------------ */

  if (
    !clientId
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     3. DONNÉES SERVEUR SÉCURISÉES
     ------------------------------------------------------------------------
     
     IMPORTANT :
     
     On ne transmet volontairement ici :
     
     - aucun storeId ;
     - aucun managerId ;
     - aucune boutique fournie par le navigateur.
     
     getManagerClientDetail() récupère le store autorisé depuis
     requireGestionnairePrivateAccess().
     ------------------------------------------------------------------------ */

  const client =
    await getManagerClientDetail({
      clientId,
    });


  /* ------------------------------------------------------------------------
     4. CLIENT INEXISTANT OU NON AUTORISÉ
     ------------------------------------------------------------------------
     
     Même réponse dans les deux cas.
     
     Cela évite de révéler si un client appartenant à une autre boutique
     existe réellement dans la base.
     ------------------------------------------------------------------------ */

  if (
    !client
  ) {
    notFound();
  }


  /* ------------------------------------------------------------------------
     5. RENDER
     ------------------------------------------------------------------------ */

  return (
    <div
      className={
        styles.clientsPage
      }
    >
      <div
        className={
          styles.clientsContent
        }
      >
        <ClientDetailView
          client={
            client
          }
        />
      </div>
    </div>
  );
}