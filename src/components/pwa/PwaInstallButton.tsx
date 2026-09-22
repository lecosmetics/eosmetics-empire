

import {
  Download,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PWA — INSTALL BUTTON
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/pwa/PwaInstallButton.tsx
 *
 * RÔLE :
 *
 * - écouter l'événement navigateur `beforeinstallprompt` ;
 * - déclencher le prompt natif d'installation sur les navigateurs compatibles ;
 * - détecter si l'application est déjà installée / ouverte en standalone ;
 * - détecter iPhone / iPad lorsque le prompt natif n'est pas disponible ;
 * - permettre à un composant parent d'ouvrir une aide d'installation iOS ;
 * - écouter `appinstalled` afin de masquer immédiatement l'action ;
 * - ne jamais empêcher le site de fonctionner si la PWA n'est pas disponible ;
 * - rester totalement indépendant de Prisma, des sessions et du métier.
 *
 * COMPATIBILITÉ PRINCIPALE :
 *
 * - Android / Chrome / Edge :
 *     beforeinstallprompt -> prompt natif.
 *
 * - Windows / macOS / Chrome / Edge :
 *     beforeinstallprompt -> prompt natif lorsque disponible.
 *
 * - iPhone / iPad / Safari :
 *     pas de beforeinstallprompt.
 *     Le bouton peut appeler `onIosInstallHelpRequested`.
 *
 * IMPORTANT :
 *
 * Ce composant NE :
 *
 * - n'enregistre pas le Service Worker ;
 * - ne crée pas le manifest ;
 * - ne force jamais l'installation ;
 * - ne simule jamais une installation réussie ;
 * - ne stocke aucune donnée sensible ;
 * - ne recharge jamais la page ;
 * - ne dépend d'aucun fichier CSS inexistant.
 *
 * Cette version évite volontairement tout setState() synchrone directement
 * dans le corps d'un useEffect afin de respecter :
 *
 * react-hooks/set-state-in-effect
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const DEFAULT_INSTALL_LABEL =
  "Installer l’application";


const DEFAULT_IOS_LABEL =
  "Installer sur iPhone";


const DEFAULT_INSTALLING_LABEL =
  "Ouverture…";


/* ==========================================================================
   BEFOREINSTALLPROMPT — TYPES
   ========================================================================== */

/**
 * `BeforeInstallPromptEvent` n'est pas encore déclaré de manière uniforme
 * dans tous les types DOM TypeScript.
 *
 * On définit uniquement le contrat réellement utilisé par ce composant.
 */

type BeforeInstallPromptChoice =
  Readonly<{
    outcome:
      "accepted" |
      "dismissed";

    platform:
      string;
  }>;


interface BeforeInstallPromptEvent
  extends Event {
  readonly platforms:
    readonly string[];

  readonly userChoice:
    Promise<BeforeInstallPromptChoice>;

  prompt():
    Promise<void>;
}


/* ==========================================================================
   NAVIGATOR IOS
   ========================================================================== */

interface NavigatorWithStandalone
  extends Navigator {
  readonly standalone?:
    boolean;
}


/* ==========================================================================
   PUBLIC TYPES
   ========================================================================== */

export type PwaInstallButtonState =
  | "loading"
  | "unavailable"
  | "available"
  | "ios"
  | "installing"
  | "installed";


export interface PwaInstallButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "children"
    | "onClick"
    | "type"
  > {
  /**
   * Texte Android / desktop.
   */
  readonly label?:
    string;

  /**
   * Texte iOS.
   */
  readonly iosLabel?:
    string;

  /**
   * Texte pendant l'ouverture du prompt natif.
   */
  readonly installingLabel?:
    string;

  /**
   * Icône personnalisée.
   *
   * false :
   * aucune icône.
   *
   * undefined :
   * icône Download Lucide par défaut.
   */
  readonly icon?:
    ReactNode | false;

  /**
   * Si true, le composant ne rend rien lorsque :
   *
   * - l'app est déjà installée ;
   * - aucun prompt natif n'est disponible ;
   * - l'appareil n'est pas iOS.
   *
   * Valeur recommandée pour l'interface publique.
   */
  readonly hideWhenUnavailable?:
    boolean;

  /**
   * Appelé sur iPhone / iPad lorsque l'utilisateur demande l'installation.
   *
   * Le parent pourra ouvrir PwaInstallPrompt.tsx avec les étapes :
   *
   * Safari -> Partager -> Sur l'écran d'accueil.
   */
  readonly onIosInstallHelpRequested?:
    () => void;

  /**
   * Appelé après acceptation du prompt natif.
   *
   * "accepted" signifie que l'utilisateur a accepté le prompt.
   * L'événement `appinstalled` reste la confirmation navigateur.
   */
  readonly onInstallAccepted?:
    () => void;

  /**
   * Appelé lorsque l'utilisateur ferme/refuse le prompt.
   */
  readonly onInstallDismissed?:
    () => void;

  /**
   * Appelé lorsque `appinstalled` est reçu.
   */
  readonly onInstalled?:
    () => void;

  /**
   * Permet au parent d'observer l'état du bouton.
   */
  readonly onStateChange?:
    (
      state:
        PwaInstallButtonState,
    ) => void;
}


/* ==========================================================================
   HYDRATION / CLIENT SNAPSHOT
   ========================================================================== */

/**
 * useSyncExternalStore permet ici de distinguer proprement :
 *
 * - le rendu serveur : false ;
 * - le navigateur après hydratation : true.
 *
 * Cela évite le pattern :
 *
 * useEffect(() => setMounted(true), [])
 *
 * qui est refusé par la règle react-hooks/set-state-in-effect.
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
   BROWSER HELPERS
   ========================================================================== */

function isBrowser():
  boolean {
  return (
    typeof window !==
      "undefined" &&
    typeof navigator !==
      "undefined"
  );
}


/* ==========================================================================
   STANDALONE
   ========================================================================== */

function isStandaloneMode():
  boolean {
  if (
    !isBrowser()
  ) {
    return false;
  }


  const navigatorWithStandalone =
    navigator as
      NavigatorWithStandalone;


  const iosStandalone =
    navigatorWithStandalone
      .standalone ===
    true;


  const displayModeStandalone =
    typeof window.matchMedia ===
      "function" &&
    window.matchMedia(
      "(display-mode: standalone)",
    ).matches;


  const displayModeFullscreen =
    typeof window.matchMedia ===
      "function" &&
    window.matchMedia(
      "(display-mode: fullscreen)",
    ).matches;


  return (
    iosStandalone ||
    displayModeStandalone ||
    displayModeFullscreen
  );
}


/* ==========================================================================
   IOS DETECTION
   ========================================================================== */

/**
 * iPadOS peut parfois annoncer une plateforme desktop.
 *
 * On tient donc compte de MacIntel + touch points.
 */

function isIosDevice():
  boolean {
  if (
    !isBrowser()
  ) {
    return false;
  }


  const userAgent =
    navigator.userAgent;


  const platform =
    navigator.platform;


  const classicIos =
    /iPad|iPhone|iPod/i.test(
      userAgent,
    );


  const modernIpad =
    platform ===
      "MacIntel" &&
    navigator.maxTouchPoints >
      1;


  return (
    classicIos ||
    modernIpad
  );
}


/* ==========================================================================
   STATE RESOLVER
   ========================================================================== */

function resolveInstallButtonState({
  clientReady,
  installed,
  installing,
  deferredPrompt,
  ios,
}: {
  readonly clientReady:
    boolean;

  readonly installed:
    boolean;

  readonly installing:
    boolean;

  readonly deferredPrompt:
    BeforeInstallPromptEvent | null;

  readonly ios:
    boolean;
}): PwaInstallButtonState {
  if (
    !clientReady
  ) {
    return "loading";
  }


  if (
    installed
  ) {
    return "installed";
  }


  if (
    installing
  ) {
    return "installing";
  }


  if (
    deferredPrompt
  ) {
    return "available";
  }


  if (
    ios
  ) {
    return "ios";
  }


  return "unavailable";
}


/* ==========================================================================
   DEVELOPMENT LOG
   ========================================================================== */

function logDevelopmentError(
  message:
    string,
  error:
    unknown,
): void {
  if (
    process.env.NODE_ENV ===
    "production"
  ) {
    return;
  }


  console.error(
    `[Cosmetics Empire][PWA] ${message}`,
    {
      errorName:
        error instanceof
          Error
          ? error.name
          : "UnknownError",

      errorMessage:
        error instanceof
          Error
          ? error.message
          : null,
    },
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function PwaInstallButton({
  label =
    DEFAULT_INSTALL_LABEL,

  iosLabel =
    DEFAULT_IOS_LABEL,

  installingLabel =
    DEFAULT_INSTALLING_LABEL,

  icon,

  hideWhenUnavailable =
    true,

  onIosInstallHelpRequested,

  onInstallAccepted,

  onInstallDismissed,

  onInstalled,

  onStateChange,

  disabled,

  className,

  "aria-label":
    ariaLabel,

  ...buttonProps
}: PwaInstallButtonProps) {
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
     STATE
     ------------------------------------------------------------------------ */

  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<
      BeforeInstallPromptEvent | null
    >(
      null,
    );


  const [
    installedByEvent,
    setInstalledByEvent,
  ] =
    useState(
      false,
    );


  const [
    isInstalling,
    setIsInstalling,
  ] =
    useState(
      false,
    );


  /* ------------------------------------------------------------------------
     DERIVED PLATFORM STATE
     ------------------------------------------------------------------------ */

  const ios =
    clientReady &&
    isIosDevice();


  const installed =
    installedByEvent ||
    (
      clientReady &&
      isStandaloneMode()
    );


  /* ------------------------------------------------------------------------
     BROWSER EVENTS
     ------------------------------------------------------------------------ */

  useEffect(
    () => {
      const handleBeforeInstallPrompt =
        (
          event:
            Event,
        ) => {
          /**
           * On empêche le mini-infobar automatique lorsqu'il existe afin que
           * l'installation reste déclenchée par notre vrai bouton.
           */
          event.preventDefault();


          const installEvent =
            event as
              BeforeInstallPromptEvent;


          setDeferredPrompt(
            installEvent,
          );
        };


      const handleAppInstalled =
        () => {
          setDeferredPrompt(
            null,
          );


          setIsInstalling(
            false,
          );


          setInstalledByEvent(
            true,
          );


          onInstalled?.();
        };


      window.addEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );


      window.addEventListener(
        "appinstalled",
        handleAppInstalled,
      );


      /**
       * Si le display-mode change à la suite d'une installation/ouverture,
       * on synchronise l'état depuis le callback de l'API externe.
       *
       * Les setState() se trouvent donc dans des callbacks d'événements,
       * pas directement dans le corps de l'effet.
       */
      const standaloneMedia =
        window.matchMedia(
          "(display-mode: standalone)",
        );


      const fullscreenMedia =
        window.matchMedia(
          "(display-mode: fullscreen)",
        );


      const handleDisplayModeChange =
        () => {
          if (
            !isStandaloneMode()
          ) {
            return;
          }


          setDeferredPrompt(
            null,
          );


          setIsInstalling(
            false,
          );


          setInstalledByEvent(
            true,
          );
        };


      standaloneMedia.addEventListener(
        "change",
        handleDisplayModeChange,
      );


      fullscreenMedia.addEventListener(
        "change",
        handleDisplayModeChange,
      );


      return () => {
        window.removeEventListener(
          "beforeinstallprompt",
          handleBeforeInstallPrompt,
        );


        window.removeEventListener(
          "appinstalled",
          handleAppInstalled,
        );


        standaloneMedia.removeEventListener(
          "change",
          handleDisplayModeChange,
        );


        fullscreenMedia.removeEventListener(
          "change",
          handleDisplayModeChange,
        );
      };
    },
    [
      onInstalled,
    ],
  );


  /* ------------------------------------------------------------------------
     DERIVED STATE
     ------------------------------------------------------------------------ */

  const state =
    resolveInstallButtonState({
      clientReady,

      installed,

      installing:
        isInstalling,

      deferredPrompt,

      ios,
    });


  /* ------------------------------------------------------------------------
     STATE CALLBACK
     ------------------------------------------------------------------------ */

  useEffect(
    () => {
      onStateChange?.(
        state,
      );
    },
    [
      onStateChange,
      state,
    ],
  );


  /* ------------------------------------------------------------------------
     CLICK
     ------------------------------------------------------------------------ */

  const handleInstall =
    useCallback(
      async () => {
        if (
          disabled ||
          installed ||
          isInstalling
        ) {
          return;
        }


        /**
         * iPhone / iPad :
         *
         * Safari n'expose pas le même prompt natif que Chromium.
         * Le parent ouvre donc l'aide d'installation dédiée.
         */
        if (
          !deferredPrompt &&
          ios
        ) {
          onIosInstallHelpRequested?.();

          return;
        }


        if (
          !deferredPrompt
        ) {
          return;
        }


        setIsInstalling(
          true,
        );


        try {
          await deferredPrompt.prompt();


          const choice =
            await deferredPrompt.userChoice;


          /**
           * Un BeforeInstallPromptEvent ne doit être utilisé qu'une fois.
           */
          setDeferredPrompt(
            null,
          );


          if (
            choice.outcome ===
            "accepted"
          ) {
            onInstallAccepted?.();
          } else {
            onInstallDismissed?.();
          }
        } catch (
          error
        ) {
          /**
           * L'installation PWA reste une fonctionnalité progressive.
           *
           * Une erreur du navigateur ne doit jamais casser le site.
           */
          logDevelopmentError(
            "Impossible d'ouvrir le prompt natif d'installation.",
            error,
          );


          setDeferredPrompt(
            null,
          );
        } finally {
          setIsInstalling(
            false,
          );
        }
      },
      [
        deferredPrompt,
        disabled,
        installed,
        ios,
        isInstalling,
        onInstallAccepted,
        onInstallDismissed,
        onIosInstallHelpRequested,
      ],
    );


  /* ------------------------------------------------------------------------
     VISIBILITY
     ------------------------------------------------------------------------ */

  const shouldHide =
    hideWhenUnavailable &&
    (
      state ===
        "loading" ||
      state ===
        "unavailable" ||
      state ===
        "installed"
    );


  if (
    shouldHide
  ) {
    return null;
  }


  /* ------------------------------------------------------------------------
     LABEL
     ------------------------------------------------------------------------ */

  const visibleLabel =
    state ===
      "installing"
      ? installingLabel
      : state ===
          "ios"
        ? iosLabel
        : label;


  /* ------------------------------------------------------------------------
     ICON
     ------------------------------------------------------------------------ */

  const visibleIcon =
    icon ===
      false
      ? null
      : icon ??
        (
          <Download
            size={
              18
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
          />
        );


  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  return (
    <button
      {...buttonProps}
      type="button"
      className={
        className
      }
      aria-label={
        ariaLabel ??
        visibleLabel
      }
      aria-busy={
        isInstalling
          ? true
          : undefined
      }
      data-pwa-install-state={
        state
      }
      disabled={
        disabled ||
        isInstalling ||
        state ===
          "installed" ||
        state ===
          "unavailable" ||
        state ===
          "loading"
      }
      onClick={
        () => {
          void handleInstall();
        }
      }
    >
      {visibleIcon}

      <span>
        {visibleLabel}
      </span>
    </button>
  );
}


/* ==========================================================================
   FIN
   ========================================================================== */

/**
 * EXEMPLE ANDROID / PC
 * --------------------------------------------------------------------------
 *
 * <PwaInstallButton
 *   className={styles.installButton}
 * />
 *
 *
 * EXEMPLE iPHONE / iPAD
 * --------------------------------------------------------------------------
 *
 * <PwaInstallButton
 *   className={styles.installButton}
 *   onIosInstallHelpRequested={() => {
 *     setIosHelpOpen(true);
 *   }}
 * />
 *
 *
 * PwaInstallPrompt.tsx peut ensuite afficher les instructions Apple
 * sans dupliquer la logique d'installation native.
 */
