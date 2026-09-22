"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  gestionnaireConfig,
} from "@/config/gestionnaire";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE HEADER
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/GestionnaireHeader.tsx

   RESPONSABILITÉS :

   - afficher le logo officiel ;
   - afficher la navigation principale ;
   - détecter automatiquement la route active ;
   - afficher la langue actuelle ;
   - afficher le CTA boutique ;
   - gérer la navigation mobile ;
   - bloquer le scroll lorsque le menu mobile est ouvert ;
   - fermer le menu après navigation ;
   - fermer le menu avec Escape ;
   - fermer le menu lors du retour vers le desktop ;
   - restaurer le focus après fermeture ;
   - rester accessible clavier / tactile.

   IMPORTANT :

   Ce composant correspond au header de l'univers public
   Gestionnaire, notamment la page :

   /gestionnaire

   Il est différent du header du back-office privé :

   GestionnaireAppHeader.tsx

   DESIGN :

   Les règles visuelles restent centralisées dans :

   - src/app/globals.css
   - src/app/gestionnaire/gestionnaire.css
   ============================================================ */


/* ============================================================
   CONSTANTS
   ============================================================ */

const DESKTOP_MEDIA_QUERY =
  "(min-width: 1101px)";


/* ============================================================
   TYPES
   ============================================================ */

type IconProps =
  Readonly<{
    className?: string;
  }>;


type MobileMenuState =
  Readonly<{
    pathname: string;
    open: boolean;
  }>;


/* ============================================================
   ICONS
   ============================================================ */

function MenuIcon({
  className,
}: IconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


function CloseIcon({
  className,
}: IconProps) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}


