import {
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import styles from "@/components/public/commande/public-commande.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — PAIEMENT — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/commande/paiement/loading.tsx
 *
 * Route :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que Next.js prépare
 * l'étape de paiement.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cet écran ne représente jamais :
 *
 * - un paiement réussi ;
 * - une commande créée ;
 * - un paiement confirmé ;
 * - un stock réservé.
 *
 * ============================================================================
 *
 * CE FICHIER :
 *
 * - reste un Server Component ;
 * - n'appelle aucune Server Action ;
 * - n'appelle pas Prisma ;
 * - ne lit pas sessionStorage ;
 * - ne crée aucune Order ;
 * - ne crée aucun Payment ;
 * - ne contacte aucun provider ;
 * - ne calcule aucun montant.
 *
 * ============================================================================
 */


export default function PaiementLoading() {
  return (
    <main
      className={
        styles.commandePage
      }
      data-public-payment-page="true"
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
          role="status"
          aria-live="polite"
          aria-label="Préparation du paiement"
        >
          {/* ================================================================
              ICÔNE
              ================================================================ */}

          <div
            className={
              styles.commandeEmptyIcon
            }
            aria-hidden="true"
          >
            <CreditCard
              size={
                30
              }
              strokeWidth={
                1.6
              }
            />
          </div>


          {/* ================================================================
              CHARGEMENT
              ================================================================ */}

          <LoaderCircle
            className={
              styles.commandeSpinner
            }
            size={
              30
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />


          <strong>
            Préparation du paiement…
          </strong>


          {/* ================================================================
              SÉCURITÉ
              ================================================================ */}

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
              Vérification de votre commande et des options de paiement.
            </span>
          </div>


          <div
            className={
              styles.commandeActionSecurity
            }
          >
            <LockKeyhole
              size={
                14
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
            />

            <span>
              Aucun paiement n’est effectué pendant ce chargement.
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}