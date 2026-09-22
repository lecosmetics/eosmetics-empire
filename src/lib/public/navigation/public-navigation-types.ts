/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * NAVIGATION PUBLIQUE — TYPES
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/navigation/public-navigation-types.ts
 *
 *
 * RESPONSABILITÉS :
 *
 * - centraliser les contrats TypeScript de la navigation publique ;
 * - typer les liens fixes du site ;
 * - typer les catégories réellement récupérées depuis la base ;
 * - typer la navigation desktop ;
 * - typer le drawer mobile ;
 * - typer la barre de navigation mobile fixe ;
 * - typer les compteurs réels du panier / commandes si disponibles ;
 * - fournir des données sérialisables aux Client Components ;
 * - éviter de dupliquer les mêmes interfaces dans plusieurs composants.
 *
 *
 * CE FICHIER NE DOIT PAS :
 *
 * - importer React ;
 * - importer Next.js ;
 * - importer Prisma ;
 * - lire la base de données ;
 * - lire une session ;
 * - contenir de JSX ;
 * - contenir des catégories fictives ;
 * - contenir des compteurs fictifs ;
 * - contenir les coordonnées de contact ;
 * - contenir le logo.
 *
 * Les informations de marque et de contact restent dans :
 *
 * src/config/public-site.ts
 *
 * ============================================================================
 */


/* ==========================================================================
   IDENTIFIANTS DE NAVIGATION
   ========================================================================== */

/**
 * Identifiants stables des grandes destinations publiques.
 *
 * Ils permettent notamment :
 *
 * - d'identifier l'onglet actif ;
 * - de sélectionner une icône dans les composants ;
 * - de conserver une navigation cohérente entre desktop et mobile.
 */

export type PublicNavigationId =
  | "home"
  | "products"
  | "categories"
  | "new-products"
  | "promotions"
  | "cart"
  | "orders"
  | "account"
  | "favorites"
  | "contact"
  | "help";


/* ==========================================================================
   IDENTIFIANTS D'ICÔNES
   ========================================================================== */

/**
 * Le fichier de types ne dépend volontairement pas de lucide-react.
 *
 * Les composants visuels traduiront ces identifiants vers les véritables
 * composants d'icônes.
 */

export type PublicNavigationIconId =
  | "home"
  | "grid"
  | "shopping-cart"
  | "package"
  | "user"
  | "heart"
  | "sparkles"
  | "badge-percent"
  | "search"
  | "menu"
  | "map-pin"
  | "phone"
  | "message-circle"
  | "mail"
  | "circle-help";


/* ==========================================================================
   TYPE DE LIEN
   ========================================================================== */

/**
 * Un lien peut être :
 *
 * INTERNAL
 * ----------
 * Navigation gérée par Next.js à l'intérieur du site.
 *
 * EXTERNAL
 * ----------
 * Navigation vers un service ou un domaine externe.
 */

export type PublicNavigationLinkType =
  | "INTERNAL"
  | "EXTERNAL";


/* ==========================================================================
   STRATÉGIE D'ACTIVATION
   ========================================================================== */

/**
 * EXACT
 * -----
 * Le lien est actif uniquement si pathname === href.
 *
 * PREFIX
 * ------
 * Le lien reste actif sur ses sous-routes.
 *
 * Exemple :
 *
 * /produits
 * /produits/serum-visage
 *
 * peuvent partager le même état actif.
 */

export type PublicNavigationMatchMode =
  | "EXACT"
  | "PREFIX";


/* ==========================================================================
   LIEN DE NAVIGATION GÉNÉRIQUE
   ========================================================================== */

export interface PublicNavigationLink {
  readonly id:
    PublicNavigationId;

  readonly label:
    string;

  readonly href:
    string;

  readonly icon:
    PublicNavigationIconId;

  readonly linkType:
    PublicNavigationLinkType;

  readonly matchMode:
    PublicNavigationMatchMode;

  /**
   * Label compact facultatif.
   *
   * Principalement utile sur mobile lorsque l'espace est limité.
   */
  readonly shortLabel?:
    string;

  /**
   * Permet de retirer proprement un lien de l'interface sans modifier
   * la structure des composants.
   */
  readonly enabled:
    boolean;
}


/* ==========================================================================
   CATÉGORIE PUBLIQUE
   ========================================================================== */

