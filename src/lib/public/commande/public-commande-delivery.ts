import "server-only";

import {
  PUBLIC_DELIVERY_CURRENCY,
  getPublicDeliveryRateByCountryCode,
  normalizePublicDeliveryCountryCode,
  parsePublicDeliveryCountryCode,
} from "@/config/public-delivery";

import {
  publicCommandeAddressSchema,
} from "@/lib/public/commande/public-commande-schema";

import type {
  PublicCommandeAddress,
  PublicCommandeDeliveryCalculationInput,
  PublicCommandeDeliveryQuote,
  PublicCommandeDeliveryResult,
} from "@/lib/public/commande/public-commande-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * COMMANDE PUBLIQUE — LIVRAISON
 * ============================================================================
 *
 * Fichier :
 *
 * src/lib/public/commande/public-commande-delivery.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Calculer côté serveur les frais de livraison applicables à une adresse
 * cliente validée.
 *
 * ============================================================================
 *
 * SOURCE UNIQUE DES TARIFS :
 *
 * src/config/public-delivery.ts
 *
 * ============================================================================
 *
 * TARIFS ACTUELLEMENT CONFIGURÉS :
 *
 * Cameroun :
 *
 * 3 000 XAF
 *
 * Afrique hors Cameroun :
 *
 * 7 000 XAF
 *
 * International :
 *
 * 12 700 XAF
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Les montants ne sont jamais reçus depuis le navigateur.
 *
 * Le navigateur transmet uniquement les informations d'adresse.
 *
 * Le serveur :
 *
 * 1. valide l'adresse ;
 * 2. valide le code pays ;
 * 3. détermine la zone ;
 * 4. récupère le tarif officiel ;
 * 5. construit le devis de livraison.
 *
 * ============================================================================
 *
 * CE FICHIER NE :
 *
 * - crée aucune commande ;
 * - crée aucun paiement ;
 * - réserve aucun stock ;
 * - modifie aucun produit ;
 * - modifie aucune boutique ;
 * - écrit rien dans PostgreSQL ;
 * - appelle pas Prisma ;
 * - appelle pas Resend ;
 * - génère aucun PDF ;
 * - fait confiance à aucun montant provenant du client.
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * Le pays affiché peut provenir du formulaire cliente.
 *
 * MAIS :
 *
 * le prix de livraison dépend uniquement du countryCode validé.
 *
 * countryName ne doit jamais déterminer le tarif.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. MESSAGES
   ========================================================================== */

const PUBLIC_COMMANDE_DELIVERY_MESSAGES = {
  invalidInput:
    "Les informations de livraison ne sont pas valides.",

  invalidAddress:
    "L’adresse de livraison n’est pas valide.",

  unsupportedDestination:
    "Cette destination de livraison n’est pas disponible actuellement.",

  serverError:
    "Impossible de calculer les frais de livraison actuellement.",
} as const;


/* ==========================================================================
   2. TYPE UTILITAIRE INTERNE
   ========================================================================== */

type UnknownRecord =
  Record<
    string,
    unknown
  >;


/* ==========================================================================
   3. VÉRIFICATION OBJET
   ========================================================================== */

function isUnknownRecord(
  value:
    unknown,
): value is UnknownRecord {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}


/* ==========================================================================
   4. NORMALISATION TEXTE POUR EMPREINTE
   ========================================================================== */

/**
 * Cette normalisation ne modifie PAS les données enregistrées.
 *
 * Elle sert uniquement à fabriquer une empreinte stable permettant
 * d'identifier l'adresse pour laquelle un calcul a été effectué.
 */
function normalizeFingerprintValue(
  value:
    string,
): string {
  return value
    .trim()
    .replace(
      /\s+/gu,
      " ",
    );
}


/* ==========================================================================
   5. EMPREINTE D'ADRESSE
   ========================================================================== */

/**
 * Fabrique une empreinte déterministe de l'adresse.
 *
 * ============================================================================
 *
 * POURQUOI ?
 *
 * Une cliente peut calculer :
 *
 * Cameroun / Douala / Adresse A
 *
 * puis modifier :
 *
 * Cameroun / Yaoundé / Adresse B
 *
 * Le tarif reste éventuellement identique.
 *
 * Mais notre checkout doit quand même considérer l'ancien calcul comme
 * obsolète et refaire la validation côté serveur.
 *
 * ============================================================================
 *
 * Cette empreinte permettra à :
 *
 * public-checkout-state.ts
 *
 * de détecter toute modification de :
 *
 * - pays ;
 * - ville ;
 * - adresse ;
 * - complément ;
 * - code postal.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Ce n'est PAS :
 *
 * - un token de sécurité ;
 * - une signature cryptographique ;
 * - une preuve d'intégrité ;
 * - une donnée secrète.
 *
 * La validation finale reste toujours côté serveur.
 */
