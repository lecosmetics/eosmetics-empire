import {
  BarChart3,
} from "lucide-react";

import styles from "./statistiques.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — STATISTIQUES — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/statistiques/loading.tsx
 *
 * RÔLE :
 *
 * Afficher immédiatement un skeleton propre pendant que :
 *
 * - l'accès Gestionnaire est vérifié ;
 * - la période est résolue ;
 * - les commandes sont chargées ;
 * - les paiements sont chargés ;
 * - les livraisons sont chargées ;
 * - les statistiques sont agrégées côté serveur.
 *
 *
 * IMPORTANT :
 *
 * - aucune fausse statistique ;
 * - aucun faux montant ;
 * - aucune fausse commande ;
 * - aucun faux produit ;
 * - aucun faux pourcentage ;
 * - aucun second <main> ;
 * - aucune nouvelle dépendance ;
 * - aucun JavaScript client nécessaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   SKELETON PRIMITIVES
   ========================================================================== */

function SkeletonBlock({
  width = "100%",
  height,
  radius = 8,
}: {
  readonly width?:
    string;

  readonly height:
    number;

  readonly radius?:
    number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display:
          "block",

        width,

        height,

        flexShrink:
          0,

        borderRadius:
          radius,

        background:
          "linear-gradient(90deg, #eeeeF2 0%, #f7f7f9 50%, #eeeeF2 100%)",
      }}
    />
  );
}


/* ==========================================================================
   KPI SKELETON
   ========================================================================== */

