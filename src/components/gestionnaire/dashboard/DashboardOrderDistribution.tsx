"use client";

import {
  CircleDot,
  ShoppingBag,
} from "lucide-react";

import {
  useMemo,
} from "react";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type {
  DashboardOrderDistributionItem,
  DashboardOrderDistributionKey,
} from "@/server/gestionnaire/dashboard/dashboard";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD ORDER DISTRIBUTION
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/
   DashboardOrderDistribution.tsx

   RESPONSABILITÉS :

   - afficher la répartition réelle des commandes ;
   - utiliser les groupes déjà calculés côté serveur ;
   - afficher un Donut Chart responsive ;
   - afficher le nombre total de commandes au centre ;
   - afficher les valeurs et pourcentages textuellement ;
   - gérer proprement l'absence de commandes ;
   - rester lisible sur desktop et mobile.

   IMPORTANT :

   Ce composant :
   - ne fait aucune requête Prisma ;
   - ne reçoit aucun storeId ;
   - ne reçoit aucun managerId ;
   - ne modifie aucun statut ;
   - n'invente aucune donnée.

   Les regroupements sont déjà effectués dans :

   src/server/gestionnaire/dashboard/dashboard.ts
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type DashboardOrderDistributionProps =
  Readonly<{
    data:
      readonly DashboardOrderDistributionItem[];
  }>;


/* ============================================================
   DISPLAY CONFIGURATION
   ------------------------------------------------------------
   Correspondance avec dashboard.ts :

   delivered
   → DELIVERED

   inProgress
   → CONFIRMED
   → PROCESSING
   → READY
   → SHIPPED

   pending
   → PENDING

   cancelled
   → CANCELLED

   refunded
   → REFUNDED
   ============================================================ */

type DistributionDisplayConfig =
  Readonly<{
    label:
      string;

    color:
      string;
  }>;


const DISTRIBUTION_CONFIG:
  Readonly<
    Record<
      DashboardOrderDistributionKey,
      DistributionDisplayConfig
    >
  > = {
  delivered: {
    label:
      "Livrées",

    color:
      "#22a06b",
  },

  inProgress: {
    label:
      "En cours",

    color:
      "#ed006d",
  },

  pending: {
    label:
      "En attente",

    color:
      "#d99a16",
  },

  cancelled: {
    label:
      "Annulées",

    color:
      "#8c8c95",
  },

  refunded: {
    label:
      "Remboursées",

    color:
      "#c95b68",
  },
};


/* ============================================================
   ORDER OF DISPLAY
   ============================================================ */

const DISTRIBUTION_ORDER:
  readonly DashboardOrderDistributionKey[] = [
  "delivered",
  "inProgress",
  "pending",
  "cancelled",
  "refunded",
];


/* ============================================================
   FORMATTERS
   ============================================================ */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const PERCENT_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        1,
    },
  );


/* ============================================================
   FORMAT INTEGER
   ============================================================ */

function formatInteger(
  value:
    number,
): string {
  return INTEGER_FORMATTER.format(
    Math.max(
      0,
      value,
    ),
  );
}


/* ============================================================
   FORMAT PERCENT
   ============================================================ */

function formatPercent(
  value:
    number,
): string {
  return `${PERCENT_FORMATTER.format(
    Math.max(
      0,
      value,
    ),
  )} %`;
}


/* ============================================================
   NORMALIZED CHART ITEM
   ============================================================ */

type ChartItem =
  Readonly<{
    key:
      DashboardOrderDistributionKey;

    label:
      string;

    count:
      number;

    percentage:
      number;

    color:
      string;
  }>;


/* ============================================================
   COMPONENT
   ============================================================ */

