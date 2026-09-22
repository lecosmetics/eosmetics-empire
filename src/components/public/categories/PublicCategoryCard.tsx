import Image from "next/image";
import Link from "next/link";

import {
  ArrowUpRight,
} from "lucide-react";

import {
  PUBLIC_CATEGORIES_CATALOG_CONFIG,
} from "@/config/public-categories";

import type {
  PublicCategoryCardProps,
} from "@/lib/public/categories/public-categories-types";

import styles from "./public-categories.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CARTE CATÉGORIE PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/categories/PublicCategoryCard.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher UNE vraie catégorie publique provenant de ProductCategory.
 *
 * ============================================================================
 *
 * DONNÉES ATTENDUES
 *
 * ProductCategory fournit :
 *
 * - id ;
 * - name ;
 * - slug ;
 * - description ;
 * - image.
 *
 * La couche serveur fournit également :
 *
 * - availableProductCount ;
 * - href.
 *
 * ============================================================================
 *
 * ARCHITECTURE VISUELLE
 *
 * ┌───────────────────────────────┐
 * │                               │
 * │            IMAGE              │
 * │                               │
 * ├───────────────────────────────┤
 * │ Nom de catégorie              │
 * │ 12 produits                ↗  │
 * └───────────────────────────────┘
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - interroger PostgreSQL ;
 * - inventer une catégorie ;
 * - inventer une image ;
 * - inventer un nombre de produits ;
 * - créer un slug ;
 * - reconstruire la route catégorie ;
 * - lire une session ;
 * - devenir un Client Component ;
 * - utiliser useState ;
 * - utiliser useEffect ;
 * - contenir de données de démonstration.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const CATALOG_CONFIG =
  PUBLIC_CATEGORIES_CATALOG_CONFIG;


/* ==========================================================================
   2. NORMALISATION TEXTE
   ========================================================================== */

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
   3. VALIDATION COMPTEUR
   ========================================================================== */

/**
 * La requête serveur doit déjà garantir un entier >= 0.
 *
 * Ici on ne corrige pas silencieusement une donnée incohérente.
 * Une carte incorrecte n’est simplement pas rendue.
 */
function isValidProductCount(
  value:
    number,
): boolean {
  return (
    Number.isFinite(
      value,
    ) &&
    Number.isInteger(
      value,
    ) &&
    value >=
      0
  );
}


/* ==========================================================================
   4. FORMAT COMPTEUR
   ========================================================================== */

/**
 * Affichage :
 *
 * 0 produit
 * 1 produit
 * 2 produits
 * 15 produits
 *
 * Les libellés proviennent de la configuration officielle.
 */
function formatProductCount(
  count:
    number,
): string {
  if (
    count ===
    0
  ) {
    return CATALOG_CONFIG
      .productCountLabels
      .zero;
  }


  if (
    count ===
    1
  ) {
    return CATALOG_CONFIG
      .productCountLabels
      .singular;
  }


  return `${count} ${CATALOG_CONFIG.productCountLabels.pluralSuffix}`;
}


/* ==========================================================================
   5. VALIDATION CATÉGORIE
   ========================================================================== */

/**
 * Protection de rendu.
 *
 * Une carte publique doit impérativement posséder :
 *
 * - un id réel ;
 * - un nom réel ;
 * - un slug réel ;
 * - une image réelle ;
 * - un href réel ;
 * - un compteur cohérent.
 */
function isRenderableCategory(
  category:
    PublicCategoryCardProps[
      "category"
    ],
): boolean {
  const id =
    normalizeRequiredText(
      category.id,
    );


  const name =
    normalizeRequiredText(
      category.name,
    );


  const slug =
    normalizeRequiredText(
      category.slug,
    );


  const imageUrl =
    normalizeRequiredText(
      category.image.url,
    );


  const href =
    normalizeRequiredText(
      category.href,
    );


  return Boolean(
    id &&
    name &&
    slug &&
    imageUrl &&
    href &&
    isValidProductCount(
      category.availableProductCount,
    ),
  );
}


/* ==========================================================================
   6. ICÔNE D’ACTION
   ========================================================================== */

function CategoryCardArrow() {
  return (
    <span
      className={
        styles.categoryCardArrow
      }
      aria-hidden="true"
    >
      <ArrowUpRight
        size={
          18
        }
        strokeWidth={
          1.9
        }
        aria-hidden="true"
        focusable="false"
      />
    </span>
  );
}


