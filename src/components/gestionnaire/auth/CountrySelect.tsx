"use client";

import {
  ChevronDown,
  Globe2,
} from "lucide-react";

import {
  COUNTRIES,
} from "@/config/countries";


/* ============================================================
   COSMETICS EMPIRE
   COUNTRY SELECT — INSCRIPTION GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/CountrySelect.tsx

   UTILISÉ PAR :

   src/components/gestionnaire/auth/RegistrationForm.tsx

   OBJECTIF :

   - afficher la liste des pays ;
   - recevoir éventuellement le pays détecté côté serveur ;
   - permettre TOUJOURS une modification manuelle ;
   - rester accessible au clavier ;
   - fonctionner correctement sur mobile ;
   - ne pas dépendre d'une grosse bibliothèque externe.

   IMPORTANT :

   detectedCountry n'est PAS géré directement ici.

   Le flux est :

   country-detection.ts
          ↓
   inscription/page.tsx
          ↓
   RegistrationForm.tsx
          ↓
   value
          ↓
   CountrySelect.tsx

   Une fois que l'utilisateur change le pays, ce composant
   transmet son choix à RegistrationForm via onChange().

   La détection IP n'écrase donc jamais un choix manuel.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type CountrySelectProps =
  Readonly<{
    id: string;
    name: string;

    value: string;

    onChange:
      (countryCode: string) => void;

    error?:
      string | null;

    disabled?:
      boolean;

    required?:
      boolean;
  }>;


/* ============================================================
   NORMALIZE COUNTRY CODE
   ============================================================ */

function normalizeCountryCode(
  value: string,
): string {
  return value
    .trim()
    .toUpperCase();
}


/* ============================================================
   CHECK AVAILABLE COUNTRY
   ------------------------------------------------------------
   Permet d'éviter d'envoyer une valeur inconnue à un select
   contrôlé si une infrastructure retourne exceptionnellement
   un code pays non présent dans notre configuration.
   ============================================================ */

function isAvailableCountry(
  countryCode: string,
): boolean {
  if (!countryCode) {
    return false;
  }

  return COUNTRIES.some(
    (country) =>
      country.code ===
      countryCode,
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function CountrySelect({
  id,
  name,
  value,
  onChange,
  error = null,
  disabled = false,
  required = false,
}: CountrySelectProps) {
  /* ----------------------------------------------------------
     NORMALIZED VALUE
     ---------------------------------------------------------- */

  const normalizedValue =
    normalizeCountryCode(
      value,
    );


  /*
   * Si la valeur détectée n'existe pas dans la configuration,
   * le select reste simplement sur "Pays".
   *
   * Cela ne bloque jamais l'inscription.
   */

  const selectedValue =
    isAvailableCountry(
      normalizedValue,
    )
      ? normalizedValue
      : "";


  /* ----------------------------------------------------------
     ACCESSIBILITY IDS
     ---------------------------------------------------------- */

  const errorId =
    `${id}-error`;


  /* ==========================================================
     CHANGE
     ========================================================== */

  function handleChange(
    event:
      React.ChangeEvent<HTMLSelectElement>,
  ) {
    onChange(
      normalizeCountryCode(
        event.target.value,
      ),
    );
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
          ------------------------------------------------------
          Visuellement, la maquette utilise le texte "Pays"
          directement dans le champ.

          Techniquement, nous gardons quand même un vrai label
          pour les lecteurs d'écran et la navigation accessible.
          ====================================================== */}

      <label
        htmlFor={id}
        className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
      >
        Pays
      </label>


      {/* ======================================================
          SELECT CONTROL
          ====================================================== */}

      <div className="gestionnaire-auth-field__control">
        {/* ----------------------------------------------------
            LEFT ICON
            ---------------------------------------------------- */}

        <span
          className="gestionnaire-auth-field__icon"
          aria-hidden="true"
        >
          <Globe2
            size={21}
            strokeWidth={1.7}
          />
        </span>


        {/* ----------------------------------------------------
            NATIVE SELECT
            ----------------------------------------------------

            On utilise volontairement un vrai <select>.

            Avantages :

            - excellent support mobile ;
            - navigation clavier native ;
            - lecteurs d'écran ;
            - aucune grosse dépendance ;
            - comportement fiable ;
            - performance maximale.
            ---------------------------------------------------- */}

        <div className="gestionnaire-country-select">
          <select
            id={id}
            name={name}
            className="gestionnaire-country-select__select"
            value={selectedValue}
            onChange={handleChange}
            autoComplete="country"
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
          >
            {/* ------------------------------------------------
                PLACEHOLDER
                ------------------------------------------------ */}

            <option
              value=""
              disabled={required}
            >
              Pays
            </option>


            {/* ------------------------------------------------
                COUNTRIES
                ------------------------------------------------ */}

            {COUNTRIES.map(
              (country) => (
                <option
                  key={country.code}
                  value={country.code}
                >
                  {country.name}
                </option>
              ),
            )}
          </select>


          {/* --------------------------------------------------
              RIGHT CHEVRON
              -------------------------------------------------- */}

          <span
            className="gestionnaire-country-select__chevron"
            aria-hidden="true"
          >
            <ChevronDown
              size={19}
              strokeWidth={1.8}
            />
          </span>
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