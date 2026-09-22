"use client";

import {
  useId,
} from "react";

import type {
  ChangeEvent,
} from "react";

import {
  Building2,
  CircleAlert,
  Globe2,
  House,
  MapPin,
  MapPinned,
  Navigation,
  PackageCheck,
  Truck,
} from "lucide-react";

import type {
  PublicCommandeAddressInput,
  PublicCommandeDeliveryState,
  PublicCommandeFieldErrors,
} from "@/lib/public/commande/public-commande-types";

import styles from "./public-commande.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — ADRESSE ET LIVRAISON
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/commande/PublicCommandeDeliverySection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher et contrôler la section :
 *
 * "Adresse de livraison"
 *
 * de :
 *
 * /commande
 *
 * ============================================================================
 *
 * CHAMPS :
 *
 * - pays ;
 * - ville ;
 * - adresse ;
 * - complément d'adresse facultatif ;
 * - code postal.
 *
 * ============================================================================
 *
 * LIVRAISON :
 *
 * Le navigateur ne choisit JAMAIS le montant.
 *
 * Les frais sont calculés côté serveur depuis :
 *
 * src/config/public-delivery.ts
 *
 * puis :
 *
 * src/lib/public/commande/public-commande-delivery.ts
 *
 * ============================================================================
 *
 * RÈGLES ACTUELLES :
 *
 * Cameroun :
 *
 * 3 000 XAF
 *
 * Afrique hors Cameroun :
 *
 * 7 000 XAF
 *
 * International :
 *
 * 12 700 XAF
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Les montants ci-dessus ne sont PAS codés en dur dans ce composant.
 *
 * Ils viennent du PublicCommandeDeliveryState fourni par le parent
 * après calcul serveur.
 *
 * ============================================================================
 *
 * CE COMPOSANT NE :
 *
 * - calcule aucun tarif ;
 * - n'appelle pas Prisma ;
 * - ne lit pas PostgreSQL ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - ne crée aucune livraison ;
 * - ne génère aucun PDF ;
 * - n'envoie aucun e-mail ;
 * - ne fait confiance à aucun montant navigateur ;
 * - ne possède aucune liste de pays inventée.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES — CHAMPS ADRESSE
   ========================================================================== */

export type PublicCommandeDeliveryField =
  | "city"
  | "address"
  | "addressComplement"
  | "postalCode";


/* ==========================================================================
   2. OPTION PAYS
   ========================================================================== */

/**
 * Une option pays doit être fournie par le parent.
 *
 * Cela permet de conserver une source officielle unique des pays.
 *
 * Ce composant ne fabrique donc aucune liste interne arbitraire.
 */
export interface PublicCommandeCountryOption {
  readonly code:
    string;

  readonly name:
    string;
}


/* ==========================================================================
   3. PROPS
   ========================================================================== */

export interface PublicCommandeDeliverySectionProps {
  /**
   * Valeurs actuelles de l'adresse.
   */
  readonly value:
    PublicCommandeAddressInput;


  /**
   * Liste réelle des pays proposés par le checkout.
   */
  readonly countryOptions:
    readonly PublicCommandeCountryOption[];


  /**
   * Erreurs Zod / serveur.
   */
  readonly errors?:
    PublicCommandeFieldErrors;


  /**
   * État du calcul des frais de livraison.
   */
  readonly deliveryState?:
    PublicCommandeDeliveryState;


  /**
   * Désactive les champs pendant une opération serveur.
   */
  readonly disabled?:
    boolean;


  /**
   * Modification du pays.
   *
   * Le parent reçoit simultanément :
   *
   * countryCode
   * countryName
   */
  readonly onCountryChange:
    (
      country:
        PublicCommandeCountryOption | null,
    ) => void;


  /**
   * Modification des autres champs adresse.
   */
  readonly onChange:
    (
      field:
        PublicCommandeDeliveryField,

      value:
        string,
    ) => void;
}


