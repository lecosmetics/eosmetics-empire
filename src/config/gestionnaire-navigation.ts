/* ============================================================
   COSMETICS EMPIRE
   CONFIGURATION — NAVIGATION GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/config/gestionnaire-navigation.ts

   RESPONSABILITÉ :

   Ce fichier constitue la source centrale utilisée par :

   - la Sidebar desktop ;
   - le Drawer mobile ;
   - la navigation principale ;
   - le sous-menu Produits ;
   - la navigation secondaire ;
   - l'identité du shell Gestionnaire ;
   - les libellés d'accessibilité ;
   - les routes utilisées par la navigation.

   IMPORTANT :

   Aucune donnée personnelle du gestionnaire connecté
   ne doit être définie ici.

   Les informations comme :

   - nom ;
   - e-mail ;
   - localisation ;
   - avatar ;
   - notifications ;

   proviendront plus tard de la session authentifiée.

   Ce fichier contient uniquement de la configuration
   permanente de l'application.
   ============================================================ */


/* ============================================================
   1. ROUTES DU SHELL GESTIONNAIRE
   ------------------------------------------------------------
   Ces constantes permettent d'éviter d'écrire plusieurs fois
   les mêmes URLs dans la configuration de navigation.

   Elles correspondent aux routes Next.js privées prévues dans :

   src/app/gestionnaire/(espace-prive)/
   ============================================================ */

export const gestionnairePrivateRoutes = {
  dashboard:
    "/gestionnaire/dashboard",

  products:
    "/gestionnaire/produits",

  addProduct:
    "/gestionnaire/produits/ajouter",

  catalog:
    "/gestionnaire/categories",

  stock:
    "/gestionnaire/stock",

  orders:
    "/gestionnaire/commandes",

  clients:
    "/gestionnaire/clients",

  deliveries:
    "/gestionnaire/livraisons",

  statistics:
    "/gestionnaire/statistiques",

  promotions:
    "/gestionnaire/promotions",

  profile:
    "/gestionnaire/profil",

  settings:
    "/gestionnaire/parametres",
} as const;


/* ============================================================
   2. ROUTE TYPE
   ============================================================ */

export type GestionnairePrivateRoute =
  (typeof gestionnairePrivateRoutes)[
    keyof typeof gestionnairePrivateRoutes
  ];


/* ============================================================
   3. NAVIGATION ICON IDENTIFIERS
   ------------------------------------------------------------
   Ces valeurs ne contiennent volontairement aucun composant
   React.

   La correspondance réelle avec Lucide React est faite dans :

   GestionnaireNavigation.tsx

   Ainsi, ce fichier reste une configuration TypeScript pure.
   ============================================================ */

export type GestionnaireNavIcon =
  | "dashboard"
  | "products"
  | "add-product"
  | "my-products"
  | "catalog"
  | "stock"
  | "orders"
  | "clients"
  | "deliveries"
  | "statistics"
  | "promotions"
  | "profile"
  | "settings";


/* ============================================================
   4. NAVIGATION ITEM TYPE
   ============================================================ */

export type GestionnaireNavigationItem =
  Readonly<{
    /*
     * Identifiant technique stable.
     *
     * Ne pas utiliser le label comme identifiant.
     */
    id: string;

    /*
     * Texte affiché dans la navigation.
     */
    label: string;

    /*
     * Destination Next.js.
     */
    href: GestionnairePrivateRoute;

    /*
     * Identifiant de l'icône Lucide.
     */
    icon: GestionnaireNavIcon;

    /*
     * Permet éventuellement de désactiver temporairement
     * une destination sans supprimer sa configuration.
     */
    disabled?: boolean;

    /*
     * Sous-navigation éventuelle.
     *
     * Actuellement utilisée par Produits.
     */
    children?:
      readonly GestionnaireNavigationItem[];
  }>;


/* ============================================================
   5. GLOBAL SHELL CONFIGURATION
   ============================================================ */

