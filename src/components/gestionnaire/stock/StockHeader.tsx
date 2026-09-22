import Link from "next/link";

import {
  ArrowLeftRight,
  ChevronRight,
  FolderOpen,
  Package,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import styles from "@/app/gestionnaire/(espace-prive)/stock/stock.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/stock/StockHeader.tsx
 *
 * Route :
 *
 * /gestionnaire/stock
 *
 * RÔLE :
 *
 * Afficher la zone supérieure de la page Stock :
 *
 * - fil d'Ariane ;
 * - titre ;
 * - sous-titre ;
 * - accès aux catégories ;
 * - accès aux produits ;
 * - accès aux mouvements de stock lorsqu'une route officielle existe.
 *
 * IMPORTANT :
 *
 * Ce composant ne doit jamais :
 *
 * - effectuer de requête Prisma ;
 * - lire la session ;
 * - recevoir un storeId ;
 * - recevoir un managerId ;
 * - modifier le stock ;
 * - inventer une route de mouvements de stock ;
 * - recréer le Header global Gestionnaire ;
 * - recréer la Sidebar Gestionnaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES CONNUES
   ========================================================================== */

/**
 * Cette route existe déjà dans le projet.
 */

const PRODUCTS_ROUTE =
  routes.gestionnaire.products;


/**
 * La page Catégories existe maintenant officiellement sous :
 *
 * /gestionnaire/categories
 *
 * Elle n'est pas encore présente dans l'ancienne constante
 * GESTIONNAIRE_ROUTES actuellement utilisée par la navigation.
 *
 * On ne réutilise donc surtout pas l'ancienne route Catalogue L&E.
 */

const CATEGORIES_ROUTE =
  "/gestionnaire/categories";


/* ==========================================================================
   TEXTES
   ========================================================================== */

const PAGE_TITLE =
  "Stock";


const PAGE_SUBTITLE =
  "Suivez et gérez facilement tous vos stocks de produits.";


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface StockHeaderProps {
  /**
   * Route officielle des mouvements de stock.
   *
   * Exemple uniquement lorsqu'elle existe réellement :
   *
   * /gestionnaire/stock/mouvements
   *
   * Si aucune route officielle n'existe encore :
   *
   * null
   *
   * Le bouton reste visible mais désactivé.
   */
  stockMovementsHref?:
    string |
    null;
}


/* ==========================================================================
   NORMALISATION ROUTE OPTIONNELLE
   ========================================================================== */

function normalizeOptionalHref(
  value:
    string |
    null |
    undefined,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }


  const normalizedValue =
    value.trim();


  if (
    !normalizedValue
  ) {
    return null;
  }


  /**
   * La route doit rester interne à l'application.
   *
   * Cela évite qu'une valeur accidentelle transforme ce bouton en lien
   * externe.
   */

  if (
    !normalizedValue.startsWith(
      "/",
    ) ||
    normalizedValue.startsWith(
      "//",
    )
  ) {
    return null;
  }


  return normalizedValue;
}


/* ==========================================================================
   ACTION — MOUVEMENTS DE STOCK
   ========================================================================== */

interface StockMovementsActionProps {
  href:
    string |
    null;
}


function StockMovementsAction({
  href,
}: StockMovementsActionProps) {
  /*
   * Une vraie route existe :
   * le bouton fonctionne normalement.
   */

  if (
    href
  ) {
    return (
      <Link
        href={
          href
        }
        className={[
          styles.stockHeaderAction,
          styles.stockHeaderActionPrimary,
        ].join(
          " ",
        )}
        aria-label="Accéder aux mouvements de stock"
      >
        <ArrowLeftRight
          size={17}
          strokeWidth={1.9}
          aria-hidden="true"
        />

        <span>
          Mouvement de stock
        </span>
      </Link>
    );
  }


  /*
   * Aucune route officielle n'a encore été fournie.
   *
   * On respecte le cahier des charges :
   *
   * - bouton préparé visuellement ;
   * - aucune URL inventée ;
   * - aucune navigation incorrecte.
   */

  return (
    <span
      className={[
        styles.stockHeaderAction,
        styles.stockHeaderActionPrimary,
        styles.stockHeaderActionDisabled,
      ].join(
        " ",
      )}
      aria-disabled="true"
    >
      <ArrowLeftRight
        size={17}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <span>
        Mouvement de stock
      </span>
    </span>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StockHeader({
  stockMovementsHref = null,
}: StockHeaderProps) {
  const resolvedStockMovementsHref =
    normalizeOptionalHref(
      stockMovementsHref,
    );


  return (
    <header
      className={
        styles.stockHeader
      }
    >
      {/* ===================================================================
          FIL D'ARIANE
          =================================================================== */}

      <nav
        className={
          styles.stockBreadcrumb
        }
        aria-label="Fil d’Ariane"
      >
        <Link
          href={
            PRODUCTS_ROUTE
          }
          className={
            styles.stockBreadcrumbLink
          }
        >
          Produits
        </Link>


        <ChevronRight
          size={15}
          strokeWidth={1.8}
          className={
            styles.stockBreadcrumbSeparator
          }
          aria-hidden="true"
        />


        <span
          className={
            styles.stockBreadcrumbCurrent
          }
          aria-current="page"
        >
          Stock
        </span>
      </nav>


      {/* ===================================================================
          TITRE + ACTIONS
          =================================================================== */}

      <div
        className={
          styles.stockHeaderRow
        }
      >
        {/* -----------------------------------------------------------------
            TITRE
            ----------------------------------------------------------------- */}

        <div
          className={
            styles.stockHeaderContent
          }
        >
          <h1
            className={
              styles.stockTitle
            }
          >
            {PAGE_TITLE}
          </h1>


          <p
            className={
              styles.stockSubtitle
            }
          >
            {PAGE_SUBTITLE}
          </p>
        </div>


        {/* -----------------------------------------------------------------
            ACTIONS
            ----------------------------------------------------------------- */}

        <div
          className={
            styles.stockHeaderActions
          }
          aria-label="Actions de la page Stock"
        >
          {/* ===============================================================
              CATÉGORIES
              =============================================================== */}

          <Link
            href={
              CATEGORIES_ROUTE
            }
            className={[
              styles.stockHeaderAction,
              styles.stockHeaderActionSecondary,
            ].join(
              " ",
            )}
            aria-label="Voir les catégories de produits"
          >
            <FolderOpen
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Voir les catégories
            </span>
          </Link>


          {/* ===============================================================
              PRODUITS
              =============================================================== */}

          <Link
            href={
              PRODUCTS_ROUTE
            }
            className={[
              styles.stockHeaderAction,
              styles.stockHeaderActionSecondary,
            ].join(
              " ",
            )}
            aria-label="Voir les produits de la boutique"
          >
            <Package
              size={17}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Voir les produits
            </span>
          </Link>


          {/* ===============================================================
              MOUVEMENTS DE STOCK
              =============================================================== */}

          <StockMovementsAction
            href={
              resolvedStockMovementsHref
            }
          />
        </div>
      </div>
    </header>
  );
}