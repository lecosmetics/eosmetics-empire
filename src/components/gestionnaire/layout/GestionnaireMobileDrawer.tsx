"use client";

import {
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  type RefObject,
} from "react";

import {
  gestionnaireShellConfig,
} from "@/config/gestionnaire-navigation";

import GestionnaireSidebarContent from "./GestionnaireSidebarContent";

import type {
  GestionnaireProfile,
} from "./GestionnaireProfileCard";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE MOBILE DRAWER
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/layout/
   GestionnaireMobileDrawer.tsx

   RESPONSABILITÉ :

   Ce composant représente la navigation Gestionnaire sur :

   - tablette ;
   - mobile ;
   - petit écran.

   Il reprend exactement le même contenu que la Sidebar
   desktop grâce à :

   <GestionnaireSidebarContent />

   Il gère :

   - ouverture depuis la gauche ;
   - fermeture avec bouton X ;
   - fermeture via l'overlay ;
   - fermeture avec Escape ;
   - fermeture après navigation ;
   - blocage du scroll derrière le Drawer ;
   - restauration du focus vers le bouton hamburger ;
   - navigation clavier ;
   - focus trap lorsque le Drawer est ouvert ;
   - aria-modal ;
   - aria-hidden ;
   - inert lorsque fermé.

   IMPORTANT :

   Le Drawer ne possède aucune copie indépendante du menu.

   Desktop :
   GestionnaireSidebar
       └── GestionnaireSidebarContent

   Mobile :
   GestionnaireMobileDrawer
       └── GestionnaireSidebarContent

   Ainsi, PC et mobile utilisent toujours exactement les mêmes
   routes, libellés, sous-menus et données de profil.
   ============================================================ */


/* ============================================================
   FOCUSABLE ELEMENTS
   ------------------------------------------------------------
   Utilisé pour enfermer correctement le focus clavier dans
   le Drawer lorsqu'il est ouvert.
   ============================================================ */

const FOCUSABLE_ELEMENTS_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(",");


/* ============================================================
   TYPES
   ============================================================ */

