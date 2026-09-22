import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";

import GestionnaireAuthHeader from "@/components/gestionnaire/auth/GestionnaireAuthHeader";

import "./gestionnaire-auth.css";


/* ============================================================
   COSMETICS EMPIRE
   AUTH LAYOUT — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/layout.tsx

   RESPONSABILITÉ :

   Ce layout constitue l'architecture commune des pages
   d'authentification Gestionnaire.

   Routes concernées :

   /gestionnaire/inscription
   /gestionnaire/verification
   /gestionnaire/connexion

   Le groupe de routes "(auth)" n'apparaît PAS dans l'URL.

   Exemple :

   src/app/gestionnaire/(auth)/inscription/page.tsx

   donne :

   /gestionnaire/inscription


   ARCHITECTURE :

   GestionnaireAuthLayout
   │
   ├── GestionnaireAuthHeader
   │   ├── Logo officiel L&E
   │   └── Se connecter
   │
   └── Main
       └── {children}


   IMPORTANT :

   Ce layout NE DOIT PAS contenir :

   - la Sidebar Gestionnaire ;
   - le Header du Dashboard ;
   - les menus Produits / Stock / Commandes ;
   - des données fictives ;
   - de logique d'inscription ;
   - de logique OTP ;
   - de code représentant ;
   - de secret ;
   - de logique de base de données.

   Ces responsabilités sont séparées dans les composants,
   Server Actions et services serveur dédiés.

   Le shell privé reste géré séparément dans :

   src/app/gestionnaire/(espace-prive)/layout.tsx
   ============================================================ */


/* ============================================================
   METADATA
   ------------------------------------------------------------
   Les pages d'authentification Gestionnaire sont des pages
   techniques de création / accès au compte.

   Elles ne doivent pas être indexées par les moteurs de
   recherche.
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default: "Espace Gestionnaire",
    template: "%s | L&E Cosmetics",
  },

  description:
    "Accès professionnel à l’espace Gestionnaire L&E Cosmetics Empire.",

  robots: {
    index: false,
    follow: false,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};


/* ============================================================
   TYPES
   ============================================================ */

type GestionnaireAuthLayoutProps =
  Readonly<{
    children: ReactNode;
  }>;


/* ============================================================
   LAYOUT
   ============================================================ */

export default function GestionnaireAuthLayout({
  children,
}: GestionnaireAuthLayoutProps) {
  return (
    <div
      className="gestionnaire-auth"
      data-app-space="gestionnaire-auth"
    >
      {/* ======================================================
          AUTH HEADER

          Header volontairement simple :

          Logo L&E                         Se connecter

          Il est partagé par les pages Auth.
          ====================================================== */}

      <GestionnaireAuthHeader />


      {/* ======================================================
          AUTH MAIN CONTENT

          Les différentes pages injectent uniquement leur
          contenu :

          inscription
          verification
          connexion

          Le layout conserve toujours les mêmes dimensions,
          espacements et règles responsive.
          ====================================================== */}

      <main
        id="gestionnaire-auth-main"
        className="gestionnaire-auth__main"
      >
        <div className="gestionnaire-auth__content">
          {children}
        </div>
      </main>
    </div>
  );
}