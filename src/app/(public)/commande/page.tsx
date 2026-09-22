import type {
  Metadata,
} from "next";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import PublicCommandePage from "@/components/public/commande/PublicCommandePage";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — PAGE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/commande/page.tsx
 *
 * Route :
 *
 * /commande
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Point d'entrée App Router de l'étape :
 *
 * Panier
 *   ↓
 * Informations cliente
 *   ↓
 * Adresse de livraison
 *   ↓
 * Vérification serveur
 *   ↓
 * Résumé de commande
 *   ↓
 * /commande/paiement
 *
 * ============================================================================
 *
 * ARCHITECTURE :
 *
 * Cette page reste volontairement un Server Component.
 *
 * Toute l'interactivité appartient à :
 *
 * src/components/public/commande/PublicCommandePage.tsx
 *
 * ============================================================================
 *
 * CETTE PAGE NE :
 *
 * - lit pas Prisma ;
 * - n'interroge pas PostgreSQL ;
 * - ne lit pas localStorage ;
 * - ne calcule aucun prix ;
 * - ne calcule aucun frais de livraison ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - ne recrée aucun Header ;
 * - ne recrée aucun Footer ;
 * - ne recrée aucune navigation mobile.
 *
 * ============================================================================
 */


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata =
    {
      title:
        `Commande | ${PUBLIC_SITE.brand.name}`,

      description:
        "Renseignez vos informations et votre adresse de livraison, vérifiez votre commande puis continuez vers le paiement.",

      /**
       * Une étape checkout ne doit pas devenir une page d'entrée provenant
       * des moteurs de recherche.
       *
       * Les produits et les catégories restent les pages publiques
       * destinées à l'indexation.
       */
      robots: {
        index:
          false,

        follow:
          false,
      },
    };


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function CommandePage() {
  return (
    <PublicCommandePage />
  );
}