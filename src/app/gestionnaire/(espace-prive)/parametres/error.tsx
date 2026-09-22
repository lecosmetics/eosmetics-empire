"use client";

import type {
  CSSProperties,
} from "react";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Settings,
  ShieldCheck,
} from "lucide-react";


/**
 * ============================================================================
 * COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PARAMÈTRES — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/parametres/error.tsx
 *
 * Route :
 *
 * /gestionnaire/parametres
 *
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur inattendue de la page Paramètres ;
 * - afficher une interface propre et compréhensible ;
 * - permettre une nouvelle tentative avec reset() ;
 * - permettre le retour au tableau de bord ;
 * - ne jamais exposer de détail technique sensible ;
 * - ne jamais afficher error.message à l'utilisateur ;
 * - ne jamais afficher de stack ;
 * - ne jamais afficher de détail Prisma/PostgreSQL ;
 * - ne jamais afficher de donnée de session ;
 * - ne jamais créer de second <main> ;
 * - rester dans le layout Gestionnaire existant.
 *
 *
 * IMPORTANT :
 *
 * La page Paramètres dépend du module Profil pour ses données.
 *
 * Une erreur ici ne doit donc pas créer :
 *
 * - une nouvelle logique de récupération ;
 * - une nouvelle requête Prisma ;
 * - une nouvelle Server Action ;
 * - une nouvelle route de modification.
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

interface GestionnaireSettingsErrorProps {
  readonly error:
    Error & {
      readonly digest?:
        string;
    };

  readonly reset:
    () => void;
}


/* ==========================================================================
   PAGE
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
  width:
    "100%",

  minWidth:
    0,

  display:
    "flex",

  alignItems:
    "center",

  flexWrap:
    "wrap",

  gap:
    "8px",

  color:
    "#777382",

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


const BREADCRUMB_SEPARATOR_STYLE: CSSProperties = {
  color:
    "#aaa7b2",
};


const BREADCRUMB_CURRENT_STYLE: CSSProperties = {
  color:
    "#292631",

  fontWeight:
    700,
};


/* ==========================================================================
   PAGE HEADER
   ========================================================================== */

const HEADER_STYLE: CSSProperties = {
  width:
    "100%",

  minWidth:
    0,

  display:
    "flex",

  alignItems:
    "center",

  gap:
    "13px",
};


const HEADER_ICON_STYLE: CSSProperties = {
  width:
    "46px",

  height:
    "46px",

  flex:
    "0 0 46px",

  display:
    "inline-flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  border:
    "1px solid #efcbdc",

  borderRadius:
    "13px",

  background:
    "#fff4f8",

  color:
    "#d90a69",
};


const HEADER_CONTENT_STYLE: CSSProperties = {
  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "4px",
};


const PAGE_TITLE_STYLE: CSSProperties = {
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


const PAGE_DESCRIPTION_STYLE: CSSProperties = {
  margin:
    0,

  color:
    "#6d6979",

  fontSize:
    "13px",

  fontWeight:
    500,

  lineHeight:
    1.55,
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
    "400px",

  padding:
    "44px 24px",

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
    "590px",

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
    "1px solid #f1cdcb",

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
    "0.055em",

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


const ERROR_TEXT_STYLE: CSSProperties = {
  maxWidth:
    "510px",

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
    "485px",

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

export default function GestionnaireSettingsError({
  error,
  reset,
}: GestionnaireSettingsErrorProps) {
  /* =========================================================================
     LOG TECHNIQUE SÛR
     =========================================================================
     
     On ne journalise volontairement que :
     
     - le nom générique de l'erreur ;
     - le digest Next.js éventuel.
     
     On n'envoie pas dans le log client :
     
     - error.message ;
     - error.stack ;
     - données Manager ;
     - données Store ;
     - identifiants ;
     - données de session ;
     - informations Prisma ;
     - secrets.
     ========================================================================= */

  useEffect(
    () => {
      console.error(
        "[Cosmetics Empire][GestionnaireSettings] Erreur inattendue.",
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
      aria-live="assertive"
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

        <span
          aria-hidden="true"
          style={BREADCRUMB_SEPARATOR_STYLE}
        >
          /
        </span>

        <span
          aria-current="page"
          style={BREADCRUMB_CURRENT_STYLE}
        >
          Paramètres
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
          <Settings
            size={23}
            strokeWidth={1.8}
          />
        </div>

        <div style={HEADER_CONTENT_STYLE}>
          <h1 style={PAGE_TITLE_STYLE}>
            Paramètres
          </h1>

          <p style={PAGE_DESCRIPTION_STYLE}>
            Informations et réglages de votre espace Gestionnaire.
          </p>
        </div>
      </header>


      {/* ====================================================================
          ERROR CARD
          ==================================================================== */}

      <section
        style={ERROR_CARD_STYLE}
        aria-labelledby="gestionnaire-settings-error-title"
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
            id="gestionnaire-settings-error-title"
            style={ERROR_TITLE_STYLE}
          >
            Les paramètres n’ont pas pu être affichés
          </h2>

          <p style={ERROR_TEXT_STYLE}>
            Une erreur inattendue est survenue pendant le chargement des
            informations liées à votre compte et à votre boutique. Vous pouvez
            relancer le chargement sans quitter votre espace Gestionnaire.
          </p>


          {/* ================================================================
              SAFE INFORMATION
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
              Cette page consulte les informations déjà gérées par votre
              profil. Aucune information technique sensible n’est affichée dans
              cet écran d’erreur.
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