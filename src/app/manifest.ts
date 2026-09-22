import type {
  MetadataRoute,
} from "next";

/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PWA — WEB APP MANIFEST
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/manifest.ts
 *
 * RÔLE :
 *
 * - déclarer l'application installable ;
 * - définir le nom affiché sur PC / Android / iPhone ;
 * - définir l'URL de démarrage ;
 * - ouvrir l'application en mode standalone ;
 * - utiliser l'identité visuelle officielle L&E Cosmetics ;
 * - déclarer les icônes PWA dédiées.
 *
 * IMPORTANT :
 *
 * Les fichiers suivants devront exister dans public/icons/pwa/ :
 *
 * - icon-192.png
 * - icon-512.png
 * - icon-maskable-192.png
 * - icon-maskable-512.png
 *
 * L'icône Apple dédiée sera ajoutée séparément via :
 *
 * src/app/apple-icon.png
 *
 * ============================================================================
 */


export default function manifest():
  MetadataRoute.Manifest {
  return {
    id:
      "/",

    name:
      "L&E Cosmetics Empire",

    short_name:
      "L&E Cosmetics",

    description:
      "Boutique officielle L&E Cosmetics Empire.",

    start_url:
      "/",

    scope:
      "/",

    display:
      "standalone",

    background_color:
      "#ffffff",

    theme_color:
      "#e6007e",

    orientation:
      "any",

    categories: [
      "beauty",
      "shopping",
      "lifestyle",
    ],

    icons: [
      {
        src:
          "/icons/pwa/icon-192.png",

        sizes:
          "192x192",

        type:
          "image/png",

        purpose:
          "any",
      },

      {
        src:
          "/icons/pwa/icon-512.png",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "any",
      },

      {
        src:
          "/icons/pwa/icon-maskable-192.png",

        sizes:
          "192x192",

        type:
          "image/png",

        purpose:
          "maskable",
      },

      {
        src:
          "/icons/pwa/icon-maskable-512.png",

        sizes:
          "512x512",

        type:
          "image/png",

        purpose:
          "maskable",
      },
    ],
  };
}
