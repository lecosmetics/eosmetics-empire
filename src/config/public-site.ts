/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * CONFIGURATION PUBLIQUE DU SITE
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/public-site.ts
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - centraliser l'identité publique de L&E Cosmetics Empire ;
 * - centraliser le logo officiel ;
 * - centraliser les coordonnées officielles ;
 * - centraliser les réseaux sociaux officiels ;
 * - centraliser les implantations actuellement disponibles ;
 * - centraliser les informations publiques de livraison ;
 * - centraliser les informations publiques d'assistance ;
 * - fournir une seule source de vérité au shell public ;
 * - fournir une seule source de vérité aux fiches produits publiques ;
 * - éviter de recopier les mêmes informations dans plusieurs composants.
 *
 * ============================================================================
 *
 * UTILISÉ NOTAMMENT PAR :
 *
 * - PublicDesktopHeader.tsx ;
 * - PublicMobileHeader.tsx ;
 * - PublicMobileDrawer.tsx ;
 * - PublicFooter.tsx ;
 * - PublicProductDetail.tsx ;
 * - PublicHomeContactSection.tsx ;
 * - futures pages Livraison / Contact.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - ne contient aucune logique React ;
 * - ne contient aucune donnée Prisma ;
 * - ne dépend pas d'une session Gestionnaire ;
 * - ne contient aucune route produit ;
 * - ne contient aucun secret ;
 * - ne contient aucun token ;
 * - ne contient aucune clé API ;
 * - ne contient aucun prix produit ;
 * - ne contient aucun stock ;
 * - ne contient aucun délai de livraison fictif ;
 * - ne contient aucun tarif de livraison fictif ;
 * - ne contient aucune fausse implantation ;
 * - ne contient aucune fausse coordonnée.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. TYPES — IMPLANTATIONS
   ========================================================================== */

export interface PublicSiteLocation {
  readonly id:
    string;

  readonly city:
    string;

  readonly country:
    string;

  readonly label:
    string;
}


/* ==========================================================================
   2. TYPES — RÉSEAUX SOCIAUX
   ========================================================================== */

export interface PublicSiteSocialLink {
  readonly id:
    | "tiktok"
    | "facebook"
    | "instagram";

  readonly label:
    string;

  readonly handle:
    string;

  readonly href:
    string;
}


/* ==========================================================================
   3. TYPES — TÉLÉPHONE / WHATSAPP
   ========================================================================== */

export interface PublicSitePhoneContact {
  readonly label:
    string;

  readonly display:
    string;

  readonly international:
    string;

  readonly href:
    string;
}


/* ==========================================================================
   4. TYPES — E-MAIL
   ========================================================================== */

export interface PublicSiteEmailContact {
  readonly label:
    string;

  readonly address:
    string;

  readonly href:
    string;
}


/* ==========================================================================
   5. TYPES — LIVRAISON
   ========================================================================== */

export type PublicSiteDeliveryCoverageId =
  | "africa"
  | "international";


export interface PublicSiteDeliveryCoverage {
  readonly id:
    PublicSiteDeliveryCoverageId;

  readonly label:
    string;

  readonly title:
    string;

  readonly description:
    string;
}


export interface PublicSiteDeliveryConfig {
  /**
   * Titre commercial public.
   */
  readonly title:
    string;

  /**
   * Description générale.
   */
  readonly description:
    string;

  /**
   * Zones de livraison officiellement présentées.
   */
  readonly coverage:
    readonly PublicSiteDeliveryCoverage[];

  /**
   * Message prudent utilisé lorsque les frais et délais ne sont pas encore
   * connus avant détermination de la destination.
   */
  readonly destinationNotice:
    string;

  /**
   * Aucun prix ou délai n'est garanti depuis ce fichier.
   */
  readonly pricingNotice:
    string;
}


/* ==========================================================================
   6. TYPES — ASSISTANCE
   ========================================================================== */

export interface PublicSiteSupportConfig {
  readonly title:
    string;

  readonly description:
    string;

  readonly whatsapp:
    PublicSitePhoneContact;

  readonly phone:
    PublicSitePhoneContact;

  readonly email:
    PublicSiteEmailContact;
}


/* ==========================================================================
   7. BRAND
   ========================================================================== */

export const PUBLIC_SITE_BRAND = {
  name:
    "L&E Cosmetics Empire",

  shortName:
    "L&E Cosmetics",

  projectName:
    "Cosmetics Empire",

  slogan:
    "S’embellir chez L&E",

  logo: {
    src:
      "/logos/logo.png",

    alt:
      "L&E Cosmetics Empire",

    width:
      320,

    height:
      220,
  },
} as const;


/* ==========================================================================
   8. TÉLÉPHONE
   ========================================================================== */

export const PUBLIC_SITE_PHONE:
  PublicSitePhoneContact = {
    label:
      "Téléphone",

    display:
      "+237 6 94 72 46 91",

    international:
      "+237694724691",

    href:
      "tel:+237694724691",
  };


/* ==========================================================================
   9. WHATSAPP
   ========================================================================== */

