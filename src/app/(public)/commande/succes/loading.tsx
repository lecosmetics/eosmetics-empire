import "@/components/public/commande/public-success.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — LOADING SUCCESS
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/(public)/commande/succes/loading.tsx
 *
 * Route :
 *
 * /commande/succes
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que :
 *
 * - page.tsx résout searchParams ;
 * - public-success-query.ts relit PostgreSQL ;
 * - Order est vérifiée ;
 * - OrderItem est relu ;
 * - Payment est relu ;
 * - Shipment est relu ;
 * - Receipt est relu.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce fichier :
 *
 * - reste un Server Component ;
 * - ne lit pas Prisma ;
 * - ne lit pas searchParams ;
 * - ne lit pas localStorage ;
 * - ne lit pas sessionStorage ;
 * - n'utilise aucune fausse donnée ;
 * - n'affiche aucun faux numéro de commande ;
 * - n'affiche aucun faux prix ;
 * - n'affiche aucun faux paiement ;
 * - n'affiche aucun faux reçu ;
 * - ne recrée ni Header ni Footer ;
 * - ne recrée pas PublicMobileBottomNav.
 *
 * Le shell public reste géré par :
 *
 * src/app/(public)/layout.tsx
 *
 * ============================================================================
 */


/* ==========================================================================
   1. SKELETON
   ========================================================================== */

function Skeleton({
  width =
    "100%",
  height =
    16,
  radius =
    999,
}: {
  readonly width?:
    string;

  readonly height?:
    number;

  readonly radius?:
    number;
}) {
  return (
    <span
      className="le-success-loading-skeleton"
      aria-hidden="true"
      style={{
        width,
        height:
          `${height}px`,
        borderRadius:
          `${radius}px`,
      }}
    />
  );
}


/* ==========================================================================
   2. LIGNE INFORMATION
   ========================================================================== */

function LoadingInfoRow() {
  return (
    <div
      className="le-success-loading-info-row"
      aria-hidden="true"
    >
      <Skeleton
        width="32%"
        height={12}
      />

      <Skeleton
        width="38%"
        height={13}
      />
    </div>
  );
}


/* ==========================================================================
   3. CARTE
   ========================================================================== */

