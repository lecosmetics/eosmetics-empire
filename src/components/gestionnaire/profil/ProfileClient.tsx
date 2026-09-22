"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Store,
  UserRound,
  X,
} from "lucide-react";

import CountrySelect from "@/components/gestionnaire/auth/CountrySelect";

import {
  changeGestionnaireProfilePasswordAction,
  updateGestionnaireProfileContactAction,
} from "@/app/gestionnaire/(espace-prive)/profil/actions";

import {
  createInitialGestionnaireProfileContactActionState,
  getGestionnaireProfileInitials,
  getGestionnaireProfileManagerStatusLabel,
  getGestionnaireProfileRoleLabel,
  INITIAL_GESTIONNAIRE_PROFILE_PASSWORD_ACTION_STATE,
  type GestionnaireProfilePageData,
} from "@/lib/gestionnaire/profil/profile-types";

import styles from "@/app/gestionnaire/(espace-prive)/profil/profil.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL — CLIENT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/profil/ProfileClient.tsx
 *
 * RESPONSABILITÉS :
 *
 * - présenter les informations réelles du Gestionnaire ;
 * - présenter les informations réelles de la boutique ;
 * - permettre la modification :
 *     - téléphone ;
 *     - pays ;
 *     - ville ;
 *     - adresse ;
 * - conserver l'e-mail et le nom de la boutique en lecture seule ;
 * - ouvrir une modale sécurisée de changement de mot de passe ;
 * - utiliser les Server Actions existantes ;
 * - afficher les erreurs de validation serveur ;
 * - afficher les succès ;
 * - gérer l'accessibilité de la modale.
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - recevoir storeId depuis un formulaire ;
 * - recevoir managerId depuis un formulaire ;
 * - modifier un rôle ;
 * - modifier un statut ;
 * - inventer un prénom ;
 * - inventer un nom de famille ;
 * - inventer une photo de profil ;
 * - inventer des préférences de notification ;
 * - inventer des sessions actives.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const LOGIN_ROUTE =
  "/gestionnaire/connexion";


const PHONE_MAX_LENGTH =
  30;


const CITY_MAX_LENGTH =
  100;


const ADDRESS_MAX_LENGTH =
  200;


const PASSWORD_MIN_LENGTH =
  10;


const PASSWORD_MAX_LENGTH =
  128;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface ProfileClientProps {
  readonly data:
    GestionnaireProfilePageData;
}


/* ==========================================================================
   DATE FORMATTERS
   ========================================================================== */

const DATE_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",
    },
  );


const DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat(
    "fr-FR",
    {
      day:
        "2-digit",

      month:
        "long",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    },
  );


/* ==========================================================================
   DATE
   ========================================================================== */

function formatDate(
  value:
    string | null,
): string {
  if (
    !value
  ) {
    return "Non renseignée";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Non renseignée";
  }


  return DATE_FORMATTER.format(
    date,
  );
}


/* ==========================================================================
   DATE + HEURE
   ========================================================================== */

function formatDateTime(
  value:
    string | null,
): string {
  if (
    !value
  ) {
    return "Aucune connexion enregistrée";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Non renseignée";
  }


  return DATE_TIME_FORMATTER.format(
    date,
  );
}


/* ==========================================================================
   FIELD ERROR
   ========================================================================== */

function ProfileFieldError({
  id,
  message,
}: {
  readonly id:
    string;

  readonly message?:
    string;
}) {
  if (
    !message
  ) {
    return null;
  }


  return (
    <p
      id={id}
      className={styles.profileFieldError}
      role="alert"
    >
      <AlertCircle
        size={14}
        strokeWidth={2}
        aria-hidden="true"
      />

      <span>
        {message}
      </span>
    </p>
  );
}


/* ==========================================================================
   ACTION MESSAGE
   ========================================================================== */