/**
 * Les catégories sont alimentées par ProductCategory.
 *
 * On conserve uniquement les informations nécessaires à la navigation
 * publique.
 *
 * Aucune structure Prisma n'est envoyée directement au navigateur.
 */

export interface PublicNavigationCategory {
  readonly id:
    string;

  readonly name:
    string;

  readonly slug:
    string;

  readonly href:
    string;
}


/* ==========================================================================
   NAVIGATION DESKTOP PRINCIPALE
   ========================================================================== */

/**
 * Élément affiché dans la grande barre de navigation desktop.
 *
 * Une entrée fixe peut être :
 *
 * Accueil
 * Tous les produits
 * Nouveautés
 * Promotions
 *
 * Les catégories dynamiques restent séparées dans `categories`.
 */

export interface PublicDesktopNavigationItem
  extends PublicNavigationLink {
  /**
   * Ordre stable d'affichage.
   */
  readonly order:
    number;
}


/* ==========================================================================
   ACTION DU HEADER DESKTOP
   ========================================================================== */

/**
 * Actions situées à droite de la recherche desktop.
 *
 * Exemple fonctionnel :
 *
 * - Compte
 * - Favoris
 * - Commandes
 * - Panier
 *
 * Les compteurs ne sont pas stockés ici.
 */

export interface PublicHeaderAction
  extends PublicNavigationLink {
  readonly order:
    number;

  /**
   * Détermine si cette action peut afficher un badge numérique lorsqu'une
   * vraie valeur est disponible.
   *
   * Aucun badge 0 ne doit être inventé.
   */
  readonly supportsBadge:
    boolean;
}


/* ==========================================================================
   MENU MOBILE / DRAWER
   ========================================================================== */

/**
 * Le drawer mobile peut contenir plus de destinations que la barre
 * de navigation basse.
 */

export interface PublicMobileDrawerItem
  extends PublicNavigationLink {
  readonly order:
    number;
}


/* ==========================================================================
   BARRE MOBILE FIXE
   ========================================================================== */

/**
 * Navigation fixe située en bas de l'écran mobile.
 *
 * Architecture actuellement retenue :
 *
 * 1. Accueil
 * 2. Produits
 * 3. Panier
 * 4. Commandes
 * 5. Compte
 */

export type PublicMobileBottomNavigationId =
  | "home"
  | "products"
  | "cart"
  | "orders"
  | "account";


export interface PublicMobileBottomNavigationItem {
  readonly id:
    PublicMobileBottomNavigationId;

  readonly label:
    string;

  readonly href:
    string;

  readonly icon:
    PublicNavigationIconId;

  readonly matchMode:
    PublicNavigationMatchMode;

  readonly order:
    number;

  readonly enabled:
    boolean;

  /**
   * Seuls certains éléments peuvent recevoir un compteur réel.
   *
   * Par exemple :
   *
   * - Panier ;
   * - Commandes.
   */
  readonly supportsBadge:
    boolean;
}


/* ==========================================================================
   COMPTEURS DE NAVIGATION
   ========================================================================== */

/**
 * Les compteurs restent séparés de la configuration de navigation.
 *
 * Cela permet de conserver une configuration statique sans injecter de
 * fausses valeurs.
 *
 * null signifie :
 *
 * "aucune valeur réelle disponible — ne rien afficher".
 *
 * 0 signifie :
 *
 * "la vraie valeur est connue et vaut zéro".
 *
 * Les composants pourront néanmoins choisir de masquer visuellement zéro
 * afin d'éviter les badges inutiles.
 */

export interface PublicNavigationBadges {
  readonly cart:
    number | null;

  readonly orders:
    number | null;

  readonly favorites:
    number | null;
}


/* ==========================================================================
   DONNÉES DE NAVIGATION PUBLIQUE
   ========================================================================== */

/**
 * DTO principal retourné plus tard par :
 *
 * src/lib/public/navigation/public-navigation-query.ts
 *
 * Il contient uniquement des valeurs sérialisables.
 */

export interface PublicNavigationData {
  /**
   * Liens fixes de la navigation desktop.
   */
  readonly desktopNavigation:
    readonly PublicDesktopNavigationItem[];

  /**
   * Actions du header desktop.
   */
  readonly headerActions:
    readonly PublicHeaderAction[];

  /**
   * Navigation du drawer mobile.
   */
  readonly mobileDrawer:
    readonly PublicMobileDrawerItem[];

