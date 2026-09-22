import {
  Gift,
  Headphones,
  ShieldCheck,
  Truck,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  PUBLIC_HOME_BENEFITS_CONFIG,
} from "@/config/public-home";

import type {
  PublicHomeBenefitIconName,
} from "@/lib/public/home/public-home-types";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — AVANTAGES CLÉS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomeBenefitsSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher exactement les quatre avantages visibles dans l’architecture
 * officielle de la page d’accueil :
 *
 * 1. Livraison rapide
 *    à Yaoundé et Douala
 *
 * 2. Produits 100%
 *    originaux
 *
 * 3. Service client
 *    disponible
 *
 * 4. Offres et promotions
 *    régulières
 *
 * ============================================================================
 *
 * ARCHITECTURE DESKTOP
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  🚚 Livraison     │  🛡 Produits     │  🎧 Service      │ 🎁 Offres │
 * │     rapide        │     100%         │     client       │    et     │
 * │     Yaoundé /     │     originaux    │     disponible   │ promotions│
 * │     Douala        │                  │                  │ régulières│
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 * ARCHITECTURE MOBILE
 *
 * Les quatre avantages restent sur UNE seule ligne, exactement comme sur
 * l’architecture officielle :
 *
 * ┌────────┬────────┬────────┬────────┐
 * │   🚚   │   🛡   │   🎧   │   🎁   │
 * │Livraison│Produits│Service │Promos │
 * │ rapide  │originaux│client │       │
 * └────────┴────────┴────────┴────────┘
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - Server Component ;
 * - aucun "use client" ;
 * - aucun useState ;
 * - aucun useEffect ;
 * - aucun JavaScript responsive ;
 * - aucune donnée métier écrite en dur dans le JSX ;
 * - aucune cinquième valeur ajoutée ;
 * - aucune animation JavaScript ;
 * - aucune image nécessaire ;
 * - aucun lien artificiel ;
 * - aucune route inventée ;
 * - le responsive est entièrement géré par public-home.module.css.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. MAPPING DES ICÔNES
   ========================================================================== */

/**
 * La configuration stocke uniquement des identifiants d’icônes.
 *
 * Le composant est responsable de leur association avec lucide-react.
 *
 * Cette séparation permet de conserver :
 *
 * - public-home.ts indépendant de React ;
 * - la configuration sérialisable ;
 * - les composants visuels responsables du rendu.
 */
const BENEFIT_ICONS:
  Readonly<
    Record<
      PublicHomeBenefitIconName,
      LucideIcon
    >
  > = {
    truck:
      Truck,

    "shield-check":
      ShieldCheck,

    headphones:
      Headphones,

    gift:
      Gift,
  };


/* ==========================================================================
   2. TAILLE DES ICÔNES
   ========================================================================== */

/**
 * Les tailles réelles du conteneur sont définies dans le CSS.
 *
 * L’icône SVG conserve une dimension suffisamment grande pour rester nette
 * sur desktop comme sur mobile.
 */
const BENEFIT_ICON_SIZE =
  30;

const BENEFIT_ICON_STROKE_WIDTH =
  1.9;


/* ==========================================================================
   3. COMPOSANT AVANTAGE
   ========================================================================== */

interface PublicHomeBenefitItemProps {
  readonly benefit:
    (
      typeof PUBLIC_HOME_BENEFITS_CONFIG
    )["items"][number];
}


function PublicHomeBenefitItem({
  benefit,
}: PublicHomeBenefitItemProps) {
  const Icon =
    BENEFIT_ICONS[
      benefit.icon
    ];


  return (
    <li
      className={
        styles.benefitItem
      }
    >
      {/* =================================================================
          ICÔNE
          ================================================================= */}

      <span
        className={
          styles.benefitIcon
        }
        aria-hidden="true"
      >
        <Icon
          size={
            BENEFIT_ICON_SIZE
          }
          strokeWidth={
            BENEFIT_ICON_STROKE_WIDTH
          }
          aria-hidden="true"
          focusable="false"
        />
      </span>


      {/* =================================================================
          TEXTE
          ================================================================= */}

      <span
        className={
          styles.benefitText
        }
      >
        <strong
          className={
            styles.benefitTitle
          }
        >
          {
            benefit.title
          }
        </strong>

        <span
          className={
            styles.benefitDescription
          }
        >
          {
            benefit.description
          }
        </span>
      </span>
    </li>
  );
}


/* ==========================================================================
   4. SECTION PRINCIPALE
   ========================================================================== */

export default function PublicHomeBenefitsSection() {
  const config =
    PUBLIC_HOME_BENEFITS_CONFIG;


  /**
   * Protection structurelle.
   *
   * L’architecture officielle contient exactement quatre éléments.
   *
   * On ne complète jamais automatiquement une liste incomplète avec
   * des données fictives.
   */
  const benefits =
    config.items.slice(
      0,
      4,
    );


  return (
    <section
      id={
        config.sectionId
      }
      className={
        styles.benefitsSection
      }
      aria-label={
        config.ariaLabel
      }
    >
      <div
        className={
          styles.benefitsInner
        }
      >
        <ul
          className={
            styles.benefitsList
          }
        >
          {benefits.map(
            (
              benefit,
            ) => (
              <PublicHomeBenefitItem
                key={
                  benefit.id
                }
                benefit={
                  benefit
                }
              />
            ),
          )}
        </ul>
      </div>
    </section>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * RENDU ATTENDU
 *
 * DESKTOP
 *
 * Livraison rapide     Produits 100%      Service client      Offres et
 * à Yaoundé et Douala  originaux          disponible          promotions
 *                                                             régulières
 *
 *
 * MOBILE
 *
 * Les quatre éléments restent côte à côte.
 *
 * Aucun carousel.
 * Aucun scroll horizontal.
 * Aucun élément supplémentaire.
 *
 * ============================================================================
 */