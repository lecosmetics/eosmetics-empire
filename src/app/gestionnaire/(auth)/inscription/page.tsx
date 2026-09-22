import type {
  Metadata,
} from "next";

import {
  Info,
} from "lucide-react";

import RegistrationForm from "@/components/gestionnaire/auth/RegistrationForm";

import {
  detectCountryFromRequest,
} from "@/server/gestionnaire/country-detection";


/* ============================================================
   COSMETICS EMPIRE
   INSCRIPTION GESTIONNAIRE
   ------------------------------------------------------------
   Fichier :
   src/app/gestionnaire/(auth)/inscription/page.tsx

   Route publique :
   /gestionnaire/inscription

   RESPONSABILITÉS DE CETTE PAGE :

   - afficher l'interface d'inscription Gestionnaire ;
   - respecter les maquettes PC + mobile validées ;
   - récupérer côté serveur le pays détecté par IP ;
   - transmettre ce pays uniquement comme proposition initiale ;
   - afficher le badge, le titre, le sous-titre et la notice OTP ;
   - déléguer le formulaire interactif à RegistrationForm.

   CETTE PAGE NE DOIT PAS :

   - vérifier le code représentant elle-même ;
   - exposer le code représentant ;
   - créer directement le compte ;
   - générer directement l'OTP ;
   - envoyer directement l'e-mail ;
   - contenir de mot de passe ;
   - accéder au secret représentant côté client ;
   - intégrer la Sidebar du Dashboard.

   La logique sensible reste côté serveur.
   ============================================================ */


/* ============================================================
   DYNAMIC RENDERING
   ------------------------------------------------------------
   Le pays proposé dépend potentiellement de l'adresse IP de
   chaque requête.

   Cette page ne doit donc pas être transformée en page
   statique commune à tous les visiteurs.
   ============================================================ */

export const dynamic =
  "force-dynamic";


/* ============================================================
   METADATA
   ============================================================ */

export const metadata: Metadata = {
  title:
    "Inscription Gestionnaire",

  description:
    "Créez votre espace professionnel Gestionnaire L&E Cosmetics Empire.",

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

export default async function GestionnaireRegistrationPage() {
  /* ----------------------------------------------------------
     COUNTRY DETECTION
     ----------------------------------------------------------
     La détection est effectuée exclusivement côté serveur.

     Résultat possible :

     "CM"
     "SN"
     "CI"
     "FR"
     ...

     ou :

     null

     IMPORTANT :

     Ce résultat est uniquement une proposition UX.

     Il ne représente jamais :

     - une preuve d'identité ;
     - une preuve de résidence ;
     - une autorisation d'inscription ;
     - un pays vérifié.

     L'utilisateur pourra toujours modifier le pays.
     ---------------------------------------------------------- */

  const detectedCountry =
    await detectCountryFromRequest();


  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <section
      className="gestionnaire-auth-card"
      aria-labelledby="gestionnaire-registration-title"
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
            TITLE
            ---------------------------------------------------- */}

        <h1
          id="gestionnaire-registration-title"
          className="gestionnaire-auth-card__title"
        >
          Inscription Gestionnaire
        </h1>


        {/* ----------------------------------------------------
            SUBTITLE
            ---------------------------------------------------- */}

        <p className="gestionnaire-auth-card__subtitle">
          Créez votre espace professionnel.
        </p>
      </header>


      {/* ======================================================
          OTP INFORMATION
          ------------------------------------------------------
          Cette notice reste volontairement discrète comme dans
          les maquettes.

          Elle ne constitue pas une erreur ou une alerte forte.
          ====================================================== */}

      <div
        className="gestionnaire-auth-notice"
        role="note"
      >
        <span
          className="gestionnaire-auth-notice__icon"
          aria-hidden="true"
        >
          <Info
            size={20}
            strokeWidth={1.9}
          />
        </span>

        <span className="gestionnaire-auth-notice__text">
          Un code de vérification à 6 chiffres sera envoyé par
          e-mail après inscription.
        </span>
      </div>


      {/* ======================================================
          REGISTRATION FORM
          ------------------------------------------------------
          RegistrationForm gère uniquement l'expérience
          interactive du formulaire :

          1. Nom de la boutique
          2. Pays
          3. Ville
          4. Adresse de la boutique
          5. Numéro de téléphone
          6. Adresse e-mail
          7. Code secret représentant Cosmetics Empire
          8. Mot de passe
          9. Confirmation du mot de passe

          Le pays détecté est transmis comme valeur initiale.
          L'utilisateur reste libre de le modifier.
          ====================================================== */}

      <RegistrationForm
        detectedCountry={
          detectedCountry
        }
      />
    </section>
  );
}