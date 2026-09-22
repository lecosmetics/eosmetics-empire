/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * TYPES — PRODUITS PUBLICS
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/products/public-product-types.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les contrats TypeScript réutilisables des offres produits
 * exposées dans l'espace public.
 *
 * ============================================================================
 *
 * UTILISATION :
 *
 * - Accueil ;
 * - Produits ;
 * - Catégories ;
 * - Recherche ;
 * - Nouveautés ;
 * - Promotions ;
 * - fiche produit publique ;
 * - Panier public ;
 * - PublicProductCard ;
 * - futurs composants commerciaux publics.
 *
 * ============================================================================
 *
 * ARCHITECTURE MÉTIER
 *
 * Product
 *    ↓
 * StoreProduct
 *    ↓
 * Store
 *
 * ============================================================================
 *
 * UNE CARTE PUBLIQUE =
 *
 * UNE OFFRE StoreProduct.
 *
 * ============================================================================
 *
 * Product fournit notamment :
 *
 * - id ;
 * - nom ;
 * - slug ;
 * - SKU ;
 * - marque ;
 * - catégorie ;
 * - images.
 *
 * ============================================================================
 *
 * StoreProduct fournit notamment :
 *
 * - id ;
 * - prix ;
 * - prix de référence ;
 * - devise ;
 * - stock ;
 * - seuil de stock faible ;
 * - statut commercial ;
 * - qrToken.
 *
 * ============================================================================
 *
 * Store fournit notamment :
 *
 * - id ;
 * - nom de boutique ;
 * - ville ;
 * - pays.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier NE DOIT PAS :
 *
 * - importer Prisma ;
 * - importer le client Prisma ;
 * - interroger PostgreSQL ;
 * - lire une session ;
 * - importer React ;
 * - importer "server-only" ;
 * - construire une route ;
 * - lire localStorage ;
 * - créer un Panier ;
 * - créer une commande ;
 * - contenir de produit fictif ;
 * - contenir de prix fictif ;
 * - contenir de stock fictif ;
 * - contenir de boutique fictive ;
 * - dépendre d'un composant UI.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. IDENTIFIANTS
   ========================================================================== */

/**
 * StoreProduct.id
 *
 * Identifiant technique d'une offre commerciale.
 */
export type PublicProductOfferId =
  string;


/**
 * Product.id
 */
export type PublicProductId =
  string;


/**
 * Store.id
 */
export type PublicProductStoreId =
  string;


/**
 * ProductCategory.id
 */
export type PublicProductCategoryId =
  string;


/* ==========================================================================
   2. IDENTITÉ PRODUIT
   ========================================================================== */

/**
 * Product.name
 */
export type PublicProductName =
  string;


/**
 * Product.slug
 *
 * IMPORTANT :
 *
 * Ce slug reste une donnée métier Product.
 *
 * La route publique actuelle d'une offre ne dépend PAS de ce slug.
 */
export type PublicProductSlug =
  string;


/**
 * Product.sku
 */
export type PublicProductSku =
  string;


/**
 * Product.brand
 */
export type PublicProductBrand =
  string;


/* ==========================================================================
   3. CATÉGORIE
   ========================================================================== */

/**
 * ProductCategory.name
 */
export type PublicProductCategoryName =
  string;


/**
 * ProductCategory.slug
 */
export type PublicProductCategorySlug =
  string;


/**
 * Catégorie légère associée à un Product.
 *
 * ============================================================================
 *
 * Ce contrat ne construit aucune route.
 *
 * Si une route est nécessaire, elle doit être préparée dans une couche
 * serveur avec :
 *
 * publicRouteBuilders.categoryBySlug(category.slug)
 *
 * ============================================================================
 */
export type PublicProductCategorySummary =
  Readonly<{
    id:
      PublicProductCategoryId;

    name:
      PublicProductCategoryName;

    slug:
      PublicProductCategorySlug;
  }>;


/**
 * Alias sémantique.
 */
export type PublicProductCategory =
  PublicProductCategorySummary;


/* ==========================================================================
   4. QR PUBLIC
   ========================================================================== */

/**
 * StoreProduct.qrToken
 *
 * ============================================================================
 *
 * Ce token identifie UNE offre StoreProduct publique.
 *
 * Il ne contient :
 *
 * - ni prix ;
 * - ni stock ;
 * - ni devise ;
 * - ni données de session.
 *
 * ============================================================================
 */
export type PublicProductQrToken =
  string;


