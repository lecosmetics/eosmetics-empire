"use client";

import {
  FileText,
  Layers3,
  Package2,
  Tag,
} from "lucide-react";

import {
  PRODUCT_CREATE_FORM_FIELDS,
  PRODUCT_CREATE_LIMITS,
  type ProductCreateCategoryOption,
  type ProductCreateFieldErrors,
  type ProductCreateFormValues,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";

import styles from "@/app/gestionnaire/(espace-prive)/produits/ajouter/ajouter-produit.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — INFORMATIONS GÉNÉRALES DU PRODUIT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/ajouter/
 * ProduitInformationsSection.tsx
 *
 * RÔLE :
 *
 * Afficher uniquement la première carte du formulaire :
 *
 * Informations générales
 *
 * - Nom du produit
 * - Catégorie
 * - Marque
 * - Description
 *
 * IMPORTANT :
 *
 * - aucune catégorie fictive ;
 * - aucune marque fictive ;
 * - aucune logique Prisma ;
 * - aucune logique QR ;
 * - aucune logique de stock ;
 * - aucune requête réseau ;
 * - aucune donnée de démonstration ;
 * - aucune logique d'autorisation.
 *
 * Les catégories sont reçues depuis le serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

type EditableInformationField =
  | "name"
  | "categoryId"
  | "description";


export interface ProduitInformationsSectionProps {
  values:
    ProductCreateFormValues;

  categories:
    readonly ProductCreateCategoryOption[];

  /**
   * Marque officielle fournie par le serveur.
   *
   * Pour l'architecture actuelle :
   *
   * L&E Cosmetics
   *
   * Le Gestionnaire ne peut pas saisir arbitrairement une autre marque.
   */
  brand:
    string;

  fieldErrors:
    ProductCreateFieldErrors;

  disabled:
    boolean;

  onFieldChange:
    (
      field:
        EditableInformationField,

      value:
        string,
    ) => void;
}


/* ==========================================================================
   PREMIÈRE ERREUR
   ========================================================================== */

function getFirstError(
  errors:
    readonly string[] |
    undefined,
): string | null {
  return (
    errors?.[0] ??
    null
  );
}


/* ==========================================================================
   FIELD CLASS
   ========================================================================== */

function createFieldClassName(
  hasError:
    boolean,
): string {
  return [
    styles.field,
    hasError
      ? styles.fieldError
      : "",
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   CONTROL CLASS
   ========================================================================== */

function createControlClassName(
  hasError:
    boolean,

  extraClassName?:
    string,
): string {
  return [
    styles.control,
    hasError
      ? styles.controlError
      : "",
    extraClassName ??
      "",
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ProduitInformationsSection({
  values,
  categories,
  brand,
  fieldErrors,
  disabled,
  onFieldChange,
}: ProduitInformationsSectionProps) {
  /* =========================================================================
     ERRORS
     ========================================================================= */

  const nameError =
    getFirstError(
      fieldErrors.name,
    );


  const categoryError =
    getFirstError(
      fieldErrors.categoryId,
    );


  const brandError =
    getFirstError(
      fieldErrors.brand,
    );


  const descriptionError =
    getFirstError(
      fieldErrors.description,
    );


  /* =========================================================================
     IDS
     ========================================================================= */

  const nameId =
    "product-create-name";


  const nameErrorId =
    `${nameId}-error`;


  const nameCounterId =
    `${nameId}-counter`;


  const categoryId =
    "product-create-category";


  const categoryErrorId =
    `${categoryId}-error`;


  const brandId =
    "product-create-brand";


  const brandErrorId =
    `${brandId}-error`;


  const descriptionId =
    "product-create-description";


  const descriptionErrorId =
    `${descriptionId}-error`;


  const descriptionCounterId =
    `${descriptionId}-counter`;


  /* =========================================================================
     COUNTERS
     ========================================================================= */

  const nameLength =
    values.name.length;


  const descriptionLength =
    values.description.length;


  /* =========================================================================
     CATEGORY STATE
     ========================================================================= */

  const hasCategories =
    categories.length >
    0;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className={styles.card}
      aria-labelledby="product-create-general-information-title"
    >
      {/* ===================================================================
          CARD HEADER
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
            <Package2
              size={20}
              strokeWidth={1.9}
            />
          </span>

          <div
            className={
              styles.cardHeaderContent
            }
          >
            <h2
              id="product-create-general-information-title"
              className={
                styles.cardTitle
              }
            >
              Informations générales
            </h2>

            <p
              className={
                styles.cardSubtitle
              }
            >
              Renseignez les principales informations du produit.
            </p>
          </div>
        </div>
      </div>


      {/* ===================================================================
          CARD BODY
          =================================================================== */}

      <div
        className={
          styles.cardBody
        }
      >
        {/* =================================================================
            PRODUCT NAME
            ================================================================= */}

        <div
          className={
            createFieldClassName(
              Boolean(
                nameError,
              ),
            )
          }
        >
          <div
            className={
              styles.fieldLabelRow
            }
          >
            <label
              htmlFor={nameId}
              className={
                styles.fieldLabel
              }
            >
              Nom du produit

              <span
                className={
                  styles.requiredMark
                }
                aria-hidden="true"
              >
                *
              </span>
            </label>

            <span
              id={nameCounterId}
              className={
                styles.fieldCounter
              }
              aria-live="polite"
            >
              {nameLength}/
              {
                PRODUCT_CREATE_LIMITS
                  .name
                  .max
              }
            </span>
          </div>


          <div
            className={
              createControlClassName(
                Boolean(
                  nameError,
                ),
              )
            }
          >
            <span
              className={
                styles.controlIcon
              }
              aria-hidden="true"
            >
              <Tag
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <input
              id={nameId}
              name={
                PRODUCT_CREATE_FORM_FIELDS
                  .name
              }
              type="text"
              value={values.name}
              onChange={
                (
                  event,
                ) =>
                  onFieldChange(
                    "name",
                    event
                      .currentTarget
                      .value,
                  )
              }
              placeholder="Nom du produit"
              autoComplete="off"
              maxLength={
                PRODUCT_CREATE_LIMITS
                  .name
                  .max
              }
              required
              disabled={disabled}
              aria-invalid={
                nameError
                  ? true
                  : undefined
              }
              aria-describedby={
                [
                  nameCounterId,
                  nameError
                    ? nameErrorId
                    : null,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  ) ||
                undefined
              }
              className={
                styles.input
              }
            />
          </div>


          {nameError ? (
            <p
              id={nameErrorId}
              className={
                styles.fieldErrorMessage
              }
              role="alert"
            >
              {nameError}
            </p>
          ) : null}
        </div>


        {/* =================================================================
            CATEGORY + BRAND GRID
            ================================================================= */}

        <div
          className={
            styles.twoColumnFields
          }
        >
          {/* ===============================================================
              CATEGORY
              =============================================================== */}

          <div
            className={
              createFieldClassName(
                Boolean(
                  categoryError,
                ),
              )
            }
          >
            <label
              htmlFor={categoryId}
              className={
                styles.fieldLabel
              }
            >
              Catégorie

              <span
                className={
                  styles.requiredMark
                }
                aria-hidden="true"
              >
                *
              </span>
            </label>


            <div
              className={
                createControlClassName(
                  Boolean(
                    categoryError,
                  ),
                  styles.selectControl,
                )
              }
            >
              <span
                className={
                  styles.controlIcon
                }
                aria-hidden="true"
              >
                <Layers3
                  size={18}
                  strokeWidth={1.8}
                />
              </span>

              <select
                id={categoryId}
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .categoryId
                }
                value={
                  values.categoryId
                }
                onChange={
                  (
                    event,
                  ) =>
                    onFieldChange(
                      "categoryId",
                      event
                        .currentTarget
                        .value,
                    )
                }
                required
                disabled={
                  disabled ||
                  !hasCategories
                }
                aria-invalid={
                  categoryError
                    ? true
                    : undefined
                }
                aria-describedby={
                  categoryError
                    ? categoryErrorId
                    : undefined
                }
                className={
                  styles.select
                }
              >
                <option value="">
                  {hasCategories
                    ? "Sélectionner une catégorie"
                    : "Aucune catégorie disponible"}
                </option>

                {categories.map(
                  (
                    category,
                  ) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </div>


            {categoryError ? (
              <p
                id={
                  categoryErrorId
                }
                className={
                  styles.fieldErrorMessage
                }
                role="alert"
              >
                {categoryError}
              </p>
            ) : !hasCategories ? (
              <p
                className={
                  styles.fieldHelp
                }
              >
                Aucune catégorie active n’est disponible pour le moment.
              </p>
            ) : null}
          </div>


          {/* ===============================================================
              BRAND
              =============================================================== */}

          <div
            className={
              createFieldClassName(
                Boolean(
                  brandError,
                ),
              )
            }
          >
            <label
              htmlFor={brandId}
              className={
                styles.fieldLabel
              }
            >
              Marque
            </label>


            <div
              className={
                createControlClassName(
                  Boolean(
                    brandError,
                  ),
                )
              }
            >
              <span
                className={
                  styles.controlIcon
                }
                aria-hidden="true"
              >
                <Tag
                  size={18}
                  strokeWidth={1.8}
                />
              </span>

              <input
                id={brandId}
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .brand
                }
                type="text"
                value={brand}
                readOnly
                disabled={disabled}
                maxLength={
                  PRODUCT_CREATE_LIMITS
                    .brand
                    .max
                }
                aria-invalid={
                  brandError
                    ? true
                    : undefined
                }
                aria-describedby={
                  brandError
                    ? brandErrorId
                    : undefined
                }
                className={[
                  styles.input,
                  styles.readOnlyInput,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
              />
            </div>


            <p
              className={
                styles.fieldHelp
              }
            >
              Marque officielle du produit.
            </p>


            {brandError ? (
              <p
                id={brandErrorId}
                className={
                  styles.fieldErrorMessage
                }
                role="alert"
              >
                {brandError}
              </p>
            ) : null}
          </div>
        </div>


        {/* =================================================================
            DESCRIPTION
            ================================================================= */}

        <div
          className={
            createFieldClassName(
              Boolean(
                descriptionError,
              ),
            )
          }
        >
          <div
            className={
              styles.fieldLabelRow
            }
          >
            <label
              htmlFor={
                descriptionId
              }
              className={
                styles.fieldLabel
              }
            >
              Description

              <span
                className={
                  styles.requiredMark
                }
                aria-hidden="true"
              >
                *
              </span>
            </label>

            <span
              id={
                descriptionCounterId
              }
              className={
                styles.fieldCounter
              }
              aria-live="polite"
            >
              {descriptionLength}/
              {
                PRODUCT_CREATE_LIMITS
                  .description
                  .max
              }
            </span>
          </div>


          <div
            className={[
              styles.textareaControl,
              descriptionError
                ? styles.controlError
                : "",
            ]
              .filter(
                Boolean,
              )
              .join(
                " ",
              )}
          >
            <span
              className={
                styles.textareaIcon
              }
              aria-hidden="true"
            >
              <FileText
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <textarea
              id={
                descriptionId
              }
              name={
                PRODUCT_CREATE_FORM_FIELDS
                  .description
              }
              value={
                values.description
              }
              onChange={
                (
                  event,
                ) =>
                  onFieldChange(
                    "description",
                    event
                      .currentTarget
                      .value,
                  )
              }
              placeholder="Décrivez votre produit..."
              rows={7}
              maxLength={
                PRODUCT_CREATE_LIMITS
                  .description
                  .max
              }
              required
              disabled={disabled}
              aria-invalid={
                descriptionError
                  ? true
                  : undefined
              }
              aria-describedby={
                [
                  descriptionCounterId,
                  descriptionError
                    ? descriptionErrorId
                    : null,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  ) ||
                undefined
              }
              className={
                styles.textarea
              }
            />
          </div>


          <div
            className={
              styles.fieldFooter
            }
          >
            <p
              className={
                styles.fieldHelp
              }
            >
              Présentez clairement le produit, ses caractéristiques et les informations utiles à la cliente.
            </p>
          </div>


          {descriptionError ? (
            <p
              id={
                descriptionErrorId
              }
              className={
                styles.fieldErrorMessage
              }
              role="alert"
            >
              {descriptionError}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}