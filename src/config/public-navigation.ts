import {
  generalAppRoutes,
  publicRouteBuilders,
} from "@/config/routes";

import type {
  PublicDesktopNavigationItem,
  PublicHeaderAction,
  PublicMobileBottomNavigationItem,
  PublicMobileDrawerItem,
} from "@/lib/public/navigation/public-navigation-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * NAVIGATION PUBLIQUE — CONFIGURATION
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/public-navigation.ts
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - centraliser la configuration du shell public ;
 * - utiliser src/config/routes.ts comme source unique des routes ;
 * - centraliser les liens fixes du menu desktop ;
 * - centraliser les actions du header ;
 * - centraliser le drawer mobile ;
 * - centraliser les 5 boutons de navigation mobile ;
 * - fournir l'accès à la page générale des catégories ;
 * - construire les routes dynamiques de catégories ;
 * - construire les routes publiques des offres StoreProduct ;
 * - construire la route de recherche avec son query parameter ;
 * - fournir une configuration strictement typée ;
 * - éviter toute duplication inutile d'URL.
 *
 * ============================================================================
 *
 * SOURCE UNIQUE DES ROUTES :
 *
 * src/config/routes.ts
 *
 * ============================================================================
 *
 * ARCHITECTURE PRODUITS PUBLIQUE
 *
 * Catalogue :
 *
 * /produits
 *
 * Détail d'une offre StoreProduct :
 *
 * /p/[qrToken]
 *
 * construit exclusivement avec :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * ARCHITECTURE CATÉGORIES
 *
 * Toutes les catégories :
 *
 * /categories
 *
 * Produits d'une catégorie :
 *
 * /categories/[slug]
 *
 * construit exclusivement avec :
 *
 * publicRouteBuilders.categoryBySlug(slug)
 *
 * ============================================================================
 *
 * PANIER :
 *
 * Route publique :
 *
 * /panier
 *
 * IMPORTANT :
 *
 * Certains identifiants techniques historiques du shell restent :
 *
 * CART
 *
 * id: "cart"
 *
 * icon: "shopping-cart"
 *
 * Ils sont conservés volontairement afin de ne pas casser :
 *
 * - les types existants ;
 * - les composants existants ;
 * - les mappings d'icônes existants ;
 * - les conditions existantes.
 *
 * La route métier reste néanmoins :
 *
 * /panier
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier ne contient :
 *
 * - aucun composant React ;
 * - aucune icône React ;
 * - aucun accès Prisma ;
 * - aucune lecture de session ;
 * - aucun compteur fictif ;
 * - aucune catégorie ProductCategory codée en dur ;
 * - aucune donnée Product ;
 * - aucune donnée StoreProduct ;
 * - aucune donnée Store ;
 * - aucun prix ;
 * - aucun stock ;
 * - aucune construction manuelle de route dynamique produit ;
 * - aucune construction manuelle de route dynamique catégorie.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. ROUTES PUBLIQUES UTILISÉES PAR LE SHELL
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * Cette configuration ne possède plus ses propres URLs statiques.
 *
 * Chaque route ci-dessous est directement reliée à :
 *
 * src/config/routes.ts
 *
 * Cela évite d'avoir :
 *
 * routes.ts
 *
 * ET
 *
 * public-navigation.ts
 *
 * contenant deux valeurs différentes pour une même route.
 */