/* ==========================================================================
   5. ROUTE PUBLIQUE
   ========================================================================== */

/**
 * Route publique déjà construite.
 *
 * Exemple :
 *
 * /p/abc123
 *
 * ============================================================================
 *
 * Ce fichier ne doit jamais construire cette valeur.
 *
 * La construction appartient à :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 */
export type PublicProductHref =
  string;


/* ==========================================================================
   6. MONTANTS
   ========================================================================== */

/**
 * Représentation sérialisable d'un Prisma.Decimal.
 *
 * Exemple :
 *
 * Decimal("12900.00")
 *
 * devient :
 *
 * "12900.00"
 *
 * ============================================================================
 *
 * On évite volontairement `number` comme contrat de transport afin de ne
 * pas perdre inutilement la représentation décimale provenant de la base.
 *
 * ============================================================================
 */
export type PublicProductMoneyAmount =
  string;


/**
 * Devise réellement enregistrée sur StoreProduct.
 *
 * Exemples possibles selon les données enregistrées :
 *
 * XAF
 * XOF
 * EUR
 * USD
 *
 * ============================================================================
 *
 * Ce type ne force volontairement aucune liste fermée de devises.
 *
 * ============================================================================
 */
export type PublicProductCurrency =
  string;


/* ==========================================================================
   7. DISPONIBILITÉS AUTORISÉES
   ========================================================================== */

/**
 * Valeurs runtime centralisées.
 *
 * Cela évite d'écrire plusieurs fois les mêmes chaînes dans les guards.
 */
export const PUBLIC_PRODUCT_AVAILABILITY_STATUSES =
  [
    "IN_STOCK",
    "LOW_STOCK",
    "OUT_OF_STOCK",
  ] as const;


/**
 * État de disponibilité calculé côté serveur.
 *
 * IN_STOCK :
 *
 * - StoreProduct ACTIVE ;
 * - stock > 0 ;
 * - hors seuil de stock faible.
 *
 * LOW_STOCK :
 *
 * - StoreProduct ACTIVE ;
 * - stock > 0 ;
 * - stock <= lowStockThreshold.
 *
 * OUT_OF_STOCK :
 *
 * - StoreProduct OUT_OF_STOCK ;
 * - ou stock effectif <= 0.
 */
export type PublicProductAvailabilityStatus =
  (
    typeof PUBLIC_PRODUCT_AVAILABILITY_STATUSES
  )[number];


/**
 * Alias conservé pour les composants souhaitant un nom plus court.
 */
export type PublicProductAvailability =
  PublicProductAvailabilityStatus;


/* ==========================================================================
   8. STATUT COMMERCIAL
   ========================================================================== */

/**
 * Statuts StoreProduct pouvant être représentés publiquement.
 *
 * Sont volontairement exclus :
 *
 * - HIDDEN ;
 * - ARCHIVED.
 */
export const PUBLIC_STORE_PRODUCT_STATUSES =
  [
    "ACTIVE",
    "OUT_OF_STOCK",
  ] as const;


export type PublicStoreProductStatus =
  (
    typeof PUBLIC_STORE_PRODUCT_STATUSES
  )[number];


/**
 * Alias explicite utilisé lorsqu'un composant veut parler du statut
 * commercial public de l'offre.
 */
export type PublicProductCommercialStatus =
  PublicStoreProductStatus;


/* ==========================================================================
   9. IMAGE PRODUIT
   ========================================================================== */

/**
 * Image légère utilisée par les cartes produits et le Panier.
 *
 * Elle provient réellement de ProductImage.
 *
 * Le choix de l'image principale appartient à la couche serveur.
 */
export type PublicProductCardImage =
  Readonly<{
    /**
     * ProductImage.url
     */
    url:
      string;

    /**
     * Texte alternatif final.
     *
     * La couche serveur peut utiliser :
     *
     * - ProductImage.altText lorsqu'il existe ;
     * - sinon Product.name.
     */
    altText:
      string;
  }>;


/**
 * Alias pratique conservé.
 */
export type PublicProductImage =
  PublicProductCardImage;


/* ==========================================================================
   10. LOCALISATION PUBLIQUE
   ========================================================================== */

/**
 * Store.city
 */
export type PublicProductStoreCity =
  string;


/**
 * Store.country
 */
export type PublicProductStoreCountry =
  string;


/**
 * Store.name
 */
export type PublicProductStoreName =
  string;


