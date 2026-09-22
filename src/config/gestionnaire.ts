import { routes } from "@/config/routes";

/* ============================================================
   COSMETICS EMPIRE
   GESTIONNAIRE CONFIGURATION
   ------------------------------------------------------------
   Configuration centrale de l'univers Gestionnaire.

   Ce fichier contient :
   - identité utilisée sur la page ;
   - navigation du header ;
   - contenu du Hero ;
   - fonctionnalités ;
   - bloc connexion / inscription ;
   - statistiques ;
   - avantages ;
   - présence internationale ;
   - chemins des images ;
   - routes utilisées par les CTA.

   RÈGLE :
   Les composants affichent ces données.
   Ils ne doivent pas recopier ces contenus manuellement.
   ============================================================ */


/* ============================================================
   TYPES
   ============================================================ */

export type GestionnaireNavigationItem = {
  id: string;
  label: string;
  href: string;
};

export type GestionnaireFeatureIcon =
  | "package"
  | "shopping-cart"
  | "qr-code"
  | "truck"
  | "chart";

export type GestionnaireFeature = {
  id: string;
  label: string;
  icon: GestionnaireFeatureIcon;
};

export type GestionnaireStatIcon =
  | "store"
  | "users"
  | "globe"
  | "heart";

export type GestionnaireStat = {
  id: string;
  value: string;
  label: string;
  icon: GestionnaireStatIcon;
};

export type GestionnaireBenefitIcon =
  | "diamond"
  | "settings"
  | "headphones"
  | "chart";

export type GestionnaireBenefit = {
  id: string;
  title: string;
  description: string;
  icon: GestionnaireBenefitIcon;
};


/* ============================================================
   BRAND / ASSETS
   ============================================================ */

export const gestionnaireBrand = {
  name: "L&E Cosmétics Empire",
  shortName: "L&E Cosmétics",
  logo: "/logos/logo.png",
  heroImage: "/images/imagea.png",
  logoAlt: "Logo L&E Cosmétics Empire",
  heroImageAlt: "L&E Cosmétics Empire",
} as const;


/* ============================================================
   HEADER NAVIGATION
   ============================================================ */

export const gestionnaireNavigation: readonly GestionnaireNavigationItem[] = [
  {
    id: "home",
    label: "Accueil",
    href: routes.home,
  },
  {
    id: "products",
    label: "Nos Produits",
    href: routes.products,
  },
  {
    id: "about",
    label: "À propos",
    href: routes.about,
  },
  {
    id: "points-of-sale",
    label: "Points de vente",
    href: routes.pointsOfSale,
  },
  {
    id: "gestionnaire",
    label: "Espace Gestionnaire",
    href: routes.gestionnaire.root,
  },
  {
    id: "contact",
    label: "Contact",
    href: routes.contact,
  },
] as const;


/* ============================================================
   HEADER ACTIONS
   ============================================================ */

export const gestionnaireHeader = {
  language: {
    code: "FR",
    label: "Français",
    flag: "🇫🇷",
  },

  shopButton: {
    label: "Voir la boutique",
    href: routes.shop,
  },

  mobileMenu: {
    openLabel: "Ouvrir le menu",
    closeLabel: "Fermer le menu",
  },
} as const;


/* ============================================================
   HERO
   ============================================================ */

export const gestionnaireHero = {
  eyebrow: "REJOIGNEZ L'UNIVERS L&E COSMÉTICS",

  title: {
    firstLine: "Espace Gestionnaire",
    secondLine: "L&E Cosmetics",
  },

  description:
    "Vous êtes une boutique, un point de vente ou un représentant officiel de L&E Cosmetics ? Rejoignez notre réseau et gérez facilement vos produits, commandes, livraisons et bien plus encore.",

  image: {
    src: gestionnaireBrand.heroImage,
    alt: gestionnaireBrand.heroImageAlt,
  },

  signature: {
    firstLine: "Ensemble,",
    secondLine: "plus loin !",
  },

  quote:
    "L&E Cosmetics grandit avec des partenaires engagés partout dans le monde.",
} as const;


/* ============================================================
   HERO FEATURES
   ============================================================ */

