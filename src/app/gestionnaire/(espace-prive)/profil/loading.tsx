import type {
  CSSProperties,
} from "react";

import styles from "@/app/gestionnaire/(espace-prive)/profil/profil.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL — LOADING
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/profil/loading.tsx
 *
 * RÔLE :
 *
 * Afficher un état de chargement propre pendant que Next.js prépare :
 *
 * - la session Gestionnaire ;
 * - les informations du Manager ;
 * - les informations de la boutique ;
 * - les données de sécurité ;
 * - les coordonnées du profil.
 *
 *
 * PRINCIPES :
 *
 * - aucune fausse donnée métier ;
 * - aucun faux nom ;
 * - aucun faux e-mail ;
 * - aucun faux téléphone ;
 * - aucun faux pays ;
 * - aucun faux statut ;
 * - aucune requête Prisma ;
 * - aucune lecture de session ;
 * - aucun Client Component ;
 * - aucun spinner plein écran ;
 * - aucun second <main> ;
 * - aucune nouvelle dépendance.
 *
 * ============================================================================
 */


/* ==========================================================================
   STYLES SKELETON
   ========================================================================== */

const SKELETON_BASE_STYLE: CSSProperties = {
  display:
    "block",

  background:
    "linear-gradient(90deg, #f0f1f4 25%, #f7f7f9 50%, #f0f1f4 75%)",

  backgroundSize:
    "200% 100%",

  borderRadius:
    "8px",

  animation:
    "profile-loading-pulse 1.45s ease-in-out infinite",
};


const HEADER_STYLE: CSSProperties = {
  width:
    "100%",

  maxWidth:
    "none",

  minWidth:
    0,

  margin:
    0,

  padding:
    "0 0 20px",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "10px",
};


const HEADER_BREADCRUMB_STYLE: CSSProperties = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",
};


const CARD_BODY_STYLE: CSSProperties = {
  padding:
    "22px 20px",

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "18px",
};


const IDENTITY_STYLE: CSSProperties = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "20px",
};


const IDENTITY_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

  flex:
    1,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "10px",
};


const INFO_LIST_STYLE: CSSProperties = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "12px",
};


const INFO_ROW_STYLE: CSSProperties = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "10px",
};


const CONTACT_GRID_STYLE: CSSProperties = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  gap:
    "18px 24px",
};


const SUMMARY_GRID_STYLE: CSSProperties = {
  display:
    "grid",

  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",

  gap:
    "14px",

  paddingTop:
    "18px",

  borderTop:
    "1px solid #ededf2",
};


const SECURITY_LIST_STYLE: CSSProperties = {
  padding:
    "0 20px",
};


const SECURITY_ROW_STYLE: CSSProperties = {
  minHeight:
    "76px",

  padding:
    "16px 0",

  display:
    "grid",

  gridTemplateColumns:
    "38px minmax(0, 1fr) 110px",

  alignItems:
    "center",

  gap:
    "13px",

  borderBottom:
    "1px solid #eeeeF2",
};


const ACCOUNT_STYLE: CSSProperties = {
  padding:
    "18px 20px",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "13px",
};


/* ==========================================================================
   SKELETON BLOCK
   ========================================================================== */

function SkeletonBlock({
  width,
  height,
  radius,
}: {
  readonly width:
    string | number;

  readonly height:
    string | number;

  readonly radius?:
    string | number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        ...SKELETON_BASE_STYLE,

        width,

        height,

        borderRadius:
          radius ??
          SKELETON_BASE_STYLE.borderRadius,
      }}
    />
  );
}


/* ==========================================================================
   CARD HEADER SKELETON
   ========================================================================== */

function SkeletonCardHeader({
  withAction =
    false,
}: {
  readonly withAction?:
    boolean;
}) {
  return (
    <div className={styles.profileCardHeader}>
      <div className={styles.profileCardHeading}>
        <SkeletonBlock
          width={38}
          height={38}
          radius={11}
        />

        <div
          style={{
            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "6px",
          }}
        >
          <SkeletonBlock
            width={175}
            height={15}
          />

          <SkeletonBlock
            width={120}
            height={10}
          />
        </div>
      </div>

      {withAction ? (
        <SkeletonBlock
          width={92}
          height={38}
          radius={10}
        />
      ) : null}
    </div>
  );
}


/* ==========================================================================
   INFO ROW SKELETON
   ========================================================================== */

function SkeletonInfoRow({
  width =
    "65%",
}: {
  readonly width?:
    string | number;
}) {
  return (
    <div style={INFO_ROW_STYLE}>
      <SkeletonBlock
        width={30}
        height={30}
        radius={9}
      />

      <div
        style={{
          minWidth:
            0,

          flex:
            1,

          display:
            "flex",

          flexDirection:
            "column",

          gap:
            "5px",
        }}
      >
        <SkeletonBlock
          width={70}
          height={9}
        />

        <SkeletonBlock
          width={width}
          height={12}
        />
      </div>
    </div>
  );
}


/* ==========================================================================
   MANAGER CARD
   ========================================================================== */

