"use client";

import {
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import {
  useState,
} from "react";


/* ============================================================
   L&E COSMETICS EMPIRE
   PASSWORD FIELD — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/PasswordField.tsx

   UTILISÉ NOTAMMENT PAR :

   - RegistrationForm.tsx
   - LoginForm.tsx

   OBJECTIFS :

   - fournir un vrai champ password accessible ;
   - afficher une icône cadenas ;
   - permettre afficher / masquer le mot de passe ;
   - ne jamais stocker la valeur du mot de passe dans React ;
   - afficher les erreurs sous le champ ;
   - supporter inscription + connexion ;
   - supporter required / minLength / maxLength ;
   - fonctionner au clavier ;
   - fonctionner sur desktop et mobile.

   SÉCURITÉ :

   Ce composant ne réalise aucune authentification.

   Il ne connaît jamais :

   - passwordHash ;
   - managerId ;
   - storeId ;
   - SESSION_SECRET ;
   - OTP ;
   - code représentant.

   La valeur du mot de passe reste uniquement dans l'élément
   HTML <input> jusqu'à l'envoi du formulaire.

   Elle n'est jamais placée dans :

   - useState ;
   - localStorage ;
   - sessionStorage ;
   - une URL ;
   - un log.

   Les validations de sécurité définitives sont toujours
   réalisées côté serveur.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type PasswordFieldProps =
  Readonly<{
    id:
      string;

    name:
      string;

    label:
      string;

    placeholder?:
      string;

    autoComplete?:
      string;

    minLength?:
      number;

    maxLength?:
      number;

    error?:
      string |
      null;

    disabled?:
      boolean;

    required?:
      boolean;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function PasswordField({
  id,
  name,
  label,
  placeholder,
  autoComplete = "new-password",
  minLength,
  maxLength = 128,
  error = null,
  disabled = false,
  required = false,
}: PasswordFieldProps) {
  /* ==========================================================
     VISIBILITY STATE ONLY
     ----------------------------------------------------------
     IMPORTANT :

     Ce state contient uniquement :

     true / false

     Il ne contient jamais la valeur du mot de passe.
     ========================================================== */

  const [
    isPasswordVisible,
    setIsPasswordVisible,
  ] =
    useState(
      false,
    );


  /* ==========================================================
     IDS
     ========================================================== */

  const errorId =
    `${id}-error`;


  const requirementsId =
    `${id}-requirements`;


  const toggleId =
    `${id}-visibility-toggle`;


  /* ==========================================================
     PASSWORD REQUIREMENTS
     ----------------------------------------------------------
     Pour l'inscription :

     <PasswordField
       name="password"
       minLength={10}
     />

     affichera :

     "10 caractères minimum."

     Pour la connexion, aucun minLength n'est fourni et aucune
     règle inutile n'est affichée.
     ========================================================== */

  const shouldShowRequirements =
    name ===
      "password" &&
    typeof minLength ===
      "number" &&
    Number.isFinite(
      minLength,
    ) &&
    minLength >
      0;


  /* ==========================================================
     ARIA DESCRIBED BY
     ========================================================== */

  const describedBy =
    [
      error
        ? errorId
        : null,

      shouldShowRequirements
        ? requirementsId
        : null,
    ]
      .filter(
        (
          value,
        ):
          value is string =>
            Boolean(
              value,
            ),
      )
      .join(
        " ",
      ) ||
    undefined;


  /* ==========================================================
     TOGGLE PASSWORD VISIBILITY
     ========================================================== */

  function togglePasswordVisibility():
    void {
    if (
      disabled
    ) {
      return;
    }


    setIsPasswordVisible(
      (
        currentValue,
      ) =>
        !currentValue,
    );
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div
      className={[
        "gestionnaire-auth-field",

        "gestionnaire-password-field",

        error
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
      {/* ======================================================
          ACCESSIBLE LABEL
          ------------------------------------------------------
          Le placeholder visible ne remplace jamais le label
          technique accessible.
          ====================================================== */}

      <label
        htmlFor={id}
        className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
      >
        {label}

        {required ? (
          <span className="gestionnaire-auth-sr-only">
            {" "}
            obligatoire
          </span>
        ) : null}
      </label>


      {/* ======================================================
          FIELD CONTROL
          ====================================================== */}

      <div className="gestionnaire-auth-field__control gestionnaire-password-field__control">
        {/* ----------------------------------------------------
            LOCK ICON
            ---------------------------------------------------- */}

        <span
          className="gestionnaire-auth-field__icon"
          aria-hidden="true"
        >
          <LockKeyhole
            size={21}
            strokeWidth={1.7}
          />
        </span>


        {/* ----------------------------------------------------
            PASSWORD INPUT
            ----------------------------------------------------
            IMPORTANT :

            La valeur n'est pas contrôlée par React.

            Aucun :
            value={...}
            onChange={...}
            useState(password)

            n'est utilisé.
            ---------------------------------------------------- */}

        <input
          id={id}
          name={name}
          type={
            isPasswordVisible
              ? "text"
              : "password"
          }
          className="gestionnaire-auth-field__input gestionnaire-auth-field__input--with-action"
          placeholder={
            placeholder ??
            label
          }
          autoComplete={
            autoComplete
          }
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          minLength={
            minLength
          }
          maxLength={
            maxLength
          }
          required={
            required
          }
          disabled={
            disabled
          }
          aria-invalid={
            error
              ? true
              : undefined
          }
          aria-required={
            required
              ? true
              : undefined
          }
          aria-describedby={
            describedBy
          }
        />


        {/* ----------------------------------------------------
            SHOW / HIDE PASSWORD
            ---------------------------------------------------- */}

        <button
          id={toggleId}
          type="button"
          className="gestionnaire-password-field__toggle"
          onClick={
            togglePasswordVisibility
          }
          disabled={
            disabled
          }
          aria-controls={id}
          aria-pressed={
            isPasswordVisible
          }
          aria-label={
            isPasswordVisible
              ? "Masquer le mot de passe"
              : "Afficher le mot de passe"
          }
          title={
            isPasswordVisible
              ? "Masquer le mot de passe"
              : "Afficher le mot de passe"
          }
        >
          {isPasswordVisible ? (
            <EyeOff
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          ) : (
            <Eye
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          )}
        </button>
      </div>


      {/* ======================================================
          PASSWORD REQUIREMENTS
          ------------------------------------------------------
          Information UX uniquement.

          La règle réelle doit toujours être contrôlée à nouveau
          côté serveur.
          ====================================================== */}

      {shouldShowRequirements ? (
        <p
          id={requirementsId}
          className="gestionnaire-password-field__requirements"
        >
          {minLength} caractères minimum.
        </p>
      ) : null}


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