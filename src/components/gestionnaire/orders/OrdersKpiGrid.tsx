import type {
  ReactNode,
} from "react";

import {
  Banknote,
  Clock3,
  PackageCheck,
  ShoppingCart,
  XCircle,
} from "lucide-react";

import type {
  ManagerOrderRevenueByCurrency,
  ManagerOrdersKpis,
} from "@/lib/gestionnaire/orders/order-types";

import styles from "@/app/gestionnaire/(espace-prive)/commandes/commandes.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — COMMANDES
 * ============================================================================
 *
 * Fichier :
 *
 * src/components/gestionnaire/orders/OrdersKpiGrid.tsx
 *
 * RÔLE :
 *
 * Afficher les cinq indicateurs principaux de la page :
 *
 * /gestionnaire/commandes
 *
 * KPI :
 *
 * 1. Total commandes
 * 2. Chiffre d'affaires
 * 3. En cours de traitement
 * 4. Livrées
 * 5. Annulées
 *
 * IMPORTANT :
 *
 * Ce composant :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne calcule aucun KPI métier ;
 * - ne reçoit aucun storeId ;
 * - ne reçoit aucun managerId ;
 * - ne contient aucun chiffre fictif ;
 * - ne force aucune devise ;
 * - affiche uniquement les données préparées par order-query.ts.
 *
 * ============================================================================
 */


/* ==========================================================================
   PROPS
   ========================================================================== */

export interface OrdersKpiGridProps {
  readonly kpis:
    ManagerOrdersKpis;
}


/* ==========================================================================
   FORMAT ENTIER
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
   FORMAT DECIMAL
   ========================================================================== */

/**
 * Les Decimal Prisma sont transformés en chaînes dans order-query.ts.
 *
 * Exemple :
 *
 * "2450000.00"
 *
 * On évite de passer systématiquement par Number() afin de préserver
 * correctement les montants transmis par Prisma.
 */

