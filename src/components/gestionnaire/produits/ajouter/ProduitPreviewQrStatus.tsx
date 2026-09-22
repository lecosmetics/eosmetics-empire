"use client";

import Link from "next/link";

import {
  Archive,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  Eye,
  EyeOff,
  ImageOff,
  Package2,
  QrCode,
  Radio,
  ShieldCheck,
} from "lucide-react";

import {
  type ProductCreateFieldErrors,
  type ProductCreatePreview,
  type ProductCreatePublicationStatus,
  type ProductCreateQrState,
  type ProductCreateSuccessData,
} from "@/lib/gestionnaire/produits/ajouter/product-create-types";

import styles from "@/app/gestionnaire/(espace-prive)/produits/ajouter/ajouter-produit.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — APERÇU / QR / STATUT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/produits/ajouter/
 * ProduitPreviewQrStatus.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher un aperçu local du produit ;
 * - afficher l'image principale locale ;
 * - afficher le prix et le prix barré ;
 * - afficher la devise de la boutique ;
 * - afficher le véritable QR uniquement après création ;
 * - ne jamais afficher de faux QR avant l'enregistrement ;
 * - permettre de choisir le statut métier ;
 * - afficher les informations de succès après création.
 *
 * IMPORTANT :
 *
 * L'aperçu affiché ici :
 *
 * - n'est pas une publication ;
 * - n'écrit rien dans PostgreSQL ;
 * - ne réserve aucun stock ;
 * - ne crée aucun qrToken ;
 * - ne décide pas de l'autorisation publique.
 *
 * Le QR réel vient exclusivement du résultat retourné par le serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ProduitPreviewQrStatusProps {
  preview:
    ProductCreatePreview;

  publicationStatus:
    ProductCreatePublicationStatus;

  qrState:
    ProductCreateQrState;

  fieldErrors:
    ProductCreateFieldErrors;

  disabled:
    boolean;

  successData:
    ProductCreateSuccessData |
    null;

  onPublicationStatusChange:
    (
      status:
        ProductCreatePublicationStatus,
    ) => void;
}


/* ==========================================================================
   STATUS OPTION
   ========================================================================== */

interface PublicationStatusOption {
  value:
    ProductCreatePublicationStatus;

  title:
    string;

  description:
    string;

  icon:
    typeof Radio;
}


/* ==========================================================================
   STATUS OPTIONS
   ========================================================================== */

const PUBLICATION_STATUS_OPTIONS:
  readonly PublicationStatusOption[] = [
    {
      value:
        "PUBLISHED",

      title:
        "Publié",

      description:
        "Le produit sera visible publiquement lorsqu’il sera enregistré avec le bouton Publier.",

      icon:
        Eye,
    },

    {
      value:
        "DRAFT",

      title:
        "Brouillon",

      description:
        "Le produit reste privé et pourra être complété avant sa publication.",

      icon:
        CircleDashed,
    },

    {
      value:
        "INACTIVE",

      title:
        "Inactif",

      description:
        "Le produit est enregistré mais reste masqué de l’espace public.",

      icon:
        EyeOff,
    },
  ] as const;


/* ==========================================================================
   FIRST ERROR
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
   MONEY PARSER
   ========================================================================== */

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
   MONEY FORMATTER
   ========================================================================== */

function formatPreviewMoney(
  rawValue:
    string,

  currency:
    string,
): string {
  const amount =
    parsePreviewMoney(
      rawValue,
    );


  if (
    amount ===
    null
  ) {
    return `0 ${currency}`;
  }


  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();


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
  } catch {
    return `${amount.toLocaleString(
      "fr-FR",
    )} ${normalizedCurrency}`;
  }
}


/* ==========================================================================
   PROMOTION
   ========================================================================== */

function getPreviewDiscountPercentage(
  price:
    string,

  compareAtPrice:
    string,
): number | null {
  const currentPrice =
    parsePreviewMoney(
      price,
    );


  const referencePrice =
    parsePreviewMoney(
      compareAtPrice,
    );


  if (
    currentPrice ===
      null ||
    referencePrice ===
      null ||
    referencePrice <=
      currentPrice ||
    referencePrice <=
      0
  ) {
    return null;
  }


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (
          (
            referencePrice -
            currentPrice
          ) /
          referencePrice
        ) *
        100,
      ),
    ),
  );
}


