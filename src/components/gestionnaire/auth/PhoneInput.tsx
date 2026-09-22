"use client";

import {
  Phone,
} from "lucide-react";

import {
  useState,
} from "react";

import type {
  ChangeEvent,
} from "react";

import {
  COUNTRIES,
} from "@/config/countries";


/* ============================================================
   COSMETICS EMPIRE
   PHONE INPUT — INSCRIPTION GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/PhoneInput.tsx

   UTILISÉ PAR :

   src/components/gestionnaire/auth/RegistrationForm.tsx

   OBJECTIF :

   Afficher un numéro de téléphone professionnel avec :

   indicatif pays
   +
   numéro

   Exemple :

   Cameroun
      ↓
   +237 | 6XX XX XX XX


   COMPORTEMENT IMPORTANT :

   1. Le pays sélectionné propose automatiquement son indicatif.

   2. Si le téléphone est encore vide :

      Cameroun → Sénégal

      +237 devient +221.

   3. Si l'utilisateur a déjà commencé à saisir son téléphone :

      son numéro et l'indicatif utilisé au début de la saisie
      ne sont PAS écrasés silencieusement.

   4. L'utilisateur peut également saisir directement un numéro
      international commençant par "+".

   5. La valeur finale envoyée au serveur porte toujours :

      name="phone"

   6. Le serveur devra ensuite refaire la normalisation et la
      validation du numéro.

   IMPORTANT :

   Ce composant améliore uniquement l'expérience utilisateur.

   Il ne remplace jamais la validation serveur.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type PhoneInputProps =
  Readonly<{
    id: string;

    name: string;

    countryCode: string;

    defaultValue?:
      string;

    error?:
      string | null;

    disabled?:
      boolean;

    required?:
      boolean;
  }>;


/* ============================================================
   LOCAL STATE
   ------------------------------------------------------------
   dialCode représente l'indicatif utilisé au moment où
   l'utilisateur commence réellement sa saisie.

   Cela permet d'éviter qu'un changement de pays modifie
   silencieusement un numéro déjà commencé.
   ============================================================ */

type PhoneInputState =
  Readonly<{
    value: string;
    dialCode: string;
  }>;


/* ============================================================
   NORMALIZE COUNTRY CODE
   ============================================================ */

function normalizeCountryCode(
  countryCode:
    | string
    | null
    | undefined,
): string {
  if (!countryCode) {
    return "";
  }

  return countryCode
    .trim()
    .toUpperCase();
}


/* ============================================================
   FIND COUNTRY DIAL CODE
   ============================================================ */

function getDialCodeForCountry(
  countryCode: string,
): string {
  const normalizedCountryCode =
    normalizeCountryCode(
      countryCode,
    );

  if (!normalizedCountryCode) {
    return "";
  }

  const country =
    COUNTRIES.find(
      (item) =>
        item.code ===
        normalizedCountryCode,
    );

  return country?.dialCode ?? "";
}


/* ============================================================
   CLEAN DIAL CODE
   ------------------------------------------------------------
   On garde uniquement :

   +
   chiffres

   Exemple :

   "+237 "
      ↓
   "+237"
   ============================================================ */

function normalizeDialCode(
  dialCode: string,
): string {
  const normalized =
    dialCode
      .trim()
      .replace(/[^\d+]/g, "");

  if (!normalized) {
    return "";
  }

  if (
    normalized.startsWith("+")
  ) {
    return normalized;
  }

  return `+${normalized}`;
}


/* ============================================================
   INITIAL PHONE VALUE
   ------------------------------------------------------------
   Le serveur peut éventuellement nous redonner :

   +237699123456

   après une erreur de formulaire.

   Dans ce cas, si le pays sélectionné correspond à +237,
   l'interface redevient :

   +237 | 699123456

   plutôt que :

   +237 | +237699123456
   ============================================================ */