function LoadingCard({
  rows =
    4,
}: {
  readonly rows?:
    number;
}) {
  return (
    <section
      className="le-success-card le-success-loading-card"
      aria-hidden="true"
    >
      <div className="le-success-loading-card-header">
        <div className="le-success-loading-card-heading">
          <Skeleton
            width="72px"
            height={9}
          />

          <Skeleton
            width="210px"
            height={23}
            radius={8}
          />
        </div>

        <Skeleton
          width="76px"
          height={30}
        />
      </div>

      <div className="le-success-loading-info-list">
        {Array.from({
          length:
            rows,
        }).map(
          (
            _,
            index,
          ) => (
            <LoadingInfoRow
              key={
                index
              }
            />
          ),
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   4. PRODUITS
   ========================================================================== */

function LoadingProductsCard() {
  return (
    <section
      className="le-success-card le-success-loading-card"
      aria-hidden="true"
    >
      <div className="le-success-loading-card-header">
        <div className="le-success-loading-card-heading">
          <Skeleton
            width="64px"
            height={9}
          />

          <Skeleton
            width="185px"
            height={23}
            radius={8}
          />
        </div>

        <Skeleton
          width="34px"
          height={34}
        />
      </div>

      <div className="le-success-loading-products">
        {[
          1,
          2,
          3,
        ].map(
          (
            item,
          ) => (
            <div
              key={
                item
              }
              className="le-success-loading-product"
            >
              <Skeleton
                width="52px"
                height={52}
                radius={15}
              />

              <div className="le-success-loading-product-content">
                <Skeleton
                  width="68%"
                  height={14}
                  radius={6}
                />

                <div className="le-success-loading-product-meta">
                  <Skeleton
                    width="70px"
                    height={9}
                  />

                  <Skeleton
                    width="62px"
                    height={9}
                  />

                  <Skeleton
                    width="105px"
                    height={9}
                  />
                </div>
              </div>

              <Skeleton
                width="88px"
                height={14}
                radius={6}
              />
            </div>
          ),
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   5. PROGRESSION
   ========================================================================== */

function LoadingProgressCard() {
  return (
    <section
      className="le-success-card le-success-loading-card"
      aria-hidden="true"
    >
      <div className="le-success-loading-card-heading">
        <Skeleton
          width="55px"
          height={9}
        />

        <Skeleton
          width="250px"
          height={23}
          radius={8}
        />
      </div>

      <div className="le-success-loading-progress">
        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (
            item,
          ) => (
            <div
              key={
                item
              }
              className="le-success-loading-progress-row"
            >
              <div className="le-success-loading-progress-marker">
                <Skeleton
                  width="32px"
                  height={32}
                />

                {item <
                5 ? (
                  <span className="le-success-loading-progress-line" />
                ) : null}
              </div>

              <div className="le-success-loading-progress-content">
                <Skeleton
                  width={
                    item ===
                    1
                      ? "205px"
                      : item ===
                          2
                        ? "180px"
                        : "150px"
                  }
                  height={13}
                  radius={6}
                />

                <Skeleton
                  width={
                    item %
                      2 ===
                    0
                      ? "72%"
                      : "82%"
                  }
                  height={10}
                />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   6. RÉSUMÉ FINANCIER
   ========================================================================== */

function LoadingSummaryCard() {
  return (
    <section
      className="le-success-card le-success-summary-card le-success-loading-card"
      aria-hidden="true"
    >
      <div className="le-success-loading-card-heading">
        <Skeleton
          width="90px"
          height={9}
        />

        <Skeleton
          width="205px"
          height={22}
          radius={8}
        />
      </div>

      <div className="le-success-loading-summary">
        <LoadingInfoRow />
        <LoadingInfoRow />
        <LoadingInfoRow />

        <div className="le-success-loading-summary-total">
          <Skeleton
            width="55px"
            height={15}
          />

          <Skeleton
            width="110px"
            height={21}
            radius={7}
          />
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   7. PAGE LOADING
   ========================================================================== */

export default function Loading() {
  return (
    <main
      className="le-success-page le-success-loading-page"
      aria-busy="true"
      aria-live="polite"
      aria-label="Chargement de la commande"
    >
      <span className="le-success-loading-sr-only">
        Chargement des informations de votre commande…
      </span>


      {/* ====================================================================
          HERO
          ==================================================================== */}

      <section
        className="le-success-hero le-success-loading-hero"
        aria-hidden="true"
      >
        <div className="le-success-hero-inner">
          <div className="le-success-loading-hero-icon">
            <Skeleton
              width="100%"
              height={86}
            />
          </div>

          <Skeleton
            width="145px"
            height={10}
          />

          <div className="le-success-loading-title">
            <Skeleton
              width="min(580px, 88vw)"
              height={54}
              radius={12}
            />
          </div>

          <div className="le-success-loading-description">
            <Skeleton
              width="min(610px, 84vw)"
              height={13}
            />

            <Skeleton
              width="min(480px, 70vw)"
              height={13}
            />
          </div>


          {/* ================================================================
              RÉFÉRENCE
              ================================================================ */}

          <div className="le-success-reference-card le-success-loading-reference">
            {[
              "reference",
              "date",
              "total",
              "payment",
            ].map(
              (
                item,
                index,
              ) => (
                <div
                  key={
                    item
                  }
                  className="le-success-loading-reference-item"
                >
                  <Skeleton
                    width={
                      index ===
                      0
                        ? "125px"
                        : index ===
                            1
                          ? "110px"
                          : "95px"
                    }
                    height={9}
                  />

                  <Skeleton
                    width={
                      index ===
                      0
                        ? "155px"
                        : index ===
                            1
                          ? "165px"
                          : "120px"
                    }
                    height={15}
                    radius={6}
                  />
                </div>
              ),
            )}
          </div>
        </div>
      </section>


      {/* ====================================================================
          CONTENU
          ==================================================================== */}

      <section
        className="le-success-content"
        aria-hidden="true"
      >
        <div className="le-success-layout">
          {/* ================================================================
              COLONNE PRINCIPALE
              ================================================================ */}

          <div className="le-success-main-column">
            <LoadingCard
              rows={4}
            />

            <LoadingProgressCard />

            <LoadingProductsCard />
          </div>


          {/* ================================================================
              SIDEBAR
              ================================================================ */}

          <aside className="le-success-side-column">
            <LoadingSummaryCard />

            <LoadingCard
              rows={3}
            />

            <LoadingCard
              rows={3}
            />
          </aside>
        </div>


        {/* ==================================================================
            ACTIONS
            ================================================================== */}

        <div className="le-success-loading-actions">
          <Skeleton
            width="190px"
            height={50}
            radius={14}
          />

          <Skeleton
            width="205px"
            height={50}
            radius={14}
          />
        </div>
      </section>


      {/* ====================================================================
          STYLES SPÉCIFIQUES AU LOADING
          ==================================================================== */}

      <style>
        {`
          .le-success-loading-page {
            min-height: 100vh;
            background: #ffffff;
          }


          .le-success-loading-sr-only {
            position: absolute;

            width: 1px;
            height: 1px;

            padding: 0;
            margin: -1px;

            overflow: hidden;

            clip: rect(
              0,
              0,
              0,
              0
            );

            white-space: nowrap;

            border: 0;
          }


          .le-success-loading-skeleton {
            position: relative;

            display: block;

            max-width: 100%;

            overflow: hidden;

            background:
              #eee9ec;
          }


          .le-success-loading-skeleton::after {
            position: absolute;

            inset: 0;

            background:
              linear-gradient(
                90deg,
                transparent 0%,
                rgb(255 255 255 / 62%) 48%,
                transparent 100%
              );

            transform:
              translateX(-100%);

            animation:
              le-success-loading-shimmer
              1.45s
              ease-in-out
              infinite;

            content: "";
          }


          @keyframes
          le-success-loading-shimmer {

            100% {
              transform:
                translateX(100%);
            }
          }


          .le-success-loading-hero {
            min-height:
              clamp(
                430px,
                58vh,
                670px
              );
          }


          .le-success-loading-hero-icon {
            width: 86px;
            height: 86px;

            margin-bottom: 22px;

            overflow: hidden;

            border-radius: 50%;

            box-shadow:
              0 15px 45px
              rgb(37 19 29 / 7%);
          }


          .le-success-loading-title {
            display: flex;
            justify-content: center;

            width: 100%;

            margin-top: 13px;
          }


          .le-success-loading-description {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 9px;

            width: 100%;

            margin-top: 20px;
          }


          .le-success-loading-reference {
            grid-template-columns:
              repeat(
                4,
                minmax(0, 1fr)
              );

            gap: 0;
          }


          .le-success-loading-reference-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 9px;

            min-width: 0;

            min-height: 70px;

            padding:
              7px
              18px;

            border-right:
              1px solid
              #eee5ea;
          }


          .le-success-loading-reference-item:last-child {
            border-right: 0;
          }


          .le-success-loading-card {
            min-height: 180px;
          }


          .le-success-loading-card-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;

            margin-bottom: 23px;
          }


          .le-success-loading-card-heading {
            display: flex;
            flex-direction: column;
            gap: 8px;

            min-width: 0;
          }


          .le-success-loading-info-list {
            display: flex;
            flex-direction: column;

            width: 100%;
          }


          .le-success-loading-info-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 22px;

            min-height: 43px;

            border-bottom:
              1px solid
              #f2edf0;
          }


          .le-success-loading-info-row:last-child {
            border-bottom: 0;
          }


          .le-success-loading-progress {
            display: flex;
            flex-direction: column;

            margin-top: 24px;
          }


          .le-success-loading-progress-row {
            display: grid;
            grid-template-columns:
              38px
              minmax(0, 1fr);

            gap: 16px;
          }


          .le-success-loading-progress-marker {
            display: flex;
            flex-direction: column;
            align-items: center;
          }


          .le-success-loading-progress-line {
            flex: 1 1 auto;

            width: 2px;
            min-height: 44px;

            background:
              #ece5e9;
          }


          .le-success-loading-progress-content {
            display: flex;
            flex-direction: column;
            gap: 9px;

            padding:
              3px
              0
              27px;
          }


          .le-success-loading-products {
            display: flex;
            flex-direction: column;

            width: 100%;
          }


          .le-success-loading-product {
            display: grid;
            grid-template-columns:
              auto
              minmax(0, 1fr)
              auto;

            align-items: center;

            gap: 16px;

            padding:
              18px
              0;

            border-bottom:
              1px solid
              #f1ebee;
          }


          .le-success-loading-product:first-child {
            padding-top: 0;
          }


          .le-success-loading-product:last-child {
            padding-bottom: 0;

            border-bottom: 0;
          }


          .le-success-loading-product-content {
            display: flex;
            flex-direction: column;
            gap: 10px;

            min-width: 0;
          }


          .le-success-loading-product-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }


          .le-success-loading-summary {
            display: flex;
            flex-direction: column;
          }


          .le-success-loading-summary-total {
            display: flex;
            align-items: center;
            justify-content: space-between;

            gap: 20px;

            margin-top: 8px;
            padding-top: 17px;

            border-top:
              1px solid
              #e3d5dc;
          }


          .le-success-loading-actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;

            gap: 13px;

            width: 100%;
            max-width: 1560px;

            margin:
              36px
              auto
              0;
          }


          @media
          (max-width: 900px) {

            .le-success-loading-reference {
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }


            .le-success-loading-reference-item {
              align-items:
                flex-start;

              border-right:
                0;

              border-bottom:
                1px solid
                #eee5ea;
            }


            .le-success-loading-reference-item:nth-child(odd) {
              border-right:
                1px solid
                #eee5ea;
            }


            .le-success-loading-reference-item:nth-last-child(-n + 2) {
              border-bottom:
                0;
            }
          }


          @media
          (max-width: 680px) {

            .le-success-loading-page {
              min-height:
                100svh;
            }


            .le-success-loading-hero {
              min-height:
                auto;

              padding:
                34px
                15px
                27px;
            }


            .le-success-loading-hero-icon {
              width: 68px;
              height: 68px;

              margin-bottom: 16px;
            }


            .le-success-loading-hero-icon
            .le-success-loading-skeleton {
              height:
                68px !important;
            }


            .le-success-loading-title {
              margin-top: 10px;
            }


            .le-success-loading-title
            .le-success-loading-skeleton {
              height:
                38px !important;
            }


            .le-success-loading-description {
              margin-top: 15px;
            }


            .le-success-loading-reference {
              grid-template-columns:
                minmax(0, 1fr);

              margin-top: 24px;
            }


            .le-success-loading-reference-item {
              align-items:
                flex-start;

              min-height: 62px;

              padding:
                13px
                14px;

              border-right:
                0 !important;

              border-bottom:
                1px solid
                #eee5ea !important;
            }


            .le-success-loading-reference-item:last-child {
              border-bottom:
                0 !important;
            }


            .le-success-loading-card {
              min-height:
                160px;
            }


            .le-success-loading-card-header {
              gap: 12px;

              margin-bottom: 18px;
            }


            .le-success-loading-info-row {
              min-height: 40px;

              gap: 13px;
            }


            .le-success-loading-product {
              grid-template-columns:
                auto
                minmax(0, 1fr);

              align-items:
                flex-start;

              gap: 11px;

              padding:
                15px
                0;
            }


            .le-success-loading-product >
            .le-success-loading-skeleton:last-child {
              grid-column:
                2;
            }


            .le-success-loading-progress-row {
              grid-template-columns:
                34px
                minmax(0, 1fr);

              gap: 11px;
            }


            .le-success-loading-actions {
              display: grid;

              grid-template-columns:
                minmax(0, 1fr);

              gap: 9px;

              margin-top: 19px;
            }


            .le-success-loading-actions
            .le-success-loading-skeleton {
              width:
                100% !important;
            }
          }


          @media
          (prefers-reduced-motion: reduce) {

            .le-success-loading-skeleton::after {
              animation:
                none;
            }
          }
        `}
      </style>
    </main>
  );
}