"use client";

import {
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
} from "react";

import {
  resendGestionnaireVerificationCodeAction,
  verifyGestionnaireEmailAction,
} from "@/app/gestionnaire/(auth)/verification/actions";

import type {
  VerificationActionState,
} from "@/app/gestionnaire/(auth)/verification/actions";


/* ============================================================
   COSMETICS EMPIRE
   VERIFICATION FORM — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/VerificationForm.tsx

   Route :
   /gestionnaire/verification

   OBJECTIFS :

   - afficher 6 cases pour le code OTP ;
   - accepter uniquement des chiffres ;
   - déplacer automatiquement le focus ;
   - gérer Backspace / flèches ;
   - permettre le collage d'un code complet ;
   - envoyer uniquement name="code" au serveur ;
   - vérifier le code via Server Action ;
   - permettre le renvoi sécurisé du code ;
   - afficher le cooldown avant un nouveau renvoi ;
   - empêcher les doubles soumissions.

   SÉCURITÉ :

   Ce composant ne reçoit jamais :

   - gestionnaireId ;
   - accountId ;
   - adresse e-mail complète ;
   - OTP attendu ;
   - hash OTP ;
   - token de vérification ;
   - code représentant.

   Le compte est retrouvé côté serveur à partir de la session
   temporaire HttpOnly.
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const OTP_LENGTH = 6;


/* ============================================================
   PROPS
   ------------------------------------------------------------
   La valeur est facultative.

   Le serveur applique TOUJOURS son propre cooldown même si
   l'interface affiche 0 seconde.
   ============================================================ */

type VerificationFormProps =
  Readonly<{
    initialResendCooldownSeconds?: number;
  }>;


/* ============================================================
   INITIAL STATE FACTORY
   ------------------------------------------------------------
   L'état initial est défini côté client.

   On évite ainsi d'importer une constante runtime depuis un
   fichier "use server".
   ============================================================ */

function createInitialVerificationState(
  cooldownSeconds = 0,
): VerificationActionState {
  return {
    status: "idle",

    message: null,

    codeError: null,

    resendCooldownSeconds:
      cooldownSeconds > 0
        ? cooldownSeconds
        : null,
  };
}


/* ============================================================
   EMPTY OTP
   ============================================================ */

function createEmptyOtp(): string[] {
  return Array.from(
    {
      length: OTP_LENGTH,
    },
    () => "",
  );
}


/* ============================================================
   DIGITS ONLY
   ============================================================ */

function getDigits(
  value: string,
): string {
  return value.replace(
    /\D/g,
    "",
  );
}


/* ============================================================
   COUNTDOWN STATE
   ------------------------------------------------------------
   "source" permet de reconnaître une nouvelle réponse du
   serveur.

   Ainsi, deux renvois successifs qui retournent chacun
   "60 secondes" réinitialisent tout de même correctement le
   compteur.
   ============================================================ */

