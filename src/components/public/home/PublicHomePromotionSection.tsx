import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  Droplet,
  Heart,
  Sparkles,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  PUBLIC_HOME_PROMOTION_CONFIG,
} from "@/config/public-home";

import type {
  PublicHomePromotionHighlight,
  PublicHomePromotionHighlightIconName,
} from "@/lib/public/home/public-home-types";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — BANNIÈRE RÉSULTATS OFFICIELLE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomePromotionSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la bannière promotionnelle officielle située entre :
 *
 * - Nos Catégories ;
 * - Nos Produits Phares.
 *
 * ============================================================================
 *
 * IMAGE OFFICIELLE
 *
 * /images/couverturea.png
 *
 * ============================================================================
 *
 * TEXTE OFFICIEL
 *
 * DES RÉSULTATS
 * VISIBLES,
 * UNE PEAU SUBLIME !
 *
 * ============================================================================
 *
 * DESKTOP
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │                                                                       │
 * │ DES RÉSULTATS                                      ✨ Éclat naturel  │
 * │ VISIBLES,                 VISUEL PRODUITS           💧 Hydratation    │
 * │ UNE PEAU SUBLIME !                                 ♡ Confiance       │
 * │                                                                       │
 * │ [ Voir nos best-sellers → ]                                          │
 * │                                                                       │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 * MOBILE
 *
 * ┌──────────────────────────────────────┐
 * │                                      │
 * │ DES RÉSULTATS                        │
 * │ VISIBLES,                            │
 * │ UNE PEAU SUBLIME !      VISUEL       │
 * │                                      │
 * │ [ Voir nos produits → ]              │
 * │                                      │
 * └──────────────────────────────────────┘
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - Server Component ;
 * - aucun "use client" ;
 * - aucun useState ;
 * - aucun useEffect ;
 * - aucune requête Prisma ;
 * - aucune donnée produit fictive ;
 * - aucune duplication de couverturea.png ;
 * - aucune image mobile séparée ;
 * - aucune image desktop séparée ;
 * - aucun carousel ;
 * - aucune route inventée ;
 * - le CTA descend vers la vraie section produits ;
 * - les trois bénéfices sont affichés sur desktop ;
 * - les trois bénéfices sont masqués sur mobile par le CSS ;
 * - le responsive reste piloté par public-home.module.css.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const CONFIG =
  PUBLIC_HOME_PROMOTION_CONFIG;


/* ==========================================================================
   2. IDENTIFIANT ACCESSIBILITÉ
   ========================================================================== */

const PROMOTION_TITLE_ID =
  `${CONFIG.sectionId}-title`;


/* ==========================================================================
   3. CONSTANTES ICÔNES
   ========================================================================== */

const HIGHLIGHT_ICON_SIZE =
  17;


const HIGHLIGHT_ICON_STROKE_WIDTH =
  2;


const ACTION_ICON_SIZE =
  16;


const ACTION_ICON_STROKE_WIDTH =
  2.2;


/* ==========================================================================
   4. MAPPING DES ICÔNES
   ========================================================================== */

/**
 * public-home.ts contient uniquement le nom logique des icônes.
 *
 * Le mapping vers React / Lucide reste donc dans le composant.
 */
const PROMOTION_HIGHLIGHT_ICONS:
  Readonly<
    Record<
      PublicHomePromotionHighlightIconName,
      LucideIcon
    >
  > = {
    sparkles:
      Sparkles,

    droplet:
      Droplet,

    heart:
      Heart,
  };


/* ==========================================================================
   5. IMAGE OFFICIELLE
   ========================================================================== */

/**
 * Une seule occurrence de :
 *
 * /images/couverturea.png
 *
 * IMPORTANT :
 *
 * L’image est placée dans une couche absolue gérée par :
 *
 * .promotionImageLayer
 * .promotionImage
 *
 * Le cadrage desktop/mobile sera entièrement contrôlé dans :
 *
 * public-home.module.css
 */
function PromotionArtwork() {
  return (
    <div
      className={
        styles.promotionImageLayer
      }
      aria-hidden="true"
    >
      <Image
        src={
          CONFIG.image.src
        }
        alt=""
        fill
        priority={
          CONFIG.image.priority
        }
        sizes="
          (max-width: 767px) 100vw,
          (max-width: 1023px) 96vw,
          (max-width: 1440px) 94vw,
          1350px
        "
        className={
          styles.promotionImage
        }
      />
    </div>
  );
}


/* ==========================================================================
   6. TITRE
   ========================================================================== */

function PromotionTitle() {
  return (
    <h2
      id={
        PROMOTION_TITLE_ID
      }
      className={
        styles.promotionTitle
      }
    >
      {CONFIG.titleLines.map(
        (
          line,
        ) => (
          <span
            key={
              line.id
            }
            className={
              styles.promotionTitleLine
            }
          >
            {
              line.text
            }
          </span>
        ),
      )}
    </h2>
  );
}


/* ==========================================================================
   7. CTA
   ========================================================================== */

/**
 * Aucun chemin catalogue n’est inventé.
 *
 * Le bouton pointe uniquement vers :
 *
 * #produits-phares
 *
 * conformément à public-home.ts.
 */