/* ==========================================================================
   4. PROPS INTERNES — INPUT
   ========================================================================== */

interface DeliveryInputFieldProps {
  readonly id:
    string;

  readonly name:
    string;

  readonly label:
    string;

  readonly value:
    string;

  readonly type:
    "text";

  readonly autoComplete:
    string;

  readonly placeholder:
    string;

  readonly required:
    boolean;

  readonly disabled:
    boolean;

  readonly error:
    string | undefined;

  readonly hint?:
    string;

  readonly icon:
    "city" |
    "address" |
    "complement" |
    "postal";

  readonly onChange:
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => void;
}


/* ==========================================================================
   5. ICÔNES
   ========================================================================== */

function DeliveryFieldIcon({
  icon,
}: Readonly<{
  icon:
    DeliveryInputFieldProps["icon"];
}>) {
  const commonProps = {
    size:
      18,

    strokeWidth:
      1.8,

    "aria-hidden":
      true,
  } as const;


  switch (
    icon
  ) {
    case "city":
      return (
        <Building2
          {...commonProps}
        />
      );


    case "address":
      return (
        <MapPin
          {...commonProps}
        />
      );


    case "complement":
      return (
        <House
          {...commonProps}
        />
      );


    case "postal":
    default:
      return (
        <MapPinned
          {...commonProps}
        />
      );
  }
}


/* ==========================================================================
   6. CHAMP INPUT
   ========================================================================== */

