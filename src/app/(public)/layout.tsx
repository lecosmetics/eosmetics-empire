import type {
  ReactNode,
} from "react";

import PublicFooter from "@/components/public/PublicFooter";
import PublicHeader from "@/components/public/PublicHeader";
import PublicMobileBottomNav from "@/components/public/PublicMobileBottomNav";

import PublicPanierProvider from "@/components/public/panier/PublicPanierProvider";

import {
  getPublicNavigationData,
} from "@/lib/public/navigation/public-navigation-query";

import styles from "@/components/public/public-shell.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE PUBLIC — LAYOUT PRINCIPAL
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * RESPONSABILITÉS :
 *
 * - fournir le shell commun de toutes les pages publiques ;
 * - charger une seule fois les données de navigation publique ;
 * - fournir un seul Provider Panier à tout l'espace public ;
 * - afficher le Header desktop / mobile existant ;
 * - afficher le contenu de chaque page publique ;
 * - afficher le Footer existant ;
 * - afficher la navigation mobile fixe existante ;
 * - conserver une architecture pleine largeur ;
 * - conserver l'espace nécessaire à la navigation mobile fixe ;
 * - ne pas recréer <html> ou <body> ;
 * - ne pas dupliquer les requêtes Prisma dans les composants ;
 * - ne pas injecter de données fictives.
 *
 * ============================================================================
 *
 * STRUCTURE :
 *
 * RootLayout
 *
 * └── PublicLayout
 *     │
 *     └── PublicPanierProvider
 *         │
 *         ├── PublicHeader
 *         │   ├── Desktop
 *         │   ├── Mobile
 *         │   └── Drawer
 *         │
 *         ├── <main>
 *         │   └── children
 *         │
 *         ├── PublicFooter
 *         │
 *         └── PublicMobileBottomNav
 *
 * ============================================================================
 *
 * PANIER GLOBAL
 *
 * PublicPanierProvider est placé ici volontairement.
 *
 * Cela permet à toutes les pages publiques d'utiliser le même Panier :
 *
 * /
 * /produits
 * /categories
 * /categories/[slug]
 * /p/[qrToken]
 * /panier
 *
 * et les futures pages commerciales publiques.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Il ne doit PAS y avoir :
 *
 * - un Provider Panier différent sur l'Accueil ;
 * - un Provider Panier différent sur /produits ;
 * - un Provider Panier différent sur une fiche produit ;
 * - une deuxième architecture localStorage ;
 * - un deuxième Context Panier.
 *
 * ============================================================================
 *
 * Le Provider conserve uniquement l'intention navigateur :
 *
 * {
 *   storeProductId,
 *   quantity
 * }
 *
 * Il ne devient jamais la source de vérité pour :
 *
 * - prix ;
 * - devise ;
 * - stock ;
 * - disponibilité ;
 * - boutique ;
 * - total.
 *
 * Ces informations restent revalidées côté serveur.
 *
 * ============================================================================
 *
 * SERVER / CLIENT BOUNDARY
 *
 * Ce layout reste un Server Component.
 *
 * getPublicNavigationData() continue donc à être exécuté côté serveur.
 *
 * PublicPanierProvider constitue uniquement une frontière Client autour
 * du shell rendu.
 *
 * Cela ne transforme pas automatiquement les pages publiques en gros
 * composants clients.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le Header, le Footer, la navigation mobile, la recherche et les catégories
 * publiques appartiennent déjà au shell existant.
 *
 * Les pages publiques ne doivent donc jamais recréer ces éléments.
 *
 * ============================================================================
 *
 * Le <html> et le <body> restent exclusivement dans :
 *
 * src/app/layout.tsx
 *
 * ============================================================================
 */


/* ==========================================================================
   1. PROPS
   ========================================================================== */

interface PublicLayoutProps {
  readonly children:
    ReactNode;
}


/* ==========================================================================
   2. LAYOUT
   ========================================================================== */

