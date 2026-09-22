"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import {
  Suspense,
  useActionState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import PasswordField from "@/components/gestionnaire/auth/PasswordField";

import {
  routes,
} from "@/config/routes";

import {
  resetPasswordAction,
  type ResetPasswordActionState,
} from "./actions";

import "../connexion/connexion.css";


/* ============================================================
   L&E COSMETICS EMPIRE
   RÉINITIALISER LE MOT DE PASSE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/
   reinitialiser-mot-de-passe/page.tsx

   Route :
   /gestionnaire/reinitialiser-mot-de-passe?token=...

   OBJECTIFS :

   - récupérer le token présent dans l'URL ;
   - ne jamais afficher le token ;
   - demander uniquement :
       1. nouveau mot de passe ;
       2. confirmation ;
   - transmettre le token par champ hidden ;
   - utiliser PasswordField existant ;
   - afficher les erreurs proprement ;
   - afficher le succès ;
   - proposer un nouveau lien si le token est invalide ;
   - permettre le retour à la connexion ;
   - rester compatible avec le prerender/build Next.js.

   IMPORTANT :

   La page ne considère jamais le token comme valide uniquement
   parce qu'il existe dans l'URL.

   Sa vérification cryptographique définitive est réalisée par :

   src/server/gestionnaire/auth/password-reset.ts

   IMPORTANT NEXT.JS :

   useSearchParams() est volontairement isolé dans
   ResetPasswordContent et rendu sous une boundary Suspense.

   Cela évite l'échec du prerender pendant :

   npm run build
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const PASSWORD_MIN_LENGTH =
  10;


const PASSWORD_MAX_LENGTH =
  128;


const MAX_RESET_TOKEN_LENGTH =
  4_096;


/* ============================================================
   INITIAL ACTION STATE
   ============================================================ */

const INITIAL_STATE:
  ResetPasswordActionState = {
  status:
    "idle",

  message:
    null,

  fieldErrors:
    {},
};


/* ============================================================
   BASIC TOKEN FORMAT
   ------------------------------------------------------------
   Ceci n'est PAS une validation de sécurité.

   Il s'agit seulement d'éviter d'afficher le formulaire quand
   l'URL ne contient manifestement aucun token exploitable.

   La vraie validation reste exclusivement côté serveur.
   ============================================================ */

function hasUsableTokenFormat(
  token:
    string,
): boolean {
  return (
    token.length >=
      20 &&
    token.length <=
      MAX_RESET_TOKEN_LENGTH &&
    !/[\u0000-\u001F\u007F]/.test(
      token,
    )
  );
}


/* ============================================================
   LOADING FALLBACK
   ------------------------------------------------------------
   Ce fallback est affiché pendant que Next.js prépare la partie
   cliente utilisant useSearchParams().

   Il ne lit :
   - aucun search param ;
   - aucun token ;
   - aucune donnée sensible.
   ============================================================ */

function ResetPasswordFallback() {
  return (
    <div className="gestionnaire-login-page">
      {/* ======================================================
          DECORATIONS
          ====================================================== */}

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--left"
        aria-hidden="true"
      />

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--right"
        aria-hidden="true"
      />


      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="gestionnaire-login-header">
        <div className="gestionnaire-login-header__inner">
          <Link
            href={
              routes
                .gestionnaire
                .root
            }
            className="gestionnaire-login-header__brand"
            aria-label="L&E Cosmetics Empire"
          >
            <span className="gestionnaire-login-header__logo">
              <Image
                src="/logos/logo.png"
                alt="L&E Cosmetics Empire"
                width={58}
                height={58}
                priority
                className="gestionnaire-login-header__logo-image"
              />
            </span>


            <span className="gestionnaire-login-header__brand-copy">
              <strong>
                L&E Cosmetics
              </strong>

              <span>
                Empire
              </span>
            </span>
          </Link>


          <div className="gestionnaire-login-header__register">
            <span className="gestionnaire-login-header__register-text">
              Vous connaissez votre mot de passe ?
            </span>

            <Link
              href={
                routes
                  .gestionnaire
                  .login
              }
              className="gestionnaire-login-header__register-button"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>


      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="gestionnaire-login-main">
        <section
          className="gestionnaire-login-card"
          aria-labelledby="gestionnaire-reset-password-loading-title"
          aria-busy="true"
        >
          <div className="gestionnaire-login-card__header">
            <span className="gestionnaire-login-card__eyebrow">
              SÉCURITÉ DU COMPTE
            </span>


            <h1
              id="gestionnaire-reset-password-loading-title"
              className="gestionnaire-login-card__title"
            >
              Chargement...
            </h1>


            <p className="gestionnaire-login-card__subtitle">
              Vérification du lien de réinitialisation.
            </p>
          </div>


          <div className="gestionnaire-login-form">
            <div
              className="gestionnaire-login-security"
              role="status"
              aria-live="polite"
            >
              <span
                className="gestionnaire-login-security__icon"
                aria-hidden="true"
              >
                <ShieldCheck
                  size={30}
                  strokeWidth={1.8}
                />
              </span>


              <div className="gestionnaire-login-security__content">
                <strong className="gestionnaire-login-security__title">
                  Vérification sécurisée
                </strong>

                <span className="gestionnaire-login-security__description">
                  Préparation de votre lien de réinitialisation.
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="gestionnaire-login-footer">
        <p className="gestionnaire-login-footer__copyright">
          © {new Date().getFullYear()} L&E Cosmetics Empire
        </p>
      </footer>
    </div>
  );
}


