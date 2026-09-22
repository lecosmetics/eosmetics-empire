import {
  LoaderCircle,
} from "lucide-react";

import styles from "@/components/public/panier/public-panier.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * LOADING — PANIER PUBLIC
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/panier/loading.tsx
 *
 * Route :
 *
 * /panier
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que Next.js prépare
 * la route publique du Panier.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - reste un Server Component ;
 * - ne lit pas localStorage ;
 * - n'importe pas Prisma ;
 * - n'interroge pas PostgreSQL ;
 * - ne valide pas le Panier ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - ne réserve aucun stock ;
 * - ne contient aucun faux produit ;
 * - ne contient aucun faux prix ;
 * - ne contient aucun faux stock ;
 * - ne recrée pas le Header ;
 * - ne recrée pas le Footer ;
 * - ne recrée pas la navigation mobile.
 *
 * ============================================================================
 *
 * Le vrai Panier sera ensuite hydraté et validé par :
 *
 * PublicPanierProvider
 *
 * +
 *
 * PublicPanierPage
 *
 * +
 *
 * validatePublicPanier()
 *
 * ============================================================================
 */


/* ==========================================================================
   COMPOSANT
   ========================================================================== */

export default function PanierLoading() {
  return (
    <div
      className={
        styles.panierPage
      }
      data-public-panier-page="true"
      data-public-panier-loading="true"
      aria-busy="true"
    >
      <div
        className={
          styles.panierPageInner
        }
      >
        <section
          className={
            styles.panierLoading
          }
          aria-label="Chargement du panier"
          aria-live="polite"
        >
          {/* ==============================================================
              ICÔNE
              ============================================================== */}

          <div
            className={
              styles.panierLoadingIcon
            }
            aria-hidden="true"
          >
            <LoaderCircle
              size={
                30
              }
              strokeWidth={
                1.8
              }
            />
          </div>


          {/* ==============================================================
              TEXTE
              ============================================================== */}

          <div
            className={
              styles.panierLoadingContent
            }
          >
            <h2>
              Chargement de votre panier
            </h2>

            <p>
              Préparation de vos articles avant la vérification des prix, des stocks et des disponibilités.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * Ce loading ne simule aucune donnée commerciale.
 *
 * Les vraies données du Panier restent obtenues ensuite à partir de :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * puis validées côté serveur.
 *
 * ============================================================================
 */