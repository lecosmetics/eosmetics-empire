"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Archive,
  BarChart3,
  BookOpen,
  Box,
  ChevronDown,
  LayoutGrid,
  Plus,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  useId,
  useState,
} from "react";

import {
  gestionnairePrimaryNavigation,
  gestionnaireSecondaryNavigation,
  gestionnaireShellConfig,
  type GestionnaireNavIcon,
  type GestionnaireNavigationItem,
} from "@/config/gestionnaire-navigation";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE NAVIGATION
   ============================================================ */

type GestionnaireNavigationProps =
  Readonly<{
    onNavigate?: () => void;
  }>;


type ProductsMenuState =
  Readonly<{
    pathname: string;
    open: boolean;
  }>;


/* ============================================================
   ICONS
   ============================================================ */

const NAVIGATION_ICONS: Record<
  GestionnaireNavIcon,
  LucideIcon
> = {
  dashboard: LayoutGrid,
  products: ShoppingBag,
  "add-product": Plus,
  "my-products": Box,
  catalog: BookOpen,
  stock: Archive,
  orders: ShoppingCart,
  clients: Users,
  deliveries: Truck,
  statistics: BarChart3,
  promotions: Tag,
  profile: UserRound,
  settings: Settings,
};


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


function isExactPath(
  pathname: string,
  href: string,
): boolean {
  return (
    normalizePathname(pathname) ===
    normalizePathname(href)
  );
}


function isPathWithin(
  pathname: string,
  href: string,
): boolean {
  const currentPath =
    normalizePathname(pathname);

  const targetPath =
    normalizePathname(href);

  if (targetPath === "/") {
    return currentPath === "/";
  }

  return (
    currentPath === targetPath ||
    currentPath.startsWith(
      `${targetPath}/`,
    )
  );
}


/* ============================================================
   DISABLED
   ============================================================ */

function isNavigationItemDisabled(
  item: GestionnaireNavigationItem,
): boolean {
  return item.disabled === true;
}


/* ============================================================
   ACTIVE CHILD
   ============================================================ */

function getActiveChild(
  pathname: string,
  children:
    | readonly GestionnaireNavigationItem[]
    | undefined,
): GestionnaireNavigationItem | null {
  if (!children?.length) {
    return null;
  }

  const matchingChildren =
    children
      .filter((child) =>
        isPathWithin(
          pathname,
          child.href,
        ),
      )
      .sort(
        (firstChild, secondChild) =>
          normalizePathname(
            secondChild.href,
          ).length -
          normalizePathname(
            firstChild.href,
          ).length,
      );

  return matchingChildren[0] ?? null;
}


/* ============================================================
   ICON
   ============================================================ */

