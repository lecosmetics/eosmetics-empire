"use client";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  Building2,
  KeyRound,
  Mail,
  MapPin,
  Store,
} from "lucide-react";

import {
  useActionState,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  registerGestionnaireAction,
  type RegistrationActionState,
} from "@/app/gestionnaire/(auth)/inscription/actions";

import {
  routes,
} from "@/config/routes";

import CountrySelect from "./CountrySelect";
import PasswordField from "./PasswordField";
import PhoneInput from "./PhoneInput";


/* ============================================================
   L&E COSMETICS EMPIRE
   REGISTRATION FORM — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/RegistrationForm.tsx

   Route :
   /gestionnaire/inscription

   CHAMPS :

   1. Nom de la boutique
   2. Pays
   3. Ville
   4. Adresse de la boutique
   5. Numéro de téléphone
   6. Adresse e-mail
   7. Code secret représentant
   8. Mot de passe
   9. Confirmation du mot de passe

   SÉCURITÉ :

   Ce composant client ne connaît jamais :

   - le véritable code représentant ;
   - son hash ;
   - l'OTP attendu ;
   - le hash OTP ;
   - le hash du mot de passe ;
   - OTP_PEPPER ;
   - SESSION_SECRET ;
   - RESEND_API_KEY.

   Toutes les validations importantes sont répétées côté serveur.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type RegistrationFormProps =
  Readonly<{
    detectedCountry:
      string | null;
  }>;


/* ============================================================
   INITIAL ACTION STATE
   ------------------------------------------------------------
   IMPORTANT :

   Cet objet reste volontairement dans le composant CLIENT.

   Il ne doit pas être exporté depuis :

   inscription/actions.ts

   car ce fichier contient "use server" et Next.js exige que
   ses exports runtime soient des fonctions async.
   ============================================================ */

const INITIAL_REGISTRATION_STATE:
  RegistrationActionState = {
  status:
    "idle",

  message:
    null,

  fieldErrors:
    {},

  values: {
    shopName:
      "",

    country:
      "",

    city:
      "",

    shopAddress:
      "",

    phone:
      "",

    email:
      "",
  },
};


/* ============================================================
   PASSWORD MESSAGE
   ============================================================ */

const PASSWORD_MISMATCH_MESSAGE =
  "Les mots de passe ne correspondent pas.";


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
   GET FORM INPUT
   ============================================================ */

