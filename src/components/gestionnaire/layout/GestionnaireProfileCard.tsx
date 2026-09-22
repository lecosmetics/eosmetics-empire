"use client";

import Link from "next/link";

import {
  ChevronRight,
  LogOut,
  MapPin,
} from "lucide-react";

import {
  gestionnaireShellConfig,
} from "@/config/gestionnaire-navigation";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE PROFILE CARD
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/layout/
   GestionnaireProfileCard.tsx

   RESPONSABILITÉ :

   Ce composant représente la zone Profil située en bas de la
   navigation Gestionnaire.

   Il est utilisé dans :

   - la Sidebar desktop ;
   - le Drawer mobile.

   Il affiche, lorsque les données sont disponibles :

   - avatar réel ;
   - ou initiales ;
   - nom du gestionnaire / boutique ;
   - adresse e-mail ;
   - localisation ;
   - accès au profil ;
   - bouton de déconnexion.

   IMPORTANT :

   Aucune donnée métier fictive n'est enregistrée ici.

   Les vraies informations seront fournies plus tard par la
   session authentifiée du gestionnaire.

   Le composant reste donc compatible avec la future
   authentification sans devoir être reconstruit.
   ============================================================ */


/* ============================================================
   PROFILE TYPE
   ------------------------------------------------------------
   Ce type constitue la structure commune utilisée par :

   - GestionnaireProfileCard ;
   - GestionnaireAppHeader ;
   - GestionnaireSidebar ;
   - GestionnaireMobileDrawer ;
   - GestionnaireShell.
   ============================================================ */

export type GestionnaireProfile =
  Readonly<{
    /*
     * Nom affiché du gestionnaire, représentant ou boutique.
     */
    displayName?: string | null;

    /*
     * Adresse e-mail du gestionnaire connecté.
     */
    email?: string | null;

    /*
     * Localisation lisible.
     *
     * Exemple :
     * Yaoundé, Cameroun
     */
    location?: string | null;

    /*
     * URL de l'avatar si une photo existe.
     */
    avatarUrl?: string | null;

    /*
     * Initiales éventuellement fournies directement
     * par le backend.
     */
    initials?: string | null;
  }>;


/* ============================================================
   COMPONENT PROPS
   ============================================================ */

type GestionnaireProfileCardProps =
  Readonly<{
    /*
     * Profil du gestionnaire connecté.
     */
    profile?: GestionnaireProfile;

    /*
     * Appelé lorsqu'une navigation est effectuée.
     *
     * Sur mobile, cela permet notamment de fermer
     * automatiquement le Drawer.
     */
    onNavigate?: () => void;

    /*
     * Action de déconnexion.
     *
     * Elle sera reliée plus tard au véritable système
     * d'authentification.
     */
    onLogout?: () => void;
  }>;


/* ============================================================
   PROFILE INITIALS
   ------------------------------------------------------------
   Priorité :

   1. profile.initials
   2. profile.displayName
   3. fallback neutre L&E

   Aucun faux nom de gestionnaire n'est créé.
   ============================================================ */

function getInitials(
  profile?: GestionnaireProfile,
): string {
  const explicitInitials =
    profile?.initials
      ?.trim()
      .replace(/\s+/g, "");

  if (explicitInitials) {
    return explicitInitials
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

export default function GestionnaireProfileCard({
  profile,
  onNavigate,
  onLogout,
}: GestionnaireProfileCardProps) {
  /* ----------------------------------------------------------
     GLOBAL CONFIGURATION
     ---------------------------------------------------------- */

  const {
    brand,
    logoutLabel,
  } = gestionnaireShellConfig;


  /* ----------------------------------------------------------
     NORMALIZED PROFILE VALUES
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
     ACCESSIBILITY LABEL
     ---------------------------------------------------------- */

  const profileAriaLabel =
    `Ouvrir le profil de ${displayName}`;


  /* ==========================================================
     LOGOUT
     ----------------------------------------------------------
     Le callback reste optionnel tant que le véritable système
     d'authentification n'est pas encore branché.
     ========================================================== */

  const handleLogout = () => {
    onLogout?.();
  };


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="gestionnaire-profile-card">
      {/* ======================================================
          PROFILE LINK
          ====================================================== */}

      <Link
        href="/gestionnaire/profil"
        className="gestionnaire-profile-card__identity"
        aria-label={
          profileAriaLabel
        }
        title={
          email
            ? `${displayName} — ${email}`
            : displayName
        }
        onClick={
          onNavigate
        }
      >
        {/* ====================================================
            AVATAR
            ==================================================== */}

        <span
          className="gestionnaire-profile-card__avatar"
          aria-hidden="true"
        >
          {avatarUrl ? (
            /*
             * L'avatar peut plus tard provenir d'un stockage
             * distant.
             *
             * Un <img> simple évite de dépendre dès maintenant
             * d'une configuration images.remotePatterns dans
             * next.config.ts.
             */

            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="gestionnaire-profile-card__avatar-image"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span>
              {initials}
            </span>
          )}


          {/* --------------------------------------------------
              STATUS DECORATION

              Préparé visuellement pour l'état du compte.
              La logique réelle pourra être connectée plus tard.
              -------------------------------------------------- */}

          <span className="gestionnaire-profile-card__status" />
        </span>


        {/* ====================================================
            PROFILE DETAILS
            ==================================================== */}

        <span className="gestionnaire-profile-card__details">
          {/* --------------------------------------------------
              NAME
              -------------------------------------------------- */}

          <strong className="gestionnaire-profile-card__name">
            {displayName}
          </strong>


          {/* --------------------------------------------------
              EMAIL
              -------------------------------------------------- */}

          {email ? (
            <span
              className="gestionnaire-profile-card__email"
              title={email}
            >
              {email}
            </span>
          ) : null}


          {/* --------------------------------------------------
              LOCATION
              -------------------------------------------------- */}

          {location ? (
            <span
              className="gestionnaire-profile-card__location"
              title={location}
            >
              <MapPin
                size={14}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                {location}
              </span>
            </span>
          ) : null}
        </span>


        {/* ====================================================
            PROFILE CHEVRON
            ==================================================== */}

        <ChevronRight
          className="gestionnaire-profile-card__chevron"
          size={19}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </Link>


      {/* ======================================================
          LOGOUT
          ------------------------------------------------------
          Le bouton reste secondaire visuellement.

          Il n'utilise pas le gros bouton magenta principal afin
          de conserver la hiérarchie prévue dans les maquettes.
          ====================================================== */}

      <button
        type="button"
        className="gestionnaire-profile-card__logout"
        aria-label={
          logoutLabel
        }
        title={
          logoutLabel
        }
        onClick={
          handleLogout
        }
      >
        <LogOut
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />

        <span>
          {logoutLabel}
        </span>
      </button>
    </div>
  );
}