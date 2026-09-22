"use client";

import Link from "next/link";

import {
  Bell,
  ChevronDown,
  MapPin,
  Menu,
  Search,
} from "lucide-react";

import type {
  RefObject,
} from "react";

import {
  gestionnaireShellConfig,
} from "@/config/gestionnaire-navigation";

import type {
  GestionnaireProfile,
} from "./GestionnaireProfileCard";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE APP HEADER
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/layout/
   GestionnaireAppHeader.tsx

   RESPONSABILITÉ :

   Header permanent de l'espace privé Gestionnaire.

   DESKTOP :

   ┌───────────────────────────────────────────────────────────┐
   │ Recherche        Localisation | Cloche | Profil          │
   └───────────────────────────────────────────────────────────┘

   MOBILE :

   ┌───────────────────────────────────────────────────────────┐
   │ ☰   L&E Cosmetics           Recherche   Cloche   Avatar  │
   └───────────────────────────────────────────────────────────┘

   Le composant :

   - ne contient aucune donnée fictive ;
   - reçoit les données du gestionnaire via `profile` ;
   - n'effectue aucune authentification ;
   - ne contient aucune logique métier ;
   - reste réutilisable sur toutes les pages privées ;
   - respecte les breakpoints définis dans
     gestionnaire-app.css.

   Plus tard, les vraies données seront fournies par le
   layout serveur après validation de la session.
   ============================================================ */


/* ============================================================
   TYPES
   ============================================================ */

type GestionnaireAppHeaderProps =
  Readonly<{
    /*
     * Profil réel du gestionnaire connecté.
     */
    profile?: GestionnaireProfile;

    /*
     * Permet d'afficher le point magenta sur la cloche.
     */
    hasUnreadNotifications?: boolean;

    /*
     * État actuel du Drawer mobile.
     *
     * Facultatif afin de ne pas casser le Shell existant.
     * Il est recommandé de le transmettre depuis
     * GestionnaireShell pour avoir un aria-expanded exact.
     */
    isNavigationOpen?: boolean;

    /*
     * Ouvre le Drawer mobile.
     */
    onOpenNavigation: () => void;

    /*
     * Référence du bouton hamburger.
     *
     * Utilisée notamment pour restaurer le focus lorsque le
     * Drawer mobile se ferme.
     */
    menuButtonRef?:
      RefObject<
        HTMLButtonElement | null
      >;
  }>;


/* ============================================================
   PROFILE INITIALS
   ------------------------------------------------------------
   Priorité :

   1. profile.initials
   2. profile.displayName
   3. identité générique L&E

   Aucun nom de gestionnaire fictif n'est introduit ici.
   ============================================================ */