function getFormInput(
  form:
    HTMLFormElement,

  name:
    string,
): HTMLInputElement | null {
  const field =
    form.elements.namedItem(
      name,
    );


  if (
    field instanceof
    HTMLInputElement
  ) {
    return field;
  }


  return null;
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function RegistrationForm({
  detectedCountry,
}: RegistrationFormProps) {
  /* ==========================================================
     SERVER ACTION STATE
     ----------------------------------------------------------
     React 19 / Next.js Server Action.

     Le state initial est local à ce composant client.
     ========================================================== */

  const [
    state,
    formAction,
    isPending,
  ] = useActionState(
    registerGestionnaireAction,
    INITIAL_REGISTRATION_STATE,
  );


  /* ==========================================================
     INITIAL COUNTRY
     ----------------------------------------------------------
     Priorité :

     1. valeur éventuellement renvoyée par la Server Action ;
     2. pays détecté côté serveur ;
     3. chaîne vide.

     La détection géographique reste seulement une suggestion.
     ========================================================== */

  const initialCountry =
    normalizeCountryCode(
      state.values.country ||
        detectedCountry,
    );


  /* ==========================================================
     SELECTED COUNTRY
     ----------------------------------------------------------
     Le pays devient contrôlé localement après affichage.

     Une modification manuelle de l'utilisateur n'est jamais
     remplacée automatiquement par la géodétection.
     ========================================================== */

  const [
    selectedCountry,
    setSelectedCountry,
  ] = useState(
    initialCountry,
  );


  /* ==========================================================
     PASSWORD MISMATCH
     ----------------------------------------------------------
     Les mots de passe eux-mêmes ne sont volontairement jamais
     copiés dans un state React.

     On conserve uniquement l'état booléen de comparaison.
     ========================================================== */

  const [
    passwordMismatch,
    setPasswordMismatch,
  ] = useState(
    false,
  );


  /* ==========================================================
     PASSWORD VALIDATION
     ========================================================== */

  function synchronizePasswordValidity(
    form:
      HTMLFormElement,
  ): boolean {
    const passwordInput =
      getFormInput(
        form,
        "password",
      );


    const confirmationInput =
      getFormInput(
        form,
        "passwordConfirmation",
      );


    if (
      !passwordInput ||
      !confirmationInput
    ) {
      setPasswordMismatch(
        false,
      );

      return true;
    }


    /*
     * Une confirmation vide reste gérée nativement par
     * l'attribut required.
     *
     * Le message de différence apparaît seulement lorsque
     * l'utilisateur a commencé à remplir la confirmation.
     */

    const hasConfirmation =
      confirmationInput
        .value
        .length >
      0;


    const mismatch =
      hasConfirmation &&
      passwordInput.value !==
        confirmationInput.value;


    confirmationInput
      .setCustomValidity(
        mismatch
          ? PASSWORD_MISMATCH_MESSAGE
          : "",
      );


    setPasswordMismatch(
      mismatch,
    );


    return !mismatch;
  }


  /* ==========================================================
     FORM INPUT
     ----------------------------------------------------------
     Validation UX immédiate des mots de passe.

     Aucun secret n'est persisté dans le state.
     ========================================================== */

  function handleFormInput(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    synchronizePasswordValidity(
      event.currentTarget,
    );
  }


  /* ==========================================================
     FORM SUBMIT
     ========================================================== */

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    /*
     * Protection UX contre une seconde soumission pendant que
     * la Server Action précédente est toujours en cours.
     */

    if (isPending) {
      event.preventDefault();

      return;
    }


    const passwordIsValid =
      synchronizePasswordValidity(
        event.currentTarget,
      );


    if (
      passwordIsValid
    ) {
      return;
    }


    event.preventDefault();


    const confirmationInput =
      getFormInput(
        event.currentTarget,
        "passwordConfirmation",
      );


    confirmationInput
      ?.focus();


    confirmationInput
      ?.reportValidity();
  }


  /* ==========================================================
     COUNTRY CHANGE
     ========================================================== */

  function handleCountryChange(
    countryCode:
      string,
  ): void {
    setSelectedCountry(
      normalizeCountryCode(
        countryCode,
      ),
    );
  }


  /* ==========================================================
     PASSWORD CONFIRMATION ERROR
     ----------------------------------------------------------
     Priorité :

     1. différence détectée immédiatement côté client ;
     2. erreur de validation renvoyée par le serveur.
     ========================================================== */

  const confirmationError =
    passwordMismatch
      ? PASSWORD_MISMATCH_MESSAGE
      : state
          .fieldErrors
          .passwordConfirmation;


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <form
      className="gestionnaire-auth-form"
      action={formAction}
      onInput={handleFormInput}
      onSubmit={handleSubmit}
      aria-busy={isPending}
    >
      {/* ======================================================
          GLOBAL ERROR
          ====================================================== */}

      {state.message ? (
        <div
          className="gestionnaire-auth-form__error"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle
            size={18}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            {state.message}
          </span>
        </div>
      ) : null}


      {/* ======================================================
          FIELDS
          ====================================================== */}

      <div
        className="gestionnaire-auth-form__fields"
      >
        {/* ====================================================
            1. SHOP NAME
            ==================================================== */}

        <div
          className={[
            "gestionnaire-auth-field",

            state
              .fieldErrors
              .shopName
              ? "gestionnaire-auth-field--error"
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <label
            htmlFor="gestionnaire-shop-name"
            className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
          >
            Nom de la boutique
          </label>

          <div
            className="gestionnaire-auth-field__control"
          >
            <span
              className="gestionnaire-auth-field__icon"
              aria-hidden="true"
            >
              <Store
                size={21}
                strokeWidth={1.7}
              />
            </span>

            <input
              id="gestionnaire-shop-name"
              name="shopName"
              type="text"
              className="gestionnaire-auth-field__input"
              placeholder="Nom de la boutique"
              defaultValue={
                state
                  .values
                  .shopName
              }
              autoComplete="organization"
              maxLength={120}
              required
              disabled={isPending}
              aria-invalid={
                Boolean(
                  state
                    .fieldErrors
                    .shopName,
                )
              }
              aria-describedby={
                state
                  .fieldErrors
                  .shopName
                  ? "gestionnaire-shop-name-error"
                  : undefined
              }
            />
          </div>

          {state
            .fieldErrors
            .shopName ? (
            <p
              id="gestionnaire-shop-name-error"
              className="gestionnaire-auth-field__error"
            >
              {
                state
                  .fieldErrors
                  .shopName
              }
            </p>
          ) : null}
        </div>


        {/* ====================================================
            2. COUNTRY
            ==================================================== */}

        <CountrySelect
          id="gestionnaire-country"
          name="country"
          value={selectedCountry}
          onChange={
            handleCountryChange
          }
          error={
            state
              .fieldErrors
              .country
          }
          disabled={isPending}
          required
        />


        {/* ====================================================
            3. CITY
            ==================================================== */}

        <div
          className={[
            "gestionnaire-auth-field",

            state
              .fieldErrors
              .city
              ? "gestionnaire-auth-field--error"
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <label
            htmlFor="gestionnaire-city"
            className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
          >
            Ville
          </label>

          <div
            className="gestionnaire-auth-field__control"
          >
            <span
              className="gestionnaire-auth-field__icon"
              aria-hidden="true"
            >
              <Building2
                size={21}
                strokeWidth={1.7}
              />
            </span>

            <input
              id="gestionnaire-city"
              name="city"
              type="text"
              className="gestionnaire-auth-field__input"
              placeholder="Ville"
              defaultValue={
                state
                  .values
                  .city
              }
              autoComplete="address-level2"
              maxLength={100}
              required
              disabled={isPending}
              aria-invalid={
                Boolean(
                  state
                    .fieldErrors
                    .city,
                )
              }
              aria-describedby={
                state
                  .fieldErrors
                  .city
                  ? "gestionnaire-city-error"
                  : undefined
              }
            />
          </div>

          {state
            .fieldErrors
            .city ? (
            <p
              id="gestionnaire-city-error"
              className="gestionnaire-auth-field__error"
            >
              {
                state
                  .fieldErrors
                  .city
              }
            </p>
          ) : null}
        </div>


        {/* ====================================================
            4. SHOP ADDRESS
            ==================================================== */}

        <div
          className={[
            "gestionnaire-auth-field",

            state
              .fieldErrors
              .shopAddress
              ? "gestionnaire-auth-field--error"
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <label
            htmlFor="gestionnaire-shop-address"
            className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
          >
            Adresse de la boutique
          </label>

          <div
            className="gestionnaire-auth-field__control"
          >
            <span
              className="gestionnaire-auth-field__icon"
              aria-hidden="true"
            >
              <MapPin
                size={21}
                strokeWidth={1.7}
              />
            </span>

            <input
              id="gestionnaire-shop-address"
              name="shopAddress"
              type="text"
              className="gestionnaire-auth-field__input"
              placeholder="Adresse de la boutique"
              defaultValue={
                state
                  .values
                  .shopAddress
              }
              autoComplete="street-address"
              maxLength={220}
              required
              disabled={isPending}
              aria-invalid={
                Boolean(
                  state
                    .fieldErrors
                    .shopAddress,
                )
              }
              aria-describedby={
                state
                  .fieldErrors
                  .shopAddress
                  ? "gestionnaire-shop-address-error"
                  : undefined
              }
            />
          </div>

          {state
            .fieldErrors
            .shopAddress ? (
            <p
              id="gestionnaire-shop-address-error"
              className="gestionnaire-auth-field__error"
            >
              {
                state
                  .fieldErrors
                  .shopAddress
              }
            </p>
          ) : null}
        </div>


        {/* ====================================================
            5. PHONE
            ----------------------------------------------------
            Le préfixe peut être proposé selon le pays :

            BJ → +229
            CM → +237
            SN → +221
            CI → +225
            FR → +33

            PhoneInput reste responsable de son affichage.
            ==================================================== */}

        <PhoneInput
          id="gestionnaire-phone"
          name="phone"
          countryCode={
            selectedCountry
          }
          defaultValue={
            state
              .values
              .phone
          }
          error={
            state
              .fieldErrors
              .phone
          }
          disabled={isPending}
          required
        />


        {/* ====================================================
            6. EMAIL
            ==================================================== */}

        <div
          className={[
            "gestionnaire-auth-field",

            state
              .fieldErrors
              .email
              ? "gestionnaire-auth-field--error"
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <label
            htmlFor="gestionnaire-email"
            className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
          >
            Adresse e-mail
          </label>

          <div
            className="gestionnaire-auth-field__control"
          >
            <span
              className="gestionnaire-auth-field__icon"
              aria-hidden="true"
            >
              <Mail
                size={21}
                strokeWidth={1.7}
              />
            </span>

            <input
              id="gestionnaire-email"
              name="email"
              type="email"
              className="gestionnaire-auth-field__input"
              placeholder="Adresse e-mail"
              defaultValue={
                state
                  .values
                  .email
              }
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              spellCheck={false}
              required
              disabled={isPending}
              aria-invalid={
                Boolean(
                  state
                    .fieldErrors
                    .email,
                )
              }
              aria-describedby={
                state
                  .fieldErrors
                  .email
                  ? "gestionnaire-email-error"
                  : undefined
              }
            />
          </div>

          {state
            .fieldErrors
            .email ? (
            <p
              id="gestionnaire-email-error"
              className="gestionnaire-auth-field__error"
            >
              {
                state
                  .fieldErrors
                  .email
              }
            </p>
          ) : null}
        </div>


        {/* ====================================================
            7. REPRESENTATIVE SECRET CODE
            ----------------------------------------------------
            Le véritable code n'est jamais intégré au bundle
            client.

            Seule la valeur saisie est envoyée à la Server
            Action puis vérifiée côté serveur avec Argon2.
            ==================================================== */}

        <div
          className={[
            "gestionnaire-auth-field",

            state
              .fieldErrors
              .representativeCode
              ? "gestionnaire-auth-field--error"
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <label
            htmlFor="gestionnaire-representative-code"
            className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
          >
            Code secret représentant L&amp;E Cosmetics Empire
          </label>

          <div
            className="gestionnaire-auth-field__control"
          >
            <span
              className="gestionnaire-auth-field__icon"
              aria-hidden="true"
            >
              <KeyRound
                size={21}
                strokeWidth={1.7}
              />
            </span>

            <input
              id="gestionnaire-representative-code"
              name="representativeCode"
              type="password"
              className="gestionnaire-auth-field__input"
              placeholder="Code secret représentant L&E Cosmetics Empire"
              autoComplete="off"
              maxLength={128}
              spellCheck={false}
              required
              disabled={isPending}
              aria-invalid={
                Boolean(
                  state
                    .fieldErrors
                    .representativeCode,
                )
              }
              aria-describedby={
                state
                  .fieldErrors
                  .representativeCode
                  ? "gestionnaire-representative-code-error"
                  : undefined
              }
            />
          </div>

          {state
            .fieldErrors
            .representativeCode ? (
            <p
              id="gestionnaire-representative-code-error"
              className="gestionnaire-auth-field__error"
            >
              {
                state
                  .fieldErrors
                  .representativeCode
              }
            </p>
          ) : null}
        </div>


        {/* ====================================================
            8. PASSWORD
            ==================================================== */}

        <PasswordField
          id="gestionnaire-password"
          name="password"
          label="Mot de passe"
          placeholder="Mot de passe"
          autoComplete="new-password"
          minLength={10}
          error={
            state
              .fieldErrors
              .password
          }
          disabled={isPending}
          required
        />


        {/* ====================================================
            9. PASSWORD CONFIRMATION
            ==================================================== */}

        <PasswordField
          id="gestionnaire-password-confirmation"
          name="passwordConfirmation"
          label="Confirmation du mot de passe"
          placeholder="Confirmation du mot de passe"
          autoComplete="new-password"
          minLength={10}
          error={
            confirmationError
          }
          disabled={isPending}
          required
        />
      </div>


      {/* ======================================================
          SUBMIT
          ====================================================== */}

      <button
        type="submit"
        className="gestionnaire-auth-form__submit"
        disabled={isPending}
        aria-disabled={isPending}
      >
        {isPending ? (
          <>
            <span
              className="gestionnaire-auth-spinner"
              aria-hidden="true"
            />

            <span>
              Création en cours...
            </span>
          </>
        ) : (
          <>
            <span>
              Créer mon espace gestionnaire
            </span>

            <span
              className="gestionnaire-auth-form__submit-icon"
              aria-hidden="true"
            >
              <ArrowRight
                size={20}
                strokeWidth={1.9}
              />
            </span>
          </>
        )}
      </button>


      {/* ======================================================
          ACCESSIBLE LOADING STATUS
          ====================================================== */}

      <span
        className="gestionnaire-auth-sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {isPending
          ? "Création de votre espace gestionnaire en cours."
          : ""}
      </span>


      {/* ======================================================
          LOGIN
          ====================================================== */}

      <div
        className="gestionnaire-auth-card__footer"
      >
        <span
          className="gestionnaire-auth-card__footer-text"
        >
          Déjà inscrit ?{" "}

          <Link
            href={
              routes
                .gestionnaire
                .login
            }
            className="gestionnaire-auth-card__footer-link"
          >
            Se connecter
          </Link>
        </span>
      </div>
    </form>
  );
}