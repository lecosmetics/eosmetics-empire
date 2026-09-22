import type {
  CSSProperties,
} from "react";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROMOTIONS — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/promotions/loading.tsx
 *
 * OBJECTIF :
 *
 * Afficher un état de chargement propre pendant que Next.js prépare
 * la page :
 *
 * /gestionnaire/promotions
 *
 *
 * RÈGLES :
 *
 * - aucune donnée fictive ;
 * - aucune fausse promotion ;
 * - aucune fausse statistique ;
 * - aucune requête Prisma ;
 * - aucune lecture de session ;
 * - aucune Server Action ;
 * - aucune nouvelle route ;
 * - aucun composant client ;
 * - aucun second <main> ;
 * - aucune dépendance au fichier promotions.module.css ;
 * - largeur complète de l'espace disponible.
 *
 * ============================================================================
 */


/* ==========================================================================
   STYLES — PAGE
   ========================================================================== */

const PAGE_STYLE: CSSProperties = {
  width:
    "100%",

  maxWidth:
    "none",

  minWidth:
    0,

  margin:
    0,

  padding:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "18px",
};


/* ==========================================================================
   SKELETON BASE
   ========================================================================== */

const SKELETON_STYLE: CSSProperties = {
  display:
    "block",

  background:
    "linear-gradient(90deg, #eceef2 25%, #f7f8fa 50%, #eceef2 75%)",

  backgroundSize:
    "200% 100%",

  animation:
    "promotions-loading-shimmer 1.4s ease-in-out infinite",
};


/* ==========================================================================
   HEADER
   ========================================================================== */

const HEADER_STYLE: CSSProperties = {
  width:
    "100%",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "16px",
};


const BREADCRUMB_STYLE: CSSProperties = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",
};


const HEADER_CONTENT_STYLE: CSSProperties = {
  width:
    "100%",

  padding:
    "20px",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "14px",

  background:
    "#ffffff",

  border:
    "1px solid #e9e9ef",

  borderRadius:
    "16px",

  boxShadow:
    "0 8px 28px rgba(17, 24, 39, 0.04)",
};


const HEADER_TEXT_STYLE: CSSProperties = {
  minWidth:
    0,

  flex:
    1,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "9px",
};


const TITLE_ROW_STYLE: CSSProperties = {
  display:
    "flex",

  alignItems:
    "center",

  flexWrap:
    "wrap",

  gap:
    "10px",
};


/* ==========================================================================
   CARD
   ========================================================================== */

const CARD_STYLE: CSSProperties = {
  width:
    "100%",

  minWidth:
    0,

  background:
    "#ffffff",

  border:
    "1px solid #e9e9ef",

  borderRadius:
    "16px",

  boxShadow:
    "0 8px 28px rgba(17, 24, 39, 0.04)",
};


/* ==========================================================================
   INTRO
   ========================================================================== */

const INTRO_STYLE: CSSProperties = {
  ...CARD_STYLE,

  padding:
    "26px 24px",

  display:
    "grid",

  gridTemplateColumns:
    "72px minmax(0, 1fr)",

  alignItems:
    "center",

  gap:
    "20px",
};


const INTRO_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "10px",
};


/* ==========================================================================
   FEATURES
   ========================================================================== */

const FEATURES_SECTION_STYLE: CSSProperties = {
  width:
    "100%",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "14px",
};


const FEATURES_HEADER_STYLE: CSSProperties = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "7px",
};


const FEATURES_GRID_STYLE: CSSProperties = {
  width:
    "100%",

  display:
    "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  gap:
    "16px",
};


const FEATURE_CARD_STYLE: CSSProperties = {
  ...CARD_STYLE,

  minHeight:
    "170px",

  padding:
    "20px",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "15px",
};


const FEATURE_CONTENT_STYLE: CSSProperties = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "8px",
};


/* ==========================================================================
   NOTICE
   ========================================================================== */

const NOTICE_STYLE: CSSProperties = {
  ...CARD_STYLE,

  padding:
    "18px 20px",

  display:
    "grid",

  gridTemplateColumns:
    "42px minmax(0, 1fr) auto",

  alignItems:
    "center",

  gap:
    "14px",
};


const NOTICE_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "7px",
};


/* ==========================================================================
   ACCESSIBLE HIDDEN TEXT
   ========================================================================== */

const VISUALLY_HIDDEN_STYLE: CSSProperties = {
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
};


/* ==========================================================================
   SKELETON BLOCK
   ========================================================================== */

interface SkeletonBlockProps {
  readonly width:
    string | number;

  readonly height:
    string | number;

  readonly radius?:
    string | number;
}


function SkeletonBlock({
  width,
  height,
  radius =
    8,
}: SkeletonBlockProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...SKELETON_STYLE,

        width,

        height,

        borderRadius:
          radius,

        flexShrink:
          0,
      }}
    />
  );
}


/* ==========================================================================
   FEATURE CARD
   ========================================================================== */