export const PUBLIC_SITE_WHATSAPP:
  PublicSitePhoneContact = {
    label:
      "WhatsApp",

    display:
      "+237 6 55 10 45 08",

    international:
      "+237655104508",

    href:
      "https://wa.me/237655104508",
  };


/* ==========================================================================
   10. E-MAIL
   ========================================================================== */

export const PUBLIC_SITE_EMAIL:
  PublicSiteEmailContact = {
    label:
      "E-mail",

    address:
      "contact@lecosmetics-empire.com",

    href:
      "mailto:contact@lecosmetics-empire.com",
  };


/* ==========================================================================
   11. RÉSEAUX SOCIAUX
   ========================================================================== */

export const PUBLIC_SITE_SOCIALS =
  [
    {
      id:
        "tiktok",

      label:
        "TikTok",

      handle:
        "l_ecosmetic",

      href:
        "https://www.tiktok.com/@l_ecosmetic",
    },

    {
      id:
        "facebook",

      label:
        "Facebook",

      handle:
        "lecosmeticsltd",

      href:
        "https://www.facebook.com/lecosmeticsltd",
    },

    {
      id:
        "instagram",

      label:
        "Instagram",

      handle:
        "lecosmetics",

      href:
        "https://www.instagram.com/lecosmetics",
    },
  ] as const satisfies readonly PublicSiteSocialLink[];


/* ==========================================================================
   12. IMPLANTATIONS
   ========================================================================== */

/**
 * IMPORTANT :
 *
 * Cette liste représente uniquement les implantations actuellement
 * renseignées dans la configuration publique.
 *
 * Elle ne doit pas être utilisée pour inventer :
 *
 * - une boutique ;
 * - une agence ;
 * - un stock ;
 * - une disponibilité produit.
 *
 * La disponibilité d'une offre StoreProduct provient toujours de PostgreSQL.
 */

export const PUBLIC_SITE_LOCATIONS =
  [
    {
      id:
        "ouagadougou-burkina-faso",

      city:
        "Ouagadougou",

      country:
        "Burkina Faso",

      label:
        "Ouagadougou, Burkina Faso",
    },

    {
      id:
        "kinshasa-rdc",

      city:
        "Kinshasa",

      country:
        "République démocratique du Congo",

      label:
        "Kinshasa, République démocratique du Congo",
    },

    {
      id:
        "niamey-niger",

      city:
        "Niamey",

      country:
        "Niger",

      label:
        "Niamey, Niger",
    },

    {
      id:
        "yaounde-cameroun",

      city:
        "Yaoundé",

      country:
        "Cameroun",

      label:
        "Yaoundé, Cameroun",
    },

    {
      id:
        "abidjan-cote-divoire",

      city:
        "Abidjan",

      country:
        "Côte d'Ivoire",

      label:
        "Abidjan, Côte d'Ivoire",
    },

    {
      id:
        "libreville-gabon",

      city:
        "Libreville",

      country:
        "Gabon",

      label:
        "Libreville, Gabon",
    },
  ] as const satisfies readonly PublicSiteLocation[];


/* ==========================================================================
   13. LIVRAISON — ZONES
   ========================================================================== */

/**
 * Règle commerciale publique :
 *
 * L&E Cosmetics Empire propose la livraison :
 *
 * - en Afrique ;
 * - à l'international.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * On n'écrit volontairement ici :
 *
 * - aucun tarif ;
 * - aucun délai garanti ;
 * - aucun transporteur ;
 * - aucune gratuité ;
 * - aucune date de réception.
 *
 * Ces éléments dépendront notamment de la destination et du futur système
 * de livraison / commande.
 *
 * ============================================================================
 */

export const PUBLIC_SITE_DELIVERY_COVERAGE =
  [
    {
      id:
        "africa",

      label:
        "Afrique",

      title:
        "Livraison en Afrique",

      description:
        "L&E Cosmetics Empire propose l’expédition de ses produits vers les destinations desservies en Afrique.",
    },

    {
      id:
        "international",

      label:
        "International",

      title:
        "Livraison internationale",

      description:
        "Les produits L&E Cosmetics Empire peuvent également être expédiés vers les destinations internationales desservies.",
    },
  ] as const satisfies readonly PublicSiteDeliveryCoverage[];


/* ==========================================================================
   14. LIVRAISON — CONFIGURATION GLOBALE
   ========================================================================== */

export const PUBLIC_SITE_DELIVERY:
  PublicSiteDeliveryConfig = {
    title:
      "Livraison en Afrique et à l’international",

    description:
      "L&E Cosmetics Empire propose l’expédition de ses produits en Afrique ainsi que vers les destinations internationales desservies.",

    coverage:
      PUBLIC_SITE_DELIVERY_COVERAGE,

    destinationNotice:
      "Les modalités de livraison dépendent de la destination sélectionnée.",

    pricingNotice:
      "Les frais et délais de livraison sont déterminés selon la destination et les conditions applicables à la commande.",
  };


/* ==========================================================================
   15. CONTACT GLOBAL
   ========================================================================== */

