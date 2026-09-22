/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ROUTES CONFIGURATION
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/routes.ts
 *
 * ============================================================================
 *
 * SOURCE UNIQUE DES ROUTES DE L'APPLICATION.
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - centraliser toutes les routes statiques de l'application ;
 * - centraliser les builders des routes dynamiques ;
 * - conserver les routes publiques existantes ;
 * - conserver les routes Gestionnaire existantes ;
 * - officialiser le parcours Panier → Commande → Paiement → Succès ;
 * - éviter les URLs écrites manuellement dans les composants ;
 * - encoder systématiquement les paramètres dynamiques ;
 * - ne jamais utiliser une route comme mécanisme d'autorisation.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. CONSTANTES PUBLIQUES PARTAGÉES
   ========================================================================== */

/**
 * Route métier du Panier.
 *
 * IMPORTANT :
 *
 * L'identifiant technique historique "cart" existe déjà dans plusieurs
 * composants du shell public.
 *
 * Le projet utilise désormais le terme métier français "Panier".
 *
 * Pour éviter toute cassure pendant la migration :
 *
 * generalAppRoutes.cart
 *
 * ET
 *
 * generalAppRoutes.panier
 *
 * pointent volontairement vers LA MÊME constante.
 *
 * Aucun pathname n'est donc dupliqué.
 */
const PUBLIC_PANIER_ROUTE =
  "/panier" as const;


/* ==========================================================================
   2. GENERAL / PUBLIC ROUTES
   ========================================================================== */

const generalRoutes = {
  /* ------------------------------------------------------------------------
     HOME
     ------------------------------------------------------------------------ */

  home:
    "/",


  /* ------------------------------------------------------------------------
     PRODUCTS
     ------------------------------------------------------------------------ */

  /**
   * Catalogue public principal.
   *
   * /produits
   */
  products:
    "/produits",


  /**
   * Alias historique / sémantique.
   *
   * La boutique publique utilise actuellement le même catalogue.
   */
  shop:
    "/produits",


  /* ------------------------------------------------------------------------
     SEARCH
     ------------------------------------------------------------------------ */

  /**
   * Recherche publique.
   *
   * Exemple :
   *
   * /recherche?q=serum
   */
  search:
    "/recherche",


  /* ------------------------------------------------------------------------
     CATEGORIES
     ------------------------------------------------------------------------ */

  /**
   * Liste des catégories.
   *
   * /categories
   *
   * Pour :
   *
   * /categories/[slug]
   *
   * utiliser :
   *
   * publicRouteBuilders.categoryBySlug(slug)
   */
  categories:
    "/categories",


  /* ------------------------------------------------------------------------
     NEW PRODUCTS
     ------------------------------------------------------------------------ */

  newProducts:
    "/nouveautes",


  /* ------------------------------------------------------------------------
     PROMOTIONS
     ------------------------------------------------------------------------ */

  promotions:
    "/promotions",


  /* ------------------------------------------------------------------------
     PUBLIC PRODUCT DETAIL ROOT
     ------------------------------------------------------------------------ */

  /**
   * Racine statique des fiches publiques StoreProduct.
   *
   * /p
   *
   * La route complète :
   *
   * /p/[qrToken]
   *
   * doit être construite avec :
   *
   * publicRouteBuilders.productByQr(qrToken)
   */
  publicProductQrRoot:
    "/p",


  /* ------------------------------------------------------------------------
     PANIER
     ------------------------------------------------------------------------ */

  /**
   * Identifiant technique historique conservé.
   *
   * /panier
   */
  cart:
    PUBLIC_PANIER_ROUTE,


  /**
   * Alias métier français.
   *
   * Même route, même source.
   *
   * Cela permet une migration progressive sans casser les fichiers
   * utilisant déjà `cart`.
   */
  panier:
    PUBLIC_PANIER_ROUTE,


  /* ------------------------------------------------------------------------
     CHECKOUT — CUSTOMER + DELIVERY
     ------------------------------------------------------------------------ */

  /**
   * Première étape de commande.
   *
   * /commande
   *
   * Cette page devra :
   *
   * - revalider le Panier côté serveur ;
   * - afficher les vrais StoreProduct ;
   * - collecter les coordonnées cliente ;
   * - collecter l'adresse de livraison ;
   * - calculer les frais de livraison côté serveur ;
   * - préparer l'étape Paiement.
   */
  checkout:
    "/commande",


  /* ------------------------------------------------------------------------
     CHECKOUT — PAYMENT
     ------------------------------------------------------------------------ */

  /**
   * Étape Paiement.
   *
   * /commande/paiement
   *
   * Cette page ne doit jamais considérer comme autoritaires :
   *
   * - prix navigateur ;
   * - stock navigateur ;
   * - total navigateur ;
   * - frais de livraison navigateur.
   */
  checkoutPayment:
    "/commande/paiement",


  /* ------------------------------------------------------------------------
     CHECKOUT — SUCCESS
     ------------------------------------------------------------------------ */

  /**
   * Confirmation après validation réelle côté serveur.
   *
   * /commande/succes
   *
   * La présence sur cette URL ne constitue jamais, à elle seule,
   * une preuve de paiement.
   */
  checkoutSuccess:
    "/commande/succes",


  /* ------------------------------------------------------------------------
     ORDER TRACKING
     ------------------------------------------------------------------------ */

  orderTracking:
    "/suivi",


  /* ------------------------------------------------------------------------
     CUSTOMER ACCOUNT
     ------------------------------------------------------------------------ */

  account:
    "/compte",


  /* ------------------------------------------------------------------------
     FAVORITES
     ------------------------------------------------------------------------ */

  favorites:
    "/compte/favoris",


  /* ------------------------------------------------------------------------
     ABOUT
     ------------------------------------------------------------------------ */

  about:
    "/a-propos",


  /* ------------------------------------------------------------------------
     POINTS OF SALE
     ------------------------------------------------------------------------ */

  pointsOfSale:
    "/points-de-vente",


  /* ------------------------------------------------------------------------
     CONTACT
     ------------------------------------------------------------------------ */

  contact:
    "/contact",


  /* ------------------------------------------------------------------------
     FAQ
     ------------------------------------------------------------------------ */

  faq:
    "/faq",


  /* ------------------------------------------------------------------------
     DELIVERY INFORMATION
     ------------------------------------------------------------------------ */

  delivery:
    "/livraison",


  /* ------------------------------------------------------------------------
     TERMS
     ------------------------------------------------------------------------ */

  terms:
    "/conditions",


  /* ------------------------------------------------------------------------
     PRIVACY
     ------------------------------------------------------------------------ */

  privacy:
    "/confidentialite",
} as const;


