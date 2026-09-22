"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import styles from "@/app/gestionnaire/(espace-prive)/profil/profil.module.css";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL — ERROR
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/profil/error.tsx
 *
 * ROUTE CONCERNÉE :
 *
 * /gestionnaire/profil
 *
 *
 * RESPONSABILITÉS :
 *
 * - intercepter une erreur inattendue de la page Profil ;
 * - ne jamais afficher une erreur Prisma/PostgreSQL ;
 * - ne jamais exposer une stack ;
 * - ne jamais afficher un secret ;
 * - proposer une nouvelle tentative avec reset() ;
 * - permettre de revenir au tableau de bord ;
 * - rester dans le layout Gestionnaire existant ;
 * - ne pas créer de second <main> ;
 * - ne pas dupliquer la sidebar ;
 * - ne pas dupliquer le header global.
 *
 *
 * IMPORTANT :
 *
 * Les erreurs métier normales des formulaires sont déjà gérées dans :
 *
 * - ProfileClient.tsx ;
 * - actions.ts.
 *
 * Ce fichier concerne uniquement les erreurs inattendues empêchant
 * le rendu normal de /gestionnaire/profil.
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES EXISTANTES
   ========================================================================== */

const DASHBOARD_ROUTE =
  "/gestionnaire/dashboard";


/* ==========================================================================
   STYLES
   ========================================================================== */

const PAGE_STYLE = {
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
} as const;


const HEADER_STYLE = {
  width:
    "100%",

  minWidth:
    0,

  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "5px",
} as const;


const TITLE_STYLE = {
  margin:
    0,

  color:
    "#15131b",

  fontSize:
    "30px",

  fontWeight:
    800,

  lineHeight:
    1.15,

  letterSpacing:
    "-0.035em",
} as const;


const DESCRIPTION_STYLE = {
  margin:
    0,

  color:
    "#656174",

  fontSize:
    "13px",

  fontWeight:
    500,

  lineHeight:
    1.55,
} as const;


const ERROR_CARD_STYLE = {
  width:
    "100%",

  minWidth:
    0,

  minHeight:
    "360px",

  padding:
    "40px 24px",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",
} as const;


const ERROR_CONTENT_STYLE = {
  width:
    "100%",

  maxWidth:
    "560px",

  display:
    "flex",

  flexDirection:
    "column",

  alignItems:
    "center",

  textAlign:
    "center",

  gap:
    "16px",
} as const;


const ERROR_ICON_STYLE = {
  width:
    "68px",

  height:
    "68px",

  display:
    "flex",

  alignItems:
    "center",

  justifyContent:
    "center",

  borderRadius:
    "20px",

  border:
    "1px solid #f2cccc",

  background:
    "#fff3f2",

  color:
    "#c83c36",
} as const;


const ERROR_EYEBROW_STYLE = {
  color:
    "#c83c36",

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
} as const;


const ERROR_TITLE_STYLE = {
  margin:
    0,

  color:
    "#1e1b25",

  fontSize:
    "22px",

  fontWeight:
    780,

  lineHeight:
    1.3,

  letterSpacing:
    "-0.025em",
} as const;


const ERROR_TEXT_STYLE = {
  maxWidth:
    "480px",

  margin:
    0,

  color:
    "#6f6b79",

  fontSize:
    "13px",

  fontWeight:
    500,

  lineHeight:
    1.65,
} as const;


const SECURITY_STYLE = {
  width:
    "100%",

  maxWidth:
    "460px",

  padding:
    "12px 14px",

  display:
    "flex",

  alignItems:
    "flex-start",

  gap:
    "10px",

  border:
    "1px solid #e7e7ed",

  borderRadius:
    "11px",

  background:
    "#fafafd",

  color:
    "#696674",

  textAlign:
    "left",
} as const;


const SECURITY_TEXT_STYLE = {
  margin:
    0,

  fontSize:
    "11px",

  fontWeight:
    500,

  lineHeight:
    1.55,
} as const;


const ACTIONS_STYLE = {
  marginTop:
    "5px",

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
} as const;


const RETRY_BUTTON_STYLE = {
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
} as const;


const BACK_LINK_STYLE = {
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
    "#4e4b58",

  fontSize:
    "12px",

  fontWeight:
    680,

  lineHeight:
    1,

  textDecoration:
    "none",
} as const;


/* ==========================================================================
   PROPS
   ========================================================================== */

interface GestionnaireProfileErrorProps {
  readonly error:
    Error & {
      readonly digest?:
        string;
    };

  readonly reset:
    () => void;
}


/* ==========================================================================
   COMPONENT
   ========================================================================== */

export default function GestionnaireProfileError({
  error,
  reset,
}: GestionnaireProfileErrorProps) {
  /* =========================================================================
     LOG TECHNIQUE
     =========================================================================
     
     L'erreur complète reste uniquement dans la console technique.
     
     L'interface ne montre jamais :
     
     - error.message ;
     - stack ;
     - requête Prisma ;
     - URL PostgreSQL ;
     - identifiant interne ;
     - données de session.
     ========================================================================= */

  useEffect(
    () => {
      console.error(
        "[L&E Cosmetics Empire][GestionnaireProfilePage] Erreur inattendue.",
        {
          name:
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
          PAGE HEADER
          ==================================================================== */}

      <header style={HEADER_STYLE}>
        <h1 style={TITLE_STYLE}>
          Mon profil
        </h1>

        <p style={DESCRIPTION_STYLE}>
          Consultez et gérez les informations de votre compte Gestionnaire.
        </p>
      </header>


      {/* ====================================================================
          ERROR CARD
          ==================================================================== */}

      <section
        className={styles.profileCard}
        style={ERROR_CARD_STYLE}
        aria-labelledby="gestionnaire-profile-error-title"
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
              size={31}
              strokeWidth={1.8}
            />
          </div>


          {/* ================================================================
              TEXT
              ================================================================ */}

          <span style={ERROR_EYEBROW_STYLE}>
            Chargement impossible
          </span>

          <h2
            id="gestionnaire-profile-error-title"
            style={ERROR_TITLE_STYLE}
          >
            Le profil n’a pas pu être affiché
          </h2>

          <p style={ERROR_TEXT_STYLE}>
            Une erreur inattendue est survenue pendant le chargement de votre
            profil. Vous pouvez relancer le chargement sans quitter votre espace
            Gestionnaire.
          </p>


          {/* ================================================================
              SECURITY
              ================================================================ */}

          <div style={SECURITY_STYLE}>
            <ShieldAlert
              size={18}
              strokeWidth={1.9}
              aria-hidden="true"
              style={{
                flex:
                  "0 0 auto",

                marginTop:
                  "1px",

                color:
                  "#777382",
              }}
            />

            <p style={SECURITY_TEXT_STYLE}>
              Aucune information technique sensible n’est affichée sur cette
              page. Votre accès et les données de votre boutique restent
              contrôlés côté serveur.
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
              style={BACK_LINK_STYLE}
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