export const PUBLIC_NAVIGATION_ROUTES = {
  /* ------------------------------------------------------------------------
     HOME
     ------------------------------------------------------------------------ */

  HOME:
    generalAppRoutes.home,


  /* ------------------------------------------------------------------------
     PRODUCTS
     ------------------------------------------------------------------------ */

  PRODUCTS:
    generalAppRoutes.products,


  /* ------------------------------------------------------------------------
     SEARCH
     ------------------------------------------------------------------------ */

  SEARCH:
    generalAppRoutes.search,


  /* ------------------------------------------------------------------------
     CATEGORIES
     ------------------------------------------------------------------------ */

  CATEGORIES:
    generalAppRoutes.categories,


  /* ------------------------------------------------------------------------
     NEW PRODUCTS
     ------------------------------------------------------------------------ */

  NEW_PRODUCTS:
    generalAppRoutes.newProducts,


  /* ------------------------------------------------------------------------
     PROMOTIONS
     ------------------------------------------------------------------------ */

  PROMOTIONS:
    generalAppRoutes.promotions,


  /* ------------------------------------------------------------------------
     PANIER
     ------------------------------------------------------------------------
     
     Le nom CART est conservé comme identifiant technique historique
     du shell public.
     
     La vraie route métier provient désormais de :
     
     generalAppRoutes.panier
     ------------------------------------------------------------------------ */

  CART:
    generalAppRoutes.panier,


  /* ------------------------------------------------------------------------
     ORDER TRACKING
     ------------------------------------------------------------------------ */

  ORDER_TRACKING:
    generalAppRoutes.orderTracking,


  /* ------------------------------------------------------------------------
     ACCOUNT
     ------------------------------------------------------------------------ */

  ACCOUNT:
    generalAppRoutes.account,


  /* ------------------------------------------------------------------------
     FAVORITES
     ------------------------------------------------------------------------ */

  FAVORITES:
    generalAppRoutes.favorites,


  /* ------------------------------------------------------------------------
     CONTACT
     ------------------------------------------------------------------------ */

  CONTACT:
    generalAppRoutes.contact,


  /* ------------------------------------------------------------------------
     FAQ
     ------------------------------------------------------------------------ */

  FAQ:
    generalAppRoutes.faq,


  /* ------------------------------------------------------------------------
     DELIVERY
     ------------------------------------------------------------------------ */

  DELIVERY:
    generalAppRoutes.delivery,


  /* ------------------------------------------------------------------------
     TERMS
     ------------------------------------------------------------------------ */

  TERMS:
    generalAppRoutes.terms,


  /* ------------------------------------------------------------------------
     PRIVACY
     ------------------------------------------------------------------------ */

  PRIVACY:
    generalAppRoutes.privacy,
} as const;


/* ==========================================================================
   2. TYPE DE ROUTE
   ========================================================================== */

export type PublicNavigationRoute =
  (
    typeof PUBLIC_NAVIGATION_ROUTES
  )[keyof typeof PUBLIC_NAVIGATION_ROUTES];


/* ==========================================================================
   3. NAVIGATION DESKTOP PRINCIPALE
   ========================================================================== */

/**
 * Navigation fixe principale du desktop.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * "Catégories" représente ici la page générale :
 *
 * /categories
 *
 * Les vraies ProductCategory provenant de PostgreSQL restent ajoutées
 * dynamiquement par :
 *
 * src/lib/public/navigation/public-navigation-query.ts
 *
 * Il n'y a donc aucune catégorie métier codée en dur ici.
 *
 * ============================================================================
 */
export const PUBLIC_DESKTOP_NAVIGATION =
  [
    {
      id:
        "home",

      label:
        "Accueil",

      shortLabel:
        "Accueil",

      href:
        PUBLIC_NAVIGATION_ROUTES.HOME,

      icon:
        "home",

      linkType:
        "INTERNAL",

      matchMode:
        "EXACT",

      order:
        10,

      enabled:
        true,
    },

    {
      id:
        "products",

      label:
        "Tous les produits",

      shortLabel:
        "Produits",

      href:
        PUBLIC_NAVIGATION_ROUTES.PRODUCTS,

      icon:
        "grid",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        20,

      enabled:
        true,
    },

    {
      id:
        "categories",

      label:
        "Catégories",

      shortLabel:
        "Catégories",

      href:
        PUBLIC_NAVIGATION_ROUTES.CATEGORIES,

      /**
       * L'icône "grid" existe déjà dans le système d'icônes
       * de la navigation publique.
       *
       * On évite volontairement d'introduire ici un nouvel identifiant
       * d'icône non confirmé.
       */
      icon:
        "grid",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        30,

      enabled:
        true,
    },

    {
      id:
        "new-products",

      label:
        "Nouveautés",

      shortLabel:
        "Nouveautés",

      href:
        PUBLIC_NAVIGATION_ROUTES.NEW_PRODUCTS,

      icon:
        "sparkles",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        80,

      enabled:
        true,
    },

    {
      id:
        "promotions",

      label:
        "Promotions",

      shortLabel:
        "Promotions",

      href:
        PUBLIC_NAVIGATION_ROUTES.PROMOTIONS,

      icon:
        "badge-percent",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        90,

      enabled:
        true,
    },
  ] as const satisfies readonly PublicDesktopNavigationItem[];


/* ==========================================================================
   4. ACTIONS HEADER
   ========================================================================== */

