/* ============================================================
   L&E COSMETICS EMPIRE
   DASHBOARD LOADING
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(espace-prive)/dashboard/loading.tsx

   OBJECTIF :

   - conserver la structure visuelle du Dashboard pendant
     le chargement ;
   - éviter les sauts de mise en page ;
   - afficher des skeletons légers ;
   - ne jamais afficher de fausses données ;
   - utiliser le layout Gestionnaire déjà existant ;
   - rester compatible desktop + mobile ;
   - occuper toute la largeur disponible du workspace.

   IMPORTANT :

   Ce fichier ne recrée :
   - ni Sidebar ;
   - ni Header global ;
   - ni GestionnaireShell.

   Il représente uniquement le contenu de la page Dashboard.
   ============================================================ */


/* ============================================================
   GENERIC SKELETON
   ============================================================ */

function Skeleton({
  className = "",
}: Readonly<{
  className?:
    string;
}>) {
  return (
    <span
      className={[
        "gestionnaire-dashboard-skeleton",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    />
  );
}


/* ============================================================
   KPI SKELETON
   ============================================================ */

function KpiSkeleton() {
  return (
    <article
      className="gestionnaire-dashboard-kpi gestionnaire-dashboard-kpi--loading"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-kpi__top"
      >
        <div
          className="gestionnaire-dashboard-kpi__heading"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__kpi-icon"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__kpi-title"
          />
        </div>
      </div>

      <div
        className="gestionnaire-dashboard-kpi__body"
      >
        <Skeleton
          className="gestionnaire-dashboard-loading__kpi-value"
        />

        <div
          className="gestionnaire-dashboard-kpi__comparison"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__kpi-trend"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__kpi-comparison"
          />
        </div>
      </div>
    </article>
  );
}


/* ============================================================
   SALES CHART SKELETON
   ============================================================ */

function SalesChartSkeleton() {
  return (
    <section
      className="gestionnaire-dashboard-sales gestionnaire-dashboard-loading__card"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-sales__header"
      >
        <div
          className="gestionnaire-dashboard-sales__heading"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__section-icon"
          />

          <div
            className="gestionnaire-dashboard-loading__heading-copy"
          >
            <Skeleton
              className="gestionnaire-dashboard-loading__section-title"
            />

            <Skeleton
              className="gestionnaire-dashboard-loading__section-subtitle"
            />
          </div>
        </div>

        <Skeleton
          className="gestionnaire-dashboard-loading__select"
        />
      </div>

      <div
        className="gestionnaire-dashboard-loading__chart"
      >
        <div
          className="gestionnaire-dashboard-loading__chart-y-axis"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>

        <div
          className="gestionnaire-dashboard-loading__chart-body"
        >
          <span
            className="gestionnaire-dashboard-loading__chart-grid gestionnaire-dashboard-loading__chart-grid--1"
          />

          <span
            className="gestionnaire-dashboard-loading__chart-grid gestionnaire-dashboard-loading__chart-grid--2"
          />

          <span
            className="gestionnaire-dashboard-loading__chart-grid gestionnaire-dashboard-loading__chart-grid--3"
          />

          <span
            className="gestionnaire-dashboard-loading__chart-grid gestionnaire-dashboard-loading__chart-grid--4"
          />

          <span
            className="gestionnaire-dashboard-loading__chart-line"
          />
        </div>
      </div>

      <div
        className="gestionnaire-dashboard-loading__chart-dates"
      >
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    </section>
  );
}


/* ============================================================
   ORDER DISTRIBUTION SKELETON
   ============================================================ */

function OrderDistributionSkeleton() {
  return (
    <section
      className="gestionnaire-dashboard-order-distribution gestionnaire-dashboard-loading__card"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-order-distribution__header"
      >
        <div
          className="gestionnaire-dashboard-order-distribution__heading"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__section-icon"
          />

          <div
            className="gestionnaire-dashboard-loading__heading-copy"
          >
            <Skeleton
              className="gestionnaire-dashboard-loading__section-title"
            />

            <Skeleton
              className="gestionnaire-dashboard-loading__section-subtitle"
            />
          </div>
        </div>
      </div>

      <div
        className="gestionnaire-dashboard-loading__distribution-content"
      >
        <Skeleton
          className="gestionnaire-dashboard-loading__donut"
        />

        <div
          className="gestionnaire-dashboard-loading__legend"
        >
          {Array.from({
            length: 5,
          }).map((_, index) => (
            <div
              key={index}
              className="gestionnaire-dashboard-loading__legend-row"
            >
              <Skeleton
                className="gestionnaire-dashboard-loading__legend-dot"
              />

              <Skeleton
                className="gestionnaire-dashboard-loading__legend-label"
              />

              <Skeleton
                className="gestionnaire-dashboard-loading__legend-value"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ============================================================
   PERFORMANCE SKELETON
   ============================================================ */

function PerformanceSkeleton() {
  return (
    <section
      className="gestionnaire-dashboard-performance gestionnaire-dashboard-loading__card"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-performance__top"
      >
        <Skeleton
          className="gestionnaire-dashboard-loading__performance-icon"
        />

        <div
          className="gestionnaire-dashboard-loading__performance-copy"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__performance-eyebrow"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__performance-title"
          />
        </div>
      </div>

      <Skeleton
        className="gestionnaire-dashboard-loading__performance-line"
      />

      <Skeleton
        className="gestionnaire-dashboard-loading__performance-line gestionnaire-dashboard-loading__performance-line--short"
      />
    </section>
  );
}


/* ============================================================
   QUICK ACTIONS SKELETON
   ============================================================ */

function QuickActionsSkeleton() {
  return (
    <section
      className="gestionnaire-dashboard-quick-actions gestionnaire-dashboard-loading__card"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-quick-actions__header"
      >
        <Skeleton
          className="gestionnaire-dashboard-loading__quick-title"
        />

        <Skeleton
          className="gestionnaire-dashboard-loading__quick-subtitle"
        />
      </div>

      <div
        className="gestionnaire-dashboard-loading__quick-list"
      >
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="gestionnaire-dashboard-loading__quick-row"
          >
            <Skeleton
              className="gestionnaire-dashboard-loading__quick-icon"
            />

            <Skeleton
              className="gestionnaire-dashboard-loading__quick-label"
            />

            <Skeleton
              className="gestionnaire-dashboard-loading__quick-chevron"
            />
          </div>
        ))}
      </div>
    </section>
  );
}


/* ============================================================
   RECENT ORDERS SKELETON
   ============================================================ */

function RecentOrdersSkeleton() {
  return (
    <section
      className="gestionnaire-dashboard-recent-orders gestionnaire-dashboard-loading__card"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-recent-orders__header"
      >
        <div
          className="gestionnaire-dashboard-recent-orders__heading"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__section-title"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__section-subtitle"
          />
        </div>

        <Skeleton
          className="gestionnaire-dashboard-loading__view-all"
        />
      </div>

      <div
        className="gestionnaire-dashboard-loading__orders-table"
      >
        <div
          className="gestionnaire-dashboard-loading__orders-head"
        >
          {Array.from({
            length: 7,
          }).map((_, index) => (
            <Skeleton
              key={index}
              className="gestionnaire-dashboard-loading__orders-head-cell"
            />
          ))}
        </div>

        <div
          className="gestionnaire-dashboard-loading__orders-body"
        >
          {Array.from({
            length: 5,
          }).map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="gestionnaire-dashboard-loading__orders-row"
            >
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </div>
          ))}
        </div>
      </div>

      <div
        className="gestionnaire-dashboard-loading__orders-mobile"
      >
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <div
            key={index}
            className="gestionnaire-dashboard-loading__order-mobile-card"
          >
            <div
              className="gestionnaire-dashboard-loading__order-mobile-top"
            >
              <Skeleton />
              <Skeleton />
            </div>

            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>
        ))}
      </div>
    </section>
  );
}


