import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
} from "lucide-react";

import {
  PUBLIC_HOME_HERO_CONFIG,
} from "@/config/public-home";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — HERO OFFICIEL
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomeHeroSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la bannière principale officielle de la Home exactement selon
 * l’architecture validée.
 *
 * ============================================================================
 *
 * TITRE OFFICIEL
 *
 * RÉVÈLE
 * TA BEAUTÉ
 * NATURELLE
 *
 * Couleurs :
 *
 * RÉVÈLE      → noir
 * TA          → noir
 * BEAUTÉ      → rose
 * NATURELLE   → rose
 *
 * ============================================================================
 *
 * IMAGE OFFICIELLE
 *
 * /images/couverture.png
 *
 * Cette image est utilisée une seule fois.
 *
 * ============================================================================
 *
 * DESKTOP
 *
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   RÉVÈLE                                                   │
 * │   TA BEAUTÉ                           VISUEL OFFICIEL       │
 * │   NATURELLE                                                │
 * │                                                            │
 * │   Des soins efficaces pour une peau                        │
 * │   éclatante et en pleine santé.                            │
 * │                                                            │
 * │   [ Découvrir nos produits → ]                             │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 * MOBILE
 *
 * ┌──────────────────────────────────┐
 * │                                  │
 * │ RÉVÈLE                           │
 * │ TA BEAUTÉ              VISUEL    │
 * │ NATURELLE                        │
 * │                                  │
 * │ Des soins efficaces...           │
 * │                                  │
 * │ [ Découvrir maintenant → ]       │
 * │                                  │
 * │            ● ○ ○ ○               │
 * └──────────────────────────────────┘
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - Server Component ;
 * - aucun "use client" ;
 * - aucun useState ;
 * - aucun useEffect ;
 * - aucun carousel artificiel ;
 * - aucune duplication de couverture.png ;
 * - aucune image desktop/mobile séparée ;
 * - aucun texte commercial inventé ;
 * - aucune route publique inventée ;
 * - CTA vers la vraie section Produits Phares ;
 * - indicateurs mobiles décoratifs uniquement ;
 * - responsive entièrement géré par CSS.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const CONFIG =
  PUBLIC_HOME_HERO_CONFIG;


/* ==========================================================================
   2. IDENTIFIANTS ACCESSIBILITÉ
   ========================================================================== */

const HERO_TITLE_ID =
  `${CONFIG.sectionId}-title`;


const HERO_DESCRIPTION_ID =
  `${CONFIG.sectionId}-description`;


/* ==========================================================================
   3. TYPES LOCAUX DÉRIVÉS
   ========================================================================== */

/**
 * Les types sont volontairement dérivés directement de public-home.ts.
 *
 * Aucune union parallèle n’est redéfinie manuellement.
 */
type HeroTitleLine =
  (
    typeof CONFIG
  )["titleLines"][number];


type HeroTitleSegment =
  HeroTitleLine[
    "segments"
  ][number];


type HeroTitleTone =
  HeroTitleSegment[
    "tone"
  ];


/* ==========================================================================
   4. CLASSE DE COULEUR
   ========================================================================== */

/**
 * Association explicite entre le contrat éditorial et le CSS.
 *
 * Valeurs supportées actuellement :
 *
 * dark
 * primary
 */
function getHeroTitleToneClassName(
  tone:
    HeroTitleTone,
): string {
  switch (
    tone
  ) {
    case "primary":
      return styles.heroTitlePrimary;

    case "dark":
    default:
      return styles.heroTitleDark;
  }
}


/* ==========================================================================
   5. SEGMENT DE TITRE
   ========================================================================== */

/**
 * Exemple pour la deuxième ligne :
 *
 * <span>
 *   <span>TA </span>
 *   <span>BEAUTÉ</span>
 * </span>
 *
 * Cela permet de conserver :
 *
 * TA      → noir
 * BEAUTÉ  → rose
 *
 * sur UNE seule ligne.
 */
interface HeroTitleSegmentProps {
  readonly segment:
    HeroTitleSegment;
}


function HeroTitleSegmentView({
  segment,
}: HeroTitleSegmentProps) {
  return (
    <span
      className={
        getHeroTitleToneClassName(
          segment.tone,
        )
      }
      data-hero-title-segment={
        segment.id
      }
    >
      {
        segment.text
      }
    </span>
  );
}


/* ==========================================================================
   6. LIGNE DU TITRE
   ========================================================================== */

interface HeroTitleLineProps {
  readonly line:
    HeroTitleLine;
}


function HeroTitleLineView({
  line,
}: HeroTitleLineProps) {
  return (
    <span
      className={
        styles.heroTitleLine
      }
      data-hero-title-line={
        line.id
      }
    >
      {line.segments.map(
        (
          segment,
        ) => (
          <HeroTitleSegmentView
            key={
              segment.id
            }
            segment={
              segment
            }
          />
        ),
      )}
    </span>
  );
}


/* ==========================================================================
   7. TITRE COMPLET
   ========================================================================== */

function HeroTitle() {
  return (
    <h1
      id={
        HERO_TITLE_ID
      }
      className={
        styles.heroTitle
      }
    >
      {CONFIG.titleLines.map(
        (
          line,
        ) => (
          <HeroTitleLineView
            key={
              line.id
            }
            line={
              line
            }
          />
        ),
      )}
    </h1>
  );
}


/* ==========================================================================
   8. CTA
   ========================================================================== */

