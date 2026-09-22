"use client";

import Link from "next/link";

import {
  AlertCircle,
  ArrowRight,
  Mail,
  ShieldCheck,
} from "lucide-react";

import {
  useActionState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  loginGestionnaireAction,
  type LoginActionState,
} from "@/app/gestionnaire/(auth)/connexion/actions";

import {
  routes,
} from "@/config/routes";

import PasswordField from "./PasswordField";


/* ============================================================
   L&E COSMETICS EMPIRE
   LOGIN FORM — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/LoginForm.tsx

   Route :
   /gestionnaire/connexion

   OBJECTIF :

   Formulaire de connexion volontairement simple :

   - adresse e-mail ;
   - mot de passe ;
   - mot de passe oublié ;
   - bouton Se connecter ;
   - lien inscription ;
   - message connexion sécurisée.

   SÉCURITÉ :

   Ce composant client :

   - ne vérifie jamais le mot de passe ;
   - ne connaît jamais le passwordHash ;
   - ne connaît jamais le managerId ;
   - ne connaît jamais le storeId ;
   - ne crée jamais la session ;
   - ne stocke jamais le mot de passe dans React state ;
   - ne stocke jamais de token dans localStorage ;
   - ne décide jamais qu'un compte est ACTIVE.

   Toutes les décisions sensibles sont effectuées côté serveur.
   ============================================================ */


/* ============================================================
   ROUTE MOT DE PASSE OUBLIÉ
   ------------------------------------------------------------
   Cette route sera ensuite ajoutée à routes.ts lorsqu'elle sera
   construite définitivement.

   Elle reste locale ici tant qu'elle n'existe pas encore dans
   la configuration centrale afin de ne pas casser TypeScript.
   ============================================================ */

const FORGOT_PASSWORD_ROUTE =
  "/gestionnaire/mot-de-passe-oublie";


/* ============================================================
   INITIAL ACTION STATE
   ------------------------------------------------------------
   IMPORTANT :

   Cette constante reste dans le composant client.

   Elle ne doit PAS être exportée depuis actions.ts car ce
   fichier est marqué "use server".
   ============================================================ */

const INITIAL_LOGIN_STATE:
  LoginActionState = {
  status:
    "idle",

  message:
    null,

  fieldErrors:
    {},

  values: {
    email:
      "",
  },

  retryAfterSeconds:
    null,
};


/* ============================================================
   COMPONENT
   ============================================================ */