export function getPublicCommandeDeliveryAddressFingerprint(
  address:
    PublicCommandeAddress,
): string {
  const countryCode =
    normalizePublicDeliveryCountryCode(
      address.countryCode,
    );


  return JSON.stringify({
    countryCode,

    countryName:
      normalizeFingerprintValue(
        address.countryName,
      ),

    city:
      normalizeFingerprintValue(
        address.city,
      ),

    address:
      normalizeFingerprintValue(
        address.address,
      ),

    addressComplement:
      address.addressComplement
        ? normalizeFingerprintValue(
            address.addressComplement,
          )
        : null,

    postalCode:
      normalizeFingerprintValue(
        address.postalCode,
      ),
  });
}


/* ==========================================================================
   6. VALIDATION DE L'INPUT
   ========================================================================== */

/**
 * Extrait et valide l'adresse depuis un input inconnu.
 *
 * ============================================================================
 *
 * L'utilisation de unknown est volontaire.
 *
 * Même si TypeScript indique qu'un appelant possède :
 *
 * PublicCommandeDeliveryCalculationInput
 *
 * une Server Action reçoit toujours des données qui doivent être validées
 * à l'exécution.
 */
function parsePublicCommandeDeliveryInput(
  input:
    unknown,
):
  | Readonly<{
      success:
        true;

      address:
        PublicCommandeAddress;
    }>
  | Readonly<{
      success:
        false;
    }> {
  if (
    !isUnknownRecord(
      input,
    )
  ) {
    return {
      success:
        false,
    };
  }


  if (
    !Object.prototype.hasOwnProperty.call(
      input,
      "address",
    )
  ) {
    return {
      success:
        false,
    };
  }


  const addressResult =
    publicCommandeAddressSchema.safeParse(
      input.address,
    );


  if (
    !addressResult.success
  ) {
    return {
      success:
        false,
    };
  }


  return {
    success:
      true,

    address:
      addressResult.data,
  };
}


/* ==========================================================================
   7. CONSTRUCTION DU DEVIS
   ========================================================================== */

/**
 * Construit le devis à partir d'une adresse déjà validée.
 *
 * ============================================================================
 *
 * ATTENTION :
 *
 * Le tarif provient exclusivement de :
 *
 * getPublicDeliveryRateByCountryCode()
 *
 * donc de :
 *
 * src/config/public-delivery.ts
 */
function buildPublicCommandeDeliveryQuote(
  address:
    PublicCommandeAddress,
): PublicCommandeDeliveryResult {
  const countryCode =
    parsePublicDeliveryCountryCode(
      address.countryCode,
    );


  /**
   * Un code arbitraire comme "ZZ" ne doit jamais devenir
   * automatiquement une livraison internationale.
   */
  if (
    countryCode ===
    null
  ) {
    return {
      success:
        false,

      code:
        "UNSUPPORTED_DESTINATION",

      message:
        PUBLIC_COMMANDE_DELIVERY_MESSAGES.unsupportedDestination,
    };
  }


  const rate =
    getPublicDeliveryRateByCountryCode(
      countryCode,
    );


  /**
   * Protection supplémentaire.
   *
   * En fonctionnement normal, un countryCode déjà validé doit avoir
   * une configuration de tarif.
   */
  if (
    rate ===
    null
  ) {
    return {
      success:
        false,

      code:
        "UNSUPPORTED_DESTINATION",

      message:
        PUBLIC_COMMANDE_DELIVERY_MESSAGES.unsupportedDestination,
    };
  }


  /**
   * Protection de cohérence.
   *
   * Tous les tarifs actuellement configurés doivent utiliser la devise
   * officielle de livraison.
   */
  if (
    rate.amount.currency !==
    PUBLIC_DELIVERY_CURRENCY
  ) {
    return {
      success:
        false,

      code:
        "CURRENCY_MISMATCH",

      message:
        PUBLIC_COMMANDE_DELIVERY_MESSAGES.serverError,
    };
  }


  const quote:
    PublicCommandeDeliveryQuote =
      {
        zone:
          rate.zone,

        countryCode,

        /**
         * Valeur destinée à :
         *
         * - l'affichage ;
         * - l'adresse ;
         * - le reçu ;
         * - l'e-mail.
         *
         * Cette valeur ne détermine jamais le tarif.
         */
        countryName:
          address.countryName,

        amount: {
          amount:
            rate.amount.amount,

          currency:
            rate.amount.currency,
        },
      };


  return {
    success:
      true,

    data:
      quote,
  };
}


/* ==========================================================================
   8. CALCUL PRINCIPAL
   ========================================================================== */