function NavigationIcon({
  icon,
}: Readonly<{
  icon: GestionnaireNavIcon;
}>) {
  const Icon =
    NAVIGATION_ICONS[icon];

  return (
    <Icon
      className="gestionnaire-app-nav__icon"
      size={21}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}


/* ============================================================
   STANDARD ITEM
   ============================================================ */

function StandardNavigationItem({
  item,
  pathname,
  onNavigate,
}: Readonly<{
  item: GestionnaireNavigationItem;
  pathname: string;
  onNavigate?: () => void;
}>) {
  const active =
    isPathWithin(
      pathname,
      item.href,
    );

  const exact =
    isExactPath(
      pathname,
      item.href,
    );

  const disabled =
    isNavigationItemDisabled(
      item,
    );

  return (
    <li className="gestionnaire-app-nav__item">
      <Link
        href={item.href}
        className={[
          "gestionnaire-app-nav__link",

          active
            ? "gestionnaire-app-nav__link--active"
            : "",

          disabled
            ? "gestionnaire-app-nav__link--disabled"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-current={
          exact
            ? "page"
            : undefined
        }
        aria-disabled={
          disabled
            ? true
            : undefined
        }
        tabIndex={
          disabled
            ? -1
            : undefined
        }
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }

          onNavigate?.();
        }}
      >
        <NavigationIcon
          icon={item.icon}
        />

        <span className="gestionnaire-app-nav__label">
          {item.label}
        </span>
      </Link>
    </li>
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireNavigation({
  onNavigate,
}: GestionnaireNavigationProps) {
  const pathname =
    usePathname() || "/";


  /* ----------------------------------------------------------
     UNIQUE SUBMENU ID
     ---------------------------------------------------------- */

  const reactId =
    useId();

  const safeInstanceId =
    reactId.replace(
      /[^a-zA-Z0-9_-]/g,
      "",
    );

  const productsSubmenuId =
    `gestionnaire-products-submenu-${safeInstanceId}`;


  /* ----------------------------------------------------------
     PRODUCTS CONFIG
     ---------------------------------------------------------- */

  const productItem =
    gestionnairePrimaryNavigation.find(
      (item) =>
        item.id === "products",
    ) ?? null;


  /* ----------------------------------------------------------
     ACTIVE PRODUCT CHILD
     ---------------------------------------------------------- */

  const activeProductChild =
    getActiveChild(
      pathname,
      productItem?.children,
    );


  /* ----------------------------------------------------------
     PRODUCTS ACTIVE
     ---------------------------------------------------------- */

  const productsAreActive =
    Boolean(
      activeProductChild,
    ) ||
    Boolean(
      productItem &&
        isPathWithin(
          pathname,
          productItem.href,
        ),
    );


  /* ----------------------------------------------------------
     MANUAL MENU STATE

     IMPORTANT :

     Pas de useEffect.

     Si la route change, un ancien choix manuel appartenant à
     l'ancienne route est automatiquement ignoré.

     La nouvelle route décide donc naturellement si Produits
     doit être ouvert.
     ---------------------------------------------------------- */

  const [
    productsMenuState,
    setProductsMenuState,
  ] = useState<
    ProductsMenuState | null
  >(null);


  const isProductsOpen =
    productsMenuState?.pathname ===
    pathname
      ? productsMenuState.open
      : productsAreActive;


  const toggleProductsMenu =
    () => {
      setProductsMenuState({
        pathname,

        open:
          !isProductsOpen,
      });
    };


  return (
    <div className="gestionnaire-app-nav">
      {/* ======================================================
          PRIMARY NAVIGATION
          ====================================================== */}

      <nav
        aria-label={
          gestionnaireShellConfig
            .navigationLabels
            .main
        }
      >
        <ul className="gestionnaire-app-nav__list">
          {gestionnairePrimaryNavigation.map(
            (rawItem) => {
              const item:
                GestionnaireNavigationItem =
                  rawItem;


              /* ==============================================
                 STANDARD ITEMS
                 ============================================== */

              if (
                item.id !==
                "products"
              ) {
                return (
                  <StandardNavigationItem
                    key={item.id}
                    item={item}
                    pathname={pathname}
                    onNavigate={
                      onNavigate
                    }
                  />
                );
              }


              /* ==============================================
                 PRODUCTS
                 ============================================== */

              const parentActive =
                productsAreActive;

              const parentDisabled =
                isNavigationItemDisabled(
                  item,
                );


              return (
                <li
                  key={item.id}
                  className={[
                    "gestionnaire-app-nav__item",
                    "gestionnaire-app-nav__group",

                    parentActive
                      ? "gestionnaire-app-nav__group--active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* ==========================================
                      TRIGGER
                      ========================================== */}

                  <button
                    type="button"
                    className={[
                      "gestionnaire-app-nav__link",
                      "gestionnaire-app-nav__group-trigger",

                      parentActive
                        ? "gestionnaire-app-nav__link--active"
                        : "",

                      parentDisabled
                        ? "gestionnaire-app-nav__link--disabled"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-expanded={
                      parentDisabled
                        ? false
                        : isProductsOpen
                    }
                    aria-controls={
                      productsSubmenuId
                    }
                    aria-disabled={
                      parentDisabled
                        ? true
                        : undefined
                    }
                    disabled={
                      parentDisabled
                    }
                    onClick={
                      parentDisabled
                        ? undefined
                        : toggleProductsMenu
                    }
                  >
                    <NavigationIcon
                      icon={item.icon}
                    />

                    <span className="gestionnaire-app-nav__label">
                      {item.label}
                    </span>

                    <ChevronDown
                      className={[
                        "gestionnaire-app-nav__chevron",

                        isProductsOpen &&
                        !parentDisabled
                          ? "gestionnaire-app-nav__chevron--open"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </button>


                  {/* ==========================================
                      SUBMENU
                      ========================================== */}

                  <div
                    id={
                      productsSubmenuId
                    }
                    className={[
                      "gestionnaire-app-nav__submenu",

                      isProductsOpen &&
                      !parentDisabled
                        ? "gestionnaire-app-nav__submenu--open"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-hidden={
                      !isProductsOpen ||
                      parentDisabled
                    }
                  >
                    <ul className="gestionnaire-app-nav__submenu-list">
                      {item.children?.map(
                        (rawChild) => {
                          const child:
                            GestionnaireNavigationItem =
                              rawChild;

                          const active =
                            activeProductChild
                              ?.id ===
                            child.id;

                          const exact =
                            isExactPath(
                              pathname,
                              child.href,
                            );

                          const disabled =
                            isNavigationItemDisabled(
                              child,
                            );

                          return (
                            <li
                              key={
                                child.id
                              }
                              className="gestionnaire-app-nav__submenu-item"
                            >
                              <Link
                                href={
                                  child.href
                                }
                                className={[
                                  "gestionnaire-app-nav__submenu-link",

                                  active
                                    ? "gestionnaire-app-nav__submenu-link--active"
                                    : "",

                                  disabled
                                    ? "gestionnaire-app-nav__link--disabled"
                                    : "",
                                ]
                                  .filter(
                                    Boolean,
                                  )
                                  .join(
                                    " ",
                                  )}
                                aria-current={
                                  exact
                                    ? "page"
                                    : undefined
                                }
                                aria-disabled={
                                  disabled
                                    ? true
                                    : undefined
                                }
                                tabIndex={
                                  disabled
                                    ? -1
                                    : undefined
                                }
                                onClick={(
                                  event,
                                ) => {
                                  if (
                                    disabled
                                  ) {
                                    event.preventDefault();
                                    return;
                                  }

                                  onNavigate?.();
                                }}
                              >
                                <span
                                  className="gestionnaire-app-nav__submenu-dot"
                                  aria-hidden="true"
                                />

                                <NavigationIcon
                                  icon={
                                    child.icon
                                  }
                                />

                                <span className="gestionnaire-app-nav__submenu-label">
                                  {
                                    child.label
                                  }
                                </span>
                              </Link>
                            </li>
                          );
                        },
                      )}
                    </ul>
                  </div>
                </li>
              );
            },
          )}
        </ul>
      </nav>


      {/* ======================================================
          SEPARATOR
          ====================================================== */}

      <div
        className="gestionnaire-app-nav__separator"
        aria-hidden="true"
      />


      {/* ======================================================
          SECONDARY NAVIGATION
          ====================================================== */}

      <nav
        aria-label={
          gestionnaireShellConfig
            .navigationLabels
            .secondary
        }
      >
        <ul className="gestionnaire-app-nav__list gestionnaire-app-nav__list--secondary">
          {gestionnaireSecondaryNavigation.map(
            (rawItem) => {
              const item:
                GestionnaireNavigationItem =
                  rawItem;

              return (
                <StandardNavigationItem
                  key={item.id}
                  item={item}
                  pathname={pathname}
                  onNavigate={
                    onNavigate
                  }
                />
              );
            },
          )}
        </ul>
      </nav>
    </div>
  );
}