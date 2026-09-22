"use client";

import {
  Check,
  Download,
  ExternalLink,
  MonitorDown,
  Share2,
  Smartphone,
  X,
} from "lucide-react";

import {
  createPortal,
} from "react-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PWA — INSTALLATION PROMPT
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/pwa/PwaInstallPrompt.tsx
 *
 * RÔLE :
 *
 * - afficher une aide d'installation propre lorsque le navigateur ne fournit
 *   pas de prompt natif ;
 * - guider principalement iPhone / iPad ;
 * - fournir aussi un fallback propre Android / desktop ;
 * - rester accessible au clavier ;
 * - gérer Escape ;
 * - piéger le focus dans la modale ;
 * - restaurer le focus à la fermeture ;
 * - bloquer le scroll arrière-plan uniquement pendant l'ouverture ;
 * - ne dépendre d'aucune donnée métier ;
 * - ne dépendre d'aucun fichier CSS externe.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - n'installe jamais l'application lui-même ;
 * - ne simule jamais une installation réussie ;
 * - n'enregistre pas le Service Worker ;
 * - ne déclenche pas beforeinstallprompt ;
 * - ne touche ni Prisma ni les sessions ;
 * - ne touche à aucun paiement ;
 * - ne recharge jamais la page ;
 * - n'appelle aucun setState() synchroniquement dans le corps d'un useEffect.
 *
 * Cette version respecte notamment :
 *
 * react-hooks/set-state-in-effect
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const DEFAULT_APP_NAME =
  "L&E Cosmetics";


const DEFAULT_LOGO_SRC =
  "/icons/icon-maskable-512.png";


const DIALOG_TITLE_ID =
  "le-pwa-install-dialog-title";


const DIALOG_DESCRIPTION_ID =
  "le-pwa-install-dialog-description";


/* ==========================================================================
   TYPES
   ========================================================================== */

type PwaInstallPlatform =
  | "ios"
  | "android"
  | "desktop"
  | "unknown";


interface InstallStep {
  readonly id:
    string;

  readonly title:
    string;

  readonly description:
    string;

  readonly icon:
    ReactNode;
}


export interface PwaInstallPromptProps {
  readonly open:
    boolean;

  readonly onClose:
    () => void;

  readonly appName?:
    string;

  readonly logoSrc?:
    string;

  readonly title?:
    string;

  readonly description?:
    string;

  /**
   * Permet d'ajouter une classe à l'overlay si le projet souhaite
   * compléter le style via pwa-install.module.css.
   */
  readonly className?:
    string;
}


/* ==========================================================================
   CLIENT READY
   ========================================================================== */

/**
 * useSyncExternalStore permet de différencier proprement :
 *
 * - rendu serveur : false ;
 * - navigateur après hydratation : true.
 *
 * Cela évite :
 *
 * useEffect(() => {
 *   setMounted(true);
 * }, []);
 *
 * qui est refusé par react-hooks/set-state-in-effect dans ce projet.
 */

function subscribeToClientReady():
  () => void {
  return () => {
    /**
     * Aucun abonnement externe n'est nécessaire.
     */
  };
}


function getClientReadySnapshot():
  boolean {
  return true;
}


function getServerReadySnapshot():
  boolean {
  return false;
}


/* ==========================================================================
   PLATFORM DETECTION
   ========================================================================== */

function detectPlatform():
  PwaInstallPlatform {
  if (
    typeof navigator ===
      "undefined"
  ) {
    return "unknown";
  }


  const userAgent =
    navigator.userAgent;


  const platform =
    navigator.platform;


  const isClassicIos =
    /iPad|iPhone|iPod/i.test(
      userAgent,
    );


  const isModernIpad =
    platform ===
      "MacIntel" &&
    navigator.maxTouchPoints >
      1;


  if (
    isClassicIos ||
    isModernIpad
  ) {
    return "ios";
  }


  if (
    /Android/i.test(
      userAgent,
    )
  ) {
    return "android";
  }


  if (
    /Windows|Macintosh|Linux/i.test(
      userAgent,
    )
  ) {
    return "desktop";
  }


  return "unknown";
}


/* ==========================================================================
   INSTALL STEPS
   ========================================================================== */

