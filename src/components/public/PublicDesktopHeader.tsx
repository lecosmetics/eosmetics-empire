"use client";

import Image from "next/image";
import Link from "next/link";

import type {
  LucideIcon,
} from "lucide-react";

import {
  BadgePercent,
  Circle,
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
} from "lucide-react";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import {
  generalAppRoutes,
} from "@/config/routes";

import {
  hasVisiblePublicNavigationBadge,
  type PublicNavigationData,
  type PublicNavigationIconId,
} from "@/lib/public/navigation/public-navigation-types";

import {
  usePublicPanierTotalQuantity,
} from "@/components/public/panier/PublicPanierProvider";

import PublicSearchForm from "@/components/public/PublicSearchForm";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — HEADER DESKTOP
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/PublicDesktopHeader.tsx
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - afficher la version PC du Header public ;
 * - utiliser le logo officiel ;
 * - afficher les coordonnées officielles ;
 * - afficher les implantations officielles ;
 * - afficher la recherche principale ;
 * - afficher les actions publiques ;
 * - afficher la navigation principale ;
 * - afficher les catégories réellement disponibles ;
 * - afficher les vrais badges lorsqu'ils existent ;
 * - afficher le vrai compteur du Panier navigateur ;
 * - réagir immédiatement aux ajouts / retraits du Panier ;
 * - ne jamais faire de requête Prisma directement ;
 * - ne jamais inventer une catégorie ;
 * - ne jamais inventer un compteur.
 *
 * ============================================================================
 *
 * PANIER :
 *
 * Le compteur du Panier provient exclusivement de :
 *
 * PublicPanierProvider
 *
 * et plus précisément :
 *
 * usePublicPanierTotalQuantity()
 *
 * Il représente la quantité totale actuellement enregistrée dans le Panier.
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
 * Le compteur Panier affiché dans le Header est un indicateur d'interface.
 *
 * Il ne remplace jamais la validation serveur de :
 *
 * - StoreProduct ;
 * - stock ;
 * - prix ;
 * - devise ;
 * - statut ;
 * - boutique.
 *
 * Ces validations restent effectuées par la couche Panier serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. PROPS
   ========================================================================== */

export interface PublicDesktopHeaderProps {
  /**
   * Navigation déjà assemblée côté serveur par :
   *
   * getPublicNavigationData()
   */
  readonly navigation:
    PublicNavigationData;

  /**
   * Valeur éventuellement conservée sur une page de recherche.
   */
  readonly defaultSearchQuery?:
    string | null;
}


/* ==========================================================================
   2. ICON RESOLVER
   ========================================================================== */

/**
 * Les fichiers de configuration utilisent uniquement des identifiants
 * d'icônes sérialisables.
 *
 * La résolution vers lucide-react reste dans la couche visuelle.
 */
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

    default:
      return Circle;
  }
}


/* ==========================================================================
   3. NORMALISATION BADGE
   ========================================================================== */

/**
 * Protection purement défensive.
 *
 * Un badge public doit être :
 *
 * - numérique ;
 * - fini ;
 * - positif ;
 * - entier.
 *
 * Une valeur invalide ou égale à zéro n'est pas affichée.
 */
