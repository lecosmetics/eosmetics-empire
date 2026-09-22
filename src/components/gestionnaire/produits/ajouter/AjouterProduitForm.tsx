"use client";

import {
  useActionState,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  Save,
  Send,
} from "lucide-react";

import {
  createProductAction,
} from "@/lib/gestionnaire/produits/ajouter/product-create-actions";

import {
  PRODUCT_CREATE_FORM_FIELDS,
  PRODUCT_CREATE_INITIAL_STATE,
  PRODUCT_CREATE_PENDING_QR_STATE,
  getProductCreatePrimaryImage,
  type ProductCreateFieldErrors,
  type ProductCreateFormValues,
  type ProductCreateImageInput,
  type ProductCreatePageData,
  type ProductCreatePreview,
  type ProductCreatePublicationStatus,
  type ProductCreateQrState,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";

import {
  routes,
} from "@/config/routes";

import ProduitInformationsSection from "./ProduitInformationsSection";
import ProduitPrixStockSection from "./ProduitPrixStockSection";
import ProduitDetailsSection from "./ProduitDetailsSection";
import ProduitImagesSection from "./ProduitImagesSection";
import ProduitPreviewQrStatus from "./ProduitPreviewQrStatus";

import styles from "@/app/gestionnaire/(espace-prive)/produits/ajouter/ajouter-produit.module.css";


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
 * MODE CRÉATION :
 *
 * /gestionnaire/produits/ajouter
 *
 * MODE MODIFICATION :
 *
 * /gestionnaire/produits/ajouter?productId=xxxxxxxx
 *
 * IMPORTANT :
 *
 * - aucune route /modifier ;
 * - aucune route /edit ;
 * - aucun deuxième formulaire ;
 * - aucun storeId venant du navigateur ;
 * - aucun managerId venant du navigateur ;
 * - aucune requête Prisma dans ce composant ;
 * - le QR existant est conservé ;
 * - les images existantes sont préchargées ;
 * - le même formulaire reste utilisé pour création et modification.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES — EDIT MODE
   ========================================================================== */

type ProductFormMode =
  | "create"
  | "edit";


interface ProductEditInitialImage {
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


interface ProductEditInitialCategory {
  id:
    string;

  name:
    string;

  slug:
    string;
}


interface ProductEditInitialData {
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
    string;

  storeProductStatus:
    string;

  qrToken:
    string;

  images:
    readonly ProductEditInitialImage[];

  createdAt:
    string;

  updatedAt:
    string;
}


type ProductFormPageData =
  ProductCreatePageData &
  Readonly<{
    mode?:
      ProductFormMode;

    productId?:
      string | null;

    initialData?:
      ProductEditInitialData | null;
  }>;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface AjouterProduitFormProps {
  readonly pageData:
    ProductFormPageData;
}


/* ==========================================================================
   FIELD UPDATE TYPE
   ========================================================================== */

export type ProductCreateEditableField =
  Exclude<
    keyof ProductCreateFormValues,
    "publicationStatus"
  >;


/* ==========================================================================
   FORM FIELD CHANGE CALLBACK
   ========================================================================== */

export type ProductCreateFieldChangeHandler =
  (
    field:
      ProductCreateEditableField,

    value:
      string,
  ) => void;


/* ==========================================================================
   TECHNICAL FIELD NAMES — EDIT
   ========================================================================== */

/**
 * Ces valeurs servent uniquement à indiquer l'intention du formulaire.
 *
 * Elles ne constituent jamais une autorisation.
 *
 * Le serveur doit toujours revérifier :
 *
 * - session ;
 * - boutique ;
 * - produit ;
 * - ownership ;
 * - permissions.
 */

const PRODUCT_FORM_MODE_FIELD =
  "mode";


const PRODUCT_FORM_PRODUCT_ID_FIELD =
  "productId";


/* ==========================================================================
   SUBMISSION ID
   ========================================================================== */

function createSubmissionId():
  string {
  if (
    typeof globalThis.crypto !==
      "undefined" &&
    typeof globalThis.crypto
      .randomUUID ===
      "function"
  ) {
    return globalThis.crypto
      .randomUUID()
      .replace(
        /-/g,
        "_",
      );
  }


  return [
    "product",

    Date.now()
      .toString(
        36,
      ),

    Math.random()
      .toString(
        36,
      )
      .slice(
        2,
      ),

    Math.random()
      .toString(
        36,
      )
      .slice(
        2,
      ),
  ].join(
    "_",
  );
}


/* ==========================================================================
   EDIT MODE
   ========================================================================== */

function isEditPageData(
  pageData:
    ProductFormPageData,
): pageData is
  ProductFormPageData &
  Readonly<{
    mode:
      "edit";

    productId:
      string;

    initialData:
      ProductEditInitialData;
  }> {
  return (
    pageData.mode ===
      "edit" &&
    typeof pageData.productId ===
      "string" &&
    Boolean(
      pageData.productId
        .trim(),
    ) &&
    pageData.initialData !==
      null &&
    pageData.initialData !==
      undefined
  );
}


/* ==========================================================================
   SAFE RECORD HELPERS
   ========================================================================== */

/**
 * ProductCreateFormValues reste le contrat officiel du formulaire.
 *
 * Ce helper permet uniquement de préremplir les propriétés déjà présentes
 * dans ce contrat sans introduire une deuxième structure parallèle.
 */

function setExistingFormStringValue(
  target:
    Record<string, unknown>,

  key:
    string,

  value:
    string,
): void {
  if (
    !Object.prototype
      .hasOwnProperty
      .call(
        target,
        key,
      )
  ) {
    return;
  }


  target[key] =
    value;
}


/* ==========================================================================
   INITIAL FORM VALUES
   ========================================================================== */

function createInitialFormValues(
  pageData:
    ProductFormPageData,
): ProductCreateFormValues {
  /* ------------------------------------------------------------------------
     BASE CREATE
     ------------------------------------------------------------------------ */

  const baseValues:
    ProductCreateFormValues = {
    ...PRODUCT_CREATE_INITIAL_STATE
      .values,

    brand:
      pageData.brand,
  };


  if (
    !isEditPageData(
      pageData,
    )
  ) {
    return baseValues;
  }


  /* ------------------------------------------------------------------------
     MODE EDIT
     ------------------------------------------------------------------------ */

  const initialData =
    pageData.initialData;


  const nextValues:
    ProductCreateFormValues = {
    ...baseValues,
  };


  const writableValues =
    nextValues as unknown as
      Record<string, unknown>;


  /* ------------------------------------------------------------------------
     INFORMATIONS GÉNÉRALES
     ------------------------------------------------------------------------ */

  setExistingFormStringValue(
    writableValues,
    "name",
    initialData.name,
  );


  setExistingFormStringValue(
    writableValues,
    "categoryId",
    initialData.category?.id ??
      "",
  );


  setExistingFormStringValue(
    writableValues,
    "brand",
    initialData.brand ||
      pageData.brand,
  );


  setExistingFormStringValue(
    writableValues,
    "description",
    initialData.description,
  );


  /* ------------------------------------------------------------------------
     PRIX
     ------------------------------------------------------------------------ */

  setExistingFormStringValue(
    writableValues,
    "price",
    initialData.price,
  );


  setExistingFormStringValue(
    writableValues,
    "compareAtPrice",
    initialData.compareAtPrice ??
      "",
  );


  /* ------------------------------------------------------------------------
     STOCK
     ------------------------------------------------------------------------ */

  setExistingFormStringValue(
    writableValues,
    "stockQuantity",
    String(
      initialData.stockQuantity,
    ),
  );


  /* ------------------------------------------------------------------------
     DÉTAILS PRODUIT
     ------------------------------------------------------------------------ */

  setExistingFormStringValue(
    writableValues,
    "unit",
    initialData.unit,
  );


  setExistingFormStringValue(
    writableValues,
    "ingredients",
    initialData.ingredients,
  );


  setExistingFormStringValue(
    writableValues,
    "weightContent",
    initialData.weightContent,
  );


  setExistingFormStringValue(
    writableValues,
    "usageInstructions",
    initialData.usageInstructions,
  );


  /* ------------------------------------------------------------------------
     STATUT
     ------------------------------------------------------------------------ */

  const publicationStatus:
    ProductCreatePublicationStatus =
      initialData.productStatus ===
        "DRAFT"
        ? "DRAFT"
        : initialData.storeProductStatus ===
              "HIDDEN" ||
            initialData.storeProductStatus ===
              "ARCHIVED"
          ? "INACTIVE"
          : "PUBLISHED";


  nextValues.publicationStatus =
    publicationStatus;


  return nextValues;
}


/* ==========================================================================
   INITIAL IMAGES
   ========================================================================== */

/**
 * En création :
 *
 * aucune image n'existe encore.
 *
 * En modification :
 *
 * les ProductImage déjà présents en base deviennent des images EXISTING.
 *
 * IMPORTANT :
 *
 * - leur id Prisma est conservé dans `id` ;
 * - fileId reste null ;
 * - storagePath reste null ;
 * - elles ne doivent jamais être présentées comme de nouveaux uploads.
 */

function createInitialImages(
  pageData:
    ProductFormPageData,
): ProductCreateImageInput[] {
  if (
    !isEditPageData(
      pageData,
    )
  ) {
    return [];
  }


  return pageData
    .initialData
    .images
    .map(
      (
        image,
        index,
      ): ProductCreateImageInput => ({
        id:
          image.id,

        fileId:
          null,

        storagePath:
          null,

        url:
          image.url,

        altText:
          image.altText,

        position:
          Number.isFinite(
            image.position,
          )
            ? image.position
            : index,

        isPrimary:
          image.isPrimary,

        source:
          "EXISTING",
      }),
    );
}


/* ==========================================================================
   FIELD ERRORS
   ========================================================================== */

function getFieldErrors(
  errors:
    ProductCreateFieldErrors |
    null,
): ProductCreateFieldErrors {
  return errors ?? {};
}


/* ==========================================================================
   PREVIEW
   ========================================================================== */

function createProductPreview(
  values:
    ProductCreateFormValues,

  images:
    readonly ProductCreateImageInput[],

  currency:
    string,
): ProductCreatePreview {
  const primaryImage =
    getProductCreatePrimaryImage(
      images,
    );


  return {
    name:
      values.name,

    brand:
      values.brand,

    description:
      values.description,

    price:
      values.price,

    compareAtPrice:
      values.compareAtPrice,

    currency,

    primaryImageUrl:
      primaryImage?.url ??
      null,
  };
}


/* ==========================================================================
   QR STATE
   ========================================================================== */

function createQrState(
  state:
    typeof PRODUCT_CREATE_INITIAL_STATE |
    Awaited<
      ReturnType<
        typeof createProductAction
      >
    >,

  pageData:
    ProductFormPageData,
): ProductCreateQrState {
  /* ------------------------------------------------------------------------
     APRÈS UNE ACTION RÉUSSIE
     ------------------------------------------------------------------------ */

  if (
    state.status ===
      "success" &&
    state.data
  ) {
    return {
      status:
        "ready",

      qrToken:
        state.data.qrToken,

      publicProductRoute:
        state.data
          .publicProductRoute,

      qrRoute:
        state.data.qrRoute,
    };
  }


  /* ------------------------------------------------------------------------
     PRODUIT EXISTANT EN MODIFICATION
     ------------------------------------------------------------------------ */

  if (
    isEditPageData(
      pageData,
    ) &&
    pageData.initialData.qrToken
  ) {
    const encodedProductId =
      encodeURIComponent(
        pageData.initialData
          .productId,
      );


    const encodedQrToken =
      encodeURIComponent(
        pageData.initialData
          .qrToken,
      );


    return {
      status:
        "ready",

      qrToken:
        pageData.initialData
          .qrToken,

      publicProductRoute:
        `/p/${encodedQrToken}`,

      qrRoute:
        `${routes.gestionnaire.products}/${encodedProductId}/qr`,
    };
  }


  return PRODUCT_CREATE_PENDING_QR_STATE;
}


/* ==========================================================================
   MESSAGE CLASS
   ========================================================================== */

function getMessageClassName(
  status:
    string,
): string {
  if (
    status ===
    "success"
  ) {
    return [
      styles.formMessage,
      styles.formMessageSuccess,
    ]
      .filter(
        Boolean,
      )
      .join(
        " ",
      );
  }


  return [
    styles.formMessage,
    styles.formMessageError,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   DETAIL ROUTE
   ========================================================================== */

function getEditProductDetailRoute(
  pageData:
    ProductFormPageData,
): string {
  if (
    !isEditPageData(
      pageData,
    )
  ) {
    return routes
      .gestionnaire
      .products;
  }


  return `${routes.gestionnaire.products}/${encodeURIComponent(
    pageData.initialData
      .productId,
  )}`;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function AjouterProduitForm({
  pageData,
}: AjouterProduitFormProps) {
  /* =========================================================================
     MODE
     ========================================================================= */

  const isEditMode =
    isEditPageData(
      pageData,
    );


  /* =========================================================================
     SERVER ACTION
     =========================================================================
     createProductAction reste l'action unifiée du formulaire.

     Le serveur est seul responsable de déterminer si l'opération correspond
     réellement à une création ou à une mise à jour autorisée.

     Le client transmet :

     - mode ;
     - productId en mode edit ;
     - valeurs du formulaire.

     Mais ces informations ne constituent jamais une autorisation.
     ========================================================================= */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      createProductAction,
      PRODUCT_CREATE_INITIAL_STATE,
    );


  /* =========================================================================
     FORM VALUES
     ========================================================================= */

  const [
    values,
    setValues,
  ] =
    useState<ProductCreateFormValues>(
      () =>
        createInitialFormValues(
          pageData,
        ),
    );


  /* =========================================================================
     IMAGES
     ========================================================================= */

  const [
    images,
    setImages,
  ] =
    useState<
      ProductCreateImageInput[]
    >(
      () =>
        createInitialImages(
          pageData,
        ),
    );


  /* =========================================================================
     SUBMISSION ID
     ========================================================================= */

  const [
    submissionId,
  ] =
    useState<string>(
      () =>
        createSubmissionId(),
    );


  /* =========================================================================
     SUCCESS
     ========================================================================= */

  const isSuccess =
    state.status ===
      "success" &&
    state.data !==
      null;


  /* =========================================================================
     FORM LOCK
     ========================================================================= */

  const isFormLocked =
    isPending ||
    isSuccess;


  /* =========================================================================
     FIELD ERRORS
     ========================================================================= */

  const fieldErrors =
    useMemo(
      () =>
        getFieldErrors(
          state.fieldErrors,
        ),
      [
        state.fieldErrors,
      ],
    );


  /* =========================================================================
     FIELD CHANGE
     ========================================================================= */

  const handleFieldChange:
    ProductCreateFieldChangeHandler =
      (
        field,
        value,
      ) => {
        if (
          isFormLocked
        ) {
          return;
        }


        setValues(
          (
            current,
          ) => {
            if (
              current[field] ===
              value
            ) {
              return current;
            }


            return {
              ...current,

              [field]:
                value,
            };
          },
        );
      };


  /* =========================================================================
     PUBLICATION STATUS
     ========================================================================= */

  function handlePublicationStatusChange(
    status:
      ProductCreatePublicationStatus,
  ): void {
    if (
      isFormLocked
    ) {
      return;
    }


    setValues(
      (
        current,
      ) => {
        if (
          current.publicationStatus ===
          status
        ) {
          return current;
        }


        return {
          ...current,

          publicationStatus:
            status,
        };
      },
    );
  }


  /* =========================================================================
     IMAGES CHANGE
     ========================================================================= */

  function handleImagesChange(
    nextImages:
      readonly ProductCreateImageInput[],
  ): void {
    if (
      isFormLocked
    ) {
      return;
    }


    setImages([
      ...nextImages,
    ]);
  }


  /* =========================================================================
     PREVIEW
     ========================================================================= */

  const preview =
    useMemo(
      () =>
        createProductPreview(
          values,
          images,
          pageData.store
            .currency,
        ),
      [
        values,
        images,
        pageData.store.currency,
      ],
    );


  /* =========================================================================
     QR STATE
     ========================================================================= */

  const qrState =
    useMemo(
      () =>
        createQrState(
          state,
          pageData,
        ),
      [
        state,
        pageData,
      ],
    );


  /* =========================================================================
     IMAGES SERIALIZED
     ========================================================================= */

  const serializedImages =
    useMemo(
      () =>
        JSON.stringify(
          images,
        ),
      [
        images,
      ],
    );


  /* =========================================================================
     SUBMIT GUARD
     ========================================================================= */

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    if (
      isFormLocked
    ) {
      event.preventDefault();
    }
  }


  /* =========================================================================
     LABELS
     ========================================================================= */

  const breadcrumbLabel =
    isEditMode
      ? "Modifier le produit"
      : "Ajouter un produit";


  const pageTitle =
    isEditMode
      ? "Modifier le produit"
      : "Ajouter un produit";


  const pageSubtitle =
    isEditMode
      ? "Mettez à jour les informations de votre produit sans modifier son identité ni son QR Code."
      : "Renseignez les informations de votre produit pour le mettre en vente.";


  const detailRoute =
    getEditProductDetailRoute(
      pageData,
    );


  /* =========================================================================
     EDIT INTENT
     ========================================================================= */

  const editSubmitIntent =
    values.publicationStatus ===
      "DRAFT"
      ? "draft"
      : "publish";


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className={styles.page}
      aria-busy={isPending}
    >
      {/* ===================================================================
          TECHNICAL DATA
          =================================================================== */}

      <input
        type="hidden"
        name={
          PRODUCT_CREATE_FORM_FIELDS
            .submissionId
        }
        value={submissionId}
      />


      <input
        type="hidden"
        name={
          PRODUCT_CREATE_FORM_FIELDS
            .publicationStatus
        }
        value={
          values.publicationStatus
        }
      />


      <input
        type="hidden"
        name={
          PRODUCT_CREATE_FORM_FIELDS
            .images
        }
        value={serializedImages}
      />


      {isEditMode ? (
        <>
          <input
            type="hidden"
            name={
              PRODUCT_FORM_MODE_FIELD
            }
            value="edit"
          />

          <input
            type="hidden"
            name={
              PRODUCT_FORM_PRODUCT_ID_FIELD
            }
            value={
              pageData.initialData
                .productId
            }
          />
        </>
      ) : (
        <input
          type="hidden"
          name={
            PRODUCT_FORM_MODE_FIELD
          }
          value="create"
        />
      )}


      {/* ===================================================================
          BREADCRUMB
          =================================================================== */}

      <nav
        className={
          styles.breadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <Link
          href={
            routes.gestionnaire
              .products
          }
          className={
            styles.breadcrumbLink
          }
        >
          Produits
        </Link>


        <ChevronRight
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
          className={
            styles.breadcrumbSeparator
          }
        />


        <span
          className={
            styles.breadcrumbCurrent
          }
          aria-current="page"
        >
          {breadcrumbLabel}
        </span>
      </nav>


      {/* ===================================================================
          PAGE HEADER
          =================================================================== */}

      <header
        className={
          styles.pageHeader
        }
      >
        <div
          className={
            styles.pageHeaderContent
          }
        >
          <h1
            className={
              styles.pageTitle
            }
          >
            {pageTitle}
          </h1>


          <p
            className={
              styles.pageSubtitle
            }
          >
            {pageSubtitle}
          </p>
        </div>


        {/* ===============================================================
            HEADER ACTIONS
            =============================================================== */}

        <div
          className={
            styles.pageActions
          }
        >
          {isSuccess &&
          state.data ? (
            <Link
              href={
                state.data
                  .detailRoute
              }
              className={
                styles.primaryAction
              }
            >
              <span>
                Voir le produit
              </span>

              <ChevronRight
                size={18}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          ) : isEditMode ? (
            <>
              <Link
                href={detailRoute}
                className={
                  styles.secondaryAction
                }
              >
                <span>
                  Annuler
                </span>
              </Link>


              <button
                type="submit"
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .intent
                }
                value={
                  editSubmitIntent
                }
                formNoValidate={
                  editSubmitIntent ===
                  "draft"
                }
                disabled={
                  isPending
                }
                className={
                  styles.primaryAction
                }
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={
                        styles.loadingIcon
                      }
                    />

                    <span>
                      Enregistrement...
                    </span>
                  </>
                ) : (
                  <>
                    <Save
                      size={17}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Enregistrer les modifications
                    </span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* =========================================================
                  DRAFT
                  ========================================================= */}

              <button
                type="submit"
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .intent
                }
                value="draft"
                formNoValidate
                disabled={
                  isPending
                }
                className={
                  styles.secondaryAction
                }
              >
                {isPending ? (
                  <LoaderCircle
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={
                      styles.loadingIcon
                    }
                  />
                ) : (
                  <Save
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                )}

                <span>
                  Enregistrer comme brouillon
                </span>
              </button>


              {/* =========================================================
                  PUBLISH
                  ========================================================= */}

              <button
                type="submit"
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .intent
                }
                value="publish"
                disabled={
                  isPending
                }
                className={
                  styles.primaryAction
                }
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={
                        styles.loadingIcon
                      }
                    />

                    <span>
                      Publication...
                    </span>
                  </>
                ) : (
                  <>
                    <Send
                      size={17}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Publier le produit
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </header>


      {/* ===================================================================
          SERVER MESSAGE
          =================================================================== */}

      {state.status !==
        "idle" &&
      state.message ? (
        <div
          className={
            getMessageClassName(
              state.status,
            )
          }
          role={
            state.status ===
            "success"
              ? "status"
              : "alert"
          }
          aria-live={
            state.status ===
            "success"
              ? "polite"
              : "assertive"
          }
        >
          <span
            className={
              styles.formMessageIcon
            }
            aria-hidden="true"
          >
            {state.status ===
            "success" ? (
              <CheckCircle2
                size={20}
                strokeWidth={1.9}
              />
            ) : (
              <AlertCircle
                size={20}
                strokeWidth={1.9}
              />
            )}
          </span>

          <span
            className={
              styles.formMessageText
            }
          >
            {state.message}
          </span>
        </div>
      ) : null}


      {/* ===================================================================
          MAIN GRID
          =================================================================== */}

      <div
        className={
          styles.contentGrid
        }
      >
        {/* ===============================================================
            LEFT COLUMN
            =============================================================== */}

        <div
          className={
            styles.leftColumn
          }
        >
          <ProduitInformationsSection
            values={values}
            categories={
              pageData.categories
            }
            brand={
              isEditMode
                ? pageData.initialData
                    .brand
                : pageData.brand
            }
            fieldErrors={
              fieldErrors
            }
            disabled={
              isFormLocked
            }
            onFieldChange={
              handleFieldChange
            }
          />


          <ProduitPrixStockSection
            values={values}
            currency={
              pageData.store
                .currency
            }
            units={
              pageData.units
            }
            fieldErrors={
              fieldErrors
            }
            disabled={
              isFormLocked
            }
            onFieldChange={
              handleFieldChange
            }
          />


          <ProduitDetailsSection
            values={values}
            fieldErrors={
              fieldErrors
            }
            disabled={
              isFormLocked
            }
            onFieldChange={
              handleFieldChange
            }
          />
        </div>


        {/* ===============================================================
            RIGHT COLUMN
            =============================================================== */}

        <aside
          className={
            styles.rightColumn
          }
          aria-label="Images, aperçu, QR Code et statut du produit"
        >
          <ProduitImagesSection
            images={images}
            fieldErrors={
              fieldErrors
            }
            imageErrors={
              state.imageErrors
            }
            disabled={
              isFormLocked
            }
            onImagesChange={
              handleImagesChange
            }
          />


          <ProduitPreviewQrStatus
            preview={preview}
            publicationStatus={
              values.publicationStatus
            }
            qrState={qrState}
            fieldErrors={
              fieldErrors
            }
            disabled={
              isFormLocked
            }
            successData={
              state.status ===
              "success"
                ? state.data
                : null
            }
            onPublicationStatusChange={
              handlePublicationStatusChange
            }
          />
        </aside>
      </div>


      {/* ===================================================================
          MOBILE ACTIONS
          =================================================================== */}

      {!isSuccess ? (
        <div
          className={
            styles.mobileActions
          }
          aria-label="Actions du produit"
        >
          {isEditMode ? (
            <>
              <Link
                href={detailRoute}
                className={
                  styles.mobileSecondaryAction
                }
              >
                Annuler
              </Link>


              <button
                type="submit"
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .intent
                }
                value={
                  editSubmitIntent
                }
                formNoValidate={
                  editSubmitIntent ===
                  "draft"
                }
                disabled={
                  isPending
                }
                className={
                  styles.mobilePrimaryAction
                }
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={
                        styles.loadingIcon
                      }
                    />

                    <span>
                      Enregistrement...
                    </span>
                  </>
                ) : (
                  <>
                    <Save
                      size={17}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Enregistrer
                    </span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .intent
                }
                value="draft"
                formNoValidate
                disabled={
                  isPending
                }
                className={
                  styles.mobileSecondaryAction
                }
              >
                {isPending ? (
                  <LoaderCircle
                    size={17}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={
                      styles.loadingIcon
                    }
                  />
                ) : (
                  <Save
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                )}

                <span>
                  Brouillon
                </span>
              </button>


              <button
                type="submit"
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .intent
                }
                value="publish"
                disabled={
                  isPending
                }
                className={
                  styles.mobilePrimaryAction
                }
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      size={18}
                      strokeWidth={2}
                      aria-hidden="true"
                      className={
                        styles.loadingIcon
                      }
                    />

                    <span>
                      Publication...
                    </span>
                  </>
                ) : (
                  <>
                    <Send
                      size={17}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />

                    <span>
                      Publier
                    </span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      ) : null}


      {/* ===================================================================
          ACCESSIBILITY — PENDING
          =================================================================== */}

      <span
        className={
          styles.srOnly
        }
        role="status"
        aria-live="polite"
      >
        {isPending
          ? isEditMode
            ? "Mise à jour du produit en cours."
            : "Enregistrement du produit en cours."
          : ""}
      </span>
    </form>
  );
}