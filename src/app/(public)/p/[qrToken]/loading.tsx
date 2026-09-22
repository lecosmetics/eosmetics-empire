import type {
  CSSProperties,
} from "react";

import {
  LoaderCircle,
} from "lucide-react";

import styles from "@/components/public/products/public-product-detail.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * LOADING — FICHE PRODUIT PUBLIQUE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/p/[qrToken]/loading.tsx
 *
 * Route :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que Next.js prépare
 * la vraie fiche commerciale correspondant au qrToken.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - reste un Server Component ;
 * - ne lit pas Prisma ;
 * - ne lit pas PostgreSQL ;
 * - ne lit pas localStorage ;
 * - ne lit pas le Panier ;
 * - n'invente aucun produit ;
 * - n'invente aucun prix ;
 * - n'invente aucun stock ;
 * - n'invente aucune promotion ;
 * - n'invente aucune boutique ;
 * - n'invente aucune image ;
 * - ne crée aucune commande ;
 * - ne réserve aucun stock ;
 * - ne recrée pas le Header ;
 * - ne recrée pas le Footer ;
 * - ne recrée pas la navigation mobile.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. STYLES TECHNIQUES DU SKELETON
   --------------------------------------------------------------------------
   Ils sont volontairement locaux au loading.
   Aucune nouvelle classe CSS n'est imposée au module principal.
   ========================================================================== */

const SKELETON_BASE_STYLE:
  CSSProperties = {
    display:
      "block",

    width:
      "100%",

    borderRadius:
      "12px",

    background:
      "linear-gradient(90deg, #f4eef1 0%, #faf7f8 50%, #f4eef1 100%)",
};


const SKELETON_BREADCRUMB_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "74px",

    height:
      "10px",

    borderRadius:
      "999px",
  };


const SKELETON_MAIN_IMAGE_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    position:
      "absolute",

    inset:
      0,

    width:
      "100%",

    height:
      "100%",

    borderRadius:
      "inherit",
  };


const SKELETON_THUMBNAIL_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "66px",

    height:
      "66px",

    flex:
      "0 0 66px",

    borderRadius:
      "10px",
  };


const SKELETON_EYEBROW_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "112px",

    height:
      "10px",

    borderRadius:
      "999px",
  };


const SKELETON_TITLE_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "82%",

    height:
      "42px",

    marginTop:
      "18px",
  };


const SKELETON_META_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "48%",

    height:
      "12px",

    marginTop:
      "14px",

    borderRadius:
      "999px",
  };


const SKELETON_PRICE_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "190px",

    height:
      "34px",

    marginTop:
      "28px",
  };


const SKELETON_STATUS_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    width:
      "165px",

    height:
      "34px",

    marginTop:
      "18px",

    borderRadius:
      "999px",
  };


const SKELETON_ACTION_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    height:
      "54px",

    marginTop:
      "24px",

    borderRadius:
      "13px",
  };


const SKELETON_STORE_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    height:
      "92px",

    marginTop:
      "17px",

    borderRadius:
      "15px",
  };


const SKELETON_INFORMATION_STYLE:
  CSSProperties = {
    ...SKELETON_BASE_STYLE,

    minHeight:
      "170px",

    borderRadius:
      "16px",
  };


/* ==========================================================================
   2. CLÉS TECHNIQUES
   --------------------------------------------------------------------------
   Ce ne sont PAS des données produit.
   Elles servent uniquement à stabiliser le rendu React.
   ========================================================================== */

const PRODUCT_DETAIL_LOADING_THUMBNAILS =
  [
    "thumbnail-loading-01",
    "thumbnail-loading-02",
    "thumbnail-loading-03",
    "thumbnail-loading-04",
  ] as const;


const PRODUCT_DETAIL_LOADING_INFORMATION =
  [
    "information-loading-01",
    "information-loading-02",
    "information-loading-03",
    "information-loading-04",
  ] as const;


/* ==========================================================================
   3. COMPOSANT
   ========================================================================== */