function normalizePublicBadgeValue(
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
   4. BADGE RESOLVER
   ========================================================================== */

/**
 * CART / PANIER :
 *
 * Le Panier est maintenant un état navigateur réellement maintenu par :
 *
 * PublicPanierProvider.
 *
 * Le Header doit donc afficher ce compteur réactif.
 *
 * --------------------------------------------------------------------------
 *
 * ORDERS / FAVORITES :
 *
 * Ils continuent à lire leurs éventuelles valeurs depuis :
 *
 * navigation.badges
 *
 * --------------------------------------------------------------------------
 *
 * Aucun nombre fictif n'est utilisé.
 */
function getHeaderActionBadge(
  actionId:
    string,

  navigation:
    PublicNavigationData,

  panierTotalQuantity:
    number,
): number |
  null {
  switch (
    actionId
  ) {
    case "cart":
      return normalizePublicBadgeValue(
        panierTotalQuantity,
      );

    case "orders":
      return normalizePublicBadgeValue(
        navigation
          .badges
          .orders,
      );

    case "favorites":
      return normalizePublicBadgeValue(
        navigation
          .badges
          .favorites,
      );

    default:
      return null;
  }
}


/* ==========================================================================
   5. BADGE ACCESSIBILITY LABEL
   ========================================================================== */

function getHeaderBadgeAriaLabel(
  actionId:
    string,

  badge:
    number,
): string {
  switch (
    actionId
  ) {
    case "cart":
      return `${badge} article${badge > 1 ? "s" : ""} dans le panier`;

    case "orders":
      return `${badge} commande${badge > 1 ? "s" : ""}`;

    case "favorites":
      return `${badge} favori${badge > 1 ? "s" : ""}`;

    default:
      return `${badge} élément${badge > 1 ? "s" : ""}`;
  }
}


/* ==========================================================================
   6. LOCATION TEXT
   ========================================================================== */

/**
 * Résumé construit uniquement depuis les implantations officielles
 * définies dans :
 *
 * src/config/public-site.ts
 */
function getPublicLocationSummary():
  string {
  return PUBLIC_SITE
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
}


/* ==========================================================================
   7. COMPONENT
   ========================================================================== */

export default function PublicDesktopHeader({
  navigation,
  defaultSearchQuery =
    null,
}: PublicDesktopHeaderProps) {
  /* =========================================================================
     IMPLANTATIONS
     ========================================================================= */

  const locationSummary =
    getPublicLocationSummary();


  /* =========================================================================
     PANIER
     =========================================================================
     
     Source unique du compteur Panier côté navigateur.
     
     Ce hook écoute le même store que :
     
     - PublicAddToPanierButton ;
     - PublicPanierPage ;
     - les futures notifications Panier.
     
     Une modification du Panier met donc immédiatement le badge à jour
     sans rechargement de page.
     ========================================================================= */

  const panierTotalQuantity =
    usePublicPanierTotalQuantity();


  return (
    <div
      className={
        styles.publicDesktopHeader
      }
      data-public-desktop-header="true"
      data-panier-total-quantity={
        panierTotalQuantity
      }
    >
      {/* ====================================================================
          TOP UTILITY BAR
          ==================================================================== */}

      <div
        className={
          styles.publicDesktopTopBar
        }
      >
        <div
          className={
            styles.publicDesktopTopBarContacts
          }
        >
          {/* ================================================================
              PHONE
              ================================================================ */}

          <a
            href={
              PUBLIC_SITE
                .contact
                .phone
                .href
            }
            className={
              styles.publicDesktopTopBarLink
            }
            aria-label={
              `Téléphoner au ${PUBLIC_SITE.contact.phone.display}`
            }
          >
            <Phone
              size={
                14
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


          {/* ================================================================
              WHATSAPP
              ================================================================ */}

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
              styles.publicDesktopTopBarLink
            }
            aria-label={
              `Contacter L&E Cosmetics Empire sur WhatsApp au ${PUBLIC_SITE.contact.whatsapp.display}`
            }
          >
            <MessageCircle
              size={
                14
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <span>
              WhatsApp
            </span>

            <span
              className={
                styles.publicDesktopTopBarContactValue
              }
            >
              {
                PUBLIC_SITE
                  .contact
                  .whatsapp
                  .display
              }
            </span>
          </a>


          {/* ================================================================
              EMAIL
              ================================================================ */}

          <a
            href={
              PUBLIC_SITE
                .contact
                .email
                .href
            }
            className={
              styles.publicDesktopTopBarLink
            }
            aria-label={
              `Envoyer un e-mail à ${PUBLIC_SITE.contact.email.address}`
            }
          >
            <Mail
              size={
                14
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
                  .email
                  .address
              }
            </span>
          </a>
        </div>


        {/* ==================================================================
            LOCATIONS
            ================================================================== */}

        {locationSummary ? (
          <div
            className={
              styles.publicDesktopTopBarLocations
            }
            title={
              PUBLIC_SITE
                .locations
                .map(
                  (
                    location,
                  ) =>
                    location.label,
                )
                .join(
                  " · ",
                )
            }
          >
            <MapPin
              size={
                14
              }
              strokeWidth={
                1.9
              }
              aria-hidden="true"
            />

            <span
              className={
                styles.publicDesktopTopBarLocationsLabel
              }
            >
              Nos implantations
            </span>

            <span
              className={
                styles.publicDesktopTopBarLocationsValue
              }
            >
              {
                locationSummary
              }
            </span>
          </div>
        ) : null}
      </div>


      {/* ====================================================================
          MAIN HEADER ROW
          ==================================================================== */}

      <div
        className={
          styles.publicDesktopMainRow
        }
      >
        {/* ==================================================================
            BRAND
            ================================================================== */}

        <Link
          href={
            generalAppRoutes.home
          }
          className={
            styles.publicDesktopBrand
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
              styles.publicDesktopLogo
            }
          />
        </Link>


        {/* ==================================================================
            SEARCH
            ================================================================== */}

        <div
          className={
            styles.publicDesktopSearchArea
          }
        >
          <PublicSearchForm
            id="public-search-desktop"
            variant="desktop"
            defaultQuery={
              defaultSearchQuery
            }
          />
        </div>


        {/* ==================================================================
            HEADER ACTIONS
            ================================================================== */}

        <nav
          className={
            styles.publicDesktopActions
          }
          aria-label="Actions principales"
        >
          {navigation
            .headerActions
            .map(
              (
                action,
              ) => {
                const Icon =
                  getNavigationIcon(
                    action.icon,
                  );


                const badge =
                  action.supportsBadge
                    ? getHeaderActionBadge(
                        action.id,
                        navigation,
                        panierTotalQuantity,
                      )
                    : null;


                const badgeVisible =
                  hasVisiblePublicNavigationBadge(
                    badge,
                  );


                const badgeLabel =
                  badgeVisible
                    ? getHeaderBadgeAriaLabel(
                        action.id,
                        badge,
                      )
                    : null;


                return (
                  <Link
                    key={
                      action.id
                    }
                    href={
                      action.href
                    }
                    className={
                      styles.publicDesktopAction
                    }
                    aria-label={
                      badgeLabel
                        ? `${action.label} — ${badgeLabel}`
                        : action.label
                    }
                    data-public-header-action={
                      action.id
                    }
                    data-public-header-badge={
                      badge ??
                      0
                    }
                  >
                    <span
                      className={
                        styles.publicDesktopActionIcon
                      }
                    >
                      <Icon
                        size={
                          23
                        }
                        strokeWidth={
                          1.75
                        }
                        aria-hidden="true"
                      />


                      {/* ====================================================
                          BADGE
                          ==================================================== */}

                      {badgeVisible ? (
                        <span
                          className={
                            styles.publicNavigationBadge
                          }
                          aria-hidden="true"
                        >
                          {
                            badge >
                            99
                              ? "99+"
                              : badge
                          }
                        </span>
                      ) : null}
                    </span>


                    <span
                      className={
                        styles.publicDesktopActionLabel
                      }
                    >
                      {
                        action.label
                      }
                    </span>
                  </Link>
                );
              },
            )}
        </nav>
      </div>


      {/* ====================================================================
          PRIMARY NAVIGATION BAR
          ==================================================================== */}

      <div
        className={
          styles.publicDesktopNavigationBar
        }
      >
        <nav
          className={
            styles.publicDesktopNavigation
          }
          aria-label="Navigation principale"
        >
          {/* ================================================================
              FIXED NAVIGATION
              ================================================================ */}

          {navigation
            .desktopNavigation
            .map(
              (
                item,
              ) => {
                const Icon =
                  getNavigationIcon(
                    item.icon,
                  );


                return (
                  <Link
                    key={
                      item.id
                    }
                    href={
                      item.href
                    }
                    className={
                      styles.publicDesktopNavigationLink
                    }
                  >
                    <Icon
                      size={
                        16
                      }
                      strokeWidth={
                        1.85
                      }
                      aria-hidden="true"
                    />

                    <span>
                      {
                        item.label
                      }
                    </span>
                  </Link>
                );
              },
            )}


          {/* ================================================================
              DYNAMIC CATEGORIES
              ================================================================ */}

          {navigation.categories.length >
          0 ? (
            <>
              <span
                className={
                  styles.publicDesktopNavigationDivider
                }
                aria-hidden="true"
              />

              <div
                className={
                  styles.publicDesktopCategoryNavigation
                }
                aria-label="Catégories de produits"
              >
                {navigation
                  .categories
                  .map(
                    (
                      category,
                    ) => (
                      <Link
                        key={
                          category.id
                        }
                        href={
                          category.href
                        }
                        className={
                          styles.publicDesktopCategoryLink
                        }
                      >
                        {
                          category.name
                        }
                      </Link>
                    ),
                  )}
              </div>
            </>
          ) : null}
        </nav>
      </div>
    </div>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * HEADER DESKTOP :
 *
 * Logo
 * Recherche
 * Compte
 * Favoris
 * Commandes
 * Panier
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
 * PublicDesktopHeader
 *
 *        ↓
 *
 * Icône Panier + badge numérique
 *
 * ============================================================================
 *
 * Exemple :
 *
 * 1 produit × 4
 *
 * → badge :
 *
 * 4
 *
 * ============================================================================
 *
 * Deux produits :
 *
 * A × 2
 * B × 3
 *
 * → badge :
 *
 * 5
 *
 * ============================================================================
 *
 * Le nombre est plafonné visuellement à :
 *
 * 99+
 *
 * sans modifier la vraie quantité stockée dans le Panier.
 *
 * ============================================================================
 *
 * Aucun prix, stock ou autre donnée commerciale n'est fait confiance
 * depuis ce compteur.
 *
 * ============================================================================
 */