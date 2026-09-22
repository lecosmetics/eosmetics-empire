"use client";

import Image from "next/image";
import Link from "next/link";

import {
  MapPin,
  Menu,
  MessageCircle,
  Package,
  Phone,
  ShoppingCart,
} from "lucide-react";

import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import {
  usePublicPanierTotalQuantity,
} from "@/components/public/panier/PublicPanierProvider";

import {
  hasVisiblePublicNavigationBadge,
  type PublicNavigationData,
} from "@/lib/public/navigation/public-navigation-types";

import PublicSearchForm from "@/components/public/PublicSearchForm";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — HEADER MOBILE
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/PublicMobileHeader.tsx
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - afficher le Header public mobile ;
 * - afficher le vrai logo officiel ;
 * - ouvrir le drawer mobile ;
 * - afficher Commandes ;
 * - afficher Panier ;
 * - afficher le vrai compteur réactif du Panier ;
 * - afficher les vrais badges métier lorsqu'ils existent ;
 * - afficher la recherche mobile ;
 * - afficher les implantations officielles ;
 * - afficher les contacts officiels ;
 * - ne jamais inventer de compteur ;
 * - ne jamais inventer de localisation ;
 * - ne jamais interroger Prisma directement ;
 * - rester compatible avec le Header sticky global.
 *
 * ============================================================================
 *
 * STRUCTURE :
 *
 * 1. barre contact ;
 *
 * 2. ligne principale :
 *
 *    Menu | Logo | Commandes | Panier
 *
 * 3. recherche ;
 *
 * 4. bande implantations.
 *
 * ============================================================================
 *
 * PANIER :
 *
 * Le compteur Panier provient exclusivement de :
 *
 * PublicPanierProvider
 *
 * via :
 *
 * usePublicPanierTotalQuantity()
 *
 * ============================================================================
 *
 * Exemple :
 *
 * Produit A × 2
 * Produit B × 3
 *
 * badge Panier :
 *
 * 5
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le compteur Panier est uniquement un indicateur d'interface.
 *
 * Il n'est jamais utilisé comme autorité pour :
 *
 * - le prix ;
 * - le stock ;
 * - la disponibilité ;
 * - la devise ;
 * - la boutique ;
 * - la création d'une commande.
 *
 * Ces éléments restent vérifiés côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. PROPS
   ========================================================================== */

export interface PublicMobileHeaderProps {
  /**
   * Navigation assemblée côté serveur.
   */
  readonly navigation:
    PublicNavigationData;

  /**
   * Ouvre le drawer mobile.
   *
   * La gestion réelle du drawer appartient à :
   *
   * PublicHeader.tsx
   */
  readonly onOpenMenu:
    () => void;

  /**
   * Terme éventuellement conservé sur /recherche.
   */
  readonly defaultSearchQuery?:
    string | null;
}


/* ==========================================================================
   2. NORMALISATION BADGE
   ========================================================================== */

/**
 * Un badge doit être :
 *
 * - numérique ;
 * - fini ;
 * - entier ;
 * - strictement supérieur à zéro.
 *
 * Sinon aucun badge n'est affiché.
 */