/**
 * Actions affichées à droite dans le Header desktop.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * supportsBadge signifie uniquement que le composant PEUT afficher
 * un badge lorsqu'une vraie donnée est fournie.
 *
 * Aucun compteur fictif n'est défini ici.
 *
 * ============================================================================
 */
export const PUBLIC_HEADER_ACTIONS =
  [
    {
      id:
        "account",

      label:
        "Compte",

      shortLabel:
        "Compte",

      href:
        PUBLIC_NAVIGATION_ROUTES.ACCOUNT,

      icon:
        "user",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        10,

      enabled:
        true,

      supportsBadge:
        false,
    },

    {
      id:
        "favorites",

      label:
        "Favoris",

      shortLabel:
        "Favoris",

      href:
        PUBLIC_NAVIGATION_ROUTES.FAVORITES,

      icon:
        "heart",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        20,

      enabled:
        true,

      supportsBadge:
        true,
    },

    {
      id:
        "orders",

      label:
        "Commandes",

      shortLabel:
        "Commandes",

      href:
        PUBLIC_NAVIGATION_ROUTES.ORDER_TRACKING,

      icon:
        "package",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        30,

      enabled:
        true,

      supportsBadge:
        true,
    },

    {
      /**
       * Identifiant technique existant conservé pour compatibilité.
       *
       * La route réelle reste :
       *
       * /panier
       */
      id:
        "cart",

      label:
        "Panier",

      shortLabel:
        "Panier",

      href:
        PUBLIC_NAVIGATION_ROUTES.CART,

      icon:
        "shopping-cart",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        40,

      enabled:
        true,

      supportsBadge:
        true,
    },
  ] as const satisfies readonly PublicHeaderAction[];


/* ==========================================================================
   5. DRAWER MOBILE
   ========================================================================== */

/**
 * Navigation du menu hamburger mobile.
 *
 * ============================================================================
 *
 * Le drawer peut contenir davantage de liens que la barre fixe située
 * en bas de l'écran.
 *
 * ============================================================================
 */
export const PUBLIC_MOBILE_DRAWER_NAVIGATION =
  [
    {
      id:
        "home",

      label:
        "Accueil",

      shortLabel:
        "Accueil",

      href:
        PUBLIC_NAVIGATION_ROUTES.HOME,

      icon:
        "home",

      linkType:
        "INTERNAL",

      matchMode:
        "EXACT",

      order:
        10,

      enabled:
        true,
    },

    {
      id:
        "products",

      label:
        "Tous les produits",

      shortLabel:
        "Produits",

      href:
        PUBLIC_NAVIGATION_ROUTES.PRODUCTS,

      icon:
        "grid",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        20,

      enabled:
        true,
    },

    {
      id:
        "categories",

      label:
        "Toutes les catégories",

      shortLabel:
        "Catégories",

      href:
        PUBLIC_NAVIGATION_ROUTES.CATEGORIES,

      icon:
        "grid",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        30,

      enabled:
        true,
    },

    {
      id:
        "new-products",

      label:
        "Nouveautés",

      shortLabel:
        "Nouveautés",

      href:
        PUBLIC_NAVIGATION_ROUTES.NEW_PRODUCTS,

      icon:
        "sparkles",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        40,

      enabled:
        true,
    },

    {
      id:
        "promotions",

      label:
        "Promotions",

      shortLabel:
        "Promotions",

      href:
        PUBLIC_NAVIGATION_ROUTES.PROMOTIONS,

      icon:
        "badge-percent",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        50,

      enabled:
        true,
    },

    {
      id:
        "cart",

      label:
        "Mon panier",

      shortLabel:
        "Panier",

      href:
        PUBLIC_NAVIGATION_ROUTES.CART,

      icon:
        "shopping-cart",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        60,

      enabled:
        true,
    },

    {
      id:
        "orders",

      label:
        "Suivre une commande",

      shortLabel:
        "Commandes",

      href:
        PUBLIC_NAVIGATION_ROUTES.ORDER_TRACKING,

      icon:
        "package",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        70,

      enabled:
        true,
    },

    {
      id:
        "account",

      label:
        "Mon compte",

      shortLabel:
        "Compte",

      href:
        PUBLIC_NAVIGATION_ROUTES.ACCOUNT,

      icon:
        "user",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        80,

      enabled:
        true,
    },

    {
      id:
        "favorites",

      label:
        "Mes favoris",

      shortLabel:
        "Favoris",

      href:
        PUBLIC_NAVIGATION_ROUTES.FAVORITES,

      icon:
        "heart",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        90,

      enabled:
        true,
    },

    {
      id:
        "contact",

      label:
        "Contact",

      shortLabel:
        "Contact",

      href:
        PUBLIC_NAVIGATION_ROUTES.CONTACT,

      icon:
        "mail",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        100,

      enabled:
        true,
    },

    {
      id:
        "help",

      label:
        "Aide et FAQ",

      shortLabel:
        "Aide",

      href:
        PUBLIC_NAVIGATION_ROUTES.FAQ,

      icon:
        "circle-help",

      linkType:
        "INTERNAL",

      matchMode:
        "PREFIX",

      order:
        110,

      enabled:
        true,
    },
  ] as const satisfies readonly PublicMobileDrawerItem[];


