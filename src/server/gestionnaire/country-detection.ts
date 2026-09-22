import "server-only";

import {
  headers,
} from "next/headers";

import {
  isSupportedCountryCode,
  normalizeCountryCode,
} from "@/config/countries";


/* ============================================================
   COSMETICS EMPIRE
   COUNTRY DETECTION — GESTIONNAIRE REGISTRATION
   ------------------------------------------------------------
   Fichier :
   src/server/gestionnaire/country-detection.ts

   UTILISÉ PAR :

   src/app/gestionnaire/(auth)/inscription/page.tsx


   OBJECTIF :

   Essayer de déterminer le pays du visiteur côté serveur afin
   de pré-sélectionner le champ "Pays".

   Exemple :

   visite depuis le Cameroun
           ↓
   infrastructure détecte CM
           ↓
   detectCountryFromRequest()
           ↓
   "CM"
           ↓
   RegistrationForm
           ↓
   Pays proposé : Cameroun


   IMPORTANT :

   Cette donnée est uniquement :

   detectedCountry

   et JAMAIS :

   verifiedCountry


   La détection IP ne constitue pas :

   - une preuve de résidence ;
   - une preuve d'identité ;
   - une autorisation d'inscription ;
   - une information définitive sur la boutique.


   L'utilisateur garde toujours la possibilité de sélectionner
   manuellement un autre pays.
   ============================================================ */


/* ============================================================
   TRUSTED GEO PROVIDERS
   ------------------------------------------------------------
   Nous n'acceptons pas automatiquement n'importe quel header
   de géolocalisation.

   Providers supportés :

   - Vercel
   - Cloudflare
   - AWS CloudFront
   - none

   En production, un provider non-Vercel doit être explicitement
   déclaré côté serveur avec :

   GEO_TRUSTED_PROVIDER=cloudflare

   ou :

   GEO_TRUSTED_PROVIDER=cloudfront


   IMPORTANT :

   Cette variable ne doit PAS commencer par NEXT_PUBLIC_.
   ============================================================ */

type TrustedGeoProvider =
  | "vercel"
  | "cloudflare"
  | "cloudfront"
  | "none";


/* ============================================================
   COUNTRY HEADERS
   ------------------------------------------------------------
   Ces headers sont spécifiques aux infrastructures.

   Nous ne lisons volontairement PAS :

   x-forwarded-for
   x-real-ip
   forwarded

   simplement pour calculer le pays.

   Pourquoi ?

   Leur niveau de confiance dépend fortement du proxy et de
   l'architecture de déploiement.

   Pour cette fonctionnalité UX, il est plus sûr de renvoyer
   null que de faire confiance à une IP non fiable.
   ============================================================ */

const COUNTRY_HEADERS =
  Object.freeze({
    vercel:
      "x-vercel-ip-country",

    cloudflare:
      "cf-ipcountry",

    cloudfront:
      "cloudfront-viewer-country",
  });


/* ============================================================
   GET CONFIGURED GEO PROVIDER
   ============================================================ */

function getConfiguredGeoProvider():
  TrustedGeoProvider {
  const configuredProvider =
    process.env
      .GEO_TRUSTED_PROVIDER
      ?.trim()
      .toLowerCase();


  switch (
    configuredProvider
  ) {
    case "vercel":
      return "vercel";

    case "cloudflare":
      return "cloudflare";

    case "cloudfront":
      return "cloudfront";

    case "none":
      return "none";

    default:
      break;
  }


  /*
   * Vercel fournit automatiquement VERCEL=1 dans son
   * environnement de déploiement.
   *
   * Nous pouvons donc reconnaître Vercel sans demander une
   * configuration supplémentaire.
   */

  if (
    process.env.VERCEL ===
      "1" ||
    process.env.VERCEL ===
      "true"
  ) {
    return "vercel";
  }


  /*
   * Pour les autres infrastructures, nous préférons ne rien
   * supposer.
   *
   * Cela évite par exemple de croire aveuglément un
   * "cf-ipcountry" reçu alors que l'origine est directement
   * accessible depuis Internet.
   */

  return "none";
}


/* ============================================================
   NORMALIZE DETECTED COUNTRY
   ============================================================ */

function normalizeDetectedCountry(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (!value) {
    return null;
  }


  const countryCode =
    normalizeCountryCode(
      value,
    );


  /*
   * Un code pays ISO alpha-2 doit normalement contenir
   * exactement deux lettres.
   */

  if (
    !/^[A-Z]{2}$/.test(
      countryCode,
    )
  ) {
    return null;
  }


  /*
   * Certaines infrastructures peuvent retourner des valeurs
   * spéciales comme :
   *
   * XX
   * T1
   *
   * Elles ne font pas partie de notre liste de pays.
   */

  if (
    !isSupportedCountryCode(
      countryCode,
    )
  ) {
    return null;
  }


  return countryCode;
}


/* ============================================================
   READ COUNTRY FROM TRUSTED PROVIDER
   ============================================================ */

async function readCountryFromTrustedProvider(
  provider:
    TrustedGeoProvider,
): Promise<string | null> {
  if (
    provider === "none"
  ) {
    return null;
  }


  const requestHeaders =
    await headers();


  let rawCountry:
    string | null = null;


  switch (
    provider
  ) {
    /* --------------------------------------------------------
       VERCEL
       -------------------------------------------------------- */

    case "vercel":
      rawCountry =
        requestHeaders.get(
          COUNTRY_HEADERS.vercel,
        );

      break;


    /* --------------------------------------------------------
       CLOUDFLARE
       -------------------------------------------------------- */

    case "cloudflare":
      rawCountry =
        requestHeaders.get(
          COUNTRY_HEADERS.cloudflare,
        );

      break;


    /* --------------------------------------------------------
       AWS CLOUDFRONT
       -------------------------------------------------------- */

    case "cloudfront":
      rawCountry =
        requestHeaders.get(
          COUNTRY_HEADERS.cloudfront,
        );

      break;


    default:
      return null;
  }


  return normalizeDetectedCountry(
    rawCountry,
  );
}


/* ============================================================
   DETECT COUNTRY FROM REQUEST
   ------------------------------------------------------------
   Retour :

   "CM"
   "BJ"
   "SN"
   "CI"
   "FR"

   etc.

   OU :

   null


   IMPORTANT :

   Une détection impossible ne doit JAMAIS empêcher le rendu
   de /gestionnaire/inscription.
   ============================================================ */

export async function detectCountryFromRequest():
  Promise<string | null> {
  try {
    const provider =
      getConfiguredGeoProvider();


    return await readCountryFromTrustedProvider(
      provider,
    );
  } catch {
    /*
     * La détection géographique est une amélioration UX.
     *
     * Une erreur :
     *
     * - de headers ;
     * - d'infrastructure ;
     * - de configuration ;
     *
     * ne doit jamais empêcher un représentant d'accéder au
     * formulaire.
     */

    return null;
  }
}