export default async function PublicLayout({
  children,
}: PublicLayoutProps) {
  /* =========================================================================
     NAVIGATION PUBLIQUE
     ========================================================================= */

  /**
   * Une seule récupération serveur pour tout le shell public.
   *
   * Cette fonction fournit les données déjà prévues par
   * l'architecture publique existante :
   *
   * - navigation desktop ;
   * - actions du Header ;
   * - navigation du drawer mobile ;
   * - navigation fixe mobile ;
   * - catégories publiques réelles ;
   * - badges réels lorsqu'ils seront branchés.
   *
   * ==========================================================================
   *
   * IMPORTANT :
   *
   * Cette récupération reste AVANT la frontière client Panier.
   *
   * Aucun chargement Prisma n'est déplacé dans PublicPanierProvider.
   *
   * ==========================================================================
   */
  const navigation =
    await getPublicNavigationData();


  /* =========================================================================
     RENDU
     ========================================================================= */

  return (
    <PublicPanierProvider>
      {/* =================================================================
          HEADER PUBLIC EXISTANT
          =================================================================
          
          Le Header reste unique.
          
          Il est volontairement placé sous PublicPanierProvider afin
          qu'un futur badge Panier réel puisse utiliser le même contexte
          sans créer de deuxième Provider.
          
          ================================================================= */}

      <PublicHeader
        navigation={
          navigation
        }
      />


      {/* =================================================================
          CONTENU DES PAGES PUBLIQUES
          =================================================================
          
          publicShellMain :
          
          - largeur 100 % ;
          - min-width: 0 ;
          - aucune largeur globale bloquante.
          
          publicShellContent :
          
          - largeur 100 % ;
          - aucun max-width ;
          - aucun margin auto ;
          - aucun padding imposé ;
          - permet aux sections publiques d'utiliser toute la largeur.
          
          Les deux classes existent déjà dans :
          
          src/components/public/public-shell.module.css
          
          ================================================================= */}

      <main
        id="public-main-content"
        className={
          `${styles.publicShellMain} ${styles.publicShellContent}`
        }
      >
        {
          children
        }
      </main>


      {/* =================================================================
          FOOTER PUBLIC EXISTANT
          =================================================================
          
          Le Footer reste unique.
          
          Aucun Footer ne doit être recréé dans les pages publiques.
          
          ================================================================= */}

      <PublicFooter />


      {/* =================================================================
          NAVIGATION MOBILE FIXE EXISTANTE
          =================================================================
          
          Structure conservée exactement :
          
          Accueil
          Produits
          Panier
          Commandes
          Compte
          
          =========================================================================
          
          Elle reste elle aussi sous PublicPanierProvider afin qu'un futur
          compteur réel du Panier puisse lire le même état global.
          
          ================================================================= */}

      <PublicMobileBottomNav
        navigation={
          navigation
        }
      />
    </PublicPanierProvider>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ARCHITECTURE FINALE DU SHELL PUBLIC
 *
 * ============================================================================
 *
 * getPublicNavigationData()
 *
 * reste côté serveur
 *
 *        ↓
 *
 * PublicPanierProvider
 *
 *        ↓
 *
 * ┌───────────────────────────────────────┐
 * │                                       │
 * │ PublicHeader                          │
 * │                                       │
 * │ <main>                                │
 * │   pages publiques                     │
 * │                                       │
 * │ PublicFooter                          │
 * │                                       │
 * │ PublicMobileBottomNav                 │
 * │                                       │
 * └───────────────────────────────────────┘
 *
 * ============================================================================
 *
 * UN SEUL PANIER POUR :
 *
 * - Accueil ;
 * - Produits ;
 * - Catégories ;
 * - fiches produit ;
 * - Panier ;
 * - futures pages commerciales publiques.
 *
 * ============================================================================
 *
 * AUCUN :
 *
 * - deuxième Header ;
 * - deuxième Footer ;
 * - deuxième Bottom Nav ;
 * - deuxième Context Panier ;
 * - deuxième localStorage Panier ;
 * - prix navigateur utilisé comme vérité ;
 * - stock navigateur utilisé comme vérité.
 *
 * ============================================================================
 *
 * NAVIGATION MOBILE :
 *
 * Accueil
 * Produits
 * Panier
 * Commandes
 * Compte
 *
 * EXACTEMENT 5 ÉLÉMENTS.
 *
 * ============================================================================
 */