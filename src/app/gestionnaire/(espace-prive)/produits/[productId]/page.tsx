import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import ProductDetailActions from "@/components/gestionnaire/produits/detail/ProductDetailActions";
import ProductDetailGallery from "@/components/gestionnaire/produits/detail/ProductDetailGallery";
import ProductDetailHeader from "@/components/gestionnaire/produits/detail/ProductDetailHeader";
import ProductDetailOverview from "@/components/gestionnaire/produits/detail/ProductDetailOverview";
import ProductDetailPricing from "@/components/gestionnaire/produits/detail/ProductDetailPricing";
import ProductDetailQr from "@/components/gestionnaire/produits/detail/ProductDetailQr";

import {
  getProductDetailPageData,
  isValidProductDetailId,
} from "@/lib/gestionnaire/produits/detail/product-detail";

import styles from "./product-detail.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE â€” FICHE DÃ‰TAILLÃ‰E D'UN PRODUIT
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits/[productId]
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/[productId]/page.tsx
 *
 * RESPONSABILITÃ‰S :
 *
 * - lire productId depuis la route ;
 * - effectuer une validation rapide de productId ;
 * - demander la fiche au service serveur sÃ©curisÃ© ;
 * - transformer un produit absent/inaccessible en 404 ;
 * - assembler les composants de prÃ©sentation ;
 * - utiliser toute la largeur disponible du shell Gestionnaire ;
 * - ne jamais recevoir storeId depuis le navigateur ;
 * - ne jamais exÃ©cuter directement de requÃªte Prisma ;
 * - ne jamais recalculer les permissions dans la page.
 *
 * SÃ‰CURITÃ‰ :
 *
 * getProductDetailPageData(productId) :
 *
 * - vÃ©rifie la session Gestionnaire ;
 * - rÃ©cupÃ¨re storeId cÃ´tÃ© serveur ;
 * - charge uniquement StoreProduct(storeId + productId) ;
 * - protÃ¨ge les produits STORE entre boutiques ;
 * - calcule les permissions ;
 * - retourne null pour un produit inaccessible.
 *
 * Cette page ne doit donc jamais :
 *
 * - lire storeId dans params ;
 * - lire storeId dans searchParams ;
 * - accepter managerId depuis le navigateur ;
 * - appeler db.product directement ;
 * - appeler db.storeProduct directement.
 *
 * ============================================================================
 */


/* ==========================================================================
   NEXT.JS
   ========================================================================== */

/**
 * Page privÃ©e dÃ©pendant :
 *
 * - d'une session ;
 * - d'une boutique ;
 * - de donnÃ©es PostgreSQL pouvant Ã©voluer ;
 * - du prix ;
 * - du stock ;
 * - du statut ;
 * - du QR.
 *
 * Elle ne doit jamais Ãªtre gÃ©nÃ©rÃ©e comme une page statique partagÃ©e.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/**
 * Prisma et les services privÃ©s doivent rester dans le runtime Node.js.
 */

export const runtime =
  "nodejs";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "DÃ©tail du produit | L&E Cosmetics Empire",

    description:
      "Consultez les informations dÃ©taillÃ©es dâ€™un produit dans votre espace Gestionnaire L&E Cosmetics Empire.",

    robots: {
      index:
        false,

      follow:
        false,

      nocache:
        true,
    },
  };


/* ==========================================================================
   TYPES
   ========================================================================== */

interface ProductDetailPageProps {
  params:
    Promise<{
      productId:
        string;
    }>;
}


/* ==========================================================================
   NORMALISATION ROUTE
   ========================================================================== */

