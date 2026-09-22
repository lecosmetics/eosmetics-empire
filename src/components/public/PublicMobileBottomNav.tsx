"use client";

import Link from "next/link";

import {
  Circle,
  Grid3X3,
  Home,
  Package,
  ShoppingCart,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import {
  generalAppRoutes,
} from "@/config/routes";

import {
  usePublicPanierTotalQuantity,
} from "@/components/public/panier/PublicPanierProvider";

import {
  hasVisiblePublicNavigationBadge,
  type PublicMobileBottomNavigationItem,
  type PublicNavigationData,
  type PublicNavigationIconId,
  type PublicNavigationMatchMode,
} from "@/lib/public/navigation/public-navigation-types";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — NAVIGATION MOBILE BASSE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/PublicMobileBottomNav.tsx
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - afficher exactement les 5 navigations principales sur mobile ;
 * - rester fixe en bas de l'écran via public-shell.module.css ;
 * - détecter automatiquement l'onglet actif ;
 * - conserver Produits actif dans les parcours catalogue ;
 * - afficher le vrai compteur réactif du Panier ;
 * - afficher les vrais badges Commandes lorsqu'ils existent ;
 * - conserver l'ordre officiel de configuration ;
 * - rester accessible au clavier et aux lecteurs d'écran ;
 * - ne jamais lire Prisma directement ;
 * - ne jamais lire localStorage directement ;
 * - ne jamais inventer de compteur ;
 * - ne jamais gérer le prix ou le stock ;
 * - ne jamais gérer la création d'une commande.
 *
 * ============================================================================
 *
 * NAVIGATION MOBILE VALIDÉE :
 *
 * 1. Accueil
 * 2. Produits
 * 3. Panier
 * 4. Commandes
 * 5. Compte
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Aucun sixième élément n'est ajouté.
 *
 * Les catégories restent dans le contexte Produits.
 *
 * ============================================================================
 *
 * BADGE PANIER :
 *
 * PublicPanierProvider
 *
 *        ↓
 *
 * usePublicPanierTotalQuantity()
 *
 *        ↓
 *
 * PublicMobileBottomNav
 *
 *        ↓
 *
 * icône Panier + badge
 *
 * ============================================================================
 */


/* ==========================================================================
   1. PROPS
   ========================================================================== */

export interface PublicMobileBottomNavProps {
  readonly navigation:
    PublicNavigationData;
}


/* ==========================================================================
   2. ICON RESOLVER
   ========================================================================== */

function getBottomNavigationIcon(
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

    default:
      return Circle;
  }
}


/* ==========================================================================
   3. NORMALISATION DU CHEMIN
   ========================================================================== */

/**
 * Évite que :
 *
 * /produits
 *
 * et :
 *
 * /produits/
 *
 * soient considérés comme différents.
 *
 * Les query strings et fragments ne participent pas non plus à la
 * détermination de l'onglet actif.
 */
function normalizePublicPath(
  value:
    string |
    null |
    undefined,
): string {
  const pathname =
    value
      ?.split("?")[0]
      ?.split("#")[0]
      ?.trim() ||
    "/";


  if (
    pathname ===
    "/"
  ) {
    return "/";
  }


  const withoutTrailingSlash =
    pathname.replace(
      /\/+$/,
      "",
    );


  return (
    withoutTrailingSlash ||
    "/"
  );
}


/* ==========================================================================
   4. MATCH GÉNÉRIQUE
   ========================================================================== */

