import Link from "next/link";

import {
  ChevronRight,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import styles from "@/app/gestionnaire/(espace-prive)/categories/categories.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — CATÉGORIES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/categories/CategoriesHeader.tsx
 *
 * Route :
 *
 * /gestionnaire/categories
 *
 * RÔLE :
 *
 * Afficher uniquement l'en-tête de la page Catégories :
 *
 * - fil d'Ariane ;
 * - titre ;
 * - sous-titre.
 *
 * IMPORTANT :
 *
 * Ce composant ne doit pas :
 *
 * - recréer le header global Gestionnaire ;
 * - recréer la sidebar ;
 * - ajouter un bouton de création ;
 * - ajouter un bouton Modifier ;
 * - ajouter un bouton Supprimer ;
 * - charger des données ;
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - contenir de logique métier.
 *
 * Les catégories officielles sont consultées par le Gestionnaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   CONSTANTES
   ========================================================================== */

const PAGE_TITLE =
  "Catégories";


const PAGE_SUBTITLE =
  "Organisez vos produits en catégories pour une meilleure navigation dans votre boutique.";


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function CategoriesHeader() {
  return (
    <header
      className={
        styles.categoriesHeader
      }
    >
      {/* ===================================================================
          BREADCRUMB
          =================================================================== */}

      <nav
        className={
          styles.categoriesBreadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <Link
          href={
            routes.gestionnaire
              .products
          }
          className={
            styles.categoriesBreadcrumbLink
          }
        >
          Produits
        </Link>


        <ChevronRight
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
          className={
            styles.categoriesBreadcrumbSeparator
          }
        />


        <span
          className={
            styles.categoriesBreadcrumbCurrent
          }
          aria-current="page"
        >
          Catégories
        </span>
      </nav>


      {/* ===================================================================
          TITLE
          =================================================================== */}

      <div
        className={
          styles.categoriesHeaderContent
        }
      >
        <h1
          className={
            styles.categoriesTitle
          }
        >
          {PAGE_TITLE}
        </h1>


        <p
          className={
            styles.categoriesSubtitle
          }
        >
          {PAGE_SUBTITLE}
        </p>
      </div>
    </header>
  );
}