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
 * - utiliser src/config/routes.ts comme source unique des pathnames ;
 * - centraliser les liens fixes du menu desktop ;
 * - centraliser les actions du Header ;
 * - centraliser le drawer mobile ;
 * - centraliser les 5 boutons de navigation mobile ;
 * - fournir l'accès à la page générale des catégories ;
 * - construire les routes dynamiques de catégories ;
 * - construire les routes publiques StoreProduct ;
 * - construire la route de recherche avec son query parameter ;
 * - exposer les routes du parcours de commande ;
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
 * PARCOURS PRODUIT / COMMANDE :
 *
 * /produits
 *
 *      ↓
 *
 * /p/[qrToken]
 *
 *      ↓
 *
 * /panier
 *
 *      ↓
 *
 * /commande
 *
 *      ↓
 *
 * /commande/paiement
 *
 *      ↓
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Les routes du checkout existent dans cette configuration afin d'être
 * réutilisables proprement.
 *
 * Elles ne deviennent PAS de nouveaux boutons dans :
 *
 * PUBLIC_MOBILE_BOTTOM_NAVIGATION
 *
 * La barre mobile reste exactement :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 *
 * CE FICHIER NE CONTIENT :
 *
 * - aucun composant React ;
 * - aucune icône React ;
 * - aucun accès Prisma ;
 * - aucune lecture de session ;
 * - aucun compteur fictif ;
 * - aucune ProductCategory métier codée en dur ;
 * - aucune donnée Product ;
 * - aucune donnée StoreProduct ;
 * - aucune donnée Store ;
 * - aucun prix ;
 * - aucun stock ;
 * - aucun frais de livraison ;
 * - aucun moyen de paiement ;
 * - aucune construction manuelle de route dynamique produit ;
 * - aucune construction manuelle de route dynamique catégorie.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. ROUTES PUBLIQUES
   ========================================================================== */

/**
 * Tous les pathnames statiques proviennent exclusivement de :
 *
 * src/config/routes.ts
 *
 * IMPORTANT :
 *
 * CART reste conservé comme identifiant technique historique du shell.
 *
 * La terminologie visible côté cliente reste :
 *
 * Panier
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
     
     Identifiant technique conservé :
     
     CART
     
     Route métier :
     
     /panier
     ------------------------------------------------------------------------ */

  CART:
    generalAppRoutes.panier,


  /* ------------------------------------------------------------------------
     CHECKOUT — INFORMATIONS / LIVRAISON
     ------------------------------------------------------------------------ */

  CHECKOUT:
    generalAppRoutes.checkout,


  /* ------------------------------------------------------------------------
     CHECKOUT — PAYMENT
     ------------------------------------------------------------------------ */

  CHECKOUT_PAYMENT:
    generalAppRoutes.checkoutPayment,


  /* ------------------------------------------------------------------------
     CHECKOUT — SUCCESS
     ------------------------------------------------------------------------ */

  CHECKOUT_SUCCESS:
    generalAppRoutes.checkoutSuccess,


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
     DELIVERY INFORMATION
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
 * Navigation fixe principale desktop.
 *
 * IMPORTANT :
 *
 * Les ProductCategory réelles restent chargées dynamiquement depuis :
 *
 * src/lib/public/navigation/public-navigation-query.ts
 *
 * Aucune catégorie métier réelle n'est codée en dur ici.
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
 * Actions du Header desktop.
 *
 * supportsBadge signifie uniquement que l'action peut recevoir une vraie
 * valeur métier.
 *
 * Aucun compteur n'est inventé ici.
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
       * Identifiant technique historique conservé.
       *
       * Ne pas renommer brutalement "cart" tant que les types,
       * composants et mappings existants l'utilisent.
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
 * Le drawer mobile peut contenir davantage de destinations que la barre
 * fixe située au bas de l'écran.
 *
 * Les étapes checkout :
 *
 * /commande
 * /commande/paiement
 * /commande/succes
 *
 * ne sont volontairement PAS ajoutées ici.
 *
 * Elles appartiennent au parcours transactionnel initié depuis le Panier.
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
 * ARCHITECTURE MOBILE FIXÉE
 * ============================================================================
 *
 * EXACTEMENT 5 éléments :
 *
 * 1. Accueil
 * 2. Produits
 * 3. Panier
 * 4. Commandes
 * 5. Compte
 *
 * ============================================================================
 *
 * Les pages :
 *
 * /commande
 * /commande/paiement
 * /commande/succes
 *
 * n'ajoutent aucun nouvel onglet.
 *
 * Le bouton Panier reste l'entrée transactionnelle du parcours checkout.
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
 * Pathname de recherche.
 *
 * Exemple final :
 *
 * /recherche?q=serum
 */
