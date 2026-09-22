import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Package,
  Plus,
  TriangleAlert,
} from "lucide-react";

import ProductsFilters from "@/components/gestionnaire/produits/list/ProductsFilters";

import ProductsList from "@/components/gestionnaire/produits/list/ProductsList";

import {
  getGestionnaireProductsListData,
} from "@/server/gestionnaire/products/product-list-service";

import type {
  GestionnaireProductsSearchParams,
} from "@/server/gestionnaire/products/product-list-service";

import styles from "./produits.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * PAGE — MES PRODUITS
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/page.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher la page Mes produits ;
 * - utiliser exclusivement le layout Gestionnaire existant ;
 * - ne jamais recréer Sidebar / Header ;
 * - charger les vraies données depuis PostgreSQL via Prisma ;
 * - afficher les KPI réels ;
 * - afficher les filtres ;
 * - afficher le tableau desktop ;
 * - afficher les cards mobile ;
 * - conserver une page pleine largeur ;
 * - ne jamais accepter storeId depuis le navigateur.
 *
 * SÉCURITÉ :
 *
 * Le scoping de la boutique est réalisé dans :
 *
 * getGestionnaireProductsListData()
 *
 * qui utilise :
 *
 * requireGestionnairePrivateAccess()
 *
 * puis :
 *
 * access.store.id
 *
 * Cette page n'accepte donc jamais :
 *
 * - storeId ;
 * - managerId ;
 * - representativeId.
 *
 * ============================================================================
 */


/* ==========================================================================
   NEXT.JS — DONNÉES PRIVÉES
   --------------------------------------------------------------------------
   La page contient des données propres au Gestionnaire connecté.

   On évite donc toute mise en cache statique partagée.
   ========================================================================== */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


export const runtime =
  "nodejs";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata:
  Metadata = {
    title:
      "Mes produits | Cosmetics Empire",

    description:
      "Gérez les produits de votre boutique Cosmetics Empire.",
  };


/* ==========================================================================
   ROUTES
   ========================================================================== */

const GESTIONNAIRE_PRODUCTS_PATH =
  "/gestionnaire/produits";


const GESTIONNAIRE_ADD_PRODUCT_PATH =
  "/gestionnaire/produits/ajouter";


/* ==========================================================================
   PAGE PROPS
   ========================================================================== */

interface GestionnaireProductsPageProps {
  searchParams:
    Promise<GestionnaireProductsSearchParams>;
}


/* ==========================================================================
   KPI CARD
   --------------------------------------------------------------------------
   On garde ce petit composant directement dans page.tsx.

   Il ne justifie pas la création d'un fichier supplémentaire.
   ========================================================================== */

interface ProductKpiCardProps {
  label:
    string;

  value:
    number;

  description:
    string;

  icon:
    "total" |
    "published" |
    "draft" |
    "low-stock";
}


