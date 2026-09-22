import type {
  PublicCommandeDeliveryZone,
  PublicCommandeMoney,
} from "@/lib/public/commande/public-commande-types";


/**
 * ============================================================================
 * L&E COSMETICS EMPIRE
 * LIVRAISON PUBLIQUE — CONFIGURATION
 * ============================================================================
 *
 * Fichier :
 *
 * src/config/public-delivery.ts
 *
 * ============================================================================
 *
 * RÔLE :
 *
 * Centraliser les règles officielles de livraison de la boutique publique.
 *
 * ============================================================================
 *
 * TARIFS OFFICIELS :
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
 * Ce fichier constitue la source unique des tarifs de livraison.
 *
 * Il ne faut pas recopier manuellement :
 *
 * - 3000 ;
 * - 7000 ;
 * - 12700 ;
 *
 * dans :
 *
 * - les composants React ;
 * - les Server Actions ;
 * - les pages ;
 * - les e-mails ;
 * - les reçus PDF ;
 * - les fichiers de paiement.
 *
 * ============================================================================
 *
 * SÉCURITÉ :
 *
 * Le navigateur peut afficher ces tarifs.
 *
 * Cependant le navigateur ne constitue JAMAIS la source de vérité du montant
 * final de livraison.
 *
 * Avant :
 *
 * - création de commande ;
 * - création de paiement ;
 * - génération de reçu ;
 *
 * le serveur doit recalculer les frais avec :
 *
 * src/lib/public/commande/public-commande-delivery.ts
 *
 * ============================================================================
 *
 * CE FICHIER NE :
 *
 * - lit pas Prisma ;
 * - n'interroge pas PostgreSQL ;
 * - ne crée aucune commande ;
 * - ne crée aucun paiement ;
 * - n'envoie aucun e-mail ;
 * - ne génère aucun PDF ;
 * - ne lit aucune session ;
 * - ne fait aucune requête réseau.
 *
 * ============================================================================
 */


/* ==========================================================================
   1. DEVISE DE LIVRAISON
   ========================================================================== */

/**
 * Les tarifs actuellement validés sont exprimés en franc CFA BEAC.
 */
export const PUBLIC_DELIVERY_CURRENCY =
  "XAF" as const;


/* ==========================================================================
   2. CODE PAYS DU CAMEROUN
   ========================================================================== */

export const PUBLIC_DELIVERY_CAMEROON_COUNTRY_CODE =
  "CM" as const;


/* ==========================================================================
   3. CONTRAT D'UN TARIF
   ========================================================================== */

export interface PublicDeliveryRateConfig {
  readonly zone:
    PublicCommandeDeliveryZone;

  readonly label:
    string;

  readonly description:
    string;

  readonly amount:
    PublicCommandeMoney;
}


/* ==========================================================================
   4. TARIFS OFFICIELS
   ========================================================================== */

/**
 * SOURCE UNIQUE DES MONTANTS.
 *
 * IMPORTANT :
 *
 * Les montants restent des strings afin de rester cohérents avec les contrats
 * monétaires du checkout et d'éviter les conversions prématurées.
 */
export const PUBLIC_DELIVERY_RATES = {
  CAMEROON: {
    zone:
      "CAMEROON",

    label:
      "Livraison au Cameroun",

    description:
      "Livraison vers une adresse située au Cameroun.",

    amount: {
      amount:
        "3000",

      currency:
        PUBLIC_DELIVERY_CURRENCY,
    },
  },

  AFRICA: {
    zone:
      "AFRICA",

    label:
      "Livraison en Afrique",

    description:
      "Livraison vers un pays africain hors Cameroun.",

    amount: {
      amount:
        "7000",

      currency:
        PUBLIC_DELIVERY_CURRENCY,
    },
  },

  INTERNATIONAL: {
    zone:
      "INTERNATIONAL",

    label:
      "Livraison internationale",

    description:
      "Livraison vers une destination située hors d’Afrique.",

    amount: {
      amount:
        "12700",

      currency:
        PUBLIC_DELIVERY_CURRENCY,
    },
  },
} as const satisfies Readonly<
  Record<
    PublicCommandeDeliveryZone,
    PublicDeliveryRateConfig
  >