function formatDecimalAmount(
  value:
    string,
): string | null {
  const normalized =
    value.trim();


  const match =
    /^(-?)(\d+)(?:\.(\d+))?$/.exec(
      normalized,
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


  const integerPart =
    rawInteger.replace(
      /^0+(?=\d)/,
      "",
    );


  const groupedInteger =
    integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      "\u202F",
    );


  const decimals =
    rawDecimals.replace(
      /0+$/,
      "",
    );


  if (
    !decimals
  ) {
    return `${sign}${groupedInteger}`;
  }


  return `${sign}${groupedInteger},${decimals}`;
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
   CHIFFRE D'AFFAIRES
   ========================================================================== */

/**
 * Une boutique peut théoriquement avoir plusieurs devises dans son historique.
 *
 * On ne mélange jamais :
 *
 * XOF + EUR + USD
 *
 * dans un faux total unique.
 */

function RevenueValue({
  values,
}: {
  readonly values:
    readonly ManagerOrderRevenueByCurrency[];
}) {
  if (
    values.length ===
    0
  ) {
    return (
      <strong
        className={
          styles.ordersKpiValue
        }
      >
        0
      </strong>
    );
  }


  const validValues =
    values
      .map(
        (
          value,
        ) => {
          const amount =
            formatDecimalAmount(
              value.amount,
            );


          const currency =
            normalizeCurrency(
              value.currency,
            );


          if (
            !amount ||
            !currency
          ) {
            return null;
          }


          return {
            amount,
            currency,
          };
        },
      )
      .filter(
        (
          value,
        ): value is {
          readonly amount:
            string;

          readonly currency:
            string;
        } =>
          value !==
          null,
      );


  if (
    validValues.length ===
    0
  ) {
    return (
      <strong
        className={
          styles.ordersKpiValue
        }
      >
        0
      </strong>
    );
  }


  return (
    <div
      className={
        styles.ordersKpiMoneyValues
      }
    >
      {validValues.map(
        (
          value,
        ) => (
          <strong
            key={
              value.currency
            }
            className={
              styles.ordersKpiValue
            }
          >
            {value.amount}

            {" "}

            <span
              className={
                styles.ordersKpiCurrency
              }
            >
              {value.currency}
            </span>
          </strong>
        ),
      )}
    </div>
  );
}


/* ==========================================================================
   CARTE KPI
   ========================================================================== */

type OrdersKpiTone =
  | "primary"
  | "success"
  | "info"
  | "delivered"
  | "danger";


interface OrdersKpiCardProps {
  readonly label:
    string;

  readonly secondary:
    string;

  readonly icon:
    ReactNode;

  readonly tone:
    OrdersKpiTone;

  readonly children:
    ReactNode;
}


function OrdersKpiCard({
  label,
  secondary,
  icon,
  tone,
  children,
}: OrdersKpiCardProps) {
  const toneClassName =
    tone ===
      "primary"
      ? styles.ordersKpiCardPrimary
      : tone ===
          "success"
        ? styles.ordersKpiCardSuccess
        : tone ===
            "info"
          ? styles.ordersKpiCardInfo
          : tone ===
              "delivered"
            ? styles.ordersKpiCardDelivered
            : styles.ordersKpiCardDanger;


  return (
    <article
      className={[
        styles.ordersKpiCard,
        toneClassName,
      ].join(
        " ",
      )}
    >
      {/* =================================================================
          ICÔNE
          ================================================================= */}

      <div
        className={
          styles.ordersKpiIcon
        }
        aria-hidden="true"
      >
        {icon}
      </div>


      {/* =================================================================
          CONTENU
          ================================================================= */}

      <div
        className={
          styles.ordersKpiContent
        }
      >
        <span
          className={
            styles.ordersKpiLabel
          }
        >
          {label}
        </span>


        {children}


        <span
          className={
            styles.ordersKpiSecondary
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

export default function OrdersKpiGrid({
  kpis,
}: OrdersKpiGridProps) {
  return (
    <section
      className={
        styles.ordersKpiGrid
      }
      aria-label="Résumé des commandes"
    >
      {/* =================================================================
          TOTAL COMMANDES
          ================================================================= */}

      <OrdersKpiCard
        label="Total commandes"
        secondary="Toutes vos commandes"
        tone="primary"
        icon={
          <ShoppingCart
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.ordersKpiValue
          }
        >
          {formatInteger(
            kpis.totalOrders,
          )}
        </strong>
      </OrdersKpiCard>


      {/* =================================================================
          CHIFFRE D'AFFAIRES
          ================================================================= */}

      <OrdersKpiCard
        label="Chiffre d’affaires"
        secondary="Sur la période"
        tone="success"
        icon={
          <Banknote
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <RevenueValue
          values={
            kpis.revenue
          }
        />
      </OrdersKpiCard>


      {/* =================================================================
          EN COURS DE TRAITEMENT
          ================================================================= */}

      <OrdersKpiCard
        label="En cours de traitement"
        secondary="À préparer"
        tone="info"
        icon={
          <Clock3
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.ordersKpiValue
          }
        >
          {formatInteger(
            kpis.processingOrders,
          )}
        </strong>
      </OrdersKpiCard>


      {/* =================================================================
          LIVRÉES
          ================================================================= */}

      <OrdersKpiCard
        label="Livrées"
        secondary="Commandes livrées"
        tone="delivered"
        icon={
          <PackageCheck
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.ordersKpiValue
          }
        >
          {formatInteger(
            kpis.deliveredOrders,
          )}
        </strong>
      </OrdersKpiCard>


      {/* =================================================================
          ANNULÉES
          ================================================================= */}

      <OrdersKpiCard
        label="Annulées"
        secondary="Commandes annulées"
        tone="danger"
        icon={
          <XCircle
            size={23}
            strokeWidth={1.9}
          />
        }
      >
        <strong
          className={
            styles.ordersKpiValue
          }
        >
          {formatInteger(
            kpis.cancelledOrders,
          )}
        </strong>
      </OrdersKpiCard>
    </section>
  );
}