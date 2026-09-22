import {
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

import type {
  DashboardCountKpi,
  DashboardRevenueKpi,
  DashboardSummary,
  DashboardTrend,
} from "@/server/gestionnaire/dashboard/dashboard";


/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD KPI GRID
   ------------------------------------------------------------
   Fichier :
   src/components/gestionnaire/dashboard/DashboardKpiGrid.tsx

   RESPONSABILITÉS :

   - afficher les 4 KPI principaux ;
   - chiffre d'affaires ;
   - commandes ;
   - clientes ;
   - produits vendus ;
   - afficher les variations réelles ;
   - afficher correctement hausse / baisse / stabilité ;
   - ne jamais inventer de chiffres ;
   - ne jamais effectuer de requête base de données ici.

   DONNÉES :

   Toutes les valeurs sont déjà :
   - authentifiées ;
   - filtrées par Store ;
   - calculées côté serveur ;
   - comparées à la période précédente.

   Ce composant est purement visuel.
   ============================================================ */


/* ============================================================
   PROPS
   ============================================================ */

type DashboardKpiGridProps =
  Readonly<{
    summary:
      DashboardSummary;
  }>;


/* ============================================================
   INTERNAL CARD PROPS
   ============================================================ */

type DashboardKpiCardProps =
  Readonly<{
    title:
      string;

    value:
      ReactNode;

    trend:
      DashboardTrend;

    changePercent:
      number | null;

    icon:
      ReactNode;

    accessibilityValue:
      string;

    unavailable?:
      boolean;

    unavailableMessage?:
      string;
  }>;


/* ============================================================
   NUMBER FORMATTERS
   ============================================================ */

const INTEGER_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      maximumFractionDigits:
        0,
    },
  );