function normalizeRouteProductId(
  value:
    unknown,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  if (
    !isValidProductDetailId(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  /* =========================================================================
     1. PARAMÃˆTRE DE ROUTE
     ========================================================================= */

  const {
    productId:
      routeProductId,
  } =
    await params;


  /* =========================================================================
     2. VALIDATION RAPIDE
     ========================================================================= */

  const productId =
    normalizeRouteProductId(
      routeProductId,
    );


  if (
    !productId
  ) {
    notFound();
  }


  /* =========================================================================
     3. CHARGEMENT SÃ‰CURISÃ‰
     =========================================================================
     
     IMPORTANT :
     
     La page ne fournit volontairement que productId.
     
     Elle NE fournit PAS :
     
     - storeId ;
     - managerId ;
     - role ;
     - permission.
     
     Le service product-detail.ts rÃ©cupÃ¨re tout cela depuis l'accÃ¨s privÃ©
     Gestionnaire cÃ´tÃ© serveur.
     ========================================================================= */

  const pageData =
    await getProductDetailPageData(
      productId,
    );


  /* =========================================================================
     4. PRODUIT ABSENT / AUTRE BOUTIQUE
     =========================================================================
     
     Un produit :
     
     - inexistant ;
     - invalide ;
     - non associÃ© Ã  la boutique ;
     - appartenant Ã  une autre boutique ;
     
     produit volontairement le mÃªme comportement.
     
     Cela empÃªche l'Ã©numÃ©ration des produits des autres boutiques.
     ========================================================================= */

  if (
    !pageData
  ) {
    notFound();
  }


  /* =========================================================================
     5. DONNÃ‰ES NORMALISÃ‰ES
     ========================================================================= */

  const {
    product,
    permissions,
  } =
    pageData;


  /* =========================================================================
     6. PROTECTION DÃ‰FENSIVE
     =========================================================================
     
     Le service actuel retourne canView=true uniquement aprÃ¨s validation.
     
     Cette seconde vÃ©rification reste volontaire afin que la page reste sÃ»re
     si la politique d'autorisation Ã©volue ultÃ©rieurement.
     ========================================================================= */

  if (
    !permissions.canView
  ) {
    notFound();
  }


  /* =========================================================================
     7. RENDU
     =========================================================================
     
     LAYOUT :
     
     Header
     
     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
     â”‚ Galerie                       â”‚ QR                  â”‚
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     
     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
     â”‚ Informations                  â”‚ Prix / stock        â”‚
     â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
     â”‚ Actions du produit                                  â”‚
     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
     
     Le CSS gÃ¨re :
     
     - pleine largeur ;
     - desktop ;
     - tablette ;
     - mobile ;
     - impression.
     ========================================================================= */

  return (
    <div
      className={
        styles.page
      }
    >
      {/* ===================================================================
          HEADER PRODUIT
          =================================================================== */}

      <ProductDetailHeader
        product={
          product
        }
        permissions={
          permissions
        }
      />


      {/* ===================================================================
          PREMIÃˆRE GRILLE
          GALERIE + QR
          =================================================================== */}

      <div
        className={
          styles.primaryGrid
        }
      >
        {/* ===============================================================
            GALERIE
            =============================================================== */}

        <section
          className={
            styles.galleryArea
          }
          aria-label="Galerie du produit"
        >
          <ProductDetailGallery
            product={
              product
            }
          />
        </section>


        {/* ===============================================================
            QR
            =============================================================== */}

        <aside
          className={
            styles.qrArea
          }
          aria-label="QR code du produit"
        >
          <ProductDetailQr
            product={
              product
            }
            permissions={
              permissions
            }
          />
        </aside>
      </div>


      {/* ===================================================================
          DEUXIÃˆME GRILLE
          INFORMATIONS + PRIX + ACTIONS
          =================================================================== */}

      <div
        className={
          styles.secondaryGrid
        }
      >
        {/* ===============================================================
            INFORMATIONS
            =============================================================== */}

        <section
          className={
            styles.overviewArea
          }
          aria-label="Informations du produit"
        >
          <ProductDetailOverview
            product={
              product
            }
          />
        </section>


        {/* ===============================================================
            PRIX / STOCK
            =============================================================== */}

        <section
          className={
            styles.pricingArea
          }
          aria-label="Prix et disponibilitÃ© du produit"
        >
          <ProductDetailPricing
            product={
              product
            }
          />
        </section>


        {/* ===============================================================
            ACTIONS
            =============================================================== */}

        <section
          className={
            styles.actionsArea
          }
          aria-label="Actions de gestion du produit"
        >
          <ProductDetailActions
            product={
              product
            }
            permissions={
              permissions
            }
          />
        </section>
      </div>
    </div>
  );
}
