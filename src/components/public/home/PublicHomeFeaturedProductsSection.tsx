import {
  ArrowRight,
} from "lucide-react";

import PublicProductCard from "@/components/public/products/PublicProductCard";

import {
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG,
} from "@/config/public-home";

import type {
  PublicHomeFeaturedProduct,
  PublicHomeFeaturedProductsSectionProps,
} from "@/lib/public/home/public-home-types";

import styles from "./public-home.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * HOME PUBLIQUE — PRODUITS PHARES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/home/PublicHomeFeaturedProductsSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher directement toutes les offres produits publiques valides reçues
 * depuis :
 *
 * src/lib/public/home/public-home-query.ts
 *
 * ============================================================================
 *
 * ARCHITECTURE COMMERCIALE
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * Une carte représente UNE offre StoreProduct.
 *
 * Deux StoreProduct différents liés au même Product restent donc
 * deux offres commerciales distinctes.
 *
 * ============================================================================
 *
 * ARCHITECTURE DESKTOP
 *
 * Nos Produits Phares                        Voir tous les produits →
 *
 * [ Produit ][ Produit ][ Produit ][ Produit ][ Produit ]
 * [ Produit ][ Produit ][ Produit ][ Produit ][ Produit ]
 * [ Produit ][ Produit ][ Produit ]...
 *
 * ============================================================================
 *
 * ARCHITECTURE MOBILE
 *
 * Nos Produits Phares                                  Voir tout →
 *
 * [ Produit ][ Produit ]
 * [ Produit ][ Produit ]
 * [ Produit ][ Produit ]
 * [ Produit ][ Produit ]
 * [...]
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * - Server Component ;
 * - aucun "use client" ;
 * - aucun useState ;
 * - aucun useMemo ;
 * - aucun useCallback ;
 * - aucun filtre catégorie ;
 * - aucun `slice(0, 5)` ;
 * - aucun maximum de cinq produits ;
 * - aucun carousel horizontal ;
 * - aucune requête Prisma ici ;
 * - aucune requête réseau ;
 * - aucune donnée fictive ;
 * - aucune duplication par Product.id ;
 * - aucune logique panier parallèle ;
 * - responsive entièrement piloté par CSS.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONFIGURATION
   ========================================================================== */

const CONFIG =
  PUBLIC_HOME_FEATURED_PRODUCTS_CONFIG;


/* ==========================================================================
   2. IDENTIFIANT ACCESSIBILITÉ
   ========================================================================== */

const FEATURED_PRODUCTS_TITLE_ID =
  `${CONFIG.sectionId}-title`;


/* ==========================================================================
   3. NORMALISATION TEXTE
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
   4. VALIDATION D’UNE OFFRE
   ========================================================================== */

/**
 * La requête serveur effectue déjà les contrôles principaux.
 *
 * Cette validation constitue uniquement une dernière protection de rendu.
 *
 * Aucun fallback commercial n’est créé lorsqu’une offre est incohérente.
 */
function isRenderableProduct(
  product:
    PublicHomeFeaturedProduct,
): boolean {
  const storeProductId =
    normalizeRequiredText(
      product.storeProductId,
    );


  const productId =
    normalizeRequiredText(
      product.productId,
    );


  const productName =
    normalizeRequiredText(
      product.name,
    );


  const imageUrl =
    normalizeRequiredText(
      product.image.url,
    );


  const price =
    normalizeRequiredText(
      product.price,
    );


  const currency =
    normalizeRequiredText(
      product.currency,
    );


  const href =
    normalizeRequiredText(
      product.href,
    );


  return Boolean(
    storeProductId &&
    productId &&
    productName &&
    imageUrl &&
    price &&
    currency &&
    href &&
    product.stockQuantity >
      0 &&
    product.status ===
      "ACTIVE" &&
    product.availability !==
      "OUT_OF_STOCK",
  );
}


/* ==========================================================================
   5. DÉDUPLICATION DES OFFRES
   ========================================================================== */

/**
 * Déduplication de sécurité uniquement par StoreProduct.id.
 *
 * IMPORTANT :
 *
 * On ne déduplique jamais par :
 *
 * - Product.id ;
 * - SKU ;
 * - slug ;
 * - nom ;
 * - catégorie.
 *
 * Si le même Product est commercialisé dans deux Store différents,
 * les deux StoreProduct restent présents.
 */
function getUniqueRenderableProducts(
  products:
    readonly PublicHomeFeaturedProduct[],
): PublicHomeFeaturedProduct[] {
  const seenStoreProductIds =
    new Set<string>();


  const result:
    PublicHomeFeaturedProduct[] =
      [];


  for (
    const product
    of products
  ) {
    if (
      !isRenderableProduct(
        product,
      )
    ) {
      continue;
    }


    const storeProductId =
      normalizeRequiredText(
        product.storeProductId,
      );


    if (
      seenStoreProductIds.has(
        storeProductId,
      )
    ) {
      continue;
    }


    seenStoreProductIds.add(
      storeProductId,
    );


    result.push(
      product,
    );
  }


  return result;
}


/* ==========================================================================
   6. "VOIR TOUS LES PRODUITS"
   ========================================================================== */

/**
 * La route catalogue réelle reste centralisée dans :
 *
 * src/config/routes.ts
 *
 * Tant que son builder exact n’est pas confirmé dans ce composant,
 * aucun href n’est inventé.
 *
 * Le bloc conserve uniquement la présentation de l’architecture.
 */
