import type {
  CSSProperties,
} from "react";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PARAMÈTRES — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/parametres/loading.tsx
 *
 * Route :
 *
 * /gestionnaire/parametres
 *
 *
 * OBJECTIF :
 *
 * Afficher un état de chargement propre pendant que la page Paramètres
 * récupère les données réelles du Profil.
 *
 *
 * Cette page de chargement :
 *
 * - n'affiche aucune fausse donnée ;
 * - n'affiche aucun faux e-mail ;
 * - n'affiche aucun faux téléphone ;
 * - n'affiche aucun faux nom de boutique ;
 * - n'affiche aucun faux statut ;
 * - n'affiche aucune fausse date ;
 * - ne lit aucune session ;
 * - ne fait aucune requête Prisma ;
 * - ne crée aucune Server Action ;
 * - ne crée aucune nouvelle route ;
 * - ne dépend pas de ProfileClient ;
 * - ne crée aucun second <main> ;
 * - reste pleine largeur dans le layout Gestionnaire.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROOT
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
   SKELETON
   ========================================================================== */

const SKELETON_STYLE: CSSProperties = {
  display:
    "block",

  flexShrink:
    0,

  background:
    "linear-gradient(90deg, #eceef2 25%, #f8f8fa 50%, #eceef2 75%)",

  backgroundSize:
    "200% 100%",

  animation:
    "settings-loading-shimmer 1.4s ease-in-out infinite",
};


/* ==========================================================================
   BREADCRUMB
   ========================================================================== */

const BREADCRUMB_STYLE: CSSProperties = {
  width:
    "100%",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",
};


/* ==========================================================================
   HEADER
   ========================================================================== */

const HEADER_STYLE: CSSProperties = {
  width:
    "100%",

  minWidth:
    0,

  padding:
    "20px 22px",

  display:
    "grid",

  gridTemplateColumns:
    "46px minmax(0, 1fr) auto",

  alignItems:
    "center",

  gap:
    "14px",

  background:
    "#ffffff",

  border:
    "1px solid #e8e8ee",

  borderRadius:
    "17px",

  boxShadow:
    "0 8px 28px rgba(17, 24, 39, 0.04)",
};


const HEADER_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

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
  width:
    "100%",

  minWidth:
    0,

  padding:
    "17px 19px",

  display:
    "grid",

  gridTemplateColumns:
    "42px minmax(0, 1fr)",

  alignItems:
    "center",

  gap:
    "13px",

  background:
    "#ffffff",

  border:
    "1px solid #e8e8ee",

  borderRadius:
    "15px",

  boxShadow:
    "0 7px 22px rgba(17, 24, 39, 0.035)",
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
   SETTINGS GRID
   ========================================================================== */

const GRID_STYLE: CSSProperties = {
  width:
    "100%",

  minWidth:
    0,

  display:
    "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  gap:
    "18px",
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
    "1px solid #e8e8ee",

  borderRadius:
    "17px",

  boxShadow:
    "0 8px 26px rgba(17, 24, 39, 0.04)",

  overflow:
    "hidden",
};


/* ==========================================================================
   CARD HEADER
   ========================================================================== */

const CARD_HEADER_STYLE: CSSProperties = {
  minHeight:
    "74px",

  padding:
    "17px 19px",

  display:
    "grid",

  gridTemplateColumns:
    "minmax(0, 1fr) auto",

  alignItems:
    "center",

  gap:
    "14px",

  borderBottom:
    "1px solid #ededf2",
};


const CARD_HEADING_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "11px",
};


const CARD_TITLE_GROUP_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "6px",
};


/* ==========================================================================
   CARD BODY
   ========================================================================== */

const CARD_BODY_STYLE: CSSProperties = {
  padding:
    "19px",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "15px",
};


/* ==========================================================================
   INFORMATION ROW
   ========================================================================== */

const INFO_ROW_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "grid",

  gridTemplateColumns:
    "36px minmax(0, 1fr)",

  alignItems:
    "center",

  gap:
    "11px",
};


const INFO_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "5px",
};


/* ==========================================================================
   ADDRESS
   ========================================================================== */

const ADDRESS_STYLE: CSSProperties = {
  margin:
    "0 19px 19px",

  paddingTop:
    "17px",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "8px",

  borderTop:
    "1px solid #ededf2",
};


/* ==========================================================================
   SECURITY
   ========================================================================== */

const SECURITY_CARD_STYLE: CSSProperties = {
  ...CARD_STYLE,

  gridColumn:
    "1 / -1",
};


