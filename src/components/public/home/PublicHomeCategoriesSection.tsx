import Image from "next/image";

import {
  ArrowRight,
} from "lucide-react";

import {
  PUBLIC_HOME_CATEGORIES_CONFIG,
  PUBLIC_HOME_CATEGORY_SLOTS,
} from "@/config/public-home";

import type {
  PublicHomeCategoriesSectionProps,
  PublicHomeCategory,
  PublicHomeCategorySlotId,
} from "@/lib/public/home/public-home-types";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — CATÉGORIES OFFICIELLES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomeCategoriesSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la section :
 *
 * "Nos Catégories"
 *
 * exactement selon l’architecture officielle de la Home.
 *
 * ============================================================================
 *
 * DESKTOP
 *
 * Nos Catégories                         Voir toutes les catégories →
 *
 * ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
 * │  image   │ │  image   │ │  image   │ │  image   │ │  image   │ │  image   │
 * ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤
 * │Soins du  │ │Soins du  │ │Soins     │ │Gommes &  │ │Huiles &  │ │Savons &  │
 * │visage    │ │corps     │ │capillaires││gélules   │ │sérums    │ │exfoliants│
 * └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
 *
 * ============================================================================
 *
 * MOBILE
 *
 * Nos Catégories                                  Voir tout →
 *
 * ┌──────────┐ ┌──────────┐ ┌──────────┐
 * │  image   │ │  image   │ │  image   │
 * │ Visage   │ │ Corps    │ │ Cheveux  │
 * └──────────┘ └──────────┘ └──────────┘
 *
 * ┌──────────┐ ┌──────────┐ ┌──────────┐
 * │  image   │ │  image   │ │  image   │
 * │ Gommes   │ │ Huiles   │ │ Savons   │
 * └──────────┘ └──────────┘ └──────────┘
 *
 * ============================================================================
 *
 * SOURCES
 *
 * Configuration :
 *
 * src/config/public-home.ts
 *
 * Données réelles :
 *
 * src/lib/public/home/public-home-query.ts
 *
 * Types :
 *
 * src/lib/public/home/public-home-types.ts
 *
 * Styles :
 *
 * src/components/public/home/public-home.module.css
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - Server Component ;
 * - aucun "use client" ;
 * - aucun useState ;
 * - aucun useEffect ;
 * - aucun tableau de catégories fictives ;
 * - aucune image fictive ;
 * - aucune route inventée ;
 * - aucun carrousel mobile ;
 * - aucune duplication des catégories ;
 * - aucune carte ajoutée pour remplir artificiellement la grille ;
 * - maximum six catégories ;
 * - ordre visuel conforme à l’architecture officielle.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. IDENTIFIANT ACCESSIBILITÉ
   ========================================================================== */

const CATEGORIES_TITLE_ID =
  `${PUBLIC_HOME_CATEGORIES_CONFIG.sectionId}-title`;


/* ==========================================================================
   2. NORMALISATION TEXTE
   ========================================================================== */