/**
 * Localisation commerciale provenant exclusivement du Store.
 *
 * Aucun champ city/country n'est artificiellement ajouté à Product.
 */
export type PublicProductStoreLocation =
  Readonly<{
    city:
      PublicProductStoreCity;

    country:
      PublicProductStoreCountry;
  }>;


/* ==========================================================================
   11. BOUTIQUE PUBLIQUE
   ========================================================================== */

/**
 * Informations strictement nécessaires à une représentation publique
 * légère de la boutique responsable d'une offre.
 *
 * ============================================================================
 *
 * Les coordonnées privées ou administratives ne sont pas exposées ici.
 *
 * ============================================================================
 */
export type PublicProductCardStore =
  Readonly<{
    /**
     * Store.id
     */
    id:
      PublicProductStoreId;

    /**
     * Store.name
     */
    name:
      PublicProductStoreName;

    /**
     * Store.city
     */
    city:
      PublicProductStoreCity;

    /**
     * Store.country
     */
    country:
      PublicProductStoreCountry;
  }>;


/**
 * Alias réutilisable.
 */
export type PublicProductStore =
  PublicProductCardStore;


/* ==========================================================================
   12. IDENTITÉ D'OFFRE
   ========================================================================== */

/**
 * Identifiants minimaux permettant de distinguer correctement :
 *
 * Product
 *
 * et
 *
 * StoreProduct.
 */
export type PublicProductOfferIdentity =
  Readonly<{
    /**
     * StoreProduct.id
     */
    storeProductId:
      PublicProductOfferId;

    /**
     * Product.id
     */
    productId:
      PublicProductId;
  }>;


/* ==========================================================================
   13. IDENTITÉ PRODUIT LÉGÈRE
   ========================================================================== */

export type PublicProductIdentity =
  Readonly<{
    id:
      PublicProductId;

    name:
      PublicProductName;

    slug:
      PublicProductSlug;

    sku:
      PublicProductSku;

    brand?:
      PublicProductBrand;
  }>;


/* ==========================================================================
   14. SNAPSHOT DE PRIX
   ========================================================================== */

/**
 * Contrat léger permettant à d'autres composants publics d'utiliser
 * uniquement les informations tarifaires d'une offre.
 *
 * ============================================================================
 *
 * Ce snapshot est une donnée d'affichage.
 *
 * Toute création de commande ou paiement devra recharger le prix actuel
 * côté serveur.
 *
 * ============================================================================
 */
export type PublicProductPriceSnapshot =
  Readonly<{
    price:
      PublicProductMoneyAmount;

    compareAtPrice:
      PublicProductMoneyAmount |
      null;

    currency:
      PublicProductCurrency;
  }>;


/* ==========================================================================
   15. SNAPSHOT DE RÉDUCTION
   ========================================================================== */

/**
 * Contrat générique pour une vraie réduction déjà calculée côté serveur.
 *
 * Aucune promotion n'est inventée dans ce fichier.
 */
export type PublicProductDiscountSnapshot =
  Readonly<{
    hasDiscount:
      boolean;

    compareAtPrice:
      PublicProductMoneyAmount |
      null;

    savingsAmount:
      PublicProductMoneyAmount |
      null;

    discountPercentage:
      number |
      null;
  }>;


/* ==========================================================================
   16. SNAPSHOT DE STOCK
   ========================================================================== */

/**
 * Contrat léger de disponibilité publique.
 *
 * ============================================================================
 *
 * Le stock affiché reste informatif.
 *
 * Toute création de commande devra toujours revérifier le stock côté serveur.
 *
 * ============================================================================
 */
export type PublicProductStockSnapshot =
  Readonly<{
    stockQuantity:
      number;

    availability:
      PublicProductAvailabilityStatus;

    status:
      PublicStoreProductStatus;
  }>;


/* ==========================================================================
   17. DONNÉES MINIMALES POUR AJOUT AU PANIER
   ========================================================================== */

/**
 * Un bouton public "Ajouter au panier" n'a besoin que de l'identifiant
 * StoreProduct pour identifier l'offre commerciale.
 *
 * ============================================================================
 *
 * Le prix, le stock et la devise ne doivent pas être transmis ici comme
 * source de vérité.
 *
 * ============================================================================
 */
export type PublicProductPanierReference =
  Readonly<{
    storeProductId:
      PublicProductOfferId;
  }>;


/* ==========================================================================
   18. CARTE PRODUIT PUBLIQUE
   ========================================================================== */

