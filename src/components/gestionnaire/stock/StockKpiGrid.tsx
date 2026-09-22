import {
  Banknote,
  Package,
  PackageX,
  TriangleAlert,
} from "lucide-react";

import type {
  ManagerStockKpis,
  ManagerStockValueByCurrency,
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
 * src/components/gestionnaire/stock/StockKpiGrid.tsx
 *
 * RÔLE :
 *
 * Afficher les quatre indicateurs principaux de la page Stock :
 *
 * - Total produits en stock ;
 * - Valeur totale du stock ;
 * - Produits en rupture ;
 * - Stock faible.
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne calcule pas les KPI métier ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - n'utilise aucune fausse valeur ;
 * - n'impose aucune devise ;
 * - affiche uniquement les données déjà calculées côté serveur.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface StockKpiGridProps {
  readonly kpis:
    ManagerStockKpis;
}


/* ==========================================================================
   FORMATAGE DES ENTIERS
   ========================================================================== */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


function formatInteger(
  value:
    number,
): string {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "0";
  }


  return INTEGER_FORMATTER.format(
    Math.max(
      0,
      Math.trunc(
        value,
      ),
    ),
  );
}


/* ==========================================================================
   FORMATAGE DÉCIMAL EXACT
   ========================================================================== */

/**
 * Les montants reçus depuis stock-query.ts sont des chaînes décimales.
 *
 * Exemple :
 *
 * "4850000.00"
 *
 * On évite volontairement :
 *
 * Number(amount)
 *
 * afin de ne pas dégrader inutilement la précision des Decimal Prisma.
 */

function formatDecimalAmount(
  value:
    string,
): string | null {
  const normalizedValue =
    value.trim();


  const match =
    /^(-?)(\d+)(?:\.(\d+))?$/.exec(
      normalizedValue,
    );


  if (
    !match
  ) {
    return null;
  }


  const sign =
    match[1] ?? "";


  const rawInteger =
    match[2] ?? "0";


  const rawDecimals =
    match[3] ?? "";


  const normalizedInteger =
    rawInteger.replace(
      /^0+(?=\d)/,
      "",
    );


  const groupedInteger =
    normalizedInteger.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "\u202F",
    );


  const usefulDecimals =
    rawDecimals.replace(
      /0+$/,
      "",
    );


  if (
    !usefulDecimals
  ) {
    return `${sign}${groupedInteger}`;
  }


  return `${sign}${groupedInteger},${usefulDecimals}`;
}


/* ==========================================================================
   DEVISE
   ========================================================================== */

function normalizeCurrency(
  value:
    string,
): string {
  return value
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   VALEUR DE STOCK
   ========================================================================== */

function StockValue({
  values,
}: {
  readonly values:
    readonly ManagerStockValueByCurrency[];
}) {
  if (
    values.length ===
    0
  ) {
    return (
      <span
        className={
          styles.stockKpiValue
        }
      >
        —
      </span>
    );
  }


  return (
    <div
      className={
        styles.stockKpiMoneyValues
      }
    >
      {values.map(
        (
          value,
        ) => {
          const currency =
            normalizeCurrency(
              value.currency,
            );


          const amount =
            formatDecimalAmount(
              value.amount,
            );


          if (
            !currency ||
            !amount
          ) {
            return null;
          }


          return (
            <span
              key={
                currency
              }
              className={
                styles.stockKpiValue
              }
            >
              {amount}{" "}
              <span
                className={
                  styles.stockKpiCurrency
                }
              >
                {currency}
              </span>
            </span>
          );
        },
      )}
    </div>
  );
}


/* ==========================================================================
   CARTE KPI
   ========================================================================== */

interface StockKpiCardProps {
  readonly label:
    string;

  readonly secondary:
    string;

  readonly icon:
    React.ReactNode;

  readonly variant:
    | "primary"
    | "value"
    | "danger"
    | "warning";

  readonly children:
    React.ReactNode;
}


function StockKpiCard({
  label,
  secondary,
  icon,
  variant,
  children,
}: StockKpiCardProps) {
  const variantClassName =
    variant ===
      "primary"
      ? styles.stockKpiCardPrimary
      : variant ===
          "value"
        ? styles.stockKpiCardValue
        : variant ===
            "danger"
          ? styles.stockKpiCardDanger
          : styles.stockKpiCardWarning;


  return (
    <article
      className={[
        styles.stockKpiCard,
        variantClassName,
      ].join(
        " ",
      )}
    >
      <div
        className={
          styles.stockKpiIcon
        }
        aria-hidden="true"
      >
        {icon}
      </div>


      <div
        className={
          styles.stockKpiContent
        }
      >
        <span
          className={
            styles.stockKpiLabel
          }
        >
          {label}
        </span>


        {children}


        <span
          className={
            styles.stockKpiSecondary
          }
        >
          {secondary}
        </span>
      </div>
    </article>
  );
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function StockKpiGrid({
  kpis,
}: StockKpiGridProps) {
  return (
    <section
      className={
        styles.stockKpiGrid
      }
      aria-label="Résumé des stocks"
    >
      {/* ===================================================================
          TOTAL PRODUITS
          =================================================================== */}

      <StockKpiCard
        label="Total produits en stock"
        secondary="Tous vos produits"
        variant="primary"
        icon={
          <Package
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.stockKpiValue
          }
        >
          {formatInteger(
            kpis.totalProducts,
          )}
        </strong>
      </StockKpiCard>


      {/* ===================================================================
          VALEUR TOTALE
          =================================================================== */}

      <StockKpiCard
        label="Valeur totale du stock"
        secondary="Valeur estimée"
        variant="value"
        icon={
          <Banknote
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <StockValue
          values={
            kpis.totalEstimatedValue
          }
        />
      </StockKpiCard>


      {/* ===================================================================
          RUPTURES
          =================================================================== */}

      <StockKpiCard
        label="Produits en rupture"
        secondary="À réapprovisionner"
        variant="danger"
        icon={
          <PackageX
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.stockKpiValue
          }
        >
          {formatInteger(
            kpis.outOfStockProducts,
          )}
        </strong>
      </StockKpiCard>


      {/* ===================================================================
          STOCK FAIBLE
          =================================================================== */}

      <StockKpiCard
        label="Stock faible"
        secondary="Seuil atteint"
        variant="warning"
        icon={
          <TriangleAlert
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.stockKpiValue
          }
        >
          {formatInteger(
            kpis.lowStockProducts,
          )}
        </strong>
      </StockKpiCard>
    </section>
  );
}