export default function DashboardOrderDistribution({
  data,
}: DashboardOrderDistributionProps) {
  /* ==========================================================
     NORMALIZE DATA
     ----------------------------------------------------------
     On impose un ordre stable même si Prisma retourne les
     groupes dans un ordre différent.
     ========================================================== */

  const normalizedData =
    useMemo<
      ChartItem[]
    >(
      () => {
        const map =
          new Map<
            DashboardOrderDistributionKey,
            DashboardOrderDistributionItem
          >(
            data.map(
              (
                item,
              ) => [
                item.key,
                item,
              ],
            ),
          );


        return DISTRIBUTION_ORDER.map(
          (
            key,
          ) => {
            const item =
              map.get(
                key,
              );


            const config =
              DISTRIBUTION_CONFIG[
                key
              ];


            return {
              key,

              label:
                config.label,

              count:
                item
                  ?.count ??
                0,

              percentage:
                item
                  ?.percentage ??
                0,

              color:
                config.color,
            };
          },
        );
      },
      [
        data,
      ],
    );


  /* ==========================================================
     TOTAL
     ========================================================== */

  const totalOrders =
    useMemo(
      () =>
        normalizedData.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.count,
          0,
        ),
      [
        normalizedData,
      ],
    );


  /* ==========================================================
     CHART DATA
     ----------------------------------------------------------
     Recharts ne reçoit que les segments ayant une valeur > 0.

     La liste textuelle, elle, continue d'afficher toutes les
     catégories, y compris celles à zéro.
     ========================================================== */

  const chartData =
    useMemo(
      () =>
        normalizedData.filter(
          (
            item,
          ) =>
            item.count >
            0,
        ),
      [
        normalizedData,
      ],
    );


  const hasOrders =
    totalOrders >
    0;


  const formattedTotal =
    formatInteger(
      totalOrders,
    );


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      className="gestionnaire-dashboard-order-distribution"
      aria-labelledby="gestionnaire-dashboard-order-distribution-title"
    >
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-order-distribution__header"
      >
        <div
          className="gestionnaire-dashboard-order-distribution__heading"
        >
          <span
            className="gestionnaire-dashboard-order-distribution__heading-icon"
            aria-hidden="true"
          >
            <CircleDot
              size={20}
              strokeWidth={1.8}
            />
          </span>

          <div>
            <h2
              id="gestionnaire-dashboard-order-distribution-title"
              className="gestionnaire-dashboard-order-distribution__title"
            >
              Répartition des commandes
            </h2>

            <p
              className="gestionnaire-dashboard-order-distribution__subtitle"
            >
              Statuts sur la période sélectionnée.
            </p>
          </div>
        </div>
      </div>


      {/* ======================================================
          EMPTY STATE
          ====================================================== */}

      {!hasOrders ? (
        <div
          className="gestionnaire-dashboard-order-distribution__empty"
          role="status"
        >
          <span
            className="gestionnaire-dashboard-order-distribution__empty-icon"
            aria-hidden="true"
          >
            <ShoppingBag
              size={28}
              strokeWidth={1.6}
            />
          </span>

          <strong
            className="gestionnaire-dashboard-order-distribution__empty-title"
          >
            Aucune commande
          </strong>

          <p
            className="gestionnaire-dashboard-order-distribution__empty-text"
          >
            Aucune commande n’a été enregistrée pour cette période.
          </p>
        </div>
      ) : (
        /* ====================================================
           CONTENT
           ==================================================== */

        <div
          className="gestionnaire-dashboard-order-distribution__content"
        >
          {/* ==================================================
              DONUT
              ================================================== */}

          <div
            className="gestionnaire-dashboard-order-distribution__chart-wrapper"
          >
            <div
              className="gestionnaire-dashboard-order-distribution__chart"
              role="img"
              aria-label={`${formattedTotal} commande${
                totalOrders >
                1
                  ? "s"
                  : ""
              } sur la période sélectionnée`}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      chartData
                    }
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius="67%"
                    outerRadius="90%"
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    isAnimationActive
                    animationDuration={450}
                    animationEasing="ease-out"
                  >
                    {chartData.map(
                      (
                        item,
                      ) => (
                        <Cell
                          key={
                            item.key
                          }
                          fill={
                            item.color
                          }
                        />
                      ),
                    )}
                  </Pie>


                  {/* ==========================================
                      TOOLTIP
                      ========================================== */}

                  <Tooltip
                    cursor={
                      false
                    }
                    contentStyle={{
                      backgroundColor:
                        "#ffffff",

                      border:
                        "1px solid #ececef",

                      borderRadius:
                        "10px",

                      boxShadow:
                        "0 10px 30px rgba(18, 18, 23, 0.08)",

                      padding:
                        "10px 12px",
                    }}
                    labelStyle={{
                      display:
                        "none",
                    }}
                    itemStyle={{
                      color:
                        "#16161b",

                      fontSize:
                        "13px",

                      fontWeight:
                        700,
                    }}
                    formatter={(
                      value,
                      name,
                    ) => [
                      `${formatInteger(
                        Number(
                          value ??
                            0,
                        ),
                      )} commande${
                        Number(
                          value ??
                            0,
                        ) >
                        1
                          ? "s"
                          : ""
                      }`,

                      String(
                        name,
                      ),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>


              {/* ==============================================
                  CENTER CONTENT
                  ============================================== */}

              <div
                className="gestionnaire-dashboard-order-distribution__center"
                aria-hidden="true"
              >
                <strong
                  className="gestionnaire-dashboard-order-distribution__center-value"
                >
                  {formattedTotal}
                </strong>

                <span
                  className="gestionnaire-dashboard-order-distribution__center-label"
                >
                  commande
                  {totalOrders >
                  1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
          </div>


          {/* ==================================================
              TEXTUAL DISTRIBUTION
              --------------------------------------------------
              Les valeurs importantes restent disponibles sous
              forme de texte et ne dépendent donc pas uniquement
              de la couleur ou du graphique.
              ================================================== */}

          <div
            className="gestionnaire-dashboard-order-distribution__legend"
            aria-label="Détail de la répartition des commandes"
          >
            {normalizedData.map(
              (
                item,
              ) => (
                <div
                  key={
                    item.key
                  }
                  className="gestionnaire-dashboard-order-distribution__legend-row"
                >
                  <div
                    className="gestionnaire-dashboard-order-distribution__legend-main"
                  >
                    <span
                      className="gestionnaire-dashboard-order-distribution__legend-dot"
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                      aria-hidden="true"
                    />

                    <span
                      className="gestionnaire-dashboard-order-distribution__legend-label"
                    >
                      {
                        item.label
                      }
                    </span>
                  </div>


                  <div
                    className="gestionnaire-dashboard-order-distribution__legend-values"
                  >
                    <strong
                      className="gestionnaire-dashboard-order-distribution__legend-count"
                    >
                      {formatInteger(
                        item.count,
                      )}
                    </strong>

                    <span
                      className="gestionnaire-dashboard-order-distribution__legend-percentage"
                    >
                      {formatPercent(
                        item.percentage,
                      )}
                    </span>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}


      {/* ======================================================
          ACCESSIBLE SUMMARY
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-order-distribution__sr-only"
        aria-live="polite"
      >
        <p>
          {`${formattedTotal} commande${
            totalOrders >
            1
              ? "s"
              : ""
          } au total.`}
        </p>

        {normalizedData.map(
          (
            item,
          ) => (
            <p
              key={
                `accessible-${item.key}`
              }
            >
              {`${item.label} : ${formatInteger(
                item.count,
              )}, ${formatPercent(
                item.percentage,
              )}.`}
            </p>
          ),
        )}
      </div>
    </section>
  );
}