/**
 * Structure principale utilisée pour représenter une offre commerciale
 * publique dans les listes et carrousels.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Chaque objet correspond exactement à UN StoreProduct.
 *
 * ============================================================================
 *
 * Exemple :
 *
 * Product X
 *
 * StoreProduct A
 * → Yaoundé
 * → 12 900 XAF
 *
 * StoreProduct B
 * → Libreville
 * → 15 000 XAF
 *
 * ============================================================================
 *
 * Les deux objets doivent rester distincts.
 *
 * Il ne faut jamais dédupliquer ces offres uniquement avec Product.id.
 *
 * ============================================================================
 */
export type PublicProductCardData =
  Readonly<{
    /**
     * Identité principale de la carte.
     *
     * StoreProduct.id
     */
    id:
      PublicProductOfferId;

    /**
     * Product.id
     */
    productId:
      PublicProductId;

    /**
     * StoreProduct.id
     *
     * Conservé explicitement afin qu'aucun composant ne confonde :
     *
     * Product
     *
     * et
     *
     * StoreProduct.
     *
     * En pratique :
     *
     * id === storeProductId
     */
    storeProductId:
      PublicProductOfferId;

    /**
     * Product.name
     */
    name:
      PublicProductName;

    /**
     * Product.slug
     */
    slug:
      PublicProductSlug;

    /**
     * Product.sku
     */
    sku:
      PublicProductSku;

    /**
     * Product.brand
     *
     * ==========================================================================
     *
     * Facultatif dans le contrat de carte afin de ne pas obliger toutes les
     * requêtes légères déjà existantes à sélectionner la marque.
     *
     * Une couche nécessitant obligatoirement la marque devra utiliser son
     * propre contrat plus strict.
     *
     * ==========================================================================
     */
    brand?:
      PublicProductBrand;

    /**
     * Product.category
     *
     * ==========================================================================
     *
     * Facultatif afin de préserver les requêtes existantes qui ne chargent
     * pas la catégorie.
     *
     * Les pages ayant besoin de l'afficher peuvent enrichir la carte avec
     * cette donnée réelle.
     *
     * ==========================================================================
     */
    category?:
      PublicProductCategorySummary |
      null;

    /**
     * Image réelle du produit.
     *
     * Une offre utilisée dans PublicProductCard doit disposer d'une image.
     */
    image:
      PublicProductCardImage;

    /**
     * StoreProduct.price
     *
     * Decimal déjà sérialisé côté serveur.
     */
    price:
      PublicProductMoneyAmount;

    /**
     * StoreProduct.compareAtPrice
     *
     * Null lorsque :
     *
     * - aucun prix de référence n'existe ;
     * - compareAtPrice <= price ;
     * - la donnée est incohérente.
     */
    compareAtPrice:
      PublicProductMoneyAmount |
      null;

    /**
     * StoreProduct.currency
     */
    currency:
      PublicProductCurrency;

    /**
     * StoreProduct.stockQuantity normalisé.
     */
    stockQuantity:
      number;

    /**
     * Disponibilité calculée par la couche serveur.
     */
    availability:
      PublicProductAvailabilityStatus;

    /**
     * Statut commercial public réel du StoreProduct.
     *
     * HIDDEN et ARCHIVED ne sont pas autorisés par ce contrat.
     */
    status:
      PublicStoreProductStatus;

    /**
     * Route publique canonique déjà construite côté serveur.
     *
     * Exemple d'origine :
     *
     * publicRouteBuilders.productByQr(qrToken)
     *
     * ==========================================================================
     *
     * Ce fichier ne construit jamais cette valeur.
     *
     * ==========================================================================
     */
    href:
      PublicProductHref;

    /**
     * Point de vente réel responsable de cette offre.
     */
    store:
      PublicProductCardStore;
  }>;


/* ==========================================================================
   19. COLLECTION DE CARTES
   ========================================================================== */

/**
 * Liste immuable d'offres publiques.
 */
export type PublicProductCardCollection =
  readonly PublicProductCardData[];


/* ==========================================================================
   20. EXTRACTIONS DE TYPES — PRIX
   ========================================================================== */

/**
 * Prix extrait directement du contrat principal.
 */
export type PublicProductCardPrice =
  Pick<
    PublicProductCardData,
    | "price"
    | "compareAtPrice"
    | "currency"
  >;


/* ==========================================================================
   21. EXTRACTIONS DE TYPES — STOCK
   ========================================================================== */