>;


/* ==========================================================================
   5. CODES PAYS ISO 3166-1 ALPHA-2 ACCEPTÉS
   ========================================================================== */

/**
 * Liste de référence des codes pays acceptés par le checkout.
 *
 * Elle permet d'éviter qu'un simple code arbitraire de deux lettres comme :
 *
 * ZZ
 *
 * soit automatiquement considéré comme une destination internationale.
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Le formulaire devra idéalement proposer une liste de pays contrôlée plutôt
 * qu'un champ libre pour countryCode.
 */
export const PUBLIC_DELIVERY_COUNTRY_CODES = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",

  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",

  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",

  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",

  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",

  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",

  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",

  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",

  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",

  "JE",
  "JM",
  "JO",
  "JP",

  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",

  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",

  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",

  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",

  "OM",

  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",

  "QA",

  "RE",
  "RO",
  "RS",
  "RU",
  "RW",

  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",

  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",

  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",

  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",

  "WF",
  "WS",

  "YE",
  "YT",

  "ZA",
  "ZM",
  "ZW",
] as const;


/**
 * Union automatique des codes pays supportés.
 */
export type PublicDeliveryCountryCode =
  (typeof PUBLIC_DELIVERY_COUNTRY_CODES)[number];


/* ==========================================================================
   6. DESTINATIONS AFRICAINES
   ========================================================================== */

/**
 * Codes classés dans la zone :
 *
 * AFRICA
 *
 * ============================================================================
 *
 * Le Cameroun est volontairement présent géographiquement dans cette liste,
 * mais la règle CAMEROON reste prioritaire lors du calcul.
 *
 * ============================================================================
 *
 * Sont également intégrées certaines destinations insulaires / territoriales
 * situées géographiquement dans la région africaine afin qu'elles n'entrent
 * pas automatiquement dans le tarif international :
 *
 * - EH : Sahara occidental ;
 * - RE : La Réunion ;
 * - YT : Mayotte ;
 * - SH : Sainte-Hélène, Ascension et Tristan da Cunha.
 */
export const PUBLIC_DELIVERY_AFRICA_COUNTRY_CODES = [
  "AO",
  "BF",
  "BI",
  "BJ",
  "BW",

  "CD",
  "CF",
  "CG",
  "CI",
  "CM",
  "CV",

  "DJ",
  "DZ",

  "EG",
  "EH",
  "ER",
  "ET",

  "GA",
  "GH",
  "GM",
  "GN",
  "GQ",
  "GW",

  "KE",
  "KM",

  "LR",
  "LS",
  "LY",

  "MA",
  "MG",
  "ML",
  "MR",
  "MU",
  "MW",
  "MZ",

  "NA",
  "NE",
  "NG",

  "RE",
  "RW",

  "SC",
  "SD",
  "SH",
  "SL",
  "SN",
  "SO",
  "SS",
  "ST",
  "SZ",

  "TD",
  "TG",
  "TN",
  "TZ",

  "UG",

  "YT",

  "ZA",
  "ZM",
  "ZW",
] as const satisfies readonly PublicDeliveryCountryCode[];


/* ==========================================================================
   7. SETS INTERNES
   ========================================================================== */

/**
 * Les Sets sont internes.
 *
 * On évite ainsi d'exposer une collection mutable comme partie de la
 * configuration publique.
 */
const PUBLIC_DELIVERY_COUNTRY_CODE_SET =
  new Set<string>(
    PUBLIC_DELIVERY_COUNTRY_CODES,
  );


const PUBLIC_DELIVERY_AFRICA_COUNTRY_CODE_SET =
  new Set<string>(
    PUBLIC_DELIVERY_AFRICA_COUNTRY_CODES,
  );


/* ==========================================================================
   8. NORMALISATION DU CODE PAYS
   ========================================================================== */

/**
 * Exemple :
 *
 * " cm "
 *
 * devient :
 *
 * "CM"
 */
export function normalizePublicDeliveryCountryCode(
  countryCode:
    string,
): string {
  return countryCode
    .trim()
    .toUpperCase();
}