function createInitialPhoneState(
  defaultValue: string,
  suggestedDialCode: string,
): PhoneInputState {
  const value =
    defaultValue.trim();

  const dialCode =
    normalizeDialCode(
      suggestedDialCode,
    );


  if (!value) {
    return {
      value: "",
      dialCode,
    };
  }


  /*
   * Numéro international correspondant à l'indicatif actuel.
   */

  if (
    dialCode &&
    value.startsWith(dialCode)
  ) {
    return {
      value:
        value
          .slice(
            dialCode.length,
          )
          .trimStart(),

      dialCode,
    };
  }


  /*
   * Si une valeur commence déjà par "+", on la laisse entière.
   *
   * Elle sera considérée comme une saisie internationale
   * explicite de l'utilisateur.
   */

  if (value.startsWith("+")) {
    return {
      value,
      dialCode: "",
    };
  }


  return {
    value,
    dialCode,
  };
}


/* ============================================================
   BUILD SERVER VALUE
   ------------------------------------------------------------
   Valeur envoyée dans :

   <input type="hidden" name="phone" />

   Exemple :

   dialCode = +237
   value    = 699123456

   résultat :

   +237699123456


   Si l'utilisateur saisit explicitement :

   +221771234567

   on ne préfixe rien une seconde fois.
   ============================================================ */