/* ==========================================================================
   6. NAVIGATION MOBILE FIXE
   ========================================================================== */

/**
 * ============================================================================
 * ARCHITECTURE FIXÉE
 * ============================================================================
 *
 * La navigation mobile basse reste EXACTEMENT :
 *
 * 1. Accueil
 * 2. Produits
 * 3. Panier
 * 4. Commandes
 * 5. Compte
 *
 * ============================================================================
 *
 * Aucune :
 *
 * - catégorie ;
 * - promotion ;
 * - nouveauté ;
 * - favoris ;
 * - autre page
 *
 * ne doit ajouter un sixième bouton ici.
 *
 * ============================================================================
 */
export const PUBLIC_MOBILE_BOTTOM_NAVIGATION =
  [
    {
      id:
        "home",

      label:
        "Accueil",

      href:
        PUBLIC_NAVIGATION_ROUTES.HOME,

      icon:
        "home",

      matchMode:
        "EXACT",

      order:
        10,

      enabled:
        true,

      supportsBadge:
        false,
    },

    {
      id:
        "products",

      label:
        "Produits",

      href:
        PUBLIC_NAVIGATION_ROUTES.PRODUCTS,

      icon:
        "grid",

      matchMode:
        "PREFIX",

      order:
        20,

      enabled:
        true,

      supportsBadge:
        false,
    },

    {
      /**
       * "cart" reste l'identifiant technique existant.
       *
       * Le libellé utilisateur est bien :
       *
       * Panier
       *
       * et la route est :
       *
       * /panier
       */
      id:
        "cart",

      label:
        "Panier",

      href:
        PUBLIC_NAVIGATION_ROUTES.CART,

      icon:
        "shopping-cart",

      matchMode:
        "PREFIX",

      order:
        30,

      enabled:
        true,

      supportsBadge:
        true,
    },

    {
      id:
        "orders",

      label:
        "Commandes",

      href:
        PUBLIC_NAVIGATION_ROUTES.ORDER_TRACKING,

      icon:
        "package",

      matchMode:
        "PREFIX",

      order:
        40,

      enabled:
        true,

      supportsBadge:
        true,
    },

    {
      id:
        "account",

      label:
        "Compte",

      href:
        PUBLIC_NAVIGATION_ROUTES.ACCOUNT,

      icon:
        "user",

      matchMode:
        "PREFIX",

      order:
        50,

      enabled:
        true,

      supportsBadge:
        false,
    },
  ] as const satisfies readonly PublicMobileBottomNavigationItem[];


/* ==========================================================================
   7. SEARCH
   ========================================================================== */

/**
 * Route publique utilisée par PublicSearchForm.
 *
 * Source :
 *
 * src/config/routes.ts
 *
 * Exemple final :
 *
 * /recherche?q=serum
 */
export const PUBLIC_SEARCH_ROUTE =
  PUBLIC_NAVIGATION_ROUTES.SEARCH;


/**
 * Nom du paramètre URL de recherche.
 *
 * Il ne s'agit pas d'une route.
 */
export const PUBLIC_SEARCH_QUERY_PARAMETER =
  "q" as const;


/* ==========================================================================
   8. CATEGORY ROUTE BUILDER
   ========================================================================== */

/**
 * Construit une route de catégorie à partir du vrai slug ProductCategory.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * La construction du pathname est exclusivement déléguée à :
 *
 * src/config/routes.ts
 *
 * On ne fait donc jamais manuellement :
 *
 * /categories/${slug}
 *
 * ============================================================================
 */