/* ==========================================================================
   9. VALIDATION D'UN CODE PAYS
   ========================================================================== */

/**
 * Vérifie qu'un code appartient bien à la liste officielle supportée.
 */
export function isPublicDeliveryCountryCode(
  countryCode:
    string,
): countryCode is PublicDeliveryCountryCode {
  return PUBLIC_DELIVERY_COUNTRY_CODE_SET.has(
    countryCode,
  );
}


/* ==========================================================================
   10. PARSE D'UN CODE PAYS
   ========================================================================== */

/**
 * Retourne :
 *
 * PublicDeliveryCountryCode
 *
 * ou :
 *
 * null
 *
 * Aucun fallback silencieux vers INTERNATIONAL n'est effectué lorsqu'un
 * code pays est invalide.
 */
export function parsePublicDeliveryCountryCode(
  countryCode:
    string,
): PublicDeliveryCountryCode | null {
  const normalizedCountryCode =
    normalizePublicDeliveryCountryCode(
      countryCode,
    );


  if (
    !isPublicDeliveryCountryCode(
      normalizedCountryCode,
    )
  ) {
    return null;
  }


  return normalizedCountryCode;
}


/* ==========================================================================
   11. DÉTECTION DU CAMEROUN
   ========================================================================== */

export function isPublicDeliveryCameroon(
  countryCode:
    string,
): boolean {
  const normalizedCountryCode =
    normalizePublicDeliveryCountryCode(
      countryCode,
    );


  return normalizedCountryCode ===
    PUBLIC_DELIVERY_CAMEROON_COUNTRY_CODE;
}


/* ==========================================================================
   12. DÉTECTION AFRIQUE
   ========================================================================== */

export function isPublicDeliveryAfricanCountry(
  countryCode:
    string,
): boolean {
  const normalizedCountryCode =
    normalizePublicDeliveryCountryCode(
      countryCode,
    );


  if (
    !isPublicDeliveryCountryCode(
      normalizedCountryCode,
    )
  ) {
    return false;
  }


  return PUBLIC_DELIVERY_AFRICA_COUNTRY_CODE_SET.has(
    normalizedCountryCode,
  );
}


/* ==========================================================================
   13. DÉTERMINATION DE LA ZONE
   ========================================================================== */

/**
 * RÈGLE OFFICIELLE :
 *
 * 1. Cameroun
 *    → CAMEROON
 *
 * 2. Autre destination africaine
 *    → AFRICA
 *
 * 3. Destination valide hors Afrique
 *    → INTERNATIONAL
 *
 * 4. Code invalide
 *    → null
 *
 * ============================================================================
 *
 * IMPORTANT :
 *
 * CAMEROON doit être testé AVANT AFRICA puisque CM appartient naturellement
 * au continent africain.
 */
export function getPublicDeliveryZoneByCountryCode(
  countryCode:
    string,
): PublicCommandeDeliveryZone | null {
  const parsedCountryCode =
    parsePublicDeliveryCountryCode(
      countryCode,
    );


  if (
    parsedCountryCode ===
    null
  ) {
    return null;
  }


  if (
    parsedCountryCode ===
    PUBLIC_DELIVERY_CAMEROON_COUNTRY_CODE
  ) {
    return "CAMEROON";
  }


  if (
    PUBLIC_DELIVERY_AFRICA_COUNTRY_CODE_SET.has(
      parsedCountryCode,
    )
  ) {
    return "AFRICA";
  }


  return "INTERNATIONAL";
}


/* ==========================================================================
   14. RÉCUPÉRATION D'UN TARIF PAR ZONE
   ========================================================================== */

/**
 * Retourne toujours la configuration officielle de la zone demandée.
 */
export function getPublicDeliveryRateByZone(
  zone:
    PublicCommandeDeliveryZone,
): PublicDeliveryRateConfig {
  return PUBLIC_DELIVERY_RATES[
    zone
  ];
}


/* ==========================================================================
   15. RÉCUPÉRATION D'UN TARIF PAR PAYS
   ========================================================================== */

/**
 * Retourne :
 *
 * PublicDeliveryRateConfig
 *
 * ou :
 *
 * null
 *
 * si le code pays n'est pas reconnu.
 */
