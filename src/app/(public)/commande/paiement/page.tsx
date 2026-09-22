import type {
  Metadata,
} from "next";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import PublicPaymentPage from "@/components/public/commande/PublicPaymentPage";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — PAGE PAIEMENT
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/commande/paiement/page.tsx
 *
 * Route :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Point d'entrée App Router de l'étape de paiement du checkout public.
 *
 * ============================================================================
 *
 * FLUX :
 *
 * /panier
 *
 *      ↓
 *
 * /commande
 *
 *      ↓
 *
 * informations cliente
 * adresse
 * livraison
 * vérification serveur
 *
 *      ↓
 *
 * /commande/paiement
 *
 *      ↓
 *
 * choix du mode de paiement
 *
 *      ↓
 *
 * création réelle de la commande
 *
 *      ↓
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * ARCHITECTURE :
 *
 * Cette page reste volontairement un Server Component.
 *
 * Toute la logique interactive appartient à :
 *
 * src/components/public/commande/PublicPaymentPage.tsx
 *
 * ============================================================================
 *
 * CETTE PAGE NE :
 *
 * - lit pas sessionStorage ;
 * - ne lit pas localStorage ;
 * - n'appelle pas Prisma ;
 * - n'interroge pas PostgreSQL ;
 * - ne recalcule aucun prix ;
 * - ne recalcule aucun stock ;
 * - ne calcule aucun paiement ;
 * - ne crée aucune Order ;
 * - ne crée aucun Payment ;
 * - ne génère aucun reçu ;
 * - n'envoie aucun e-mail ;
 * - ne recrée aucun Header ;
 * - ne recrée aucun Footer ;
 * - ne recrée aucune navigation mobile.
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * La simple présence de cette route dans le navigateur ne constitue jamais :
 *
 * - une preuve qu'un checkout est valide ;
 * - une preuve qu'une commande existe ;
 * - une preuve de paiement ;
 * - une preuve de disponibilité du stock.
 *
 * PublicPaymentPage.tsx doit utiliser les services serveur prévus :
 *
 * public-payment-query.ts
 * public-payment-actions.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   1. METADATA
   ========================================================================== */

export const metadata:
  Metadata =
    {
      title:
        `Paiement | ${PUBLIC_SITE.brand.name}`,

      description:
        "Choisissez votre mode de paiement et finalisez votre commande en toute sécurité.",

      /**
       * Une page de paiement ne doit pas être indexée par les moteurs
       * de recherche.
       */
      robots: {
        index:
          false,

        follow:
          false,

        nocache:
          true,
      },
    };


/* ==========================================================================
   2. PAGE
   ========================================================================== */

export default function CommandePaiementPage() {
  return (
    <PublicPaymentPage />
  );
}