import type {
  Metadata,
} from "next";

import Image from "next/image";
import Link from "next/link";

import {
  ManagerStatus,
  StoreStatus,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import LoginForm from "@/components/gestionnaire/auth/LoginForm";

import {
  routes,
} from "@/config/routes";

import {
  db,
} from "@/prisma/db";

import {
  getGestionnaireSession,
} from "@/server/gestionnaire/session";

import "./connexion.css";


/* ============================================================
   L&E COSMETICS EMPIRE
   CONNEXION — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/connexion/page.tsx

   Route :
   /gestionnaire/connexion

   OBJECTIF :

   Page officielle de connexion Gestionnaire.

   Cette page reste volontairement SIMPLE :

   - Header Auth ;
   - logo ;
   - bouton Créer un compte ;
   - carte Connexion ;
   - LoginForm ;
   - footer très léger.

   AUCUNE :

   - Sidebar ;
   - navigation privée ;
   - statistique ;
   - publicité ;
   - landing page ;
   - illustration marketing ;
   - connexion sociale.

   IMPORTANT :

   Si une session Gestionnaire existe déjà, elle est vérifiée
   côté serveur avant toute redirection vers le Dashboard.
   ============================================================ */


/* ============================================================
   PAGE DYNAMIQUE
   ------------------------------------------------------------
   Cette route dépend d'un cookie HttpOnly Gestionnaire.

   Elle ne doit donc jamais être rendue comme une page statique
   partagée entre différents utilisateurs.
   ============================================================ */

export const dynamic =
  "force-dynamic";


export const revalidate =
  0;


/* ============================================================
   METADATA
   ============================================================ */

export const metadata:
  Metadata = {
  title:
    "Connexion Gestionnaire | L&E Cosmetics Empire",

  description:
    "Connectez-vous à votre espace gestionnaire L&E Cosmetics Empire.",

  robots: {
    index:
      false,

    follow:
      false,
  },
};


/* ============================================================
   ACTIVE SESSION CHECK
   ------------------------------------------------------------
   RÈGLE :

   Une simple présence du cookie ne suffit pas.

   Avant de rediriger un utilisateur déjà connecté vers :

   /gestionnaire/dashboard

   on vérifie :

   - signature / expiration de la session via session.ts ;
   - existence du Manager ;
   - Manager ACTIVE ;
   - boutique ACTIVE.

   Aucun managerId ne provient de l'URL.
   ============================================================ */

async function hasValidActiveGestionnaireSession():
  Promise<boolean> {
  try {
    const session =
      await getGestionnaireSession();


    if (
      !session
    ) {
      return false;
    }


    const manager =
      await db.manager.findUnique({
        where: {
          id:
            session.gestionnaireId,
        },

        select: {
          status:
            true,

          emailVerifiedAt:
            true,

          store: {
            select: {
              status:
                true,
            },
          },
        },
      });


    if (
      !manager
    ) {
      return false;
    }


    if (
      !manager.emailVerifiedAt
    ) {
      return false;
    }


    if (
      manager.status !==
      ManagerStatus.ACTIVE
    ) {
      return false;
    }


    if (
      manager.store.status !==
      StoreStatus.ACTIVE
    ) {
      return false;
    }


    return true;
  } catch {
    /*
     * En cas de problème de lecture de session ou de base :
     *
     * - aucune donnée sensible n'est exposée ;
     * - aucune redirection privée n'est effectuée ;
     * - la page de connexion reste la destination sûre.
     */

    return false;
  }
}


/* ============================================================
   PAGE
   ============================================================ */

export default async function GestionnaireLoginPage() {
  /* ==========================================================
     1. ALREADY AUTHENTICATED
     ----------------------------------------------------------
     Un utilisateur déjà correctement connecté ne doit pas
     ressaisir inutilement son e-mail et son mot de passe.
     ========================================================== */

  const alreadyAuthenticated =
    await hasValidActiveGestionnaireSession();


  if (
    alreadyAuthenticated
  ) {
    redirect(
      routes
        .gestionnaire
        .dashboard,
    );
  }


  /* ==========================================================
     2. LOGIN PAGE
     ========================================================== */

  return (
    <div className="gestionnaire-login-page">
      {/* ======================================================
          BACKGROUND DECORATIONS
          ------------------------------------------------------
          Très légères uniquement.

          Elles correspondent à l'esprit de la maquette sans
          transformer la connexion en landing page.
          ====================================================== */}

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--left"
        aria-hidden="true"
      />

      <div
        className="gestionnaire-login-page__decoration gestionnaire-login-page__decoration--right"
        aria-hidden="true"
      />


      {/* ======================================================
          HEADER
          ====================================================== */}

      <header className="gestionnaire-login-header">
        <div className="gestionnaire-login-header__inner">
          {/* --------------------------------------------------
              LOGO
              -------------------------------------------------- */}

          <Link
            href={
              routes
                .gestionnaire
                .root
            }
            className="gestionnaire-login-header__brand"
            aria-label="L&E Cosmetics Empire"
          >
            <span className="gestionnaire-login-header__logo">
              <Image
                src="/logos/logo.png"
                alt="L&E Cosmetics Empire"
                width={58}
                height={58}
                priority
                className="gestionnaire-login-header__logo-image"
              />
            </span>


            <span className="gestionnaire-login-header__brand-copy">
              <strong>
                L&E Cosmetics
              </strong>

              <span>
                Empire
              </span>
            </span>
          </Link>


          {/* --------------------------------------------------
              REGISTER
              -------------------------------------------------- */}

          <div className="gestionnaire-login-header__register">
            <span className="gestionnaire-login-header__register-text">
              Pas encore de compte ?
            </span>

            <Link
              href={
                routes
                  .gestionnaire
                  .register
              }
              className="gestionnaire-login-header__register-button"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>


      {/* ======================================================
          MAIN
          ====================================================== */}

      <main className="gestionnaire-login-main">
        <section
          className="gestionnaire-login-card"
          aria-labelledby="gestionnaire-login-title"
        >
          {/* ==================================================
              CARD HEADER
              ================================================== */}

          <div className="gestionnaire-login-card__header">
            <span className="gestionnaire-login-card__eyebrow">
              ESPACE GESTIONNAIRE
            </span>


            <h1
              id="gestionnaire-login-title"
              className="gestionnaire-login-card__title"
            >
              Connexion
            </h1>


            <p className="gestionnaire-login-card__subtitle">
              Accédez à votre espace gestionnaire.
            </p>
          </div>


          {/* ==================================================
              FORM
              ================================================== */}

          <LoginForm />
        </section>
      </main>


      {/* ======================================================
          LIGHT FOOTER
          ------------------------------------------------------
          Aucun grand footer marketing.

          Aucun lien vers des routes non encore définies.
          ====================================================== */}

      <footer className="gestionnaire-login-footer">
        <p className="gestionnaire-login-footer__copyright">
          © {new Date().getFullYear()} L&E Cosmetics Empire
        </p>
      </footer>
    </div>
  );
}