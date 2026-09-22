"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ShieldCheck,
} from "lucide-react";

import {
  gestionnaireShellConfig,
} from "@/config/gestionnaire-navigation";

import GestionnaireNavigation from "./GestionnaireNavigation";

import GestionnaireProfileCard, {
  type GestionnaireProfile,
} from "./GestionnaireProfileCard";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE SIDEBAR CONTENT
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/layout/
   GestionnaireSidebarContent.tsx

   RESPONSABILITÉ :

   Ce composant contient le contenu partagé de la navigation
   permanente de l'espace privé Gestionnaire.

   Il est utilisé par :

   - GestionnaireSidebar.tsx
     → version desktop / laptop ;

   - GestionnaireMobileDrawer.tsx
     → version tablette / mobile.

   L'objectif est d'éviter toute duplication entre :

   SIDEBAR DESKTOP
   +
   DRAWER MOBILE.

   Le contenu reste donc strictement identique :

   ┌───────────────────────────────┐
   │ Logo                          │
   │ L&E Cosmetics                 │
   │ Espace Gestionnaire           │
   │                               │
   │ [ Espace sécurisé ]           │
   │                               │
   │ ----------------------------- │
   │                               │
   │ Tableau de bord               │
   │ Produits                      │
   │   Ajouter un produit          │
   │   Mes produits                │
   │   Catalogue L&E               │
   │ Stock                         │
   │ Commandes                     │
   │ Clients                       │
   │ Livraisons                    │
   │ Mes statistiques              │
   │ Promotions                    │
   │                               │
   │ ----------------------------- │
   │                               │
   │ Mon profil                    │
   │ Paramètres                    │
   │                               │
   │ ----------------------------- │
   │                               │
   │ Profil gestionnaire           │
   │ Se déconnecter                │
   └───────────────────────────────┘

   IMPORTANT :

   Ce composant ne contient :

   - aucune donnée métier ;
   - aucun utilisateur fictif ;
   - aucune route codée manuellement ;
   - aucune logique d'authentification ;
   - aucune logique spécifique desktop/mobile.

   Les routes viennent de :

   src/config/gestionnaire-navigation.ts

   Le responsive vient de :

   gestionnaire-app.css

   Les données du gestionnaire viendront plus tard de la
   session authentifiée.
   ============================================================ */


/* ============================================================
   TYPES
   ============================================================ */

type GestionnaireSidebarContentProps =
  Readonly<{
    /*
     * Profil du gestionnaire actuellement connecté.
     *
     * Plus tard :
     * ces données seront fournies par la session serveur.
     */
    profile?: GestionnaireProfile;

    /*
     * Callback exécuté lorsqu'un lien de navigation est choisi.
     *
     * Principalement utilisé par le Drawer mobile afin de
     * fermer automatiquement le menu après navigation.
     *
     * Sur desktop, cette propriété peut rester absente.
     */
    onNavigate?: () => void;

    /*
     * Action réelle de déconnexion.
     *
     * Elle sera branchée au système d'authentification lorsque
     * celui-ci sera développé.
     */
    onLogout?: () => void;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireSidebarContent({
  profile,
  onNavigate,
  onLogout,
}: GestionnaireSidebarContentProps) {
  /* ----------------------------------------------------------
     GLOBAL SHELL CONFIGURATION
     ---------------------------------------------------------- */

  const {
    brand,
    secureBadgeLabel,
  } = gestionnaireShellConfig;


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="gestionnaire-sidebar-content">
      {/* ======================================================
          TOP AREA

          Contient :
          - logo ;
          - identité ;
          - badge sécurité.
          ====================================================== */}

      <div className="gestionnaire-sidebar-content__top">
        {/* ====================================================
            BRAND
            ==================================================== */}

        <Link
          href="/gestionnaire/dashboard"
          className="gestionnaire-sidebar-brand"
          aria-label={`${brand.name} — Tableau de bord Gestionnaire`}
          onClick={onNavigate}
        >
          {/* --------------------------------------------------
              OFFICIAL LOGO
              -------------------------------------------------- */}

          <span
            className="gestionnaire-sidebar-brand__logo"
            aria-hidden="true"
          >
            <Image
              src={brand.logo}
              alt=""
              width={58}
              height={58}
              loading="eager"
              quality={90}
              className="gestionnaire-sidebar-brand__logo-image"
            />
          </span>


          {/* --------------------------------------------------
              BRAND TEXT
              -------------------------------------------------- */}

          <span className="gestionnaire-sidebar-brand__text">
            <strong>
              {brand.name}
            </strong>

            <span>
              {brand.subtitle}
            </span>
          </span>
        </Link>


        {/* ====================================================
            SECURE SPACE BADGE
            ==================================================== */}

        <div
          className="gestionnaire-sidebar-secure"
          role="status"
          aria-label={secureBadgeLabel}
        >
          <ShieldCheck
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />

          <span>
            {secureBadgeLabel}
          </span>
        </div>
      </div>


      {/* ======================================================
          TOP SEPARATOR
          ====================================================== */}

      <div
        className="gestionnaire-sidebar-content__divider"
        aria-hidden="true"
      />


      {/* ======================================================
          NAVIGATION AREA

          Cette zone peut défiler indépendamment si la hauteur
          disponible devient insuffisante.

          Le profil reste donc disponible en bas.
          ====================================================== */}

      <div className="gestionnaire-sidebar-content__navigation">
        <GestionnaireNavigation
          onNavigate={onNavigate}
        />
      </div>


      {/* ======================================================
          FOOTER AREA

          Contient :
          - informations du gestionnaire ;
          - localisation si disponible ;
          - avatar ou initiales ;
          - bouton de déconnexion.
          ====================================================== */}

      <div className="gestionnaire-sidebar-content__footer">
        <GestionnaireProfileCard
          profile={profile}
          onNavigate={onNavigate}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
}