/**
 * Stock extrait directement du contrat principal.
 */
export type PublicProductCardInventory =
  Pick<
    PublicProductCardData,
    | "stockQuantity"
    | "availability"
    | "status"
  >;


/* ==========================================================================
   22. EXTRACTIONS DE TYPES — IDENTITÉ PRODUIT
   ========================================================================== */

/**
 * Identité produit légère extraite de la carte.
 */
export type PublicProductCardIdentity =
  Pick<
    PublicProductCardData,
    | "productId"
    | "name"
    | "slug"
    | "sku"
  >;


/* ==========================================================================
   23. EXTRACTIONS DE TYPES — IDENTITÉ OFFRE
   ========================================================================== */

export type PublicProductCardOfferIdentity =
  Pick<
    PublicProductCardData,
    | "id"
    | "productId"
    | "storeProductId"
  >;


/* ==========================================================================
   24. EXTRACTIONS DE TYPES — ROUTE
   ========================================================================== */

export type PublicProductCardRoute =
  Pick<
    PublicProductCardData,
    "href"
  >;


/* ==========================================================================
   25. EXTRACTIONS DE TYPES — BOUTIQUE
   ========================================================================== */

export type PublicProductCardStoreSnapshot =
  Pick<
    PublicProductCardData,
    "store"
  >;


/* ==========================================================================
   26. EXTRACTIONS — CATÉGORIE
   ========================================================================== */

export type PublicProductCardCategory =
  PublicProductCardData[
    "category"
  ];


/* ==========================================================================
   27. PROPS — CARTE PRODUIT
   ========================================================================== */

/**
 * Props utilisées par :
 *
 * src/components/public/products/PublicProductCard.tsx
 */
export type PublicProductCardProps =
  Readonly<{
    /**
     * Offre commerciale réelle.
     */
    product:
      PublicProductCardData;

    /**
     * Active éventuellement le chargement prioritaire Next/Image.
     *
     * Cette propriété est purement visuelle.
     */
    imagePriority?:
      boolean;

    /**
     * Classe CSS facultative fournie par le parent.
     *
     * Elle doit uniquement servir au positionnement / layout.
     */
    className?:
      string;
  }>;


/* ==========================================================================
   28. TYPE GUARD — DISPONIBILITÉ
   ========================================================================== */

/**
 * Vérifie uniquement l'appartenance à l'union TypeScript publique.
 *
 * ============================================================================
 *
 * Cette fonction ne détermine PAS elle-même si un produit est réellement
 * disponible.
 *
 * Cette décision appartient à la couche serveur.
 *
 * ============================================================================
 */
export function isPublicProductAvailabilityStatus(
  value:
    unknown,
): value is PublicProductAvailabilityStatus {
  return (
    typeof value ===
      "string" &&
    (
      PUBLIC_PRODUCT_AVAILABILITY_STATUSES as readonly string[]
    ).includes(
      value,
    )
  );
}


/* ==========================================================================
   29. TYPE GUARD — STATUT STORE PRODUCT
   ========================================================================== */

/**
 * Vérifie uniquement qu'une valeur appartient aux statuts StoreProduct
 * autorisés dans les contrats publics.
 *
 * ============================================================================
 *
 * Cette fonction ne remplace aucune vérification Prisma / serveur.
 *
 * ============================================================================
 */
export function isPublicStoreProductStatus(
  value:
    unknown,
): value is PublicStoreProductStatus {
  return (
    typeof value ===
      "string" &&
    (
      PUBLIC_STORE_PRODUCT_STATUSES as readonly string[]
    ).includes(
      value,
    )
  );
}


/* ==========================================================================
   30. TYPE GUARD — MONTANT SÉRIALISÉ
   ========================================================================== */

/**
 * Vérifie uniquement qu'une valeur ressemble à un montant décimal positif
 * ou nul sérialisé.
 *
 * ============================================================================
 *
 * Exemples acceptés :
 *
 * "0"
 * "12900"
 * "12900.00"
 *
 * ============================================================================
 *
 * Cette fonction :
 *
 * - ne convertit pas de devise ;
 * - ne valide pas un prix métier ;
 * - ne remplace pas Prisma.Decimal ;
 * - ne décide pas qu'une offre est commercialisable.
 *
 * ============================================================================
 */