function ProfileActionMessage({
  status,
  message,
}: {
  readonly status:
    "idle" |
    "success" |
    "error";

  readonly message:
    string | null;
}) {
  if (
    !message ||
    status ===
      "idle"
  ) {
    return null;
  }


  const isSuccess =
    status ===
    "success";


  return (
    <div
      className={[
        styles.profileActionMessage,
        isSuccess
          ? styles.profileActionMessageSuccess
          : styles.profileActionMessageError,
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      role={
        isSuccess
          ? "status"
          : "alert"
      }
      aria-live="polite"
    >
      {isSuccess ? (
        <CheckCircle2
          size={18}
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : (
        <AlertCircle
          size={18}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}

      <span>
        {message}
      </span>
    </div>
  );
}


/* ==========================================================================
   INFO ROW
   ========================================================================== */

function ProfileInfoRow({
  icon: Icon,
  label,
  value,
}: {
  readonly icon:
    typeof Mail;

  readonly label:
    string;

  readonly value:
    string;
}) {
  return (
    <div className={styles.profileInfoRow}>
      <span
        className={styles.profileInfoIcon}
        aria-hidden="true"
      >
        <Icon
          size={17}
          strokeWidth={1.8}
        />
      </span>

      <div className={styles.profileInfoContent}>
        <span className={styles.profileInfoLabel}>
          {label}
        </span>

        <span className={styles.profileInfoValue}>
          {value}
        </span>
      </div>
    </div>
  );
}


/* ==========================================================================
   SUMMARY ITEM
   ========================================================================== */

function ProfileSummaryItem({
  label,
  value,
}: {
  readonly label:
    string;

  readonly value:
    string;
}) {
  return (
    <div className={styles.profileSummaryItem}>
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


/* ==========================================================================
   CONTACT EDITOR
   ========================================================================== */

function ProfileContactEditor({
  data,
  onClose,
}: {
  readonly data:
    GestionnaireProfilePageData;

  readonly onClose:
    () => void;
}) {
  /* =========================================================================
     ROUTER
     ========================================================================= */

  const router =
    useRouter();


  /* =========================================================================
     COUNTRY
     ========================================================================= */

  const [
    selectedCountry,
    setSelectedCountry,
  ] =
    useState(
      data.contactValues.country,
    );


  /* =========================================================================
     ACTION
     ========================================================================= */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      updateGestionnaireProfileContactAction,

      createInitialGestionnaireProfileContactActionState(
        data.contactValues,
      ),
    );


  /* =========================================================================
     SUCCESS
     ========================================================================= */

  const isSuccess =
    state.status ===
    "success";


  /* =========================================================================
     TERMINER
     ========================================================================= */

  function handleFinish() {
    router.refresh();

    onClose();
  }


  /* =========================================================================
     COUNTRY
     ========================================================================= */

  function handleCountryChange(
    countryCode:
      string,
  ) {
    if (
      isPending ||
      isSuccess
    ) {
      return;
    }


    setSelectedCountry(
      countryCode,
    );
  }


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <form
      action={formAction}
      className={styles.profileContactForm}
      aria-busy={isPending}
    >
      <ProfileActionMessage
        status={state.status}
        message={state.message}
      />


      {/* ==================================================================
          EMAIL BOUTIQUE — LECTURE SEULE
          ================================================================== */}

      <div className={styles.profileField}>
        <label
          htmlFor="profile-store-email"
          className={styles.profileFieldLabel}
        >
          E-mail de la boutique
        </label>

        <div
          className={[
            styles.profileInputControl,
            styles.profileInputControlReadonly,
          ].join(" ")}
        >
          <Mail
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <input
            id="profile-store-email"
            type="email"
            value={data.store.email}
            readOnly
            disabled
            autoComplete="email"
            className={styles.profileInput}
          />
        </div>

        <p className={styles.profileFieldHint}>
          L’adresse e-mail n’est pas modifiable depuis cette page.
        </p>
      </div>


      {/* ==================================================================
          PHONE
          ================================================================== */}

      <div className={styles.profileField}>
        <label
          htmlFor="profile-phone"
          className={styles.profileFieldLabel}
        >
          Téléphone
        </label>

        <div
          className={[
            styles.profileInputControl,
            state.fieldErrors.phone
              ? styles.profileInputControlError
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <Phone
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <input
            id="profile-phone"
            name="phone"
            type="tel"
            defaultValue={state.values.phone}
            autoComplete="tel"
            inputMode="tel"
            maxLength={PHONE_MAX_LENGTH}
            disabled={
              isPending ||
              isSuccess
            }
            required
            aria-invalid={
              Boolean(
                state
                  .fieldErrors
                  .phone,
              )
            }
            aria-describedby={
              state.fieldErrors.phone
                ? "profile-phone-error"
                : undefined
            }
            className={styles.profileInput}
            placeholder="+229 01 00 00 00 00"
          />
        </div>

        <ProfileFieldError
          id="profile-phone-error"
          message={state.fieldErrors.phone}
        />
      </div>


      {/* ==================================================================
          COUNTRY
          ================================================================== */}

      <div className={styles.profileCountryField}>
        <span className={styles.profileFieldLabel}>
          Pays
        </span>

        <CountrySelect
          id="profile-country"
          name="country"
          value={selectedCountry}
          onChange={handleCountryChange}
          error={state.fieldErrors.country}
          disabled={
            isPending ||
            isSuccess
          }
          required
        />
      </div>


      {/* ==================================================================
          CITY
          ================================================================== */}

      <div className={styles.profileField}>
        <label
          htmlFor="profile-city"
          className={styles.profileFieldLabel}
        >
          Ville
        </label>

        <div
          className={[
            styles.profileInputControl,
            state.fieldErrors.city
              ? styles.profileInputControlError
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <Building2
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <input
            id="profile-city"
            name="city"
            type="text"
            defaultValue={state.values.city}
            autoComplete="address-level2"
            maxLength={CITY_MAX_LENGTH}
            disabled={
              isPending ||
              isSuccess
            }
            required
            aria-invalid={
              Boolean(
                state
                  .fieldErrors
                  .city,
              )
            }
            aria-describedby={
              state.fieldErrors.city
                ? "profile-city-error"
                : undefined
            }
            className={styles.profileInput}
            placeholder="Ville"
          />
        </div>

        <ProfileFieldError
          id="profile-city-error"
          message={state.fieldErrors.city}
        />
      </div>


      {/* ==================================================================
          ADDRESS
          ================================================================== */}

      <div
        className={[
          styles.profileField,
          styles.profileFieldFull,
        ].join(" ")}
      >
        <label
          htmlFor="profile-address"
          className={styles.profileFieldLabel}
        >
          Adresse
        </label>

        <div
          className={[
            styles.profileInputControl,
            state.fieldErrors.address
              ? styles.profileInputControlError
              : "",
          ]
            .filter(
              Boolean,
            )
            .join(
              " ",
            )}
        >
          <MapPin
            size={17}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <input
            id="profile-address"
            name="address"
            type="text"
            defaultValue={state.values.address}
            autoComplete="street-address"
            maxLength={ADDRESS_MAX_LENGTH}
            disabled={
              isPending ||
              isSuccess
            }
            required
            aria-invalid={
              Boolean(
                state
                  .fieldErrors
                  .address,
              )
            }
            aria-describedby={
              state.fieldErrors.address
                ? "profile-address-error"
                : undefined
            }
            className={styles.profileInput}
            placeholder="Adresse de la boutique"
          />
        </div>

        <ProfileFieldError
          id="profile-address-error"
          message={state.fieldErrors.address}
        />
      </div>


      {/* ==================================================================
          ACTIONS
          ================================================================== */}

      <div className={styles.profileFormActions}>
        {isSuccess ? (
          <button
            type="button"
            className={styles.profilePrimaryButton}
            onClick={handleFinish}
          >
            <Check
              size={17}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              Terminer
            </span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className={styles.profileSecondaryButton}
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </button>

            <button
              type="submit"
              className={styles.profilePrimaryButton}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <LoaderCircle
                    size={17}
                    strokeWidth={2}
                    className={styles.profileSpinner}
                    aria-hidden="true"
                  />

                  <span>
                    Enregistrement…
                  </span>
                </>
              ) : (
                <>
                  <Save
                    size={17}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Enregistrer
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </form>
  );
}


/* ==========================================================================
   PASSWORD DIALOG
   ========================================================================== */

function ProfilePasswordDialog({
  onClose,
}: {
  readonly onClose:
    () => void;
}) {
  /* =========================================================================
     ROUTER
     ========================================================================= */

  const router =
    useRouter();


  /* =========================================================================
     IDS
     ========================================================================= */

  const titleId =
    useId();


  const descriptionId =
    useId();


  /* =========================================================================
     STATE
     ========================================================================= */

  const [
    showPasswords,
    setShowPasswords,
  ] =
    useState(
      false,
    );


  /* =========================================================================
     REFS
     ========================================================================= */

  const dialogRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const currentPasswordRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  /* =========================================================================
     ACTION
     ========================================================================= */

  const [
    state,
    formAction,
    isPending,
  ] =
    useActionState(
      changeGestionnaireProfilePasswordAction,
      INITIAL_GESTIONNAIRE_PROFILE_PASSWORD_ACTION_STATE,
    );


  const succeeded =
    state.status ===
    "success";


  /* =========================================================================
     CLOSE
     ========================================================================= */

  const closeDialog =
    useCallback(
      () => {
        if (
          isPending ||
          succeeded
        ) {
          return;
        }


        onClose();
      },
      [
        isPending,
        onClose,
        succeeded,
      ],
    );


  /* =========================================================================
     REDIRECTION APRÈS CHANGEMENT
     ========================================================================= */

  useEffect(
    () => {
      if (
        !succeeded
      ) {
        return;
      }


      router.replace(
        LOGIN_ROUTE,
      );


      router.refresh();
    },
    [
      router,
      succeeded,
    ],
  );


  /* =========================================================================
     FOCUS INITIAL
     ========================================================================= */

  useEffect(
    () => {
      const animationFrame =
        window.requestAnimationFrame(
          () => {
            currentPasswordRef
              .current
              ?.focus();
          },
        );


      return () => {
        window.cancelAnimationFrame(
          animationFrame,
        );
      };
    },
    [],
  );


  /* =========================================================================
     BODY SCROLL
     ========================================================================= */

  useEffect(
    () => {
      const body =
        document.body;


      const previousOverflow =
        body.style.overflow;


      const previousPaddingRight =
        body.style.paddingRight;


      const scrollbarWidth =
        window.innerWidth -
        document.documentElement.clientWidth;


      body.style.overflow =
        "hidden";


      if (
        scrollbarWidth >
        0
      ) {
        body.style.paddingRight =
          `${scrollbarWidth}px`;
      }


      return () => {
        body.style.overflow =
          previousOverflow;


        body.style.paddingRight =
          previousPaddingRight;
      };
    },
    [],
  );


  /* =========================================================================
     ESCAPE
     ========================================================================= */

  useEffect(
    () => {
      function handleKeyDown(
        event:
          KeyboardEvent,
      ) {
        if (
          event.key !==
          "Escape"
        ) {
          return;
        }


        event.preventDefault();

        closeDialog();
      }


      document.addEventListener(
        "keydown",
        handleKeyDown,
      );


      return () => {
        document.removeEventListener(
          "keydown",
          handleKeyDown,
        );
      };
    },
    [
      closeDialog,
    ],
  );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <div
      className={styles.profileModalOverlay}
      role="presentation"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target !==
            event.currentTarget
          ) {
            return;
          }


          closeDialog();
        }
      }
    >
      <div
        ref={dialogRef}
        className={styles.profileModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isPending}
      >
        {/* ==================================================================
            HEADER
            ================================================================== */}

        <div className={styles.profileModalHeader}>
          <div className={styles.profileModalHeading}>
            <span
              className={styles.profileModalIcon}
              aria-hidden="true"
            >
              <KeyRound
                size={21}
                strokeWidth={1.9}
              />
            </span>

            <div>
              <span className={styles.profileModalEyebrow}>
                Sécurité du compte
              </span>

              <h2
                id={titleId}
                className={styles.profileModalTitle}
              >
                Changer le mot de passe
              </h2>
            </div>
          </div>

          <button
            type="button"
            className={styles.profileModalClose}
            onClick={closeDialog}
            disabled={
              isPending ||
              succeeded
            }
            aria-label="Fermer"
          >
            <X
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>


        {/* ==================================================================
            BODY
            ================================================================== */}

        <div className={styles.profileModalBody}>
          <p
            id={descriptionId}
            className={styles.profileModalDescription}
          >
            Confirmez votre mot de passe actuel puis choisissez un nouveau mot
            de passe. Après la modification, votre session sera fermée et vous
            devrez vous reconnecter.
          </p>


          <ProfileActionMessage
            status={state.status}
            message={state.message}
          />


          {!succeeded ? (
            <form
              action={formAction}
              className={styles.profilePasswordForm}
            >
              {/* ============================================================
                  CURRENT PASSWORD
                  ============================================================ */}

              <div className={styles.profileField}>
                <label
                  htmlFor="profile-current-password"
                  className={styles.profileFieldLabel}
                >
                  Mot de passe actuel
                </label>

                <div
                  className={[
                    styles.profilePasswordControl,
                    state.fieldErrors.currentPassword
                      ? styles.profileInputControlError
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )}
                >
                  <LockKeyhole
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <input
                    ref={currentPasswordRef}
                    id="profile-current-password"
                    name="currentPassword"
                    type={
                      showPasswords
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    maxLength={PASSWORD_MAX_LENGTH}
                    disabled={isPending}
                    required
                    aria-invalid={
                      Boolean(
                        state
                          .fieldErrors
                          .currentPassword,
                      )
                    }
                    aria-describedby={
                      state.fieldErrors.currentPassword
                        ? "profile-current-password-error"
                        : undefined
                    }
                    className={styles.profilePasswordInput}
                  />
                </div>

                <ProfileFieldError
                  id="profile-current-password-error"
                  message={state.fieldErrors.currentPassword}
                />
              </div>


              {/* ============================================================
                  NEW PASSWORD
                  ============================================================ */}

              <div className={styles.profileField}>
                <label
                  htmlFor="profile-new-password"
                  className={styles.profileFieldLabel}
                >
                  Nouveau mot de passe
                </label>

                <div
                  className={[
                    styles.profilePasswordControl,
                    state.fieldErrors.newPassword
                      ? styles.profileInputControlError
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )}
                >
                  <KeyRound
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <input
                    id="profile-new-password"
                    name="newPassword"
                    type={
                      showPasswords
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    disabled={isPending}
                    required
                    aria-invalid={
                      Boolean(
                        state
                          .fieldErrors
                          .newPassword,
                      )
                    }
                    aria-describedby={
                      state.fieldErrors.newPassword
                        ? "profile-new-password-error"
                        : "profile-new-password-hint"
                    }
                    className={styles.profilePasswordInput}
                  />
                </div>

                <p
                  id="profile-new-password-hint"
                  className={styles.profileFieldHint}
                >
                  Au moins {PASSWORD_MIN_LENGTH} caractères.
                </p>

                <ProfileFieldError
                  id="profile-new-password-error"
                  message={state.fieldErrors.newPassword}
                />
              </div>


              {/* ============================================================
                  CONFIRMATION
                  ============================================================ */}

              <div className={styles.profileField}>
                <label
                  htmlFor="profile-new-password-confirmation"
                  className={styles.profileFieldLabel}
                >
                  Confirmer le nouveau mot de passe
                </label>

                <div
                  className={[
                    styles.profilePasswordControl,
                    state
                      .fieldErrors
                      .newPasswordConfirmation
                      ? styles.profileInputControlError
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )}
                >
                  <ShieldCheck
                    size={17}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />

                  <input
                    id="profile-new-password-confirmation"
                    name="newPasswordConfirmation"
                    type={
                      showPasswords
                        ? "text"
                        : "password"
                    }
                    autoComplete="new-password"
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    disabled={isPending}
                    required
                    aria-invalid={
                      Boolean(
                        state
                          .fieldErrors
                          .newPasswordConfirmation,
                      )
                    }
                    aria-describedby={
                      state
                        .fieldErrors
                        .newPasswordConfirmation
                        ? "profile-new-password-confirmation-error"
                        : undefined
                    }
                    className={styles.profilePasswordInput}
                  />
                </div>

                <ProfileFieldError
                  id="profile-new-password-confirmation-error"
                  message={
                    state
                      .fieldErrors
                      .newPasswordConfirmation
                  }
                />
              </div>


              {/* ============================================================
                  SHOW PASSWORDS
                  ============================================================ */}

              <button
                type="button"
                className={styles.profilePasswordVisibility}
                onClick={
                  () => {
                    setShowPasswords(
                      (
                        current,
                      ) =>
                        !current,
                    );
                  }
                }
                disabled={isPending}
              >
                {showPasswords ? (
                  <EyeOff
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                )}

                <span>
                  {showPasswords
                    ? "Masquer les mots de passe"
                    : "Afficher les mots de passe"}
                </span>
              </button>


              {/* ============================================================
                  ACTIONS
                  ============================================================ */}

              <div className={styles.profileModalActions}>
                <button
                  type="button"
                  className={styles.profileSecondaryButton}
                  onClick={closeDialog}
                  disabled={isPending}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className={styles.profilePrimaryButton}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <LoaderCircle
                        size={17}
                        strokeWidth={2}
                        className={styles.profileSpinner}
                        aria-hidden="true"
                      />

                      <span>
                        Modification…
                      </span>
                    </>
                  ) : (
                    <>
                      <KeyRound
                        size={17}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />

                      <span>
                        Changer le mot de passe
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.profilePasswordSuccess}>
              <LoaderCircle
                size={22}
                strokeWidth={2}
                className={styles.profileSpinner}
                aria-hidden="true"
              />

              <span>
                Redirection vers la connexion…
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function ProfileClient({
  data,
}: ProfileClientProps) {
  /* =========================================================================
     LOCAL STATE
     ========================================================================= */

  const [
    isEditingContact,
    setIsEditingContact,
  ] =
    useState(
      false,
    );


  const [
    isPasswordDialogOpen,
    setIsPasswordDialogOpen,
  ] =
    useState(
      false,
    );


  /* =========================================================================
     DISPLAY VALUES
     ========================================================================= */

  const initials =
    getGestionnaireProfileInitials(
      data.store.name,
    );


  const managerStatus =
    getGestionnaireProfileManagerStatusLabel(
      data.manager.status,
    );


  const role =
    getGestionnaireProfileRoleLabel(
      data.manager.role,
    );


  const countryName =
    data.country?.name ??
    data.store.country;


  const location =
    [
      data.store.city,
      countryName,
    ]
      .filter(
        Boolean,
      )
      .join(
        ", ",
      );


  const passwordDate =
    data.security.passwordChangedAt
      ? formatDate(
          data.security.passwordChangedAt,
        )
      : "Jamais modifié";


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <>
      <div className={styles.profileClient}>
        {/* ==================================================================
            TOP GRID
            ================================================================== */}

        <div className={styles.profileGrid}>
          {/* ================================================================
              MANAGER CARD
              ================================================================ */}

          <section
            className={styles.profileCard}
            aria-labelledby="profile-manager-title"
          >
            <div className={styles.profileCardHeader}>
              <div className={styles.profileCardHeading}>
                <span
                  className={styles.profileCardIcon}
                  aria-hidden="true"
                >
                  <UserRound
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

                <h2
                  id="profile-manager-title"
                  className={styles.profileCardTitle}
                >
                  Informations du gestionnaire
                </h2>
              </div>
            </div>


            <div className={styles.profileManagerIdentity}>
              <div
                className={styles.profileAvatar}
                aria-label={`Initiales de ${data.store.name}`}
              >
                {initials}
              </div>

              <div className={styles.profileManagerMain}>
                <div className={styles.profileManagerNameRow}>
                  <strong className={styles.profileManagerName}>
                    {data.store.name}
                  </strong>

                  <span
                    className={[
                      styles.profileStatusBadge,
                      data.manager.status ===
                      "ACTIVE"
                        ? styles.profileStatusBadgeActive
                        : styles.profileStatusBadgeInactive,
                    ]
                      .filter(
                        Boolean,
                      )
                      .join(
                        " ",
                      )}
                  >
                    {managerStatus}
                  </span>
                </div>

                <div className={styles.profileManagerDetails}>
                  <ProfileInfoRow
                    icon={Mail}
                    label="E-mail"
                    value={data.manager.email}
                  />

                  <ProfileInfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={data.store.phone}
                  />

                  <ProfileInfoRow
                    icon={MapPin}
                    label="Localisation"
                    value={
                      location ||
                      "Non renseignée"
                    }
                  />
                </div>
              </div>
            </div>


            <div className={styles.profileSummaryGrid}>
              <ProfileSummaryItem
                label="Rôle"
                value={role}
              />

              <ProfileSummaryItem
                label="Date d'inscription"
                value={
                  formatDate(
                    data.manager.createdAt,
                  )
                }
              />

              <ProfileSummaryItem
                label="Dernière connexion"
                value={
                  formatDateTime(
                    data.security.lastLoginAt,
                  )
                }
              />
            </div>
          </section>


          {/* ================================================================
              CONTACT CARD
              ================================================================ */}

          <section
            className={styles.profileCard}
            aria-labelledby="profile-contact-title"
          >
            <div className={styles.profileCardHeader}>
              <div className={styles.profileCardHeading}>
                <span
                  className={styles.profileCardIcon}
                  aria-hidden="true"
                >
                  <Store
                    size={19}
                    strokeWidth={1.8}
                  />
                </span>

                <div>
                  <h2
                    id="profile-contact-title"
                    className={styles.profileCardTitle}
                  >
                    Informations de contact
                  </h2>

                  <p className={styles.profileCardSubtitle}>
                    Coordonnées de votre boutique
                  </p>
                </div>
              </div>

              {!isEditingContact ? (
                <button
                  type="button"
                  className={styles.profileOutlineButton}
                  onClick={
                    () => {
                      setIsEditingContact(
                        true,
                      );
                    }
                  }
                >
                  <Pencil
                    size={16}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />

                  <span>
                    Modifier
                  </span>
                </button>
              ) : null}
            </div>


            {isEditingContact ? (
              <ProfileContactEditor
                data={data}
                onClose={
                  () => {
                    setIsEditingContact(
                      false,
                    );
                  }
                }
              />
            ) : (
              <div className={styles.profileContactDisplay}>
                <div className={styles.profileContactGrid}>
                  <ProfileInfoRow
                    icon={Mail}
                    label="E-mail"
                    value={data.store.email}
                  />

                  <ProfileInfoRow
                    icon={Phone}
                    label="Téléphone"
                    value={data.store.phone}
                  />

                  <ProfileInfoRow
                    icon={MapPin}
                    label="Pays"
                    value={
                      countryName ||
                      "Non renseigné"
                    }
                  />

                  <ProfileInfoRow
                    icon={Building2}
                    label="Ville"
                    value={
                      data.store.city ||
                      "Non renseignée"
                    }
                  />
                </div>

                <div className={styles.profileAddressBlock}>
                  <span className={styles.profileInfoLabel}>
                    Adresse
                  </span>

                  <div className={styles.profileAddressValue}>
                    <MapPin
                      size={17}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <span>
                      {data.store.address ||
                        "Non renseignée"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>


        {/* ==================================================================
            SECURITY CARD
            ================================================================== */}

        <section
          className={[
            styles.profileCard,
            styles.profileSecurityCard,
          ].join(" ")}
          aria-labelledby="profile-security-title"
        >
          <div className={styles.profileCardHeader}>
            <div className={styles.profileCardHeading}>
              <span
                className={styles.profileCardIcon}
                aria-hidden="true"
              >
                <ShieldCheck
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <div>
                <h2
                  id="profile-security-title"
                  className={styles.profileCardTitle}
                >
                  Sécurité du compte
                </h2>

                <p className={styles.profileCardSubtitle}>
                  Gérez la sécurité de votre accès Gestionnaire.
                </p>
              </div>
            </div>
          </div>


          <div className={styles.profileSecurityList}>
            {/* ==============================================================
                PASSWORD
                ============================================================== */}

            <div className={styles.profileSecurityRow}>
              <span
                className={styles.profileSecurityIcon}
                aria-hidden="true"
              >
                <LockKeyhole
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <div className={styles.profileSecurityContent}>
                <strong>
                  Mot de passe
                </strong>

                <span>
                  Dernière modification : {passwordDate}
                </span>
              </div>

              <button
                type="button"
                className={styles.profileOutlineButton}
                onClick={
                  () => {
                    setIsPasswordDialogOpen(
                      true,
                    );
                  }
                }
              >
                <Pencil
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  Changer le mot de passe
                </span>
              </button>
            </div>


            {/* ==============================================================
                EMAIL VERIFICATION
                ============================================================== */}

            <div className={styles.profileSecurityRow}>
              <span
                className={styles.profileSecurityIcon}
                aria-hidden="true"
              >
                <Mail
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <div className={styles.profileSecurityContent}>
                <strong>
                  Vérification e-mail
                </strong>

                <span>
                  {data.security.isEmailVerified
                    ? `Adresse vérifiée${
                        data.security.emailVerifiedAt
                          ? ` le ${formatDate(
                              data
                                .security
                                .emailVerifiedAt,
                            )}`
                          : ""
                      }.`
                    : "Adresse e-mail non vérifiée."}
                </span>
              </div>

              <span
                className={[
                  styles.profileSecurityState,
                  data.security.isEmailVerified
                    ? styles.profileSecurityStateSuccess
                    : styles.profileSecurityStateWarning,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
              >
                {data.security.isEmailVerified ? (
                  <CheckCircle2
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                )}

                <span>
                  {data.security.isEmailVerified
                    ? "Vérifié"
                    : "Non vérifié"}
                </span>
              </span>
            </div>


            {/* ==============================================================
                ACCOUNT
                ============================================================== */}

            <div className={styles.profileSecurityRow}>
              <span
                className={styles.profileSecurityIcon}
                aria-hidden="true"
              >
                <ShieldCheck
                  size={19}
                  strokeWidth={1.8}
                />
              </span>

              <div className={styles.profileSecurityContent}>
                <strong>
                  État du compte
                </strong>

                <span>
                  L’accès privé dépend du statut actuel de votre compte et de
                  votre boutique.
                </span>
              </div>

              <span
                className={[
                  styles.profileSecurityState,
                  data.manager.status ===
                  "ACTIVE"
                    ? styles.profileSecurityStateSuccess
                    : styles.profileSecurityStateWarning,
                ]
                  .filter(
                    Boolean,
                  )
                  .join(
                    " ",
                  )}
              >
                <ShieldCheck
                  size={16}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>
                  {managerStatus}
                </span>
              </span>
            </div>
          </div>
        </section>


        {/* ==================================================================
            ACCOUNT INFORMATION
            ================================================================== */}

        <section
          className={[
            styles.profileCard,
            styles.profileAccountCard,
          ].join(" ")}
          aria-labelledby="profile-account-title"
        >
          <div className={styles.profileAccountIcon}>
            <CalendarDays
              size={20}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>

          <div className={styles.profileAccountContent}>
            <h2
              id="profile-account-title"
              className={styles.profileCardTitle}
            >
              Informations du compte
            </h2>

            <p>
              Compte créé le{" "}
              <strong>
                {formatDate(
                  data.manager.createdAt,
                )}
              </strong>
              . Les informations d’identité, de rôle et de statut sont gérées
              par le système et ne sont pas modifiables depuis cette page.
            </p>
          </div>
        </section>
      </div>


      {/* ====================================================================
          PASSWORD MODAL
          ==================================================================== */}

      {isPasswordDialogOpen ? (
        <ProfilePasswordDialog
          onClose={
            () => {
              setIsPasswordDialogOpen(
                false,
              );
            }
          }
        />
      ) : null}
    </>
  );
}