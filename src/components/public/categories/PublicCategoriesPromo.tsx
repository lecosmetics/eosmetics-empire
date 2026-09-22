import Link from "next/link";

import {
  ArrowRight,
  Sparkles,
} from "lucide-react";

import {
  PUBLIC_CATEGORIES_PROMOTION_CONFIG,
} from "@/config/public-categories";

import type {
  PublicCategoriesPromoProps,
} from "@/lib/public/categories/public-categories-types";

import styles from "./public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CATÉGORIES PUBLIQUES — BANNIÈRE BASSE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/categories/PublicCategoriesPromo.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la petite bannière éditoriale située sous la grille des catégories
 * sur :
 *
 * /categories
 *
 * ============================================================================
 *
 * CONTENU
 *
 * Le composant affiche uniquement les textes définis dans :
 *
 * src/config/public-categories.ts
 *
 * et reçoit depuis son parent :
 *
 * productsHref
 *
 * correspondant à la vraie route publique des produits.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette section n'est PAS une promotion tarifaire.
 *
 * Elle ne doit donc jamais inventer :
 *
 * - de réduction ;
 * - de pourcentage ;
 * - de prix ;
 * - de code promo ;
 * - de livraison gratuite ;
 * - de garantie ;
 * - de stock ;
 * - de nombre de produits ;
 * - de campagne commerciale.
 *
 * ============================================================================
 *
 * CE COMPOSANT NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire PostgreSQL ;
 * - lire une session ;
 * - fabriquer la route Produits ;
 * - devenir un Client Component ;
 * - utiliser useState ;
 * - utiliser useEffect ;
 * - dupliquer une image ;
 * - ajouter une donnée commerciale fictive.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const PROMOTION_CONFIG =
  PUBLIC_CATEGORIES_PROMOTION_CONFIG;


/* ==========================================================================
   2. IDENTIFIANTS ACCESSIBILITÉ
   ========================================================================== */

const PROMOTION_TITLE_ID =
  `${PROMOTION_CONFIG.sectionId}-title`;


const PROMOTION_DESCRIPTION_ID =
  `${PROMOTION_CONFIG.sectionId}-description`;


/* ==========================================================================
   3. NORMALISATION
   ========================================================================== */

/**
 * On valide uniquement la valeur reçue.
 *
 * Le composant ne crée aucun fallback de route.
 */
function normalizeRequiredText(
  value:
    string |
    null |
    undefined,
): string {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }


  return value.trim();
}


/* ==========================================================================
   4. VALIDATION HREF
   ========================================================================== */

/**
 * La route doit avoir été résolue avant d'arriver dans ce composant.
 *
 * On accepte :
 *
 * /produits
 *
 * ou toute autre vraie route interne fournie par le système de routes.
 *
 * On refuse simplement une chaîne vide.
 */
function isValidProductsHref(
  href:
    string,
): boolean {
  return (
    href.length >
    0
  );
}


/* ==========================================================================
   5. EYEBROW
   ========================================================================== */

