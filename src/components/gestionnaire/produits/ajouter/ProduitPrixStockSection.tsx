"use client";

import {
  BadgeDollarSign,
  Boxes,
  PackageSearch,
  Ruler,
  Tags,
} from "lucide-react";

import {
  PRODUCT_CREATE_FORM_FIELDS,
  PRODUCT_CREATE_LIMITS,
  type ProductCreateFieldErrors,
  type ProductCreateFormValues,
  type ProductCreateUnitOption,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";

import styles from "@/app/gestionnaire/(espace-prive)/produits/ajouter/ajouter-produit.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PRIX ET STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/ajouter/
 * ProduitPrixStockSection.tsx
 *
 * RÔLE :
 *
 * Afficher la carte :
 *
 * Prix et stock
 *
 * avec :
 *
 * - prix de vente ;
 * - prix barré / prix de référence ;
 * - devise réelle de la boutique ;
 * - quantité disponible ;
 * - unité officielle lorsqu'elle existe.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne choisit jamais la devise enregistrée en base ;
 * - ne reçoit jamais storeId ;
 * - ne modifie jamais le stock directement ;
 * - ne crée aucun mouvement de stock ;
 * - ne calcule aucun statut Prisma ;
 * - ne crée aucune fausse unité ;
 * - ne fait aucune requête réseau ;
 * - ne fait aucune requête Prisma.
 *
 * La devise est reçue depuis le serveur pour AFFICHAGE.
 *
 * product-create-actions.ts récupère à nouveau la devise réelle
 * de Store.currency avant l'enregistrement.
 *
 * ============================================================================
 */


/* ==========================================================================
   TYPES
   ========================================================================== */

type EditablePricingStockField =
  | "price"
  | "compareAtPrice"
  | "stockQuantity"
  | "unit";


export interface ProduitPrixStockSectionProps {
  values:
    ProductCreateFormValues;

  /**
   * Devise réelle fournie par :
   *
   * Store.currency
   *
   * Cette valeur est uniquement informative côté client.
   */
  currency:
    string;

  /**
   * Liste métier officielle des unités.
   *
   * Peut être vide tant qu'aucune nomenclature officielle
   * n'a été configurée.
   */
  units:
    readonly ProductCreateUnitOption[];

  fieldErrors:
    ProductCreateFieldErrors;

  disabled:
    boolean;

  onFieldChange:
    (
      field:
        EditablePricingStockField,

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
   HELPERS — DEVISE
   ========================================================================== */

function normalizeCurrencyLabel(
  value:
    string,
): string {
  const normalized =
    value
      .trim()
      .toUpperCase();


  return (
    normalized ||
    "—"
  );
}


/* ==========================================================================
   HELPERS — PRIX NUMÉRIQUE
   ========================================================================== */

/**
 * Conversion uniquement destinée à l'aperçu de la promotion dans l'UI.
 *
 * Le serveur reste la source de vérité.
 */

function parsePreviewMoney(
  value:
    string,
): number | null {
  const normalized =
    value
      .trim()
      .replace(
        /\u00a0/g,
        "",
      )
      .replace(
        /\s+/g,
        "",
      )
      .replace(
        ",",
        ".",
      );


  if (
    !normalized
  ) {
    return null;
  }


  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalized,
    )
  ) {
    return null;
  }


  const amount =
    Number(
      normalized,
    );


  if (
    !Number.isFinite(
      amount,
    ) ||
    amount <
      0
  ) {
    return null;
  }


  return amount;
}


/* ==========================================================================
   HELPERS — POURCENTAGE PROMOTION
   ========================================================================== */

function calculateDiscountPercentage(
  price:
    number | null,

  compareAtPrice:
    number | null,
): number | null {
  if (
    price ===
      null ||
    compareAtPrice ===
      null ||
    compareAtPrice <=
      0 ||
    compareAtPrice <=
      price
  ) {
    return null;
  }


  const percentage =
    (
      (
        compareAtPrice -
        price
      ) /
      compareAtPrice
    ) *
    100;


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        percentage,
      ),
    ),
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ProduitPrixStockSection({
  values,
  currency,
  units,
  fieldErrors,
  disabled,
  onFieldChange,
}: ProduitPrixStockSectionProps) {
  /* =========================================================================
     ERRORS
     ========================================================================= */

  const priceError =
    getFirstError(
      fieldErrors.price,
    );


  const compareAtPriceError =
    getFirstError(
      fieldErrors.compareAtPrice,
    );


  const stockError =
    getFirstError(
      fieldErrors.stockQuantity,
    );


  const unitError =
    getFirstError(
      fieldErrors.unit,
    );


  /* =========================================================================
     IDS
     ========================================================================= */

  const priceId =
    "product-create-price";


  const priceErrorId =
    `${priceId}-error`;


  const priceHelpId =
    `${priceId}-help`;


  const compareAtPriceId =
    "product-create-compare-at-price";


  const compareAtPriceErrorId =
    `${compareAtPriceId}-error`;


  const compareAtPriceHelpId =
    `${compareAtPriceId}-help`;


  const stockId =
    "product-create-stock-quantity";


  const stockErrorId =
    `${stockId}-error`;


  const stockHelpId =
    `${stockId}-help`;


  const unitId =
    "product-create-unit";


  const unitErrorId =
    `${unitId}-error`;


  const unitHelpId =
    `${unitId}-help`;


  /* =========================================================================
     DEVISE
     ========================================================================= */

  const currencyLabel =
    normalizeCurrencyLabel(
      currency,
    );


  /* =========================================================================
     UNITÉS
     ========================================================================= */

  const hasUnits =
    units.length >
    0;


  /* =========================================================================
     PROMOTION PREVIEW
     ========================================================================= */

  const previewPrice =
    parsePreviewMoney(
      values.price,
    );


  const previewCompareAtPrice =
    parsePreviewMoney(
      values.compareAtPrice,
    );


  const discountPercentage =
    calculateDiscountPercentage(
      previewPrice,
      previewCompareAtPrice,
    );


  const hasPromotionPreview =
    discountPercentage !==
    null;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className={
        styles.card
      }
      aria-labelledby="product-create-pricing-stock-title"
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
            <BadgeDollarSign
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
              id="product-create-pricing-stock-title"
              className={
                styles.cardTitle
              }
            >
              Prix et stock
            </h2>

            <p
              className={
                styles.cardSubtitle
              }
            >
              Définissez le prix de vente et la quantité disponible dans votre boutique.
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
            PRIX
            ================================================================= */}

        <div
          className={
            styles.twoColumnFields
          }
        >
          {/* ===============================================================
              PRIX DE VENTE
              =============================================================== */}

          <div
            className={
              createFieldClassName(
                Boolean(
                  priceError,
                ),
              )
            }
          >
            <label
              htmlFor={
                priceId
              }
              className={
                styles.fieldLabel
              }
            >
              Prix de vente

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
                    priceError,
                  ),
                  styles.moneyControl,
                )
              }
            >
              <span
                className={
                  styles.controlIcon
                }
                aria-hidden="true"
              >
                <BadgeDollarSign
                  size={18}
                  strokeWidth={1.8}
                />
              </span>


              <input
                id={priceId}
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .price
                }
                type="text"
                inputMode="decimal"
                value={
                  values.price
                }
                onChange={
                  (
                    event,
                  ) =>
                    onFieldChange(
                      "price",
                      event
                        .currentTarget
                        .value,
                    )
                }
                placeholder="0"
                autoComplete="off"
                required
                disabled={disabled}
                aria-invalid={
                  priceError
                    ? true
                    : undefined
                }
                aria-describedby={
                  [
                    priceHelpId,

                    priceError
                      ? priceErrorId
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


              <span
                className={
                  styles.currencySuffix
                }
                aria-label={`Devise ${currencyLabel}`}
              >
                {currencyLabel}
              </span>
            </div>


            <p
              id={priceHelpId}
              className={
                styles.fieldHelp
              }
            >
              Prix actuellement appliqué par votre boutique.
            </p>


            {priceError ? (
              <p
                id={priceErrorId}
                className={
                  styles.fieldErrorMessage
                }
                role="alert"
              >
                {priceError}
              </p>
            ) : null}
          </div>


          {/* ===============================================================
              PRIX BARRÉ
              =============================================================== */}

          <div
            className={
              createFieldClassName(
                Boolean(
                  compareAtPriceError,
                ),
              )
            }
          >
            <label
              htmlFor={
                compareAtPriceId
              }
              className={
                styles.fieldLabel
              }
            >
              Prix barré

              <span
                className={
                  styles.optionalLabel
                }
              >
                Facultatif
              </span>
            </label>


            <div
              className={
                createControlClassName(
                  Boolean(
                    compareAtPriceError,
                  ),
                  styles.moneyControl,
                )
              }
            >
              <span
                className={
                  styles.controlIcon
                }
                aria-hidden="true"
              >
                <Tags
                  size={18}
                  strokeWidth={1.8}
                />
              </span>


              <input
                id={
                  compareAtPriceId
                }
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .compareAtPrice
                }
                type="text"
                inputMode="decimal"
                value={
                  values.compareAtPrice
                }
                onChange={
                  (
                    event,
                  ) =>
                    onFieldChange(
                      "compareAtPrice",
                      event
                        .currentTarget
                        .value,
                    )
                }
                placeholder="0"
                autoComplete="off"
                disabled={disabled}
                aria-invalid={
                  compareAtPriceError
                    ? true
                    : undefined
                }
                aria-describedby={
                  [
                    compareAtPriceHelpId,

                    compareAtPriceError
                      ? compareAtPriceErrorId
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


              <span
                className={
                  styles.currencySuffix
                }
                aria-label={`Devise ${currencyLabel}`}
              >
                {currencyLabel}
              </span>
            </div>


            <p
              id={
                compareAtPriceHelpId
              }
              className={
                styles.fieldHelp
              }
            >
              Utilisez-le uniquement si le produit possède un ancien prix supérieur au prix de vente.
            </p>


            {compareAtPriceError ? (
              <p
                id={
                  compareAtPriceErrorId
                }
                className={
                  styles.fieldErrorMessage
                }
                role="alert"
              >
                {compareAtPriceError}
              </p>
            ) : null}
          </div>
        </div>


        {/* =================================================================
            PROMOTION INFO
            ================================================================= */}

        {hasPromotionPreview ? (
          <div
            className={
              styles.promotionPreview
            }
            role="status"
            aria-live="polite"
          >
            <span
              className={
                styles.promotionPreviewIcon
              }
              aria-hidden="true"
            >
              <Tags
                size={17}
                strokeWidth={1.9}
              />
            </span>

            <div
              className={
                styles.promotionPreviewContent
              }
            >
              <strong
                className={
                  styles.promotionPreviewTitle
                }
              >
                Promotion détectée
              </strong>

              <span
                className={
                  styles.promotionPreviewText
                }
              >
                Réduction estimée :{" "}
                {discountPercentage} %
              </span>
            </div>
          </div>
        ) : null}


        {/* =================================================================
            STOCK + UNITÉ
            ================================================================= */}

        <div
          className={
            styles.twoColumnFields
          }
        >
          {/* ===============================================================
              STOCK
              =============================================================== */}

          <div
            className={
              createFieldClassName(
                Boolean(
                  stockError,
                ),
              )
            }
          >
            <label
              htmlFor={
                stockId
              }
              className={
                styles.fieldLabel
              }
            >
              Quantité en stock

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
                    stockError,
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
                <Boxes
                  size={18}
                  strokeWidth={1.8}
                />
              </span>


              <input
                id={stockId}
                name={
                  PRODUCT_CREATE_FORM_FIELDS
                    .stockQuantity
                }
                type="number"
                inputMode="numeric"
                value={
                  values.stockQuantity
                }
                onChange={
                  (
                    event,
                  ) =>
                    onFieldChange(
                      "stockQuantity",
                      event
                        .currentTarget
                        .value,
                    )
                }
                min={
                  PRODUCT_CREATE_LIMITS
                    .stockQuantity
                    .min
                }
                max={
                  PRODUCT_CREATE_LIMITS
                    .stockQuantity
                    .max
                }
                step={1}
                placeholder="0"
                autoComplete="off"
                required
                disabled={disabled}
                aria-invalid={
                  stockError
                    ? true
                    : undefined
                }
                aria-describedby={
                  [
                    stockHelpId,

                    stockError
                      ? stockErrorId
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
              id={stockHelpId}
              className={
                styles.fieldHelp
              }
            >
              Quantité réellement disponible au moment de l’enregistrement.
            </p>


            {stockError ? (
              <p
                id={stockErrorId}
                className={
                  styles.fieldErrorMessage
                }
                role="alert"
              >
                {stockError}
              </p>
            ) : null}
          </div>


          {/* ===============================================================
              UNITÉ
              =============================================================== */}

          <div
            className={
              createFieldClassName(
                Boolean(
                  unitError,
                ),
              )
            }
          >
            <label
              htmlFor={unitId}
              className={
                styles.fieldLabel
              }
            >
              Unité

              <span
                className={
                  styles.optionalLabel
                }
              >
                Facultatif
              </span>
            </label>


            {hasUnits ? (
              <div
                className={
                  createControlClassName(
                    Boolean(
                      unitError,
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
                  <Ruler
                    size={18}
                    strokeWidth={1.8}
                  />
                </span>


                <select
                  id={unitId}
                  name={
                    PRODUCT_CREATE_FORM_FIELDS
                      .unit
                  }
                  value={
                    values.unit
                  }
                  onChange={
                    (
                      event,
                    ) =>
                      onFieldChange(
                        "unit",
                        event
                          .currentTarget
                          .value,
                      )
                  }
                  disabled={disabled}
                  aria-invalid={
                    unitError
                      ? true
                      : undefined
                  }
                  aria-describedby={
                    [
                      unitHelpId,

                      unitError
                        ? unitErrorId
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
                    styles.select
                  }
                >
                  <option value="">
                    Sélectionner une unité
                  </option>

                  {units.map(
                    (
                      unit,
                    ) => (
                      <option
                        key={
                          unit.value
                        }
                        value={
                          unit.value
                        }
                      >
                        {unit.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            ) : (
              /*
               * Aucune liste fictive.
               *
               * Tant qu'aucune nomenclature officielle n'est configurée,
               * on affiche clairement l'indisponibilité du champ.
               *
               * Un input hidden vide conserve néanmoins un FormData propre.
               */

              <>
                <input
                  type="hidden"
                  name={
                    PRODUCT_CREATE_FORM_FIELDS
                      .unit
                  }
                  value=""
                />

                <div
                  className={[
                    styles.control,
                    styles.controlUnavailable,
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )}
                  aria-disabled="true"
                >
                  <span
                    className={
                      styles.controlIcon
                    }
                    aria-hidden="true"
                  >
                    <PackageSearch
                      size={18}
                      strokeWidth={1.8}
                    />
                  </span>

                  <span
                    className={
                      styles.unavailableValue
                    }
                  >
                    Aucune unité configurée
                  </span>
                </div>
              </>
            )}


            <p
              id={unitHelpId}
              className={
                styles.fieldHelp
              }
            >
              {hasUnits
                ? "Sélectionnez l’unité officielle correspondant au produit."
                : "Aucune nomenclature d’unités n’est encore disponible."}
            </p>


            {unitError ? (
              <p
                id={unitErrorId}
                className={
                  styles.fieldErrorMessage
                }
                role="alert"
              >
                {unitError}
              </p>
            ) : null}
          </div>
        </div>


        {/* =================================================================
            STOCK INFORMATION
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
            <Boxes
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
              Suivi automatique du stock
            </strong>

            <p>
              La quantité enregistrée servira de stock initial du produit. Les mouvements suivants seront suivis dans la gestion du stock.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}