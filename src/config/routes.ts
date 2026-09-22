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
 * RÈGLE :
 *
 * Lorsqu'une route existe ici, elle ne doit pas être écrite manuellement
 * dans les composants, Server Actions, services ou requêtes serveur.
 *
 * ============================================================================
 *
 * EXEMPLES :
 *
 * routes.home
 *
 * routes.products
 *
 * routes.categories
 *
 * routes.panier
 *
 * routes.search
 *
 * routes.gestionnaire.login
 *
 * gestionnaireRouteBuilders.productDetails(productId)
 *
 * gestionnaireRouteBuilders.productEdit(productId)
 *
 * gestionnaireRouteBuilders.productQr(productId)
 *
 * publicRouteBuilders.categoryBySlug(categorySlug)
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * OBJECTIFS :
 *
 * - éviter les URLs dupliquées ;
 * - éviter les fautes de frappe ;
 * - centraliser les modifications ;
 * - garder l'espace public cohérent ;
 * - garder l'espace Gestionnaire cohérent ;
 * - fournir les routes nécessaires à l'authentification ;
 * - fournir les routes nécessaires au Dashboard ;
 * - fournir les routes publiques des produits ;
 * - fournir les routes publiques des catégories ;
 * - fournir les routes publiques du Panier ;
 * - fournir les routes publiques du compte ;
 * - fournir les routes publiques de suivi ;
 * - fournir les routes publiques d'aide ;
 * - fournir les routes de création produit ;
 * - fournir les routes détail / modification / QR ;
 * - fournir la destination publique stable des QR Codes ;
 * - encoder tous les paramètres dynamiques ;
 * - ne jamais utiliser une route comme mécanisme d'autorisation.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. GENERAL / PUBLIC ROUTES
   ========================================================================== */

