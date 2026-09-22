

import {

  useCallback,

  useId,

  useMemo,

  useRef,

  useState,

  type ChangeEvent,

  type DragEvent,

  type KeyboardEvent,

} from "react";

import {

  AlertCircle,

  ArrowLeft,

  ArrowRight,

  CheckCircle2,

  ImageIcon,

  Images,

  Info,

  LoaderCircle,

  Star,

  Trash2,

  UploadCloud,

} from "lucide-react";

import {

  PRODUCT_IMAGE_ACCEPT_ATTRIBUTE,

  PRODUCT_IMAGE_MAX_FILES,

  PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,

  PRODUCT_IMAGE_UPLOAD_API_ROUTE,

  PRODUCT_IMAGE_UPLOAD_FORM_FIELD,

  PRODUCT_IMAGE_UPLOAD_GROUP_FORM_FIELD,

  canAddProductImageFiles,

  validateProductImageFileMetadata,

} from "@/lib/gestionnaire/produits/images/product-image-constants";

import type {

  ProductImageDeleteResponse,

  ProductImageUploadedItem,

  ProductImageUploadResponse,

} from "@/lib/gestionnaire/produits/images/product-image-types";

import {

  PRODUCT_CREATE_LIMITS,

  normalizeProductCreateImages,

  type ProductCreateFieldErrors,

  type ProductCreateImageFieldError,

  type ProductCreateImageInput,

} from "@/lib/gestionnaire/produits/ajouter/product-create-types";

import styles from "@/app/gestionnaire/(espace-prive)/produits/ajouter/ajouter-produit.module.css";



/**

 * ============================================================================

 * L&E COSMETICS EMPIRE

 * ESPACE GESTIONNAIRE — IMAGES DU PRODUIT — CRÉATION / MODIFICATION

 * ============================================================================

 *

 * Fichier :

 *

 * src/components/gestionnaire/produits/ajouter/ProduitImagesSection.tsx

 *

 * RESPONSABILITÉS :

 *

 * - sélectionner des images ;

 * - gérer le glisser-déposer ;

 * - vérifier type et taille avant upload ;

 * - envoyer les fichiers via l'API Gestionnaire sécurisée ;

 * - ne jamais envoyer storeId depuis le navigateur ;

 * - conserver fileId / storagePath / URL ;

 * - afficher les miniatures ;

 * - définir l'image principale ;

 * - modifier le texte alternatif ;

 * - réorganiser les images ;

 * - supprimer du Storage uniquement une nouvelle image temporaire ;
 * - conserver les images existantes jusqu'à la validation serveur ;

 * - transmettre l'état final à AjouterProduitForm ;

 * - afficher les erreurs de validation serveur.

 *

 * IMPORTANT :

 *

 * Les nouvelles images sont uploadées AVANT la création ou la modification Product.

 *

 * Les nouvelles images restent temporaires jusqu'à ce que :

 *

 * product-create-actions.ts

 *

 * valide leur appartenance à la boutique et crée ProductImage.

 *

 * ============================================================================

 */



/* ==========================================================================

   CONSTANTES

   ========================================================================== */

const MAX_IMAGES =

  Math.min(

    PRODUCT_IMAGE_MAX_FILES,

    PRODUCT_CREATE_LIMITS

      .images

      .max,

  );



const MAX_ALT_TEXT_LENGTH =

  PRODUCT_CREATE_LIMITS

    .imageAltText

    .max;



/* ==========================================================================

   PROPS

   ========================================================================== */

export interface ProduitImagesSectionProps {

  images:

    readonly ProductCreateImageInput[];

  fieldErrors:

    ProductCreateFieldErrors;

  imageErrors:

    readonly ProductCreateImageFieldError[];

  disabled:

    boolean;

  onImagesChange:

    (

      images:

        readonly ProductCreateImageInput[],

    ) => void;

}



/* ==========================================================================

   MESSAGE LOCAL

   ========================================================================== */

interface LocalMessage {

  type:

    | "error"

    | "success"

    | "information";

  message:

    string;

}



/* ==========================================================================

   HELPERS — FORMAT FICHIER

   ========================================================================== */

function formatFileSize(

  bytes:

    number,

): string {

  const megabyte =

    1024 *

    1024;



  if (

    bytes >=

    megabyte

  ) {

    return `${(

      bytes /

      megabyte

    ).toFixed(1)} Mo`;

  }



  return `${Math.max(

    1,

    Math.round(

      bytes /

      1024,

    ),

  )} Ko`;

}



/* ==========================================================================

   HELPERS — NOM DE FICHIER → ALT

   ========================================================================== */

function createDefaultAltText(

  fileName:

    string,

): string | null {

  const withoutExtension =

    fileName

      .replace(

        /\.[^.]+$/,

        "",

      )

      .replace(

        /[-_]+/g,

        " ",

      )

      .replace(

        /\s+/g,

        " ",

      )

      .trim();



  if (

    !withoutExtension

  ) {

    return null;

  }



  return withoutExtension.slice(

    0,

    MAX_ALT_TEXT_LENGTH,

  );

}