/**
 * Fonction principale à utiliser depuis :
 *
 * - public-commande-actions.ts ;
 * - public-checkout-state.ts si nécessaire ;
 * - toute autre logique serveur de checkout.
 *
 * ============================================================================
 *
 * Exemple :
 *
 * const result =
 *   calculatePublicCommandeDelivery({
 *     address,
 *   });
 *
 * ============================================================================
 *
 * Elle accepte unknown afin de conserver une vraie barrière runtime.
 */
export function calculatePublicCommandeDelivery(
  input:
    unknown,
): PublicCommandeDeliveryResult {
  try {
    const parsedInput =
      parsePublicCommandeDeliveryInput(
        input,
      );


    if (
      !parsedInput.success
    ) {
      return {
        success:
          false,

        code:
          "INVALID_ADDRESS",

        message:
          PUBLIC_COMMANDE_DELIVERY_MESSAGES.invalidAddress,
      };
    }


    return buildPublicCommandeDeliveryQuote(
      parsedInput.address,
    );
  } catch {
    /**
     * Aucun détail interne n'est renvoyé au navigateur.
     */
    return {
      success:
        false,

      code:
        "SERVER_ERROR",

      message:
        PUBLIC_COMMANDE_DELIVERY_MESSAGES.serverError,
    };
  }
}


/* ==========================================================================
   9. CALCUL À PARTIR D'UNE ADRESSE DÉJÀ TYPÉE
   ========================================================================== */

/**
 * Helper destiné aux appels internes TypeScript.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Même avec une adresse formellement typée, on repasse volontairement
 * par calculatePublicCommandeDelivery().
 *
 * On conserve ainsi la validation runtime.
 */
export function calculatePublicCommandeDeliveryForAddress(
  address:
    PublicCommandeAddress,
): PublicCommandeDeliveryResult {
  const input:
    PublicCommandeDeliveryCalculationInput =
      {
        address,
      };


  return calculatePublicCommandeDelivery(
    input,
  );
}


/* ==========================================================================
   10. TYPE GUARD — SUCCÈS
   ========================================================================== */

export function isPublicCommandeDeliverySuccess(
  result:
    PublicCommandeDeliveryResult,
): result is Extract<
  PublicCommandeDeliveryResult,
  {
    readonly success:
      true;
  }
> {
  return result.success;
}


/* ==========================================================================
   11. TYPE GUARD — ÉCHEC
   ========================================================================== */

export function isPublicCommandeDeliveryFailure(
  result:
    PublicCommandeDeliveryResult,
): result is Extract<
  PublicCommandeDeliveryResult,
  {
    readonly success:
      false;
  }
> {
  return !result.success;
}


/* ==========================================================================
   12. RÉCUPÉRATION DIRECTE D'UN DEVIS
   ========================================================================== */

/**
 * Retourne directement :
 *
 * PublicCommandeDeliveryQuote
 *
 * ou :
 *
 * null
 *
 * ============================================================================
 *
 * Cette fonction est pratique pour les opérations serveur où le détail
 * d'erreur n'est pas nécessaire.
 *
 * Pour une Server Action destinée à l'interface, préférer :
 *
 * calculatePublicCommandeDelivery()
 */
export function getPublicCommandeDeliveryQuote(
  address:
    PublicCommandeAddress,
): PublicCommandeDeliveryQuote | null {
  const result =
    calculatePublicCommandeDeliveryForAddress(
      address,
    );


  if (
    !result.success
  ) {
    return null;
  }


  return result.data;
}


/* ==========================================================================
   13. VALIDATION D'UN DEVIS EXISTANT
   ========================================================================== */

/**
 * Vérifie qu'un devis correspond encore au tarif actuellement configuré
 * pour le pays.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette fonction NE suffit PAS à prouver que toute l'adresse n'a pas changé.
 *
 * Pour cela :
 *
 * public-checkout-state.ts
 *
 * devra également comparer :
 *
 * getPublicCommandeDeliveryAddressFingerprint(address)
 *
 * avec l'empreinte enregistrée lors du calcul.
 */
export function isPublicCommandeDeliveryQuoteCurrent(
  quote:
    PublicCommandeDeliveryQuote,

  address:
    PublicCommandeAddress,
): boolean {
  const currentResult =
    calculatePublicCommandeDeliveryForAddress(
      address,
    );


  if (
    !currentResult.success
  ) {
    return false;
  }


  const currentQuote =
    currentResult.data;


  return (
    quote.zone ===
      currentQuote.zone &&
    normalizePublicDeliveryCountryCode(
      quote.countryCode,
    ) ===
      currentQuote.countryCode &&
    quote.amount.currency ===
      currentQuote.amount.currency &&
    quote.amount.amount ===
      currentQuote.amount.amount
  );
}


