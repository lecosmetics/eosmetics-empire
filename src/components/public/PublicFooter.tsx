import Image from "next/image";
import Link from "next/link";

import {
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
} from "lucide-react";

import {
  PUBLIC_NAVIGATION_ROUTES,
} from "@/config/public-navigation";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import styles from "./public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — FOOTER OFFICIEL
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/public/PublicFooter.tsx
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher le pied de page public officiel de L&E Cosmetics Empire.
 *
 * ============================================================================
 *
 * SOURCES DE VÉRITÉ
 *
 * Identité / logo / coordonnées / réseaux / implantations :
 *
 * src/config/public-site.ts
 *
 * Routes :
 *
 * src/config/public-navigation.ts
 *
 * ============================================================================
 *
 * ARCHITECTURE
 *
 * 1. Bande assistance :
 *
 * Desktop :
 *
 * Téléphone | WhatsApp | E-mail | Votre commande
 *
 * Mobile :
 *
 * Téléphone | WhatsApp
 * E-mail    | Votre commande
 *
 * 2. Footer principal :
 *
 * - identité ;
 * - réseaux sociaux ;
 * - Boutique ;
 * - Aide ;
 * - Implantations ;
 * - Informations.
 *
 * 3. Barre secondaire compacte.
 *
 * 4. Copyright + liens légaux.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne contient aucune requête Prisma ;
 * - ne lit aucune session ;
 * - n’invente aucune adresse ;
 * - n’invente aucun téléphone ;
 * - n’invente aucun réseau social ;
 * - n’invente aucune implantation ;
 * - n’invente aucune route ;
 * - reste un Server Component ;
 * - n’utilise aucun JavaScript responsive.
 *
 * Le responsive appartient exclusivement à :
 *
 * src/components/public/public-shell.module.css
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES
   ========================================================================== */

interface PublicFooterLink {
  readonly label:
    string;

  readonly href:
    string;
}


/* ==========================================================================
   2. LIENS — BOUTIQUE
   ========================================================================== */

const SHOP_LINKS = [
  {
    label:
      "Tous les produits",

    href:
      PUBLIC_NAVIGATION_ROUTES.PRODUCTS,
  },

  {
    label:
      "Nouveautés",

    href:
      PUBLIC_NAVIGATION_ROUTES.NEW_PRODUCTS,
  },

  {
    label:
      "Promotions",

    href:
      PUBLIC_NAVIGATION_ROUTES.PROMOTIONS,
  },

  {
    label:
      "Mon panier",

    href:
      PUBLIC_NAVIGATION_ROUTES.CART,
  },
] as const satisfies readonly PublicFooterLink[];


/* ==========================================================================
   3. LIENS — AIDE
   ========================================================================== */

const HELP_LINKS = [
  {
    label:
      "Suivre une commande",

    href:
      PUBLIC_NAVIGATION_ROUTES.ORDER_TRACKING,
  },

  {
    label:
      "Contact",

    href:
      PUBLIC_NAVIGATION_ROUTES.CONTACT,
  },

  {
    label:
      "FAQ",

    href:
      PUBLIC_NAVIGATION_ROUTES.FAQ,
  },

  {
    label:
      "Livraison",

    href:
      PUBLIC_NAVIGATION_ROUTES.DELIVERY,
  },
] as const satisfies readonly PublicFooterLink[];


/* ==========================================================================
   4. LIENS — INFORMATIONS LÉGALES
   ========================================================================== */

const LEGAL_LINKS = [
  {
    label:
      "Conditions",

    href:
      PUBLIC_NAVIGATION_ROUTES.TERMS,
  },

  {
    label:
      "Confidentialité",

    href:
      PUBLIC_NAVIGATION_ROUTES.PRIVACY,
  },
] as const satisfies readonly PublicFooterLink[];


/* ==========================================================================
   5. LISTE DE LIENS
   ========================================================================== */

interface PublicFooterLinkListProps {
  readonly links:
    readonly PublicFooterLink[];
}


