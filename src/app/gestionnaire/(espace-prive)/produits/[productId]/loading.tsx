import styles from "./product-detail.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * GESTIONNAIRE â€” FICHE PRODUIT
 * Ã‰TAT DE CHARGEMENT
 * ============================================================================
 *
 * Route :
 *
 * /gestionnaire/produits/[productId]
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/produits/[productId]/loading.tsx
 *
 * RESPONSABILITÃ‰S :
 *
 * - afficher immÃ©diatement un skeleton professionnel ;
 * - reproduire la gÃ©omÃ©trie de la page finale ;
 * - utiliser toute la largeur disponible du shell Gestionnaire ;
 * - Ã©viter les gros changements de mise en page ;
 * - fonctionner sur desktop, tablette et mobile ;
 * - ne lancer aucune requÃªte ;
 * - ne lire aucune session ;
 * - ne contenir aucune donnÃ©e mÃ©tier ;
 * - ne nÃ©cessiter aucun Client Component.
 *
 * STRUCTURE :
 *
 * Header produit
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ Galerie                     â”‚ QR                â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ Informations                â”‚ Prix / stock      â”‚
 * â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
 * â”‚ Actions                                         â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *
 * ============================================================================
 */


/* ==========================================================================
   SKELETON
   ========================================================================== */

interface SkeletonProps {
  className?:
    string;
}


function Skeleton({
  className =
    "",
}: SkeletonProps) {
  return (
    <span
      className={[
        "productDetailRouteLoadingSkeleton",
        className,
      ]
        .filter(
          Boolean,
        )
        .join(
          " ",
        )}
      aria-hidden="true"
    />
  );
}


/* ==========================================================================
   HEADER
   ========================================================================== */

