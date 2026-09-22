"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  usePathname,
} from "next/navigation";

import GestionnaireAppHeader from "./GestionnaireAppHeader";
import GestionnaireMobileDrawer from "./GestionnaireMobileDrawer";
import GestionnaireSidebar from "./GestionnaireSidebar";

import type {
  GestionnaireProfile,
} from "./GestionnaireProfileCard";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE SHELL
   ============================================================ */

const DESKTOP_MEDIA_QUERY =
  "(min-width: 1101px)";


type GestionnaireShellProps =
  Readonly<{
    children: ReactNode;

    profile?: GestionnaireProfile;

    hasUnreadNotifications?: boolean;

    onLogout?: () => void;
  }>;


type MobileNavigationState =
  Readonly<{
    pathname: string;
    open: boolean;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireShell({
  children,
  profile,
  hasUnreadNotifications = false,
  onLogout,
}: GestionnaireShellProps) {
  const pathname =
    usePathname() || "/";


  /* ----------------------------------------------------------
     DRAWER STATE

     L'état est lié à la route sur laquelle il a été ouvert.

     Si pathname change :
     l'état appartient à l'ancienne route et le Drawer devient
     automatiquement fermé.

     Aucun useEffect + setState n'est nécessaire.
     ---------------------------------------------------------- */

  const [
    mobileNavigationState,
    setMobileNavigationState,
  ] = useState<
    MobileNavigationState | null
  >(null);


  const isMobileNavigationOpen =
    mobileNavigationState?.pathname ===
      pathname &&
    mobileNavigationState.open;


  /* ----------------------------------------------------------
     MENU BUTTON REF
     ---------------------------------------------------------- */

  const menuButtonRef =
    useRef<HTMLButtonElement>(
      null,
    );


  /* ----------------------------------------------------------
     OPEN
     ---------------------------------------------------------- */

  const openMobileNavigation =
    useCallback(() => {
      setMobileNavigationState({
        pathname,
        open: true,
      });
    }, [
      pathname,
    ]);


  /* ----------------------------------------------------------
     CLOSE
     ---------------------------------------------------------- */

  const closeMobileNavigation =
    useCallback(() => {
      setMobileNavigationState({
        pathname,
        open: false,
      });
    }, [
      pathname,
    ]);


  /* ==========================================================
     DESKTOP BREAKPOINT
     ----------------------------------------------------------
     Ici setState n'est PAS appelé directement dans l'effet.

     Il est exécuté uniquement par le callback déclenché par
     matchMedia lorsque l'environnement externe change.
     ========================================================== */

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        DESKTOP_MEDIA_QUERY,
      );


    const handleDesktopChange =
      (
        event:
          MediaQueryListEvent,
      ) => {
        if (!event.matches) {
          return;
        }

        setMobileNavigationState(
          null,
        );
      };


    mediaQuery.addEventListener(
      "change",
      handleDesktopChange,
    );


    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleDesktopChange,
      );
    };
  }, []);


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="gestionnaire-app-shell">
      {/* ======================================================
          DESKTOP SIDEBAR
          ====================================================== */}

      <GestionnaireSidebar
        profile={profile}
        onLogout={onLogout}
      />


      {/* ======================================================
          MAIN APPLICATION
          ====================================================== */}

      <div className="gestionnaire-app-main">
        {/* ====================================================
            HEADER
            ==================================================== */}

        <GestionnaireAppHeader
          profile={profile}
          hasUnreadNotifications={
            hasUnreadNotifications
          }
          isNavigationOpen={
            isMobileNavigationOpen
          }
          onOpenNavigation={
            openMobileNavigation
          }
          menuButtonRef={
            menuButtonRef
          }
        />


        {/* ====================================================
            PAGE CONTENT
            ==================================================== */}

        <main
          id="gestionnaire-main-content"
          className="gestionnaire-app-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>


      {/* ======================================================
          MOBILE DRAWER
          ====================================================== */}

      <GestionnaireMobileDrawer
        open={
          isMobileNavigationOpen
        }
        profile={profile}
        onClose={
          closeMobileNavigation
        }
        onLogout={onLogout}
        returnFocusRef={
          menuButtonRef
        }
      />
    </div>
  );
}