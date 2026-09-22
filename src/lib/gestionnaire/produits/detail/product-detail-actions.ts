"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  db,
} from "@/prisma/db";

import {
  getGestionnairePrivateAccess,
} from "@/lib/gestionnaire/espace-prive/private-access";

import {
  deleteProductImagesFromStorage,
} from "@/lib/gestionnaire/produits/images/product-image-storage";

import {
  isValidProductDetailId,
  type ProductDeleteActionState,
  type ProductDeleteErrorCode,
} from "@/lib/gestionnaire/produits/detail/product-detail-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE — SUPPRESSION DÉFINITIVE D'UN PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/gestionnaire/produits/detail/product-detail-actions.ts
 *
 * RESPONSABILITÉS :
 *
 * - rester exclusivement côté serveur ;
 * - récupérer le Gestionnaire depuis sa session sécurisée ;
 * - dériver storeId côté serveur ;
 * - ne jamais accepter storeId depuis le navigateur ;
 * - valider productId ;
 * - vérifier l'appartenance réelle du produit à la boutique ;
 * - empêcher la suppression d'un produit CATALOG ;
 * - empêcher la suppression d'un produit créé par une autre boutique ;
 * - empêcher la destruction d'un Product partagé ;
 * - préserver les anciennes commandes ;
 * - détacher les OrderItem du StoreProduct avant suppression ;
 * - supprimer définitivement l'historique de stock du produit supprimé ;
 * - supprimer StoreProduct ;
 * - supprimer ProductImage ;
 * - supprimer Product ;
 * - effectuer toute la suppression DB dans une transaction atomique ;
 * - nettoyer les images Supabase après commit lorsque leur chemin est fiable ;
 * - invalider les routes concernées ;
 * - ne jamais exposer une erreur Prisma/PostgreSQL au navigateur.
 *
 * IMPORTANT :
 *
 * La suppression définitive concerne uniquement un produit :
 *
 * origin = STORE
 *
 * créé par la boutique actuellement authentifiée.
 *
 * Un produit du catalogue officiel L&E ne peut jamais être détruit
 * depuis l'espace Gestionnaire d'une boutique.
 *
 * Les commandes historiques ne sont PAS supprimées.
 *
 * OrderItem conserve déjà :
 *
 * - productName ;
 * - sku ;
 * - quantity ;
 * - unitPrice ;
 * - totalPrice.
 *
 * Le lien storeProductId est simplement détaché avant la suppression.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

const PRODUCTS_ROUTE =
  "/gestionnaire/produits";


const CATALOG_ROUTE =
  "/gestionnaire/categories";


const STOCK_ROUTE =
  "/gestionnaire/stock";


const ORDERS_ROUTE =
  "/gestionnaire/commandes";


const DASHBOARD_ROUTE =
  "/gestionnaire/dashboard";


const STATISTICS_ROUTE =
  "/gestionnaire/statistiques";


const PUBLIC_PRODUCT_ROUTE =
  "/p";


/* ==========================================================================
   FORM DATA
   ========================================================================== */

const PRODUCT_ID_FIELD =
  "productId" as const;


/* ==========================================================================
   TYPES INTERNES
   ========================================================================== */

interface ProductDeletionContext {
  readonly storeId:
    string;
}


interface ProductDeletionSuccess {
  readonly productId:
    string;

  readonly qrToken:
    string;

  readonly imageUrls:
    readonly string[];
}


type ProductDeletionTransactionFailureCode =
  | "PRODUCT_NOT_FOUND"
  | "CATALOG_PRODUCT"
  | "PRODUCT_NOT_OWNED"
  | "PRODUCT_SHARED"
  | "CONCURRENT_MODIFICATION";


/* ==========================================================================
   ERREUR MÉTIER INTERNE
   ========================================================================== */

class ProductDeletionTransactionError extends Error {
  readonly code:
    ProductDeletionTransactionFailureCode;


  constructor(
    code:
      ProductDeletionTransactionFailureCode,
  ) {
    super(
      code,
    );


    this.name =
      "ProductDeletionTransactionError";


    this.code =
      code;
  }
}


/* ==========================================================================
   FORM DATA STRING
   ========================================================================== */

