"use client";

import {
  useId,
} from "react";

import type {
  ChangeEvent,
} from "react";

import {
  CircleAlert,
  Mail,
  MessageCircle,
  Phone,
  UserRound,
} from "lucide-react";

import type {
  PublicCommandeCustomerInput,
  PublicCommandeFieldErrors,
} from "@/lib/public/commande/public-commande-types";

import styles from "./public-commande.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — INFORMATIONS CLIENTE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/commande/PublicCommandeCustomerSection.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher et contrôler la section :
 *
 * "Informations personnelles"
 *
 * de la page :
 *
 * /commande
 *
 * ============================================================================
 *
 * CHAMPS :
 *
 * - prénom ;
 * - nom ;
 * - adresse e-mail ;
 * - téléphone ;
 * - WhatsApp facultatif.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - reçoit les valeurs depuis PublicCommandePage ;
 * - reçoit les erreurs depuis PublicCommandePage ;
 * - remonte les changements au composant parent ;
 * - ne possède aucune vérité commerciale ;
 * - ne valide pas lui-même la commande ;
 * - ne calcule aucun prix ;
 * - ne calcule aucune livraison ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - n'appelle pas Prisma ;
 * - n'appelle pas directement une Server Action.
 *
 * ============================================================================
 *
 * VALIDATION :
 *
 * La validation autoritaire appartient à :
 *
 * src/lib/public/commande/public-commande-schema.ts
 *
 * puis :
 *
 * src/lib/public/commande/public-commande-actions.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CHAMPS CLIENTE
   ========================================================================== */

export type PublicCommandeCustomerField =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "whatsapp";


/* ==========================================================================
   2. PROPS
   ========================================================================== */

export interface PublicCommandeCustomerSectionProps {
  /**
   * Valeurs actuelles du formulaire.
   */
  readonly value:
    PublicCommandeCustomerInput;


  /**
   * Erreurs serveur / Zod éventuelles.
   *
   * Le type contient également les champs adresse, mais ce composant
   * n'utilise que :
   *
   * firstName
   * lastName
   * email
   * phone
   * whatsapp
   */
  readonly errors?:
    PublicCommandeFieldErrors;


  /**
   * Désactive les champs pendant une opération serveur.
   */
  readonly disabled?:
    boolean;


  /**
   * Callback unique vers le parent.
   *
   * Exemple :
   *
   * onChange("firstName", "Marie")
   */
  readonly onChange:
    (
      field:
        PublicCommandeCustomerField,

      value:
        string,
    ) => void;
}


/* ==========================================================================
   3. PROPS INTERNES D'UN CHAMP
   ========================================================================== */

interface CustomerInputFieldProps {
  readonly id:
    string;

  readonly name:
    string;

  readonly label:
    string;

  readonly value:
    string;

  readonly type:
    "text" |
    "email" |
    "tel";

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

  readonly inputMode?:
    "text" |
    "email" |
    "tel";

  readonly icon:
    "user" |
    "mail" |
    "phone" |
    "whatsapp";

  readonly onChange:
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => void;
}


/* ==========================================================================
   4. ICÔNES
   ========================================================================== */

function CustomerFieldIcon({
  icon,
}: Readonly<{
  icon:
    CustomerInputFieldProps["icon"];
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
    case "mail":
      return (
        <Mail
          {...commonProps}
        />
      );


    case "phone":
      return (
        <Phone
          {...commonProps}
        />
      );


    case "whatsapp":
      return (
        <MessageCircle
          {...commonProps}
        />
      );


    case "user":
    default:
      return (
        <UserRound
          {...commonProps}
        />
      );
  }
}


/* ==========================================================================
   5. CHAMP RÉUTILISABLE
   ========================================================================== */

