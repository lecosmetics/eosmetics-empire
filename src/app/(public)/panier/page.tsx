import type {
  Metadata,
} from "next";

import PublicPanierPage from "@/components/public/panier/PublicPanierPage";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE PUBLIQUE — PANIER
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/panier/page.tsx
 *
 * Route :
 *
 * /panier
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Monter la page publique du Panier dans le shell public existant.
 *
 * ============================================================================
 *
 * ARCHITECTURE :
 *
 * src/app/(public)/layout.tsx
 *
 * └── PublicPanierProvider
 *     │
 *     ├── PublicHeader
 *     │
 *     ├── <main>
 *     │   │
 *     │   └── /panier
 *     │       │
 *     │       └── PublicPanierPage
 *     │
 *     ├── PublicFooter
 *     │
 *     └── PublicMobileBottomNav
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * PublicPanierProvider n'est PAS recréé dans cette page.
 *
 * Il appartient maintenant au layout public global :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * Cela permet de conserver un seul état Panier partagé entre :
 *
 * - Accueil ;
 * - Produits ;
 * - Catégories ;
 * - fiches produit ;
 * - Panier ;
 * - futures pages commerciales publiques.
 *
 * ============================================================================
 *
 * Cette page :
 *
 * - reste un Server Component ;
 * - n'importe pas Prisma ;
 * - n'importe pas db ;
 * - n'interroge pas PostgreSQL directement ;
 * - ne lit pas localStorage ;
 * - ne crée pas de Provider Panier ;
 * - ne crée pas de commande ;
 * - ne crée pas de paiement ;
 * - ne réserve pas de stock ;
 * - ne décrémente pas de stock ;
 * - ne duplique pas le Header ;
 * - ne duplique pas le Footer ;
 * - ne duplique pas la navigation mobile.
 *
 * ============================================================================
 *
 * PERSISTANCE DU PANIER :
 *
 * Le Provider global conserve uniquement :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * Le navigateur n'est jamais la source de vérité pour :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - boutique ;
 * - total.
 *
 * ============================================================================
 *
 * VALIDATION COMMERCIALE :
 *
 * PublicPanierPage
 *
 * utilise :
 *
 * validatePublicPanier()
 *
 * afin de recharger côté serveur :
 *
 * - StoreProduct ;
 * - Product ;
 * - Store ;
 * - ProductImage ;
 * - prix ;
 * - devise ;
 * - stock ;
 * - statut ;
 * - disponibilité.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. MÉTADONNÉES
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Panier | L&E Cosmetics Empire",

    description:
      "Consultez les articles ajoutés à votre panier L&E Cosmetics Empire.",
  };


/* ==========================================================================
   2. PAGE
   ========================================================================== */

export default function PanierPage() {
  return (
    <PublicPanierPage />
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * FLUX FINAL :
 *
 * src/app/(public)/layout.tsx
 *
 *        ↓
 *
 * PublicPanierProvider
 *
 *        ↓
 *
 * src/app/(public)/panier/page.tsx
 *
 *        ↓
 *
 * PublicPanierPage
 *
 *        ↓
 *
 * validatePublicPanier()
 *
 *        ↓
 *
 * PostgreSQL
 *
 *        ↓
 *
 * StoreProduct
 * Product
 * Store
 * ProductImage
 *
 * ============================================================================
 *
 * GARANTIES :
 *
 * - un seul Provider Panier ;
 * - aucune duplication de localStorage ;
 * - aucune duplication de contexte React ;
 * - aucune donnée commerciale inventée ;
 * - aucune confiance dans les prix du navigateur ;
 * - aucune confiance dans le stock du navigateur ;
 * - aucune réservation de stock dans cette page ;
 * - aucune création de commande dans cette page.
 *
 * ============================================================================
 */