export const gestionnaireShellConfig = {
  /* ----------------------------------------------------------
     BRAND
     ---------------------------------------------------------- */

  brand: {
    name:
      "L&E Cosmetics",

    subtitle:
      "Espace Gestionnaire",

    logo:
      "/logos/logo.png",

    logoAlt:
      "Logo officiel L&E Cosmetics Empire",
  },


  /* ----------------------------------------------------------
     SECURITY BADGE
     ---------------------------------------------------------- */

  secureBadgeLabel:
    "Espace sécurisé",


  /* ----------------------------------------------------------
     SEARCH
     ---------------------------------------------------------- */

  searchPlaceholder:
    "Rechercher un produit, une commande, un client...",


  /* ----------------------------------------------------------
     NAVIGATION ACCESSIBILITY LABELS
     ---------------------------------------------------------- */

  navigationLabels: {
    main:
      "Navigation principale de l'espace Gestionnaire",

    secondary:
      "Navigation secondaire de l'espace Gestionnaire",
  },


  /* ----------------------------------------------------------
     MOBILE DRAWER
     ---------------------------------------------------------- */

  mobileMenu: {
    openLabel:
      "Ouvrir le menu Gestionnaire",

    closeLabel:
      "Fermer le menu Gestionnaire",

    drawerLabel:
      "Menu de navigation Gestionnaire",
  },


  /* ----------------------------------------------------------
     HEADER
     ---------------------------------------------------------- */

  header: {
    notificationsLabel:
      "Notifications",

    searchLabel:
      "Rechercher",

    locationFallback:
      "Localisation",

    profileLabel:
      "Ouvrir mon profil",
  },


  /* ----------------------------------------------------------
     PROFILE
     ---------------------------------------------------------- */

  profile: {
    href:
      gestionnairePrivateRoutes.profile,

    fallbackInitials:
      "L&E",
  },


  /* ----------------------------------------------------------
     LOGOUT
     ---------------------------------------------------------- */

  logoutLabel:
    "Se déconnecter",
} as const;


/* ============================================================
   6. PRIMARY NAVIGATION
   ------------------------------------------------------------
   ORDRE OFFICIEL :

   Tableau de bord

   Produits
      Ajouter un produit
      Mes produits
      Catalogue L&E

   Stock
   Commandes
   Clients
   Livraisons
   Mes statistiques
   Promotions
   ============================================================ */

export const gestionnairePrimaryNavigation =
  [
    /* --------------------------------------------------------
       DASHBOARD
       -------------------------------------------------------- */

    {
      id:
        "dashboard",

      label:
        "Tableau de bord",

      href:
        gestionnairePrivateRoutes.dashboard,

      icon:
        "dashboard",
    },


    /* --------------------------------------------------------
       PRODUCTS
       -------------------------------------------------------- */

    {
      id:
        "products",

      label:
        "Produits",

      href:
        gestionnairePrivateRoutes.products,

      icon:
        "products",

      children: [
        /* ----------------------------------------------------
           ADD PRODUCT
           ---------------------------------------------------- */

        {
          id:
            "products-add",

          label:
            "Ajouter un produit",

          href:
            gestionnairePrivateRoutes.addProduct,

          icon:
            "add-product",
        },


        /* ----------------------------------------------------
           MY PRODUCTS
           ---------------------------------------------------- */

        {
          id:
            "products-mine",

          label:
            "Mes produits",

          href:
            gestionnairePrivateRoutes.products,

          icon:
            "my-products",
        },


        /* ----------------------------------------------------
           L&E CATALOG
           ---------------------------------------------------- */

        {
          id:
            "products-catalog",

          label:
            "Catalogue L&E",

          href:
            gestionnairePrivateRoutes.catalog,

          icon:
            "catalog",
        },
      ],
    },


    /* --------------------------------------------------------
       STOCK
       -------------------------------------------------------- */

    {
      id:
        "stock",

      label:
        "Stock",

      href:
        gestionnairePrivateRoutes.stock,

      icon:
        "stock",
    },


    /* --------------------------------------------------------
       ORDERS
       -------------------------------------------------------- */

    {
      id:
        "orders",

      label:
        "Commandes",

      href:
        gestionnairePrivateRoutes.orders,

      icon:
        "orders",
    },


    /* --------------------------------------------------------
       CLIENTS
       -------------------------------------------------------- */

    {
      id:
        "clients",

      label:
        "Clients",

      href:
        gestionnairePrivateRoutes.clients,

      icon:
        "clients",
    },


    /* --------------------------------------------------------
       DELIVERIES
       -------------------------------------------------------- */

    {
      id:
        "deliveries",

      label:
        "Livraisons",

      href:
        gestionnairePrivateRoutes.deliveries,

      icon:
        "deliveries",
    },


    /* --------------------------------------------------------
       STATISTICS
       -------------------------------------------------------- */

    {
      id:
        "statistics",

      label:
        "Mes statistiques",

      href:
        gestionnairePrivateRoutes.statistics,

      icon:
        "statistics",
    },


    /* --------------------------------------------------------
       PROMOTIONS
       -------------------------------------------------------- */

    {
      id:
        "promotions",

      label:
        "Promotions",

      href:
        gestionnairePrivateRoutes.promotions,

      icon:
        "promotions",
    },
  ] as const satisfies
    readonly GestionnaireNavigationItem[];


