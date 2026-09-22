import type {
  CSSProperties,
} from "react";

import {
  Truck,
} from "lucide-react";

import styles from "./livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — LIVRAISONS — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/loading.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher immédiatement une interface de chargement propre ;
 * - conserver exactement la largeur disponible du Main Gestionnaire ;
 * - éviter tout déplacement brutal de mise en page ;
 * - représenter visuellement :
 *   - le header ;
 *   - les KPI ;
 *   - les filtres ;
 *   - le tableau ;
 * - ne charger aucune donnée ;
 * - ne créer aucune fausse livraison ;
 * - ne recréer ni Sidebar ni Header global.
 *
 * IMPORTANT :
 *
 * Ce composant est uniquement visuel.
 *
 * Il ne contient :
 *
 * - aucune requête Prisma ;
 * - aucune authentification ;
 * - aucune donnée client ;
 * - aucune donnée commande ;
 * - aucun Shipment fictif.
 *
 * ============================================================================
 */


/* ==========================================================================
   SKELETON BASE
   ========================================================================== */

const skeletonBaseStyle:
  CSSProperties = {
  position:
    "relative",

  overflow:
    "hidden",

  background:
    "linear-gradient(90deg, #f0f0f3 0%, #f8f8fa 50%, #f0f0f3 100%)",

  backgroundSize:
    "200% 100%",

  animation:
    "livraisonsLoadingPulse 1.4s ease-in-out infinite",

  borderRadius:
    "8px",
};


/* ==========================================================================
   SKELETON
   ========================================================================== */

function Skeleton({
  width,
  height,
  radius = 8,
}: {
  readonly width:
    string | number;

  readonly height:
    string | number;

  readonly radius?:
    number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...skeletonBaseStyle,

        display:
          "block",

        width,

        height,

        borderRadius:
          radius,
      }}
    />
  );
}


/* ==========================================================================
   KPI SKELETON
   ========================================================================== */

function KpiSkeleton() {
  return (
    <article
      className={styles.livraisonsKpiCard}
      aria-hidden="true"
    >
      <div
        className={styles.livraisonsKpiIcon}
        style={{
          background:
            "#f3f3f6",
        }}
      >
        <Skeleton
          width={22}
          height={22}
          radius={6}
        />
      </div>


      <div className={styles.livraisonsKpiContent}>
        <Skeleton
          width="72%"
          height={12}
          radius={6}
        />


        <Skeleton
          width={54}
          height={30}
          radius={7}
        />


        <Skeleton
          width="86%"
          height={10}
          radius={5}
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   FILTER SKELETON
   ========================================================================== */

function FilterSkeleton({
  width = "100%",
}: {
  readonly width?:
    string | number;
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,

        minWidth:
          0,

        minHeight:
          42,

        display:
          "flex",

        alignItems:
          "center",

        padding:
          "0 12px",

        background:
          "#ffffff",

        border:
          "1px solid #dedee4",

        borderRadius:
          9,
      }}
    >
      <Skeleton
        width="100%"
        height={13}
        radius={6}
      />
    </div>
  );
}


/* ==========================================================================
   TABLE ROW SKELETON
   ========================================================================== */

function TableRowSkeleton({
  index,
}: {
  readonly index:
    number;
}) {
  return (
    <tr
      className={styles.livraisonsTableRow}
      aria-hidden="true"
    >
      <td
        className={[
          styles.livraisonsTableCell,
          styles.livraisonsTableCellNumber,
        ].join(" ")}
      >
        <Skeleton
          width={18}
          height={11}
          radius={5}
        />
      </td>


      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsReferenceCell}>
          <Skeleton
            width={118}
            height={13}
            radius={6}
          />

          <Skeleton
            width={88}
            height={9}
            radius={5}
          />
        </div>
      </td>


      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsCustomerCell}>
          <Skeleton
            width={
              index % 2 ===
              0
                ? 118
                : 142
            }
            height={13}
            radius={6}
          />

          <Skeleton
            width={96}
            height={9}
            radius={5}
          />
        </div>
      </td>


      <td className={styles.livraisonsTableCell}>
        <Skeleton
          width={98}
          height={12}
          radius={6}
        />
      </td>


      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsProductsCell}>
          <div
            className={styles.livraisonsProductsIcon}
            style={{
              background:
                "#f3f3f6",
            }}
          >
            <Skeleton
              width={17}
              height={17}
              radius={5}
            />
          </div>

          <div className={styles.livraisonsProductsCopy}>
            <Skeleton
              width={120}
              height={12}
              radius={6}
            />

            <Skeleton
              width={62}
              height={9}
              radius={5}
            />
          </div>
        </div>
      </td>


      <td className={styles.livraisonsTableCell}>
        <div className={styles.livraisonsAddressCell}>
          <Skeleton
            width={82}
            height={12}
            radius={6}
          />

          <Skeleton
            width={148}
            height={9}
            radius={5}
          />
        </div>
      </td>


      <td className={styles.livraisonsTableCell}>
        <Skeleton
          width={90}
          height={12}
          radius={6}
        />
      </td>


      <td className={styles.livraisonsTableCell}>
        <Skeleton
          width={84}
          height={25}
          radius={999}
        />
      </td>


      <td className={styles.livraisonsTableCell}>
        <Skeleton
          width={82}
          height={12}
          radius={6}
        />
      </td>


      <td className={styles.livraisonsTableCell}>
        <Skeleton
          width={82}
          height={12}
          radius={6}
        />
      </td>


      <td
        className={[
          styles.livraisonsTableCell,
          styles.livraisonsTableCellActions,
        ].join(" ")}
      >
        <Skeleton
          width={68}
          height={34}
          radius={8}
        />
      </td>
    </tr>
  );
}