function CustomerInputField({
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
  inputMode,
  icon,
  onChange,
}: CustomerInputFieldProps) {
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
          <CustomerFieldIcon
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
          inputMode={
            inputMode
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
   6. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicCommandeCustomerSection({
  value,
  errors = {},
  disabled = false,
  onChange,
}: PublicCommandeCustomerSectionProps) {
  const reactId =
    useId();


  /**
   * React peut produire des IDs contenant ":".
   *
   * Ils sont valides en HTML mais on les normalise afin de garder
   * des IDs simples à utiliser dans le DOM et les tests futurs.
   */
  const idPrefix =
    `public-commande-customer-${reactId.replace(
      /:/gu,
      "",
    )}`;


  /* =========================================================================
     HANDLER
     ========================================================================= */

  function createChangeHandler(
    field:
      PublicCommandeCustomerField,
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
      data-public-commande-customer-section="true"
    >
      {/* ====================================================================
          EN-TÊTE
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
          <UserRound
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
            Étape 1
          </p>

          <h2
            id={
              `${idPrefix}-title`
            }
            className={
              styles.commandeSectionTitle
            }
          >
            Informations personnelles
          </h2>

          <p
            className={
              styles.commandeSectionDescription
            }
          >
            Renseignez vos coordonnées pour identifier votre commande
            et recevoir sa confirmation.
          </p>
        </div>
      </div>


      {/* ====================================================================
          FORMULAIRE
          ==================================================================== */}

      <div
        className={
          styles.commandeFields
        }
      >
        {/* ------------------------------------------------------------------
            PRÉNOM + NOM
            ------------------------------------------------------------------ */}

        <div
          className={
            styles.commandeFieldsGrid
          }
        >
          <CustomerInputField
            id={
              `${idPrefix}-first-name`
            }
            name="customer.firstName"
            label="Prénom"
            value={
              value.firstName
            }
            type="text"
            autoComplete="given-name"
            placeholder="Votre prénom"
            required={
              true
            }
            disabled={
              disabled
            }
            error={
              errors.firstName
            }
            inputMode="text"
            icon="user"
            onChange={
              createChangeHandler(
                "firstName",
              )
            }
          />


          <CustomerInputField
            id={
              `${idPrefix}-last-name`
            }
            name="customer.lastName"
            label="Nom"
            value={
              value.lastName
            }
            type="text"
            autoComplete="family-name"
            placeholder="Votre nom"
            required={
              true
            }
            disabled={
              disabled
            }
            error={
              errors.lastName
            }
            inputMode="text"
            icon="user"
            onChange={
              createChangeHandler(
                "lastName",
              )
            }
          />
        </div>


        {/* ------------------------------------------------------------------
            E-MAIL
            ------------------------------------------------------------------ */}

        <CustomerInputField
          id={
            `${idPrefix}-email`
          }
          name="customer.email"
          label="Adresse e-mail"
          value={
            value.email
          }
          type="email"
          autoComplete="email"
          placeholder="exemple@email.com"
          required={
            true
          }
          disabled={
            disabled
          }
          error={
            errors.email
          }
          inputMode="email"
          icon="mail"
          hint="La confirmation de commande et le reçu seront envoyés à cette adresse."
          onChange={
            createChangeHandler(
              "email",
            )
          }
        />


        {/* ------------------------------------------------------------------
            TÉLÉPHONE + WHATSAPP
            ------------------------------------------------------------------ */}

        <div
          className={
            styles.commandeFieldsGrid
          }
        >
          <CustomerInputField
            id={
              `${idPrefix}-phone`
            }
            name="customer.phone"
            label="Téléphone"
            value={
              value.phone
            }
            type="tel"
            autoComplete="tel"
            placeholder="+237 6..."
            required={
              true
            }
            disabled={
              disabled
            }
            error={
              errors.phone
            }
            inputMode="tel"
            icon="phone"
            onChange={
              createChangeHandler(
                "phone",
              )
            }
          />


          <CustomerInputField
            id={
              `${idPrefix}-whatsapp`
            }
            name="customer.whatsapp"
            label="WhatsApp"
            value={
              value.whatsapp
            }
            type="tel"
            autoComplete="tel"
            placeholder="+237 6..."
            required={
              false
            }
            disabled={
              disabled
            }
            error={
              errors.whatsapp
            }
            inputMode="tel"
            icon="whatsapp"
            hint="À renseigner uniquement si vous souhaitez utiliser un numéro WhatsApp différent ou spécifique."
            onChange={
              createChangeHandler(
                "whatsapp",
              )
            }
          />
        </div>
      </div>


      {/* ====================================================================
          INFORMATION
          ==================================================================== */}

      <div
        className={
          styles.commandeSectionNotice
        }
      >
        <Mail
          size={
            17
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
        />

        <p>
          Après la création de votre commande, un e-mail de confirmation
          sera envoyé à l’adresse renseignée. Le reçu de commande sera
          également transmis lorsque sa génération sera terminée.
        </p>
      </div>
    </section>
  );
}