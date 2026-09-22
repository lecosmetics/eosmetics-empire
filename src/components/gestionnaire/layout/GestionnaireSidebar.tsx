"use client";

import GestionnaireSidebarContent from "./GestionnaireSidebarContent";

import type {
  GestionnaireProfile,
} from "./GestionnaireProfileCard";


/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE SIDEBAR
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/layout/GestionnaireSidebar.tsx

   RESPONSABILITÉ :

   Ce composant représente uniquement la SIDEBAR DESKTOP
   permanente de l'espace privé Gestionnaire.

   Il sert de conteneur structurel pour :

   - l'identité L&E Cosmetics ;
   - le badge "Espace sécurisé" ;
   - la navigation principale ;
   - le sous-menu Produits ;
   - la navigation secondaire ;
   - le profil du gestionnaire ;
   - l'action de déconnexion.

   IMPORTANT :

   Le contenu réel de la sidebar n'est PAS dupliqué ici.

   Il est centralisé dans :

   GestionnaireSidebarContent.tsx

   Le même contenu pourra donc être réutilisé dans :

   - la Sidebar desktop ;
   - le Drawer mobile.

   Cela garantit que les deux versions utilisent exactement
   les mêmes menus, les mêmes routes et la même hiérarchie.

   RESPONSIVE :

   L'affichage / masquage de cette Sidebar est entièrement
   contrôlé par :

   gestionnaire-app.css

   Desktop :
   Sidebar fixe visible.

   Tablette / Mobile :
   Sidebar desktop masquée et remplacée par le Drawer mobile.

   DONNÉES :

   Aucune donnée fictive de gestionnaire n'est codée ici.

   Les données réelles seront fournies plus tard par le système
   d'authentification / session.
   ============================================================ */


/* ============================================================
   TYPES
   ============================================================ */

type GestionnaireSidebarProps = Readonly<{
  /*
   * Profil du gestionnaire connecté.
   *
   * Plus tard, ces informations proviendront de la session
   * authentifiée côté serveur.
   */
  profile?: GestionnaireProfile;

  /*
   * Action de déconnexion.
   *
   * La véritable logique sera branchée lorsque
   * l'authentification Gestionnaire sera mise en place.
   */
  onLogout?: () => void;
}>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function GestionnaireSidebar({
  profile,
  onLogout,
}: GestionnaireSidebarProps) {
  return (
    <aside
      className="gestionnaire-app-sidebar"
      aria-label="Navigation principale de l'espace Gestionnaire"
    >
      <GestionnaireSidebarContent
        profile={profile}
        onLogout={onLogout}
      />
    </aside>
  );
}