/* ==========================================================================
   3. GESTIONNAIRE STATIC ROUTES
   ========================================================================== */

const gestionnaireRoutes = {
  /* ------------------------------------------------------------------------
     ROOT
     ------------------------------------------------------------------------ */

  root:
    "/gestionnaire",


  /* ------------------------------------------------------------------------
     AUTHENTICATION
     ------------------------------------------------------------------------ */

  login:
    "/gestionnaire/connexion",

  register:
    "/gestionnaire/inscription",

  verification:
    "/gestionnaire/verification",

  forgotPassword:
    "/gestionnaire/mot-de-passe-oublie",

  resetPassword:
    "/gestionnaire/reinitialiser-mot-de-passe",


  /* ------------------------------------------------------------------------
     DASHBOARD
     ------------------------------------------------------------------------ */

  dashboard:
    "/gestionnaire/dashboard",


  /* ------------------------------------------------------------------------
     PRODUCTS
     ------------------------------------------------------------------------ */

  products:
    "/gestionnaire/produits",

  addProduct:
    "/gestionnaire/produits/ajouter",

  catalog:
    "/gestionnaire/produits/catalogue",


  /* ------------------------------------------------------------------------
     STOCK
     ------------------------------------------------------------------------ */

  stock:
    "/gestionnaire/stock",


  /* ------------------------------------------------------------------------
     ORDERS
     ------------------------------------------------------------------------ */

  orders:
    "/gestionnaire/commandes",


  /* ------------------------------------------------------------------------
     CUSTOMERS
     ------------------------------------------------------------------------ */

  customers:
    "/gestionnaire/clients",


  /* ------------------------------------------------------------------------
     DELIVERIES
     ------------------------------------------------------------------------ */

  deliveries:
    "/gestionnaire/livraisons",


  /* ------------------------------------------------------------------------
     STATISTICS
     ------------------------------------------------------------------------ */

  statistics:
    "/gestionnaire/statistiques",


  /* ------------------------------------------------------------------------
     PROMOTIONS
     ------------------------------------------------------------------------ */

  promotions:
    "/gestionnaire/promotions",


  /* ------------------------------------------------------------------------
     PROFILE
     ------------------------------------------------------------------------ */

  profile:
    "/gestionnaire/profil",


  /* ------------------------------------------------------------------------
     SETTINGS
     ------------------------------------------------------------------------ */

  settings:
    "/gestionnaire/parametres",
} as const;


/* ==========================================================================
   4. DYNAMIC GESTIONNAIRE ROUTES
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * Ces fonctions construisent uniquement des URLs.
 *
 * Elles ne constituent jamais une autorisation.
 *
 * Le serveur doit toujours vérifier :
 *
 * - la session ;
 * - Manager.status ;
 * - Store.status ;
 * - l'appartenance de la ressource ;
 * - les permissions nécessaires.
 */