/* ============================================================
   TOP PRODUCTS SKELETON
   ============================================================ */

function TopProductsSkeleton() {
  return (
    <section
      className="gestionnaire-dashboard-top-products gestionnaire-dashboard-loading__card"
      aria-hidden="true"
    >
      <div
        className="gestionnaire-dashboard-top-products__header"
      >
        <div
          className="gestionnaire-dashboard-top-products__heading"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__section-title"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__section-subtitle"
          />
        </div>

        <Skeleton
          className="gestionnaire-dashboard-loading__top-products-link"
        />
      </div>

      <div
        className="gestionnaire-dashboard-loading__products-list"
      >
        {Array.from({
          length: 5,
        }).map((_, index) => (
          <div
            key={index}
            className="gestionnaire-dashboard-loading__product-row"
          >
            <Skeleton
              className="gestionnaire-dashboard-loading__product-rank"
            />

            <Skeleton
              className="gestionnaire-dashboard-loading__product-image"
            />

            <div
              className="gestionnaire-dashboard-loading__product-info"
            >
              <Skeleton
                className="gestionnaire-dashboard-loading__product-name"
              />

              <Skeleton
                className="gestionnaire-dashboard-loading__product-meta"
              />
            </div>

            <Skeleton
              className="gestionnaire-dashboard-loading__product-arrow"
            />
          </div>
        ))}
      </div>
    </section>
  );
}