function ProductKpiCard({
  label,
  value,
  description,
  icon,
}: ProductKpiCardProps) {
  let iconElement:
    React.ReactNode;


  let iconClassName =
    styles.productsKpiIcon;


  switch (
    icon
  ) {
    case "published":
      iconElement = (
        <CheckCircle2
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );

      iconClassName =
        `${styles.productsKpiIcon} ${styles.productsKpiIconPublished}`;

      break;


    case "draft":
      iconElement = (
        <FileText
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );

      iconClassName =
        `${styles.productsKpiIcon} ${styles.productsKpiIconDraft}`;

      break;


    case "low-stock":
      iconElement = (
        <TriangleAlert
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );

      iconClassName =
        `${styles.productsKpiIcon} ${styles.productsKpiIconLowStock}`;

      break;


    case "total":
    default:
      iconElement = (
        <Package
          size={20}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      );

      break;
  }


  return (
    <article
      className={
        styles.productsKpiCard
      }
    >
      <div
        className={
          iconClassName
        }
        aria-hidden="true"
      >
        {iconElement}
      </div>


      <div
        className={
          styles.productsKpiContent
        }
      >
        <span
          className={
            styles.productsKpiLabel
          }
        >
          {label}
        </span>


        <strong
          className={
            styles.productsKpiValue
          }
        >
          {value.toLocaleString(
            "fr-FR",
          )}
        </strong>


        <span
          className={
            styles.productsKpiHint
          }
        >
          {description}
        </span>
      </div>
    </article>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function GestionnaireProductsPage({
  searchParams,
}: GestionnaireProductsPageProps) {
  /* ------------------------------------------------------------------------
     1. SEARCH PARAMS NEXT.JS
     ------------------------------------------------------------------------ */

  const resolvedSearchParams =
    await searchParams;


  /* ------------------------------------------------------------------------
     2. DONNÉES RÉELLES
     ------------------------------------------------------------------------
     Ce service :
     
     - vérifie l'accès Gestionnaire ;
     - récupère access.store.id ;
     - calcule les KPI ;
     - valide les query params ;
     - recherche côté serveur ;
     - filtre côté serveur ;
     - trie côté serveur ;
     - pagine côté serveur ;
     - récupère uniquement les produits de cette boutique.
     ------------------------------------------------------------------------ */

  const data =
    await getGestionnaireProductsListData(
      resolvedSearchParams,
    );


  const {
    stats,
    categories,
    products,
    query,
    pagination,
  } =
    data;


  /* ------------------------------------------------------------------------
     3. RENDER
     ------------------------------------------------------------------------ */

  return (
    <section
      className={
        styles.productsPage
      }
      aria-labelledby="gestionnaire-products-title"
    >
      <div
        className={
          styles.productsContent
        }
      >
        {/* ==============================================================
            BREADCRUMB
            ============================================================== */}

        <nav
          className={
            styles.productsBreadcrumb
          }
          aria-label="Fil d’Ariane"
        >
          <Link
            href={
              GESTIONNAIRE_PRODUCTS_PATH
            }
          >
            Produits
          </Link>


          <ChevronRight
            className={
              styles.productsBreadcrumbSeparator
            }
            size={13}
            strokeWidth={1.8}
            aria-hidden="true"
          />


          <span
            className={
              styles.productsBreadcrumbCurrent
            }
            aria-current="page"
          >
            Mes produits
          </span>
        </nav>


        {/* ==============================================================
            PAGE HEADER
            ============================================================== */}

        <header
          className={
            styles.productsPageHeader
          }
        >
          <div
            className={
              styles.productsPageHeaderContent
            }
          >
            <h1
              id="gestionnaire-products-title"
              className={
                styles.productsPageTitle
              }
            >
              Mes produits
            </h1>


            <p
              className={
                styles.productsPageDescription
              }
            >
              Retrouvez ici tous les produits que vous avez ajoutés.
              Gérez, modifiez et suivez leur disponibilité.
            </p>
          </div>


          <Link
            href={
              GESTIONNAIRE_ADD_PRODUCT_PATH
            }
            className={
              styles.productsAddButton
            }
          >
            <Plus
              size={17}
              strokeWidth={2}
              aria-hidden="true"
            />

            <span>
              Ajouter un produit
            </span>
          </Link>
        </header>


        {/* ==============================================================
            KPI
            ============================================================== */}

        <section
          className={
            styles.productsKpiGrid
          }
          aria-label="Statistiques des produits"
        >
          {/* ------------------------------------------------------------
              TOTAL
              ------------------------------------------------------------ */}

          <ProductKpiCard
            label="Total produits"
            value={
              stats.total
            }
            description="Produits de votre boutique"
            icon="total"
          />


          {/* ------------------------------------------------------------
              PUBLISHED
              ------------------------------------------------------------ */}

          <ProductKpiCard
            label="Produits publiés"
            value={
              stats.published
            }
            description="Actuellement publiés"
            icon="published"
          />


          {/* ------------------------------------------------------------
              DRAFT
              ------------------------------------------------------------ */}

          <ProductKpiCard
            label="Brouillons"
            value={
              stats.drafts
            }
            description="Produits en préparation"
            icon="draft"
          />


          {/* ------------------------------------------------------------
              LOW STOCK
              ------------------------------------------------------------ */}

          <ProductKpiCard
            label="Stock faible"
            value={
              stats.lowStock
            }
            description="Selon le seuil configuré"
            icon="low-stock"
          />
        </section>


        {/* ==============================================================
            PRODUCTS LIST CARD
            ============================================================== */}

        <section
          className={
            styles.productsListCard
          }
          aria-labelledby="gestionnaire-products-list-title"
        >
          {/* ------------------------------------------------------------
              LIST HEADER
              ------------------------------------------------------------ */}

          <header
            className={
              styles.productsListCardHeader
            }
          >
            <div>
              <h2
                id="gestionnaire-products-list-title"
                className={
                  styles.productsListCardTitle
                }
              >
                Liste de mes produits
              </h2>


              <p
                className={
                  styles.productsListCardDescription
                }
              >
                Consultez et gérez les produits disponibles dans votre
                boutique.
              </p>
            </div>
          </header>


          {/* ------------------------------------------------------------
              FILTERS
              ------------------------------------------------------------ */}

          <ProductsFilters
            categories={
              categories
            }
            query={
              query
            }
          />


          {/* ------------------------------------------------------------
              PRODUCTS
              ------------------------------------------------------------ */}

          <ProductsList
            products={
              products
            }
            query={
              query
            }
            pagination={
              pagination
            }
            totalProducts={
              stats.total
            }
          />
        </section>
      </div>
    </section>
  );
}