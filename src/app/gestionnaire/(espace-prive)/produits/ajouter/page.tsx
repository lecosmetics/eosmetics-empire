import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import {
  ProductStatus,
  StoreProductStatus,
} from "@prisma/client";

import AjouterProduitForm from "@/components/gestionnaire/produits/ajouter/AjouterProduitForm";

import {
  requireGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  getProductCreatePageData,
} from "@/lib/gestionnaire/produits/ajouter/product-create-query";

import {
  db,
} from "@/prisma/db";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — AJOUTER / MODIFIER UN PRODUIT
 * ============================================================================
 *
 * Route unique :
 *
 * /gestionnaire/produits/ajouter
 *
 * MODES :
 *
 * 1. CRÉATION
 *
 * /gestionnaire/produits/ajouter
 *
 * 2. MODIFICATION
 *
 * /gestionnaire/produits/ajouter?productId=xxxxxxxx
 *
 * IMPORTANT :
 *
 * Aucune route /modifier ou /edit n'est créée.
 *
 * Le même formulaire est utilisé pour :
 *
 * - créer un produit ;
 * - modifier un produit existant.
 *
 * SÉCURITÉ :
 *
 * Le productId peut identifier la cible demandée.
 *
 * En revanche :
 *
 * - storeId ;
 * - managerId ;
 * - permissions ;
 * - appartenance à la boutique
 *
 * ne viennent JAMAIS du navigateur.
 *
 * Le storeId vient exclusivement de :
 *
 * requireGestionnairePrivateAccess()
 *
 * puis :
 *
 * access.store.id
 *
 * ============================================================================
 */


/* ==========================================================================
   NEXT.JS
   ========================================================================== */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


export const runtime =
  "nodejs";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Ajouter ou modifier un produit | L&E Cosmetics Empire",

    description:
      "Ajoutez ou modifiez un produit dans votre espace Gestionnaire L&E Cosmetics Empire.",

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
   TYPES — SEARCH PARAMS
   ========================================================================== */

type AjouterProduitSearchParams =
  Readonly<
    Record<
      string,
      string |
      string[] |
      undefined
    >
  >;


interface AjouterProduitPageProps {
  searchParams:
    Promise<AjouterProduitSearchParams>;
}


/* ==========================================================================
   TYPES — INITIAL DATA
   --------------------------------------------------------------------------
   Ces données sont volontairement sérialisables afin d'être transmises
   proprement au Client Component AjouterProduitForm.
   ========================================================================== */

export interface ProductEditInitialImage {
  id:
    string;

  url:
    string;

  altText:
    string | null;

  position:
    number;

  isPrimary:
    boolean;
}


export interface ProductEditInitialCategory {
  id:
    string;

  name:
    string;

  slug:
    string;
}


export interface ProductEditInitialData {
  productId:
    string;

  storeProductId:
    string;

  name:
    string;

  sku:
    string;

  slug:
    string;

  category:
    ProductEditInitialCategory | null;

  brand:
    string;

  description:
    string;

  ingredients:
    string;

  weightContent:
    string;

  usageInstructions:
    string;

  unit:
    string;

  price:
    string;

  compareAtPrice:
    string | null;

  currency:
    string;

  stockQuantity:
    number;

  lowStockThreshold:
    number;

  productStatus:
    ProductStatus;

  storeProductStatus:
    StoreProductStatus;

  qrToken:
    string;

  images:
    readonly ProductEditInitialImage[];

  createdAt:
    string;

  updatedAt:
    string;
}


/* ==========================================================================
   SEARCH PARAM HELPER
   ========================================================================== */

function getFirstSearchParam(
  value:
    string |
    string[] |
    undefined,
): string | undefined {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    return value[0];
  }


  return undefined;
}


/* ==========================================================================
   STORE ID
   ========================================================================== */

function requireValidStoreId(
  value:
    unknown,
): string {
  if (
    typeof value !==
    "string"
  ) {
    throw new Error(
      "GESTIONNAIRE_STORE_ACCESS_INVALID",
    );
  }


  const storeId =
    value.trim();


  if (
    !storeId
  ) {
    throw new Error(
      "GESTIONNAIRE_STORE_ACCESS_INVALID",
    );
  }


  return storeId;
}


