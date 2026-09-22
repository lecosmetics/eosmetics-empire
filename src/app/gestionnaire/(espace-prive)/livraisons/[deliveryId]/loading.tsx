import type {
  CSSProperties,
} from "react";

import {
  ArrowLeft,
  Box,
  CircleDollarSign,
  ClipboardList,
  MapPin,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import styles from "../livraisons.module.css";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — DÉTAIL LIVRAISON — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/livraisons/[deliveryId]/loading.tsx
 *
 * RESPONSABILITÉS :
 *
 * - afficher un état de chargement propre de la fiche livraison ;
 * - conserver la structure visuelle de LivraisonDetailView ;
 * - utiliser toute la largeur disponible du Main Gestionnaire ;
 * - limiter les déplacements de mise en page pendant le chargement ;
 * - ne jamais afficher de fausses données métier.
 *
 * CE FICHIER NE :
 *
 * - ne fait aucune requête Prisma ;
 * - ne lit aucune session ;
 * - ne crée aucun Shipment fictif ;
 * - ne crée aucune commande fictive ;
 * - ne crée aucune cliente fictive ;
 * - ne crée aucun paiement fictif ;
 * - ne recrée pas le GestionnaireShell ;
 * - ne recrée pas le Header global ;
 * - ne crée aucun <main>.
 *
 * ============================================================================
 */


/* ==========================================================================
   SKELETON STYLE
   ========================================================================== */

const skeletonBaseStyle:
  CSSProperties = {
  display:
    "block",

  position:
    "relative",

  overflow:
    "hidden",

  flexShrink:
    0,

  background:
    "linear-gradient(90deg, #f0f0f3 0%, #f8f8fa 48%, #f0f0f3 100%)",

  backgroundSize:
    "220% 100%",

  animation:
    "livraisonDetailLoadingShimmer 1.35s ease-in-out infinite",
};


/* ==========================================================================
   SKELETON
   ========================================================================== */

function Skeleton({
  width,
  height,
  radius = 7,
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

        width,

        height,

        borderRadius:
          radius,
      }}
    />
  );
}


/* ==========================================================================
   SUMMARY CARD
   ========================================================================== */