/* ==========================================================================

   HELPERS — IMAGE KEY

   ========================================================================== */

function getImageKey(

  image:

    ProductCreateImageInput,

  index:

    number,

): string {

  if (

    image.source ===
      "UPLOADED"

  ) {

    return `uploaded-${image.fileId}`;

  }



  return `existing-${image.id}-${index}`;

}



/* ==========================================================================

   HELPERS — ERROR ARRAY

   ========================================================================== */

function normalizeMessages(

  messages:

    readonly string[] |

    undefined,

): string[] {

  return (

    messages

      ?.filter(

        (

          message,

        ): message is string =>

          typeof message ===

            "string" &&

          message

            .trim()

            .length >

            0,

      )

      .map(

        (

          message,

        ) =>

          message.trim(),

      ) ??

    []

  );

}



/* ==========================================================================

   HELPERS — API ERROR

   ========================================================================== */

function getApiErrorMessage(

  payload:

    ProductImageUploadResponse |

    ProductImageDeleteResponse,

  fallback:

    string,

): string {

  if (

    payload.success ===

      false &&

    typeof payload.message ===

      "string" &&

    payload.message.trim()

  ) {

    return payload.message.trim();

  }



  return fallback;

}



/* ==========================================================================

   HELPERS — UPLOAD GROUP

   ========================================================================== */

function createUploadGroupId():

  string {

  if (

    typeof globalThis.crypto !==

      "undefined" &&

    typeof globalThis.crypto

      .randomUUID ===

      "function"

  ) {

    return `upload_${globalThis.crypto

      .randomUUID()

      .replace(

        /-/g,

        "",

      )}`;

  }



  return [

    "upload",

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

  ].join(

    "_",

  );

}



/* ==========================================================================

   HELPERS — NORMALISATION IMAGES

   ========================================================================== */

function normalizeImages(

  images:

    readonly ProductCreateImageInput[],

): ProductCreateImageInput[] {

  return normalizeProductCreateImages(

    images,

  );

}



/* ==========================================================================

   HELPERS — ALT POUR L'AFFICHAGE

   ========================================================================== */

function getImageDisplayAlt(

  image:

    ProductCreateImageInput,

  index:

    number,

): string {

  const altText =

    image.altText

      ?.trim();



  if (

    altText

  ) {

    return altText;

  }



  return `Image du produit ${index + 1}`;

}



/* ==========================================================================

   COMPONENT

   ========================================================================== */