const generalRoutes = {
  /* ------------------------------------------------------------------------
     HOME
     ------------------------------------------------------------------------ */

  home:
    "/",


  /* ------------------------------------------------------------------------
     PUBLIC PRODUCTS
     ------------------------------------------------------------------------
     
     Page publique affichant le catalogue des produits :
     
     /produits
     
     IMPORTANT :
     
     Cette route représente la page catalogue / liste.
     
     Elle ne représente PAS la route de détail d'une offre produit.
     ------------------------------------------------------------------------ */

  products:
    "/produits",

  /**
   * Alias historique / sémantique conservé.
   *
   * La boutique publique utilise actuellement la même destination
   * que la liste générale des produits.
   *
   * IMPORTANT :
   *
   * On le conserve pour ne casser aucun import existant.
   */
  shop:
    "/produits",


  /* ------------------------------------------------------------------------
     PUBLIC SEARCH
     ------------------------------------------------------------------------
     
     Recherche publique :
     
     /recherche
     
     Exemple :
     
     /recherche?q=serum
     
     Le paramètre de recherche lui-même reste géré par la couche
     responsable de la recherche.
     ------------------------------------------------------------------------ */

  search:
    "/recherche",


  /* ------------------------------------------------------------------------
     PUBLIC CATEGORIES
     ------------------------------------------------------------------------
     
     Page publique affichant toutes les ProductCategory :
     
     /categories
     
     Les pages dynamiques :
     
     /categories/[slug]
     
     doivent être construites uniquement avec :
     
     publicRouteBuilders.categoryBySlug(slug)
     ------------------------------------------------------------------------ */

  categories:
    "/categories",


  /* ------------------------------------------------------------------------
     PUBLIC NEW PRODUCTS
     ------------------------------------------------------------------------ */

  newProducts:
    "/nouveautes",


  /* ------------------------------------------------------------------------
     PUBLIC PROMOTIONS
     ------------------------------------------------------------------------ */

  promotions:
    "/promotions",


  /* ------------------------------------------------------------------------
     PUBLIC PANIER
     ------------------------------------------------------------------------
     
     Route canonique du Panier public :
     
     /panier
     
     IMPORTANT :
     
     Le terme officiel utilisé dans les nouvelles couches du projet est :
     
     Panier
     
     Le stockage navigateur et la validation serveur sont gérés
     indépendamment de cette route.
     ------------------------------------------------------------------------ */

  panier:
    "/panier",


  /* ------------------------------------------------------------------------
     PUBLIC ORDER TRACKING
     ------------------------------------------------------------------------
     
     Route publique de consultation / suivi :
     
     /suivi
     
     Cette route ne constitue aucune autorisation d'accès à une commande.
     Les données affichées devront toujours être protégées côté serveur.
     ------------------------------------------------------------------------ */

  orderTracking:
    "/suivi",


  /* ------------------------------------------------------------------------
     PUBLIC ACCOUNT
     ------------------------------------------------------------------------ */

  account:
    "/compte",


  /* ------------------------------------------------------------------------
     PUBLIC FAVORITES
     ------------------------------------------------------------------------
     
     Route appartenant à l'espace Compte :
     
     /compte/favoris
     ------------------------------------------------------------------------ */

  favorites:
    "/compte/favoris",


  /* ------------------------------------------------------------------------
     PUBLIC PRODUCT DETAIL ROOT
     ------------------------------------------------------------------------
     
     Route canonique publique d'une OFFRE StoreProduct :
     
     /p/[qrToken]
     
     IMPORTANT :
     
     La route de détail public repose sur qrToken.
     
     Pourquoi ?
     
     Un Product peut être commercialisé par plusieurs boutiques :
     
     Product
        ↓
     StoreProduct A
     StoreProduct B
     
     Le qrToken appartient à StoreProduct et permet donc d'identifier
     précisément l'offre commerciale publique.
     
     Cette valeur représente uniquement la racine statique :
     
     /p
     
     Pour obtenir :
     
     /p/[qrToken]
     
     utiliser :
     
     publicRouteBuilders.productByQr(qrToken)
     
     Ne pas créer en parallèle :
     
     /produits/[slug]
     
     tant que l'architecture métier officielle reste basée sur
     StoreProduct + qrToken.
     ------------------------------------------------------------------------ */

  publicProductQrRoot:
    "/p",


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
     DELIVERY
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
   2. GESTIONNAIRE STATIC ROUTES
   ==========================================================================
   
   Routes publiques Gestionnaire :
   
   /gestionnaire
   /gestionnaire/connexion
   /gestionnaire/inscription
   /gestionnaire/verification
   /gestionnaire/mot-de-passe-oublie
   /gestionnaire/reinitialiser-mot-de-passe
   
   Routes privées Gestionnaire :
   
   /gestionnaire/dashboard
   
   /gestionnaire/produits
   /gestionnaire/produits/ajouter
   /gestionnaire/produits/catalogue
   
   /gestionnaire/stock
   /gestionnaire/commandes
   /gestionnaire/clients
   /gestionnaire/livraisons
   /gestionnaire/statistiques
   /gestionnaire/promotions
   /gestionnaire/profil
   /gestionnaire/parametres
   
   Routes dynamiques :
   
   /gestionnaire/commandes/[orderId]
   
   /gestionnaire/produits/[productId]
   /gestionnaire/produits/[productId]/modifier
   /gestionnaire/produits/[productId]/qr
   
   Ces routes dynamiques sont construites plus bas avec :
   
   gestionnaireRouteBuilders
   ========================================================================== */

const gestionnaireRoutes = {
  /* ------------------------------------------------------------------------
     PUBLIC ENTRY
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
   3. DYNAMIC GESTIONNAIRE ROUTES
   ==========================================================================
   
   IMPORTANT :
   
   Les valeurs dynamiques sont toujours encodées avec :
   
   encodeURIComponent()
   
   Ces builders construisent uniquement des URLs.
   
   Ils ne constituent JAMAIS une autorisation.
   
   Exemple :
   
   un navigateur peut tenter :
   
   /gestionnaire/produits/ID_AUTRE_BOUTIQUE
   
   mais le serveur doit toujours vérifier :
   
   - session Gestionnaire valide ;
   - Manager ACTIVE ;
   - Store ACTIVE ;
   - produit appartenant à la boutique autorisée ;
   - permission suffisante.
   
   La connaissance d'une URL ne donne aucun accès.
   ========================================================================== */

export const gestionnaireRouteBuilders = {
  /* ------------------------------------------------------------------------
     ORDER DETAILS
     ------------------------------------------------------------------------
     
     /gestionnaire/commandes/[orderId]
     ------------------------------------------------------------------------ */

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
     ------------------------------------------------------------------------
     
     /gestionnaire/produits/[productId]
     
     Cette route correspond au détail PRIVÉ Gestionnaire d'un Product.
     
     Elle est différente du détail produit public :
     
     /p/[qrToken]
     ------------------------------------------------------------------------ */

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
     ------------------------------------------------------------------------
     
     /gestionnaire/produits/[productId]/modifier
     ------------------------------------------------------------------------ */

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
     ------------------------------------------------------------------------
     
     /gestionnaire/produits/[productId]/qr
     
     Cette route reste PRIVÉE.
     
     Elle peut servir notamment à :
     
     - afficher le QR officiel ;
     - générer le QR ;
     - télécharger le QR ;
     - retourner un SVG imprimable ;
     - vérifier que le Product appartient à la boutique actuelle.
     
     IMPORTANT :
     
     Elle ne doit jamais être utilisée comme destination publique
     lorsqu'une cliente scanne le QR.
     
     La destination publique est :
     
     publicRouteBuilders.productByQr(qrToken)
     ------------------------------------------------------------------------ */

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
   4. PUBLIC DYNAMIC ROUTES
   ==========================================================================
   
   Routes dynamiques accessibles depuis l'espace public.
   
   ==========================================================================
   
   CATÉGORIES :
   
   /categories/[slug]
   
   ==========================================================================
   
   PRODUIT / OFFRE :
   
   /p/[qrToken]
   
   ==========================================================================
   
   IMPORTANT :
   
   Les identifiants dynamiques sont toujours encodés avec :
   
   encodeURIComponent()
   
   ==========================================================================
   
   SÉCURITÉ :
   
   Une route publique ne doit jamais transporter :
   
   - managerId ;
   - identifiant privé inutile ;
   - prix ;
   - stock ;
   - session ;
   - token d'authentification ;
   - secret.
   
   ==========================================================================
 */

export const publicRouteBuilders = {
  /* ------------------------------------------------------------------------
     CATEGORY BY SLUG
     ------------------------------------------------------------------------
     
     /categories/[slug]
     
     Exemple :
     
     category.slug :
     
     soins-du-visage
     
     résultat :
     
     /categories/soins-du-visage
     
     IMPORTANT :
     
     Le slug doit provenir de :
     
     ProductCategory.slug
     
     Il ne doit pas être recréé à partir de ProductCategory.name.
     ------------------------------------------------------------------------ */

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
     ------------------------------------------------------------------------
     
     /p/[qrToken]
     
     Cette route représente le détail public stable d'une offre
     StoreProduct.
     
     Le qrToken est stable.
     
     Une modification de :
     
     - prix ;
     - stock ;
     - image ;
     - description ;
     - nom ;
     
     ne change pas cette route.
     
     ==========================================================================
     
     PAGE PRODUITS :
     
     /produits
     
     PAGE DÉTAIL PRODUIT / OFFRE :
     
     /p/[qrToken]
     
     ==========================================================================
     ------------------------------------------------------------------------ */

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
   5. APPLICATION ROUTES
   ========================================================================== */

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

  panier:
    generalRoutes.panier,

  orderTracking:
    generalRoutes.orderTracking,

  account:
    generalRoutes.account,

  favorites:
    generalRoutes.favorites,

  publicProductQrRoot:
    generalRoutes.publicProductQrRoot,

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
   6. ROUTE GROUP EXPORTS
   ==========================================================================
   
   Utiles lorsqu'un fichier travaille uniquement avec une zone.
   
   Exemple :
   
   import {
     generalAppRoutes,
   } from "@/config/routes";
   
   generalAppRoutes.categories
   
   generalAppRoutes.products
   
   generalAppRoutes.panier
   
   Ou :
   
   import {
     gestionnaireAppRoutes,
   } from "@/config/routes";
   
   gestionnaireAppRoutes.dashboard
   ========================================================================== */

export const generalAppRoutes =
  generalRoutes;


export const gestionnaireAppRoutes =
  gestionnaireRoutes;


/* ==========================================================================
   7. ROUTE TYPES
   ==========================================================================
   
   Ces types concernent les routes STATIQUES.
   
   Routes dynamiques Gestionnaire :
   
   gestionnaireRouteBuilders.orderDetails(id)
   
   gestionnaireRouteBuilders.productDetails(id)
   
   gestionnaireRouteBuilders.productEdit(id)
   
   gestionnaireRouteBuilders.productQr(id)
   
   Routes dynamiques publiques :
   
   publicRouteBuilders.categoryBySlug(slug)
   
   publicRouteBuilders.productByQr(qrToken)
   
   ==========================================================================
   
   L'ajout d'une nouvelle propriété dans :
   
   generalRoutes
   
   ou :
   
   gestionnaireRoutes
   
   met automatiquement les types statiques à jour.
   ========================================================================== */

export type GeneralRoute =
  (typeof generalRoutes)[keyof typeof generalRoutes];


export type GestionnaireRoute =
  (typeof gestionnaireRoutes)[keyof typeof gestionnaireRoutes];


export type AppRoute =
  | GeneralRoute
  | GestionnaireRoute;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ARCHITECTURE PUBLIQUE VALIDÉE
 *
 * ============================================================================
 *
 * ACCUEIL
 *
 * /
 *
 * Utiliser :
 *
 * routes.home
 *
 * ou :
 *
 * generalAppRoutes.home
 *
 * ============================================================================
 *
 * PRODUITS — LISTE
 *
 * /produits
 *
 * Utiliser :
 *
 * routes.products
 *
 * ou :
 *
 * generalAppRoutes.products
 *
 * ============================================================================
 *
 * RECHERCHE
 *
 * /recherche
 *
 * Utiliser :
 *
 * routes.search
 *
 * ou :
 *
 * generalAppRoutes.search
 *
 * ============================================================================
 *
 * CATÉGORIES — LISTE
 *
 * /categories
 *
 * Utiliser :
 *
 * routes.categories
 *
 * ou :
 *
 * generalAppRoutes.categories
 *
 * ============================================================================
 *
 * CATÉGORIE — PRODUITS
 *
 * /categories/[slug]
 *
 * Utiliser :
 *
 * publicRouteBuilders.categoryBySlug(categorySlug)
 *
 * ============================================================================
 *
 * NOUVEAUTÉS
 *
 * /nouveautes
 *
 * Utiliser :
 *
 * routes.newProducts
 *
 * ou :
 *
 * generalAppRoutes.newProducts
 *
 * ============================================================================
 *
 * PROMOTIONS
 *
 * /promotions
 *
 * Utiliser :
 *
 * routes.promotions
 *
 * ou :
 *
 * generalAppRoutes.promotions
 *
 * ============================================================================
 *
 * PANIER
 *
 * /panier
 *
 * Utiliser :
 *
 * routes.panier
 *
 * ou :
 *
 * generalAppRoutes.panier
 *
 * ============================================================================
 *
 * SUIVI DE COMMANDE
 *
 * /suivi
 *
 * Utiliser :
 *
 * routes.orderTracking
 *
 * ou :
 *
 * generalAppRoutes.orderTracking
 *
 * ============================================================================
 *
 * COMPTE
 *
 * /compte
 *
 * Utiliser :
 *
 * routes.account
 *
 * ou :
 *
 * generalAppRoutes.account
 *
 * ============================================================================
 *
 * FAVORIS
 *
 * /compte/favoris
 *
 * Utiliser :
 *
 * routes.favorites
 *
 * ou :
 *
 * generalAppRoutes.favorites
 *
 * ============================================================================
 *
 * PRODUIT — DÉTAIL PUBLIC
 *
 * /p/[qrToken]
 *
 * Utiliser :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * La fiche publique représente une OFFRE StoreProduct.
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * qrToken
 *
 * ============================================================================
 *
 * À PROPOS
 *
 * /a-propos
 *
 * Utiliser :
 *
 * routes.about
 *
 * ============================================================================
 *
 * POINTS DE VENTE
 *
 * /points-de-vente
 *
 * Utiliser :
 *
 * routes.pointsOfSale
 *
 * ============================================================================
 *
 * CONTACT
 *
 * /contact
 *
 * Utiliser :
 *
 * routes.contact
 *
 * ============================================================================
 *
 * FAQ
 *
 * /faq
 *
 * Utiliser :
 *
 * routes.faq
 *
 * ============================================================================
 *
 * LIVRAISON
 *
 * /livraison
 *
 * Utiliser :
 *
 * routes.delivery
 *
 * ============================================================================
 *
 * CONDITIONS
 *
 * /conditions
 *
 * Utiliser :
 *
 * routes.terms
 *
 * ============================================================================
 *
 * CONFIDENTIALITÉ
 *
 * /confidentialite
 *
 * Utiliser :
 *
 * routes.privacy
 *
 * ============================================================================
 *
 * GESTIONNAIRE — PRODUIT
 *
 * /gestionnaire/produits/[productId]
 *
 * Utiliser :
 *
 * gestionnaireRouteBuilders.productDetails(productId)
 *
 * ============================================================================
 *
 * AUCUNE ROUTE DYNAMIQUE NE DOIT ÊTRE FABRIQUÉE MANUELLEMENT
 * DANS LES COMPOSANTS OU SERVICES.
 *
 * ============================================================================
 */