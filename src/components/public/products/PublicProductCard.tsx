import Image from "next/image";
import Link from "next/link";

import PublicAddToPanierButton from "@/components/public/panier/PublicAddToPanierButton";

import type {
  PublicProductCardProps,
} from "@/lib/public/products/public-product-types";

import styles from "./public-product-card.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CARTE PRODUIT PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/products/PublicProductCard.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher une offre commerciale StoreProduct réelle sous la forme compacte
 * officielle :
 *
 * ┌───────────────────────┐
 * │                       │
 * │         IMAGE         │
 * │                       │
 * │ Nom du produit        │
 * │ 25 000 FCFA           │
 * │                       │
 * │ [ Ajouter au panier ] │
 * └───────────────────────┘
 *
 * ============================================================================
 *
 * UTILISATION :
 *
 * - Accueil ;
 * - /produits ;
 * - catégories ;
 * - recherche ;
 * - nouveautés ;
 * - promotions ;
 * - autres listes publiques.
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
 * ============================================================================
 *
 * Une carte représente exactement UNE offre StoreProduct.
 *
 * ============================================================================
 *
 * PRODUCT FOURNIT :
 *
 * - productId ;
 * - name ;
 * - slug ;
 * - sku ;
 * - image.
 *
 * ============================================================================
 *
 * STOREPRODUCT FOURNIT :
 *
 * - storeProductId ;
 * - price ;
 * - compareAtPrice ;
 * - currency ;
 * - stockQuantity ;
 * - availability ;
 * - status ;
 * - href.
 *
 * ============================================================================
 *
 * PANIER :
 *
 * Le bouton est maintenant raccordé au vrai système :
 *
 * PublicAddToPanierButton
 *
 *        ↓
 *
 * PublicPanierProvider
 *
 *        ↓
 *
 * stockage local minimal :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * La carte ne transmet jamais au Panier comme source de vérité :
 *
 * - price ;
 * - compareAtPrice ;
 * - currency ;
 * - stockQuantity ;
 * - availability ;
 * - boutique ;
 * - total.
 *
 * Ces informations sont relues côté serveur lors de la validation Panier.
 *
 * ============================================================================
 *
 * Ce composant NE DOIT PAS :
 *
 * - interroger Prisma ;
 * - lire PostgreSQL ;
 * - lire une session ;
 * - inventer un produit ;
 * - inventer un prix ;
 * - inventer un stock ;
 * - inventer une réduction ;
 * - inventer une boutique ;
 * - créer un localStorage ;
 * - créer un deuxième Context Panier ;
 * - construire lui-même une route produit ;
 * - afficher SKU / boutique / localisation dans cette carte officielle ;
 * - afficher une notation fictive ;
 * - afficher des avis fictifs ;
 * - devenir inutilement un Client Component.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CLASS NAMES
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
   3. NORMALISATION STOCK
   ========================================================================== */

/**
 * La valeur provenant de la couche serveur est déjà censée être normalisée.
 *
 * Cette protection empêche néanmoins une valeur négative, décimale,
 * Infinity ou NaN d'être considérée comme un stock public utilisable.
 */
function isValidStockQuantity(
  value:
    number,
): boolean {
  return (
    Number.isFinite(
      value,
    ) &&
    Number.isSafeInteger(
      value,
    ) &&
    value >
      0
  );
}


/* ==========================================================================
   4. FORMAT NOMBRE
   ========================================================================== */

function formatNumericAmount(
  amount:
    number,
): string {
  return new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        Number.isInteger(
          amount,
        )
          ? 0
          : 2,

      maximumFractionDigits:
        2,
    },
  ).format(
    amount,
  );
}


/* ==========================================================================
   5. FORMAT PRIX
   ========================================================================== */

/**
 * Les montants arrivent déjà sérialisés depuis la couche serveur.
 *
 * Exemple :
 *
 * price = "25000.00"
 * currency = "XAF"
 *
 * rendu :
 *
 * 25 000 FCFA
 *
 * ============================================================================
 *
 * XAF / XOF :
 *
 * Le libellé commercial affiché est :
 *
 * FCFA
 *
 * ============================================================================
 *
 * Autres devises :
 *
 * Elles restent affichées avec leur code réel.
 *
 * Aucun taux de conversion n'est appliqué ici.
 *
 * ============================================================================
 */