export const gestionnaireFeatures: readonly GestionnaireFeature[] = [
  {
    id: "products",
    label: "Ajoutez vos produits",
    icon: "package",
  },
  {
    id: "orders",
    label: "Gérez vos commandes",
    icon: "shopping-cart",
  },
  {
    id: "qr-codes",
    label: "Générez des QR codes",
    icon: "qr-code",
  },
  {
    id: "deliveries",
    label: "Suivez vos livraisons",
    icon: "truck",
  },
  {
    id: "sales",
    label: "Boostez vos ventes",
    icon: "chart",
  },
] as const;


/* ============================================================
   ACCESS CARD
   ------------------------------------------------------------
   Bloc sombre visible à droite du Hero.
   ============================================================ */

export const gestionnaireAccessCard = {
  existingAccount: {
    title: "Déjà inscrit ?",

    description:
      "Accédez à votre espace gestionnaire et continuez à développer vos ventes.",

    button: {
      label: "Connexion",
      href: routes.gestionnaire.login,
    },
  },

  separator: "Pas encore de compte ?",

  newAccount: {
    description:
      "Inscrivez votre boutique ou point de vente en quelques étapes et rejoignez le réseau officiel L&E Cosmetics.",

    button: {
      label: "Enregistrer ma boutique",
      href: routes.gestionnaire.register,
    },
  },

  security: {
    label: "Accès sécurisé • Données protégées",
  },
} as const;


/* ============================================================
   STATISTICS / NETWORK STRIP
   ------------------------------------------------------------
   Ces valeurs reproduisent la maquette fournie.

   Avant une mise en production publique, les données chiffrées
   devront correspondre aux données réelles validées par L&E.
   ============================================================ */

export const gestionnaireStats: readonly GestionnaireStat[] = [
  {
    id: "shops",
    value: "+50",
    label: "Boutiques au Cameroun",
    icon: "store",
  },
  {
    id: "partners",
    value: "+120",
    label: "Partenaires en Afrique",
    icon: "users",
  },
  {
    id: "delivery",
    value: "Livraison",
    label: "Partout dans le monde",
    icon: "globe",
  },
  {
    id: "vision",
    value: "Une seule vision",
    label: "S'embellir chez L&E",
    icon: "heart",
  },
] as const;


/* ============================================================
   BENEFITS SECTION
   ============================================================ */

export const gestionnaireBenefitsSection = {
  title: "Pourquoi devenir gestionnaire ?",

  description:
    "Rejoignez une marque internationale et profitez d'outils performants pour développer votre activité en toute simplicité.",
} as const;


/* ============================================================
   BENEFITS
   ============================================================ */

export const gestionnaireBenefits: readonly GestionnaireBenefit[] = [
  {
    id: "recognized-brand",
    title: "Une marque reconnue",
    description: "Produits de qualité et forte demande",
    icon: "diamond",
  },
  {
    id: "professional-tools",
    title: "Des outils professionnels",
    description: "Gestion simple et efficace",
    icon: "settings",
  },
  {
    id: "support",
    title: "Un accompagnement dédié",
    description: "Notre équipe est là pour vous",
    icon: "headphones",
  },
  {
    id: "opportunities",
    title: "Plus d'opportunités",
    description:
      "Touchez plus de clients au Cameroun, en Afrique et à l'international",
    icon: "chart",
  },
] as const;


/* ============================================================
   INTERNATIONAL PRESENCE
   ============================================================ */

export const gestionnairePresence = {
  title: {
    firstLine: "L&E Cosmetics,",
    secondLine: "présent partout dans le monde",
  },

  description:
    "Du Cameroun à l'international, nos partenaires font rayonner la beauté L&E.",

  button: {
    label: "Rejoignez notre réseau",
    href: routes.gestionnaire.register,
  },
} as const;


/* ============================================================
   COMPLETE PAGE CONFIG
   ------------------------------------------------------------
   Export pratique permettant d'importer toute la configuration
   depuis un seul objet lorsque nécessaire.
   ============================================================ */

export const gestionnaireConfig = {
  brand: gestionnaireBrand,
  header: gestionnaireHeader,
  navigation: gestionnaireNavigation,

  hero: gestionnaireHero,
  features: gestionnaireFeatures,
  accessCard: gestionnaireAccessCard,

  stats: gestionnaireStats,

  benefitsSection: gestionnaireBenefitsSection,
  benefits: gestionnaireBenefits,

  presence: gestionnairePresence,
} as const;


/* ============================================================
   TYPE OF COMPLETE CONFIG
   ============================================================ */

export type GestionnaireConfig = typeof gestionnaireConfig;