/* ==========================================================================
   PREVIEW DESCRIPTION
   ========================================================================== */

function getPreviewDescription(
  value:
    string,
): string {
  const normalized =
    value.trim();


  if (
    !normalized
  ) {
    return "La description de votre produit apparaîtra ici.";
  }


  if (
    normalized.length <=
    180
  ) {
    return normalized;
  }


  return `${normalized.slice(
    0,
    177,
  )}...`;
}


/* ==========================================================================
   STATUS LABEL
   ========================================================================== */

function getPublicationStatusLabel(
  status:
    ProductCreatePublicationStatus,
): string {
  switch (
    status
  ) {
    case "DRAFT":
      return "Brouillon";

    case "INACTIVE":
      return "Inactif";

    case "PUBLISHED":
    default:
      return "Publié";
  }
}


/* ==========================================================================
   STATUS ICON
   ========================================================================== */

function PublicationStatusIcon({
  status,
}: {
  status:
    ProductCreatePublicationStatus;
}) {
  switch (
    status
  ) {
    case "DRAFT":
      return (
        <CircleDashed
          size={15}
          strokeWidth={2}
          aria-hidden="true"
        />
      );

    case "INACTIVE":
      return (
        <Archive
          size={15}
          strokeWidth={2}
          aria-hidden="true"
        />
      );

    case "PUBLISHED":
    default:
      return (
        <CheckCircle2
          size={15}
          strokeWidth={2}
          aria-hidden="true"
        />
      );
  }
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function ProduitPreviewQrStatus({
  preview,
  publicationStatus,
  qrState,
  fieldErrors,
  disabled,
  successData,
  onPublicationStatusChange,
}: ProduitPreviewQrStatusProps) {
  /* =========================================================================
     PREVIEW VALUES
     ========================================================================= */

  const displayName =
    preview.name
      .trim() ||
    "Nom du produit";


  const displayBrand =
    preview.brand
      .trim() ||
    "L&E Cosmetics";


  const displayDescription =
    getPreviewDescription(
      preview.description,
    );


  const currentPrice =
    formatPreviewMoney(
      preview.price,
      preview.currency,
    );


  const compareAtPriceValue =
    parsePreviewMoney(
      preview.compareAtPrice,
    );


  const currentPriceValue =
    parsePreviewMoney(
      preview.price,
    );


  const hasValidCompareAtPrice =
    currentPriceValue !==
      null &&
    compareAtPriceValue !==
      null &&
    compareAtPriceValue >
      currentPriceValue;


  const compareAtPrice =
    hasValidCompareAtPrice
      ? formatPreviewMoney(
          preview.compareAtPrice,
          preview.currency,
        )
      : null;


  const discountPercentage =
    getPreviewDiscountPercentage(
      preview.price,
      preview.compareAtPrice,
    );


  /* =========================================================================
     STATUS ERROR
     ========================================================================= */

  const statusError =
    getFirstError(
      fieldErrors.publicationStatus,
    );


  /* =========================================================================
     QR
     ========================================================================= */

  const qrIsReady =
    qrState.status ===
    "ready";


  const isPublicSuccess =
    successData
      ?.publicationStatus ===
    "PUBLISHED";


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <>
      {/* ===================================================================
          APERÇU PRODUIT
          =================================================================== */}

      <section
        className={
          styles.card
        }
        aria-labelledby="product-create-preview-title"
      >
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
                id="product-create-preview-title"
                className={
                  styles.cardTitle
                }
              >
                Aperçu du produit
              </h2>

              <p
                className={
                  styles.cardSubtitle
                }
              >
                Prévisualisez le rendu principal avant l’enregistrement.
              </p>
            </div>
          </div>
        </div>


        <div
          className={
            styles.cardBody
          }
        >
          <div
            className={
              styles.productPreview
            }
          >
            {/* =============================================================
                IMAGE
                ============================================================= */}

            <div
              className={
                styles.productPreviewMedia
              }
            >
              {preview.primaryImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={
                    preview.primaryImageUrl
                  }
                  alt={
                    displayName
                  }
                  className={
                    styles.productPreviewImage
                  }
                />
              ) : (
                <div
                  className={
                    styles.productPreviewImagePlaceholder
                  }
                >
                  <ImageOff
                    size={30}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />

                  <span>
                    Aucune image
                  </span>
                </div>
              )}


              <span
                className={[
                  styles.productPreviewStatus,

                  publicationStatus ===
                  "PUBLISHED"
                    ? styles.productPreviewStatusPublished
                    : "",

                  publicationStatus ===
                  "DRAFT"
                    ? styles.productPreviewStatusDraft
                    : "",

                  publicationStatus ===
                  "INACTIVE"
                    ? styles.productPreviewStatusInactive
                    : "",
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
              >
                <PublicationStatusIcon
                  status={
                    publicationStatus
                  }
                />

                {
                  getPublicationStatusLabel(
                    publicationStatus,
                  )
                }
              </span>
            </div>


            {/* =============================================================
                CONTENT
                ============================================================= */}

            <div
              className={
                styles.productPreviewContent
              }
            >
              <span
                className={
                  styles.productPreviewBrand
                }
              >
                {displayBrand}
              </span>

              <h3
                className={
                  styles.productPreviewName
                }
              >
                {displayName}
              </h3>

              <p
                className={
                  styles.productPreviewDescription
                }
              >
                {displayDescription}
              </p>


              {/* ===========================================================
                  PRICING
                  =========================================================== */}

              <div
                className={
                  styles.productPreviewPricing
                }
              >
                <div
                  className={
                    styles.productPreviewPriceRow
                  }
                >
                  <strong
                    className={
                      styles.productPreviewPrice
                    }
                  >
                    {currentPrice}
                  </strong>

                  {discountPercentage !==
                  null ? (
                    <span
                      className={
                        styles.productPreviewDiscount
                      }
                    >
                      -{discountPercentage}%
                    </span>
                  ) : null}
                </div>


                {compareAtPrice ? (
                  <span
                    className={
                      styles.productPreviewComparePrice
                    }
                  >
                    {compareAtPrice}
                  </span>
                ) : null}
              </div>
            </div>
          </div>


          <div
            className={
              styles.previewNotice
            }
          >
            <Eye
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <p>
              Cet aperçu est local. Le produit n’est réellement enregistré ou publié qu’après validation par le serveur.
            </p>
          </div>
        </div>
      </section>


      {/* ===================================================================
          QR CODE
          =================================================================== */}

      <section
        className={
          styles.card
        }
        aria-labelledby="product-create-qr-title"
      >
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
              <QrCode
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
                id="product-create-qr-title"
                className={
                  styles.cardTitle
                }
              >
                QR Code du produit
              </h2>

              <p
                className={
                  styles.cardSubtitle
                }
              >
                Identité stable permettant d’accéder à la fiche publique du produit.
              </p>
            </div>
          </div>
        </div>


        <div
          className={
            styles.cardBody
          }
        >
          {!qrIsReady ? (
            /* =============================================================
                AVANT ENREGISTREMENT
                ============================================================= */

            <div
              className={
                styles.qrPending
              }
            >
              <div
                className={
                  styles.qrPendingVisual
                }
              >
                <QrCode
                  size={48}
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
              </div>

              <div
                className={
                  styles.qrPendingContent
                }
              >
                <strong>
                  QR Code non généré
                </strong>

                <p>
                  {
                    qrState.message
                  }
                </p>
              </div>
            </div>
          ) : (
            /* =============================================================
                APRÈS ENREGISTREMENT
                ============================================================= */

            <div
              className={
                styles.qrReady
              }
            >
              {/* ===========================================================
                  VRAI QR SERVEUR
                  =========================================================== */}

              <div
                className={
                  styles.qrImageContainer
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    qrState.qrRoute
                  }
                  alt={`QR Code du produit ${displayName}`}
                  className={
                    styles.qrImage
                  }
                />
              </div>


              <div
                className={
                  styles.qrReadyContent
                }
              >
                <div
                  className={
                    styles.qrReadyHeading
                  }
                >
                  <CheckCircle2
                    size={18}
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <strong>
                    QR Code disponible
                  </strong>
                </div>


                <p
                  className={
                    styles.qrReadyDescription
                  }
                >
                  Ce QR reste associé au produit même si vous modifiez ensuite son prix, son stock, ses images ou sa description.
                </p>


                {/* =========================================================
                    PUBLIC ROUTE
                    ========================================================= */}

                <div
                  className={
                    styles.qrPublicRoute
                  }
                >
                  <span
                    className={
                      styles.qrPublicRouteLabel
                    }
                  >
                    Destination
                  </span>

                  <code
                    className={
                      styles.qrPublicRouteValue
                    }
                  >
                    {
                      qrState.publicProductRoute
                    }
                  </code>
                </div>


                {/* =========================================================
                    AVAILABILITY
                    ========================================================= */}

                {isPublicSuccess ? (
                  <div
                    className={
                      styles.qrAvailabilityPublic
                    }
                  >
                    <ShieldCheck
                      size={16}
                      aria-hidden="true"
                    />

                    <span>
                      La fiche publique peut être consultée.
                    </span>
                  </div>
                ) : (
                  <div
                    className={
                      styles.qrAvailabilityPrivate
                    }
                  >
                    <EyeOff
                      size={16}
                      aria-hidden="true"
                    />

                    <span>
                      Le QR existe, mais la fiche reste masquée tant que le produit n’est pas publié.
                    </span>
                  </div>
                )}


                {/* =========================================================
                    ACTIONS
                    ========================================================= */}

                <div
                  className={
                    styles.qrActions
                  }
                >
                  <a
                    href={
                      qrState.qrRoute
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={
                      styles.qrActionSecondary
                    }
                  >
                    <QrCode
                      size={16}
                      aria-hidden="true"
                    />

                    <span>
                      Ouvrir le QR
                    </span>
                  </a>


                  {isPublicSuccess ? (
                    <Link
                      href={
                        qrState.publicProductRoute
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        styles.qrActionPrimary
                      }
                    >
                      <ExternalLink
                        size={16}
                        aria-hidden="true"
                      />

                      <span>
                        Voir la fiche publique
                      </span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          )}


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
              <ShieldCheck
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
                QR Code stable
              </strong>

              <p>
                Le QR n’embarque ni prix, ni stock, ni identifiant Gestionnaire. Il contient uniquement l’adresse publique stable du produit.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ===================================================================
          STATUT
          =================================================================== */}

      <section
        className={[
          styles.card,

          statusError
            ? styles.cardError
            : "",
        ]
          .filter(
            Boolean,
          )
          .join(
            " ",
          )}
        aria-labelledby="product-create-status-title"
      >
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
              <Radio
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
                id="product-create-status-title"
                className={
                  styles.cardTitle
                }
              >
                Statut
              </h2>

              <p
                className={
                  styles.cardSubtitle
                }
              >
                Définissez la visibilité souhaitée pour le produit.
              </p>
            </div>
          </div>
        </div>


        <div
          className={
            styles.cardBody
          }
        >
          <div
            className={
              styles.statusOptions
            }
            role="radiogroup"
            aria-labelledby="product-create-status-title"
            aria-invalid={
              statusError
                ? true
                : undefined
            }
          >
            {PUBLICATION_STATUS_OPTIONS.map(
              (
                option,
              ) => {
                const StatusIcon =
                  option.icon;


                const selected =
                  publicationStatus ===
                  option.value;


                return (
                  <label
                    key={
                      option.value
                    }
                    className={[
                      styles.statusOption,

                      selected
                        ? styles.statusOptionSelected
                        : "",

                      disabled
                        ? styles.statusOptionDisabled
                        : "",
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(
                        " ",
                      )}
                  >
                    <input
                      type="radio"
                      name="product-publication-status-ui"
                      value={
                        option.value
                      }
                      checked={
                        selected
                      }
                      disabled={
                        disabled
                      }
                      onChange={
                        () =>
                          onPublicationStatusChange(
                            option.value,
                          )
                      }
                      className={
                        styles.statusRadioInput
                      }
                    />


                    <span
                      className={
                        styles.statusOptionIcon
                      }
                      aria-hidden="true"
                    >
                      <StatusIcon
                        size={18}
                        strokeWidth={1.9}
                      />
                    </span>


                    <span
                      className={
                        styles.statusOptionContent
                      }
                    >
                      <span
                        className={
                          styles.statusOptionHeader
                        }
                      >
                        <strong
                          className={
                            styles.statusOptionTitle
                          }
                        >
                          {
                            option.title
                          }
                        </strong>

                        {selected ? (
                          <CheckCircle2
                            size={17}
                            strokeWidth={2}
                            aria-hidden="true"
                            className={
                              styles.statusOptionCheck
                            }
                          />
                        ) : null}
                      </span>

                      <span
                        className={
                          styles.statusOptionDescription
                        }
                      >
                        {
                          option.description
                        }
                      </span>
                    </span>
                  </label>
                );
              },
            )}
          </div>


          {statusError ? (
            <p
              className={
                styles.fieldErrorMessage
              }
              role="alert"
            >
              {statusError}
            </p>
          ) : null}


          {/* =================================================================
              STATUS EXPLANATION
              ================================================================= */}

          <div
            className={
              styles.statusNotice
            }
          >
            {publicationStatus ===
            "PUBLISHED" ? (
              <>
                <Eye
                  size={17}
                  aria-hidden="true"
                />

                <p>
                  En cliquant sur <strong>Publier le produit</strong>, le produit pourra être visible sur l’espace public. Si son stock est à 0, il restera visible comme produit en rupture de stock.
                </p>
              </>
            ) : publicationStatus ===
              "DRAFT" ? (
              <>
                <CircleDashed
                  size={17}
                  aria-hidden="true"
                />

                <p>
                  Utilisez <strong>Enregistrer comme brouillon</strong>. Le produit restera privé et pourra être complété plus tard.
                </p>
              </>
            ) : (
              <>
                <EyeOff
                  size={17}
                  aria-hidden="true"
                />

                <p>
                  Le produit pourra être enregistré dans votre gestion interne tout en restant masqué aux clientes.
                </p>
              </>
            )}
          </div>


          {/* =================================================================
              SUCCESS SUMMARY
              ================================================================= */}

          {successData ? (
            <div
              className={
                styles.productCreatedSummary
              }
            >
              <div
                className={
                  styles.productCreatedSummaryHeader
                }
              >
                <CheckCircle2
                  size={19}
                  strokeWidth={2}
                  aria-hidden="true"
                />

                <strong>
                  Produit enregistré
                </strong>
              </div>


              <div
                className={
                  styles.productCreatedSummaryRows
                }
              >
                <div
                  className={
                    styles.productCreatedSummaryRow
                  }
                >
                  <span>
                    Produit
                  </span>

                  <strong>
                    {
                      successData.productName
                    }
                  </strong>
                </div>


                <div
                  className={
                    styles.productCreatedSummaryRow
                  }
                >
                  <span>
                    SKU
                  </span>

                  <code>
                    {
                      successData.sku
                    }
                  </code>
                </div>


                <div
                  className={
                    styles.productCreatedSummaryRow
                  }
                >
                  <span>
                    Statut
                  </span>

                  <strong>
                    {
                      getPublicationStatusLabel(
                        successData.publicationStatus,
                      )
                    }
                  </strong>
                </div>
              </div>


              <Link
                href={
                  successData.detailRoute
                }
                className={
                  styles.productCreatedDetailLink
                }
              >
                <span>
                  Ouvrir la fiche du produit
                </span>

                <ExternalLink
                  size={16}
                  aria-hidden="true"
                />
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}