export const PUBLIC_SITE_CONTACT = {
  phone:
    PUBLIC_SITE_PHONE,

  whatsapp:
    PUBLIC_SITE_WHATSAPP,

  email:
    PUBLIC_SITE_EMAIL,
} as const;


/* ==========================================================================
   16. ASSISTANCE PUBLIQUE
   ========================================================================== */

/**
 * Configuration commune pour :
 *
 * - fiche produit ;
 * - page Contact ;
 * - Footer ;
 * - pages d'aide ;
 * - future page Livraison.
 *
 * Aucun canal fictif n'est ajouté.
 */

export const PUBLIC_SITE_SUPPORT:
  PublicSiteSupportConfig = {
    title:
      "Besoin d’aide ?",

    description:
      "Contactez L&E Cosmetics Empire pour toute question concernant un produit, une commande ou une livraison.",

    whatsapp:
      PUBLIC_SITE_WHATSAPP,

    phone:
      PUBLIC_SITE_PHONE,

    email:
      PUBLIC_SITE_EMAIL,
  };


/* ==========================================================================
   17. CONFIGURATION COMPLÈTE
   ========================================================================== */

/**
 * Objet principal à utiliser lorsqu'un composant a besoin de plusieurs
 * informations publiques du site.
 *
 * ============================================================================
 *
 * EXEMPLES :
 *
 * PUBLIC_SITE.brand.name
 *
 * PUBLIC_SITE.brand.logo.src
 *
 * PUBLIC_SITE.contact.phone.display
 *
 * PUBLIC_SITE.contact.whatsapp.href
 *
 * PUBLIC_SITE.contact.email.href
 *
 * PUBLIC_SITE.socials
 *
 * PUBLIC_SITE.locations
 *
 * PUBLIC_SITE.delivery.title
 *
 * PUBLIC_SITE.delivery.coverage
 *
 * PUBLIC_SITE.delivery.destinationNotice
 *
 * PUBLIC_SITE.support.whatsapp.href
 *
 * ============================================================================
 */

export const PUBLIC_SITE = {
  brand:
    PUBLIC_SITE_BRAND,

  contact:
    PUBLIC_SITE_CONTACT,

  socials:
    PUBLIC_SITE_SOCIALS,

  locations:
    PUBLIC_SITE_LOCATIONS,

  delivery:
    PUBLIC_SITE_DELIVERY,

  support:
    PUBLIC_SITE_SUPPORT,
} as const;


/* ==========================================================================
   18. TYPES DÉRIVÉS
   ========================================================================== */

export type PublicSiteConfig =
  typeof PUBLIC_SITE;


export type PublicSiteSocial =
  (
    typeof PUBLIC_SITE_SOCIALS
  )[number];


export type PublicSiteLocationItem =
  (
    typeof PUBLIC_SITE_LOCATIONS
  )[number];


export type PublicSiteDeliveryCoverageItem =
  (
    typeof PUBLIC_SITE_DELIVERY_COVERAGE
  )[number];


export type PublicSiteDelivery =
  typeof PUBLIC_SITE_DELIVERY;


export type PublicSiteSupport =
  typeof PUBLIC_SITE_SUPPORT;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * SOURCE PUBLIQUE UNIQUE :
 *
 * PUBLIC_SITE
 *
 * ============================================================================
 *
 * IDENTITÉ :
 *
 * PUBLIC_SITE.brand
 *
 * ============================================================================
 *
 * CONTACT :
 *
 * PUBLIC_SITE.contact.phone
 *
 * PUBLIC_SITE.contact.whatsapp
 *
 * PUBLIC_SITE.contact.email
 *
 * ============================================================================
 *
 * RÉSEAUX :
 *
 * PUBLIC_SITE.socials
 *
 * ============================================================================
 *
 * IMPLANTATIONS :
 *
 * PUBLIC_SITE.locations
 *
 * ============================================================================
 *
 * LIVRAISON :
 *
 * PUBLIC_SITE.delivery
 *
 * Livraison en Afrique
 *
 * +
 *
 * Livraison internationale
 *
 * ============================================================================
 *
 * ASSISTANCE :
 *
 * PUBLIC_SITE.support
 *
 * ============================================================================
 *
 * FICHE PRODUIT :
 *
 * PublicProductDetail.tsx peut maintenant utiliser :
 *
 * PUBLIC_SITE.delivery.title
 *
 * PUBLIC_SITE.delivery.coverage
 *
 * PUBLIC_SITE.delivery.destinationNotice
 *
 * PUBLIC_SITE.delivery.pricingNotice
 *
 * PUBLIC_SITE.support.whatsapp.href
 *
 * ============================================================================
 *
 * RÈGLE MOBILE DE /p/[qrToken] :
 *
 * Le Footer mobile n'est PAS géré ici.
 *
 * Il reste géré dans :
 *
 * public-product-detail.module.css
 *
 * ============================================================================
 *
 * DESKTOP :
 *
 * Header
 * Fiche produit premium
 * Footer
 *
 * ============================================================================
 *
 * MOBILE :
 *
 * Header
 * Fiche produit premium
 *
 * PAS DE FOOTER
 *
 * Puis navigation fixe :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * ============================================================================
 */