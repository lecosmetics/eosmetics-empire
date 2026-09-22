"use client";

import Image from "next/image";
import Link from "next/link";

import {
  BadgePercent,
  ChevronRight,
  Circle,
  CircleHelp,
  ExternalLink,
  Grid3X3,
  Heart,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  ShoppingCart,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import {
  hasVisiblePublicNavigationBadge,
  type PublicMobileDrawerItem,
  type PublicNavigationData,
  type PublicNavigationIconId,
  type PublicNavigationMatchMode,
} from "@/lib/public/navigation/public-navigation-types";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — DRAWER MOBILE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/PublicMobileDrawer.tsx
 *
 *
 * RESPONSABILITÉS :
 *
 * - afficher le menu principal mobile ;
 * - afficher le logo officiel ;
 * - afficher les liens publics ;
 * - afficher les catégories réellement disponibles ;
 * - afficher les informations de contact officielles ;
 * - afficher les implantations officielles ;
 * - afficher les réseaux sociaux officiels ;
 * - indiquer proprement la route actuellement active ;
 * - fermer le menu après navigation ;
 * - fermer le menu avec Escape ;
 * - gérer la navigation clavier dans le drawer ;
 * - restaurer le focus à la fermeture ;
 * - ne jamais inventer une catégorie ;
 * - ne jamais inventer un compteur ;
 * - ne jamais lire Prisma directement ;
 * - ne jamais gérer une session cliente ici.
 *
 *
 * IMPORTANT :
 *
 * L'ouverture du drawer reste contrôlée par :
 *
 * PublicHeader.tsx
 *
 * via :
 *
 * isOpen
 * onClose
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const DRAWER_DIALOG_ID =
  "public-mobile-navigation-drawer";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface PublicMobileDrawerProps {
  readonly isOpen:
    boolean;

  readonly onClose:
    () => void;

  readonly navigation:
    PublicNavigationData;
}


/* ==========================================================================
   ICON RESOLVER
   ========================================================================== */

function getNavigationIcon(
  icon:
    PublicNavigationIconId,
): LucideIcon {
  switch (
    icon
  ) {
    case "home":
      return Home;

    case "grid":
      return Grid3X3;

    case "shopping-cart":
      return ShoppingCart;

    case "package":
      return Package;

    case "user":
      return UserRound;

    case "heart":
      return Heart;

    case "sparkles":
      return Sparkles;

    case "badge-percent":
      return BadgePercent;

    case "map-pin":
      return MapPin;

    case "phone":
      return Phone;

    case "message-circle":
      return MessageCircle;

    case "mail":
      return Mail;

    case "circle-help":
      return CircleHelp;

    default:
      return Circle;
  }
}


/* ==========================================================================
   PATH NORMALIZATION
   ========================================================================== */

function normalizePath(
  value:
    string | null | undefined,
): string {
  const rawValue =
    value
      ?.split("?")[0]
      ?.split("#")[0]
      ?.trim() ||
    "/";


  if (
    rawValue ===
    "/"
  ) {
    return "/";
  }


  return rawValue.replace(
    /\/+$/,
    "",
  );
}


/* ==========================================================================
   ACTIVE PATH
   ========================================================================== */

function isPublicPathActive({
  pathname,
  href,
  matchMode,
}: {
  pathname:
    string;

  href:
    string;

  matchMode:
    PublicNavigationMatchMode;
}): boolean {
  const currentPath =
    normalizePath(
      pathname,
    );


  const targetPath =
    normalizePath(
      href,
    );


  if (
    matchMode ===
    "EXACT"
  ) {
    return (
      currentPath ===
      targetPath
    );
  }


  if (
    targetPath ===
    "/"
  ) {
    return (
      currentPath ===
      "/"
    );
  }


  return (
    currentPath ===
      targetPath ||
    currentPath.startsWith(
      `${targetPath}/`,
    )
  );
}


/* ==========================================================================
   DRAWER BADGE
   ========================================================================== */

function getDrawerItemBadge(
  item:
    PublicMobileDrawerItem,
  navigation:
    PublicNavigationData,
): number | null {
  if (
    item.id ===
    "cart"
  ) {
    return navigation
      .badges
      .cart;
  }


  if (
    item.id ===
    "orders"
  ) {
    return navigation
      .badges
      .orders;
  }


  if (
    item.id ===
    "favorites"
  ) {
    return navigation
      .badges
      .favorites;
  }


  return null;
}


/* ==========================================================================
   SOCIAL LABEL
   ========================================================================== */

function getSocialAccessibleLabel(
  label:
    string,
  handle:
    string,
): string {
  return `${label} — ${handle}`;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function PublicMobileDrawer({
  isOpen,
  onClose,
  navigation,
}: PublicMobileDrawerProps) {
  const pathname =
    usePathname();


  const drawerRef =
    useRef<HTMLDivElement | null>(
      null,
    );


  const closeButtonRef =
    useRef<HTMLButtonElement | null>(
      null,
    );


  const previouslyFocusedElementRef =
    useRef<HTMLElement | null>(
      null,
    );


  /* ==========================================================================
     ACCESSIBILITY / FOCUS MANAGEMENT
     ========================================================================== */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      previouslyFocusedElementRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;


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


        previouslyFocusedElementRef
          .current
          ?.focus();
      };
    },
    [
      isOpen,
    ],
  );


  /* ==========================================================================
     ESCAPE + FOCUS TRAP
     ========================================================================== */

  useEffect(
    () => {
      if (
        !isOpen
      ) {
        return;
      }


      function handleKeyDown(
        event:
          KeyboardEvent,
      ) {
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


        const drawer =
          drawerRef.current;


        if (
          !drawer
        ) {
          return;
        }


        const focusableElements =
          Array.from(
            drawer.querySelectorAll<HTMLElement>(
              [
                "a[href]",
                "button:not([disabled])",
                "input:not([disabled])",
                "select:not([disabled])",
                "textarea:not([disabled])",
                '[tabindex]:not([tabindex="-1"])',
              ].join(
                ",",
              ),
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

          return;
        }


        const firstElement =
          focusableElements[0];


        const lastElement =
          focusableElements[
            focusableElements.length -
              1
          ];


        if (
          !firstElement ||
          !lastElement
        ) {
          return;
        }


        if (
          event.shiftKey &&
          document.activeElement ===
            firstElement
        ) {
          event.preventDefault();

          lastElement.focus();

          return;
        }


        if (
          !event.shiftKey &&
          document.activeElement ===
            lastElement
        ) {
          event.preventDefault();

          firstElement.focus();
        }
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
      isOpen,
      onClose,
    ],
  );


  /* ==========================================================================
     RENDER
     ========================================================================== */

  return (
    <div
      className={[
        styles.publicMobileDrawerRoot,
        isOpen
          ? styles.publicMobileDrawerRootOpen
          : "",
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      aria-hidden={
        !isOpen
      }
    >
      {/* ====================================================================
          OVERLAY
          ==================================================================== */}

      <button
        type="button"
        className={styles.publicMobileDrawerOverlay}
        onClick={onClose}
        aria-label="Fermer le menu"
        tabIndex={
          isOpen
            ? 0
            : -1
        }
      />


      {/* ====================================================================
          DRAWER
          ==================================================================== */}

      <div
        ref={drawerRef}
        id={DRAWER_DIALOG_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className={styles.publicMobileDrawer}
      >
        {/* ==================================================================
            DRAWER HEADER
            ================================================================== */}

        <div className={styles.publicMobileDrawerHeader}>
          <Link
            href={PUBLIC_NAVIGATION_ROUTES.HOME}
            onClick={onClose}
            className={styles.publicMobileDrawerBrand}
            aria-label="L&E Cosmetics Empire — Accueil"
            tabIndex={
              isOpen
                ? 0
                : -1
            }
          >
            <Image
              src={PUBLIC_SITE.brand.logo.src}
              alt={PUBLIC_SITE.brand.logo.alt}
              width={PUBLIC_SITE.brand.logo.width}
              height={PUBLIC_SITE.brand.logo.height}
              className={styles.publicMobileDrawerLogo}
            />
          </Link>


          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className={styles.publicMobileDrawerClose}
            aria-label="Fermer le menu"
            tabIndex={
              isOpen
                ? 0
                : -1
            }
          >
            <X
              size={23}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>
        </div>


        {/* ==================================================================
            SCROLLABLE CONTENT
            ================================================================== */}

        <div className={styles.publicMobileDrawerScroll}>
          {/* ================================================================
              BRAND INTRO
              ================================================================ */}

          <div className={styles.publicMobileDrawerIntro}>
            <span className={styles.publicMobileDrawerEyebrow}>
              {PUBLIC_SITE.brand.shortName}
            </span>

            <p className={styles.publicMobileDrawerSlogan}>
              {PUBLIC_SITE.brand.slogan}
            </p>
          </div>


          {/* ================================================================
              MAIN NAVIGATION
              ================================================================ */}

          <section
            className={styles.publicMobileDrawerSection}
            aria-labelledby="public-mobile-menu-navigation-title"
          >
            <h2
              id="public-mobile-menu-navigation-title"
              className={styles.publicMobileDrawerSectionTitle}
            >
              Navigation
            </h2>


            <nav
              className={styles.publicMobileDrawerNavigation}
              aria-label="Navigation mobile"
            >
              {navigation
                .mobileDrawer
                .map(
                  (
                    item,
                  ) => {
                    const Icon =
                      getNavigationIcon(
                        item.icon,
                      );


                    const isActive =
                      isPublicPathActive({
                        pathname,
                        href:
                          item.href,
                        matchMode:
                          item.matchMode,
                      });


                    const badge =
                      getDrawerItemBadge(
                        item,
                        navigation,
                      );


                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onClose}
                        tabIndex={
                          isOpen
                            ? 0
                            : -1
                        }
                        aria-current={
                          isActive
                            ? "page"
                            : undefined
                        }
                        className={[
                          styles.publicMobileDrawerNavigationLink,
                          isActive
                            ? styles.publicMobileDrawerNavigationLinkActive
                            : "",
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            " ",
                          )}
                      >
                        <span
                          className={
                            styles.publicMobileDrawerNavigationIcon
                          }
                        >
                          <Icon
                            size={20}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </span>


                        <span
                          className={
                            styles.publicMobileDrawerNavigationContent
                          }
                        >
                          <span
                            className={
                              styles.publicMobileDrawerNavigationLabel
                            }
                          >
                            {item.label}
                          </span>
                        </span>


                        <span
                          className={
                            styles.publicMobileDrawerNavigationTrailing
                          }
                        >
                          {hasVisiblePublicNavigationBadge(
                            badge,
                          ) ? (
                            <span
                              className={
                                styles.publicMobileDrawerBadge
                              }
                              aria-label={
                                `${badge} élément${badge > 1 ? "s" : ""}`
                              }
                            >
                              {badge >
                              99
                                ? "99+"
                                : badge}
                            </span>
                          ) : null}


                          <ChevronRight
                            size={17}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </span>
                      </Link>
                    );
                  },
                )}
            </nav>
          </section>


          {/* ================================================================
              CATEGORIES
              ================================================================ */}

          {navigation.categories.length >
          0 ? (
            <section
              className={styles.publicMobileDrawerSection}
              aria-labelledby="public-mobile-menu-categories-title"
            >
              <div
                className={styles.publicMobileDrawerSectionHeader}
              >
                <h2
                  id="public-mobile-menu-categories-title"
                  className={styles.publicMobileDrawerSectionTitle}
                >
                  Catégories
                </h2>


                <Link
                  href={PUBLIC_NAVIGATION_ROUTES.PRODUCTS}
                  onClick={onClose}
                  tabIndex={
                    isOpen
                      ? 0
                      : -1
                  }
                  className={styles.publicMobileDrawerSectionAction}
                >
                  Voir tout

                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                  />
                </Link>
              </div>


              <div className={styles.publicMobileDrawerCategories}>
                {navigation
                  .categories
                  .map(
                    (
                      category,
                    ) => {
                      const isActive =
                        normalizePath(
                          pathname,
                        ) ===
                        normalizePath(
                          category.href,
                        );


                      return (
                        <Link
                          key={category.id}
                          href={category.href}
                          onClick={onClose}
                          tabIndex={
                            isOpen
                              ? 0
                              : -1
                          }
                          aria-current={
                            isActive
                              ? "page"
                              : undefined
                          }
                          className={[
                            styles.publicMobileDrawerCategory,
                            isActive
                              ? styles.publicMobileDrawerCategoryActive
                              : "",
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " ",
                            )}
                        >
                          <span
                            className={styles.publicMobileDrawerCategoryDot}
                            aria-hidden="true"
                          />

                          <span>
                            {category.name}
                          </span>

                          <ChevronRight
                            size={15}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </Link>
                      );
                    },
                  )}
              </div>
            </section>
          ) : null}


          {/* ================================================================
              LOCATIONS
              ================================================================ */}

          {PUBLIC_SITE.locations.length >
          0 ? (
            <section
              className={styles.publicMobileDrawerSection}
              aria-labelledby="public-mobile-menu-locations-title"
            >
              <h2
                id="public-mobile-menu-locations-title"
                className={styles.publicMobileDrawerSectionTitle}
              >
                Nos implantations
              </h2>


              <div className={styles.publicMobileDrawerLocations}>
                {PUBLIC_SITE
                  .locations
                  .map(
                    (
                      location,
                    ) => (
                      <div
                        key={location.id}
                        className={styles.publicMobileDrawerLocation}
                      >
                        <span
                          className={styles.publicMobileDrawerLocationIcon}
                        >
                          <MapPin
                            size={16}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                        </span>


                        <div
                          className={styles.publicMobileDrawerLocationContent}
                        >
                          <strong>
                            {location.city}
                          </strong>

                          <span>
                            {location.country}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
              </div>
            </section>
          ) : null}


          {/* ================================================================
              CONTACT
              ================================================================ */}

          <section
            className={styles.publicMobileDrawerSection}
            aria-labelledby="public-mobile-menu-contact-title"
          >
            <h2
              id="public-mobile-menu-contact-title"
              className={styles.publicMobileDrawerSectionTitle}
            >
              Nous contacter
            </h2>


            <div className={styles.publicMobileDrawerContactList}>
              {/* ------------------------------------------------------------
                  PHONE
                  ------------------------------------------------------------ */}

              <a
                href={PUBLIC_SITE.contact.phone.href}
                tabIndex={
                  isOpen
                    ? 0
                    : -1
                }
                className={styles.publicMobileDrawerContact}
                aria-label={
                  `Téléphoner au ${PUBLIC_SITE.contact.phone.display}`
                }
              >
                <span
                  className={styles.publicMobileDrawerContactIcon}
                >
                  <Phone
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>


                <span
                  className={styles.publicMobileDrawerContactContent}
                >
                  <span>
                    Téléphone
                  </span>

                  <strong>
                    {PUBLIC_SITE.contact.phone.display}
                  </strong>
                </span>


                <ChevronRight
                  size={16}
                  aria-hidden="true"
                />
              </a>


              {/* ------------------------------------------------------------
                  WHATSAPP
                  ------------------------------------------------------------ */}

              <a
                href={PUBLIC_SITE.contact.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={
                  isOpen
                    ? 0
                    : -1
                }
                className={styles.publicMobileDrawerContact}
                aria-label={
                  `Contacter L&E Cosmetics Empire sur WhatsApp au ${PUBLIC_SITE.contact.whatsapp.display}`
                }
              >
                <span
                  className={styles.publicMobileDrawerContactIcon}
                >
                  <MessageCircle
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>


                <span
                  className={styles.publicMobileDrawerContactContent}
                >
                  <span>
                    WhatsApp
                  </span>

                  <strong>
                    {PUBLIC_SITE.contact.whatsapp.display}
                  </strong>
                </span>


                <ExternalLink
                  size={15}
                  aria-hidden="true"
                />
              </a>


              {/* ------------------------------------------------------------
                  EMAIL
                  ------------------------------------------------------------ */}

              <a
                href={PUBLIC_SITE.contact.email.href}
                tabIndex={
                  isOpen
                    ? 0
                    : -1
                }
                className={styles.publicMobileDrawerContact}
                aria-label={
                  `Envoyer un e-mail à ${PUBLIC_SITE.contact.email.address}`
                }
              >
                <span
                  className={styles.publicMobileDrawerContactIcon}
                >
                  <Mail
                    size={18}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </span>


                <span
                  className={styles.publicMobileDrawerContactContent}
                >
                  <span>
                    E-mail
                  </span>

                  <strong>
                    {PUBLIC_SITE.contact.email.address}
                  </strong>
                </span>


                <ChevronRight
                  size={16}
                  aria-hidden="true"
                />
              </a>
            </div>
          </section>


          {/* ================================================================
              SOCIALS
              ================================================================ */}

          {PUBLIC_SITE.socials.length >
          0 ? (
            <section
              className={styles.publicMobileDrawerSection}
              aria-labelledby="public-mobile-menu-social-title"
            >
              <h2
                id="public-mobile-menu-social-title"
                className={styles.publicMobileDrawerSectionTitle}
              >
                Suivez-nous
              </h2>


              <div className={styles.publicMobileDrawerSocials}>
                {PUBLIC_SITE
                  .socials
                  .map(
                    (
                      social,
                    ) => (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={
                          isOpen
                            ? 0
                            : -1
                        }
                        className={styles.publicMobileDrawerSocial}
                        aria-label={
                          getSocialAccessibleLabel(
                            social.label,
                            social.handle,
                          )
                        }
                      >
                        <div
                          className={styles.publicMobileDrawerSocialContent}
                        >
                          <strong>
                            {social.label}
                          </strong>

                          <span>
                            @{social.handle}
                          </span>
                        </div>


                        <ExternalLink
                          size={15}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </a>
                    ),
                  )}
              </div>
            </section>
          ) : null}
        </div>


        {/* ==================================================================
            DRAWER FOOTER
            ================================================================== */}

        <div className={styles.publicMobileDrawerFooter}>
          <Link
            href={PUBLIC_NAVIGATION_ROUTES.CONTACT}
            onClick={onClose}
            tabIndex={
              isOpen
                ? 0
                : -1
            }
            className={styles.publicMobileDrawerFooterButton}
          >
            <Mail
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              Contact
            </span>
          </Link>


          <Link
            href={PUBLIC_NAVIGATION_ROUTES.FAQ}
            onClick={onClose}
            tabIndex={
              isOpen
                ? 0
                : -1
            }
            className={styles.publicMobileDrawerFooterButtonSecondary}
          >
            <CircleHelp
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              Aide
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}