/* ============================================================
   7. SECONDARY NAVIGATION
   ------------------------------------------------------------
   Cette navigation apparaît après la séparation visuelle.

   Elle contient exclusivement :

   - Mon profil ;
   - Paramètres.
   ============================================================ */

export const gestionnaireSecondaryNavigation =
  [
    /* --------------------------------------------------------
       PROFILE
       -------------------------------------------------------- */

    {
      id:
        "profile",

      label:
        "Mon profil",

      href:
        gestionnairePrivateRoutes.profile,

      icon:
        "profile",
    },


    /* --------------------------------------------------------
       SETTINGS
       -------------------------------------------------------- */

    {
      id:
        "settings",

      label:
        "Paramètres",

      href:
        gestionnairePrivateRoutes.settings,

      icon:
        "settings",
    },
  ] as const satisfies
    readonly GestionnaireNavigationItem[];


/* ============================================================
   8. COMPLETE NAVIGATION
   ------------------------------------------------------------
   Export pratique pour les futurs besoins :

   - permissions ;
   - breadcrumbs ;
   - recherche de navigation ;
   - tests ;
   - administration.

   La Sidebar actuelle peut continuer à utiliser séparément :

   gestionnairePrimaryNavigation
   gestionnaireSecondaryNavigation
   ============================================================ */

export const gestionnaireNavigation =
  {
    primary:
      gestionnairePrimaryNavigation,

    secondary:
      gestionnaireSecondaryNavigation,
  } as const;


/* ============================================================
   9. NAVIGATION ITEM IDS
   ------------------------------------------------------------
   Identifiants stables pouvant être réutilisés plus tard pour :

   - permissions ;
   - analytics internes ;
   - préférences utilisateur ;
   - tests ;
   - personnalisation.

   Aucun rôle ou système de permission n'est encore inventé.
   ============================================================ */

export const gestionnaireNavigationIds = {
  dashboard:
    "dashboard",

  products:
    "products",

  addProduct:
    "products-add",

  myProducts:
    "products-mine",

  catalog:
    "products-catalog",

  stock:
    "stock",

  orders:
    "orders",

  clients:
    "clients",

  deliveries:
    "deliveries",

  statistics:
    "statistics",

  promotions:
    "promotions",

  profile:
    "profile",

  settings:
    "settings",
} as const;


/* ============================================================
   10. NAVIGATION ITEM ID TYPE
   ============================================================ */

export type GestionnaireNavigationId =
  (typeof gestionnaireNavigationIds)[
    keyof typeof gestionnaireNavigationIds
  ];