function normalizeText(
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
   3. VALIDATION D’UNE CATÉGORIE AFFICHABLE
   ========================================================================== */

/**
 * Les types garantissent déjà normalement ces informations.
 *
 * Cette vérification runtime protège néanmoins le rendu public contre :
 *
 * - une chaîne vide ;
 * - une image vide ;
 * - une catégorie partiellement corrompue ;
 * - une donnée inattendue provenant de la base.
 *
 * Aucun fallback de démonstration n’est créé.
 */
function isRenderableCategory(
  category:
    PublicHomeCategory,
): boolean {
  return Boolean(
    normalizeText(
      category.id,
    ) &&
    normalizeText(
      category.slotId,
    ) &&
    normalizeText(
      category.name,
    ) &&
    normalizeText(
      category.slug,
    ) &&
    normalizeText(
      category.desktopLabel,
    ) &&
    normalizeText(
      category.mobileLabel,
    ) &&
    normalizeText(
      category.image.url,
    ) &&
    normalizeText(
      category.image.altText,
    ),
  );
}


/* ==========================================================================
   4. INDEX DE POSITION DES SLOTS
   ========================================================================== */

/**
 * L’ordre réel d’arrivée depuis Prisma ne doit jamais modifier
 * l’ordre visuel défini par l’architecture.
 *
 * Ordre officiel :
 *
 * 1. face
 * 2. body
 * 3. hair
 * 4. gummies
 * 5. oils
 * 6. soaps
 */
const CATEGORY_SLOT_ORDER =
  new Map<
    PublicHomeCategorySlotId,
    number
  >(
    PUBLIC_HOME_CATEGORY_SLOTS.map(
      (
        slot,
        index,
      ) => [
        slot.id,
        index,
      ],
    ),
  );


/* ==========================================================================
   5. TRI OFFICIEL DES CATÉGORIES
   ========================================================================== */

function sortCategoriesByOfficialOrder(
  categories:
    readonly PublicHomeCategory[],
): PublicHomeCategory[] {
  return [
    ...categories,
  ].sort(
    (
      categoryA,
      categoryB,
    ) => {
      const positionA =
        CATEGORY_SLOT_ORDER.get(
          categoryA.slotId,
        ) ??
        Number.MAX_SAFE_INTEGER;

      const positionB =
        CATEGORY_SLOT_ORDER.get(
          categoryB.slotId,
        ) ??
        Number.MAX_SAFE_INTEGER;

      return (
        positionA -
        positionB
      );
    },
  );
}


/* ==========================================================================
   6. PRÉPARATION DES CATÉGORIES AFFICHÉES
   ========================================================================== */

function getVisibleCategories(
  categories:
    readonly PublicHomeCategory[],
): PublicHomeCategory[] {
  /**
   * On filtre uniquement les catégories réellement utilisables.
   */
  const renderableCategories =
    categories.filter(
      isRenderableCategory,
    );


  /**
   * On protège également contre une éventuelle répétition accidentelle
   * d’un même slot.
   *
   * Une catégorie n’est jamais dupliquée artificiellement.
   */
  const seenSlotIds =
    new Set<
      PublicHomeCategorySlotId
    >();


  const uniqueCategories:
    PublicHomeCategory[] =
      [];


  for (
    const category
    of sortCategoriesByOfficialOrder(
      renderableCategories,
    )
  ) {
    if (
      seenSlotIds.has(
        category.slotId,
      )
    ) {
      continue;
    }


    seenSlotIds.add(
      category.slotId,
    );


    uniqueCategories.push(
      category,
    );


    if (
      uniqueCategories.length >=
      PUBLIC_HOME_CATEGORIES_CONFIG
        .limit
    ) {
      break;
    }
  }


  return uniqueCategories;
}


/* ==========================================================================
   7. CARTE CATÉGORIE
   ========================================================================== */

interface PublicHomeCategoryCardProps {
  readonly category:
    PublicHomeCategory;

  readonly imagePriority:
    boolean;
}


function PublicHomeCategoryCard({
  category,
  imagePriority,
}: PublicHomeCategoryCardProps) {
  const imageUrl =
    normalizeText(
      category.image.url,
    );


  const imageAlt =
    normalizeText(
      category.image.altText,
    ) ||
    normalizeText(
      category.name,
    );


  const desktopLabel =
    normalizeText(
      category.desktopLabel,
    );


  const mobileLabel =
    normalizeText(
      category.mobileLabel,
    );


  return (
    <article
      className={
        styles.categoryCard
      }
      data-category-id={
        category.id
      }
      data-category-slot={
        category.slotId
      }
    >
      {/* =================================================================
          IMAGE RÉELLE DE LA CATÉGORIE
          ================================================================= */}

      <div
        className={
          styles.categoryImageFrame
        }
      >
        <Image
          src={
            imageUrl
          }
          alt={
            imageAlt
          }
          fill
          priority={
            imagePriority
          }
          sizes="
            (max-width: 767px) 31vw,
            (max-width: 1023px) 16vw,
            15vw
          "
          className={
            styles.categoryImage
          }
        />
      </div>


      {/* =================================================================
          LIBELLÉ
          =================================================================
          Desktop et mobile utilisent des textes volontairement différents,
          conformément à l’architecture officielle.
          ================================================================= */}

      <div
        className={
          styles.categoryLabel
        }
      >
        <span
          className={
            styles.categoryDesktopLabel
          }
        >
          {
            desktopLabel
          }
        </span>

        <span
          className={
            styles.categoryMobileLabel
          }
        >
          {
            mobileLabel
          }
        </span>
      </div>
    </article>
  );
}


/* ==========================================================================
   8. LIEN VISUEL "VOIR TOUTES LES CATÉGORIES"
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * La route publique de catalogue catégorie n’est pas encore confirmée
 * dans src/config/routes.ts.
 *
 * Nous reproduisons donc ici exactement l’élément visuel de l’architecture,
 * mais nous ne créons PAS de faux href.
 *
 * Dès qu’une route réelle sera confirmée, ce bloc pourra devenir un Link
 * sans modifier la structure de la section.
 */
function PublicHomeCategoriesViewAll() {
  const viewAll =
    PUBLIC_HOME_CATEGORIES_CONFIG
      .viewAll;


  return (
    <span
      className={
        styles.sectionViewAll
      }
      aria-hidden="true"
    >
      <span
        className={
          styles.categoryDesktopLabel
        }
      >
        {
          viewAll.desktopLabel
        }
      </span>

      <span
        className={
          styles.categoryMobileLabel
        }
      >
        {
          viewAll.mobileLabel
        }
      </span>

      <ArrowRight
        size={
          15
        }
        strokeWidth={
          2
        }
        aria-hidden="true"
      />
    </span>
  );
}


/* ==========================================================================
   9. SECTION PRINCIPALE
   ========================================================================== */

export default function PublicHomeCategoriesSection({
  categories,
}: PublicHomeCategoriesSectionProps) {
  const config =
    PUBLIC_HOME_CATEGORIES_CONFIG;


  const visibleCategories =
    getVisibleCategories(
      categories,
    );


  /**
   * Aucun contenu de démonstration.
   *
   * Si aucune vraie catégorie exploitable n’est disponible, la section
   * entière n’est pas affichée.
   */
  if (
    visibleCategories.length ===
    0
  ) {
    return null;
  }


  return (
    <section
      id={
        config.sectionId
      }
      className={
        styles.categoriesSection
      }
      aria-labelledby={
        CATEGORIES_TITLE_ID
      }
    >
      <div
        className={
          styles.categoriesInner
        }
      >
        {/* ===============================================================
            EN-TÊTE
            =============================================================== */}

        <header
          className={
            styles.sectionHeader
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h2
              id={
                CATEGORIES_TITLE_ID
              }
              className={
                styles.sectionTitle
              }
            >
              {
                config.title
              }
            </h2>
          </div>


          {/* =============================================================
              VOIR TOUTES LES CATÉGORIES
              ============================================================= */}

          <PublicHomeCategoriesViewAll />
        </header>


        {/* ===============================================================
            GRILLE OFFICIELLE
            ===============================================================
            Desktop :
            6 colonnes × 1 ligne

            Mobile :
            3 colonnes × 2 lignes

            Le comportement responsive est entièrement piloté par CSS.
            =============================================================== */}

        <ul
          className={
            styles.categoriesGrid
          }
          aria-label={
            config.title
          }
        >
          {visibleCategories.map(
            (
              category,
              index,
            ) => (
              <li
                key={
                  category.id
                }
                className={
                  styles.categoryGridItem
                }
              >
                <PublicHomeCategoryCard
                  category={
                    category
                  }
                  /**
                   * Les trois premières images sont proches du haut
                   * de la Home, particulièrement sur mobile.
                   *
                   * On ne met pas les six images en priority afin de ne pas
                   * concurrencer couverture.png.
                   */
                  imagePriority={
                    index <
                    3
                  }
                />
              </li>
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
 * GARANTIES
 *
 * - 6 catégories maximum ;
 * - vraies catégories ProductCategory ;
 * - vraies images ;
 * - ordre officiel conservé ;
 * - aucune duplication ;
 * - aucune donnée de démonstration ;
 * - aucun placeholder artificiel ;
 * - grille desktop 6 × 1 ;
 * - grille mobile 3 × 2 ;
 * - aucun carousel ;
 * - aucun JavaScript client ;
 * - aucune route inventée.
 *
 * ============================================================================
 */