type GestionnaireMobileDrawerProps =
  Readonly<{
    /*
     * État d'ouverture du Drawer.
     */
    open: boolean;

    /*
     * Profil du gestionnaire connecté.
     *
     * Les vraies données seront fournies plus tard par la
     * session authentifiée.
     */
    profile?: GestionnaireProfile;

    /*
     * Ferme le Drawer.
     */
    onClose: () => void;

    /*
     * Action réelle de déconnexion.
     */
    onLogout?: () => void;

    /*
     * Référence du bouton hamburger situé dans le Header.
     *
     * Elle permet de lui rendre le focus après fermeture.
     */
    returnFocusRef?:
      RefObject<
        HTMLButtonElement | null
      >;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireMobileDrawer({
  open,
  profile,
  onClose,
  onLogout,
  returnFocusRef,
}: GestionnaireMobileDrawerProps) {
  /* ----------------------------------------------------------
     REFERENCES
     ---------------------------------------------------------- */

  const drawerRef =
    useRef<HTMLElement>(null);

  const closeButtonRef =
    useRef<HTMLButtonElement>(null);


  /* ==========================================================
     RESTORE FOCUS
     ----------------------------------------------------------
     Après fermeture via X, overlay ou Escape, le focus revient
     au bouton hamburger du Header.
     ========================================================== */

  const restoreMenuButtonFocus =
    useCallback(() => {
      window.requestAnimationFrame(
        () => {
          returnFocusRef?.current?.focus();
        },
      );
    }, [
      returnFocusRef,
    ]);


  /* ==========================================================
     CLOSE + RESTORE FOCUS
     ========================================================== */

  const closeAndRestoreFocus =
    useCallback(() => {
      onClose();

      restoreMenuButtonFocus();
    }, [
      onClose,
      restoreMenuButtonFocus,
    ]);


  /* ==========================================================
     OPEN / CLOSE SIDE EFFECTS
     ----------------------------------------------------------
     Lorsque le Drawer s'ouvre :

     - scroll arrière bloqué ;
     - focus placé sur X ;
     - Escape activé ;
     - Tab reste dans le Drawer.

     Lorsque le Drawer se ferme :

     - classe de scroll supprimée ;
     - listeners nettoyés.
     ========================================================== */

  useEffect(() => {
    if (!open) {
      document.body.classList.remove(
        "ce-no-scroll",
      );

      return;
    }


    /* --------------------------------------------------------
       LOCK BACKGROUND SCROLL
       -------------------------------------------------------- */

    document.body.classList.add(
      "ce-no-scroll",
    );


    /* --------------------------------------------------------
       INITIAL FOCUS
       -------------------------------------------------------- */

    const focusFrame =
      window.requestAnimationFrame(
        () => {
          closeButtonRef.current?.focus();
        },
      );


    /* --------------------------------------------------------
       KEYBOARD HANDLER
       -------------------------------------------------------- */

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      /* ------------------------------------------------------
         ESCAPE
         ------------------------------------------------------ */

      if (event.key === "Escape") {
        event.preventDefault();

        closeAndRestoreFocus();

        return;
      }


      /* ------------------------------------------------------
         FOCUS TRAP
         ------------------------------------------------------ */

      if (event.key !== "Tab") {
        return;
      }

      const drawer =
        drawerRef.current;

      if (!drawer) {
        return;
      }


      const focusableElements =
        Array.from(
          drawer.querySelectorAll<HTMLElement>(
            FOCUSABLE_ELEMENTS_SELECTOR,
          ),
        ).filter((element) => {
          const style =
            window.getComputedStyle(
              element,
            );

          return (
            !element.hasAttribute(
              "disabled",
            ) &&
            element.getAttribute(
              "aria-hidden",
            ) !== "true" &&
            style.display !== "none" &&
            style.visibility !== "hidden"
          );
        });


      if (
        focusableElements.length === 0
      ) {
        event.preventDefault();

        closeButtonRef.current?.focus();

        return;
      }


      const firstElement =
        focusableElements[0];

      const lastElement =
        focusableElements[
          focusableElements.length - 1
        ];

      const activeElement =
        document.activeElement;


      /* ------------------------------------------------------
         SHIFT + TAB
         Dernier → Premier
         ------------------------------------------------------ */

      if (
        event.shiftKey &&
        activeElement === firstElement
      ) {
        event.preventDefault();

        lastElement.focus();

        return;
      }


      /* ------------------------------------------------------
         TAB
         Dernier → Premier
         ------------------------------------------------------ */

      if (
        !event.shiftKey &&
        activeElement === lastElement
      ) {
        event.preventDefault();

        firstElement.focus();
      }
    };


    window.addEventListener(
      "keydown",
      handleKeyDown,
    );


    /* --------------------------------------------------------
       CLEANUP
       -------------------------------------------------------- */

    return () => {
      window.cancelAnimationFrame(
        focusFrame,
      );

      document.body.classList.remove(
        "ce-no-scroll",
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    closeAndRestoreFocus,
  ]);


  /* ==========================================================
     NAVIGATION FROM DRAWER
     ----------------------------------------------------------
     Lorsqu'un lien est sélectionné dans le menu mobile :

     - le Drawer se ferme ;
     - on ne force pas le focus vers le hamburger ;
     - la nouvelle page peut naturellement recevoir le focus.

     Le changement de route est également sécurisé par le
     GestionnaireShell.
     ========================================================== */

  const handleNavigation =
    useCallback(() => {
      onClose();
    }, [
      onClose,
    ]);


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <>
      {/* ======================================================
          OVERLAY
          ====================================================== */}

      <button
        type="button"
        className={[
          "gestionnaire-mobile-overlay",

          open
            ? "gestionnaire-mobile-overlay--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={
          gestionnaireShellConfig
            .mobileMenu
            .closeLabel
        }
        aria-hidden={
          !open
        }
        tabIndex={
          open
            ? 0
            : -1
        }
        onClick={
          closeAndRestoreFocus
        }
      />


      {/* ======================================================
          MOBILE DRAWER
          ====================================================== */}

      <aside
        ref={
          drawerRef
        }
        id="gestionnaire-mobile-drawer"
        className={[
          "gestionnaire-mobile-drawer",

          open
            ? "gestionnaire-mobile-drawer--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal={
          open
            ? "true"
            : undefined
        }
        aria-label={
          gestionnaireShellConfig
            .mobileMenu
            .drawerLabel
        }
        aria-hidden={
          !open
        }
        inert={
          !open
        }
      >
        {/* ====================================================
            CLOSE BUTTON
            ==================================================== */}

        <button
          ref={
            closeButtonRef
          }
          type="button"
          className="gestionnaire-mobile-drawer__close"
          aria-label={
            gestionnaireShellConfig
              .mobileMenu
              .closeLabel
          }
          title={
            gestionnaireShellConfig
              .mobileMenu
              .closeLabel
          }
          onClick={
            closeAndRestoreFocus
          }
        >
          <X
            size={26}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>


        {/* ====================================================
            SHARED SIDEBAR CONTENT

            Même contenu que la Sidebar desktop.
            ==================================================== */}

        <GestionnaireSidebarContent
          profile={
            profile
          }
          onNavigate={
            handleNavigation
          }
          onLogout={
            onLogout
          }
        />
      </aside>
    </>
  );
}