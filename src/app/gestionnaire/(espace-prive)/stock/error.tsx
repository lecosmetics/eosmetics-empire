"use client";

import {
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";

import styles from "./stock.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STOCK
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/stock/error.tsx
 *
 * RÔLE :
 *
 * Afficher une erreur propre lorsque la page Stock ne peut pas être chargée.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - n'affiche aucune stack technique ;
 * - n'affiche aucun message Prisma/PostgreSQL ;
 * - n'affiche aucune donnée sensible ;
 * - ne recrée ni Sidebar ni Header global ;
 * - permet simplement de relancer le rendu avec reset().
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

interface StockErrorProps {
  readonly error:
    Error & {
      digest?:
        string;
    };

  readonly reset:
    () => void;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StockError({
  error,
  reset,
}: StockErrorProps) {
  /**
   * Next.js fournit l'erreur à ce boundary.
   *
   * On ne l'affiche volontairement jamais dans l'interface.
   *
   * `void error` évite simplement une variable inutilisée tout en gardant
   * la signature officielle du composant error.tsx.
   */

  void error;


  return (
    <div
      className={
        styles.stockPage
      }
    >
      <section
        className={
          styles.stockError
        }
        role="alert"
        aria-labelledby="stock-error-title"
        aria-describedby="stock-error-description"
      >
        <div
          className={
            styles.stockErrorContent
          }
        >
          {/* ===============================================================
              ICÔNE
              =============================================================== */}

          <div
            className={
              styles.stockErrorIcon
            }
            aria-hidden="true"
          >
            <AlertTriangle
              size={30}
              strokeWidth={1.8}
            />
          </div>


          {/* ===============================================================
              TITRE
              =============================================================== */}

          <h1
            id="stock-error-title"
            className={
              styles.stockErrorTitle
            }
          >
            Impossible de charger les stocks.
          </h1>


          {/* ===============================================================
              DESCRIPTION
              =============================================================== */}

          <p
            id="stock-error-description"
            className={
              styles.stockErrorDescription
            }
          >
            Une erreur est survenue lors du chargement des données de stock.
            Vous pouvez réessayer.
          </p>


          {/* ===============================================================
              RÉESSAYER
              =============================================================== */}

          <button
            type="button"
            className={
              styles.stockErrorRetry
            }
            onClick={
              reset
            }
          >
            <RefreshCcw
              size={17}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>
              Réessayer
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}