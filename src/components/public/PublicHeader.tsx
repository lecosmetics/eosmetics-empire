"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import PublicDesktopHeader from "@/components/public/PublicDesktopHeader";
import PublicMobileDrawer from "@/components/public/PublicMobileDrawer";
import PublicMobileHeader from "@/components/public/PublicMobileHeader";

import type {
  PublicNavigationData,
} from "@/lib/public/navigation/public-navigation-types";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — HEADER PRINCIPAL
 * ============================================================================
 *
 * Ce composant orchestre :
 *
 * - le header desktop ;
 * - le header mobile ;
 * - le drawer mobile ;
 * - le verrouillage du scroll ;
 * - la fermeture automatique après changement de route ;
 * - la fermeture automatique au passage vers le mode desktop.
 *
 * Aucune requête Prisma n'est exécutée ici.
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const PUBLIC_DESKTOP_MEDIA_QUERY =
  "(min-width: 1024px)";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface PublicHeaderProps {
  readonly navigation:
    PublicNavigationData;

  readonly defaultSearchQuery?:
    string | null;
}


/* ==========================================================================
   BODY SCROLL LOCK
   ========================================================================== */

function lockDocumentBodyScroll():
  () => void {
  const body =
    document.body;

  const documentElement =
    document.documentElement;

  const previousOverflow =
    body.style.overflow;

  const previousPaddingRight =
    body.style.paddingRight;

  const previousOverscrollBehavior =
    body.style.overscrollBehavior;

  const scrollbarWidth =
    Math.max(
      0,
      window.innerWidth -
        documentElement.clientWidth,
    );

  const computedBodyStyle =
    window.getComputedStyle(
      body,
    );

  const currentPaddingRight =
    Number.parseFloat(
      computedBodyStyle.paddingRight,
    ) || 0;

  body.style.overflow =
    "hidden";

  body.style.overscrollBehavior =
    "none";

  if (
    scrollbarWidth >
    0
  ) {
    body.style.paddingRight =
      `${currentPaddingRight + scrollbarWidth}px`;
  }


  return () => {
    body.style.overflow =
      previousOverflow;

    body.style.paddingRight =
      previousPaddingRight;

    body.style.overscrollBehavior =
      previousOverscrollBehavior;
  };
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function PublicHeader({
  navigation,
  defaultSearchQuery =
    null,
}: PublicHeaderProps) {
  const pathname =
    usePathname();


  /**
   * Au lieu de stocker uniquement true / false,
   * on mémorise la route sur laquelle le drawer a été ouvert.
   *
   * Si la route change, la valeur ne correspond plus au pathname actuel :
   * le drawer devient automatiquement fermé sans avoir besoin d'appeler
   * setState() directement depuis un useEffect.
   */

  const [
    mobileMenuOpenedAtPathname,
    setMobileMenuOpenedAtPathname,
  ] =
    useState<string | null>(
      null,
    );


  const isMobileMenuOpen =
    mobileMenuOpenedAtPathname ===
    pathname;


  /* =========================================================================
     OPEN DRAWER
     ========================================================================= */

  const openMobileMenu =
    useCallback(
      () => {
        setMobileMenuOpenedAtPathname(
          pathname,
        );
      },
      [
        pathname,
      ],
    );


  /* =========================================================================
     CLOSE DRAWER
     ========================================================================= */

  const closeMobileMenu =
    useCallback(
      () => {
        setMobileMenuOpenedAtPathname(
          null,
        );
      },
      [],
    );


  /* =========================================================================
     BODY SCROLL LOCK
     ========================================================================= */

  useEffect(
    () => {
      if (
        !isMobileMenuOpen
      ) {
        return;
      }


      return lockDocumentBodyScroll();
    },
    [
      isMobileMenuOpen,
    ],
  );


  /* =========================================================================
     CLOSE WHEN SWITCHING TO DESKTOP
     ========================================================================= */

  useEffect(
    () => {
      const mediaQuery =
        window.matchMedia(
          PUBLIC_DESKTOP_MEDIA_QUERY,
        );


      /**
       * Ici, setState() est appelé uniquement depuis le callback d'un
       * système externe : MediaQueryList.
       *
       * C'est précisément l'utilisation autorisée par la règle React.
       */

      function handleDesktopChange(
        event:
          MediaQueryListEvent,
      ) {
        if (
          event.matches
        ) {
          setMobileMenuOpenedAtPathname(
            null,
          );
        }
      }


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
    },
    [],
  );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <>
      <header
        className={styles.publicHeaderRoot}
        data-public-header="true"
        data-mobile-menu-open={
          isMobileMenuOpen
            ? "true"
            : "false"
        }
      >
        <div className={styles.publicHeaderSticky}>
          {/* ================================================================
              DESKTOP
              ================================================================ */}

          <div className={styles.publicHeaderDesktopOnly}>
            <PublicDesktopHeader
              navigation={navigation}
              defaultSearchQuery={defaultSearchQuery}
            />
          </div>


          {/* ================================================================
              MOBILE
              ================================================================ */}

          <div className={styles.publicHeaderMobileOnly}>
            <PublicMobileHeader
              navigation={navigation}
              onOpenMenu={openMobileMenu}
              defaultSearchQuery={defaultSearchQuery}
            />
          </div>
        </div>
      </header>


      {/* ====================================================================
          MOBILE DRAWER
          ==================================================================== */}

      <PublicMobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        navigation={navigation}
      />
    </>
  );
}