function buildPhoneValue(
  value: string,
  dialCode: string,
): string {
  const trimmedValue =
    value.trim();


  if (!trimmedValue) {
    return "";
  }


  /*
   * L'utilisateur a fourni explicitement un numéro
   * international.
   */

  if (
    trimmedValue.startsWith("+")
  ) {
    return trimmedValue;
  }


  const normalizedDialCode =
    normalizeDialCode(
      dialCode,
    );


  if (!normalizedDialCode) {
    return trimmedValue;
  }


  return `${normalizedDialCode}${trimmedValue}`;
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function PhoneInput({
  id,
  name,
  countryCode,
  defaultValue = "",
  error = null,
  disabled = false,
  required = false,
}: PhoneInputProps) {
  /* ----------------------------------------------------------
     CURRENT COUNTRY PROPOSAL
     ---------------------------------------------------------- */

  const suggestedDialCode =
    getDialCodeForCountry(
      countryCode,
    );


  /* ----------------------------------------------------------
     PHONE STATE
     ---------------------------------------------------------- */

  const [
    phoneState,
    setPhoneState,
  ] = useState<PhoneInputState>(
    () =>
      createInitialPhoneState(
        defaultValue,
        suggestedDialCode,
      ),
  );


  /* ----------------------------------------------------------
     DOES USER ALREADY HAVE A NUMBER?
     ---------------------------------------------------------- */

  const hasPhoneValue =
    phoneState.value.trim().length >
    0;


  /* ----------------------------------------------------------
     EFFECTIVE DIAL CODE
     ----------------------------------------------------------
     Tant que le numéro est vide, l'indicatif suit librement
     le pays.

     Dès que l'utilisateur commence sa saisie, l'indicatif
     utilisé à ce moment est conservé.

     Aucun useEffect n'est nécessaire.
     ---------------------------------------------------------- */

  const effectiveDialCode =
    hasPhoneValue
      ? phoneState.dialCode
      : suggestedDialCode;


  /* ----------------------------------------------------------
     USER ENTERED FULL INTERNATIONAL NUMBER
     ---------------------------------------------------------- */

  const isExplicitInternationalNumber =
    phoneState.value
      .trimStart()
      .startsWith("+");


  /* ----------------------------------------------------------
     FINAL SERVER VALUE
     ---------------------------------------------------------- */

  const serverPhoneValue =
    buildPhoneValue(
      phoneState.value,
      effectiveDialCode,
    );


  /* ----------------------------------------------------------
     IDS
     ---------------------------------------------------------- */

  const errorId =
    `${id}-error`;


  /* ==========================================================
     INPUT CHANGE
     ========================================================== */

  function handlePhoneChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue =
      event.target.value;


    /*
     * Si le champ était vide avant cette saisie, on mémorise
     * l'indicatif actuellement proposé.
     *
     * Exemple :
     *
     * Pays = Cameroun
     * indicatif proposé = +237
     *
     * l'utilisateur commence "699..."
     *
     * +237 devient l'indicatif associé à cette saisie.
     */

    const nextDialCode =
      phoneState.value
        .trim()
        .length === 0
        ? suggestedDialCode
        : phoneState.dialCode;


    /*
     * Si l'utilisateur efface totalement son numéro, il n'est
     * plus nécessaire de verrouiller l'ancien indicatif.
     *
     * Au prochain rendu, effectiveDialCode reprendra simplement
     * la proposition du pays actuellement sélectionné.
     */

    if (
      nextValue.trim().length ===
      0
    ) {
      setPhoneState({
        value: "",
        dialCode:
          suggestedDialCode,
      });

      return;
    }


    /*
     * Saisie internationale explicite.
     *
     * Exemple :
     *
     * +221771234567
     *
     * On ne préfixera pas automatiquement +237 ou autre.
     */

    if (
      nextValue
        .trimStart()
        .startsWith("+")
    ) {
      setPhoneState({
        value: nextValue,
        dialCode: "",
      });

      return;
    }


    setPhoneState({
      value: nextValue,
      dialCode:
        normalizeDialCode(
          nextDialCode,
        ),
    });
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className={[
        "gestionnaire-auth-field",
        error
          ? "gestionnaire-auth-field--error"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ======================================================
          ACCESSIBLE LABEL
          ====================================================== */}

      <label
        htmlFor={id}
        className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
      >
        Numéro de téléphone
      </label>


      {/* ======================================================
          PHONE CONTROL
          ====================================================== */}

      <div className="gestionnaire-auth-field__control">
        {/* ----------------------------------------------------
            PHONE ICON
            ---------------------------------------------------- */}

        <span
          className="gestionnaire-auth-field__icon"
          aria-hidden="true"
        >
          <Phone
            size={21}
            strokeWidth={1.7}
          />
        </span>


        {/* ----------------------------------------------------
            PHONE CONTENT
            ---------------------------------------------------- */}

        <div
          className="gestionnaire-phone-input"
          style={{
            paddingLeft:
              "50px",
          }}
        >
          {/* --------------------------------------------------
              DIAL CODE
              --------------------------------------------------
              Si l'utilisateur saisit un numéro international
              complet commençant par "+", on n'affiche pas un
              deuxième indicatif devant sa saisie.
              -------------------------------------------------- */}

          {!isExplicitInternationalNumber ? (
            <span
              className="gestionnaire-phone-input__prefix"
              aria-hidden="true"
            >
              {effectiveDialCode ||
                "+"}
            </span>
          ) : null}


          {/* --------------------------------------------------
              VISIBLE PHONE INPUT

              Ce champ n'utilise volontairement PAS name="phone".

              La valeur finale normalisée côté interface est
              envoyée grâce au champ hidden plus bas.

              Le serveur refera encore sa propre validation.
              -------------------------------------------------- */}

          <input
            id={id}
            name={`${name}Display`}
            type="tel"
            className="gestionnaire-auth-field__input gestionnaire-auth-field__input--no-icon gestionnaire-phone-input__number"
            value={
              phoneState.value
            }
            onChange={
              handlePhoneChange
            }
            placeholder="Numéro de téléphone"
            autoComplete="tel"
            inputMode="tel"
            maxLength={32}
            required={required}
            disabled={disabled}
            aria-invalid={
              Boolean(error)
            }
            aria-describedby={
              error
                ? errorId
                : undefined
            }
          />


          {/* --------------------------------------------------
              SERVER VALUE

              C'est cette valeur que :

              inscription/actions.ts

              récupère avec :

              formData.get("phone")
              -------------------------------------------------- */}

          <input
            type="hidden"
            name={name}
            value={
              serverPhoneValue
            }
          />
        </div>
      </div>


      {/* ======================================================
          ERROR
          ====================================================== */}

      {error ? (
        <p
          id={errorId}
          className="gestionnaire-auth-field__error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}