export default function ProduitImagesSection({

  images,

  fieldErrors,

  imageErrors,

  disabled,

  onImagesChange,

}: ProduitImagesSectionProps) {

  /* =========================================================================

     IDS / REFS

     ========================================================================= */

  const inputId =

    useId();



  const fileInputRef =

    useRef<HTMLInputElement | null>(

      null,

    );



  const uploadGroupIdRef =

    useRef<string | null>(

      null,

    );



  /* =========================================================================

     LOCAL STATE

     ========================================================================= */

  const [

    isDragging,

    setIsDragging,

  ] =

    useState(

      false,

    );



  const [

    isUploading,

    setIsUploading,

  ] =

    useState(

      false,

    );



  const [

    deletingImageKey,

    setDeletingImageKey,

  ] =

    useState<string | null>(

      null,

    );



  const [

    localMessage,

    setLocalMessage,

  ] =

    useState<LocalMessage | null>(

      null,

    );



  /* =========================================================================

     NORMALIZED IMAGES

     ========================================================================= */

  const normalizedImages =

    useMemo(

      () =>

        normalizeImages(

          images,

        ),

      [

        images,

      ],

    );



  /* =========================================================================

     ERRORS

     ========================================================================= */

  const globalImageErrors =

    normalizeMessages(

      fieldErrors.images,

    );



  const hasGlobalImageErrors =

    globalImageErrors.length >

    0;



  const hasIndexedImageErrors =

    imageErrors.length >

    0;



  const hasAnyImageErrors =

    hasGlobalImageErrors ||

    hasIndexedImageErrors;



  /* =========================================================================

     LIMIT

     ========================================================================= */

  const hasReachedLimit =

    normalizedImages.length >=

      MAX_IMAGES ||

    !canAddProductImageFiles(

      normalizedImages.length,

      1,

    );



  /* =========================================================================

     BUSY

     ========================================================================= */

  const isBusy =

    disabled ||

    isUploading ||

    deletingImageKey !==

      null;



  /* =========================================================================

     COMMIT

     ========================================================================= */

  const commitImages =

    useCallback(

      (

        nextImages:

          readonly ProductCreateImageInput[],

      ) => {

        onImagesChange(

          normalizeImages(

            nextImages,

          ),

        );

      },

      [

        onImagesChange,

      ],

    );



  /* =========================================================================

     VALIDATION LOCALE

     ========================================================================= */

  const validateFiles =

    useCallback(

      (

        selectedFiles:

          readonly File[],

      ): {

        validFiles:

          File[];

        errors:

          string[];

      } => {

        if (

          selectedFiles.length ===

          0

        ) {

          return {

            validFiles:

              [],

            errors:

              [],

          };

        }



        if (

          normalizedImages.length +

            selectedFiles.length >

            MAX_IMAGES ||

          !canAddProductImageFiles(

            normalizedImages.length,

            selectedFiles.length,

          )

        ) {

          return {

            validFiles:

              [],

            errors: [

              `Vous pouvez ajouter au maximum ${MAX_IMAGES} images à ce produit.`,

            ],

          };

        }



        const validFiles:

          File[] =

            [];



        const errors:

          string[] =

            [];



        for (

          const file

          of selectedFiles

        ) {

          const validation =

            validateProductImageFileMetadata({

              name:

                file.name,

              type:

                file.type,

              size:

                file.size,

            });



          if (

            !validation.success

          ) {

            errors.push(

              validation.message,

            );

            continue;

          }



          validFiles.push(

            file,

          );

        }



        return {

          validFiles,

          errors,

        };

      },

      [

        normalizedImages.length,

      ],

    );



  /* =========================================================================

     UPLOAD

     ========================================================================= */

  const uploadFiles =

    useCallback(

      async (

        selectedFiles:

          readonly File[],

      ) => {

        if (

          disabled ||

          isUploading ||

          deletingImageKey !==

            null ||

          selectedFiles.length ===

            0

        ) {

          return;

        }



        setLocalMessage(

          null,

        );



        const validation =

          validateFiles(

            selectedFiles,

          );



        if (

          validation.errors.length >

          0

        ) {

          setLocalMessage({

            type:

              "error",

            message:

              validation.errors.join(

                " ",

              ),

          });

        }



        if (

          validation.validFiles

            .length ===

          0

        ) {

          return;

        }



        setIsUploading(

          true,

        );



        try {

          if (

            !uploadGroupIdRef

              .current

          ) {

            uploadGroupIdRef.current =

              createUploadGroupId();

          }



          const formData =

            new FormData();



          formData.set(

            PRODUCT_IMAGE_UPLOAD_GROUP_FORM_FIELD,

            uploadGroupIdRef.current,

          );



          validation.validFiles.forEach(

            (

              file,

            ) => {

              formData.append(

                PRODUCT_IMAGE_UPLOAD_FORM_FIELD,

                file,

                file.name,

              );

            },

          );



          const response =

            await fetch(

              PRODUCT_IMAGE_UPLOAD_API_ROUTE,

              {

                method:

                  "POST",

                body:

                  formData,

                credentials:

                  "same-origin",

                cache:

                  "no-store",

              },

            );



          let payload:

            ProductImageUploadResponse;



          try {

            payload =

              (

                await response.json()

              ) as ProductImageUploadResponse;

          } catch {

            throw new Error(

              "Le serveur a retourné une réponse invalide pendant l’envoi des images.",

            );

          }



          if (

            !response.ok ||

            payload.success !==

              true

          ) {

            throw new Error(

              getApiErrorMessage(

                payload,

                "Impossible d’envoyer les images pour le moment.",

              ),

            );

          }



          if (

            payload.images.length !==

            validation.validFiles

              .length

          ) {

            throw new Error(

              "Le serveur n’a pas retourné toutes les images envoyées.",

            );

          }



          const uploadedImages =

            payload.images.map(

              (

                uploaded:

                  ProductImageUploadedItem,

                index,

              ): ProductCreateImageInput => {

                const sourceFile =

                  validation

                    .validFiles[

                    index

                  ];



                const originalFileName =

                  uploaded.originalFileName ??

                  sourceFile?.name ??

                  null;



                return {

                  source:

                    "UPLOADED",

                  fileId:

                    uploaded.fileId,

                  storagePath:

                    uploaded.storagePath,

                  url:

                    uploaded.url,

                  originalFileName,

                  mimeType:

                    uploaded.mimeType ??

                    sourceFile?.type ??

                    null,

                  size:

                    uploaded.size ??

                    sourceFile?.size ??

                    null,

                  altText:

                    sourceFile

                      ? createDefaultAltText(

                          sourceFile.name,

                        )

                      : null,

                  position:

                    normalizedImages.length +

                    index,

                  isPrimary:

                    normalizedImages.length ===

                      0 &&

                    index ===

                      0,

                };

              },

            );



          commitImages([

            ...normalizedImages,

            ...uploadedImages,

          ]);



          setLocalMessage({

            type:

              "success",

            message:

              uploadedImages.length ===

                1

                ? "L’image a été ajoutée avec succès."

                : `${uploadedImages.length} images ont été ajoutées avec succès.`,

          });

        } catch (

          error

        ) {

          setLocalMessage({

            type:

              "error",

            message:

              error instanceof

                Error &&

              error.message.trim()

                ? error.message

                : "Impossible d’envoyer les images pour le moment.",

          });

        } finally {

          setIsUploading(

            false,

          );



          if (

            fileInputRef

              .current

          ) {

            fileInputRef.current.value =

              "";

          }

        }

      },

      [

        commitImages,

        deletingImageKey,

        disabled,

        isUploading,

        normalizedImages,

        validateFiles,

      ],

    );



  /* =========================================================================

     FILE INPUT

     ========================================================================= */

  function handleFileInputChange(

    event:

      ChangeEvent<HTMLInputElement>,

  ): void {

    const selectedFiles =

      Array.from(

        event.currentTarget

          .files ??

        [],

      );



    void uploadFiles(

      selectedFiles,

    );

  }



  /* =========================================================================

     OPEN FILE PICKER

     ========================================================================= */

  function openFilePicker():

    void {

    if (

      isBusy ||

      hasReachedLimit

    ) {

      return;

    }



    fileInputRef

      .current

      ?.click();

  }



  /* =========================================================================

     KEYBOARD

     ========================================================================= */

  function handleDropzoneKeyDown(

    event:

      KeyboardEvent<HTMLDivElement>,

  ): void {

    if (

      event.key !==

        "Enter" &&

      event.key !==

        " "

    ) {

      return;

    }



    event.preventDefault();

    openFilePicker();

  }



  /* =========================================================================

     DRAG

     ========================================================================= */

  function handleDragEnter(

    event:

      DragEvent<HTMLDivElement>,

  ): void {

    event.preventDefault();

    event.stopPropagation();



    if (

      !isBusy &&

      !hasReachedLimit

    ) {

      setIsDragging(

        true,

      );

    }

  }



  function handleDragOver(

    event:

      DragEvent<HTMLDivElement>,

  ): void {

    event.preventDefault();

    event.stopPropagation();



    if (

      isBusy ||

      hasReachedLimit

    ) {

      return;

    }



    event.dataTransfer.dropEffect =

      "copy";



    setIsDragging(

      true,

    );

  }



  function handleDragLeave(

    event:

      DragEvent<HTMLDivElement>,

  ): void {

    event.preventDefault();

    event.stopPropagation();



    const relatedTarget =

      event.relatedTarget;



    if (

      relatedTarget instanceof

        Node &&

      event.currentTarget.contains(

        relatedTarget,

      )

    ) {

      return;

    }



    setIsDragging(

      false,

    );

  }



  function handleDrop(

    event:

      DragEvent<HTMLDivElement>,

  ): void {

    event.preventDefault();

    event.stopPropagation();



    setIsDragging(

      false,

    );



    if (

      isBusy ||

      hasReachedLimit

    ) {

      return;

    }



    void uploadFiles(

      Array.from(

        event.dataTransfer

          .files,

      ),

    );

  }



  /* =========================================================================

     PRINCIPAL IMAGE

     ========================================================================= */

  function handleSetPrimary(

    targetIndex:

      number,

  ): void {

    if (

      isBusy

    ) {

      return;

    }



    commitImages(

      normalizedImages.map(

        (

          image,

          index,

        ): ProductCreateImageInput => ({

          ...image,

          isPrimary:

            index ===

            targetIndex,

        }),

      ),

    );



    setLocalMessage({

      type:

        "information",

      message:

        "L’image principale a été mise à jour.",

    });

  }



  /* =========================================================================

     ALT TEXT

     ========================================================================= */

  function handleAltTextChange(

    targetIndex:

      number,

    value:

      string,

  ): void {

    if (

      disabled

    ) {

      return;

    }



    const normalizedValue =

      value.slice(

        0,

        MAX_ALT_TEXT_LENGTH,

      );



    commitImages(

      normalizedImages.map(

        (

          image,

          index,

        ) =>

          index ===

          targetIndex

            ? {

                ...image,

                altText:

                  normalizedValue,

              }

            : image,

      ),

    );

  }



  /* =========================================================================

     MOVE IMAGE

     ========================================================================= */

  function moveImage(

    fromIndex:

      number,

    toIndex:

      number,

  ): void {

    if (

      isBusy ||

      fromIndex ===

        toIndex ||

      toIndex <

        0 ||

      toIndex >=

        normalizedImages.length

    ) {

      return;

    }



    const nextImages =

      [

        ...normalizedImages,

      ];



    const [

      movedImage,

    ] =

      nextImages.splice(

        fromIndex,

        1,

      );



    if (

      !movedImage

    ) {

      return;

    }



    nextImages.splice(

      toIndex,

      0,

      movedImage,

    );



    commitImages(

      nextImages,

    );

  }



  /* =========================================================================

     DELETE STORAGE IMAGE

     ========================================================================= */

  const deleteUploadedImage =

    useCallback(

      async (

        image:

          ProductCreateImageInput,

      ) => {

        /**
         * Une image EXISTING est déjà persistée en base.
         *
         * Elle ne doit jamais être supprimée directement du Storage depuis
         * le navigateur pendant une modification. Sa suppression définitive
         * est gérée côté serveur lors de l'enregistrement du produit.
         */
        if (

          image.source !==
            "UPLOADED"

        ) {

          return;

        }



        const storagePath =

          image.storagePath

            .trim();



        if (

          !storagePath

        ) {

          throw new Error(

            "Le chemin de stockage de cette image est invalide.",

          );

        }



        const response =

          await fetch(

            PRODUCT_IMAGE_UPLOAD_API_ROUTE,

            {

              method:

                "DELETE",

              credentials:

                "same-origin",

              cache:

                "no-store",

              headers: {

                "Content-Type":

                  "application/json",

              },

              body:

                JSON.stringify({

                  storagePath,

                }),

            },

          );



        let payload:

          ProductImageDeleteResponse;



        try {

          payload =

            (

              await response.json()

            ) as ProductImageDeleteResponse;

        } catch {

          throw new Error(

            "Le serveur a retourné une réponse invalide pendant la suppression de l’image.",

          );

        }



        if (

          !response.ok ||

          payload.success !==

            true

        ) {

          throw new Error(

            getApiErrorMessage(

              payload,

              "Impossible de supprimer cette image du stockage.",

            ),

          );

        }

      },

      [],

    );



  /* =========================================================================

     REMOVE IMAGE

     ========================================================================= */

  async function handleRemoveImage(

    targetIndex:

      number,

  ): Promise<void> {

    if (

      isBusy

    ) {

      return;

    }



    const image =

      normalizedImages[

        targetIndex

      ];



    if (

      !image

    ) {

      return;

    }



    const imageKey =

      getImageKey(

        image,

        targetIndex,

      );



    setDeletingImageKey(

      imageKey,

    );



    setLocalMessage(

      null,

    );



    try {

      /**
       * Nouvelle image uploadée :
       * elle est encore temporaire et peut être supprimée immédiatement du
       * Storage lorsqu'elle est retirée du formulaire.
       *
       * Image existante :
       * elle est uniquement retirée de l'état du formulaire. Le backend
       * décidera de sa suppression réelle lors de l'UPDATE autorisé.
       */
      if (

        image.source ===
          "UPLOADED"

      ) {

        await deleteUploadedImage(

          image,

        );

      }



      commitImages(

        normalizedImages.filter(

          (

            _image,

            index,

          ) =>

            index !==

            targetIndex,

        ),

      );



      setLocalMessage({

        type:

          "information",

        message:

          "L’image a été retirée du produit.",

      });

    } catch (

      error

    ) {

      setLocalMessage({

        type:

          "error",

        message:

          error instanceof

            Error &&

          error.message.trim()

            ? error.message

            : "Impossible de retirer cette image.",

      });

    } finally {

      setDeletingImageKey(

        null,

      );

    }

  }



  /* =========================================================================

     RENDER

     ========================================================================= */

  return (

    <section

      className={

        styles.card

      }

      aria-labelledby="product-create-images-title"

    >

      {/* ===================================================================

          HEADER

          =================================================================== */}

      <div

        className={

          styles.cardHeader

        }

      >

        <div

          className={

            styles.cardHeaderMain

          }

        >

          <span

            className={

              styles.cardHeaderIcon

            }

            aria-hidden="true"

          >

            <Images

              size={20}

              strokeWidth={1.9}

            />

          </span>

          <div

            className={

              styles.cardHeaderContent

            }

          >

            <div

              className={

                styles.cardTitleRow

              }

            >

              <h2

                id="product-create-images-title"

                className={

                  styles.cardTitle

                }

              >

                Images du produit

              </h2>

              <span

                className={

                  styles.imagesCountBadge

                }

              >

                {

                  normalizedImages

                    .length

                }

                /

                {MAX_IMAGES}

              </span>

            </div>

            <p

              className={

                styles.cardSubtitle

              }

            >

              Ajoutez des images claires du produit et choisissez le visuel principal.

            </p>

          </div>

        </div>

      </div>



      {/* ===================================================================

          BODY

          =================================================================== */}

      <div

        className={

          styles.cardBody

        }

      >

        {/* =================================================================

            FILE INPUT

            ================================================================= */}

        <input

          ref={

            fileInputRef

          }

          id={inputId}

          type="file"

          accept={

            PRODUCT_IMAGE_ACCEPT_ATTRIBUTE

          }

          multiple

          disabled={

            isBusy ||

            hasReachedLimit

          }

          onChange={

            handleFileInputChange

          }

          className={

            styles.hiddenFileInput

          }

          tabIndex={-1}

          aria-hidden="true"

        />



        {/* =================================================================

            DROPZONE

            ================================================================= */}

        <div

          className={[

            styles.imageDropzone,

            isDragging

              ? styles.imageDropzoneDragging

              : "",

            isBusy

              ? styles.imageDropzoneDisabled

              : "",

            hasReachedLimit

              ? styles.imageDropzoneLimit

              : "",

            hasAnyImageErrors

              ? styles.imageDropzoneError

              : "",

          ]

            .filter(

              Boolean,

            )

            .join(

              " ",

            )}

          role="button"

          tabIndex={

            isBusy ||

            hasReachedLimit

              ? -1

              : 0

          }

          aria-disabled={

            isBusy ||

            hasReachedLimit

          }

          aria-describedby="product-create-images-help"

          onClick={

            openFilePicker

          }

          onKeyDown={

            handleDropzoneKeyDown

          }

          onDragEnter={

            handleDragEnter

          }

          onDragOver={

            handleDragOver

          }

          onDragLeave={

            handleDragLeave

          }

          onDrop={

            handleDrop

          }

        >

          <span

            className={

              styles.imageDropzoneIcon

            }

            aria-hidden="true"

          >

            {isUploading ? (

              <LoaderCircle

                size={28}

                strokeWidth={1.8}

                className={

                  styles.loadingIcon

                }

              />

            ) : (

              <UploadCloud

                size={28}

                strokeWidth={1.7}

              />

            )}

          </span>



          <div

            className={

              styles.imageDropzoneContent

            }

          >

            <strong

              className={

                styles.imageDropzoneTitle

              }

            >

              {isUploading

                ? "Envoi des images en cours..."

                : hasReachedLimit

                  ? "Limite d’images atteinte"

                  : isDragging

                    ? "Déposez les images ici"

                    : "Ajouter des images"}

            </strong>

            <p

              className={

                styles.imageDropzoneText

              }

            >

              {hasReachedLimit

                ? `Vous avez atteint la limite de ${MAX_IMAGES} images.`

                : "Glissez-déposez vos images ici ou cliquez pour parcourir vos fichiers."}

            </p>



            <div

              className={

                styles.imageDropzoneMeta

              }

            >

              <span>

                JPEG

              </span>

              <span>

                PNG

              </span>

              <span>

                WebP

              </span>

              <span>

                AVIF

              </span>

              <span>

                Max.{" "}

                {formatFileSize(

                  PRODUCT_IMAGE_MAX_FILE_SIZE_BYTES,

                )}{" "}

                / image

              </span>

            </div>

          </div>



          {!hasReachedLimit ? (

            <span

              className={

                styles.imageDropzoneButton

              }

            >

              {isUploading

                ? "Envoi..."

                : "Choisir"}

            </span>

          ) : null}

        </div>



        <p

          id="product-create-images-help"

          className={

            styles.fieldHelp

          }

        >

          Jusqu’à {MAX_IMAGES} images peuvent être ajoutées. La première image devient automatiquement principale si aucune autre n’est sélectionnée.

        </p>



        {/* =================================================================

            GLOBAL SERVER ERRORS

            ================================================================= */}

        {globalImageErrors.length >

        0 ? (

          <div

            className={

              styles.imageErrors

            }

            role="alert"

          >

            {globalImageErrors.map(

              (

                message,

                index,

              ) => (

                <p

                  key={`${message}-${index}`}

                  className={

                    styles.fieldErrorMessage

                  }

                >

                  <AlertCircle

                    size={15}

                    aria-hidden="true"

                  />

                  <span>

                    {message}

                  </span>

                </p>

              ),

            )}

          </div>

        ) : null}



        {/* =================================================================

            LOCAL MESSAGE

            ================================================================= */}

        {localMessage ? (

          <div

            className={[

              styles.imageMessage,

              localMessage.type ===

              "error"

                ? styles.imageMessageError

                : "",

              localMessage.type ===

              "success"

                ? styles.imageMessageSuccess

                : "",

              localMessage.type ===

              "information"

                ? styles.imageMessageInformation

                : "",

            ]

              .filter(

                Boolean,

              )

              .join(

                " ",

              )}

            role={

              localMessage.type ===

              "error"

                ? "alert"

                : "status"

            }

            aria-live="polite"

          >

            <span

              className={

                styles.imageMessageIcon

              }

              aria-hidden="true"

            >

              {localMessage.type ===

              "success" ? (

                <CheckCircle2

                  size={18}

                />

              ) : localMessage.type ===

                "error" ? (

                <AlertCircle

                  size={18}

                />

              ) : (

                <Info

                  size={18}

                />

              )}

            </span>

            <span>

              {

                localMessage.message

              }

            </span>

          </div>

        ) : null}



        {/* =================================================================

            GALLERY

            ================================================================= */}

        {normalizedImages.length >

        0 ? (

          <div

            className={

              styles.imageGallery

            }

          >

            <div

              className={

                styles.imageGalleryHeader

              }

            >

              <div>

                <strong

                  className={

                    styles.imageGalleryTitle

                  }

                >

                  Galerie

                </strong>

                <p

                  className={

                    styles.imageGallerySubtitle

                  }

                >

                  Organisez vos visuels avant d’enregistrer le produit.

                </p>

              </div>

              <span

                className={

                  styles.imageGalleryCount

                }

              >

                {

                  normalizedImages

                    .length

                }{" "}

                {normalizedImages.length ===

                1

                  ? "image"

                  : "images"}

              </span>

            </div>



            <div

              className={

                styles.imageGrid

              }

            >

              {normalizedImages.map(

                (

                  image,

                  index,

                ) => {

                  const imageKey =

                    getImageKey(

                      image,

                      index,

                    );



                  const isDeleting =

                    deletingImageKey ===

                    imageKey;



                  const isFirst =

                    index ===

                    0;



                  const isLast =

                    index ===

                    normalizedImages.length -

                      1;



                  const indexedErrors =

                    imageErrors.filter(

                      (

                        error,

                      ) =>

                        error.index ===

                        index,

                    );



                  return (

                    <article

                      key={

                        imageKey

                      }

                      className={[

                        styles.imageCard,

                        image.isPrimary

                          ? styles.imageCardPrimary

                          : "",

                        isDeleting

                          ? styles.imageCardDeleting

                          : "",

                        indexedErrors.length >

                        0

                          ? styles.imageCardError

                          : "",

                      ]

                        .filter(

                          Boolean,

                        )

                        .join(

                          " ",

                        )}

                    >

                      {/* ===================================================

                          IMAGE PREVIEW

                          =================================================== */}

                      <div

                        className={

                          styles.imagePreview

                        }

                      >

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img

                          src={

                            image.url

                          }

                          alt={

                            getImageDisplayAlt(

                              image,

                              index,

                            )

                          }

                          className={

                            styles.imagePreviewImage

                          }

                          loading="lazy"

                          decoding="async"

                        />



                        <div

                          className={

                            styles.imagePreviewTop

                          }

                        >

                          <span

                            className={

                              styles.imagePositionBadge

                            }

                          >

                            {index + 1}

                          </span>



                          {image.isPrimary ? (

                            <span

                              className={

                                styles.imagePrimaryBadge

                              }

                            >

                              <Star

                                size={13}

                                fill="currentColor"

                                aria-hidden="true"

                              />

                              Principale

                            </span>

                          ) : null}

                        </div>

                      </div>



                      {/* ===================================================

                          CARD BODY

                          =================================================== */}

                      <div

                        className={

                          styles.imageCardBody

                        }

                      >

                        <div

                          className={

                            styles.imageCardHeader

                          }

                        >

                          <div>

                            <span

                              className={

                                styles.imageCardEyebrow

                              }

                            >

                              Image {index + 1}

                            </span>

                            <strong

                              className={

                                styles.imageCardTitle

                              }

                            >

                              {image.isPrimary

                                ? "Image principale"

                                : "Image secondaire"}

                            </strong>

                          </div>



                          <ImageIcon

                            size={18}

                            strokeWidth={1.7}

                            aria-hidden="true"

                            className={

                              styles.imageCardHeaderIcon

                            }

                          />

                        </div>



                        {/* =================================================

                            ALT TEXT

                            ================================================= */}

                        <div

                          className={

                            styles.imageAltField

                          }

                        >

                          <div

                            className={

                              styles.fieldLabelRow

                            }

                          >

                            <label

                              htmlFor={`${inputId}-alt-${index}`}

                              className={

                                styles.imageAltLabel

                              }

                            >

                              Texte alternatif

                            </label>

                            <span

                              className={

                                styles.fieldCounter

                              }

                            >

                              {

                                (

                                  image.altText ??

                                  ""

                                ).length

                              }

                              /

                              {

                                MAX_ALT_TEXT_LENGTH

                              }

                            </span>

                          </div>



                          <input

                            id={`${inputId}-alt-${index}`}

                            type="text"

                            value={

                              image.altText ??

                              ""

                            }

                            onChange={

                              (

                                event,

                              ) =>

                                handleAltTextChange(

                                  index,

                                  event

                                    .currentTarget

                                    .value,

                                )

                            }

                            maxLength={

                              MAX_ALT_TEXT_LENGTH

                            }

                            placeholder="Décrivez brièvement l’image"

                            autoComplete="off"

                            disabled={

                              disabled ||

                              isDeleting

                            }

                            className={

                              styles.imageAltInput

                            }

                          />

                        </div>



                        {/* =================================================

                            PRIMARY

                            ================================================= */}

                        {image.isPrimary ? (

                          <div

                            className={

                              styles.imagePrimaryState

                            }

                          >

                            <Star

                              size={15}

                              fill="currentColor"

                              aria-hidden="true"

                            />

                            <span>

                              Image principale

                            </span>

                          </div>

                        ) : (

                          <button

                            type="button"

                            disabled={

                              isBusy

                            }

                            className={

                              styles.imagePrimaryButton

                            }

                            onClick={

                              () =>

                                handleSetPrimary(

                                  index,

                                )

                            }

                          >

                            <Star

                              size={15}

                              aria-hidden="true"

                            />

                            <span>

                              Définir comme principale

                            </span>

                          </button>

                        )}



                        {/* =================================================

                            INDEXED SERVER ERRORS

                            ================================================= */}

                        {indexedErrors.length >

                        0 ? (

                          <div

                            className={

                              styles.imageIndexedErrors

                            }

                            role="alert"

                          >

                            {indexedErrors.map(

                              (

                                error,

                                errorIndex,

                              ) => (

                                <p

                                  key={`${error.message}-${errorIndex}`}

                                  className={

                                    styles.fieldErrorMessage

                                  }

                                >

                                  <AlertCircle

                                    size={14}

                                    aria-hidden="true"

                                  />

                                  <span>

                                    {

                                      error.message

                                    }

                                  </span>

                                </p>

                              ),

                            )}

                          </div>

                        ) : null}



                        {/* =================================================

                            ACTIONS

                            ================================================= */}

                        <div

                          className={

                            styles.imageActions

                          }

                        >

                          <div

                            className={

                              styles.imageOrderActions

                            }

                          >

                            <button

                              type="button"

                              disabled={

                                isBusy ||

                                isFirst

                              }

                              onClick={

                                () =>

                                  moveImage(

                                    index,

                                    index -

                                      1,

                                  )

                              }

                              className={

                                styles.imageOrderButton

                              }

                              aria-label={`Déplacer l’image ${index + 1} vers la gauche`}

                              title="Déplacer vers la gauche"

                            >

                              <ArrowLeft

                                size={16}

                                aria-hidden="true"

                              />

                            </button>



                            <button

                              type="button"

                              disabled={

                                isBusy ||

                                isLast

                              }

                              onClick={

                                () =>

                                  moveImage(

                                    index,

                                    index +

                                      1,

                                  )

                              }

                              className={

                                styles.imageOrderButton

                              }

                              aria-label={`Déplacer l’image ${index + 1} vers la droite`}

                              title="Déplacer vers la droite"

                            >

                              <ArrowRight

                                size={16}

                                aria-hidden="true"

                              />

                            </button>

                          </div>



                          <button

                            type="button"

                            disabled={

                              isBusy

                            }

                            onClick={

                              () => {

                                void handleRemoveImage(

                                  index,

                                );

                              }

                            }

                            className={

                              styles.imageDeleteButton

                            }

                          >

                            {isDeleting ? (

                              <LoaderCircle

                                size={15}

                                className={

                                  styles.loadingIcon

                                }

                                aria-hidden="true"

                              />

                            ) : (

                              <Trash2

                                size={15}

                                aria-hidden="true"

                              />

                            )}

                            <span>

                              {isDeleting

                                ? "Suppression..."

                                : "Retirer"}

                            </span>

                          </button>

                        </div>

                      </div>

                    </article>

                  );

                },

              )}

            </div>

          </div>

        ) : (

          /* ===============================================================

              EMPTY STATE

              =============================================================== */

          <div

            className={

              styles.imageEmptyState

            }

          >

            <span

              className={

                styles.imageEmptyIcon

              }

              aria-hidden="true"

            >

              <Images

                size={23}

                strokeWidth={1.6}

              />

            </span>

            <div

              className={

                styles.imageEmptyContent

              }

            >

              <strong>

                Aucune image ajoutée

              </strong>

              <p>

                Ajoutez des photos nettes du produit pour améliorer sa présentation.

              </p>

            </div>

          </div>

        )}



        {/* =================================================================

            SECURITY INFO

            ================================================================= */}

        <div

          className={

            styles.sectionInformation

          }

        >

          <span

            className={

              styles.sectionInformationIcon

            }

            aria-hidden="true"

          >

            <Info

              size={18}

              strokeWidth={1.8}

            />

          </span>

          <div

            className={

              styles.sectionInformationContent

            }

          >

            <strong>

              Images sécurisées

            </strong>

            <p>

              Les fichiers passent par l’API privée Gestionnaire. La boutique utilisée pour le stockage est déterminée côté serveur et n’est jamais choisie depuis ce formulaire.

            </p>

          </div>

        </div>

      </div>

    </section>

  );

}