export const gestionnaireRouteBuilders = {
  /* ------------------------------------------------------------------------
     ORDER DETAILS
     ------------------------------------------------------------------------ */

  /**
   * /gestionnaire/commandes/[orderId]
   */
  orderDetails(
    orderId:
      string,
  ): string {
    return `${gestionnaireRoutes.orders}/${encodeURIComponent(
      orderId,
    )}`;
  },


  /* ------------------------------------------------------------------------
     PRODUCT DETAILS
     ------------------------------------------------------------------------ */

  /**
   * /gestionnaire/produits/[productId]
   */
  productDetails(
    productId:
      string,
  ): string {
    return `${gestionnaireRoutes.products}/${encodeURIComponent(
      productId,
    )}`;
  },


  /* ------------------------------------------------------------------------
     PRODUCT EDIT
     ------------------------------------------------------------------------ */

  /**
   * /gestionnaire/produits/[productId]/modifier
   */
  productEdit(
    productId:
      string,
  ): string {
    return `${gestionnaireRoutes.products}/${encodeURIComponent(
      productId,
    )}/modifier`;
  },


  /* ------------------------------------------------------------------------
     PRODUCT QR
     ------------------------------------------------------------------------ */

  /**
   * /gestionnaire/produits/[productId]/qr
   *
   * Route Gestionnaire privée.
   *
   * Elle ne doit jamais être utilisée comme destination publique du QR.
   */
  productQr(
    productId:
      string,
  ): string {
    return `${gestionnaireRoutes.products}/${encodeURIComponent(
      productId,
    )}/qr`;
  },
} as const;


/* ==========================================================================
   5. PUBLIC DYNAMIC ROUTES
   ========================================================================== */

/**
 * Routes dynamiques accessibles depuis l'espace public.
 *
 * IMPORTANT :
 *
 * Une route publique ne doit jamais transporter inutilement :
 *
 * - managerId ;
 * - prix ;
 * - stock ;
 * - total ;
 * - frais de livraison ;
 * - token d'authentification ;
 * - secret.
 */

export const publicRouteBuilders = {
  /* ------------------------------------------------------------------------
     CATEGORY BY SLUG
     ------------------------------------------------------------------------ */

  /**
   * /categories/[slug]
   *
   * Le slug doit provenir de ProductCategory.slug.
   */
  categoryBySlug(
    categorySlug:
      string,
  ): string {
    return `${generalRoutes.categories}/${encodeURIComponent(
      categorySlug,
    )}`;
  },


  /* ------------------------------------------------------------------------
     PRODUCT BY QR
     ------------------------------------------------------------------------ */

  /**
   * /p/[qrToken]
   *
   * Une fiche publique représente une offre StoreProduct précise.
   *
   * Le qrToken doit provenir de StoreProduct.qrToken.
   */
  productByQr(
    qrToken:
      string,
  ): string {
    return `${generalRoutes.publicProductQrRoot}/${encodeURIComponent(
      qrToken,
    )}`;
  },
} as const;


/* ==========================================================================
   6. APPLICATION ROUTES
   ========================================================================== */

/**
 * Objet principal lorsqu'un composant a besoin d'une route publique
 * ou de l'espace Gestionnaire.
 */

export const routes = {
  /* ------------------------------------------------------------------------
     GENERAL / PUBLIC
     ------------------------------------------------------------------------ */

  home:
    generalRoutes.home,

  products:
    generalRoutes.products,

  shop:
    generalRoutes.shop,

  search:
    generalRoutes.search,

  categories:
    generalRoutes.categories,

  newProducts:
    generalRoutes.newProducts,

  promotions:
    generalRoutes.promotions,

  publicProductQrRoot:
    generalRoutes.publicProductQrRoot,

  cart:
    generalRoutes.cart,

  panier:
    generalRoutes.panier,

  checkout:
    generalRoutes.checkout,

  checkoutPayment:
    generalRoutes.checkoutPayment,

  checkoutSuccess:
    generalRoutes.checkoutSuccess,

  orderTracking:
    generalRoutes.orderTracking,

  account:
    generalRoutes.account,

  favorites:
    generalRoutes.favorites,

  about:
    generalRoutes.about,

  pointsOfSale:
    generalRoutes.pointsOfSale,

  contact:
    generalRoutes.contact,

  faq:
    generalRoutes.faq,

  delivery:
    generalRoutes.delivery,

  terms:
    generalRoutes.terms,

  privacy:
    generalRoutes.privacy,


  /* ------------------------------------------------------------------------
     GESTIONNAIRE
     ------------------------------------------------------------------------ */

  gestionnaire:
    gestionnaireRoutes,
} as const;