export function getPublicDeliveryRateByCountryCode(
  countryCode:
    string,
): PublicDeliveryRateConfig | null {
  const zone =
    getPublicDeliveryZoneByCountryCode(
      countryCode,
    );


  if (
    zone ===
    null
  ) {
    return null;
  }


  return getPublicDeliveryRateByZone(
    zone,
  );
}


/* ==========================================================================
   16. MONTANT UNIQUEMENT
   ========================================================================== */

/**
 * Helper pratique pour les traitements serveur qui n'ont besoin que du
 * montant officiel.
 *
 * Retourne null pour un code pays invalide.
 */
export function getPublicDeliveryAmountByCountryCode(
  countryCode:
    string,
): PublicCommandeMoney | null {
  const rate =
    getPublicDeliveryRateByCountryCode(
      countryCode,
    );


  if (
    rate ===
    null
  ) {
    return null;
  }


  return rate.amount;
}


/* ==========================================================================
   17. CONFIGURATION AGRÉGÉE
   ========================================================================== */

/**
 * Objet de configuration principal.
 *
 * Utile pour :
 *
 * - tests ;
 * - affichage informatif ;
 * - administration future ;
 * - documentation interne.
 */
export const PUBLIC_DELIVERY_CONFIG = {
  currency:
    PUBLIC_DELIVERY_CURRENCY,

  cameroonCountryCode:
    PUBLIC_DELIVERY_CAMEROON_COUNTRY_CODE,

  rates:
    PUBLIC_DELIVERY_RATES,

  supportedCountryCodes:
    PUBLIC_DELIVERY_COUNTRY_CODES,

  africaCountryCodes:
    PUBLIC_DELIVERY_AFRICA_COUNTRY_CODES,
} as const;


/* ==========================================================================
   18. EXEMPLES DE RÉSULTATS ATTENDUS
   ========================================================================== */

/**
 * ============================================================================
 *
 * CM
 *
 * getPublicDeliveryZoneByCountryCode("CM")
 *
 * →
 *
 * CAMEROON
 *
 * →
 *
 * 3 000 XAF
 *
 * ============================================================================
 *
 * BJ
 *
 * getPublicDeliveryZoneByCountryCode("BJ")
 *
 * →
 *
 * AFRICA
 *
 * →
 *
 * 7 000 XAF
 *
 * ============================================================================
 *
 * NG
 *
 * →
 *
 * AFRICA
 *
 * →
 *
 * 7 000 XAF
 *
 * ============================================================================
 *
 * FR
 *
 * →
 *
 * INTERNATIONAL
 *
 * →
 *
 * 12 700 XAF
 *
 * ============================================================================
 *
 * US
 *
 * →
 *
 * INTERNATIONAL
 *
 * →
 *
 * 12 700 XAF
 *
 * ============================================================================
 *
 * ZZ
 *
 * →
 *
 * null
 *
 * Aucun prix ne doit être inventé.
 *
 * ============================================================================
 */


/* ==========================================================================
   19. RÈGLES D'UTILISATION
   ========================================================================== */

/**
 * ============================================================================
 *
 * SUR /COMMANDE
 *
 * La cliente sélectionne :
 *
 * pays
 *
 * Le formulaire envoie notamment :
 *
 * countryCode
 * countryName
 *
 * ============================================================================
 *
 * CÔTÉ SERVEUR
 *
 * public-commande-delivery.ts
 *
 * doit utiliser :
 *
 * countryCode
 *
 * et appeler :
 *
 * getPublicDeliveryRateByCountryCode(countryCode)
 *
 * ============================================================================
 *
 * NE JAMAIS FAIRE :
 *
 * if (countryName === "Cameroun") {
 *   shipping = 3000;
 * }
 *
 * ============================================================================
 *
 * La valeur countryName est destinée :
 *
 * - à l'affichage ;
 * - à l'adresse ;
 * - au reçu PDF ;
 * - à l'e-mail ;
 *
 * mais PAS au choix du tarif.
 *
 * ============================================================================
 *
 * SOURCE UNIQUE :
 *
 * PUBLIC_DELIVERY_RATES
 *
 * ============================================================================
 */