function readFormDataString(
  formData:
    FormData,

  fieldName:
    string,
): string | null {
  const value =
    formData.get(
      fieldName,
    );


  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalized =
    value.trim();


  return normalized ||
    null;
}


/* ==========================================================================
   ERROR STATE
   ========================================================================== */

function createDeleteErrorState(
  params:
    Readonly<{
      code:
        ProductDeleteErrorCode;

      message:
        string;

      productId?:
        string | null;
    }>,
): ProductDeleteActionState {
  return {
    status:
      "error",

    message:
      params.message,

    code:
      params.code,

    productId:
      params.productId ??
      null,
  };
}


/* ==========================================================================
   SUCCESS STATE
   ========================================================================== */

function createDeleteSuccessState(
  productId:
    string,
): ProductDeleteActionState {
  return {
    status:
      "success",

    message:
      "Le produit a été supprimé définitivement avec succès.",

    code:
      null,

    productId,
  };
}


/* ==========================================================================
   AUTHENTIFICATION
   ========================================================================== */

async function getProductDeletionContext():
  Promise<ProductDeletionContext | null> {
  const access =
    await getGestionnairePrivateAccess();


  if (
    !access
  ) {
    return null;
  }


  const storeId =
    access.store.id.trim();


  if (
    !storeId
  ) {
    return null;
  }


  return {
    storeId,
  };
}


/* ==========================================================================
   TYPE GUARD ERREUR MÉTIER
   ========================================================================== */

function isProductDeletionTransactionError(
  error:
    unknown,
): error is ProductDeletionTransactionError {
  return (
    error instanceof
    ProductDeletionTransactionError
  );
}


/* ==========================================================================
   PRISMA ERROR CODE
   ========================================================================== */