/* ==========================================================================
   7. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCategoryCard({
  category,
  imagePriority = false,
}: PublicCategoryCardProps) {
  /* ------------------------------------------------------------------------
     PROTECTION
     ------------------------------------------------------------------------ */

  if (
    !isRenderableCategory(
      category,
    )
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     DONNÉES NORMALISÉES
     ------------------------------------------------------------------------ */

  const categoryName =
    normalizeRequiredText(
      category.name,
    );


  const categorySlug =
    normalizeRequiredText(
      category.slug,
    );


  const categoryHref =
    normalizeRequiredText(
      category.href,
    );


  const imageUrl =
    normalizeRequiredText(
      category.image.url,
    );


  const imageAlt =
    normalizeRequiredText(
      category.image.altText,
    ) ||
    categoryName;


  const productCountLabel =
    formatProductCount(
      category.availableProductCount,
    );


  /* ------------------------------------------------------------------------
     ACCESSIBILITÉ
     ------------------------------------------------------------------------ */

  const ariaLabel =
    `Voir la catégorie ${categoryName}, ${productCountLabel}`;


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <article
      className={
        styles.categoryCard
      }
      data-category-id={
        category.id
      }
      data-category-slug={
        categorySlug
      }
      data-product-count={
        category.availableProductCount
      }
    >
      <Link
        href={
          categoryHref
        }
        prefetch={
          false
        }
        className={
          styles.categoryCardLink
        }
        aria-label={
          ariaLabel
        }
      >
        {/* =================================================================
            IMAGE
            ================================================================= */}

        <div
          className={
            styles.categoryCardImageFrame
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
              (max-width: 767px) 48vw,
              (max-width: 1023px) 32vw,
              (max-width: 1279px) 20vw,
              19vw
            "
            quality={
              90
            }
            className={
              styles.categoryCardImage
            }
          />


          {/* ===============================================================
              OVERLAY VISUEL
              =============================================================== */}

          <div
            className={
              styles.categoryCardImageOverlay
            }
            aria-hidden="true"
          />
        </div>


        {/* =================================================================
            INFORMATIONS
            ================================================================= */}

        <div
          className={
            styles.categoryCardContent
          }
        >
          {/* ===============================================================
              NOM
              =============================================================== */}

          <h2
            className={
              styles.categoryCardName
            }
            title={
              categoryName
            }
          >
            {
              categoryName
            }
          </h2>


          {/* ===============================================================
              BAS DE CARTE
              =============================================================== */}

          <div
            className={
              styles.categoryCardFooter
            }
          >
            <span
              className={
                styles.categoryCardProductCount
              }
            >
              {
                productCountLabel
              }
            </span>


            <CategoryCardArrow />
          </div>
        </div>
      </Link>
    </article>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * UNE CARTE AFFICHE UNIQUEMENT :
 *
 * - vraie image ;
 * - vrai nom ;
 * - vrai compteur de produits ;
 * - flèche d’action.
 *
 * ============================================================================
 *
 * ROUTE
 *
 * Le composant utilise :
 *
 * category.href
 *
 * tel qu’il a été préparé côté serveur.
 *
 * Il ne fait PAS :
 *
 * "/categories/" + category.slug
 *
 * ============================================================================
 *
 * COMPTEUR
 *
 * Le composant utilise :
 *
 * category.availableProductCount
 *
 * déjà calculé dans :
 *
 * src/lib/public/categories/public-categories-query.ts
 *
 * ============================================================================
 *
 * EXEMPLES DE PRÉSENTATION
 *
 * 0 produit
 *
 * 1 produit
 *
 * 8 produits
 *
 * ============================================================================
 *
 * GRILLE
 *
 * Le composant ne décide pas du nombre de colonnes.
 *
 * Le parent décidera :
 *
 * Desktop :
 * 5 colonnes
 *
 * Tablette :
 * 3 colonnes
 *
 * Mobile :
 * 2 colonnes
 *
 * ============================================================================
 *
 * AUCUNE :
 *
 * - requête Prisma ;
 * - fausse catégorie ;
 * - fausse image ;
 * - fausse route ;
 * - fausse quantité ;
 * - logique panier ;
 * - logique client React.
 *
 * ============================================================================
 */