export default function LoginForm() {
  /* ==========================================================
     SERVER ACTION STATE
     ========================================================== */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      loginGestionnaireAction,
      INITIAL_LOGIN_STATE,
    );


  /* ==========================================================
     FORM SUBMIT GUARD
     ----------------------------------------------------------
     useActionState fournit déjà isPending.

     Cette protection évite simplement un double submit manuel
     lorsqu'une requête est déjà en cours.
     ========================================================== */

  function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ): void {
    if (
      isPending
    ) {
      event.preventDefault();
    }
  }


  /* ==========================================================
     GLOBAL MESSAGE TYPE
     ========================================================== */

  const hasGlobalMessage =
    Boolean(
      state.message,
    );


  const verificationRequired =
    state.status ===
    "verification_required";


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <form
      className="gestionnaire-login-form"
      action={formAction}
      onSubmit={handleSubmit}
      aria-busy={isPending}
    >
      {/* ======================================================
          GLOBAL MESSAGE
          ------------------------------------------------------
          Mauvais e-mail / mot de passe :
          message générique.

          Vérification nécessaire :
          message neutre d'information.
          ====================================================== */}

      {hasGlobalMessage ? (
        <div
          className={[
            "gestionnaire-login-form__message",

            verificationRequired
              ? "gestionnaire-login-form__message--verification"
              : "gestionnaire-login-form__message--error",
          ]
            .filter(Boolean)
            .join(" ")}
          role={
            verificationRequired
              ? "status"
              : "alert"
          }
          aria-live="polite"
        >
          <span
            className="gestionnaire-login-form__message-icon"
            aria-hidden="true"
          >
            {verificationRequired ? (
              <ShieldCheck
                size={19}
                strokeWidth={1.9}
              />
            ) : (
              <AlertCircle
                size={19}
                strokeWidth={1.9}
              />
            )}
          </span>

          <span className="gestionnaire-login-form__message-text">
            {state.message}
          </span>
        </div>
      ) : null}


      {/* ======================================================
          FIELDS
          ====================================================== */}

      <div className="gestionnaire-login-form__fields">
        {/* ====================================================
            EMAIL
            ==================================================== */}

        <div
          className={[
            "gestionnaire-auth-field",
            "gestionnaire-login-field",

            state.fieldErrors.email
              ? "gestionnaire-auth-field--error"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* --------------------------------------------------
              ACCESSIBLE LABEL
              --------------------------------------------------
              Visuellement la maquette utilise le placeholder.

              Le label existe quand même pour les technologies
              d'assistance.
              -------------------------------------------------- */}

          <label
            htmlFor="gestionnaire-login-email"
            className="gestionnaire-auth-field__label gestionnaire-auth-field__label--sr-only"
          >
            Adresse e-mail
          </label>


          <div className="gestionnaire-auth-field__control gestionnaire-login-field__control">
            <span
              className="gestionnaire-auth-field__icon gestionnaire-login-field__icon"
              aria-hidden="true"
            >
              <Mail
                size={22}
                strokeWidth={1.8}
              />
            </span>


            <input
              id="gestionnaire-login-email"
              name="email"
              type="email"
              className="gestionnaire-auth-field__input gestionnaire-login-field__input"
              placeholder="Adresse e-mail"
              defaultValue={
                state.values.email
              }
              autoComplete="email"
              inputMode="email"
              enterKeyHint="next"
              autoCapitalize="none"
              maxLength={254}
              spellCheck={false}
              required
              disabled={isPending}
              aria-invalid={
                state.fieldErrors.email
                  ? true
                  : undefined
              }
              aria-describedby={
                state.fieldErrors.email
                  ? "gestionnaire-login-email-error"
                  : undefined
              }
            />
          </div>


          {state.fieldErrors.email ? (
            <p
              id="gestionnaire-login-email-error"
              className="gestionnaire-auth-field__error gestionnaire-login-field__error"
            >
              {
                state.fieldErrors
                  .email
              }
            </p>
          ) : null}
        </div>


        {/* ====================================================
            PASSWORD
            ----------------------------------------------------
            PasswordField existant :

            - input password ;
            - cadenas ;
            - afficher / masquer ;
            - gestion de l'erreur ;
            - accessibilité.

            Le mot de passe n'est jamais placé dans useState().
            ==================================================== */}

        <div className="gestionnaire-login-form__password">
          <PasswordField
            id="gestionnaire-login-password"
            name="password"
            label="Mot de passe"
            placeholder="Mot de passe"
            autoComplete="current-password"
            error={
              state.fieldErrors
                .password
            }
            disabled={isPending}
            required
          />
        </div>
      </div>


      {/* ======================================================
          FORGOT PASSWORD
          ====================================================== */}

      <div className="gestionnaire-login-form__forgot">
        <Link
          href={FORGOT_PASSWORD_ROUTE}
          className="gestionnaire-login-form__forgot-link"
          aria-disabled={
            isPending
              ? true
              : undefined
          }
          tabIndex={
            isPending
              ? -1
              : undefined
          }
        >
          Mot de passe oublié ?
        </Link>
      </div>


      {/* ======================================================
          SUBMIT
          ====================================================== */}

      <button
        type="submit"
        className="gestionnaire-login-form__submit"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <span
              className="gestionnaire-login-form__spinner"
              aria-hidden="true"
            />

            <span>
              Connexion...
            </span>
          </>
        ) : (
          <>
            <span>
              Se connecter
            </span>

            <ArrowRight
              className="gestionnaire-login-form__submit-icon"
              size={21}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </>
        )}
      </button>


      {/* ======================================================
          SCREEN READER SUBMIT STATUS
          ====================================================== */}

      <span
        className="gestionnaire-login-sr-only"
        role="status"
        aria-live="polite"
      >
        {isPending
          ? "Connexion à votre espace gestionnaire en cours."
          : ""}
      </span>


      {/* ======================================================
          DIVIDER
          ====================================================== */}

      <div
        className="gestionnaire-login-form__divider"
        aria-hidden="true"
      >
        <span className="gestionnaire-login-form__divider-line" />

        <span className="gestionnaire-login-form__divider-text">
          ou
        </span>

        <span className="gestionnaire-login-form__divider-line" />
      </div>


      {/* ======================================================
          CREATE ACCOUNT
          ====================================================== */}

      <div className="gestionnaire-login-form__register">
        <span className="gestionnaire-login-form__register-text">
          Pas encore de compte ?
        </span>

        <Link
          href={
            routes
              .gestionnaire
              .register
          }
          className="gestionnaire-login-form__register-link"
        >
          Créer un compte
        </Link>
      </div>


      {/* ======================================================
          SECURE CONNECTION NOTICE
          ------------------------------------------------------
          Présent exactement dans l'esprit de la maquette.

          Ce bloc est informatif uniquement.

          Il ne prétend pas remplacer les vraies protections
          serveur qui sont gérées par login.ts + session.ts.
          ====================================================== */}

      <div className="gestionnaire-login-security">
        <span
          className="gestionnaire-login-security__icon"
          aria-hidden="true"
        >
          <ShieldCheck
            size={35}
            strokeWidth={1.8}
          />
        </span>


        <div className="gestionnaire-login-security__content">
          <strong className="gestionnaire-login-security__title">
            Connexion sécurisée
          </strong>

          <span className="gestionnaire-login-security__description">
            Vos données sont protégées et confidentielles.
          </span>
        </div>
      </div>
    </form>
  );
}