function PublicFooterLinkList({
  links,
}: PublicFooterLinkListProps) {
  return (
    <ul
      className={
        styles.publicFooterLinkList
      }
    >
      {links.map(
        (
          item,
        ) => (
          <li
            key={
              item.href
            }
            className={
              styles.publicFooterLinkListItem
            }
          >
            <Link
              href={
                item.href
              }
              className={
                styles.publicFooterLink
              }
            >
              <span>
                {
                  item.label
                }
              </span>

              <ChevronRight
                size={
                  14
                }
                strokeWidth={
                  1.8
                }
                aria-hidden="true"
                focusable="false"
              />
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}


/* ==========================================================================
   6. BANDE SERVICE / CONTACT
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * L’ordre des quatre éléments est volontaire :
 *
 * 1. Téléphone
 * 2. WhatsApp
 * 3. E-mail
 * 4. Votre commande
 *
 * Avec une grille mobile 2 colonnes, cela donne exactement :
 *
 * ┌─────────────────┬─────────────────┐
 * │ Téléphone       │ WhatsApp        │
 * ├─────────────────┼─────────────────┤
 * │ E-mail          │ Votre commande  │
 * └─────────────────┴─────────────────┘
 */
function PublicFooterServiceStrip() {
  return (
    <section
      className={
        styles.publicFooterServiceStrip
      }
      aria-label="Assistance L&E Cosmetics Empire"
    >
      <div
        className={
          styles.publicFooterServiceStripContent
        }
      >
        {/* ===============================================================
            TÉLÉPHONE
            =============================================================== */}

        <a
          href={
            PUBLIC_SITE.contact.phone.href
          }
          className={
            styles.publicFooterServiceItem
          }
          aria-label={
            `Téléphoner au ${PUBLIC_SITE.contact.phone.display}`
          }
        >
          <span
            className={
              styles.publicFooterServiceIcon
            }
            aria-hidden="true"
          >
            <Phone
              size={
                20
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
              focusable="false"
            />
          </span>

          <span
            className={
              styles.publicFooterServiceText
            }
          >
            <strong>
              Téléphone
            </strong>

            <span>
              {
                PUBLIC_SITE.contact
                  .phone.display
              }
            </span>
          </span>
        </a>


        {/* ===============================================================
            WHATSAPP
            =============================================================== */}

        <a
          href={
            PUBLIC_SITE.contact
              .whatsapp.href
          }
          target="_blank"
          rel="noopener noreferrer"
          className={
            styles.publicFooterServiceItem
          }
          aria-label={
            `Contacter L&E Cosmetics Empire sur WhatsApp au ${PUBLIC_SITE.contact.whatsapp.display}`
          }
        >
          <span
            className={
              styles.publicFooterServiceIcon
            }
            aria-hidden="true"
          >
            <MessageCircle
              size={
                20
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
              focusable="false"
            />
          </span>

          <span
            className={
              styles.publicFooterServiceText
            }
          >
            <strong>
              WhatsApp
            </strong>

            <span>
              {
                PUBLIC_SITE.contact
                  .whatsapp.display
              }
            </span>
          </span>
        </a>


        {/* ===============================================================
            E-MAIL
            =============================================================== */}

        <a
          href={
            PUBLIC_SITE.contact.email.href
          }
          className={
            styles.publicFooterServiceItem
          }
          aria-label={
            `Envoyer un e-mail à ${PUBLIC_SITE.contact.email.address}`
          }
        >
          <span
            className={
              styles.publicFooterServiceIcon
            }
            aria-hidden="true"
          >
            <Mail
              size={
                20
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
              focusable="false"
            />
          </span>

          <span
            className={
              styles.publicFooterServiceText
            }
          >
            <strong>
              E-mail
            </strong>

            <span>
              {
                PUBLIC_SITE.contact
                  .email.address
              }
            </span>
          </span>
        </a>


        {/* ===============================================================
            SUIVI COMMANDE
            =============================================================== */}

        <Link
          href={
            PUBLIC_NAVIGATION_ROUTES
              .ORDER_TRACKING
          }
          className={
            styles.publicFooterServiceItem
          }
          aria-label="Suivre votre commande"
        >
          <span
            className={
              styles.publicFooterServiceIcon
            }
            aria-hidden="true"
          >
            <PackageSearch
              size={
                20
              }
              strokeWidth={
                1.8
              }
              aria-hidden="true"
              focusable="false"
            />
          </span>

          <span
            className={
              styles.publicFooterServiceText
            }
          >
            <strong>
              Votre commande
            </strong>

            <span>
              Suivre une commande
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}


/* ==========================================================================
   7. IDENTITÉ
   ========================================================================== */

function PublicFooterBrandColumn() {
  return (
    <div
      className={
        styles.publicFooterBrandColumn
      }
    >
      <Link
        href={
          PUBLIC_NAVIGATION_ROUTES.HOME
        }
        className={
          styles.publicFooterBrand
        }
        aria-label={`${PUBLIC_SITE.brand.name} — Accueil`}
      >
        <Image
          src={
            PUBLIC_SITE.brand.logo.src
          }
          alt={
            PUBLIC_SITE.brand.logo.alt
          }
          width={
            PUBLIC_SITE.brand.logo.width
          }
          height={
            PUBLIC_SITE.brand.logo.height
          }
          className={
            styles.publicFooterLogo
          }
        />
      </Link>


      <p
        className={
          styles.publicFooterBrandName
        }
      >
        {
          PUBLIC_SITE.brand.name
        }
      </p>


      <p
        className={
          styles.publicFooterSlogan
        }
      >
        {
          PUBLIC_SITE.brand.slogan
        }
      </p>


      {/* ===============================================================
          RÉSEAUX SOCIAUX
          =============================================================== */}

      <div
        className={
          styles.publicFooterSocialSection
        }
      >
        <span
          className={
            styles.publicFooterSocialTitle
          }
        >
          Suivez-nous
        </span>

        <div
          className={
            styles.publicFooterSocialList
          }
        >
          {PUBLIC_SITE.socials.map(
            (
              social,
            ) => (
              <a
                key={
                  social.id
                }
                href={
                  social.href
                }
                target="_blank"
                rel="noopener noreferrer"
                className={
                  styles.publicFooterSocialLink
                }
                aria-label={
                  `${social.label} — @${social.handle}`
                }
              >
                <span
                  className={
                    styles.publicFooterSocialIcon
                  }
                  aria-hidden="true"
                >
                  <Share2
                    size={
                      17
                    }
                    strokeWidth={
                      1.8
                    }
                    aria-hidden="true"
                    focusable="false"
                  />
                </span>

                <span
                  className={
                    styles.publicFooterSocialContent
                  }
                >
                  <strong>
                    {
                      social.label
                    }
                  </strong>

                  <span>
                    @
                    {
                      social.handle
                    }
                  </span>
                </span>

                <ExternalLink
                  size={
                    13
                  }
                  strokeWidth={
                    1.7
                  }
                  aria-hidden="true"
                  focusable="false"
                />
              </a>
            ),
          )}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   8. COLONNE BOUTIQUE
   ========================================================================== */

function PublicFooterShopColumn() {
  return (
    <section
      className={
        styles.publicFooterColumn
      }
      aria-labelledby="public-footer-shop-title"
    >
      <div
        className={
          styles.publicFooterColumnHeading
        }
      >
        <span
          className={
            styles.publicFooterColumnHeadingIcon
          }
          aria-hidden="true"
        >
          <ShoppingBag
            size={
              18
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </span>

        <h2
          id="public-footer-shop-title"
          className={
            styles.publicFooterColumnTitle
          }
        >
          Boutique
        </h2>
      </div>

      <PublicFooterLinkList
        links={
          SHOP_LINKS
        }
      />
    </section>
  );
}


/* ==========================================================================
   9. COLONNE AIDE
   ========================================================================== */

function PublicFooterHelpColumn() {
  return (
    <section
      className={
        styles.publicFooterColumn
      }
      aria-labelledby="public-footer-help-title"
    >
      <div
        className={
          styles.publicFooterColumnHeading
        }
      >
        <span
          className={
            styles.publicFooterColumnHeadingIcon
          }
          aria-hidden="true"
        >
          <CircleHelp
            size={
              18
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </span>

        <h2
          id="public-footer-help-title"
          className={
            styles.publicFooterColumnTitle
          }
        >
          Aide
        </h2>
      </div>

      <PublicFooterLinkList
        links={
          HELP_LINKS
        }
      />
    </section>
  );
}


/* ==========================================================================
   10. COLONNE IMPLANTATIONS
   ========================================================================== */

function PublicFooterLocationsColumn() {
  return (
    <section
      className={
        styles.publicFooterColumn
      }
      aria-labelledby="public-footer-locations-title"
    >
      <div
        className={
          styles.publicFooterColumnHeading
        }
      >
        <span
          className={
            styles.publicFooterColumnHeadingIcon
          }
          aria-hidden="true"
        >
          <MapPin
            size={
              18
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </span>

        <h2
          id="public-footer-locations-title"
          className={
            styles.publicFooterColumnTitle
          }
        >
          Nos implantations
        </h2>
      </div>

      <ul
        className={
          styles.publicFooterLocations
        }
      >
        {PUBLIC_SITE.locations.map(
          (
            location,
          ) => (
            <li
              key={
                location.id
              }
              className={
                styles.publicFooterLocation
              }
            >
              <span
                className={
                  styles.publicFooterLocationMarker
                }
                aria-hidden="true"
              />

              <span
                className={
                  styles.publicFooterLocationContent
                }
              >
                <strong>
                  {
                    location.city
                  }
                </strong>

                <span>
                  {
                    location.country
                  }
                </span>
              </span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}


/* ==========================================================================
   11. COLONNE INFORMATIONS
   ========================================================================== */

function PublicFooterInformationColumn() {
  return (
    <section
      className={
        styles.publicFooterColumn
      }
      aria-labelledby="public-footer-information-title"
    >
      <div
        className={
          styles.publicFooterColumnHeading
        }
      >
        <span
          className={
            styles.publicFooterColumnHeadingIcon
          }
          aria-hidden="true"
        >
          <Sparkles
            size={
              18
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </span>

        <h2
          id="public-footer-information-title"
          className={
            styles.publicFooterColumnTitle
          }
        >
          Informations
        </h2>
      </div>

      <PublicFooterLinkList
        links={
          LEGAL_LINKS
        }
      />


      <div
        className={
          styles.publicFooterDirectContact
        }
      >
        <span
          className={
            styles.publicFooterDirectContactTitle
          }
        >
          Une question ?
        </span>

        <a
          href={
            PUBLIC_SITE.contact
              .whatsapp.href
          }
          target="_blank"
          rel="noopener noreferrer"
          className={
            styles.publicFooterWhatsAppButton
          }
        >
          <MessageCircle
            size={
              18
            }
            strokeWidth={
              1.9
            }
            aria-hidden="true"
            focusable="false"
          />

          <span>
            Nous écrire sur WhatsApp
          </span>

          <ExternalLink
            size={
              14
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />
        </a>

        <Link
          href={
            PUBLIC_NAVIGATION_ROUTES.CONTACT
          }
          className={
            styles.publicFooterContactButton
          }
        >
          <Mail
            size={
              17
            }
            strokeWidth={
              1.8
            }
            aria-hidden="true"
            focusable="false"
          />

          <span>
            Page contact
          </span>
        </Link>
      </div>
    </section>
  );
}


/* ==========================================================================
   12. BARRE SECONDAIRE
   ========================================================================== */

function PublicFooterSecondaryBar() {
  return (
    <div
      className={
        styles.publicFooterSecondaryBar
      }
    >
      <div
        className={
          styles.publicFooterSecondaryItem
        }
      >
        <Tag
          size={
            15
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
          focusable="false"
        />

        <span>
          {
            PUBLIC_SITE.brand.shortName
          }
        </span>
      </div>


      <span
        className={
          styles.publicFooterSecondarySeparator
        }
        aria-hidden="true"
      />


      <div
        className={
          styles.publicFooterSecondaryItem
        }
      >
        <MapPin
          size={
            15
          }
          strokeWidth={
            1.8
          }
          aria-hidden="true"
          focusable="false"
        />

        <span>
          {
            PUBLIC_SITE.locations.length
          }
          {" "}
          implantations actuellement référencées
        </span>
      </div>
    </div>
  );
}


/* ==========================================================================
   13. BARRE INFÉRIEURE
   ========================================================================== */

interface PublicFooterBottomProps {
  readonly currentYear:
    number;
}


function PublicFooterBottom({
  currentYear,
}: PublicFooterBottomProps) {
  return (
    <div
      className={
        styles.publicFooterBottom
      }
    >
      <p
        className={
          styles.publicFooterCopyright
        }
      >
        ©
        {" "}
        {
          currentYear
        }
        {" "}
        {
          PUBLIC_SITE.brand.name
        }.
      </p>


      <nav
        className={
          styles.publicFooterBottomNavigation
        }
        aria-label="Informations légales"
      >
        <Link
          href={
            PUBLIC_NAVIGATION_ROUTES.TERMS
          }
          className={
            styles.publicFooterBottomLink
          }
        >
          Conditions
        </Link>


        <span
          className={
            styles.publicFooterBottomDivider
          }
          aria-hidden="true"
        />


        <Link
          href={
            PUBLIC_NAVIGATION_ROUTES.PRIVACY
          }
          className={
            styles.publicFooterBottomLink
          }
        >
          Confidentialité
        </Link>


        <span
          className={
            styles.publicFooterBottomDivider
          }
          aria-hidden="true"
        />


        <Link
          href={
            PUBLIC_NAVIGATION_ROUTES.CONTACT
          }
          className={
            styles.publicFooterBottomLink
          }
        >
          Contact
        </Link>
      </nav>
    </div>
  );
}


/* ==========================================================================
   14. COMPOSANT PRINCIPAL
   ========================================================================== */

export default function PublicFooter() {
  const currentYear =
    new Date()
      .getFullYear();


  return (
    <footer
      className={
        styles.publicFooter
      }
      data-public-footer="true"
    >
      {/* ==================================================================
          ASSISTANCE
          ================================================================== */}

      <PublicFooterServiceStrip />


      {/* ==================================================================
          FOOTER PRINCIPAL
          ================================================================== */}

      <div
        className={
          styles.publicFooterMain
        }
      >
        <PublicFooterBrandColumn />

        <PublicFooterShopColumn />

        <PublicFooterHelpColumn />

        <PublicFooterLocationsColumn />

        <PublicFooterInformationColumn />
      </div>


      {/* ==================================================================
          BARRE SECONDAIRE
          ================================================================== */}

      <PublicFooterSecondaryBar />


      {/* ==================================================================
          BARRE INFÉRIEURE
          ================================================================== */}

      <PublicFooterBottom
        currentYear={
          currentYear
        }
      />
    </footer>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * GARANTIES
 *
 * ============================================================================
 *
 * CONTACT MOBILE
 *
 * L’ordre du DOM est exactement :
 *
 * 1. Téléphone
 * 2. WhatsApp
 * 3. E-mail
 * 4. Votre commande
 *
 * Le CSS suivant pourra donc appliquer :
 *
 * grid-template-columns:
 *   repeat(2, minmax(0, 1fr));
 *
 * pour obtenir :
 *
 * ┌──────────────────┬──────────────────┐
 * │ Téléphone        │ WhatsApp         │
 * ├──────────────────┼──────────────────┤
 * │ E-mail           │ Votre commande   │
 * └──────────────────┴──────────────────┘
 *
 * ============================================================================
 *
 * DONNÉES
 *
 * Toutes les données proviennent de :
 *
 * src/config/public-site.ts
 *
 * et :
 *
 * src/config/public-navigation.ts
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - faux téléphone ;
 * - faux WhatsApp ;
 * - faux e-mail ;
 * - faux réseau social ;
 * - fausse implantation ;
 * - faux lien ;
 * - accès Prisma ;
 * - accès session ;
 * - état React ;
 * - logique responsive JavaScript.
 *
 * ============================================================================
 */