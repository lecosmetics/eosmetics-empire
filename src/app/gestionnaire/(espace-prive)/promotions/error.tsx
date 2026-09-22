"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Tag,
} from "lucide-react";

import type {
  CSSProperties,
} from "react";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROMOTIONS — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/promotions/error.tsx
 *
 * Route concernée :
 *
 * /gestionnaire/promotions
 *
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur inattendue de la page Promotions ;
 * - afficher un état d'erreur propre ;
 * - permettre à l'utilisateur de réessayer ;
 * - permettre le retour au tableau de bord ;
 * - ne jamais afficher de stack technique ;
 * - ne jamais afficher de détail Prisma ;
 * - ne jamais afficher de secret serveur ;
 * - ne jamais exposer error.message dans l'interface ;
 * - rester intégré au layout Gestionnaire existant ;
 * - ne pas créer de second <main>.
 *
 *
 * IMPORTANT :
 *
 * Cette page Promotions est actuellement légère.
 *
 * Elle ne contient pas encore :
 *
 * - de gestion métier des promotions ;
 * - de création de promotion ;
 * - de statistiques de promotion ;
 * - d'actions Prisma ;
 * - de formulaires métier.
 *
 * Ce error.tsx sert uniquement de protection propre pour la route.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTE EXISTANTE
   ========================================================================== */

const DASHBOARD_ROUTE =
  "/gestionnaire/tableau-de-bord";


/* ==========================================================================
   PROPS NEXT.JS
   ========================================================================== */

interface GestionnairePromotionsErrorProps {
  readonly error:
    Error & {
      readonly digest?:
        string;
    };

  readonly reset:
    () => void;
}


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
   BREADCRUMB
   ========================================================================== */

const BREADCRUMB_STYLE: CSSProperties = {
  display:
    "flex",

  alignItems:
    "center",

  gap:
    "8px",

  minWidth:
    0,

  color:
    "#777488",

  fontSize:
    "12px",

  fontWeight:
    560,

  lineHeight:
    1.4,
};


const BREADCRUMB_LINK_STYLE: CSSProperties = {
  color:
    "inherit",

  textDecoration:
    "none",
};


const BREADCRUMB_CURRENT_STYLE: CSSProperties = {
  color:
    "#292631",

  fontWeight:
    700,
};


/* ==========================================================================
   HEADER
   ========================================================================== */

const HEADER_STYLE: CSSProperties = {
  width:
    "100%",

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "13px",
};


const HEADER_ICON_STYLE: CSSProperties = {
  width:
    "44px",

  height:
    "44px",

  flex:
    "0 0 44px",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  border:
    "1px solid #f1d1df",

  borderRadius:
    "13px",

  background:
    "#fff4f8",

  color:
    "#d80c68",
};


const HEADER_TEXT_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "4px",
};


const TITLE_STYLE: CSSProperties = {
  margin:
    0,

  color:
    "#17151d",

  fontSize:
    "28px",

  fontWeight:
    800,

  lineHeight:
    1.15,

  letterSpacing:
    "-0.03em",
};


const DESCRIPTION_STYLE: CSSProperties = {
  margin:
    0,

  color:
    "#6d6979",

  fontSize:
    "13px",

  fontWeight:
    500,

  lineHeight:
    1.5,
};


/* ==========================================================================
   ERROR CARD
   ========================================================================== */

const ERROR_CARD_STYLE: CSSProperties = {
  width:
    "100%",

  minWidth:
    0,

  minHeight:
    "390px",

  padding:
    "42px 24px",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  background:
    "#ffffff",

  border:
    "1px solid #e8e8ee",

  borderRadius:
    "18px",

  boxShadow:
    "0 10px 32px rgba(17, 24, 39, 0.05)",
};


const ERROR_CONTENT_STYLE: CSSProperties = {
  width:
    "100%",

  maxWidth:
    "580px",

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  gap:
    "15px",

  textAlign:
    "center",
};


/* ==========================================================================
   ERROR ICON
   ========================================================================== */

const ERROR_ICON_STYLE: CSSProperties = {
  width:
    "72px",

  height:
    "72px",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  border:
    "1px solid #f1cecb",

  borderRadius:
    "20px",

  background:
    "#fff3f2",

  color:
    "#c83a34",
};


const ERROR_EYEBROW_STYLE: CSSProperties = {
  color:
    "#c83a34",

  fontSize:
    "11px",

  fontWeight:
    800,

  lineHeight:
    1.2,

  letterSpacing:
    "0.05em",

  textTransform:
    "uppercase",
};


const ERROR_TITLE_STYLE: CSSProperties = {
  margin:
    0,

  color:
    "#1e1b25",

  fontSize:
    "22px",

  fontWeight:
    790,

  lineHeight:
    1.3,

  letterSpacing:
    "-0.025em",
};


const ERROR_DESCRIPTION_STYLE: CSSProperties = {
  maxWidth:
    "500px",

  margin:
    0,

  color:
    "#6d6978",

  fontSize:
    "13px",

  fontWeight:
    500,

  lineHeight:
    1.65,
};


/* ==========================================================================
   INFORMATION
   ========================================================================== */

const INFO_BOX_STYLE: CSSProperties = {
  width:
    "100%",

  maxWidth:
    "470px",

  padding:
    "12px 14px",

  display:
    "flex",

  alignItems:
    "flex-start",

  gap:
    "10px",

  border:
    "1px solid #e8e8ed",

  borderRadius:
    "11px",

  background:
    "#fafafd",

  color:
    "#686574",

  textAlign:
    "left",
};