/* ==========================================================================
   14. VALIDATION D'UNE EMPREINTE
   ========================================================================== */

/**
 * Permet de savoir si l'adresse actuelle correspond toujours exactement
 * à celle utilisée lors du précédent calcul.
 *
 * ============================================================================
 *
 * Exemple :
 *
 * adresse initiale :
 *
 * Douala
 * Rue A
 *
 *                ↓
 *
 * empreinte A
 *
 *                ↓
 *
 * cliente modifie :
 *
 * Yaoundé
 * Rue B
 *
 *                ↓
 *
 * empreinte B
 *
 *                ↓
 *
 * A !== B
 *
 *                ↓
 *
 * ancien calcul invalidé
 *
 *                ↓
 *
 * nouveau calcul serveur obligatoire
 */
export function isPublicCommandeDeliveryAddressFingerprintCurrent(
  fingerprint:
    string,

  address:
    PublicCommandeAddress,
): boolean {
  return fingerprint ===
    getPublicCommandeDeliveryAddressFingerprint(
      address,
    );
}


/* ==========================================================================
   15. CONTRÔLE GLOBAL D'UN CALCUL EXISTANT
   ========================================================================== */

/**
 * Vérifie à la fois :
 *
 * - l'adresse complète ;
 * - le pays ;
 * - la zone ;
 * - le montant ;
 * - la devise.
 *
 * ============================================================================
 *
 * Cette fonction sera particulièrement utile dans :
 *
 * public-checkout-state.ts
 *
 * avant d'autoriser le passage à :
 *
 * /commande/paiement
 */
export function isPublicCommandeDeliveryCalculationCurrent(
  params:
    Readonly<{
      address:
        PublicCommandeAddress;

      addressFingerprint:
        string;

      quote:
        PublicCommandeDeliveryQuote;
    }>,
): boolean {
  const {
    address,
    addressFingerprint,
    quote,
  } =
    params;


  if (
    !isPublicCommandeDeliveryAddressFingerprintCurrent(
      addressFingerprint,
      address,
    )
  ) {
    return false;
  }


  return isPublicCommandeDeliveryQuoteCurrent(
    quote,
    address,
  );
}


/* ==========================================================================
   16. DOCUMENTATION DU FLUX
   ========================================================================== */

/**
 * ============================================================================
 *
 * /COMMANDE
 *
 * Cliente saisit :
 *
 * prénom
 * nom
 * e-mail
 * téléphone
 * pays
 * ville
 * adresse
 * complément
 * code postal
 *
 *                ↓
 *
 * public-commande-schema.ts
 *
 *                ↓
 *
 * PublicCommandeAddress
 *
 *                ↓
 *
 * calculatePublicCommandeDelivery()
 *
 *                ↓
 *
 * countryCode
 *
 *                ↓
 *
 * src/config/public-delivery.ts
 *
 *                ↓
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ CM                                                      │
 * │                                                         │
 * │ CAMEROON                                                │
 * │                                                         │
 * │ 3 000 XAF                                               │
 * └─────────────────────────────────────────────────────────┘
 *
 * ou :
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ pays africain hors Cameroun                             │
 * │                                                         │
 * │ AFRICA                                                  │
 * │                                                         │
 * │ 7 000 XAF                                               │
 * └─────────────────────────────────────────────────────────┘
 *
 * ou :
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │ pays valide hors Afrique                                │
 * │                                                         │
 * │ INTERNATIONAL                                           │
 * │                                                         │
 * │ 12 700 XAF                                              │
 * └─────────────────────────────────────────────────────────┘
 *
 *                ↓
 *
 * PublicCommandeDeliveryQuote
 *
 * ============================================================================
 *
 * SI L'ADRESSE CHANGE :
 *
 * pays
 * ville
 * adresse
 * complément
 * code postal
 *
 *                ↓
 *
 * empreinte différente
 *
 *                ↓
 *
 * ancien calcul considéré comme obsolète
 *
 *                ↓
 *
 * nouveau calcul obligatoire
 *
 * ============================================================================
 *
 * AVANT /COMMANDE/PAIEMENT :
 *
 * Le serveur doit toujours revérifier :
 *
 * - le Panier ;
 * - les produits ;
 * - les prix ;
 * - les devises ;
 * - les stocks ;
 * - l'adresse ;
 * - le devis de livraison ;
 * - le total final.
 *
 * ============================================================================
 *
 * LE NAVIGATEUR NE PEUT JAMAIS IMPOSER :
 *
 * shippingCost = 0
 *
 * shippingCost = 3000
 *
 * shippingCost = 7000
 *
 * shippingCost = 12700
 *
 * ============================================================================
 *
 * Le montant officiel vient uniquement de :
 *
 * src/config/public-delivery.ts
 *
 * ============================================================================
 */