import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";

import PwaRegistration from "@/components/pwa/PwaRegistration";

import "./globals.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ROOT LAYOUT
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/layout.tsx
 *
 * RESPONSABILITÉS :
 *
 * - langue principale ;
 * - police globale ;
 * - metadata générales ;
 * - metadata Open Graph ;
 * - metadata Twitter / réseaux sociaux ;
 * - favicon / icône navigateur ;
 * - metadata PWA ;
 * - support iPhone / iPad ;
 * - enregistrement global du Service Worker ;
 * - viewport ;
 * - CSS global.
 *
 * IMPORTANT :
 *
 * Aucun header, menu ou contenu métier ne doit être ajouté ici.
 *
 * ============================================================================
 */


/* ==========================================================================
   FONT
   ========================================================================== */

const geist =
  Geist({
    subsets: [
      "latin",
    ],

    display:
      "swap",

    variable:
      "--font-geist",
  });


/* ==========================================================================
   METADATA BASE
   ========================================================================== */

function resolveMetadataBase():
  URL {
  const configuredUrl =
    process.env
      .NEXT_PUBLIC_SITE_URL
      ?.trim() ??
    process.env
      .SITE_URL
      ?.trim() ??
    "";


  if (
    configuredUrl
  ) {
    try {
      return new URL(
        configuredUrl,
      );
    } catch {
      /**
       * Une URL d'environnement invalide ne doit pas casser
       * complètement le rendu local.
       */
    }
  }


  const vercelProductionUrl =
    process.env
      .VERCEL_PROJECT_PRODUCTION_URL
      ?.trim();


  if (
    vercelProductionUrl
  ) {
    try {
      return new URL(
        `https://${vercelProductionUrl}`,
      );
    } catch {
      /**
       * Fallback local ci-dessous.
       */
    }
  }


  return new URL(
    "http://localhost:3000",
  );
}


/* ==========================================================================
   GLOBAL METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
  metadataBase:
    resolveMetadataBase(),

  applicationName:
    "Cosmetics Empire",

  title: {
    default:
      "Cosmetics Empire",

    template:
      "%s | Cosmetics Empire",
  },

  description:
    "Plateforme professionnelle de gestion et de commerce de Cosmetics Empire.",


  /* ------------------------------------------------------------------------
     PWA
     ------------------------------------------------------------------------ */

  manifest:
    "/manifest.webmanifest",


  /* ------------------------------------------------------------------------
     ICÔNES
     ------------------------------------------------------------------------ */

  icons: {
    icon: [
      {
        url:
          "/icons/icon-maskable-512.png",

        sizes:
          "512x512",

        type:
          "image/png",
      },
    ],

    shortcut: [
      {
        url:
          "/icons/icon-maskable-512.png",

        type:
          "image/png",
      },
    ],

    apple: [
      {
        url:
          "/apple-icon.png",

        sizes:
          "180x180",

        type:
          "image/png",
      },
    ],
  },


  /* ------------------------------------------------------------------------
     APPLE / IPHONE / IPAD
     ------------------------------------------------------------------------ */

  appleWebApp: {
    capable:
      true,

    title:
      "L&E Cosmetics",

    statusBarStyle:
      "default",
  },


  /* ------------------------------------------------------------------------
     OPEN GRAPH
     ------------------------------------------------------------------------ */

  openGraph: {
    type:
      "website",

    locale:
      "fr_FR",

    url:
      "/",

    siteName:
      "L&E Cosmetics Empire",

    title:
      "L&E Cosmetics Empire",

    description:
      "S’embellir chez L&E",

    images: [
      {
        url:
          "/images/imagecouvre.png",

        alt:
          "L&E Cosmetics Empire",
      },
    ],
  },


  /* ------------------------------------------------------------------------
     X / TWITTER
     ------------------------------------------------------------------------ */

  twitter: {
    card:
      "summary_large_image",

    title:
      "L&E Cosmetics Empire",

    description:
      "S’embellir chez L&E",

    images: [
      "/images/imagecouvre.png",
    ],
  },


  /* ------------------------------------------------------------------------
     ROBOTS
     ------------------------------------------------------------------------ */

  robots: {
    index:
      true,

    follow:
      true,
  },


  /* ------------------------------------------------------------------------
     FORMAT DETECTION
     ------------------------------------------------------------------------ */

  formatDetection: {
    telephone:
      false,

    email:
      false,

    address:
      false,
  },
};


/* ==========================================================================
   VIEWPORT
   ========================================================================== */

export const viewport:
  Viewport = {
  width:
    "device-width",

  initialScale:
    1,

  viewportFit:
    "cover",

  themeColor:
    "#e6007e",

  colorScheme:
    "light",
};


/* ==========================================================================
   TYPES
   ========================================================================== */

type RootLayoutProps =
  Readonly<{
    children:
      ReactNode;
  }>;


/* ==========================================================================
   ROOT LAYOUT
   ========================================================================== */

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="fr"
      dir="ltr"
      className={
        geist.variable
      }
    >
      <body
        className={
          geist.className
        }
      >
        <PwaRegistration />

        {children}
      </body>
    </html>
  );
}