function PromotionAction() {
  const action =
    CONFIG.action;


  const targetHref =
    `#${action.targetSectionId}`;


  return (
    <Link
      href={
        targetHref
      }
      className={
        styles.promotionAction
      }
      aria-label={
        action.desktopLabel
      }
    >
      {/* ===============================================================
          DESKTOP
          =============================================================== */}

      <span
        className={
          styles.categoryDesktopLabel
        }
      >
        {
          action.desktopLabel
        }
      </span>


      {/* ===============================================================
          MOBILE
          =============================================================== */}

      <span
        className={
          styles.categoryMobileLabel
        }
      >
        {
          action.mobileLabel
        }
      </span>


      {/* ===============================================================
          FLÈCHE
          =============================================================== */}

      <ArrowRight
        size={
          ACTION_ICON_SIZE
        }
        strokeWidth={
          ACTION_ICON_STROKE_WIDTH
        }
        aria-hidden="true"
        focusable="false"
      />
    </Link>
  );
}


/* ==========================================================================
   8. CONTENU PRINCIPAL
   ========================================================================== */

function PromotionContent() {
  return (
    <div
      className={
        styles.promotionContent
      }
    >
      <PromotionTitle />

      <PromotionAction />
    </div>
  );
}


/* ==========================================================================
   9. ÉLÉMENT BÉNÉFICE
   ========================================================================== */

interface PromotionHighlightItemProps {
  readonly highlight:
    PublicHomePromotionHighlight;
}


function PromotionHighlightItem({
  highlight,
}: PromotionHighlightItemProps) {
  const Icon =
    PROMOTION_HIGHLIGHT_ICONS[
      highlight.icon
    ];


  return (
    <li
      className={
        styles.promotionHighlight
      }
    >
      <span
        className={
          styles.promotionHighlightIcon
        }
        aria-hidden="true"
      >
        <Icon
          size={
            HIGHLIGHT_ICON_SIZE
          }
          strokeWidth={
            HIGHLIGHT_ICON_STROKE_WIDTH
          }
          aria-hidden="true"
          focusable="false"
        />
      </span>


      <span
        className={
          styles.promotionHighlightLabel
        }
      >
        {
          highlight.label
        }
      </span>
    </li>
  );
}


/* ==========================================================================
   10. LISTE DES BÉNÉFICES
   ========================================================================== */

/**
 * La configuration officielle contient :
 *
 * - Éclat naturel ;
 * - Hydratation intense ;
 * - Confiance retrouvée.
 *
 * Aucun quatrième élément n’est ajouté.
 *
 * IMPORTANT :
 *
 * Aucun test `length === 0`.
 *
 * Le tableau est défini comme tuple `as const` dans public-home.ts.
 */
function PromotionHighlights() {
  return (
    <ul
      className={
        styles.promotionHighlights
      }
      aria-label="Bénéfices des soins L&E Cosmetics Empire"
    >
      {CONFIG.highlights.map(
        (
          highlight,
        ) => (
          <PromotionHighlightItem
            key={
              highlight.id
            }
            highlight={
              highlight
            }
          />
        ),
      )}
    </ul>
  );
}


/* ==========================================================================
   11. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicHomePromotionSection() {
  return (
    <section
      id={
        CONFIG.sectionId
      }
      className={
        styles.promotionSection
      }
      aria-labelledby={
        PROMOTION_TITLE_ID
      }
    >
      <div
        className={
          styles.promotionInner
        }
      >
        <div
          className={
            styles.promotionBanner
          }
        >
          {/* =============================================================
              IMAGE OFFICIELLE
              =============================================================

              Source réelle :

              public/images/couverturea.png

              Une seule image pour desktop et mobile.
              ============================================================= */}

          <PromotionArtwork />


          {/* =============================================================
              TEXTE + CTA
              ============================================================= */}

          <PromotionContent />


          {/* =============================================================
              BÉNÉFICES DESKTOP
              =============================================================

              Le CSS de la Home est responsable de :

              Desktop → visible
              Mobile  → masqué
              ============================================================= */}

          <PromotionHighlights />
        </div>
      </div>
    </section>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES
 *
 * ============================================================================
 *
 * IMAGE
 *
 * Source :
 *
 * /images/couverturea.png
 *
 * Rendue :
 *
 * - une seule fois ;
 * - avec Next/Image ;
 * - sans duplication mobile ;
 * - sans duplication desktop ;
 * - sans carousel.
 *
 * ============================================================================
 *
 * TITRE
 *
 * DES RÉSULTATS
 * VISIBLES,
 * UNE PEAU SUBLIME !
 *
 * ============================================================================
 *
 * DESKTOP
 *
 * CTA :
 *
 * Voir nos best-sellers →
 *
 * Bénéfices :
 *
 * Éclat naturel
 * Hydratation intense
 * Confiance retrouvée
 *
 * ============================================================================
 *
 * MOBILE
 *
 * CTA :
 *
 * Voir nos produits →
 *
 * Bénéfices :
 *
 * masqués via CSS.
 *
 * ============================================================================
 *
 * RESPONSABILITÉS
 *
 * Aucune :
 *
 * - requête Prisma ;
 * - logique de stock ;
 * - logique de prix ;
 * - logique panier ;
 * - donnée produit fictive ;
 * - route publique inventée ;
 * - logique JavaScript responsive.
 *
 * ============================================================================
 */