function PublicHomeFeaturedProductsViewAll() {
  return (
    <span
      className={
        styles.sectionViewAll
      }
      aria-hidden="true"
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
          CONFIG.viewAll
            .desktopLabel
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
          CONFIG.viewAll
            .mobileLabel
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
        focusable="false"
      />
    </span>
  );
}


/* ==========================================================================
   7. LISTE DES PRODUITS
   ========================================================================== */

interface PublicHomeFeaturedProductsListProps {
  readonly products:
    readonly PublicHomeFeaturedProduct[];
}


function PublicHomeFeaturedProductsList({
  products,
}: PublicHomeFeaturedProductsListProps) {
  return (
    <div
      className={
        styles.featuredProductsViewport
      }
    >
      <ul
        className={
          styles.featuredProductsGrid
        }
        aria-label={
          CONFIG.title
        }
      >
        {products.map(
          (
            product,
            index,
          ) => (
            <li
              key={
                product.storeProductId
              }
              className={
                styles.featuredProductItem
              }
              data-store-product-id={
                product.storeProductId
              }
              data-product-id={
                product.productId
              }
            >
              <PublicProductCard
                product={
                  product
                }
                imagePriority={
                  index <
                  2
                }
              />
            </li>
          ),
        )}
      </ul>
    </div>
  );
}


/* ==========================================================================
   8. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicHomeFeaturedProductsSection({
  products,
}: PublicHomeFeaturedProductsSectionProps) {
  /**
   * ========================================================================
   * PRODUITS PUBLICS VALIDES
   * ========================================================================
   *
   * Aucun filtre.
   *
   * Aucune limitation.
   *
   * Aucune dépendance à PublicHomeCategory.
   */
  const availableProducts =
    getUniqueRenderableProducts(
      products,
    );


  /**
   * ========================================================================
   * AUCUNE OFFRE
   * ========================================================================
   *
   * Nous ne créons jamais de cartes factices pour remplir la grille.
   */
  if (
    availableProducts.length ===
    0
  ) {
    return null;
  }


  return (
    <section
      id={
        CONFIG.sectionId
      }
      className={
        styles.featuredProductsSection
      }
      aria-labelledby={
        FEATURED_PRODUCTS_TITLE_ID
      }
    >
      <div
        className={
          styles.featuredProductsInner
        }
      >
        {/* ===============================================================
            EN-TÊTE
            =============================================================== */}

        <header
          className={
            styles.featuredProductsHeader
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h2
              id={
                FEATURED_PRODUCTS_TITLE_ID
              }
              className={
                styles.sectionTitle
              }
            >
              {
                CONFIG.title
              }
            </h2>
          </div>


          <PublicHomeFeaturedProductsViewAll />
        </header>


        {/* ===============================================================
            PRODUITS
            ===============================================================

            IMPORTANT :

            AUCUN filtre ici.

            AUCUN :
            
            slice(0, 5)

            AUCUN :
            
            take: 5

            La totalité de `availableProducts` est transmise à la grille.

            Le CSS décidera uniquement du nombre de COLONNES :

            Desktop :
            5 colonnes

            Mobile :
            2 colonnes
            =============================================================== */}

        <PublicHomeFeaturedProductsList
          products={
            availableProducts
          }
        />
      </div>
    </section>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES DONNÉES
 *
 * - uniquement vraies offres StoreProduct ;
 * - aucune donnée de démonstration ;
 * - aucun produit créé côté client ;
 * - aucun prix inventé ;
 * - aucun stock inventé ;
 * - aucune image inventée ;
 * - aucune catégorie obligatoire ;
 * - aucune limite arbitraire à cinq offres.
 *
 * ============================================================================
 *
 * FILTRES
 *
 * SUPPRIMÉS DU RENDU.
 *
 * La section affiche directement les produits.
 *
 * `PublicHomeProductFilters.tsx` reste temporairement présent dans le projet
 * uniquement pour éviter une suppression brutale avant sa propre mise à jour.
 *
 * ============================================================================
 *
 * DESKTOP
 *
 * Cible CSS :
 *
 * grid-template-columns:
 *   repeat(5, minmax(0, 1fr));
 *
 * Exemple :
 *
 * [1][2][3][4][5]
 * [6][7][8][9][10]
 * [11][12][13]...
 *
 * ============================================================================
 *
 * MOBILE
 *
 * Cible CSS :
 *
 * grid-template-columns:
 *   repeat(2, minmax(0, 1fr));
 *
 * Exemple :
 *
 * [1][2]
 * [3][4]
 * [5][6]
 * [7][8]
 *
 * Aucun scroll horizontal.
 * Aucune carte partiellement visible.
 *
 * ============================================================================
 *
 * CARTE PRODUIT
 *
 * La prochaine correction de :
 *
 * src/components/public/products/PublicProductCard.tsx
 *
 * devra donner :
 *
 * IMAGE
 * NOM
 * PRIX
 * [ AJOUTER AU PANIER ]
 *
 * sans :
 *
 * - SKU visible ;
 * - boutique visible ;
 * - grosse localisation ;
 * - bouton "Découvrir".
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * Une offre StoreProduct = une carte.
 *
 * ============================================================================
 */