function formatMoney(
  amount:
    string,

  currency:
    string,
): string {
  const normalizedAmount =
    normalizeRequiredText(
      amount,
    );


  const normalizedCurrency =
    normalizeRequiredText(
      currency,
    )
      .toUpperCase();


  if (
    !normalizedAmount
  ) {
    return "";
  }


  if (
    !normalizedCurrency
  ) {
    return normalizedAmount;
  }


  const numericAmount =
    Number(
      normalizedAmount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return [
      normalizedAmount,
      normalizedCurrency,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );
  }


  const formattedAmount =
    formatNumericAmount(
      numericAmount,
    );


  /**
   * XAF et XOF restent bien deux codes devise différents dans les données.
   *
   * Seul leur libellé visuel est présenté ici sous la forme :
   *
   * FCFA
   */
  if (
    normalizedCurrency ===
      "XAF" ||
    normalizedCurrency ===
      "XOF"
  ) {
    return `${formattedAmount} FCFA`;
  }


  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        currencyDisplay:
          "code",

        minimumFractionDigits:
          Number.isInteger(
            numericAmount,
          )
            ? 0
            : 2,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return `${formattedAmount} ${normalizedCurrency}`;
  }
}


/* ==========================================================================
   6. VALIDATION PRIX
   ========================================================================== */

function isValidPositivePrice(
  price:
    string,
): boolean {
  const normalizedPrice =
    normalizeRequiredText(
      price,
    );


  if (
    !normalizedPrice
  ) {
    return false;
  }


  const numericPrice =
    Number(
      normalizedPrice,
    );


  return (
    Number.isFinite(
      numericPrice,
    ) &&
    numericPrice >
      0
  );
}


/* ==========================================================================
   7. VALIDATION OFFRE PUBLIQUE
   ========================================================================== */

/**
 * Vérifie uniquement les informations nécessaires au rendu de cette carte.
 *
 * ============================================================================
 *
 * Cette fonction ne remplace PAS les protections serveur.
 *
 * La requête serveur reste responsable de décider quelles offres peuvent
 * être envoyées à ce composant.
 *
 * ============================================================================
 *
 * La carte officielle n'affichant pas :
 *
 * - SKU ;
 * - boutique ;
 * - ville ;
 * - pays ;
 *
 * leur absence visuelle ne doit pas être utilisée ici pour bloquer le rendu
 * d'une offre déjà validée par sa couche serveur.
 *
 * ============================================================================
 */
function isRenderableProduct(
  product:
    PublicProductCardProps["product"],
): boolean {
  const id =
    normalizeRequiredText(
      product.id,
    );


  const productId =
    normalizeRequiredText(
      product.productId,
    );


  const storeProductId =
    normalizeRequiredText(
      product.storeProductId,
    );


  const name =
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
    id &&
    productId &&
    storeProductId &&
    name &&
    imageUrl &&
    price &&
    currency &&
    href &&
    isValidPositivePrice(
      price,
    ) &&
    isValidStockQuantity(
      product.stockQuantity,
    ) &&
    product.status ===
      "ACTIVE" &&
    product.availability !==
      "OUT_OF_STOCK",
  );
}