function getInstallSteps(
  platform:
    PwaInstallPlatform,
): readonly InstallStep[] {
  switch (
    platform
  ) {
    case "ios":
      return [
        {
          id:
            "share",

          title:
            "Touchez Partager",

          description:
            "Dans Safari, ouvrez le menu de partage avec l’icône carrée et la flèche vers le haut.",

          icon:
            (
              <Share2
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "home",

          title:
            "Choisissez « Sur l’écran d’accueil »",

          description:
            "Faites défiler les actions du menu puis sélectionnez l’ajout à l’écran d’accueil.",

          icon:
            (
              <Smartphone
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "webapp",

          title:
            "Validez l’ajout",

          description:
            "Confirmez l’ajout. L&E Cosmetics apparaîtra ensuite sur votre écran d’accueil et pourra s’ouvrir comme une application web.",

          icon:
            (
              <Check
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
            ),
        },
      ];


    case "android":
      return [
        {
          id:
            "menu",

          title:
            "Ouvrez le menu du navigateur",

          description:
            "Dans Chrome ou un navigateur compatible, ouvrez le menu principal.",

          icon:
            (
              <ExternalLink
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "install",

          title:
            "Choisissez « Installer l’application »",

          description:
            "Selon le navigateur, l’action peut aussi s’appeler « Ajouter à l’écran d’accueil ».",

          icon:
            (
              <Download
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "confirm",

          title:
            "Confirmez l’installation",

          description:
            "L’application sera disponible depuis l’écran d’accueil et le lanceur d’applications.",

          icon:
            (
              <Check
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
            ),
        },
      ];


    case "desktop":
      return [
        {
          id:
            "browser",

          title:
            "Utilisez un navigateur compatible",

          description:
            "Ouvrez le site dans Chrome, Edge ou un navigateur proposant l’installation des applications web.",

          icon:
            (
              <MonitorDown
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "install",

          title:
            "Cliquez sur « Installer »",

          description:
            "Le bouton d’installation peut apparaître dans la barre d’adresse ou dans le menu du navigateur.",

          icon:
            (
              <Download
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "launch",

          title:
            "Ouvrez L&E Cosmetics comme une application",

          description:
            "Une fois installée, l’application pourra s’ouvrir dans sa propre fenêtre.",

          icon:
            (
              <Check
                size={20}
                strokeWidth={2}
                aria-hidden="true"
              />
            ),
        },
      ];


    case "unknown":
    default:
      return [
        {
          id:
            "browser-menu",

          title:
            "Ouvrez le menu de votre navigateur",

          description:
            "Recherchez une action d’installation ou d’ajout à l’écran d’accueil.",

          icon:
            (
              <ExternalLink
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },

        {
          id:
            "install",

          title:
            "Installez l’application web",

          description:
            "La formulation exacte dépend du navigateur et du système utilisé.",

          icon:
            (
              <Download
                size={20}
                strokeWidth={1.9}
                aria-hidden="true"
              />
            ),
        },
      ];
  }
}


/* ==========================================================================
   FOCUSABLE SELECTOR
   ========================================================================== */

const FOCUSABLE_SELECTOR =
  [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(
    ",",
  );


/* ==========================================================================
   STYLES
   ========================================================================== */

const styles:
  Record<
    string,
    CSSProperties
  > = {
  overlay: {
    position:
      "fixed",

    inset:
      0,

    zIndex:
      9999,

    display:
      "grid",

    placeItems:
      "center",

    padding:
      "20px",

    background:
      "rgba(15, 15, 18, 0.66)",

    backdropFilter:
      "blur(9px)",

    WebkitBackdropFilter:
      "blur(9px)",

    overscrollBehavior:
      "contain",
  },

  dialog: {
    position:
      "relative",

    width:
      "min(100%, 520px)",

    maxHeight:
      "min(88dvh, 760px)",

    overflowY:
      "auto",

    overscrollBehavior:
      "contain",

    border:
      "1px solid rgba(0, 0, 0, 0.08)",

    borderRadius:
      "28px",

    background:
      "#ffffff",

    boxShadow:
      "0 30px 90px rgba(0, 0, 0, 0.28)",

    color:
      "#17171a",

    WebkitOverflowScrolling:
      "touch",
  },

  closeButton: {
    position:
      "absolute",

    top:
      "16px",

    right:
      "16px",

    zIndex:
      2,

    width:
      "40px",

    height:
      "40px",

    display:
      "grid",

    placeItems:
      "center",

    padding:
      0,

    border:
      "1px solid rgba(0, 0, 0, 0.08)",

    borderRadius:
      "999px",

    background:
      "rgba(255, 255, 255, 0.94)",

    color:
      "#17171a",

    cursor:
      "pointer",
  },

  hero: {
    padding:
      "34px 28px 22px",

    textAlign:
      "center",

    background:
      "linear-gradient(180deg, rgba(230, 0, 126, 0.08) 0%, rgba(230, 0, 126, 0.02) 70%, rgba(255,255,255,1) 100%)",
  },

  logoWrap: {
    width:
      "88px",

    height:
      "88px",

    margin:
      "0 auto 18px",

    display:
      "grid",

    placeItems:
      "center",

    overflow:
      "hidden",

    borderRadius:
      "24px",

    background:
      "#ffffff",

    border:
      "1px solid rgba(230, 0, 126, 0.15)",

    boxShadow:
      "0 12px 32px rgba(230, 0, 126, 0.12)",
  },

  logo: {
    width:
      "100%",

    height:
      "100%",

    objectFit:
      "contain",
  },

  eyebrow: {
    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "7px",

    marginBottom:
      "10px",

    fontSize:
      "12px",

    fontWeight:
      800,

    letterSpacing:
      "0.08em",

    textTransform:
      "uppercase",

    color:
      "#e6007e",
  },

  title: {
    margin:
      0,

    fontSize:
      "clamp(24px, 6vw, 34px)",

    lineHeight:
      1.08,

    fontWeight:
      800,

    letterSpacing:
      "-0.03em",

    color:
      "#17171a",
  },

  description: {
    maxWidth:
      "430px",

    margin:
      "12px auto 0",

    fontSize:
      "15px",

    lineHeight:
      1.65,

    color:
      "#66666d",
  },

  content: {
    padding:
      "6px 24px 26px",
  },

  steps: {
    display:
      "grid",

    gap:
      "12px",

    margin:
      0,

    padding:
      0,

    listStyle:
      "none",
  },

  step: {
    display:
      "grid",

    gridTemplateColumns:
      "46px minmax(0, 1fr)",

    gap:
      "13px",

    alignItems:
      "start",

    padding:
      "15px",

    border:
      "1px solid rgba(0, 0, 0, 0.07)",

    borderRadius:
      "18px",

    background:
      "#fafafa",
  },

  stepIcon: {
    width:
      "46px",

    height:
      "46px",

    display:
      "grid",

    placeItems:
      "center",

    borderRadius:
      "15px",

    background:
      "rgba(230, 0, 126, 0.10)",

    color:
      "#e6007e",
  },

  stepTitle: {
    margin:
      "1px 0 4px",

    fontSize:
      "15px",

    lineHeight:
      1.35,

    fontWeight:
      750,

    color:
      "#202025",
  },

  stepDescription: {
    margin:
      0,

    fontSize:
      "13.5px",

    lineHeight:
      1.55,

    color:
      "#6b6b72",
  },

  footer: {
    display:
      "grid",

    gridTemplateColumns:
      "1fr",

    gap:
      "10px",

    padding:
      "0 24px calc(26px + env(safe-area-inset-bottom))",
  },

  doneButton: {
    width:
      "100%",

    minHeight:
      "50px",

    display:
      "inline-flex",

    alignItems:
      "center",

    justifyContent:
      "center",

    gap:
      "9px",

    border:
      0,

    borderRadius:
      "16px",

    background:
      "#e6007e",

    color:
      "#ffffff",

    fontSize:
      "15px",

    fontWeight:
      750,

    cursor:
      "pointer",

    boxShadow:
      "0 12px 26px rgba(230, 0, 126, 0.24)",
  },

  note: {
    margin:
      0,

    textAlign:
      "center",

    fontSize:
      "12.5px",

    lineHeight:
      1.5,

    color:
      "#85858c",
  },
};


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function PwaInstallPrompt({
  open,

  onClose,

  appName =
    DEFAULT_APP_NAME,

  logoSrc =
    DEFAULT_LOGO_SRC,

  title,

  description,

  className,
}: PwaInstallPromptProps) {
  /* ------------------------------------------------------------------------
     CLIENT READY
     ------------------------------------------------------------------------ */

  const clientReady =
    useSyncExternalStore(
      subscribeToClientReady,
      getClientReadySnapshot,
      getServerReadySnapshot,
    );


  /* ------------------------------------------------------------------------
     PLATFORM
     ------------------------------------------------------------------------ */

  const platform =
    useMemo<PwaInstallPlatform>(
      () => {
        if (
          !clientReady
        ) {
          return "unknown";
        }


        return detectPlatform();
      },
      [
        clientReady,
      ],
    );


  /* ------------------------------------------------------------------------
     REFS
     ------------------------------------------------------------------------ */

  const dialogRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const closeButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );


  const previousFocusedElementRef =
    useRef<HTMLElement | null>(
      null,
    );


  /* ------------------------------------------------------------------------
     OPEN / CLOSE SIDE EFFECTS
     ------------------------------------------------------------------------ */

  useEffect(
    () => {
      if (
        !open ||
        !clientReady
      ) {
        return;
      }


      previousFocusedElementRef.current =
        document.activeElement instanceof
          HTMLElement
          ? document.activeElement
          : null;


      const previousOverflow =
        document.body.style.overflow;


      document.body.style.overflow =
        "hidden";


      const handleKeyDown =
        (
          event:
            KeyboardEvent,
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            event.preventDefault();

            onClose();

            return;
          }


          if (
            event.key !==
              "Tab"
          ) {
            return;
          }


          const dialog =
            dialogRef.current;


          if (
            !dialog
          ) {
            return;
          }


          const focusableElements =
            Array.from(
              dialog.querySelectorAll<HTMLElement>(
                FOCUSABLE_SELECTOR,
              ),
            ).filter(
              (
                element,
              ) =>
                !element.hasAttribute(
                  "disabled",
                ) &&
                element.getAttribute(
                  "aria-hidden",
                ) !==
                  "true",
            );


          if (
            focusableElements.length ===
              0
          ) {
            event.preventDefault();

            dialog.focus();

            return;
          }


          const first =
            focusableElements[0];


          const last =
            focusableElements[
              focusableElements.length -
              1
            ];


          const active =
            document.activeElement;


          if (
            event.shiftKey &&
            active ===
              first
          ) {
            event.preventDefault();

            last?.focus();

            return;
          }


          if (
            !event.shiftKey &&
            active ===
              last
          ) {
            event.preventDefault();

            first?.focus();
          }
        };


      document.addEventListener(
        "keydown",
        handleKeyDown,
      );


      /**
       * Le focus est placé après le rendu du portal.
       *
       * Le callback du timer est un callback externe, donc aucune mutation
       * d'état React n'est effectuée ici.
       */
      const focusTimer =
        window.setTimeout(
          () => {
            closeButtonRef
              .current
              ?.focus();
          },
          0,
        );


      return () => {
        window.clearTimeout(
          focusTimer,
        );


        document.removeEventListener(
          "keydown",
          handleKeyDown,
        );


        document.body.style.overflow =
          previousOverflow;


        const previousFocusedElement =
          previousFocusedElementRef
            .current;


        previousFocusedElementRef.current =
          null;


        previousFocusedElement
          ?.focus();
      };
    },
    [
      clientReady,
      onClose,
      open,
    ],
  );


  /* ------------------------------------------------------------------------
     CONTENT
     ------------------------------------------------------------------------ */

  const steps =
    useMemo(
      () =>
        getInstallSteps(
          platform,
        ),
      [
        platform,
      ],
    );


  const defaultTitle =
    platform ===
      "ios"
      ? `Installer ${appName} sur iPhone`
      : `Installer ${appName}`;


  const defaultDescription =
    platform ===
      "ios"
      ? "L’installation sur iPhone ou iPad se fait directement depuis Safari en quelques étapes."
      : "Ajoutez l’application à votre appareil pour y accéder plus rapidement.";


  /* ------------------------------------------------------------------------
     NOT RENDERED
     ------------------------------------------------------------------------ */

  if (
    !clientReady ||
    !open
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     BACKDROP CLICK
     ------------------------------------------------------------------------ */

  const handleBackdropMouseDown =
    (
      event:
        ReactMouseEvent<HTMLDivElement>,
    ) => {
      if (
        event.target ===
        event.currentTarget
      ) {
        onClose();
      }
    };


  /* ------------------------------------------------------------------------
     PORTAL
     ------------------------------------------------------------------------ */

  return createPortal(
    <div
      className={
        className
      }
      style={
        styles.overlay
      }
      onMouseDown={
        handleBackdropMouseDown
      }
      role="presentation"
    >
      <div
        ref={
          dialogRef
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={
          DIALOG_TITLE_ID
        }
        aria-describedby={
          DIALOG_DESCRIPTION_ID
        }
        tabIndex={-1}
        style={
          styles.dialog
        }
        onMouseDown={
          (
            event,
          ) => {
            event.stopPropagation();
          }
        }
      >
        {/* ================================================================
            CLOSE
            ================================================================ */}

        <button
          ref={
            closeButtonRef
          }
          type="button"
          aria-label="Fermer les instructions d’installation"
          title="Fermer"
          onClick={
            onClose
          }
          style={
            styles.closeButton
          }
        >
          <X
            size={20}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>


        {/* ================================================================
            HERO
            ================================================================ */}

        <header
          style={
            styles.hero
          }
        >
          <div
            style={
              styles.logoWrap
            }
            aria-hidden="true"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                logoSrc
              }
              alt=""
              width={88}
              height={88}
              style={
                styles.logo
              }
            />
          </div>


          <div
            style={
              styles.eyebrow
            }
          >
            <Download
              size={15}
              strokeWidth={2}
              aria-hidden="true"
            />

            APPLICATION
          </div>


          <h2
            id={
              DIALOG_TITLE_ID
            }
            style={
              styles.title
            }
          >
            {title ??
              defaultTitle}
          </h2>


          <p
            id={
              DIALOG_DESCRIPTION_ID
            }
            style={
              styles.description
            }
          >
            {description ??
              defaultDescription}
          </p>
        </header>


        {/* ================================================================
            STEPS
            ================================================================ */}

        <section
          style={
            styles.content
          }
          aria-label="Étapes d’installation"
        >
          <ol
            style={
              styles.steps
            }
          >
            {steps.map(
              (
                step,
                index,
              ) => (
                <li
                  key={
                    step.id
                  }
                  style={
                    styles.step
                  }
                >
                  <div
                    style={
                      styles.stepIcon
                    }
                    aria-hidden="true"
                  >
                    {step.icon}
                  </div>


                  <div>
                    <p
                      style={
                        styles.stepTitle
                      }
                    >
                      {index + 1}.{" "}
                      {step.title}
                    </p>

                    <p
                      style={
                        styles.stepDescription
                      }
                    >
                      {step.description}
                    </p>
                  </div>
                </li>
              ),
            )}
          </ol>
        </section>


        {/* ================================================================
            FOOTER
            ================================================================ */}

        <footer
          style={
            styles.footer
          }
        >
          <button
            type="button"
            onClick={
              onClose
            }
            style={
              styles.doneButton
            }
          >
            <Check
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />

            J’ai compris
          </button>


          <p
            style={
              styles.note
            }
          >
            L’installation ne modifie pas votre compte et vous pourrez
            continuer à utiliser le site normalement dans votre navigateur.
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}


/* ==========================================================================
   FIN
   ========================================================================== */

/**
 * Exemple complet avec PwaInstallButton :
 *
 * "use client";
 *
 * import {
 *   useState,
 * } from "react";
 *
 * import PwaInstallButton from "@/components/pwa/PwaInstallButton";
 * import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
 *
 *
 * export default function InstallAppControl() {
 *   const [
 *     helpOpen,
 *     setHelpOpen,
 *   ] =
 *     useState(
 *       false,
 *     );
 *
 *
 *   return (
 *     <>
 *       <PwaInstallButton
 *         onIosInstallHelpRequested={() => {
 *           setHelpOpen(true);
 *         }}
 *       />
 *
 *       <PwaInstallPrompt
 *         open={helpOpen}
 *         onClose={() => {
 *           setHelpOpen(false);
 *         }}
 *       />
 *     </>
 *   );
 * }
 */