/**
 * Le CTA reste une ancre interne vers :
 *
 * #produits-phares
 *
 * Aucun chemin catalogue n’est inventé ici.
 *
 * Desktop :
 *
 * Découvrir nos produits
 *
 * Mobile :
 *
 * Découvrir maintenant
 *
 * Les classes categoryDesktopLabel / categoryMobileLabel existent déjà
 * dans public-home.module.css et assurent la bascule responsive sans JS.
 */
function HeroAction() {
  const targetHref =
    `#${CONFIG.action.targetSectionId}`;


  return (
    <Link
      href={
        targetHref
      }
      className={
        styles.heroAction
      }
      aria-label={
        CONFIG.action
          .desktopLabel
      }
    >
      {/* ===============================================================
          LABEL DESKTOP
          =============================================================== */}

      <span
        className={
          styles.categoryDesktopLabel
        }
      >
        {
          CONFIG.action
            .desktopLabel
        }
      </span>


      {/* ===============================================================
          LABEL MOBILE
          =============================================================== */}

      <span
        className={
          styles.categoryMobileLabel
        }
      >
        {
          CONFIG.action
            .mobileLabel
        }
      </span>


      {/* ===============================================================
          ICÔNE
          =============================================================== */}

      <ArrowRight
        size={
          17
        }
        strokeWidth={
          2.2
        }
        aria-hidden="true"
        focusable="false"
      />
    </Link>
  );
}


/* ==========================================================================
   9. INDICATEURS MOBILE
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * L’architecture montre quatre petits points sous le Hero mobile.
 *
 * Une seule image Hero réelle existe actuellement :
 *
 * /images/couverture.png
 *
 * Les points sont donc uniquement décoratifs.
 *
 * Ils ne correspondent pas à :
 *
 * - quatre images ;
 * - quatre slides ;
 * - quatre copies de couverture.png.
 */
function HeroMobileIndicators() {
  const indicators =
    CONFIG
      .presentation
      .mobileIndicators;


  if (
    !indicators.visible
  ) {
    return null;
  }


  return (
    <div
      className={
        styles.heroIndicators
      }
      aria-hidden="true"
    >
      {Array.from(
        {
          length:
            indicators.count,
        },
        (
          _,
          index,
        ) => {
          const isActive =
            index ===
            indicators.activeIndex;


          return (
            <span
              key={
                `hero-indicator-${index}`
              }
              className={
                [
                  styles.heroIndicator,
                  isActive
                    ? styles.heroIndicatorActive
                    : "",
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )
              }
            />
          );
        },
      )}
    </div>
  );
}


/* ==========================================================================
   10. IMAGE OFFICIELLE
   ========================================================================== */

/**
 * Une seule instance de Next/Image est rendue.
 *
 * Desktop et mobile utilisent exactement :
 *
 * /images/couverture.png
 *
 * Le cadrage responsive appartient au CSS.
 */
function HeroArtwork() {
  return (
    <div
      className={
        styles.heroImageLayer
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
        sizes="100vw"
        className={
          styles.heroImage
        }
      />


      <div
        className={
          styles.heroImageOverlay
        }
      />
    </div>
  );
}


/* ==========================================================================
   11. CONTENU
   ========================================================================== */

function HeroContent() {
  return (
    <div
      className={
        styles.heroContent
      }
    >
      {/* =================================================================
          TITRE
          ================================================================= */}

      <HeroTitle />


      {/* =================================================================
          DESCRIPTION
          ================================================================= */}

      <p
        id={
          HERO_DESCRIPTION_ID
        }
        className={
          styles.heroDescription
        }
      >
        {
          CONFIG.description
        }
      </p>


      {/* =================================================================
          ACTION
          ================================================================= */}

      <HeroAction />
    </div>
  );
}


/* ==========================================================================
   12. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicHomeHeroSection() {
  return (
    <section
      id={
        CONFIG.sectionId
      }
      className={
        styles.heroSection
      }
      aria-labelledby={
        HERO_TITLE_ID
      }
      aria-describedby={
        HERO_DESCRIPTION_ID
      }
    >
      <div
        className={
          styles.heroInner
        }
      >
        <div
          className={
            styles.heroBanner
          }
        >
          {/* =============================================================
              IMAGE
              ============================================================= */}

          <HeroArtwork />


          {/* =============================================================
              CONTENU
              ============================================================= */}

          <HeroContent />


          {/* =============================================================
              INDICATEURS DÉCORATIFS MOBILE
              ============================================================= */}

          <HeroMobileIndicators />
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
 * IMAGE
 *
 * /images/couverture.png
 *
 * utilisée exactement une seule fois.
 *
 * --------------------------------------------------------------------------
 *
 * TITRE
 *
 * Ligne 1 :
 *
 * RÉVÈLE
 * noir
 *
 * Ligne 2 :
 *
 * TA       noir
 * BEAUTÉ   rose
 *
 * Ligne 3 :
 *
 * NATURELLE
 * rose
 *
 * --------------------------------------------------------------------------
 *
 * CTA
 *
 * Desktop :
 *
 * Découvrir nos produits →
 *
 * Mobile :
 *
 * Découvrir maintenant →
 *
 * --------------------------------------------------------------------------
 *
 * RESPONSIVE
 *
 * Aucun JavaScript de détection d’écran.
 *
 * Le responsive dépend exclusivement de :
 *
 * src/components/public/home/public-home.module.css
 *
 * --------------------------------------------------------------------------
 *
 * AUCUNE :
 *
 * - deuxième image ;
 * - copie mobile ;
 * - copie desktop ;
 * - logique Prisma ;
 * - logique panier ;
 * - route commerciale inventée ;
 * - donnée fictive.
 *
 * ============================================================================
 */