function normalizeMobileBadgeValue(
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
   3. BADGE COMMANDES
   ========================================================================== */

/**
 * Les commandes restent actuellement alimentées par les données de navigation
 * assemblées côté serveur.
 *
 * Aucun nombre n'est fabriqué ici.
 */
function getOrdersBadge(
  navigation:
    PublicNavigationData,
): number |
  null {
  return normalizeMobileBadgeValue(
    navigation
      .badges
      .orders,
  );
}


/* ==========================================================================
   4. COMPOSANT BADGE
   ========================================================================== */

interface MobileActionBadgeProps {
  readonly value:
    number |
    null;
}


/**
 * Le libellé accessible complet est porté par le Link parent.
 *
 * Le badge visuel reste donc aria-hidden afin d'éviter une lecture
 * redondante par les technologies d'assistance.
 */
function MobileActionBadge({
  value,
}: MobileActionBadgeProps) {
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
        styles.publicMobileActionBadge
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
   5. LIBELLÉ ACCESSIBLE PANIER
   ========================================================================== */

function getPanierActionAriaLabel(
  panierTotalQuantity:
    number,
): string {
  if (
    panierTotalQuantity <=
    0
  ) {
    return "Panier";
  }


  return `Panier — ${panierTotalQuantity} article${
    panierTotalQuantity >
    1
      ? "s"
      : ""
  }`;
}


/* ==========================================================================
   6. LIBELLÉ ACCESSIBLE COMMANDES
   ========================================================================== */

function getOrdersActionAriaLabel(
  ordersBadge:
    number |
    null,
): string {
  if (
    !ordersBadge
  ) {
    return "Commandes";
  }


  return `Commandes — ${ordersBadge} commande${
    ordersBadge >
    1
      ? "s"
      : ""
  }`;
}


/* ==========================================================================
   7. COMPONENT
   ========================================================================== */

export default function PublicMobileHeader({
  navigation,
  onOpenMenu,
  defaultSearchQuery =
    null,
}: PublicMobileHeaderProps) {
  /* =========================================================================
     PANIER
     =========================================================================
     
     Même source de vérité navigateur que :
     
     - PublicAddToPanierButton ;
     - PublicPanierPage ;
     - PublicDesktopHeader ;
     - future navigation mobile basse.
     
     Un ajout / retrait / changement de quantité provoque immédiatement
     une mise à jour du badge.
     ========================================================================= */

  const panierTotalQuantity =
    usePublicPanierTotalQuantity();


  const panierBadge =
    normalizeMobileBadgeValue(
      panierTotalQuantity,
    );


  /* =========================================================================
     COMMANDES
     ========================================================================= */

  const ordersBadge =
    getOrdersBadge(
      navigation,
    );


  /* =========================================================================
     IMPLANTATIONS
     ========================================================================= */

  const locationsLabel =
    PUBLIC_SITE
      .locations
      .map(
        (
          location,
        ) =>
          location.city,
      )
      .join(
        " · ",
      );


  /* =========================================================================
     ACCESSIBILITÉ
     ========================================================================= */

  const panierAriaLabel =
    getPanierActionAriaLabel(
      panierTotalQuantity,
    );


  const ordersAriaLabel =
    getOrdersActionAriaLabel(
      ordersBadge,
    );


  return (
    <div
      className={
        styles.publicMobileHeader
      }
      data-public-mobile-header="true"
      data-panier-total-quantity={
        panierTotalQuantity
      }
    >
      {/* ====================================================================
          CONTACT STRIP
          ==================================================================== */}

      <div
        className={
          styles.publicMobileContactBar
        }
      >
        {/* ==================================================================
            PHONE
            ================================================================== */}

        <a
          href={
            PUBLIC_SITE
              .contact
              .phone
              .href
          }
          className={
            styles.publicMobileContactLink
          }
          aria-label={
            `Téléphoner au ${PUBLIC_SITE.contact.phone.display}`
          }
        >
          <Phone
            size={
              13
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
          />

          <span>
            {
              PUBLIC_SITE
                .contact
                .phone
                .display
            }
          </span>
        </a>


        <span
          className={
            styles.publicMobileContactDivider
          }
          aria-hidden="true"
        />


        {/* ==================================================================
            WHATSAPP
            ================================================================== */}

        <a
          href={
            PUBLIC_SITE
              .contact
              .whatsapp
              .href
          }
          target="_blank"
          rel="noopener noreferrer"
          className={
            styles.publicMobileContactLink
          }
          aria-label={
            `Contacter L&E Cosmetics Empire sur WhatsApp au ${PUBLIC_SITE.contact.whatsapp.display}`
          }
        >
          <MessageCircle
            size={
              13
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
          />

          <span>
            WhatsApp
          </span>
        </a>
      </div>


      {/* ====================================================================
          MAIN MOBILE ROW
          ==================================================================== */}

      <div
        className={
          styles.publicMobileMainRow
        }
      >
        {/* ==================================================================
            MENU
            ================================================================== */}

        <button
          type="button"
          className={
            styles.publicMobileMenuButton
          }
          onClick={
            onOpenMenu
          }
          aria-label="Ouvrir le menu"
          aria-haspopup="dialog"
        >
          <Menu
            size={
              25
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
          />

          <span
            className={
              styles.publicMobileMenuButtonLabel
            }
          >
            Menu
          </span>
        </button>


        {/* ==================================================================
            LOGO
            ================================================================== */}

        <Link
          href={
            PUBLIC_NAVIGATION_ROUTES
              .HOME
          }
          className={
            styles.publicMobileBrand
          }
          aria-label="L&E Cosmetics Empire — Accueil"
        >
          <Image
            src={
              PUBLIC_SITE
                .brand
                .logo
                .src
            }
            alt={
              PUBLIC_SITE
                .brand
                .logo
                .alt
            }
            width={
              PUBLIC_SITE
                .brand
                .logo
                .width
            }
            height={
              PUBLIC_SITE
                .brand
                .logo
                .height
            }
            priority
            className={
              styles.publicMobileLogo
            }
          />
        </Link>


        {/* ==================================================================
            MOBILE HEADER ACTIONS
            ================================================================== */}

        <div
          className={
            styles.publicMobileHeaderActions
          }
        >
          {/* ================================================================
              COMMANDES
              ================================================================ */}

          <Link
            href={
              PUBLIC_NAVIGATION_ROUTES
                .ORDER_TRACKING
            }
            className={
              styles.publicMobileHeaderAction
            }
            aria-label={
              ordersAriaLabel
            }
            data-public-mobile-action="orders"
            data-public-mobile-action-badge={
              ordersBadge ??
              0
            }
          >
            <span
              className={
                styles.publicMobileHeaderActionIcon
              }
            >
              <Package
                size={
                  22
                }
                strokeWidth={
                  1.75
                }
                aria-hidden="true"
              />

              <MobileActionBadge
                value={
                  ordersBadge
                }
              />
            </span>

            <span
              className={
                styles.publicMobileHeaderActionLabel
              }
            >
              Commandes
            </span>
          </Link>


          {/* ================================================================
              PANIER
              ================================================================ */}

          <Link
            href={
              PUBLIC_NAVIGATION_ROUTES
                .CART
            }
            className={
              styles.publicMobileHeaderAction
            }
            aria-label={
              panierAriaLabel
            }
            data-public-mobile-action="cart"
            data-public-mobile-action-badge={
              panierBadge ??
              0
            }
          >
            <span
              className={
                styles.publicMobileHeaderActionIcon
              }
            >
              <ShoppingCart
                size={
                  22
                }
                strokeWidth={
                  1.75
                }
                aria-hidden="true"
              />


              {/* ============================================================
                  VRAIE NOTIFICATION PANIER
                  ============================================================
                  
                  Exemple :
                  
                  quantité totale = 4
                  
                  rendu :
                  
                  [Panier ④]
                  
                  Aucune valeur n'est lue depuis :
                  
                  navigation.badges.cart
                  
                  car ce compteur appartient maintenant au vrai
                  PublicPanierProvider côté navigateur.
                  ============================================================ */}

              <MobileActionBadge
                value={
                  panierBadge
                }
              />
            </span>

            <span
              className={
                styles.publicMobileHeaderActionLabel
              }
            >
              Panier
            </span>
          </Link>
        </div>
      </div>


      {/* ====================================================================
          SEARCH
          ==================================================================== */}

      <div
        className={
          styles.publicMobileSearchArea
        }
      >
        <PublicSearchForm
          id="public-search-mobile"
          variant="mobile"
          defaultQuery={
            defaultSearchQuery
          }
          placeholder="Rechercher un produit, une marque..."
          ariaLabel="Rechercher un produit dans Cosmetics Empire"
        />
      </div>


      {/* ====================================================================
          LOCATIONS
          ==================================================================== */}

      {locationsLabel ? (
        <div
          className={
            styles.publicMobileLocationsBar
          }
        >
          <div
            className={
              styles.publicMobileLocationsIcon
            }
            aria-hidden="true"
          >
            <MapPin
              size={
                16
              }
              strokeWidth={
                1.9
              }
            />
          </div>


          <div
            className={
              styles.publicMobileLocationsContent
            }
          >
            <span
              className={
                styles.publicMobileLocationsTitle
              }
            >
              Nos implantations
            </span>

            <span
              className={
                styles.publicMobileLocationsText
              }
            >
              {
                locationsLabel
              }
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * HEADER MOBILE :
 *
 * Barre contact
 *
 *        ↓
 *
 * Menu | Logo | Commandes | Panier
 *
 *        ↓
 *
 * Recherche
 *
 *        ↓
 *
 * Implantations
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
 * PublicMobileHeader
 *
 *        ↓
 *
 * icône ShoppingCart
 *
 *        ↓
 *
 * badge numérique
 *
 * ============================================================================
 *
 * Exemple :
 *
 * BEAUTY GUMMIES × 4
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
 * AFFICHAGE :
 *
 * 1 à 99
 *
 * puis :
 *
 * 99+
 *
 * ============================================================================
 *
 * La quantité réelle dans le Provider n'est jamais limitée à 99.
 *
 * Seul l'affichage visuel est plafonné.
 *
 * ============================================================================
 *
 * COMMANDES :
 *
 * Le badge continue à provenir de :
 *
 * navigation.badges.orders
 *
 * ============================================================================
 *
 * Aucun :
 *
 * - faux compteur ;
 * - accès Prisma ;
 * - accès PostgreSQL ;
 * - prix dans le Header ;
 * - stock dans le Header ;
 * - deuxième système Panier ;
 * - lecture manuelle de localStorage dans ce composant.
 *
 * ============================================================================
 */