export const PUBLIC_SEARCH_ROUTE =
  PUBLIC_NAVIGATION_ROUTES.SEARCH;


/**
 * Paramètre officiel de recherche.
 */
export const PUBLIC_SEARCH_QUERY_PARAMETER =
  "q" as const;


/* ==========================================================================
   8. CATEGORY ROUTE BUILDER
   ========================================================================== */

/**
 * Construit la route d'une vraie ProductCategory.
 *
 * Aucun pathname dynamique n'est fabriqué manuellement ici.
 */
export function buildPublicCategoryNavigationHref(
  slug:
    string,
): string {
  const normalizedSlug =
    slug.trim();


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
 * Construit la route canonique d'une offre StoreProduct.
 *
 * /p/[qrToken]
 *
 * qrToken doit provenir de StoreProduct.
 */
export function buildPublicProductDetailHref(
  qrToken:
    string,
): string {
  const normalizedQrToken =
    qrToken.trim();


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
 * Le pathname provient toujours de routes.ts.
 *
 * Seule la query string est construite ici.
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
 * Chaque helper retourne une nouvelle collection.
 *
 * La configuration source reste immuable.
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
 * Les ProductCategory réelles restent assemblées côté serveur dans :
 *
 * src/lib/public/navigation/public-navigation-query.ts
 *
 * Aucune donnée métier dynamique n'est ajoutée ici.
 */
export const PUBLIC_NAVIGATION_CONFIG = {
  /* ------------------------------------------------------------------------
     ROUTES
     ------------------------------------------------------------------------ */

  routes:
    PUBLIC_NAVIGATION_ROUTES,


  /* ------------------------------------------------------------------------
     DESKTOP NAVIGATION
     ------------------------------------------------------------------------ */

  desktopNavigation:
    PUBLIC_DESKTOP_NAVIGATION,


  /* ------------------------------------------------------------------------
     HEADER ACTIONS
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
     CHECKOUT
     ------------------------------------------------------------------------
     
     Ces routes appartiennent au parcours transactionnel.
     
     Elles ne sont pas ajoutées automatiquement aux menus.
     ------------------------------------------------------------------------ */

  checkout: {
    informationRoute:
      PUBLIC_NAVIGATION_ROUTES.CHECKOUT,

    paymentRoute:
      PUBLIC_NAVIGATION_ROUTES.CHECKOUT_PAYMENT,

    successRoute:
      PUBLIC_NAVIGATION_ROUTES.CHECKOUT_SUCCESS,
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
 * /produits
 *
 * Détail :
 *
 * /p/[qrToken]
 *
 * ============================================================================
 *
 * CATÉGORIES :
 *
 * /categories
 *
 * Détail :
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
 * COMMANDE :
 *
 * /commande
 *
 * ============================================================================
 *
 * PAIEMENT :
 *
 * /commande/paiement
 *
 * ============================================================================
 *
 * CONFIRMATION :
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * RECHERCHE :
 *
 * /recherche?q=...
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * /commande
 * /commande/paiement
 * /commande/succes
 *
 * sont exposées dans la configuration afin d'être réutilisées par le
 * parcours checkout.
 *
 * Elles ne créent :
 *
 * - aucun sixième bouton mobile ;
 * - aucun item supplémentaire dans le Header ;
 * - aucun item supplémentaire dans le drawer ;
 * - aucun moyen de paiement fictif ;
 * - aucun frais de livraison fictif.
 *
 * ============================================================================
 *
 * AUCUN PATHNAME PUBLIC STATIQUE N'EST DUPLIQUÉ MANUELLEMENT ICI.
 *
 * AUCUNE ROUTE DYNAMIQUE PRODUIT OU CATÉGORIE N'EST FABRIQUÉE MANUELLEMENT.
 *
 * ============================================================================
 */