/* ==========================================================================
   PRODUCT ID
   ========================================================================== */

const PRODUCT_ID_MIN_LENGTH =
  8;


const PRODUCT_ID_MAX_LENGTH =
  128;


const PRODUCT_ID_PATTERN =
  /^[A-Za-z0-9_-]+$/;


function normalizeProductId(
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
    normalized.length <
      PRODUCT_ID_MIN_LENGTH ||
    normalized.length >
      PRODUCT_ID_MAX_LENGTH
  ) {
    return null;
  }


  if (
    !PRODUCT_ID_PATTERN.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   NORMALISATION STRING
   ========================================================================== */

function normalizeOptionalString(
  value:
    string |
    null |
    undefined,
): string {
  return typeof value ===
    "string"
    ? value
    : "";
}


/* ==========================================================================
   CHARGEMENT DU PRODUIT À MODIFIER
   --------------------------------------------------------------------------
   IMPORTANT :

   Cette lecture est toujours scopée avec :

   productId demandé
   +
   storeId réel de la session

   Ainsi :

   Gestionnaire A
   ne peut jamais charger les données du produit du Gestionnaire B.

   Une absence peut signifier :

   - produit inexistant ;
   - produit archivé ;
   - produit appartenant à une autre boutique.

   Dans les trois cas, on retourne null sans révéler davantage
   d'informations.
   ========================================================================== */

async function getProductEditInitialData(
  params:
    Readonly<{
      storeId:
        string;

      productId:
        string;
    }>,
): Promise<ProductEditInitialData | null> {
  const storeProduct =
    await db.storeProduct.findFirst({
      where: {
        storeId:
          params.storeId,

        productId:
          params.productId,

        status: {
          not:
            StoreProductStatus.ARCHIVED,
        },

        product: {
          status: {
            not:
              ProductStatus.ARCHIVED,
          },
        },
      },

      select: {
        id:
          true,

        productId:
          true,

        price:
          true,

        compareAtPrice:
          true,

        currency:
          true,

        stockQuantity:
          true,

        lowStockThreshold:
          true,

        status:
          true,

        qrToken:
          true,

        createdAt:
          true,

        updatedAt:
          true,

        product: {
          select: {
            id:
              true,

            name:
              true,

            sku:
              true,

            slug:
              true,

            description:
              true,

            brand:
              true,

            ingredients:
              true,

            weightContent:
              true,

            usageInstructions:
              true,

            unit:
              true,

            status:
              true,

            category: {
              select: {
                id:
                  true,

                name:
                  true,

                slug:
                  true,
              },
            },

            images: {
              select: {
                id:
                  true,

                url:
                  true,

                altText:
                  true,

                position:
                  true,

                isPrimary:
                  true,
              },

              orderBy: [
                {
                  isPrimary:
                    "desc",
                },

                {
                  position:
                    "asc",
                },

                {
                  createdAt:
                    "asc",
                },
              ],
            },
          },
        },
      },
    });


  if (
    !storeProduct
  ) {
    return null;
  }


  const product =
    storeProduct.product;


  return {
    productId:
      product.id,

    storeProductId:
      storeProduct.id,

    name:
      product.name,

    sku:
      product.sku,

    slug:
      product.slug,

    category:
      product.category
        ? {
            id:
              product.category.id,

            name:
              product.category.name,

            slug:
              product.category.slug,
          }
        : null,

    brand:
      normalizeOptionalString(
        product.brand,
      ),

    description:
      normalizeOptionalString(
        product.description,
      ),

    ingredients:
      normalizeOptionalString(
        product.ingredients,
      ),

    weightContent:
      normalizeOptionalString(
        product.weightContent,
      ),

    usageInstructions:
      normalizeOptionalString(
        product.usageInstructions,
      ),

    unit:
      normalizeOptionalString(
        product.unit,
      ),

    price:
      storeProduct.price.toString(),

    compareAtPrice:
      storeProduct.compareAtPrice
        ? storeProduct.compareAtPrice.toString()
        : null,

    currency:
      storeProduct.currency,

    stockQuantity:
      storeProduct.stockQuantity,

    lowStockThreshold:
      storeProduct.lowStockThreshold,

    productStatus:
      product.status,

    storeProductStatus:
      storeProduct.status,

    qrToken:
      storeProduct.qrToken,

    images:
      product.images.map(
        (
          image,
        ) => ({
          id:
            image.id,

          url:
            image.url,

          altText:
            image.altText,

          position:
            image.position,

          isPrimary:
            image.isPrimary,
        }),
      ),

    createdAt:
      storeProduct.createdAt.toISOString(),

    updatedAt:
      storeProduct.updatedAt.toISOString(),
  };
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function AjouterProduitPage({
  searchParams,
}: AjouterProduitPageProps) {
  /* =========================================================================
     1. ACCÈS PRIVÉ
     ========================================================================= */

  const access =
    await requireGestionnairePrivateAccess();


  /* =========================================================================
     2. BOUTIQUE AUTHENTIFIÉE
     ========================================================================= */

  const storeId =
    requireValidStoreId(
      access.store.id,
    );


  /* =========================================================================
     3. SEARCH PARAMS
     ========================================================================= */

  const resolvedSearchParams =
    await searchParams;


  const rawProductId =
    getFirstSearchParam(
      resolvedSearchParams.productId,
    );


  const hasProductIdParameter =
    rawProductId !==
    undefined;


  const productId =
    normalizeProductId(
      rawProductId,
    );


  /*
   * Si productId est explicitement présent mais invalide,
   * on ne doit surtout pas retomber silencieusement en mode création.
   *
   * Sinon :
   *
   * /ajouter?productId=INVALIDE
   *
   * pourrait présenter un formulaire de création alors que l'utilisateur
   * croit modifier un produit.
   */

  if (
    hasProductIdParameter &&
    !productId
  ) {
    notFound();
  }


  /* =========================================================================
     4. MODE
     ========================================================================= */

  const mode:
    "create" |
    "edit" =
      productId
        ? "edit"
        : "create";


  /* =========================================================================
     5. DONNÉES COMMUNES DU FORMULAIRE
     =========================================================================
     On conserve entièrement le service déjà utilisé par le formulaire.
     Rien n'est retiré.
     ========================================================================= */

  const createPageDataPromise =
    getProductCreatePageData({
      storeId,
    });


  /* =========================================================================
     6. DONNÉES DU PRODUIT EN MODE EDIT
     ========================================================================= */

  const editInitialDataPromise =
    productId
      ? getProductEditInitialData({
          storeId,
          productId,
        })
      : Promise.resolve(
          null,
        );


  /*
   * Les données communes et les données du produit peuvent être lues
   * en parallèle.
   */

  const [
    createPageData,
    editInitialData,
  ] =
    await Promise.all([
      createPageDataPromise,
      editInitialDataPromise,
    ]);


  /* =========================================================================
     7. PRODUIT INTROUVABLE / NON AUTORISÉ
     =========================================================================
     Même comportement pour :
     
     - produit inexistant ;
     - produit archivé ;
     - produit d'une autre boutique.
     
     Cela évite toute fuite d'information inter-boutiques.
     ========================================================================= */

  if (
    mode ===
      "edit" &&
    !editInitialData
  ) {
    notFound();
  }


  /* =========================================================================
     8. PAGE DATA
     =========================================================================
     IMPORTANT :
     
     On conserve le contrat existant :
     
     <AjouterProduitForm pageData={pageData} />
     
     Au lieu de créer de nouveaux props séparés et de casser immédiatement
     le formulaire existant, on enrichit simplement pageData.
     
     AjouterProduitForm pourra ensuite lire :
     
     pageData.mode
     pageData.productId
     pageData.initialData
     
     Toutes les anciennes données restent également présentes.
     ========================================================================= */

  const pageData = {
    ...createPageData,

    mode,

    productId:
      editInitialData?.productId ??
      null,

    initialData:
      editInitialData,
  };


  /* =========================================================================
     9. RENDU
     =========================================================================
     Le shell privé parent continue de gérer :
     
     - sidebar ;
     - header global ;
     - menu ;
     - largeur ;
     - responsive global.
     
     Rien n'est recréé ici.
     ========================================================================= */

  return (
    <AjouterProduitForm
      pageData={
        pageData
      }
    />
  );
}