/* ==========================================================================
   MOBILE CARD SKELETON
   ========================================================================== */

function MobileCardSkeleton() {
  return (
    <article
      className={styles.livraisonsMobileCard}
      aria-hidden="true"
    >
      <div className={styles.livraisonsMobileCardHeader}>
        <div className={styles.livraisonsMobileReference}>
          <Skeleton
            width={68}
            height={9}
            radius={5}
          />

          <Skeleton
            width={132}
            height={15}
            radius={6}
          />
        </div>


        <Skeleton
          width={86}
          height={26}
          radius={999}
        />
      </div>


      <div className={styles.livraisonsMobilePrimary}>
        <div className={styles.livraisonsMobileCustomer}>
          <Skeleton
            width={136}
            height={13}
            radius={6}
          />

          <Skeleton
            width={100}
            height={9}
            radius={5}
          />
        </div>


        <Skeleton
          width={105}
          height={11}
          radius={5}
        />
      </div>


      <div
        style={{
          display:
            "grid",

          gap:
            12,

          marginTop:
            16,

          paddingTop:
            14,

          borderTop:
            "1px solid #f0f0f3",
        }}
      >
        <Skeleton
          width="100%"
          height={12}
          radius={6}
        />

        <Skeleton
          width="88%"
          height={12}
          radius={6}
        />

        <Skeleton
          width="74%"
          height={12}
          radius={6}
        />
      </div>


      <div className={styles.livraisonsMobileCardFooter}>
        <Skeleton
          width="100%"
          height={40}
          radius={9}
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function LivraisonsLoading() {
  return (
    <div
      className={styles.livraisonsPage}
      aria-busy="true"
      aria-live="polite"
      aria-label="Chargement des livraisons"
    >
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <header className={styles.livraisonsHeader}>
        <div className={styles.livraisonsBreadcrumb}>
          <Skeleton
            width={70}
            height={11}
            radius={5}
          />

          <span aria-hidden="true">
            /
          </span>

          <Skeleton
            width={118}
            height={11}
            radius={5}
          />
        </div>


        <div className={styles.livraisonsHeaderMain}>
          <div className={styles.livraisonsHeaderCopy}>
            <div className={styles.livraisonsHeaderTitleRow}>
              <span
                className={styles.livraisonsHeaderIcon}
                aria-hidden="true"
              >
                <Truck
                  size={22}
                  strokeWidth={1.8}
                />
              </span>


              <Skeleton
                width={172}
                height={31}
                radius={8}
              />
            </div>


            <Skeleton
              width="min(420px, 82vw)"
              height={13}
              radius={6}
            />
          </div>
        </div>
      </header>


      {/* ==================================================================
          KPI
          ================================================================== */}

      <section
        className={styles.livraisonsKpiSection}
        aria-hidden="true"
      >
        <div className={styles.livraisonsKpiGrid}>
          {Array.from(
            {
              length:
                5,
            },
            (
              _value,
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
          FILTERS
          ================================================================== */}

      <section
        className={styles.livraisonsFiltersSection}
        aria-hidden="true"
      >
        <div className={styles.livraisonsFilters}>
          <FilterSkeleton />

          <FilterSkeleton />

          <FilterSkeleton />

          <FilterSkeleton />

          <FilterSkeleton />

          <FilterSkeleton />
        </div>
      </section>


      {/* ==================================================================
          DESKTOP TABLE
          ================================================================== */}

      <section
        className={styles.livraisonsTableSection}
        aria-hidden="true"
      >
        <div className={styles.livraisonsTableCard}>
          <div className={styles.livraisonsTableScroll}>
            <table className={styles.livraisonsTable}>
              <thead className={styles.livraisonsTableHead}>
                <tr>
                  <th
                    className={[
                      styles.livraisonsTableHeaderCell,
                      styles.livraisonsTableHeaderNumber,
                    ].join(" ")}
                  >
                    #
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Référence
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Client
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Commande
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Produits
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Adresse de livraison
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Transporteur
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Statut
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Date d’expédition
                  </th>

                  <th className={styles.livraisonsTableHeaderCell}>
                    Date de livraison
                  </th>

                  <th
                    className={[
                      styles.livraisonsTableHeaderCell,
                      styles.livraisonsTableHeaderActions,
                    ].join(" ")}
                  >
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody className={styles.livraisonsTableBody}>
                {Array.from(
                  {
                    length:
                      6,
                  },
                  (
                    _value,
                    index,
                  ) => (
                    <TableRowSkeleton
                      key={index}
                      index={index}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>


          <div className={styles.livraisonsTableFooter}>
            <Skeleton
              width={180}
              height={11}
              radius={5}
            />


            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  5,
              }}
            >
              {Array.from(
                {
                  length:
                    4,
                },
                (
                  _value,
                  index,
                ) => (
                  <Skeleton
                    key={index}
                    width={32}
                    height={32}
                    radius={8}
                  />
                ),
              )}
            </div>
          </div>
        </div>


        {/* =================================================================
            MOBILE
            ================================================================= */}

        <div className={styles.livraisonsMobileList}>
          {Array.from(
            {
              length:
                4,
            },
            (
              _value,
              index,
            ) => (
              <MobileCardSkeleton
                key={index}
              />
            ),
          )}
        </div>
      </section>


      {/* ==================================================================
          SCREEN READER
          ================================================================== */}

      <span className={styles.livraisonsVisuallyHidden}>
        Chargement des livraisons en cours.
      </span>


      {/* ==================================================================
          LOCAL SKELETON ANIMATION
          ================================================================== */}

      <style>
        {`
          @keyframes livraisonsLoadingPulse {
            0% {
              background-position: 200% 0;
            }

            100% {
              background-position: -200% 0;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [aria-busy="true"] span[aria-hidden="true"] {
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}