/* ============================================================
   RESET PASSWORD CONTENT
   ------------------------------------------------------------
   IMPORTANT :

   Ce composant contient useSearchParams().

   Il doit donc toujours être rendu sous <Suspense>.
   ============================================================ */

function ResetPasswordContent() {
  /* ==========================================================
     SEARCH PARAMS
     ========================================================== */

  const searchParams =
    useSearchParams();


  const token =
    searchParams
      .get(
        "token",
      )
      ?.trim() ??
    "";


  const hasToken =
    hasUsableTokenFormat(
      token,
    );


  /* ==========================================================
     SERVER ACTION
     ========================================================== */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      resetPasswordAction,
      INITIAL_STATE,
    );


  /* ==========================================================
     FORM SUBMIT GUARD
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
     STATES
     ========================================================== */

  const isSuccess =
    state.status ===
    "success";


  const hasInvalidToken =
    !hasToken ||
    state.status ===
      "invalid_token";


  const hasGlobalError =
    state.status ===
      "error" &&
    Boolean(
      state.message,
    );


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="gestionnaire-login-page">
      {/* ======================================================
          DECORATIONS
          ====================================================== */}

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--left"
        aria-hidden="true"
      />

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--right"
        aria-hidden="true"
      />


      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="gestionnaire-login-header">
        <div className="gestionnaire-login-header__inner">
          {/* --------------------------------------------------
              BRAND
              -------------------------------------------------- */}

          <Link
            href={
              routes
                .gestionnaire
                .root
            }
            className="gestionnaire-login-header__brand"
            aria-label="L&E Cosmetics Empire"
          >
            <span className="gestionnaire-login-header__logo">
              <Image
                src="/logos/logo.png"
                alt="L&E Cosmetics Empire"
                width={58}
                height={58}
                priority
                className="gestionnaire-login-header__logo-image"
              />
            </span>


            <span className="gestionnaire-login-header__brand-copy">
              <strong>
                L&E Cosmetics
              </strong>

              <span>
                Empire
              </span>
            </span>
          </Link>


          {/* --------------------------------------------------
              LOGIN
              -------------------------------------------------- */}

          <div className="gestionnaire-login-header__register">
            <span className="gestionnaire-login-header__register-text">
              Vous connaissez votre mot de passe ?
            </span>

            <Link
              href={
                routes
                  .gestionnaire
                  .login
              }
              className="gestionnaire-login-header__register-button"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </header>


      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="gestionnaire-login-main">
        <section
          className="gestionnaire-login-card"
          aria-labelledby="gestionnaire-reset-password-title"
        >
          {/* ==================================================
              SUCCESS
              ================================================== */}

          {isSuccess ? (
            <>
              <div className="gestionnaire-login-card__header">
                <span className="gestionnaire-login-card__eyebrow">
                  MOT DE PASSE MODIFIÉ
                </span>


                <h1
                  id="gestionnaire-reset-password-title"
                  className="gestionnaire-login-card__title"
                >
                  Mot de passe réinitialisé
                </h1>


                <p className="gestionnaire-login-card__subtitle">
                  Votre nouveau mot de passe est maintenant actif.
                </p>
              </div>


              <div
                className="gestionnaire-login-form"
                aria-live="polite"
              >
                <div
                  className="gestionnaire-login-form__message gestionnaire-login-form__message--verification"
                  role="status"
                >
                  <span
                    className="gestionnaire-login-form__message-icon"
                    aria-hidden="true"
                  >
                    <CheckCircle2
                      size={20}
                      strokeWidth={1.9}
                    />
                  </span>

                  <span className="gestionnaire-login-form__message-text">
                    {
                      state.message ??
                      "Votre mot de passe a été réinitialisé avec succès."
                    }
                  </span>
                </div>


                <div className="gestionnaire-login-security">
                  <span
                    className="gestionnaire-login-security__icon"
                    aria-hidden="true"
                  >
                    <ShieldCheck
                      size={28}
                      strokeWidth={1.8}
                    />
                  </span>

                  <div className="gestionnaire-login-security__content">
                    <strong className="gestionnaire-login-security__title">
                      Votre compte est protégé
                    </strong>

                    <span className="gestionnaire-login-security__description">
                      Le lien utilisé pour cette réinitialisation
                      ne pourra plus servir avec l’ancien état du
                      mot de passe.
                    </span>
                  </div>
                </div>


                <Link
                  href={
                    routes
                      .gestionnaire
                      .login
                  }
                  className="gestionnaire-login-form__submit"
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <span>
                    Se connecter
                  </span>

                  <ArrowRight
                    size={20}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </>
          ) : hasInvalidToken ? (
            /* =================================================
               INVALID / EXPIRED TOKEN
               ================================================= */

            <>
              <div className="gestionnaire-login-card__header">
                <span className="gestionnaire-login-card__eyebrow">
                  LIEN DE SÉCURITÉ
                </span>


                <h1
                  id="gestionnaire-reset-password-title"
                  className="gestionnaire-login-card__title"
                >
                  Lien invalide ou expiré
                </h1>


                <p className="gestionnaire-login-card__subtitle">
                  Ce lien de réinitialisation ne peut plus être
                  utilisé.
                </p>
              </div>


              <div className="gestionnaire-login-form">
                <div
                  className="gestionnaire-login-form__message gestionnaire-login-form__message--error"
                  role="alert"
                >
                  <span
                    className="gestionnaire-login-form__message-icon"
                    aria-hidden="true"
                  >
                    <AlertCircle
                      size={20}
                      strokeWidth={1.9}
                    />
                  </span>

                  <span className="gestionnaire-login-form__message-text">
                    {
                      state.status ===
                        "invalid_token" &&
                      state.message
                        ? state.message
                        : "Le lien de réinitialisation est absent, invalide ou a expiré. Demandez un nouveau lien."
                    }
                  </span>
                </div>


                <Link
                  href={
                    routes
                      .gestionnaire
                      .forgotPassword
                  }
                  className="gestionnaire-login-form__submit"
                  style={{
                    textDecoration:
                      "none",
                  }}
                >
                  <KeyRound
                    size={19}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Demander un nouveau lien
                  </span>
                </Link>


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


                <div className="gestionnaire-login-form__register">
                  <Link
                    href={
                      routes
                        .gestionnaire
                        .login
                    }
                    className="gestionnaire-login-form__register-link"
                  >
                    <ArrowLeft
                      size={15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                      style={{
                        verticalAlign:
                          "middle",

                        marginRight:
                          "5px",
                      }}
                    />

                    Retour à la connexion
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* =================================================
               RESET FORM
               ================================================= */

            <>
              <div className="gestionnaire-login-card__header">
                <span className="gestionnaire-login-card__eyebrow">
                  SÉCURITÉ DU COMPTE
                </span>


                <h1
                  id="gestionnaire-reset-password-title"
                  className="gestionnaire-login-card__title"
                >
                  Nouveau mot de passe
                </h1>


                <p className="gestionnaire-login-card__subtitle">
                  Choisissez un nouveau mot de passe pour votre
                  espace gestionnaire.
                </p>
              </div>


              <form
                className="gestionnaire-login-form"
                action={formAction}
                onSubmit={handleSubmit}
                aria-busy={isPending}
              >
                {/* =============================================
                    TOKEN
                    ------------------------------------------------
                    Le token n'est jamais affiché.

                    Il est transmis à la Server Action uniquement
                    pour sa validation cryptographique serveur.
                    ============================================= */}

                <input
                  type="hidden"
                  name="token"
                  value={token}
                />


                {/* =============================================
                    GLOBAL ERROR
                    ============================================= */}

                {hasGlobalError ? (
                  <div
                    className="gestionnaire-login-form__message gestionnaire-login-form__message--error"
                    role="alert"
                    aria-live="polite"
                  >
                    <span
                      className="gestionnaire-login-form__message-icon"
                      aria-hidden="true"
                    >
                      <AlertCircle
                        size={19}
                        strokeWidth={1.9}
                      />
                    </span>

                    <span className="gestionnaire-login-form__message-text">
                      {state.message}
                    </span>
                  </div>
                ) : null}


                {/* =============================================
                    PASSWORD FIELDS
                    ============================================= */}

                <div className="gestionnaire-login-form__fields">
                  <PasswordField
                    id="gestionnaire-reset-password"
                    name="password"
                    label="Nouveau mot de passe"
                    placeholder="Nouveau mot de passe"
                    autoComplete="new-password"
                    minLength={
                      PASSWORD_MIN_LENGTH
                    }
                    maxLength={
                      PASSWORD_MAX_LENGTH
                    }
                    error={
                      state
                        .fieldErrors
                        .password
                    }
                    disabled={
                      isPending
                    }
                    required
                  />


                  <PasswordField
                    id="gestionnaire-reset-password-confirmation"
                    name="passwordConfirmation"
                    label="Confirmer le nouveau mot de passe"
                    placeholder="Confirmer le nouveau mot de passe"
                    autoComplete="new-password"
                    minLength={
                      PASSWORD_MIN_LENGTH
                    }
                    maxLength={
                      PASSWORD_MAX_LENGTH
                    }
                    error={
                      state
                        .fieldErrors
                        .passwordConfirmation
                    }
                    disabled={
                      isPending
                    }
                    required
                  />
                </div>


                {/* =============================================
                    SUBMIT
                    ============================================= */}

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
                        Modification en cours...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        Enregistrer le nouveau mot de passe
                      </span>

                      <ArrowRight
                        className="gestionnaire-login-form__submit-icon"
                        size={20}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>


                {/* =============================================
                    ACCESSIBLE LOADING STATE
                    ============================================= */}

                <span
                  className="gestionnaire-login-sr-only"
                  role="status"
                  aria-live="polite"
                >
                  {isPending
                    ? "Réinitialisation du mot de passe en cours."
                    : ""}
                </span>


                {/* =============================================
                    BACK TO LOGIN
                    ============================================= */}

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


                <div className="gestionnaire-login-form__register">
                  <Link
                    href={
                      routes
                        .gestionnaire
                        .login
                    }
                    className="gestionnaire-login-form__register-link"
                  >
                    <ArrowLeft
                      size={15}
                      strokeWidth={1.9}
                      aria-hidden="true"
                      style={{
                        verticalAlign:
                          "middle",

                        marginRight:
                          "5px",
                      }}
                    />

                    Retour à la connexion
                  </Link>
                </div>


                {/* =============================================
                    SECURITY NOTICE
                    ============================================= */}

                <div className="gestionnaire-login-security">
                  <span
                    className="gestionnaire-login-security__icon"
                    aria-hidden="true"
                  >
                    <ShieldCheck
                      size={30}
                      strokeWidth={1.8}
                    />
                  </span>


                  <div className="gestionnaire-login-security__content">
                    <strong className="gestionnaire-login-security__title">
                      Réinitialisation sécurisée
                    </strong>

                    <span className="gestionnaire-login-security__description">
                      Votre nouveau mot de passe est traité uniquement
                      côté serveur et enregistré sous forme de hash
                      Argon2id.
                    </span>
                  </div>
                </div>
              </form>
            </>
          )}
        </section>
      </main>


      {/* ======================================================
          FOOTER
          ====================================================== */}

      <footer className="gestionnaire-login-footer">
        <p className="gestionnaire-login-footer__copyright">
          © {new Date().getFullYear()} L&E Cosmetics Empire
        </p>
      </footer>
    </div>
  );
}


/* ============================================================
   PAGE EXPORT
   ------------------------------------------------------------
   IMPORTANT :

   ResetPasswordContent utilise useSearchParams().

   Next.js exige que cette partie soit placée derrière une
   boundary Suspense afin que le build/prerender puisse gérer
   correctement le rendu dynamique lié aux paramètres d'URL.
   ============================================================ */

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordFallback />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}