const DECIMAL_FORMATTER =
  new Intl.NumberFormat(
    "fr-FR",
    {
      minimumFractionDigits:
        0,

      maximumFractionDigits:
        2,
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
   FORMAT MONEY
   ------------------------------------------------------------
   On affiche volontairement :

   1 250 000 XAF
   950 EUR
   1 200 USD

   plutôt que d'imposer un symbole monétaire.

   Cela permet de toujours afficher explicitement la vraie
   devise reçue du serveur.
   ============================================================ */

function formatMoney(
  amount:
    number,

  currency:
    string,
): string {
  return `${DECIMAL_FORMATTER.format(
    amount,
  )} ${currency}`;
}


/* ============================================================
   CHANGE LABEL
   ------------------------------------------------------------
   Un changePercent null peut notamment signifier :

   période précédente = 0
   période actuelle > 0

   Dans ce cas, afficher +100 % serait mathématiquement faux.

   On affiche donc "Nouvelle activité".
   ============================================================ */

function getChangeLabel(
  trend:
    DashboardTrend,

  changePercent:
    number | null,
): string {
  if (
    changePercent ===
    null
  ) {
    if (
      trend ===
      "up"
    ) {
      return "Nouvelle activité";
    }


    if (
      trend ===
      "down"
    ) {
      return "Activité interrompue";
    }


    return "Pas de comparaison";
  }


  const absoluteValue =
    Math.abs(
      changePercent,
    );


  const formatted =
    PERCENT_FORMATTER.format(
      absoluteValue,
    );


  if (
    trend ===
    "up"
  ) {
    return `+${formatted} %`;
  }


  if (
    trend ===
    "down"
  ) {
    return `-${formatted} %`;
  }


  return `${formatted} %`;
}


/* ============================================================
   TREND ACCESSIBILITY LABEL
   ============================================================ */

function getTrendAccessibilityLabel(
  trend:
    DashboardTrend,

  changePercent:
    number | null,
): string {
  if (
    changePercent ===
    null
  ) {
    if (
      trend ===
      "up"
    ) {
      return (
        "Nouvelle activité par rapport à la période précédente"
      );
    }


    if (
      trend ===
      "down"
    ) {
      return (
        "Aucune activité sur la période actuelle alors qu'il y en avait sur la période précédente"
      );
    }


    return (
      "Comparaison indisponible avec la période précédente"
    );
  }


  const formatted =
    PERCENT_FORMATTER.format(
      Math.abs(
        changePercent,
      ),
    );


  if (
    trend ===
    "up"
  ) {
    return (
      `Hausse de ${formatted} pour cent par rapport à la période précédente`
    );
  }


  if (
    trend ===
    "down"
  ) {
    return (
      `Baisse de ${formatted} pour cent par rapport à la période précédente`
    );
  }


  return (
    `Variation de ${formatted} pour cent par rapport à la période précédente`
  );
}


/* ============================================================
   TREND ICON
   ============================================================ */

function renderTrendIcon(
  trend:
    DashboardTrend,
): ReactNode {
  if (
    trend ===
    "up"
  ) {
    return (
      <TrendingUp
        size={14}
        strokeWidth={2}
        aria-hidden="true"
      />
    );
  }


  if (
    trend ===
    "down"
  ) {
    return (
      <TrendingDown
        size={14}
        strokeWidth={2}
        aria-hidden="true"
      />
    );
  }


  return (
    <span
      className="gestionnaire-dashboard-kpi__trend-line"
      aria-hidden="true"
    >
      —
    </span>
  );
}


/* ============================================================
   KPI CARD
   ============================================================ */

function DashboardKpiCard({
  title,
  value,
  trend,
  changePercent,
  icon,
  accessibilityValue,
  unavailable = false,
  unavailableMessage,
}: DashboardKpiCardProps) {
  const changeLabel =
    getChangeLabel(
      trend,
      changePercent,
    );


  const trendAccessibilityLabel =
    getTrendAccessibilityLabel(
      trend,
      changePercent,
    );


  return (
    <article
      className={[
        "gestionnaire-dashboard-kpi",

        unavailable
          ? "gestionnaire-dashboard-kpi--unavailable"
          : "",
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      aria-label={`${title} : ${accessibilityValue}`}
    >
      {/* ======================================================
          TOP
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-kpi__top"
      >
        <div
          className="gestionnaire-dashboard-kpi__heading"
        >
          <span
            className="gestionnaire-dashboard-kpi__icon"
            aria-hidden="true"
          >
            {icon}
          </span>

          <h2
            className="gestionnaire-dashboard-kpi__title"
          >
            {title}
          </h2>
        </div>
      </div>


      {/* ======================================================
          VALUE
          ====================================================== */}

      <div
        className="gestionnaire-dashboard-kpi__body"
      >
        <div
          className="gestionnaire-dashboard-kpi__value"
        >
          {value}
        </div>


        {/* ====================================================
            COMPARISON
            ==================================================== */}

        {!unavailable ? (
          <div
            className="gestionnaire-dashboard-kpi__comparison"
          >
            <span
              className={[
                "gestionnaire-dashboard-kpi__trend",

                `gestionnaire-dashboard-kpi__trend--${trend}`,
              ].join(
                " ",
              )}
              aria-label={
                trendAccessibilityLabel
              }
            >
              {renderTrendIcon(
                trend,
              )}

              <span>
                {changeLabel}
              </span>
            </span>

            <span
              className="gestionnaire-dashboard-kpi__comparison-label"
            >
              vs. période précédente
            </span>
          </div>
        ) : (
          <p
            className="gestionnaire-dashboard-kpi__unavailable"
          >
            {unavailableMessage ??
              "Donnée indisponible."}
          </p>
        )}
      </div>
    </article>
  );
}


/* ============================================================
   REVENUE VALUE
   ============================================================ */

function getRevenueValue(
  revenue:
    DashboardRevenueKpi,
): Readonly<{
  value:
    ReactNode;

  accessibilityValue:
    string;

  unavailable:
    boolean;

  unavailableMessage?:
    string;
}> {
  /* ----------------------------------------------------------
     MULTIPLE CURRENCIES
     ----------------------------------------------------------
     Le service refuse volontairement de sommer différentes
     devises.

     Exemple interdit :

     100 EUR + 200 XAF

     Dans ce cas on indique clairement la situation.
     ---------------------------------------------------------- */

  if (
    revenue.mixedCurrencies
  ) {
    return {
      value: (
        <span
          className="gestionnaire-dashboard-kpi__value--text"
        >
          Plusieurs devises
        </span>
      ),

      accessibilityValue:
        "plusieurs devises utilisées",

      unavailable:
        true,

      unavailableMessage:
        "Le chiffre d’affaires ne peut pas être additionné entre plusieurs devises.",
    };
  }


  /* ----------------------------------------------------------
     NO CURRENCY YET
     ----------------------------------------------------------
     Une nouvelle boutique peut ne posséder encore :
     - aucun paiement ;
     - aucun produit commercialisé.

     Aucun code devise ne peut donc être inventé.
     ---------------------------------------------------------- */

  if (
    !revenue.currency
  ) {
    return {
      value: (
        <span>
          0
        </span>
      ),

      accessibilityValue:
        "0, devise non encore définie",

      unavailable:
        true,

      unavailableMessage:
        "La devise sera affichée dès qu’elle sera définie pour cette boutique.",
    };
  }


  /* ----------------------------------------------------------
     NORMAL REVENUE
     ---------------------------------------------------------- */

  const amount =
    revenue.amount ??
    0;


  const formatted =
    formatMoney(
      amount,
      revenue.currency,
    );


  return {
    value:
      formatted,

    accessibilityValue:
      formatted,

    unavailable:
      false,
  };
}


/* ============================================================
   COUNT KPI
   ============================================================ */

function getCountKpiValue(
  kpi:
    DashboardCountKpi,
): string {
  return formatInteger(
    kpi.value,
  );
}


/* ============================================================
   DASHBOARD KPI GRID
   ============================================================ */

export default function DashboardKpiGrid({
  summary,
}: DashboardKpiGridProps) {
  const revenue =
    getRevenueValue(
      summary.revenue,
    );


  const ordersValue =
    getCountKpiValue(
      summary.orders,
    );


  const customersValue =
    getCountKpiValue(
      summary.customers,
    );


  const productsSoldValue =
    getCountKpiValue(
      summary.productsSold,
    );


  return (
    <section
      className="gestionnaire-dashboard-kpi-grid"
      aria-label="Indicateurs principaux de la boutique"
    >
      {/* ======================================================
          REVENUE
          ====================================================== */}

      <DashboardKpiCard
        title="Chiffre d’affaires"
        value={
          revenue.value
        }
        accessibilityValue={
          revenue
            .accessibilityValue
        }
        trend={
          summary
            .revenue
            .trend
        }
        changePercent={
          summary
            .revenue
            .changePercent
        }
        unavailable={
          revenue.unavailable
        }
        unavailableMessage={
          revenue
            .unavailableMessage
        }
        icon={
          <TrendingUp
            size={22}
            strokeWidth={1.8}
          />
        }
      />


      {/* ======================================================
          ORDERS
          ====================================================== */}

      <DashboardKpiCard
        title="Commandes"
        value={
          ordersValue
        }
        accessibilityValue={`${ordersValue} commande${
          summary
            .orders
            .value >
          1
            ? "s"
            : ""
        }`}
        trend={
          summary
            .orders
            .trend
        }
        changePercent={
          summary
            .orders
            .changePercent
        }
        icon={
          <ShoppingCart
            size={22}
            strokeWidth={1.8}
          />
        }
      />


      {/* ======================================================
          CUSTOMERS
          ====================================================== */}

      <DashboardKpiCard
        title="Clients"
        value={
          customersValue
        }
        accessibilityValue={`${customersValue} client${
          summary
            .customers
            .value >
          1
            ? "s"
            : ""
        }`}
        trend={
          summary
            .customers
            .trend
        }
        changePercent={
          summary
            .customers
            .changePercent
        }
        icon={
          <Users
            size={22}
            strokeWidth={1.8}
          />
        }
      />


      {/* ======================================================
          PRODUCTS SOLD
          ====================================================== */}

      <DashboardKpiCard
        title="Produits vendus"
        value={
          productsSoldValue
        }
        accessibilityValue={`${productsSoldValue} unité${
          summary
            .productsSold
            .value >
          1
            ? "s"
            : ""
        } vendue${
          summary
            .productsSold
            .value >
          1
            ? "s"
            : ""
        }`}
        trend={
          summary
            .productsSold
            .trend
        }
        changePercent={
          summary
            .productsSold
            .changePercent
        }
        icon={
          <Package
            size={22}
            strokeWidth={1.8}
          />
        }
      />
    </section>
  );
}