type CountdownState =
  Readonly<{
    source:
      VerificationActionState;

    remaining:
      number;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function VerificationForm({
  initialResendCooldownSeconds = 0,
}: VerificationFormProps) {
  /* ----------------------------------------------------------
     INITIAL STATES
     ---------------------------------------------------------- */

  const initialVerificationState =
    createInitialVerificationState();

  const initialResendState =
    createInitialVerificationState(
      initialResendCooldownSeconds,
    );


  /* ----------------------------------------------------------
     VERIFY ACTION
     ---------------------------------------------------------- */

  const [
    verificationState,
    verifyAction,
    isVerifying,
  ] = useActionState(
    verifyGestionnaireEmailAction,
    initialVerificationState,
  );


  /* ----------------------------------------------------------
     RESEND ACTION
     ---------------------------------------------------------- */

  const [
    resendState,
    resendAction,
    isResending,
  ] = useActionState(
    resendGestionnaireVerificationCodeAction,
    initialResendState,
  );


  /* ----------------------------------------------------------
     OTP
     ---------------------------------------------------------- */

  const [
    otp,
    setOtp,
  ] = useState<string[]>(
    createEmptyOtp,
  );


  /* ----------------------------------------------------------
     CLIENT VALIDATION ERROR
     ---------------------------------------------------------- */

  const [
    clientCodeError,
    setClientCodeError,
  ] = useState<
    string | null
  >(null);


  /* ----------------------------------------------------------
     INPUT REFS
     ---------------------------------------------------------- */

  const inputRefs =
    useRef<
      Array<HTMLInputElement | null>
    >([]);


  /* ----------------------------------------------------------
     RESEND COUNTDOWN
     ---------------------------------------------------------- */

  const [
    countdownState,
    setCountdownState,
  ] = useState<CountdownState>(
    {
      source: initialResendState,

      remaining:
        initialResendCooldownSeconds >
        0
          ? initialResendCooldownSeconds
          : 0,
    },
  );


  /*
   * Si la Server Action retourne un nouvel objet d'état, cet
   * objet devient une nouvelle source de cooldown.
   *
   * Aucun setState immédiat dans un useEffect n'est nécessaire.
   */

  const resendCooldownFromServer =
    Math.max(
      0,
      resendState
        .resendCooldownSeconds ??
        0,
    );


  const remainingSeconds =
    countdownState.source ===
    resendState
      ? countdownState.remaining
      : resendCooldownFromServer;


  /* ----------------------------------------------------------
     COUNTDOWN TIMER
     ----------------------------------------------------------
     Le changement d'état React a lieu dans le callback externe
     du timer, et non directement dans le corps de l'effet.
     ---------------------------------------------------------- */

  useEffect(() => {
    if (
      remainingSeconds <= 0
    ) {
      return;
    }


    const timer =
      window.setTimeout(
        () => {
          setCountdownState(
            (currentState) => {
              const activeRemaining =
                currentState.source ===
                resendState
                  ? currentState
                      .remaining
                  : resendCooldownFromServer;


              return {
                source:
                  resendState,

                remaining:
                  Math.max(
                    0,
                    activeRemaining -
                      1,
                  ),
              };
            },
          );
        },
        1000,
      );


    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    remainingSeconds,
    resendCooldownFromServer,
    resendState,
  ]);


  /* ----------------------------------------------------------
     DERIVED VALUES
     ---------------------------------------------------------- */

  const code =
    otp.join("");


  const isCodeComplete =
    code.length ===
      OTP_LENGTH &&
    /^\d{6}$/.test(
      code,
    );


  const isBusy =
    isVerifying ||
    isResending;


  const canResend =
    !isBusy &&
    remainingSeconds <= 0;


  const displayedCodeError =
    clientCodeError ??
    verificationState.codeError;


  /* ==========================================================
     FOCUS INPUT
     ========================================================== */

  function focusInput(
    index: number,
  ) {
    if (
      index < 0 ||
      index >= OTP_LENGTH
    ) {
      return;
    }


    const input =
      inputRefs.current[index];


    input?.focus();
    input?.select();
  }


  /* ==========================================================
     UPDATE OTP
     ========================================================== */

  function updateOtpFromDigits(
    digits: string,
    startIndex: number,
  ) {
    if (!digits) {
      return;
    }


    const nextOtp =
      [...otp];


    let destinationIndex =
      startIndex;


    for (
      const digit of digits
    ) {
      if (
        destinationIndex >=
        OTP_LENGTH
      ) {
        break;
      }


      nextOtp[
        destinationIndex
      ] = digit;

      destinationIndex += 1;
    }


    setOtp(
      nextOtp,
    );

    setClientCodeError(
      null,
    );


    /*
     * Si le code n'est pas complet, on avance vers la prochaine
     * case.

     * Sinon on garde le focus sur la dernière case.
     */

    const nextFocusIndex =
      Math.min(
        destinationIndex,
        OTP_LENGTH - 1,
      );


    window.requestAnimationFrame(
      () => {
        focusInput(
          nextFocusIndex,
        );
      },
    );
  }


  /* ==========================================================
     INPUT CHANGE
     ========================================================== */

  function handleDigitChange(
    index: number,
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const digits =
      getDigits(
        event.target.value,
      );


    /*
     * Champ vidé.
     */

    if (!digits) {
      const nextOtp =
        [...otp];

      nextOtp[index] = "";

      setOtp(
        nextOtp,
      );

      setClientCodeError(
        null,
      );

      return;
    }


    /*
     * Certains navigateurs / gestionnaires OTP peuvent déposer
     * plusieurs chiffres directement dans la première case.

     * On distribue donc tous les chiffres disponibles.
     */

    updateOtpFromDigits(
      digits.slice(
        0,
        OTP_LENGTH -
          index,
      ),
      index,
    );
  }


  /* ==========================================================
     KEYBOARD
     ========================================================== */

  function handleDigitKeyDown(
    index: number,
    event:
      KeyboardEvent<HTMLInputElement>,
  ) {
    switch (
      event.key
    ) {
      case "Backspace": {
        /*
         * Si la case courante est déjà vide, Backspace revient
         * sur la précédente et l'efface.
         */

        if (
          !otp[index] &&
          index > 0
        ) {
          event.preventDefault();


          const nextOtp =
            [...otp];

          nextOtp[
            index - 1
          ] = "";


          setOtp(
            nextOtp,
          );

          setClientCodeError(
            null,
          );


          window.requestAnimationFrame(
            () => {
              focusInput(
                index - 1,
              );
            },
          );
        }

        break;
      }


      case "ArrowLeft": {
        if (index > 0) {
          event.preventDefault();

          focusInput(
            index - 1,
          );
        }

        break;
      }


      case "ArrowRight": {
        if (
          index <
          OTP_LENGTH - 1
        ) {
          event.preventDefault();

          focusInput(
            index + 1,
          );
        }

        break;
      }


      case "Home": {
        event.preventDefault();

        focusInput(0);

        break;
      }


      case "End": {
        event.preventDefault();

        focusInput(
          OTP_LENGTH - 1,
        );

        break;
      }


      default:
        break;
    }
  }


  /* ==========================================================
     PASTE
     ========================================================== */

  function handlePaste(
    index: number,
    event:
      ClipboardEvent<HTMLInputElement>,
  ) {
    const pastedDigits =
      getDigits(
        event.clipboardData.getData(
          "text",
        ),
      );


    if (!pastedDigits) {
      return;
    }


    event.preventDefault();


    updateOtpFromDigits(
      pastedDigits.slice(
        0,
        OTP_LENGTH -
          index,
      ),
      index,
    );
  }


  /* ==========================================================
     VERIFY SUBMIT
     ========================================================== */

  function handleVerificationSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    if (isBusy) {
      event.preventDefault();

      return;
    }


    if (!isCodeComplete) {
      event.preventDefault();

      setClientCodeError(
        "Veuillez saisir les 6 chiffres du code de vérification.",
      );


      const firstEmptyIndex =
        otp.findIndex(
          (digit) =>
            digit === "",
        );


      window.requestAnimationFrame(
        () => {
          focusInput(
            firstEmptyIndex >= 0
              ? firstEmptyIndex
              : 0,
          );
        },
      );
    }
  }


  /* ==========================================================
     FORMAT TIMER
     ========================================================== */

  function formatCountdown(
    seconds: number,
  ): string {
    const safeSeconds =
      Math.max(
        0,
        seconds,
      );


    const minutes =
      Math.floor(
        safeSeconds / 60,
      );


    const remaining =
      safeSeconds % 60;


    return `${String(
      minutes,
    ).padStart(
      2,
      "0",
    )}:${String(
      remaining,
    ).padStart(
      2,
      "0",
    )}`;
  }


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="gestionnaire-verification__form-area">
      {/* ======================================================
          VERIFICATION FORM
          ====================================================== */}

      <form
        className="gestionnaire-auth-form"
        action={verifyAction}
        onSubmit={
          handleVerificationSubmit
        }
        aria-busy={
          isVerifying
        }
      >
        {/* ====================================================
            GLOBAL VERIFICATION ERROR
            ==================================================== */}

        {verificationState.message ? (
          <div
            className="gestionnaire-auth-form__error"
            role="alert"
            aria-live="polite"
          >
            <span>
              {
                verificationState.message
              }
            </span>
          </div>
        ) : null}


        {/* ====================================================
            OTP GROUP
            ==================================================== */}

        <fieldset
          className="gestionnaire-verification__fieldset"
          disabled={isBusy}
        >
          <legend className="gestionnaire-auth-sr-only">
            Code de vérification à 6 chiffres
          </legend>


          <div
            className="gestionnaire-verification__otp"
            aria-describedby={
              displayedCodeError
                ? "gestionnaire-verification-code-error"
                : undefined
            }
          >
            {otp.map(
              (
                digit,
                index,
              ) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[
                      index
                    ] = element;
                  }}
                  type="text"
                  className="gestionnaire-verification__otp-input"
                  value={digit}
                  onChange={(
                    event,
                  ) => {
                    handleDigitChange(
                      index,
                      event,
                    );
                  }}
                  onKeyDown={(
                    event,
                  ) => {
                    handleDigitKeyDown(
                      index,
                      event,
                    );
                  }}
                  onPaste={(
                    event,
                  ) => {
                    handlePaste(
                      index,
                      event,
                    );
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete={
                    index === 0
                      ? "one-time-code"
                      : "off"
                  }
                  enterKeyHint={
                    index ===
                    OTP_LENGTH - 1
                      ? "done"
                      : "next"
                  }
                  aria-label={`Chiffre ${
                    index + 1
                  } sur ${OTP_LENGTH}`}
                  aria-invalid={
                    Boolean(
                      displayedCodeError,
                    )
                  }
                />
              ),
            )}
          </div>
        </fieldset>


        {/* ====================================================
            VALUE SENT TO SERVER
            ----------------------------------------------------
            Les six cases sont uniquement l'interface visuelle.

            La Server Action reçoit une seule valeur :

            name="code"
            value="123456"
            ==================================================== */}

        <input
          type="hidden"
          name="code"
          value={code}
        />


        {/* ====================================================
            CODE ERROR
            ==================================================== */}

        {displayedCodeError ? (
          <p
            id="gestionnaire-verification-code-error"
            className="gestionnaire-auth-field__error gestionnaire-verification__code-error"
            role="alert"
          >
            {displayedCodeError}
          </p>
        ) : null}


        {/* ====================================================
            VERIFY BUTTON
            ==================================================== */}

        <button
          type="submit"
          className="gestionnaire-auth-form__submit"
          disabled={
            isBusy ||
            !isCodeComplete
          }
        >
          {isVerifying ? (
            <>
              <span
                className="gestionnaire-auth-spinner"
                aria-hidden="true"
              />

              <span>
                Vérification en cours...
              </span>
            </>
          ) : (
            <>
              <span>
                Vérifier mon adresse
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


        {/* ====================================================
            SCREEN READER VERIFY STATUS
            ==================================================== */}

        <span
          className="gestionnaire-auth-sr-only"
          role="status"
          aria-live="polite"
        >
          {isVerifying
            ? "Vérification de votre code en cours."
            : ""}
        </span>
      </form>


      {/* ======================================================
          RESEND AREA
          ====================================================== */}

      <div className="gestionnaire-verification__resend">
        <span>
          Vous n’avez pas reçu le code ?
        </span>


        <form
          action={resendAction}
          className="gestionnaire-verification__resend-form"
        >
          <button
            type="submit"
            className="gestionnaire-verification__resend-button"
            disabled={
              !canResend
            }
          >
            {isResending ? (
              <>
                <RefreshCw
                  size={15}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>
                  Envoi en cours...
                </span>
              </>
            ) : remainingSeconds > 0 ? (
              <span>
                Renvoyer le code
              </span>
            ) : (
              <span>
                Renvoyer le code
              </span>
            )}
          </button>
        </form>


        {remainingSeconds > 0 ? (
          <span
            className="gestionnaire-verification__timer"
            aria-live="polite"
          >
            dans{" "}
            {formatCountdown(
              remainingSeconds,
            )}
          </span>
        ) : null}
      </div>


      {/* ======================================================
          RESEND SUCCESS
          ====================================================== */}

      {resendState.status ===
        "success" &&
      resendState.message ? (
        <div
          className="gestionnaire-auth-form__success gestionnaire-verification__resend-message"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2
            size={18}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            {resendState.message}
          </span>
        </div>
      ) : null}


      {/* ======================================================
          RESEND ERROR
          ====================================================== */}

      {resendState.status ===
        "error" &&
      resendState.message ? (
        <div
          className="gestionnaire-auth-form__error gestionnaire-verification__resend-message"
          role="alert"
          aria-live="polite"
        >
          <span>
            {resendState.message}
          </span>
        </div>
      ) : null}
    </div>
  );
}