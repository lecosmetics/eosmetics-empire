import type {
  Metadata,
} from "next";

import type {
  ReactNode,
} from "react";

import GestionnaireShell from "@/components/gestionnaire/layout/GestionnaireShell";

import "./gestionnaire-app.css";


/* ============================================================
   COSMETICS EMPIRE
   ESPACE GESTIONNAIRE — LAYOUT PRIVÉ
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(espace-prive)/layout.tsx

   RESPONSABILITÉ :

   Ce layout constitue le point d'entrée commun de toutes
   les pages privées de l'espace Gestionnaire.

   Il permet de conserver automatiquement :

   - la sidebar Gestionnaire ;
   - le header de l'application ;
   - la navigation desktop ;
   - le drawer mobile ;
   - le profil Gestionnaire ;
   - les comportements responsive ;
   - la zone principale accueillant {children}.

   Exemple :

   /gestionnaire/dashboard
   /gestionnaire/produits
   /gestionnaire/produits/ajouter
   /gestionnaire/stock
   /gestionnaire/commandes
   /gestionnaire/clients
   /gestionnaire/livraisons
   /gestionnaire/statistiques
   /gestionnaire/promotions
   /gestionnaire/profil
   /gestionnaire/parametres

   Toutes ces routes utilisent automatiquement le même shell.

   IMPORTANT :

   Le groupe "(espace-prive)" n'apparaît pas dans l'URL.

   Exemple :

   src/app/gestionnaire/(espace-prive)/dashboard/page.tsx

   devient :

   /gestionnaire/dashboard

   SÉCURITÉ :

   Ce layout met actuellement en place l'architecture visuelle.

   La validation réelle de la session Gestionnaire devra être
   ajoutée ici, côté serveur, lorsque le système
   d'authentification sera construit.

   Il ne faudra jamais considérer l'affichage de ce layout
   comme une preuve d'autorisation.
   ============================================================ */


/* ============================================================
   METADATA
   ------------------------------------------------------------
   L'espace Gestionnaire est un espace applicatif privé.

   Il ne doit pas être indexé par les moteurs de recherche.
   ============================================================ */

export const metadata: Metadata = {
  title: {
    default: "Espace Gestionnaire",
    template: "%s | L&E Cosmetics",
  },

  description:
    "Espace professionnel de gestion L&E Cosmetics Empire.",

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

type GestionnairePrivateLayoutProps =
  Readonly<{
    children: ReactNode;
  }>;


/* ============================================================
   PRIVATE LAYOUT
   ============================================================ */

export default function GestionnairePrivateLayout({
  children,
}: GestionnairePrivateLayoutProps) {
  return (
    <GestionnaireShell>
      {children}
    </GestionnaireShell>
  );
}