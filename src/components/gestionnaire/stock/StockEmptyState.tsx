import Link from "next/link";

import {
  PackageOpen,
  RotateCcw,
  SearchX,
} from "lucide-react";

import {
  routes,
} from "@/config/routes";

import type {
  ManagerStockFilters,
} from "@/lib/gestionnaire/stock/stock-types";

import styles from "@/app/gestionnaire/(espace-prive)/stock/stock.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/stock/StockEmptyState.tsx
 *
 * RÔLE :
 *
 * Afficher un état vide propre lorsque :
 *
 * 1. la boutique ne possède encore aucun produit suivi en stock ;
 *
 * ou
 *
 * 2. aucun produit ne correspond aux filtres actuellement appliqués.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne contient aucune fausse donnée ;
 * - ne crée aucun produit ;
 * - ne modifie aucun stock ;
 * - ne crée aucune fonctionnalité de gestion supplémentaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES
   ========================================================================== */

const STOCK_ROUTE =
  routes.gestionnaire.stock;


const PRODUCTS_ROUTE =
  routes.gestionnaire.products;


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface StockEmptyStateProps {
  /**
   * Filtres réellement appliqués à la page.
   */
  readonly filters:
    ManagerStockFilters;

  /**
   * Nombre total réel de produits suivis en stock pour la boutique,
   * avant application des filtres de la liste.
   *
   * Cette valeur vient de :
   *
   * data.kpis.totalProducts
   *
   * Elle permet de distinguer :
   *
   * - boutique réellement vide ;
   * - liste vide uniquement à cause des filtres.
   */
  readonly totalProducts:
    number;
}


/* ==========================================================================
   FILTRES ACTIFS
   ========================================================================== */

function hasActiveStockFilters(
  filters:
    ManagerStockFilters,
): boolean {
  return (
    filters.q.trim().length >
      0 ||
    filters.category.trim().length >
      0 ||
    filters.status !==
      "all"
  );
}


/* ==========================================================================
   TOTAL NORMALISÉ
   ========================================================================== */

function normalizeTotalProducts(
  value:
    number,
): number {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return 0;
  }


  return Math.max(
    0,
    Math.trunc(
      value,
    ),
  );
}


/* ==========================================================================
   ÉTAT VIDE — AUCUN STOCK
   ========================================================================== */

function NoStockAvailable() {
  return (
    <section
      className={
        styles.stockEmptyState
      }
      aria-labelledby="stock-empty-title"
      aria-describedby="stock-empty-description"
    >
      <div
        className={
          styles.stockEmptyIcon
        }
        aria-hidden="true"
      >
        <PackageOpen
          size={30}
          strokeWidth={1.7}
        />
      </div>


      <div
        className={
          styles.stockEmptyContent
        }
      >
        <h2
          id="stock-empty-title"
          className={
            styles.stockEmptyTitle
          }
        >
          Aucun stock disponible pour le moment.
        </h2>


        <p
          id="stock-empty-description"
          className={
            styles.stockEmptyDescription
          }
        >
          Vous pourrez retrouver ici tous vos stocks produits dès qu’un produit sera ajouté.
        </p>


        <div
          className={
            styles.stockEmptyActions
          }
        >
          <Link
            href={
              PRODUCTS_ROUTE
            }
            className={
              styles.stockEmptyPrimaryAction
            }
          >
            Voir les produits
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   ÉTAT VIDE — FILTRES SANS RÉSULTAT
   ========================================================================== */

function NoFilteredStockResult() {
  return (
    <section
      className={
        styles.stockEmptyState
      }
      aria-labelledby="stock-no-result-title"
      aria-describedby="stock-no-result-description"
    >
      <div
        className={
          styles.stockEmptyIcon
        }
        aria-hidden="true"
      >
        <SearchX
          size={30}
          strokeWidth={1.7}
        />
      </div>


      <div
        className={
          styles.stockEmptyContent
        }
      >
        <h2
          id="stock-no-result-title"
          className={
            styles.stockEmptyTitle
          }
        >
          Aucun produit ne correspond à votre recherche.
        </h2>


        <p
          id="stock-no-result-description"
          className={
            styles.stockEmptyDescription
          }
        >
          Modifiez votre recherche ou réinitialisez les filtres pour afficher les stocks disponibles.
        </p>


        <div
          className={
            styles.stockEmptyActions
          }
        >
          <Link
            href={
              STOCK_ROUTE
            }
            className={
              styles.stockEmptySecondaryAction
            }
          >
            <RotateCcw
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              Réinitialiser les filtres
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   COMPONENT PRINCIPAL
   ========================================================================== */

export default function StockEmptyState({
  filters,
  totalProducts,
}: StockEmptyStateProps) {
  const normalizedTotalProducts =
    normalizeTotalProducts(
      totalProducts,
    );


  const hasFilters =
    hasActiveStockFilters(
      filters,
    );


  /*
   * Aucun StoreProduct n'existe réellement pour cette boutique.
   *
   * Même si l'URL contient accidentellement des query params,
   * l'information la plus importante reste que la boutique n'a
   * encore aucun stock.
   */

  if (
    normalizedTotalProducts ===
    0
  ) {
    return (
      <NoStockAvailable />
    );
  }


  /*
   * Des stocks existent réellement, mais la recherche ou les filtres
   * ne correspondent à aucun produit.
   */

  if (
    hasFilters
  ) {
    return (
      <NoFilteredStockResult />
    );
  }


  /*
   * Cas de sécurité.
   *
   * Avec la pagination serveur actuelle, cette situation ne devrait
   * normalement pas se produire puisque stock-query.ts ramène la page
   * demandée dans les limites disponibles.
   *
   * On garde néanmoins un rendu propre plutôt qu'un espace vide.
   */

  return (
    <NoFilteredStockResult />
  );
}