function isPublicNavigationPathActive({
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
    normalizePublicPath(
      pathname,
    );


  const targetPath =
    normalizePublicPath(
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


  /**
   * Une route racine en mode PREFIX ne doit jamais rendre tous les chemins
   * actifs.
   */
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
   5. CONTEXTE PRODUITS
   ========================================================================== */

/**
 * L'onglet "Produits" reste actif dans toutes les zones publiques
 * appartenant réellement à la découverte du catalogue :
 *
 * - /produits ;
 * - /categories ;
 * - /categories/[slug] ;
 * - /nouveautes ;
 * - /promotions ;
 * - /recherche ;
 * - /p/[qrToken].
 *
 * ============================================================================
 *
 * /p/[qrToken] utilise la vraie racine déjà déclarée dans :
 *
 * src/config/routes.ts
 *
 * Aucun "/p" n'est dupliqué manuellement ici.
 *
 * ============================================================================
 */
function isPublicProductsContext(
  pathname:
    string,
): boolean {
  const currentPath =
    normalizePublicPath(
      pathname,
    );


  const productContexts =
    [
      PUBLIC_NAVIGATION_ROUTES
        .PRODUCTS,

      PUBLIC_NAVIGATION_ROUTES
        .CATEGORIES,

      PUBLIC_NAVIGATION_ROUTES
        .NEW_PRODUCTS,

      PUBLIC_NAVIGATION_ROUTES
        .PROMOTIONS,

      PUBLIC_NAVIGATION_ROUTES
        .SEARCH,

      generalAppRoutes
        .publicProductQrRoot,
    ] as const;


  return productContexts.some(
    (
      route,
    ) => {
      const normalizedRoute =
        normalizePublicPath(
          route,
        );


      return (
        currentPath ===
          normalizedRoute ||
        currentPath.startsWith(
          `${normalizedRoute}/`,
        )
      );
    },
  );
}


/* ==========================================================================
   6. ÉTAT ACTIF
   ========================================================================== */

function isBottomNavigationItemActive({
  item,
  pathname,
}: {
  item:
    PublicMobileBottomNavigationItem;

  pathname:
    string;
}): boolean {
  /**
   * L'onglet Produits couvre l'ensemble du parcours catalogue.
   */
  if (
    item.id ===
    "products"
  ) {
    return isPublicProductsContext(
      pathname,
    );
  }


  return isPublicNavigationPathActive({
    pathname,

    href:
      item.href,

    matchMode:
      item.matchMode,
  });
}


/* ==========================================================================
   7. NORMALISATION BADGE
   ========================================================================== */

/**
 * Un badge doit être :
 *
 * - numérique ;
 * - fini ;
 * - entier ;
 * - strictement supérieur à zéro.
 *
 * Une valeur invalide n'est pas affichée.
 */
function normalizeBottomNavigationBadge(
  value:
    number |
    null |
    undefined,
): number |
  null {
  if (
    typeof value !==
      "number" ||
    !Number.isFinite(
      value,
    )
  ) {
    return null;
  }


  const normalized =
    Math.trunc(
      value,
    );


  if (
    normalized <=
    0
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   8. BADGE RESOLVER
   ========================================================================== */

/**
 * PANIER :
 *
 * La quantité provient désormais du vrai PublicPanierProvider.
 *
 * Elle n'est donc plus lue depuis navigation.badges.cart.
 *
 * ============================================================================
 *
 * COMMANDES :
 *
 * La valeur continue de provenir de navigation.badges.orders lorsqu'une
 * vraie source métier y est branchée.
 *
 * ============================================================================
 */
function getBottomNavigationBadge(
  item:
    PublicMobileBottomNavigationItem,

  navigation:
    PublicNavigationData,

  panierTotalQuantity:
    number,
): number |
  null {
  if (
    !item.supportsBadge
  ) {
    return null;
  }


  switch (
    item.id
  ) {
    case "cart":
      return normalizeBottomNavigationBadge(
        panierTotalQuantity,
      );

    case "orders":
      return normalizeBottomNavigationBadge(
        navigation
          .badges
          .orders,
      );

    default:
      return null;
  }
}


/* ==========================================================================
   9. ACCESSIBILITÉ
   ========================================================================== */

function getBottomNavigationAccessibleLabel({
  item,
  badge,
}: {
  item:
    PublicMobileBottomNavigationItem;

  badge:
    number |
    null;
}): string {
  if (
    !hasVisiblePublicNavigationBadge(
      badge,
    )
  ) {
    return item.label;
  }


  switch (
    item.id
  ) {
    case "cart":
      return `${item.label}, ${badge} article${
        badge >
        1
          ? "s"
          : ""
      } dans le panier`;

    case "orders":
      return `${item.label}, ${badge} commande${
        badge >
        1
          ? "s"
          : ""
      }`;

    default:
      return item.label;
  }
}


/* ==========================================================================
   10. BADGE VISUEL
   ========================================================================== */

interface PublicMobileBottomNavBadgeProps {
  readonly value:
    number |
    null;
}


function PublicMobileBottomNavBadge({
  value,
}: PublicMobileBottomNavBadgeProps) {
  if (
    !hasVisiblePublicNavigationBadge(
      value,
    )
  ) {
    return null;
  }


  return (
    <span
      className={
        styles.publicMobileBottomNavBadge
      }
      aria-hidden="true"
    >
      {
        value >
        99
          ? "99+"
          : value
      }
    </span>
  );
}


/* ==========================================================================
   11. COMPOSANT
   ========================================================================== */

export default function PublicMobileBottomNav({
  navigation,
}: PublicMobileBottomNavProps) {
  /* =========================================================================
     PATHNAME
     ========================================================================= */

  const pathname =
    usePathname();


  /* =========================================================================
     VRAIE QUANTITÉ PANIER
     =========================================================================
     
     Même source que :
     
     - PublicAddToPanierButton ;
     - PublicPanierPage ;
     - PublicDesktopHeader ;
     - PublicMobileHeader.
     
     Un ajout, retrait ou changement de quantité actualise donc le badge
     automatiquement sans rechargement complet.
     ========================================================================= */

  const panierTotalQuantity =
    usePublicPanierTotalQuantity();


  /* =========================================================================
     ITEMS
     =========================================================================
     
     filter() crée déjà une nouvelle collection.
     
     sort() peut donc être utilisé sans modifier navigation.
     ========================================================================= */

  const items =
    navigation
      .mobileBottomNavigation
      .filter(
        (
          item,
        ) =>
          item.enabled,
      )
      .sort(
        (
          first,
          second,
        ) =>
          first.order -
          second.order,
      );


  if (
    items.length ===
    0
  ) {
    return null;
  }


  return (
    <nav
      className={
        styles.publicMobileBottomNav
      }
      aria-label="Navigation principale mobile"
      data-public-mobile-bottom-navigation="true"
      data-panier-total-quantity={
        panierTotalQuantity
      }
    >
      {/* ====================================================================
          INNER
          ==================================================================== */}

      <div
        className={
          styles.publicMobileBottomNavInner
        }
      >
        {items.map(
          (
            item,
          ) => {
            const Icon =
              getBottomNavigationIcon(
                item.icon,
              );


            const isActive =
              isBottomNavigationItemActive({
                item,
                pathname,
              });


            const badge =
              getBottomNavigationBadge(
                item,
                navigation,
                panierTotalQuantity,
              );


            const accessibleLabel =
              getBottomNavigationAccessibleLabel({
                item,
                badge,
              });


            return (
              <Link
                key={
                  item.id
                }
                href={
                  item.href
                }
                aria-label={
                  accessibleLabel
                }
                aria-current={
                  isActive
                    ? "page"
                    : undefined
                }
                className={
                  [
                    styles
                      .publicMobileBottomNavItem,

                    isActive
                      ? styles
                          .publicMobileBottomNavItemActive
                      : "",
                  ]
                    .filter(
                      Boolean,
                    )
                    .join(
                      " ",
                    )
                }
                data-public-mobile-bottom-nav-item={
                  item.id
                }
                data-public-mobile-bottom-nav-badge={
                  badge ??
                  0
                }
              >
                {/* ==========================================================
                    ICON AREA
                    ========================================================== */}

                <span
                  className={
                    styles.publicMobileBottomNavIconArea
                  }
                  aria-hidden="true"
                >
                  <span
                    className={
                      [
                        styles
                          .publicMobileBottomNavIconShell,

                        isActive
                          ? styles
                              .publicMobileBottomNavIconShellActive
                          : "",
                      ]
                        .filter(
                          Boolean,
                        )
                        .join(
                          " ",
                        )
                    }
                  >
                    <Icon
                      size={
                        22
                      }
                      strokeWidth={
                        isActive
                          ? 2.15
                          : 1.8
                      }
                      className={
                        styles.publicMobileBottomNavIcon
                      }
                    />


                    {/* ======================================================
                        BADGE
                        ======================================================
                        
                        PANIER :
                        
                        vraie quantité du PublicPanierProvider.
                        
                        COMMANDES :
                        
                        vraie valeur de navigation.badges.orders lorsqu'elle
                        existe.
                        
                        ====================================================== */}

                    <PublicMobileBottomNavBadge
                      value={
                        badge
                      }
                    />
                  </span>
                </span>


                {/* ==========================================================
                    LABEL
                    ========================================================== */}

                <span
                  className={
                    styles.publicMobileBottomNavLabel
                  }
                >
                  {
                    item.label
                  }
                </span>


                {/* ==========================================================
                    ACTIVE INDICATOR
                    ========================================================== */}

                <span
                  className={
                    styles.publicMobileBottomNavActiveIndicator
                  }
                  aria-hidden="true"
                />
              </Link>
            );
          },
        )}
      </div>
    </nav>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * NAVIGATION MOBILE :
 *
 * EXACTEMENT :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * PANIER :
 *
 * PublicPanierProvider
 *
 *        ↓
 *
 * usePublicPanierTotalQuantity()
 *
 *        ↓
 *
 * 3e bouton :
 *
 * Panier
 *
 *        ↓
 *
 * badge numérique
 *
 * ============================================================================
 *
 * EXEMPLE :
 *
 * Produit A × 4
 *
 * → badge Panier :
 *
 * 4
 *
 * ============================================================================
 *
 * Produit A × 2
 *
 * +
 *
 * Produit B × 3
 *
 * → badge Panier :
 *
 * 5
 *
 * ============================================================================
 *
 * AFFICHAGE MAXIMUM :
 *
 * 99+
 *
 * La vraie quantité du Provider n'est pas modifiée.
 *
 * ============================================================================
 *
 * CONTEXTE PRODUITS :
 *
 * /produits
 * /categories
 * /categories/[slug]
 * /nouveautes
 * /promotions
 * /recherche
 * /p/[qrToken]
 *
 * gardent :
 *
 * Produits
 *
 * comme onglet actif.
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - sixième bouton ;
 * - second système Panier ;
 * - accès Prisma ;
 * - accès PostgreSQL ;
 * - accès direct localStorage ;
 * - faux compteur ;
 * - prix dans la navigation ;
 * - stock dans la navigation.
 *
 * ============================================================================
 */