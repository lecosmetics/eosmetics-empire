import Image from "next/image";
import Link from "next/link";

import {
  UserRound,
} from "lucide-react";


/* ============================================================
   COSMETICS EMPIRE
   AUTH HEADER — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/auth/GestionnaireAuthHeader.tsx

   UTILISÉ PAR :

   src/app/gestionnaire/(auth)/layout.tsx

   Routes concernées :

   /gestionnaire/inscription
   /gestionnaire/verification
   /gestionnaire/connexion


   OBJECTIF :

   Afficher uniquement :

   Logo Cosmetics Empire                 Se connecter

   Ce header est volontairement minimal.

   IL NE DOIT PAS CONTENIR :

   - la navigation du site public ;
   - la sidebar Gestionnaire ;
   - les menus du dashboard ;
   - un menu mobile ;
   - une barre de recherche ;
   - des notifications ;
   - un profil connecté ;
   - des informations marketing.

   L'utilisateur se trouve dans un parcours d'authentification.
   ============================================================ */


/* ============================================================
   ROUTES
   ------------------------------------------------------------
   Ces routes sont volontairement limitées aux destinations
   utilisées directement par ce composant.

   Elles pourront ensuite être reliées à src/config/routes.ts
   lorsque ce fichier sera mis à jour avec l'ensemble du bloc
   Auth Gestionnaire.
   ============================================================ */

const GESTIONNAIRE_HOME_ROUTE =
  "/gestionnaire";

const GESTIONNAIRE_LOGIN_ROUTE =
  "/gestionnaire/connexion";


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireAuthHeader() {
  return (
    <header
      className="gestionnaire-auth-header"
      aria-label="En-tête de l’espace Gestionnaire"
    >
      <div className="gestionnaire-auth-header__inner">
        {/* ====================================================
            BRAND / LOGO
            ----------------------------------------------------
            Le logo officiel est utilisé directement depuis :

            public/logos/logo.png

            Il ne doit jamais être étiré ou déformé.

            Le CSS associé utilise une largeur contrôlée et
            conserve automatiquement son ratio.
            ==================================================== */}

        <Link
          href={GESTIONNAIRE_HOME_ROUTE}
          className="gestionnaire-auth-header__brand"
          aria-label="L&E Cosmetics Empire — Retour à l’espace Gestionnaire"
        >
          <span className="gestionnaire-auth-header__logo-wrapper">
            <Image
              src="/logos/logo.png"
              alt="L&E Cosmetics Empire"
              width={300}
              height={200}
              className="gestionnaire-auth-header__logo"
              loading="eager"
            />
          </span>
        </Link>


        {/* ====================================================
            LOGIN
            ----------------------------------------------------
            Une seule action est affichée à droite.

            Destination :

            /gestionnaire/connexion
            ==================================================== */}

        <Link
          href={GESTIONNAIRE_LOGIN_ROUTE}
          className="gestionnaire-auth-header__login"
        >
          <UserRound
            size={20}
            strokeWidth={1.8}
            aria-hidden="true"
          />

          <span>
            Se connecter
          </span>
        </Link>
      </div>
    </header>
  );
}