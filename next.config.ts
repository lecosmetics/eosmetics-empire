import type {
  NextConfig,
} from "next";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * CONFIGURATION NEXT.JS
 * ============================================================================
 *
 * Fichier :
 *
 * next.config.ts
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - définir la vraie racine Turbopack du projet ;
 * - sécuriser la configuration des images distantes ;
 * - autoriser uniquement le domaine Supabase Cosmetics Empire ;
 * - autoriser uniquement le bucket public `product-images` ;
 * - empêcher l'utilisation d'origines distantes arbitraires ;
 * - conserver les qualités d'images déjà utilisées dans l'application ;
 * - servir directement les fichiers Supabase sans dépendre de
 *   l'optimiseur d'images Next.js ;
 * - éviter les erreurs /_next/image liées aux timeouts réseau ;
 * - conserver le fonctionnement des composants next/image existants.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier ne doit contenir :
 *
 * - aucune clé Supabase ;
 * - aucun service_role ;
 * - aucun token ;
 * - aucun mot de passe ;
 * - aucune donnée privée ;
 * - aucune URL signée privée ;
 * - aucun wildcard Supabase global.
 *
 * ============================================================================
 *
 * SUPABASE OFFICIEL DU PROJET :
 *
 * kusqzexalyiruikfvlrg.supabase.co
 *
 * ============================================================================
 *
 * BUCKET PUBLIC AUTORISÉ :
 *
 * product-images
 *
 * ============================================================================
 */


/* ==========================================================================
   1. SUPABASE STORAGE — CONSTANTES PUBLIQUES
   ========================================================================== */

/**
 * Domaine public Supabase utilisé uniquement pour les images produits.
 *
 * IMPORTANT :
 *
 * Ce hostname n'est pas un secret.
 */
const SUPABASE_PUBLIC_STORAGE_HOSTNAME =
  "kusqzexalyiruikfvlrg.supabase.co";


/**
 * Racine publique autorisée dans Supabase Storage.
 *
 * Une image produit publique doit avoir une URL de la forme :
 *
 * https://kusqzexalyiruikfvlrg.supabase.co/
 * storage/v1/object/public/product-images/...
 */
const SUPABASE_PUBLIC_PRODUCT_IMAGES_PATH =
  "/storage/v1/object/public/product-images/**";


/* ==========================================================================
   2. CONFIGURATION NEXT.JS
   ========================================================================== */

