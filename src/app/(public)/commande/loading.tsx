import {
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import styles from "@/components/public/commande/public-commande.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/commande/loading.tsx
 *
 * Route :
 *
 * /commande
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement léger pendant que Next.js prépare
 * la route publique de commande.
 *
 * ============================================================================
 *
 * CE FICHIER :
 *
 * - reste un Server Component ;
 * - n'appelle aucune API ;
 * - n'appelle pas Prisma ;
 * - ne lit pas le Panier ;
 * - ne calcule aucun prix ;
 * - ne calcule aucune livraison ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement.
 *
 * ============================================================================
 */


export default function CommandeLoading() {
  return (
    <main
      className={
        styles.commandePage
      }
      data-public-commande-page="true"
      aria-busy="true"
    >
      <div
        className={
          styles.commandeContainer
        }
      >
        <section
          className={
            styles.commandePageLoading
          }
          aria-live="polite"
          aria-label="Chargement de la commande"
        >
          <LoaderCircle
            className={
              styles.commandeSpinner
            }
            size={
              32
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />

          <strong>
            Préparation de votre commande…
          </strong>

          <div
            className={
              styles.commandeActionSecurity
            }
          >
            <ShieldCheck
              size={
                15
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            <span>
              Vérification sécurisée de votre espace de commande.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}