const SECURITY_LIST_STYLE: CSSProperties = {
  padding:
    "0 19px",
};


const SECURITY_ROW_STYLE: CSSProperties = {
  minHeight:
    "76px",

  padding:
    "15px 0",

  display:
    "grid",

  gridTemplateColumns:
    "38px minmax(0, 1fr) 105px",

  alignItems:
    "center",

  gap:
    "12px",

  borderBottom:
    "1px solid #ededf2",
};


const SECURITY_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "6px",
};


/* ==========================================================================
   BOTTOM PROFILE CARD
   ========================================================================== */

const PROFILE_MANAGEMENT_STYLE: CSSProperties = {
  width:
    "100%",

  minWidth:
    0,

  padding:
    "18px 20px",

  display:
    "grid",

  gridTemplateColumns:
    "46px minmax(0, 1fr) auto",

  alignItems:
    "center",

  gap:
    "14px",

  background:
    "#ffffff",

  border:
    "1px solid #e8e8ee",

  borderRadius:
    "16px",

  boxShadow:
    "0 7px 22px rgba(17, 24, 39, 0.035)",
};


const PROFILE_CONTENT_STYLE: CSSProperties = {
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
   VISUALLY HIDDEN
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
      }}
    />
  );
}


/* ==========================================================================
   CARD HEADER SKELETON
   ========================================================================== */

function SettingsCardHeaderSkeleton() {
  return (
    <div style={CARD_HEADER_STYLE}>
      <div style={CARD_HEADING_STYLE}>
        <SkeletonBlock
          width={38}
          height={38}
          radius={11}
        />

        <div style={CARD_TITLE_GROUP_STYLE}>
          <SkeletonBlock
            width={155}
            height={15}
          />

          <SkeletonBlock
            width={185}
            height={10}
          />
        </div>
      </div>

      <SkeletonBlock
        width={92}
        height={38}
        radius={10}
      />
    </div>
  );
}


/* ==========================================================================
   INFO ROW SKELETON
   ========================================================================== */