export default function PublicProductDetailLoading() {
  return (
    <div
      className={
        styles.productDetailPage
      }
      data-public-product-detail-loading="true"
      aria-busy="true"
      aria-label="Chargement du produit"
    >
      {/* ==================================================================
          BREADCRUMB
          ================================================================== */}

      <nav
        className={
          styles.productDetailBreadcrumb
        }
        aria-label="Chargement de la navigation"
      >
        <div
          className={
            styles.productDetailBreadcrumbList
          }
          aria-hidden="true"
        >
          <span
            style={
              SKELETON_BREADCRUMB_STYLE
            }
          />

          <span
            className={
              styles.productDetailBreadcrumbSeparator
            }
          >
            /
          </span>

          <span
            style={{
              ...SKELETON_BREADCRUMB_STYLE,

              width:
                "92px",
            }}
          />

          <span
            className={
              styles.productDetailBreadcrumbSeparator
            }
          >
            /
          </span>

          <span
            style={{
              ...SKELETON_BREADCRUMB_STYLE,

              width:
                "130px",
            }}
          />
        </div>
      </nav>


      {/* ==================================================================
          PARTIE PRINCIPALE
          ================================================================== */}

      <section
        className={
          styles.productDetailMain
        }
        aria-label="Chargement des informations du produit"
      >
        {/* ================================================================
            GALERIE
            ================================================================ */}

        <div
          className={
            styles.productDetailGallery
          }
          aria-hidden="true"
        >
          {/* --------------------------------------------------------------
              MINIATURES
              -------------------------------------------------------------- */}

          <div
            className={
              styles.productDetailThumbnails
            }
          >
            {PRODUCT_DETAIL_LOADING_THUMBNAILS.map(
              (
                itemId,
              ) => (
                <span
                  key={
                    itemId
                  }
                  style={
                    SKELETON_THUMBNAIL_STYLE
                  }
                />
              ),
            )}
          </div>


          {/* --------------------------------------------------------------
              IMAGE PRINCIPALE
              -------------------------------------------------------------- */}

          <div
            className={
              styles.productDetailMainImageWrapper
            }
            style={{
              minHeight:
                "clamp(390px, 48vw, 690px)",
            }}
          >
            <span
              style={
                SKELETON_MAIN_IMAGE_STYLE
              }
            />
          </div>
        </div>


        {/* ================================================================
            INFORMATIONS COMMERCIALES
            ================================================================ */}

        <div
          className={
            styles.productDetailCommercial
          }
          aria-hidden="true"
        >
          <span
            style={
              SKELETON_EYEBROW_STYLE
            }
          />


          <span
            style={
              SKELETON_TITLE_STYLE
            }
          />


          <span
            style={{
              ...SKELETON_TITLE_STYLE,

              width:
                "58%",

              height:
                "32px",

              marginTop:
                "8px",
            }}
          />


          {/* --------------------------------------------------------------
              MÉTADONNÉES
              -------------------------------------------------------------- */}

          <div
            className={
              styles.productDetailMeta
            }
          >
            <span
              style={
                SKELETON_META_STYLE
              }
            />

            <span
              style={{
                ...SKELETON_META_STYLE,

                width:
                  "35%",
              }}
            />
          </div>


          {/* --------------------------------------------------------------
              PRIX
              -------------------------------------------------------------- */}

          <div
            className={
              styles.productDetailPricing
            }
          >
            <span
              style={
                SKELETON_PRICE_STYLE
              }
            />
          </div>


          {/* --------------------------------------------------------------
              STOCK
              -------------------------------------------------------------- */}

          <span
            style={
              SKELETON_STATUS_STYLE
            }
          />


          {/* --------------------------------------------------------------
              PANIER
              -------------------------------------------------------------- */}

          <div
            className={
              styles.productDetailPanierArea
            }
          >
            <span
              style={
                SKELETON_ACTION_STYLE
              }
            />
          </div>


          {/* --------------------------------------------------------------
              BOUTIQUE
              -------------------------------------------------------------- */}

          <span
            style={
              SKELETON_STORE_STYLE
            }
          />
        </div>
      </section>


      {/* ==================================================================
          INFORMATIONS COMPLÉMENTAIRES
          ================================================================== */}

      <section
        className={
          styles.productDetailInformation
        }
        aria-label="Chargement des informations complémentaires"
      >
        <header
          className={
            styles.productDetailInformationHeader
          }
          aria-hidden="true"
        >
          <span
            style={{
              ...SKELETON_EYEBROW_STYLE,

              width:
                "138px",
            }}
          />

          <span
            style={{
              ...SKELETON_TITLE_STYLE,

              width:
                "300px",

              maxWidth:
                "72%",

              height:
                "31px",

              marginTop:
                "12px",
            }}
          />
        </header>


        <div
          className={
            styles.productDetailInformationGrid
          }
          aria-hidden="true"
        >
          {PRODUCT_DETAIL_LOADING_INFORMATION.map(
            (
              itemId,
            ) => (
              <span
                key={
                  itemId
                }
                style={
                  SKELETON_INFORMATION_STYLE
                }
              />
            ),
          )}
        </div>
      </section>


      {/* ==================================================================
          TEXTE ACCESSIBLE
          ================================================================== */}

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          gap:
            "8px",

          padding:
            "0 20px 34px",

          color:
            "#8a7a82",

          fontSize:
            "11px",
        }}
        role="status"
        aria-live="polite"
      >
        <LoaderCircle
          size={
            16
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        Chargement du produit…
      </div>
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * Ce loading respecte la structure visuelle réelle de la fiche :
 *
 * breadcrumb
 *
 *        ↓
 *
 * galerie                 informations commerciales
 *
 *        ↓
 *
 * informations complémentaires
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - faux nom ;
 * - faux produit ;
 * - faux prix ;
 * - faux stock ;
 * - faux SKU ;
 * - fausse boutique ;
 * - fausse promotion ;
 * - fausse catégorie ;
 * - fausse image.
 *
 * ============================================================================
 *
 * Dès que la requête réelle est terminée :
 *
 * loading.tsx
 *
 *        ↓
 *
 * page.tsx
 *
 *        ↓
 *
 * getPublicProductDetailByQrToken()
 *
 *        ↓
 *
 * PublicProductDetail
 *
 * ============================================================================
 */