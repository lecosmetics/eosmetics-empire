import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./gestionnaire.css";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE ROOT LAYOUT
   ------------------------------------------------------------
   Layout racine de l'univers /gestionnaire.

   RESPONSABILITÉS :
   - charger les styles propres à l'univers Gestionnaire ;
   - définir les metadata générales de cet espace ;
   - fournir une structure racine stable aux pages enfants ;
   - préparer l'architecture pour les futures zones publiques
     d'accès et privées du gestionnaire.

   IMPORTANT :
   Le header de la page d'entrée n'est volontairement PAS
   injecté directement ici.

   Pourquoi ?
   Parce que ce layout enveloppera également les futures routes :

   /gestionnaire/connexion
   /gestionnaire/inscription
   /gestionnaire/verification
   /gestionnaire/dashboard
   etc.

   L'espace privé pourra ainsi recevoir plus tard son propre
   shell professionnel sans hériter obligatoirement du header
   de la page d'entrée.
   ============================================================ */


/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title: "Espace Gestionnaire",

  description:
    "Espace professionnel Cosmetics Empire destiné aux gestionnaires, boutiques, points de vente et représentants autorisés.",

  robots: {
    index: true,
    follow: true,
  },
};


/* ============================================================
   TYPES
   ============================================================ */

type GestionnaireLayoutProps = Readonly<{
  children: ReactNode;
}>;


/* ============================================================
   LAYOUT
   ============================================================ */

export default function GestionnaireLayout({
  children,
}: GestionnaireLayoutProps) {
  return (
    <div
      className="gestionnaire-root"
      data-app-space="gestionnaire"
    >
      {children}
    </div>
  );
}