function FeatureSkeleton() {
  return (
    <article style={FEATURE_CARD_STYLE}>
      <SkeletonBlock
        width={44}
        height={44}
        radius={12}
      />

      <div style={FEATURE_CONTENT_STYLE}>
        <SkeletonBlock
          width="58%"
          height={15}
        />

        <SkeletonBlock
          width="100%"
          height={10}
        />

        <SkeletonBlock
          width="88%"
          height={10}
        />

        <SkeletonBlock
          width="68%"
          height={10}
        />
      </div>
    </article>
  );
}


/* ==========================================================================
   PAGE
   ========================================================================== */

export default function GestionnairePromotionsLoading() {
  return (
    <>
      {/* ====================================================================
          ANIMATION + RESPONSIVE
          ==================================================================== */}

      <style>
        {`
          @keyframes promotions-loading-shimmer {
            0% {
              background-position: 200% 0;
            }

            100% {
              background-position: -200% 0;
            }
          }

          @media (max-width: 950px) {
            [data-promotions-loading-features="true"] {
              grid-template-columns:
                repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 680px) {
            [data-promotions-loading-header="true"] {
              align-items: flex-start !important;
            }

            [data-promotions-loading-intro="true"] {
              grid-template-columns:
                minmax(0, 1fr) !important;
            }

            [data-promotions-loading-features="true"] {
              grid-template-columns:
                minmax(0, 1fr) !important;
            }

            [data-promotions-loading-notice="true"] {
              grid-template-columns:
                42px minmax(0, 1fr) !important;
            }

            [data-promotions-loading-notice-action="true"] {
              grid-column:
                1 / -1;

              width:
                100% !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-promotions-loading="true"] span {
              animation:
                none !important;
            }
          }
        `}
      </style>


      {/* ====================================================================
          ROOT
          ==================================================================== */}

      <div
        data-promotions-loading="true"
        style={PAGE_STYLE}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {/* ==================================================================
            HEADER
            ================================================================== */}

        <header style={HEADER_STYLE}>
          {/* ================================================================
              BREADCRUMB
              ================================================================ */}

          <div style={BREADCRUMB_STYLE}>
            <SkeletonBlock
              width={108}
              height={11}
            />

            <SkeletonBlock
              width={6}
              height={10}
              radius={3}
            />

            <SkeletonBlock
              width={68}
              height={11}
            />
          </div>


          {/* ================================================================
              TITLE
              ================================================================ */}

          <div
            data-promotions-loading-header="true"
            style={HEADER_CONTENT_STYLE}
          >
            <SkeletonBlock
              width={46}
              height={46}
              radius={13}
            />

            <div style={HEADER_TEXT_STYLE}>
              <div style={TITLE_ROW_STYLE}>
                <SkeletonBlock
                  width={155}
                  height={25}
                  radius={7}
                />

                <SkeletonBlock
                  width={112}
                  height={25}
                  radius={999}
                />
              </div>

              <SkeletonBlock
                width="min(520px, 80%)"
                height={11}
              />
            </div>
          </div>
        </header>


        {/* ==================================================================
            INTRO
            ================================================================== */}

        <section
          data-promotions-loading-intro="true"
          style={INTRO_STYLE}
          aria-hidden="true"
        >
          <SkeletonBlock
            width={68}
            height={68}
            radius={18}
          />

          <div style={INTRO_CONTENT_STYLE}>
            <SkeletonBlock
              width={125}
              height={10}
            />

            <SkeletonBlock
              width="min(420px, 82%)"
              height={20}
            />

            <div
              style={{
                display:
                  "flex",

                flexDirection:
                  "column",

                gap:
                  "7px",
              }}
            >
              <SkeletonBlock
                width="100%"
                height={10}
              />

              <SkeletonBlock
                width="92%"
                height={10}
              />

              <SkeletonBlock
                width="70%"
                height={10}
              />
            </div>
          </div>
        </section>


        {/* ==================================================================
            FEATURES
            ================================================================== */}

        <section
          style={FEATURES_SECTION_STYLE}
          aria-hidden="true"
        >
          <div style={FEATURES_HEADER_STYLE}>
            <SkeletonBlock
              width={220}
              height={17}
            />

            <SkeletonBlock
              width="min(470px, 74%)"
              height={10}
            />
          </div>

          <div
            data-promotions-loading-features="true"
            style={FEATURES_GRID_STYLE}
          >
            <FeatureSkeleton />

            <FeatureSkeleton />

            <FeatureSkeleton />
          </div>
        </section>


        {/* ==================================================================
            NOTICE
            ================================================================== */}

        <section
          data-promotions-loading-notice="true"
          style={NOTICE_STYLE}
          aria-hidden="true"
        >
          <SkeletonBlock
            width={42}
            height={42}
            radius={12}
          />

          <div style={NOTICE_CONTENT_STYLE}>
            <SkeletonBlock
              width={215}
              height={13}
            />

            <SkeletonBlock
              width="min(480px, 88%)"
              height={10}
            />
          </div>

          <div
            data-promotions-loading-notice-action="true"
            style={{
              width:
                "130px",
            }}
          >
            <SkeletonBlock
              width="100%"
              height={40}
              radius={10}
            />
          </div>
        </section>


        {/* ==================================================================
            TEXTE ACCESSIBLE
            ================================================================== */}

        <span style={VISUALLY_HIDDEN_STYLE}>
          Chargement de la page Promotions…
        </span>
      </div>
    </>
  );
}