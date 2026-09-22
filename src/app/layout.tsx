import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

/* ============================================================
   COSMETICS EMPIRE
   ROOT LAYOUT
   ------------------------------------------------------------
   Layout racine de toute l'application.

   Il contient uniquement les éléments réellement globaux :
   - langue principale ;
   - police générale ;
   - metadata générales ;
   - viewport ;
   - chargement du système CSS global.

   Aucun header, menu ou contenu métier ne doit être ajouté ici.
   ============================================================ */


/* ============================================================
   FONT
   ============================================================ */

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});


/* ============================================================
   GLOBAL METADATA
   ============================================================ */

export const metadata: Metadata = {
  applicationName: "Cosmetics Empire",

  title: {
    default: "Cosmetics Empire",
    template: "%s | Cosmetics Empire",
  },

  description:
    "Plateforme professionnelle de gestion et de commerce de Cosmetics Empire.",

  robots: {
    index: true,
    follow: true,
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};


/* ============================================================
   VIEWPORT
   ============================================================ */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",

  themeColor: "#ffffff",

  colorScheme: "light",
};


/* ============================================================
   TYPES
   ============================================================ */

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;


/* ============================================================
   ROOT LAYOUT
   ============================================================ */

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="fr"
      dir="ltr"
      className={geist.variable}
    >
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}