import type {
  Metadata,
} from "next";

import PublicHomeBenefitsSection from "@/components/public/home/PublicHomeBenefitsSection";
import PublicHomeCategoriesSection from "@/components/public/home/PublicHomeCategoriesSection";
import PublicHomeFeaturedProductsSection from "@/components/public/home/PublicHomeFeaturedProductsSection";
import PublicHomeHeroSection from "@/components/public/home/PublicHomeHeroSection";
import PublicHomeInstagramSection from "@/components/public/home/PublicHomeInstagramSection";
import PublicHomePromotionSection from "@/components/public/home/PublicHomePromotionSection";

import {
  PUBLIC_SITE,
} from "@/config/public-site";

import {
  getPublicHomeData,
} from "@/lib/public/home/public-home-query";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * PAGE D’ACCUEIL PUBLIQUE OFFICIELLE
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/page.tsx
 *
 * Route :
 *
 * /
 *
 * ============================================================================
 *
 * ARCHITECTURE OFFICIELLE DE LA HOME
 *
 * 1. Hero
 *    /images/couverture.png
 *
 * 2. Avantages clés
 *    4 avantages exactement
 *
 * 3. Nos Catégories
 *    6 catégories maximum
 *
 * 4. Bannière promotionnelle
 *    /images/couverturea.png
 *
 * 5. Nos Produits Phares
 *    vraies offres StoreProduct
 *
 * 6. Instagram
 *    /images/baimage.png
 *
 * ============================================================================
 *
 * LE SHELL PUBLIC GÈRE DÉJÀ :
 *
 * - PublicHeader ;
 * - PublicDesktopHeader ;
 * - PublicMobileHeader ;
 * - PublicMobileDrawer ;
 * - PublicSearchForm ;
 * - PublicFooter ;
 * - PublicMobileBottomNav ;
 * - le <main> principal ;
 * - la structure responsive générale.
 *
 * Le shell public est défini dans :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette page NE DOIT PAS :
 *
 * - recréer un <main> ;
 * - recréer le Header ;
 * - recréer le Footer ;
 * - recréer la navigation mobile ;
 * - recréer le drawer mobile ;
 * - recréer la recherche ;
 * - ajouter un deuxième shell ;
 * - appeler Prisma directement ;
 * - inventer des produits ;
 * - inventer des catégories ;
 * - inventer des prix ;
 * - inventer des stocks ;
 * - inventer des promotions ;
 * - ajouter une section Localisations ;
 * - ajouter une section Services ;
 * - ajouter une section Contact Home ;
 * - ajouter une Newsletter ;
 * - ajouter des Témoignages ;
 * - ajouter des Nouveautés ;
 * - ajouter une section non présente dans l’architecture officielle.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. RENDU DYNAMIQUE
   ========================================================================== */

/**
 * La Home contient des informations commerciales qui peuvent évoluer :
 *
 * - prix StoreProduct ;
 * - stock StoreProduct ;
 * - disponibilité ;
 * - catégories actives ;
 * - produits disponibles.
 *
 * La page reste donc rendue dynamiquement côté serveur.
 */
export const dynamic =
  "force-dynamic";


/* ==========================================================================
   2. METADATA
   ========================================================================== */

/**
 * L’identité de marque reste centralisée dans :
 *
 * src/config/public-site.ts
 *
 * Aucun nom d’entreprise ou slogan parallèle n’est créé ici.
 */
export const metadata:
  Metadata = {
    title:
      PUBLIC_SITE.brand.name,

    description:
      `${PUBLIC_SITE.brand.name} — ${PUBLIC_SITE.brand.slogan}. Découvrez les soins et produits L&E Cosmetics Empire.`,
  };


/* ==========================================================================
   3. PAGE
   ========================================================================== */

export default async function PublicHomePage() {
  /**
   * ========================================================================
   * DONNÉES RÉELLES
   * ========================================================================
   *
   * getPublicHomeData() prépare uniquement les données dynamiques nécessaires
   * à la Home :
   *
   * - catégories réelles ;
   * - offres produits réelles.
   *
   * Aucun produit de démonstration.
   * Aucune catégorie de démonstration.
   */
  const {
    categories,
    featuredProducts,
  } =
    await getPublicHomeData();


  /**
   * ========================================================================
   * RENDU OFFICIEL
   * ========================================================================
   *
   * IMPORTANT :
   *
   * Aucun <main> ici.
   *
   * Le <main> principal existe déjà dans :
   *
   * src/app/(public)/layout.tsx
   *
   * On retourne donc directement les sections dans l’ordre exact
   * de l’architecture officielle.
   */
  return (
    <>
      {/* =================================================================
          1. HERO PRINCIPAL
          =================================================================
          Image :
          /images/couverture.png

          Desktop + mobile depuis le même composant.
          ================================================================= */}

      <PublicHomeHeroSection />


      {/* =================================================================
          2. AVANTAGES CLÉS
          =================================================================
          Exactement quatre éléments :

          - Livraison rapide ;
          - Produits 100% originaux ;
          - Service client disponible ;
          - Offres et promotions régulières.
          ================================================================= */}

      <PublicHomeBenefitsSection />


      {/* =================================================================
          3. NOS CATÉGORIES
          =================================================================
          Desktop :
          6 catégories sur une ligne.

          Mobile :
          grille 3 × 2.

          Données issues des vraies ProductCategory.
          ================================================================= */}

      <PublicHomeCategoriesSection
        categories={
          categories
        }
      />


      {/* =================================================================
          4. BANNIÈRE PROMOTIONNELLE
          =================================================================
          Image :
          /images/couverturea.png

          "DES RÉSULTATS VISIBLES,
           UNE PEAU SUBLIME !"
          ================================================================= */}

      <PublicHomePromotionSection />


      {/* =================================================================
          5. NOS PRODUITS PHARES
          =================================================================
          Vraies offres commerciales :

          Product
             ↓
          StoreProduct
             ↓
          Store

          Aucun produit fictif.
          ================================================================= */}

      <PublicHomeFeaturedProductsSection
        products={
          featuredProducts
        }
      />


      {/* =================================================================
          6. INSTAGRAM
          =================================================================
          Image :
          /images/baimage.png

          Le réseau Instagram officiel reste lu depuis PUBLIC_SITE.
          ================================================================= */}

      <PublicHomeInstagramSection />
    </>
  );
}


/**
 * ============================================================================
 * FIN
 * ============================================================================
 *
 * ORDRE FINAL DE LA PAGE :
 *
 * PublicHeader                         ← layout public
 *
 * PublicHomeHeroSection
 *        ↓
 * PublicHomeBenefitsSection
 *        ↓
 * PublicHomeCategoriesSection
 *        ↓
 * PublicHomePromotionSection
 *        ↓
 * PublicHomeFeaturedProductsSection
 *        ↓
 * PublicHomeInstagramSection
 *
 * PublicFooter                         ← layout public
 * PublicMobileBottomNav                ← layout public
 *
 * ============================================================================
 *
 * AUCUNE SECTION SUPPLÉMENTAIRE.
 * AUCUN DEUXIÈME SHELL.
 * AUCUNE DONNÉE DE DÉMONSTRATION.
 *
 * ============================================================================
 */