function getDatabaseErrorCode(
  error:
    unknown,
): string | null {
  if (
    typeof error !==
      "object" ||
    error ===
      null ||
    !(
      "code" in error
    )
  ) {
    return null;
  }


  const rawCode =
    (
      error as {
        readonly code?:
          unknown;
      }
    ).code;


  if (
    typeof rawCode !==
    "string"
  ) {
    return null;
  }


  const normalized =
    rawCode.trim();


  if (
    !/^[A-Za-z0-9_-]{1,32}$/.test(
      normalized,
    )
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   LOG SERVEUR
   ========================================================================== */

function logUnexpectedDeletionError(
  error:
    unknown,
): void {
  const errorName =
    error instanceof Error
      ? error.name
      : "UnknownError";


  const databaseCode =
    getDatabaseErrorCode(
      error,
    );


  console.error(
    "[L&E Cosmetics Empire][ProductDeleteAction] Suppression impossible.",
    {
      errorName,
      databaseCode,
    },
  );
}


/* ==========================================================================
   REVALIDATION SÉCURISÉE
   ========================================================================== */

function safeRevalidatePath(
  path:
    string,
): void {
  try {
    revalidatePath(
      path,
    );
  } catch (
    error
  ) {
    console.error(
      "[L&E Cosmetics Empire][ProductDeleteAction] Revalidation impossible.",
      {
        path,

        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError",
      },
    );
  }
}


/* ==========================================================================
   REVALIDATION DES ROUTES
   ========================================================================== */

function revalidateProductRoutes(
  params:
    Readonly<{
      productId:
        string;

      qrToken:
        string;
    }>,
): void {
  const encodedProductId =
    encodeURIComponent(
      params.productId,
    );


  const encodedQrToken =
    encodeURIComponent(
      params.qrToken,
    );


  safeRevalidatePath(
    PRODUCTS_ROUTE,
  );


  safeRevalidatePath(
    CATALOG_ROUTE,
  );


  safeRevalidatePath(
    STOCK_ROUTE,
  );


  safeRevalidatePath(
    ORDERS_ROUTE,
  );


  safeRevalidatePath(
    DASHBOARD_ROUTE,
  );


  safeRevalidatePath(
    STATISTICS_ROUTE,
  );


  safeRevalidatePath(
    `${PRODUCTS_ROUTE}/${encodedProductId}`,
  );


  safeRevalidatePath(
    `${PRODUCTS_ROUTE}/${encodedProductId}/modifier`,
  );


  safeRevalidatePath(
    `${PRODUCTS_ROUTE}/${encodedProductId}/qr`,
  );


  if (
    params.qrToken.trim()
  ) {
    safeRevalidatePath(
      `${PUBLIC_PRODUCT_ROUTE}/${encodedQrToken}`,
    );
  }
}


/* ==========================================================================
   STORAGE — EXTRACTION DU CHEMIN DEPUIS URL PUBLIQUE
   ========================================================================== */

/**
 * ProductImage conserve actuellement l'URL publique et non un storagePath.
 *
 * On reconstruit donc le chemin Storage uniquement lorsqu'il peut être
 * déterminé sans ambiguïté.
 *
 * Une URL inconnue ou externe retourne null et ne provoque aucune
 * suppression Storage.
 */

function getStoragePathFromProductImageUrl(
  imageUrl:
    string,
): string | null {
  const normalizedImageUrl =
    imageUrl.trim();


  if (
    !normalizedImageUrl
  ) {
    return null;
  }


  const bucket =
    process.env
      .SUPABASE_PRODUCT_IMAGES_BUCKET
      ?.trim();


  if (
    !bucket
  ) {
    return null;
  }


  try {
    const url =
      new URL(
        normalizedImageUrl,
      );


    const configuredSupabaseUrl =
      (
        process.env
          .SUPABASE_URL ??
        process.env
          .NEXT_PUBLIC_SUPABASE_URL ??
        ""
      ).trim();


    if (
      configuredSupabaseUrl
    ) {
      try {
        const supabaseUrl =
          new URL(
            configuredSupabaseUrl,
          );


        if (
          url.origin !==
          supabaseUrl.origin
        ) {
          return null;
        }
      } catch {
        return null;
      }
    }


    const rawMarker =
      `/storage/v1/object/public/${bucket}/`;


    const encodedMarker =
      `/storage/v1/object/public/${encodeURIComponent(
        bucket,
      )}/`;


    let storagePart:
      string | null =
        null;


    const rawIndex =
      url.pathname.indexOf(
        rawMarker,
      );


    if (
      rawIndex >=
      0
    ) {
      storagePart =
        url.pathname.slice(
          rawIndex +
            rawMarker.length,
        );
    } else {
      const encodedIndex =
        url.pathname.indexOf(
          encodedMarker,
        );


      if (
        encodedIndex >=
        0
      ) {
        storagePart =
          url.pathname.slice(
            encodedIndex +
              encodedMarker.length,
          );
      }
    }


    if (
      !storagePart
    ) {
      return null;
    }


    const decodedPath =
      decodeURIComponent(
        storagePart,
      )
        .replace(
          /^\/+/,
          "",
        )
        .trim();


    if (
      !decodedPath ||
      decodedPath.includes(
        "..",
      ) ||
      decodedPath.includes(
        "\\",
      )
    ) {
      return null;
    }


    return decodedPath;
  } catch {
    return null;
  }
}


/* ==========================================================================
   STORAGE — CHEMINS UNIQUES
   ========================================================================== */

function getProductImageStoragePaths(
  params:
    Readonly<{
      imageUrls:
        readonly string[];

      storeId:
        string;
    }>,
): string[] {
  const expectedStorePrefix =
    `stores/${params.storeId}/`;


  const paths =
    new Set<string>();


  for (
    const imageUrl of
    params.imageUrls
  ) {
    const storagePath =
      getStoragePathFromProductImageUrl(
        imageUrl,
      );


    /**
     * Double protection :
     *
     * même si une URL valide Supabase se trouvait en base, on ne demande
     * jamais à supprimer un fichier appartenant à une autre boutique.
     */

    if (
      !storagePath ||
      !storagePath.startsWith(
        expectedStorePrefix,
      )
    ) {
      continue;
    }


    paths.add(
      storagePath,
    );
  }


  return Array.from(
    paths,
  );
}


/* ==========================================================================
   STORAGE — NETTOYAGE APRÈS COMMIT
   ========================================================================== */

/**
 * La suppression PostgreSQL constitue l'opération métier principale.
 *
 * Les fichiers Storage sont nettoyés APRÈS le commit.
 *
 * Une panne temporaire de Supabase Storage ne doit pas transformer une
 * suppression DB réussie en faux échec affiché au Gestionnaire.
 */

async function cleanupDeletedProductImages(
  params:
    Readonly<{
      imageUrls:
        readonly string[];

      storeId:
        string;
    }>,
): Promise<void> {
  const storagePaths =
    getProductImageStoragePaths(
      params,
    );


  if (
    storagePaths.length ===
    0
  ) {
    return;
  }


  try {
    await deleteProductImagesFromStorage({
      storeId:
        params.storeId,

      storagePaths,
    });
  } catch (
    error
  ) {
    console.error(
      "[L&E Cosmetics Empire][ProductDeleteAction] Nettoyage Storage incomplet.",
      {
        errorName:
          error instanceof Error
            ? error.name
            : "UnknownError",

        filesCount:
          storagePaths.length,
      },
    );
  }
}


/* ==========================================================================
   SUPPRESSION TRANSACTIONNELLE
   ========================================================================== */

/**
 * SUPPRESSION DÉFINITIVE.
 *
 * La transaction suit cet ordre :
 *
 * 1. retrouver StoreProduct depuis storeId + productId ;
 * 2. vérifier que le Product appartient réellement à la boutique ;
 * 3. refuser les produits CATALOG ;
 * 4. refuser un Product partagé ;
 * 5. mémoriser QR + URLs images ;
 * 6. détacher les anciennes OrderItem ;
 * 7. supprimer les StockMovement ;
 * 8. supprimer StoreProduct ;
 * 9. supprimer ProductImage ;
 * 10. supprimer Product.
 *
 * Une exception à n'importe quelle étape provoque le rollback complet.
 */

async function deleteStoreOwnedProduct(
  params:
    Readonly<{
      productId:
        string;

      storeId:
        string;
    }>,
): Promise<ProductDeletionSuccess> {
  return db.$transaction(
    async (
      tx,
    ) => {
      /* =====================================================================
         1. STORE PRODUCT
         ===================================================================== */

      const storeProduct =
        await tx.storeProduct.findUnique({
          where: {
            storeId_productId: {
              storeId:
                params.storeId,

              productId:
                params.productId,
            },
          },

          select: {
            id:
              true,

            storeId:
              true,

            productId:
              true,

            qrToken:
              true,

            product: {
              select: {
                id:
                  true,

                origin:
                  true,

                createdByStoreId:
                  true,

                images: {
                  select: {
                    url:
                      true,
                  },
                },

                _count: {
                  select: {
                    storeProducts:
                      true,
                  },
                },
              },
            },
          },
        });


      /* =====================================================================
         2. INTROUVABLE
         ===================================================================== */

      if (
        !storeProduct
      ) {
        throw new ProductDeletionTransactionError(
          "PRODUCT_NOT_FOUND",
        );
      }


      /* =====================================================================
         3. APPARTENANCE
         ===================================================================== */

      if (
        storeProduct.storeId !==
          params.storeId ||
        storeProduct.productId !==
          params.productId ||
        storeProduct.product.id !==
          params.productId
      ) {
        throw new ProductDeletionTransactionError(
          "PRODUCT_NOT_OWNED",
        );
      }


      /* =====================================================================
         4. CATALOGUE OFFICIEL
         ===================================================================== */

      if (
        storeProduct.product.origin ===
        "CATALOG"
      ) {
        throw new ProductDeletionTransactionError(
          "CATALOG_PRODUCT",
        );
      }


      /* =====================================================================
         5. ORIGINE STORE
         ===================================================================== */

      if (
        storeProduct.product.origin !==
        "STORE"
      ) {
        throw new ProductDeletionTransactionError(
          "PRODUCT_NOT_OWNED",
        );
      }


      /* =====================================================================
         6. BOUTIQUE CRÉATRICE
         ===================================================================== */

      if (
        storeProduct.product.createdByStoreId !==
        params.storeId
      ) {
        throw new ProductDeletionTransactionError(
          "PRODUCT_NOT_OWNED",
        );
      }


      /* =====================================================================
         7. PRODUIT PARTAGÉ
         ===================================================================== */

      if (
        storeProduct.product
          ._count
          .storeProducts !==
        1
      ) {
        throw new ProductDeletionTransactionError(
          "PRODUCT_SHARED",
        );
      }


      /* =====================================================================
         8. MÉTADONNÉES À CONSERVER AVANT SUPPRESSION
         ===================================================================== */

      const qrToken =
        storeProduct
          .qrToken
          .trim();


      const imageUrls =
        storeProduct
          .product
          .images
          .map(
            (
              image,
            ) =>
              image.url.trim(),
          )
          .filter(
            (
              imageUrl,
            ) =>
              imageUrl.length >
              0,
          );


      /* =====================================================================
         9. COMMANDES HISTORIQUES
         =====================================================================
         
         IMPORTANT :
         
         On ne supprime aucune Order.
         On ne supprime aucun OrderItem.
         
         Les données snapshot restent donc conservées :
         
         - productName ;
         - sku ;
         - quantity ;
         - unitPrice ;
         - totalPrice.
         
         Seule la référence vers StoreProduct est retirée.
         ===================================================================== */

      await tx.orderItem.updateMany({
        where: {
          storeProductId:
            storeProduct.id,
        },

        data: {
          storeProductId:
            null,
        },
      });


      /* =====================================================================
         10. HISTORIQUE DE STOCK
         =====================================================================
         
         La demande métier est une suppression DÉFINITIVE.
         
         StockMovement référence StoreProduct avec onDelete: Restrict.
         
         Les mouvements appartenant exclusivement à ce StoreProduct doivent
         donc être supprimés explicitement avant StoreProduct.
         
         Le filtre storeId évite toute suppression hors de la boutique
         authentifiée.
         ===================================================================== */

      await tx.stockMovement.deleteMany({
        where: {
          storeId:
            params.storeId,

          storeProductId:
            storeProduct.id,
        },
      });


      /* =====================================================================
         11. STORE PRODUCT
         ===================================================================== */

      const deletedStoreProduct =
        await tx.storeProduct.deleteMany({
          where: {
            id:
              storeProduct.id,

            storeId:
              params.storeId,

            productId:
              params.productId,
          },
        });


      if (
        deletedStoreProduct.count !==
        1
      ) {
        throw new ProductDeletionTransactionError(
          "CONCURRENT_MODIFICATION",
        );
      }


      /* =====================================================================
         12. PRODUCT IMAGES EN BASE
         =====================================================================
         
         Les URLs ont été mémorisées avant cette étape pour permettre le
         nettoyage Supabase après commit.
         ===================================================================== */

      await tx.productImage.deleteMany({
        where: {
          productId:
            params.productId,
        },
      });


      /* =====================================================================
         13. PRODUCT
         ===================================================================== */

      const deletedProduct =
        await tx.product.deleteMany({
          where: {
            id:
              params.productId,

            origin:
              "STORE",

            createdByStoreId:
              params.storeId,
          },
        });


      if (
        deletedProduct.count !==
        1
      ) {
        /**
         * Rollback automatique de :
         *
         * - OrderItem.storeProductId ;
         * - StockMovement ;
         * - StoreProduct ;
         * - ProductImage ;
         * - Product.
         */

        throw new ProductDeletionTransactionError(
          "CONCURRENT_MODIFICATION",
        );
      }


      /* =====================================================================
         14. SUCCÈS TRANSACTION
         ===================================================================== */

      return {
        productId:
          params.productId,

        qrToken,

        imageUrls,
      };
    },
  );
}


/* ==========================================================================
   MAPPING DES ERREURS MÉTIER
   ========================================================================== */

function mapTransactionErrorToActionState(
  error:
    ProductDeletionTransactionError,

  productId:
    string,
): ProductDeleteActionState {
  switch (
    error.code
  ) {
    case "PRODUCT_NOT_FOUND":
      return createDeleteErrorState({
        code:
          "PRODUCT_NOT_FOUND",

        message:
          "Ce produit est introuvable ou n’est plus accessible depuis votre boutique.",

        productId,
      });


    case "CATALOG_PRODUCT":
      return createDeleteErrorState({
        code:
          "CATALOG_PRODUCT_NOT_DELETABLE",

        message:
          "Un produit du catalogue officiel ne peut pas être supprimé définitivement depuis votre boutique.",

        productId,
      });


    case "PRODUCT_NOT_OWNED":
      return createDeleteErrorState({
        code:
          "FORBIDDEN",

        message:
          "Vous n’êtes pas autorisé à supprimer ce produit.",

        productId,
      });


    case "PRODUCT_SHARED":
      return createDeleteErrorState({
        code:
          "PRODUCT_NOT_DELETABLE",

        message:
          "Ce produit est encore partagé avec plusieurs points de commercialisation et ne peut pas être supprimé définitivement.",

        productId,
      });


    case "CONCURRENT_MODIFICATION":
      return createDeleteErrorState({
        code:
          "PRODUCT_NOT_DELETABLE",

        message:
          "Le produit a été modifié pendant l’opération. Actualisez la page puis réessayez.",

        productId,
      });


    default:
      return createDeleteErrorState({
        code:
          "DELETE_FAILED",

        message:
          "La suppression définitive du produit n’a pas pu être effectuée.",

        productId,
      });
  }
}


/* ==========================================================================
   SERVER ACTION — SUPPRESSION DÉFINITIVE
   ========================================================================== */

export async function deleteProductAction(
  _previousState:
    ProductDeleteActionState,

  formData:
    FormData,
): Promise<ProductDeleteActionState> {
  /* =========================================================================
     1. PRODUCT ID
     ========================================================================= */

  const rawProductId =
    readFormDataString(
      formData,
      PRODUCT_ID_FIELD,
    );


  if (
    !rawProductId ||
    !isValidProductDetailId(
      rawProductId,
    )
  ) {
    return createDeleteErrorState({
      code:
        "INVALID_PRODUCT_ID",

      message:
        "L’identifiant du produit est invalide.",
    });
  }


  const productId =
    rawProductId.trim();


  /* =========================================================================
     2. SESSION + BOUTIQUE
     ========================================================================= */

  const context =
    await getProductDeletionContext();


  if (
    !context
  ) {
    return createDeleteErrorState({
      code:
        "UNAUTHENTICATED",

      message:
        "Votre session n’est plus valide. Reconnectez-vous avant de continuer.",

      productId,
    });
  }


  try {
    /* =======================================================================
       3. TRANSACTION DB
       ======================================================================= */

    const deletionResult =
      await deleteStoreOwnedProduct({
        productId,

        storeId:
          context.storeId,
      });


    /* =======================================================================
       4. NETTOYAGE SUPABASE STORAGE
       =======================================================================
       
       La transaction PostgreSQL est déjà validée.
       
       Cette étape est volontairement best-effort :
       
       une indisponibilité temporaire de Storage ne doit jamais produire un
       faux message "suppression échouée" alors que Product n'existe déjà plus.
       ======================================================================= */

    await cleanupDeletedProductImages({
      storeId:
        context.storeId,

      imageUrls:
        deletionResult.imageUrls,
    });


    /* =======================================================================
       5. CACHE
       ======================================================================= */

    revalidateProductRoutes({
      productId:
        deletionResult.productId,

      qrToken:
        deletionResult.qrToken,
    });


    /* =======================================================================
       6. SUCCÈS
       ======================================================================= */

    return createDeleteSuccessState(
      deletionResult.productId,
    );
  } catch (
    error
  ) {
    /* =======================================================================
       7. ERREUR MÉTIER
       ======================================================================= */

    if (
      isProductDeletionTransactionError(
        error,
      )
    ) {
      return mapTransactionErrorToActionState(
        error,
        productId,
      );
    }


    /* =======================================================================
       8. ERREUR INFRASTRUCTURE
       ======================================================================= */

    logUnexpectedDeletionError(
      error,
    );


    return createDeleteErrorState({
      code:
        "DELETE_FAILED",

      message:
        "Une erreur est survenue pendant la suppression définitive du produit. Veuillez réessayer.",

      productId,
    });
  }
}