function ManagerCardSkeleton() {
  return (
    <section
      className={styles.profileCard}
      aria-hidden="true"
    >
      <SkeletonCardHeader />

      <div style={CARD_BODY_STYLE}>
        <div style={IDENTITY_STYLE}>
          <SkeletonBlock
            width={96}
            height={96}
            radius="50%"
          />

          <div style={IDENTITY_CONTENT_STYLE}>
            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                flexWrap:
                  "wrap",

                gap:
                  "9px",
              }}
            >
              <SkeletonBlock
                width={190}
                height={20}
              />

              <SkeletonBlock
                width={82}
                height={25}
                radius={999}
              />
            </div>

            <div style={INFO_LIST_STYLE}>
              <SkeletonInfoRow
                width="62%"
              />

              <SkeletonInfoRow
                width="48%"
              />

              <SkeletonInfoRow
                width="54%"
              />
            </div>
          </div>
        </div>

        <div style={SUMMARY_GRID_STYLE}>
          <div>
            <SkeletonBlock
              width={55}
              height={9}
            />

            <div
              style={{
                height:
                  "7px",
              }}
            />

            <SkeletonBlock
              width={85}
              height={13}
            />
          </div>

          <div>
            <SkeletonBlock
              width={100}
              height={9}
            />

            <div
              style={{
                height:
                  "7px",
              }}
            />

            <SkeletonBlock
              width={105}
              height={13}
            />
          </div>

          <div>
            <SkeletonBlock
              width={105}
              height={9}
            />

            <div
              style={{
                height:
                  "7px",
              }}
            />

            <SkeletonBlock
              width={145}
              height={13}
            />
          </div>
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   CONTACT CARD
   ========================================================================== */

function ContactCardSkeleton() {
  return (
    <section
      className={styles.profileCard}
      aria-hidden="true"
    >
      <SkeletonCardHeader
        withAction
      />

      <div style={CARD_BODY_STYLE}>
        <div style={CONTACT_GRID_STYLE}>
          <SkeletonInfoRow
            width="72%"
          />

          <SkeletonInfoRow
            width="58%"
          />

          <SkeletonInfoRow
            width="52%"
          />

          <SkeletonInfoRow
            width="47%"
          />
        </div>

        <div
          style={{
            paddingTop:
              "18px",

            borderTop:
              "1px solid #ededf2",

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "9px",
          }}
        >
          <SkeletonBlock
            width={55}
            height={9}
          />

          <SkeletonBlock
            width="100%"
            height={46}
            radius={11}
          />
        </div>
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
      className={[
        styles.profileCard,
        styles.profileSecurityCard,
      ].join(" ")}
      aria-hidden="true"
    >
      <SkeletonCardHeader />

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

              <div
                style={{
                  minWidth:
                    0,

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "7px",
                }}
              >
                <SkeletonBlock
                  width={135}
                  height={13}
                />

                <SkeletonBlock
                  width="56%"
                  height={10}
                />
              </div>

              <SkeletonBlock
                width={100}
                height={32}
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
   ACCOUNT CARD
   ========================================================================== */

function AccountCardSkeleton() {
  return (
    <section
      className={[
        styles.profileCard,
        styles.profileAccountCard,
      ].join(" ")}
      aria-hidden="true"
    >
      <div style={ACCOUNT_STYLE}>
        <SkeletonBlock
          width={42}
          height={42}
          radius={12}
        />

        <div
          style={{
            minWidth:
              0,

            flex:
              1,

            display:
              "flex",

            flexDirection:
              "column",

            gap:
              "7px",
          }}
        >
          <SkeletonBlock
            width={175}
            height={14}
          />

          <SkeletonBlock
            width="65%"
            height={11}
          />
        </div>
      </div>
    </section>
  );
}


/* ==========================================================================
   PAGE LOADING
   ========================================================================== */

export default function GestionnaireProfileLoading() {
  return (
    <>
      {/* ====================================================================
          ANIMATION
          ==================================================================== */}

      <style>
        {`
          @keyframes profile-loading-pulse {
            0% {
              background-position: 200% 0;
            }

            100% {
              background-position: -200% 0;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [data-profile-skeleton="true"] span {
              animation: none !important;
            }
          }

          @media (max-width: 1100px) {
            [data-profile-loading-grid="true"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }

          @media (max-width: 760px) {
            [data-profile-contact-grid="true"] {
              grid-template-columns: minmax(0, 1fr) !important;
            }

            [data-profile-security-row="true"] {
              grid-template-columns:
                38px
                minmax(0, 1fr) !important;
            }
          }
        `}
      </style>


      <div
        data-profile-skeleton="true"
        aria-busy="true"
        aria-label="Chargement du profil Gestionnaire"
      >
        {/* ==================================================================
            PAGE HEADER
            ================================================================== */}

        <header style={HEADER_STYLE}>
          <div style={HEADER_BREADCRUMB_STYLE}>
            <SkeletonBlock
              width={110}
              height={11}
            />

            <SkeletonBlock
              width={7}
              height={11}
            />

            <SkeletonBlock
              width={48}
              height={11}
            />
          </div>

          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",

              gap:
                "8px",
            }}
          >
            <SkeletonBlock
              width={170}
              height={31}
              radius={9}
            />

            <SkeletonBlock
              width="min(520px, 75%)"
              height={12}
            />
          </div>
        </header>


        {/* ==================================================================
            PAGE CONTENT
            ================================================================== */}

        <div className={styles.profileClient}>
          <div
            data-profile-loading-grid="true"
            className={styles.profileGrid}
          >
            <ManagerCardSkeleton />

            <ContactCardSkeleton />
          </div>

          <SecurityCardSkeleton />

          <AccountCardSkeleton />
        </div>


        {/* ==================================================================
            ACCESSIBLE TEXT
            ================================================================== */}

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
        >
          Chargement des informations du profil…
        </span>
      </div>
    </>
  );
}