"use client";

import {
  BookOpenCheck,
  FlaskConical,
  Scale,
  Sparkles,
} from "lucide-react";

import {
  PRODUCT_CREATE_FORM_FIELDS,
  PRODUCT_CREATE_LIMITS,
  type ProductCreateFieldErrors,
  type ProductCreateFormValues,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";

import styles from "@/app/gestionnaire/(espace-prive)/produits/ajouter/ajouter-produit.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAILS SUPPLÉMENTAIRES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/ajouter/
 * ProduitDetailsSection.tsx
 *
 * RÔLE :
 *
 * Afficher la carte :
 *
 * Détails supplémentaires
 *
 * avec :
 *
 * - ingrédients ;
 * - poids / contenance ;
 * - mode d'utilisation.
 *
 * IMPORTANT :
 *
 * Ces champs complètent la fiche publique du produit.
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne fait aucune requête réseau ;
 * - ne connaît pas storeId ;
 * - ne connaît pas managerId ;
 * - ne génère pas le QR ;
 * - ne modifie pas le stock ;
 * - ne publie pas le produit ;
 * - ne contient aucune donnée fictive ;
 * - ne rend aucun de ces champs obligatoire.
 *
 * La validation définitive reste dans :
 *
 * product-create-schema.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

type EditableDetailsField =
  | "ingredients"
  | "weightContent"
  | "usageInstructions";


export interface ProduitDetailsSectionProps {
  values:
    ProductCreateFormValues;

  fieldErrors:
    ProductCreateFieldErrors;

  disabled:
    boolean;

  onFieldChange:
    (
      field:
        EditableDetailsField,

      value:
        string,
    ) => void;
}


/* ==========================================================================
   HELPERS — PREMIÈRE ERREUR
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
   HELPERS — FIELD CLASS
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
   HELPERS — CONTROL CLASS
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
   HELPERS — TEXTAREA CLASS
   ========================================================================== */

function createTextareaControlClassName(
  hasError:
    boolean,
): string {
  return [
    styles.textareaControl,

    hasError
      ? styles.controlError
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
   COMPONENT
   ========================================================================== */

export default function ProduitDetailsSection({
  values,
  fieldErrors,
  disabled,
  onFieldChange,
}: ProduitDetailsSectionProps) {
  /* =========================================================================
     ERRORS
     ========================================================================= */

  const ingredientsError =
    getFirstError(
      fieldErrors.ingredients,
    );


  const weightContentError =
    getFirstError(
      fieldErrors.weightContent,
    );


  const usageInstructionsError =
    getFirstError(
      fieldErrors.usageInstructions,
    );


  /* =========================================================================
     IDS — INGREDIENTS
     ========================================================================= */

  const ingredientsId =
    "product-create-ingredients";


  const ingredientsErrorId =
    `${ingredientsId}-error`;


  const ingredientsHelpId =
    `${ingredientsId}-help`;


  const ingredientsCounterId =
    `${ingredientsId}-counter`;


  /* =========================================================================
     IDS — WEIGHT / CONTENT
     ========================================================================= */

  const weightContentId =
    "product-create-weight-content";


  const weightContentErrorId =
    `${weightContentId}-error`;


  const weightContentHelpId =
    `${weightContentId}-help`;


  const weightContentCounterId =
    `${weightContentId}-counter`;


  /* =========================================================================
     IDS — USAGE
     ========================================================================= */

  const usageInstructionsId =
    "product-create-usage-instructions";


  const usageInstructionsErrorId =
    `${usageInstructionsId}-error`;


  const usageInstructionsHelpId =
    `${usageInstructionsId}-help`;


  const usageInstructionsCounterId =
    `${usageInstructionsId}-counter`;


  /* =========================================================================
     COUNTERS
     ========================================================================= */

  const ingredientsLength =
    values.ingredients.length;


  const weightContentLength =
    values.weightContent.length;


  const usageInstructionsLength =
    values.usageInstructions.length;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className={
        styles.card
      }
      aria-labelledby="product-create-details-title"
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
            <Sparkles
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
              id="product-create-details-title"
              className={
                styles.cardTitle
              }
            >
              Détails supplémentaires
            </h2>

            <p
              className={
                styles.cardSubtitle
              }
            >
              Ajoutez les informations utiles pour mieux présenter le produit à vos clientes.
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
            INGREDIENTS
            ================================================================= */}

        <div
          className={
            createFieldClassName(
              Boolean(
                ingredientsError,
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
                ingredientsId
              }
              className={
                styles.fieldLabel
              }
            >
              Ingrédients

              <span
                className={
                  styles.optionalLabel
                }
              >
                Facultatif
              </span>
            </label>

            <span
              id={
                ingredientsCounterId
              }
              className={
                styles.fieldCounter
              }
              aria-live="polite"
            >
              {ingredientsLength}/
              {
                PRODUCT_CREATE_LIMITS
                  .ingredients
                  .max
              }
            </span>
          </div>


          <div
            className={
              createTextareaControlClassName(
                Boolean(
                  ingredientsError,
                ),
              )
            }
          >
            <span
              className={
                styles.textareaIcon
              }
              aria-hidden="true"
            >
              <FlaskConical
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <textarea
              id={
                ingredientsId
              }
              name={
                PRODUCT_CREATE_FORM_FIELDS
                  .ingredients
              }
              value={
                values.ingredients
              }
              onChange={
                (
                  event,
                ) =>
                  onFieldChange(
                    "ingredients",
                    event
                      .currentTarget
                      .value,
                  )
              }
              placeholder="Indiquez la composition ou les principaux ingrédients du produit..."
              rows={5}
              maxLength={
                PRODUCT_CREATE_LIMITS
                  .ingredients
                  .max
              }
              disabled={disabled}
              aria-invalid={
                ingredientsError
                  ? true
                  : undefined
              }
              aria-describedby={
                [
                  ingredientsHelpId,
                  ingredientsCounterId,

                  ingredientsError
                    ? ingredientsErrorId
                    : null,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )
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
              id={
                ingredientsHelpId
              }
              className={
                styles.fieldHelp
              }
            >
              Indiquez uniquement les informations réelles figurant sur le produit ou fournies officiellement par la marque.
            </p>
          </div>


          {ingredientsError ? (
            <p
              id={
                ingredientsErrorId
              }
              className={
                styles.fieldErrorMessage
              }
              role="alert"
            >
              {ingredientsError}
            </p>
          ) : null}
        </div>


        {/* =================================================================
            WEIGHT / CONTENT
            ================================================================= */}

        <div
          className={
            createFieldClassName(
              Boolean(
                weightContentError,
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
                weightContentId
              }
              className={
                styles.fieldLabel
              }
            >
              Poids / contenance

              <span
                className={
                  styles.optionalLabel
                }
              >
                Facultatif
              </span>
            </label>

            <span
              id={
                weightContentCounterId
              }
              className={
                styles.fieldCounter
              }
              aria-live="polite"
            >
              {weightContentLength}/
              {
                PRODUCT_CREATE_LIMITS
                  .weightContent
                  .max
              }
            </span>
          </div>


          <div
            className={
              createControlClassName(
                Boolean(
                  weightContentError,
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
              <Scale
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <input
              id={
                weightContentId
              }
              name={
                PRODUCT_CREATE_FORM_FIELDS
                  .weightContent
              }
              type="text"
              value={
                values.weightContent
              }
              onChange={
                (
                  event,
                ) =>
                  onFieldChange(
                    "weightContent",
                    event
                      .currentTarget
                      .value,
                  )
              }
              placeholder="Ex. 500 ml, 250 g, 30 ml..."
              autoComplete="off"
              maxLength={
                PRODUCT_CREATE_LIMITS
                  .weightContent
                  .max
              }
              disabled={disabled}
              aria-invalid={
                weightContentError
                  ? true
                  : undefined
              }
              aria-describedby={
                [
                  weightContentHelpId,
                  weightContentCounterId,

                  weightContentError
                    ? weightContentErrorId
                    : null,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )
              }
              className={
                styles.input
              }
            />
          </div>


          <p
            id={
              weightContentHelpId
            }
            className={
              styles.fieldHelp
            }
          >
            Indiquez la quantité telle qu’elle apparaît sur l’emballage du produit.
          </p>


          {weightContentError ? (
            <p
              id={
                weightContentErrorId
              }
              className={
                styles.fieldErrorMessage
              }
              role="alert"
            >
              {weightContentError}
            </p>
          ) : null}
        </div>


        {/* =================================================================
            USAGE INSTRUCTIONS
            ================================================================= */}

        <div
          className={
            createFieldClassName(
              Boolean(
                usageInstructionsError,
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
                usageInstructionsId
              }
              className={
                styles.fieldLabel
              }
            >
              Mode d’utilisation

              <span
                className={
                  styles.optionalLabel
                }
              >
                Facultatif
              </span>
            </label>

            <span
              id={
                usageInstructionsCounterId
              }
              className={
                styles.fieldCounter
              }
              aria-live="polite"
            >
              {usageInstructionsLength}/
              {
                PRODUCT_CREATE_LIMITS
                  .usageInstructions
                  .max
              }
            </span>
          </div>


          <div
            className={
              createTextareaControlClassName(
                Boolean(
                  usageInstructionsError,
                ),
              )
            }
          >
            <span
              className={
                styles.textareaIcon
              }
              aria-hidden="true"
            >
              <BookOpenCheck
                size={18}
                strokeWidth={1.8}
              />
            </span>

            <textarea
              id={
                usageInstructionsId
              }
              name={
                PRODUCT_CREATE_FORM_FIELDS
                  .usageInstructions
              }
              value={
                values.usageInstructions
              }
              onChange={
                (
                  event,
                ) =>
                  onFieldChange(
                    "usageInstructions",
                    event
                      .currentTarget
                      .value,
                  )
              }
              placeholder="Expliquez comment utiliser correctement le produit..."
              rows={6}
              maxLength={
                PRODUCT_CREATE_LIMITS
                  .usageInstructions
                  .max
              }
              disabled={disabled}
              aria-invalid={
                usageInstructionsError
                  ? true
                  : undefined
              }
              aria-describedby={
                [
                  usageInstructionsHelpId,
                  usageInstructionsCounterId,

                  usageInstructionsError
                    ? usageInstructionsErrorId
                    : null,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )
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
              id={
                usageInstructionsHelpId
              }
              className={
                styles.fieldHelp
              }
            >
              Utilisez les recommandations officielles du produit et évitez d’ajouter des conseils non vérifiés.
            </p>
          </div>


          {usageInstructionsError ? (
            <p
              id={
                usageInstructionsErrorId
              }
              className={
                styles.fieldErrorMessage
              }
              role="alert"
            >
              {usageInstructionsError}
            </p>
          ) : null}
        </div>


        {/* =================================================================
            INFORMATION BLOCK
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
            <BookOpenCheck
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
              Informations visibles sur la fiche produit
            </strong>

            <p>
              Ces détails pourront être affichés aux clientes lorsqu’elles consulteront le produit, notamment après avoir scanné son QR Code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}