function ProductHeaderLoading() {
  return (
    <section
      className="productDetailHeader productDetailRouteLoadingHeader"
      aria-hidden="true"
    >
      {/* =================================================================
          TOP
          ================================================================= */}

      <div className="productDetailHeaderTop">
        <Skeleton className="productDetailRouteLoadingBack" />

        <Skeleton className="productDetailRouteLoadingReference" />
      </div>


      {/* =================================================================
          HERO
          ================================================================= */}

      <div className="productDetailHeaderHero">
        <div className="productDetailHeaderIdentity">
          <Skeleton className="productDetailRouteLoadingHeaderIcon" />

          <div className="productDetailHeaderContent">
            <Skeleton className="productDetailRouteLoadingEyebrow" />

            <Skeleton className="productDetailRouteLoadingTitle" />

            <div className="productDetailRouteLoadingBadges">
              <Skeleton className="productDetailRouteLoadingBadge" />

              <Skeleton className="productDetailRouteLoadingBadgeSmall" />

              <Skeleton className="productDetailRouteLoadingBadge" />
            </div>
          </div>
        </div>


        <div className="productDetailHeaderActions">
          <Skeleton className="productDetailRouteLoadingAction" />

          <Skeleton className="productDetailRouteLoadingActionPrimary" />
        </div>
      </div>


      {/* =================================================================
          INFORMATIONS RAPIDES
          ================================================================= */}

      <div className="productDetailHeaderInfoGrid">
        {[
          "store",
          "location",
          "category",
          "sku",
        ].map(
          (
            item,
          ) => (
            <div
              key={item}
              className="productDetailHeaderInfoItem"
            >
              <Skeleton className="productDetailRouteLoadingInfoIcon" />

              <div className="productDetailHeaderInfoContent">
                <Skeleton className="productDetailRouteLoadingInfoLabel" />

                <Skeleton className="productDetailRouteLoadingInfoValue" />
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   SECTION HEADER
   ========================================================================== */

interface SectionHeaderLoadingProps {
  titleWidth?:
    string;

  withBadge?:
    boolean;
}


function SectionHeaderLoading({
  titleWidth =
    "150px",

  withBadge =
    false,
}: SectionHeaderLoadingProps) {
  return (
    <div className="productDetailRouteLoadingSectionHeader">
      <div className="productDetailRouteLoadingSectionHeaderMain">
        <Skeleton className="productDetailRouteLoadingSectionIcon" />

        <div className="productDetailRouteLoadingSectionHeaderText">
          <Skeleton
            className="productDetailRouteLoadingSectionTitle"
          />

          <Skeleton
            className="productDetailRouteLoadingSectionSubtitle"
          />
        </div>
      </div>

      {withBadge ? (
        <Skeleton
          className="productDetailRouteLoadingSectionBadge"
        />
      ) : null}

      <style>{`
        .productDetailRouteLoadingSectionTitle {
          width: ${titleWidth};
        }
      `}</style>
    </div>
  );
}


/* ==========================================================================
   GALERIE
   ========================================================================== */

function ProductGalleryLoading() {
  return (
    <section
      className="productDetailGallery"
      aria-hidden="true"
    >
      <SectionHeaderLoading
        titleWidth="132px"
        withBadge
      />


      <div className="productDetailRouteLoadingGalleryBody">
        {/* IMAGE PRINCIPALE */}

        <Skeleton className="productDetailRouteLoadingMainImage" />


        {/* CAPTION */}

        <Skeleton className="productDetailRouteLoadingCaption" />


        {/* MINIATURES */}

        <div className="productDetailRouteLoadingGalleryHeading">
          <Skeleton className="productDetailRouteLoadingGalleryHeadingTitle" />

          <Skeleton className="productDetailRouteLoadingGalleryCount" />
        </div>


        <div className="productDetailRouteLoadingThumbnails">
          {[
            1,
            2,
            3,
            4,
          ].map(
            (
              item,
            ) => (
              <div
                key={item}
                className="productDetailRouteLoadingThumbnailItem"
              >
                <Skeleton className="productDetailRouteLoadingThumbnail" />

                <Skeleton className="productDetailRouteLoadingThumbnailText" />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   QR
   ========================================================================== */

function ProductQrLoading() {
  return (
    <section
      className="productDetailQr"
      aria-hidden="true"
    >
      <SectionHeaderLoading
        titleWidth="126px"
        withBadge
      />


      <div className="productDetailRouteLoadingQrBody">
        {/* QR PRINCIPAL */}

        <div className="productDetailRouteLoadingQrPreview">
          <Skeleton className="productDetailRouteLoadingQrSquare" />

          <div className="productDetailRouteLoadingQrPreviewContent">
            <Skeleton className="productDetailRouteLoadingQrLabel" />

            <Skeleton className="productDetailRouteLoadingQrToken" />

            <Skeleton className="productDetailRouteLoadingQrText" />

            <Skeleton className="productDetailRouteLoadingQrTextShort" />
          </div>
        </div>


        {/* INFORMATIONS */}

        <div className="productDetailRouteLoadingQrInformationGrid">
          {[
            1,
            2,
            3,
            4,
          ].map(
            (
              item,
            ) => (
              <div
                key={item}
                className="productDetailRouteLoadingQrInformation"
              >
                <Skeleton className="productDetailRouteLoadingQrInformationIcon" />

                <div className="productDetailRouteLoadingQrInformationContent">
                  <Skeleton className="productDetailRouteLoadingQrInformationLabel" />

                  <Skeleton className="productDetailRouteLoadingQrInformationValue" />
                </div>
              </div>
            ),
          )}
        </div>


        {/* EXPLICATION */}

        <div className="productDetailRouteLoadingQrNotice">
          <Skeleton className="productDetailRouteLoadingNoticeIcon" />

          <div className="productDetailRouteLoadingNoticeContent">
            <Skeleton className="productDetailRouteLoadingNoticeTitle" />

            <Skeleton className="productDetailRouteLoadingNoticeText" />

            <Skeleton className="productDetailRouteLoadingNoticeTextShort" />
          </div>
        </div>


        {/* ACTIONS */}

        <div className="productDetailRouteLoadingQrActions">
          <Skeleton className="productDetailRouteLoadingQrButton" />

          <Skeleton className="productDetailRouteLoadingQrButton" />
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   INFORMATIONS PRODUIT
   ========================================================================== */

function ProductOverviewLoading() {
  return (
    <section
      className="productDetailOverview"
      aria-hidden="true"
    >
      <SectionHeaderLoading
        titleWidth="178px"
      />


      {/* =================================================================
          DESCRIPTION
          ================================================================= */}

      <div className="productDetailRouteLoadingDescription">
        <div className="productDetailRouteLoadingDescriptionHeader">
          <Skeleton className="productDetailRouteLoadingDescriptionIcon" />

          <Skeleton className="productDetailRouteLoadingDescriptionTitle" />
        </div>

        <Skeleton className="productDetailRouteLoadingDescriptionLine" />

        <Skeleton className="productDetailRouteLoadingDescriptionLine" />

        <Skeleton className="productDetailRouteLoadingDescriptionLineMedium" />

        <Skeleton className="productDetailRouteLoadingDescriptionLineShort" />
      </div>


      {/* =================================================================
          GRID INFOS
          ================================================================= */}

      <div className="productDetailRouteLoadingOverviewGrid">
        {[
          "category",
          "brand",
          "sku",
          "origin",
          "status",
          "created",
          "updated",
          "unit",
        ].map(
          (
            item,
            index,
          ) => (
            <div
              key={item}
              className="productDetailRouteLoadingOverviewItem"
            >
              <Skeleton className="productDetailRouteLoadingOverviewIcon" />

              <div className="productDetailRouteLoadingOverviewContent">
                <Skeleton className="productDetailRouteLoadingOverviewLabel" />

                <Skeleton
                  className={
                    index % 3 ===
                    0
                      ? "productDetailRouteLoadingOverviewValueShort"
                      : "productDetailRouteLoadingOverviewValue"
                  }
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
   PRIX / STOCK
   ========================================================================== */

function ProductPricingLoading() {
  return (
    <section
      className="productDetailPricing"
      aria-hidden="true"
    >
      <SectionHeaderLoading
        titleWidth="118px"
        withBadge
      />


      <div className="productDetailRouteLoadingPricingBody">
        {/* =================================================================
            PRIX PRINCIPAL
            ================================================================= */}

        <div className="productDetailRouteLoadingPriceHero">
          <Skeleton className="productDetailRouteLoadingPriceHeroIcon" />

          <div className="productDetailRouteLoadingPriceHeroContent">
            <Skeleton className="productDetailRouteLoadingPriceLabel" />

            <Skeleton className="productDetailRouteLoadingPriceValue" />

            <Skeleton className="productDetailRouteLoadingPriceMeta" />
          </div>
        </div>


        {/* =================================================================
            MÃ‰TRIQUES
            ================================================================= */}

        <div className="productDetailRouteLoadingPricingMetrics">
          {[
            "stock",
            "threshold",
            "currency",
            "availability",
          ].map(
            (
              item,
            ) => (
              <div
                key={item}
                className="productDetailRouteLoadingPricingMetric"
              >
                <Skeleton className="productDetailRouteLoadingMetricIcon" />

                <div className="productDetailRouteLoadingMetricContent">
                  <Skeleton className="productDetailRouteLoadingMetricLabel" />

                  <Skeleton className="productDetailRouteLoadingMetricValue" />
                </div>
              </div>
            ),
          )}
        </div>


        {/* =================================================================
            INFORMATION
            ================================================================= */}

        <div className="productDetailRouteLoadingPricingNotice">
          <Skeleton className="productDetailRouteLoadingNoticeIcon" />

          <div className="productDetailRouteLoadingNoticeContent">
            <Skeleton className="productDetailRouteLoadingNoticeTitle" />

            <Skeleton className="productDetailRouteLoadingNoticeText" />

            <Skeleton className="productDetailRouteLoadingNoticeTextShort" />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   ACTIONS
   ========================================================================== */

function ProductActionsLoading() {
  return (
    <section
      className="productDetailActions"
      aria-hidden="true"
    >
      <SectionHeaderLoading
        titleWidth="156px"
      />


      <div className="productDetailRouteLoadingActionsBody">
        {/* =================================================================
            ACTION CARDS
            ================================================================= */}

        <div className="productDetailRouteLoadingActionsGrid">
          {[
            "products",
            "edit",
            "qr",
            "print",
          ].map(
            (
              item,
            ) => (
              <div
                key={item}
                className="productDetailRouteLoadingActionCard"
              >
                <Skeleton className="productDetailRouteLoadingActionCardIcon" />

                <div className="productDetailRouteLoadingActionCardContent">
                  <Skeleton className="productDetailRouteLoadingActionCardTitle" />

                  <Skeleton className="productDetailRouteLoadingActionCardText" />

                  <Skeleton className="productDetailRouteLoadingActionCardTextShort" />
                </div>

                <Skeleton className="productDetailRouteLoadingActionCardArrow" />
              </div>
            ),
          )}
        </div>


        {/* =================================================================
            SÃ‰CURITÃ‰
            ================================================================= */}

        <div className="productDetailRouteLoadingSecurity">
          <Skeleton className="productDetailRouteLoadingSecurityIcon" />

          <div className="productDetailRouteLoadingSecurityContent">
            <Skeleton className="productDetailRouteLoadingSecurityTitle" />

            <Skeleton className="productDetailRouteLoadingSecurityText" />

            <Skeleton className="productDetailRouteLoadingSecurityTextShort" />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function ProductDetailLoading() {
  return (
    <>
      {/* ===================================================================
          STYLES DU SKELETON
          -------------------------------------------------------------------
          Les classes de layout principales viennent du CSS Module rÃ©el :
          - page
          - primaryGrid
          - secondaryGrid
          - galleryArea
          - qrArea
          - overviewArea
          - pricingArea
          - actionsArea

          Les classes productDetailRouteLoading* sont volontairement locales
          Ã  cet Ã©tat de chargement afin de ne pas obliger Ã  modifier le CSS
          mÃ©tier de la fiche.
          =================================================================== */}

      <style>{`
        @keyframes productDetailRouteLoadingPulse {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        .productDetailRouteLoadingSkeleton {
          display: block;
          flex: 0 0 auto;
          max-width: 100%;
          overflow: hidden;
          border-radius: 7px;
          background:
            linear-gradient(
              90deg,
              #eeeeef 20%,
              #fafafa 50%,
              #eeeeef 80%
            );
          background-size: 220% 100%;
          animation:
            productDetailRouteLoadingPulse
            1.35s
            ease-in-out
            infinite;
        }

        /* ================================================================
           HEADER
           ================================================================ */

        .productDetailRouteLoadingHeader {
          pointer-events: none;
        }

        .productDetailRouteLoadingBack {
          width: 118px;
          height: 38px;
          border-radius: 10px;
        }

        .productDetailRouteLoadingReference {
          width: min(220px, 34%);
          height: 34px;
          border-radius: 9px;
        }

        .productDetailRouteLoadingHeaderIcon {
          width: 56px;
          height: 56px;
          border-radius: 15px;
        }

        .productDetailRouteLoadingEyebrow {
          width: 92px;
          height: 9px;
        }

        .productDetailRouteLoadingTitle {
          width: min(430px, 76%);
          height: 29px;
          margin-top: 8px;
          border-radius: 9px;
        }

        .productDetailRouteLoadingBadges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }

        .productDetailRouteLoadingBadge {
          width: 88px;
          height: 27px;
          border-radius: 999px;
        }

        .productDetailRouteLoadingBadgeSmall {
          width: 68px;
          height: 27px;
          border-radius: 999px;
        }

        .productDetailRouteLoadingAction,
        .productDetailRouteLoadingActionPrimary {
          width: 126px;
          height: 40px;
          border-radius: 10px;
        }

        .productDetailRouteLoadingActionPrimary {
          width: 148px;
        }

        .productDetailRouteLoadingInfoIcon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
        }

        .productDetailRouteLoadingInfoLabel {
          width: 52px;
          height: 7px;
        }

        .productDetailRouteLoadingInfoValue {
          width: min(130px, 88%);
          height: 10px;
        }

        /* ================================================================
           SECTION HEADER
           ================================================================ */

        .productDetailRouteLoadingSectionHeader {
          display: flex;
          min-width: 0;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 17px 18px;
          border-bottom: 1px solid #eeeef1;
        }

        .productDetailRouteLoadingSectionHeaderMain {
          display: flex;
          min-width: 0;
          flex: 1 1 auto;
          align-items: center;
          gap: 10px;
        }

        .productDetailRouteLoadingSectionIcon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
        }

        .productDetailRouteLoadingSectionHeaderText {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingSectionTitle {
          height: 13px;
        }

        .productDetailRouteLoadingSectionSubtitle {
          width: min(290px, 74%);
          height: 9px;
          margin-top: 7px;
        }

        .productDetailRouteLoadingSectionBadge {
          width: 66px;
          height: 27px;
          border-radius: 999px;
        }

        /* ================================================================
           GALERIE
           ================================================================ */

        .productDetailRouteLoadingGalleryBody {
          padding: 18px;
        }

        .productDetailRouteLoadingMainImage {
          width: 100%;
          height: clamp(300px, 31vw, 430px);
          border-radius: 14px;
        }

        .productDetailRouteLoadingCaption {
          width: min(320px, 66%);
          height: 9px;
          margin-top: 9px;
        }

        .productDetailRouteLoadingGalleryHeading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 17px;
        }

        .productDetailRouteLoadingGalleryHeadingTitle {
          width: 114px;
          height: 11px;
        }

        .productDetailRouteLoadingGalleryCount {
          width: 29px;
          height: 23px;
          border-radius: 999px;
        }

        .productDetailRouteLoadingThumbnails {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 10px;
        }

        .productDetailRouteLoadingThumbnailItem {
          min-width: 0;
        }

        .productDetailRouteLoadingThumbnail {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 10px;
        }

        .productDetailRouteLoadingThumbnailText {
          width: 72%;
          height: 7px;
          margin-top: 7px;
        }

        /* ================================================================
           QR
           ================================================================ */

        .productDetailRouteLoadingQrBody {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 18px;
        }

        .productDetailRouteLoadingQrPreview {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 15px;
          padding: 14px;
          border: 1px solid #ebebee;
          border-radius: 12px;
          background: #fafafa;
        }

        .productDetailRouteLoadingQrSquare {
          width: 118px;
          height: 118px;
          border-radius: 10px;
        }

        .productDetailRouteLoadingQrPreviewContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingQrLabel {
          width: 72px;
          height: 7px;
        }

        .productDetailRouteLoadingQrToken {
          width: min(190px, 84%);
          height: 14px;
          margin-top: 8px;
        }

        .productDetailRouteLoadingQrText {
          width: 100%;
          height: 8px;
          margin-top: 13px;
        }

        .productDetailRouteLoadingQrTextShort {
          width: 68%;
          height: 8px;
          margin-top: 6px;
        }

        .productDetailRouteLoadingQrInformationGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .productDetailRouteLoadingQrInformation {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 8px;
          padding: 10px;
          border: 1px solid #ebebee;
          border-radius: 9px;
        }

        .productDetailRouteLoadingQrInformationIcon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
        }

        .productDetailRouteLoadingQrInformationContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingQrInformationLabel {
          width: 52px;
          height: 7px;
        }

        .productDetailRouteLoadingQrInformationValue {
          width: 82%;
          height: 9px;
          margin-top: 6px;
        }

        .productDetailRouteLoadingQrNotice,
        .productDetailRouteLoadingPricingNotice,
        .productDetailRouteLoadingSecurity {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid #e8e8eb;
          border-radius: 10px;
          background: #fafafa;
        }

        .productDetailRouteLoadingNoticeIcon,
        .productDetailRouteLoadingSecurityIcon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .productDetailRouteLoadingNoticeContent,
        .productDetailRouteLoadingSecurityContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingNoticeTitle,
        .productDetailRouteLoadingSecurityTitle {
          width: 148px;
          height: 9px;
        }

        .productDetailRouteLoadingNoticeText,
        .productDetailRouteLoadingSecurityText {
          width: 100%;
          height: 7px;
          margin-top: 7px;
        }

        .productDetailRouteLoadingNoticeTextShort,
        .productDetailRouteLoadingSecurityTextShort {
          width: 72%;
          height: 7px;
          margin-top: 5px;
        }

        .productDetailRouteLoadingQrActions {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .productDetailRouteLoadingQrButton {
          width: 100%;
          height: 38px;
          border-radius: 9px;
        }

        /* ================================================================
           OVERVIEW
           ================================================================ */

        .productDetailRouteLoadingDescription {
          margin: 18px;
          padding: 15px 16px;
          border: 1px solid #ebebee;
          border-radius: 11px;
          background: #fafafa;
        }

        .productDetailRouteLoadingDescriptionHeader {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 12px;
        }

        .productDetailRouteLoadingDescriptionIcon {
          width: 18px;
          height: 18px;
          border-radius: 5px;
        }

        .productDetailRouteLoadingDescriptionTitle {
          width: 98px;
          height: 10px;
        }

        .productDetailRouteLoadingDescriptionLine,
        .productDetailRouteLoadingDescriptionLineMedium,
        .productDetailRouteLoadingDescriptionLineShort {
          height: 8px;
          margin-top: 7px;
        }

        .productDetailRouteLoadingDescriptionLine {
          width: 100%;
        }

        .productDetailRouteLoadingDescriptionLineMedium {
          width: 82%;
        }

        .productDetailRouteLoadingDescriptionLineShort {
          width: 57%;
        }

        .productDetailRouteLoadingOverviewGrid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 1px;
          margin: 0 18px 18px;
          overflow: hidden;
          border: 1px solid #eaeaed;
          border-radius: 11px;
          background: #eaeaed;
        }

        .productDetailRouteLoadingOverviewItem {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 9px;
          padding: 13px;
          background: #ffffff;
        }

        .productDetailRouteLoadingOverviewIcon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }

        .productDetailRouteLoadingOverviewContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingOverviewLabel {
          width: 62px;
          height: 7px;
        }

        .productDetailRouteLoadingOverviewValue,
        .productDetailRouteLoadingOverviewValueShort {
          height: 10px;
          margin-top: 7px;
        }

        .productDetailRouteLoadingOverviewValue {
          width: 82%;
        }

        .productDetailRouteLoadingOverviewValueShort {
          width: 54%;
        }

        /* ================================================================
           PRICING
           ================================================================ */

        .productDetailRouteLoadingPricingBody {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 18px;
        }

        .productDetailRouteLoadingPriceHero {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 13px;
          padding: 16px;
          border: 1px solid #e8e8eb;
          border-radius: 12px;
          background: #fafafa;
        }

        .productDetailRouteLoadingPriceHeroIcon {
          width: 46px;
          height: 46px;
          border-radius: 11px;
        }

        .productDetailRouteLoadingPriceHeroContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingPriceLabel {
          width: 78px;
          height: 7px;
        }

        .productDetailRouteLoadingPriceValue {
          width: min(170px, 72%);
          height: 24px;
          margin-top: 8px;
          border-radius: 8px;
        }

        .productDetailRouteLoadingPriceMeta {
          width: 112px;
          height: 8px;
          margin-top: 8px;
        }

        .productDetailRouteLoadingPricingMetrics {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .productDetailRouteLoadingPricingMetric {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 8px;
          padding: 11px;
          border: 1px solid #ebebee;
          border-radius: 9px;
        }

        .productDetailRouteLoadingMetricIcon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
        }

        .productDetailRouteLoadingMetricContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingMetricLabel {
          width: 58px;
          height: 7px;
        }

        .productDetailRouteLoadingMetricValue {
          width: 74%;
          height: 10px;
          margin-top: 6px;
        }

        /* ================================================================
           ACTIONS
           ================================================================ */

        .productDetailRouteLoadingActionsBody {
          padding: 18px;
        }

        .productDetailRouteLoadingActionsGrid {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .productDetailRouteLoadingActionCard {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 9px;
          padding: 12px;
          border: 1px solid #e8e8eb;
          border-radius: 10px;
          background: #ffffff;
        }

        .productDetailRouteLoadingActionCardIcon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
        }

        .productDetailRouteLoadingActionCardContent {
          min-width: 0;
          flex: 1 1 auto;
        }

        .productDetailRouteLoadingActionCardTitle {
          width: 86%;
          height: 9px;
        }

        .productDetailRouteLoadingActionCardText,
        .productDetailRouteLoadingActionCardTextShort {
          height: 7px;
          margin-top: 7px;
        }

        .productDetailRouteLoadingActionCardText {
          width: 100%;
        }

        .productDetailRouteLoadingActionCardTextShort {
          width: 68%;
        }

        .productDetailRouteLoadingActionCardArrow {
          width: 18px;
          height: 18px;
          border-radius: 5px;
        }

        .productDetailRouteLoadingSecurity {
          margin-top: 14px;
        }

        /* ================================================================
           RESPONSIVE
           ================================================================ */

        @media (max-width: 1180px) {
          .productDetailRouteLoadingActionsGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .productDetailRouteLoadingMainImage {
            height: clamp(300px, 55vw, 420px);
          }

          .productDetailRouteLoadingQrInformationGrid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .productDetailRouteLoadingReference {
            width: 42%;
          }

          .productDetailRouteLoadingHeaderIcon {
            width: 46px;
            height: 46px;
            border-radius: 12px;
          }

          .productDetailRouteLoadingTitle {
            height: 24px;
          }

          .productDetailRouteLoadingHeader .productDetailHeaderActions {
            width: 100%;
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .productDetailRouteLoadingAction,
          .productDetailRouteLoadingActionPrimary {
            width: 100%;
          }

          .productDetailRouteLoadingSectionHeader {
            padding: 14px;
          }

          .productDetailRouteLoadingGalleryBody,
          .productDetailRouteLoadingQrBody,
          .productDetailRouteLoadingPricingBody,
          .productDetailRouteLoadingActionsBody {
            padding: 13px;
          }

          .productDetailRouteLoadingMainImage {
            width: 100%;
            height: auto;
            aspect-ratio: 1;
          }

          .productDetailRouteLoadingThumbnails {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .productDetailRouteLoadingQrPreview {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .productDetailRouteLoadingQrPreviewContent {
            width: 100%;
          }

          .productDetailRouteLoadingQrLabel,
          .productDetailRouteLoadingQrToken,
          .productDetailRouteLoadingQrText,
          .productDetailRouteLoadingQrTextShort {
            margin-right: auto;
            margin-left: auto;
          }

          .productDetailRouteLoadingQrInformationGrid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .productDetailRouteLoadingDescription {
            margin: 13px;
          }

          .productDetailRouteLoadingOverviewGrid {
            grid-template-columns: 1fr;
            margin:
              0
              13px
              13px;
          }

          .productDetailRouteLoadingPricingMetrics {
            grid-template-columns: 1fr;
          }

          .productDetailRouteLoadingActionsGrid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 440px) {
          .productDetailRouteLoadingReference {
            width: 46%;
          }

          .productDetailRouteLoadingHeader .productDetailHeaderActions {
            grid-template-columns: 1fr;
          }

          .productDetailRouteLoadingQrInformationGrid,
          .productDetailRouteLoadingQrActions {
            grid-template-columns: 1fr;
          }

          .productDetailRouteLoadingSectionHeader {
            align-items: flex-start;
          }

          .productDetailRouteLoadingSectionBadge {
            width: 52px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .productDetailRouteLoadingSkeleton {
            animation: none;
          }
        }
      `}</style>


      {/* ===================================================================
          PAGE
          =================================================================== */}

      <div
        className={
          styles.page
        }
        aria-busy="true"
        aria-label="Chargement de la fiche produit"
      >
        {/* ===============================================================
            HEADER
            =============================================================== */}

        <ProductHeaderLoading />


        {/* ===============================================================
            PREMIÃˆRE GRILLE â€” GALERIE + QR
            =============================================================== */}

        <div
          className={
            styles.primaryGrid
          }
        >
          <div
            className={
              styles.galleryArea
            }
          >
            <ProductGalleryLoading />
          </div>


          <aside
            className={
              styles.qrArea
            }
            aria-hidden="true"
          >
            <ProductQrLoading />
          </aside>
        </div>


        {/* ===============================================================
            DEUXIÃˆME GRILLE â€” INFORMATIONS + PRIX + ACTIONS
            =============================================================== */}

        <div
          className={
            styles.secondaryGrid
          }
        >
          <div
            className={
              styles.overviewArea
            }
          >
            <ProductOverviewLoading />
          </div>


          <div
            className={
              styles.pricingArea
            }
          >
            <ProductPricingLoading />
          </div>


          <div
            className={
              styles.actionsArea
            }
          >
            <ProductActionsLoading />
          </div>
        </div>


        {/* ===============================================================
            ACCESSIBILITÃ‰
            =============================================================== */}

        <span
          style={{
            position:
              "absolute",

            width:
              "1px",

            height:
              "1px",

            padding:
              0,

            margin:
              "-1px",

            overflow:
              "hidden",

            clip:
              "rect(0, 0, 0, 0)",

            whiteSpace:
              "nowrap",

            border:
              0,
          }}
          role="status"
          aria-live="polite"
        >
          Chargement des informations du produit.
        </span>
      </div>
    </>
  );
}