function CategoriesPromoEyebrow() {
  return (
    <div
      className={
        styles.categoriesPromoEyebrow
      }
    >
      <span
        className={
          styles.categoriesPromoEyebrowIcon
        }
        aria-hidden="true"
      >
        <Sparkles
          size={
            16
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
          focusable="false"
        />
      </span>


      <span>
        {
          PROMOTION_CONFIG.eyebrow
        }
      </span>
    </div>
  );
}


/* ==========================================================================
   6. TITRE
   ========================================================================== */

function CategoriesPromoTitle() {
  return (
    <h2
      id={
        PROMOTION_TITLE_ID
      }
      className={
        styles.categoriesPromoTitle
      }
    >
      {
        PROMOTION_CONFIG.title
      }
    </h2>
  );
}


/* ==========================================================================
   7. DESCRIPTION
   ========================================================================== */

function CategoriesPromoDescription() {
  return (
    <p
      id={
        PROMOTION_DESCRIPTION_ID
      }
      className={
        styles.categoriesPromoDescription
      }
    >
      {
        PROMOTION_CONFIG.description
      }
    </p>
  );
}


/* ==========================================================================
   8. CTA
   ========================================================================== */

interface CategoriesPromoActionProps {
  readonly href:
    string;
}


function CategoriesPromoAction({
  href,
}: CategoriesPromoActionProps) {
  return (
    <Link
      href={
        href
      }
      className={
        styles.categoriesPromoAction
      }
    >
      <span>
        {
          PROMOTION_CONFIG
            .action
            .label
        }
      </span>


      <ArrowRight
        size={
          17
        }
        strokeWidth={
          1.9
        }
        aria-hidden="true"
        focusable="false"
        className={
          styles.categoriesPromoActionIcon
        }
      />
    </Link>
  );
}


/* ==========================================================================
   9. DÉCORATION
   ========================================================================== */

/**
 * Éléments purement CSS.
 *
 * Aucun visuel supplémentaire n'est chargé.
 *
 * Ils permettent d'obtenir la composition rose de la maquette sans :
 *
 * - requête réseau ;
 * - image fictive ;
 * - asset supplémentaire ;
 * - duplication du Hero.
 */
function CategoriesPromoDecoration() {
  return (
    <div
      className={
        styles.categoriesPromoDecoration
      }
      aria-hidden="true"
    >
      <span
        className={
          styles.categoriesPromoDecorationCircleLarge
        }
      />

      <span
        className={
          styles.categoriesPromoDecorationCircleMedium
        }
      />

      <span
        className={
          styles.categoriesPromoDecorationCircleSmall
        }
      />

      <span
        className={
          styles.categoriesPromoDecorationSparkle
        }
      >
        <Sparkles
          size={
            26
          }
          strokeWidth={
            1.4
          }
          aria-hidden="true"
          focusable="false"
        />
      </span>
    </div>
  );
}


/* ==========================================================================
   10. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoriesPromo({
  productsHref,
}: PublicCategoriesPromoProps) {
  /* ------------------------------------------------------------------------
     ROUTE RÉELLE
     ------------------------------------------------------------------------ */

  const normalizedProductsHref =
    normalizeRequiredText(
      productsHref,
    );


  /**
   * Pas de "/produits" écrit ici comme fallback.
   *
   * Si le parent ne fournit pas une route exploitable, la bannière
   * n'est pas rendue afin d'éviter un lien cassé.
   */
  if (
    !isValidProductsHref(
      normalizedProductsHref,
    )
  ) {
    return null;
  }


  return (
    <section
      id={
        PROMOTION_CONFIG.sectionId
      }
      className={
        styles.categoriesPromoSection
      }
      aria-labelledby={
        PROMOTION_TITLE_ID
      }
      aria-describedby={
        PROMOTION_DESCRIPTION_ID
      }
    >
      <div
        className={
          styles.categoriesPromoInner
        }
      >
        <div
          className={
            styles.categoriesPromoBanner
          }
        >
          {/* ===============================================================
              DÉCORATION
              =============================================================== */}

          <CategoriesPromoDecoration />


          {/* ===============================================================
              CONTENU
              =============================================================== */}

          <div
            className={
              styles.categoriesPromoContent
            }
          >
            <CategoriesPromoEyebrow />

            <CategoriesPromoTitle />

            <CategoriesPromoDescription />

            <CategoriesPromoAction
              href={
                normalizedProductsHref
              }
            />
          </div>
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
 * STRUCTURE
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ ✦ Prenez soin de vous                                      │
 * │                                                              │
 * │ dans chaque catégorie                                       │
 * │                                                              │
 * │ Des produits pour révéler votre beauté naturelle.           │
 * │                                                              │
 * │ [ Découvrir nos produits  → ]                               │
 * │                                             décor CSS        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * ============================================================================
 *
 * SOURCE DES TEXTES
 *
 * src/config/public-categories.ts
 *
 * ============================================================================
 *
 * SOURCE DU LIEN
 *
 * productsHref
 *
 * reçu depuis le parent.
 *
 * Ce composant ne construit aucune route.
 *
 * ============================================================================
 *
 * RESPONSIVE
 *
 * La visibilité desktop/mobile et toute la mise en page seront gérées par :
 *
 * src/components/public/categories/public-categories.module.css
 *
 * Aucun JavaScript responsive.
 *
 * ============================================================================
 *
 * DONNÉES COMMERCIALES
 *
 * Cette section n'affiche :
 *
 * - aucun prix ;
 * - aucune réduction ;
 * - aucun pourcentage ;
 * - aucun faux avantage ;
 * - aucun code promo ;
 * - aucune quantité ;
 * - aucun faux stock.
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - logique PostgreSQL ;
 * - donnée de démonstration ;
 * - dépendance à une session ;
 * - logique React cliente ;
 * - image supplémentaire ;
 * - route inventée.
 *
 * ============================================================================
 */