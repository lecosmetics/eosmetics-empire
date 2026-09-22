import Image from "next/image";
import Link from "next/link";

import {
  ChevronRight,
} from "lucide-react";

import {
  PUBLIC_PRODUCTS_BREADCRUMB_CONFIG,
  PUBLIC_PRODUCTS_HERO_CONFIG,
} from "@/config/public-products";

import type {
  PublicProductsHeroProps,
} from "@/lib/public/products/public-products-types";

import styles from "./public-products.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HERO — CATALOGUE PUBLIC DES PRODUITS
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductsHero.tsx
 *
 * Route :
 *
 * /produits
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher la partie supérieure de la page publique des produits :
 *
 * - image Hero ;
 * - fil d'Ariane ;
 * - eyebrow ;
 * - titre ;
 * - description.
 *
 * ============================================================================
 *
 * IMAGE
 *
 * La source de l'image ne doit jamais être écrite manuellement ici.
 *
 * Elle provient de :
 *
 * src/config/public-products.ts
 *
 * PUBLIC_PRODUCTS_HERO_CONFIG.image.src
 *
 * Valeur actuellement configurée :
 *
 * /images/resulta.png
 *
 * Fichier physique :
 *
 * public/images/resulta.png
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant reste un Server Component.
 *
 * Il ne doit pas :
 *
 * - utiliser "use client" ;
 * - lire Prisma ;
 * - interroger PostgreSQL ;
 * - gérer les filtres ;
 * - gérer le Panier ;
 * - construire manuellement des routes ;
 * - contenir de données produits ;
 * - inventer du contenu commercial ;
 * - dupliquer le Header public ;
 * - dupliquer la navigation ;
 * - dupliquer le Footer.
 *
 * ============================================================================
 */


/* ==========================================================================
   HELPERS
   ========================================================================== */

/**
 * Assemble proprement les classes CSS sans dépendance externe.
 */
function joinClassNames(
  ...classNames:
    Array<
      string |
      undefined |
      null |
      false
    >
): string {
  return classNames
    .filter(
      (
        className,
      ): className is string =>
        typeof className ===
          "string" &&
        className.length >
          0,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   COMPOSANT
   ========================================================================== */

export default function PublicProductsHero({
  className,
}: PublicProductsHeroProps) {
  const hero =
    PUBLIC_PRODUCTS_HERO_CONFIG;

  const breadcrumb =
    PUBLIC_PRODUCTS_BREADCRUMB_CONFIG;


  return (
    <section
      id={
        hero.sectionId
      }
      className={
        joinClassNames(
          styles.productsHero,
          className,
        )
      }
      data-public-products-hero="true"
      aria-labelledby="public-products-hero-title"
    >
      {/* ====================================================================
          IMAGE DE FOND
          ==================================================================== */}

      <div
        className={
          styles.productsHeroMedia
        }
        aria-hidden="true"
      >
        <Image
          src={
            hero.image.src
          }
          alt=""
          fill
          priority={
            hero.image.priority
          }
          sizes="100vw"
          className={
            styles.productsHeroImage
          }
        />
      </div>


      {/* ====================================================================
          OVERLAY
          --------------------------------------------------------------------
          Cet élément permet au CSS de garantir la lisibilité du texte
          sans masquer l'image de fond.
          ==================================================================== */}

      <div
        className={
          styles.productsHeroOverlay
        }
        aria-hidden="true"
      />


      {/* ====================================================================
          CONTENU
          ==================================================================== */}

      <div
        className={
          styles.productsHeroInner
        }
      >
        {/* ==================================================================
            FIL D'ARIANE
            ================================================================== */}

        <nav
          className={
            styles.productsBreadcrumb
          }
          aria-label={
            breadcrumb.ariaLabel
          }
        >
          <ol
            className={
              styles.productsBreadcrumbList
            }
          >
            <li
              className={
                styles.productsBreadcrumbItem
              }
            >
              <Link
                href={
                  breadcrumb.home.href
                }
                className={
                  styles.productsBreadcrumbLink
                }
              >
                {
                  breadcrumb
                    .home
                    .label
                }
              </Link>
            </li>


            <li
              className={
                styles.productsBreadcrumbSeparator
              }
              aria-hidden="true"
            >
              <ChevronRight
                size={
                  15
                }
                strokeWidth={
                  1.8
                }
              />
            </li>


            <li
              className={
                styles.productsBreadcrumbItem
              }
            >
              <span
                className={
                  styles.productsBreadcrumbCurrent
                }
                aria-current="page"
              >
                {
                  breadcrumb
                    .current
                    .label
                }
              </span>
            </li>
          </ol>
        </nav>


        {/* ==================================================================
            TEXTE HERO
            ================================================================== */}

        <div
          className={
            styles.productsHeroContent
          }
        >
          {/* ================================================================
              EYEBROW
              ================================================================ */}

          {hero.eyebrow
            .trim()
            .length >
          0 ? (
            <p
              className={
                styles.productsHeroEyebrow
              }
            >
              {
                hero.eyebrow
              }
            </p>
          ) : null}


          {/* ================================================================
              TITRE
              ================================================================ */}

          <h1
            id="public-products-hero-title"
            className={
              styles.productsHeroTitle
            }
          >
            {hero.titleLines.map(
              (
                line,
              ) => (
                <span
                  key={
                    line.id
                  }
                  className={
                    styles.productsHeroTitleLine
                  }
                >
                  {
                    line.text
                  }
                </span>
              ),
            )}
          </h1>


          {/* ================================================================
              DESCRIPTION
              ================================================================ */}

          {hero.description
            .trim()
            .length >
          0 ? (
            <p
              className={
                styles.productsHeroDescription
              }
            >
              {
                hero.description
              }
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}