export function isPublicProductMoneyAmount(
  value:
    unknown,
): value is PublicProductMoneyAmount {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }


  const normalized =
    value.trim();


  if (
    normalized.length ===
    0
  ) {
    return false;
  }


  return /^\d+(?:\.\d+)?$/.test(
    normalized,
  );
}


/* ==========================================================================
   31. TYPE GUARD — DEVISE
   ========================================================================== */

/**
 * Vérification légère d'un code devise standardisé sur trois lettres.
 *
 * ============================================================================
 *
 * La base reste la source de vérité.
 *
 * Aucune liste fermée XAF/XOF/EUR/etc. n'est imposée ici.
 *
 * ============================================================================
 */
export function isPublicProductCurrency(
  value:
    unknown,
): value is PublicProductCurrency {
  return (
    typeof value ===
      "string" &&
    /^[A-Z]{3}$/.test(
      value.trim(),
    )
  );
}


/* ==========================================================================
   32. GARANTIES DU CONTRAT CARTE
   ========================================================================== */

/**
 * ============================================================================
 *
 * PublicProductCardData garantit obligatoirement :
 *
 * - une offre StoreProduct distincte ;
 * - un Product réel ;
 * - une image réelle ;
 * - un nom réel ;
 * - un SKU réel ;
 * - un prix sérialisé ;
 * - une devise réelle ;
 * - un stock réel normalisé ;
 * - une disponibilité calculée côté serveur ;
 * - un statut commercial public ;
 * - une route publique déjà construite ;
 * - une boutique réelle ;
 * - une ville réelle ;
 * - un pays réel.
 *
 * ============================================================================
 *
 * PublicProductCardData peut aussi être enrichi avec :
 *
 * - brand ;
 * - category.
 *
 * Ces deux champs restent facultatifs afin de ne pas casser les requêtes
 * légères déjà utilisées par l'Accueil et les anciennes cartes.
 *
 * ============================================================================
 *
 * Ce contrat n'autorise pas comme statut public :
 *
 * - HIDDEN ;
 * - ARCHIVED.
 *
 * ============================================================================
 *
 * Il n'autorise pas non plus :
 *
 * - un Prisma.Decimal transmis directement à React ;
 * - une image nullable sur la carte finale ;
 * - une ville nullable sur la carte finale ;
 * - un pays nullable sur la carte finale ;
 * - une construction de route dans ce fichier ;
 * - une déduplication des offres par Product.id.
 *
 * ============================================================================
 */


/* ==========================================================================
   33. GARANTIES PANIER
   ========================================================================== */

/**
 * ============================================================================
 *
 * Pour l'ajout au Panier :
 *
 * StoreProduct.id
 *
 * est l'identité commerciale nécessaire.
 *
 * ============================================================================
 *
 * Le navigateur ne doit pas être considéré comme source de vérité pour :
 *
 * - price ;
 * - compareAtPrice ;
 * - currency ;
 * - stockQuantity ;
 * - availability ;
 * - status.
 *
 * ============================================================================
 *
 * Ces données doivent être relues côté serveur avant :
 *
 * - validation du Panier ;
 * - création de commande ;
 * - réservation de stock ;
 * - paiement.
 *
 * ============================================================================
 */


/* ==========================================================================
   34. GARANTIES ROUTES
   ========================================================================== */

/**
 * ============================================================================
 *
 * Ce fichier expose uniquement des TYPES de routes :
 *
 * PublicProductHref
 *
 * PublicProductQrToken
 *
 * ============================================================================
 *
 * Il ne construit aucun pathname.
 *
 * Les routes restent centralisées dans :
 *
 * src/config/routes.ts
 *
 * ============================================================================
 *
 * Détail public :
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * Catégorie :
 *
 * publicRouteBuilders.categoryBySlug(categorySlug)
 *
 * ============================================================================
 */


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * IDENTITÉ COMMERCIALE :
 *
 * StoreProduct.id
 *
 * ============================================================================
 *
 * IDENTITÉ PRODUIT :
 *
 * Product.id
 *
 * ============================================================================
 *
 * URL PUBLIQUE :
 *
 * StoreProduct.qrToken
 *
 *        ↓
 *
 * publicRouteBuilders.productByQr(qrToken)
 *
 * ============================================================================
 *
 * PRIX / STOCK / DEVISE :
 *
 * toujours issus du StoreProduct réel côté serveur.
 *
 * ============================================================================
 *
 * AUCUNE DONNÉE MÉTIER N'EST INVENTÉE DANS CE FICHIER.
 *
 * ============================================================================
 */