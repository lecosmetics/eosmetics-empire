import Image from "next/image";
import Link from "next/link";

import {
  ChevronRight,
} from "lucide-react";

import {
  PUBLIC_CATEGORIES_BREADCRUMB_CONFIG,
  PUBLIC_CATEGORIES_HERO_CONFIG,
} from "@/config/public-categories";

import type {
  PublicCategoriesHeroProps,
} from "@/lib/public/categories/public-categories-types";

import styles from "./public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CATÉGORIES PUBLIQUES — HERO
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/categories/PublicCategoriesHero.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher l’introduction officielle de :
 *
 * /categories
 *
 * avec :
 *
 * - le fil d’Ariane ;
 * - l’image officielle ;
 * - le libellé "NOS CATÉGORIES" ;
 * - le titre ;
 * - la description.
 *
 * ============================================================================
 *
 * IMAGE
 *
 * public/imagse/resulta.png
 *
 * URL publique :
 *
 * /imagse/resulta.png
 *
 * ============================================================================
 *
 * ARCHITECTURE
 *
 * Accueil > Catégories
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │                                                                       │
 * │ NOS CATÉGORIES                                                        │
 * │                                                                       │
 * │ Trouvez les produits                  VISUEL OFFICIEL                 │
 * │ qui vous subliment                                                    │
 * │                                                                       │
 * │ Des soins adaptés à chaque besoin...                                  │
 * │                                                                       │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - Server Component ;
 * - aucun "use client" ;
 * - aucune requête Prisma ;
 * - aucun useState ;
 * - aucun useEffect ;
 * - aucun texte commercial inventé ;
 * - aucune route de catégorie construite ici ;
 * - aucune duplication desktop/mobile de resulta.png ;
 * - responsive exclusivement géré par CSS.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const HERO_CONFIG =
  PUBLIC_CATEGORIES_HERO_CONFIG;


const BREADCRUMB_CONFIG =
  PUBLIC_CATEGORIES_BREADCRUMB_CONFIG;


/* ==========================================================================
   2. ACCESSIBILITÉ
   ========================================================================== */

const HERO_TITLE_ID =
  `${HERO_CONFIG.sectionId}-title`;


const HERO_DESCRIPTION_ID =
  `${HERO_CONFIG.sectionId}-description`;


/* ==========================================================================
   3. UTILITAIRE CLASS NAMES
   ========================================================================== */