function getInitials(
  profile?: GestionnaireProfile,
): string {
  const explicitInitials =
    profile?.initials?.trim();

  if (explicitInitials) {
    return explicitInitials
      .replace(/\s+/g, "")
      .slice(0, 3)
      .toUpperCase();
  }


  const displayName =
    profile?.displayName?.trim();

  if (!displayName) {
    return "L&E";
  }


  const words =
    displayName
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);


  if (words.length === 0) {
    return "L&E";
  }


  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }


  return words
    .slice(0, 2)
    .map((word) =>
      word.charAt(0),
    )
    .join("")
    .toUpperCase();
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireAppHeader({
  profile,
  hasUnreadNotifications = false,
  isNavigationOpen = false,
  onOpenNavigation,
  menuButtonRef,
}: GestionnaireAppHeaderProps) {
  /* ----------------------------------------------------------
     GLOBAL SHELL CONFIG
     ---------------------------------------------------------- */

  const {
    brand,
    searchPlaceholder,
    mobileMenu,
  } = gestionnaireShellConfig;


  /* ----------------------------------------------------------
     PROFILE VALUES
     ---------------------------------------------------------- */

  const displayName =
    profile?.displayName?.trim() ||
    brand.name;

  const email =
    profile?.email?.trim() ||
    null;

  const location =
    profile?.location?.trim() ||
    null;

  const avatarUrl =
    profile?.avatarUrl?.trim() ||
    null;

  const initials =
    getInitials(profile);


  /* ----------------------------------------------------------
     ACCESSIBILITY LABELS
     ---------------------------------------------------------- */

  const notificationLabel =
    hasUnreadNotifications
      ? "Notifications — nouvelles notifications disponibles"
      : "Notifications";

  const profileLabel =
    `Ouvrir le profil de ${displayName}`;


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <header
      className="gestionnaire-app-header"
      role="banner"
    >
      <div className="gestionnaire-app-header__inner">
        {/* ====================================================
            MOBILE — LEFT AREA

            Visible uniquement tablette/mobile via CSS.
            ==================================================== */}

        <div className="gestionnaire-app-header__mobile-start">
          <button
            ref={menuButtonRef}
            type="button"
            className="gestionnaire-app-header__menu-button"
            aria-label={
              mobileMenu.openLabel
            }
            aria-controls="gestionnaire-mobile-drawer"
            aria-expanded={
              isNavigationOpen
            }
            onClick={
              onOpenNavigation
            }
          >
            <Menu
              size={23}
              strokeWidth={1.9}
              aria-hidden="true"
            />
          </button>


          {/* --------------------------------------------------
              MOBILE IDENTITY
              -------------------------------------------------- */}

          <div className="gestionnaire-app-header__mobile-brand">
            <strong>
              {brand.name}
            </strong>

            <span>
              {brand.subtitle}
            </span>
          </div>
        </div>


        {/* ====================================================
            DESKTOP / TABLET SEARCH
            ==================================================== */}

        <div className="gestionnaire-app-header__search">
          <Search
            className="gestionnaire-app-header__search-icon"
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <input
            type="search"
            className="gestionnaire-app-header__search-input"
            placeholder={
              searchPlaceholder
            }
            aria-label={
              searchPlaceholder
            }
            autoComplete="off"
            spellCheck={false}
          />
        </div>


        {/* ====================================================
            RIGHT ACTIONS
            ==================================================== */}

        <div className="gestionnaire-app-header__actions">
          {/* ==================================================
              LOCATION — DESKTOP
              ================================================== */}

          <div
            className="gestionnaire-app-header__location"
            title={
              location ??
              "Localisation non renseignée"
            }
          >
            <MapPin
              size={19}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              {location ??
                "Localisation"}
            </span>

            <ChevronDown
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </div>


          {/* ==================================================
              SEPARATOR
              ================================================== */}

          <span
            className="gestionnaire-app-header__divider"
            aria-hidden="true"
          />


          {/* ==================================================
              NOTIFICATIONS
              ================================================== */}

          <button
            type="button"
            className="gestionnaire-app-header__notification"
            aria-label={
              notificationLabel
            }
            title="Notifications"
          >
            <Bell
              size={21}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            {hasUnreadNotifications ? (
              <span
                className="gestionnaire-app-header__notification-dot"
                aria-hidden="true"
              />
            ) : null}
          </button>


          {/* ==================================================
              PROFILE SEPARATOR
              ================================================== */}

          <span
            className="gestionnaire-app-header__divider gestionnaire-app-header__divider--profile"
            aria-hidden="true"
          />


          {/* ==================================================
              COMPACT PROFILE
              ================================================== */}

          <Link
            href="/gestionnaire/profil"
            className="gestionnaire-app-header__profile"
            aria-label={
              profileLabel
            }
            title={
              email
                ? `${displayName} — ${email}`
                : displayName
            }
          >
            {/* ----------------------------------------------
                AVATAR
                ---------------------------------------------- */}

            <span
              className="gestionnaire-app-header__avatar"
              aria-hidden="true"
            >
              {avatarUrl ? (
                /*
                 * On utilise volontairement img ici.
                 *
                 * Plus tard, l'avatar peut venir d'un domaine
                 * externe ou d'un stockage utilisateur.
                 *
                 * Cela évite de dépendre immédiatement d'une
                 * configuration Next Image distante.
                 */
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="gestionnaire-app-header__avatar-image"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span>
                  {initials}
                </span>
              )}
            </span>


            {/* ----------------------------------------------
                PROFILE TEXT
                ---------------------------------------------- */}

            <span className="gestionnaire-app-header__profile-copy">
              <strong>
                {displayName}
              </strong>

              {email ? (
                <span>
                  {email}
                </span>
              ) : null}
            </span>


            {/* ----------------------------------------------
                PROFILE CHEVRON
                ---------------------------------------------- */}

            <ChevronDown
              className="gestionnaire-app-header__profile-chevron"
              size={16}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Link>
        </div>


        {/* ====================================================
            MOBILE SEARCH BUTTON

            Le bouton est déjà prévu visuellement par le shell.

            La véritable recherche mobile / popover sera reliée
            lorsque le moteur de recherche Gestionnaire sera
            développé.

            Il n'introduit aucune fausse recherche métier ici.
            ==================================================== */}

        <button
          type="button"
          className="gestionnaire-app-header__mobile-search-button"
          aria-label="Ouvrir la recherche"
          title="Rechercher"
        >
          <Search
            size={21}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}