function GlobeIcon({
  className,
}: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M3.5 12H20.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 3C14.3 5.45 15.55 8.55 15.5 12C15.55 15.45 14.3 18.55 12 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 3C9.7 5.45 8.45 8.55 8.5 12C8.45 15.45 9.7 18.55 12 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function BagIcon({
  className,
}: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 8.5H19L18 20H6L5 8.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 9V7C9 5.34 10.34 4 12 4C13.66 4 15 5.34 15 7V9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}


function ChevronDownIcon({
  className,
}: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 9.5L12 14.5L17 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}


/* ============================================================
   PATH HELPERS
   ============================================================ */

function normalizePathname(
  pathname: string,
): string {
  if (
    !pathname ||
    pathname === "/"
  ) {
    return "/";
  }

  return pathname.replace(
    /\/+$/,
    "",
  );
}


function isNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  const currentPath =
    normalizePathname(
      pathname,
    );

  const targetPath =
    normalizePathname(
      href,
    );


  /*
   * La route "/" ne doit être active que sur
   * la véritable page d'accueil.
   */

  if (targetPath === "/") {
    return currentPath === "/";
  }


  /*
   * Les routes descendantes gardent leur parent actif.
   *
   * Exemple :
   *
   * /gestionnaire/produits
   * /gestionnaire/produits/123
   */

  return (
    currentPath === targetPath ||
    currentPath.startsWith(
      `${targetPath}/`,
    )
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireHeader() {
  /* ----------------------------------------------------------
     CURRENT ROUTE
     ---------------------------------------------------------- */

  const pathname =
    usePathname() || "/";


  /* ----------------------------------------------------------
     UNIQUE MOBILE MENU ID
     ---------------------------------------------------------- */

  const reactId =
    useId();

  const safeMobileMenuId =
    reactId.replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    );

  const mobileMenuId =
    `gestionnaire-public-mobile-menu-${safeMobileMenuId}`;


  /* ----------------------------------------------------------
     MENU BUTTON REF
     ---------------------------------------------------------- */

  const menuButtonRef =
    useRef<HTMLButtonElement>(
      null,
    );


  /* ----------------------------------------------------------
     MOBILE MENU STATE
     ----------------------------------------------------------
     L'état est associé à la route sur laquelle le menu a été
     ouvert.

     Ainsi, lorsqu'une navigation change pathname, l'ancien
     état ne correspond plus à la nouvelle route et le menu est
     automatiquement considéré comme fermé.

     Cela supprime le besoin de :

     useEffect(() => {
       setIsMobileMenuOpen(false);
     }, [pathname]);

     et évite l'erreur React 19 :
     react-hooks/set-state-in-effect.
     ---------------------------------------------------------- */

  const [
    mobileMenuState,
    setMobileMenuState,
  ] = useState<
    MobileMenuState | null
  >(null);


  const isMobileMenuOpen =
    mobileMenuState?.pathname ===
      pathname &&
    mobileMenuState.open;


  /* ----------------------------------------------------------
     CONFIG
     ---------------------------------------------------------- */

  const {
    brand,
    header,
    navigation,
  } = gestionnaireConfig;


  /* ==========================================================
     RESTORE MENU BUTTON FOCUS
     ========================================================== */

  const restoreMenuButtonFocus =
    useCallback(() => {
      window.requestAnimationFrame(
        () => {
          menuButtonRef.current?.focus();
        },
      );
    }, []);


  /* ==========================================================
     CLOSE MOBILE MENU
     ========================================================== */

  const closeMobileMenu =
    useCallback(
      (
        restoreFocus = false,
      ) => {
        setMobileMenuState({
          pathname,
          open: false,
        });

        if (restoreFocus) {
          restoreMenuButtonFocus();
        }
      },
      [
        pathname,
        restoreMenuButtonFocus,
      ],
    );


  /* ==========================================================
     TOGGLE MOBILE MENU
     ========================================================== */

  const toggleMobileMenu =
    useCallback(() => {
      setMobileMenuState(
        (currentState) => {
          const currentlyOpen =
            currentState?.pathname ===
              pathname &&
            currentState.open;

          return {
            pathname,
            open: !currentlyOpen,
          };
        },
      );
    }, [
      pathname,
    ]);


  /* ==========================================================
     BODY SCROLL LOCK + ESCAPE
     ----------------------------------------------------------
     Cet effet synchronise React avec le DOM / navigateur.

     Il ne déclenche pas directement de setState au montage.

     Le changement d'état ne se produit que dans le callback
     clavier externe lorsque Escape est réellement pressé.
     ========================================================== */

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.classList.remove(
        "ce-no-scroll",
      );

      return;
    }


    document.body.classList.add(
      "ce-no-scroll",
    );


    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key !==
        "Escape"
      ) {
        return;
      }

      event.preventDefault();

      closeMobileMenu(
        true,
      );
    };


    window.addEventListener(
      "keydown",
      handleKeyDown,
    );


    return () => {
      document.body.classList.remove(
        "ce-no-scroll",
      );

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isMobileMenuOpen,
    closeMobileMenu,
  ]);


  /* ==========================================================
     DESKTOP BREAKPOINT
     ----------------------------------------------------------
     Lors du passage mobile → desktop :

     - le menu est fermé ;
     - le scroll est restauré.

     IMPORTANT :

     Aucun setState n'est exécuté directement dans le corps de
     l'effet.

     setMobileMenuState est uniquement appelé par le callback
     de matchMedia, donc après un changement du système externe.
     ========================================================== */

  useEffect(() => {
    const desktopMediaQuery =
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

        setMobileMenuState(
          null,
        );

        document.body.classList.remove(
          "ce-no-scroll",
        );
      };


    desktopMediaQuery.addEventListener(
      "change",
      handleDesktopChange,
    );


    return () => {
      desktopMediaQuery.removeEventListener(
        "change",
        handleDesktopChange,
      );
    };
  }, []);


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <header className="gestionnaire-header">
      {/* ======================================================
          MAIN HEADER
          ====================================================== */}

      <div className="gestionnaire-header__container">
        {/* ====================================================
            LOGO
            ==================================================== */}

        <Link
          href={
            navigation[0]?.href ??
            "/"
          }
          className="gestionnaire-header__brand"
          aria-label={`${brand.name} — Accueil`}
          onClick={() => {
            closeMobileMenu();
          }}
        >
          <span className="gestionnaire-header__logo-wrapper">
            <Image
              src={brand.logo}
              alt={brand.logoAlt}
              width={300}
              height={200}
              loading="eager"
              quality={90}
              className="gestionnaire-header__logo"
            />
          </span>
        </Link>


        {/* ====================================================
            DESKTOP NAVIGATION
            ==================================================== */}

        <nav
          className="gestionnaire-header__desktop-nav"
          aria-label="Navigation principale"
        >
          <ul className="gestionnaire-header__desktop-list">
            {navigation.map(
              (item) => {
                const active =
                  isNavigationItemActive(
                    pathname,
                    item.href,
                  );

                return (
                  <li
                    key={item.id}
                    className="gestionnaire-header__desktop-item"
                  >
                    <Link
                      href={item.href}
                      className={[
                        "gestionnaire-header__nav-link",

                        active
                          ? "gestionnaire-header__nav-link--active"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-current={
                        active
                          ? "page"
                          : undefined
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              },
            )}
          </ul>
        </nav>


        {/* ====================================================
            DESKTOP ACTIONS
            ==================================================== */}

        <div className="gestionnaire-header__desktop-actions">
          {/* --------------------------------------------------
              LANGUAGE
              -------------------------------------------------- */}

          <div
            className="gestionnaire-header__language"
            aria-label={`Langue actuelle : ${header.language.label}`}
            title={
              header.language.label
            }
          >
            <GlobeIcon className="gestionnaire-header__language-icon" />

            <span className="gestionnaire-header__language-code">
              {
                header.language
                  .code
              }
            </span>

            <ChevronDownIcon className="gestionnaire-header__language-chevron" />
          </div>


          {/* --------------------------------------------------
              SHOP CTA
              -------------------------------------------------- */}

          <Link
            href={
              header.shopButton
                .href
            }
            className="ce-button ce-button-primary gestionnaire-header__shop-button"
          >
            <BagIcon className="gestionnaire-header__shop-icon" />

            <span>
              {
                header.shopButton
                  .label
              }
            </span>
          </Link>
        </div>


        {/* ====================================================
            MOBILE ACTIONS
            ==================================================== */}

        <div className="gestionnaire-header__mobile-actions">
          {/* --------------------------------------------------
              MOBILE LANGUAGE
              -------------------------------------------------- */}

          <div
            className="gestionnaire-header__mobile-language"
            aria-label={`Langue actuelle : ${header.language.label}`}
            title={
              header.language.label
            }
          >
            <span>
              {
                header.language
                  .code
              }
            </span>
          </div>


          {/* --------------------------------------------------
              MOBILE MENU BUTTON
              -------------------------------------------------- */}

          <button
            ref={menuButtonRef}
            type="button"
            className="gestionnaire-header__menu-button"
            aria-label={
              isMobileMenuOpen
                ? header.mobileMenu
                    .closeLabel
                : header.mobileMenu
                    .openLabel
            }
            aria-controls={
              mobileMenuId
            }
            aria-expanded={
              isMobileMenuOpen
            }
            onClick={
              toggleMobileMenu
            }
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="gestionnaire-header__menu-icon" />
            ) : (
              <MenuIcon className="gestionnaire-header__menu-icon" />
            )}
          </button>
        </div>
      </div>


      {/* ======================================================
          MOBILE BACKDROP
          ====================================================== */}

      <button
        type="button"
        className={[
          "gestionnaire-header__backdrop",

          isMobileMenuOpen
            ? "gestionnaire-header__backdrop--visible"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={
          header.mobileMenu
            .closeLabel
        }
        aria-hidden={
          !isMobileMenuOpen
        }
        tabIndex={
          isMobileMenuOpen
            ? 0
            : -1
        }
        onClick={() => {
          closeMobileMenu(
            true,
          );
        }}
      />


      {/* ======================================================
          MOBILE PANEL
          ====================================================== */}

      <div
        id={mobileMenuId}
        className={[
          "gestionnaire-header__mobile-panel",

          isMobileMenuOpen
            ? "gestionnaire-header__mobile-panel--open"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={
          !isMobileMenuOpen
        }
        inert={
          !isMobileMenuOpen
        }
      >
        <div className="gestionnaire-header__mobile-panel-inner">
          {/* ==================================================
              MOBILE NAVIGATION
              ================================================== */}

          <nav
            className="gestionnaire-header__mobile-nav"
            aria-label="Navigation mobile"
          >
            <ul className="gestionnaire-header__mobile-list">
              {navigation.map(
                (item) => {
                  const active =
                    isNavigationItemActive(
                      pathname,
                      item.href,
                    );

                  return (
                    <li
                      key={item.id}
                      className="gestionnaire-header__mobile-item"
                    >
                      <Link
                        href={
                          item.href
                        }
                        className={[
                          "gestionnaire-header__mobile-link",

                          active
                            ? "gestionnaire-header__mobile-link--active"
                            : "",
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            " ",
                          )}
                        aria-current={
                          active
                            ? "page"
                            : undefined
                        }
                        onClick={() => {
                          closeMobileMenu();
                        }}
                      >
                        <span>
                          {
                            item.label
                          }
                        </span>

                        {active ? (
                          <span
                            className="gestionnaire-header__mobile-active-indicator"
                            aria-hidden="true"
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </nav>


          {/* ==================================================
              MOBILE FOOTER
              ================================================== */}

          <div className="gestionnaire-header__mobile-footer">
            {/* ------------------------------------------------
                LANGUAGE
                ------------------------------------------------ */}

            <div className="gestionnaire-header__mobile-language-row">
              <GlobeIcon className="gestionnaire-header__language-icon" />

              <span>
                {
                  header.language
                    .label
                }
              </span>

              <span className="gestionnaire-header__mobile-language-code">
                {
                  header.language
                    .code
                }
              </span>
            </div>


            {/* ------------------------------------------------
                SHOP CTA
                ------------------------------------------------ */}

            <Link
              href={
                header.shopButton
                  .href
              }
              className="ce-button ce-button-primary ce-button-lg gestionnaire-header__mobile-shop-button"
              onClick={() => {
                closeMobileMenu();
              }}
            >
              <BagIcon className="gestionnaire-header__shop-icon" />

              <span>
                {
                  header.shopButton
                    .label
                }
              </span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}