/* ============================================================
   PAGE LOADING
   ============================================================ */

export default function GestionnaireDashboardLoading() {
  return (
    <div
      className="gestionnaire-dashboard gestionnaire-dashboard--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Chargement du tableau de bord"
    >
      {/* ======================================================
          ZONE 1
          WELCOME + PERIOD
          ====================================================== */}

      <header
        className="gestionnaire-dashboard__hero"
      >
        <div
          className="gestionnaire-dashboard__welcome"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__welcome-label"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__welcome-title"
          />

          <Skeleton
            className="gestionnaire-dashboard-loading__welcome-description"
          />
        </div>

        <div
          className="gestionnaire-dashboard__period"
        >
          <Skeleton
            className="gestionnaire-dashboard-loading__period"
          />
        </div>
      </header>


      {/* ======================================================
          ZONE 2
          KPI
          ====================================================== */}

      <div
        className="gestionnaire-dashboard__kpis"
      >
        <section
          className="gestionnaire-dashboard-kpi-grid"
          aria-hidden="true"
        >
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </section>
      </div>


      {/* ======================================================
          ZONE 3
          SALES + DISTRIBUTION + SIDE COLUMN
          ====================================================== */}

      <section
        className="gestionnaire-dashboard__overview"
        aria-hidden="true"
      >
        <div
          className="gestionnaire-dashboard__sales"
        >
          <SalesChartSkeleton />
        </div>

        <div
          className="gestionnaire-dashboard__distribution"
        >
          <OrderDistributionSkeleton />
        </div>

        <div
          className="gestionnaire-dashboard__side"
        >
          <aside
            className="gestionnaire-dashboard-side-column"
          >
            <PerformanceSkeleton />
            <QuickActionsSkeleton />
          </aside>
        </div>
      </section>


      {/* ======================================================
          ZONE 4
          ORDERS + TOP PRODUCTS
          ====================================================== */}

      <section
        className="gestionnaire-dashboard__bottom"
        aria-hidden="true"
      >
        <div
          className="gestionnaire-dashboard__recent-orders"
        >
          <RecentOrdersSkeleton />
        </div>

        <div
          className="gestionnaire-dashboard__top-products"
        >
          <TopProductsSkeleton />
        </div>
      </section>


      {/* ======================================================
          ACCESSIBLE STATUS
          ====================================================== */}

      <span
        className="gestionnaire-dashboard__sr-only"
      >
        Chargement des données du tableau de bord.
      </span>
    </div>
  );
}