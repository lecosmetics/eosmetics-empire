import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ChevronRight,
  Home,
} from "lucide-react";

import ProfileClient from "@/components/gestionnaire/profil/ProfileClient";

import {
  getGestionnaireProfilePageData,
} from "@/lib/gestionnaire/profil/profile-query";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * ESPACE GESTIONNAIRE — PROFIL
 * ============================================================================
 *
 * Fichier :
 *
 * src/app/gestionnaire/(espace-prive)/profil/page.tsx
 *
 * ROUTE :
 *
 * /gestionnaire/profil
 *
 *
 * RESPONSABILITÉS :
 *
 * - rester un Server Component ;
 * - charger les données réelles du Gestionnaire connecté ;
 * - laisser profile-query.ts gérer l'accès sécurisé ;
 * - transmettre uniquement le DTO sérialisé à ProfileClient ;
 * - afficher le titre et le fil d'Ariane de la page ;
 * - ne pas dupliquer le header global ;
 * - ne pas dupliquer la sidebar ;
 * - ne pas créer de second <main> ;
 * - ne pas effectuer directement de requête Prisma ;
 * - ne pas contenir de mutation ;
 * - ne pas inventer de données.
 *
 *
 * ARCHITECTURE :
 *
 * layout espace privé
 *      ↓
 * page.tsx
 *      ↓
 * getGestionnaireProfilePageData()
 *      ↓
 * requireGestionnairePrivateAccess()
 *      ↓
 * Manager + Store authentifiés
 *      ↓
 * ProfileClient
 *
 * ============================================================================
 */


/* ==========================================================================
   ROUTES EXISTANTES
   ========================================================================== */

const DASHBOARD_ROUTE =
  "/gestionnaire/dashboard";


/* ==========================================================================
   METADATA
   ========================================================================== */

export const metadata: Metadata = {
  title:
    "Mon profil | L&E Cosmetics Empire",

  description:
    "Consultez et gérez les informations de votre compte Gestionnaire et les coordonnées de votre boutique.",
};


/* ==========================================================================
   RENDU DYNAMIQUE
   ========================================================================== */

/**
 * La page dépend :
 *
 * - de la session courante ;
 * - des informations actuelles du Manager ;
 * - des informations actuelles du Store.
 *
 * Elle ne doit donc pas être pré-rendue avec des données utilisateur.
 */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ==========================================================================
   STYLES DU HEADER DE PAGE
   ========================================================================== */

/**
 * Le corps fonctionnel de la page utilise profil.module.css via
 * ProfileClient.
 *
 * Ces quelques styles concernent uniquement le petit header serveur de
 * la route. Cela évite d'introduire des classes CSS supplémentaires ou
 * un deuxième composant uniquement pour :
 *
 * - le breadcrumb ;
 * - le titre ;
 * - la description.
 */

const PAGE_HEADER_STYLE = {
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
} as const;


const BREADCRUMB_STYLE = {
  display:
    "flex",

  alignItems:
    "center",

  flexWrap:
    "wrap",

  gap:
    "7px",

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
} as const;


const BREADCRUMB_LINK_STYLE = {
  display:
    "inline-flex",

  alignItems:
    "center",

  gap:
    "6px",

  color:
    "inherit",

  textDecoration:
    "none",
} as const;


const BREADCRUMB_CURRENT_STYLE = {
  color:
    "#2d2935",

  fontWeight:
    680,
} as const;


const PAGE_TITLE_GROUP_STYLE = {
  display:
    "flex",

  flexDirection:
    "column",

  gap:
    "5px",

  minWidth:
    0,
} as const;


const PAGE_TITLE_STYLE = {
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


const PAGE_DESCRIPTION_STYLE = {
  margin:
    0,

  maxWidth:
    "760px",

  color:
    "#656174",

  fontSize:
    "13px",

  fontWeight:
    500,

  lineHeight:
    1.55,
} as const;


const PAGE_CONTENT_STYLE = {
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
} as const;


/* ==========================================================================
   PAGE
   ========================================================================== */

export default async function GestionnaireProfilePage() {
  /* =========================================================================
     1. DONNÉES RÉELLES
     =========================================================================
     
     Cette fonction :
     
     - vérifie l'accès privé ;
     - dérive managerId côté serveur ;
     - dérive storeId côté serveur ;
     - recharge Manager depuis PostgreSQL ;
     - recharge Store depuis PostgreSQL ;
     - sérialise les dates ;
     - résout le pays depuis countries.ts.
     
     Aucun identifiant utilisateur n'est fourni par le navigateur.
     ========================================================================= */

  const data =
    await getGestionnaireProfilePageData();


  /* =========================================================================
     2. RENDER
     ========================================================================= */

  return (
    <>
      {/* ====================================================================
          HEADER DE PAGE
          ==================================================================== */}

      <header style={PAGE_HEADER_STYLE}>
        {/* ==================================================================
            BREADCRUMB
            ================================================================== */}

        <nav
          aria-label="Fil d’Ariane"
          style={BREADCRUMB_STYLE}
        >
          <Link
            href={DASHBOARD_ROUTE}
            style={BREADCRUMB_LINK_STYLE}
          >
            <Home
              size={15}
              strokeWidth={1.9}
              aria-hidden="true"
            />

            <span>
              Tableau de bord
            </span>
          </Link>


          <ChevronRight
            size={14}
            strokeWidth={1.8}
            aria-hidden="true"
          />


          <span
            aria-current="page"
            style={BREADCRUMB_CURRENT_STYLE}
          >
            Profil
          </span>
        </nav>


        {/* ==================================================================
            TITRE
            ================================================================== */}

        <div style={PAGE_TITLE_GROUP_STYLE}>
          <h1 style={PAGE_TITLE_STYLE}>
            Mon profil
          </h1>


          <p style={PAGE_DESCRIPTION_STYLE}>
            Consultez et gérez les informations de votre compte Gestionnaire
            ainsi que les coordonnées de votre boutique.
          </p>
        </div>
      </header>


      {/* ====================================================================
          CONTENU
          ==================================================================== */}

      <div style={PAGE_CONTENT_STYLE}>
        <ProfileClient
          data={data}
        />
      </div>
    </>
  );
}