/* ==========================================================================
   7. GROUP EXPORTS
   ========================================================================== */

/**
 * Toutes les routes générales.
 *
 * Exemples :
 *
 * generalAppRoutes.home
 * generalAppRoutes.products
 * generalAppRoutes.search
 * generalAppRoutes.categories
 * generalAppRoutes.cart
 * generalAppRoutes.panier
 * generalAppRoutes.checkout
 * generalAppRoutes.checkoutPayment
 * generalAppRoutes.checkoutSuccess
 */
export const generalAppRoutes =
  generalRoutes;


/**
 * Routes Gestionnaire uniquement.
 */
export const gestionnaireAppRoutes =
  gestionnaireRoutes;


/* ==========================================================================
   8. TYPES
   ========================================================================== */

/**
 * Union automatique de toutes les routes publiques statiques.
 */
export type GeneralRoute =
  (typeof generalRoutes)[keyof typeof generalRoutes];


/**
 * Union automatique de toutes les routes Gestionnaire statiques.
 */
export type GestionnaireRoute =
  (typeof gestionnaireRoutes)[keyof typeof gestionnaireRoutes];


/**
 * Union des pathnames statiques connus.
 */
export type AppRoute =
  | GeneralRoute
  | GestionnaireRoute;


/* ==========================================================================
   9. DOCUMENTATION DU FLUX PUBLIC
   ========================================================================== */

/**
 * ============================================================================
 *
 * ACCUEIL
 *
 * /
 *
 * ============================================================================
 *
 * PRODUITS
 *
 * /produits
 *
 * routes.products
 * generalAppRoutes.products
 *
 * ============================================================================
 *
 * RECHERCHE
 *
 * /recherche
 *
 * routes.search
 * generalAppRoutes.search
 *
 * ============================================================================
 *
 * CATÉGORIES
 *
 * /categories
 *
 * routes.categories
 * generalAppRoutes.categories
 *
 * ============================================================================
 *
 * CATÉGORIE
 *
 * /categories/[slug]
 *
 * publicRouteBuilders.categoryBySlug(slug)
 *
 * ============================================================================
 *
 * PRODUIT / OFFRE STOREPRODUCT
 *
 * /p/[qrToken]
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * PANIER
 *
 * /panier
 *
 * routes.cart
 * routes.panier
 *
 * generalAppRoutes.cart
 * generalAppRoutes.panier
 *
 * ============================================================================
 *
 * COMMANDE — INFORMATIONS CLIENTE / LIVRAISON
 *
 * /commande
 *
 * routes.checkout
 * generalAppRoutes.checkout
 *
 * ============================================================================
 *
 * COMMANDE — PAIEMENT
 *
 * /commande/paiement
 *
 * routes.checkoutPayment
 * generalAppRoutes.checkoutPayment
 *
 * ============================================================================
 *
 * COMMANDE — CONFIRMATION
 *
 * /commande/succes
 *
 * routes.checkoutSuccess
 * generalAppRoutes.checkoutSuccess
 *
 * ============================================================================
 *
 * SUIVI COMMANDE
 *
 * /suivi
 *
 * routes.orderTracking
 * generalAppRoutes.orderTracking
 *
 * ============================================================================
 *
 * COMPTE
 *
 * /compte
 *
 * routes.account
 * generalAppRoutes.account
 *
 * ============================================================================
 *
 * FAVORIS
 *
 * /compte/favoris
 *
 * routes.favorites
 * generalAppRoutes.favorites
 *
 * ============================================================================
 *
 * FLUX COMMERCIAL :
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
 * informations cliente
 * adresse de livraison
 * mode de livraison
 * calcul serveur des frais
 *
 *      ↓
 *
 * /commande/paiement
 *
 *      ↓
 *
 * validation serveur du paiement
 *
 *      ↓
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le navigateur ne constitue jamais la source de vérité pour :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - frais de livraison ;
 * - sous-total ;
 * - total ;
 * - état du paiement.
 *
 * ============================================================================
 *
 * L'accès à :
 *
 * /commande/paiement
 *
 * ou :
 *
 * /commande/succes
 *
 * ne constitue jamais une preuve :
 *
 * - qu'une commande existe ;
 * - que le stock est réservé ;
 * - qu'un paiement a été effectué ;
 * - qu'un paiement est confirmé.
 *
 * Ces informations doivent toujours provenir de l'état serveur.
 *
 * ============================================================================
 *
 * AUCUNE ROUTE DYNAMIQUE NE DOIT ÊTRE FABRIQUÉE MANUELLEMENT
 * DANS LES COMPOSANTS, SERVICES OU SERVER ACTIONS.
 *
 * ============================================================================
 */