const nextConfig:
  NextConfig = {
    /* =======================================================================
       TURBOPACK
       ======================================================================= */

    /**
     * Force Turbopack à considérer :
     *
     * C:\Users\ADMIN\cosmetics-empire
     *
     * comme racine du projet lorsque Next.js est lancé depuis ce dossier.
     *
     * =========================================================================
     *
     * Cela évite notamment que Turbopack remonte vers un dossier parent
     * contenant éventuellement :
     *
     * - package.json ;
     * - package-lock.json ;
     * - node_modules ;
     * - configuration d'un autre projet.
     *
     * =========================================================================
     */

    turbopack: {
      root:
        process.cwd(),
    },


    /* =======================================================================
       IMAGES
       ======================================================================= */

    images: {
      /* ---------------------------------------------------------------------
         QUALITÉS AUTORISÉES
         ---------------------------------------------------------------------
         
         Ces valeurs correspondent aux usages actuels du projet.
         
         75 :
         
         qualité standard.
         
         90 :
         
         logo / visuels importants.
         
         92 :
         
         grandes images produits / fiches produits.
         
         ---------------------------------------------------------------------
         
         IMPORTANT :
         
         On conserve ces valeurs même avec `unoptimized: true`.
         
         Cela permet de ne pas casser les composants existants utilisant :
         
         quality={90}
         
         ou :
         
         quality={92}
         
         si l'optimisation Next.js est réactivée ultérieurement ou si
         Next.js valide cette configuration.
         
         ---------------------------------------------------------------------
       */

      qualities: [
        75,
        90,
        92,
      ],


      /* ---------------------------------------------------------------------
         ORIGINES DISTANTES AUTORISÉES
         ---------------------------------------------------------------------
         
         On n'autorise PAS :
         
         *.supabase.co
         
         On n'autorise PAS :
         
         /storage/v1/object/public/**
         
         On autorise uniquement :
         
         domaine Cosmetics Empire
         
         +
         
         bucket product-images.
         
         ---------------------------------------------------------------------
         
         URL autorisée :
         
         https://kusqzexalyiruikfvlrg.supabase.co/
         storage/v1/object/public/product-images/produit/image.webp
         
         ---------------------------------------------------------------------
         
         URL d'un autre bucket :
         
         refusée.
         
         URL d'un autre projet Supabase :
         
         refusée.
         
         ---------------------------------------------------------------------
       */

      remotePatterns: [
        {
          protocol:
            "https",

          hostname:
            SUPABASE_PUBLIC_STORAGE_HOSTNAME,

          /**
           * Chaîne vide :
           *
           * port HTTPS standard.
           */
          port:
            "",

          pathname:
            SUPABASE_PUBLIC_PRODUCT_IMAGES_PATH,
        },
      ],


      /* ---------------------------------------------------------------------
         OPTIMISATION NEXT/IMAGE
         ---------------------------------------------------------------------
         
         DÉSACTIVÉE GLOBALEMENT POUR LE MOMENT.
         
         =========================================================================
         
         RAISON :
         
         Avec l'optimisation Next.js active :
         
         navigateur
             ↓
         
         /_next/image
             ↓
         
         serveur Next.js
             ↓
         
         récupération de l'image Supabase
             ↓
         
         transformation / optimisation
             ↓
         
         navigateur
         
         =========================================================================
         
         Cette étape intermédiaire provoquait notamment :
         
         /_next/image?... 500
         
         TimeoutError
         
         =========================================================================
         
         Avec :
         
         unoptimized: true
         
         le flux devient :
         
         navigateur
             ↓
         
         URL publique Supabase Storage
         
         =========================================================================
         
         AVANTAGES DANS L'ARCHITECTURE ACTUELLE :
         
         - suppression du proxy d'image Next.js ;
         - suppression du timeout de transformation Next.js ;
         - moins de travail côté serveur applicatif ;
         - conservation de next/image pour le layout ;
         - conservation de `fill` ;
         - conservation de `sizes` ;
         - conservation de l'accessibilité `alt` ;
         - URL Supabase servie directement.
         
         =========================================================================
         
         IMPORTANT :
         
         Cela ne transforme pas le bucket en bucket privé.
         
         Les ProductImage affichées ici doivent rester des ressources
         publiques réellement prévues pour l'espace public.
         
         =========================================================================
       */

      unoptimized:
        true,
    },
  };


/* ==========================================================================
   3. EXPORT
   ========================================================================== */

export default nextConfig;


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * TURBOPACK
 *
 * Racine :
 *
 * process.cwd()
 *
 * ============================================================================
 *
 * IMAGES LOCALES :
 *
 * Toujours utilisables :
 *
 * /logos/logo.png
 * /images/...
 *
 * ============================================================================
 *
 * IMAGES DISTANTES AUTORISÉES :
 *
 * Domaine :
 *
 * kusqzexalyiruikfvlrg.supabase.co
 *
 * ============================================================================
 *
 * CHEMIN AUTORISÉ :
 *
 * /storage/v1/object/public/product-images/**
 *
 * ============================================================================
 *
 * AUTRES BUCKETS :
 *
 * NON autorisés par cette configuration.
 *
 * ============================================================================
 *
 * AUTRES PROJETS SUPABASE :
 *
 * NON autorisés.
 *
 * ============================================================================
 *
 * QUALITÉS CONNUES :
 *
 * 75
 * 90
 * 92
 *
 * ============================================================================
 *
 * OPTIMISATION NEXT.JS :
 *
 * désactivée actuellement.
 *
 * Les images sont servies directement depuis leur source publique.
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - secret ;
 * - token ;
 * - service_role ;
 * - clé API ;
 * - wildcard Supabase global ;
 * - domaine arbitraire ;
 * - deuxième bucket produit ;
 * - configuration d'image fictive.
 *
 * ============================================================================
 */