function DeliveryInputField({
  id,
  name,
  label,
  value,
  type,
  autoComplete,
  placeholder,
  required,
  disabled,
  error,
  hint,
  icon,
  onChange,
}: DeliveryInputFieldProps) {
  const hasError =
    Boolean(
      error,
    );


  const errorId =
    `${id}-error`;


  const hintId =
    `${id}-hint`;


  const describedBy =
    hasError
      ? errorId
      : hint
        ? hintId
        : undefined;


  return (
    <div
      className={
        styles.commandeField
      }
      data-field-error={
        hasError
          ? "true"
          : "false"
      }
    >
      <label
        className={
          styles.commandeLabel
        }
        htmlFor={
          id
        }
      >
        <span>
          {label}

          {!required ? (
            <span
              className={
                styles.commandeOptionalLabel
              }
            >
              {" "}
              (facultatif)
            </span>
          ) : null}
        </span>
      </label>


      <div
        className={
          hasError
            ? `${styles.commandeInputWrapper} ${styles.commandeInputWrapperError}`
            : styles.commandeInputWrapper
        }
      >
        <span
          className={
            styles.commandeInputIcon
          }
        >
          <DeliveryFieldIcon
            icon={
              icon
            }
          />
        </span>


        <input
          id={
            id
          }
          name={
            name
          }
          className={
            styles.commandeInput
          }
          type={
            type
          }
          value={
            value
          }
          autoComplete={
            autoComplete
          }
          placeholder={
            placeholder
          }
          required={
            required
          }
          disabled={
            disabled
          }
          onChange={
            onChange
          }
          aria-invalid={
            hasError
          }
          aria-describedby={
            describedBy
          }
        />
      </div>


      {hasError ? (
        <p
          id={
            errorId
          }
          className={
            styles.commandeFieldError
          }
          role="alert"
        >
          <CircleAlert
            size={
              15
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
          />

          <span>
            {error}
          </span>
        </p>
      ) : hint ? (
        <p
          id={
            hintId
          }
          className={
            styles.commandeFieldHint
          }
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}


/* ==========================================================================
   7. FORMATAGE MONÉTAIRE
   ========================================================================== */

/**
 * Fonction uniquement visuelle.
 *
 * Elle n'effectue aucun calcul métier.
 */
function formatDeliveryMoney(
  amount:
    string,

  currency:
    string,
): string {
  const normalizedCurrency =
    currency
      .trim()
      .toUpperCase();


  const numericAmount =
    Number(
      amount,
    );


  if (
    !Number.isFinite(
      numericAmount,
    )
  ) {
    return `${amount} ${normalizedCurrency}`.trim();
  }


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
          0,

        maximumFractionDigits:
          2,
      },
    ).format(
      numericAmount,
    );
  } catch {
    return `${numericAmount.toLocaleString(
      "fr-FR",
    )} ${normalizedCurrency}`.trim();
  }
}


/* ==========================================================================
   8. LIBELLÉ ZONE
   ========================================================================== */

function getDeliveryZoneLabel(
  zone:
    "CAMEROON" |
    "AFRICA" |
    "INTERNATIONAL",
): string {
  switch (
    zone
  ) {
    case "CAMEROON":
      return "Livraison au Cameroun";


    case "AFRICA":
      return "Livraison en Afrique";


    case "INTERNATIONAL":
    default:
      return "Livraison internationale";
  }
}


/* ==========================================================================
   9. ÉTAT DE LIVRAISON
   ========================================================================== */

function DeliveryStatus({
  state,
}: Readonly<{
  state:
    PublicCommandeDeliveryState | undefined;
}>) {
  if (
    !state ||
    state.status ===
      "IDLE"
  ) {
    return (
      <div
        className={
          styles.commandeDeliveryStatus
        }
        data-delivery-status="idle"
      >
        <Truck
          size={
            19
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        <div>
          <strong>
            Frais de livraison
          </strong>

          <p>
            Les frais seront calculés automatiquement après
            la saisie de votre adresse.
          </p>
        </div>
      </div>
    );
  }


  if (
    state.status ===
    "CALCULATING"
  ) {
    return (
      <div
        className={
          styles.commandeDeliveryStatus
        }
        data-delivery-status="calculating"
        aria-live="polite"
      >
        <Navigation
          size={
            19
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        <div>
          <strong>
            Calcul de la livraison
          </strong>

          <p>
            Vérification de votre destination en cours…
          </p>
        </div>
      </div>
    );
  }


  if (
    state.status ===
    "ERROR"
  ) {
    return (
      <div
        className={
          `${styles.commandeDeliveryStatus} ${styles.commandeDeliveryStatusError}`
        }
        data-delivery-status="error"
        role="alert"
      >
        <CircleAlert
          size={
            19
          }
          strokeWidth={
            1.9
          }
          aria-hidden="true"
        />

        <div>
          <strong>
            Livraison non calculée
          </strong>

          <p>
            {state.message}
          </p>
        </div>
      </div>
    );
  }


  const quote =
    state.quote;


  return (
    <div
      className={
        `${styles.commandeDeliveryStatus} ${styles.commandeDeliveryStatusReady}`
      }
      data-delivery-status="ready"
      aria-live="polite"
    >
      <PackageCheck
        size={
          20
        }
        strokeWidth={
          1.8
        }
        aria-hidden="true"
      />

      <div
        className={
          styles.commandeDeliveryStatusContent
        }
      >
        <div>
          <strong>
            {getDeliveryZoneLabel(
              quote.zone,
            )}
          </strong>

          <p>
            Destination :{" "}
            {quote.countryName}
          </p>
        </div>


        <strong
          className={
            styles.commandeDeliveryPrice
          }
        >
          {formatDeliveryMoney(
            quote.amount.amount,
            quote.amount.currency,
          )}
        </strong>
      </div>
    </div>
  );
}


/* ==========================================================================
   10. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCommandeDeliverySection({
  value,
  countryOptions,
  errors = {},
  deliveryState,
  disabled = false,
  onCountryChange,
  onChange,
}: PublicCommandeDeliverySectionProps) {
  const reactId =
    useId();


  const idPrefix =
    `public-commande-delivery-${reactId.replace(
      /:/gu,
      "",
    )}`;


  /* =========================================================================
     PAYS ACTUEL
     ========================================================================= */

  const selectedCountryCode =
    value.countryCode
      .trim()
      .toUpperCase();


  /* =========================================================================
     CHANGEMENT DE PAYS
     ========================================================================= */

  function handleCountryChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ): void {
    const nextCode =
      event.currentTarget.value
        .trim()
        .toUpperCase();


    if (
      !nextCode
    ) {
      onCountryChange(
        null,
      );

      return;
    }


    const country =
      countryOptions.find(
        (
          option,
        ) =>
          option.code
            .trim()
            .toUpperCase() ===
          nextCode,
      ) ??
      null;


    onCountryChange(
      country,
    );
  }


  /* =========================================================================
     HANDLER INPUT
     ========================================================================= */

  function createChangeHandler(
    field:
      PublicCommandeDeliveryField,
  ) {
    return (
      event:
        ChangeEvent<HTMLInputElement>,
    ): void => {
      onChange(
        field,
        event.currentTarget.value,
      );
    };
  }


  /* =========================================================================
     ERREUR PAYS
     ========================================================================= */

  const countryError =
    errors.countryCode ??
    errors.countryName;


  const hasCountryError =
    Boolean(
      countryError,
    );


  const countryErrorId =
    `${idPrefix}-country-error`;


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <section
      className={
        styles.commandeSection
      }
      aria-labelledby={
        `${idPrefix}-title`
      }
      data-public-commande-delivery-section="true"
    >
      {/* ====================================================================
          HEADER
          ==================================================================== */}

      <div
        className={
          styles.commandeSectionHeader
        }
      >
        <div
          className={
            styles.commandeSectionIcon
          }
          aria-hidden="true"
        >
          <MapPin
            size={
              21
            }
            strokeWidth={
              1.8
            }
          />
        </div>


        <div
          className={
            styles.commandeSectionHeading
          }
        >
          <p
            className={
              styles.commandeSectionStep
            }
          >
            Étape 2
          </p>

          <h2
            id={
              `${idPrefix}-title`
            }
            className={
              styles.commandeSectionTitle
            }
          >
            Adresse de livraison
          </h2>

          <p
            className={
              styles.commandeSectionDescription
            }
          >
            Renseignez l’adresse exacte où votre commande
            devra être livrée.
          </p>
        </div>
      </div>


      {/* ====================================================================
          CHAMPS
          ==================================================================== */}

      <div
        className={
          styles.commandeFields
        }
      >
        {/* ------------------------------------------------------------------
            PAYS + VILLE
            ------------------------------------------------------------------ */}

        <div
          className={
            styles.commandeFieldsGrid
          }
        >
          {/* ================================================================
              PAYS
              ================================================================ */}

          <div
            className={
              styles.commandeField
            }
            data-field-error={
              hasCountryError
                ? "true"
                : "false"
            }
          >
            <label
              className={
                styles.commandeLabel
              }
              htmlFor={
                `${idPrefix}-country`
              }
            >
              Pays
            </label>


            <div
              className={
                hasCountryError
                  ? `${styles.commandeInputWrapper} ${styles.commandeInputWrapperError}`
                  : styles.commandeInputWrapper
              }
            >
              <span
                className={
                  styles.commandeInputIcon
                }
              >
                <Globe2
                  size={
                    18
                  }
                  strokeWidth={
                    1.8
                  }
                  aria-hidden="true"
                />
              </span>


              <select
                id={
                  `${idPrefix}-country`
                }
                name="address.countryCode"
                className={
                  `${styles.commandeInput} ${styles.commandeSelect}`
                }
                value={
                  selectedCountryCode
                }
                autoComplete="country"
                required={
                  true
                }
                disabled={
                  disabled
                }
                onChange={
                  handleCountryChange
                }
                aria-invalid={
                  hasCountryError
                }
                aria-describedby={
                  hasCountryError
                    ? countryErrorId
                    : undefined
                }
              >
                <option value="">
                  Sélectionnez votre pays
                </option>


                {countryOptions.map(
                  (
                    country,
                  ) => {
                    const normalizedCode =
                      country.code
                        .trim()
                        .toUpperCase();


                    return (
                      <option
                        key={
                          normalizedCode
                        }
                        value={
                          normalizedCode
                        }
                      >
                        {country.name}
                      </option>
                    );
                  },
                )}
              </select>
            </div>


            {hasCountryError ? (
              <p
                id={
                  countryErrorId
                }
                className={
                  styles.commandeFieldError
                }
                role="alert"
              >
                <CircleAlert
                  size={
                    15
                  }
                  strokeWidth={
                    1.9
                  }
                  aria-hidden="true"
                />

                <span>
                  {countryError}
                </span>
              </p>
            ) : null}
          </div>


          {/* ================================================================
              VILLE
              ================================================================ */}

          <DeliveryInputField
            id={
              `${idPrefix}-city`
            }
            name="address.city"
            label="Ville"
            value={
              value.city
            }
            type="text"
            autoComplete="address-level2"
            placeholder="Votre ville"
            required={
              true
            }
            disabled={
              disabled
            }
            error={
              errors.city
            }
            icon="city"
            onChange={
              createChangeHandler(
                "city",
              )
            }
          />
        </div>


        {/* ------------------------------------------------------------------
            ADRESSE
            ------------------------------------------------------------------ */}

        <DeliveryInputField
          id={
            `${idPrefix}-address`
          }
          name="address.address"
          label="Adresse"
          value={
            value.address
          }
          type="text"
          autoComplete="street-address"
          placeholder="Rue, quartier, numéro, résidence…"
          required={
            true
          }
          disabled={
            disabled
          }
          error={
            errors.address
          }
          icon="address"
          hint="Indiquez une adresse suffisamment précise pour permettre la livraison."
          onChange={
            createChangeHandler(
              "address",
            )
          }
        />


        {/* ------------------------------------------------------------------
            COMPLÉMENT + CODE POSTAL
            ------------------------------------------------------------------ */}

        <div
          className={
            styles.commandeFieldsGrid
          }
        >
          <DeliveryInputField
            id={
              `${idPrefix}-address-complement`
            }
            name="address.addressComplement"
            label="Complément d’adresse"
            value={
              value.addressComplement
            }
            type="text"
            autoComplete="address-line2"
            placeholder="Appartement, bâtiment, étage…"
            required={
              false
            }
            disabled={
              disabled
            }
            error={
              errors.addressComplement
            }
            icon="complement"
            onChange={
              createChangeHandler(
                "addressComplement",
              )
            }
          />


          <DeliveryInputField
            id={
              `${idPrefix}-postal-code`
            }
            name="address.postalCode"
            label="Code postal"
            value={
              value.postalCode
            }
            type="text"
            autoComplete="postal-code"
            placeholder="Code postal"
            required={
              true
            }
            disabled={
              disabled
            }
            error={
              errors.postalCode
            }
            icon="postal"
            onChange={
              createChangeHandler(
                "postalCode",
              )
            }
          />
        </div>
      </div>


      {/* ====================================================================
          LIVRAISON
          ==================================================================== */}

      <div
        className={
          styles.commandeDeliveryBlock
        }
      >
        <div
          className={
            styles.commandeDeliveryHeading
          }
        >
          <div
            className={
              styles.commandeDeliveryHeadingIcon
            }
            aria-hidden="true"
          >
            <Truck
              size={
                19
              }
              strokeWidth={
                1.8
              }
            />
          </div>


          <div>
            <h3
              className={
                styles.commandeDeliveryTitle
              }
            >
              Frais de livraison
            </h3>

            <p
              className={
                styles.commandeDeliveryDescription
              }
            >
              Le tarif est déterminé automatiquement selon
              votre destination.
            </p>
          </div>
        </div>


        <DeliveryStatus
          state={
            deliveryState
          }
        />
      </div>
    </section>
  );
}