  /**
   * Les cinq éléments fixes de la barre basse mobile.
   */
  readonly mobileBottomNavigation:
    readonly PublicMobileBottomNavigationItem[];

  /**
   * Catégories réellement actives provenant de PostgreSQL.
   */
  readonly categories:
    readonly PublicNavigationCategory[];

  /**
   * Compteurs éventuellement disponibles.
   *
   * Ils restent null tant qu'aucune source métier réelle n'est branchée.
   */
  readonly badges:
    PublicNavigationBadges;
}


/* ==========================================================================
   VALEURS DE BADGES VIDES
   ========================================================================== */

/**
 * Valeur sûre utilisée tant que panier, compte client, commandes ou favoris
 * ne fournissent pas encore de compteurs réels.
 *
 * IMPORTANT :
 *
 * null !== 0
 *
 * null veut dire :
 *
 * "ne pas afficher de badge".
 */

export const EMPTY_PUBLIC_NAVIGATION_BADGES = {
  cart:
    null,

  orders:
    null,

  favorites:
    null,
} as const satisfies PublicNavigationBadges;


/* ==========================================================================
   VALIDATION DES COMPTEURS
   ========================================================================== */

/**
 * Protection légère côté interface.
 *
 * Un compteur :
 *
 * - doit être un entier ;
 * - doit être positif ou nul ;
 * - ne doit jamais devenir NaN ou Infinity.
 */

export function normalizePublicNavigationBadge(
  value:
    unknown,
): number | null {
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
    Math.floor(
      value,
    );


  if (
    normalized <
    0
  ) {
    return null;
  }


  return normalized;
}


/* ==========================================================================
   BADGE VISIBLE
   ========================================================================== */

/**
 * Par défaut, un badge n'est affiché que si la vraie valeur est supérieure
 * à zéro.
 *
 * Cela évite précisément les faux badges "0" visibles sur certaines
 * maquettes.
 */

export function hasVisiblePublicNavigationBadge(
  value:
    number | null,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isInteger(
      value,
    ) &&
    value >
      0
  );
}


/* ==========================================================================
   CATEGORY GUARD
   ========================================================================== */

/**
 * Garde TypeScript utile lorsqu'une catégorie doit être contrôlée après une
 * transformation de données.
 */

export function isPublicNavigationCategory(
  value:
    unknown,
): value is PublicNavigationCategory {
  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return false;
  }


  const candidate =
    value as Partial<
      PublicNavigationCategory
    >;


  return (
    typeof candidate.id ===
      "string" &&
    candidate.id.trim().length >
      0 &&
    typeof candidate.name ===
      "string" &&
    candidate.name.trim().length >
      0 &&
    typeof candidate.slug ===
      "string" &&
    candidate.slug.trim().length >
      0 &&
    typeof candidate.href ===
      "string" &&
    candidate.href.trim().length >
      0
  );
}


/* ==========================================================================
   LINK GUARD
   ========================================================================== */

export function isPublicNavigationLink(
  value:
    unknown,
): value is PublicNavigationLink {
  if (
    typeof value !==
      "object" ||
    value ===
      null
  ) {
    return false;
  }


  const candidate =
    value as Partial<
      PublicNavigationLink
    >;


  return (
    typeof candidate.id ===
      "string" &&
    typeof candidate.label ===
      "string" &&
    candidate.label.trim().length >
      0 &&
    typeof candidate.href ===
      "string" &&
    candidate.href.trim().length >
      0 &&
    typeof candidate.icon ===
      "string" &&
    (
      candidate.linkType ===
        "INTERNAL" ||
      candidate.linkType ===
        "EXTERNAL"
    ) &&
    (
      candidate.matchMode ===
        "EXACT" ||
      candidate.matchMode ===
        "PREFIX"
    ) &&
    typeof candidate.enabled ===
      "boolean"
  );
}


/* ==========================================================================
   SORT
   ========================================================================== */

/**
 * Helper générique pour maintenir un ordre stable.
 *
 * On retourne une nouvelle liste afin de ne jamais modifier la configuration
 * source.
 */

export function sortPublicNavigationByOrder<
  T extends {
    readonly order:
      number;
  },
>(
  items:
    readonly T[],
): T[] {
  return [
    ...items,
  ].sort(
    (
      first,
      second,
    ) =>
      first.order -
      second.order,
  );
}