/* ==========================================================================
   8. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicProductCard({
  product,
  imagePriority = false,
  className,
}: PublicProductCardProps) {
  /* ------------------------------------------------------------------------
     PROTECTION
     ------------------------------------------------------------------------ */

  if (
    !isRenderableProduct(
      product,
    )
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     IDENTIFIANTS NORMALISÉS
     ------------------------------------------------------------------------ */

  const productId =
    normalizeRequiredText(
      product.productId,
    );


  const storeProductId =
    normalizeRequiredText(
      product.storeProductId,
    );


  /* ------------------------------------------------------------------------
     PRODUIT
     ------------------------------------------------------------------------ */

  const productName =
    normalizeRequiredText(
      product.name,
    );


  /* ------------------------------------------------------------------------
     IMAGE
     ------------------------------------------------------------------------ */

  const imageUrl =
    normalizeRequiredText(
      product.image.url,
    );


  const imageAlt =
    normalizeRequiredText(
      product.image.altText,
    ) ||
    productName;


  /* ------------------------------------------------------------------------
     ROUTE PUBLIQUE
     ------------------------------------------------------------------------ */

  const productHref =
    normalizeRequiredText(
      product.href,
    );


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  const formattedPrice =
    formatMoney(
      product.price,
      product.currency,
    );


  /* ------------------------------------------------------------------------
     ACCESSIBILITÉ
     ------------------------------------------------------------------------ */

  const productLinkAriaLabel =
    formattedPrice
      ? `Voir ${productName}, ${formattedPrice}`
      : `Voir ${productName}`;


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <article
      className={
        joinClassNames(
          styles.productCard,
          className,
        )
      }
      data-product-id={
        productId
      }
      data-store-product-id={
        storeProductId
      }
      data-product-status={
        product.status
      }
      data-product-availability={
        product.availability
      }
    >
      {/* =================================================================
          IMAGE
          ================================================================= */}

      <Link
        href={
          productHref
        }
        prefetch={
          false
        }
        className={
          styles.productVisualLink
        }
        aria-label={
          productLinkAriaLabel
        }
      >
        <div
          className={
            styles.productVisual
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
              (max-width: 479px) 46vw,
              (max-width: 767px) 45vw,
              (max-width: 1023px) 30vw,
              (max-width: 1279px) 19vw,
              18vw
            "
            quality={
              92
            }
            className={
              styles.productImage
            }
          />
        </div>
      </Link>


      {/* =================================================================
          CONTENU
          ================================================================= */}

      <div
        className={
          styles.productContent
        }
      >
        {/* ===============================================================
            NOM
            =============================================================== */}

        <Link
          href={
            productHref
          }
          prefetch={
            false
          }
          className={
            styles.productNameLink
          }
          aria-label={
            productLinkAriaLabel
          }
        >
          <h3
            className={
              styles.productName
            }
            title={
              productName
            }
          >
            {
              productName
            }
          </h3>
        </Link>


        {/* ===============================================================
            PRIX
            =============================================================== */}

        <div
          className={
            styles.productPricing
          }
        >
          <span
            className={
              styles.productPrice
            }
          >
            {
              formattedPrice
            }
          </span>
        </div>


        {/* ===============================================================
            AJOUT AU PANIER
            ===============================================================
            
            IMPORTANT :
            
            Ce bouton est maintenant le vrai bouton Panier du projet.
            
            La carte transmet UNIQUEMENT :
            
            - StoreProduct.id ;
            - quantité 1.
            
            Elle ne transmet jamais :
            
            - prix ;
            - devise ;
            - stock ;
            - boutique ;
            - total.
            
            Le système Panier revalidera les données commerciales côté
            serveur lorsqu'il devra les afficher ou créer une commande.
            
            =============================================================== */}

        <PublicAddToPanierButton
          storeProductId={
            storeProductId
          }
          quantity={
            1
          }
          label="Ajouter au panier"
          className={
            styles.productAddToCartButton
          }
        />
      </div>
    </article>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * RENDU OFFICIEL
 *
 * ┌────────────────────────┐
 * │                        │
 * │         IMAGE          │
 * │                        │
 * │ Nom produit            │
 * │ 25 000 FCFA            │
 * │                        │
 * │ [ Ajouter au panier ]  │
 * └────────────────────────┘
 *
 * ============================================================================
 *
 * CLIC IMAGE / NOM :
 *
 *        ↓
 *
 * product.href
 *
 *        ↓
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * CLIC AJOUTER AU PANIER :
 *
 *        ↓
 *
 * PublicAddToPanierButton
 *
 *        ↓
 *
 * actions.addItem({
 *   storeProductId,
 *   quantity: 1
 * })
 *
 *        ↓
 *
 * PublicPanierProvider
 *
 * ============================================================================
 *
 * DONNÉES STOCKÉES CÔTÉ NAVIGATEUR :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * ============================================================================
 *
 * DONNÉES NON UTILISÉES COMME VÉRITÉ CLIENT :
 *
 * - prix ;
 * - compareAtPrice ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - boutique ;
 * - total.
 *
 * ============================================================================
 *
 * ÉLÉMENTS VOLONTAIREMENT ABSENTS DU RENDU OFFICIEL :
 *
 * - SKU ;
 * - référence ;
 * - nom boutique ;
 * - ville ;
 * - pays ;
 * - badge Disponible ;
 * - badge Stock limité ;
 * - faux badge Promotion ;
 * - notation ;
 * - avis ;
 * - bouton "Voir le produit".
 *
 * ============================================================================
 *
 * PublicProductCard reste un Server Component.
 *
 * Seul PublicAddToPanierButton constitue une frontière Client.
 *
 * ============================================================================
 */