const INFO_TEXT_STYLE: CSSProperties = {
  margin:
    0,

  fontSize:
    "11px",

  fontWeight:
    500,

  lineHeight:
    1.55,
};


/* ==========================================================================
   ACTIONS
   ========================================================================== */

const ACTIONS_STYLE: CSSProperties = {
  marginTop:
    "4px",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  flexWrap:
    "wrap",

  gap:
    "10px",
};


const RETRY_BUTTON_STYLE: CSSProperties = {
  minHeight:
    "42px",

  padding:
    "10px 16px",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap:
    "8px",

  border:
    "1px solid #df0870",

  borderRadius:
    "10px",

  background:
    "#df0870",

  color:
    "#ffffff",

  fontFamily:
    "inherit",

  fontSize:
    "12px",

  fontWeight:
    720,

  lineHeight:
    1,

  cursor:
    "pointer",
};


const DASHBOARD_LINK_STYLE: CSSProperties = {
  minHeight:
    "42px",

  padding:
    "10px 16px",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  gap:
    "8px",

  border:
    "1px solid #dedee5",

  borderRadius:
    "10px",

  background:
    "#ffffff",

  color:
    "#4f4b59",

  fontSize:
    "12px",

  fontWeight:
    680,

  lineHeight:
    1,

  textDecoration:
    "none",
};


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function GestionnairePromotionsError({
  error,
  reset,
}: GestionnairePromotionsErrorProps) {
  /* =========================================================================
     LOG TECHNIQUE SÛR
     =========================================================================
     
     On ne journalise volontairement que :
     
     - le nom de l'erreur ;
     - le digest Next.js éventuel.
     
     On évite d'envoyer dans ce log client :
     
     - error.message ;
     - stack ;
     - données utilisateur ;
     - données boutique ;
     - secrets ;
     - détails Prisma.
     ========================================================================= */

  useEffect(
    () => {
      console.error(
        "[Cosmetics Empire][GestionnairePromotions] Erreur inattendue.",
        {
          errorName:
            error.name,

          digest:
            error.digest ??
            null,
        },
      );
    },
    [
      error,
    ],
  );


  /* =========================================================================
     RENDER
     ========================================================================= */

  return (
    <div
      style={PAGE_STYLE}
      role="alert"
    >
      {/* ====================================================================
          BREADCRUMB
          ==================================================================== */}

      <nav
        aria-label="Fil d’Ariane"
        style={BREADCRUMB_STYLE}
      >
        <Link
          href={DASHBOARD_ROUTE}
          style={BREADCRUMB_LINK_STYLE}
        >
          Tableau de bord
        </Link>

        <span aria-hidden="true">
          /
        </span>

        <span
          aria-current="page"
          style={BREADCRUMB_CURRENT_STYLE}
        >
          Promotions
        </span>
      </nav>


      {/* ====================================================================
          HEADER
          ==================================================================== */}

      <header style={HEADER_STYLE}>
        <div
          style={HEADER_ICON_STYLE}
          aria-hidden="true"
        >
          <Tag
            size={22}
            strokeWidth={1.8}
          />
        </div>

        <div style={HEADER_TEXT_STYLE}>
          <h1 style={TITLE_STYLE}>
            Promotions
          </h1>

          <p style={DESCRIPTION_STYLE}>
            Gestion des promotions de votre boutique.
          </p>
        </div>
      </header>


      {/* ====================================================================
          ERROR
          ==================================================================== */}

      <section
        style={ERROR_CARD_STYLE}
        aria-labelledby="gestionnaire-promotions-error-title"
      >
        <div style={ERROR_CONTENT_STYLE}>
          {/* ================================================================
              ICON
              ================================================================ */}

          <div
            style={ERROR_ICON_STYLE}
            aria-hidden="true"
          >
            <AlertTriangle
              size={32}
              strokeWidth={1.8}
            />
          </div>


          {/* ================================================================
              MESSAGE
              ================================================================ */}

          <span style={ERROR_EYEBROW_STYLE}>
            Chargement impossible
          </span>

          <h2
            id="gestionnaire-promotions-error-title"
            style={ERROR_TITLE_STYLE}
          >
            La page Promotions n’a pas pu être affichée
          </h2>

          <p style={ERROR_DESCRIPTION_STYLE}>
            Une erreur inattendue est survenue pendant le chargement de cette
            page. Vous pouvez relancer l’affichage ou retourner au tableau de
            bord.
          </p>


          {/* ================================================================
              INFORMATION
              ================================================================ */}

          <div style={INFO_BOX_STYLE}>
            <ShieldCheck
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
              style={{
                flex:
                  "0 0 auto",

                marginTop:
                  "1px",

                color:
                  "#747180",
              }}
            />

            <p style={INFO_TEXT_STYLE}>
              Aucune information technique sensible n’est affichée ici.
              Le reste de votre espace Gestionnaire reste indépendant de cette
              erreur.
            </p>
          </div>


          {/* ================================================================
              ACTIONS
              ================================================================ */}

          <div style={ACTIONS_STYLE}>
            <button
              type="button"
              onClick={reset}
              style={RETRY_BUTTON_STYLE}
            >
              <RefreshCw
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                Réessayer
              </span>
            </button>

            <Link
              href={DASHBOARD_ROUTE}
              style={DASHBOARD_LINK_STYLE}
            >
              <ArrowLeft
                size={17}
                strokeWidth={1.9}
                aria-hidden="true"
              />

              <span>
                Tableau de bord
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}