export function buildPublicCategoryNavigationHref(
  slug:
    string,
): string {
  const normalizedSlug =
    slug.trim();


  /**
   * Aucun slug exploitable.
   *
   * On redirige vers la liste générale des catégories plutôt que
   * d'inventer une catégorie.
   */
  if (
    !normalizedSlug
  ) {
    return PUBLIC_NAVIGATION_ROUTES.CATEGORIES;
  }


  return publicRouteBuilders.categoryBySlug(
    normalizedSlug,
  );
}


/* ==========================================================================
   9. PRODUCT DETAIL ROUTE BUILDER
   ========================================================================== */

/**
 * Helper explicite pour construire la route canonique d'une OFFRE
 * StoreProduct.
 *
 * ============================================================================
 *
 * Catalogue :
 *
 * /produits
 *
 * ============================================================================
 *
 * Détail :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * qrToken appartient à StoreProduct.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * On ne construit jamais :
 *
 * /produits/[slug]
 *
 * ici.
 *
 * ============================================================================
 */
export function buildPublicProductDetailHref(
  qrToken:
    string,
): string {
  const normalizedQrToken =
    qrToken.trim();


  /**
   * Sans qrToken exploitable, aucune offre précise ne peut être ouverte.
   *
   * Le fallback reste donc le catalogue public.
   */
  if (
    !normalizedQrToken
  ) {
    return PUBLIC_NAVIGATION_ROUTES.PRODUCTS;
  }


  return publicRouteBuilders.productByQr(
    normalizedQrToken,
  );
}


/* ==========================================================================
   10. SEARCH ROUTE BUILDER
   ========================================================================== */

/**
 * Construit :
 *
 * /recherche?q=...
 *
 * ============================================================================
 *
 * La valeur de recherche est encodée par URLSearchParams.
 *
 * Le pathname lui-même vient toujours de src/config/routes.ts.
 *
 * ============================================================================
 */
export function buildPublicSearchHref(
  query:
    string,
): string {
  const normalizedQuery =
    query.trim();


  if (
    !normalizedQuery
  ) {
    return PUBLIC_NAVIGATION_ROUTES.SEARCH;
  }


  const searchParams =
    new URLSearchParams({
      [
        PUBLIC_SEARCH_QUERY_PARAMETER
      ]:
        normalizedQuery,
    });


  return `${PUBLIC_NAVIGATION_ROUTES.SEARCH}?${searchParams.toString()}`;
}


/* ==========================================================================
   11. FILTRAGE DES ÉLÉMENTS ACTIFS
   ========================================================================== */

/**
 * ============================================================================
 *
 * Ces helpers retournent de nouvelles collections.
 *
 * Cela évite qu'un consommateur puisse modifier accidentellement
 * les tableaux de configuration exportés plus haut.
 *
 * ============================================================================
 */

export function getEnabledPublicDesktopNavigation():
  PublicDesktopNavigationItem[] {
  return PUBLIC_DESKTOP_NAVIGATION
    .filter(
      (
        item,
      ) =>
        item.enabled,
    )
    .map(
      (
        item,
      ) => ({
        ...item,
      }),
    );
}


export function getEnabledPublicHeaderActions():
  PublicHeaderAction[] {
  return PUBLIC_HEADER_ACTIONS
    .filter(
      (
        item,
      ) =>
        item.enabled,
    )
    .map(
      (
        item,
      ) => ({
        ...item,
      }),
    );
}


export function getEnabledPublicMobileDrawerNavigation():
  PublicMobileDrawerItem[] {
  return PUBLIC_MOBILE_DRAWER_NAVIGATION
    .filter(
      (
        item,
      ) =>
        item.enabled,
    )
    .map(
      (
        item,
      ) => ({
        ...item,
      }),
    );
}


export function getEnabledPublicMobileBottomNavigation():
  PublicMobileBottomNavigationItem[] {
  return PUBLIC_MOBILE_BOTTOM_NAVIGATION
    .filter(
      (
        item,
      ) =>
        item.enabled,
    )
    .map(
      (
        item,
      ) => ({
        ...item,
      }),
    );
}


/* ==========================================================================
   12. CONFIGURATION AGRÉGÉE
   ========================================================================== */

/**
 * ============================================================================
 *
 * Les vraies ProductCategory et leurs données dynamiques ne sont PAS
 * inscrites dans cette configuration statique.
 *
 * Elles restent assemblées côté serveur dans :
 *
 * src/lib/public/navigation/public-navigation-query.ts
 *
 * ============================================================================
 */
