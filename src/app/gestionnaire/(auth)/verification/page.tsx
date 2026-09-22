import type {
  Metadata,
} from "next";

import {
  redirect,
} from "next/navigation";

import {
  MailCheck,
} from "lucide-react";

import VerificationForm from "@/components/gestionnaire/auth/VerificationForm";

import {
  routes,
} from "@/config/routes";

import {
  getPendingVerificationSession,
} from "@/server/gestionnaire/session";


/* ============================================================
   COSMETICS EMPIRE
   VÉRIFICATION E-MAIL — ESPACE GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/verification/page.tsx

   Route :
   /gestionnaire/verification

   RESPONSABILITÉS :

   - vérifier côté serveur qu'une inscription est réellement
     en attente de validation ;
   - empêcher l'accès normal à cette étape sans contexte
     d'inscription valide ;
   - afficher l'interface de vérification e-mail ;
   - afficher uniquement une version masquée de l'e-mail ;
   - déléguer la saisie OTP à VerificationForm ;
   - ne jamais exposer :
       * l'identifiant interne du compte ;
       * le hash OTP ;
       * le token de vérification ;
       * le code représentant ;
       * le mot de passe ;
       * les secrets serveur.

   PARCOURS :

   /gestionnaire/inscription
             ↓
   compte PENDING_VERIFICATION
             ↓
   cookie temporaire sécurisé
             ↓
   /gestionnaire/verification
             ↓
   OTP correct
             ↓
   compte ACTIVE
             ↓
   session Gestionnaire
             ↓
   /gestionnaire/dashboard

   IMPORTANT :

   Cette page ne vérifie PAS directement l'OTP.

   Cette responsabilité appartient à :

   src/app/gestionnaire/(auth)/verification/actions.ts

   et aux services serveur associés.
   ============================================================ */


/* ============================================================
   DYNAMIC RENDERING
   ------------------------------------------------------------
   La page dépend d'une session/cookie propre au visiteur.

   Elle ne doit donc jamais être générée comme une page
   statique commune à tous les utilisateurs.
   ============================================================ */

export const dynamic =
  "force-dynamic";


/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title:
    "Vérification de votre adresse e-mail",

  description:
    "Vérifiez votre adresse e-mail pour activer votre espace Gestionnaire L&E Cosmetics Empire.",

  robots: {
    index: false,
    follow: false,

    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};


/* ============================================================
   PAGE
   ============================================================ */

export default async function GestionnaireVerificationPage() {
  /* ----------------------------------------------------------
     1. READ PENDING VERIFICATION SESSION
     ----------------------------------------------------------
     La session temporaire doit être récupérée côté serveur
     depuis un cookie sécurisé HttpOnly.

     Le navigateur ne choisit donc pas librement quel compte
     il souhaite vérifier.
     ---------------------------------------------------------- */

  const pendingVerification =
    await getPendingVerificationSession();


  /* ----------------------------------------------------------
     2. NO VALID PENDING SESSION
     ----------------------------------------------------------
     Si aucune inscription en attente n'est disponible :

     - ne pas afficher un formulaire OTP inutilisable ;
     - ne pas accepter un e-mail depuis query string ;
     - retourner simplement vers l'inscription.

     Exemple interdit :

     /verification?email=quelquun@email.com

     L'e-mail dans l'URL ne doit jamais servir de preuve.
     ---------------------------------------------------------- */

  if (!pendingVerification) {
    redirect(
      routes.gestionnaire.register,
    );
  }


  /* ----------------------------------------------------------
     3. SAFE DISPLAY DATA
     ----------------------------------------------------------
     Le serveur fournit seulement une version destinée à
     l'affichage.

     Exemple :

     jean********@gmail.com

     L'e-mail complet n'a pas besoin d'être transmis au
     composant client pour permettre la vérification.
     ---------------------------------------------------------- */

  const maskedEmail =
    pendingVerification.maskedEmail;


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      className="gestionnaire-auth-card gestionnaire-verification"
      aria-labelledby="gestionnaire-verification-title"
    >
      {/* ======================================================
          CARD HEADER
          ====================================================== */}

      <header className="gestionnaire-auth-card__header">
        {/* ----------------------------------------------------
            BADGE
            ---------------------------------------------------- */}

        <div className="gestionnaire-auth-card__badge">
          Espace Gestionnaire
        </div>


        {/* ----------------------------------------------------
            VERIFICATION ICON
            ---------------------------------------------------- */}

        <div
          className="gestionnaire-verification__heading-icon"
          aria-hidden="true"
        >
          <MailCheck
            size={30}
            strokeWidth={1.7}
          />
        </div>


        {/* ----------------------------------------------------
            TITLE
            ---------------------------------------------------- */}

        <h1
          id="gestionnaire-verification-title"
          className="gestionnaire-auth-card__title"
        >
          Vérification de votre adresse e-mail
        </h1>


        {/* ----------------------------------------------------
            DESCRIPTION
            ---------------------------------------------------- */}

        <p className="gestionnaire-auth-card__subtitle">
          Nous avons envoyé un code de vérification à votre
          adresse e-mail.
        </p>


        {/* ----------------------------------------------------
            MASKED EMAIL
            ---------------------------------------------------- */}

        {maskedEmail ? (
          <p
            className="gestionnaire-verification__email"
            aria-label={`Adresse e-mail de vérification : ${maskedEmail}`}
          >
            {maskedEmail}
          </p>
        ) : null}
      </header>


      {/* ======================================================
          OTP NOTICE
          ====================================================== */}

      <div
        className="gestionnaire-auth-notice"
        role="note"
      >
        <span className="gestionnaire-auth-notice__text">
          Saisissez le code à 6 chiffres reçu par e-mail.
          Ce code est temporaire et ne peut être utilisé
          qu’une seule fois.
        </span>
      </div>


      {/* ======================================================
          VERIFICATION FORM
          ------------------------------------------------------
          Le formulaire client ne reçoit :

          - aucun accountId ;
          - aucun e-mail complet ;
          - aucun token sensible ;
          - aucun OTP attendu.

          verification/actions.ts retrouvera le compte
          directement grâce à la session temporaire sécurisée.
          ====================================================== */}

      <VerificationForm />
    </section>
  );
}