function SummaryCardSkeleton({
  icon,
}: {
  readonly icon:
    React.ReactNode;
}) {
  return (
    <article
      className={styles.livraisonDetailSummaryCard}
      aria-hidden="true"
    >
      <span className={styles.livraisonDetailSummaryIcon}>
        {icon}
      </span>


      <div>
        <Skeleton
          width={72}
          height={10}
          radius={5}
        />


        <Skeleton
          width={112}
          height={14}
          radius={6}
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   CARD HEADER
   ========================================================================== */

function CardHeaderSkeleton({
  icon,
  titleWidth = 135,
  withAction = false,
}: {
  readonly icon:
    React.ReactNode;

  readonly titleWidth?:
    number;

  readonly withAction?:
    boolean;
}) {
  return (
    <div
      className={styles.livraisonDetailCardHeader}
      aria-hidden="true"
    >
      <div>
        <span className={styles.livraisonDetailCardIcon}>
          {icon}
        </span>


        <div>
          <Skeleton
            width={titleWidth}
            height={14}
            radius={6}
          />


          <div
            style={{
              marginTop:
                6,
            }}
          >
            <Skeleton
              width={92}
              height={9}
              radius={5}
            />
          </div>
        </div>
      </div>


      {withAction ? (
        <Skeleton
          width={112}
          height={30}
          radius={8}
        />
      ) : null}
    </div>
  );
}


/* ==========================================================================
   INFO ROW
   ========================================================================== */

function InfoRowSkeleton({
  labelWidth = 95,
  valueWidth = 125,
}: {
  readonly labelWidth?:
    number;

  readonly valueWidth?:
    number;
}) {
  return (
    <div
      className={styles.livraisonDetailInfoRow}
      aria-hidden="true"
    >
      <dt>
        <Skeleton
          width={labelWidth}
          height={10}
          radius={5}
        />
      </dt>


      <dd
        style={{
          display:
            "flex",

          justifyContent:
            "flex-end",
        }}
      >
        <Skeleton
          width={valueWidth}
          height={11}
          radius={5}
        />
      </dd>
    </div>
  );
}


/* ==========================================================================
   INFO CARD
   ========================================================================== */

function InformationCardSkeleton({
  icon,
  titleWidth,
  rows = 6,
}: {
  readonly icon:
    React.ReactNode;

  readonly titleWidth:
    number;

  readonly rows?:
    number;
}) {
  return (
    <section
      className={styles.livraisonDetailCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton
        icon={icon}
        titleWidth={titleWidth}
      />


      <dl className={styles.livraisonDetailInfoList}>
        {Array.from(
          {
            length:
              rows,
          },
          (
            _value,
            index,
          ) => (
            <InfoRowSkeleton
              key={index}
              labelWidth={
                76 +
                (index % 3) *
                  18
              }
              valueWidth={
                100 +
                (index % 4) *
                  18
              }
            />
          ),
        )}
      </dl>
    </section>
  );
}


/* ==========================================================================
   CUSTOMER CARD
   ========================================================================== */

function CustomerCardSkeleton() {
  return (
    <section
      className={styles.livraisonDetailCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton
        icon={
          <UserRound
            size={19}
            strokeWidth={1.8}
          />
        }
        titleWidth={72}
      />


      <div className={styles.livraisonDetailCustomer}>
        <div className={styles.livraisonDetailCustomerIdentity}>
          <span
            className={styles.livraisonDetailCustomerAvatar}
            style={{
              background:
                "#f4f4f6",

              borderColor:
                "#ececf0",
            }}
          >
            <Skeleton
              width={18}
              height={18}
              radius={999}
            />
          </span>


          <div
            style={{
              width:
                "100%",

              maxWidth:
                230,
            }}
          >
            <Skeleton
              width="72%"
              height={13}
              radius={6}
            />


            <div
              style={{
                marginTop:
                  6,
              }}
            >
              <Skeleton
                width="48%"
                height={9}
                radius={5}
              />
            </div>
          </div>
        </div>


        <dl className={styles.livraisonDetailInfoList}>
          <InfoRowSkeleton
            labelWidth={58}
            valueWidth={104}
          />

          <InfoRowSkeleton
            labelWidth={45}
            valueWidth={125}
          />

          <InfoRowSkeleton
            labelWidth={82}
            valueWidth={115}
          />

          <InfoRowSkeleton
            labelWidth={62}
            valueWidth={165}
          />
        </dl>
      </div>
    </section>
  );
}


/* ==========================================================================
   PRODUCTS
   ========================================================================== */

function ProductsSkeleton() {
  return (
    <section
      className={styles.livraisonDetailCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton
        icon={
          <Box
            size={19}
            strokeWidth={1.8}
          />
        }
        titleWidth={76}
      />


      <div className={styles.livraisonDetailProductsScroll}>
        <table className={styles.livraisonDetailProductsTable}>
          <thead>
            <tr>
              <th>
                Produit
              </th>

              <th>
                SKU
              </th>

              <th>
                Quantité
              </th>

              <th>
                Prix unitaire
              </th>

              <th>
                Total
              </th>
            </tr>
          </thead>


          <tbody>
            {Array.from(
              {
                length:
                  3,
              },
              (
                _value,
                index,
              ) => (
                <tr key={index}>
                  <td>
                    <div className={styles.livraisonDetailProductIdentity}>
                      <span
                        className={styles.livraisonDetailProductIcon}
                        style={{
                          background:
                            "#f4f4f6",
                        }}
                      >
                        <Skeleton
                          width={17}
                          height={17}
                          radius={5}
                        />
                      </span>


                      <Skeleton
                        width={
                          index ===
                          1
                            ? 145
                            : 118
                        }
                        height={12}
                        radius={6}
                      />
                    </div>
                  </td>


                  <td>
                    <Skeleton
                      width={72}
                      height={11}
                      radius={5}
                    />
                  </td>


                  <td>
                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "flex-end",
                      }}
                    >
                      <Skeleton
                        width={25}
                        height={11}
                        radius={5}
                      />
                    </div>
                  </td>


                  <td>
                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "flex-end",
                      }}
                    >
                      <Skeleton
                        width={85}
                        height={11}
                        radius={5}
                      />
                    </div>
                  </td>


                  <td>
                    <div
                      style={{
                        display:
                          "flex",

                        justifyContent:
                          "flex-end",
                      }}
                    >
                      <Skeleton
                        width={92}
                        height={11}
                        radius={5}
                      />
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


/* ==========================================================================
   PAYMENT
   ========================================================================== */

function PaymentSkeleton() {
  return (
    <section
      className={styles.livraisonDetailCard}
      aria-hidden="true"
    >
      <CardHeaderSkeleton
        icon={
          <CircleDollarSign
            size={19}
            strokeWidth={1.8}
          />
        }
        titleWidth={78}
      />


      <div className={styles.livraisonDetailPaymentsList}>
        <article className={styles.livraisonDetailPayment}>
          <div className={styles.livraisonDetailPaymentMain}>
            <span
              className={styles.livraisonDetailPaymentIcon}
              style={{
                background:
                  "#f4f4f6",
              }}
            >
              <Skeleton
                width={18}
                height={18}
                radius={5}
              />
            </span>


            <div className={styles.livraisonDetailPaymentCopy}>
              <Skeleton
                width={118}
                height={12}
                radius={6}
              />


              <Skeleton
                width={94}
                height={9}
                radius={5}
              />
            </div>
          </div>


          <div className={styles.livraisonDetailPaymentMeta}>
            <Skeleton
              width={92}
              height={14}
              radius={6}
            />


            <Skeleton
              width={62}
              height={23}
              radius={999}
            />
          </div>


          <dl className={styles.livraisonDetailPaymentDetails}>
            {Array.from(
              {
                length:
                  3,
              },
              (
                _value,
                index,
              ) => (
                <div key={index}>
                  <dt>
                    <Skeleton
                      width={
                        62 +
                        index *
                          14
                      }
                      height={9}
                      radius={5}
                    />
                  </dt>


                  <dd>
                    <Skeleton
                      width={
                        82 +
                        index *
                          15
                      }
                      height={9}
                      radius={5}
                    />
                  </dd>
                </div>
              ),
            )}
          </dl>
        </article>
      </div>
    </section>
  );
}


/* ==========================================================================
   ACTIONS
   ========================================================================== */

function ActionsSkeleton() {
  return (
    <section
      className={styles.livraisonDetailActions}
      aria-hidden="true"
    >
      <div className={styles.livraisonDetailActionsHeader}>
        <div className={styles.livraisonDetailActionsHeading}>
          <span className={styles.livraisonDetailActionsIcon}>
            <ShieldCheck
              size={20}
              strokeWidth={1.8}
            />
          </span>


          <div>
            <Skeleton
              width={168}
              height={14}
              radius={6}
            />


            <div
              style={{
                marginTop:
                  7,
              }}
            >
              <Skeleton
                width="min(390px, 65vw)"
                height={10}
                radius={5}
              />
            </div>
          </div>
        </div>


        <Skeleton
          width={138}
          height={31}
          radius={8}
        />
      </div>


      <div className={styles.livraisonDetailActionsBody}>
        <div className={styles.livraisonDetailActionsNotice}>
          <Skeleton
            width={18}
            height={18}
            radius={5}
          />


          <Skeleton
            width="min(360px, 58vw)"
            height={10}
            radius={5}
          />
        </div>


        <div className={styles.livraisonDetailActionsButtons}>
          <Skeleton
            width={154}
            height={40}
            radius={9}
          />


          <Skeleton
            width={172}
            height={40}
            radius={9}
          />
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function LivraisonDetailLoading() {
  return (
    <div
      className={styles.livraisonDetail}
      aria-busy="true"
      aria-live="polite"
      aria-label="Chargement de la livraison"
    >
      {/* ==================================================================
          HEADER
          ================================================================== */}

      <header className={styles.livraisonDetailHeader}>
        <div
          className={styles.livraisonDetailBreadcrumb}
          aria-hidden="true"
        >
          <Skeleton
            width={68}
            height={10}
            radius={5}
          />

          <span>
            /
          </span>

          <Skeleton
            width={126}
            height={10}
            radius={5}
          />
        </div>


        <div className={styles.livraisonDetailHeaderMain}>
          <div className={styles.livraisonDetailHeaderCopy}>
            <div
              className={styles.livraisonDetailBackLink}
              aria-hidden="true"
            >
              <ArrowLeft
                size={17}
                strokeWidth={1.9}
              />

              <Skeleton
                width={126}
                height={10}
                radius={5}
              />
            </div>


            <div className={styles.livraisonDetailTitleRow}>
              <Skeleton
                width="min(330px, 70vw)"
                height={32}
                radius={8}
              />


              <Skeleton
                width={94}
                height={27}
                radius={999}
              />
            </div>


            <Skeleton
              width="min(480px, 82vw)"
              height={12}
              radius={6}
            />
          </div>
        </div>
      </header>


      {/* ==================================================================
          SUMMARY
          ================================================================== */}

      <section
        className={styles.livraisonDetailSummaryGrid}
        aria-hidden="true"
      >
        <SummaryCardSkeleton
          icon={
            <Truck
              size={20}
              strokeWidth={1.8}
            />
          }
        />


        <SummaryCardSkeleton
          icon={
            <ClipboardList
              size={20}
              strokeWidth={1.8}
            />
          }
        />


        <SummaryCardSkeleton
          icon={
            <Box
              size={20}
              strokeWidth={1.8}
            />
          }
        />


        <SummaryCardSkeleton
          icon={
            <Truck
              size={20}
              strokeWidth={1.8}
            />
          }
        />
      </section>


      {/* ==================================================================
          DELIVERY + CUSTOMER
          ================================================================== */}

      <div className={styles.livraisonDetailTwoColumns}>
        <InformationCardSkeleton
          icon={
            <Truck
              size={19}
              strokeWidth={1.8}
            />
          }
          titleWidth={158}
          rows={9}
        />


        <CustomerCardSkeleton />
      </div>


      {/* ==================================================================
          ADDRESS + ORDER
          ================================================================== */}

      <div className={styles.livraisonDetailTwoColumns}>
        <InformationCardSkeleton
          icon={
            <MapPin
              size={19}
              strokeWidth={1.8}
            />
          }
          titleWidth={148}
          rows={6}
        />


        <section
          className={styles.livraisonDetailCard}
          aria-hidden="true"
        >
          <CardHeaderSkeleton
            icon={
              <ClipboardList
                size={19}
                strokeWidth={1.8}
              />
            }
            titleWidth={82}
            withAction
          />


          <dl className={styles.livraisonDetailInfoList}>
            <InfoRowSkeleton
              labelWidth={72}
              valueWidth={118}
            />

            <InfoRowSkeleton
              labelWidth={104}
              valueWidth={84}
            />

            <InfoRowSkeleton
              labelWidth={68}
              valueWidth={112}
            />

            <InfoRowSkeleton
              labelWidth={64}
              valueWidth={126}
            />

            <InfoRowSkeleton
              labelWidth={86}
              valueWidth={126}
            />

            <InfoRowSkeleton
              labelWidth={62}
              valueWidth={126}
            />
          </dl>
        </section>
      </div>


      {/* ==================================================================
          PRODUCTS
          ================================================================== */}

      <ProductsSkeleton />


      {/* ==================================================================
          PAYMENT
          ================================================================== */}

      <PaymentSkeleton />


      {/* ==================================================================
          ACTIONS
          ================================================================== */}

      <ActionsSkeleton />


      {/* ==================================================================
          SCREEN READER
          ================================================================== */}

      <span className={styles.livraisonsVisuallyHidden}>
        Chargement des informations de la livraison en cours.
      </span>


      {/* ==================================================================
          ANIMATION
          ================================================================== */}

      <style>
        {`
          @keyframes livraisonDetailLoadingShimmer {
            0% {
              background-position: 220% 0;
            }

            100% {
              background-position: -220% 0;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .livraison-detail-loading-skeleton {
              animation: none !important;
            }
          }
        `}
      </style>
    </div>
  );
}