export const PUBLIC_NAVIGATION_CONFIG = {
  /* ------------------------------------------------------------------------
     ROUTES
     ------------------------------------------------------------------------ */

  routes:
    PUBLIC_NAVIGATION_ROUTES,


  /* ------------------------------------------------------------------------
     DESKTOP
     ------------------------------------------------------------------------ */

  desktopNavigation:
    PUBLIC_DESKTOP_NAVIGATION,


  /* ------------------------------------------------------------------------
     HEADER
     ------------------------------------------------------------------------ */

  headerActions:
    PUBLIC_HEADER_ACTIONS,


  /* ------------------------------------------------------------------------
     MOBILE DRAWER
     ------------------------------------------------------------------------ */

  mobileDrawer:
    PUBLIC_MOBILE_DRAWER_NAVIGATION,


  /* ------------------------------------------------------------------------
     MOBILE BOTTOM NAV
     ------------------------------------------------------------------------ */

  mobileBottomNavigation:
    PUBLIC_MOBILE_BOTTOM_NAVIGATION,


  /* ------------------------------------------------------------------------
     SEARCH
     ------------------------------------------------------------------------ */

  search: {
    route:
      PUBLIC_SEARCH_ROUTE,

    queryParameter:
      PUBLIC_SEARCH_QUERY_PARAMETER,

    buildHref:
      buildPublicSearchHref,
  },


  /* ------------------------------------------------------------------------
     CATEGORY
     ------------------------------------------------------------------------ */

  category: {
    root:
      PUBLIC_NAVIGATION_ROUTES.CATEGORIES,

    buildHref:
      buildPublicCategoryNavigationHref,
  },


  /* ------------------------------------------------------------------------
     PRODUCTS
     ------------------------------------------------------------------------ */

  products: {
    root:
      PUBLIC_NAVIGATION_ROUTES.PRODUCTS,

    buildDetailHref:
      buildPublicProductDetailHref,
  },


  /* ------------------------------------------------------------------------
     PANIER
     ------------------------------------------------------------------------ */

  panier: {
    route:
      PUBLIC_NAVIGATION_ROUTES.CART,
  },


  /* ------------------------------------------------------------------------
     ORDERS
     ------------------------------------------------------------------------ */

  orders: {
    trackingRoute:
      PUBLIC_NAVIGATION_ROUTES.ORDER_TRACKING,
  },


  /* ------------------------------------------------------------------------
     ACCOUNT
     ------------------------------------------------------------------------ */

  account: {
    root:
      PUBLIC_NAVIGATION_ROUTES.ACCOUNT,

    favorites:
      PUBLIC_NAVIGATION_ROUTES.FAVORITES,
  },
} as const;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * SOURCE UNIQUE DES PATHNAMES :
 *
 * src/config/routes.ts
 *
 * ============================================================================
 *
 * NAVIGATION DESKTOP :
 *
 * Accueil
 * Tous les produits
 * Catégories
 * Nouveautés
 * Promotions
 *
 * ============================================================================
 *
 * DRAWER MOBILE :
 *
 * Accueil
 * Tous les produits
 * Toutes les catégories
 * Nouveautés
 * Promotions
 * Mon panier
 * Suivre une commande
 * Mon compte
 * Mes favoris
 * Contact
 * Aide et FAQ
 *
 * ============================================================================
 *
 * NAVIGATION MOBILE BASSE :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * EXACTEMENT 5 ÉLÉMENTS.
 *
 * ============================================================================
 *
 * PRODUITS :
 *
 * Catalogue :
 *
 * /produits
 *
 * Détail StoreProduct :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * CATÉGORIES :
 *
 * Catalogue catégories :
 *
 * /categories
 *
 * Produits de catégorie :
 *
 * /categories/[slug]
 *
 * ============================================================================
 *
 * PANIER :
 *
 * /panier
 *
 * ============================================================================
 *
 * RECHERCHE :
 *
 * /recherche?q=...
 *
 * ============================================================================
 *
 * AUCUN PATHNAME PUBLIC N'EST DUPLIQUÉ MANUELLEMENT DANS CE FICHIER.
 *
 * AUCUNE ROUTE DYNAMIQUE N'EST FABRIQUÉE MANUELLEMENT.
 *
 * ============================================================================
 */