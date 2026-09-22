"use client";

import Image from "next/image";
import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
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
  forgotPasswordAction,
  type ForgotPasswordActionState,
} from "./actions";

import {
  routes,
} from "@/config/routes";

/*
 * On réutilise volontairement le design de la connexion.
 *
 * Aucun deuxième gros fichier CSS n'est nécessaire pour cette
 * page simple.
 */
import "../connexion/connexion.css";


/* ============================================================
   L&E COSMETICS EMPIRE
   MOT DE PASSE OUBLIÉ — PAGE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/mot-de-passe-oublie/page.tsx

   Route :
   /gestionnaire/mot-de-passe-oublie

   OBJECTIF :

   - demander uniquement l'adresse e-mail ;
   - envoyer la demande à la Server Action ;
   - afficher un message générique après envoi ;
   - ne jamais révéler si un compte existe ;
   - permettre de revenir à la connexion ;
   - rester cohérent avec la page Connexion.

   AUCUN :

   - mot de passe ;
   - token ;
   - managerId ;
   - storeId ;
   - secret ;
   - code OTP

   n'est manipulé dans cette interface.
   ============================================================ */


/* ============================================================
   INITIAL STATE
   ============================================================ */

const INITIAL_STATE:
  ForgotPasswordActionState = {
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
   PAGE
   ============================================================ */

export default function ForgotPasswordPage() {
  /* ==========================================================
     SERVER ACTION
     ========================================================== */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      forgotPasswordAction,
      INITIAL_STATE,
    );


  /* ==========================================================
     SUBMIT GUARD
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
     STATUS
     ========================================================== */

  const isSuccess =
    state.status ===
    "success";


  const hasError =
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
          BACKGROUND DECORATIONS
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
              BACK TO LOGIN
              -------------------------------------------------- */}

          <div className="gestionnaire-login-header__register">
            <span className="gestionnaire-login-header__register-text">
              Vous avez retrouvé votre mot de passe ?
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
          aria-labelledby="gestionnaire-forgot-password-title"
        >
          {/* ==================================================
              CARD HEADER
              ================================================== */}

          <div className="gestionnaire-login-card__header">
            <span className="gestionnaire-login-card__eyebrow">
              SÉCURITÉ DU COMPTE
            </span>


            <h1
              id="gestionnaire-forgot-password-title"
              className="gestionnaire-login-card__title"
            >
              Mot de passe oublié ?
            </h1>


            <p className="gestionnaire-login-card__subtitle">
              Saisissez l’adresse e-mail associée à votre espace
              gestionnaire. Nous vous enverrons un lien pour créer
              un nouveau mot de passe.
            </p>
          </div>


          {/* ==================================================
              SUCCESS
              ================================================== */}

          {isSuccess ? (
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
                  {state.message}
                </span>
              </div>


              <div className="gestionnaire-login-security">
                <span
                  className="gestionnaire-login-security__icon"
                  aria-hidden="true"
                >
                  <Mail
                    size={25}
                    strokeWidth={1.8}
                  />
                </span>

                <div className="gestionnaire-login-security__content">
                  <strong className="gestionnaire-login-security__title">
                    Vérifiez votre boîte e-mail
                  </strong>

                  <span className="gestionnaire-login-security__description">
                    Le lien de réinitialisation est valable pendant
                    20 minutes. Pensez également à vérifier vos
                    courriers indésirables.
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
                <ArrowLeft
                  size={19}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Retour à la connexion
                </span>
              </Link>
            </div>
          ) : (
            /* =================================================
               REQUEST FORM
               ================================================= */

            <form
              className="gestionnaire-login-form"
              action={formAction}
              onSubmit={handleSubmit}
              aria-busy={isPending}
            >
              {/* ===============================================
                  GLOBAL ERROR
                  =============================================== */}

              {hasError ? (
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


              {/* ===============================================
                  EMAIL
                  =============================================== */}

              <div className="gestionnaire-login-form__fields">
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
                  <label
                    htmlFor="gestionnaire-forgot-password-email"
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
                      id="gestionnaire-forgot-password-email"
                      name="email"
                      type="email"
                      className="gestionnaire-auth-field__input gestionnaire-login-field__input"
                      placeholder="Adresse e-mail"
                      defaultValue={
                        state.values.email
                      }
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="send"
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
                          ? "gestionnaire-forgot-password-email-error"
                          : undefined
                      }
                    />
                  </div>


                  {state.fieldErrors.email ? (
                    <p
                      id="gestionnaire-forgot-password-email-error"
                      className="gestionnaire-auth-field__error gestionnaire-login-field__error"
                      role="alert"
                    >
                      {
                        state
                          .fieldErrors
                          .email
                      }
                    </p>
                  ) : null}
                </div>
              </div>


              {/* ===============================================
                  SUBMIT
                  =============================================== */}

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
                      Envoi en cours...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Envoyer le lien
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


              {/* ===============================================
                  ACCESSIBLE LOADING
                  =============================================== */}

              <span
                className="gestionnaire-login-sr-only"
                role="status"
                aria-live="polite"
              >
                {isPending
                  ? "Envoi de la demande de réinitialisation en cours."
                  : ""}
              </span>


              {/* ===============================================
                  BACK TO LOGIN
                  =============================================== */}

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


              {/* ===============================================
                  SECURITY NOTICE
                  =============================================== */}

              <div className="gestionnaire-login-security">
                <span
                  className="gestionnaire-login-security__icon"
                  aria-hidden="true"
                >
                  <ShieldCheck
                    size={32}
                    strokeWidth={1.8}
                  />
                </span>


                <div className="gestionnaire-login-security__content">
                  <strong className="gestionnaire-login-security__title">
                    Récupération sécurisée
                  </strong>

                  <span className="gestionnaire-login-security__description">
                    Pour protéger les comptes, nous ne confirmons
                    jamais si une adresse e-mail est enregistrée ou non.
                  </span>
                </div>
              </div>
            </form>
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