function joinClassNames(
  ...classNames:
    Array<
      string |
      false |
      null |
      undefined
    >
): string {
  return classNames
    .filter(
      (
        className,
      ): className is string =>
        Boolean(
          className,
        ),
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   4. BREADCRUMB
   ========================================================================== */

function CategoriesBreadcrumb() {
  return (
    <nav
      className={
        styles.categoriesHeroBreadcrumb
      }
      aria-label={
        BREADCRUMB_CONFIG.ariaLabel
      }
    >
      <ol
        className={
          styles.categoriesHeroBreadcrumbList
        }
      >
        {/* ===============================================================
            ACCUEIL
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbItem
          }
        >
          <Link
            href={
              BREADCRUMB_CONFIG
                .home
                .href
            }
            className={
              styles.categoriesHeroBreadcrumbLink
            }
          >
            {
              BREADCRUMB_CONFIG
                .home
                .label
            }
          </Link>
        </li>


        {/* ===============================================================
            SÉPARATEUR
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbSeparator
          }
          aria-hidden="true"
        >
          <ChevronRight
            size={
              14
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </li>


        {/* ===============================================================
            PAGE COURANTE
            =============================================================== */}

        <li
          className={
            styles.categoriesHeroBreadcrumbItem
          }
          aria-current="page"
        >
          <span
            className={
              styles.categoriesHeroBreadcrumbCurrent
            }
          >
            {
              BREADCRUMB_CONFIG
                .current
                .label
            }
          </span>
        </li>
      </ol>
    </nav>
  );
}


/* ==========================================================================
   5. IMAGE
   ========================================================================== */

/**
 * Une seule image est rendue.
 *
 * Desktop et mobile utilisent exactement la même source.
 *
 * Le cadrage appartient à :
 *
 * public-categories.module.css
 */
function CategoriesHeroArtwork() {
  return (
    <div
      className={
        styles.categoriesHeroImageLayer
      }
    >
      <Image
        src={
          HERO_CONFIG.image.src
        }
        alt={
          HERO_CONFIG.image.alt
        }
        fill
        priority={
          HERO_CONFIG.image.priority
        }
        sizes="100vw"
        className={
          styles.categoriesHeroImage
        }
      />


      <div
        className={
          styles.categoriesHeroImageOverlay
        }
        aria-hidden="true"
      />
    </div>
  );
}


/* ==========================================================================
   6. EYEBROW
   ========================================================================== */

function CategoriesHeroEyebrow() {
  return (
    <p
      className={
        styles.categoriesHeroEyebrow
      }
    >
      {
        HERO_CONFIG.eyebrow
      }
    </p>
  );
}


/* ==========================================================================
   7. TITRE
   ========================================================================== */

function CategoriesHeroTitle() {
  return (
    <h1
      id={
        HERO_TITLE_ID
      }
      className={
        styles.categoriesHeroTitle
      }
    >
      {HERO_CONFIG.titleLines.map(
        (
          line,
          index,
        ) => (
          <span
            key={
              line.id
            }
            className={
              styles.categoriesHeroTitleLine
            }
            data-title-line={
              line.id
            }
            data-title-line-index={
              index
            }
          >
            {
              line.text
            }
          </span>
        ),
      )}
    </h1>
  );
}


/* ==========================================================================
   8. DESCRIPTION
   ========================================================================== */

function CategoriesHeroDescription() {
  return (
    <p
      id={
        HERO_DESCRIPTION_ID
      }
      className={
        styles.categoriesHeroDescription
      }
    >
      {
        HERO_CONFIG.description
      }
    </p>
  );
}


/* ==========================================================================
   9. CONTENU
   ========================================================================== */

function CategoriesHeroContent() {
  return (
    <div
      className={
        styles.categoriesHeroContent
      }
    >
      <CategoriesHeroEyebrow />

      <CategoriesHeroTitle />

      <CategoriesHeroDescription />
    </div>
  );
}


/* ==========================================================================
   10. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoriesHero({
  className,
}: PublicCategoriesHeroProps) {
  return (
    <section
      id={
        HERO_CONFIG.sectionId
      }
      className={
        joinClassNames(
          styles.categoriesHeroSection,
          className,
        )
      }
      aria-labelledby={
        HERO_TITLE_ID
      }
      aria-describedby={
        HERO_DESCRIPTION_ID
      }
    >
      {/* ==================================================================
          BREADCRUMB
          ================================================================== */}

      <div
        className={
          styles.categoriesHeroBreadcrumbContainer
        }
      >
        <CategoriesBreadcrumb />
      </div>


      {/* ==================================================================
          BANNIÈRE
          ================================================================== */}

      <div
        className={
          styles.categoriesHeroBanner
        }
      >
        {/* ================================================================
            IMAGE OFFICIELLE
            ================================================================ */}

        <CategoriesHeroArtwork />


        {/* ================================================================
            CONTENU
            ================================================================ */}

        <CategoriesHeroContent />
      </div>
    </section>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * DONNÉES
 *
 * Tous les textes proviennent de :
 *
 * src/config/public-categories.ts
 *
 * ============================================================================
 *
 * IMAGE
 *
 * Une seule occurrence :
 *
 * /imagse/resulta.png
 *
 * ============================================================================
 *
 * BREADCRUMB
 *
 * Accueil
 *   >
 * Catégories
 *
 * ============================================================================
 *
 * TITRE
 *
 * NOS CATÉGORIES
 *
 * Trouvez les produits
 * qui vous subliment
 *
 * ============================================================================
 *
 * RESPONSIVE
 *
 * Aucun JavaScript.
 *
 * Le comportement PC / tablette / mobile sera entièrement défini dans :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * ============================================================================
 *
 * CE COMPOSANT NE CONTIENT AUCUNE :
 *
 * - requête Prisma ;
 * - catégorie de démonstration ;
 * - donnée produit ;
 * - donnée StoreProduct ;
 * - construction de slug ;
 * - route dynamique de catégorie ;
 * - duplication d’image ;
 * - logique de Footer ;
 * - logique de Bottom Navigation.
 *
 * ============================================================================
 */