function SettingsInfoRowSkeleton({
  width =
    "60%",
}: {
  readonly width?:
    string | number;
}) {
  return (
    <div style={INFO_ROW_STYLE}>
      <SkeletonBlock
        width={36}
        height={36}
        radius={10}
      />

      <div style={INFO_CONTENT_STYLE}>
        <SkeletonBlock
          width={92}
          height={9}
        />

        <SkeletonBlock
          width={width}
          height={13}
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   ACCOUNT CARD
   ========================================================================== */

function AccountCardSkeleton() {
  return (
    <section
      style={CARD_STYLE}
      aria-hidden="true"
    >
      <SettingsCardHeaderSkeleton />

      <div style={CARD_BODY_STYLE}>
        <SettingsInfoRowSkeleton
          width="68%"
        />

        <SettingsInfoRowSkeleton
          width="38%"
        />

        <SettingsInfoRowSkeleton
          width="42%"
        />

        <SettingsInfoRowSkeleton
          width="48%"
        />
      </div>
    </section>
  );
}


/* ==========================================================================
   STORE CARD
   ========================================================================== */

function StoreCardSkeleton() {
  return (
    <section
      style={CARD_STYLE}
      aria-hidden="true"
    >
      <SettingsCardHeaderSkeleton />

      <div style={CARD_BODY_STYLE}>
        <SettingsInfoRowSkeleton
          width="60%"
        />

        <SettingsInfoRowSkeleton
          width="48%"
        />

        <SettingsInfoRowSkeleton
          width="54%"
        />

        <SettingsInfoRowSkeleton
          width="42%"
        />
      </div>

      <div style={ADDRESS_STYLE}>
        <SkeletonBlock
          width={58}
          height={9}
        />

        <SkeletonBlock
          width="100%"
          height={44}
          radius={11}
        />
      </div>
    </section>
  );
}


/* ==========================================================================
   SECURITY CARD
   ========================================================================== */

function SecurityCardSkeleton() {
  return (
    <section
      style={SECURITY_CARD_STYLE}
      aria-hidden="true"
    >
      <SettingsCardHeaderSkeleton />

      <div style={SECURITY_LIST_STYLE}>
        {Array.from(
          {
            length:
              3,
          },
          (
            _item,
            index,
          ) => (
            <div
              key={index}
              data-settings-security-row="true"
              style={{
                ...SECURITY_ROW_STYLE,

                borderBottom:
                  index ===
                  2
                    ? "0"
                    : SECURITY_ROW_STYLE.borderBottom,
              }}
            >
              <SkeletonBlock
                width={38}
                height={38}
                radius={11}
              />

              <div style={SECURITY_CONTENT_STYLE}>
                <SkeletonBlock
                  width={150}
                  height={13}
                />

                <SkeletonBlock
                  width="52%"
                  height={10}
                />
              </div>

              <SkeletonBlock
                width={96}
                height={30}
                radius={9}
              />
            </div>
          ),
        )}
      </div>
    </section>
  );
}


/* ==========================================================================
   PROFILE MANAGEMENT
   ========================================================================== */

function ProfileManagementSkeleton() {
  return (
    <section
      data-settings-profile-management="true"
      style={PROFILE_MANAGEMENT_STYLE}
      aria-hidden="true"
    >
      <SkeletonBlock
        width={46}
        height={46}
        radius={13}
      />

      <div style={PROFILE_CONTENT_STYLE}>
        <SkeletonBlock
          width={240}
          height={15}
        />

        <SkeletonBlock
          width="68%"
          height={10}
        />
      </div>

      <SkeletonBlock
        width={150}
        height={40}
        radius={10}
      />
    </section>
  );
}


/* ==========================================================================
   LOADING PAGE
   ========================================================================== */

export default function GestionnaireSettingsLoading() {
  return (
    <>
      {/* ====================================================================
          ANIMATION + RESPONSIVE
          ==================================================================== */}

      <style>
        {`
          @keyframes settings-loading-shimmer {
            0% {
              background-position: 200% 0;
            }

            100% {
              background-position: -200% 0;
            }
          }

          @media (max-width: 1050px) {
            [data-settings-grid="true"] {
              grid-template-columns:
                minmax(0, 1fr) !important;
            }
          }

          @media (max-width: 760px) {
            [data-settings-header="true"] {
              grid-template-columns:
                42px minmax(0, 1fr) !important;
            }

            [data-settings-header-action="true"] {
              grid-column:
                1 / -1;

              width:
                100% !important;
            }

            [data-settings-security-row="true"] {
              grid-template-columns:
                38px minmax(0, 1fr) !important;
            }

            [data-settings-security-row="true"] > :last-child {
              grid-column:
                2;
            }

            [data-settings-profile-management="true"] {
              grid-template-columns:
                44px minmax(0, 1fr) !important;
            }

            [data-settings-profile-management="true"] > :last-child {
              grid-column:
                1 / -1;

              width:
                100% !important;
            }
          }

          @media (max-width: 520px) {
            [data-settings-header="true"] {
              grid-template-columns:
                minmax(0, 1fr) !important;
            }

            [data-settings-header="true"] > :first-child {
              justify-self:
                start;
            }

            [data-settings-profile-management="true"] {
              grid-template-columns:
                minmax(0, 1fr) !important;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-settings-loading="true"] span {
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
        data-settings-loading="true"
        style={PAGE_STYLE}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {/* ==================================================================
            BREADCRUMB
            ================================================================== */}

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
            width={72}
            height={11}
          />
        </div>


        {/* ==================================================================
            HEADER
            ================================================================== */}

        <header
          data-settings-header="true"
          style={HEADER_STYLE}
        >
          <SkeletonBlock
            width={46}
            height={46}
            radius={13}
          />

          <div style={HEADER_CONTENT_STYLE}>
            <SkeletonBlock
              width={165}
              height={28}
              radius={8}
            />

            <SkeletonBlock
              width="min(620px, 82%)"
              height={11}
            />
          </div>

          <div
            data-settings-header-action="true"
            style={{
              width:
                "160px",
            }}
          >
            <SkeletonBlock
              width="100%"
              height={40}
              radius={10}
            />
          </div>
        </header>


        {/* ==================================================================
            NOTICE
            ================================================================== */}

        <section
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
              width={290}
              height={13}
            />

            <SkeletonBlock
              width="min(780px, 90%)"
              height={10}
            />
          </div>
        </section>


        {/* ==================================================================
            SETTINGS GRID
            ================================================================== */}

        <div
          data-settings-grid="true"
          style={GRID_STYLE}
        >
          <AccountCardSkeleton />

          <StoreCardSkeleton />

          <SecurityCardSkeleton />
        </div>


        {/* ==================================================================
            PROFILE MANAGEMENT
            ================================================================== */}

        <ProfileManagementSkeleton />


        {/* ==================================================================
            ACCESSIBLE TEXT
            ================================================================== */}

        <span style={VISUALLY_HIDDEN_STYLE}>
          Chargement des paramètres du Gestionnaire…
        </span>
      </div>
    </>
  );
}