function KpiSkeleton() {
  return (
    <div
      className={styles.statisticsKpiCard}
      aria-hidden="true"
    >
      <div
        className={[
          styles.statisticsKpiIcon,
          styles.statisticsKpiIconPrimary,
        ].join(" ")}
      >
        <SkeletonBlock
          width="20px"
          height={20}
          radius={6}
        />
      </div>


      <div className={styles.statisticsKpiContent}>
        <SkeletonBlock
          width="58%"
          height={10}
          radius={5}
        />

        <SkeletonBlock
          width="76%"
          height={27}
          radius={7}
        />

        <SkeletonBlock
          width="68%"
          height={9}
          radius={5}
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   CARD HEADER SKELETON
   ========================================================================== */

function CardHeaderSkeleton({
  subtitle = true,
}: {
  readonly subtitle?:
    boolean;
}) {
  return (
    <div
      className={styles.statisticsChartCardHeader}
      aria-hidden="true"
    >
      <div className={styles.statisticsChartCardHeading}>
        <div className={styles.statisticsChartCardIcon}>
          <SkeletonBlock
            width="17px"
            height={17}
            radius={5}
          />
        </div>


        <div className={styles.statisticsChartCardTitleGroup}>
          <SkeletonBlock
            width="135px"
            height={11}
            radius={5}
          />

          {subtitle ? (
            <SkeletonBlock
              width="185px"
              height={8}
              radius={4}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}


/* ==========================================================================
   REVENUE CHART SKELETON
   ========================================================================== */

function RevenueChartSkeleton() {
  return (
    <section
      className={styles.statisticsChartCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton />


      <div className={styles.statisticsChartCardBody}>
        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              14,

            width:
              "100%",
          }}
        >
          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              justifyContent:
                "space-between",

              gap:
                12,
            }}
          >
            <SkeletonBlock
              width="70px"
              height={10}
            />

            <SkeletonBlock
              width="90px"
              height={9}
            />
          </div>


          <div
            style={{
              position:
                "relative",

              width:
                "100%",

              height:
                245,

              overflow:
                "hidden",

              borderRadius:
                10,

              background:
                "#fafafa",

              border:
                "1px solid #f0f0f3",
            }}
          >
            <div
              style={{
                position:
                  "absolute",

                inset:
                  "18px 16px 32px 48px",

                display:
                  "flex",

                flexDirection:
                  "column",

                justifyContent:
                  "space-between",
              }}
            >
              {Array.from(
                {
                  length:
                    5,
                },
                (
                  _,
                  index,
                ) => (
                  <SkeletonBlock
                    key={index}
                    height={1}
                    radius={0}
                  />
                ),
              )}
            </div>


            <div
              style={{
                position:
                  "absolute",

                left:
                  "8%",

                right:
                  "4%",

                bottom:
                  "24%",

                height:
                  3,

                borderRadius:
                  999,

                transform:
                  "rotate(-5deg)",

                transformOrigin:
                  "left center",

                background:
                  "#ead0dc",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   SMALL CHART SKELETON
   ========================================================================== */

function SmallChartSkeleton() {
  return (
    <section
      className={styles.statisticsChartCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton />


      <div className={styles.statisticsChartCardBody}>
        <div
          style={{
            minHeight:
              230,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            gap:
              22,
          }}
        >
          <div
            style={{
              width:
                120,

              height:
                120,

              flex:
                "0 0 120px",

              borderRadius:
                "50%",

              border:
                "17px solid #efeff2",
            }}
          />


          <div
            style={{
              flex:
                1,

              minWidth:
                0,

              display:
                "flex",

              flexDirection:
                "column",

              gap:
                12,
            }}
          >
            {Array.from(
              {
                length:
                  4,
              },
              (
                _,
                index,
              ) => (
                <div
                  key={index}
                  style={{
                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      8,
                  }}
                >
                  <SkeletonBlock
                    width="8px"
                    height={8}
                    radius={999}
                  />

                  <SkeletonBlock
                    width={
                      index %
                          2 ===
                        0
                        ? "74%"
                        : "58%"
                    }
                    height={9}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   BAR CHART SKELETON
   ========================================================================== */

function BarsSkeleton() {
  return (
    <section
      className={styles.statisticsChartCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton />


      <div className={styles.statisticsChartCardBody}>
        <div
          style={{
            minHeight:
              230,

            display:
              "flex",

            flexDirection:
              "column",

            justifyContent:
              "center",

            gap:
              18,
          }}
        >
          {[
            "92%",
            "76%",
            "61%",
            "48%",
            "35%",
          ].map(
            (
              width,
              index,
            ) => (
              <div
                key={width}
                style={{
                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    7,
                }}
              >
                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "space-between",

                    gap:
                      12,
                  }}
                >
                  <SkeletonBlock
                    width={
                      index %
                          2 ===
                        0
                        ? "105px"
                        : "82px"
                    }
                    height={9}
                  />

                  <SkeletonBlock
                    width="45px"
                    height={9}
                  />
                </div>


                <SkeletonBlock
                  width={width}
                  height={8}
                  radius={999}
                />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   TABLE SKELETON
   ========================================================================== */

function TableSkeleton({
  rows = 5,
}: {
  readonly rows?:
    number;
}) {
  return (
    <section
      className={styles.statisticsTableCard}
      aria-hidden="true"
    >
      <div className={styles.statisticsTableCardHeader}>
        <SkeletonBlock
          width="155px"
          height={12}
        />

        <SkeletonBlock
          width="68px"
          height={9}
        />
      </div>


      <div
        style={{
          width:
            "100%",

          padding:
            "5px 14px 10px",
        }}
      >
        <div
          style={{
            minHeight:
              35,

            display:
              "grid",

            gridTemplateColumns:
              "minmax(150px, 1.5fr) minmax(90px, 1fr) minmax(70px, .7fr) minmax(90px, .8fr)",

            alignItems:
              "center",

            gap:
              12,

            borderBottom:
              "1px solid #eeeeF2",
          }}
        >
          {Array.from(
            {
              length:
                4,
            },
            (
              _,
              index,
            ) => (
              <SkeletonBlock
                key={index}
                width={
                  index ===
                  0
                    ? "85px"
                    : "58px"
                }
                height={8}
              />
            ),
          )}
        </div>


        {Array.from(
          {
            length:
              rows,
          },
          (
            _,
            rowIndex,
          ) => (
            <div
              key={rowIndex}
              style={{
                minHeight:
                  59,

                display:
                  "grid",

                gridTemplateColumns:
                  "minmax(150px, 1.5fr) minmax(90px, 1fr) minmax(70px, .7fr) minmax(90px, .8fr)",

                alignItems:
                  "center",

                gap:
                  12,

                borderBottom:
                  rowIndex ===
                  rows -
                    1
                    ? "0"
                    : "1px solid #f2f2f4",
              }}
            >
              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  gap:
                    9,
                }}
              >
                <SkeletonBlock
                  width="38px"
                  height={38}
                  radius={8}
                />

                <div
                  style={{
                    flex:
                      1,

                    display:
                      "flex",

                    flexDirection:
                      "column",

                    gap:
                      6,
                  }}
                >
                  <SkeletonBlock
                    width="75%"
                    height={9}
                  />

                  <SkeletonBlock
                    width="45%"
                    height={7}
                  />
                </div>
              </div>


              <SkeletonBlock
                width="72%"
                height={9}
              />


              <SkeletonBlock
                width="55%"
                height={9}
              />


              <SkeletonBlock
                width="75%"
                height={9}
              />
            </div>
          ),
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   INFO CARD SKELETON
   ========================================================================== */

function InformationCardSkeleton() {
  return (
    <section
      className={styles.statisticsInsightCard}
      aria-hidden="true"
    >
      <div className={styles.statisticsInsightIcon}>
        <SkeletonBlock
          width="22px"
          height={22}
          radius={6}
        />
      </div>


      <div className={styles.statisticsInsightContent}>
        <SkeletonBlock
          width="48%"
          height={11}
        />

        <SkeletonBlock
          width="94%"
          height={9}
        />

        <SkeletonBlock
          width="78%"
          height={9}
        />


        <div
          style={{
            marginTop:
              5,

            paddingTop:
              11,

            display:
              "grid",

            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",

            gap:
              10,

            borderTop:
              "1px solid #eeeeF2",
          }}
        >
          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",

              gap:
                6,
            }}
          >
            <SkeletonBlock
              width="70%"
              height={7}
            />

            <SkeletonBlock
              width="82%"
              height={10}
            />
          </div>


          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",

              gap:
                6,
            }}
          >
            <SkeletonBlock
              width="70%"
              height={7}
            />

            <SkeletonBlock
              width="82%"
              height={10}
            />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function StatisticsLoading() {
  return (
    <div
      className={styles.statisticsPage}
      aria-busy="true"
      aria-live="polite"
    >
      {/* ==================================================================
          ACCESSIBILITY
          ================================================================== */}

      <span className={styles.statisticsVisuallyHidden}>
        Chargement des statistiques de votre boutique.
      </span>


      {/* ==================================================================
          HEADER
          ================================================================== */}

      <header
        className={styles.statisticsHeader}
        aria-hidden="true"
      >
        <div className={styles.statisticsBreadcrumb}>
          <SkeletonBlock
            width="150px"
            height={9}
          />
        </div>


        <div className={styles.statisticsHeaderMain}>
          <div className={styles.statisticsHeaderCopy}>
            <SkeletonBlock
              width="185px"
              height={31}
              radius={8}
            />

            <SkeletonBlock
              width="330px"
              height={10}
              radius={5}
            />
          </div>


          <div className={styles.statisticsPeriodPanel}>
            <div className={styles.statisticsPeriodIcon}>
              <BarChart3
                size={18}
                strokeWidth={1.8}
              />
            </div>


            <div
              style={{
                padding:
                  "0 14px",

                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  18,

                minHeight:
                  42,
              }}
            >
              <SkeletonBlock
                width="120px"
                height={10}
              />

              <SkeletonBlock
                width="180px"
                height={10}
              />
            </div>
          </div>
        </div>
      </header>


      {/* ==================================================================
          KPI
          ================================================================== */}

      <section
        className={styles.statisticsKpiSection}
        aria-hidden="true"
      >
        <div className={styles.statisticsKpiGrid}>
          {Array.from(
            {
              length:
                5,
            },
            (
              _,
              index,
            ) => (
              <KpiSkeleton
                key={index}
              />
            ),
          )}
        </div>
      </section>


      {/* ==================================================================
          TOP CHARTS
          ================================================================== */}

      <div
        className={styles.statisticsTopChartsGrid}
        aria-hidden="true"
      >
        <RevenueChartSkeleton />

        <SmallChartSkeleton />

        <BarsSkeleton />
      </div>


      {/* ==================================================================
          TABLES + PAYMENT
          ================================================================== */}

      <div
        className={styles.statisticsTablesGrid}
        aria-hidden="true"
      >
        <TableSkeleton />

        <TableSkeleton />

        <SmallChartSkeleton />
      </div>


      {/* ==================================================================
          BOTTOM
          ================================================================== */}

      <div
        className={styles.statisticsBottomGrid}
        aria-hidden="true"
      >
        <BarsSkeleton />

        <InformationCardSkeleton />

        <InformationCardSkeleton />
      </div>
    </div>
  );
}